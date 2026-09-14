import { randomUUID } from 'node:crypto';
import {
  MAINTENANCE_OVERAGE_DECISIONS,
  type MaintenanceOverageCandidate,
  type MaintenanceOverageDecision,
  type MaintenanceOverageDecisionInput,
  type MaintenanceOverageReview,
} from '../../shared/maintenanceOverage';
import type { BillingHandoffService } from '../billing/BillingHandoffService';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface CandidateRow extends Record<string, unknown> {
  id: string;
  intervention_number: string;
  subject: string;
  status: string;
  theoretical_value_cents: number;
  billable_amount_cents: number;
  total_time_seconds: number;
}

interface DecisionRow extends Record<string, unknown> {
  id: string;
  period_id: string;
  intervention_id: string;
  intervention_number: string;
  intervention_subject: string;
  decision: MaintenanceOverageDecision['decision'];
  reason: string;
  expected_amount_cents: number;
  created_at: string;
  updated_at: string;
}

export class MaintenanceOverageService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly billing: BillingHandoffService,
  ) {}

  review(periodId: string): MaintenanceOverageReview {
    const period = this.database.get<{
      id: string;
      included_interventions: number;
      subscription_id: string;
      carryover_mode_snapshot: string;
    }>(
      `SELECT mp.id,mp.included_interventions,mp.subscription_id,ms.carryover_mode_snapshot
       FROM maintenance_periods mp
       JOIN maintenance_subscriptions ms ON ms.id=mp.subscription_id
       WHERE mp.id=?`,
      [periodId],
    );
    if (!period) throw new Error('Période de maintenance introuvable.');

    const interventions = this.database.all<CandidateRow>(
      `SELECT i.id,i.intervention_number,i.subject,i.status,i.theoretical_value_cents,i.billable_amount_cents,
        COALESCE((
          SELECT SUM(MAX(0,CAST((julianday(ts.ended_at)-julianday(ts.started_at))*86400 AS INTEGER)) - COALESCE((
            SELECT SUM(MAX(0,CAST((julianday(tsp.ended_at)-julianday(tsp.started_at))*86400 AS INTEGER)))
            FROM time_session_pauses tsp
            WHERE tsp.time_session_id=ts.id AND tsp.ended_at IS NOT NULL
          ),0))
          FROM time_sessions ts
          WHERE ts.intervention_id=i.id AND ts.ended_at IS NOT NULL
        ),0) AS total_time_seconds
       FROM interventions i
       WHERE i.maintenance_period_id=? AND i.status NOT IN ('cancelled','archived')
       ORDER BY i.created_at,i.id`,
      [periodId],
    );

    const quota = Number(period.included_interventions);
    const overageRows = quota > 0 ? interventions.slice(quota) : [];
    const decisions = new Map(
      this.database.all<DecisionRow>(this.decisionSelect('WHERE mod.period_id=?'), [periodId])
        .map((row) => [row.intervention_id, this.mapDecision(row)]),
    );

    const candidates: MaintenanceOverageCandidate[] = overageRows.map((row) => ({
      interventionId: row.id,
      interventionNumber: row.intervention_number,
      interventionSubject: row.subject,
      interventionStatus: row.status,
      totalTimeSeconds: Math.max(0, Number(row.total_time_seconds ?? 0)),
      theoreticalValueCents: Number(row.theoretical_value_cents),
      billableAmountCents: Number(row.billable_amount_cents),
      decision: decisions.get(row.id) ?? null,
    }));

    return {
      periodId,
      includedInterventions: quota,
      interventionCount: interventions.length,
      overageCount: candidates.length,
      unresolvedCount: candidates.filter((candidate) => !candidate.decision).length,
      carryoverAllowed: period.carryover_mode_snapshot !== 'none',
      candidates,
    };
  }

  decide(periodId: string, input: MaintenanceOverageDecisionInput): MaintenanceOverageReview {
    if (!MAINTENANCE_OVERAGE_DECISIONS.includes(input.decision)) throw new Error('Décision de dépassement invalide.');
    const reason = clean(input.reason);
    if (!reason) throw new Error('Le motif de la décision est obligatoire.');

    const period = this.database.get<{ status: string; carryover_mode_snapshot: string }>(
      `SELECT mp.status,ms.carryover_mode_snapshot
       FROM maintenance_periods mp
       JOIN maintenance_subscriptions ms ON ms.id=mp.subscription_id
       WHERE mp.id=?`,
      [periodId],
    );
    if (!period) throw new Error('Période de maintenance introuvable.');
    if (period.status === 'closed') throw new Error('Cette période de maintenance est clôturée.');

    const review = this.review(periodId);
    const candidate = review.candidates.find((item) => item.interventionId === input.interventionId);
    if (!candidate) throw new Error('Cette intervention n’est pas actuellement hors quota sur cette période.');
    if (input.decision === 'carry_forward' && period.carryover_mode_snapshot === 'none') {
      throw new Error('Le contrat de maintenance ne permet pas le report sur une autre période.');
    }

    const expectedAmount = input.decision === 'bill_out_of_scope' ? input.expectedAmountCents ?? 0 : 0;
    if (!Number.isInteger(expectedAmount) || expectedAmount < 0) throw new Error('Montant de dépassement invalide.');
    if (input.decision === 'bill_out_of_scope' && expectedAmount <= 0) throw new Error('Indique le montant à facturer pour ce dépassement.');

    const existing = this.database.get<{ id: string }>('SELECT id FROM maintenance_overage_decisions WHERE intervention_id=?', [input.interventionId]);
    const id = existing?.id ?? randomUUID();
    const now = nowIso();
    if (existing) {
      this.database.run(
        `UPDATE maintenance_overage_decisions
         SET period_id=?,decision=?,reason=?,expected_amount_cents=?,updated_at=?
         WHERE id=?`,
        [periodId, input.decision, reason, expectedAmount, now, id],
      );
    } else {
      this.database.run(
        `INSERT INTO maintenance_overage_decisions
         (id,period_id,intervention_id,decision,reason,expected_amount_cents,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, periodId, input.interventionId, input.decision, reason, expectedAmount, now, now],
      );
    }

    this.billing.syncMaintenanceOverage(id);
    this.writeActivity(
      'maintenance_overage_decision',
      id,
      'maintenance_overage_decided',
      `${candidate.interventionNumber} · ${input.decision} · ${reason}`,
    );
    return this.review(periodId);
  }

  syncBillingForIntervention(interventionId: string): void {
    const decision = this.database.get<{ id: string }>('SELECT id FROM maintenance_overage_decisions WHERE intervention_id=?', [interventionId]);
    if (decision) this.billing.syncMaintenanceOverage(decision.id);
  }

  private decisionSelect(clause: string): string {
    return `SELECT mod.*,i.intervention_number,i.subject AS intervention_subject
      FROM maintenance_overage_decisions mod
      JOIN interventions i ON i.id=mod.intervention_id
      ${clause}`;
  }

  private mapDecision(row: DecisionRow): MaintenanceOverageDecision {
    return {
      id: row.id,
      periodId: row.period_id,
      interventionId: row.intervention_id,
      interventionNumber: row.intervention_number,
      interventionSubject: row.intervention_subject,
      decision: row.decision,
      reason: row.reason,
      expectedAmountCents: Number(row.expected_amount_cents),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}

import { randomUUID } from 'node:crypto';
import {
  HOUR_PACK_SHORTFALL_DECISIONS,
  type HourPackShortfallCandidate,
  type HourPackShortfallDecision,
  type HourPackShortfallDecisionInput,
  type HourPackShortfallReview,
} from '../../shared/hourPackShortfall';
import type { BillingHandoffService } from '../billing/BillingHandoffService';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { HourPackService } from './HourPackService';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface MovementReviewRow extends Record<string, unknown> {
  id: string;
  intervention_id: string | null;
  reversal_of_movement_id: string | null;
  movement_type: string;
  seconds_delta: number;
  created_at: string;
  intervention_number: string | null;
  intervention_subject: string | null;
}

interface DecisionRow extends Record<string, unknown> {
  id: string;
  pack_id: string;
  debit_movement_id: string;
  intervention_id: string;
  decision: HourPackShortfallDecision['decision'];
  reason: string;
  shortfall_seconds: number;
  expected_amount_cents: number;
  alternative_pack_id: string | null;
  created_at: string;
  updated_at: string;
  intervention_number: string;
  intervention_subject: string;
  alternative_pack_name: string | null;
}

export class HourPackShortfallService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly packs: HourPackService,
    private readonly billing: BillingHandoffService,
  ) {}

  review(packId: string): HourPackShortfallReview {
    const pack = this.packs.get(packId);
    const movements = this.database.all<MovementReviewRow>(
      `SELECT hpm.id,hpm.intervention_id,hpm.reversal_of_movement_id,hpm.movement_type,hpm.seconds_delta,hpm.created_at,
        i.intervention_number,i.subject AS intervention_subject
       FROM hour_pack_movements hpm
       LEFT JOIN interventions i ON i.id=hpm.intervention_id
       WHERE hpm.pack_id=?
       ORDER BY hpm.rowid`,
      [packId],
    );
    const reversed = new Set(
      movements.filter((movement) => movement.movement_type === 'reversal' && movement.reversal_of_movement_id)
        .map((movement) => movement.reversal_of_movement_id as string),
    );
    const decisions = new Map(
      this.database.all<DecisionRow>(this.decisionSelect('WHERE hpsd.pack_id=?'), [packId])
        .map((row) => [row.debit_movement_id, this.mapDecision(row)]),
    );

    let runningBalance = 0;
    const candidates: HourPackShortfallCandidate[] = [];
    for (const movement of movements) {
      const before = runningBalance;
      runningBalance += Number(movement.seconds_delta);
      if (movement.movement_type !== 'intervention_debit' || !movement.intervention_id || reversed.has(movement.id)) continue;
      const shortfall = Math.max(0, -runningBalance) - Math.max(0, -before);
      if (shortfall <= 0) continue;
      candidates.push({
        debitMovementId: movement.id,
        interventionId: movement.intervention_id,
        interventionNumber: movement.intervention_number ?? 'Intervention',
        interventionSubject: movement.intervention_subject ?? 'Intervention pack',
        debitedSeconds: Math.abs(Number(movement.seconds_delta)),
        shortfallSeconds: shortfall,
        decision: decisions.get(movement.id) ?? null,
      });
    }

    return {
      packId,
      packName: pack.name,
      balanceSeconds: pack.balanceSeconds,
      candidateCount: candidates.length,
      unresolvedCount: candidates.filter((candidate) => !candidate.decision).length,
      candidates,
    };
  }

  decide(packId: string, input: HourPackShortfallDecisionInput): HourPackShortfallReview {
    if (!HOUR_PACK_SHORTFALL_DECISIONS.includes(input.decision)) throw new Error('Décision de dépassement de pack invalide.');
    const reason = clean(input.reason);
    if (!reason) throw new Error('Le motif de la décision est obligatoire.');

    const review = this.review(packId);
    const candidate = review.candidates.find((item) => item.debitMovementId === input.debitMovementId);
    if (!candidate) throw new Error('Ce débit ne provoque pas actuellement de dépassement sur ce pack.');

    const expectedAmount = input.decision === 'bill_complement' ? Number(input.expectedAmountCents ?? 0) : 0;
    if (!Number.isInteger(expectedAmount) || expectedAmount < 0) throw new Error('Montant du complément invalide.');
    if (input.decision === 'bill_complement' && expectedAmount <= 0) throw new Error('Indique le montant à facturer pour le complément.');

    const alternativePackId = input.decision === 'use_other_pack' ? clean(input.alternativePackId) : null;
    if (input.decision === 'use_other_pack' && !alternativePackId) throw new Error('Choisis le pack alternatif à utiliser.');
    if (alternativePackId === packId) throw new Error('Choisis un autre pack comme pack alternatif.');

    const existingRow = this.database.get<DecisionRow>(this.decisionSelect('WHERE hpsd.debit_movement_id=?'), [input.debitMovementId]);
    if (existingRow) {
      const existing = this.mapDecision(existingRow);
      const same = existing.decision === input.decision
        && existing.reason === reason
        && existing.expectedAmountCents === expectedAmount
        && (existing.alternativePackId ?? null) === alternativePackId;
      if (same) return this.review(packId);
      throw new Error('Une décision est déjà enregistrée pour ce dépassement. Les corrections doivent rester traçables.');
    }

    const sourcePack = this.packs.get(packId);
    const intervention = this.database.get<{ client_account_id: string; project_id: string | null }>(
      'SELECT client_account_id,project_id FROM interventions WHERE id=?',
      [candidate.interventionId],
    );
    if (!intervention) throw new Error('Intervention introuvable.');

    if (alternativePackId) {
      const alternative = this.packs.get(alternativePackId);
      if (alternative.clientAccountId !== sourcePack.clientAccountId) throw new Error('Le pack alternatif appartient à un autre client.');
      if (alternative.projectId && alternative.projectId !== intervention.project_id) throw new Error('Le pack alternatif appartient à un autre projet.');
      if (alternative.status !== 'active') throw new Error('Le pack alternatif doit être actif.');
      if (alternative.balanceSeconds < candidate.shortfallSeconds) throw new Error('Le pack alternatif ne contient pas assez de temps pour absorber ce complément.');
    }

    const id = randomUUID();
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO hour_pack_shortfall_decisions
         (id,pack_id,debit_movement_id,intervention_id,decision,reason,shortfall_seconds,expected_amount_cents,alternative_pack_id,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, packId, candidate.debitMovementId, candidate.interventionId, input.decision, reason, candidate.shortfallSeconds, expectedAmount, alternativePackId, now, now],
      );

      if (input.decision === 'bill_complement') {
        this.addResolutionMovement(packId, candidate.interventionId, candidate.shortfallSeconds, 'manual_correction', `Complément hors pack facturé · ${candidate.interventionNumber}`, `shortfall:${id}:billed`, now);
        this.billing.ensureForHourPackShortfall(id);
      } else if (input.decision === 'commercial_gesture') {
        this.addResolutionMovement(packId, candidate.interventionId, candidate.shortfallSeconds, 'commercial_credit', `Geste commercial sur dépassement · ${candidate.interventionNumber}`, `shortfall:${id}:gesture`, now);
      } else if (input.decision === 'use_other_pack' && alternativePackId) {
        this.addResolutionMovement(packId, candidate.interventionId, candidate.shortfallSeconds, 'manual_correction', `Dépassement transféré vers un autre pack · ${candidate.interventionNumber}`, `shortfall:${id}:source-credit`, now);
        this.addResolutionMovement(alternativePackId, candidate.interventionId, -candidate.shortfallSeconds, 'manual_correction', `Complément repris depuis ${sourcePack.name} · ${candidate.interventionNumber}`, `shortfall:${id}:alternative-debit`, now);
        this.refreshPackStatus(alternativePackId, now);
      }

      this.refreshPackStatus(packId, now);
      this.writeActivity('hour_pack_shortfall_decision', id, 'hour_pack_shortfall_decided', `${candidate.interventionNumber} · ${input.decision} · ${reason}`, now);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return this.review(packId);
  }

  private addResolutionMovement(
    packId: string,
    interventionId: string,
    secondsDelta: number,
    movementType: 'manual_correction' | 'commercial_credit',
    reason: string,
    sourceKey: string,
    createdAt: string,
  ): void {
    this.database.run(
      `INSERT INTO hour_pack_movements
       (id,pack_id,intervention_id,movement_type,seconds_delta,reason,source_key,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [randomUUID(), packId, interventionId, movementType, secondsDelta, reason, sourceKey, createdAt],
    );
  }

  private refreshPackStatus(packId: string, updatedAt: string): void {
    const row = this.database.get<{ status: string; expires_at: string | null }>('SELECT status,expires_at FROM hour_packs WHERE id=?', [packId]);
    if (!row || ['archived', 'suspended'].includes(row.status)) return;
    const balance = Number(this.database.get<{ balance: number | null }>('SELECT SUM(seconds_delta) AS balance FROM hour_pack_movements WHERE pack_id=?', [packId])?.balance ?? 0);
    const status = row.expires_at && row.expires_at < updatedAt ? 'expired' : balance <= 0 ? 'exhausted' : 'active';
    this.database.run('UPDATE hour_packs SET status=?,updated_at=? WHERE id=?', [status, updatedAt, packId]);
  }

  private decisionSelect(clause: string): string {
    return `SELECT hpsd.*,i.intervention_number,i.subject AS intervention_subject,ahp.name AS alternative_pack_name
      FROM hour_pack_shortfall_decisions hpsd
      JOIN interventions i ON i.id=hpsd.intervention_id
      LEFT JOIN hour_packs ahp ON ahp.id=hpsd.alternative_pack_id
      ${clause}`;
  }

  private mapDecision(row: DecisionRow): HourPackShortfallDecision {
    return {
      id: row.id,
      packId: row.pack_id,
      debitMovementId: row.debit_movement_id,
      interventionId: row.intervention_id,
      interventionNumber: row.intervention_number,
      interventionSubject: row.intervention_subject,
      decision: row.decision,
      reason: row.reason,
      shortfallSeconds: Number(row.shortfall_seconds),
      expectedAmountCents: Number(row.expected_amount_cents),
      alternativePackId: row.alternative_pack_id,
      alternativePackName: row.alternative_pack_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string, createdAt: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, createdAt],
    );
  }
}

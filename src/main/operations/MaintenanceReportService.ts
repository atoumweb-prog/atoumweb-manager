import type {
  MaintenanceReportData,
  MaintenanceReportDraftInput,
  MaintenanceReportIntervention,
} from '../../shared/maintenanceReport';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface PeriodRow extends Record<string, unknown> {
  id: string;
  period_start: string;
  period_end: string;
  status: MaintenanceReportData['periodStatus'];
  included_interventions: number;
  client_account_id: string;
  project_id: string | null;
  client_label: string;
  project_label: string | null;
  plan_name_snapshot: string;
  contract_price_cents: number;
  client_summary: string | null;
  anomalies_actions: string | null;
  recommendations: string | null;
  report_updated_at: string | null;
}

interface InterventionRow extends Record<string, unknown> {
  id: string;
  intervention_number: string;
  subject: string;
  intervention_type: string;
  status: string;
  completed_at: string | null;
  total_seconds: number;
}

export class MaintenanceReportService {
  constructor(private readonly database: DatabaseAdapter) {}

  get(periodId: string): MaintenanceReportData {
    const period = this.database.get<PeriodRow>(
      `SELECT mp.id,mp.period_start,mp.period_end,mp.status,mp.included_interventions,
        ms.client_account_id,ms.project_id,ms.plan_name_snapshot,ms.contract_price_cents,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label,
        mrd.client_summary,mrd.anomalies_actions,mrd.recommendations,mrd.updated_at AS report_updated_at
       FROM maintenance_periods mp
       JOIN maintenance_subscriptions ms ON ms.id=mp.subscription_id
       JOIN client_accounts ca ON ca.id=ms.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=ms.project_id
       LEFT JOIN maintenance_report_drafts mrd ON mrd.period_id=mp.id
       WHERE mp.id=?`,
      [periodId],
    );
    if (!period) throw new Error('Période de maintenance introuvable.');

    const checks = this.database.all<{
      label: string;
      description: string | null;
      is_required: number;
      status: MaintenanceReportData['checks'][number]['status'];
      completed_at: string | null;
    }>(
      `SELECT label,description,is_required,status,completed_at
       FROM maintenance_checks WHERE period_id=? ORDER BY sort_order,label COLLATE NOCASE`,
      [periodId],
    ).map((row) => ({
      label: row.label,
      description: row.description,
      required: Boolean(row.is_required),
      status: row.status,
      completedAt: row.completed_at,
    }));

    const interventions = this.database.all<InterventionRow>(
      `SELECT i.id,i.intervention_number,i.subject,i.intervention_type,i.status,i.completed_at,
        COALESCE((
          SELECT SUM(MAX(0,CAST((julianday(ts.ended_at)-julianday(ts.started_at))*86400 AS INTEGER)) - COALESCE((
            SELECT SUM(MAX(0,CAST((julianday(tsp.ended_at)-julianday(tsp.started_at))*86400 AS INTEGER)))
            FROM time_session_pauses tsp WHERE tsp.time_session_id=ts.id AND tsp.ended_at IS NOT NULL
          ),0))
          FROM time_sessions ts WHERE ts.intervention_id=i.id AND ts.ended_at IS NOT NULL
        ),0) AS total_seconds
       FROM interventions i
       WHERE i.maintenance_period_id=? AND i.status NOT IN ('cancelled','archived')
       ORDER BY i.created_at,i.id`,
      [periodId],
    ).map<MaintenanceReportIntervention>((row) => ({
      id: row.id,
      number: row.intervention_number,
      subject: row.subject,
      type: row.intervention_type,
      status: row.status,
      completedAt: row.completed_at,
      durationSeconds: Math.max(0, Number(row.total_seconds ?? 0)),
    }));

    const overages = this.database.all<{
      intervention_id: string;
      intervention_number: string;
      decision: MaintenanceReportData['overages'][number]['decision'];
      expected_amount_cents: number;
    }>(
      `SELECT mod.intervention_id,i.intervention_number,mod.decision,mod.expected_amount_cents
       FROM maintenance_overage_decisions mod
       JOIN interventions i ON i.id=mod.intervention_id
       WHERE mod.period_id=? ORDER BY i.created_at,i.id`,
      [periodId],
    ).map((row) => ({
      interventionId: row.intervention_id,
      interventionNumber: row.intervention_number,
      decision: row.decision,
      expectedAmountCents: Number(row.expected_amount_cents),
    }));

    const included = Number(period.included_interventions);
    const totalTimeSeconds = interventions.reduce((sum, intervention) => sum + intervention.durationSeconds, 0);
    const interventionCount = interventions.length;

    return {
      periodId: period.id,
      periodStart: period.period_start,
      periodEnd: period.period_end,
      periodStatus: period.status,
      clientAccountId: period.client_account_id,
      clientLabel: period.client_label,
      projectId: period.project_id,
      projectLabel: period.project_label,
      planName: period.plan_name_snapshot,
      contractPriceCents: Number(period.contract_price_cents),
      includedInterventions: included,
      interventionCount,
      totalTimeSeconds,
      remainingInterventions: included > 0 ? Math.max(0, included - interventionCount) : null,
      overageCount: included > 0 ? Math.max(0, interventionCount - included) : 0,
      clientSummary: period.client_summary,
      anomaliesActions: period.anomalies_actions,
      recommendations: period.recommendations,
      checks,
      interventions,
      overages,
      updatedAt: period.report_updated_at,
    };
  }

  updateDraft(periodId: string, input: MaintenanceReportDraftInput): MaintenanceReportData {
    this.get(periodId);
    const now = nowIso();
    this.database.run(
      `INSERT INTO maintenance_report_drafts (period_id,client_summary,anomalies_actions,recommendations,updated_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(period_id) DO UPDATE SET
         client_summary=excluded.client_summary,
         anomalies_actions=excluded.anomalies_actions,
         recommendations=excluded.recommendations,
         updated_at=excluded.updated_at`,
      [periodId, clean(input.clientSummary), clean(input.anomaliesActions), clean(input.recommendations), now],
    );
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      ['maintenance_period', periodId, 'maintenance_report_updated', 'Brouillon du rapport client mis à jour', now],
    );
    return this.get(periodId);
  }
}

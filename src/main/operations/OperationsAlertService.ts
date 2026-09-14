import type {
  OperationsAlert,
  OperationsAlertsSnapshot,
  OperationsAlertThresholds,
} from '../../shared/operationsAlerts';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

const DAY_MS = 86_400_000;

interface MaintenanceAlertRow extends Record<string, unknown> {
  subscription_id: string;
  client_account_id: string;
  project_id: string | null;
  client_label: string;
  project_label: string | null;
  period_id: string | null;
  period_start: string | null;
  period_end: string | null;
  period_status: string | null;
  included_interventions: number | null;
  intervention_count: number;
}

interface PackAlertRow extends Record<string, unknown> {
  id: string;
  client_account_id: string;
  project_id: string | null;
  client_label: string;
  project_label: string | null;
  name: string;
  purchased_seconds: number;
  expires_at: string | null;
  status: string;
  balance_seconds: number;
}

interface IncidentAlertRow extends Record<string, unknown> {
  id: string;
  intervention_number: string;
  client_account_id: string;
  project_id: string | null;
  client_label: string;
  project_label: string | null;
  subject: string;
  incident_started_at: string | null;
  created_at: string;
}

interface BillingAlertRow extends Record<string, unknown> {
  billing_item_id: string;
  intervention_id: string;
  intervention_number: string;
  client_account_id: string;
  project_id: string | null;
  client_label: string;
  project_label: string | null;
  description: string;
  expected_amount_cents: number;
  created_at: string;
}

export class OperationsAlertService {
  constructor(private readonly database: DatabaseAdapter) {}

  get(): OperationsAlertsSnapshot {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thresholds = this.thresholds();
    const alerts: OperationsAlert[] = [];

    for (const row of this.criticalIncidentRows()) {
      alerts.push({
        id: `incident-critical:${row.id}`,
        kind: 'incident_critical_open',
        severity: 'critical',
        title: 'Incident critique ouvert',
        detail: `${row.intervention_number} · ${row.subject}`,
        clientAccountId: row.client_account_id,
        clientLabel: row.client_label,
        projectId: row.project_id,
        projectLabel: row.project_label,
        interventionId: row.id,
        dueAt: row.incident_started_at ?? row.created_at,
      });
    }

    for (const row of this.readyToBillRows()) {
      alerts.push({
        id: `billing-ready:${row.billing_item_id}`,
        kind: 'intervention_ready_to_bill',
        severity: 'warning',
        title: 'Intervention terminée à facturer',
        detail: `${row.intervention_number} · ${this.money(Number(row.expected_amount_cents))} à préparer dans Facturation.`,
        clientAccountId: row.client_account_id,
        clientLabel: row.client_label,
        projectId: row.project_id,
        projectLabel: row.project_label,
        interventionId: row.intervention_id,
        billingItemId: row.billing_item_id,
        dueAt: row.created_at,
      });
    }

    for (const row of this.currentMaintenanceRows()) {
      if (!row.period_id) {
        alerts.push({
          id: `maintenance-due:${row.subscription_id}`,
          kind: 'maintenance_due',
          severity: 'warning',
          title: 'Période de maintenance à générer',
          detail: 'La souscription est active mais aucune période ne couvre la date actuelle.',
          clientAccountId: row.client_account_id,
          clientLabel: row.client_label,
          projectId: row.project_id,
          projectLabel: row.project_label,
          maintenanceSubscriptionId: row.subscription_id,
          dueAt: today,
        });
        continue;
      }

      const unresolved = this.unresolvedOverageCount(row.period_id, Number(row.included_interventions ?? 0));
      if (unresolved > 0) {
        alerts.push({
          id: `maintenance-overage:${row.period_id}`,
          kind: 'maintenance_overage_unresolved',
          severity: 'critical',
          title: 'Dépassement maintenance à décider',
          detail: `${unresolved} intervention(s) hors quota sans décision.`,
          clientAccountId: row.client_account_id,
          clientLabel: row.client_label,
          projectId: row.project_id,
          projectLabel: row.project_label,
          maintenanceSubscriptionId: row.subscription_id,
          maintenancePeriodId: row.period_id,
          dueAt: row.period_end,
        });
      } else if (Number(row.included_interventions ?? 0) > 0 && Number(row.intervention_count) >= Number(row.included_interventions)) {
        alerts.push({
          id: `maintenance-quota:${row.period_id}`,
          kind: 'maintenance_quota_reached',
          severity: Number(row.intervention_count) > Number(row.included_interventions) ? 'warning' : 'info',
          title: Number(row.intervention_count) > Number(row.included_interventions) ? 'Quota maintenance dépassé' : 'Quota maintenance atteint',
          detail: `${row.intervention_count} / ${row.included_interventions} intervention(s) utilisées.`,
          clientAccountId: row.client_account_id,
          clientLabel: row.client_label,
          projectId: row.project_id,
          projectLabel: row.project_label,
          maintenanceSubscriptionId: row.subscription_id,
          maintenancePeriodId: row.period_id,
          dueAt: row.period_end,
        });
      }
    }

    for (const row of this.overdueMaintenanceRows(today)) {
      alerts.push({
        id: `maintenance-overdue:${row.period_id}`,
        kind: 'maintenance_overdue',
        severity: 'critical',
        title: 'Maintenance en retard de clôture',
        detail: `Période ${row.period_start} → ${row.period_end} non clôturée.`,
        clientAccountId: row.client_account_id,
        clientLabel: row.client_label,
        projectId: row.project_id,
        projectLabel: row.project_label,
        maintenanceSubscriptionId: row.subscription_id,
        maintenancePeriodId: row.period_id,
        dueAt: row.period_end,
      });
    }

    for (const row of this.packRows()) {
      const balance = Number(row.balance_seconds);
      const purchased = Math.max(1, Number(row.purchased_seconds));
      const percent = Math.max(0, Math.round((balance / purchased) * 100));

      if (balance < 0) {
        alerts.push({
          id: `pack-negative:${row.id}`,
          kind: 'hour_pack_negative',
          severity: 'critical',
          title: 'Pack d’heures en solde négatif',
          detail: `${this.duration(Math.abs(balance))} dépassée(s) sur « ${row.name} ».`,
          clientAccountId: row.client_account_id,
          clientLabel: row.client_label,
          projectId: row.project_id,
          projectLabel: row.project_label,
          hourPackId: row.id,
          dueAt: row.expires_at,
        });
      } else if (balance === 0 || row.status === 'exhausted') {
        alerts.push({
          id: `pack-exhausted:${row.id}`,
          kind: 'hour_pack_exhausted',
          severity: 'critical',
          title: 'Pack d’heures épuisé',
          detail: `« ${row.name} » ne contient plus de temps disponible.`,
          clientAccountId: row.client_account_id,
          clientLabel: row.client_label,
          projectId: row.project_id,
          projectLabel: row.project_label,
          hourPackId: row.id,
          dueAt: row.expires_at,
        });
      } else if (balance <= thresholds.hourPackLowSeconds || percent <= thresholds.hourPackLowPercent) {
        alerts.push({
          id: `pack-low:${row.id}`,
          kind: 'hour_pack_low',
          severity: 'warning',
          title: 'Pack d’heures presque épuisé',
          detail: `${this.duration(balance)} restantes (${percent} %) sur « ${row.name} ».`,
          clientAccountId: row.client_account_id,
          clientLabel: row.client_label,
          projectId: row.project_id,
          projectLabel: row.project_label,
          hourPackId: row.id,
          dueAt: row.expires_at,
        });
      }

      if (row.expires_at && row.status !== 'expired') {
        const expiryMs = Date.parse(row.expires_at);
        if (!Number.isNaN(expiryMs)) {
          const days = Math.ceil((expiryMs - now.getTime()) / DAY_MS);
          if (days >= 0 && days <= thresholds.hourPackExpiryDays) {
            alerts.push({
              id: `pack-expiring:${row.id}`,
              kind: 'hour_pack_expiring',
              severity: days <= 3 ? 'critical' : 'warning',
              title: 'Pack d’heures bientôt expiré',
              detail: `« ${row.name} » expire dans ${days} jour(s).`,
              clientAccountId: row.client_account_id,
              clientLabel: row.client_label,
              projectId: row.project_id,
              projectLabel: row.project_label,
              hourPackId: row.id,
              dueAt: row.expires_at,
            });
          }
        }
      }
    }

    const severityRank = { critical: 0, warning: 1, info: 2 } as const;
    alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
    return { generatedAt: now.toISOString(), thresholds, alerts };
  }

  private thresholds(): OperationsAlertThresholds {
    return {
      hourPackLowSeconds: this.settingNumber('operations_alert_hour_pack_low_seconds', 3600, 0),
      hourPackLowPercent: this.settingNumber('operations_alert_hour_pack_low_percent', 20, 0, 100),
      hourPackExpiryDays: this.settingNumber('operations_alert_hour_pack_expiry_days', 14, 0, 3650),
    };
  }

  private settingNumber(key: string, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER): number {
    const row = this.database.get<{ value_json: string }>('SELECT value_json FROM settings WHERE key=?', [key]);
    if (!row) return fallback;
    try {
      const value = Number(JSON.parse(row.value_json));
      return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
    } catch {
      return fallback;
    }
  }

  private criticalIncidentRows(): IncidentAlertRow[] {
    return this.database.all<IncidentAlertRow>(
      `SELECT i.id,i.intervention_number,i.client_account_id,i.project_id,i.subject,i.incident_started_at,i.created_at,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label
       FROM interventions i
       JOIN client_accounts ca ON ca.id=i.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=i.project_id
       WHERE i.intervention_type='incident'
         AND i.incident_criticality='critical'
         AND i.incident_resolved_at IS NULL
         AND i.status NOT IN ('completed','cancelled','archived')
       ORDER BY COALESCE(i.incident_started_at,i.created_at)`,
    );
  }

  private readyToBillRows(): BillingAlertRow[] {
    return this.database.all<BillingAlertRow>(
      `SELECT bi.id AS billing_item_id,i.id AS intervention_id,i.intervention_number,
        bi.client_account_id,bi.project_id,bi.description,bi.expected_amount_cents,bi.created_at,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label
       FROM billing_items bi
       JOIN interventions i ON bi.source_type='intervention' AND i.id=bi.source_id
       JOIN client_accounts ca ON ca.id=bi.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=bi.project_id
       WHERE bi.status='ready' AND bi.expected_amount_cents>0 AND i.status='completed'
       UNION ALL
       SELECT bi.id AS billing_item_id,i.id AS intervention_id,i.intervention_number,
        bi.client_account_id,bi.project_id,bi.description,bi.expected_amount_cents,bi.created_at,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label
       FROM billing_items bi
       JOIN maintenance_overage_decisions mod ON bi.source_type='maintenance_overage' AND mod.id=bi.source_id
       JOIN interventions i ON i.id=mod.intervention_id
       JOIN client_accounts ca ON ca.id=bi.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=bi.project_id
       WHERE bi.status='ready' AND bi.expected_amount_cents>0 AND i.status='completed'
       ORDER BY created_at`,
    );
  }

  private currentMaintenanceRows(): MaintenanceAlertRow[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.database.all<MaintenanceAlertRow>(
      `SELECT ms.id AS subscription_id,ms.client_account_id,ms.project_id,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label,
        mp.id AS period_id,mp.period_start,mp.period_end,mp.status AS period_status,mp.included_interventions,
        COALESCE((SELECT COUNT(*) FROM interventions i WHERE i.maintenance_period_id=mp.id AND i.status NOT IN ('cancelled','archived')),0) AS intervention_count
       FROM maintenance_subscriptions ms
       JOIN client_accounts ca ON ca.id=ms.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=ms.project_id
       LEFT JOIN maintenance_periods mp ON mp.id=(
         SELECT mp2.id FROM maintenance_periods mp2
         WHERE mp2.subscription_id=ms.id AND mp2.period_start<=? AND mp2.period_end>=?
         ORDER BY mp2.period_start DESC LIMIT 1
       )
       WHERE ms.status='active' AND ms.start_date<=? AND (ms.end_date IS NULL OR ms.end_date>=?)`,
      [today, today, today, today],
    );
  }

  private overdueMaintenanceRows(today: string): MaintenanceAlertRow[] {
    return this.database.all<MaintenanceAlertRow>(
      `SELECT ms.id AS subscription_id,ms.client_account_id,ms.project_id,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label,
        mp.id AS period_id,mp.period_start,mp.period_end,mp.status AS period_status,mp.included_interventions,
        COALESCE((SELECT COUNT(*) FROM interventions i WHERE i.maintenance_period_id=mp.id AND i.status NOT IN ('cancelled','archived')),0) AS intervention_count
       FROM maintenance_periods mp
       JOIN maintenance_subscriptions ms ON ms.id=mp.subscription_id
       JOIN client_accounts ca ON ca.id=ms.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=ms.project_id
       WHERE mp.period_end<? AND mp.status<>'closed' AND ms.status<>'archived'
       ORDER BY mp.period_end`,
      [today],
    );
  }

  private unresolvedOverageCount(periodId: string, quota: number): number {
    if (quota <= 0) return 0;
    const rows = this.database.all<{ id: string }>(
      `SELECT id FROM interventions
       WHERE maintenance_period_id=? AND status NOT IN ('cancelled','archived')
       ORDER BY created_at,id`,
      [periodId],
    );
    const overageIds = rows.slice(quota).map((row) => row.id);
    if (!overageIds.length) return 0;
    const decided = new Set(
      this.database.all<{ intervention_id: string }>('SELECT intervention_id FROM maintenance_overage_decisions WHERE period_id=?', [periodId])
        .map((row) => row.intervention_id),
    );
    return overageIds.filter((id) => !decided.has(id)).length;
  }

  private packRows(): PackAlertRow[] {
    return this.database.all<PackAlertRow>(
      `SELECT hp.id,hp.client_account_id,hp.project_id,hp.name,hp.purchased_seconds,hp.expires_at,hp.status,
        COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
        p.name AS project_label,
        COALESCE((SELECT SUM(hpm.seconds_delta) FROM hour_pack_movements hpm WHERE hpm.pack_id=hp.id),0) AS balance_seconds
       FROM hour_packs hp
       JOIN client_accounts ca ON ca.id=hp.client_account_id
       LEFT JOIN organizations o ON o.id=ca.organization_id
       LEFT JOIN contacts c ON c.id=ca.primary_contact_id
       LEFT JOIN projects p ON p.id=hp.project_id
       WHERE hp.status NOT IN ('archived','suspended','expired')`,
    );
  }

  private duration(seconds: number): string {
    const minutes = Math.max(0, Math.round(seconds / 60));
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} min`;
    return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
  }

  private money(cents: number): string {
    return `${(Math.max(0, cents) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
  }
}

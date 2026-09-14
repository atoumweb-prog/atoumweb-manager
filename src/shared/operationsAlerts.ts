export const OPERATIONS_ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export const OPERATIONS_ALERT_KINDS = [
  'maintenance_due',
  'maintenance_overdue',
  'maintenance_overage_unresolved',
  'maintenance_quota_reached',
  'hour_pack_low',
  'hour_pack_expiring',
  'hour_pack_exhausted',
  'hour_pack_negative',
  'incident_critical_open',
  'intervention_ready_to_bill',
] as const;

export type OperationsAlertSeverity = (typeof OPERATIONS_ALERT_SEVERITIES)[number];
export type OperationsAlertKind = (typeof OPERATIONS_ALERT_KINDS)[number];

export interface OperationsAlert {
  id: string;
  kind: OperationsAlertKind;
  severity: OperationsAlertSeverity;
  title: string;
  detail: string;
  clientAccountId?: string | null;
  clientLabel?: string | null;
  projectId?: string | null;
  projectLabel?: string | null;
  maintenanceSubscriptionId?: string | null;
  maintenancePeriodId?: string | null;
  hourPackId?: string | null;
  interventionId?: string | null;
  billingItemId?: string | null;
  dueAt?: string | null;
}

export interface OperationsAlertThresholds {
  hourPackLowSeconds: number;
  hourPackLowPercent: number;
  hourPackExpiryDays: number;
}

export interface OperationsAlertsSnapshot {
  generatedAt: string;
  thresholds: OperationsAlertThresholds;
  alerts: OperationsAlert[];
}

export interface OperationsAlertsApi {
  get(): Promise<OperationsAlertsSnapshot>;
}

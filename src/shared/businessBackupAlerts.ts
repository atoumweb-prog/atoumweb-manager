import type { BusinessBackupRecord } from './businessBackups';

export interface BusinessBackupPolicy {
  clientAccountId?: string | null;
  projectId?: string | null;
  maxKnownAgeDays: number;
  maxLocalAgeDays: number;
  warnServerOnly: boolean;
  remindBeforeIntervention: boolean;
  remindAfterMajorChange: boolean;
  inherited: boolean;
}

export interface BusinessBackupPolicyInput {
  clientAccountId?: string | null;
  projectId?: string | null;
  maxKnownAgeDays: number;
  maxLocalAgeDays: number;
  warnServerOnly: boolean;
  remindBeforeIntervention: boolean;
  remindAfterMajorChange: boolean;
}

export type BusinessBackupAlertCode =
  | 'no_backup'
  | 'known_too_old'
  | 'no_recent_local'
  | 'server_only'
  | 'pre_intervention_missing'
  | 'post_change_missing';

export interface BusinessBackupAlert {
  id: string;
  code: BusinessBackupAlertCode;
  severity: 'info' | 'warning';
  title: string;
  detail: string;
  clientAccountId?: string | null;
  projectId?: string | null;
  interventionId?: string | null;
  backupRecordId?: string | null;
  ageDays?: number | null;
}

export interface InterventionBackupReview {
  interventionId: string;
  projectId?: string | null;
  clientAccountId: string;
  policy: BusinessBackupPolicy;
  latestKnown?: BusinessBackupRecord | null;
  latestLocal?: BusinessBackupRecord | null;
  preInterventionBackup?: BusinessBackupRecord | null;
  postInterventionBackup?: BusinessBackupRecord | null;
  alerts: BusinessBackupAlert[];
}

export interface InterventionBackupRecordInput {
  interventionId: string;
  role: 'pre_intervention' | 'post_intervention' | 'reference';
  label?: string | null;
  notes?: string | null;
}

export interface BusinessBackupAlertsApi {
  getPolicy(input: { clientAccountId?: string | null; projectId?: string | null }): Promise<BusinessBackupPolicy>;
  updatePolicy(input: BusinessBackupPolicyInput): Promise<BusinessBackupPolicy>;
  listAlerts(): Promise<BusinessBackupAlert[]>;
  reviewIntervention(interventionId: string): Promise<InterventionBackupReview>;
  recordForIntervention(input: InterventionBackupRecordInput): Promise<InterventionBackupReview>;
  linkExisting(interventionId: string, backupRecordId: string, role: 'pre_intervention' | 'post_intervention' | 'reference'): Promise<InterventionBackupReview>;
}

import type { MaintenanceCheckStatus, MaintenancePeriodStatus } from './operations';
import type { MaintenanceOverageDecisionType } from './maintenanceOverage';

export interface MaintenanceReportDraftInput {
  clientSummary?: string | null;
  anomaliesActions?: string | null;
  recommendations?: string | null;
}

export interface MaintenanceReportCheck {
  label: string;
  description?: string | null;
  required: boolean;
  status: MaintenanceCheckStatus;
  completedAt?: string | null;
}

export interface MaintenanceReportIntervention {
  id: string;
  number: string;
  subject: string;
  type: string;
  status: string;
  completedAt?: string | null;
  durationSeconds: number;
}

export interface MaintenanceReportOverage {
  interventionId: string;
  interventionNumber: string;
  decision: MaintenanceOverageDecisionType;
  expectedAmountCents: number;
}

export interface MaintenanceReportData {
  periodId: string;
  periodStart: string;
  periodEnd: string;
  periodStatus: MaintenancePeriodStatus;
  clientAccountId: string;
  clientLabel: string;
  projectId?: string | null;
  projectLabel?: string | null;
  planName: string;
  contractPriceCents: number;
  includedInterventions: number;
  interventionCount: number;
  totalTimeSeconds: number;
  remainingInterventions: number | null;
  overageCount: number;
  clientSummary?: string | null;
  anomaliesActions?: string | null;
  recommendations?: string | null;
  checks: MaintenanceReportCheck[];
  interventions: MaintenanceReportIntervention[];
  overages: MaintenanceReportOverage[];
  updatedAt?: string | null;
}

export interface MaintenanceReportApi {
  get(periodId: string): Promise<MaintenanceReportData>;
  updateDraft(periodId: string, input: MaintenanceReportDraftInput): Promise<MaintenanceReportData>;
}

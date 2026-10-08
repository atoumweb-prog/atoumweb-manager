export const MAINTENANCE_OVERAGE_DECISIONS = [
  'bill_out_of_scope',
  'commercial_gesture',
  'include_exceptionally',
  'carry_forward',
  'other',
] as const;

export type MaintenanceOverageDecisionType = (typeof MAINTENANCE_OVERAGE_DECISIONS)[number];

export interface MaintenanceOverageDecisionInput {
  interventionId: string;
  decision: MaintenanceOverageDecisionType;
  reason: string;
  expectedAmountCents?: number;
}

export interface MaintenanceOverageDecision {
  id: string;
  periodId: string;
  interventionId: string;
  interventionNumber: string;
  interventionSubject: string;
  decision: MaintenanceOverageDecisionType;
  reason: string;
  expectedAmountCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceOverageCandidate {
  interventionId: string;
  interventionNumber: string;
  interventionSubject: string;
  interventionStatus: string;
  totalTimeSeconds: number;
  theoreticalValueCents: number;
  billableAmountCents: number;
  decision?: MaintenanceOverageDecision | null;
}

export interface MaintenanceOverageReview {
  periodId: string;
  includedInterventions: number;
  interventionCount: number;
  overageCount: number;
  unresolvedCount: number;
  carryoverAllowed: boolean;
  candidates: MaintenanceOverageCandidate[];
}

export interface MaintenanceOverageApi {
  review(periodId: string): Promise<MaintenanceOverageReview>;
  decide(periodId: string, input: MaintenanceOverageDecisionInput): Promise<MaintenanceOverageReview>;
}

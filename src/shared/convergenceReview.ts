export interface ConvergenceDifference {
  field: string;
  published: unknown;
  proposed: unknown;
}

export interface ContractConvergenceReviewRow {
  code: string;
  title: string;
  publishedVersion: number;
  publishedBody: string;
  proposedTitle: string;
  proposedBody: string;
  action: 'create' | 'keep' | 'conflict';
  anomaly: string | null;
  dependencies: string[];
  family: string;
  risk: string;
  defect: string;
  legalAssessment: string;
  externalReview: string;
  draftVersionId: string | null;
  decision: 'approved_for_publication' | 'needs_revision' | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface CatalogConvergenceReviewRow {
  canonicalCode: string;
  name: string;
  publishedVersion: number;
  draftPrepared: boolean;
  requestId: string;
  differences: ConvergenceDifference[];
}

export interface ConvergenceTraceEntry {
  action: string;
  summary: string;
  createdAt: string;
}

export interface ConvergenceReview {
  simulatedAt: string;
  contract: {
    planSha256: string;
    counts: { draftsToCreate: number; draftsKept: number; conflicts: number };
    anomalies: string[];
    rows: ContractConvergenceReviewRow[];
  };
  catalog: {
    reference: string;
    rows: CatalogConvergenceReviewRow[];
    anomalies: string[];
  };
  trace: ConvergenceTraceEntry[];
}

export interface ConvergenceDecisionInput {
  codes: string[];
  decision: 'approved_for_publication' | 'needs_revision';
  reviewer: string;
  note?: string;
  expectedPlanSha256: string;
}

export interface ConvergenceReviewApi {
  simulate(): Promise<ConvergenceReview>;
  prepareContractDrafts(expectedPlanSha256: string): Promise<ConvergenceReview>;
  prepareCatalogDrafts(expectedRequestIds: string[]): Promise<ConvergenceReview>;
  decideContractDrafts(input: ConvergenceDecisionInput): Promise<ConvergenceReview>;
}

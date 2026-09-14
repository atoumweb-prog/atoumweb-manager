export const HOUR_PACK_SHORTFALL_DECISIONS = [
  'bill_complement',
  'allow_negative',
  'use_other_pack',
  'commercial_gesture',
  'other',
] as const;

export type HourPackShortfallDecisionType = (typeof HOUR_PACK_SHORTFALL_DECISIONS)[number];

export interface HourPackShortfallDecisionInput {
  debitMovementId: string;
  decision: HourPackShortfallDecisionType;
  reason: string;
  expectedAmountCents?: number | null;
  alternativePackId?: string | null;
}

export interface HourPackShortfallDecision {
  id: string;
  packId: string;
  debitMovementId: string;
  interventionId: string;
  interventionNumber: string;
  interventionSubject: string;
  decision: HourPackShortfallDecisionType;
  reason: string;
  shortfallSeconds: number;
  expectedAmountCents: number;
  alternativePackId?: string | null;
  alternativePackName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HourPackShortfallCandidate {
  debitMovementId: string;
  interventionId: string;
  interventionNumber: string;
  interventionSubject: string;
  debitedSeconds: number;
  shortfallSeconds: number;
  decision?: HourPackShortfallDecision | null;
}

export interface HourPackShortfallReview {
  packId: string;
  packName: string;
  balanceSeconds: number;
  candidateCount: number;
  unresolvedCount: number;
  candidates: HourPackShortfallCandidate[];
}

export interface HourPackShortfallApi {
  review(packId: string): Promise<HourPackShortfallReview>;
  decide(packId: string, input: HourPackShortfallDecisionInput): Promise<HourPackShortfallReview>;
}

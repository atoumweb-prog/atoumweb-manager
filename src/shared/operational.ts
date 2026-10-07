import type {ContributionPolicy} from './contributionTargets';
export const BUSINESS_TIME_CATEGORIES = ['Inclus au forfait', 'Supplément facturable', 'Avant-vente', 'Interne', 'Garantie corrective'] as const;
export type BusinessTimeCategory = typeof BUSINESS_TIME_CATEGORIES[number];
export interface OperationalAction {
  key: string; phase: string; name: string; checklist: string; minutes: number;
  category: BusinessTimeCategory; required: boolean; sourceRow: number;
}
export interface OperationalModel {
  code: string; name: string; lot: '8A' | '8B'; model: string; unit: string;
  estimateRequired: boolean; quantityRule: string; recurrence: string; trigger: string;
  creditMinutes: number; referenceMinutes: number; sourceRow: number; notes: string;
  actions: OperationalAction[];
}
export interface OperationalReference {
  schemaVersion: 1; source: { file: string; sha256: string }; models: OperationalModel[];
  decisions: { key: string; source: string; actionKey: string; originalChecklist: string; checklist: string }[];
}
export interface OperationalActionSnapshot {
  key: string; code: string; modelVersionId: string; modelVersion: number;
  catalogVersionId: string; quoteLineId: string; lineOrigin: string; optionPurchase: Record<string, unknown> | null;
  quantityMilli: number; unitIndex: number; unitMinutes: number; referenceMinutes: number | null;
  targetRequirement?: ContributionPolicy["actionRequirements"][string]; targetPolicy?: ContributionPolicy;
  estimateRequired: boolean; action: OperationalAction | null; phase: string;
}
export interface OperationalNodeInfo extends OperationalActionSnapshot {
  targetState?: 'pending'|'active'|'invalid'; targetIssue?: string | null;
  actualSeconds: number; businessCategory: BusinessTimeCategory | null;
}
export interface OperationalPlan {
  /** A staging plan is read-only and must never reach project mutation. */
  mode?: 'staging';
  schemaVersion: 1; actions: OperationalActionSnapshot[];
  excluded: { code: string; lineId: string; reason: string }[];
  links: { linkId?:string; lineOrigin?:string; quoteLineId?:string; catalogVersionId: string; modelVersionId: string; blueprintVersionId: string | null; configuration?: ContributionPolicy }[];
}

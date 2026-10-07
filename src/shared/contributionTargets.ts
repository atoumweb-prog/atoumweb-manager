/** Explicit versioned configuration. Labels are never interpreted by the runtime. */
export type TargetKind = 'site' | 'page' | 'context';
export interface ContributionPolicy {
  schemaVersion: 1;
  structureClass: 'A' | 'B' | 'C' | 'D';
  structuralRole: 'base' | 'addon' | 'none';
  blueprintRequired: boolean;
  allowedBaseSiteModes?: ('create' | 'existing')[];
  quantity: {minUnits: number; maxUnits: number | null; integerOnly: true; actionMode: 'per_sold_unit'; structureMode: 'once' | 'per_unit' | 'none'};
  targetLimit?: {maxPerSite: 1; key: string};
  destinationSlots: {key: string; kind: TargetKind; requiredAt: 'preparation' | 'integration'; autoSite: 'unique_compatible' | 'never'; parentPageChoice: 'explicit' | 'none'}[];
  requires: string[];
  actionRequirements: Record<string, {target: 'none' | TargetKind; slot?: string; requiredAt: 'preparation' | 'integration'; justification: string}>;
  originPolicy: 'direct_sold_line';
  policySource: string;
  actionRequirementsReview?: {status:'approved'|'fixture';reference:string};
}
export interface StructureContract {
  schemaVersion: 1;
  sites: {slotKey: string; provides: string[]; modes: ('create' | 'existing')[]}[];
  pages: {slotKey: string; templateNodeId: string; siteSlotKey: string; quota: 'content' | 'auxiliary'}[];
  modules: {templateNodeId: string; parentTargetSlot: string}[];
}
export interface ContributionTargetInput {
  lineOrigin: string; slot: string; unitIndex: number;
  siteId?: string | null; pageNodeId?: string | null; contextNodeId?: string | null;
  siteOwnerOrigin?: string | null; siteOwnerSlot?: string | null;
  author: string; createSite?: boolean;
}
export interface ContributionTargetView {
  lineOrigin: string; code: string; slot: string; unitIndex: number; kind: TargetKind;
  state: 'pending' | 'active' | 'out_of_scope'; selectionMode: 'pending' | 'auto_unique' | 'explicit';
  siteId: string | null; pageNodeId: string | null; contextNodeId: string | null;
  siteOwnerOrigin: string | null; siteOwnerSlot: string | null;
  allowsCreateSite?: boolean; requires: string[]; issue: string | null; locked: boolean;
}
export interface PlannedContributionTarget {
  lineOrigin: string; slot: string; unitIndex: number; kind: TargetKind;
  state: 'pending' | 'active'; selectionMode: 'pending' | 'auto_unique' | 'explicit';
  siteOwnerOrigin: string | null; siteOwnerSlot: string | null;
  siteId: string | null; pageNodeId: string | null; contextNodeId: string | null;
}
export interface ContributionTargetChoices {
  sites: {id:string; label:string; ownerOrigin:string|null; ownerSlot:string|null; provides:string[]}[];
  pages: {id:string; siteId:string; label:string}[];
  contexts: {id:string; label:string}[];
}

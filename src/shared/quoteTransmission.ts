/** Manual attestation, not an automatic Abby delivery receipt. */
export interface QuoteSendAttestation {
  operationId: string;
  preparationId: string | null;
  contentHash: string;
  /** 'now' is timestamped in main at confirmation; avoids Chromium clock skew. */
  occurredAt: string;
  channel: 'abby' | 'other';
  provenance: string;
  confirmed: true;
}
export interface QuoteTransmissionState {
  preparationId: string | null;
  contentHash: string | null;
  transmissionId: string | null;
  legacy: boolean;
}
export interface ContractClauseUpdateView {title:string;body:string;versionId:string|null;enabled:boolean;sortOrder?:number;isOrphaned?:boolean;sourceCatalogItemIds?:string[]}
export interface ContractUpdateProposal {
  quoteId: string;
  token: string;
  changes: Array<{sourceKey: string; before: ContractClauseUpdateView|null; after: ContractClauseUpdateView|null}>;
}

export const DATA_PROCESSING_AGREEMENT_STATUSES = ['preparation','sent','signed','revision'] as const;
export type DataProcessingAgreementStatus = typeof DATA_PROCESSING_AGREEMENT_STATUSES[number];
export const DATA_PROCESSING_OPERATIONS = ['access','hosting','maintenance','support','backup','migration','analytics'] as const;
export type DataProcessingOperation = typeof DATA_PROCESSING_OPERATIONS[number];

export interface DataProcessingProvider {
  name: string;
  role: string;
  data: string;
  accountHolder: 'atoumweb'|'client'|'shared'|'unknown';
  rgpdRole: 'subprocessor'|'controller-provider'|'to-confirm';
  country: string;
  authorized: boolean;
  outsideEea: boolean|null;
  transferMechanism: string;
  verifiedAt: string;
}

export interface DataProcessingAgreementPayload {
  siteReference: string;
  domain: string;
  contractReference: string;
  services: string[];
  operations: DataProcessingOperation[];
  purpose: string;
  instructions: string;
  dataSubjects: string[];
  dataCategories: string[];
  specialDataDetails: string;
  exitInstruction: 'return'|'delete'|'to-confirm';
  exitDetails: string;
  toolsAndAccesses: string;
  processingStart: string;
  processingEnd: string;
  incidentContactName: string;
  incidentContactEmail: string;
  securityNotes: string;
  exchangeProtection: string;
  backupNotes: string;
  providers: DataProcessingProvider[];
  transfers: 'none'|'yes'|'to-confirm';
  transferDetails: string;
  retentionNotes: string;
}

export interface DataProcessingAgreement {
  id: string;
  projectSiteId: string;
  clientAccountId: string;
  versionNumber: number;
  previousVersionId: string|null;
  status: DataProcessingAgreementStatus;
  sourceReference: string;
  sourceSha256: string;
  payload: DataProcessingAgreementPayload;
  sentAt: string|null;
  transmissionMode:'external_attestation'|'manager_dispatch'|null;
  transmissionChannel:string;
  transmissionRecipient:string;
  transmissionReference:string;
  sentDocumentId:string|null;
  sentPayloadSha256:string|null;
  signedAt: string|null;
  signedDocumentId: string|null;
  signedPayloadSha256:string|null;
  signatureReference:string;
  createdAt: string;
  updatedAt: string;
}

export interface DataProcessingAgreementGate {
  required: boolean;
  allowed: boolean;
  reason: string;
  agreementId: string|null;
}

export interface DataProcessingSiteAssessment {projectSiteId:string;state:'to_assess'|'not_required'|'required';operations:DataProcessingOperation[];rationale:string;servicesVerifiedAt:string|null;verifiedBy:string;createdAt:string;updatedAt:string;}
export interface DataProcessingSiteAssessmentInput {state:'not_required'|'required';operations:DataProcessingOperation[];rationale:string;servicesVerifiedAt:string;verifiedBy:string;}
export interface DataProcessingSendAttestation {channel:string;recipient:string;reference:string;sentAt:string;sentDocumentId?:string|null;}
export interface DataProcessingSignatureAttestation {documentId:string;signedAt:string;signatureReference:string;expectedVersionNumber:number;expectedPayloadSha256:string;}

export interface DataProcessingIncident {
  id:string;
  projectSiteId:string;
  agreementId:string|null;
  summary:string;
  details:string;
  occurredAt:string;
  reportedAt:string|null;
  resolvedAt:string|null;
  resolution:string;
  createdAt:string;
  updatedAt:string;
}
export interface DataProcessingIncidentInput {summary:string;details?:string;occurredAt:string;reportedAt?:string|null;agreementId?:string|null;}

export interface DataProcessingAgreementApi {
  listForSite(siteId:string):Promise<DataProcessingAgreement[]>;
  createDraft(siteId:string):Promise<DataProcessingAgreement>;
  updateDraft(id:string,payload:DataProcessingAgreementPayload):Promise<DataProcessingAgreement>;
  createRevision(id:string):Promise<DataProcessingAgreement>;
  markSent(id:string,input:DataProcessingSendAttestation):Promise<DataProcessingAgreement>;
  markSigned(id:string,input:DataProcessingSignatureAttestation):Promise<DataProcessingAgreement>;
  gate(siteId:string):Promise<DataProcessingAgreementGate>;
  assessment(siteId:string):Promise<DataProcessingSiteAssessment>;
  saveAssessment(siteId:string,input:DataProcessingSiteAssessmentInput):Promise<DataProcessingSiteAssessment>;
  listIncidents(siteId:string):Promise<DataProcessingIncident[]>;
  recordIncident(siteId:string,input:DataProcessingIncidentInput):Promise<DataProcessingIncident>;
  resolveIncident(id:string,resolution:string,resolvedAt?:string):Promise<DataProcessingIncident>;
}

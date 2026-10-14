/** 05E — read-only distinction between working documents and acceptance evidence.
 * Never infer a customer's acceptance from a generated or attached working file.
 */
export type ContractDocumentKind='working_docx'|'imported_docx'|'working_pdf'|'abby_accepted_pdf';
export interface ContractDocumentEvidence {
  kind:ContractDocumentKind;
  fileId:string;
  sha256?:string|null;
  abbyReference?:string|null;
  acceptedAt?:string|null;
}
export type ContractEvidenceAssessment='working_copy'|'acceptance_unverified'|'accepted_evidence';
export function assessContractEvidence(document:ContractDocumentEvidence):ContractEvidenceAssessment {
  if(document.kind!=='abby_accepted_pdf')return 'working_copy';
  // A claimed acceptance without a verifiable identity, timestamp AND fingerprint is not proof.
  if(!document.fileId.trim()||!document.sha256||!/^[a-f\d]{64}$/i.test(document.sha256)
    ||!document.abbyReference?.trim()||!document.acceptedAt
    ||!Number.isFinite(Date.parse(document.acceptedAt)))return 'acceptance_unverified';
  return 'accepted_evidence';
}

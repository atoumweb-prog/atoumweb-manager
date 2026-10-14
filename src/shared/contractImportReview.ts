/** 05E — prepare a safe, read-only review of an imported contract document.
 * This does not parse DOCX binaries or modify a persisted contract.
 */
import {compareClauseField} from '../renderer/commercial/contractClauseFieldDiff';
export interface ContractImportReview {
  originalText:string;
  importedText:string;
  quoteState:'draft'|'frozen'|'historical_missing';
}
export interface ContractImportResult {
  mayProposeDraft:boolean;
  changed:boolean;
  reason:string;
  removedExcerpt:string;
  addedExcerpt:string;
}
export function reviewContractTextImport(input:ContractImportReview):ContractImportResult {
  const diff=compareClauseField(input.originalText,input.importedText,120);
  if(input.quoteState!=='draft')return {
    mayProposeDraft:false,changed:diff.changed,
    reason:'Document figé ou historique : import en écriture interdit.',
    removedExcerpt:diff.removedExcerpt,addedExcerpt:diff.addedExcerpt,
  };
  if(!input.importedText.trim())return {
    mayProposeDraft:false,changed:diff.changed,
    reason:'Le contenu importé est vide.',
    removedExcerpt:diff.removedExcerpt,addedExcerpt:diff.addedExcerpt,
  };
  return {
    mayProposeDraft:diff.changed,changed:diff.changed,
    reason:diff.changed?'Proposition à examiner et valider avant toute écriture.':'Aucune modification détectée.',
    removedExcerpt:diff.removedExcerpt,addedExcerpt:diff.addedExcerpt,
  };
}

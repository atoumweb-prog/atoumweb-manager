import type { ContractTypeVersionInput } from '../../shared/contractTypes';
import type { ContractClauseAudience, ContractClauseScope } from '../../shared/contractTerms';

/** Comparaison sans muter les versions existantes ni l'ordre de composition. */
export function typeDraftChanged(
  draft: ContractTypeVersionInput,
  saved: Pick<ContractTypeVersionInput, 'name' | 'description' | 'moduleIds'>,
): boolean {
  return draft.name !== saved.name
    || draft.description !== saved.description
    || draft.moduleIds.length !== saved.moduleIds.length
    || draft.moduleIds.some((id,index)=>id!==saved.moduleIds[index]);
}

export interface NewModuleDraft {
  newCode: string;
  newTitle: string;
  newBody: string;
  newScope: ContractClauseScope;
  newAudience: ContractClauseAudience;
}

/** Modifier un seul caractère (même espace) est une saisie à protéger. */
export function newModuleDraftChanged(draft: NewModuleDraft): boolean {
  return draft.newCode.length>0 || draft.newTitle.length>0 || draft.newBody.length>0
    || draft.newScope!=='catalog' || draft.newAudience!=='all';
}

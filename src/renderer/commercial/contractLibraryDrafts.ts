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

/** Recherche française sur les clauses canoniques (aucun changement du texte ni des liens). */
export function matchingContractClauses<T extends {
  title:string; code:string; scope:'base'|'catalog'; audience:string;
}>(clauses:readonly T[],query:string):T[]{
  const fold=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').trim();
  const term=fold(query);
  if(!term)return [...clauses];
  return clauses.filter(clause=>fold([
    clause.title,clause.code,clause.scope==='base'?'CGV communes':'Clauses spécifiques prestations',
    clause.audience,clause.audience==='consumer'?'consommateur particulier':'professionnel tous publics'
  ].join(' ')).includes(term));
}

/** 05C: filtres de consultation uniquement, sans modifier les clauses ni leurs versions. */
export function filterContractClauses<T extends {scope:'base'|'catalog';audience:string;status:string}>(
  clauses:readonly T[], filters:{scope?:'all'|'base'|'catalog';audience?:'all'|'professional'|'consumer';includeArchived?:boolean}
):T[]{
  return clauses.filter(c=>(!filters.scope||filters.scope==='all'||c.scope===filters.scope)
    &&(!filters.audience||filters.audience==='all'||c.audience==='all'||c.audience===filters.audience)
    &&(filters.includeArchived||c.status!=='archived'));
}

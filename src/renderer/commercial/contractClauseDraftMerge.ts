import { mergeDraft } from '../../shared/draftSection';

export interface ContractClauseTextDraft { title:string; body:string }
export interface ContractClauseTextRecord extends ContractClauseTextDraft { id:string }

/** Preserve independent unsaved clause edits when one clause is saved or the quote is resynchronized. */
export function mergeContractClauseDrafts(
  previous: readonly ContractClauseTextRecord[],
  local: Readonly<Record<string,ContractClauseTextDraft>>,
  next: readonly ContractClauseTextRecord[],
  submitted?: {id:string;draft:ContractClauseTextDraft},
): Record<string,ContractClauseTextDraft> {
  const previousById=new Map(previous.map(clause=>[clause.id,clause]));
  return Object.fromEntries(next.map(clause=>{
    const old=previousById.get(clause.id);
    const remote={title:clause.title,body:clause.body};
    const baseline=submitted?.id===clause.id?submitted.draft:old?{title:old.title,body:old.body}:remote;
    return [clause.id,{...mergeDraft(baseline,local[clause.id]??baseline,remote).value}];
  }));
}

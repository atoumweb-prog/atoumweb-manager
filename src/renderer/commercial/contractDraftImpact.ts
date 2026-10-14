import type {QuoteContractClause} from '../../shared/contractTerms';
import {compareClauseField} from './contractClauseFieldDiff';

export type DraftImpactKind='added'|'removed'|'enabled'|'excluded'|'moved'|'edited'|'orphaned'|'restored';
export interface DraftClauseImpact {id:string;title:string;kinds:DraftImpactKind[];}
/** Pure preview, never a replacement for saved/frozen contract text. */
export function compareDraftContractClauses(
  saved:readonly QuoteContractClause[], next:readonly QuoteContractClause[],
):DraftClauseImpact[]{
  // Fail closed when a malformed list repeats an identity: a summary must not silently hide a clause.
  if(new Set(saved.map(c=>c.id)).size!==saved.length||new Set(next.map(c=>c.id)).size!==next.length){
    throw new Error('Identifiants de clauses dupliqués dans la comparaison contractuelle.');
  }
  const oldById=new Map(saved.map(c=>[c.id,c]));
  const newById=new Map(next.map(c=>[c.id,c]));
  const impacts:DraftClauseImpact[]=[];
  for(const clause of next){
    const original=oldById.get(clause.id);
    if(!original){impacts.push({id:clause.id,title:clause.title,kinds:['added']});continue;}
    const kinds:DraftImpactKind[]=[];
    if(original.enabled!==clause.enabled)kinds.push(clause.enabled?'enabled':'excluded');
    if(original.sortOrder!==clause.sortOrder)kinds.push('moved');
    if(original.isOrphaned!==clause.isOrphaned)kinds.push(clause.isOrphaned?'orphaned':'restored');
    if(compareClauseField(original.title,clause.title).changed||compareClauseField(original.body,clause.body).changed)kinds.push('edited');
    if(kinds.length)impacts.push({id:clause.id,title:clause.title,kinds});
  }
  for(const original of saved){
    if(!newById.has(original.id))impacts.push({id:original.id,title:original.title,kinds:['removed']});
  }
  return impacts;
}

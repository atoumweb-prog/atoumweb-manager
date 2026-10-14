/** Read-only comparison of a saved clause with its local draft.
 * Returns bounded excerpts rather than copying entire legal texts into alerts.
 */
export interface ClauseFieldDifference {
  changed:boolean;
  beforeLength:number;
  afterLength:number;
  commonPrefix:number;
  removedExcerpt:string;
  addedExcerpt:string;
  truncated:boolean;
}
export function compareClauseField(before:string,after:string,maxExcerpt=120):ClauseFieldDifference {
  const limit=Number.isSafeInteger(maxExcerpt)&&maxExcerpt>=0?maxExcerpt:120;
  let prefix=0;
  while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
  let suffix=0;
  while(suffix<before.length-prefix&&suffix<after.length-prefix&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
  const removed=before.slice(prefix,before.length-suffix);
  const added=after.slice(prefix,after.length-suffix);
  return {
    changed:before!==after,beforeLength:before.length,afterLength:after.length,
    commonPrefix:prefix,removedExcerpt:removed.slice(0,limit),addedExcerpt:added.slice(0,limit),
    truncated:removed.length>limit||added.length>limit,
  };
}

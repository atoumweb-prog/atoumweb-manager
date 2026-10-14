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
  // Iterate by Unicode code point to avoid cutting surrogate pairs in excerpts.
  const original=Array.from(before),draft=Array.from(after);
  let prefix=0;
  while(prefix<original.length&&prefix<draft.length&&original[prefix]===draft[prefix])prefix++;
  let suffix=0;
  while(suffix<original.length-prefix&&suffix<draft.length-prefix&&original[original.length-1-suffix]===draft[draft.length-1-suffix])suffix++;
  const removed=original.slice(prefix,original.length-suffix);
  const added=draft.slice(prefix,draft.length-suffix);
  return {
    changed:before!==after,beforeLength:before.length,afterLength:after.length,
    commonPrefix:prefix,removedExcerpt:removed.slice(0,limit).join(''),addedExcerpt:added.slice(0,limit).join(''),
    truncated:removed.length>limit||added.length>limit,
  };
}

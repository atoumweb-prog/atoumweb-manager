/** Explicit distinction between legacy quote compilation and 05C canonical compilation.
 * A partial editorial classification cannot silently switch historical quote behavior.
 */
export type CanonicalContractMode='legacy'|'canonical'|'requires_review';
export function decideCanonicalContractMode(input:{
  explicitOptIn:boolean;hasApprovedClassification:boolean;assemblyReady:boolean;
}):CanonicalContractMode{
  if(input.explicitOptIn)return input.assemblyReady&&input.hasApprovedClassification?'canonical':'requires_review';
  return input.assemblyReady&&input.hasApprovedClassification?'canonical':'legacy';
}

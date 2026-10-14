/** Validated editorial structure for future DRAFT contracts only.
 * The absence of a reviewed classification must never be inferred from product family.
 * This module does not mutate contracts, clauses, database rows or frozen snapshots.
 */
export const CONTRACT_SECTION_ORDER = [
  'object', 'scope', 'execution', 'delivery', 'finance', 'rights', 'recurring', 'end',
] as const;
export type ContractSectionKey = typeof CONTRACT_SECTION_ORDER[number];
export const CONTRACT_SECTION_LABELS: Record<ContractSectionKey,string> = {
  object:'Objet et parties',
  scope:'Périmètre et exclusions',
  execution:'Exécution et collaboration',
  delivery:'Délais, livraison et réception',
  finance:'Conditions financières',
  rights:'Droits, données et responsabilités',
  recurring:'Prestations récurrentes',
  end:'Fin de relation et dispositions finales',
};
export type ContractSectionReview =
  | {status:'unclassified';sectionKey:null;rankInSection:null}
  | {status:'proposed';sectionKey:ContractSectionKey;rankInSection:number;reason:string}
  | {status:'approved';sectionKey:ContractSectionKey;rankInSection:number;reviewer:string;reviewedAt:string};

export interface SectionedClause { id:string; section:ContractSectionReview }
export function validateSectionReview(review:ContractSectionReview): boolean {
  if(review.status==='unclassified')return review.sectionKey===null&&review.rankInSection===null;
  if(!CONTRACT_SECTION_ORDER.includes(review.sectionKey)||!Number.isSafeInteger(review.rankInSection)||review.rankInSection<0)return false;
  if(review.status==='proposed')return !!review.reason.trim();
  return !!review.reviewer.trim()&&!Number.isNaN(Date.parse(review.reviewedAt));
}
/** Return approved clauses in canonical order; unapproved suggestions never become published classifications. */
export function orderReviewedClauses<T extends SectionedClause>(clauses:readonly T[]): {ordered:T[];unreviewed:T[]} {
  const unreviewed=clauses.filter(c=>c.section.status!=='approved'||!validateSectionReview(c.section));
  const ordered=clauses.filter(c=>c.section.status==='approved'&&validateSectionReview(c.section)).sort((a,b)=>{
    if(a.section.status!=='approved'||b.section.status!=='approved')return 0;
    return CONTRACT_SECTION_ORDER.indexOf(a.section.sectionKey)-CONTRACT_SECTION_ORDER.indexOf(b.section.sectionKey)
      ||a.section.rankInSection-b.section.rankInSection||a.id.localeCompare(b.id);
  });
  return {ordered,unreviewed};
}

/** Applicability is tri-state: missing commercial inputs are NEVER treated as true. */
export interface ContractApplicabilityRule {
  audience?: 'professional'|'consumer';
  requiredProductCodes?: readonly string[];
  requiredOptionCodes?: readonly string[];
  minQuantity?: number;
  planCode?: string;
  recurring?: boolean;
}
export interface ContractApplicabilityContext {
  audience?: 'professional'|'consumer';
  productCodes?: readonly string[];
  optionCodes?: readonly string[];
  quantity?: number;
  planCode?: string;
  recurring?: boolean;
}
export type ContractApplicabilityResult = 'eligible'|'ineligible'|'unresolved';
export function evaluateContractApplicability(rule:ContractApplicabilityRule,context:ContractApplicabilityContext): ContractApplicabilityResult {
  let unknown=false;
  const compare=(expected:unknown,actual:unknown)=>{
    if(actual===undefined||actual===null){unknown=true;return false;}
    return expected!==actual;
  };
  if(rule.audience!==undefined&&compare(rule.audience,context.audience))return 'ineligible';
  if(rule.planCode!==undefined&&compare(rule.planCode,context.planCode))return 'ineligible';
  if(rule.recurring!==undefined&&compare(rule.recurring,context.recurring))return 'ineligible';
  if(rule.minQuantity!==undefined){
    if(!Number.isSafeInteger(rule.minQuantity)||rule.minQuantity<1) return 'unresolved';
    if(context.quantity===undefined)unknown=true;
    else if(context.quantity<rule.minQuantity)return 'ineligible';
  }
  for(const [required,available] of [[rule.requiredProductCodes,context.productCodes],[rule.requiredOptionCodes,context.optionCodes]] as const){
    if(!required?.length)continue;
    if(available===undefined){unknown=true;continue;}
    if(required.some(code=>!available.includes(code)))return 'ineligible';
  }
  return unknown?'unresolved':'eligible';
}

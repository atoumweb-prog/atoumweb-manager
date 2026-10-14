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

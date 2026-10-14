import type { CatalogVersion, CatalogCommercialParameters } from './commercial';
import type { CatalogVersionDifference } from './catalogVersionReview';

const FIELDS: readonly (readonly [keyof CatalogCommercialParameters,string])[] = [
  ['clientNeed','Besoin client'],['benefits','Bénéfices client'],
  ['salesPitch','Argumentaire commercial'],
  ['qualificationQuestions','Questions de qualification'],
  ['relevantSituations','Situations pertinentes'],
  ['commercialCautions','Vigilances commerciales'],
  ['objections','Objections et réponses'],
];

/** Compare stored version snapshots, not mutable React drafts or contractual clauses. */
export function compareCatalogSalesAdvice(
  prior:Pick<CatalogVersion,'commercialParameters'|'internalAdvice'>|null,
  next:Pick<CatalogVersion,'commercialParameters'|'internalAdvice'>,
):CatalogVersionDifference[] {
  const diff:CatalogVersionDifference[]=[];
  for(const [field,label] of FIELDS) {
    const previous=prior?.commercialParameters?.[field]?.trim()||'—';
    const proposed=next.commercialParameters?.[field]?.trim()||'—';
    if(previous!==proposed)diff.push({field:'commercialParameters.'+field,label,previous,proposed});
  }
  const before=prior?.internalAdvice?.trim()||'—';
  const after=next.internalAdvice?.trim()||'—';
  if(before!==after)diff.push({field:'internalAdvice',label:'Conseils internes',previous:before,proposed:after});
  return diff;
}

import type { CatalogRecommendationLink, QuoteLine } from './commercial';

export type QuoteRecommendationState =
  | 'included' | 'option-available' | 'option-purchased' | 'already-added'
  | 'recommended' | 'unavailable';

interface SnapshotComponent {serviceItemId?:unknown;componentId?:unknown;isOptional?:unknown}
function offerComponents(source:QuoteLine):SnapshotComponent[] {
  const raw=source.snapshot?.offerComponents;
  return Array.isArray(raw)?raw.filter((v):v is SnapshotComponent=>Boolean(v)&&typeof v==='object'):[];
}

/** Strictly descriptive: this function never mutates a Quote, Contract or Project. */
/**
 * F71a (décision de Carlos du 16/11/2026) : une suggestion vise la prestation et prend sa version publiée,
 * comme l'assistant de devis ; une prestation suggérée plusieurs fois n'apparaît qu'une fois. Aucune donnée réécrite.
 */
export function resolveRecommendationTargets(links:readonly CatalogRecommendationLink[]):CatalogRecommendationLink[] {
  const seen=new Set<string>();
  return links.flatMap(link=>{
    if(seen.has(link.targetItemId))return [];
    seen.add(link.targetItemId);
    if(!link.targetPublishedVersionId||link.targetPublishedVersionId===link.targetVersionId)return [link];
    return [{...link,targetVersionId:link.targetPublishedVersionId,targetVersionNumber:link.targetPublishedVersionNumber??link.targetVersionNumber,targetVersionStatus:'published'}];
  });
}
export function quoteRecommendationState(
  source:QuoteLine,
  target:CatalogRecommendationLink,
  lines:readonly QuoteLine[],
):QuoteRecommendationState {
  const sameItem=(line:QuoteLine)=>line.catalogItemId===target.targetItemId
    ||line.snapshot?.itemId===target.targetItemId;
  const included=offerComponents(source).find(c=>c.serviceItemId===target.targetItemId);
  if(included && !included.isOptional)return 'included';
  if(included?.isOptional) {
    if(lines.some(line=>line.optionPurchase?.state==='purchased'
      &&line.optionPurchase.sourceOfferLineId===source.id
      &&line.optionPurchase.sourceComponentId===included.componentId
      &&(typeof source.catalogVersionId==='string' ? line.optionPurchase.sourceOfferVersionId===source.catalogVersionId
        : typeof source.snapshot?.versionId==='string' ? line.optionPurchase.sourceOfferVersionId===source.snapshot.versionId
        : false)
      &&sameItem(line)))return 'option-purchased';
    // A service already present on a separate Quote line is not an unpurchased
    // option to buy again. Preserve the original provenance of that line.
    if(lines.some(line=>line.id!==source.id&&sameItem(line)))return 'already-added';
    return 'option-available';
  }
  if(lines.some(line=>line.id!==source.id&&sameItem(line)))return 'already-added';
  if(target.targetVersionStatus!=='published'||target.targetItemStatus!=='active')
    return 'unavailable';
  return 'recommended';
}
export const QUOTE_RECOMMENDATION_STATE_LABELS:Record<QuoteRecommendationState,string>={
  included:'Inclus dans l’offre',
  'option-available':'Option disponible — non achetée',
  'option-purchased':'Option achetée',
  'already-added':'Déjà ajouté au devis',
  recommended:'Recommandé — non ajouté',
  unavailable:'Indisponible — version retirée ou prestation inactive',
};

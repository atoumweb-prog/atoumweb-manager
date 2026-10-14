/**
 * 04D — Pure catalogue association rules.
 * No implicit changes to quotes, contracts, or historical published versions.
 */
export interface CatalogRecommendationCandidate {
  targetVersionId: string;
  targetItemId: string;
  status: 'draft' | 'published' | 'retired';
  itemStatus: 'active' | 'inactive' | 'archived';
  includedComponent?: boolean;
}
export interface CatalogRecommendation {
  targetVersionId: string;
  targetItemId: string;
}
export const normalizeCatalogRecommendations = (
  sourceItemId: string,
  candidates: readonly CatalogRecommendationCandidate[],
): CatalogRecommendation[] => {
  const seenItems = new Set<string>();
  const result: CatalogRecommendation[] = [];
  for (const candidate of candidates) {
    if (candidate.targetItemId === sourceItemId) continue;
    if (candidate.status !== 'published' || candidate.itemStatus !== 'active') continue;
    if (candidate.includedComponent) continue;
    if (!candidate.targetItemId.trim() || !candidate.targetVersionId.trim()) continue;
    if (seenItems.has(candidate.targetItemId)) continue;
    seenItems.add(candidate.targetItemId);
    result.push({
      targetItemId: candidate.targetItemId,
      targetVersionId: candidate.targetVersionId,
    });
  }
  return result;
};

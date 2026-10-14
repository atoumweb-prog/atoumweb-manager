import { describe, expect, it } from 'vitest';
import { normalizeCatalogRecommendations } from './catalogRecommendationRules';

describe('04D — recommendations cannot duplicate or implicitly alter included services', () => {
  it('filters unpublished, archived, self and included candidates', () => {
    const result = normalizeCatalogRecommendations('source', [
      {targetItemId:'source',targetVersionId:'v0',status:'published',itemStatus:'active'},
      {targetItemId:'other',targetVersionId:'v1',status:'draft',itemStatus:'active'},
      {targetItemId:'other',targetVersionId:'v2',status:'published',itemStatus:'active'},
      {targetItemId:'other',targetVersionId:'v3',status:'published',itemStatus:'active'},
      {targetItemId:'included',targetVersionId:'v4',status:'published',itemStatus:'active',includedComponent:true},
      {targetItemId:'archived',targetVersionId:'v5',status:'published',itemStatus:'archived'},
    ]);
    expect(result).toEqual([{targetItemId:'other',targetVersionId:'v2'}]);
  });
  it('does not mutate caller data', () => {
    const candidates = [{targetItemId:'x',targetVersionId:'v1',status:'published' as const,itemStatus:'active' as const}];
    expect(normalizeCatalogRecommendations('source',candidates)).toHaveLength(1);
    expect(candidates).toHaveLength(1);
  });
});

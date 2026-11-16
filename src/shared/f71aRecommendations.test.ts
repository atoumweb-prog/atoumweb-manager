import { describe, expect, it } from 'vitest';
import type { CatalogRecommendationLink } from './commercial';
import { resolveRecommendationTargets } from './quoteRecommendationStatus';

/** F71a (décision de Carlos du 16/11/2026) : une suggestion vise la prestation et prend sa version publiée. */
const link = (props: Partial<CatalogRecommendationLink> = {}): CatalogRecommendationLink => ({
  id: 'link', sourceVersionId: 'offer-v1', targetVersionId: 'service-v1', targetItemId: 'service', targetName: 'Service',
  targetVersionNumber: 1, targetVersionStatus: 'published', targetItemStatus: 'active', sortOrder: 0, ...props,
});

describe('F71a : suggestions résolues sur la version publiée', () => {
  it('une suggestion sur une version retirée prend la version publiée de la prestation', () => {
    const [resolved] = resolveRecommendationTargets([link({ targetVersionId: 'service-v1', targetVersionStatus: 'retired', targetPublishedVersionId: 'service-v2', targetPublishedVersionNumber: 2 })]);
    expect(resolved).toMatchObject({ targetVersionId: 'service-v2', targetVersionNumber: 2, targetVersionStatus: 'published' });
  });

  it('sans version publiée, la suggestion reste telle quelle (indisponible)', () => {
    const [resolved] = resolveRecommendationTargets([link({ targetVersionStatus: 'retired', targetPublishedVersionId: null })]);
    expect(resolved).toMatchObject({ targetVersionId: 'service-v1', targetVersionStatus: 'retired' });
  });

  it('une prestation suggérée deux fois n’apparaît qu’une fois, à sa première place', () => {
    const rows = resolveRecommendationTargets([
      link({ id: 'a', targetItemId: 'page', targetName: 'Page' }),
      link({ id: 'b', targetItemId: 'maint', targetName: 'Maintenance' }),
      link({ id: 'c', targetItemId: 'page', targetName: 'Page' }),
    ]);
    expect(rows.map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('une suggestion déjà sur la version publiée ne change pas', () => {
    const original = link({ targetPublishedVersionId: 'service-v1', targetPublishedVersionNumber: 1 });
    expect(resolveRecommendationTargets([original])[0]).toEqual(original);
  });
});

import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary } from '../../shared/commercial';
import {
  catalogAdminCategories,
  catalogAdminFiltered,
  catalogAdminMatches,
  normalizeCatalogSearch,
  type CatalogAdminFilters,
} from './catalogAdminFilters';

function item(
  id: string,
  name: string,
  extra: Partial<CatalogItemSummary> = {},
): CatalogItemSummary {
  return {
    id,
    type: 'service',
    name,
    category: 'SEO',
    status: 'active',
    visiblePublic: false,
    createdAt: '2026-10-14T08:00:00Z',
    updatedAt: '2026-10-14T08:00:00Z',
    currentVersion: {
      id: id + '-v1',
      itemId: id,
      versionNumber: 1,
      status: 'published',
      createdAt: '2026-10-14T08:00:00Z',
      priceMode: 'fixed',
      priceCents: 12900,
    },
    ...extra,
  };
}

const filters: CatalogAdminFilters = {
  query: '',
  type: 'all',
  status: 'all',
  category: 'all',
};

describe('Lot 04B — recherche et filtres administration Catalogue', () => {
  it('ignore accents/casse/espaces sans perdre la recherche littérale', () => {
    expect(normalizeCatalogSearch('  VIsibilité   Googlé  ')).toBe('visibilite google');
    expect(catalogAdminMatches(item('a', 'Visibilité Google'), { ...filters, query: 'visibilite google' })).toBe(true);
    expect(catalogAdminMatches(item('a', 'Visibilité Google'), { ...filters, query: 'facturation' })).toBe(false);
  });

  it('recherche les codes canoniques et Abby sans les imposer comme libellés UI', () => {
    const entry = item('a', 'Audit', {
      canonicalCode: 'AW-SEO-AUDIT',
      currentVersion: {
        id: 'v1', itemId: 'a', versionNumber: 1, status: 'published', createdAt: '',
        priceMode: 'fixed', priceCents: 10000, abbyLabel: 'Contrôle visuel référencement',
      },
    });
    expect(catalogAdminMatches(entry, { ...filters, query: 'AW-SEO-AUDIT' })).toBe(true);
    expect(catalogAdminMatches(entry, { ...filters, query: 'controle visuel' })).toBe(true);
  });

  it('utilise besoin client et travail de commercialParameters réellement présents', () => {
    const entry = item('a', 'Diagnostic local', {
      currentVersion: {
        id: 'v1', itemId: 'a', versionNumber: 1, status: 'published', createdAt: '',
        priceMode: 'fixed', priceCents: 10000,
        commercialParameters: { clientNeed: 'Visibilité Google', work: 'Optimisation locale' },
      },
    });
    expect(catalogAdminMatches(entry, { ...filters, query: 'VISIBILITE GOOGLE' })).toBe(true);
    expect(catalogAdminMatches(entry, { ...filters, query: 'optimisation locale' })).toBe(true);
    expect(catalogAdminMatches(entry, { ...filters, query: 'résultat garanti' })).toBe(false);
  });

  it('préserve le filtrage par type, état et catégorie principale stockée', () => {
    const active = item('a', 'Site vitrine', { type: 'offer', category: 'WEB' });
    const archived = item('b', 'Retouche photos', { status: 'archived', category: 'PHOTO' });
    const items = [active, archived];
    expect(catalogAdminFiltered(items, { query: '', status: 'archived', category: 'PHOTO', type: 'service' }).map(x=>x.id)).toEqual(['b']);
    expect(catalogAdminFiltered(items, { query: '', status: 'active', category: 'PHOTO', type: 'all' })).toHaveLength(0);
    expect(catalogAdminFiltered(items, filters)).toHaveLength(2);
  });

  it('ordonne les catégories par les libellés français et conserve les codes stockés', () => {
    const categories = catalogAdminCategories([
      item('z', 'Z', { category: 'SEO' }),
      item('b', 'B', { category: 'CONTENU' }),
      item('a', 'A', { category: 'IDENTITE' }),
      item('x', 'X', { category: 'SEO' }),
    ]);
    expect(categories).toEqual(['CONTENU', 'IDENTITE', 'SEO']);
  });

  it('ne propose pas une catégorie vide et n’altère pas les items ni leurs versions', () => {
    const a = item('a', 'A', { category: null, status: 'archived' });
    const b = item('b', 'B', { category: 'SEO' });
    const arr = Object.freeze([a, b]);
    expect(catalogAdminCategories(arr)).toEqual(['SEO']);
    expect(catalogAdminFiltered(arr, filters)).toHaveLength(2);
    expect(a.category).toBeNull();
    expect(a.status).toBe('archived');
    expect(b.currentVersion?.status).toBe('published');
  });

  it('recherche un brouillon uniquement en administration, sans le rendre publiable automatiquement', () => {
    const draft = item('draft', 'Projet SEO', {
      currentVersion: {
        id: 'd1', itemId: 'draft', versionNumber: 1, status: 'draft',
        priceMode: 'quote_only', createdAt: '', description: 'Optimisation Search Console',
      },
    });
    expect(catalogAdminMatches(draft, { ...filters, query: 'search console' })).toBe(true);
    expect(draft.currentVersion?.status).toBe('draft');
  });
});

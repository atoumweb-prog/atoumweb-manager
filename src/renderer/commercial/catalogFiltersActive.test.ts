import { describe, expect, it } from 'vitest';
import { defaultCatalogContext } from '../../shared/catalogTableContext';
import { catalogFiltersActive } from './catalogFiltersActive';

describe('R8 : une seule définition de « filtre actif » du Catalogue (M3)', () => {
  it('le contexte par défaut n’a aucun filtre actif', () => {
    expect(catalogFiltersActive(defaultCatalogContext())).toBe(false);
  });

  it('la taille de page et une recherche d’espaces ne sont pas des filtres', () => {
    expect(catalogFiltersActive({ ...defaultCatalogContext(), pageSize: 50 })).toBe(false);
    expect(catalogFiltersActive({ ...defaultCatalogContext(), pageSize: 100 })).toBe(false);
    expect(catalogFiltersActive({ ...defaultCatalogContext(), query: '   ' })).toBe(false);
  });

  it.each([
    ['query', { query: 'seo' }],
    ['type', { type: 'offer' as const }],
    ['itemStatus', { itemStatus: 'archived' as const }],
    ['category', { category: 'Sites web' }],
    ['family', { family: 'f-1' }],
    ['versionState', { versionState: 'draft' as const }],
    ['visibility', { visibility: 'public' as const }],
  ])('%s compte comme un filtre', (_name, patch) => {
    expect(catalogFiltersActive({ ...defaultCatalogContext(), ...patch })).toBe(true);
  });
});

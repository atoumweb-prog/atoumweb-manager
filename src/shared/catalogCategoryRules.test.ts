import { describe, expect, it } from 'vitest';
import { catalogCategoryCollisions, normalizeCatalogCategory } from './catalogCategoryRules';

describe('Lot 04B / E95 — noms de catégorie, contrôles sans effet métier', () => {
  it('nettoie les espaces Unicode et les variantes de casse', () => {
    expect(normalizeCatalogCategory('  Création\u00a0  de\u202f contenu  ')).toEqual({
      label: 'Création de contenu', normalizedKey: 'creation de contenu',
    });
    expect(normalizeCatalogCategory(' CRÉATION DE CONTENU ').normalizedKey).toBe('creation de contenu');
  });

  it('refuse vide, long et caractères de contrôle sans toucher aux données', () => {
    expect(() => normalizeCatalogCategory('  ')).toThrow(/entre 1 et 80/);
    expect(() => normalizeCatalogCategory('X'.repeat(81))).toThrow(/entre 1 et 80/);
    expect(() => normalizeCatalogCategory('SEO\nAutre')).toThrow(/contrôle/);
    expect(() => normalizeCatalogCategory('A\u0000B')).toThrow(/contrôle/);
  });

  it('signale doublons casse/accents/espaces au lieu de les réunir automatiquement', () => {
    expect(catalogCategoryCollisions(['SEO', ' Seo  ', 'SÉO', 'CONTENU'])).toEqual([
      { normalizedKey: 'seo', legacyValues: [' Seo  ', 'SÉO', 'SEO'] },
    ]);
  });

  it('préserve les anciennes valeurs d’affichage différentes sans les assimiler par alias', () => {
    const records = ['SEO', 'SEO / Visibilité', 'TECH', 'Contenu'];
    expect(catalogCategoryCollisions(records)).toEqual([]);
    expect(records[0]).toBe('SEO');
    expect(records[1]).toBe('SEO / Visibilité');
  });

  it('ignore l’absence de catégorie et respecte les objets originaux', () => {
    const values = Object.freeze(['Contenu', null, undefined, '  ', 'contenu']);
    expect(catalogCategoryCollisions(values)).toEqual([
      { normalizedKey: 'contenu', legacyValues: ['Contenu', 'contenu'] },
    ]);
    expect(values[0]).toBe('Contenu');
  });
});

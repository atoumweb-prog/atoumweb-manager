import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary } from '../../shared/commercial';
import { buildCatalogCategoryInventory } from './catalogCategoryInventoryModel';
import { CatalogCategoryInventory } from './CatalogCategoryInventory';

function item(id: string, category: string | null, status: CatalogItemSummary['status'] = 'active'): CatalogItemSummary {
  return {
    id, name: id, category, status, type: 'service', visiblePublic: false,
    createdAt: '', updatedAt: '', currentVersion: null,
  };
}

describe('Lot 04B — catégories réellement persistées : inventaire non destructif', () => {
  it('compte actifs, archivés, non classés et préserve les catégories brutes', () => {
    const items = [
      item('1', 'SEO'), item('2', 'SEO', 'archived'), item('3', null),
      item('4', ' CONTENU '), item('5', 'CONTENU'), item('6', '   '),
    ];
    const before = JSON.stringify(items);
    const result = buildCatalogCategoryInventory(items);
    expect(result.unassignedCount).toBe(2);
    expect(result.rows).toHaveLength(3);
    expect(result.rows.find(row => row.rawValue === 'SEO')).toMatchObject({
      count: 2, activeCount: 1, archivedCount: 1,
    });
    expect(result.rows.find(row => row.rawValue === ' CONTENU ')).toBeDefined();
    expect(result.rows.find(row => row.rawValue === 'CONTENU')).toBeDefined();
    expect(result.normalizedConflictGroups).toHaveLength(1);
    expect(JSON.stringify(items)).toBe(before);
  });

  it('signale un alias identique sans fusionner les deux catégories réellement différentes', () => {
    const result = buildCatalogCategoryInventory([
      item('a', 'SEO'), item('b', 'SEO / Visibilité'),
    ]);
    expect(result.rows.map(row => row.rawValue)).toHaveLength(2);
    expect(result.displayAliasConflictGroups).toEqual([['SEO', 'SEO / Visibilité']]);
    expect(result.normalizedConflictGroups).toHaveLength(0);
    expect(result.rows.every(row => row.displayAliasCollision)).toBe(true);
  });

  it('préserve même une ancienne catégorie non conforme, en la signalant séparément', () => {
    const result = buildCatalogCategoryInventory([
      item('x', 'Catégorie\nancienne'), item('y', 'SEO'),
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.find(row => row.rawValue.includes('\n'))?.count).toBe(1);
  });

  it('rend une liste consultable par catégorie sans boutons de migration, renommage ou archivage', () => {
    const html = renderToStaticMarkup(createElement(CatalogCategoryInventory, {
      items: [item('x', 'SEO'), item('y', 'SEO / Visibilité'), item('z', null)],
      onFilter: () => {}, onClose: () => {},
    }));
    expect(html).toContain('Inventaire de lecture seule');
    expect(html).toContain('À réconcilier');
    expect(html).toContain('Voir les prestations');
    expect(html).toContain('Sans catégorie');
    expect(html).not.toContain('Renommer cette catégorie');
    expect(html).not.toContain('Supprimer');
  });
});

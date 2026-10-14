import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary } from '../../shared/commercial';
import { CatalogOverview } from './CatalogOverview';

function makeItem(id: string, name: string, config: {
  type?: CatalogItemSummary['type'];
  code?: string;
  status?: CatalogItemSummary['status'];
  versionStatus?: 'draft'|'published'|'retired';
  inclusions?: string[];
  description?: string;
} = {}): CatalogItemSummary {
  return {
    id, name, type: config.type ?? 'offer', status: config.status ?? 'active',
    category: 'WEB', visiblePublic: false, canonicalCode: config.code ?? null,
    createdAt: '', updatedAt: '',
    currentVersion: {
      itemId: id, id: id + '-v1', versionNumber: 1, status: config.versionStatus ?? 'published',
      createdAt: '', priceMode: 'starting_from', priceCents: 69900,
      inclusions: config.inclusions ?? [],
      description: config.description,
    },
  };
}

function html(items: CatalogItemSummary[]): string {
  return renderToStaticMarkup(createElement(CatalogOverview, {
    items, formatPrice: () => 'Dès 699 €', onOpen: () => {},
  }));
}

describe('Lot 04B — cartes réellement présentées', () => {
  it('montre le descriptif/inclusions de la seule version publiée de l’offre prioritaire', () => {
    const result = html([makeItem('v', 'Site vitrine 5 pages', {
      code: 'AW-WEB-VITRINE', description: 'Site responsive.',
      inclusions: ['Hébergement un an', 'Formation', 'Autre inclus non résumé'],
    })]);
    expect(result).toContain('Offres principales');
    expect(result).toContain('Site vitrine 5 pages');
    expect(result).toContain('Site responsive.');
    expect(result).toContain('Hébergement un an');
    expect(result).toContain('Formation');
    expect(result).not.toContain('Autre inclus non résumé');
    expect(result).toContain('Tarif publié');
    expect(result).not.toContain('AW-WEB-VITRINE');
  });

  it('ne révèle pas les inclusions du brouillon non publié et ne présente pas un tarif comme publié', () => {
    const result = html([makeItem('v', 'Site vitrine 5 pages', {
      versionStatus: 'draft', description: 'Promesse non publiée',
      inclusions: ['Inclusion à vérifier'],
    })]);
    expect(result).toContain('Tarif non publié');
    expect(result).toContain('Brouillon');
    expect(result).not.toContain('Promesse non publiée');
    expect(result).not.toContain('Inclusion à vérifier');
  });

  it('distingue article archivé et version publiée sans l’appeler prestation disponible', () => {
    const result = html([makeItem('v', 'Site vitrine 5 pages', { status: 'archived' })]);
    expect(result).toContain('Archivé');
    expect(result).toContain('Tarif historique');
    expect(result).not.toContain('Tarif publié');
  });

  it('ne duplique pas les cartes et donne accès au bon ID sans code en tête', () => {
    const result = html([
      makeItem('v', 'Site vitrine', { code: 'AW-WEB-VITRINE' }),
      makeItem('b', 'Boutique WooCommerce', { code: 'AW-ECOM-BASE' }),
    ]);
    expect(result.match(/data-catalog-item-id=/g)).toHaveLength(2);
    expect(result).toContain('data-catalog-item-id="v"');
    expect(result).toContain('data-catalog-item-id="b"');
    expect(result).not.toContain('AW-WEB-VITRINE');
    expect(result).not.toContain('AW-ECOM-BASE');
  });
});

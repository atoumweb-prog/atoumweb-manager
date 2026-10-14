import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary } from '../../shared/commercial';
import { buildCataloguePresentation } from './catalogSections';
import { cataloguePrimaryCategoryLabel } from './catalogDisplay';

function item(
  id: string,
  name: string,
  options: {
    type?: CatalogItemSummary['type'];
    category?: string | null;
    canonicalCode?: string;
    familyCode?: string;
    commercialKind?: 'offer' | 'service' | 'option' | 'pack' | 'subscription';
    status?: CatalogItemSummary['status'];
    versionStatus?: 'draft' | 'published' | 'retired';
  } = {},
): CatalogItemSummary {
  return {
    id,
    name,
    type: options.type ?? 'service',
    category: options.category ?? null,
    canonicalCode: options.canonicalCode ?? null,
    status: options.status ?? 'active',
    visiblePublic: false,
    createdAt: '2026-10-14T08:00:00Z',
    updatedAt: '2026-10-14T08:00:00Z',
    currentVersion: {
      id: `version-${id}`,
      itemId: id,
      createdAt: '2026-10-14T08:00:00Z',
      versionNumber: 1,
      status: options.versionStatus ?? 'published',
      priceMode: 'fixed',
      priceCents: 10000,
      familyCode: options.familyCode ?? null,
      commercialKind: options.commercialKind ?? null,
    },
  };
}

describe('Lot 04B — vue organisée du catalogue, projection sans écriture', () => {
  it('met les quatre familles principales dans l’ordre décidé sans changer le type Service de la maintenance', () => {
    const items = [
      item('m', 'Maintenance WordPress mensuelle', { category: 'MAINT', canonicalCode: 'AW-MAINT-WP-M', commercialKind: 'subscription' }),
      item('e', 'Boutique WooCommerce', { type: 'offer', category: 'ECOM', canonicalCode: 'AW-ECOM-BASE' }),
      item('v', 'Site vitrine 5 pages', { type: 'offer', category: 'WEB', canonicalCode: 'AW-WEB-VITRINE' }),
      item('w', 'Mariage Essentiel', { type: 'offer', category: 'MARIAGE', canonicalCode: 'AW-MARIAGE-ESS' }),
    ];
    const result = buildCataloguePresentation(items);
    expect(result.featured.map((group) => group.title)).toEqual([
      'Site vitrine', 'Site e-commerce', 'Site mariage', 'Maintenance WordPress',
    ]);
    expect(result.featured.flatMap((group) => group.items).map((x) => x.id)).toEqual(['v', 'e', 'w', 'm']);
    expect(result.featured.at(-1)?.items[0].type).toBe('service');
    expect(result.serviceCategories).toEqual([]);
  });

  it('regroupe les formules Mariage et les variantes WordPress sans doublon', () => {
    const items = [
      item('h', 'Mariage Histoire', { type: 'offer', canonicalCode: 'AW-MARIAGE-HISTOIRE' }),
      item('g', 'Mariage Grand Jour', { type: 'offer', canonicalCode: 'AW-MARIAGE-GRAND' }),
      item('a', 'Maintenance WordPress annuelle', { canonicalCode: 'AW-MAINT-WP-A', commercialKind: 'subscription' }),
      item('m', 'Maintenance WordPress mensuelle', { canonicalCode: 'AW-MAINT-WP-M', commercialKind: 'subscription' }),
    ];
    const groups = buildCataloguePresentation(items);
    expect(groups.featured[0].title).toBe('Site mariage');
    expect(groups.featured[0].items.map((x) => x.id)).toEqual(['g', 'h']);
    expect(groups.featured[1].items.map((x) => x.id)).toEqual(['a', 'm']);
    expect(groups.featured.flatMap((g) => g.items).length).toBe(items.length);
  });

  it('préserve les offres non prioritaires et les services par catégorie française', () => {
    const items = [
      item('l', 'Landing Page', { type: 'offer', category: 'LANDING' }),
      item('s', 'Audit SEO', { category: 'SEO' }),
      item('p', 'Retouche photos', { category: 'PHOTO' }),
      item('c', 'Article de blog', { category: 'CONTENU' }),
    ];
    const out = buildCataloguePresentation(items);
    expect(out.featured).toHaveLength(0);
    expect(out.otherOffers.map((x) => x.id)).toEqual(['l']);
    expect(out.serviceCategories.map((x) => x.title)).toEqual([
      'Contenu', 'Photographie', 'Référencement et visibilité',
    ]);
  });

  it('trie les services A–Z en français à l’intérieur de chaque catégorie', () => {
    const out = buildCataloguePresentation([
      item('z', 'Zèbre', { category: 'CONTENU' }),
      item('a', 'Écriture', { category: 'CONTENU' }),
      item('b', 'Article', { category: 'CONTENU' }),
    ]);
    expect(out.serviceCategories[0].items.map((x) => x.id)).toEqual(['b', 'a', 'z']);
  });

  it('utilise la catégorie principale de l’item plutôt que le familyCode d’une version', () => {
    const service = item('x', 'Accompagnement', { category: 'SEO', familyCode: 'TECH' });
    expect(cataloguePrimaryCategoryLabel(service)).toBe('Référencement et visibilité');
    expect(buildCataloguePresentation([service]).serviceCategories[0].title).toBe('Référencement et visibilité');
  });

  it('place Sans catégorie après les catégories renseignées', () => {
    const out = buildCataloguePresentation([
      item('b', 'Sans catégorie'),
      item('a', 'Identité', { category: 'IDENTITE' }),
    ]);
    expect(out.serviceCategories.map((x) => x.title)).toEqual(['Identité visuelle', 'Sans catégorie']);
  });

  it('conserve les brouillons et éléments archivés dans les filtres d’administration', () => {
    const items = [
      item('d', 'Offre démo', { type: 'offer', status: 'archived', versionStatus: 'retired' }),
      item('b', 'Service brouillon', { versionStatus: 'draft', status: 'inactive' }),
    ];
    const out = buildCataloguePresentation(items);
    expect([...out.otherOffers, ...out.serviceCategories.flatMap((x) => x.items)].map((x) => x.id).sort()).toEqual(['b', 'd']);
    expect(items[0].status).toBe('archived');
    expect(items[1].currentVersion?.status).toBe('draft');
  });

  it('respecte strictement la sélection déjà filtrée par l’interface', () => {
    const a = item('a', 'Site vitrine', { type: 'offer' });
    const b = item('b', 'Page SEO', { category: 'SEO' });
    const out = buildCataloguePresentation([b]);
    expect(out.featured).toHaveLength(0);
    expect(out.serviceCategories.flatMap((x) => x.items).map((x) => x.id)).toEqual(['b']);
    expect(a.id).toBe('a');
  });

  it('ne transforme pas une prestation WordPress ordinaire en offre principale', () => {
    const a = item('a', 'Maintenance WordPress ponctuelle', { category: 'MAINT', commercialKind: 'option' });
    const out = buildCataloguePresentation([a]);
    expect(out.featured).toHaveLength(0);
    expect(out.serviceCategories[0].items[0].id).toBe('a');
  });

  it('reconnaît une offre sans code par son intitulé sans créer de code canonique', () => {
    const a = item('a', 'Site e-commerce personnalisé', { type: 'offer', category: 'ECOM' });
    const out = buildCataloguePresentation([a]);
    expect(out.featured.map((x) => x.id)).toEqual(['ecommerce']);
    expect(a.canonicalCode).toBeNull();
  });

  it('ne confond pas une offre thématique avec les quatre offres principales', () => {
    const items = [
      item('w', 'Optimisation WooCommerce', { type: 'offer', category: 'ECOM' }),
      item('m', 'Album photo mariage', { type: 'offer', category: 'PHOTO' }),
    ];
    const out = buildCataloguePresentation(items);
    expect(out.featured).toHaveLength(0);
    expect(out.otherOffers.map((entry) => entry.id)).toEqual(['m', 'w']);
  });

  it('préserve l’ordre et les contenus d’entrée sans modifier le tableau original', () => {
    const a = item('a', 'Zèbre', { category: 'CONTENU' });
    const b = item('b', 'Article', { category: 'CONTENU' });
    const input = Object.freeze([a, b]);
    const originalOrder = input.map((x) => x.id);
    expect(buildCataloguePresentation(input).serviceCategories[0].items.map((x) => x.id)).toEqual(['b', 'a']);
    expect(input.map((x) => x.id)).toEqual(originalOrder);
  });
});

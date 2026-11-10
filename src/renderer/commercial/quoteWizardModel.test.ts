import {describe, expect, it} from 'vitest';
import type {CatalogItemSummary} from '../../shared/commercial';
import type {ProspectSummary} from '../../shared/crm';
import {catalogSourceCode, prospectAcceptsQuote, quoteAdvice, quoteStartFromProspect, resolveSuggestions, wizardFamilies, wizardPriceLabel} from './quoteWizardModel';

const item = (name: string, type: 'offer' | 'service', category: string | null, extra: Partial<CatalogItemSummary> = {}, version: Record<string, unknown> = {}): CatalogItemSummary => ({
  id: name, name, type, category, status: 'active', visiblePublic: false, createdAt: '', updatedAt: '',
  currentVersion: {id: 'v-' + name, itemId: name, versionNumber: 1, status: 'published', createdAt: '', priceMode: 'fixed', priceCents: 69900, ...version},
  ...extra,
} as CatalogItemSummary);
const prospect = (extra: Partial<ProspectSummary> = {}): ProspectSummary => ({id: 'p', displayName: 'TEST', createdAt: '', updatedAt: '', stage: 'new', ...extra} as ProspectSummary);

describe('Lot 3 — assistant de devis', () => {
  it('regroupe par famille, fusionne les anciens libellés et place les familles avec offre en premier', () => {
    const families = wizardFamilies([
      item('Produit simple', 'service', 'E-commerce'),
      item('Boutique WooCommerce', 'offer', 'E-commerce WooCommerce', {}, {familyCode: 'ECOM'}),
      item('Article SEO', 'service', 'Contenu'),
      item('Site vitrine 5 pages', 'offer', 'Sites vitrines et options'),
      item('Sans famille', 'service', null),
    ]);
    expect(families.map(f => f.name)).toEqual(['E-commerce WooCommerce', 'Sites vitrines et options', 'Autres prestations', 'Contenus et rédaction']);
    expect(families[0].offers.map(i => i.name)).toEqual(['Boutique WooCommerce']);
    expect(families[0].services.map(i => i.name)).toEqual(['Produit simple']);
    expect(families[0].icon).toBe('wallet');
  });

  it('écrit les prix en clair, sans code ni version', () => {
    expect(wizardPriceLabel({priceMode: 'fixed', priceCents: 69900})).toBe('699 €');
    expect(wizardPriceLabel({priceMode: 'starting_from', priceCents: 149000})).toMatch(/^À partir de 1\s490 €$/);
    expect(wizardPriceLabel({priceMode: 'monthly', priceCents: 4900})).toBe('49 € / mois');
    expect(wizardPriceLabel({priceMode: 'yearly', priceCents: 53900})).toBe('539 € / an');
    expect(wizardPriceLabel({priceMode: 'quote_only', priceCents: null})).toBe('Sur devis');
    expect(wizardPriceLabel({priceMode: 'fixed', priceCents: null})).toBe('Sur devis');
    expect(wizardPriceLabel({priceMode: 'free', priceCents: null})).toBe('Offert');
  });

  it('retrouve le code source d’une fiche AW comme d’une formule V39', () => {
    expect(catalogSourceCode(item('a', 'offer', null, {canonicalCode: 'AW-WEB-VITRINE'}))).toBe('AW-WEB-VITRINE');
    expect(catalogSourceCode(item('b', 'offer', null, {}, {provenance: {reference: 'x', recordKey: 'V39-ECOM-BUSINESS'}}))).toBe('V39-ECOM-BUSINESS');
    expect(catalogSourceCode(item('c', 'offer', null))).toBeNull();
  });

  it('reprend le besoin du prospect ; un prospect vide ne bloque rien', () => {
    expect(quoteStartFromProspect(prospect())).toEqual({subject: '', needSummary: '', estimatedDelay: ''});
    expect(quoteStartFromProspect(prospect({primaryNeed: 'Site vitrine', initialRequest: 'Bonjour, je voudrais un site.'}))).toEqual({subject: 'Site vitrine', needSummary: 'Bonjour, je voudrais un site.', estimatedDelay: ''});
    const long = 'Refaire le site de la boulangerie, ajouter la commande en ligne et les horaires, avant les fêtes de fin d’année.';
    expect(quoteStartFromProspect(prospect({projectSummary: long, projectContext: 'Budget serré', timelineNote: 'Avant Noël'}))).toEqual({subject: '', needSummary: long + '\n\nBudget serré', estimatedDelay: 'Avant Noël'});
  });

  it('propose la version publiée actuelle de chaque option, sans rattachement à refaire', () => {
    // Le lien pointait vers l'ancienne version « v-ancienne » ; la fiche a depuis une nouvelle version publiée.
    const article = item('Article SEO', 'service', 'Contenu', {}, {id: 'v-nouvelle', priceCents: 14900});
    const maintenance = item('Maintenance', 'service', 'Maintenance', {}, {priceMode: 'monthly', priceCents: 4900});
    const brouillon = item('Brouillon', 'service', null, {}, {status: 'draft'});
    const suggestions = resolveSuggestions(
      [{targetItemId: 'Article SEO', status: 'active', reason: ' En supplément. '}, {targetItemId: 'Maintenance', status: 'paused'}, {targetItemId: 'Disparue', status: 'active'}, {targetItemId: 'Brouillon', status: 'active'}],
      [{serviceItemId: 'Maintenance', isOptional: true}, {serviceItemId: 'Article SEO', isOptional: true}, {serviceItemId: 'Brouillon', isOptional: false}],
      [article, maintenance, brouillon],
    );
    expect(suggestions).toEqual([
      {versionId: 'v-nouvelle', name: 'Article SEO', priceCents: 14900, priceLabel: '149 €', reason: 'En supplément.'},
      {versionId: 'v-Maintenance', name: 'Maintenance', priceCents: 4900, priceLabel: '49 € / mois', reason: ''},
    ]);
  });

  it('donne des conseils sans doublon et accepte un prospect neuf', () => {
    const advice = quoteAdvice(prospect(), false);
    expect(advice.length).toBeGreaterThan(3);
    expect(new Set(advice.map(a => a.key)).size).toBe(advice.length);
    expect(prospectAcceptsQuote(prospect())).toBe(true);
    expect(prospectAcceptsQuote(prospect({stage: 'lost'}))).toBe(false);
    expect(prospectAcceptsQuote(prospect({archivedAt: '2026-11-10'}))).toBe(false);
    expect(prospectAcceptsQuote(prospect({clientAccountId: 'c'}))).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary } from './commercial';
import type { Need } from './workflow';
import { planProspectQuoteLines, sameProspectQuotePlan } from './prospectPreQuotePlan';

const catalogItem = (id: string, priceCents: number | null, priceMode: 'fixed' | 'quote_only' | 'free' = 'fixed'): CatalogItemSummary =>
  ({
    id, name: id, status: 'active', type: 'service', visiblePublic: false,
    createdAt: '2026-10-13', updatedAt: '2026-10-13',
    currentVersion: { id: id + '-version', status: 'published', priceMode, priceCents },
  }) as CatalogItemSummary;
const need = (id: string, catalogItemId: string | null, otherText: string | null = null): Need =>
  ({ id, catalogItemId, otherText, label: id, type: 'service' });

describe('03C — plan des lignes du pré-devis', () => {
  it('n’ajoute que les besoins retenus, jamais une prestation suggérée', () => {
    const result = planProspectQuoteLines([need('selected','a')], [catalogItem('a',69900),catalogItem('suggested',14900)]);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].catalogVersionId).toBe('a-version');
    expect(result.missing).toEqual([]);
    expect(result.unpriced).toEqual([]);
  });

  it('refuse les besoins retirés ou non publiés au lieu de produire un devis incomplet', () => {
    const deleted = { ...catalogItem('unpublished',9900), currentVersion: null };
    const inactive = { ...catalogItem('inactive', 10000), status: 'inactive' as const };
    const retired = { ...catalogItem('retired', 15000), currentVersion: { ...catalogItem('retired',15000).currentVersion!, status: 'retired' as const } };
    const result = planProspectQuoteLines([need('gone','missing'),need('inactive','unpublished'),need('hidden','inactive'),need('retired','retired')], [deleted,inactive,retired]);
    expect(result.lines).toEqual([]);
    expect(result.missing).toEqual(['gone','inactive','hidden','retired']);
  });

  it('préserve la version catalogue, les prix à renseigner et le besoin libre', () => {
    const result = planProspectQuoteLines([
      need('offer','quoted'),need('custom',null,'  Retouches photo  '),need('free','gift'),
    ], [catalogItem('quoted',null,'quote_only'),catalogItem('gift',null,'free')]);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0]).toEqual({ catalogVersionId:'quoted-version',input:{label:'quoted',proposedUnitPriceCents:0} });
    expect(result.lines[1]).toEqual({ input:{label:'Retouches photo',catalogUnitPriceCents:0,proposedUnitPriceCents:0} });
    expect(result.lines[2].catalogVersionId).toBe('gift-version');
    expect(result.unpriced).toEqual(['offer','custom']);
    expect(result.missing).toEqual([]);
  });

  it('bloque un devis si le périmètre a changé après le contrôle : besoin, version ou prix', () => {
    const reviewed = planProspectQuoteLines([need('site', 'offer')], [catalogItem('offer', 69900)]);
    const identical = planProspectQuoteLines([need('site', 'offer')], [catalogItem('offer', 69900)]);
    expect(sameProspectQuotePlan(reviewed, identical)).toBe(true);

    const removed = planProspectQuoteLines([], [catalogItem('offer', 69900)]);
    expect(sameProspectQuotePlan(reviewed, removed)).toBe(false);
    const revisedCatalog = [{ ...catalogItem('offer', 79900),
      currentVersion: { ...catalogItem('offer', 79900).currentVersion!, id: 'offer-v2' } }];
    const revised = planProspectQuoteLines([need('site', 'offer')], revisedCatalog);
    expect(sameProspectQuotePlan(reviewed, revised)).toBe(false);
    const unpriced = planProspectQuoteLines([need('site', 'offer')], [catalogItem('offer', null, 'quote_only')]);
    expect(sameProspectQuotePlan(reviewed, unpriced)).toBe(false);
  });

  it('ne crée aucune ligne fantôme pour un besoin texte vide', () => {
    const result = planProspectQuoteLines([need('no-label',null,'   ')],[]);
    expect(result.lines).toHaveLength(0);
    expect(result.missing).toEqual(['no-label']);
  });
});

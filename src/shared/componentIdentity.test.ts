import { describe, expect, it } from 'vitest';
import { buildComponentIdentityV1, normalizeComponentKey, normalizeSlug } from './componentIdentity';

describe('Component Identity Contract V1', () => {
  it('construit une identité classifiée de famille et variante', () => {
    const identity = buildComponentIdentityV1({
      libraryDisplayName: 'Section bulles — Fleuriste',
      libraryItemId: 'item-1',
      libraryVersionId: 'version-4',
      libraryVersionNumber: 4,
      tags: ['fleuriste', 'services', 'fleuriste'],
      componentFamilyId: 'awcf:1234',
      componentKey: 'aw-feature-bubbles',
      libraryVariantId: 'awv:5678',
      variantKey: 'Florist',
      variantOf: 'aw-feature-bubbles',
      variantMode: 'inherit',
      vertical: 'Fleuriste',
      reusabilityScope: 'vertical',
    });

    expect(identity).toMatchObject({
      contract: 'atoumweb_component_identity',
      schemaVersion: 1,
      classificationStatus: 'classified',
      libraryDisplayName: 'Section bulles — Fleuriste',
      componentFamilyId: 'awcf:1234',
      componentKey: 'aw-feature-bubbles',
      libraryVariantId: 'awv:5678',
      variantKey: 'florist',
      variantOf: 'aw-feature-bubbles',
      variantMode: 'inherit',
      vertical: 'fleuriste',
      reusabilityScope: 'vertical',
      tags: ['fleuriste', 'services'],
    });
  });

  it('laisse volontairement un composant historique non classifié', () => {
    const identity = buildComponentIdentityV1({
      libraryDisplayName: 'Section — Mariage Why',
      libraryItemId: 'item-legacy',
      libraryVersionId: 'version-3',
      libraryVersionNumber: 3,
      tags: ['bridge', 'snapshot'],
    });

    expect(identity.classificationStatus).toBe('unclassified');
    expect(identity.componentKey).toBeNull();
    expect(identity.componentFamilyId).toBeNull();
    expect(identity.variantMode).toBe('none');
    expect(identity.reusabilityScope).toBe('unclassified');
  });

  it('ne transforme pas un nom métier arbitraire en component_key', () => {
    expect(normalizeComponentKey('Section — Mariage Why')).toBeNull();
    expect(normalizeComponentKey('atoum-mariage-why')).toBeNull();
    expect(normalizeComponentKey('aw-feature-bubbles')).toBe('aw-feature-bubbles');
  });

  it('normalise les slugs métier et variante', () => {
    expect(normalizeSlug('Pâtisserie Fine')).toBe('patisserie-fine');
    expect(normalizeSlug('Fleuriste')).toBe('fleuriste');
  });
});

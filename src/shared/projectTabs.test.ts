import { describe, expect, it } from 'vitest';
import { PROJECT_COMMERCIAL_MODES } from './projects';
import { commercialEmptyMessage, commercialModeLabel, limitItems, offeredValueCents, plural } from './projectTabs';

describe('R5b : règles des onglets du projet', () => {
  it('commercialModeLabel : un libellé français par mode', () => {
    expect(PROJECT_COMMERCIAL_MODES.map((mode) => commercialModeLabel(mode))).toEqual(['Tarif normal', 'Tarif remisé', 'Offert', 'Partenariat', 'Interne AtoumWeb']);
  });

  it('offeredValueCents : jamais négatif', () => {
    expect(offeredValueCents(69900, 59900)).toBe(10000);
    expect(offeredValueCents(69900, 69900)).toBe(0);
    expect(offeredValueCents(59900, 69900)).toBe(0);
  });

  it('commercialEmptyMessage : dit pourquoi', () => {
    expect(commercialEmptyMessage({ commercialMode: 'internal', sourceQuoteId: null })).toBe('Projet interne : pas de devis, donc pas de valeur commerciale.');
    expect(commercialEmptyMessage({ commercialMode: 'normal', sourceQuoteId: null })).toBe('Ce projet n’est pas lié à un devis : aucune prestation à afficher.');
    expect(commercialEmptyMessage({ commercialMode: 'normal', sourceQuoteId: 'q1' })).toBe('Aucune prestation rattachée à ce projet.');
  });

  it('limitItems : dit combien ne sont pas affichés', () => {
    expect(limitItems([1, 2, 3], 2)).toEqual({ shown: [1, 2], hidden: 1 });
    expect(limitItems([1, 2], 6)).toEqual({ shown: [1, 2], hidden: 0 });
    expect(limitItems([], 6)).toEqual({ shown: [], hidden: 0 });
  });

  it('plural : accord au singulier et au pluriel', () => {
    expect(plural(1, 'validé', 'validés')).toBe('1 validé');
    expect(plural(0, 'manquant', 'manquants')).toBe('0 manquant');
    expect(plural(2, 'validé', 'validés')).toBe('2 validés');
  });
});

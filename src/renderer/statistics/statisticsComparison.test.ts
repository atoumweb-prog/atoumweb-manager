import { describe, expect, it } from 'vitest';
import { allNewComparisons, compare, comparisonHelper, NO_PREVIOUS_PERIOD_NOTE } from './statisticsComparison';

describe('P4b (F35) : une ligne commune quand aucune période précédente n’est comparable', () => {
  it('toutes les comparaisons sont « Nouveau » : vrai', () => {
    expect(allNewComparisons([compare(5, 0), compare(3, 0)])).toBe(true);
    expect(allNewComparisons([compare(5, 0), compare(3, 0), compare(9, 0), compare(1, 0)])).toBe(true);
  });

  it('une seule vraie comparaison suffit à garder les lignes de chaque carte', () => {
    expect(allNewComparisons([compare(5, 0), compare(10, 5)])).toBe(false);
    expect(allNewComparisons([compare(5, 0), compare(5, 5)])).toBe(false);
    expect(allNewComparisons([compare(5, 0), compare(0, 0)])).toBe(false);
  });

  it('un seul élément, ou aucun : pas de ligne commune', () => {
    expect(allNewComparisons([compare(5, 0)])).toBe(false);
    expect(allNewComparisons([])).toBe(false);
    expect(allNewComparisons([undefined, undefined])).toBe(false);
  });

  it('les cartes sans comparaison sont ignorées', () => {
    expect(allNewComparisons([compare(5, 0), undefined, compare(3, 0)])).toBe(true);
  });

  it('le texte de la ligne commune', () => {
    expect(NO_PREVIOUS_PERIOD_NOTE).toBe('Pas de période précédente à comparer.');
    expect(NO_PREVIOUS_PERIOD_NOTE).not.toContain('(s)');
    expect(NO_PREVIOUS_PERIOD_NOTE).not.toContain('—');
  });
});

describe('R8 : comparaison des statistiques', () => {
  it('deux périodes à zéro : direction « same » et aucune aide à afficher', () => {
    expect(compare(0, 0).direction).toBe('same');
    expect(comparisonHelper(compare(0, 0))).toBeUndefined();
  });

  it('période précédente vide : « Nouveau sur la période » est gardé (vraie comparaison)', () => {
    expect(compare(5, 0).direction).toBe('new');
    expect(comparisonHelper(compare(5, 0))).toBe('Nouveau sur la période');
  });

  it('hausse et baisse chiffrées en pourcentage', () => {
    expect(comparisonHelper(compare(10, 5))).toMatch(/^\+100 % vs période précédente$|^\+ ?100 % vs/);
    expect(compare(10, 5).direction).toBe('up');
    expect(compare(5, 10).direction).toBe('down');
  });

  it('sans comparaison (aucune période précédente) : aucune aide', () => {
    expect(comparisonHelper(undefined)).toBeUndefined();
  });
});

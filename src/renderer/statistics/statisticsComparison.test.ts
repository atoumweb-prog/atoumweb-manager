import { describe, expect, it } from 'vitest';
import { compare, comparisonHelper } from './statisticsComparison';

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

import { describe, expect, it } from 'vitest';
import {
  inStatisticsRange,
  previousStatisticsPeriodRange,
  statisticsDelta,
  statisticsPeriodRange,
} from './statistics';

describe('statistics helpers', () => {
  const now = new Date('2026-09-23T12:00:00Z');

  it('calcule les bornes du mois et de la période précédente', () => {
    const current = statisticsPeriodRange('month', now);
    const previous = previousStatisticsPeriodRange('month', now);
    expect(current.label.toLocaleLowerCase('fr-FR')).toContain('septembre');
    expect(inStatisticsRange('2026-09-10T10:00:00Z', current)).toBe(true);
    expect(inStatisticsRange('2026-08-31T23:59:59Z', current)).toBe(false);
    expect(previous).not.toBeNull();
    expect(inStatisticsRange('2026-08-15T10:00:00Z', previous!)).toBe(true);
  });

  it('calcule les trimestres calendaires', () => {
    const range = statisticsPeriodRange('quarter', now);
    expect(inStatisticsRange('2026-07-01T00:00:00Z', range)).toBe(true);
    expect(inStatisticsRange('2026-09-30T23:00:00Z', range)).toBe(true);
    expect(inStatisticsRange('2026-10-01T00:00:00Z', range)).toBe(false);
  });

  it('gère les variations sans fabriquer de pourcentage quand la base vaut zéro', () => {
    expect(statisticsDelta(120, 100)).toBeCloseTo(20);
    expect(statisticsDelta(0, 0)).toBe(0);
    expect(statisticsDelta(10, 0)).toBeNull();
  });
});

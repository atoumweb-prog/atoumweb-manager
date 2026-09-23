import { describe, expect, it } from 'vitest';
import {
  inStatisticsRange,
  previousStatisticsPeriodRange,
  statisticsDelta,
  statisticsPeriodRange,
} from './statistics';

describe('statistics helpers', () => {
  // Les périodes statistiques suivent le calendrier local de l'utilisateur.
  // Utiliser des dates locales évite de rendre les tests dépendants du fuseau de la machine.
  const now = new Date(2026, 8, 23, 12, 0, 0);

  it('calcule les bornes du mois et de la période précédente', () => {
    const current = statisticsPeriodRange('month', now);
    const previous = previousStatisticsPeriodRange('month', now);
    expect(current.label.toLocaleLowerCase('fr-FR')).toContain('septembre');
    expect(inStatisticsRange('2026-09-10T10:00:00', current)).toBe(true);
    expect(inStatisticsRange('2026-08-31T23:59:59', current)).toBe(false);
    expect(previous).not.toBeNull();
    expect(inStatisticsRange('2026-08-15T10:00:00', previous!)).toBe(true);
  });

  it('calcule les trimestres calendaires', () => {
    const range = statisticsPeriodRange('quarter', now);
    expect(inStatisticsRange('2026-07-01T00:00:00', range)).toBe(true);
    expect(inStatisticsRange('2026-09-30T23:00:00', range)).toBe(true);
    expect(inStatisticsRange('2026-10-01T00:00:00', range)).toBe(false);
  });

  it('gère les variations sans fabriquer de pourcentage quand la base vaut zéro', () => {
    expect(statisticsDelta(120, 100)).toBeCloseTo(20);
    expect(statisticsDelta(0, 0)).toBe(0);
    expect(statisticsDelta(10, 0)).toBeNull();
  });
});

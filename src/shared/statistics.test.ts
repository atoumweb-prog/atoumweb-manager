import { resolveAnalyticsPeriod } from './analyticsPeriod';
import { describe, expect, it } from 'vitest';
import {
  inStatisticsRange,
  isStatisticsPipelineProspect,
  sortStatisticsClientsByInvoiced,
  sortStatisticsClients,
  statisticsQuoteAcceptancePercent,
  previousStatisticsPeriodRange,
  statisticsDelta,
  statisticsPeriodRange,
  statisticsSelectionRanges,
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

  it('affecte une session traversant deux mois au mois de son démarrage', () => {
    const current = statisticsPeriodRange('month', new Date(2026, 8, 15, 12));
    const previous = previousStatisticsPeriodRange('month', new Date(2026, 8, 15, 12));
    // Début local le 31 août, fin ultérieure en septembre : le filtre lit startedAt.
    expect(inStatisticsRange('2026-08-31T23:30:00', current)).toBe(false);
    expect(inStatisticsRange('2026-08-31T23:30:00', previous!)).toBe(true);
    expect(inStatisticsRange('2026-09-01T00:30:00', current)).toBe(true);
  });

  it('calcule les trimestres calendaires', () => {
    const range = statisticsPeriodRange('quarter', now);
    expect(inStatisticsRange('2026-07-01T00:00:00', range)).toBe(true);
    expect(inStatisticsRange('2026-09-30T23:00:00', range)).toBe(true);
    expect(inStatisticsRange('2026-10-01T00:00:00', range)).toBe(false);
  });

  it('harmonise les décisions de devis en incluant les expirés et sans inventer un taux vide', () => {
    expect(statisticsQuoteAcceptancePercent(1, 1, 1)).toBeCloseTo(33.3333, 3);
    expect(statisticsQuoteAcceptancePercent(1, 1, 0)).toBe(50);
    expect(statisticsQuoteAcceptancePercent(0, 0, 1)).toBe(0);
    expect(statisticsQuoteAcceptancePercent(0, 0, 0)).toBeNull();
  });

  it('sépare les contacts Annuaire et les dossiers clos du pipeline actif', () => {
    expect(isStatisticsPipelineProspect('new', null)).toBe(false);
    expect(isStatisticsPipelineProspect(undefined, null)).toBe(false);
    expect(isStatisticsPipelineProspect('qualifying', null)).toBe(true);
    expect(isStatisticsPipelineProspect('quote_sent', null)).toBe(true);
    expect(isStatisticsPipelineProspect('won', null)).toBe(false);
    expect(isStatisticsPipelineProspect('lost', null)).toBe(false);
    expect(isStatisticsPipelineProspect('negotiation', '2026-09-01T00:00:00Z')).toBe(false);
  });

  it('classe les clients par centimes sans additionner euros et secondes', () => {
    const input = [
      { label: 'Client B', invoiced: 0, seconds: 360000 },
      { label: 'Client A', invoiced: 30000, seconds: 600 },
      { label: 'Client C', invoiced: 30000, seconds: 900 },
    ];
    expect(sortStatisticsClientsByInvoiced(input).map((row) => row.label)).toEqual(['Client C', 'Client A', 'Client B']);
    expect(input[0].label).toBe('Client B');
    expect(sortStatisticsClients(input, 'seconds').map((row) => row.label)).toEqual(['Client B', 'Client C', 'Client A']);
    expect(input[0].label).toBe('Client B');
  });

  it('partage exactement les bornes calendaires des statistiques SQL et simples', () => {
    const checked = [
      { preset: 'today' as const },
      { preset: 'week' as const },
      { preset: 'month' as const },
      { preset: 'quarter' as const },
      { preset: 'year' as const },
      { preset: 'previous_year' as const },
      { preset: 'custom' as const, from: '2026-08-31', to: '2026-09-02' },
    ];
    const today = new Date('2026-09-23T12:00:00.000Z');
    const localDate = (isoTimestamp: string): string => {
      const date = new Date(isoTimestamp);
      return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    };
    for (const period of checked) {
      const resolved = statisticsSelectionRanges(period, today);
      const backend = resolveAnalyticsPeriod(period, today);
      expect(resolved).not.toBeNull();
      expect(localDate(resolved!.current.from!)).toBe(backend.from);
      expect(localDate(resolved!.current.to!)).toBe(backend.to);
      expect(localDate(resolved!.previous!.from!)).toBe(backend.comparisonFrom);
      expect(localDate(resolved!.previous!.to!)).toBe(backend.comparisonTo);
    }
  });

  it('respecte les deux jours inclusifs pour les dates personnalisées et préserve les cas invalides', () => {
    const ranges = statisticsSelectionRanges({ preset: 'custom', from: '2026-09-10', to: '2026-09-12' });
    expect(ranges).not.toBeNull();
    expect(inStatisticsRange('2026-09-10T00:00:00', ranges!.current)).toBe(true);
    expect(inStatisticsRange('2026-09-12T23:59:59', ranges!.current)).toBe(true);
    expect(inStatisticsRange('2026-09-13T00:00:00', ranges!.current)).toBe(false);
    expect(inStatisticsRange('2026-09-09T23:59:59', ranges!.previous!)).toBe(true);
    expect(statisticsSelectionRanges({ preset: 'custom', from: '2026-09-10' })).toBeNull();
    expect(statisticsSelectionRanges({ preset: 'custom', from: '2026-09-12', to: '2026-09-10' })).toBeNull();
    expect(statisticsSelectionRanges({ preset: 'custom', from: '2026-02-30', to: '2026-03-02' })).toBeNull();
  });

  it('ne crée jamais une comparaison fictive pour toutes les données', () => {
    const ranges = statisticsSelectionRanges({ preset: 'all' });
    expect(ranges?.current.label).toBe('Toutes les données');
    expect(ranges?.previous).toBeNull();
  });

  it('gère les variations sans fabriquer de pourcentage quand la base vaut zéro', () => {
    expect(statisticsDelta(120, 100)).toBeCloseTo(20);
    expect(statisticsDelta(0, 0)).toBe(0);
    expect(statisticsDelta(10, 0)).toBeNull();
  });
});

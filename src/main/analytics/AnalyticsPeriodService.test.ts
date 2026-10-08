import { describe, expect, it } from 'vitest';
import { resolveAnalyticsPeriod } from './AnalyticsPeriodService';

const NOW = new Date('2026-09-21T10:00:00.000Z');

describe('resolveAnalyticsPeriod', () => {
  it('résout le mois courant et la période précédente de même durée', () => {
    expect(resolveAnalyticsPeriod({ preset: 'month' }, NOW)).toEqual({
      preset: 'month',
      from: '2026-09-01',
      to: '2026-09-30',
      comparisonFrom: '2026-08-01',
      comparisonTo: '2026-08-31',
    });
  });

  it('résout la semaine du lundi au dimanche', () => {
    expect(resolveAnalyticsPeriod({ preset: 'week' }, NOW)).toEqual({
      preset: 'week',
      from: '2026-09-21',
      to: '2026-09-27',
      comparisonFrom: '2026-09-14',
      comparisonTo: '2026-09-20',
    });
  });

  it('résout le trimestre civil', () => {
    expect(resolveAnalyticsPeriod({ preset: 'quarter' }, NOW)).toEqual({
      preset: 'quarter',
      from: '2026-07-01',
      to: '2026-09-30',
      comparisonFrom: '2026-04-01',
      comparisonTo: '2026-06-30',
    });
  });

  it('résout l’année précédente et compare avec l’année antérieure', () => {
    expect(resolveAnalyticsPeriod({ preset: 'previous_year' }, NOW)).toEqual({
      preset: 'previous_year',
      from: '2025-01-01',
      to: '2025-12-31',
      comparisonFrom: '2024-01-01',
      comparisonTo: '2024-12-31',
    });
  });

  it('valide une période personnalisée', () => {
    expect(resolveAnalyticsPeriod({ preset: 'custom', from: '2026-09-10', to: '2026-09-20' }, NOW)).toEqual({
      preset: 'custom',
      from: '2026-09-10',
      to: '2026-09-20',
      comparisonFrom: '2026-08-30',
      comparisonTo: '2026-09-09',
    });
  });

  it('refuse une période personnalisée inversée', () => {
    expect(() => resolveAnalyticsPeriod({ preset: 'custom', from: '2026-09-20', to: '2026-09-10' }, NOW))
      .toThrow(/date de début/i);
  });
});

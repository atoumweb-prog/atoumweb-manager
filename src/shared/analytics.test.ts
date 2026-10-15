import { describe, expect, it } from 'vitest';
import { analyticsSnapshotMatchesSelection, validateAnalyticsCustomPeriod, type AnalyticsDateRange } from './analytics';

const SEPTEMBER: AnalyticsDateRange = {
  preset: 'month',
  from: '2026-09-01',
  to: '2026-09-30',
  comparisonFrom: '2026-08-01',
  comparisonTo: '2026-08-31',
};

describe('analyticsSnapshotMatchesSelection', () => {
  it('garde les données affichées quand le preset ne change pas', () => {
    expect(analyticsSnapshotMatchesSelection({ preset: 'month' }, SEPTEMBER)).toBe(true);
  });

  it('reconnaît une réponse du mois sous un nouveau filtre semaine', () => {
    expect(analyticsSnapshotMatchesSelection({ preset: 'week' }, SEPTEMBER)).toBe(false);
  });

  it('ne présente pas les données d une plage personnalisée sous une autre', () => {
    const custom = { ...SEPTEMBER, preset: 'custom' as const };
    expect(analyticsSnapshotMatchesSelection({ preset: 'custom', from: custom.from, to: custom.to }, custom)).toBe(true);
    expect(analyticsSnapshotMatchesSelection({ preset: 'custom', from: '2026-09-02', to: custom.to }, custom)).toBe(false);
    expect(analyticsSnapshotMatchesSelection({ preset: 'custom', from: custom.from, to: null }, custom)).toBe(false);
  });
});

describe('validateAnalyticsCustomPeriod', () => {
  it('refuse les dates impossibles et inversées sans requête', () => {
    expect(validateAnalyticsCustomPeriod({ preset: 'custom', from: '2026-02-30', to: '2026-03-01' })).toMatch(/valides/);
    expect(validateAnalyticsCustomPeriod({ preset: 'custom', from: '2026-09-20', to: '2026-09-10' })).toMatch(/début/);
    expect(validateAnalyticsCustomPeriod({ preset: 'custom', from: '2026-09-01', to: '2026-09-30' })).toBeNull();
    expect(validateAnalyticsCustomPeriod({ preset: 'custom', from: '2026-09-01' })).toBeNull();
    expect(validateAnalyticsCustomPeriod({ preset: 'year' })).toBeNull();
  });
});

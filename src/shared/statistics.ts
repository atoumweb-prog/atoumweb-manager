import type { AnalyticsPeriodInput } from './analytics';
import { validateAnalyticsCustomPeriod } from './analytics';
import { resolveAnalyticsPeriod } from './analyticsPeriod';

/** Decisions prises sur la période, suivant la date propre à chaque décision. */
export function statisticsQuoteAcceptancePercent(accepted: number, refused: number, expired: number): number | null {
  const decisions = accepted + refused + expired;
  return decisions > 0 ? (accepted / decisions) * 100 : null;
}

/** Le stade « new » appartient à l'Annuaire, non au pipeline commercial engagé. */
export function isStatisticsPipelineProspect(stage: string | null | undefined, archivedAt: string | null | undefined): boolean {
  return !archivedAt && !!stage && !['new', 'won', 'lost'].includes(stage);
}

/** Une colonne à la fois : jamais de score hybride centimes + secondes. */
export type StatisticsClientSortColumn = 'invoiced' | 'seconds';
export function sortStatisticsClients<T extends { invoiced: number; seconds: number; label: string }>(
  rows: T[], column: StatisticsClientSortColumn,
): T[] {
  const secondary = column === 'invoiced' ? 'seconds' : 'invoiced';
  return [...rows].sort((a, b) => b[column] - a[column] || b[secondary] - a[secondary] || a.label.localeCompare(b.label, 'fr'));
}
/** Reprise compatible avec les appels déjà publiés en 10A. */
export function sortStatisticsClientsByInvoiced<T extends { invoiced: number; seconds: number; label: string }>(rows: T[]): T[] {
  return sortStatisticsClients(rows, 'invoiced');
}

export const STATISTICS_PERIODS = ['month', 'quarter', 'year', 'all'] as const;

export type StatisticsPeriod = (typeof STATISTICS_PERIODS)[number];

export interface StatisticsRange {
  from: string | null;
  to: string | null;
  label: string;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function rangeLabel(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();
  if (sameMonth) return from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `${from.toLocaleDateString('fr-FR', { month: 'short', year: sameYear ? undefined : 'numeric' })} → ${to.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
}

export function statisticsPeriodRange(period: StatisticsPeriod, now = new Date()): StatisticsRange {
  if (period === 'all') return { from: null, to: null, label: 'Toutes les données' };

  let from: Date;
  let to: Date;
  if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    to = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  } else if (period === 'quarter') {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    from = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
    to = endOfDay(new Date(now.getFullYear(), quarterMonth + 3, 0));
  } else {
    from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    to = endOfDay(new Date(now.getFullYear(), 11, 31));
  }

  return { from: from.toISOString(), to: to.toISOString(), label: rangeLabel(from, to) };
}

export function previousStatisticsPeriodRange(period: StatisticsPeriod, now = new Date()): StatisticsRange | null {
  if (period === 'all') return null;
  if (period === 'month') return statisticsPeriodRange('month', new Date(now.getFullYear(), now.getMonth() - 1, 15));
  if (period === 'quarter') return statisticsPeriodRange('quarter', new Date(now.getFullYear(), now.getMonth() - 3, 15));
  return statisticsPeriodRange('year', new Date(now.getFullYear() - 1, 6, 1));
}

export function inStatisticsRange(value: string | null | undefined, range: StatisticsRange): boolean {
  if (!value) return false;
  if (!range.from && !range.to) return true;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  if (range.from && timestamp < new Date(range.from).getTime()) return false;
  if (range.to && timestamp > new Date(range.to).getTime()) return false;
  return true;
}

export function statisticsDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Période canonique du module Statistiques : "all" n'est pas compatible avec les agrégats SQL comparatifs. */
export type StatisticsPeriodSelection = AnalyticsPeriodInput | { preset: 'all' };

/** Même calendrier que AnalyticsService : bornes effectives visibles dans tous les onglets. */
export function statisticsSelectionRanges(
  selection: StatisticsPeriodSelection,
  now = new Date(),
): { current: StatisticsRange; previous: StatisticsRange | null } | null {
  if (selection.preset === 'all') {
    return { current: statisticsPeriodRange('all', now), previous: null };
  }
  if (selection.preset === 'custom' && (!selection.from || !selection.to || validateAnalyticsCustomPeriod(selection))) {
    return null;
  }
  const resolved = resolveAnalyticsPeriod(selection, now);
  const toRange = (fromDate: string, toDate: string): StatisticsRange => {
    const from = new Date(`${fromDate}T00:00:00.000`);
    const to = new Date(`${toDate}T23:59:59.999`);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: `${from.toLocaleDateString('fr-FR')} → ${to.toLocaleDateString('fr-FR')}`,
    };
  };
  return {
    current: toRange(resolved.from, resolved.to),
    previous: toRange(resolved.comparisonFrom, resolved.comparisonTo),
  };
}

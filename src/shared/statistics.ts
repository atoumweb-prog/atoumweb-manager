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

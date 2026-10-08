import type { AnalyticsDateRange, AnalyticsPeriodInput } from '../../shared/analytics';

function parseDateOnly(value: string, label: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} doit être au format AAAA-MM-JJ.`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || isoDate(date) !== value) throw new Error(`${label} est invalide.`);
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const day = date.getUTCDay() || 7;
  return addDays(date, 1 - day);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function startOfQuarter(date: Date): Date {
  const month = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), month, 1));
}

function endOfQuarter(date: Date): Date {
  const start = startOfQuarter(date);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 0));
}

function previousCustomRange(from: Date, to: Date): { comparisonFrom: string; comparisonTo: string } {
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const comparisonTo = addDays(from, -1);
  const comparisonFrom = addDays(comparisonTo, -(days - 1));
  return { comparisonFrom: isoDate(comparisonFrom), comparisonTo: isoDate(comparisonTo) };
}

export function resolveAnalyticsPeriod(input: AnalyticsPeriodInput, now = new Date()): AnalyticsDateRange {
  const today = parseDateOnly(isoDate(now), 'Date courante');
  let from: Date;
  let to: Date;
  let comparisonFrom: Date | null = null;
  let comparisonTo: Date | null = null;

  switch (input.preset) {
    case 'today':
      from = today;
      to = today;
      comparisonFrom = addDays(today, -1);
      comparisonTo = comparisonFrom;
      break;
    case 'week':
      from = startOfWeek(today);
      to = addDays(from, 6);
      comparisonFrom = addDays(from, -7);
      comparisonTo = addDays(from, -1);
      break;
    case 'month':
      from = startOfMonth(today);
      to = endOfMonth(today);
      comparisonFrom = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - 1, 1));
      comparisonTo = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 0));
      break;
    case 'quarter':
      from = startOfQuarter(today);
      to = endOfQuarter(today);
      comparisonFrom = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - 3, 1));
      comparisonTo = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 0));
      break;
    case 'year':
      from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      to = new Date(Date.UTC(today.getUTCFullYear(), 11, 31));
      comparisonFrom = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
      comparisonTo = new Date(Date.UTC(today.getUTCFullYear() - 1, 11, 31));
      break;
    case 'previous_year':
      from = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
      to = new Date(Date.UTC(today.getUTCFullYear() - 1, 11, 31));
      comparisonFrom = new Date(Date.UTC(today.getUTCFullYear() - 2, 0, 1));
      comparisonTo = new Date(Date.UTC(today.getUTCFullYear() - 2, 11, 31));
      break;
    case 'custom':
      if (!input.from || !input.to) throw new Error('Une période personnalisée nécessite une date de début et une date de fin.');
      from = parseDateOnly(input.from, 'Date de début');
      to = parseDateOnly(input.to, 'Date de fin');
      if (from.getTime() > to.getTime()) throw new Error('La date de début doit précéder ou être égale à la date de fin.');
      break;
    default: {
      const exhaustive: never = input.preset;
      throw new Error(`Période statistique inconnue : ${exhaustive}`);
    }
  }

  const comparison = comparisonFrom && comparisonTo
    ? { comparisonFrom: isoDate(comparisonFrom), comparisonTo: isoDate(comparisonTo) }
    : previousCustomRange(from, to);

  return {
    preset: input.preset,
    from: isoDate(from),
    to: isoDate(to),
    ...comparison,
  };
}

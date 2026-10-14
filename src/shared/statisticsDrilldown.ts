/** Cohortes immuables au clic : une destination sans filtre exact est interdite. */
export type StatisticsDrilldownKind = 'signed' | 'invoiced' | 'time';
export type StatisticsDrilldownDestination = 'Devis' | 'Facturation' | 'Gestion des temps';
export interface StatisticsDrilldownRoute {
  kind: StatisticsDrilldownKind;
  destination: StatisticsDrilldownDestination;
  ids: string[];
  periodLabel: string;
}
const DESTINATIONS: Record<StatisticsDrilldownKind, StatisticsDrilldownDestination> = {
  signed: 'Devis', invoiced: 'Facturation', time: 'Gestion des temps',
};
export function createStatisticsDrilldown(kind: StatisticsDrilldownKind, ids: readonly string[], periodLabel: string): StatisticsDrilldownRoute {
  if (!ids.every(id => typeof id === 'string' && id.trim().length > 0)) throw Error('Identifiants statistiques invalides.');
  return { kind, destination: DESTINATIONS[kind], ids: [...new Set(ids)], periodLabel: periodLabel.trim() || 'Période non précisée' };
}
export function isStatisticsDrilldownRoute(value: unknown): value is StatisticsDrilldownRoute {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<StatisticsDrilldownRoute>;
  return (r.kind === 'signed' || r.kind === 'invoiced' || r.kind === 'time') &&
    r.destination === DESTINATIONS[r.kind] &&
    Array.isArray(r.ids) && r.ids.length <= 100000 &&
    r.ids.every(id => typeof id === 'string' && id.trim().length > 0) &&
    typeof r.periodLabel === 'string';
}
export interface StatisticsDrilldownMatch<T> {
  rows: T[];
  unavailable: number;
}
/** Ne jamais élargir silencieusement la liste lorsqu'un ID est absent ou a changé d'état. */
export function matchStatisticsDrilldown<T extends { id: string }>(
  items: readonly T[],
  route: StatisticsDrilldownRoute,
  validCurrent?: (item: T) => boolean,
): StatisticsDrilldownMatch<T> {
  const ids = new Set(route.ids);
  const rows = items.filter(item => ids.has(item.id) && (validCurrent ? validCurrent(item) : true));
  return { rows, unavailable: Math.max(0, ids.size - rows.length) };
}

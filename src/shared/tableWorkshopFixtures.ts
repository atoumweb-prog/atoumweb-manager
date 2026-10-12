export interface TableWorkshopRecord {
  readonly id: string; readonly name: string; readonly category: string;
  readonly status: string; readonly amountCents: number; readonly date: string | null;
}
export const TABLE_DEMO_CATEGORIES = ['Commerce', 'Création', 'Services'] as const;
export const TABLE_DEMO_STATUSES = ['À préparer', 'En cours', 'Clôturé'] as const;
const names = ['École des Arts', 'Studio Dijon', 'Éclair Création', 'Atelier des Fleurs', 'École des Arts'];
export const TABLE_WORKSHOP_RECORDS: readonly TableWorkshopRecord[] = Object.freeze(Array.from({ length: 120 }, (_, i) => Object.freeze({
  id: `TEST-${String(i + 1).padStart(3, '0')}`,
  name: `TEST — ${names[i % names.length]}`,
  category: TABLE_DEMO_CATEGORIES[i % 3], status: TABLE_DEMO_STATUSES[Math.floor(i / 3) % 3],
  amountCents: [0, 99, 100, 10000, 25000][i % 5],
  date: i % 11 === 0 ? null : `2026-10-${String(i % 28 + 1).padStart(2, '0')}`,
})));
export function filterWorkshopRecords(query: string, status: string, category: string): TableWorkshopRecord[] {
  const needle = query.trim().toLocaleLowerCase('fr-FR');
  return TABLE_WORKSHOP_RECORDS.filter(row => (!status || row.status === status) && (!category || row.category === category)
    && (!needle || [row.id, row.name, row.category, row.status].some(value => value.toLocaleLowerCase('fr-FR').includes(needle))));
}

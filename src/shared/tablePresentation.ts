export type SortValue = string | number | null;
export interface TableSort { columnId: string; direction: 'asc' | 'desc' }
export interface SortColumn<T> { id: string; sortValue?: (row: T) => SortValue }
export function nextTableSort(current: TableSort | null, columnId: string): TableSort | null {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  return current.direction === 'asc' ? { columnId, direction: 'desc' } : null;
}
export function sortTableRows<T>(rows: readonly T[], columns: readonly SortColumn<T>[], sort: TableSort | null, getId: (row: T) => string): T[] {
  const column = sort && columns.find(c => c.id === sort.columnId);
  if (!sort || !column?.sortValue) return [...rows];
  const reader = column.sortValue, collator = new Intl.Collator('fr-FR', { sensitivity: 'base' });
  return [...rows].sort((a, b) => {
    const left = reader(a), right = reader(b);
    // Missing data stays last in either direction; equal values have a stable identity tie-break.
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    const order = left === null || right === null ? 0 : typeof left === 'number' && typeof right === 'number'
      ? left - right : collator.compare(String(left), String(right));
    if (order) return sort.direction === 'asc' ? order : -order;
    const idA = getId(a), idB = getId(b);
    return idA < idB ? -1 : idA > idB ? 1 : 0;
  });
}
export function normalizeTableColumns(saved: unknown, columns: readonly { id: string; required?: boolean }[]): string[] {
  const requested = Array.isArray(saved) ? new Set(saved.filter((id): id is string => typeof id === 'string')) : null;
  return columns.filter(c => c.required || requested === null || requested.has(c.id)).map(c => c.id);
}

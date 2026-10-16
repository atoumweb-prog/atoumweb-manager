import type { VisualPreferenceStore } from './panelLayout';
import { normalizeTableColumns, type TableSort } from './tablePresentation';
export interface TableViewPreference {
  version: 2; visibleColumnIds: string[]; columnOrder: string[]; widths: Record<string, number>; sort: TableSort | null; status: string; category: string;
}
export const TABLE_DEMO_COLUMNS = [
  { id: 'identity', required: true }, { id: 'category' }, { id: 'status' },
  { id: 'date' }, { id: 'amount' }, { id: 'open', required: true },
] as const;
export type TableColumnSchema = readonly { id: string; required?: boolean }[];
export function defaultTableView(columns: TableColumnSchema = TABLE_DEMO_COLUMNS): TableViewPreference { return { version: 2, visibleColumnIds: columns.map(c => c.id), columnOrder: columns.map(c => c.id), widths: {}, sort: null, status: '', category: '' }; }
export function normalizeColumnOrder(value: unknown, columns: TableColumnSchema = TABLE_DEMO_COLUMNS): string[] {
  const ids = columns.map(c => c.id as string);
  return [...new Set([...(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && ids.includes(id)) : []), ...ids])];
}
export function columnWidth(id: string, value: number): number {
  const minimum = id === 'identity' ? 180 : id === 'open' ? 140 : 160;
  return Number.isFinite(value) ? Math.round(Math.min(600, Math.max(minimum, value))) : minimum;
}
export function moveColumn(order: readonly string[], id: string, target: string, columns: TableColumnSchema = TABLE_DEMO_COLUMNS): string[] {
  const normalized = normalizeColumnOrder(order, columns);
  if (id === target || !normalized.includes(id) || !normalized.includes(target)) return normalized;
  const index = normalized.indexOf(target), next = normalized.filter(value => value !== id);
  next.splice(index, 0, id); return next;
}
export function tableViewKey(view: string) { return `atoumweb:table-workshop:${encodeURIComponent(view)}:v1`; }
export function readTableView(store: VisualPreferenceStore, key: string, statuses: readonly string[], categories: readonly string[], columns: TableColumnSchema = TABLE_DEMO_COLUMNS): TableViewPreference {
  const raw = store.getItem(key);
  if (raw === null) return defaultTableView(columns);
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || ![1, 2].includes((value as Record<string, unknown>).version as number)) throw Error('Préférence de tableau incompatible.');
  const data = value as Record<string, unknown>, sort = data.sort as Partial<TableSort> | null;
  const columnId = sort?.columnId;
  const widths: Record<string, number> = {};
  if (data.widths && typeof data.widths === 'object') for (const column of columns) {
    const width = (data.widths as Record<string, unknown>)[column.id];
    if (typeof width === 'number' && Number.isFinite(width)) widths[column.id] = columnWidth(column.id, width);
  }
  return { version: 2, columnOrder: normalizeColumnOrder(data.columnOrder, columns), widths, visibleColumnIds: normalizeTableColumns(data.visibleColumnIds, columns),
    sort: typeof columnId === 'string' && columnId !== 'open' && columns.some(c => c.id === columnId)
      && (sort?.direction === 'asc' || sort?.direction === 'desc') ? { columnId, direction: sort.direction } : null,
    status: typeof data.status === 'string' && statuses.includes(data.status) ? data.status : '',
    category: typeof data.category === 'string' && categories.includes(data.category) ? data.category : '',
  };
}
export function writeTableView(store: VisualPreferenceStore, key: string, view: TableViewPreference, columns: TableColumnSchema = TABLE_DEMO_COLUMNS) {
  // Whitelist presentation fields: never serialize a query, selected record, or draft.
  const clean = readTableView({ getItem: () => JSON.stringify(view), setItem() {}, removeItem() {} }, key, [view.status], [view.category], columns);
  store.setItem(key, JSON.stringify(clean));
}

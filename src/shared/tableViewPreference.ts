import type { VisualPreferenceStore } from './panelLayout';
import { normalizeTableColumns, type TableSort } from './tablePresentation';
export interface TableViewPreference {
  version: 1; visibleColumnIds: string[]; sort: TableSort | null; status: string; category: string;
}
export const TABLE_DEMO_COLUMNS = [
  { id: 'identity', required: true }, { id: 'category' }, { id: 'status' },
  { id: 'date' }, { id: 'amount' }, { id: 'open', required: true },
] as const;
export function defaultTableView(): TableViewPreference { return { version: 1, visibleColumnIds: TABLE_DEMO_COLUMNS.map(c => c.id), sort: null, status: '', category: '' }; }
export function tableViewKey(view: string) { return `atoumweb:table-workshop:${encodeURIComponent(view)}:v1`; }
export function readTableView(store: VisualPreferenceStore, key: string, statuses: readonly string[], categories: readonly string[]): TableViewPreference {
  const raw = store.getItem(key);
  if (raw === null) return defaultTableView();
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || (value as Record<string, unknown>).version !== 1) throw Error('Préférence de tableau incompatible.');
  const data = value as Record<string, unknown>, sort = data.sort as Partial<TableSort> | null;
  const columnId = sort?.columnId;
  return { version: 1, visibleColumnIds: normalizeTableColumns(data.visibleColumnIds, TABLE_DEMO_COLUMNS),
    sort: typeof columnId === 'string' && columnId !== 'open' && TABLE_DEMO_COLUMNS.some(c => c.id === columnId)
      && (sort?.direction === 'asc' || sort?.direction === 'desc') ? { columnId, direction: sort.direction } : null,
    status: typeof data.status === 'string' && statuses.includes(data.status) ? data.status : '',
    category: typeof data.category === 'string' && categories.includes(data.category) ? data.category : '',
  };
}
export function writeTableView(store: VisualPreferenceStore, key: string, view: TableViewPreference) {
  // Whitelist presentation fields: never serialize a query, selected record, or draft.
  store.setItem(key, JSON.stringify({ version: 1, visibleColumnIds: [...view.visibleColumnIds], sort: view.sort ? { columnId: view.sort.columnId, direction: view.sort.direction } : null, status: view.status, category: view.category }));
}

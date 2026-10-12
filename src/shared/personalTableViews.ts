import type { VisualPreferenceStore } from './panelLayout';
import { readTableView, type TableViewPreference } from './tableViewPreference';
export interface PersonalTableView { id: string; name: string; preference: TableViewPreference }
export const personalViewsKey = (module: string) => `atoumweb:table-workshop:${encodeURIComponent(module)}:personal:v1`;
export function readPersonalViews(store: VisualPreferenceStore, module: string, statuses: readonly string[], categories: readonly string[]): PersonalTableView[] {
  const raw = store.getItem(personalViewsKey(module)); if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || (data as { version: unknown }).version !== 1 || !Array.isArray((data as { views: unknown }).views)) throw Error('Vues personnelles incompatibles.');
  const result: PersonalTableView[] = [];
  for (const view of (data as { views: unknown[] }).views) {
    if (!view || typeof view !== 'object') continue;
    const { id, name, preference } = view as Record<string, unknown>;
    if (typeof id !== 'string' || !/^personal-[a-zA-Z0-9-]+$/.test(id) || result.some(v => v.id === id) || typeof name !== 'string' || !name.trim()) continue;
    try { result.push({ id, name: name.trim().slice(0, 80), preference: readTableView({ getItem: () => JSON.stringify(preference), setItem() {}, removeItem() {} }, '', statuses, categories) }); } catch { /* Invalid view is skipped; standard view remains available. */ }
  }
  return result;
}
export function writePersonalViews(store: VisualPreferenceStore, module: string, views: readonly PersonalTableView[], statuses: readonly string[], categories: readonly string[]) {
  const clean = readPersonalViews({ getItem: () => JSON.stringify({ version: 1, views }), setItem() {}, removeItem() {} }, module, statuses, categories);
  store.setItem(personalViewsKey(module), JSON.stringify({ version: 1, views: clean }));
}

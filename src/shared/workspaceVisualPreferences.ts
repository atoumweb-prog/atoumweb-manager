import { layoutKey, readLayout, type VisualPreferenceStore } from './panelLayout';
import { defaultTableView, readTableView, tableViewKey } from './tableViewPreference';
import { personalViewsKey, readPersonalViews } from './personalTableViews';
import { TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES } from './tableWorkshopFixtures';
import {NAVIGATION_PREFERENCE_KEY,normalizeNavigationPreference} from './navigationRail';
import{HEADER_PREFERENCE_KEY,normalizeHeaderPreference}from'./headerPresentation';

/** Workspace-owned presentation adapter. No business command or SQL migration.
 * Pilot schemas are explicitly registered; later module ports must register their own domains. */
export const VISUAL_SETTINGS_KEY = 'ux_v2_visual_preferences_v1';
export interface SettingsOwner { getSetting<T>(key: string, fallback: T): T; setSetting(key: string, value: unknown): void }
const modules = ['dossiers', 'autre-vue'];
export function normalizeVisualValue(key: string, raw: string): string {
  if (raw.length > 100_000) throw Error('Préférence trop volumineuse.');
  if(key===HEADER_PREFERENCE_KEY)return JSON.stringify(normalizeHeaderPreference(JSON.parse(raw)));
  if (key === NAVIGATION_PREFERENCE_KEY) return JSON.stringify(normalizeNavigationPreference(JSON.parse(raw)));
  const store: VisualPreferenceStore = { getItem: () => raw, setItem() {}, removeItem() {} };
  for (const module of modules) {
    if (key === layoutKey(`table-demo:${module}`, 'list')) return JSON.stringify({ version: 1, listPercent: readLayout(store, key, 60) });
    if (key === tableViewKey(module)) return JSON.stringify(readTableView(store, key, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES));
    if (key === personalViewsKey(module)) return JSON.stringify({ version: 1, views: readPersonalViews(store, module, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES) });
  }
  throw Error('Clé visuelle non enregistrée.');
}
export class WorkspaceVisualPreferenceStore implements VisualPreferenceStore {
  constructor(private readonly owner: SettingsOwner) {}
  private entries(): Record<string, string> {
    const value = this.owner.getSetting<unknown>(VISUAL_SETTINGS_KEY, { version: 1, entries: {} });
    if (!value || typeof value !== 'object' || (value as {version:unknown}).version !== 1 || !(value as {entries:unknown}).entries || typeof (value as {entries:unknown}).entries !== 'object' || Array.isArray((value as {entries:unknown}).entries)) throw Error('Préférences visuelles incompatibles. Réinitialise les dispositions.');
    const result: Record<string, string> = {};
    for (const [key, raw] of Object.entries((value as {entries:Record<string,unknown>}).entries)) {
      if (typeof raw !== 'string') continue;
      try { result[key] = normalizeVisualValue(key, raw); } catch { /* Unknown/obsolete entries cannot reach a component. */ }
    }
    return result;
  }
  getItem(key: string): string | null {
    // Validate keys even when absent. Never expose arbitrary settings/business fields.
    normalizeVisualValue(key, key===HEADER_PREFERENCE_KEY?'{"version":1,"compact":false}':key === NAVIGATION_PREFERENCE_KEY ? '{"version":1,"railCollapsed":false,"favoriteModuleKeys":[]}' : key.startsWith('atoumweb:layout:') ? '{"version":1,"listPercent":60}' : key.includes(':personal:') ? '{"version":1,"views":[]}' : JSON.stringify(defaultTableView()));
    return this.entries()[key] ?? null;
  }
  setItem(key: string, raw: string) { const value = normalizeVisualValue(key, raw), entries = this.entries(); entries[key] = value; this.owner.setSetting(VISUAL_SETTINGS_KEY, { version: 1, entries }); }
  removeItem(key: string) { this.getItem(key); const entries = this.entries(); delete entries[key]; this.owner.setSetting(VISUAL_SETTINGS_KEY, { version: 1, entries }); }
  resetDispositions() { this.owner.setSetting(VISUAL_SETTINGS_KEY, { version: 1, entries: {} }); }
}

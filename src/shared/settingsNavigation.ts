import { layoutKey, type VisualPreferenceStore } from './panelLayout';
import { readNavigationPreference, writeNavigationPreference, type NavigationPreference } from './navigationRail';

export type SupportedLayoutModule = 'clients' | 'directory';

/** Les réglages ne touchent qu'à la présentation du rail et des listes pilotées existantes. */
export function saveRailCollapsed(store: VisualPreferenceStore, collapsed: boolean): NavigationPreference {
  const current = readNavigationPreference(store);
  const next = { ...current, railCollapsed: collapsed };
  writeNavigationPreference(store, next);
  return next;
}

/** Cette action ne remet pas à zéro l'état des panneaux ni les données du Manager. */
export function clearNavigationFavorites(store: VisualPreferenceStore): NavigationPreference {
  const current = readNavigationPreference(store);
  const next = { ...current, favoriteModuleKeys: [] };
  writeNavigationPreference(store, next);
  return next;
}

/** Les deux dispositions dont le stockage workspace est actuellement enregistré. */
export function resetRegisteredModuleLayout(store: VisualPreferenceStore, module: SupportedLayoutModule): void {
  store.removeItem(layoutKey(module, 'list'));
}

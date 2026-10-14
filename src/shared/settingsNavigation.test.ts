import { describe, expect, it } from 'vitest';
import type { VisualPreferenceStore } from './panelLayout';
import { layoutKey } from './panelLayout';
import { readNavigationPreference, writeNavigationPreference } from './navigationRail';
import { clearNavigationFavorites, resetRegisteredModuleLayout, saveRailCollapsed } from './settingsNavigation';

function fakeStore() {
  const entries = new Map<string,string>();
  const store: VisualPreferenceStore = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); },
  };
  return { entries, store };
}

describe('réglages ciblés Navigation et vues', () => {
  it('persiste le rail sans perdre favoris, ni dépendre d’une migration SQLite', () => {
    const { store, entries } = fakeStore();
    writeNavigationPreference(store, { version: 1, railCollapsed: false, favoriteModuleKeys: ['Clients', 'Devis'] });
    entries.set('sentinel-business', 'never change');
    const next = saveRailCollapsed(store, true);
    expect(next.railCollapsed).toBe(true);
    expect(readNavigationPreference(store).favoriteModuleKeys).toEqual(['Clients','Devis']);
    expect(entries.get('sentinel-business')).toBe('never change');
  });

  it('efface seulement les favoris en préservant le rail et les dispositions', () => {
    const { store, entries } = fakeStore();
    const key = layoutKey('clients','list');
    entries.set(key, '{"version":1,"listPercent":65}');
    writeNavigationPreference(store, { version: 1, railCollapsed: true, favoriteModuleKeys: ['Clients'] });
    const next = clearNavigationFavorites(store);
    expect(next.favoriteModuleKeys).toEqual([]);
    expect(readNavigationPreference(store).railCollapsed).toBe(true);
    expect(entries.get(key)).toContain('65');
  });

  it('ne réinitialise que le module demandé, pas l Annuaire ni les autres clés', () => {
    const { store, entries } = fakeStore();
    const clients = layoutKey('clients','list');
    const directory = layoutKey('directory','list');
    entries.set(clients,'{"version":1,"listPercent":55}');
    entries.set(directory,'{"version":1,"listPercent":40}');
    entries.set('sentinel', 'préservé');
    resetRegisteredModuleLayout(store, 'clients');
    expect(entries.has(clients)).toBe(false);
    expect(entries.get(directory)).toContain('40');
    expect(entries.get('sentinel')).toBe('préservé');
  });
});

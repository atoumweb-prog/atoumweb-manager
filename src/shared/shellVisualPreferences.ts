import { HEADER_PREFERENCE_KEY } from './headerPresentation';
import { NAVIGATION_PREFERENCE_KEY } from './navigationRail';
import type { VisualPreferenceStore } from './panelLayout';

export interface ShellVisualPreferencesApi extends VisualPreferenceStore {
  confirmReset(): boolean;
  subscribe(listener: (key: string) => void): () => void;
}
export function assertShellVisualKey(key: unknown): asserts key is string {
  if (key !== HEADER_PREFERENCE_KEY && key !== NAVIGATION_PREFERENCE_KEY)
    throw Error('Clé de présentation non autorisée.');
}

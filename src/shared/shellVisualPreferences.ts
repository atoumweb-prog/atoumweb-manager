import { HEADER_PREFERENCE_KEY } from './headerPresentation';
import { NAVIGATION_PREFERENCE_KEY } from './navigationRail';
import {HOME_WIDGET_PREFERENCE_KEY} from './homeWidgetPreference';
import { layoutKey } from './panelLayout';
import type { VisualPreferenceStore } from './panelLayout';
import {tableViewKey} from './tableViewPreference';
import {personalViewsKey} from './personalTableViews';
import {REAL_TABLE_SCHEMAS} from './realTableSchemas';

export interface ShellVisualPreferencesApi extends VisualPreferenceStore {
  confirmReset(): boolean;
  subscribe(listener: (key: string) => void): () => void;
}
export function assertShellVisualKey(key: unknown): asserts key is string {
  if(Object.keys(REAL_TABLE_SCHEMAS).some(scope=>key===tableViewKey(scope)||key===personalViewsKey(scope)))return;
  if (key !== HEADER_PREFERENCE_KEY && key !== NAVIGATION_PREFERENCE_KEY && key !== HOME_WIDGET_PREFERENCE_KEY && key !== layoutKey('clients','list') && key !== layoutKey('directory','list'))
    throw Error('Clé de présentation non autorisée.');
}

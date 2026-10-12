import type {VisualPreferenceStore} from './panelLayout';
export const HEADER_PREFERENCE_KEY='atoumweb:navigation:header:v1';
export interface HeaderPreference{version:1;compact:boolean}
export function normalizeHeaderPreference(value:unknown):HeaderPreference{if(!value||typeof value!=='object'||(value as Record<string,unknown>).version!==1)throw Error('Préférence d’en-tête incompatible.');return{version:1,compact:(value as Record<string,unknown>).compact===true};}
export function readHeaderPreference(store:VisualPreferenceStore):HeaderPreference{const raw=store.getItem(HEADER_PREFERENCE_KEY);return raw===null?{version:1,compact:false}:normalizeHeaderPreference(JSON.parse(raw));}
export function writeHeaderPreference(store:VisualPreferenceStore,value:HeaderPreference){store.setItem(HEADER_PREFERENCE_KEY,JSON.stringify(normalizeHeaderPreference(value)));}

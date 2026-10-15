import type { VisualPreferenceStore } from './panelLayout';
export const NAVIGATION_GROUPS = ['Commercial','Production','Gestion','Ressources','Pilotage'] as const;
export type NavigationGroup = typeof NAVIGATION_GROUPS[number];
export const NAVIGATION_MODULES = [
  {key:'Accueil',label:'Accueil',group:null,icon:'home',slot:'AC'},
  {key:'Prospects',label:'Prospection',group:'Commercial',icon:'user',slot:'PR'},
  {key:'Clients',label:'Clients',group:'Commercial',icon:'users',slot:'CL'},
  {key:'Offres & Tarifs',label:'Offres & Tarifs',group:'Commercial',icon:'package',slot:'OT'},
  {key:'Devis',label:'Devis',group:'Commercial',icon:'file-text',slot:'DV'},
  {key:'Projets',label:'Projets',group:'Production',icon:'folder',slot:'PJ'},
  {key:'Interventions & Maintenance',label:'Interventions & Maintenance',group:'Production',icon:'wrench',slot:'IM'},
  {key:'Gestion des temps',label:'Gestion des temps',group:'Production',icon:'clock',slot:'GT'},
  {key:'Facturation',label:'Facturation',group:'Gestion',icon:'receipt',slot:'FA'},
  {key:'Dépenses',label:'Dépenses',group:'Gestion',icon:'wallet',slot:'DP'},
  {key:'Documents & Contrats',label:'Documents & Contrats',group:'Gestion',icon:'file-check',slot:'DC'},
  {key:'Bibliothèque AtoumWeb',label:'Bibliothèque AtoumWeb',group:'Ressources',icon:'layers',slot:'BA'},
  {key:'Sites',label:'Sites',group:'Ressources',icon:'server',slot:'SI'},
  {key:'Sauvegardes',label:'Sauvegardes',group:'Ressources',icon:'database',slot:'SA'},
  {key:'Annuaire',label:'Annuaire',group:'Ressources',icon:'contact',slot:'AN'},
  {key:'Statistiques',label:'Statistiques',group:'Pilotage',icon:'chart',slot:'ST'},
  {key:'Réglages',label:'Réglages',group:'Pilotage',icon:'settings',slot:'RE'},
] as const;
export type NavigationModuleKey = typeof NAVIGATION_MODULES[number]['key'];
export type NavigationModule = typeof NAVIGATION_MODULES[number];
export const NAVIGATION_PREFERENCE_KEY = 'atoumweb:navigation:rail:v1';
export interface NavigationPreference {version:1;railCollapsed:boolean;favoriteModuleKeys:NavigationModuleKey[]}
export const defaultNavigationPreference = ():NavigationPreference=>({version:1,railCollapsed:false,favoriteModuleKeys:[]});
export const isNavigationModuleKey = (value:unknown):value is NavigationModuleKey=>typeof value==='string'&&NAVIGATION_MODULES.some(module=>module.key===value);
export function normalizeNavigationPreference(value:unknown):NavigationPreference {
  if(!value||typeof value!=='object')throw Error('Préférence de navigation invalide.');
  const data=value as Record<string,unknown>;if(data.version!==1&&data.version!==0)throw Error('Version de navigation incompatible.');
  const favorites=data.version===0?data.favorites:data.favoriteModuleKeys;
  return {version:1,railCollapsed:data.railCollapsed===true,favoriteModuleKeys:[...new Set(Array.isArray(favorites)?favorites.filter(isNavigationModuleKey).filter(key=>key!=='Accueil'):[])]};
}
export function readNavigationPreference(store:VisualPreferenceStore):NavigationPreference {const raw=store.getItem(NAVIGATION_PREFERENCE_KEY);return raw===null?defaultNavigationPreference():normalizeNavigationPreference(JSON.parse(raw));}
export function writeNavigationPreference(store:VisualPreferenceStore,value:NavigationPreference){store.setItem(NAVIGATION_PREFERENCE_KEY,JSON.stringify(normalizeNavigationPreference(value)));}
export function moveFavorite(keys:readonly NavigationModuleKey[],key:NavigationModuleKey,direction:-1|1):NavigationModuleKey[]{const result=[...keys],from=result.indexOf(key),to=from+direction;if(from<0||to<0||to>=result.length)return result;[result[from],result[to]]=[result[to],result[from]];return result;}

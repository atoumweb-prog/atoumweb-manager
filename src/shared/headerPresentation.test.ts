import{describe,expect,it}from'vitest';
import{HEADER_PREFERENCE_KEY,normalizeHeaderPreference,readHeaderPreference,writeHeaderPreference}from'./headerPresentation';
import{NAVIGATION_PREFERENCE_KEY}from'./navigationRail';
import { WorkspaceVisualPreferenceStore, type SettingsOwner } from './workspaceVisualPreferences';
describe('02B header presentation without business state',()=>{
 it('keeps header and rail preference keys independent',()=>expect(HEADER_PREFERENCE_KEY).not.toBe(NAVIGATION_PREFERENCE_KEY));
 it('defaults to expanded when absent',()=>expect(readHeaderPreference({getItem:()=>null,setItem(){},removeItem(){}})).toEqual({version:1,compact:false}));
 it('normalizes flags without storing session, query, note or library state',()=>expect(normalizeHeaderPreference({version:1,compact:true,session:{id:'private'},query:'secret',note:'secret',libraryCollapsed:true})).toEqual({version:1,compact:true}));
 it.each(['bad','null','{"version":99}'])('rejects invalid format %s',raw=>expect(()=>readHeaderPreference({getItem:()=>raw,setItem(){},removeItem(){}})).toThrow());
 it('does not announce persistence when store refuses',()=>expect(()=>writeHeaderPreference({getItem:()=>null,setItem(){throw Error('disk');},removeItem(){}},{version:1,compact:true})).toThrow('disk'));
});

describe('02B.3 independent header and rail owners', () => {
 function owner(): SettingsOwner {
  const values = new Map<string, unknown>();
  return {getSetting<T>(key: string, fallback: T): T {return values.has(key) ? values.get(key) as T : fallback;},setSetting(key, value) {values.set(key, value);}};
 }
 it.each([true, false])('independent windows preserve neighbors when header compact=%s', compact => {
  const settings = owner(), header = new WorkspaceVisualPreferenceStore(settings), rail = new WorkspaceVisualPreferenceStore(settings);
  rail.setItem(NAVIGATION_PREFERENCE_KEY, JSON.stringify({version:1,railCollapsed:true,favoriteModuleKeys:['Clients']}));
  writeHeaderPreference(header, {version:1,compact});
  rail.setItem(NAVIGATION_PREFERENCE_KEY, JSON.stringify({version:1,railCollapsed:false,favoriteModuleKeys:['Devis']}));
  expect(readHeaderPreference(header)).toEqual({version:1,compact});
  header.removeItem(HEADER_PREFERENCE_KEY);
  expect(JSON.parse(rail.getItem(NAVIGATION_PREFERENCE_KEY)!)).toEqual({version:1,railCollapsed:false,favoriteModuleKeys:['Devis']});
 });
 it('does not persist the local library banner or cross workspace boundaries', () => {
  const first = new WorkspaceVisualPreferenceStore(owner()), other = new WorkspaceVisualPreferenceStore(owner());
  writeHeaderPreference(first, {version:1,compact:true});
  expect(() => first.setItem('atoumweb:library:banner:v1', '{"collapsed":true}')).toThrow('Clé visuelle non enregistrée');
  expect(readHeaderPreference(first)).toEqual({version:1,compact:true});
  expect(readHeaderPreference(other)).toEqual({version:1,compact:false});
 });
});

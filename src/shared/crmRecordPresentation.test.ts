import {describe,it,expect} from 'vitest';
import {CRM_RECORD_KEYS,normalizeCrmRecordPresentation,defaultCrmRecordPresentation,clientPaneDisplay} from './crmRecordPresentation';
import {WorkspaceVisualPreferenceStore} from './workspaceVisualPreferences';
import {assertShellVisualKey} from './shellVisualPreferences';
describe('CRM presentation only',()=>{
 it('uses Client B compact side defaults without changing Prospect A defaults',()=>{
  expect(defaultCrmRecordPresentation('client')).toEqual({version:1,leftWidth:220,rightWidth:190,leftClosed:false,rightClosed:false});
  expect(defaultCrmRecordPresentation('prospect')).toEqual(defaultCrmRecordPresentation());
  expect(defaultCrmRecordPresentation().leftWidth).toBe(260);
  expect(defaultCrmRecordPresentation().rightWidth).toBe(280);
 });
 it('preserves existing Client widths and folded flags instead of overwriting preferences',()=>{
  const existing={version:1,leftWidth:310,rightWidth:330,leftClosed:true,rightClosed:false};
  expect(normalizeCrmRecordPresentation(existing,'client')).toEqual(existing);
 });
 it('keeps Client association width 190 through the actual workspace adapter only',()=>{
  const values=new Map<string,unknown>();const owner={getSetting:<T>(k:string,f:T)=>(values.get(k)??f) as T,setSetting:(k:string,v:unknown)=>{values.set(k,v);}};
  const store=new WorkspaceVisualPreferenceStore(owner);
  for(const key of CRM_RECORD_KEYS)store.setItem(key,JSON.stringify({...defaultCrmRecordPresentation('client'),notes:'NEVER STORE',activeTab:'summary'}));
  expect(JSON.parse(store.getItem(CRM_RECORD_KEYS[0])!).rightWidth).toBe(190);
  expect(JSON.parse(store.getItem(CRM_RECORD_KEYS[1])!).rightWidth).toBe(220);
  expect(JSON.stringify([...values.values()])).not.toContain('NEVER STORE');
 });
 it('safely normalizes incomplete Client visual preferences',()=>{
  expect(normalizeCrmRecordPresentation({version:1,leftWidth:NaN,rightWidth:-1},'client')).toEqual({...defaultCrmRecordPresentation('client'),rightWidth:190});
 });
 it('bounds widths and drops every identity/draft/tab field',()=>expect(normalizeCrmRecordPresentation({version:1,leftWidth:900,rightWidth:10,selectedId:'SECRET',notes:'DRAFT',activeTab:'contacts'})).toEqual({version:1,leftWidth:380,rightWidth:220,leftClosed:false,rightClosed:false}));
 it('rejects incompatible versions without guessing a business state',()=>expect(()=>normalizeCrmRecordPresentation({version:9})).toThrow());
 it.each(CRM_RECORD_KEYS)('persists registered layout %s independently per workspace',key=>{
  const values=new Map<string,unknown>();const owner={getSetting:<T>(k:string,f:T)=>(values.get(k)??f) as T,setSetting:(k:string,v:unknown)=>{values.set(k,v);}};
  const store=new WorkspaceVisualPreferenceStore(owner);expect(()=>assertShellVisualKey(key)).not.toThrow();expect(store.getItem(key)).toBeNull();
  store.setItem(key,JSON.stringify({...defaultCrmRecordPresentation(),leftClosed:true,selectedId:'SECRET'}));
  expect(JSON.parse(new WorkspaceVisualPreferenceStore(owner).getItem(key)!)).toEqual({...defaultCrmRecordPresentation(),leftClosed:true});
  expect(JSON.stringify([...values.values()])).not.toContain('SECRET');
  const other=new WorkspaceVisualPreferenceStore({getSetting:(_k,f)=>f,setSetting(){}});expect(other.getItem(key)).toBeNull();
 });
});

describe('Client display adaptation without preference rewrite',()=>{
 it('makes old narrow panes readable without mutating saved values',()=>{const prefs=defaultCrmRecordPresentation('client'),before=JSON.stringify(prefs);expect(clientPaneDisplay(1600,prefs)).toEqual({leftWidth:300,rightWidth:240,compact:false});expect(JSON.stringify(prefs)).toBe(before);});
 it('keeps sufficient work width when fitting larger preferences',()=>{const prefs={...defaultCrmRecordPresentation('client'),leftWidth:380,rightWidth:380};for(const width of [1200,1280,1400,1920]){const result=clientPaneDisplay(width,prefs);expect(result.compact).toBe(false);expect(width-result.leftWidth-result.rightWidth-16).toBeGreaterThanOrEqual(640);expect(result.leftWidth).toBeGreaterThanOrEqual(300);expect(result.rightWidth).toBeGreaterThanOrEqual(240);}});
 it('uses compact mode rather than crushing the work area',()=>expect(clientPaneDisplay(1100,defaultCrmRecordPresentation('client')).compact).toBe(true));
 it('respects folded panes and modern widths',()=>{expect(clientPaneDisplay(1000,{...defaultCrmRecordPresentation('client'),leftClosed:true})).toEqual({leftWidth:52,rightWidth:240,compact:false});expect(clientPaneDisplay(1600,{...defaultCrmRecordPresentation('client'),leftWidth:320,rightWidth:280})).toEqual({leftWidth:320,rightWidth:280,compact:false});});
});

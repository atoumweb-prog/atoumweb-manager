import {describe,it,expect} from 'vitest';
import {CRM_RECORD_KEYS,normalizeCrmRecordPresentation,defaultCrmRecordPresentation} from './crmRecordPresentation';
import {WorkspaceVisualPreferenceStore} from './workspaceVisualPreferences';
import {assertShellVisualKey} from './shellVisualPreferences';
describe('CRM presentation only',()=>{
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

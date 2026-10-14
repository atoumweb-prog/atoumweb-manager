import {describe,expect,it,vi} from 'vitest';
import type {AtoumWebApi} from './contracts';
import type {SearchResult} from './crm';
import {SEARCH_DESTINATIONS,readSearchTarget,searchDestination} from './searchNavigation';
const result=(type:string,id='target')=>({entityType:type,entityId:id,title:'Homonyme',subtitle:''} as SearchResult);
describe('02C identity routing through existing read APIs',()=>{
  it.each(Object.entries(SEARCH_DESTINATIONS))('maps %s to existing module %s',(type,module)=>expect(searchDestination(result(type))).toBe(module));
  it.each([null,{},result('unknown'),result('catalog',''),result('quote',' target ')])('refuses invalid destination without Clients fallback',value=>expect(searchDestination(value)).toBeNull());
  it.each(Object.keys(SEARCH_DESTINATIONS))('loads exact %s identity without a business write',async type=>{
    const one=vi.fn(async()=>({id:'target'})),many=vi.fn(async()=>[{id:'other'},{id:'target'}]);
    const api={catalog:{getItem:one},quotes:{get:one},projects:{projects:{get:one}},referentials:{library:{get:one}},businessBackups:{get:one},crm:{clients:{list:many},prospects:{list:many},organizations:{get:one},contacts:{get:one}},clientDocuments:{list:many},operations:{requests:{get:one},interventions:{get:one},maintenance:{subscriptions:{list:many}},hourPacks:{get:one}}} as unknown as AtoumWebApi;
    expect((await readSearchTarget(api,result(type))).id).toBe('target');
    expect(one.mock.calls.length+many.mock.calls.length).toBeGreaterThan(0);
  });
  it('rejects a different identity even when title matches',async()=>{const api={catalog:{getItem:async()=>({id:'neighbor',name:'Homonyme'})}} as unknown as AtoumWebApi;await expect(readSearchTarget(api,result('catalog'))).rejects.toThrow('introuvable');});
  it('preserves an explicit historical link but rejects a stale archived search entry',async()=>{const api={catalog:{getItem:async()=>({id:'target',status:'archived'})}} as unknown as AtoumWebApi;await expect(readSearchTarget(api,result('catalog'))).rejects.toThrow('archivée');expect((await readSearchTarget(api,result('catalog'),true)).id).toBe('target');});
  it('reports deleted entry or service error without selecting a neighbor',async()=>{const api={crm:{clients:{list:async()=>[{id:'neighbor'}]}}} as unknown as AtoumWebApi;await expect(readSearchTarget(api,result('client'))).rejects.toThrow('introuvable');const broken={quotes:{get:async()=>{throw Error('offline');}}} as unknown as AtoumWebApi;await expect(readSearchTarget(broken,result('quote'))).rejects.toThrow('offline');});
});

import {describe,it,expect} from 'vitest';
import {defaultCatalogContext,normalizeCatalogContext} from './catalogTableContext';
import {defaultTableView,tableViewKey,writeTableView,readTableView} from './tableViewPreference';
import {writePersonalViews,readPersonalViews} from './personalTableViews';
import {WorkspaceVisualPreferenceStore} from './workspaceVisualPreferences';
import {REAL_TABLE_SCHEMAS,CATALOG_ADMIN_VIEW} from './realTableSchemas';
describe('Catalogue saved views — scoped presentation, backwards compatibility',()=>{
  const owner=()=>{const data=new Map<string,unknown>();return {getSetting:<T>(k:string,f:T)=>(data.get(k)??f) as T,setSetting:(k:string,v:unknown)=>{data.set(k,v);}};};
  it('roundtrips filters, size, sorting, column order and widths through the real preference adapter',()=>{
    const store=new WorkspaceVisualPreferenceStore(owner()),schema=REAL_TABLE_SCHEMAS[CATALOG_ADMIN_VIEW],key=tableViewKey(CATALOG_ADMIN_VIEW);
    const view={...defaultTableView(schema),catalogContext:{...defaultCatalogContext(),query:'SEO',visibility:'internal' as const,pageSize:50 as const},sort:{columnId:'price',direction:'desc' as const},widths:{identity:420},columnOrder:[...schema.map(c=>c.id)].reverse()};
    writeTableView(store,key,view,schema);expect(readTableView(store,key,[],[],schema)).toEqual(view);
    writePersonalViews(store,CATALOG_ADMIN_VIEW,[{id:'personal-test',name:'Mes filtres',preference:view}],[],[],schema);
    expect(readPersonalViews(store,CATALOG_ADMIN_VIEW,[],[],schema)[0].preference).toEqual(view);
  });
  it('preserves old catalogue views without adding or resetting their columns',()=>{
    const store=new WorkspaceVisualPreferenceStore(owner()),schema=REAL_TABLE_SCHEMAS[CATALOG_ADMIN_VIEW],key=tableViewKey(CATALOG_ADMIN_VIEW);
    const old={...defaultTableView(schema),visibleColumnIds:['identity','price','open'],widths:{identity:380}};
    writeTableView(store,key,old,schema);expect(readTableView(store,key,[],[],schema)).toEqual(old);
  });
  it('drops business payloads and restricts filter persistence to the Catalogue domain',()=>{
    const store=new WorkspaceVisualPreferenceStore(owner());
    const payload={...defaultTableView(),catalogContext:{...defaultCatalogContext(),query:'recherche',draft:'PRIVATE',selectedId:'PRIVATE'},secret:'PRIVATE'};
    writeTableView(store,tableViewKey(CATALOG_ADMIN_VIEW),payload);expect(store.getItem(tableViewKey(CATALOG_ADMIN_VIEW))).not.toContain('PRIVATE');
    writeTableView(store,tableViewKey('quotes-list'),payload);expect(store.getItem(tableViewKey('quotes-list'))).not.toContain('catalogContext');
    expect(normalizeCatalogContext({pageSize:1000,itemStatus:'published',query:'a'.repeat(500)})).toMatchObject({pageSize:25,itemStatus:'all',query:'a'.repeat(200)});
  });
});

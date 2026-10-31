import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {OperationIcon} from '../renderer/operations/OperationIcon';
import {NAVIGATION_MODULES} from './navigationRail';
import {PROSPECT_DIRECTORY_COLUMNS as columns,PROSPECT_DIRECTORY_VIEW as scope} from './prospectTablePresentation';
import {defaultTableView,readTableView,writeTableView,tableViewKey,moveColumn} from './tableViewPreference';
import {readPersonalViews,writePersonalViews} from './personalTableViews';
import {normalizeVisualValue} from './workspaceVisualPreferences';
import {assertShellVisualKey} from './shellVisualPreferences';
const memory=()=>{const data=new Map<string,string>();return{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,v:string)=>{data.set(key,v);},removeItem:(key:string)=>{data.delete(key);}};};
describe('Real visual pilot: icons and registered table preferences',()=>{
 it('gives all 17 actual routes a renderable decorative icon, with six distinct identities',()=>{
  const expected={Accueil:'home',Clients:'users','Documents & Contrats':'file-check','Bibliothèque AtoumWeb':'layers',Annuaire:'contact',Réglages:'settings'};
  const shapes=new Set<string>();
  for(const [key,icon]of Object.entries(expected)){const module=NAVIGATION_MODULES.find(m=>m.key===key)!;expect(module.icon).toBe(icon);shapes.add(renderToStaticMarkup(createElement(OperationIcon,{name:module.icon})));}
  expect(shapes.size).toBe(6);
  for(const m of NAVIGATION_MODULES){const html=renderToStaticMarkup(createElement(OperationIcon,{name:m.icon}));expect(html).toContain('aria-hidden="true"');expect(html).toMatch(/<path|<rect|<circle|<ellipse/);}
 });
 it('projects old or corrupt column preferences to the real schema with mandatory identity/open',()=>{
  const store=memory(),key=tableViewKey(scope);store.setItem(key,JSON.stringify({version:1,columnOrder:['retired','city','city'],visibleColumnIds:['city'],widths:{city:900,retired:300},sort:{columnId:'retired',direction:'asc'},selectedId:'secret',query:'private'}));
  const result=readTableView(store,key,[],[],columns);
  expect(result.columnOrder).toEqual(['city','identity','next_action','due','industry','contact','status','open']);expect(result.visibleColumnIds).toEqual(['identity','city','open']);expect(result.widths).toEqual({city:600});expect(result.sort).toBeNull();
 });
 it('persists a real personal view without record identity, query, draft or filtering data',()=>{
  const store=memory(),key=tableViewKey(scope),view={...defaultTableView(columns),sort:{columnId:'city',direction:'asc' as const},query:'PRIVATE',selectedId:'record-id',note:'draft',status:'CUSTOMER',category:'PRIVATE'};
  expect(()=>assertShellVisualKey(key)).not.toThrow();expect(()=>assertShellVisualKey(key+':selected')).toThrow();
  writeTableView(store,key,view,columns);
  const sanitized=normalizeVisualValue(key,store.getItem(key)!);expect(sanitized).not.toMatch(/PRIVATE|record-id|draft|CUSTOMER/);
  writePersonalViews(store,scope,[{id:'personal-test',name:'Ma vue',preference:JSON.parse(sanitized)}],[],[],columns);
  expect(readPersonalViews(store,scope,[],[],columns)[0].preference.sort).toEqual({columnId:'city',direction:'asc'});
 });
 it('moves real columns without adding demo-only columns or mutating the source',()=>{
  const source=Object.freeze(columns.map(c=>c.id));const moved=moveColumn(source,'city','identity',columns);
  expect(moved[0]).toBe('city');expect(new Set(moved)).toEqual(new Set(columns.map(c=>c.id)));expect(source[0]).toBe('identity');
 });
 it('keeps the historical demo schema by default',()=>{
  expect(defaultTableView().columnOrder).toEqual(['identity','category','status','date','amount','open']);
 });
});

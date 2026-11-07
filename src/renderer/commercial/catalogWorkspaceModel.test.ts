import {describe,it,expect} from 'vitest';
import type {CatalogItemSummary,CatalogVersion} from '../../shared/commercial';
import {defaultCatalogContext,paginateRows} from '../../shared/catalogTableContext';
import {catalogCounts,filterCatalogWorkspace,catalogFamilies,familyPriceHints} from './catalogWorkspaceModel';
import {sortTableRows} from '../../shared/tablePresentation';
const row=(id:string,extra:Partial<CatalogItemSummary>={}):CatalogItemSummary=>({id,name:id,type:'service',category:'Web',status:'active',visiblePublic:false,createdAt:'',updatedAt:'',currentVersion:null,...extra});
const version=(mode:CatalogVersion['priceMode'],price:number,extra:Partial<CatalogVersion>={}):CatalogVersion=>({id:'v',itemId:'x',versionNumber:1,status:'published',priceMode:mode,priceCents:price,createdAt:'',...extra});
describe('Offres & Tarifs V2 â€” projections sans mutation',()=>{
  it('counts articles with published AND draft independently, never version occurrences',()=>{
    const rows=[row('a',{versionStates:['published','draft']}),row('b',{versionStates:['draft'],status:'inactive'}),row('c',{status:'archived',versionStates:['retired']})];
    expect(catalogCounts(rows)).toEqual({total:3,active:1,inactive:1,archived:1,published:1,draft:2});
  });
  it('combines article, presence of version, visibility, type and exact category',()=>{
    const rows=[row('a',{versionStates:['draft','published'],visiblePublic:true}),row('b',{versionStates:['draft'],status:'archived',visiblePublic:true}),row('c',{versionStates:['draft'],category:'WEB',visiblePublic:true})];
    const filters={...defaultCatalogContext(),itemStatus:'active' as const,versionState:'draft' as const,visibility:'public' as const,category:'Web'};
    expect(filterCatalogWorkspace(rows,filters).map(x=>x.id)).toEqual(['a']);
    expect(filterCatalogWorkspace(rows,{...filters,versionState:'published'}).map(x=>x.id)).toEqual(['a']);
    expect(filterCatalogWorkspace(rows,{...filters,family:'Famille disparue'})).toEqual([]);
  });
  it('keeps no-version and empty results distinct from draft',()=>{
    const rows=[row('a'),row('b',{versionStates:['draft']})];
    expect(filterCatalogWorkspace(rows,{...defaultCatalogContext(),versionState:'none'}).map(x=>x.id)).toEqual(['a']);
    expect(catalogCounts([]).total).toBe(0);
  });
  it('sorts all filtered rows before pagination and bounds stale pages',()=>{
    const rows=Array.from({length:112},(_,n)=>row(String(n),{name:`TEST ${String(111-n).padStart(3,'0')}`}));
    const sorted=sortTableRows(rows,[{id:'name',sortValue:x=>x.name}],{columnId:'name',direction:'asc'},x=>x.id);
    expect(paginateRows(sorted,2,25).rows[0].name).toBe('TEST 025');
    expect(paginateRows(sorted,1,50)).toMatchObject({total:112,pages:3,end:50});
    expect(paginateRows(sorted,99,100)).toMatchObject({page:2,total:112,start:101,end:112});
    expect(paginateRows([],99,25)).toMatchObject({page:1,pages:1,start:0,end:0});
  });
  it('groups existing family labels without editing identities or stored categories',()=>{
    const rows=[row('a',{category:'Web'}),row('b',{category:'WEB'})],before=JSON.stringify(rows);
    const groups=catalogFamilies(rows);expect(groups).toHaveLength(1);
    expect(filterCatalogWorkspace(rows,{...defaultCatalogContext(),family:groups[0].id})).toHaveLength(2);
    expect(JSON.stringify(rows)).toBe(before);
  });
  it('does not sum initial, monthly, annual, quoted and third-party prices',()=>{
    const rows=[row('a',{currentVersion:version('fixed',10000)}),row('b',{currentVersion:version('monthly',1000)}),row('c',{currentVersion:version('yearly',10000)}),row('d',{currentVersion:version('quote_only',0)}),row('e',{currentVersion:version('quote_only',0,{priceBasis:'actual_cost'})})];
    expect(familyPriceHints(rows)).toEqual(['Services · Ponctuel — 100 €','Services · Mensuel — 10 € /mois','Services · Annuel — 100 € /an','Services · Sur devis','Services · Coût tiers réel — sur devis']);
  });
  it('separates two recurring prices with different billed units',()=>{
    const hints=familyPriceHints([row('a',{currentVersion:version('monthly',1000,{unit:'site'})}),row('b',{currentVersion:version('monthly',2000,{unit:'boutique'})})]);
    expect(hints).toEqual(['Services · Mensuel — 10 € /mois / site','Services · Mensuel — 20 € /mois / boutique']);
  });
  it('qualifies Maintenance one-off offers separately from recurring services',()=>{
    const hints=familyPriceHints([row('pack',{type:'offer',currentVersion:version('fixed',69000)}),row('monthly',{currentVersion:version('monthly',3900)}),row('annual',{currentVersion:version('yearly',39000)})]);
    expect(hints).toEqual(['Offres · Ponctuel — 690 €','Services · Mensuel — 39 € /mois','Services · Annuel — 390 € /an']);
  });
  it('never advertises an unpublished or archived price as a family price',()=>{
    expect(familyPriceHints([row('a',{currentVersion:version('fixed',100,{status:'draft'})}),row('b',{status:'archived',currentVersion:version('fixed',200)})])).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary } from './commercial';
import { resolveProspectCatalogRecommendations } from './catalogProspectRecommendations';

const item=(id:string,status:'active'|'inactive'|'archived'='active',versionStatus:'published'|'draft'='published'):CatalogItemSummary=>({
  id,name:'Service '+id,type:'service',status,category:'Services',visiblePublic:false,
  createdAt:'2026-10-14',updatedAt:'2026-10-14',
  currentVersion:{
    id:id+'-version',itemId:id,versionNumber:1,status:versionStatus,
    priceMode:'fixed',priceCents:9900,inclusions:[],exclusions:[],prerequisites:[],
    description:'',createdAt:'2026-10-14',
  },
});
describe('04D — suggestions Prospect sans achat implicite',()=>{
  it('prefers managed published versions and deduplicates selected or inactive items',()=>{
    const catalogue=[item('a'),item('b'),item('c','inactive'),item('d','active','draft')];
    const result=resolveProspectCatalogRecommendations(catalogue,['a'],
      ['b-version','b-version','a-version','c-version','d-version'],['a','b']);
    expect(result.map(x=>x.id)).toEqual(['b']);
    expect(catalogue[1].currentVersion?.id).toBe('b-version');
  });
  it('uses legacy suggestions only when no administered link exists',()=>{
    const catalogue=[item('a'),item('b'),item('c')];
    expect(resolveProspectCatalogRecommendations(catalogue,['a'],[],['c','b','c']).map(x=>x.id))
      .toEqual(['c','b']);
    expect(resolveProspectCatalogRecommendations(catalogue,['a'],['missing'],['b']))
      .toEqual([]);
  });
  it('does not resurrect legacy suggestions when all managed recommendations are paused',()=>{
    const catalogue=[item('a'),item('b')];
    expect(resolveProspectCatalogRecommendations(catalogue,['a'],[],['b'],true)).toEqual([]);
    expect(resolveProspectCatalogRecommendations(catalogue,['a'],[],['b'],false).map(x=>x.id)).toEqual(['b']);
  });
  it('never promotes an offer as a recommended complementary service',()=>{
    const offer={...item('bundle'),type:'offer' as const,name:'Main bundle'};
    const service=item('audit');
    expect(resolveProspectCatalogRecommendations([offer,service],[],
      ['bundle-version','audit-version'],[]).map(x=>x.id)).toEqual(['audit']);
    expect(resolveProspectCatalogRecommendations([offer],[],[],['bundle'])).toEqual([]);
  });
  it('never suggests a draft, archived service or already selected item',()=>{
    const catalogue=[item('a'),item('b','archived'),item('c','active','draft')];
    expect(resolveProspectCatalogRecommendations(catalogue,['a'],
      ['a-version','b-version','c-version'],['a','b','c'])).toEqual([]);
  });
});
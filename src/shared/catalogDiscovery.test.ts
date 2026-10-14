import { describe, expect, it } from 'vitest';
import type { CatalogItemSummary, CatalogVersion } from './commercial';
import {
  catalogIsSelectable, catalogMatchesQuery, filterCatalogDiscovery,
  normalizeCatalogueQuery,
} from './catalogDiscovery';

const build=(id:string,opts:{
  versionStatus?:CatalogVersion['status']; status?:CatalogItemSummary['status'];
  internalAdvice?:string; benefit?:string; keyword?:string; need?:string;
}={}):CatalogItemSummary=>({
  id,type:'service',name:'Audit local',category:'SEO',status:opts.status??'active',
  visiblePublic:false,createdAt:'',updatedAt:'',
  canonicalCode:'AW-SEO-LOCAL',
  currentVersion:{
    id:id+'-v1',itemId:id,versionNumber:1,status:opts.versionStatus??'published',
    createdAt:'',priceMode:'fixed',priceCents:14900,
    internalAdvice:opts.internalAdvice??null,
    commercialParameters:{
      clientNeed:opts.need??null,benefits:opts.benefit??null,keywords:opts.keyword??null,
    },
  },
});

describe('04B/E96 — recherche versionnée commune aux trois contextes',()=>{
  it('normalise les accents, espaces et majuscules',()=>{
    expect(normalizeCatalogueQuery('  Visibilité  GooGlé  ')).toBe('visibilite google');
  });
  it('trouve besoin, bénéfices et mots-clés réellement versionnés',()=>{
    const e=build('1',{need:'Visibilité Google',benefit:'Être trouvé localement',keyword:'référencement naturel; SEO de proximité'});
    expect(catalogMatchesQuery(e,'VISIBILITE google')).toBe(true);
    expect(catalogMatchesQuery(e,'etre trouve localement')).toBe(true);
    expect(catalogMatchesQuery(e,'seo de proximite')).toBe(true);
    expect(catalogMatchesQuery(e,'résultat garanti')).toBe(false);
  });
  it('trouve le code canonique exact sans changer nom/code ni ajout commercial',()=>{
    const e=build('1');
    expect(catalogMatchesQuery(e,'AW-SEO-LOCAL')).toBe(true);
    expect(e.canonicalCode).toBe('AW-SEO-LOCAL');
    expect(e.currentVersion?.status).toBe('published');
  });
  it('n’expose jamais des brouillons ou des articles archivés en Prospect/Devis, même avec recherche vide',()=>{
    const pub=build('p',{keyword:'boutique'});
    const draft=build('d',{versionStatus:'draft',keyword:'boutique'});
    const archived=build('a',{status:'archived',keyword:'boutique'});
    const retired=build('r',{versionStatus:'retired',keyword:'boutique'});
    expect(filterCatalogDiscovery([pub,draft,archived,retired],'boutique').map(x=>x.id)).toEqual(['p']);
    expect(filterCatalogDiscovery([pub,draft,archived,retired],'').map(x=>x.id)).toEqual(['p']);
    expect(catalogIsSelectable(draft)).toBe(false);
    expect(catalogIsSelectable(archived)).toBe(false);
  });
  it('autorise recherche d’un brouillon et d’un archivé uniquement en administration',()=>{
    const draft=build('d',{versionStatus:'draft',keyword:'site mariage'});
    const archived=build('a',{status:'archived',keyword:'site mariage'});
    expect(filterCatalogDiscovery([draft,archived],'site mariage','admin').map(x=>x.id)).toEqual(['d','a']);
    expect(filterCatalogDiscovery([draft,archived],'site mariage','selection')).toEqual([]);
  });
  it('n’expose pas les notes internes réservées à AtoumWeb en recherche Prospect/Devis',()=>{
    const e=build('1',{internalAdvice:'secret commercial interne'});
    expect(catalogMatchesQuery(e,'secret commercial')).toBe(false);
    expect(catalogMatchesQuery(e,'secret commercial','admin')).toBe(true);
  });
  it('un code, nom ou texte commun n’efface pas les choix quand il y a plusieurs résultats',()=>{
    const a=build('a',{need:'SEO local'}),b=build('b',{benefit:'SEO local'});
    const before=JSON.stringify([a,b]);
    expect(filterCatalogDiscovery([a,b],'seo local').map(i=>i.id)).toEqual(['a','b']);
    expect(JSON.stringify([a,b])).toBe(before);
  });
});

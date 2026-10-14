import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { catalogMatchesQuery, catalogIsSelectable } from '../../shared/catalogDiscovery';

let db: NodeSqliteAdapter;
let catalog: CatalogService;
beforeEach(()=>{
  db=new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(db);
  catalog=new CatalogService(db);
});
afterEach(()=>db.close());

describe('R04B-07 / E96 : stockage des données de recherche par version',()=>{
  it('persist besoin, bénéfices et mots-clés sans migration additionnelle ni clause CGV',()=>{
    const item=catalog.create(
      {type:'service',name:'Diagnostic référencement',category:'SEO'},
      {
        priceMode:'fixed',priceCents:14900,description:'Diagnostic de site',
        commercialParameters:{
          clientNeed:'Visibilité Google',benefits:'Être trouvé localement',
          keywords:'SEO local; référencement Dijon',work:'Analyse technique',
        },
      },
    );
    const first=catalog.getItem(item.id).versions[0];
    expect(first.status).toBe('draft');
    expect(first.commercialParameters).toMatchObject({
      clientNeed:'Visibilité Google',benefits:'Être trouvé localement',
      keywords:'SEO local; référencement Dijon',work:'Analyse technique',
    });
    expect(catalogIsSelectable(catalog.list().find(x=>x.id===item.id)!)).toBe(false);
    expect(catalog.list({search:'VISIBILITE GOOGLE'}).map(x=>x.id)).toContain(item.id);
    expect(catalog.list({search:'référencement dijon'}).map(x=>x.id)).toContain(item.id);
    catalog.publishVersion(first.id);
    const published=catalog.list({status:'active'}).find(x=>x.id===item.id)!;
    expect(catalogMatchesQuery(published,'etre trouve localement')).toBe(true);
    expect(catalogIsSelectable(published)).toBe(true);
    expect(first.commercialParameters?.keywords).toBe('SEO local; référencement Dijon');
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('une nouvelle version ne change pas les termes de recherche de la version déjà publiée',()=>{
    const created=catalog.create({type:'service',name:'Optimisation Web'},
      {priceMode:'fixed',priceCents:9900,commercialParameters:{clientNeed:'Site professionnel',keywords:'site vitrine'}});
    catalog.publishVersion(created.versions[0].id);
    const next=catalog.createVersion(created.id,{
      priceMode:'fixed',priceCents:12900,
      commercialParameters:{clientNeed:'Refonte digitale',keywords:'refonte UX'},
    });
    expect(next.status).toBe('draft');
    const selected=catalog.list().find(x=>x.id===created.id)!;
    expect(selected.currentVersion?.status).toBe('published');
    expect(catalogMatchesQuery(selected,'site vitrine')).toBe(true);
    expect(catalogMatchesQuery(selected,'refonte UX')).toBe(false);
    expect(catalog.getItem(created.id).versions.find(v=>v.id===next.id)?.commercialParameters?.keywords).toBe('refonte UX');
    expect(catalog.list({search:'refonte UX'}).some(x=>x.id===created.id)).toBe(false);
    catalog.publishVersion(next.id);
    const selectedNew=catalog.list().find(x=>x.id===created.id)!;
    expect(catalogMatchesQuery(selectedNew,'refonte UX')).toBe(true);
    expect(catalog.getItem(created.id).versions.find(v=>v.id===created.versions[0].id)?.commercialParameters?.keywords).toBe('site vitrine');
  });

  it('les termes internes ne deviennent pas des résultats Prospect/Devis',()=>{
    const created=catalog.create({type:'service',name:'Audit'},
      {priceMode:'fixed',priceCents:9900,internalAdvice:'secret négociation',commercialParameters:{clientNeed:'Mesurer son référencement'}});
    catalog.publishVersion(created.versions[0].id);
    const item=catalog.list().find(x=>x.id===created.id)!;
    expect(catalog.list({search:'secret négociation'})).toHaveLength(1);
    expect(catalogMatchesQuery(item,'secret négociation','selection')).toBe(false);
    expect(catalogMatchesQuery(item,'mesurer son referencement','selection')).toBe(true);
  });
});

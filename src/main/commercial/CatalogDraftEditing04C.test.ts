import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';

let db: NodeSqliteAdapter;
let catalog: CatalogService;
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(db);
  catalog = new CatalogService(db);
});
afterEach(() => db.close());

describe('04C / E99-E102 — sauvegarde contrôlée des versions brouillon', () => {
  it('modifie un brouillon en place, sans nouvelle version ni publication, en conservant ses autres champs', () => {
    const created = catalog.create({ type:'service',name:'Article SEO' }, {
      priceMode:'fixed',priceCents:14900,description:'Première rédaction',inclusions:['Rédaction'],
      commercialParameters:{clientNeed:'Visibilité Google',keywords:'SEO local'},
    });
    const old = created.versions[0];
    const updated = catalog.saveDraftVersion(old.id,old,{
      priceMode:'fixed',priceCents:15900,description:'Rédaction et optimisation',
      inclusions:['Rédaction','Optimisation'],commercialParameters:{clientNeed:'Visibilité Google',keywords:'référencement Dijon'},
    });
    expect(updated).toMatchObject({
      id:old.id,itemId:old.itemId,versionNumber:1,status:'draft',createdAt:old.createdAt,
      priceCents:15900,description:'Rédaction et optimisation',
    });
    expect(catalog.getItem(created.id).versions).toHaveLength(1);
    expect(catalog.list({search:'référencement dijon'}).map(x=>x.id)).toContain(created.id);
    expect(db.get<{n:number}>('SELECT count(*) AS n FROM catalog_versions WHERE item_id=?',[created.id])?.n).toBe(1);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('refuse une sauvegarde obsolète sans écraser les saisies d’une autre fenêtre', () => {
    const created=catalog.create({type:'service',name:'Maintenance WP'},{
      priceMode:'monthly',priceCents:4900,description:'A',
    });
    const original=created.versions[0];
    const newer=catalog.saveDraftVersion(original.id,original,{
      priceMode:'monthly',priceCents:5900,description:'Fenêtre 2',
    });
    expect(()=>catalog.saveDraftVersion(original.id,original,{
      priceMode:'monthly',priceCents:6900,description:'Fenêtre 1 périmée',
    })).toThrow(/Conflit/);
    expect(catalog.getItem(created.id).versions[0]).toMatchObject({
      id:original.id,priceCents:5900,description:'Fenêtre 2',
    });
    expect(catalog.getItem(created.id).versions).toHaveLength(1);
    const last=catalog.saveDraftVersion(newer.id,newer,{
      priceMode:'monthly',priceCents:6900,description:'Fenêtre 1 après relecture',
    });
    expect(last.priceCents).toBe(6900);
  });

  it('ne modifie jamais une version publiée ou retirée, même avec snapshot ancien', () => {
    const created=catalog.create({type:'service',name:'Page vitrine'},{
      priceMode:'fixed',priceCents:9900,
    });
    const first=created.versions[0];
    catalog.publishVersion(first.id);
    expect(()=>catalog.saveDraftVersion(first.id,first,{priceMode:'fixed',priceCents:10000}))
      .toThrow(/publiée ou retirée/);
    const second=catalog.createVersion(created.id,{priceMode:'fixed',priceCents:10900});
    catalog.publishVersion(second.id);
    expect(()=>catalog.saveDraftVersion(first.id,catalog.getItem(created.id).versions.find(v=>v.id===first.id)!,{
      priceMode:'fixed',priceCents:8900,
    })).toThrow(/publiée ou retirée/);
    expect(catalog.getItem(created.id).versions.find(v=>v.id===first.id)).toMatchObject({
      status:'retired',priceCents:9900,
    });
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('rejette une modification commerciale invalide en conservant la version et ses liens', () => {
    const service=catalog.create({type:'service',name:'Formation'},{
      priceMode:'fixed',priceCents:9900,
    });
    catalog.publishVersion(service.versions[0].id);
    const offer=catalog.create({type:'offer',name:'Pack formation'},{
      priceMode:'fixed',priceCents:19900,description:'Offre initiale',
    });
    const draft=offer.versions[0];
    catalog.setOfferComponents(draft.id,[{serviceVersionId:service.versions[0].id}]);
    const componentsBefore=catalog.listOfferComponents(draft.id);
    expect(()=>catalog.saveDraftVersion(draft.id,draft,{
      priceBasis:'actual_cost',priceMode:'fixed',priceCents:100,
    })).toThrow(/coût tiers réel/);
    expect(catalog.getItem(offer.id).versions[0]).toMatchObject({
      id:draft.id,priceCents:19900,description:'Offre initiale',
    });
    expect(catalog.listOfferComponents(draft.id)).toEqual(componentsBefore);
  });

  it('l’enregistrement d’une nouvelle version brouillon n’altère pas le prix historique publié', () => {
    const created=catalog.create({type:'service',name:'Page éditoriale'},{
      priceMode:'fixed',priceCents:7900,commercialParameters:{keywords:'éditorial initial'},
    });
    catalog.publishVersion(created.versions[0].id);
    const second=catalog.createVersion(created.id,{priceMode:'fixed',priceCents:8900});
    catalog.saveDraftVersion(second.id,second,{
      priceMode:'fixed',priceCents:10900,commercialParameters:{keywords:'nouvelle offre'},
    });
    const detail=catalog.getItem(created.id);
    expect(detail.currentVersion).toMatchObject({id:created.versions[0].id,status:'published',priceCents:7900});
    expect(detail.versions.find(v=>v.id===second.id)).toMatchObject({status:'draft',priceCents:10900});
    expect(detail.versions).toHaveLength(2);
  });
});

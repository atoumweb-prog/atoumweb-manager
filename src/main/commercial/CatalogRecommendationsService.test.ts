import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { CatalogRecommendationsService } from './CatalogRecommendationsService';

let db:NodeSqliteAdapter;
let catalog:CatalogService;
let recommendations:CatalogRecommendationsService;
beforeEach(()=>{
  db=new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(db);
  catalog=new CatalogService(db);
  recommendations=new CatalogRecommendationsService(db);
});
afterEach(()=>db.close());

describe('04D — versioned recommendation persistence',()=>{
  const create = (name:string) => catalog.create({type:'service',name},{
    priceMode:'fixed',priceCents:9900,
  });
  it('saves recommendations in the source draft only, referencing published versions',()=>{
    const source=create('Source');
    const target=create('Target');
    catalog.publishVersion(target.versions[0].id);
    expect(recommendations.replace(source.versions[0].id,[target.versions[0].id]))
      .toMatchObject([{sourceVersionId:source.versions[0].id,targetVersionId:target.versions[0].id}]);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('rolls back on invalid input without losing an existing association',()=>{
    const source=create('Source');
    const target=create('Target');
    const invalid=create('Not published');
    catalog.publishVersion(target.versions[0].id);
    recommendations.replace(source.versions[0].id,[target.versions[0].id]);
    expect(()=>recommendations.replace(source.versions[0].id,[invalid.versions[0].id]))
      .toThrow(/version publiée/);
    expect(recommendations.list(source.versions[0].id)).toHaveLength(1);
  });
  it('rejects self references, duplicate items, and edits on published sources',()=>{
    const source=create('Source');
    const target=create('Target');
    catalog.publishVersion(target.versions[0].id);
    expect(()=>recommendations.replace(source.versions[0].id,[source.versions[0].id])).toThrow();
    expect(()=>recommendations.replace(source.versions[0].id,[target.versions[0].id,target.versions[0].id])).toThrow(/deux fois/);
    catalog.publishVersion(source.versions[0].id);
    expect(()=>recommendations.replace(source.versions[0].id,[target.versions[0].id])).toThrow(/brouillon/);
  });
  it('does not duplicate a service already included in an offer',()=>{
    const target=create('Service included');
    catalog.publishVersion(target.versions[0].id);
    const offer=catalog.create({type:'offer',name:'Offer'},{priceMode:'fixed',priceCents:20000});
    catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:target.versions[0].id}]);
    expect(()=>recommendations.replace(offer.versions[0].id,[target.versions[0].id])).toThrow(/déjà inclus/);
  });
});

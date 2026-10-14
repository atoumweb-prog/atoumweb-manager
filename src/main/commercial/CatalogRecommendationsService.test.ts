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
  it('replays an identical save without regenerating association IDs',()=>{
    const source=create('Stable source');
    const target=create('Stable target');
    catalog.publishVersion(target.versions[0].id);
    const versionId=source.versions[0].id;
    const targetId=target.versions[0].id;
    const original=recommendations.replace(versionId,[targetId],[]);
    const retry=recommendations.replace(versionId,[targetId],[targetId]);
    expect(retry).toEqual(original);
    expect(recommendations.list(versionId)).toEqual(original);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('rejects stale edits from another window and preserves committed links',()=>{
    const source=create('Source');
    const first=create('First');
    const second=create('Second');
    catalog.publishVersion(first.versions[0].id);
    catalog.publishVersion(second.versions[0].id);
    const oldSnapshot:string[]=[];
    recommendations.replace(source.versions[0].id,[first.versions[0].id],oldSnapshot);
    expect(()=>recommendations.replace(source.versions[0].id,[second.versions[0].id],oldSnapshot))
      .toThrow(/Conflit/);
    expect(recommendations.list(source.versions[0].id).map(link=>link.targetVersionId))
      .toEqual([first.versions[0].id]);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('keeps historical links readable when the target item is deactivated',()=>{
    const source=create('Source with history');
    const target=create('Target later inactive');
    catalog.publishVersion(target.versions[0].id);
    recommendations.replace(source.versions[0].id,[target.versions[0].id],[]);
    catalog.setStatus(target.id,'inactive');
    expect(recommendations.list(source.versions[0].id)).toMatchObject([{
      targetVersionId:target.versions[0].id,
      targetName:'Target later inactive',targetVersionNumber:1,targetItemStatus:'inactive',
    }]);
    expect(()=>recommendations.replace(source.versions[0].id,[target.versions[0].id],[target.versions[0].id]))
      .toThrow(/active/);
    expect(recommendations.list(source.versions[0].id)).toHaveLength(1);
  });
  it('supports explicit removal while preserving unrelated catalogue versions',()=>{
    const source=create('Source remove');
    const target=create('Target remove');
    catalog.publishVersion(target.versions[0].id);
    recommendations.replace(source.versions[0].id,[target.versions[0].id],[]);
    expect(recommendations.replace(source.versions[0].id,[],[target.versions[0].id])).toEqual([]);
    expect(catalog.getItem(target.id).currentVersion?.id).toBe(target.versions[0].id);
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
  it('copies associations to vN+1 without changing the previous version',()=>{
    const source=create('Source v1');
    const target=create('Published target');
    catalog.publishVersion(target.versions[0].id);
    recommendations.replace(source.versions[0].id,[target.versions[0].id]);
    catalog.publishVersion(source.versions[0].id);
    const copy=catalog.createVersion(source.id,{priceMode:'fixed',priceCents:11900});
    expect(recommendations.list(copy.id).map(x=>x.targetVersionId))
      .toEqual([target.versions[0].id]);
    expect(recommendations.list(source.versions[0].id)).toHaveLength(1);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('also refuses adding an already recommended service to an offer composition',()=>{
    const target=create('Recommended service');
    catalog.publishVersion(target.versions[0].id);
    const offer=catalog.create({type:'offer',name:'Offer with recommendations'},{
      priceMode:'fixed',priceCents:20000,
    });
    recommendations.replace(offer.versions[0].id,[target.versions[0].id]);
    expect(()=>catalog.setOfferComponents(offer.versions[0].id,[
      {serviceVersionId:target.versions[0].id},
    ])).toThrow(/déjà recommandé/);
    expect(catalog.listOfferComponents(offer.versions[0].id)).toEqual([]);
    expect(recommendations.list(offer.versions[0].id)).toHaveLength(1);
  });
  it('does not duplicate a service already included in an offer',()=>{
    const target=create('Service included');
    catalog.publishVersion(target.versions[0].id);
    const offer=catalog.create({type:'offer',name:'Offer'},{priceMode:'fixed',priceCents:20000});
    catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:target.versions[0].id}]);
    expect(()=>recommendations.replace(offer.versions[0].id,[target.versions[0].id])).toThrow(/déjà inclus/);
  });
});

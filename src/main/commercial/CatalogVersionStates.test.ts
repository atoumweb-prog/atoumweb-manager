import {it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CatalogService} from './CatalogService';
it('projects all stored version states without changing the published-first current version or stored rows',()=>{
  const db=new NodeSqliteAdapter(':memory:');
  try{applyPendingMigrations(db);const service=new CatalogService(db);
    const item=service.create({name:'TEST — versions multiples',type:'service'},{priceMode:'quote_only'});
    service.publishVersion(item.versions[0].id);
    service.createVersion(item.id,{priceMode:'quote_only'});service.createVersion(item.id,{priceMode:'quote_only'});
    const before=db.all('SELECT * FROM catalog_versions WHERE item_id=? ORDER BY id',[item.id]);
    const result=service.list().find(x=>x.id===item.id)!;
    expect(result.versionStates).toEqual(['draft','published']);expect(result.currentVersion?.id).toBe(item.versions[0].id);
    expect(db.all('SELECT * FROM catalog_versions WHERE item_id=? ORDER BY id',[item.id])).toEqual(before);
  }finally{db.close();}
});

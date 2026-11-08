import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {applyPendingMigrations} from './migrations';
import {CatalogService} from '../commercial/CatalogService';
import {inspectCatalogDraftActivation,rehearseCatalogDraftActivationTemp} from './catalogDraftActivation';

describe('Préparation activation 81 — TEMP seulement',()=>{
  it('inspects without writing and rehearses an idempotent compatible activation',()=>{
    const db=new NodeSqliteAdapter(':memory:');try{
      applyPendingMigrations(db);const before=db.all('SELECT * FROM schema_migrations');
      expect(inspectCatalogDraftActivation(db)).toMatchObject({applied:false,compatible:true});
      expect(db.all('SELECT * FROM schema_migrations')).toEqual(before);
      expect(rehearseCatalogDraftActivationTemp(db).after).toMatchObject({applied:true,compatible:true});
      expect(rehearseCatalogDraftActivationTemp(db).startedFrom).toBe('81');
    }finally{db.close();}
  });
  it('reports exact ambiguous articles and refuses without reclassification',()=>{
    const db=new NodeSqliteAdapter(':memory:');try{
      applyPendingMigrations(db);const c=new CatalogService(db),a=c.create({type:'offer',name:'TEST ambigu'},{priceMode:'fixed',priceCents:100});c.createVersion(a.id,{priceMode:'fixed',priceCents:200});
      const before=db.all('SELECT * FROM catalog_versions');
      expect(inspectCatalogDraftActivation(db).duplicates).toEqual([{item_id:a.id,name:'TEST ambigu',draft_count:2}]);
      expect(()=>rehearseCatalogDraftActivationTemp(db)).toThrow('décision explicite');
      expect(db.all('SELECT * FROM catalog_versions')).toEqual(before);
    }finally{db.close();}
  });
  it('blocks incomplete experimental capabilities even with migration receipt',()=>{
    const db=new NodeSqliteAdapter(':memory:');try{
      applyPendingMigrations(db);rehearseCatalogDraftActivationTemp(db);db.exec('DROP INDEX idx_catalog_one_operational_draft');
      expect(inspectCatalogDraftActivation(db)).toMatchObject({applied:true,compatible:false});
      expect(()=>rehearseCatalogDraftActivationTemp(db)).toThrow('incomplètes');
    }finally{db.close();}
  });
  it('does not enable incomplete historical schemas',()=>{
    const db=new NodeSqliteAdapter(':memory:');try{
      expect(inspectCatalogDraftActivation(db).compatible).toBe(false);
      expect(()=>rehearseCatalogDraftActivationTemp(db)).toThrow('préalable');
    }finally{db.close();}
  });
});

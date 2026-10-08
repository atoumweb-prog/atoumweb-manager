import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CatalogService} from '../commercial/CatalogService';
import {OperationalCommercialPreparationService} from './OperationalCommercialPreparationService';

describe('Standalone commercial V3 staging',()=>{
  it.each(['AW-WEB-VITRINE','AW-LP-BASE'] as const)('%s: V3 keeps commercial fields, removes inherited components/blueprints, neutral replay',code=>{
    const db=new NodeSqliteAdapter(':memory:');
    try {
      db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);
      const catalog=new CatalogService(db),item=code==='AW-WEB-VITRINE'?'atoumweb-vitrine':'atoumweb-landing';
      catalog.assignCanonicalCode(item,code);const source=catalog.createVersion(item,{priceMode:'fixed',priceCents:69900,description:'Valid commercial data'});
      const names=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
      const before=new Map(names.map(t=>[t.name,db.all('SELECT * FROM '+t.name)]));
      const service=new OperationalCommercialPreparationService(db),id=service.prepareStandalone(code,source.id);
      const v=catalog.getItem(item).versions.find(v=>v.id===id)!;expect(v.versionNumber).toBe(3);expect(v.status).toBe('draft');expect(v.priceCents).toBe(69900);
      expect(catalog.listOfferComponents(id)).toEqual([]);expect(db.all('SELECT * FROM catalog_project_blueprints WHERE catalog_version_id=?',[id])).toEqual([]);
      for(const [t,old] of before)for(const r of old)expect(db.all('SELECT * FROM '+t)).toContainEqual(r);
      const full=JSON.stringify(names.map(t=>db.all('SELECT * FROM '+t.name)));
      expect(service.prepareStandalone(code,source.id)).toBe(id);expect(JSON.stringify(names.map(t=>db.all('SELECT * FROM '+t.name)))).toBe(full);
      expect(db.all('SELECT * FROM catalog_contract_clause_links')).toEqual(before.get('catalog_contract_clause_links'));
      const provenance=JSON.parse(String(db.get('SELECT provenance_json FROM catalog_versions WHERE id=?',[id])!.provenance_json));
      expect(provenance.operationalPreparation.removedComponents).toHaveLength(1);
      expect(provenance.operationalPreparation.removedComponents[0].service_version_id).toBe('atoumweb-web-v1');
      expect(db.get('PRAGMA integrity_check')!.integrity_check).toBe('ok');expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    }finally{db.close();}
  });
});

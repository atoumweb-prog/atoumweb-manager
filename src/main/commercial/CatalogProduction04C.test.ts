import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CatalogService} from './CatalogService';

let db:NodeSqliteAdapter;
let catalog:CatalogService;
beforeEach(()=>{
  db=new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(db);
  catalog=new CatalogService(db);
});
afterEach(()=>db.close());

describe('Lot 04C — liens production versionnés sans génération de Projet',()=>{
  it('lit les vrais modèles liés à une version et copie le lien sur la nouvelle version brouillon',()=>{
    const template=db.get<{id:string}>("SELECT id FROM project_template_versions WHERE status='published' LIMIT 1");
    expect(template?.id).toBeTruthy();
    const item=catalog.create({type:'offer',name:'Offre avec blueprint'},
      {priceMode:'fixed',priceCents:64900});
    const initial=item.versions[0];
    db.run(`INSERT INTO catalog_project_blueprints
      (id,catalog_version_id,template_version_id,role,sort_order,created_at)
      VALUES(?,?,?,?,?,?)`,
      ['04c-blueprint-1',initial.id,template!.id,'base',10,'2026-10-14T12:00:00Z']);
    const beforeProjects=db.get<{n:number}>('SELECT COUNT(*) AS n FROM projects')!.n;
    const entries=catalog.listProductionBlueprints(initial.id);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      catalogVersionId:initial.id,templateVersionId:template!.id,role:'base',sortOrder:10,
    });
    expect(entries[0].templateName.length).toBeGreaterThan(0);
    catalog.publishVersion(initial.id);
    const next=catalog.createVersion(item.id,{priceMode:'fixed',priceCents:69900});
    const copy=catalog.listProductionBlueprints(next.id);
    expect(copy).toHaveLength(1);
    expect(copy[0].id).not.toBe(entries[0].id);
    expect(copy[0].templateVersionId).toBe(entries[0].templateVersionId);
    expect(catalog.listProductionBlueprints(initial.id)).toEqual(entries);
    expect(db.get<{n:number}>('SELECT COUNT(*) AS n FROM projects')!.n).toBe(beforeProjects);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('aucun blueprint ne devient une obligation générique et un ID inconnu est refusé',()=>{
    const item=catalog.create({type:'service',name:'Retouche photo'},{
      priceMode:'fixed',priceCents:9900,
    });
    expect(catalog.listProductionBlueprints(item.versions[0].id)).toEqual([]);
    expect(()=>catalog.listProductionBlueprints('inconnu')).toThrow();
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
});

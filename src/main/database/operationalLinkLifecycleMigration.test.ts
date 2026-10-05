import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {MIGRATIONS,ensureMigrationTable,applyPendingMigrations} from './migrations';

describe('migration 62 - explicit association status',()=>{
  it('preserves legacy link payloads, preserves every other cell, default draft and neutral replay',()=>{
    const db=new NodeSqliteAdapter(':memory:');
    try {
      db.exec('PRAGMA foreign_keys=ON');ensureMigrationTable(db);
      for(const m of MIGRATIONS.filter(m=>m.id<=61)){db.exec(m.sql);db.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.id,m.name,'historical']);}
      db.run("INSERT INTO operational_import_runs VALUES('legacy-run','sha','payload','{}','historical')");
      db.run("INSERT INTO operational_model_versions VALUES('legacy-model','atoumweb-web', 'AW-TEST-LEGACY',1,'ready','legacy-run','content','{}','historical')");
      db.run("INSERT INTO catalog_operational_links VALUES('legacy-link','atoumweb-web-v1','legacy-model',NULL,1,'{}','historical')");
      const tables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      const before=new Map(tables.map(t=>[t.name,db.all('SELECT * FROM '+t.name)]));
      expect(applyPendingMigrations(db).map(m=>m.id)).toEqual([62]);
      for(const [t,rows] of before) {
        const after=db.all('SELECT * FROM '+t+(t==='schema_migrations'?' WHERE id<=61':''));
        expect(t==='catalog_operational_links'?after.map(({status,...old})=>old):after).toEqual(rows);
      }
      expect(db.get('SELECT status FROM catalog_operational_links')!.status).toBe('ready');
      db.run("INSERT INTO catalog_operational_links(id,catalog_version_id,model_version_id,revision,provenance_json,created_at) VALUES('new-link','atoumweb-web-v1','legacy-model',2,'{}','today')");
      expect(db.get("SELECT status FROM catalog_operational_links WHERE id='new-link'")!.status).toBe('draft');
      expect(()=>db.run("INSERT INTO catalog_operational_links VALUES('skip-stage','atoumweb-web-v1','legacy-model',NULL,3,'{}','today','ready')")).toThrow(/staged/);
      expect(()=>db.run("UPDATE catalog_operational_links SET status='draft' WHERE id='legacy-link'")).toThrow(/demoted/);
      expect(()=>db.run("UPDATE catalog_operational_links SET revision=revision")).toThrow(/immutable/);
      const after=JSON.stringify(tables.map(t=>db.all('SELECT * FROM '+t.name)));
      expect(applyPendingMigrations(db)).toEqual([]);
      expect(JSON.stringify(tables.map(t=>db.all('SELECT * FROM '+t.name)))).toBe(after);
      expect(db.get('PRAGMA integrity_check')!.integrity_check).toBe('ok');expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    }finally{db.close();}
  });
});

import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {MIGRATIONS,ensureMigrationTable,getPendingMigrations} from './migrations';

const apply61=(db:NodeSqliteAdapter)=>{const pending=getPendingMigrations(db).filter(m=>m.id===61);for(const m of pending){db.exec(m.sql);db.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.id,m.name,'fixture']);}return pending;};

describe('migration 61 additive',()=>{
 it('une seule table vide, toutes les anciennes cellules et schémas conservés, rejeu neutre',()=>{
  const db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');ensureMigrationTable(db);
  try{
   for(const m of MIGRATIONS.filter(m=>m.id<=60)){db.exec(m.sql);db.run('INSERT INTO schema_migrations(id,name,applied_at) VALUES(?,?,?)',[m.id,m.name,'2026-10-04']);}
   db.run('INSERT INTO settings(key,value_json,updated_at) VALUES(?,?,?)',['8a1-sentinel','{"never":"backfill"}','2026-10-04']);
   const tables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
   const schema=db.all('SELECT name,sql FROM sqlite_master WHERE type IN (\'table\',\'index\',\'trigger\') ORDER BY name');
   const before=tables.map(t=>({name:t.name,rows:db.all('SELECT * FROM '+t.name)}));
   expect(apply61(db).map(m=>m.id)).toEqual([61]);
   expect(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").filter(t=>!tables.some(old=>old.name===t.name))).toEqual([{name:'project_contribution_targets'}]);
   expect(db.all('SELECT * FROM project_contribution_targets')).toEqual([]);
   for(const t of before)expect(db.all('SELECT * FROM '+t.name+(t.name==='schema_migrations'?' WHERE id<=60':''))).toEqual(t.rows);
   for(const row of schema)expect(db.get('SELECT name,sql FROM sqlite_master WHERE name=?',[String(row.name)])).toEqual(row);
   const after=db.all('SELECT type,name,sql FROM sqlite_master ORDER BY type,name'),ledger=db.all('SELECT * FROM schema_migrations');
   expect(apply61(db)).toEqual([]);expect(db.all('SELECT type,name,sql FROM sqlite_master ORDER BY type,name')).toEqual(after);expect(db.all('SELECT * FROM schema_migrations')).toEqual(ledger);
   expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  }finally{db.close();}
 });
});

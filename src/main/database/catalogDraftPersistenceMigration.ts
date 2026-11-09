import {realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import type {DatabaseAdapter} from './DatabaseAdapter';

/** Explicit TEMP-only experiment; NEVER part of automatic pending migrations. */
export const CATALOG_DRAFT_EXPERIMENT = {id:81,name:'catalog_persistent_drafts_temp_v1'} as const;
/** Refuse any attached file outside the OS temp directory or under Validation-MSI (in-memory allowed). */
export function assertIsolatedTempDatabase(db:DatabaseAdapter,message='Migration Catalogue autorisée uniquement sur une base TEMP isolée.'):void {
  const files=db.all<{file:string}>('PRAGMA database_list');
  const root=realpathSync(tmpdir());
  for(const {file} of files){if(!file)continue;const actual=realpathSync(file),relative=path.relative(root,actual);
    if(relative.startsWith('..')||path.isAbsolute(relative)||/validation-msi/i.test(actual))throw Error(message);}
}
export function applyCatalogDraftPersistenceTemp(db:DatabaseAdapter):void {
  assertIsolatedTempDatabase(db);
  const applied=db.get<{name:string}>('SELECT name FROM schema_migrations WHERE id=?',[81]);
  if(applied){if(applied.name!==CATALOG_DRAFT_EXPERIMENT.name||!db.get("SELECT name FROM pragma_table_info('catalog_versions') WHERE name='save_revision'"))throw Error('Historique expérimental incompatible.');return;}
  const duplicates=db.all<{item_id:string}>('SELECT item_id FROM catalog_versions WHERE status=\'draft\' GROUP BY item_id HAVING count(*)>1');
  if(duplicates.length)throw Error('Plusieurs brouillons historiques : décision manuelle requise pour '+duplicates.map(r=>r.item_id).join(', '));
  if(db.all('PRAGMA foreign_key_check').length)throw Error('Intégrité initiale invalide.');
  const schema=db.get<{sql:string}>("SELECT sql FROM sqlite_master WHERE type='table' AND name='catalog_versions'")!.sql;
  const objects=db.all<{sql:string;name:string;type:string}>("SELECT sql,name,type FROM sqlite_master WHERE sql IS NOT NULL AND ((tbl_name='catalog_versions' AND type IN ('index','trigger')) OR (type='trigger' AND instr(sql,'catalog_versions')>0))");
  const columns=db.all<{name:string}>("PRAGMA table_info('catalog_versions')").map(c=>'"'+c.name+'"').join(',');
  const nullable=schema.replace(/price_mode TEXT NOT NULL/, 'price_mode TEXT');
  if(nullable===schema)throw Error('Définition price_mode inattendue.');
  const rebuilt=nullable.replace(/CREATE TABLE\s+["`]?catalog_versions["`]?/i,'CREATE TABLE catalog_versions_next')
    .replace(/,\s*UNIQUE\s*\(item_id,\s*version_number\)/i, ', last_saved_at TEXT, save_revision INTEGER NOT NULL DEFAULT 0 CHECK(save_revision>=0), abandoned_at TEXT, UNIQUE(item_id,version_number)')
    .replace(/\)\s*STRICT\s*$/i,`,
      CHECK(price_mode IS NOT NULL OR (status='draft' AND price_cents IS NULL)),
      CHECK(abandoned_at IS NULL OR status='draft')) STRICT`);
  const fk=Number(db.get<{foreign_keys:number}>('PRAGMA foreign_keys')?.foreign_keys??0);
  db.exec('PRAGMA foreign_keys=OFF;');
  let transaction=false;
  try {
    db.exec('BEGIN IMMEDIATE;');transaction=true;
    for(const o of objects)if(o.type==='trigger')db.exec('DROP TRIGGER "'+o.name.replace(/"/g,'""')+'"');
    db.exec(rebuilt);
    db.exec(`INSERT INTO catalog_versions_next(${columns}) SELECT ${columns} FROM catalog_versions; DROP TABLE catalog_versions; ALTER TABLE catalog_versions_next RENAME TO catalog_versions;`);
    for(const object of objects){let sql=object.sql;
      if(sql.includes('catalog_actual_cost_'))sql=sql.replace("NEW.price_mode<>'quote_only'", "(NEW.price_mode IS NOT NULL AND NEW.price_mode<>'quote_only')").replace('UPDATE OF price_basis,price_mode,price_cents','UPDATE OF price_basis,price_mode,price_cents,status');
      db.exec(sql);}
    db.exec(`CREATE UNIQUE INDEX idx_catalog_one_operational_draft ON catalog_versions(item_id) WHERE status='draft' AND abandoned_at IS NULL;
      CREATE INDEX idx_catalog_open_drafts ON catalog_versions(last_saved_at DESC,created_at DESC,id) WHERE status='draft' AND abandoned_at IS NULL;
      CREATE TABLE catalog_command_receipts(request_id TEXT PRIMARY KEY,operation TEXT NOT NULL CHECK(operation IN ('create_minimal','duplicate')),intent_sha256 TEXT NOT NULL CHECK(length(intent_sha256)=64),item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE RESTRICT,created_at TEXT NOT NULL) STRICT;`);
    // Existing subdomain transactions remain separate; abandoned versions are read-only.
    const domains=[['offer_components','offer_version_id'],['catalog_contract_type_links','catalog_version_id'],['catalog_project_blueprints','catalog_version_id'],['catalog_version_recommendations','source_version_id'],['catalog_commercial_rules','catalog_version_id'],['catalog_operational_links','catalog_version_id']];
    for(const [table,column] of domains)for(const action of ['INSERT','UPDATE','DELETE']){
      const row=action==='DELETE'?'OLD':'NEW';
      db.exec(`CREATE TRIGGER draft_abandoned_${table}_${action.toLowerCase()} BEFORE ${action} ON ${table}
        WHEN EXISTS(SELECT 1 FROM catalog_versions WHERE id IN (${row}.${column}${action==='UPDATE'?`,OLD.${column}`:''}) AND abandoned_at IS NOT NULL)
        BEGIN SELECT RAISE(ABORT,'Version abandonnée : restauration requise avant modification.'); END;`);
    }
    if(db.all('PRAGMA foreign_key_check').length)throw Error('Migration annulée : clés étrangères invalides.');
    if(db.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check!=='ok')throw Error('Migration annulée : intégrité invalide.');
    db.run('INSERT INTO schema_migrations(id,name,applied_at) VALUES(?,?,?)',[81,CATALOG_DRAFT_EXPERIMENT.name,new Date().toISOString()]);
    db.exec('COMMIT;');transaction=false;
  }catch(error){if(transaction)db.exec('ROLLBACK;');throw error;}
  finally{db.exec('PRAGMA foreign_keys='+fk);}
}

import type {DatabaseAdapter} from './DatabaseAdapter';
import {CATALOG_DRAFT_EXPERIMENT,applyCatalogDraftPersistenceTemp} from './catalogDraftPersistenceMigration';
import {MIGRATIONS} from './migrations';

/** Read-only preflight. No environment selection, migration, or historical cleanup. */
export function inspectCatalogDraftActivation(db:DatabaseAdapter) {
  const objects=db.all<{name:string;type:string;sql:string|null}>("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name");
  const exists=(name:string)=>objects.some(o=>o.type==='table'&&o.name===name);
  const history=exists('schema_migrations')?db.all<{id:number;name:string}>('SELECT id,name FROM schema_migrations ORDER BY id'):[];
  const blockers:string[]=[];
  for(const expected of MIGRATIONS)if(!history.some(h=>h.id===expected.id&&h.name===expected.name))blockers.push(`Migration préalable absente/incompatible : ${expected.id}`);
  for(const row of history)if(!MIGRATIONS.some(m=>m.id===row.id&&m.name===row.name)&&!(row.id===81&&row.name===CATALOG_DRAFT_EXPERIMENT.name))blockers.push(`Migration inconnue : ${row.id}/${row.name}`);
  const columns=exists('catalog_versions')?db.all<{name:string;notnull:number}>("PRAGMA table_info('catalog_versions')"):[];
  const has=(name:string)=>columns.some(c=>c.name===name);
  const applied=history.some(h=>h.id===81&&h.name===CATALOG_DRAFT_EXPERIMENT.name);
  const metadata=['save_revision','last_saved_at','abandoned_at'];
  if(applied&&(!metadata.every(has)||!exists('catalog_command_receipts')||!objects.some(o=>o.type==='index'&&o.name==='idx_catalog_one_operational_draft')||columns.find(c=>c.name==='price_mode')?.notnull!==0))blockers.push('Capacités du schéma 81 incomplètes');
  if(!applied&&(metadata.some(has)||exists('catalog_command_receipts')))blockers.push('Schéma expérimental partiel sans historique 81');
  const duplicates=exists('catalog_versions')?db.all<{item_id:string;name:string;draft_count:number}>(`SELECT v.item_id,i.name,count(*) AS draft_count FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE v.status='draft' ${has('abandoned_at')?'AND v.abandoned_at IS NULL':''} GROUP BY v.item_id HAVING count(*)>1 ORDER BY v.item_id`):[];
  if(duplicates.length)blockers.push('Plusieurs brouillons opérationnels : décision explicite requise');
  const foreignKeys=db.all('PRAGMA foreign_key_check');
  const integrity=db.all<{integrity_check:string}>('PRAGMA integrity_check');
  if(foreignKeys.length||integrity.length!==1||integrity[0].integrity_check!=='ok')blockers.push('Intégrité initiale invalide');
  return {applied,compatible:blockers.length===0,blockers,duplicates,history,columns,objects,foreignKeys,integrity};
}

/** Preparation seam ONLY: existing TEMP guard remains mandatory. No startup/IPC hook. */
export function rehearseCatalogDraftActivationTemp(db:DatabaseAdapter) {
  const before=inspectCatalogDraftActivation(db);
  if(!before.compatible)throw Error(before.blockers.join('; '));
  applyCatalogDraftPersistenceTemp(db);
  const after=inspectCatalogDraftActivation(db);
  if(!after.applied||!after.compatible)throw Error('Contrôle après migration 81 non conforme');
  return {operation:'catalog_draft_activation_temp',startedFrom:before.applied?'81':'historical',completedAt:new Date().toISOString(),before,after};
}

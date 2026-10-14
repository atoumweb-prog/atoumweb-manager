import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import type {SqlValue} from '../database/DatabaseAdapter';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from '../commercial/QuoteService';
import data from './operationalRecipeFixture.json';
import {contributionExamples} from './contributionReferenceFixture';
export const recipeFixtureLabel=data.label;
export const recipeFixtureFingerprint=createHash('sha256').update(JSON.stringify(data)).digest('hex');
/** Controlled source only: migrate/seed in memory, then export one complete SQLite file.
 * This avoids hundreds of durable disk commits on Windows CI, without relaxing SQLite checks.
 * Every caller still receives its own database; no shared cache or development workspace. */
export function createOperationalRecipeFixture(file:string,legacyHistoire=false,onPhase?:(phase:string,elapsedMs:number)=>void) {
 let lastPhase=performance.now();
 const mark=(phase:string)=>{const now=performance.now();onPhase?.(phase,Math.round(now-lastPhase));lastPhase=now;};
 const db=new NodeSqliteAdapter(':memory:'),now='2026-10-06T00:00:00.000Z';
 try {
  db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);mark('migrations');
  const insert=(table:string,row:Record<string,unknown>)=>db.run(`INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`,Object.values(row) as SqlValue[]);
  for(const [key,blueprint] of Object.entries(data.blueprints)) {
   if(legacyHistoire&&key===data.models.find(m=>m.model.code==='AW-MARIAGE-HISTOIRE')!.blueprintKey)continue;
   for(const [table,rows] of [['project_templates',[blueprint.template]],['project_template_versions',[blueprint.version]],['project_template_nodes',blueprint.nodes],['project_template_sites',blueprint.sites],['project_template_site_pages',blueprint.pages],['blueprint_operational_profiles',[blueprint.profile]]] as const){if(table==='project_template_nodes'){const pending=[...rows];while(pending.length){const index=pending.findIndex(row=>!('parent_id' in row)||!row.parent_id||db.get('SELECT id FROM project_template_nodes WHERE id=?',[String(row.parent_id)]));if(index<0)throw Error('Hiérarchie de fixture invalide');insert(table,pending.splice(index,1)[0]);}}else for(const row of rows)insert(table,row);}
  }
  insert('operational_import_runs',{id:'recipe-fixture-import',source_sha256:recipeFixtureFingerprint,payload_sha256:recipeFixtureFingerprint,manifest_json:JSON.stringify({fixture:true}),created_at:now});
  for(const entry of data.models) {
   const isLegacy=legacyHistoire&&entry.model.code==='AW-MARIAGE-HISTOIRE';
   const model=isLegacy?contributionExamples.models.find(m=>m.code===entry.model.code)!:entry.model;
   const code=model.code,itemId='recipe-item-'+code,catalogId='recipe-catalog-'+code,modelId='recipe-model-'+code;
   const blueprintKey=isLegacy?data.models.find(m=>m.model.code==='AW-MARIAGE-ESS')!.blueprintKey:entry.blueprintKey;
   const blueprint=blueprintKey?data.blueprints[blueprintKey as keyof typeof data.blueprints]:null;
   insert('catalog_items',{id:itemId,item_type:entry.catalog.commercialKind==='offer'?'offer':'service',name:'Fixture '+entry.catalog.name,status:'active',visible_public:0,canonical_code:code,created_at:now,updated_at:now});
   insert('catalog_versions',{id:catalogId,item_id:itemId,version_number:entry.catalogVersion,status:'draft',description:'Prestation synthétique du diagnostic',price_mode:entry.catalog.priceMode,price_cents:entry.catalog.priceCents,commercial_kind:entry.catalog.commercialKind,family_code:entry.catalog.familyCode,created_at:now});
   insert('operational_model_versions',{id:modelId,catalog_item_id:itemId,canonical_code:code,version_number:isLegacy?1:entry.modelVersion,import_run_id:'recipe-fixture-import',content_sha256:createHash('sha256').update(JSON.stringify(model)).digest('hex'),model_json:JSON.stringify(model),created_at:now});
   insert('catalog_operational_links',{id:'recipe-link-'+code,catalog_version_id:catalogId,model_version_id:modelId,blueprint_version_id:blueprint?.version.id??null,revision:1,provenance_json:JSON.stringify({fixture:true,configuration:entry.policy}),status:'draft',created_at:now});
   if(blueprint)insert('catalog_project_blueprints',{id:'recipe-blueprint-link-'+code,catalog_version_id:catalogId,template_version_id:blueprint.version.id,role:entry.policy.structuralRole,quantity_mode:entry.policy.quantity.structureMode==='per_unit'?'per_unit':'once',site_mode:entry.policy.structuralRole==='base'?'create':'extend_base',sort_order:10,created_at:now});
  }
  const crm=new CrmService(db),org=crm.createOrganization({name:'TEST — Fixture recette'}),prospect=crm.createProspect({organizationId:org.id,primaryNeed:'Fixture déterministe'}),quotes=new QuoteService(db,crm);
  const quote=quotes.create({prospectId:prospect.id,subject:'TEST — Donneur de lignes synthétiques'});quotes.addCustomLine(quote.id,{label:'Ligne donneuse',quantityMilli:1000,proposedUnitPriceCents:100});
  mark('seed');
  if(db.get('PRAGMA integrity_check')?.integrity_check!=='ok'||db.all('PRAGMA foreign_key_check').length)throw Error('Fixture incohérente');
  mark('source-integrity');
  // Export only after successful seeding and integrity/FK checks. VACUUM INTO refuses
  // an existing non-empty destination; never change durability settings or overwrite it.
  db.run('VACUUM INTO ?',[file]);mark('vacuum-into');
 }finally{db.close()}
}

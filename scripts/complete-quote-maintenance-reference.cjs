'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{DatabaseSync,backup}=require('node:sqlite');
function loadReference(file){
 const db=new DatabaseSync(file,{readOnly:true});try{
  const row=db.prepare(`SELECT i.name,i.canonical_code,v.id,v.version_number,v.inclusions_json,v.exclusions_json,v.commercial_parameters_json FROM catalog_items i JOIN catalog_versions v ON v.item_id=i.id WHERE i.canonical_code='AW-MAINT-WC-M' AND v.status='published' ORDER BY v.version_number DESC LIMIT 1`).get();
  if(!row)throw Error('Référence mensuelle WooCommerce publiée absente.');
  const inclusions=JSON.parse(row.inclusions_json),exclusions=JSON.parse(row.exclusions_json),cp=JSON.parse(row.commercial_parameters_json||'{}');
  const scope=[...inclusions,cp.work?'Travaux prévus : '+cp.work:''].filter(Boolean).join('\n');
  if(!scope||!exclusions.length||/mêmes? (périmètre|exclusions)/i.test(scope+'\n'+exclusions.join('\n')))throw Error('La référence doit être complète.');
  return {sourceFile:path.resolve(file),sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),label:row.name,versionId:row.id,versionNumber:row.version_number,scope,exclusions:exclusions.join('\n')};
 }finally{db.close();}
}
module.exports={loadReference};
if(require.main===module)(async()=>{
 const workspace=path.resolve(process.argv[2]||''),source=process.argv[3];
 if(!source||!/^Manager-Devis-CGV-20261025-/.test(path.basename(path.dirname(workspace)))||path.basename(workspace)!=='Workspace')throw Error('Seule une nouvelle livraison TEST du 25/10 est autorisée.');
 if(!JSON.parse(fs.readFileSync(path.join(workspace,'RECETTE-PILOTE.json'),'utf8')).onlySynthetic)throw Error('Workspace TEST requis.');
 const reference=loadReference(source),dbFile=path.join(workspace,'data/atoumweb-manager.sqlite'),snapshot=path.join(workspace,'backups','avant-perimetre-maintenance-20261025.sqlite');
 if(fs.existsSync(snapshot))throw Error('Reprise déjà effectuée : refus de réécriture.');
 const original=new DatabaseSync(dbFile,{readOnly:true});try{await backup(original,snapshot);}finally{original.close();}
 const bundle=path.join(workspace,'backups','parameters-tool.cjs');require('esbuild').buildSync({stdin:{contents:"export {NodeSqliteAdapter} from './src/main/database/NodeSqliteAdapter';export {CommercialRulesService} from './src/main/commercial/CommercialRulesService';",resolveDir:path.resolve(__dirname,'..'),loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:bundle,logLevel:'silent'});
 const {NodeSqliteAdapter,CommercialRulesService}=require(bundle),db=new NodeSqliteAdapter(dbFile),rules=new CommercialRulesService(db),changed=[];
 try{
  const q=db.get("SELECT id,status,finalized_at FROM quotes WHERE quote_number='DEV-2026-003'");if(!q||q.status!=='draft'||q.finalized_at)throw Error('Brouillon DEV-2026-003 modifiable requis.');
  const before=db.all('SELECT * FROM quote_lines WHERE quote_id=?',[q.id]);db.exec('BEGIN IMMEDIATE');
  try{for(const line of before){const s=JSON.parse(line.snapshot_json||'{}'),old=rules.parameters(line.id)||{};let next=old;
    if(s.canonicalCode==='AW-MAINT-WC-A')next={...old,contractNature:old.contractNature??'continuous',scope:old.scope?.trim()?old.scope:reference.scope,scopeExclusions:old.scopeExclusions?.trim()?old.scopeExclusions:reference.exclusions,serviceDuration:old.serviceDuration?.trim()?old.serviceDuration:String(s.commercialParameters?.deliveryTerms||'')};
    if(line.catalog_item_id==='atoumweb-ecommerce')next={...old,contractNature:old.contractNature??'one_off',productCount:old.productCount??{kind:'included',count:10}};
    if(line.catalog_item_id==='atoumweb-produits51'&&line.quantity_milli===51000)next={...old,contractNature:old.contractNature??'one_off',productCount:old.productCount??{kind:'additional',count:51}};
    if(JSON.stringify(next)!==JSON.stringify(old)){rules.setParameters(line.id,next);changed.push({lineId:line.id,label:line.label,before:old,after:next});}
  }
  if(JSON.stringify(db.all('SELECT * FROM quote_lines WHERE quote_id=?',[q.id]))!==JSON.stringify(before))throw Error('Les lignes vendues ont changé.');
  if(changed.length)db.run('UPDATE quotes SET updated_at=? WHERE id=?',[new Date().toISOString(),q.id]);db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  if(db.get('PRAGMA integrity_check').integrity_check!=='ok'||db.all('PRAGMA foreign_key_check').length)throw Error('Intégrité/FK');
  fs.writeFileSync(path.join(workspace,'backups','perimetre-maintenance-20261025.json'),JSON.stringify({reference,changed,soldLinesAndPricesUnchanged:true,noDatesOrRenewalsInvented:true},null,2));console.log(JSON.stringify({updatedLines:changed.length,soldLinesAndPricesUnchanged:true,reference:reference.label}));
 }finally{db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

'use strict';
// Explicit saved/restored copy only. Never receives a workspace or source database directly.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',windowsHide:true});
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1);
}
const assert=(ok,why)=>{if(!ok)throw Error(why)},arg=process.argv.indexOf('--snapshot-report');assert(arg>=0,'Explicit snapshot report required');
const reportPath=fs.realpathSync(process.argv[arg+1]),snapshot=JSON.parse(fs.readFileSync(reportPath,'utf8')),copy=fs.realpathSync(snapshot.restoredCopy),dir=path.dirname(reportPath);
assert(snapshot.restorationLogicalEquality===true&&snapshot.migrationExecutedOnSource===false,'Verified restoration required');
const relative=path.relative(fs.realpathSync(os.tmpdir()),copy);assert(!relative.startsWith('..')&&!path.isAbsolute(relative)&&path.basename(path.dirname(copy)).startsWith('atoumweb-catalog-activation-')&&!/validation-msi/i.test(copy),'Only owned restored TEMP copy allowed');
assert(crypto.createHash('sha256').update(fs.readFileSync(snapshot.backup)).digest('hex')===snapshot.backupSha256,'Backup fingerprint mismatch');
const bundle=path.join(dir,'activation-services.cjs');assert(!fs.existsSync(bundle),'Use a new review directory');
require('esbuild').buildSync({stdin:{contents:[['database/catalogDraftActivation'],['database/NodeSqliteAdapter'],['commercial/CatalogService']].map(([s])=>`export * from '${repo.replace(/\\/g,'/')}/src/main/${s}';`).join('\n'),resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:bundle,external:['electron'],logLevel:'silent'});
const S=require(bundle);let db=new S.NodeSqliteAdapter(copy);db.exec('PRAGMA foreign_keys=ON');
const quote=s=>'"'+s.replace(/"/g,'""')+'"',hash=rows=>crypto.createHash('sha256').update(JSON.stringify(rows.map(row=>JSON.stringify(row)).sort())).digest('hex');
const rows=(table,columns='*')=>db.all(`SELECT ${columns} FROM ${quote(table)}`);
try{
 const before=S.inspectCatalogDraftActivation(db),tables=db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name);
 const saved=Object.fromEntries(tables.map(t=>[t,{columns:db.all(`PRAGMA table_info(${quote(t)})`).map(c=>c.name),rows:rows(t)}]));
 const foreignKeys=Object.fromEntries(tables.map(t=>[t,db.all(`PRAGMA foreign_key_list(${quote(t)})`)]));
 const inventory=tables.map(t=>({table:t,count:saved[t].rows.length,foreignKeys:foreignKeys[t]}));
 const duplicates=before.duplicates.map(item=>({...item,versions:saved.catalog_versions.rows.filter(v=>v.item_id===item.item_id),references:inventory.filter(t=>t.foreignKeys.some(f=>f.table==='catalog_versions')).map(t=>({table:t.table,rows:saved[t.table].rows.filter(r=>t.foreignKeys.some(f=>f.table==='catalog_versions'&&saved.catalog_versions.rows.some(v=>v.item_id===item.item_id&&r[f.from]===v[f.to])))}))}));
 const result={copy,source:snapshot.source,inventory,preflight:before,duplicates,migrationExecuted:false,checks:[]};
 if(!before.compatible){
  result.checks.push('Incompatible copy blocked without mutation');
  assert(tables.every(t=>hash(rows(t))===hash(saved[t].rows)),'Blocked preflight changed data');
 }else{
  result.activation=S.rehearseCatalogDraftActivationTemp(db);result.migrationExecuted=true;
  for(const t of tables){
   const historical=rows(t,saved[t].columns.map(quote).join(','));
   if(t==='schema_migrations')assert(hash(historical.filter(r=>r.id!==81))===hash(saved[t].rows.filter(r=>r.id!==81)),'Migration history changed');
   else assert(hash(historical)===hash(saved[t].rows),'Historical rows changed: '+t);
   assert(JSON.stringify(db.all(`PRAGMA foreign_key_list(${quote(t)})`))===JSON.stringify(foreignKeys[t]),'Foreign keys changed: '+t);
  }
  result.checks.push('Every existing table historical field, ID, row and foreign key preserved before functional tests');
  const objects=db.all("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'");
  for(const o of before.objects){assert(objects.some(n=>n.name===o.name&&n.type===o.type),'Missing object '+o.name);
   if(!(o.type==='table'&&o.name==='catalog_versions')&&!o.name.includes('catalog_actual_cost_'))assert(objects.find(n=>n.name===o.name&&n.type===o.type).sql===o.sql,'Unexpected definition change '+o.name);
  }
  result.checks.push('Existing schema objects preserved except documented catalog_versions and actual-cost trigger changes');
  if(!process.argv.includes('--migration-only')){
  const c=new S.CatalogService(db),created=c.createPersistent({type:'service',name:'TEST — Activation isolée 81'},{priceMode:null},crypto.randomUUID()),version=created.versions[0];
  c.saveDraftVersion(version.id,version,{...version,description:'TEST — Sauvegarde sur copie restaurée'});
  db.close();db=new S.NodeSqliteAdapter(copy);db.exec('PRAGMA foreign_keys=ON');const next=new S.CatalogService(db);
  assert(next.getItem(created.id).versions[0].description==='TEST — Sauvegarde sur copie restaurée','Resume failed');result.checks.push('Minimal creation, manual save and exact resume after physical reopen');
  const source=next.list().find(i=>i.type==='offer')||created,detail=next.getItem(source.id),sourceVersion=detail.versions[0],preview=next.duplicationPreview(source.id,sourceVersion.id),request=crypto.randomUUID();
  const input={sourceItemId:source.id,sourceVersionId:sourceVersion.id,expected:sourceVersion,referenceFingerprint:preview.referenceFingerprint,name:'TEST — Duplication isolée 81',copyCategory:true,copyReferences:true};
  const duplicated=next.duplicate(input,request);assert(duplicated.id!==source.id&&duplicated.canonicalCode===null&&duplicated.versions.length===1,'Independent duplicate failed');assert(next.duplicate(input,request).id===duplicated.id,'Replay failed');
  result.checks.push('Chosen source version duplicated independently with explicit references and durable replay');
  result.functionalReferences=preview.references;
  }else result.checks.push('Migration-only mode: no functional fixture inserted into the clean integration candidate');
 }
 result.finalIntegrity=db.all('PRAGMA integrity_check');result.finalForeignKeys=db.all('PRAGMA foreign_key_check');assert(result.finalIntegrity.length===1&&result.finalIntegrity[0].integrity_check==='ok'&&result.finalForeignKeys.length===0,'Final integrity failed');
 fs.writeFileSync(path.join(dir,'ESSAI-MIGRATION-COPIE.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({migrationExecuted:result.migrationExecuted,blockers:before.blockers,duplicates:before.duplicates,checks:result.checks}));
}finally{db.close();fs.unlinkSync(bundle);}

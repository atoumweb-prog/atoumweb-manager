'use strict';
// Service recipe on a second disposable copy; never publish in the integration candidate.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
if(!process.versions.electron){const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{encoding:'utf8',windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},timeout:120000,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1);}
const input=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]),repo=path.resolve(__dirname,'..');
const relative=path.relative(fs.realpathSync(os.tmpdir()),input);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('TEMP source required');
if(fs.existsSync(out))throw Error('New report required');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-activation-recipe-')),bundle=path.join(temp,'services.cjs');
require('esbuild').buildSync({stdin:{contents:[['src/main/database/DatabaseService'],['src/main/workspace'],['src/shared/quoteDocumentHtml'],['scripts/fixtures/approved-v394-payment']].map(([s])=>`export * from '${repo.replace(/\\/g,'/')}/${s}';`).join('\n'),resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:bundle,external:['electron'],banner:{js:'module.paths.unshift('+JSON.stringify(path.join(repo,'node_modules'))+');'},loader:{'.png':'dataurl'},logLevel:'silent'});
const S=require(bundle),{DatabaseSync,backup}=require('node:sqlite'),{randomUUID}=require('node:crypto');
(async()=>{
 const workspace=S.ensureWorkspace(path.join(temp,'workspace')),source=new DatabaseSync(input,{readOnly:true});try{await backup(source,workspace.databaseFile);}finally{source.close();}
 let db=new S.DatabaseService(workspace);const expectedRejections=[],checks=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);},reject=(fn,label)=>{let error;try{fn();}catch(e){if(e instanceof TypeError)throw e;error=String(e);}check(!!error,label);expectedRejections.push({label,error});return error;};
 try{
  await db.initialize();check(db.catalog.persistenceAvailable(),'Normal DatabaseService startup recognizes schema 81 without automatic activation');
  const original=JSON.stringify(db.database.all('SELECT * FROM contract_clause_versions ORDER BY id'));
  const request=randomUUID(),created=db.catalog.createPersistent({type:'service',name:'TEST activation — minimal'},{priceMode:null},request),v=created.versions[0];
  check(v.priceMode===null&&v.status==='draft'&&created.versions.length===1,'Name/type only creates a real incomplete draft');
  check(db.catalog.createPersistent({type:'service',name:'TEST activation — minimal'},{priceMode:null},request).id===created.id,'Creation idempotence preserves ID');
  const saved=db.catalog.saveDraftVersion(v.id,v,{...v,description:'TEST manual save'});
  reject(()=>db.catalog.saveDraftVersion(v.id,v,{...v,description:'TEST stale write'}),'Stale revision rejected');
  db.close();db=new S.DatabaseService(workspace);await db.initialize();
  check(db.catalog.getItem(created.id).versions[0].id===v.id&&db.catalog.getItem(created.id).versions[0].description==='TEST manual save','Physical close/restart resumes exact saved draft');
  check(db.catalog.getItem(created.id).versions[0].lastSavedAt!==null,'Manual save has a real last_saved_at');
  reject(()=>db.catalog.publishVersion(v.id),'Incomplete draft cannot publish');
  let abandoned=db.catalog.setDraftAbandoned(v.id,saved,true);check(!!abandoned.abandonedAt,'Reversible abandonment persisted');
  abandoned=db.catalog.setDraftAbandoned(v.id,abandoned,false);check(abandoned.abandonedAt===null,'Restoration preserves same version');
  const sourceItem=db.catalog.getItem('atoumweb-vitrine'),chosen=sourceItem.versions.find(x=>x.status==='published');check(!!chosen,'Historical published source version available');
  const preview=db.catalog.duplicationPreview(sourceItem.id,chosen.id),duplicateRequest=randomUUID(),intent={sourceItemId:sourceItem.id,sourceVersionId:chosen.id,expected:chosen,referenceFingerprint:preview.referenceFingerprint,name:'TEST activation — duplicate',copyCategory:true,copyReferences:true};
  const duplicate=db.catalog.duplicate(intent,duplicateRequest);
  check(duplicate.id!==sourceItem.id&&duplicate.canonicalCode===null&&duplicate.versions.length===1,'Duplication creates independent item without canonical code or history');
  check(db.catalog.duplicate(intent,duplicateRequest).id===duplicate.id,'Duplication replay does not duplicate');
  check(duplicate.versions[0].priceCents===chosen.priceCents,'Duplication respects explicitly chosen historical version');
  check(JSON.stringify(db.catalog.duplicationPreview(duplicate.id,duplicate.versions[0].id).references)===JSON.stringify(preview.references),'Duplication copies selected source references');
  const org=db.crm.createOrganization({name:'TEST activation review'}),contact=db.crm.createContact({organizationId:org.id,firstName:'TEST',lastName:'Activation'}),prospect=db.crm.createProspect({organizationId:org.id,contactId:contact.id,primaryNeed:'TEST activation'});
  const quote=()=>db.quotes.create({prospectId:prospect.id,subject:'TEST activation only',contractAudience:'professional'});
  const getVersion=code=>db.database.get("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? ORDER BY version_number DESC LIMIT 1",[code]).id;
  reject(()=>db.quotes.addCatalogLine(quote().id,getVersion('AW-WEB-VITRINE')),'Unpublished imported reference refused for Quote');
  let oldQuote=db.quotes.addCatalogLine(quote().id,chosen.id);check(oldQuote.lines[0].sourceCatalogVersionId===chosen.id||oldQuote.lines[0].catalogVersionId===chosen.id||JSON.stringify(oldQuote.lines[0]).includes(chosen.id),'Historical published version remains selectable');
  const restricted=db.database.all("SELECT id FROM catalog_versions WHERE json_extract(commercial_parameters_json,'$.sourceStatus') LIKE 'A_VERIFIER%' OR json_extract(commercial_parameters_json,'$.sourceStatus') LIKE 'ANCIEN_%' OR json_extract(commercial_parameters_json,'$.sourceStatus') LIKE 'BASE_INTERNE%'");
  check(restricted.length>0,'Restricted references present');for(const x of restricted)reject(()=>db.catalog.publishVersion(x.id),'Restricted reference cannot publish: '+x.id);
  for(const code of (process.argv.includes('--no-publication')?[]:['AW-WEB-VITRINE','AW-ECOM-BASE','V39-HOST-LUNE'])){
   const id=getVersion(code);db.catalog.publishVersion(id);let q=db.quotes.addCatalogLine(quote().id,id);
   const {parameters}=S.approvedSimulationPayment(code,'professional');db.quotePreparation.save(q.id,parameters);q=db.quotes.get(q.id);
   const p=db.contractTerms.presentation(q.id),html=S.buildQuoteHtml(q,p);
   check(p.paymentSummary.rows.reduce((n,r)=>n+r.amountCents,0)===q.contractValueCents,'Schedule preserves total '+code);
   check(JSON.stringify(p.paymentSummary.rows.map(r=>r.percent))===JSON.stringify(code==='AW-WEB-VITRINE'?[40,60]:code==='AW-ECOM-BASE'?[30,40,30]:[100]),'Saved schedule '+code);
   check(!/NaN|undefined|Infinity/.test(p.text+html),'No invalid amount in normal contract/export path '+code);
   check(p.paymentSummary.rows.every(r=>html.includes(r.label)&&html.includes(r.event)),'Quote and annex show all source milestones '+code);
   reject(()=>db.quotes.finalize(q.id),'Contract finalization blocked while library/administration is not activated');
  }
  if(process.argv.includes('--no-publication')){const {parameters}=S.approvedSimulationPayment('AW-WEB-VITRINE','professional');db.quotePreparation.save(oldQuote.id,parameters);oldQuote=db.quotes.get(oldQuote.id);const p=db.contractTerms.presentation(oldQuote.id);check(JSON.stringify(p.paymentSummary.rows.map(r=>r.percent))==='[40,60]','Preparation uses existing published source without publishing a pack version');check(!/NaN|undefined|Infinity/.test(p.text+S.buildQuoteHtml(oldQuote,p)),'Existing published quote/export amounts remain finite');check(db.database.get("SELECT count(*) AS n FROM catalog_versions WHERE json_extract(provenance_json,'$.sha256')=? AND status='draft'",['96f4df6875174979c1769825dade5b1e73e91002b4fb8fafc7d15b4eb4eebc80']).n===130,'All 130 pack versions remain draft even in functional copy');}
  check(original===JSON.stringify(db.database.all('SELECT * FROM contract_clause_versions ORDER BY id')),'119 draft clause versions unchanged by functional recipe');
  check(db.database.all('PRAGMA foreign_key_check').length===0,'No FK violation');check(db.database.get('PRAGMA integrity_check').integrity_check==='ok','SQLite integrity ok');
  fs.writeFileSync(out,JSON.stringify({tempOnly:true,input,recipeCopy:workspace.databaseFile,checks,expectedRejections,restrictedChecked:restricted.length,sourceReferences:preview.references,publications:process.argv.includes('--no-publication')?'NONE - all pack versions remain draft':'Three catalogue versions only in extra disposable functional copy; none in integration candidate',integrity:db.database.all('PRAGMA integrity_check'),foreignKeys:db.database.all('PRAGMA foreign_key_check')},null,2));console.log(JSON.stringify({checks:checks.length,restricted:restricted.length}));
 }finally{db.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});

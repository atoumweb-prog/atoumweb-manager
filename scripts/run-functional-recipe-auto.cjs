'use strict';

const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const repo=path.resolve(__dirname,'..'),delivery=path.resolve(process.argv[2]||'');
const markerFile=path.join(delivery,'RECETTE-TEST.json');
if(!fs.existsSync(markerFile))throw Error('Livraison RECETTE / TEST requise.');
const marker=JSON.parse(fs.readFileSync(markerFile,'utf8'));
if(!marker.onlySynthetic||marker.environment!=='RECETTE / TEST')throw Error('Marqueur de recette invalide.');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),out=path.join(delivery,'Rapports-RECETTE-AUTO',stamp),shots=path.join(out,'captures'),pdfOut=path.join(out,'pdf-14');
fs.mkdirSync(shots,{recursive:true});fs.mkdirSync(pdfOut,{recursive:true});
const results=[],errors=[],limitations=[
 'Les contrôles juridiques confirment les règles codées ; ils ne constituent pas une validation juridique des formulations.',
 'La recette interdit tout courriel, paiement ou service externe réel : l’envoi RGPD est une attestation locale fictive.',
 'La comparaison visuelle automatique détecte pages vides, texte absent et géométrie ; l’appréciation esthétique finale reste humaine.'
];
const add=(area,name,ok,detail,evidence='')=>results.push({area,name,ok:Boolean(ok),detail:String(detail??''),evidence});
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const tableHash=(db,sql)=>crypto.createHash('sha256').update(JSON.stringify(db.prepare(sql).all())).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function snapshotDatabase(){const db=new DatabaseSync(marker.database,{readOnly:true});try{return{
 publishedClauses:tableHash(db,"SELECT * FROM contract_clause_versions WHERE status='published' ORDER BY id"),
 publishedCatalog:tableHash(db,"SELECT * FROM catalog_versions WHERE status='published' ORDER BY id"),
 acceptedQuotes:tableHash(db,"SELECT * FROM quotes WHERE status='accepted' ORDER BY id"),
 v37:Number(db.prepare("SELECT COUNT(*) n FROM contract_editorial_import_entries e JOIN contract_editorial_import_runs r ON r.id=e.run_id WHERE r.source_reference LIKE '%V3.7%'").get().n),
 catalogDrafts:Number(db.prepare("SELECT COUNT(*) n FROM catalog_versions WHERE status='draft' AND created_at>='2026-11-02T04:00:54.888Z'").get().n),
 migrations:Number(db.prepare('SELECT COUNT(*) n FROM schema_migrations').get().n),integrity:db.prepare('PRAGMA integrity_check').get().integrity_check,fk:db.prepare('PRAGMA foreign_key_check').all().length,
};}finally{db.close();}}

function runTargetedTests(){
 const files=['src/main/projects/DataProcessingAgreementService.test.ts','src/main/commercial/ConvergenceReviewBoundary.test.ts','src/main/commercial/ConvergenceRecipeCopy.test.ts','src/main/database/migrations.test.ts'];
 const command='npm test -- '+files.join(' '),result=cp.spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',command],{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});
 fs.writeFileSync(path.join(out,'tests-cibles.log'),(result.stdout||'')+(result.stderr||'')+(result.error?'\n'+String(result.error.stack||result.error):''));
 add('Services','RGPD, convergence et migrations ciblés',result.status===0,result.status===0?'Tests ciblés réussis.':'Voir tests-cibles.log','tests-cibles.log');
}

async function runUi(){
 const profile=path.join(delivery,'Profil-RECETTE'),exe=path.join(delivery,'Application','atoumweb-manager.exe');
 for(const file of ['DevToolsActivePort','DevToolsActivePort-journal'])fs.rmSync(path.join(profile,file),{force:true});
 const log=fs.openSync(path.join(out,'electron.log'),'w'),child=cp.spawn(exe,['--user-data-dir='+profile,'--functional-recipe','--remote-debugging-port=0'],{cwd:path.dirname(exe),windowsHide:true,stdio:['ignore',log,log]});
 let socket,seq=0,closed=false;const pending=new Map();child.on('exit',()=>{closed=true;});
 const until=async(fn,label)=>{const start=Date.now();while(Date.now()-start<30000){if(await fn())return;await sleep(100);}throw Error('Timeout '+label);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const file=path.join(shots,name+'.png');fs.writeFileSync(file,Buffer.from(r.data,'base64'));return path.relative(out,file).replaceAll('\\','/');};
 const navigate=async(page,name)=>{await evaluate(`window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:${JSON.stringify(page)}}))`);await until(()=>evaluate(`document.querySelector('[data-nav-module][aria-current=page]')?.getAttribute('data-nav-module')===${JSON.stringify(page)}`),page);await sleep(250);add('Interface','Navigation '+page,true,'Écran chargé sans fatalité.',name?await shot(name):'');};
 try{
  let port;await until(()=>{try{const l=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/);port=Number(l[0]);return port>0&&l[1]?.startsWith('/devtools/browser/');}catch(e){if(['ENOENT','EBUSY'].includes(e.code))return false;throw e;}},'DevTools');
  let page;await until(async()=>{try{const pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();page=pages.find(p=>p.type==='page'&&p.url.includes('functionalRecipe=1'));return !!page;}catch{return false;}},'renderer');
  socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=m=>{const e=JSON.parse(m.data);if(e.id){const t=pending.get(e.id);if(t){pending.delete(e.id);e.error?t.reject(Error(JSON.stringify(e.error))):t.resolve(e.result);}}else if(e.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(e.params.exceptionDetails));else if(e.method==='Runtime.consoleAPICalled'&&e.params.type==='error')errors.push(JSON.stringify(e.params.args));};
  await send('Runtime.enable');await send('Page.enable');await until(()=>evaluate("Boolean(window.atoumweb&&document.querySelector('.aw-manager-shell'))"),'shell');
  const bootstrap=await evaluate('window.atoumweb.app.getBootstrap()');
  add('Démarrage','Profil et workspace isolés',path.resolve(bootstrap.workspacePath)===path.resolve(marker.workspace),bootstrap.workspacePath,await shot('00-demarrage-recette'));
  add('Démarrage','Bandeau RECETTE / TEST',await evaluate("document.title.includes('RECETTE / TEST')&&Boolean(document.querySelector('.functional-recipe-banner'))"),'Titre et bandeau présents.');
  for(const pageName of ['Accueil','Prospects','Clients','Offres & Tarifs','Devis','Projets','Interventions & Maintenance','Gestion des temps','Documents & Contrats','Bibliothèque AtoumWeb','Sites','Annuaire','Réglages'])await navigate(pageName,['Offres & Tarifs','Devis','Projets','Documents & Contrats'].includes(pageName)?'module-'+pageName.normalize('NFD').replace(/[^a-zA-Z0-9]+/g,'-').toLowerCase():null);
  const review=await evaluate('window.atoumweb.convergenceReview.simulate()');
  add('Bibliothèque','118 clauses V3.7',review.contract.rows.length===118,review.contract.rows.length+' clauses simulées, '+review.contract.rows.filter(r=>r.draftVersionId).length+' brouillons.','captures/module-documents-contrats.png');
  add('Catalogue','Six propositions',review.catalog.rows.length===6,review.catalog.rows.length+' propositions ; '+review.catalog.rows.filter(r=>r.draftPrepared).length+' brouillons déjà préparés.','captures/module-offres-tarifs.png');
  add('Bibliothèque','Codes, publics et alias',review.contract.rows.every(r=>r.proposedCode&&r.proposedAudience)&&review.contract.rows.some(r=>r.proposedCode!==r.publishedCode),review.contract.rows.filter(r=>r.proposedCode!==r.publishedCode).map(r=>r.publishedCode+' → '+r.proposedCode).join(', ')||'Aucun alias');
  const site='57d2a740-e0c0-4e1d-925f-f35255f9ee24';
  const rgpd=await evaluate(`Promise.all([window.atoumweb.projects.dataProcessingAgreements.assessment('${site}'),window.atoumweb.projects.dataProcessingAgreements.listForSite('${site}'),window.atoumweb.projects.dataProcessingAgreements.gate('${site}'),window.atoumweb.projects.dataProcessingAgreements.listIncidents('${site}')]).then(([assessment,agreements,gate,incidents])=>({assessment,agreements,gate,incidents}))`);
  add('RGPD V3','Évaluation, historique et empreintes',rgpd.assessment.state==='required'&&rgpd.agreements.length===2&&rgpd.agreements[0].sentPayloadSha256===rgpd.agreements[0].signedPayloadSha256,'V1 signée et V2 révision ; empreinte exacte conservée.','captures/module-projets.png');
  add('RGPD V3','Prestataires et transferts vérifiés',rgpd.agreements.every(a=>a.payload.providers.every(p=>p.accountHolder!=='unknown'&&p.rgpdRole!=='to-confirm'&&p.outsideEea!==null)),rgpd.agreements[0].payload.providers.map(p=>p.name+' / '+p.rgpdRole+' / '+p.country).join('; '));
  add('RGPD V3','Blocage ciblé de la révision',rgpd.gate.required&&!rgpd.gate.allowed&&rgpd.gate.agreementId===rgpd.agreements[0].id,'La révision courante bloque les traitements concernés ; les modules sans rapport restent navigables.');
  add('Interface','Erreurs JavaScript',errors.length===0,errors.length?errors.join('\n'):'Aucune exception ni console.error.','electron.log');
  await send('Page.close');await until(()=>closed,'fermeture');
 }finally{socket?.close();if(!closed)child.kill();fs.closeSync(log);}
}

async function runPdfs(){
 const campaign=path.join(repo,'output','convergence-campaign14-20261031');
 const generated=cp.spawnSync(process.execPath,[path.join(repo,'scripts','validate-convergence-draft-pdfs.cjs'),campaign,marker.workspace,pdfOut],{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});
 fs.writeFileSync(path.join(out,'pdf-generation.log'),(generated.stdout||'')+(generated.stderr||''));
 if(generated.status!==0){add('PDF','Campagne des 14 scénarios',false,'Génération échouée.','pdf-generation.log');return;}
 const pdfs=fs.readdirSync(pdfOut).filter(n=>/^DEV-TEST-\d\d-BROUILLONS\.pdf$/.test(n)).sort();let pages=0,signature=0,empty=0;
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const renderer=cp.spawnSync('where.exe',['pdftoppm.exe'],{encoding:'utf8',windowsHide:true}).stdout?.split(/\r?\n/).find(Boolean);
  for(const name of pdfs){const file=path.join(pdfOut,name),bytes=new Uint8Array(fs.readFileSync(file)),doc=await pdfjs.getDocument({data:bytes,disableWorker:true}).promise;pages+=doc.numPages;let text='';for(let i=1;i<=doc.numPages;i++){const content=await (await doc.getPage(i)).getTextContent();const pageText=content.items.map(item=>item.str).join(' ');if(pageText.trim().length<80)empty++;text+='\n'+pageText;}if(/signature|bon pour accord/i.test(text))signature++;if(typeof doc.cleanup==='function')await doc.cleanup();if(renderer)cp.spawnSync(renderer,['-f','1','-singlefile','-scale-to','1200','-png',file,path.join(shots,name.replace('.pdf','-page1'))],{windowsHide:true});}
 add('PDF','Campagne des 14 scénarios',pdfs.length===14&&empty===0&&signature===14,`${pdfs.length} PDF, ${pages} pages, ${empty} page vide, ${signature} zones de signature.`,path.relative(out,pdfOut).replaceAll('\\','/'));
}

function html(){const passed=results.filter(r=>r.ok).length,failed=results.length-passed,rows=results.map(r=>`<tr class="${r.ok?'ok':'ko'}"><td>${r.ok?'✓':'✗'}</td><td>${esc(r.area)}</td><td>${esc(r.name)}</td><td>${esc(r.detail)}</td><td>${r.evidence?`<a href="${encodeURI(r.evidence)}">ouvrir</a>`:''}</td></tr>`).join('');const gallery=fs.existsSync(shots)?fs.readdirSync(shots).filter(n=>n.endsWith('.png')).map(n=>`<figure><img src="captures/${encodeURIComponent(n)}"><figcaption>${esc(n)}</figcaption></figure>`).join(''):'';return`<!doctype html><meta charset="utf-8"><title>Recette automatique AtoumWeb</title><style>body{font:16px system-ui;margin:32px;background:#071827;color:#eef5ff}h1,h2{color:#ffd62e}table{border-collapse:collapse;width:100%;background:#10283d}td,th{border:1px solid #35506a;padding:10px;vertical-align:top}.ok td:first-child{color:#4ce0a1}.ko{background:#54242b}.summary{font-size:20px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px}.gallery img{width:100%;border:1px solid #46627b}a{color:#ffd62e}</style><h1>AtoumWeb Manager — RECETTE AUTO</h1><p>${esc(new Date().toLocaleString('fr-FR'))}</p><p class="summary"><b>${passed}</b> réussis · <b>${failed}</b> échoués · code de sortie ${failed?1:0}</p><table><thead><tr><th>État</th><th>Zone</th><th>Contrôle</th><th>Résultat</th><th>Preuve</th></tr></thead><tbody>${rows}</tbody></table><h2>Fonctionnalités non couvertes automatiquement</h2><ul>${limitations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h2>Captures</h2><div class="gallery">${gallery}</div>`;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

(async()=>{try{
 const reset=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(delivery,'Reinitialiser-RECETTE.ps1')],{encoding:'utf8',windowsHide:true});add('Isolation','Réinitialisation de la graine',reset.status===0,(reset.stdout||'')+(reset.stderr||''));
 const before=snapshotDatabase();add('Isolation','SQLite migrations et intégrité',before.migrations===80&&before.integrity==='ok'&&before.fk===0,`migrations=${before.migrations}, intégrité=${before.integrity}, FK=${before.fk}`);
 runTargetedTests();await runUi();await runPdfs();
 const after=snapshotDatabase();add('Conservation','Aucune publication ni devis accepté modifié',before.publishedClauses===after.publishedClauses&&before.publishedCatalog===after.publishedCatalog&&before.acceptedQuotes===after.acceptedQuotes,'Empreintes publiées et devis acceptés inchangés.');
 }catch(error){errors.push(String(error?.stack||error));add('Exécution','Recette complète',false,String(error?.stack||error),'erreurs.log');}
 fs.writeFileSync(path.join(out,'erreurs.log'),errors.join('\n\n'));fs.writeFileSync(path.join(out,'resultats.json'),JSON.stringify({generatedAt:new Date().toISOString(),delivery,results,limitations,errors},null,2));fs.writeFileSync(path.join(out,'RAPPORT.html'),html());
 fs.writeFileSync(path.join(delivery,'DERNIER-RAPPORT-AUTO.txt'),path.join(out,'RAPPORT.html'));
 console.log('RAPPORT='+path.join(out,'RAPPORT.html'));process.exitCode=results.some(r=>!r.ok)?1:0;
})().catch(error=>{console.error(error);process.exitCode=1;});

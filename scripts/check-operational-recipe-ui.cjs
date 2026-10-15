// Chromium renders the real recipe page against the five real IPC handlers and sandboxed preload.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-recipe-ui-'));
 try{const env={...process.env,ATOUMWEB_RECIPE_UI_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
 const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:300000});
 process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;
 }finally{if(!path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(temp).startsWith('atoumweb-recipe-ui-'))throw Error('Unsafe UI temp');fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
}else{
 const {app,BrowserWindow,ipcMain}=require('electron'),temp=process.env.ATOUMWEB_RECIPE_UI_TEMP;
 if(!temp)throw Error('Run with node');app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output')throw Error('--output required');
 const output=path.resolve(args[1]);fs.mkdirSync(output,{recursive:true});const base=repo.replaceAll('\\','/'),esbuild=require('esbuild');
 esbuild.buildSync({stdin:{contents:`export * from '${base}/src/main/projects/OperationalRecipeService';export * from '${base}/src/main/projects/operationalRecipeIpc';export * from '${base}/src/main/projects/operationalRecipeWindow';export * from '${base}/src/main/database/NodeSqliteAdapter';export * from '${base}/src/main/testSupport/operationalRecipeFixture';`,resolveDir:repo,loader:'ts'},bundle:true,loader:{'.png':'dataurl'},platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
 esbuild.buildSync({entryPoints:[path.join(repo,'src/preload/preload.ts')],bundle:true,loader:{'.png':'dataurl'},platform:'node',format:'cjs',outfile:path.join(temp,'preload.js'),external:['electron'],logLevel:'silent'});
 esbuild.buildSync({entryPoints:[path.join(repo,'src/renderer/main.tsx')],bundle:true,loader:{'.png':'dataurl'},platform:'browser',outfile:path.join(temp,'ui.js'),logLevel:'silent'});
 fs.writeFileSync(path.join(temp,'index.html'),'<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; style-src \'self\' \'unsafe-inline\'"><link rel="stylesheet" href="ui.css"></head><body><div id="root"></div><script src="ui.js"></script></body></html>');
 const {OperationalRecipeService,NodeSqliteAdapter,fileSHA,registerOperationalRecipeIpc,createOperationalRecipeWindow,recipeFixtureFingerprint}=require(path.join(temp,'services.cjs'));
 const checks=[],results=[],errors=[];let session,win,remove;
 const check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error('Check failed: '+name);};
 // The window uses a fresh controlled fixture, never the development database.
 let sourceBefore;
 app.whenReady().then(async()=>{
  const context=createOperationalRecipeWindow(path.join(temp,'preload.js'),()=>{},false,{tempParent:temp});
  session=context.session;win=context.window;remove=context.dispose;
  const copy=session.copyPath;win.setSize(1440,1050);
  win.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)errors.push(event.message);});
  await win.loadFile(path.join(temp,'index.html'));
  const js=code=>win.webContents.executeJavaScript(code);
  const wait=async code=>{for(let i=0;i<80;i++){if(await js(code))return;await new Promise(r=>setTimeout(r,30));}throw Error('Timeout '+code);};
  const capture=async name=>{if(/recette-(actions|D-pending|page-parente|deux-bases)/.test(name))await js(`(()=>{const el=document.querySelector('[aria-label="${name.includes('actions')?'Actions projetées':'Destinations projetées'}"]');const shell=document.querySelector('.recipe-shell');if(el)shell.scrollTop+=el.getBoundingClientRect().top-document.querySelector('.recipe-banner').getBoundingClientRect().bottom-12;})()`);await wait('!document.body.innerText.includes("Calcul de l’aperçu…")');await new Promise(r=>setTimeout(r,80));fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
  await wait('document.querySelector("[aria-label=Synthèse]")!==null');
  const state=session.state();sourceBefore=state.sourceSHA256;
  check('Only five functions exposed, no normal Manager API',await js('typeof window.atoumweb==="undefined" && Object.keys(window.atoumwebOperationalRecipe).sort().join(",")==="close,preview,references,scenarios,state"'));
  check('No node or raw IPC access',await js('typeof require==="undefined" && typeof window.ipcRenderer==="undefined"'));
  const expected=[[21,1470,1,5,0],[13,765,1,1,0],[20,2550,1,4,0],[9,630,1,1,0],[10,1020,1,1,0],[10,1650,1,4,0],[34,1860,1,8,0],[16,800,1,1,1],[23,2580,1,4,1],[23,2595,1,4,1],[46,3045,2,11,0],[5,210,0,0,0],[3,120,0,0,0],[21,1470,1,5,0],[4,780,0,0,0],[3,180,0,0,0],[6,420,0,0,0],[6,270,0,0,0],[4,180,0,0,0]];
  const apiPreview=async request=>await js(`window.atoumwebOperationalRecipe.preview(${JSON.stringify({sessionId:state.sessionId,...request})})`);
  const strip=p=>JSON.stringify({...p,requestId:0});
  for(let i=0;i<19;i++){
   const request={scenarioId:'case-'+(i+1),requestId:i+10};let p=await apiPreview(request);
   check(request.scenarioId+' metrics',[p.metrics.actions,p.metrics.referenceMinutes,p.metrics.sites,p.metrics.pages,p.metrics.modules].every((v,k)=>v===expected[i][k]));
   check(request.scenarioId+' staging/runtime refusal',p.mode==='staging'&&p.readOnly&&!p.canMaterialize&&p.runtimeRefused);
   check(request.scenarioId+' replay and clean savepoint',strip(p)===strip(await apiPreview({...request,requestId:100+i})));
   const choices=[];
   if(i===10){const base=p.structures.filter(s=>s.role==='base')[1],t=p.targets.find(t=>t.state==='pending');check('Two bases addon initially pending',!!t);choices.push({lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:t.unitIndex,siteOwnerOrigin:base.origin,siteOwnerSlot:base.contract.sites[0].slotKey});}
   for(const t of p.targets.filter(t=>t.kind==='page')){const b=p.structures.find(s=>s.role==='base'),page=b.contract.pages[0];choices.push({lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:t.unitIndex,siteOwnerOrigin:b.origin,siteOwnerSlot:page.siteSlotKey,parentPage:{lineOrigin:b.origin,templateNodeId:page.templateNodeId}});}
   if(choices.length){p=await apiPreview({...request,choices});check(request.scenarioId+' explicit logical target',p.logicalChoices.length===choices.length&&p.targets.every(t=>t.state==='active')&&p.targets.every(t=>t.siteId===null&&t.pageNodeId===null));}
   if(i===5)check('Histoire four exact Pages, paths and protected intent',JSON.stringify(p.structures[0].contract.pages.map(v=>{const n=p.structures[0].nodes.find(n=>n.id===v.templateNodeId);return[n.name,n.desiredPath]}))===JSON.stringify([['Accueil','/'],['Notre histoire','/notre-histoire/'],['Le Jour J','/jour-j/'],['Espace privé','/espace-prive/']])&&p.structures[0].nodes.some(n=>n.description?.includes('mot de passe standard')));
   if(i===18)check('SEO PERF A04 site integration, genuine pending',p.actions.find(a=>a.action.key==='AW-SEO-PERF-A04').targetRequirement.target==='site'&&p.targets[0].state==='pending'&&p.structures.length===0);
   if(i===6)check('Bought option provenance qty2',p.actions.filter(a=>a.code==='AW-WEB-PAGE-SUP').every(a=>a.quantityMilli===2000&&a.optionPurchase.state==='purchased'));
   if(i===13)check('Unbought option no effects',!p.actions.some(a=>a.code==='AW-WEB-PAGE-SUP')&&!p.structures.some(s=>s.code==='AW-WEB-PAGE-SUP'));
   if(i===12||i===15)check(request.scenarioId+' estimate not final',p.metrics.finalEstimate===null);
   results.push(p);
  }
  const first=await apiPreview({scenarioId:'case-1',requestId:500});await apiPreview({scenarioId:'case-19',requestId:501});check('Switch then return deterministic',strip(first)===strip(await apiPreview({scenarioId:'case-1',requestId:502})));
  for(const request of [{scenarioId:'case-1',quantities:{'line-0':2}},{scenarioId:'case-7',quantities:{'line-2':2}},{scenarioId:'case-1',ready:true},{scenarioId:'case-1',projectId:'historical'}]){
   let rejected=false;try{await apiPreview({...request,requestId:600});}catch{rejected=true;}check('Reject '+JSON.stringify(request),rejected);
  }
  // Actual DOM events, not mocked React API. Wait for the freshly selected scenario metrics.
  const select=async(label,value)=>{await js(`(()=>{const el=document.querySelector('[aria-label=${JSON.stringify(label)}]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);await new Promise(r=>setTimeout(r,120));};
  const scenario=async(id)=>{await select('Scénario',id);await js('document.querySelector(".recipe-shell").scrollTop=0');await wait(`document.querySelector('[aria-label="Synthèse"]')!==null && document.querySelector('[aria-label="Synthèse"]').dataset.scenario===${JSON.stringify(id)} && !document.body.innerText.includes('Calcul de l’aperçu…')`);};
  const tab=async name=>{await js(`document.querySelector('[data-recipe-tab='+${JSON.stringify(name)}+']').click()`);await new Promise(r=>setTimeout(r,70));};
  for(const theme of ['atoumweb','noir','blanc']){
   await select('Thème',theme);await scenario('case-1');await tab('structure');
   check(theme+' persistent banner',await js('document.querySelector(".recipe-banner").textContent.includes("RECETTE — simulation uniquement — aucune donnée enregistrée")'));
   check(theme+' source limits',await js('document.body.innerText.includes("Landing sur Site existant : non validé") && document.body.innerText.includes("Sites historiques restent en attente de choix")'));
   check(theme+' normal no mutation buttons',await js('![...document.querySelectorAll("button")].some(b=>/Publier|Activer|Ready|Chrono|Préparer le Projet|Créer le Site|Affecter/.test(b.textContent))'));
   check(theme+' Vitrine actual 21/24h30',await js('document.querySelector("[aria-label=Synthèse]").innerText.includes("24 h 30")'));
   await capture('recette-vitrine-'+theme);
   await tab('actions');await js('document.querySelector(".recipe-action").open=true');await capture('recette-actions-'+theme);
   check(theme+' checklist visible, provenance collapsed',await js('document.querySelector(".recipe-action").innerText.includes("temps de référence") && !document.querySelector(".recipe-action").innerText.includes("AW-WEB-VITRINE-A01")'));
   await js('document.querySelector(".recipe-action .recipe-technical").open=true');
   check(theme+' technical provenance still accessible',await js('document.querySelector(".recipe-action").innerText.includes("AW-WEB-VITRINE-A01")'));
   await js('document.querySelector(".recipe-action .recipe-technical").open=false');
   for(const [id,name,time] of [['case-2','landing','12 h 45'],['case-3','woo','42 h 30'],['case-5','mariage','17 h 00'],['case-6','histoire','27 h 30']]){
    await scenario(id);await tab('structure');check(theme+' '+name+' actual time',await js('document.querySelector("[aria-label=Synthèse]").innerText.includes('+JSON.stringify(time)+')'));await capture('recette-'+name+'-'+theme);
   }
   await scenario('case-7');await tab('structure');await capture('recette-addons-'+theme);
   check(theme+' addons 31h / 8pages',await js('document.querySelector("[aria-label=Synthèse]").innerText.includes("31 h 00") && document.querySelector("[aria-label=Synthèse]").innerText.includes("8")'));
   await scenario('case-8');await tab('destinations');
   const parentValue=await js('[...document.querySelectorAll("[aria-label^=Cible]")].at(-1).options[1].value');
   const parentLabel=await js('[...document.querySelectorAll("[aria-label^=Cible]")].at(-1).getAttribute("aria-label")');
   await select(parentLabel,parentValue);await wait('document.body.innerText.includes("Page sélectionnée pour cette simulation uniquement")');
   check(theme+' Page parent selection real IPC',await js('document.body.innerText.includes("Page sélectionnée pour cette simulation uniquement")'));await capture('recette-page-parente-'+theme);
   await scenario('case-11');await tab('destinations');await capture('recette-deux-bases-pending-'+theme);
   check(theme+' ambiguous Site remains pending',await js('document.body.innerText.includes("Destination à choisir")'));
   const addonLabel=await js('[...document.querySelectorAll("[aria-label^=Cible]")].at(-1).getAttribute("aria-label")');
   const secondSite=await js('[...document.querySelectorAll("[aria-label^=Cible]")].at(-1).options[2].value');
   await select(addonLabel,secondSite);await wait('document.querySelector("[aria-label=Synthèse]").dataset.pending==="0"');
   check(theme+' second Site explicit, no implicit merge',await js('document.querySelector("[aria-label=Synthèse]").dataset.pending==="0"'));await capture('recette-deux-bases-cible-'+theme);
   await scenario('case-19');await tab('destinations');await capture('recette-D-pending-'+theme);
   check(theme+' true D no false structure',await js('document.querySelector("[aria-label=Synthèse]").dataset.pending==="1"'));
   await scenario('case-16');check(theme+' incomplete final estimate',await js('document.body.innerText.includes("Estimation finale incomplète")'));await capture('recette-estimation-'+theme);
   await scenario('case-14');await js('document.querySelector("input[type=checkbox]").click()');await js('[...document.querySelectorAll("button")].find(b=>b.textContent=== "Recalculer l’aperçu").click()');
   await wait('document.querySelector("[aria-label=Synthèse]")!==null && document.querySelector("input[type=checkbox]").checked');check(theme+' option creates line and effects',await js('document.querySelector("[aria-label=Synthèse]").innerText.includes("26 h 15")'));
   await js('document.querySelector("input[type=checkbox]").click()');await js('[...document.querySelectorAll("button")].find(b=>b.textContent=== "Recalculer l’aperçu").click()');await wait('document.querySelector("[aria-label=Synthèse]")!==null');
   check(theme+' option deselected restores baseline',await js('document.querySelector("[aria-label=Synthèse]").innerText.includes("24 h 30")'));
   // All 19 scenarios in each theme: main text is business-facing, technical data stays folded.
   for(let i=1;i<=19;i++){
    await scenario('case-'+i);await tab('structure');
    check(theme+' case-'+i+' accessible field labels',await js('[...document.querySelectorAll("[aria-label]")].every(el=>!/line-\\d|[0-9a-f]{8}-[0-9a-f]{4}/i.test(el.getAttribute("aria-label")))'));
    check(theme+' case-'+i+' technical details folded',await js('[...document.querySelectorAll(".recipe-technical")].every(d=>!d.open)'));
    for(const view of ['structure','actions','destinations','provenance']){
     await tab(view);
     const text=await js('document.body.innerText');
     check(theme+' case-'+i+' '+view+' business labels',!/\bdraft\b|\bpending\b|runtime|ligne directe synthétique|périmètre fictif|line-\d|AW-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|8B inerte/i.test(text));
    }
    await tab('structure');
   }
   await scenario('case-19');await tab('destinations');
   check(theme+' SEO exact business warning',await js('document.body.innerText.includes("Cette prestation doit être rattachée à un site avant de pouvoir être utilisée. Aucun site n’est sélectionné dans cette simulation.")'));
   await scenario('case-14');
   win.setSize(780,1000);await new Promise(r=>setTimeout(r,100));check(theme+' narrow width no overflow',await js('document.documentElement.scrollWidth<=innerWidth'));await capture('recette-etroit-'+theme);win.setSize(1440,1050);
  }
  // Failure after copying must also clean. A disposable empty database deliberately violates schema.
  const invalid=path.join(temp,'invalid.sqlite'),d=new NodeSqliteAdapter(invalid);d.exec('CREATE TABLE synthetic(id TEXT)');d.close();
  const beforeTemps=fs.readdirSync(temp).filter(n=>n.startsWith('atoumweb-operational-recipe-')).sort();let failed=false;
  try{new OperationalRecipeService(invalid,fileSHA(invalid),temp);}catch{failed=true;}
  check('Controlled initialization failure cleans copy',failed&&JSON.stringify(beforeTemps)===JSON.stringify(fs.readdirSync(temp).filter(n=>n.startsWith('atoumweb-operational-recipe-')).sort()));
  let loadFailure=false;
  try{createOperationalRecipeWindow(path.join(temp,'preload.js'),()=>{throw Error('controlled renderer load failure');},false,{tempParent:temp});}catch{loadFailure=true;}
  check('Controlled window load failure cleans copy',loadFailure&&JSON.stringify(beforeTemps)===JSON.stringify(fs.readdirSync(temp).filter(n=>n.startsWith('atoumweb-operational-recipe-')).sort()));
  await select('Scénario','case-7');await select('Scénario','case-19');await wait('document.querySelector("[aria-label=Synthèse]").dataset.scenario==="case-19"');
  check('Latest scenario wins without previous residues',await js('document.querySelector("[aria-label=Synthèse]").dataset.scenario==="case-19" && !document.querySelector(".recipe-main").innerText.includes("AW-WEB-BLOG")'));
  await js('[...document.querySelectorAll("button")].find(b=>b.textContent=== "Fermer la recette").click()');await wait('document.body.innerText.includes("Simulation fermée. La copie de travail a été supprimée")');
  check('Copy removed on five-operation close',!fs.existsSync(copy)&&!fs.existsSync(session.tempDirectory));
  let afterClose=false;try{session.preview({sessionId:session.sessionId,scenarioId:'case-1',requestId:1});}catch{afterClose=true;}check('Closed sessions refuse further preview',afterClose);
  remove();win.destroy();
  const native=createOperationalRecipeWindow(path.join(temp,'preload.js'),()=>{},false),nativePath=native.session.copyPath;
  native.window.destroy();check('Native window destruction cleans copy',!fs.existsSync(nativePath)&&!fs.existsSync(native.session.tempDirectory));
  check('Fixture content fingerprint matches versioned definition',sourceBefore===recipeFixtureFingerprint);

  const report={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,scenarios:results,sourceSHA256Before:sourceBefore,sourceSHA256After:state.sourceSHA256,copyPath:copy,copyDeleted:!fs.existsSync(copy),actualIpc:true,actualPreload:true,actualRendererEntry:true,errors};
  fs.writeFileSync(path.join(output,'recette-chromium.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,scenarios:19,sourceUnchanged:true,copyDeleted:true,errors}));app.exit(errors.length?1:0);
 }).catch(async error=>{console.error(error);if(win&&!win.isDestroyed()){fs.writeFileSync(path.join(output,'failure-body.txt'),await win.webContents.executeJavaScript('document.body.innerText'));console.error(await win.webContents.executeJavaScript('document.querySelector(".recipe-status").innerText')); fs.writeFileSync(path.join(output,'failure.png'),(await win.webContents.capturePage()).toPNG());}remove?.();win?.destroy();session?.close();fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:String(error),checks},null,2));app.exit(1);});
}



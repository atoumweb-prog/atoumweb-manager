// Isolated Chromium/React recipe: actual components, mocked IPC, no application or database startup.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-provisional-ui-'));
 try{
  const env={...process.env,ATOUMWEB_PROVISIONAL_UI_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:60000});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;
 }finally{
  const resolved=path.resolve(temp);if(!resolved.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(resolved).startsWith('atoumweb-provisional-ui-'))throw Error('Temp unsafe');
  fs.rmSync(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:100});
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env.ATOUMWEB_PROVISIONAL_UI_TEMP;
 if(!temp)throw Error('Utiliser node');app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output')throw Error('--output requis');
 const output=path.resolve(args[1]);fs.mkdirSync(output,{recursive:true});const base=repo.replaceAll('\\','/');
 const entry=`import React from 'react';import {createRoot} from 'react-dom/client';
 import {QuoteProjectPanel} from '${base}/src/renderer/workflow/QuoteWorkflow';
 import {ProjectCommercialScopePanel} from '${base}/src/renderer/projects/ProjectCommercialScopePanel';
 import '${base}/src/renderer/styles.css';import '${base}/src/renderer/projects.css';
 const root=createRoot(document.getElementById('root'));let mode='prepare',scope,project;
 window.calls=[];
 const api={
 list:async()=>mode==='prepare'?[]:[project],get:async()=>project,
 commercialScope:async()=>scope,
 previewQuote:async(input)=>({quoteId:input.quoteId,sha256:'synthetic-preview',baseCount:1,operations:{actions:[],links:[]},destinations:[]}),
 prepareQuote:async(input)=>{window.calls.push({action:'prepare',input});mode='provisional';return project;},
 syncCommercial:async(id)=>{window.calls.push({action:'sync',id});return project;},
 resolveScopeConflict:async(id,c,d)=>{window.calls.push({action:'resolve',id,c,d});if(d==='delete')throw Error('Suppression refusée : élément non vierge ou encore référencé.');scope={...scope,conflicts:[]};return scope;}
 };
 window.atoumweb={projects:{projects:api,templates:{list:async()=>[]}}};
 window.show=(theme,next)=>{
  document.documentElement.dataset.theme=theme;mode=next;window.calls=[];
  project={id:'hidden-project-id',name:'Site vitrine de Camille',commercialState:next==='frozen'?'frozen':'provisional'};
  scope={projectId:project.id,state:next==='legacy'?'legacy':project.commercialState,dossierId:'hidden-dossier-id',currentQuoteId:'hidden-quote-id',acceptedQuoteId:next==='frozen'?'hidden-quote-id':null,
   revisions:[{id:'hidden-revision-id',quoteId:'hidden-quote-id',commercialRevision:2,sequence:3,sha256:'hidden-hash',createdAt:'2026-10-04T08:00:00Z'}],
   conflicts:next==='conflict'?[{id:'hidden-conflict-id',entityKind:'node',entityId:'hidden-node-id',label:'Actualités personnalisées',reason:'Hors périmètre commercial — décision requise'}]:[]};
  root.render(<div className='projects-stack' style={{maxWidth:900,padding:24}} key={theme+next}>
   {next==='prepare'?<QuoteProjectPanel quote={{id:'hidden-quote-id',status:'draft',projectId:null,lines:[{}]}}/>:<ProjectCommercialScopePanel projectId={project.id}/>}</div>);
 };
 window.click=(text)=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText===text);if(!b)throw Error('Bouton absent: '+text);b.click();};
 window.show('blanc','prepare');`;
 require('esbuild').buildSync({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',outfile:path.join(temp,'ui.js'),logLevel:'silent'});
 fs.writeFileSync(path.join(temp,'index.html'),'<html><head><meta charset="utf-8"><link rel="stylesheet" href="./ui.css"></head><body><div id="root"></div><script src="./ui.js"></script></body></html>');
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:960,height:730,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
  await win.loadFile(path.join(temp,'index.html'));const checks=[];
  const pause=()=>new Promise(resolve=>setTimeout(resolve,120));
  const js=code=>win.webContents.executeJavaScript(code);
  const show=async(theme,mode)=>{await js('window.show('+JSON.stringify(theme)+','+JSON.stringify(mode)+')');await pause();};
  const click=async text=>{await js('window.click('+JSON.stringify(text)+')');await pause();};
  const check=async(name,code)=>checks.push({name,passed:!!(await js(code))});
  for(const theme of ['blanc','noir','atoumweb']){
   await show(theme,'prepare');
   await check(theme+' — Préparation avant acceptation','document.body.innerText.includes("Préparer le Projet") && !!document.querySelector("button.primary-button")');
   await check(theme+' — Options disponibles exclues','document.body.innerText.includes("Les options seulement disponibles ne contribuent pas")');
   await click('Vérifier le plan sans créer de Projet');
   await check(theme+' — Prévisualisation sans écriture','window.calls.length===0 && !!document.querySelector("[role=status]")');
   await check(theme+' — Occurrences et cibles visibles','document.querySelector("[role=status]").innerText.includes("occurrence(s) de base") && document.querySelector("[role=status]").innerText.includes("cible(s) à choisir")');
   fs.writeFileSync(path.join(output,'ui-preview-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
   await click('Préparer le Projet');
   await check(theme+' — Préparation via action explicite','window.calls.length===1 && window.calls[0].action==="prepare" && window.calls[0].input.quoteId==="hidden-quote-id"');
   await check(theme+' — Même Projet accessible','document.body.innerText.includes("Ouvrir Site vitrine de Camille")');
   await check(theme+' — État prévisionnel visible','document.body.innerText.includes("Projet prévisionnel — devis non accepté")');
   await check(theme+' — Objets opérationnels non activés','document.body.innerText.includes("Aucune maintenance, intervention ou facturation n’est activée")');
   await click('Synchroniser le périmètre commercial');
   await check(theme+' — Synchronisation du même Projet','window.calls.some(c=>c.action==="sync" && c.id==="hidden-project-id")');
   await show(theme,'conflict');
   await check(theme+' — Travail manuel identifié','document.body.innerText.includes("Actualités personnalisées") && document.body.innerText.includes("travail conservé")');
   await check(theme+' — Quatre décisions explicites','document.querySelectorAll(".project-scope-conflict button").length===4');
   await click('Supprimer si vierge');
   await check(theme+' — Suppression refusée signalée','document.querySelector("[role=alert]")?.innerText.includes("non vierge")');
   await js('document.querySelector("details").open=true');await pause();
   await check(theme+' — Historique révision et synchronisation','document.body.innerText.includes("Synchronisation 3 · révision commerciale 2")');
   await check(theme+' — Aucun identifiant interne affiché','!document.body.innerText.includes("hidden-")');
   await check(theme+' — Pas de débordement','document.documentElement.scrollWidth<=window.innerWidth');
   await check(theme+' — Styles et texte lisible','getComputedStyle(document.querySelector(".project-commercial-scope")).fontSize==="14px" && getComputedStyle(document.body).fontFamily.includes("Inter")');
   fs.writeFileSync(path.join(output,'ui-provisional-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
   await click('Conserver');
   await check(theme+' — Résolution explicite, conflit retiré','!document.querySelector(".project-scope-conflict") && window.calls.some(c=>c.action==="resolve"&&c.d==="keep")');
   await show(theme,'frozen');
   await check(theme+' — Acceptation figée visible','document.body.innerText.includes("Périmètre accepté et figé")');
   await check(theme+' — Synchronisation absente après gel','![...document.querySelectorAll("button")].some(b=>b.innerText.includes("Synchroniser"))');
   await show(theme,'legacy');
   await check(theme+' — Historique sans requalification','!document.querySelector(".project-commercial-scope")');
  }
  const report={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,mode:'Chromium/React isolé, IPC simulé, aucune base',checks};
  fs.writeFileSync(path.join(output,'ui-lot7b.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));win.destroy();app.exit(report.failed?1:0);
 }).catch(error=>{console.error(error);app.exit(1);});
}

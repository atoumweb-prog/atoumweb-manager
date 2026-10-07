// Actual React in isolated Chromium; synthetic IPC. Never starts Manager or opens its database.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-targets-ui-'));
 try{const env={...process.env,ATOUMWEB_TARGETS_UI_TEMP:temporary};delete env.ELECTRON_RUN_AS_NODE;const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:60000});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;}
 finally{const target=path.resolve(temporary);if(!target.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(target).startsWith('atoumweb-targets-ui-'))throw Error('Unsafe temporary path');fs.rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
}else{
 const {app,BrowserWindow}=require('electron'),temporary=process.env.ATOUMWEB_TARGETS_UI_TEMP;if(!temporary)throw Error('Use node launcher');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temporary,'profile'));
 const args=process.argv.slice(2);if(args[0]!=='--output'||!args[1])throw Error('--output required');const output=path.resolve(args[1]);fs.mkdirSync(output,{recursive:true});const base=repo.replaceAll('\\','/');
 const entry=`import React from 'react';import {createRoot} from 'react-dom/client';import {ProjectCommercialScopePanel} from '${base}/src/renderer/projects/ProjectCommercialScopePanel';
 import '${base}/src/renderer/styles.css';import '${base}/src/renderer/projects.css';import '${base}/src/renderer/ui-typography-consistency.css';import '${base}/src/renderer/ui-consistency-v2.css';
 const root=createRoot(document.getElementById('root'));window.calls=[];
 const choices={sites:[{id:'site-one',label:'Site vitrine',ownerOrigin:'base-one',ownerSlot:'main',provides:['wordpress']},{id:'site-woo',label:'Boutique',ownerOrigin:'base-two',ownerSlot:'main',provides:['wordpress','woocommerce']},{id:'manual',label:'Site manuel',ownerOrigin:null,ownerSlot:null,provides:[]}],pages:[{id:'page-one',siteId:'site-one',label:'Accueil'},{id:'page-woo',siteId:'site-woo',label:'Boutique'}],contexts:[{id:'context-one',label:'Contexte technique validé'}]};
 window.show=(theme,mode)=>{window.calls=[];document.documentElement.dataset.theme=theme;const kind=mode==='context'?'context':mode==='page'||mode==='woo'?'page':'site';
 window.scope={projectId:'fixture',state:mode==='frozen'?'frozen':mode==='legacy'?'legacy':'provisional',revisions:[],conflicts:[],targetChoices:choices,targets:[{lineOrigin:'sold-line',code:'AW-TEST8A1',slot:'destination',unitIndex:1,kind,state:'pending',selectionMode:'pending',siteId:null,pageNodeId:null,contextNodeId:null,requires:mode==='woo'?['woocommerce']:[],issue:'Cible à choisir explicitement',locked:mode==='locked',allowsCreateSite:mode==='create'}]};
 window.atoumweb={projects:{projects:{commercialScope:async()=>window.scope,get:async()=>({id:'fixture'}),syncCommercial:async()=>window.calls.push({action:'sync'}),assignTarget:async(id,input)=>{window.calls.push({id,input});if(mode==='error')throw Error('Capacités incompatibles — cible refusée');window.scope={...window.scope,targets:window.scope.targets.map(t=>({...t,siteId:input.siteId??null,pageNodeId:input.pageNodeId??null,contextNodeId:input.contextNodeId??null,siteOwnerOrigin:input.siteOwnerOrigin??null,siteOwnerSlot:input.siteOwnerSlot??null,state:'active',selectionMode:'explicit',issue:null}))};return window.scope;}}}};
 root.render(<main key={theme+mode} style={{maxWidth:900,padding:24,margin:'auto'}}><ProjectCommercialScopePanel projectId='fixture' /></main>);};window.show('blanc','page');`;
 require('esbuild').buildSync({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',outfile:path.join(temporary,'ui.js'),logLevel:'silent'});
 fs.writeFileSync(path.join(temporary,'index.html'),'<html><head><meta charset="utf-8"><link rel="stylesheet" href="./ui.css"></head><body><div id="root"></div><script src="./ui.js"></script></body></html>');
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1080,height:1020,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}}),checks=[],errors=[];
  win.webContents.on('console-message',event=>{if(event.level>=2)errors.push(event.message);});await win.loadFile(path.join(temporary,'index.html'));
  const js=code=>win.webContents.executeJavaScript(code),pause=()=>new Promise(r=>setTimeout(r,140)),show=async(theme,mode)=>{await js('window.show('+JSON.stringify(theme)+','+JSON.stringify(mode)+')');await pause();};
  const check=async(name,code)=>checks.push({name,passed:!!await js(code)});
  const select=async(index,option=1)=>{await js('(()=>{const s=document.querySelectorAll("select")['+index+'];s.selectedIndex='+option+';s.dispatchEvent(new Event("change",{bubbles:true}));})()');await pause();};
  const author=async()=>{await js('(()=>{const i=document.querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"AtoumWeb test");i.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause();};
  const assign=async()=>{await js('[...document.querySelectorAll("button")].find(b=>b.innerText==="Affecter la cible").click()');await pause();};
  for(const theme of ['blanc','noir','atoumweb']){
   await show(theme,'page');await check(theme+' pending visible','document.body.innerText.includes("Cible à choisir explicitement")');
   await check(theme+' aucune affectation implicite','window.calls.length===0');await check(theme+' Page parent required','document.querySelectorAll("select").length===2');
   await check(theme+' disabled without author/target','[...document.querySelectorAll("button")].find(b=>b.innerText==="Affecter la cible").disabled');
   await select(0);await check(theme+' Page options scoped to Site','document.querySelectorAll("select")[1].options.length===2');await select(1);await author();await assign();
   await check(theme+' exact IDs and owner persisted','window.calls[0].input.siteId==="site-one"&&window.calls[0].input.pageNodeId==="page-one"&&window.calls[0].input.siteOwnerOrigin==="base-one"&&window.calls[0].input.author==="AtoumWeb test"');
   await check(theme+' success state refreshed','document.body.innerText.includes("Cible conservée")');
   await check(theme+' no horizontal overflow','document.documentElement.scrollWidth<=window.innerWidth');
   fs.writeFileSync(path.join(output,'targets-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
   await show(theme,'woo');await check(theme+' only configured Woo allowed','document.querySelector("select").options.length===2&&document.querySelector("select").innerText.includes("Boutique")&&!document.querySelector("select").innerText.includes("Site manuel")');
   await show(theme,'context');await check(theme+' context without fake Site','document.querySelectorAll("select").length===1&&!document.body.innerText.includes("Site cible")');await select(0);await author();await assign();await check(theme+' context ID persisted','window.calls[0].input.contextNodeId==="context-one"&&window.calls[0].input.siteId===null');
   await show(theme,'frozen');await check(theme+' accepted pending still selectable','document.body.innerText.includes("Périmètre accepté et figé")&&!document.querySelector("fieldset").disabled');await check(theme+' accepted no commercial sync button','![...document.querySelectorAll("button")].some(b=>b.innerText.includes("Synchroniser"))');
   await show(theme,'locked');await check(theme+' worked warning visible','document.body.innerText.includes("Cible déjà utilisée")');
   await show(theme,'error');await select(0);await author();await assign();await check(theme+' backend conflict visible','document.querySelector("[role=alert]").innerText.includes("Capacités incompatibles")');
   await show(theme,'create');await author();await js('[...document.querySelectorAll("button")].find(b=>b.innerText.includes("Créer le Site")).click()');await pause();await check(theme+' new occurrence explicit creation','window.calls[0].input.createSite===true&&window.calls[0].input.author==="AtoumWeb test"');
   await show(theme,'legacy');await check(theme+' no historical target controls','!document.querySelector("fieldset")');
  }
  const report={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,errors,mode:'React/Chromium isolé, trois thèmes, IPC synthétique, aucune base'};
  fs.writeFileSync(path.join(output,'ui-8a1.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));win.destroy();app.exit(report.failed||errors.length?1:0);
 }).catch(e=>{console.error(e);app.exit(1);});
}

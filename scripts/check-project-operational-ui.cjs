// Actual React components in an isolated Chromium window. Mocked IPC; no Manager startup.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-operational-ui-'));
 try{
  const env={...process.env,ATOUMWEB_OPERATIONAL_UI_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:60000});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;
 }finally{
  const checked=path.resolve(temp);if(!checked.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(checked).startsWith('atoumweb-operational-ui-'))throw Error('Temp unsafe');
  fs.rmSync(checked,{recursive:true,force:true,maxRetries:3,retryDelay:100});
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env.ATOUMWEB_OPERATIONAL_UI_TEMP;
 if(!temp)throw Error('Utiliser node');app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output')throw Error('--output requis');const output=path.resolve(args[1]);fs.mkdirSync(output,{recursive:true});const base=repo.replaceAll('\\','/');
 const entry=`import React from 'react';import {createRoot} from 'react-dom/client';
 import {OperationalActionDetails} from '${base}/src/renderer/projects/OperationalActionDetails';
 import {ProjectTimeTab} from '${base}/src/renderer/projects/ProjectTimeTab';
 import {GlobalTimer} from '${base}/src/renderer/time/GlobalTimer';
 import {TimePage} from '${base}/src/renderer/time/TimePage';
 import '${base}/src/renderer/styles.css';import '${base}/src/renderer/projects.css';import '${base}/src/renderer/time.css';import '${base}/src/renderer/ui-typography-consistency.css';import '${base}/src/renderer/ui-consistency-v2.css';
 const root=createRoot(document.getElementById('root'));window.calls=[];window.context=null;
 window.addEventListener('atoumweb:timer-context',e=>window.context=e.detail);
 const sessions=[{id:'s1',projectId:'project-fixture',projectNodeId:'action-fixture',category:'development',businessCategory:'Inclus au forfait',durationSeconds:1800,startedAt:'2026-10-04T08:00:00Z'},
 {id:'s2',projectId:'project-fixture',category:'design',businessCategory:'Garantie corrective',durationSeconds:900,startedAt:'2026-10-04T09:00:00Z'},
 {id:'s3',projectId:'project-fixture',category:'other',businessCategory:null,durationSeconds:600,startedAt:'2026-10-04T10:00:00Z'}];
 window.atoumweb={projects:{projects:{list:async()=>[{id:'project-fixture',name:'Projet test',number:'PRO-TEST',status:'to_prepare'}],get:async()=>({id:'project-fixture',nodes:[{id:'action-fixture',name:'Publication technique',type:'task',businessCategory:'Inclus au forfait'}]})}},time:{active:async()=>null,list:async()=>sessions,summary:async()=>({totalSeconds:3300,billableSeconds:0,nonBillableSeconds:3300,sessionCount:3}),start:async input=>{window.calls.push({action:'start',input});return {id:'timer-fixture',...input,source:'timer',startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),paused:false,durationSeconds:0};},addManual:async input=>{window.calls.push({action:'manual',input});return {id:'manual-fixture',...input};}}};
 window.show=(theme,mode)=>{
  document.documentElement.dataset.theme=theme;window.calls=[];window.context=null;
  if(mode==='timer'||mode==='manual') {root.render(<main key={theme+mode} style={{padding:24}}>{mode==='timer'?<GlobalTimer onMessage={()=>{}}/>:<TimePage onMessage={()=>{}}/>}</main>);return;}
  const mandatory=mode==='mandatory',legacy=mode==='legacy';
  const node={id:'action-fixture',projectId:'project-fixture',type:'task',name:'Publication technique',status:'todo',estimatedMinutes:mandatory?null:120,businessCategory:'Inclus au forfait',timeCategory:'development',
   operational:legacy?undefined:{code:'AW-WEB-VITRINE',modelVersionId:'version-operationnelle',modelVersion:1,catalogVersionId:'version-vendue',quoteLineId:'ligne-option',lineOrigin:'origine-commerciale',optionPurchase:{state:'purchased'},unitIndex:1,quantityMilli:2000,referenceMinutes:60,actualSeconds:1800,estimateRequired:mandatory,action:{key:'AW-WEB-VITRINE-A19'}}};
  root.render(<main key={theme+mode} className='projects-stack' style={{maxWidth:920,padding:24,margin:'auto'}}>
   <OperationalActionDetails node={node} onUpdate={async(id,input)=>{window.calls.push({id,input});}}/>
   <ProjectTimeTab projectId='project-fixture' nodes={[node]} onMessage={m=>window.calls.push({error:m})}/></main>);
 };
 window.show('blanc','normal');`;
 require('esbuild').buildSync({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',outfile:path.join(temp,'ui.js'),logLevel:'silent'});
 fs.writeFileSync(path.join(temp,'index.html'),'<html><head><meta charset="utf-8"><link rel="stylesheet" href="./ui.css"></head><body><div id="root"></div><script src="./ui.js"></script></body></html>');
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1080,height:1060,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
  const checks=[],errors=[];win.webContents.on('console-message',event=>{if(event.level>=2){errors.push(event.message);console.error(event.message);}});await win.loadFile(path.join(temp,'index.html'));
  const js=async code=>{try{return await win.webContents.executeJavaScript(code);}catch(e){console.error(code);throw e;}},pause=()=>new Promise(r=>setTimeout(r,150));
  const show=async(theme,mode)=>{await js('window.show('+JSON.stringify(theme)+','+JSON.stringify(mode)+')');await pause();};
  const check=async(name,code)=>checks.push({name,passed:!!(await js(code))});
  for(const theme of ['blanc','noir','atoumweb']){
   await show(theme,'normal');
   await check(theme+' référence initiale distincte','document.body.innerText.includes("Référence initiale : 60 min")');
   await check(theme+' estimation courante distincte','document.body.innerText.includes("Estimation courante : 120 min")');
   await check(theme+' réel calculé visible','document.body.innerText.includes("Temps réel : 30 min")');
   await check(theme+' cinq catégories disponibles','document.querySelector("select").options.length===5');
   await check(theme+' catégories séparées de activité','document.body.innerText.includes("Inclus au forfait : 30 min") && document.body.innerText.includes("Garantie corrective : 15 min")');
   await check(theme+' historique non reclassé','document.body.innerText.includes("Temps historique non qualifié : 10 min")');
   await check(theme+' pas de facture automatique','document.body.innerText.includes("Aucun supplément n’est facturé automatiquement")');
   await js('document.querySelector("select").value="Garantie corrective";document.querySelector("select").dispatchEvent(new Event("change",{bubbles:true}))');await pause();
   await check(theme+' catégorie modifiée explicitement','window.calls.length===1 && window.calls[0].id==="action-fixture" && window.calls[0].input.businessCategory==="Garantie corrective"');
   await check(theme+' référence non modifiée par catégorie','document.body.innerText.includes("Référence initiale : 60 min")');
   await js('document.querySelector("details").open=true');await pause();
   await check(theme+' provenance exacte ouverte','document.body.innerText.includes("version-vendue") && document.body.innerText.includes("ligne-option") && document.body.innerText.includes("origine-commerciale") && document.body.innerText.includes("Option explicitement achetée")');
   await js('[...document.querySelectorAll("button")].find(b=>b.innerText.includes("Publication technique")).click()');await pause();
   await check(theme+' chrono rattaché à action','window.context.projectId==="project-fixture" && window.context.nodeId==="action-fixture" && window.context.businessCategory==="Inclus au forfait" && window.context.category==="development"');
   await check(theme+' forfait sans supplément facturable automatique','window.context.billable===false');
   await check(theme+' comparaison production qualifiée','document.body.innerText.includes("Écart production qualifiée")');
   await check(theme+' sans débordement','document.documentElement.scrollWidth<=window.innerWidth');
   fs.writeFileSync(path.join(output,'ui-operational-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
   await show(theme,'mandatory');
   await check(theme+' estimation à établir','document.body.innerText.includes("Estimation courante : À établir")');
   await check(theme+' total explicitement incomplet','document.body.innerText.includes("Temps estimé — incomplet") && document.body.innerText.includes("Estimation incomplète : écart non calculable")');
   await check(theme+' cadrage indicatif','document.body.innerText.includes("socle indicatif, estimation complète obligatoire")');
   fs.writeFileSync(path.join(output,'ui-operational-estimation-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
   await show(theme,'legacy');
   await check(theme+' aucune requalification historique',`!document.querySelector('[aria-label="Référence opérationnelle"]') && !document.querySelector('[aria-label="Temps par catégorie métier"]')`);
   await show(theme,'timer');
   await js('window.dispatchEvent(new CustomEvent("atoumweb:timer-context",{detail:{projectId:"project-fixture",nodeId:"action-fixture",activityLabel:"Publication technique",category:"development",businessCategory:"Inclus au forfait",billable:false}}))');await pause();
   await check(theme+' chrono catégorie préremplie',`document.querySelector('[aria-label="Catégorie métier"]').value==='Inclus au forfait'`);
   await check(theme+' chrono cinq catégories + historique',`document.querySelector('[aria-label="Catégorie métier"]').options.length===6`);
   await js('[...document.querySelectorAll("button")].find(b=>b.innerText.includes("Démarrer")&&b.classList.contains("primary-button")).click()');await pause();
   await check(theme+' démarrage persiste catégorie et action',`window.calls.some(c=>c.action==='start'&&c.input.businessCategory==='Inclus au forfait'&&c.input.projectNodeId==='action-fixture')`);
   await show(theme,'manual');
   await js('[...document.querySelectorAll("button")].find(b=>b.innerText.includes("Temps manuel")).click()');await pause();
   await check(theme+' saisie manuelle cinq catégories',`document.querySelector('[aria-label="Catégorie métier manuelle"]').options.length===6`);
   await js(`(()=>{const sel=document.querySelector('[aria-label="Catégorie métier manuelle"]');sel.value='Avant-vente';sel.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause();
   await js('[...document.querySelectorAll("button")].find(b=>b.innerText==="Ajouter la session").click()');await pause();
   await check(theme+' saisie conserve Avant-vente',`window.calls.some(c=>c.action==='manual'&&c.input.businessCategory==='Avant-vente')`);

  }
  const report={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,mode:'Chromium/React isolé, IPC simulé, aucune base',checks,errors};
  fs.writeFileSync(path.join(output,'ui-lot8a.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));win.destroy();app.exit(report.failed||errors.length?1:0);
 }).catch(error=>{console.error(error);app.exit(1);});
}

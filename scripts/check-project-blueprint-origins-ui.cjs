// Isolated actual Chromium/React renderer. No preload, IPC, Manager initialisation or SQLite.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-origins-ui-'));
 try{
  const env={...process.env,ATOUMWEB_ORIGINS_UI_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:45000});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;
 }finally{
  const resolved=path.resolve(temp);if(!resolved.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(resolved).startsWith('atoumweb-origins-ui-'))throw Error('Temp unsafe');
  fs.rmSync(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:100});
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env.ATOUMWEB_ORIGINS_UI_TEMP;
 if(!temp)throw Error('Utiliser node');app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output')throw Error('--output requis');
 const output=path.resolve(args[1]);fs.mkdirSync(output,{recursive:true});
 const base=repo.replaceAll('\\','/');
 const entry=`import React from 'react';import {createRoot} from 'react-dom/client';
 import {ProjectBlueprintOrigins} from '${base}/src/renderer/projects/ProjectBlueprintOrigins';
 import '${base}/src/renderer/styles.css';import '${base}/src/renderer/projects.css';
 const root=createRoot(document.getElementById('root'));
 window.show=(theme,empty=false)=>{
  document.documentElement.dataset.theme=theme;
  const shared={contributionKey:'not-visible-key',sourceTemplateNodeId:'not-visible-node',quoteLineId:'not-visible-line',catalogVersionId:'not-visible-version',componentId:null,templateVersionId:'not-visible-template',role:'addon',quantityMilli:2000,quantityMode:'per_unit',label:'Page supplémentaire',optionPurchase:{state:'purchased'}};
  root.render(<div style={{maxWidth:700,padding:30}}><h2>Page supplémentaire (2)</h2><ProjectBlueprintOrigins sources={empty?[]:[{...shared,unitIndex:2}]} /></div>);
 };window.show('blanc');`;
 require('esbuild').buildSync({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',outfile:path.join(temp,'ui.js'),logLevel:'silent'});
 fs.writeFileSync(path.join(temp,'index.html'),'<html><head><meta charset="utf-8"><link rel="stylesheet" href="./ui.css"></head><body><div id="root"></div><script src="./ui.js"></script></body></html>');
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:850,height:400,webPreferences:{contextIsolation:true,nodeIntegration:false}});
  await win.loadFile(path.join(temp,'index.html'));
  const checks=[];
  const pause=()=>new Promise(resolve=>setTimeout(resolve,100));
  for(const theme of ['blanc','noir','atoumweb']){
   await win.webContents.executeJavaScript('window.show('+JSON.stringify(theme)+')');await pause();
   const actual=await win.webContents.executeJavaScript('({text:document.body.innerText,styled:getComputedStyle(document.body).fontFamily.includes("Inter")&&getComputedStyle(document.body).backgroundColor!=="rgba(0, 0, 0, 0)",aside:!!document.querySelector(\'aside[aria-label="Origine dans le devis"]\')})');
   for(const [name,passed] of [['Thème et styles chargés',actual.styled],['Libellé lisible',actual.text.includes('Page supplémentaire')],['Achat explicite',actual.text.includes('option achetée')],['Quantité vendue conservée',actual.text.includes('quantité vendue : 2')],['Unité exacte',actual.text.includes('unité 2')],['Identifiants techniques non affichés',!actual.text.includes('not-visible')],['Origine accessible',actual.aside]])
    checks.push({name:theme+' — '+name,passed});
   fs.writeFileSync(path.join(output,'ui-origins-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
   await win.webContents.executeJavaScript('window.show('+JSON.stringify(theme)+',true)');await pause();
   checks.push({name:theme+' — historique sans origine inventée',passed:await win.webContents.executeJavaScript('!document.querySelector("aside")')});
  }
  const report={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks};
  fs.writeFileSync(path.join(output,'ui-lot7.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  win.destroy();app.exit(report.failed?1:0);
 }).catch(error=>{console.error(error);app.exit(1);});
}

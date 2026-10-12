// UX/UI V2 01E pilot: real Electron/React guard with two fictitious editors.
// This is an opt-in TEMP fixture. No Manager workspace, database, business IPC or MSI.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),interactive=process.argv.includes('--interactive');
const prefix='atoumweb-uxv2-01e-';
const owned=p=>!!p&&path.dirname(path.resolve(p))===path.resolve(os.tmpdir())&&path.basename(p).startsWith(prefix);
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const build=require('esbuild').buildSync;
  build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {FormFeedbackWorkshop} from './src/renderer/ui/FormFeedbackWorkshop';createRoot(document.getElementById('root')).render(<FormFeedbackWorkshop/>);",resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',outfile:path.join(temp,'fixture.js'),logLevel:'silent'});
  build({entryPoints:[path.join(repo,'src/main/unsaved.ts')],bundle:true,platform:'node',format:'cjs',external:['electron'],outfile:path.join(temp,'guards.cjs'),logLevel:'silent'});
  fs.writeFileSync(path.join(temp,'preload.cjs'),"const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('atoumweb',{unsaved:{confirmExit:(labels,pending)=>ipcRenderer.sendSync('unsaved:confirm-exit',labels,pending),publishState:state=>ipcRenderer.sendSync('unsaved:state',state)}});");
  const entry=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
  const css=[...entry.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>fs.readFileSync(path.join(repo,'src/renderer',m[1]),'utf8')).join('\n');
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><title>AtoumWeb — 01E TEST</title><style>'+css+'</style><link rel="stylesheet" href="fixture.css"></head><body><div class="app-shell"><main class="main-area"><div id="root"></div></main></div><script src="fixture.js"></script></body></html>');
  const env={...process.env,ATOUMWEB_01E_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{env,windowsHide:!interactive,encoding:'utf8',maxBuffer:4*1024*1024,...(!interactive?{timeout:120000}:{})});
  process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
  if(run.error)throw run.error;if(run.status!==0)throw Error('01E workshop failed: '+run.status);
 }catch(e){console.error(e.stack);process.exitCode=1;}
 finally{if(!owned(temp))throw Error('Refusing unsafe cleanup');fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:150});console.log('Fixture cleaned: '+!fs.existsSync(temp));}
}else{
 const {app,BrowserWindow,dialog}=require('electron'),temp=process.env.ATOUMWEB_01E_TEMP;
 if(!owned(temp))throw Error('TEMP fixture required');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const G=require(path.join(temp,'guards.cjs'));G.registerUnsavedConfirmationIpc();G.registerGuardedShutdown(()=>{});
 const replies=[],dialogs=[];if(!interactive)dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return replies.shift()??0;};
 let win,checks=0;
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(okay,label)=>{if(!okay)throw Error(label);checks++;};
 const js=src=>win.webContents.executeJavaScript('(async()=>{'+src+'})()');
 const get=expr=>js('return ('+expr+');');
 const wait=async expr=>{for(let i=0;i<100;i++){if(await get(expr))return;await sleep(40);}throw Error('Timeout '+expr);};
 const sel=label=>'article[aria-label="Dossier fictif '+label+'"]';
 const input=async(label,value)=>{const s=JSON.stringify(sel(label)+' input');await js('const e=document.querySelector('+s+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}));');await sleep(65);};
 const action=async(label,name)=>{const s=JSON.stringify(sel(label));await js('const btn=[...document.querySelectorAll('+s+'+" button")].find(e=>e.textContent.trim()==='+JSON.stringify(name)+');if(!btn)throw Error("Missing action");btn.click();');await sleep(60);};
 const state=label=>get('document.querySelector('+JSON.stringify(sel(label))+')?.querySelector("[data-form-feedback]")?.dataset.formFeedback');
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:true,width:1280,height:900,title:'AtoumWeb — Atelier 01E TEST',webPreferences:{preload:path.join(temp,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});
  G.bindUnsavedWindow(win);await win.loadFile(path.join(temp,'index.html'));
  await wait('document.querySelectorAll("article[aria-label]").length===2');
  if(interactive){console.log('Atelier 01E interactif TEST, profil TEMP uniquement.');return;}
  assert(await get('Object.keys(window.atoumweb).join(",")==="unsaved"'),'Only native UX-01 IPC exposed');
  assert(await state('A')==='clean'&&await state('B')==='clean','Editors start clean independently');
  await input('A','Brouillon A');assert(await state('A')==='dirty'&&await state('B')==='clean','Editing A does not dirty B');
  await input('B','Brouillon B');assert(await state('B')==='dirty','Second editor has its own draft');
  const n=dialogs.length;
  await js('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Fermer A (garde UX-01)").click()');await sleep(80);
  assert(dialogs.length===n+1&&dialogs.at(-1).defaultId===0,'Native Stay is safe default');
  assert(await get('document.querySelectorAll("article[aria-label]").length===2'),'Refused exit leaves both editors mounted');
  assert(await get('document.querySelector('+JSON.stringify(sel('A')+' input')+').value==="Brouillon A"&&document.querySelector('+JSON.stringify(sel('B')+' input')+').value==="Brouillon B"'),'Refused exit preserves both drafts');
  await action('A','Simuler une version distante (TEST)');assert(await state('A')==='conflict','Concurrent remote update detects a real three-way conflict');
  assert(await get('document.querySelector('+JSON.stringify(sel('A')+' input')+').value==="Brouillon A"'),'Conflict keeps local note, never overwrites it with remote text');
  await input('A','Brouillon A modifié pendant conflit');assert(await state('A')==='conflict','Editing never conceals an unresolved conflict');
  assert(await get('document.querySelector('+JSON.stringify(sel('A'))+')?.querySelectorAll("button:disabled").length>0'),'Simulated save is disabled during conflict');
  await action('B','Simuler un refus (TEST)');assert(await state('B')==='error','B error visible and independent');
  await action('A','Effacer conflit fictif (TEST)');assert(await state('A')==='dirty','Explicit fixture reset restores dirty state');
  await action('A','Simuler un retour positif (TEST)');
  await wait('document.querySelector('+JSON.stringify(sel('A'))+')?.querySelector("[data-form-feedback]")?.dataset.formFeedback==="pending"');
  await input('A','Brouillon A modifié pendant enregistrement');
  assert(await state('A')==='pending','A newer edit during pending is never shown as saved');
  win.close();await sleep(60);
  assert(!win.isDestroyed(),'Native close veto during pending');
  assert(dialogs.at(-1).buttons.join('|')==='Rester','Pending permits Stay only');
  await wait('document.querySelector('+JSON.stringify(sel('A'))+')?.querySelector("[data-form-feedback]")?.dataset.formFeedback==="dirty"');
  assert(await get('document.querySelector('+JSON.stringify(sel('A')+' input')+').value==="Brouillon A modifié pendant enregistrement"'),'Late response preserves edits made after the submitted snapshot');
  assert(await state('B')==='error','A simulated save never cleans B error');
  assert(await get('document.querySelector('+JSON.stringify(sel('B')+' input')+').value==="Brouillon B"'),'B note survives A save simulation');
  const beforeDirtyClose=dialogs.length;
  await js('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Fermer A (garde UX-01)").click()');await sleep(80);
  assert(dialogs.length===beforeDirtyClose+1&&await state('A')==='dirty','A stays protected after stale save response');
  await action('A','Simuler un retour positif (TEST)');
  await wait('document.querySelector('+JSON.stringify(sel('A'))+')?.querySelector("[data-form-feedback]")?.dataset.formFeedback==="saved"');
  assert(await get('document.querySelector('+JSON.stringify(sel('A')+' input')+').value==="Brouillon A modifié pendant enregistrement"'),'Second confirmed snapshot is the latest text');
  await js('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Fermer A (garde UX-01)").click()');await sleep(80);
  assert(await get('document.querySelectorAll("article[aria-label]").length===1'),'Closing clean A never discards B');
  assert(await get('document.querySelector('+JSON.stringify(sel('B')+' input')+').value==="Brouillon B"'),'B draft persists after A unmount');
  // Nine actual frame captures with a visual marker, separate from the real Manager.
  const out=path.join(repo,'outputs','ux-v2-lot01e-reference');fs.mkdirSync(out,{recursive:true});
  let frame=0;
  for(const theme of ['atoumweb','noir','blanc'])for(const [density,font]of [['compact',14],['comfort',16],['comfort_plus',18]]){
   await js('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));await sleep(70);
   assert(await get('parseFloat(getComputedStyle(document.body).fontSize)')===font,'Theme density '+theme+'/'+density);
   const rgb=[20+(++frame)*16,50+frame*11,80+frame*7];
   await js('let e=document.querySelector("#frame-marker");if(!e){e=document.createElement("div");e.id="frame-marker";document.body.appendChild(e);}e.style.cssText="position:fixed;right:0;bottom:0;width:20px;height:20px;z-index:99999;background:rgb('+rgb.join(',')+')";await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');
   let shot,verified=false;
   for(let i=0;i<8;i++){await sleep(70);shot=await win.webContents.capturePage();const size=shot.getSize(),bits=shot.toBitmap(),off=((size.height-8)*size.width+size.width-8)*4;if(bits[off]===rgb[2]&&bits[off+1]===rgb[1]&&bits[off+2]===rgb[0]){verified=true;break;}}
   assert(verified,'Synchronized screenshot '+theme+'/'+density);
   fs.writeFileSync(path.join(out,theme+'-'+density+'.png'),shot.toPNG());
  }
  for(const zoom of [1,1.25,1.5]){win.setSize(900,750);win.webContents.setZoomFactor(zoom);await sleep(140);assert(await get('document.querySelector('+JSON.stringify(sel('B')+' input')+').value==="Brouillon B"'),'Draft survives zoom '+zoom);}
  const beforeDiscard=dialogs.length;
  await action('B','Annuler cette note');
  assert(dialogs.length===beforeDiscard+1&&dialogs.at(-1).defaultId===0,'Discard must request UX01 permission first');
  assert(await get('document.querySelector('+JSON.stringify(sel('B')+' input')+').value==="Brouillon B"'),'Refused discard keeps the entire draft');
  replies.push(1);await action('B','Annuler cette note');
  assert(await state('B')==='clean','Explicitly accepted discard cleans B only');
  assert(await get('document.querySelector('+JSON.stringify(sel('B')+' input')+').value===""'),'Accepted discard restores B baseline');
  await action('B','Simuler une version distante (TEST)');
  assert(await get('document.querySelector('+JSON.stringify(sel('B')+' input')+').value==="VERSION DISTANTE TEST — Dossier fictif B"'),'Remote update replaces a clean editor safely');
  assert(await state('B')==='clean','Clean remote update updates the confirmed baseline');
  console.log(JSON.stringify({checks,failed:0,captures:9,onlyTemp:true,noBusinessIpc:true}));
  win.destroy();app.exit(0);
 }).catch(e=>{console.error(e.stack);win?.destroy();app.exit(1)});
 app.on('window-all-closed',()=>{if(interactive)app.quit();});
}

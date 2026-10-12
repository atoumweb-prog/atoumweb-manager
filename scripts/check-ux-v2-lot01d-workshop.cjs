// Real React/Electron table pilot with frozen synthetic rows and an owned TEMP profile.
// No SQLite, business IPC, installed Manager or Validation-MSI.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),interactive=process.argv.includes('--interactive');
const prefix='atoumweb-uxv2-01d-';
const owned=temp=>!!temp&&path.dirname(path.resolve(temp))===path.resolve(os.tmpdir())&&path.basename(temp).startsWith(prefix);
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const build=require('esbuild').buildSync;
  build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {TableWorkshop} from './src/renderer/ui/TableWorkshop';import {TABLE_WORKSHOP_RECORDS} from './src/shared/tableWorkshopFixtures';window.__tableFixtures=TABLE_WORKSHOP_RECORDS;createRoot(document.getElementById('root')).render(<TableWorkshop/>);",resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',outfile:path.join(temp,'fixture.js'),logLevel:'silent'});
  build({entryPoints:[path.join(repo,'src/main/unsaved.ts')],bundle:true,platform:'node',format:'cjs',external:['electron'],outfile:path.join(temp,'guards.cjs'),logLevel:'silent'});
  fs.writeFileSync(path.join(temp,'preload.cjs'),"const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('atoumweb',{unsaved:{confirmExit:(labels,pending)=>ipcRenderer.sendSync('unsaved:confirm-exit',labels,pending),publishState:state=>ipcRenderer.sendSync('unsaved:state',state)}});");
  const entry=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8'),styles=[...entry.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>fs.readFileSync(path.join(repo,'src/renderer',m[1]),'utf8')).join('\n');
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><title>AtoumWeb — Atelier 01D TEST</title><style>'+styles+'</style><link rel="stylesheet" href="fixture.css"></head><body><div class="app-shell"><aside class="sidebar">AtoumWeb<br>Atelier UX/UI TEST</aside><main class="main-area"><section class="content-area"><div id="root"></div></section></main></div><script src="fixture.js"></script></body></html>');
  const env={...process.env,ATOUMWEB_01D_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{env,windowsHide:!interactive,encoding:'utf8',maxBuffer:4*1024*1024,...(!interactive?{timeout:120000}:{})});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;if(r.status!==0)throw Error('Workshop failed '+r.status);
 }catch(e){console.error(e.stack);process.exitCode=1;}
 finally{if(!owned(temp))throw Error('Unsafe cleanup');fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:150});console.log('Fixture cleaned: '+!fs.existsSync(temp));}
}else{
 const {app,BrowserWindow,dialog}=require('electron'),temp=process.env.ATOUMWEB_01D_TEMP;
 if(!owned(temp))throw Error('TEMP fixture required');app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const G=require(path.join(temp,'guards.cjs'));G.registerUnsavedConfirmationIpc();G.registerGuardedShutdown(()=>{});
 const answers=[],dialogs=[];if(!interactive)dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 let win,checks=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(ok,msg)=>{if(!ok)throw Error(msg);checks++;};
 const js=code=>win.webContents.executeJavaScript('(async()=>{'+code+'})()'),get=code=>js('return ('+code+');');
 const wait=async code=>{for(let i=0;i<100;i++){if(await get(code))return;await sleep(30);}throw Error('Timeout '+code);};
 const click=async label=>{await js('[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==='+JSON.stringify(label)+').click()');await sleep(60);};
 const input=async(selector,value)=>{await js('const e=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(e.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event(e.tagName==="SELECT"?"change":"input",{bubbles:true}));');await sleep(60);};
 const open=async id=>{await js('document.querySelector("[data-open-record='+id+']").click()');await sleep(70);};
 const sort=async id=>{await js('document.querySelector("th[data-column-id='+id+'] button").click()');await sleep(70);};
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:true,width:1700,height:1100,webPreferences:{preload:path.join(temp,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});G.bindUnsavedWindow(win);await win.loadFile(path.join(temp,'index.html'));await wait('document.querySelectorAll("tbody tr").length===120');
  if(interactive){console.log('Atelier 01D interactif ouvert, uniquement TEMP.');return;}
  const source=await get('JSON.stringify(window.__tableFixtures)');
  assert(await get('Object.keys(window.atoumweb).join(",")==="unsaved"'),'No business API exposed');
  assert(await get('Object.isFrozen(window.__tableFixtures)&&window.__tableFixtures.every(Object.isFrozen)'),'120 source rows immutable');
  await open('TEST-001');await click('Notes');await input('#table-record-note','BROUILLON À CONSERVER');
  const token=await get('document.querySelector("[data-editor-instance]").dataset.editorInstance');
  await input('#table-query','TEST-120');
  assert(await get('document.querySelectorAll("tbody tr").length===1&&document.querySelector("tbody tr").dataset.recordId==="TEST-120"'),'Search exact result identity');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.recordId==="TEST-001"&&document.querySelector("#table-record-note").value==="BROUILLON À CONSERVER"'),'Filtered out selection keeps full source identity and draft');
  assert(await get('!!document.querySelector(".aw-table-outside")'),'Selected outside filter visibly explained');
  const count=dialogs.length;await open('TEST-120');
  assert(dialogs.length===count+1&&dialogs.at(-1).defaultId===0,'Existing UX01 Stay default for new record');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===token,'Stay does not remount editor');
  await input('#table-query','no-results');assert(await get('document.querySelectorAll("tbody tr").length===0&&document.querySelector("#table-counter").textContent.startsWith("0 / 120")'),'Empty result and exact count');
  assert(await get('document.querySelector("#table-record-note").value==="BROUILLON À CONSERVER"'),'Empty list never clears selected draft');
  await click('Effacer les filtres');assert(await get('document.querySelectorAll("tbody tr").length===120'),'Reset filters restores full source');
  await sort('amount');assert(await get('document.querySelector("th[data-column-id=amount]").getAttribute("aria-sort")==="ascending"'),'Ascending header ARIA');
  await sort('amount');assert(await get('document.querySelector("tbody tr").dataset.recordId==="TEST-005"'),'Descending cents sorted numerically with stable identity');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===token,'Sorting moved row preserves mounted editor');
  assert(await get('document.querySelector("#table-record-note").value==="BROUILLON À CONSERVER"&&!document.querySelector("#table-record-note").closest("section").hidden'),'Sort preserves note and active tab');
  await sort('amount');assert(await get('document.querySelector("tbody tr").dataset.recordId==="TEST-001"'),'Third sort restores source order');
  await input('#table-status','En cours');await input('#table-category','Commerce');assert(await get('document.querySelectorAll("tbody tr").length===13'),'Combined filters exact count');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===token,'Status and category do not remount hidden selection');
  await click('Effacer les filtres');
  await js('document.querySelector(".aw-table-columns").open=true;document.querySelector("[data-column-toggle=category]").click()');await sleep(70);
  assert(await get('!document.querySelector("th[data-column-id=category]")'),'Optional column hidden');
  assert(await get('document.querySelector("[data-column-toggle=identity]").disabled&&document.querySelector("[data-column-toggle=open]").disabled'),'Required identity and open cannot be hidden');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===token,'Column presentation preserves editor');
  assert(await get('!localStorage.getItem("atoumweb:table-workshop:dossiers:v1").includes("BROUILLON")&&!localStorage.getItem("atoumweb:table-workshop:dossiers:v1").includes("TEST-001")'),'Preferences exclude note and selected record');
  await click('Agrandir');await click('Réduire');assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===token,'Expand reduce same editor after filter and sort');
  win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(70);
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===token,'Escape Stay retains draft');
  win.close();await sleep(70);assert(!win.isDestroyed(),'Native close Stay preserves draft');
  await input('#table-query','TEST-120');answers.push(1);await open('TEST-120');assert(await get('document.querySelector("[data-editor-instance]").dataset.recordId==="TEST-120"&&document.querySelector("#table-record-note").value===""'),'Explicit discard changes only selected record');
  await click('Effacer les filtres');await click('Réinitialiser les colonnes');
  const saved=await get('localStorage.getItem("atoumweb:table-workshop:dossiers:v1")');
  await input('#table-view','autre-vue');await input('#table-status','Clôturé');assert(await get('localStorage.getItem("atoumweb:table-workshop:dossiers:v1")')===saved,'Other view preference independent');
  await input('#table-view','dossiers');assert(await get('document.querySelector("#table-status").value===""'),'Return restores own view filters');
  await input('#table-query','TEST-001');win.webContents.reload();await wait('document.querySelectorAll("tbody tr").length===120');assert(await get('document.querySelector("#table-query").value===""&&!document.querySelector(".aw-record-pane")'),'Reload never restores private query or selected identity');
  win.focus();win.webContents.focus();await wait('document.hasFocus()');
  await js('const e=document.querySelector("[data-open-record=TEST-001]");e.scrollIntoView({block:"nearest"});e.focus();');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});win.webContents.sendInputEvent({type:'char',keyCode:'\r'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  await wait('document.querySelector("[data-editor-instance]")?.dataset.recordId==="TEST-001"');assert(true,'Native Enter opens the exact row identity');
  await click('Notes');await input('#table-record-note','VISUEL TEST');
  const visualToken=await get('document.querySelector("[data-editor-instance]").dataset.editorInstance');
  const beforeKeyboard=dialogs.length;await js('document.querySelector("th[data-column-id=identity] button").focus()');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});win.webContents.sendInputEvent({type:'char',keyCode:' '});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});await sleep(80);
  assert(await get('document.querySelector("th[data-column-id=identity]").getAttribute("aria-sort")==="ascending"'),'Native Space sorts header');
  assert(dialogs.length===beforeKeyboard&&await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===visualToken,'Keyboard sort is presentation only and preserves editor');
  await sort('identity');await sort('identity');
  const storedBeforeFailure=await get('localStorage.getItem("atoumweb:table-workshop:dossiers:v1")');
  await js('window.tableSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error("Fixture quota refused")};');
  await input('#table-status','En cours');
  assert(await get('document.querySelector(".aw-ui-notice--error").textContent.includes("non mémorisées")'),'Preference refusal visible without success');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===visualToken&&await get('document.querySelector("#table-record-note").value==="VISUEL TEST"'),'Preference refusal does not change identity, mount or draft');
  assert(await get('localStorage.getItem("atoumweb:table-workshop:dossiers:v1")')===storedBeforeFailure,'Failed preference write leaves persisted view unchanged');
  await js('Storage.prototype.setItem=window.tableSetItem');await click('Effacer les filtres');
  assert(await get('!document.querySelector(".aw-ui-notice--error")'),'Confirmed retry removes preference failure');
  const beforeViewChange=dialogs.length;await input('#table-view','autre-vue');
  assert(dialogs.length===beforeViewChange+1&&await get('document.querySelector("#table-view").value==="dossiers"'),'Dirty view change uses existing Stay confirmation');
  assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===visualToken&&await get('document.querySelector("#table-record-note").value==="VISUEL TEST"'),'Refused view change preserves selected mount and draft');
  await js('document.querySelector(".aw-data-table-scroll").scrollTop=0;document.querySelector(".content-area").scrollTop=0;document.scrollingElement.scrollTop=0;');
  const captures=path.join(repo,'outputs','ux-v2-lot01d-reference');fs.mkdirSync(captures,{recursive:true});
  let frame=0;for(const theme of ['atoumweb','noir','blanc'])for(const [density,font]of [['compact',14],['comfort',16],['comfort_plus',18]]){
   await js('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));await sleep(80);
   assert(await get('parseFloat(getComputedStyle(document.body).fontSize)')===font,'Density font '+theme+'/'+density);
   assert(await get('document.querySelector(".aw-record-split").scrollWidth<=document.querySelector(".aw-record-split").clientWidth+1'),'No global horizontal overflow '+theme+'/'+density);
   assert(await get('[...document.querySelectorAll("[data-open-record] .aw-ui-button-label")].every(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length===1;})'),'Open labels never split into broken words '+theme+'/'+density);
   assert(await get('document.querySelector("[data-editor-instance]").dataset.editorInstance')===visualToken,'Same editor in '+theme+'/'+density);
   const rgb=[40+(++frame)*15,60+frame*10,80+frame*5];await js('let e=document.querySelector("#frame-marker");if(!e){e=document.createElement("div");e.id="frame-marker";document.body.appendChild(e);}e.style.cssText="position:fixed;right:0;bottom:0;width:20px;height:20px;z-index:99999;background:rgb('+rgb.join(',')+')";await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');
   let shot,verified=false;for(let i=0;i<8;i++){await sleep(70);shot=await win.webContents.capturePage();const size=shot.getSize(),bitmap=shot.toBitmap(),offset=((size.height-8)*size.width+size.width-8)*4;if(bitmap[offset]===rgb[2]&&bitmap[offset+1]===rgb[1]&&bitmap[offset+2]===rgb[0]){verified=true;break;}}
   assert(verified,'Capture freshness '+theme+'/'+density);fs.writeFileSync(path.join(captures,theme+'-'+density+'.png'),shot.toPNG());
  }
  for(const zoom of [1,1.25,1.5]){win.setSize(900,800);win.webContents.setZoomFactor(zoom);await sleep(150);assert(await get('document.querySelector(".aw-record-split").classList.contains("is-narrow")'),'Narrow fallback '+zoom);assert(await get('document.querySelector("#table-record-note").value==="VISUEL TEST"'),'Narrow zoom preserves draft '+zoom);assert(await get('[...document.querySelectorAll("#table-query,#table-status,#table-category,.aw-record-pane-actions button")].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1;})'),'Narrow essential controls reachable '+zoom);}
  assert(await get('JSON.stringify(window.__tableFixtures)')===source,'No source record mutation after all interactions');
  console.log(JSON.stringify({checks,failed:0,records:120,captures:9,onlyTemp:true,businessApiExposed:false}));win.destroy();app.exit(0);
 }).catch(e=>{console.error(e.stack);win?.destroy();app.exit(1);});
 app.on('window-all-closed',()=>{if(interactive)app.quit();});
}

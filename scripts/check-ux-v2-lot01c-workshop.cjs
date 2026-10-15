// Functional React/Electron workshop, TEMP profile only; no database or Manager launch.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),interactive=process.argv.includes('--interactive');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-uxv2-01c-'));
 try{
  const build=require('esbuild').buildSync;
  build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {RecordWorkshop} from './src/renderer/ui/RecordWorkshop';createRoot(document.getElementById('root')).render(<RecordWorkshop/>);",resolveDir:repo,loader:'tsx'},bundle:true,loader:{'.png':'dataurl'},platform:'browser',outfile:path.join(temp,'fixture.js'),logLevel:'silent'});
  build({entryPoints:[path.join(repo,'src/main/unsaved.ts')],bundle:true,loader:{'.png':'dataurl'},platform:'node',format:'cjs',external:['electron'],outfile:path.join(temp,'guards.cjs'),logLevel:'silent'});
  fs.writeFileSync(path.join(temp,'preload.cjs'),"const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('atoumweb',{unsaved:{confirmExit:(labels,pending)=>ipcRenderer.sendSync('unsaved:confirm-exit',labels,pending),publishState:state=>ipcRenderer.sendSync('unsaved:state',state)}});");
  const main=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8'),styles=[...main.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>fs.readFileSync(path.join(repo,'src/renderer',m[1]),'utf8')).join('\n');
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+styles+'</style><link rel="stylesheet" href="fixture.css"></head><body><div class="app-shell"><aside class="sidebar">AtoumWeb — atelier TEST</aside><main class="main-area"><section class="content-area"><div id="root"></div></section></main></div><script src="fixture.js"></script></body></html>');
  const env={...process.env,ATOUMWEB_01C_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{env,windowsHide:!interactive,encoding:'utf8',maxBuffer:4*1024*1024,...(!interactive?{timeout:120000}:{})});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;if(r.status!==0)throw Error('Workshop failed '+r.status);
 }catch(e){console.error(e.stack);process.exitCode=1;}
 finally{if(path.dirname(path.resolve(temp))!==path.resolve(os.tmpdir())||!path.basename(temp).startsWith('atoumweb-uxv2-01c-'))throw Error('Unsafe cleanup');fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:150});console.log('Fixture cleaned: '+!fs.existsSync(temp));}
}else{
 const {app,BrowserWindow,dialog}=require('electron'),temp=process.env.ATOUMWEB_01C_TEMP;
 if(!temp||path.dirname(path.resolve(temp))!==path.resolve(os.tmpdir())||!path.basename(temp).startsWith('atoumweb-uxv2-01c-'))throw Error('TEMP fixture required');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const G=require(path.join(temp,'guards.cjs'));G.registerUnsavedConfirmationIpc();let quitCleaned=false;G.registerGuardedShutdown(()=>{quitCleaned=true;});
 const answers=[],dialogs=[];if(!interactive)dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 let win,checks=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(ok,msg)=>{if(!ok)throw Error(msg);checks++;};
 const js=code=>win.webContents.executeJavaScript('(async()=>{'+code+'})()'),get=code=>js('return ('+code+');');
 const wait=async code=>{for(let i=0;i<100;i++){if(await get(code))return;await sleep(30);}throw Error('Timeout '+code);};
 const click=async label=>{await js('[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==='+JSON.stringify(label)+').click()');await sleep(70);};
 const input=async value=>{await js('const e=document.querySelector("#workshop-note");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}));');await sleep(70);};
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:true,width:1500,height:1000,title:'AtoumWeb — Atelier 01C TEST',webPreferences:{preload:path.join(temp,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});G.bindUnsavedWindow(win);await win.loadFile(path.join(temp,'index.html'));await wait('!!document.querySelector("h1")');
  if(interactive){console.log('Atelier interactif ouvert, uniquement TEMP. Fermer la fenêtre pour terminer.');return;}
  await click('TEST — Toutes les Fleurs');assert(await get('document.querySelector(".aw-record-pane h2").textContent.includes("Fleurs")'),'First selection opens correct pane');
  await click('Notes');await input('Brouillon conservé');await js('document.querySelector(".aw-record-pane-body").scrollTop=80;document.querySelector("#workshop-note").dataset.identity="same-node"');
  assert(await get('document.querySelector(".aw-record-pane-body").scrollTop===80'),'Meaningful scroll established');
  await click('Agrandir');await click('Réduire');assert(await get('document.querySelector("#workshop-note").value==="Brouillon conservé"&&document.querySelector("#workshop-note").dataset.identity==="same-node"&&!document.querySelector("#workshop-note").closest("section").hidden&&document.querySelector(".aw-record-pane-body").scrollTop===80'),'Same editor, tab, scroll and value after expand/reduce');
  const count=dialogs.length;await click('TEST — Studio Dijon');assert(await get('document.querySelector(".aw-record-pane h2").textContent.includes("Fleurs")'),'Stay preserves identity');assert(dialogs.length===count+1&&dialogs.at(-1).defaultId===0,'One existing UX01 confirmation, Stay default');
  await js('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');await sleep(60);assert(await get('!!document.querySelector(".aw-record-pane")'),'Escape refusal preserves pane');
  win.close();await sleep(70);assert(!win.isDestroyed(),'Native close veto retains dirty pane');
  answers.push(1);await click('TEST — Studio Dijon');assert(await get('document.querySelector(".aw-record-pane h2").textContent.includes("Studio")'),'Explicit discard changes only selected record');
  await click('Notes');await input('Pending');await click('Confirmer la note fictive');win.close();await sleep(50);assert(!win.isDestroyed()&&dialogs.at(-1).buttons.join('|')==='Rester','Pending save blocks native close');await wait('!document.querySelector("#workshop-note").disabled');
  win.focus();win.webContents.focus();await wait('document.hasFocus()');await js('document.querySelector(".aw-record-separator").focus()');await sleep(100);
  const before=await get('Number(document.querySelector(".aw-record-separator").getAttribute("aria-valuenow"))');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Left'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Left'});await sleep(80);assert(await get('Number(document.querySelector(".aw-record-separator").getAttribute("aria-valuenow"))')<before,'Native keyboard resize');
  await js('window.dragWrites=[];window.dragSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.dragWrites.push({k,v});return window.dragSetItem.call(this,k,v);};');
  const beforeDrag=await get('document.querySelector(".aw-record-split").style.gridTemplateColumns');
  const rect=await get('(()=>{const r=document.querySelector(".aw-record-separator").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+20}})()');win.webContents.sendInputEvent({type:'mouseDown',x:Math.round(rect.x),y:Math.round(rect.y),button:'left',clickCount:1});
  for(const x of [650,700,750]){win.webContents.sendInputEvent({type:'mouseMove',x,y:Math.round(rect.y)});await sleep(60);}
  assert(await get('window.dragWrites.length===0'),'No preference writes during pointermoves');
  assert(await get('document.querySelector(".aw-record-split").style.gridTemplateColumns')!==beforeDrag,'Visual resize immediate before gesture ends');
  win.webContents.sendInputEvent({type:'mouseUp',x:750,y:Math.round(rect.y),button:'left',clickCount:1});await sleep(100);
  assert(await get('window.dragWrites.length===1'),'Exactly one preference write on gesture end');
  // CSS serializes percentages with fewer decimal places than JSON numbers.
  assert(await get('Math.abs(JSON.parse(window.dragWrites[0].v).listPercent-parseFloat(document.querySelector(".aw-record-split").style.gridTemplateColumns))<0.0001'),'Stored width is the final preview within CSS serialization precision');
  await js('window.dispatchEvent(new PointerEvent("pointerup"));');assert(await get('window.dragWrites.length===1'),'Duplicate end cannot persist twice');
  await js('window.dragWrites=[];document.querySelector(".aw-record-separator").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));window.dispatchEvent(new PointerEvent("pointerup"));');
  assert(await get('window.dragWrites.length===0'),'Gesture without movement does not write');
  const beforeCancel=await get('document.querySelector(".aw-record-split").style.gridTemplateColumns');
  await js('document.querySelector(".aw-record-separator").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));window.dispatchEvent(new PointerEvent("pointermove",{clientX:620}));');await sleep(60);
  await js('window.dispatchEvent(new PointerEvent("pointercancel"));window.dispatchEvent(new PointerEvent("pointerup"));');await sleep(60);
  assert(await get('window.dragWrites.length===0'),'Canceled pointer gesture never writes');
  assert(await get('document.querySelector(".aw-record-split").style.gridTemplateColumns')===beforeCancel,'Canceled gesture restores prior visual width');
  await js('document.querySelector(".aw-record-separator").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));window.dispatchEvent(new PointerEvent("pointermove",{clientX:700}));window.dispatchEvent(new Event("blur"));window.dispatchEvent(new PointerEvent("pointerup"));');await sleep(60);
  assert(await get('window.dragWrites.length===1'),'Blur completes moved gesture once');
  await js('Storage.prototype.setItem=window.dragSetItem');
  const saved=await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")');assert(!!saved&&!saved.includes('Pending'),'Mouse resize writes only visual preference');
  await js('window.fixtureSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error("Fixture quota")};document.querySelector(".aw-record-separator").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));');await sleep(80);
  assert(await get('document.querySelector(".aw-record-layout-tools [role=alert]").textContent.includes("non mémorisée")'),'Preference write refusal visible');assert(await get('document.querySelector("#workshop-note").value==="Pending"'),'Storage refusal preserves note');await js('Storage.prototype.setItem=window.fixtureSetItem');
  await js('document.querySelector(".aw-record-separator").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))');await sleep(70);assert(await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")===null'),'Double click resets own module');
  await js('document.querySelector(".aw-record-separator").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))');await sleep(80);
  const savedAgain=await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")');
  await js('const e=document.querySelector("select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(e,"interventions");e.dispatchEvent(new Event("change",{bubbles:true}));');await sleep(80);await click('Réinitialiser les largeurs');assert(await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")')===savedAgain,'Reset other module is independent');
  await js('const e=document.querySelector("select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(e,"prospection");e.dispatchEvent(new Event("change",{bubbles:true}));');await sleep(80);await click('TEST — Toutes les Fleurs');assert(await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")')===savedAgain,'Module roundtrip restores preference');
  win.webContents.reload();await wait('!!document.querySelector("h1")&&!document.querySelector(".aw-record-pane")');await click('TEST — Toutes les Fleurs');assert(await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")')===savedAgain,'Reload preserves layout without reopening old record');
  const captures=path.join(repo,'outputs','ux-v2-lot01c-reference');fs.mkdirSync(captures,{recursive:true});
  let frame=0;for(const theme of ['atoumweb','noir','blanc'])for(const [density,font]of [['compact',14],['comfort',16],['comfort_plus',18]]){
   await js('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));await sleep(80);
   assert(await get('parseFloat(getComputedStyle(document.body).fontSize)')===font,'Font '+theme+'/'+density);assert(await get('document.querySelector(".aw-record-split").scrollWidth<=document.querySelector(".aw-record-split").clientWidth+1'),'No overflow '+theme+'/'+density);
   const rgb=[40+(++frame)*15,60+frame*10,80+frame*5];await js('let e=document.querySelector("#frame-marker");if(!e){e=document.createElement("div");e.id="frame-marker";document.body.appendChild(e);}e.style.cssText="position:fixed;right:0;bottom:0;width:20px;height:20px;z-index:99999;background:rgb('+rgb.join(',')+')";await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');
   let shot,verified=false;for(let i=0;i<8;i++){await sleep(70);shot=await win.webContents.capturePage();const size=shot.getSize(),bitmap=shot.toBitmap(),offset=((size.height-8)*size.width+size.width-8)*4;if(bitmap[offset]===rgb[2]&&bitmap[offset+1]===rgb[1]&&bitmap[offset+2]===rgb[0]){verified=true;break;}}
   assert(verified,'Capture compositor freshness '+theme+'/'+density);fs.writeFileSync(path.join(captures,theme+'-'+density+'.png'),shot.toPNG());
  }
  for(const zoom of [1,1.25,1.5]){win.setSize(900,700);win.webContents.setZoomFactor(zoom);await sleep(150);assert(await get('document.querySelector(".aw-record-split").classList.contains("is-narrow")'),'Narrow fallback '+zoom);assert(await get('[...document.querySelectorAll(".aw-record-pane-actions button")].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right<=innerWidth;})'),'Essential actions reachable '+zoom);}
  await click('Réinitialiser les largeurs');assert(await get('localStorage.getItem("atoumweb:layout:prospection:records:v1")===null'),'Reset removes own preference only');
  win.setSize(1500,1000);win.webContents.setZoomFactor(1);await wait('!document.querySelector(".aw-record-split").classList.contains("is-narrow")');
  await js('window.moduleWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.moduleWrites.push(k);return original.call(this,k,v);};document.querySelector(".aw-record-separator").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));window.dispatchEvent(new PointerEvent("pointermove",{clientX:650}));');await sleep(60);
  await js('const e=document.querySelector("select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(e,"interventions");e.dispatchEvent(new Event("change",{bubbles:true}));');await sleep(70);
  await js('window.dispatchEvent(new PointerEvent("pointerup"));');
  assert(await get('window.moduleWrites.length===0'),'Changing module disposes drag without stale preference write');
  await js('localStorage.setItem("atoumweb:layout:interventions:records:v1","invalid");window.dispatchEvent(new StorageEvent("storage",{key:"atoumweb:layout:interventions:records:v1"}));');await sleep(70);
  assert(await get('document.querySelector(".aw-record-layout-tools [role=alert]").textContent.includes("non lue")'),'Corrupt preference gives explicit fallback notice');
  await click('TEST — Toutes les Fleurs');await click('Notes');await input('Erreur visuelle sans perte');
  await js('window.oldRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=()=>{throw Error("Reset refused")};');await click('Réinitialiser les largeurs');
  assert(await get('document.querySelector(".aw-record-layout-tools [role=alert]").textContent.includes("Réinitialisation impossible")'),'Reset refusal visible');
  assert(await get('document.querySelector("#workshop-note").value==="Erreur visuelle sans perte"'),'Reset refusal preserves unsaved note');
  await js('Storage.prototype.removeItem=window.oldRemove');await click('Réinitialiser les largeurs');
  assert(await get('!document.querySelector(".aw-record-layout-tools [role=alert]")'),'Successful visual reset clears failure');
  assert(await get('document.querySelector("#workshop-note").value==="Erreur visuelle sans perte"'),'Successful visual reset never discards draft');
  console.log(JSON.stringify({checks,failed:0,captures:9,onlyTemp:true,quitCleaned}));win.destroy();app.exit(0);
 }).catch(e=>{console.error(e.stack);win?.destroy();app.exit(1);});
 app.on('window-all-closed',()=>{if(interactive)app.quit();});
}

/* UX/UI V2 — 01B.2 AppButton/AppTextField presentation pilot.
 * Isolated real React + all 31 CSS files inside Chromium/Electron OS TEMP.
 * No installed Manager, no workspace or SQLite, no service/IPC calls.
 * Run: node scripts/check-ux-v2-lot01b-controls.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01b-controls-',envName='ATOUMWEB_UXV2_01B_CONTROLS_TMP';
const owned=folder=>!!folder&&fs.existsSync(folder)&&path.basename(folder).startsWith(prefix)&&
 fs.realpathSync.native(path.dirname(folder)).toLowerCase()===fs.realpathSync.native(os.tmpdir()).toLowerCase();
const assert=(v,msg)=>{if(!v)throw Error(msg);};
assert(process.argv.length===2,'No arguments: isolated TEMP fixture only');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const entry=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
  const styles=[...entry.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(x=>x[1]);
  assert(styles.length===31,'Unexpected renderer CSS import chain');
  const css=styles.map(s=>fs.readFileSync(path.join(repo,'src/renderer',s),'utf8')).join('\n');
  assert(!css.includes('</style'),'Unsafe inline style fixture');
  fs.writeFileSync(path.join(temp,'index.html'),
   '<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>'+css+
   '</style></head><body><div class="app-shell"><aside class="sidebar">Fixture</aside><main class="main-area"><section class="content-area"><div id="root"></div></section></main></div>'+
   '<script src="fixture.js"></script></body></html>');
  const source=[
   "import React,{useState} from 'react';",
   "import {createRoot} from 'react-dom/client';",
   "import {AppButton} from './src/renderer/ui/AppButton';",
   "import {AppTextField} from './src/renderer/ui/AppTextField';",
   "const data=window.__awControls={calls:0,failCalls:0,errors:0,resolve:null,reject:null};",
   "const pending=()=>{data.calls++;return new Promise((resolve,reject)=>{data.resolve=resolve;data.reject=reject;});};",
   "function Demo(){const [value,setValue]=useState('');return React.createElement('section',{id:'aw-demo'},",
   "React.createElement(AppButton,{id:'save-test',variant:'primary',onAction:pending},'Enregistrer (test)'),",
   "React.createElement(AppButton,{variant:'secondary',disabled:true,onAction:()=>{data.calls++}},'Désactivé'),",
   "React.createElement(AppButton,{id:'open-test',variant:'quiet',icon:'★','aria-label':'Ouvrir le panneau (test)',onAction:()=>{data.calls++}}),",
   "React.createElement(AppButton,{id:'reject-test',variant:'danger',onAction:()=>{data.failCalls++;return Promise.reject(new Error('fixture refused'))},onActionError:()=>{data.errors++}},'Supprimer (test)'),",
   "React.createElement(AppTextField,{id:'sample-name',label:'Nom du contact et informations complémentaires pour identifier précisément son rôle dans ce dossier',description:'Information de démonstration',error:'Saisie requise : vérifie les informations avant de réessayer.',placeholder:'Exemple',value,onChange:e=>setValue(e.target.value)})",
   ");}",
   "createRoot(document.getElementById('root')).render(React.createElement(Demo));"
  ].join('\n');
  require('esbuild').buildSync({stdin:{contents:source,resolveDir:repo,loader:'tsx'},bundle:true,
   format:'iife',platform:'browser',outfile:path.join(temp,'fixture.js'),logLevel:'silent'});
  const env={...process.env,[envName]:temp};delete env.ELECTRON_RUN_AS_NODE;
  const sub=spawnSync(require('electron'),[__filename],{cwd:repo,env,windowsHide:true,
    timeout:100000,encoding:'utf8',maxBuffer:1024*1024});
  process.stdout.write(sub.stdout||'');process.stderr.write(sub.stderr||'');
  if(sub.error)throw sub.error;
  assert(sub.status===0,'Native controls test failed exit='+sub.status);
 }catch(e){console.error('[UXV2 01B CONTROLS] FAILED',e.stack||e);process.exitCode=1;}
 finally{
  assert(owned(temp),'Refuse unsafe fixture cleanup');
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:7,retryDelay:250});
  console.log('[UXV2 01B CONTROLS] Fixture cleaned: '+!fs.existsSync(temp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env[envName];
 assert(owned(temp),'No parent-owned TEMP fixture');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 app.on('window-all-closed',()=>{});
 let windowRef=null,checks=0;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const test=(v,desc)=>{if(!v)throw Error(desc);checks++;};
 const evaluate=code=>windowRef.webContents.executeJavaScript('(async()=>{'+code+'})()');
 const get=expr=>evaluate('return ('+expr+');');
 const wait=async(expr,label)=>{
  for(let i=0;i<100;i++){if(await get(expr))return;await sleep(45);}
  throw Error('Timeout: '+label);
 };
 app.whenReady().then(async()=>{
  windowRef=new BrowserWindow({show:false,width:1240,height:850,
   webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});
  await windowRef.loadFile(path.join(temp,'index.html'));
  await wait('!!document.querySelector("#aw-demo")','React demo');
  test((await get('document.querySelectorAll(".aw-ui-button").length'))===4,'Four control variants');
  test((await get('document.querySelectorAll(".aw-ui-field-input").length'))===1,'Native labeled field');
  test((await get('document.querySelector(".aw-ui-button--quiet").getAttribute("aria-label")'))==='Ouvrir le panneau (test)','Icon-only accessible name');
  test(await get('document.querySelector(".aw-ui-button--secondary").disabled'),'Disabled control');
  test(await get('document.querySelector("label[for=sample-name]")!==null'),'Explicit label/id association');
  test(await get('document.querySelector("#sample-name").getAttribute("aria-invalid")==="true"'),'Field semantic invalid state');
  test(await get('document.querySelector("#sample-name").getAttribute("aria-describedby").includes("sample-name-hint")&&document.querySelector("#sample-name").getAttribute("aria-describedby").includes("sample-name-error")'),'Help and error linked');
  test(await get('document.querySelector(".aw-ui-field-error").getAttribute("role")==="alert"'),'Accessible error');
  for(const theme of ['atoumweb','noir','blanc']){
   for(const [density,px,height] of [['compact',14,36],['comfort',16,42],['comfort_plus',18,48]]){
    await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme)+';'+
      'document.documentElement.dataset.density='+JSON.stringify(density)+';');
    const values=await get('({body:parseFloat(getComputedStyle(document.body).fontSize),btn:parseFloat(getComputedStyle(document.querySelector(".aw-ui-button--primary")).minHeight),input:parseFloat(getComputedStyle(document.querySelector(".aw-ui-field-input")).minHeight),font:parseFloat(getComputedStyle(document.querySelector(".aw-ui-button--primary")).fontSize)})');
    test(values.body===px&&values.font>=14,'Readable font '+theme+'/'+density);
    test(values.btn>=height&&values.input>=height,'Control sizing '+theme+'/'+density);
    console.log('[UXV2 01B CONTROLS] PASS '+theme+'/'+density+' '+JSON.stringify(values));
   }
  }
  // Two immediate calls on the same genuine React button must produce ONE action.
  await evaluate('const e=document.querySelector(".aw-ui-button--primary");e.click();e.click();');
  await wait('document.querySelector(".aw-ui-button--primary").disabled','Async pending');
  test((await get('window.__awControls.calls'))===1,'Double click guarded for pending Promise');
  test((await get('document.querySelector(".aw-ui-button--primary").getAttribute("aria-busy")==="true"')),'Aria busy while pending');
  await evaluate('window.__awControls.resolve()');
  await wait('!document.querySelector(".aw-ui-button--primary").disabled','Promise completion');
  test((await get('window.__awControls.calls'))===1,'No implicit duplicated action');
  // Promise rejection must not be reported as a success.
  await evaluate('const e=document.querySelector("#sample-name");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"Saisie à conserver");e.dispatchEvent(new Event("input",{bubbles:true}));');
  await evaluate('document.querySelector(".aw-ui-button--danger").click()');
  await wait('!!document.querySelector(".aw-ui-control-error")','Visible rejected result');
  test((await get('window.__awControls.errors'))===1,'Error callback propagated');
  test((await get('document.querySelector(".aw-ui-control-error").getAttribute("role")'))==='alert','Error announced');
  test((await get('window.__awControls.failCalls'))===1,'Rejected action ran exactly once');
  test(await get('document.querySelector("#sample-name").value==="Saisie à conserver"'),'Rejected action preserves controlled input');
  windowRef.show();windowRef.focus();windowRef.webContents.focus();
  await wait('document.hasFocus()','Native keyboard focus');
  await evaluate('document.querySelector("#save-test").focus()');
  for(const id of ['open-test','reject-test','sample-name']){
   windowRef.webContents.sendInputEvent({type:'keyDown',keyCode:'Tab'});
   windowRef.webContents.sendInputEvent({type:'keyUp',keyCode:'Tab'});
   await wait('document.activeElement?.id==='+JSON.stringify(id),'Native Tab order '+id);
   test(true,'Tab order skips disabled control and reaches '+id);
  }
  await evaluate('document.querySelector("#open-test").focus()');
  windowRef.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});
  windowRef.webContents.sendInputEvent({type:'char',keyCode:' '});
  windowRef.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});
  await wait('window.__awControls.calls===2','Space activates AppButton');
  test(true,'Native Space activates exactly once');
  windowRef.setSize(880,700);
  for(const zoom of [1,1.25,1.5]){
   windowRef.webContents.setZoomFactor(zoom);await sleep(100);
   const usable=await get('[...document.querySelectorAll("#aw-demo button,#sample-name,.aw-ui-field-label,.aw-ui-field-error")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.width>0;})');
   test(usable,'Long label, error, field and essential commands fit narrow viewport at zoom '+zoom);
  }
  console.log('[UXV2 01B CONTROLS] RESULT '+JSON.stringify({checks,failed:0,combinations:9,buttonVariants:4,
    asyncDedup:true,rejectionVisible:true,labelsAndErrors:true,onlyTemp:true}));
 }).catch(e=>{console.error('[UXV2 01B CONTROLS] ERROR',e.stack||e);process.exitCode=1;})
 .finally(()=>{try{windowRef?.destroy()}catch{}app.exit(process.exitCode||0)});
}

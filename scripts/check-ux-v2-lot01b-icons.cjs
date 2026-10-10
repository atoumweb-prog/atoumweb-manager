/* UX V2 / 01B.3 — reuse existing 36 SVG OperationIcon names.
 * Verify decoration vs actionable accessible name in React/Electron, with real
 * 31 renderer CSS in an independent OS TEMP profile; no user workspace.
 * node scripts/check-ux-v2-lot01b-icons.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01b-icons-',envKey='ATOUMWEB_UXV2_01B_ICONS_TEMP';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const owns=p=>!!p&&fs.existsSync(p)&&path.basename(p).startsWith(prefix)&&
 fs.realpathSync.native(path.dirname(p)).toLowerCase()===fs.realpathSync.native(os.tmpdir()).toLowerCase();
assert(process.argv.length===2,'No options; isolated OS TEMP only');
if(!process.versions.electron){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const main=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
  const sheets=[...main.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(x=>x[1]);
  assert(sheets.length===31,'Renderer CSS chain changed');
  const sheet=sheets.map(x=>fs.readFileSync(path.join(repo,'src/renderer',x),'utf8')).join('\n');
  assert(!sheet.includes('</style'),'Cannot safely embed stylesheet');
  fs.writeFileSync(path.join(tmp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+sheet+
   '</style></head><body><div class="app-shell"><main class="content-area"><div id="root"></div></main></div>'+
   '<script src="gallery.js"></script></body></html>');
  const source=fs.readFileSync(path.join(repo,'src/renderer/operations/OperationIcon.tsx'),'utf8');
  const declaration=source.match(/export type OperationIconName =([\s\S]*?);/);
  assert(!!declaration,'Icon union not found');
  const names=[...declaration[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
  assert(names.length===36&&new Set(names).size===36,'OperationIcon enum changed, review catalogue');
  const fixture=[
   "import React from 'react';",
   "import {createRoot} from 'react-dom/client';",
   "import {OperationIcon} from './src/renderer/operations/OperationIcon';",
   "import {AppButton} from './src/renderer/ui/AppButton';",
   "const names="+JSON.stringify(names)+";",
   "const data=window.__iconTest={calls:0,labels:[]};",
   "function Gallery(){return React.createElement('section',{id:'icon-gallery'},",
   "React.createElement('div',{className:'icon-grid'},...names.map(n=>React.createElement('div',{className:'icon-sample','data-icon':n,key:n},React.createElement(OperationIcon,{name:n,size:20}),React.createElement('span',null,n)))),",
   "React.createElement(AppButton,{id:'icon-action',variant:'quiet','aria-label':'Agrandir la fiche',icon:React.createElement(OperationIcon,{name:'expand',size:20}),onAction:()=>{data.calls++;data.labels.push('expand')} }),",
   "React.createElement(AppButton,{id:'icon-label',variant:'secondary',icon:React.createElement(OperationIcon,{name:'refresh',size:20}),onAction:()=>{data.calls++;data.labels.push('refresh')} },'Actualiser la vue')",
   ");}",
   "createRoot(document.getElementById('root')).render(React.createElement(Gallery));"
  ].join('\n');
  require('esbuild').buildSync({stdin:{contents:fixture,resolveDir:repo,loader:'tsx'},bundle:true,
    format:'iife',platform:'browser',outfile:path.join(tmp,'gallery.js'),logLevel:'silent'});
  const env={...process.env,[envKey]:tmp};delete env.ELECTRON_RUN_AS_NODE;
  const result=spawnSync(require('electron'),[__filename],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:90000,maxBuffer:1024*1024});
  process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
  if(result.error)throw result.error;
  assert(result.status===0,'Electron icon gallery recipe failed status '+result.status);
 }catch(e){console.error('[UXV2 01B ICONS] FAILED',e.stack||e);process.exitCode=1;}
 finally{
  assert(owns(tmp),'Refusing unsafe fixture cleanup');
  fs.rmSync(tmp,{recursive:true,force:true,maxRetries:8,retryDelay:250});
  console.log('[UXV2 01B ICONS] Fixture cleaned: '+!fs.existsSync(tmp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),tmp=process.env[envKey];
 assert(owns(tmp),'Electron cannot run outside parent-owned TEMP fixture');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(tmp,'profile'));app.on('window-all-closed',()=>{});
 let win=null,checks=0;
 const waitMs=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(passed,reason)=>{if(!passed)throw Error(reason);checks++};
 const exec=js=>win.webContents.executeJavaScript('(async()=>{'+js+'})()');
 const get=js=>exec('return '+js+';');
 const wait=async(expr,description)=>{
  for(let i=0;i<100;i++){if(await get(expr))return;await waitMs(35);}
  throw Error('Timeout '+description);
 };
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:false,width:1240,height:840,
    webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});
  await win.loadFile(path.join(tmp,'index.html'));
  await wait('document.querySelectorAll(".icon-sample").length===36','React icon gallery');
  check((await get('document.querySelectorAll(".icon-sample").length'))===36,'Complete 36 SVG pilot');
  check(await get('document.querySelectorAll(".icon-sample svg").length===36'),'Every icon paints SVG');
  check(await get('[...document.querySelectorAll(".icon-sample svg")].every(svg=>svg.getAttribute("aria-hidden")==="true"&&svg.getAttribute("focusable")==="false")'),'Decorative SVG inaccessible to focus readers');
  check(await get('document.querySelector("#icon-action").getAttribute("aria-label")==="Agrandir la fiche"'),'Icon only button has action label');
  check(await get('document.querySelector("#icon-label").textContent.includes("Actualiser la vue")'),'Labeled command text visible');
  check(await get('[...document.querySelectorAll(".aw-ui-button-icon svg")].every(x=>x.getAttribute("aria-hidden")==="true")'),'Action icons remain decorative inside labeled buttons');
  for(const theme of ['atoumweb','noir','blanc']){
   for(const [density,base,control] of [['compact',14,36],['comfort',16,42],['comfort_plus',18,48]]){
    await exec('document.documentElement.dataset.theme='+JSON.stringify(theme)+';'+
      'document.documentElement.dataset.density='+JSON.stringify(density));
    const sizes=await get('({body:parseFloat(getComputedStyle(document.body).fontSize),'+
      'icons:[...document.querySelectorAll(".icon-sample svg")].map(e=>[e.getBoundingClientRect().width,e.getBoundingClientRect().height]),'+
      'button:parseFloat(getComputedStyle(document.querySelector("#icon-action")).minHeight)})');
    check(sizes.body===base,'Theme/density body '+theme+'/'+density);
    check(sizes.button>=control,'Icon button control size '+theme+'/'+density);
    check(sizes.icons.every(([w,h])=>w===20&&h===20),'All SVG retain 20×20 viewBox scale '+theme+'/'+density);
    console.log('[UXV2 01B ICONS] PASS '+theme+'/'+density+' 36 decorative icons, action labels');
   }
  }
  // Real Chromium keyboard Enter must reach a focused window AND focused button.
  // In the first Windows run the hidden window was focused *after* the DOM button;
  // native key dispatch then timed out. This timing is the leading hypothesis.
  // Do not replace this
  // assertion with element.click() or a fabricated DOM KeyboardEvent.
  win.show();
  win.focus();
  win.webContents.focus();
  await wait('document.hasFocus()','native Electron window focus');
  await exec('window.__iconTest.nativeKeys=[];'+
    'document.addEventListener("keydown",e=>window.__iconTest.nativeKeys.push(e.key),true);'+
    'document.querySelector("#icon-action").focus()');
  const before=await get('({focused:document.hasFocus(),active:document.activeElement?.id,'+
    'keys:window.__iconTest.nativeKeys.length})');
  console.log('[UXV2 01B ICONS] Native keyboard focus '+JSON.stringify(before));
  check(before.focused===true&&before.active==='icon-action',
    'Native Electron window and the real action button must both have focus');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});
  win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  try {
    await wait('window.__iconTest.calls===1','Keyboard Enter action');
  } catch(error) {
    const after=await get('({focused:document.hasFocus(),active:document.activeElement?.id,'+
      'nativeKeys:window.__iconTest.nativeKeys,calls:window.__iconTest.calls,'+
      'labels:window.__iconTest.labels})');
    console.error('[UXV2 01B ICONS] Native keyboard failure probe '+JSON.stringify(after));
    throw error;
  }
  check(await get('window.__iconTest.nativeKeys.includes("Enter")'),
    'Native Chromium keydown reached the renderer');
  check(await get('window.__iconTest.labels[0]==="expand"'),'Enter action correct');
  check(await get('document.activeElement?.id==="icon-action"'),'Focus remains on explicit command');
  // Programmatic click on labeled example checks same event contract.
  await exec('document.querySelector("#icon-label").click()');
  await wait('window.__iconTest.calls===2','Labeled icon button activation');
  check(await get('window.__iconTest.labels[1]==="refresh"'),'Label + icon invokes one handler');
  console.log('[UXV2 01B ICONS] RESULT '+JSON.stringify({checks,failed:0,icons:36,
    combinations:9,iconSize:20,decorativeSvg:true,accessibleAction:true,keyboardEnter:true,onlyTemp:true}));
 }).catch(e=>{console.error('[UXV2 01B ICONS] ERROR',e.stack||e);process.exitCode=1;})
 .finally(()=>{try{win?.destroy()}catch{}app.exit(process.exitCode||0)});
}

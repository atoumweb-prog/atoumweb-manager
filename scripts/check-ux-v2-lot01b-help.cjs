/* UX V2 / 01B E05 — actual FieldHelp in isolated Electron/React with real CSS.
 * Never launches the installed Manager or opens any SQLite workspace.
 * node scripts/check-ux-v2-lot01b-help.cjs
 */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01b-help-',envName='ATOUMWEB_UXV2_01B_HELP_TEMP';
const isOwned=p=>p&&fs.existsSync(p)&&path.basename(p).startsWith(prefix)&&
 fs.realpathSync.native(path.dirname(p)).toLowerCase()===fs.realpathSync.native(os.tmpdir()).toLowerCase();
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
assert(process.argv.length===2,'Fixture does not accept runtime paths');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 const env={...process.env,[envName]:temp};delete env.ELECTRON_RUN_AS_NODE;
 try{
  const cssEntry=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
  const cssNames=[...cssEntry.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>m[1]);
  assert(cssNames.length===31,'CSS import chain changed; update inspection first');
  const css=cssNames.map(name=>fs.readFileSync(path.join(repo,'src/renderer',name),'utf8')).join('\n');
  assert(!css.includes('</style'),'Unsafe style fixture contents');
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+
   css+'</style></head><body><div class="app-shell"><main class="content-area"><article class="panel" style="padding:32px"><div id="root"></div></article></main></div><script src="fixture.js"></script></body></html>');
  const source=[
   "import React from 'react';",
   "import { createRoot } from 'react-dom/client';",
   "import { FieldHelp } from './src/renderer/ui/FieldHelp';",
   "createRoot(document.getElementById('root')).render(",
   "  React.createElement('label', { htmlFor: 'name-field' },",
   "    'Nom commercial',",
   "    React.createElement(FieldHelp, { text: 'Aide courte', detail: 'Détail complet et accessible.' }),",
   "    React.createElement('input', { id: 'name-field', type: 'checkbox' })",
   "  )",
   ");"
  ].join('\n');
  require('esbuild').buildSync({stdin:{contents:source,resolveDir:repo,loader:'tsx'},bundle:true,
    platform:'browser',format:'iife',outfile:path.join(temp,'fixture.js'),logLevel:'silent'});
  const sub={...env};
  const run=spawnSync(require('electron'),[__filename],{cwd:repo,env:sub,windowsHide:true,encoding:'utf8',timeout:110000,maxBuffer:2*1024*1024});
  process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
  if(run.error)throw run.error;
  assert(run.status===0,'FieldHelp Electron recipe failed: '+run.status);
 }catch(e){console.error('[UXV2 01B] FAIL',e.stack||e);process.exitCode=1;}
 finally{
  assert(isOwned(temp),'Refusing to delete non-TEMP fixture');
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:7,retryDelay:250});
  console.log('[UXV2 01B] Fixture cleaned: '+!fs.existsSync(temp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env[envName];
 assert(isOwned(temp),'Only independently created TEMP profile is allowed');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 app.on('window-all-closed',()=>{});
 let checks=0,win=null;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(ok,reason)=>{if(!ok)throw Error(reason);checks++};
 const evaluate=code=>win.webContents.executeJavaScript('(async()=>{'+code+'})()');
 const get=expr=>evaluate('return ('+expr+')');
 const wait=async(code,label)=>{
   for(let i=0;i<80;i++){if(await get(code))return;await sleep(50);}
   throw Error('Timeout '+label);
 };
 const activate=async()=>{
   await evaluate('document.querySelector(".field-help").click()');
   await wait('!!document.querySelector(".field-help-detail")','click opens explicit detail');
 };
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:false,width:1240,height:850,webPreferences:{
   contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false
  }});
  await win.loadFile(path.join(temp,'index.html'));
  await wait('!!document.querySelector(".field-help")','React FieldHelp mount');
  for(const theme of ['atoumweb','noir','blanc']){
   for(const [density,font] of [['compact',14],['comfort',16],['comfort_plus',18]]){
    await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme)+
      ';document.documentElement.dataset.density='+JSON.stringify(density));
    const size=await get('parseFloat(getComputedStyle(document.body).fontSize)');
    const icon=await get('getComputedStyle(document.querySelector(".field-help")).display');
    const label=await get('document.querySelector(".field-help").getAttribute("aria-label")');
    check(size===font,'density '+theme+'/'+density);
    check(icon!=='none','icon visible '+theme+'/'+density);
    check(label.includes('Aide courte'),'accessible name '+theme+'/'+density);
    console.log('[UXV2 01B] PASS '+theme+'/'+density+' icon visible, body '+size+'px');
   }
  }
  await evaluate('document.querySelector(".app-shell").classList.add("help-disabled")');
  check(await get('getComputedStyle(document.querySelector(".field-help")).display')!=='none',
    'disabled automatic help keeps icon visible');
  await activate();
  check(await get('document.querySelector(".field-help-detail").getAttribute("role")==="dialog"'),
    'detail has dialog semantics');
  check(await get('document.querySelector(".field-help").getAttribute("aria-expanded")==="true"'),
    'expanded state announced');
  check(await get('document.querySelector(".field-help-detail").textContent.includes("Détail complet")'),
    'actual detailed copy shown');
  check(!(await get('document.querySelector("#name-field").checked')),
    'help click does not change associated checkbox');
  win.webContents.focus();
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
  win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
  await wait('!document.querySelector(".field-help-detail")','Escape closes explicit detail');
  check(await get('document.activeElement?.classList.contains("field-help")'),
    'Escape returns keyboard focus to help button');
  await evaluate('document.querySelector(".field-help").click()');
  await wait('!!document.querySelector(".field-help-detail")','reopen');
  await evaluate('document.querySelector(".field-help-detail-close").click()');
  await wait('!document.querySelector(".field-help-detail")','close button');
  check(!(await get('document.querySelector("#name-field").checked')),
    'close inside label does not change checkbox');
  await evaluate('document.querySelector(".field-help-anchor").dispatchEvent(new MouseEvent("mouseover",{bubbles:true}))');
  await sleep(2750);
  check(!(await get('!!document.querySelector(".field-help-detail")')),
    'disabled hover cannot open detailed help');
  await evaluate('document.querySelector(".field-help-anchor").dispatchEvent(new MouseEvent("mouseout",{bubbles:true,relatedTarget:document.body}))');
  await evaluate('document.querySelector(".app-shell").classList.remove("help-disabled")');
  await evaluate('document.querySelector(".field-help-anchor").dispatchEvent(new MouseEvent("mouseover",{bubbles:true}))');
  await sleep(120);
  check(!(await get('!!document.querySelector(".field-help-detail")')),
    'short hover has no detailed panel');
  await wait('!!document.querySelector(".field-help-detail")','enabled long hover reveals details');
  check(await get('document.querySelector(".field-help-detail").dataset.openSource==="hover"'),
    'long hover detail correctly marked as automatic');
  await evaluate('document.querySelector(".field-help-anchor").dispatchEvent(new MouseEvent("mouseout",{bubbles:true,relatedTarget:document.body}))');
  await wait('!document.querySelector(".field-help-detail")','automatic detail removed on exit');
  console.log('[UXV2 01B] RESULT '+JSON.stringify({checks,failed:0,themeDensityCombinations:9,
   explicitHelp:true,hoverDisabled:true,delayedHover:true,escapeAndFocus:true,onlyTemp:true}));
 }).catch(e=>{console.error('[UXV2 01B] ERROR',e.stack||e);process.exitCode=1;})
 .finally(()=>{try{win?.destroy();}catch{}app.exit(process.exitCode||0)});
}

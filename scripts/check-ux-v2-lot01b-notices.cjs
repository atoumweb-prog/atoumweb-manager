/* UX V2/01B.5: presentational AppNotice in genuine Electron/React.
 * All 31 renderer CSS, OS TEMP only; no SQLite, production workspace or IPC.
 * node scripts/check-ux-v2-lot01b-notices.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01b-notices-',envKey='ATOUMWEB_UXV2_NOTICES_TMP';
const assert=(v,m)=>{if(!v)throw Error(m)};
const owned=p=>p&&fs.existsSync(p)&&path.basename(p).startsWith(prefix)&&
 fs.realpathSync.native(path.dirname(p)).toLowerCase()===fs.realpathSync.native(os.tmpdir()).toLowerCase();
assert(process.argv.length===2,'OS TEMP fixture takes no file paths');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const main=fs.readFileSync(path.join(root,'src/renderer/main.tsx'),'utf8');
  const styles=[...main.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>m[1]);
  assert(styles.length===31,'CSS import chain changed');
  const css=styles.map(x=>fs.readFileSync(path.join(root,'src/renderer',x),'utf8')).join('\n');
  assert(!css.includes('</style'),'Unsafe fixture CSS');
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+
   css+'</style></head><body><div class="app-shell"><main class="content-area"><div id="root"></div></main></div>'+
   '<script src="demo.js"></script></body></html>');
  const source=[
   "import React from 'react';",
   "import {createRoot} from 'react-dom/client';",
   "import {AppNotice} from './src/renderer/ui/AppNotice';",
   "const state=window.__awNotice={opened:0,closed:0};",
   "function Demo(){return React.createElement('section',{id:'notice-demo'},",
   "React.createElement('div',{id:'info'},React.createElement(AppNotice,{level:'info'},'Information sans action')),",
   "React.createElement('div',{id:'success'},React.createElement(AppNotice,{level:'success',action:{label:'Ouvrir dans l’Explorateur',onClick:()=>{state.opened++}}},'Sauvegarde confirmée (fixture)')),",
   "React.createElement('div',{id:'warning'},React.createElement(AppNotice,{level:'warning',onClose:()=>{state.closed++}},'Attention (fixture)')),",
   "React.createElement('div',{id:'error'},React.createElement(AppNotice,{level:'error'},'Service refusé (fixture)')));}",
   "createRoot(document.getElementById('root')).render(React.createElement(Demo));"
  ].join('\n');
  require('esbuild').buildSync({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,
   platform:'browser',format:'iife',outfile:path.join(temp,'demo.js'),logLevel:'silent'});
  const env={...process.env,[envKey]:temp};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawnSync(require('electron'),[__filename],{cwd:root,env,windowsHide:true,timeout:90000,encoding:'utf8',maxBuffer:1024*1024});
  process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
  if(child.error)throw child.error;
  assert(child.status===0,'Native notice fixture failed status '+child.status);
 }catch(e){console.error('[UXV2 01B NOTICES] FAILED',e.stack||e);process.exitCode=1;}
 finally{
  assert(owned(temp),'Unsafe TEMP cleanup blocked');
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:7,retryDelay:250});
  console.log('[UXV2 01B NOTICES] Fixture cleaned: '+!fs.existsSync(temp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env[envKey];
 assert(owned(temp),'Only parent-owned TEMP fixture is permitted');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));app.on('window-all-closed',()=>{});
 let win=null,checks=0;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(value,message)=>{if(!value)throw Error(message);checks++};
 const evaluate=s=>win.webContents.executeJavaScript('(async()=>{'+s+'})()');
 const get=s=>evaluate('return '+s+';');
 const wait=async(s,label)=>{for(let i=0;i<90;i++){if(await get(s))return;await sleep(40);}throw Error('Timeout '+label);};
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:false,width:1100,height:760,
   webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});
  await win.loadFile(path.join(temp,'index.html'));
  await wait('document.querySelectorAll(".aw-ui-notice").length===4','four semantic notices');
  check((await get('document.querySelectorAll(".aw-ui-notice").length'))===4,'Four explicit levels');
  check(await get('document.querySelector("#error .aw-ui-notice").getAttribute("role")==="alert"'),'Error uses alert');
  check(await get('document.querySelector("#error .aw-ui-notice").getAttribute("aria-live")==="assertive"'),'Error announced assertively');
  check(await get('[...document.querySelectorAll("#info .aw-ui-notice,#success .aw-ui-notice,#warning .aw-ui-notice")].every(n=>n.getAttribute("role")==="status"&&n.getAttribute("aria-live")==="polite")'),'Non-errors are polite');
  check(await get('document.querySelector("#success .aw-ui-notice-action").textContent.includes("Explorateur")'),'Existing optional Explorateur action contract');
  check(await get('!document.querySelector("#error .aw-ui-notice-action")'),'Errors never infer action');
  check(await get('window.__awNotice.opened===0&&window.__awNotice.closed===0'),'Rendering causes zero actions');
  for(const theme of ['atoumweb','noir','blanc']){
   for(const [density,base] of [['compact',14],['comfort',16],['comfort_plus',18]]){
    await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme)+
      ';document.documentElement.dataset.density='+JSON.stringify(density));
    const layout=await get('({body:parseFloat(getComputedStyle(document.body).fontSize),'+
     'notices:[...document.querySelectorAll(".aw-ui-notice")].map(x=>({font:parseFloat(getComputedStyle(x).fontSize),color:getComputedStyle(x).color,display:getComputedStyle(x).display}))})');
    check(layout.body===base,'Correct theme/density '+theme+'/'+density);
    check(layout.notices.every(x=>x.font>=14&&x.color!=='rgba(0, 0, 0, 0)'&&x.display==='flex'),'Four visible notices '+theme+'/'+density);
    console.log('[UXV2 01B NOTICES] PASS '+theme+'/'+density);
   }
  }
  await evaluate('document.querySelector("#success .aw-ui-notice-action").click()');
  check(await get('window.__awNotice.opened===1'),'Explicit Explorateur action exactly once');
  check(await get('window.__awNotice.closed===0'),'Action does not silently dismiss');
  await evaluate('document.querySelector("#warning .aw-ui-notice-close").click()');
  check(await get('window.__awNotice.closed===1'),'Closing warning callback exactly once');
  check(await get('window.__awNotice.opened===1'),'Closing warning causes no business action');
  check(await get('document.querySelector("#warning .aw-ui-notice-close").getAttribute("aria-label")==="Fermer la notification"'),'Close has accessible name');
  console.log('[UXV2 01B NOTICES] RESULT '+JSON.stringify({checks,failed:0,notices:4,combinations:9,
    roles:true,actionOnlyByClick:true,dismissalIndependent:true,onlyTemp:true}));
 }).catch(e=>{console.error('[UXV2 01B NOTICES] ERROR',e.stack||e);process.exitCode=1;})
 .finally(()=>{try{win?.destroy()}catch{}app.exit(process.exitCode||0)});
}

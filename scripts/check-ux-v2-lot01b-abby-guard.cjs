/* UX V2 / R01B-10 — guard Abby copy against unsaved and pending quote drafts.
 * Genuine QuoteAbbyPanel + UnsavedGroup/useUnsavedDraft in isolated React/Electron.
 * Fake copyText() only; no workspace, customer data, IPC or external Abby access.
 * Run: node scripts/check-ux-v2-lot01b-abby-guard.cjs
 */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01b-abby-',envKey='ATOUMWEB_UXV2_01B_ABBY_TEMP';
const assert=(v,m)=>{if(!v)throw Error(m)};
const normalized=x=>process.platform==='win32'?x.toLowerCase():x;
const owned=p=>!!p&&fs.existsSync(p)&&path.basename(p).startsWith(prefix)&&normalized(fs.realpathSync.native(path.dirname(p)))===normalized(fs.realpathSync.native(os.tmpdir()));
assert(process.argv.length===2,'Isolated Abby fixture accepts no file arguments');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const main=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
  const cssFiles=[...main.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>m[1]);
  assert(cssFiles.length===31,'CSS import chain changed; update the test');
  const styles=cssFiles.map(file=>fs.readFileSync(path.join(repo,'src/renderer',file),'utf8')).join('\n');
  assert(!styles.includes('</style'),'Unsafe style fixture content');
  const layout='html,body{overflow:auto!important;min-height:100%!important}.app-shell{display:block!important;height:auto!important}.content-area{overflow:auto!important}';
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+styles+layout+'</style></head><body><div class="app-shell"><main class="content-area"><div id="root"></div></main></div><script src="fixture.js"></script></body></html>');
  const src=[
   "import React,{useState} from 'react';",
   "import {createRoot} from 'react-dom/client';",
   "import {QuoteAbbyPanel} from './src/renderer/commercial/QuoteAbbyPanel';",
   "import {UnsavedGroup,useUnsavedDraft,unsavedRegistry} from './src/renderer/unsaved/unsaved';",
   "const test=window.__abbyTest={copies:[],attempts:0,reject:false,messages:[],setDraft:null,registry:unsavedRegistry};",
   "window.atoumweb={contractTerms:{copyText:async(text)=>{test.attempts++;if(test.reject)throw Error('Fixture copy failed');test.copies.push(text);}}};",
   "const quote={id:'quote-demo',number:'DEV-FICTIF-001',subject:'Devis de démonstration',lines:[],contractValueCents:12000,estimatedDelay:null};",
   "function DraftProbe(){const [value,setValue]=useState('');test.setDraft=setValue;",
   "useUnsavedDraft('Modification du devis fictif',{value},{pending:false});",
   "return React.createElement('span',{id:'draft-value'},value);}",
   "function Demo(){return React.createElement(UnsavedGroup,{name:'quote:quote-demo'},",
   "React.createElement(QuoteAbbyPanel,{quote,onMessage:m=>test.messages.push(m)}),",
   "React.createElement(UnsavedGroup,{name:'quote:quote-demo/line:one/editor'},React.createElement(DraftProbe)));}",
   "createRoot(document.getElementById('root')).render(React.createElement(Demo));"
  ].join('\n');
  require('esbuild').buildSync({stdin:{contents:src,resolveDir:repo,loader:'tsx'},bundle:true,format:'iife',
   platform:'browser',outfile:path.join(temp,'fixture.js'),logLevel:'silent'});
  const env={...process.env,[envKey]:temp};delete env.ELECTRON_RUN_AS_NODE;
  const result=spawnSync(require('electron'),[__filename],{cwd:repo,env,windowsHide:true,
   encoding:'utf8',timeout:100000,maxBuffer:1024*1024});
  process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
  if(result.error)throw result.error;
  assert(result.status===0,'Electron Abby fixture failed status '+result.status);
 }catch(e){console.error('[UXV2 01B ABBY] FAILED',e.stack||e);process.exitCode=1;}
 finally{
  assert(owned(temp),'Refusing unsafe fixture cleanup');
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:7,retryDelay:250});
  console.log('[UXV2 01B ABBY] Fixture cleaned: '+!fs.existsSync(temp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env[envKey];
 assert(owned(temp),'Native Abby test must use owned TEMP fixture');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));app.on('window-all-closed',()=>{});
 let win=null,checks=0;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const verify=(ok,msg)=>{if(!ok)throw Error(msg);checks++};
 const evaluate=code=>win.webContents.executeJavaScript('(async()=>{'+code+'})()');
 const get=expr=>evaluate('return ('+expr+');');
 const wait=async(expr,label)=>{for(let i=0;i<100;i++){if(await get(expr))return;await sleep(40);}throw Error('Timeout '+label);};
 const button='.quote-abby-panel > button';
 const entry=(id,group,dirty,pending)=>'window.__abbyTest.registry.update({'+
   'id:'+JSON.stringify(id)+',group:'+JSON.stringify(group)+','+
   'label:"Brouillon fictif",dirty:'+dirty+',pending:'+pending+',discard:()=>{}})';
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:false,width:1200,height:820,
   webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});
  await win.loadFile(path.join(temp,'index.html'));
  await wait('!!document.querySelector('+JSON.stringify(button)+')','QuoteAbbyPanel mount');
  verify((await get('document.querySelector('+JSON.stringify(button)+').disabled'))===false,'Initially no dirty draft');
  verify(await get('document.querySelector(".quote-abby-panel textarea").value.includes("DEV-FICTIF-001")'),'Commercial text uses mock quote');
  await evaluate('document.querySelector('+JSON.stringify(button)+').click()');
  await wait('window.__abbyTest.attempts===1','First authorized copy');
  verify(await get('window.__abbyTest.copies.length===1'),'Saved quote copy succeeds');
  verify(await get('window.__abbyTest.messages.at(-1).includes("copié pour Abby")'),'Success message only after real fake IPC resolves');

  // Real React draft editor under nested quote group: a dirty value must disable
  // the *existing* quote copy button and show its reason.
  await evaluate('window.__abbyTest.setDraft("Prix non enregistré")');
  await wait('document.querySelector('+JSON.stringify(button)+').disabled','Dirty nested quote draft blocks copy');
  verify(await get('document.querySelector(".quote-abby-panel [role=status]").textContent.includes("modifications en cours")'),'Visible blocking explanation');
  verify(await get('document.querySelector('+JSON.stringify(button)+').getAttribute("aria-describedby")!==null'),'Disabled control references explanation');
  await evaluate('document.querySelector('+JSON.stringify(button)+').click()');
  verify(await get('window.__abbyTest.attempts===1'),'Disabled action cannot copy dirty quote');

  // Reverted/saved draft becomes clean and re-enables.
  await evaluate('window.__abbyTest.setDraft("")');
  await wait('!document.querySelector('+JSON.stringify(button)+').disabled','Clean quote unlocks copy');
  verify(await get('!document.querySelector(".quote-abby-panel [role=status]")'),'Block message removed when clean');

  // Another quote being edited must never freeze the current quote.
  await evaluate(entry('other','quote:another/line:one',true,false));
  verify(await get('!document.querySelector('+JSON.stringify(button)+').disabled'),'Unrelated dirty quote never blocked');
  await evaluate('document.querySelector('+JSON.stringify(button)+').click()');
  await wait('window.__abbyTest.attempts===2','Other quote does not prevent copied quote');
  verify(await get('window.__abbyTest.copies.length===2'),'Second valid copy recorded');
  await evaluate('window.__abbyTest.registry.remove("other")');

  // A pending save, even with dirty=false, must block the copy.
  await evaluate(entry('pending','quote:quote-demo/line:two',false,true));
  await wait('document.querySelector('+JSON.stringify(button)+').disabled','Pending save blocks clipboard');
  verify(await get('window.__abbyTest.attempts===2'),'No copy sent during pending save');
  await evaluate('window.__abbyTest.registry.remove("pending")');
  await wait('!document.querySelector('+JSON.stringify(button)+').disabled','Save completion unlocks');

  // Action-boundary race: same JS tick creates a dirty draft then clicks the
  // still visually enabled button. It MUST recheck the registry synchronously.
  await evaluate(entry('race','quote:quote-demo/line:three',true,false)+';'+
    'document.querySelector('+JSON.stringify(button)+').click()');
  verify(await get('window.__abbyTest.attempts===2'),'Action-time check closes React render race');
  verify(await get('window.__abbyTest.messages.at(-1).includes("Enregistre ou annule")'),'Blocked race explains refusal');
  await evaluate('window.__abbyTest.registry.remove("race")');
  await wait('!document.querySelector('+JSON.stringify(button)+').disabled','Unblocked after race removed');

  // Rejected clipboard IPC: display failure, not a fabricated success.
  await evaluate('window.__abbyTest.reject=true;document.querySelector('+JSON.stringify(button)+').click()');
  await wait('window.__abbyTest.attempts===3','Rejected copy invoked exactly once');
  await wait('window.__abbyTest.messages.at(-1).includes("Copie impossible")','Visible clipboard rejection');
  verify(await get('window.__abbyTest.copies.length===2'),'No clipboard content recorded on failure');
  verify(await get('window.__abbyTest.registry.active("quote:quote-demo").length===0'),'No dirty entries after cleanup');
  console.log('[UXV2 01B ABBY] RESULT '+JSON.stringify({checks,failed:0,
   quoteSpecific:true,dirtyBlocked:true,pendingBlocked:true,actionRaceBlocked:true,
   cleanAllowed:true,otherQuoteIndependent:true,rejectionVisible:true,onlyTemp:true}));
 }).catch(e=>{console.error('[UXV2 01B ABBY] ERROR',e.stack||e);process.exitCode=1;})
 .finally(()=>{try{win?.destroy()}catch{}app.exit(process.exitCode||0)});
}

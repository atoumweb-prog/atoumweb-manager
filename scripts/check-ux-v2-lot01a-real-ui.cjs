/* UX V2/01A: true React+preload+IPC, new SQLite TEMP fixture. No installed Manager. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01a-live-',ENV='ATOUMWEB_UXV2_01A_LIVE_TMP';
const themes=[['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']];
const densities=[['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48]];
const navLabels=['Accueil','Prospection','Clients','Offres & Tarifs','Devis','Projets','Interventions & Maintenance','Gestion des temps','Facturation','Dépenses','Documents & Contrats','Bibliothèque AtoumWeb','Sites','Sauvegardes','Annuaire','Statistiques','Réglages'];
const samples=['Accueil','Prospection','Devis','Projets','Interventions & Maintenance','Réglages'];
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const normalize=v=>process.platform==='win32'?v.toLowerCase():v;
const owned=dir=>!!dir&&fs.existsSync(dir)&&path.basename(dir).startsWith(prefix)&&normalize(fs.realpathSync.native(path.dirname(dir)))===normalize(fs.realpathSync.native(os.tmpdir()));
const captureArg=process.argv.indexOf('--captures');
assert(captureArg===-1&&process.argv.length===2||captureArg===2&&process.argv.length===4,'Usage: node scripts/check-ux-v2-lot01a-real-ui.cjs [--captures NEW-ABSOLUTE-FOLDER]');
if(captureArg===2){
 const folder=process.argv[3];assert(path.isAbsolute(folder)&&!/validation-msi/i.test(folder)&&!fs.existsSync(folder),'Use a new absolute capture directory outside Validation-MSI.');
}
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 const env={...process.env,[ENV]:temp};delete env.ELECTRON_RUN_AS_NODE;
 try{
  console.log('[UXV2 01A LIVE] Real Manager renderer with isolated %TEMP% workspace');
  const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:420000,maxBuffer:16*1024*1024});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
  if(r.error)throw r.error;
  assert(r.status===0,'Electron fixture failed with exit code '+r.status);
 }catch(e){console.error('[UXV2 01A LIVE] FAILED',e.stack||e);process.exitCode=1;}
 finally{
  if(!owned(temp))throw Error('Unsafe cleanup directory');
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:7,retryDelay:250});
  console.log('[UXV2 01A LIVE] Fixture cleaned: '+!fs.existsSync(temp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env[ENV];
 assert(owned(temp),'No independent TEMP fixture; launch via Node wrapper');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));app.on('window-all-closed',()=>{});
 const base=repo.split(path.sep).join('/'),esbuild=require('esbuild');
 const serviceEntries=['database/DatabaseService','workspace','ipc','operations/operationsIpc','referentials/referentialsIpc','backups/businessBackupsIpc','time/timeIpc'];
 const source=serviceEntries.map(s=>"export * from '"+base+"/src/main/"+s+"';").join('\n');
 esbuild.buildSync({stdin:{contents:source,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
 for(const entry of [['src/preload/preload.ts','preload.js','node'],['src/renderer/main.tsx','ui.js','browser']]){
  const [file,out,platform]=entry;
  esbuild.buildSync({entryPoints:[path.join(repo,file)],bundle:true,platform,outfile:path.join(temp,out),logLevel:'silent',...(platform==='node'?{format:'cjs',external:['electron']}:{format:'iife'})});
 }
 fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="ui.css"></head><body><div id="root"></div><script src="ui.js"></script></body></html>');
 const S=require(path.join(temp,'services.cjs'));
 let db=null,win=null,checks=0,visits=0;
 const overflow=[],consoleErrors=[];
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const test=(ok,description)=>{if(!ok)throw Error(description);checks++;};
 const evalUI=expression=>win.webContents.executeJavaScript('(async()=>{'+expression+'})()');
 const wait=async(expr,reason)=>{
  for(let i=0;i<140;i++){if(await evalUI('return Boolean('+expr+');'))return;await sleep(50);}
  throw Error('Timeout: '+reason);
 };
 const navigate=async name=>{
  await evalUI('const el=[...document.querySelectorAll(".navigation .nav-item")].find(e=>e.textContent.trim()==='+JSON.stringify(name)+');if(!el)throw Error("Missing navigation");el.click();');
  await wait('document.querySelector(".navigation .nav-item.active")?.textContent.trim()==='+JSON.stringify(name),'active '+name);
  await wait(name==='Accueil'?'!!document.querySelector(".home-dashboard")':'document.querySelector(".content-area .page-heading h1")?.textContent.trim()==='+JSON.stringify(name),'page '+name);
  await sleep(75);
 };
 const get=expr=>evalUI('return '+expr+';');
 const select=async(theme,themeLabel,density,densityLabel,font,height)=>{
  await navigate('Réglages');
  await wait('document.querySelectorAll(".theme-card").length===3 && document.querySelectorAll(".density-card").length===3','settings');
  await evalUI('const e=[...document.querySelectorAll(".theme-card")].find(e=>e.querySelector("strong")?.textContent.trim()==='+JSON.stringify(themeLabel)+');if(!e)throw Error("Missing theme");e.click();');
  await wait('document.documentElement.dataset.theme==='+JSON.stringify(theme),'theme '+theme);
  await evalUI('const e=[...document.querySelectorAll(".density-card")].find(e=>e.querySelector("strong")?.textContent.trim()==='+JSON.stringify(densityLabel)+');if(!e)throw Error("Missing density");e.click();');
  await wait('document.documentElement.dataset.density==='+JSON.stringify(density),'density '+density);
  const settings=await get('window.atoumweb.app.getBootstrap()');
  test(settings.theme===theme&&settings.displayDensity===density,'Persisted settings '+theme+'/'+density);
  test((await get('getComputedStyle(document.body).fontSize'))===font+'px','Body font '+theme+'/'+density);
  test((await get('getComputedStyle(document.documentElement).getPropertyValue("--ui-control-height").trim()'))===height+'px','Control height '+theme+'/'+density);
 };
 const inspect=async(page,theme,density)=>{
  const x=await get('({active:document.querySelector(".nav-item.active")?.textContent.trim(),heading:document.querySelector(".page-heading h1")?.textContent.trim(),clock:document.querySelector(".global-clock b")?.textContent.trim(),search:!!document.querySelector(".global-search input"),timer:!!document.querySelector(".global-timer,.timer-widget"),toggle:document.querySelector(".sidebar-toggle")?.getAttribute("aria-label"),fatal:!!document.querySelector(".renderer-fatal-shell,.fatal-screen"),theme:document.documentElement.dataset.theme,density:document.documentElement.dataset.density,scroll:document.querySelector(".content-area")?.scrollWidth,client:document.querySelector(".content-area")?.clientWidth})');
  const label=theme+'/'+density+'/'+page;
  test(x.active===page&&!x.fatal&&(page==='Accueil'||x.heading===page),'Rendered '+label);
  test(x.clock&&x.search&&x.timer&&x.toggle,'Shell visible '+label);
  test(x.theme===theme&&x.density===density,'Theme remains '+label);
  if(x.scroll>x.client+20)overflow.push({label,pixels:x.scroll-x.client});
  visits++;
 };
 const saveScreenshot=async label=>{
  if(captureArg<0)return;
  const folder=path.resolve(process.argv[3]);
  if(!fs.existsSync(folder))fs.mkdirSync(folder,{recursive:true});
  const dest=path.join(folder,label.replace(/[^a-z0-9_-]/gi,'_')+'.png');
  assert(!fs.existsSync(dest),'Refusing overwrite of '+dest);
  fs.writeFileSync(dest,(await win.webContents.capturePage()).toPNG());
 };
 app.whenReady().then(async()=>{
  const workspace=S.ensureWorkspace(path.join(temp,'workspace'));
  db=new S.DatabaseService(workspace);await db.initialize();
  S.registerIpcHandlers(db,workspace);S.registerOperationsIpcHandlers(db);S.registerReferentialsIpcHandlers(db);
  S.registerBusinessBackupsIpcHandlers(db);S.registerTimeCorrectionIpcHandler(db);
  win=new BrowserWindow({show:false,width:1510,height:1030,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)consoleErrors.push(e.message);});
  await win.loadFile(path.join(temp,'index.html'));
  await wait('document.querySelectorAll(".nav-item").length===17','real Manager bootstrap');
  test((await get('document.querySelectorAll(".nav-item").length'))===17,'Seventeen navigation entries');
  test(await get('!!window.atoumweb&&!window.atoumwebOperationalRecipe'),'Real preload without synthetic UI API');
  for(const page of navLabels){await navigate(page);await inspect(page,'atoumweb','comfort');}
  console.log('[UXV2 01A LIVE] PASS all 17 real module destinations.');
  for(const [theme,label] of themes){
   for(const [density,display,font,height] of densities){
    await select(theme,label,density,display,font,height);
    for(const page of samples){
     await navigate(page);await inspect(page,theme,density);
     await saveScreenshot(theme+'-'+density+'-'+page);
    }
    console.log('[UXV2 01A LIVE] PASS '+theme+'/'+density+' six real screens, '+font+'px / '+height+'px.');
   }
  }
  win.setSize(1024,720);await sleep(150);
  for(const page of ['Accueil','Prospection','Devis','Projets','Réglages']){await navigate(page);await inspect(page,'blanc','comfort_plus');}
  // R01A-03: a true browser keyboard Tab traverses real focusable buttons.
  await navigate('Réglages');
  win.webContents.focus();
  await evalUI('const root=document.querySelector(".content-area");'+
    'for(let i=0;i<2;i++){const b=document.createElement("button");b.type="button";'+
    'b.className="secondary-button ux01a-focus-probe";b.textContent="Focus TEST "+i;root.appendChild(b);}'+
    'document.querySelectorAll(".ux01a-focus-probe")[0].focus();');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Tab'});
  win.webContents.sendInputEvent({type:'keyUp',keyCode:'Tab'});
  await sleep(120);
  const focus=await get('({last:document.activeElement?.textContent.trim(),'+
    'isVisible:document.activeElement?.matches(":focus-visible"),'+
    'style:getComputedStyle(document.activeElement).outlineStyle,'+
    'width:getComputedStyle(document.activeElement).outlineWidth})');
  console.log('[UXV2 01A LIVE] Keyboard focus probe '+JSON.stringify(focus));
  test(focus.last==='Focus TEST 1','Keyboard Tab advances to next focusable button');
  test(focus.isVisible===true&&focus.style!=='none'&&parseFloat(focus.width)>=2,
    'Keyboard focus ring visible at least 2px');
  await evalUI('document.querySelectorAll(".ux01a-focus-probe").forEach(e=>e.remove());');

  // R01A-08: the actual Settings checkbox persists the help preference via IPC.
  // Only a temporary style probe is added to the page; no business record changes.
  await evalUI('const e=document.createElement("button");e.type="button";'+
    'e.className="field-help ux01a-help-probe";e.textContent="?";'+
    'document.querySelector(".content-area").appendChild(e);');
  const getHelp=()=>get('getComputedStyle(document.querySelector(".ux01a-help-probe")).display');
  test((await getHelp())!=='none','Help marker initially displayed');
  await evalUI('document.querySelector(".settings-help-row input[type=checkbox]").click();');
  await wait('document.querySelector(".app-shell").classList.contains("help-disabled")',
    'Help preference disabled in real Settings');
  test((await getHelp())==='none','Help marker hidden by real CSS');
  test((await get('window.atoumweb.app.getBootstrap()')).showHoverHelp===false,
    'Help preference disabled by real IPC');
  await evalUI('document.querySelector(".settings-help-row input[type=checkbox]").click();');
  await wait('!document.querySelector(".app-shell").classList.contains("help-disabled")',
    'Help preference enabled in real Settings');
  test((await getHelp())!=='none','Help marker visible after enabling');
  test((await get('window.atoumweb.app.getBootstrap()')).showHoverHelp===true,
    'Help preference re-enabled by real IPC');
  await evalUI('document.querySelector(".ux01a-help-probe").remove();');

  // R01A-05: CSS viewport changes under real Chromium zoom, not a CSS mock.
  win.setSize(1024,720);
  for(const zoom of [1.25,1.5]){
    win.webContents.setZoomFactor(zoom);
    await sleep(120);
    test((await get('window.devicePixelRatio'))>0,'Zoom renderer still has real pixel ratio '+zoom);
    for(const page of ['Accueil','Prospection','Devis','Projets','Réglages']){
      await navigate(page);await inspect(page,'blanc','comfort_plus');
    }
    console.log('[UXV2 01A LIVE] Zoom '+zoom+' checked in five real screens.');
  }
  win.webContents.setZoomFactor(1);
  await navigate('Accueil');
  win.webContents.reload();
  await wait('document.querySelector(".nav-item.active")?.textContent.trim()==="Accueil"','renderer reload');
  test(await get('document.documentElement.dataset.theme==="blanc"'),'Theme restored after reload');
  test(await get('document.documentElement.dataset.density==="comfort_plus"'),'Density restored after reload');
  test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','TEMP SQLite integrity');
  test(db.database.all('PRAGMA foreign_key_check').length===0,'TEMP SQLite FK');
  console.log('[UXV2 01A LIVE] RESULT '+JSON.stringify({passed:checks,failed:0,realPages:17,sampleVisits:54,narrowVisits:5,zoomVisits:10,visits,overflowCandidates:overflow,consoleErrors,onlyTemp:true}));
  if(overflow.length)console.log('[UXV2 01A LIVE] Overflow candidates are observational and need review, not automatic failure.');
 }).catch(e=>{console.error('[UXV2 01A LIVE] ERROR',e.stack||e);process.exitCode=1;}).finally(()=>{try{win?.destroy();}catch{}try{db?.close();}catch{}app.exit(process.exitCode||0);});
}

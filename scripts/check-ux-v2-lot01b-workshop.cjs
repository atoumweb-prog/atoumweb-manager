/* UX V2 01B.6: five real presentational components in OS TEMP React/Electron.
 * Optional --captures NEW_ABSOLUTE_DIRECTORY creates nine verified PNG.
 */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),prefix='atoumweb-uxv2-01b-workshop-',ENV='ATOUMWEB_UXV2_01B_WORKSHOP_TEMP';
const themes=['atoumweb','noir','blanc'],densities=[['compact',14,36],['comfort',16,42],['comfort_plus',18,48]];
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const norm=s=>process.platform==='win32'?s.toLowerCase():s;
const owned=p=>!!p&&fs.existsSync(p)&&path.basename(p).startsWith(prefix)&&norm(fs.realpathSync.native(path.dirname(p)))===norm(fs.realpathSync.native(os.tmpdir()));
const capture=process.argv.indexOf('--captures')===2;
assert((!capture&&process.argv.length===2)||(capture&&process.argv.length===4),'Usage: node scripts/check-ux-v2-lot01b-workshop.cjs [--captures NEW_ABSOLUTE_DIRECTORY]');
if(capture)assert(path.isAbsolute(process.argv[3])&&!fs.existsSync(process.argv[3])&&!/validation-msi/i.test(process.argv[3]),'Use a NEW absolute capture path, not Validation-MSI');
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const main=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
  const files=[...main.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(x=>x[1]);
  assert(files.length===31,'CSS import chain changed');
  const css=files.map(f=>fs.readFileSync(path.join(repo,'src/renderer',f),'utf8')).join('\n');
  assert(!css.includes('</style'),'Unexpected CSS style closer');
  const layout=[
   'body{margin:0;background:var(--bg);color:var(--text)}',
   '.aw-workshop{max-width:1080px;margin:18px auto;padding:16px}',
   '.aw-workshop h1{font-size:24px;margin:0 0 12px}',
   '.aw-workshop-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
   '.aw-workshop-card{min-width:0;border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:16px}',
   '.aw-workshop-card h2{margin:0 0 12px;font-size:18px}',
   '.aw-workshop-buttons{display:flex;flex-wrap:wrap;gap:8px}',
   '.aw-workshop-notices{display:grid;gap:8px}',
   '@media(max-width:800px){.aw-workshop-grid{grid-template-columns:1fr}}'
  ].join('\n');
  // Match the production shell's TWO-COLUMN layout: sidebar + main-area.
  // Putting content-area directly under app-shell places it into the 258px
  // sidebar grid track, creating artificial horizontal overflow.
  const fixtureShell='<div class="app-shell">'+
    '<aside class="sidebar" aria-label="Navigation fictive de l\'atelier">'+
      '<div class="brand-block"><div class="brand-mark">AW</div>'+
      '<div><strong>AtoumWeb</strong><span>Atelier UX 01B</span></div></div>'+
    '</aside>'+
    '<main class="main-area">'+
      '<header class="topbar"><strong>Composants de présentation · validation isolée</strong></header>'+
      '<section class="content-area"><div id="root"></div></section>'+
    '</main>'+
  '</div>';
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+css+layout+'</style></head><body>'+
    fixtureShell+'<script src="demo.js"></script></body></html>');
  const lines=[
   "import React from 'react';",
   "import {createRoot} from 'react-dom/client';",
   "import {AppButton} from './src/renderer/ui/AppButton';",
   "import {AppTextField} from './src/renderer/ui/AppTextField';",
   "import {FieldHelp} from './src/renderer/ui/FieldHelp';",
   "import {AppNotice} from './src/renderer/ui/AppNotice';",
   "import {OperationIcon} from './src/renderer/operations/OperationIcon';",
   "const state=window.__workshop={clicked:0,opened:0,closed:0};",
   "const el=(type,props,...children)=>React.createElement(type,props,...children);",
   "function Demo(){return el('div',{className:'aw-workshop',id:'ux-workshop'},",
   "el('h1',null,'AtoumWeb Manager · Atelier UX V2 01B'),",
   "el('p',null,'Composants pilotes · données fictives · aucune opération métier'),",
   "el('div',{className:'aw-workshop-grid'},",
   "el('section',{className:'aw-workshop-card',id:'demo-buttons'},",
   "el('h2',null,'Boutons et icônes'),el('div',{className:'aw-workshop-buttons'},",
   "el(AppButton,{variant:'primary',icon:el(OperationIcon,{name:'check-circle'}),onAction:()=>state.clicked++},'Valider (démo)'),",
   "el(AppButton,{variant:'secondary',icon:el(OperationIcon,{name:'refresh'})},'Actualiser'),",
   "el(AppButton,{variant:'quiet',icon:el(OperationIcon,{name:'expand'}),'aria-label':'Agrandir une fiche de démonstration'}),",
   "el(AppButton,{variant:'danger'},'Action sensible'),",
   "el(AppButton,{variant:'secondary',disabled:true},'Indisponible')),",
   "el('p',null,el(OperationIcon,{name:'clock'}),' Temps',el(OperationIcon,{name:'wrench'}),' Interventions')),",
   "el('section',{className:'aw-workshop-card',id:'demo-fields'},",
   "el('h2',null,'Champs et aide ?'),",
   "el(AppTextField,{id:'demo-name',label:'Nom du contact',description:'Description du champ',error:'Saisie requise (exemple)',help:el(FieldHelp,{text:'Aide courte',detail:'Explication complète du champ.'})}),",
   "el(AppTextField,{id:'demo-email',label:'Courriel fictif',type:'email',placeholder:'exemple@test.invalid'})),",
   "el('section',{className:'aw-workshop-card',id:'demo-notices'},",
   "el('h2',null,'Notifications'),el('div',{className:'aw-workshop-notices'},",
   "el(AppNotice,{level:'info'},'Information simple'),",
   "el(AppNotice,{level:'success',action:{label:'Ouvrir dans l’Explorateur (démo)',onClick:()=>state.opened++}},'Opération fictive réussie'),",
   "el(AppNotice,{level:'warning',onClose:()=>state.closed++},'Attention'),",
   "el(AppNotice,{level:'error'},'Échec fictif'))),",
   "el('section',{className:'aw-workshop-card',id:'demo-explanation'},",
   "el('h2',null,'Périmètre 01B'),",
   "el('p',null,'Les commandes restent sans connexion aux services métier.'),",
   "el('p',null,'Ce banc ne contient aucun prospect ou devis réel.'),",
   "el('p',null,'Les écrans finaux du Manager V2 ne sont pas encore reconstruits.'))));}",
   "createRoot(document.getElementById('root')).render(el(Demo));"
  ];
  require('esbuild').buildSync({stdin:{contents:lines.join('\n'),resolveDir:repo,loader:'tsx'},bundle:true,platform:'browser',format:'iife',outfile:path.join(temp,'demo.js'),logLevel:'silent'});
  const env={...process.env,[ENV]:temp};delete env.ELECTRON_RUN_AS_NODE;
  const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:160000,maxBuffer:2*1024*1024});
  process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
  if(run.error)throw run.error;
  assert(run.status===0,'Electron workshop exited '+run.status);
 }catch(e){console.error('[UXV2 01B WORKSHOP] FAILED',e.stack||e);process.exitCode=1}
 finally{
  assert(owned(temp),'Unsafe TEMP cleanup refused');
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:7,retryDelay:250});
  console.log('[UXV2 01B WORKSHOP] Fixture cleaned: '+!fs.existsSync(temp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.env[ENV];
 assert(owned(temp),'Expected parent-owned OS TEMP fixture');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));app.on('window-all-closed',()=>{});
 let win=null,checks=0,photos=0;
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(v,m)=>{if(!v)throw Error(m);checks++};
 const exec=s=>win.webContents.executeJavaScript('(async()=>{'+s+'})()');
 const get=s=>exec('return ('+s+');');
 const wait=async(expr,reason)=>{for(let n=0;n<100;n++){if(await get(expr))return;await delay(40)}throw Error('Timeout '+reason)};
 const color=n=>[30+(n*43)%190,30+(n*79)%190,30+(n*113)%190];
 const pixel=(image,wanted)=>{
  const size=image.getSize(),bitmap=image.toBitmap();
  assert(bitmap.length===size.width*size.height*4,'Unexpected bitmap layout');
  const start=((size.height-17)*size.width+size.width-17)*4;
  const a=[...bitmap.subarray(start,start+3)].sort((a,b)=>a-b);
  const b=[...wanted].sort((a,b)=>a-b);
  return a.every((v,i)=>Math.abs(v-b[i])<=7);
 };
 const save=async(theme,density)=>{
  if(!capture)return;
  const rgb=color(photos+1);
  await exec('(()=>{let m=document.getElementById("frame-marker");if(!m){m=document.createElement("div");m.id="frame-marker";document.body.appendChild(m)}'+
    'm.style.cssText="position:fixed!important;right:0!important;bottom:0!important;width:40px!important;height:40px!important;z-index:2147483647!important;pointer-events:none!important;background:rgb('+rgb.join(',')+')!important";return true})()');
  let photo=null;
  for(let i=0;i<24;i++){
   await exec('return await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
   await delay(100);
   const candidate=await win.webContents.capturePage();
   if(pixel(candidate,rgb)){photo=candidate;break}
  }
  assert(!!photo,'Stale compositor frame: '+theme+'/'+density);
  const current=await get('({theme:document.documentElement.dataset.theme,density:document.documentElement.dataset.density})');
  assert(current.theme===theme&&current.density===density,'Preferences changed during image capture');
  if(!fs.existsSync(process.argv[3]))fs.mkdirSync(process.argv[3],{recursive:true});
  const dest=path.join(process.argv[3],theme+'-'+density+'.png');
  assert(!fs.existsSync(dest),'Refusing overwrite '+dest);
  fs.writeFileSync(dest,photo.toPNG());
  photos++;
  console.log('[UXV2 01B WORKSHOP] CAPTURE '+photos+'/9 VERIFIED '+theme+'/'+density);
 };
 app.whenReady().then(async()=>{
  win=new BrowserWindow({show:capture,width:1360,height:980,title:'AtoumWeb UX V2 01B atelier (TEMP)',
   webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});
  await win.loadFile(path.join(temp,'index.html'));
  await wait('!!document.querySelector("#ux-workshop")','React workshop');
  const shell=await get('({sidebar:document.querySelector(".sidebar")?.getBoundingClientRect().width,'+
    'main:document.querySelector(".main-area")?.getBoundingClientRect().width,'+
    'content:document.querySelector(".content-area")?.getBoundingClientRect().width,'+
    'contentLeft:document.querySelector(".content-area")?.getBoundingClientRect().left})');
  console.log('[UXV2 01B WORKSHOP] Shell geometry '+JSON.stringify(shell));
  check(shell.sidebar>=250&&shell.main>=500&&shell.content>=500&&shell.contentLeft>=250,
    'Workshop must use the Manager sidebar/main-area layout, not the 258px sidebar track');
  check((await get('document.querySelectorAll(".aw-ui-button").length'))===5,'Five real AppButtons');
  check((await get('document.querySelectorAll(".aw-ui-field-input").length'))===2,'Two real AppTextFields');
  check((await get('document.querySelectorAll(".aw-ui-notice").length'))===4,'Four real notices');
  check(await get('!!document.querySelector(".field-help")'),'Real FieldHelp');
  check(await get('document.querySelectorAll("#demo-buttons svg").length>=5'),'Existing SVG icon set');
  check(await get('document.querySelector("#demo-name").getAttribute("aria-describedby").includes("demo-name-error")'),'Input error association');
  check(await get('document.querySelector("#demo-notices .aw-ui-notice--error").getAttribute("role")==="alert"'),'Error role alert');
  check(await get('window.__workshop.clicked===0&&window.__workshop.opened===0&&window.__workshop.closed===0'),'No business action at mount');
  for(const theme of themes){
   for(const [density,font,height] of densities){
    await exec('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));
    const values=await get('({font:parseFloat(getComputedStyle(document.body).fontSize),'+
     'btn:parseFloat(getComputedStyle(document.querySelector(".aw-ui-button")).minHeight),'+
     'input:parseFloat(getComputedStyle(document.querySelector(".aw-ui-field-input")).minHeight),'+
     'notice:parseFloat(getComputedStyle(document.querySelector(".aw-ui-notice")).fontSize),'+
     'help:getComputedStyle(document.querySelector(".field-help")).display,'+
     'scroll:document.querySelector(".content-area").scrollWidth,client:document.querySelector(".content-area").clientWidth})');
    check(values.font===font,'Base density '+theme+'/'+density);
    check(values.btn>=height&&values.input>=height,'Control size '+theme+'/'+density);
    check(values.notice>=14&&values.help!=='none','Legible notice/help '+theme+'/'+density);
    if(values.scroll>values.client+12){
      const overflow=await get('(()=>{const c=document.querySelector(".content-area"),r=c.getBoundingClientRect();'+
        'return {scrollWidth:c.scrollWidth,clientWidth:c.clientWidth,rect:[r.left,r.right],'+
        'offenders:[...c.querySelectorAll("*")].map(e=>({name:e.tagName.toLowerCase(),'+
        'className:typeof e.className==="string"?e.className:"svg",'+
        'left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)}))'+
        '.filter(e=>e.right>r.right+12||e.left<r.left-12).slice(0,14)}})()');
      console.error('[UXV2 01B WORKSHOP] OVERFLOW DIAGNOSTIC '+theme+'/'+density+' '+
        JSON.stringify(overflow));
    }
    check(values.scroll<=values.client+12,
      'Horizontal overflow '+theme+'/'+density+' ('+values.scroll+' > '+values.client+'+12)');
    await save(theme,density);
    console.log('[UXV2 01B WORKSHOP] PASS '+theme+'/'+density);
   }
  }
  await exec('document.querySelector("#demo-buttons .aw-ui-button--primary").click()');
  check(await get('window.__workshop.clicked===1'),'Explicit primary callback once');
  await exec('document.querySelector("#demo-notices .aw-ui-notice-action").click()');
  check(await get('window.__workshop.opened===1'),'Notice explicit action once');
  await exec('document.querySelector("#demo-notices .aw-ui-notice-close").click()');
  check(await get('window.__workshop.closed===1&&window.__workshop.opened===1'),'Close never replays action');
  await exec('document.querySelector("#demo-fields .field-help").click()');
  await wait('!!document.querySelector(".field-help-detail")','Real help opening');
  check(await get('document.querySelector(".field-help-detail").textContent.includes("Explication complète")'),'Help detail correct');
  await exec('document.querySelector(".field-help-detail-close").click()');
  await wait('!document.querySelector(".field-help-detail")','Real help closing');
  check(await get('document.activeElement?.classList.contains("field-help")'),'Help focus restored');
  if(capture)check(photos===9,'All nine screenshots synchronized');
  console.log('[UXV2 01B WORKSHOP] RESULT '+JSON.stringify({checks,failed:0,combinations:9,
    components:5,onlyTemp:true,...(capture?{capturesVerified:photos}:{})}));
 }).catch(e=>{console.error('[UXV2 01B WORKSHOP] ERROR',e.stack||e);process.exitCode=1})
 .finally(()=>{try{win?.destroy()}catch{}app.exit(process.exitCode||0)});
}

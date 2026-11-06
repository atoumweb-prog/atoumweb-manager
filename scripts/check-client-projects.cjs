/* Client Projects targeted capture against existing TEST data, read-only SQLite. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),workspace=process.argv[2]||'C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-RECETTE-UX-V2-20261104/Workspace-TEST';
const clientId='a28d825f-7e9a-4ff4-99e0-fc70077d553b',database=path.join(workspace,'data/atoumweb-manager.sqlite');
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(database)).digest('hex');
const before=hash(),wrapper=path.join(repo,'outputs','readonly-client-projects-'+Date.now()+'.cjs');
let source=fs.readFileSync(path.join(repo,'scripts/check-ux-v2-lot01a-real-ui.cjs'),'utf8');
source=source.replace('app.disableHardwareAcceleration();',"app.commandLine.appendSwitch('force-device-scale-factor','1');app.disableHardwareAcceleration();");
source=source.replace("fs.copyFileSync(require.resolve('pdfjs-dist",String.raw`{const p=path.join(temp,'services.cjs');let b=fs.readFileSync(p,'utf8');const m=b.match(/new ([\w$.]+)\(databasePath\)/);if(!m)throw Error('Readonly seam absent');b=b.replace(m[0],'new '+m[1]+'(databasePath, {readOnly:true})');fs.writeFileSync(p,b);}fs.copyFileSync(require.resolve('pdfjs-dist`);
source=source.replace("const workspace=S.ensureWorkspace(path.join(temp,'workspace'));",'const workspace=S.createWorkspacePaths('+JSON.stringify(workspace)+');');
source=source.replace('db=new S.DatabaseService(workspace);await db.initialize();',String.raw`db=new S.DatabaseService(workspace);const prefs=new Map(),getter=db.getSetting.bind(db);db.getSetting=(k,...a)=>prefs.has(k)?prefs.get(k):getter(k,...a);db.setSetting=(k,v)=>{prefs.set(k,v);};`);
const q=JSON.stringify,selector='[data-record-id="'+clientId+'"]';
let scene=String.raw`win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await evalUI('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort";');await navigate('Clients');`;
scene+='await wait('+q('document.querySelector('+q(selector)+')')+',"Existing client");await evalUI('+q('document.querySelector('+q(selector)+').click()')+');';
scene+=String.raw`
await wait('document.querySelector(".client-quick-crm footer button")','Quick');await evalUI('document.querySelector(".client-quick-crm footer button").click()');await wait('document.querySelector("#client-tab-projects")','Enlarged');await evalUI('document.querySelector("#client-tab-projects").click()');
const cards='document.querySelectorAll("#client-panel-projects [data-project-id]")';
await wait(cards+'.length===2','Two real projects');await sleep(350);
test(await get('Array.from('+cards+').every(e=>e.innerText.includes("À préparer")&&e.innerText.includes("Projet existant")&&e.querySelector("progress").value===0&&!e.innerText.includes("to_prepare"))'),'Actual status translations and progress');
test(await get('document.querySelectorAll(".client-projects-indicators strong")[1].textContent==="0"'),'Existing projects are not active');
await evalUI('document.querySelectorAll(".client-projects-filters button")[1].click()');await wait('document.querySelector(".client-projects-empty")','Empty filtered result');test(await get(cards+'.length===0'),'In progress excludes to_prepare');
await evalUI('document.querySelectorAll(".client-projects-filters button")[2].click()');await wait(cards+'.length===2','To prepare filter');
await evalUI('document.querySelector("#client-tab-contacts").click();document.querySelector("#client-tab-projects").click()');test(await get('document.querySelector(".client-projects-filters select").value==="to_prepare"'),'Filter survives tab changes');
await evalUI('document.querySelector(".client-projects-filters button").click()');await sleep(200);
const first=await get('document.querySelector("[data-project-id]").dataset.projectId');
await evalUI('const dispatch=window.dispatchEvent;window.dispatchEvent=function(event){if(event.type==="atoumweb:navigate"){window.__projectNavigation=event.detail;return true;}return dispatch.call(this,event);};document.querySelector(".client-project-card header button").click();window.dispatchEvent=dispatch');
test(await get('window.__projectNavigation?.entityType==="project"&&window.__projectNavigation?.entityId==='+JSON.stringify(first)),'Exact project navigation event');
test(await get('Array.from('+cards+').every(e=>e.scrollWidth<=e.clientWidth+1)'),'Project cards fit available width');
await sleep(400);const frame=await win.webContents.capturePage();test(frame.getSize().width===1920&&frame.getSize().height===1080&&win.webContents.getZoomFactor()===1,'1920x1080 at 100 percent');
fs.writeFileSync(path.join(repo,'outputs/client-projects-v2-1920x1080.png'),frame.toPNG());
console.log('PROJECTS_REVIEW '+JSON.stringify({checks,consoleErrors,theme:await get('document.documentElement.dataset.theme'),density:await get('document.documentElement.dataset.density'),text:await get('document.querySelector("#client-panel-projects").innerText')}));
test(consoleErrors.length===0,'No renderer errors');return;
`;
const start=source.indexOf('  if(searchOnly){'),end=source.indexOf('  if(lot08a){',start);if(start<0||end<0)throw Error('Capture branch absent');
source=source.slice(0,start)+'if(searchOnly){'+scene+'}\n'+source.slice(end);fs.mkdirSync(path.dirname(wrapper),{recursive:true});fs.writeFileSync(wrapper,source);
try{const result=spawnSync(process.execPath,[wrapper,'--search-only'],{cwd:repo,windowsHide:true,encoding:'utf8',timeout:90000,maxBuffer:1024*1024});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.error)throw result.error;if(result.status!==0)process.exitCode=1;}finally{fs.unlinkSync(wrapper);const unchanged=before===hash();console.log('EXISTING_DB_UNCHANGED '+unchanged);if(!unchanged)process.exitCode=1;}

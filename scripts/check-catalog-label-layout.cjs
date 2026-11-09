'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),input=fs.realpathSync(process.argv[2]),output=path.resolve(process.argv[3]);
const relative=path.relative(fs.realpathSync(os.tmpdir()),input);if(relative.startsWith('..')||path.isAbsolute(relative)||fs.existsSync(output))throw Error('Existing TEMP input and new report required');
let source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8').replace("const repo=path.resolve(__dirname,'..')",'const repo='+JSON.stringify(repo));
source=source.replace('app.disableHardwareAcceleration();',"app.commandLine.appendSwitch('force-device-scale-factor','1');app.disableHardwareAcceleration();");
const seam=source.indexOf(' app.whenReady().then');if(seam<0)throw Error('TEMP UI seam absent');
source='module.paths.unshift('+JSON.stringify(path.join(repo,'node_modules'))+');\n'+source.slice(0,seam)+`
 app.whenReady().then(async()=>{
 const workspace=S.ensureWorkspace(path.join(temp,'workspace')),{DatabaseSync,backup}=require('node:sqlite'),original=new DatabaseSync(${JSON.stringify(input)},{readOnly:true});try{await backup(original,workspace.databaseFile);}finally{original.close();}
 db=new S.DatabaseService(workspace);await db.initialize();db.setSetting('theme','noir');db.setSetting('display_density','comfort');
 const backendErrors=[],handle=ipcMain.handle.bind(ipcMain);ipcMain.handle=(channel,listener)=>handle(channel,async(...args)=>{try{return await listener(...args);}catch(e){backendErrors.push({channel,error:String(e)});throw e;}});
 const results=[],check=(ok,label)=>{assert(ok,label);results.push(label)};
 S.registerIpcHandlers(db,workspace);S.registerOperationsIpcHandlers(db);S.registerReferentialsIpcHandlers(db);S.registerBusinessBackupsIpcHandlers(db);S.registerTimeCorrectionIpcHandler(db);
 win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)consoleErrors.push(e.message)});
 await win.loadFile(path.join(temp,'index.html'));await wait('document.querySelectorAll("[data-nav-module]").length===17','bootstrap');await navigate('Offres & Tarifs');await wait('document.querySelector(".ot-spaces")','catalogue');
 check(await get('window.atoumweb.catalog.persistenceAvailable()'),'Schema 81 available through real preload/IPC');
 check((await get('window.atoumweb.catalog.listDrafts()')).length===130,'130 imported operational drafts through IPC');
 await evalUI('const e=[...document.querySelectorAll(".ot-view-row button")].find(e=>e.textContent.includes("Mes brouillons"));e.click();');await wait('document.querySelector(".ot-draft-row")','drafts');check(true,'Mes brouillons renders imported copy');
 await evalUI('document.querySelector(".ot-draft-row .primary-button").click()');await wait('document.querySelector(".catalog-detail-panel")','detail');
 const tabs=await get('Array.from(document.querySelectorAll("[id^=catalog-tab-]")).map(e=>e.id)');check(tabs.length===8,'Eight existing Offer/Service tabs retained');
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);
 const layouts=[];
 for(const theme of ['noir','blanc','atoumweb'])for(const width of [1920,1280]){
  await evalUI('window.atoumweb.settings.setTheme('+JSON.stringify(theme)+')');win.setContentSize(width,1080);await sleep(180);
  const layout=await get('Array.from(document.querySelectorAll(".catalog-detail-panel .summary-line")).map(row=>{const label=row.querySelector("strong"),value=row.querySelector("span"),r=label.getBoundingClientRect();return {label:label.textContent,width:r.width,height:r.height,lineHeight:parseFloat(getComputedStyle(label).lineHeight),overflow:label.scrollWidth>label.clientWidth+1,rowWidth:row.getBoundingClientRect().width,valueWidth:value.getBoundingClientRect().width};})');
  const source=layout.find(r=>r.label==='Source');check(!!source&&source.height<=source.lineHeight+1,'Source remains one line '+theme+' '+width);check(layout.every(r=>!r.overflow&&r.width>=140),'All visible labels have reserved readable width '+theme+' '+width);layouts.push({theme,width,labels:layout});
 }
 await evalUI('window.atoumweb.settings.setTheme("noir")');win.setContentSize(1920,1080);await sleep(160);await evalUI('document.querySelector(".catalog-summary-source").scrollIntoView({block:"center"})');await sleep(100);
 fs.writeFileSync(path.join(path.dirname(${JSON.stringify(output)}),'04-offres-libelles-source-corriges.png'),(await win.webContents.capturePage()).toPNG());
 await navigate('Devis');check(true,'Historical Quotes page opens on migrated imported copy');
 await navigate('Documents & Contrats');check(true,'Documents and Contracts page opens on migrated imported copy');
 await evalUI('window.dispatchEvent(new CustomEvent("atoumweb:open-contract-library",{detail:null}))');await wait('document.querySelector(".contract-library")','contract library');check(true,'Contract library opens through normal UI route');
 check(db.database.get("SELECT count(*) AS n FROM contract_clause_versions WHERE status='draft'").n===119,'119 clauses remain draft after UI consultation');
 check(db.database.get('SELECT count(*) AS n FROM catalog_contract_clause_links').n===0,'Contract mappings remain inactive');
 await sleep(300);check(backendErrors.filter(e=>!(e.channel==='projects:update-node'&&/archiv/i.test(e.error))).length===0,'No unexpected backend error; archived-site refusal is explicitly tested');check(consoleErrors.length===0,'No renderer error');check(db.database.all('PRAGMA foreign_key_check').length===0,'No FK violation');
 fs.writeFileSync(${JSON.stringify(output)},JSON.stringify({tempOnly:true,source:${JSON.stringify(input)},checks:results,tabs,layouts,consoleErrors,backendErrors,capturesProduced:1},null,2));console.log('ACTIVATION_UI '+JSON.stringify({checks:results.length,captures:1}));
 }).catch(e=>{console.error(e.stack||e);process.exitCode=1}).finally(()=>{if(win&&!win.isDestroyed())win.destroy();db?.close();app.quit();});
}
`;
const wrapper=path.join(repo,'outputs','activation-ui-'+Date.now()+'.cjs');fs.writeFileSync(wrapper,source);
try{const r=spawnSync(process.execPath,[wrapper],{cwd:repo,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status!==0||!r.stdout.includes('ACTIVATION_UI '))throw Error('Isolated activation UI recipe failed');}finally{fs.unlinkSync(wrapper);}

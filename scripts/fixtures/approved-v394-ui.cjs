 app.whenReady().then(async()=>{
 const dir=path.join(repo,'outputs/Integration-V394-V15-20261108'),workspace=S.ensureWorkspace(path.join(temp,'workspace'));db=new S.DatabaseService(workspace);await db.initialize();
 const service=new S.ApprovedPackService(db.database);service.apply(service.simulate().planSha256);db.setSetting('theme','noir');db.setSetting('display_density','comfort');
 const before=JSON.stringify(['quotes','quote_lines','quote_contract_preparations'].map(t=>db.database.all('SELECT * FROM '+t))),results=[],check=(ok,label)=>{assert(ok,label);results.push(label)};
 S.registerIpcHandlers(db,workspace);S.registerOperationsIpcHandlers(db);S.registerReferentialsIpcHandlers(db);S.registerBusinessBackupsIpcHandlers(db);S.registerTimeCorrectionIpcHandler(db);
 win=new BrowserWindow({show:true,width:1920,height:1080,useContentSize:true,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)consoleErrors.push(e.message)});
 await win.loadFile(path.join(temp,'index.html'));await wait('document.querySelectorAll("[data-nav-module]").length===17','bootstrap');await navigate('Offres & Tarifs');await wait('document.querySelector(".ot-spaces")','catalogue');
 check(await get('window.atoumweb.catalog.persistenceAvailable()')===false,'Normal schema 80 startup remains non-migrating');
 check(db.database.get("SELECT count(*) AS n FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey') LIKE 'V39-%'").n===18,'18 provisional source codes present without canonical aliases');
 const found=await get('window.atoumweb.catalog.list({search:"V39-ECOM-BUSINESS"})');check(found.length===1,'Provisional source code searchable through real preload/IPC');
 await evalUI('document.querySelector(".ot-spaces button:last-child").click()');await wait('document.querySelector("[data-approved-pack-reference]")','approved reference');
 await evalUI('document.querySelector("[data-approved-pack-reference] summary").click()');
 check(await get('document.querySelector("[data-approved-pack-reference]").textContent.includes("130 références commerciales")'),'Approved reference displayed in Catalogue administration');
 await evalUI('const e=document.querySelector("[data-approved-pack-reference] input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"CL-01");e.dispatchEvent(new Event("input",{bubbles:true}));');await sleep(200);
 check(await get('document.querySelector("[data-approved-pack-reference]").textContent.includes("CL-01")'),'V1.5 source blocks searchable, including CL decisions');
 check(await get('document.querySelector("[data-approved-pack-reference]").textContent.includes("aucune couverture")'),'No insurance or mediation attestation invented in reference panel');
 for(const [theme,label] of [['blanc','Blanc'],['atoumweb','AtoumWeb'],['noir','Noir']]){
  await select(theme,label,'comfort','Confort',16,42);await navigate('Offres & Tarifs');await wait('document.querySelector(".ot-spaces")','catalogue theme');
  await evalUI('document.querySelector(".ot-spaces button:last-child").click()');await wait('document.querySelector("[data-approved-pack-reference]")','reference theme');
  await evalUI('document.querySelector("[data-approved-pack-reference] summary").click()');
  check(await get('document.documentElement.dataset.theme')===theme,'Read-only reference available in '+theme+' / Confort');
 }
 check(before===JSON.stringify(['quotes','quote_lines','quote_contract_preparations'].map(t=>db.database.all('SELECT * FROM '+t))),'Historical quotes/snapshots unchanged during reference consultation');
 check(db.database.all('PRAGMA foreign_key_check').length===0,'foreign_key_check empty');check(db.database.get('PRAGMA integrity_check').integrity_check==='ok','integrity_check ok');check(consoleErrors.length===0,'No renderer error');
 fs.writeFileSync(path.join(dir,'ELECTRON-REFERENCE.json'),JSON.stringify({results,tempOnly:true,capturesProduced:0,consoleErrors},null,2));console.log('V394_UI_RESULT '+JSON.stringify({checks:results.length,consoleErrors}));
 }).catch(e=>{console.error(e.stack||e);process.exitCode=1}).finally(()=>{if(win&&!win.isDestroyed())win.destroy();db?.close();app.quit();});
}

// Normal DatabaseService initialization and real renderer, no experimental migration.
 app.whenReady().then(async()=>{
 const dir=path.join(repo,'outputs/Offres-Tarifs-Lot2-Compatibilite-2026-11-08');fs.mkdirSync(dir,{recursive:true});
 const workspace=S.ensureWorkspace(path.join(temp,'workspace'));db=new S.DatabaseService(workspace);await db.initialize();
 const results=[],check=(ok,label)=>{assert(ok,label);results.push(label)};
 check(!db.catalog.persistenceAvailable(),'Normal initialization does not activate migration 81');
 const service=db.catalog.create({type:'service',name:'TEST — Service historique'},{priceMode:'fixed',priceCents:12345});db.catalog.publishVersion(service.versions[0].id);
 const offer=db.catalog.create({type:'offer',name:'TEST — Offre historique'},{priceMode:'fixed',priceCents:45678});db.catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:service.versions[0].id}]);db.catalog.publishVersion(offer.versions[0].id);
 const published=JSON.stringify(db.catalog.getItem(offer.id).versions[0]);
 const draft=db.catalog.createVersion(offer.id,{priceMode:'fixed',priceCents:56789});const second=db.catalog.createVersion(offer.id,{priceMode:'fixed',priceCents:67890});
 check(db.catalog.getItem(offer.id).versions.filter(v=>v.status==='draft').length===2,'Multiple historical drafts preserved without reclassification');
 check(db.catalog.listOfferComponents(draft.id)[0].serviceVersionId===service.versions[0].id,'Historical composition references retained');
 const saved=db.catalog.saveDraftVersion(draft.id,draft,{...draft,description:'TEST — Sauvegarde historique'});
 check(saved.description==='TEST — Sauvegarde historique','Historical manual save works without revision column');
 try{db.catalog.saveDraftVersion(draft.id,draft,{...draft,description:'stale'});throw Error('Missing conflict');}catch(e){check(String(e).includes('Conflit'),'Historical snapshot conflict still rejected');}
 check(JSON.stringify(db.catalog.getItem(offer.id).versions.find(v=>v.id===offer.versions[0].id))===published,'Published source unchanged');
 db.close();db=new S.DatabaseService(workspace);await db.initialize();
 check(!db.catalog.persistenceAvailable(),'Normal restart still does not activate migration 81');
 check(db.catalog.getItem(offer.id).versions.some(v=>v.id===second.id),'Historical draft IDs survive normal restart');
 check(db.catalog.getItem(offer.id).versions.find(v=>v.id===draft.id).description===saved.description,'Historical manual save survives restart');
 db.setSetting('theme','noir');db.setSetting('display_density','comfort');
 S.registerIpcHandlers(db,workspace);S.registerOperationsIpcHandlers(db);S.registerReferentialsIpcHandlers(db);S.registerBusinessBackupsIpcHandlers(db);S.registerTimeCorrectionIpcHandler(db);
 win=new BrowserWindow({show:true,width:1920,height:1080,useContentSize:true,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)consoleErrors.push(e.message)});
 await win.loadFile(path.join(temp,'index.html'));await wait('document.querySelectorAll("[data-nav-module]").length===17','bootstrap');await navigate('Offres & Tarifs');await wait('document.querySelector(".ot-view-row")','catalogue');
 check(await get('window.atoumweb.catalog.persistenceAvailable()')===false,'Renderer IPC reports legacy capability');
 check(!await get('[...document.querySelectorAll(".ot-view-row button")].some(e=>e.textContent.includes("Mes brouillons"))'),'Persistent draft view hidden');
 check((await get('window.atoumweb.catalog.list()')).some(i=>i.id===offer.id),'Historical catalogue listing through real IPC');
 await evalUI('document.querySelector(".ot-view-row button:nth-child(2)").click()');await sleep(250);
 check(await get('!!document.querySelector("table")'),'Administration table renders on legacy schema');
 const item=await get('window.atoumweb.catalog.getItem('+JSON.stringify(offer.id)+')');
 check(item.versions.length===3,'Historical detail returned through IPC');
 check(db.database.all("SELECT name FROM pragma_table_info('catalog_versions') WHERE name IN ('save_revision','last_saved_at','abandoned_at')").length===0,'Experimental columns remain absent after renderer use');
 check(db.database.all("SELECT name FROM sqlite_master WHERE name='catalog_command_receipts'").length===0,'No idempotence receipt table silently created');
 check(db.database.all('PRAGMA foreign_key_check').length===0,'foreign_key_check empty');check(db.database.get('PRAGMA integrity_check').integrity_check==='ok','integrity_check ok');check(consoleErrors.length===0,'No renderer errors');
 fs.writeFileSync(path.join(dir,'VERIFICATION.json'),JSON.stringify({results,tempOnly:true,experimentalMigrationApplied:false,capturesProduced:0,consoleErrors,foreignKeys:db.database.all('PRAGMA foreign_key_check'),integrity:db.database.get('PRAGMA integrity_check')},null,2));console.log('LOT2_LEGACY_RESULT '+JSON.stringify({checks:results.length,consoleErrors}));
 }).catch(e=>{console.error(e.stack||e);process.exitCode=1}).finally(()=>{if(win&&!win.isDestroyed())win.destroy();db?.close();app.quit();});
}

// Real App/preload/IPC and disposable SQLite only. Faults are explicitly controlled; no retries.
module.exports=async({win,db,temp,registered,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {ipcMain,dialog}=require('electron'),fs=require('node:fs'),path=require('node:path');
 const originalSearch=registered.get('crm:search:global'),answers=[],dialogs=[],realDialog=dialog.showMessageBoxSync;
 const originalGet=db.catalog.getItem.bind(db.catalog);
 const originalSync=db.contractTerms.syncQuote.bind(db.contractTerms),syncCalls=[];
 db.contractTerms.syncQuote=id=>{const value=originalSync(id);syncCalls.push(id);return value;};
 let searchMode='normal',pending=[],calls=0;
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));e.click()`);await sleep(90);};
 const input=async value=>{await js(`const e=document.querySelector('.global-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()`);await sleep(60);};
 const escape=async()=>{win.focus();win.webContents.focus();await js('document.querySelector(".global-search input").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(120);};
 const search=async term=>{await click('#header-search-trigger');await input(term);await wait('document.querySelector(".search-result")','real search result');};
 const choose=async(type,id)=>{await click(`[data-search-type="${type}"][data-search-id="${id}"]`);};
 const loaded=(type,id)=>wait(`document.querySelector('[data-search-entity-type="${type}"][data-search-entity-id="${id}"]')`,'loaded '+type);
 const snap=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 ipcMain.removeHandler('crm:search:global');ipcMain.handle('crm:search:global',(event,term)=>{
  calls++;if(searchMode==='delayed')return new Promise((resolve,reject)=>pending.push({term,resolve,reject}));
  if(searchMode==='error')throw Error('Injected search refusal');
  if(searchMode==='unknown')return [{entityType:'unknown',entityId:'unsupported',title:'Unsupported TEMP'}];
  return originalSearch(event,term);
 });
 try{
  const org=db.crm.createOrganization({name:'S2C ORGANISATION'}),client=db.crm.createClient({organizationId:org.id});
  const contact=db.crm.createContact({organizationId:org.id,firstName:'S2C',lastName:'CONTACT'});
  const prospect=db.crm.createProspect({organizationId:org.id,primaryNeed:'S2C PROSPECT'});
  const catA=db.catalog.create({type:'service',name:'S2C HOMONYME',canonicalCode:'AW-S2C-A'},{priceMode:'fixed',priceCents:1000});
  const catB=db.catalog.create({type:'service',name:'S2C HOMONYME',canonicalCode:'AW-S2C-B'},{priceMode:'fixed',priceCents:2000});
  const quote=db.quotes.create({clientAccountId:client.id,subject:'S2C QUOTE'});
  const project=await get("window.atoumweb.projects.projects.createInternal({name:'S2C PROJECT'})");
  const request=db.operations.createRequest({clientAccountId:client.id,subject:'S2C REQUEST',source:'email'});
  const intervention=db.operations.createIntervention({clientAccountId:client.id,subject:'S2C INTERVENTION',coverageMode:'internal'});
  const plan=db.maintenance.createPlan({name:'S2C MAINTENANCE',periodicPriceCents:1000});
  const subscription=db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-13'});
  const pack=db.hourPacks.create({clientAccountId:client.id,name:'S2C PACK',purchasedSeconds:3600,contractPriceCents:1000});
  const library=db.atoumWebTechnicalLibrary.create({category:'note',name:'S2C LIBRARY',reuseStatus:'reference'},{contentType:'code',contentText:'// S2C'});
  const backup=db.businessBackups.create({clientAccountId:client.id,backupType:'complete',label:'S2C BACKUP'});
  const file=path.join(temp,'S2C-document.txt');fs.writeFileSync(file,'S2C DOCUMENT');
  const document=db.clientDocuments.importPaths(client.id,[file],{category:'other',title:'S2C DOCUMENT'})[0];
  const targets=[['catalog',catA.id],['client',client.id],['prospect',prospect.id],['quote',quote.id],['project',project.id],['service_request',request.id],['intervention',intervention.id],['maintenance',subscription.id],['hour_pack',pack.id],['organization',org.id],['contact',contact.id],['client_document',document.id],['atoumweb_library',library.id],['backup_record',backup.id]];
  const before=snap();
  // Inherited ContractTermsBuilder loading synchronizes editable quotes (also in main).
  // Qualify those exact audit rows; every other row and all original logs must be unchanged.
  const readonly=()=>{
   const baseline=new Map(JSON.parse(before)),now=JSON.parse(snap());
   const oldLogs=baseline.get('activity_log'),logs=now.find(([name])=>name==='activity_log')[1],extra=logs.slice(oldLogs.length);
   if(JSON.stringify(logs.slice(0,oldLogs.length))!==JSON.stringify(oldLogs)||extra.length!==syncCalls.length)return false;
   if(extra.some((row,i)=>row.action!=='quote_contract_synced'||row.entity_type!=='quote'||row.entity_id!==quote.id||syncCalls[i]!==quote.id||row.summary!=='CGV synchronisées avec les prestations du devis'))return false;
   for(const [name,rows] of now){
    if(name==='activity_log')continue;
    if(name==='sqlite_sequence'){
     const old=baseline.get(name);if(JSON.stringify(rows.filter(r=>r.name!=='activity_log'))!==JSON.stringify(old.filter(r=>r.name!=='activity_log')))return false;
     const previous=old.find(r=>r.name==='activity_log')?.seq??0,current=rows.find(r=>r.name==='activity_log')?.seq??0;
     if(current!==previous+extra.length)return false;
    }else if(JSON.stringify(rows)!==JSON.stringify(baseline.get(name)))return false;
   }
   return true;
  };
  for(const [type,id] of targets){
   await search('S2C');await choose(type,id);await loaded(type,id);
   await wait('document.querySelector(".global-search input").value===""','clear only after loaded '+type);
   await wait(`document.activeElement.dataset.searchEntityId===${JSON.stringify(id)}`,'targeted focus '+type);
   test(await get(`document.activeElement.dataset.searchEntityId===${JSON.stringify(id)}`),'Exact '+type+' model and targeted focus');
   const now=snap();const oldTables=new Map(JSON.parse(before)),changed=JSON.parse(now).filter(([name,rows])=>JSON.stringify(oldTables.get(name))!==JSON.stringify(rows)).map(([name])=>name);
   test(readonly(),'Opening '+type+' preserves all business rows and qualifies inherited contract audit only '+JSON.stringify({changed}));
  }
  await search('S2C HOMONYME');await choose('catalog',catB.id);await loaded('catalog',catB.id);
  test(await get(`document.querySelector('.catalog-detail-panel').dataset.searchEntityId===${JSON.stringify(catB.id)}`),'Homonym resolves by id, not label');
  await js("[...document.querySelectorAll('.catalog-toolbar button')].find(b=>b.textContent.includes('+ Service')).click()");await sleep(60);
  await js("const e=document.querySelector('.catalog-form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'S2C UNSAVED CATALOG');e.dispatchEvent(new Event('input',{bubbles:true}));window.__catalogForm=document.querySelector('.catalog-form')");await sleep(60);
  const catalogDialogs=dialogs.length;
  await search('S2C HOMONYME');await choose('catalog',catA.id);await wait('document.querySelector(".search-results-panel [role=alert]")','catalog Stay');
  test(dialogs.length===catalogDialogs+1&&await get('window.__catalogForm===document.querySelector(".catalog-form")&&document.querySelector(".catalog-form input").value==="S2C UNSAVED CATALOG"'),'Catalogue Stay retains exact form and draft');
  answers.push(1);await choose('catalog',catA.id);await loaded('catalog',catA.id);
  test(dialogs.length===catalogDialogs+2&&await get('!document.querySelector(".catalog-form")'),'Catalogue explicit discard closes only unsaved creation');
  // Search response after clearing, after newer success, and obsolete error.
  searchMode='delayed';pending=[];await click('#header-search-trigger');await input('OLDER');await wait('document.querySelector(".global-search input").getAttribute("aria-busy")==="true"','loading');
  for(let i=0;i<50&&!pending.length;i++)await sleep(20);test(pending.length===1,'One debounced request');
  await input('');pending[0].resolve([{entityType:'catalog',entityId:catA.id,title:'STALE'}]);await sleep(140);
  test(await get('!document.querySelector(".search-result")&&!document.querySelector(".search-results-panel")'),'Clear invalidates old result');
  pending=[];await input('FIRST');for(let i=0;i<50&&!pending.length;i++)await sleep(20);
  await input('SECOND');for(let i=0;i<50&&pending.length<2;i++)await sleep(20);
  test(pending.length===2,'Two controlled generations');pending[1].resolve([{entityType:'catalog',entityId:catB.id,title:'CURRENT'}]);await wait('document.querySelector(".search-result strong")?.textContent==="CURRENT"','newest success');
  pending[0].reject(Error('obsolete error'));await sleep(120);
  test(await get('document.querySelector(".search-result strong").textContent==="CURRENT"&&!document.querySelector(".search-results-panel [role=alert]")'),'Old error cannot replace newer success');
  searchMode='error';await input('ERROR');await wait('document.querySelector(".search-results-panel [role=alert]")','service error');
  test(await get('document.querySelector(".global-search input").value==="ERROR"'),'Error preserves query and offers explicit retry');
  searchMode='normal';await click('.search-results-panel button');await wait('document.querySelector(".search-empty")?.textContent==="Aucun résultat"','explicit retry');
  test(await get('document.querySelector(".global-search input").getAttribute("role")==="combobox"'),'Combobox/listbox keyboard contract');
  // Unknown target: never fall back to Clients.
  const page=await get('document.querySelector(".aw-header-context strong").textContent');searchMode='unknown';await input('UNKNOWN');await wait('document.querySelector(".search-result")','unknown result');await click('.search-result');
  await wait('document.querySelector(".search-results-panel [role=alert]")','unsupported feedback');
  test(await get('document.querySelector(".aw-header-context strong").textContent')===page&&await get('document.querySelector(".global-search input").value==="UNKNOWN"'),'Unsupported type keeps module and query');
  searchMode='normal';await escape();await escape();
  // Existing quote editor: Stay, same identity, and pending.
  await search('S2C QUOTE');await choose('quote',quote.id);await loaded('quote',quote.id);
  await js(`window.__quotePane=document.querySelector('.quote-detail-panel');const e=document.querySelector('.quote-contract-preparation input[data-contract-field=context]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'S2C DIRTY');e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(80);
  const count=dialogs.length;await search('S2C HOMONYME');await choose('catalog',catA.id);await wait('document.querySelector(".search-results-panel [role=alert]")','Stay result');
  test(dialogs.length===count+1&&dialogs.at(-1).defaultId===0,'Exactly one Stay confirmation');
  test(await get('window.__quotePane===document.querySelector(".quote-detail-panel")&&document.querySelector(".quote-contract-preparation input[data-contract-field=context]").value==="S2C DIRTY"'),'Stay keeps exact mounted editor and draft');
  test(await get('document.querySelector(".global-search input").value==="S2C HOMONYME"'),'Stay keeps palette/query');
  await input('S2C QUOTE');await wait('document.querySelector("[data-search-type=quote]")','same quote');await choose('quote',quote.id);await wait('document.querySelector(".global-search input").value===""','same target');
  test(dialogs.length===count+1&&await get('window.__quotePane===document.querySelector(".quote-detail-panel")'),'Same identity neither remounts nor asks to discard');
  test(await get('document.querySelector(".quote-contract-preparation input[data-contract-field=context]").value==="S2C DIRTY"'),'Same identity keeps dirty text');
  const originalSave=db.quotePreparation.save.bind(db.quotePreparation);let rejectSave;
  db.quotePreparation.save=()=>new Promise((_resolve,reject)=>{rejectSave=reject;});
  try{
   await js("[...document.querySelectorAll('.quote-contract-preparation button')].find(b=>b.textContent.trim()==='Enregistrer la préparation').click()");
   await wait('!!document.querySelector(".quote-contract-preparation fieldset[disabled]")','pending real quote save');
   const pendingDialogs=dialogs.length;await search('S2C HOMONYME');await choose('catalog',catA.id);
   await wait('document.querySelector(".search-results-panel [role=alert]")','pending navigation refused');
   test(dialogs.length===pendingDialogs+1&&dialogs.at(-1).buttons.join('|')==='Rester','Pending save cannot be discarded or navigated away');
   test(await get('window.__quotePane===document.querySelector(".quote-detail-panel")&&document.querySelector(".quote-contract-preparation input[data-contract-field=context]").value==="S2C DIRTY"'),'Pending keeps exact quote and draft');
   rejectSave(Error('Injected quote save refusal'));await wait('!document.querySelector(".quote-contract-preparation fieldset[disabled]")','failed save completed');
   test(await get('document.querySelector(".quote-contract-preparation input[data-contract-field=context]").value==="S2C DIRTY"'),'Failed save never marks draft clean');
  }finally{db.quotePreparation.save=originalSave;}
  await search('S2C HOMONYME');answers.push(1);await choose('catalog',catA.id);await loaded('catalog',catA.id);
  test(db.quotePreparation.parameters(quote.id).conclusion.context!=='S2C DIRTY','Confirmed discard never saves quote draft');
  // A late catalog detail must not overwrite a newer one or clear a newer query.
  let reads=0,delayed=[];
  db.catalog.getItem=id=>{const value=originalGet(id);if(id===catB.id&&++reads>=2)return new Promise(resolve=>delayed.push(()=>resolve(value)));return value;};
  await search('S2C HOMONYME');await choose('catalog',catB.id);
  for(let i=0;i<60&&!delayed.length;i++)await sleep(20);test(delayed.length>0,'Delayed actual catalog detail, after readonly validation');
  await input('S2C HOMONYME ');await wait('document.querySelector("[data-search-id=\\"'+catA.id+'\\"]")','new query');await choose('catalog',catA.id);await loaded('catalog',catA.id);
  delayed.forEach(resolve=>resolve());await sleep(160);
  test(await get(`document.querySelector('.catalog-detail-panel').dataset.searchEntityId===${JSON.stringify(catA.id)}`),'Late catalog response cannot overwrite current identity');
  db.catalog.getItem=originalGet;
  // Invalid ID through historical event is reported without forced navigation.
  const stable=await get('document.querySelector(".aw-header-context strong").textContent');
  await js('window.dispatchEvent(new CustomEvent("atoumweb:navigate",{detail:{entityType:"quote",entityId:"missing-id",title:"MISSING TEMP"}}))');await sleep(120);
  test(await get('document.querySelector(".aw-header-context strong").textContent')===stable,'Missing historical target preserves stable view');
  await search('S2C');await choose('client',client.id);await loaded('client',client.id);
  await js("[...document.querySelectorAll('.client-toolbar button')].find(b=>b.textContent.includes('+ Nouveau client')).click()");await sleep(60);
  await js("const e=document.querySelector('.crm-form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'S2C UNSAVED CLIENT');e.dispatchEvent(new Event('input',{bubbles:true}));window.__clientForm=document.querySelector('.crm-form')");await sleep(60);
  const clientDialogs=dialogs.length;await search('S2C HOMONYME');await choose('catalog',catA.id);await wait('document.querySelector(".search-results-panel [role=alert]")','client draft Stay');
  test(dialogs.length===clientDialogs+1&&await get('window.__clientForm===document.querySelector(".crm-form")&&document.querySelector(".crm-form input").value==="S2C UNSAVED CLIENT"'),'Client search exit reuses UX01 and preserves draft and instance');
  answers.push(1);await choose('catalog',catA.id);await loaded('catalog',catA.id);
  test(dialogs.length===clientDialogs+2,'Client draft discarded only after one explicit confirmation');
  await js('window.__timer02c=document.querySelector(".global-timer")');
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
   await search('S2C HOMONYME');win.focus();win.webContents.focus();
   await js('document.querySelector(".global-search input").focus()');
   const keyboardIndex=await get('(()=>{const input=document.querySelector(".global-search input");return (Number(input.getAttribute("aria-activedescendant").split("-").at(-1))+1)%document.querySelectorAll(".search-result").length;})()');
   const keyboardId=await get(`document.querySelectorAll('.search-result')[${keyboardIndex}].dataset.searchId`);
   win.webContents.sendInputEvent({type:'keyDown',keyCode:'Down'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Down'});
   await wait(`document.querySelector('.global-search input').getAttribute('aria-activedescendant')==='global-search-result-${keyboardIndex}'`,'keyboard active option');
   win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
   await loaded('catalog',keyboardId);await wait('document.querySelector(".global-search input").value===""','keyboard opens loaded identity');
   test(await get(`document.querySelector('.catalog-detail-panel').dataset.searchEntityId===${JSON.stringify(keyboardId)}&&window.__timer02c===document.querySelector('.global-timer')&&document.querySelectorAll('.global-timer').length===1`),theme+' '+density+' keyboard identity and unique real timer');
  }
  win.setSize(760,720);win.webContents.setZoomFactor(1.25);await sleep(100);
  await search('S2C HOMONYME');await escape();
  test(await get('!document.querySelector(".search-results-panel")&&document.activeElement.matches(".global-search input")'),'Narrow window zoom125 Escape closes only palette with focus retained');
  win.webContents.setZoomFactor(1);win.setSize(1440,960);
  test(readonly(),'All navigation/query fault cases preserve business tables and original audit rows');
  console.log('02C_SEARCH_SCENARIOS passed');
 }finally{db.catalog.getItem=originalGet;db.contractTerms.syncQuote=originalSync;dialog.showMessageBoxSync=realDialog;ipcMain.removeHandler('crm:search:global');ipcMain.handle('crm:search:global',originalSearch);}
};

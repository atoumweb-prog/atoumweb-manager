module.exports=async({win,db,temp,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {dialog}=require('electron'),originalDialog=dialog.showMessageBoxSync,answers=[],dialogs=[];
 const originalSync=db.contractTerms.syncQuote.bind(db.contractTerms),syncCalls=[];
 db.contractTerms.syncQuote=id=>{const value=originalSync(id);syncCalls.push(id);return value;};
 const snapshot=()=>db.database.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid').filter(row=>name!=='settings'||row.key!=='ux_v2_visual_preferences_v1')]);
 let baseline;
 const checkpoint=()=>{baseline=new Map(snapshot());syncCalls.length=0;};
 const readonly=()=>{
  const current=snapshot(),logs=current.find(([name])=>name==='activity_log')[1],oldLogs=baseline.get('activity_log'),extra=logs.slice(oldLogs.length);
  if(JSON.stringify(logs.slice(0,oldLogs.length))!==JSON.stringify(oldLogs)||extra.length!==syncCalls.length||extra.some((row,i)=>row.action!=='quote_contract_synced'||row.entity_type!=='quote'||row.entity_id!==syncCalls[i]))return false;
  return current.every(([name,rows])=>name==='activity_log'||name==='sqlite_sequence'?(name==='activity_log'||JSON.stringify(rows.filter(row=>row.name!=='activity_log'))===JSON.stringify(baseline.get(name).filter(row=>row.name!=='activity_log'))&&(rows.find(row=>row.name==='activity_log')?.seq??0)===(baseline.get(name).find(row=>row.name==='activity_log')?.seq??0)+extra.length):JSON.stringify(rows)===JSON.stringify(baseline.get(name)));
 };
 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(75);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()`);await sleep(60);};
 const key=async(name,modifiers=[])=>{win.focus();win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:name,modifiers});win.webContents.sendInputEvent({type:'keyUp',keyCode:name,modifiers});await sleep(60);};
 const closeSearch=async()=>{await key('Escape');if(await get('document.querySelector(".aw-header-search").classList.contains("is-open")'))await key('Escape');};
 const search=async term=>{await click('#header-search-trigger');test(await get('document.activeElement.matches(".global-search input")'),'Search command focus in real journey');await input('.global-search input',term);await wait('!!document.querySelector(".search-result")','search results');};
 const choose=async(type,id)=>click(`[data-search-type="${type}"][data-search-id="${id}"]`);
 const loaded=(type,id)=>wait(`!!document.querySelector('[data-search-entity-type="${type}"][data-search-entity-id="${id}"]')`,'loaded exact '+type);
 try{
 await navigate('Accueil');
 for(const startWidth of [1510,1050]){
 win.setSize(startWidth,1030);await sleep(100);
 await click('#header-search-trigger');
 await input('.global-search input','');
 test(await get('document.activeElement.matches(".global-search input")'),'Real search trigger focuses combobox immediately');
 win.focus();win.webContents.focus();
 win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(70);
 await wait('!document.querySelector(".aw-header-search.is-open")&&document.activeElement.id==="header-search-trigger"','native Escape completed before the next typing/resize gesture');
 test(await get('!document.querySelector(".aw-header-search.is-open")&&document.activeElement.id==="header-search-trigger"'),'Native Escape acknowledged before a separate typing gesture, no fixed-delay assumption');
 const inlineVisible=await get('document.querySelector(".global-search input").getClientRects().length>0');
 if(!inlineVisible)await click('#header-search-trigger');
 await js("const e=document.querySelector('.global-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'RESIZE SEARCH TEMP');e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()");await sleep(70);
 test(await get('document.activeElement.matches(".global-search input")&&document.activeElement.getClientRects().length>0'),'Typing starts in a genuinely visible and focused input '+startWidth);
 console.log('02E_RESIZE_BASELINE '+JSON.stringify({requestedWidth:startWidth,inlineVisible,...await get('({actualWidth:innerWidth,focused:document.activeElement.matches(".global-search input")})')}));
 win.setSize(850,720);await sleep(100);
 test(await get('document.activeElement.matches(".global-search input")&&document.activeElement.getBoundingClientRect().width>0&&document.activeElement.value==="RESIZE SEARCH TEMP"'),'Narrow resize preserves visible focused search and text '+JSON.stringify(await get('({active:document.activeElement.tagName,search:document.activeElement.matches(".global-search input"),display:getComputedStyle(document.querySelector(".aw-header-search")).display})')));
 await closeSearch();win.setSize(1510,1030);await sleep(70);
 }
 const org=db.crm.createOrganization({name:'JOURNEY TEMP'}),client=db.crm.createClient({organizationId:org.id});
 const archived=db.crm.createProspect({organizationId:org.id});db.workflow.archiveProspect(archived.id,true);
 const catalog=db.catalog.create({type:'service',name:'JOURNEY CATALOG',canonicalCode:'AW-JOURNEY'},{priceMode:'fixed',priceCents:1000});
 const quote=db.quotes.create({clientAccountId:client.id,subject:'JOURNEY QUOTE'});
 const project=await get("window.atoumweb.projects.projects.createInternal({name:'JOURNEY PROJECT'})");
 const library=db.atoumWebTechnicalLibrary.create({name:'JOURNEY LIBRARY',category:'note',reuseStatus:'reference'},{contentType:'code',contentText:'// TEMP reference, never executed'});
 checkpoint();
 // Historical UI is independent of the new Conversion projection; no CRM file changed here.
 await navigate('Prospection');await js("[...document.querySelectorAll('.prospect-view-switch button')].find(b=>b.textContent.startsWith('Historique')).click()");
 await wait('!!document.querySelector(".history-prospect-row")','archived history fixture');await click('.history-prospect-row');
 await loaded('prospect',archived.id);
 test(await get(`document.querySelector('.history-view-stack .prospect-detail-panel').dataset.searchEntityId===${JSON.stringify(archived.id)}`),'Historical actual pane acknowledges exact archived identity');
 // Favorite persists through a real reload; returns to the item, not merely the catalogue page.
 await navigate('Accueil');await click('[aria-label="Épingler Offres & Tarifs"]');
 win.webContents.reload();await wait('!!document.querySelector("[data-nav-context=favorite][data-nav-module=\\"Offres & Tarifs\\"]")','favorite reload');
 test(await get('!!document.querySelector("[data-nav-context=favorite][data-nav-module=\\"Offres & Tarifs\\"]")'),'Workspace favorite persists after reload');
 await search('JOURNEY CATALOG');await choose('catalog',catalog.id);await loaded('catalog',catalog.id);
 test(await get(`document.querySelector('.catalog-detail-panel').dataset.searchEntityId===${JSON.stringify(catalog.id)}`),'Favorite then search opens exact catalogue model');
 test(readonly(),'History/favorite/reload/search preserves all business tables and nonvisual settings');
 await search('JOURNEY QUOTE');await choose('quote',quote.id);await loaded('quote',quote.id);
 const context='.quote-contract-preparation input[data-contract-field=context]';
 await wait(`!!document.querySelector(${JSON.stringify(context)})`,'real contract editor');await input(context,'JOURNEY UNSAVED');
 await js('window.__journeyQuote=document.querySelector(".quote-detail-panel")');
 const count=dialogs.length;await search('JOURNEY PROJECT');await choose('project',project.id);await wait('!!document.querySelector(".search-results-panel [role=alert]")','Stay response');
 test(dialogs.length===count+1&&dialogs.at(-1).defaultId===0&&await get(`window.__journeyQuote===document.querySelector('.quote-detail-panel')&&document.querySelector(${JSON.stringify(context)}).value==='JOURNEY UNSAVED'`),'Search→Project Stay preserves exact mounted Quote and text, one confirmation');
 answers.push(1);await choose('project',project.id);await loaded('project',project.id);
 test(db.quotePreparation.parameters(quote.id).conclusion.context!=='JOURNEY UNSAVED','Confirmed discard does not save contract draft');
 test(readonly(),'Quote→Project navigation preserves business rows, only inherited contract audit qualified');
 // A narrow resize while typing a real module editor must not open the header search.
 await navigate('Clients');await js("[...document.querySelectorAll('.client-toolbar button')].find(b=>b.textContent.includes('+ Nouveau client')).click()");await sleep(70);
 await input('.crm-form input','MODULE TYPING TEMP');win.setSize(850,720);await sleep(70);
 test(await get('document.activeElement.matches(".crm-form input")&&!document.querySelector(".aw-header-search.is-open")&&document.activeElement.value==="MODULE TYPING TEMP"'),'Resize does not steal focus from module editor or invoke a command');
 answers.push(1);win.setSize(1510,1030);await navigate('Accueil');
 await get("window.atoumweb.time.start({activityLabel:'JOURNEY TIMER TEMP',category:'development',billable:false})");await js('window.dispatchEvent(new CustomEvent("atoumweb:time-changed"))');await wait('!!document.querySelector(".global-timer.running")','real timer');
 const session=await get('window.atoumweb.time.active()');await js('window.__journeyTimer=document.querySelector(".global-timer")');
 checkpoint();
 await navigate('Gestion des temps');await navigate('Accueil');await click('#header-mode');
 test((await get('window.atoumweb.time.active()')).id===session.id&&await get('window.__journeyTimer===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1'),'Home and module navigation keep the same live timer/session');
 test(readonly(),'Navigation/presentation does not pause, stop or duplicate the actual session');
 await get(`window.atoumweb.time.stop(${JSON.stringify(session.id)})`);await js('window.dispatchEvent(new CustomEvent("atoumweb:time-changed"))');await wait('!document.querySelector(".global-timer.running")','stop only fixture timer');
 const recovery=await get("window.atoumweb.time.start({activityLabel:'JOURNEY RECOVERY TEMP',category:'development',billable:false})");
 db.database.run('UPDATE time_sessions SET updated_at=? WHERE id=?',[new Date(Date.now()-3600000).toISOString(),recovery.id]);
 await js('window.dispatchEvent(new CustomEvent("atoumweb:time-changed"))');await wait('!!document.querySelector(".timer-recovery-popover")','real recovery dialogue');
 await click('#header-mode');win.setSize(850,720);await sleep(70);
 test(await get('!!document.querySelector(".timer-recovery-popover")&&!document.querySelector(".aw-header-search.is-open")&&document.querySelector("#header-search-trigger").disabled'),'Recovery owns focus/presentation, resize cannot launch search');
 test((await get('window.atoumweb.time.active()')).id===recovery.id,'Presentation leaves actual recovery session unchanged');
 await click('.timer-recovery-popover .primary-button');await wait('!document.querySelector(".timer-recovery-popover")','explicit recovery');
 await get(`window.atoumweb.time.stop(${JSON.stringify(recovery.id)})`);await js('window.dispatchEvent(new CustomEvent("atoumweb:time-changed"))');await wait('!document.querySelector(".global-timer.running")','recovered fixture stopped');win.setSize(1510,1030);
 checkpoint();
 await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-library-item',{detail:${JSON.stringify(library.id)}}))`);await loaded('atoumweb_library',library.id);
 await click('#header-options-trigger');await click('#header-library');
 const compact=await get('document.querySelector(".aw-workspace-header").dataset.headerCompact');
 await js('window.dispatchEvent(new CustomEvent("atoumweb:open-contract-library",{detail:"all"}))');await wait('!!document.querySelector(".contract-library-page,.contract-library-stack")||document.querySelector(".page-heading h1")?.textContent==="Documents & Contrats"','real contract module');
 await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-library-item',{detail:${JSON.stringify(library.id)}}))`);await loaded('atoumweb_library',library.id);
 test(await get('document.querySelector(".content-area").classList.contains("library-header-collapsed")&&document.querySelector(".aw-workspace-header").dataset.headerCompact')===compact,'Library→Contracts→Library retains independent presentation states and exact target');
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
  await click('#header-search-trigger');test(await get('document.activeElement.matches(".global-search input")'),theme+'/'+density+' search focus');
  await input('.global-search input','JOURNEY CATALOG');await wait('!!document.querySelector(".search-result")','results in variant');
  await key('Tab');test(await get('!document.activeElement.matches(".global-search input")&&document.querySelector(".global-search input").value==="JOURNEY CATALOG"'),theme+'/'+density+' Tab keeps query');
  await key('Tab',['shift']);test(await get('document.activeElement.matches(".global-search input")'),theme+'/'+density+' Shift Tab focus');
  await closeSearch();test(await get('document.activeElement.id==="header-search-trigger"'),theme+'/'+density+' Escape returns trigger focus');
 }
 test(await get('document.querySelectorAll(".global-timer").length===1'),'No new timer after all journeys');
 test(readonly(),'Library/Contracts/keyboard/theme journey keeps business rows and nonvisual settings');
 console.log('02E_JOURNEYS passed');
 }finally{dialog.showMessageBoxSync=originalDialog;db.contractTerms.syncQuote=originalSync;}
};

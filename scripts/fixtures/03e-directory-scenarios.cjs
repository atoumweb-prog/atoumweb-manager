'use strict';

module.exports=async context=>{

 // Same real App, IPC, SQLite and IDs through the full commercial journey.

 await require('./integration-02-03-scenarios.cjs')(context);

 await require('./03d-client-scenarios.cjs')(context);

 const {win,db,evalUI:js,get,wait,navigate,test,sleep}=context;

 const {dialog}=require('electron'),fs=require('node:fs'),path=require('node:path');

 const originalDialog=dialog.showMessageBoxSync,answers=[],dialogs=[];

 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};

 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click()`);await sleep(70);};

 const textClick=async(selector,text)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()`);await sleep(70);};

 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()`);await sleep(60);};

 const originalSave=db.crm.saveDirectoryOrganization.bind(db.crm);let saveMode='normal',releaseSave;

 db.crm.saveDirectoryOrganization=(...args)=>{

  if(saveMode==='pending')return new Promise((resolve,reject)=>{releaseSave={resolve:()=>{try{resolve(originalSave(...args));}catch(e){reject(e);}},reject};});

  const saved=originalSave(...args);if(saveMode==='lost'){saveMode='normal';throw Error('TEST03E response lost after commit');}return saved;

 };

 try{

  const journeyQuote=db.quotes.list().find(q=>q.subject==='CONVERGENCE QUOTE');

  const convertedId=db.quotes.get(journeyQuote.id).acceptedClientAccountId;

  const converted=db.crm.listClients().find(c=>c.id===convertedId);

  test(!!converted,'Combined 03A-C journey produced the exact Client');

  const org=db.crm.getDirectoryOrganization(converted.organizationId);

  const other=db.crm.createOrganization({name:'TEST03E OTHER'});

  const timerSessions=db.database.get('SELECT count(*) n FROM time_sessions').n;
  await navigate('Annuaire');await js(`document.querySelector('[data-directory-id="${org.id}"]').focus()`);win.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});

  await wait(`document.querySelector('.directory-detail-panel')?.dataset.searchEntityId===${JSON.stringify(org.id)}`,'exact organization');

  test(await get('document.querySelector(".directory-detail-panel").textContent.includes("Ouvrir le client")'),'Converted organization links its actual Client');
  const originalSetting=db.setSetting.bind(db);let layoutWrites=0;db.setSetting=(key,value)=>{if(key==='ux_v2_visual_preferences_v1')layoutWrites++;return originalSetting(key,value);};
  await js("document.querySelector('.directory-splitter').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:500}));window.dispatchEvent(new PointerEvent('pointermove',{clientX:400}));window.dispatchEvent(new PointerEvent('pointermove',{clientX:450}));");test(layoutWrites===0,'Directory visual resize makes no intermediate writes');
  await js("window.dispatchEvent(new PointerEvent('pointerup'))");test(layoutWrites===1,'Directory width persists once at gesture end');db.setSetting=originalSetting;


  await textClick('.directory-status-row button','Ouvrir le client');await wait(`document.querySelector('.client-summary-panel')?.dataset.searchEntityId===${JSON.stringify(converted.id)}`,'exact linked Client');

  test(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8'),'Cross navigation retains eight-tab Client');

  await navigate('Annuaire');await click(`[data-directory-id="${org.id}"]`);await textClick('.directory-status-row button','Modifier');

  await input('.directory-editor input','TEST03E UNSAVED');await js('window.__directoryEditor=document.querySelector(".directory-editor");window.__directoryInput=document.querySelector(".directory-editor input")');

  const n=dialogs.length;await click('.directory-detail-panel .close-detail');

  test(dialogs.length===n+1&&await get('window.__directoryInput.value==="TEST03E UNSAVED"&&window.__directoryInput.isConnected'),'Close Stay preserves exact Annuaire draft once');

  await textClick('.directory-view-tabs button','Contacts');test(dialogs.length===n+2&&await get('window.__directoryEditor.isConnected'),'Switching identity views asks once, Stay retains editor');

  await click(`[data-directory-id="${other.id}"]`);test(dialogs.length===n+3&&await get('window.__directoryInput.value==="TEST03E UNSAVED"'),'Selecting another identity preserves refused draft');

  await input('.directory-toolbar input','NO MATCH');test(await get('window.__directoryEditor.isConnected'),'Filter hiding selected identity never unmounts editor');await input('.directory-toolbar input','');

  await click('.directory-detail-panel .operation-detail-expand');test(await get('window.__directoryEditor===document.querySelector(".directory-editor")'),'Enlarging keeps Annuaire editor mounted');

  const captures=[],captureDir=process.env.ATOUMWEB_UXV2_03E_CAPTURES;

  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){

   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(60);

   test(await get('window.__directoryInput.value==="TEST03E UNSAVED"&&window.__directoryInput.isConnected&&parseFloat(getComputedStyle(window.__directoryInput).fontSize)>=14'),'Annuaire theme/density '+theme+'/'+density);

   await js('document.querySelector(".directory-editor").scrollIntoView({block:"center"})');
   if(captureDir)captures.push(await require('./verified-crm-capture.cjs')({win,js,test,folder:captureDir,file:theme+'-'+density+'.png',theme,density,scene:'directory-organization-dirty'}));

  }

  win.setSize(900,720);win.webContents.setZoomFactor(1.25);await sleep(90);test(await get('window.__directoryInput.isConnected'),'Annuaire narrow/zoom preserves editor');win.webContents.setZoomFactor(1);win.setSize(1510,1030);

  // External edit while dirty: current form must not be overwritten by notification.

  const fresh=db.crm.getOrganization(org.id);db.crm.updateOrganization(org.id,{...fresh,name:'TEST03E EXTERNAL'});

  await js('window.dispatchEvent(new Event("atoumweb:changed"))');await sleep(130);

  test(await get('window.__directoryInput.value==="TEST03E UNSAVED"'),'External refresh preserves local draft');

  await click('.directory-editor-footer button');await wait('document.querySelector(".directory-page-stack > [role=alert]")','conflict');

  test(db.crm.getOrganization(org.id).name==='TEST03E EXTERNAL'&&await get('window.__directoryInput.value==="TEST03E UNSAVED"'),'Conflict refuses overwrite, preserves both writers');

  answers.push(1);await click('.directory-detail-panel .close-detail');await wait('!document.querySelector(".directory-detail-panel")','explicit discard');test(dialogs.length===n+4,'Explicit discard has exactly one confirmation');
  test(await get('document.activeElement.dataset.directoryId')===org.id,'Closing Directory returns keyboard focus to same identity row');

  // Lost reply after atomic creation: same operation token must not create a second identity.

  await click('.directory-toolbar .primary-button');await input('.directory-editor input','TEST03E RETRY');

  saveMode='lost';const countBefore=db.database.get('SELECT count(*) n FROM organizations').n;

  await click('.directory-editor-footer button');await wait('document.querySelector(".directory-page-stack > [role=alert]")','lost reply');

  const created=db.crm.listDirectoryOrganizations().find(o=>o.name==='TEST03E RETRY');test(!!created&&db.database.get('SELECT count(*) n FROM organizations').n===countBefore+1,'Lost reply occurred after exactly one creation');

  await click('.directory-editor-footer button');await wait(`document.querySelector('.directory-detail-panel')?.dataset.searchEntityId===${JSON.stringify(created.id)}`,'same identity replay');

  test(db.database.get('SELECT count(*) n FROM organizations').n===countBefore+1,'Retry returns same ID, no second organization');

  await wait('document.querySelector(".directory-verification button")','verification loaded');await click('.directory-verification button');

  await wait('document.querySelector(".directory-verification").textContent.includes("Déclarée le")','explicit verification');

  test(db.crm.directoryVerification('organization',created.id).verifiedAt!==null,'Real verification event recorded, not inferred from modification time');

  // Pending prevents navigation; failure retains input, retry uses existing UI.

  await textClick('.directory-status-row button','Modifier');await input('.directory-editor input','TEST03E PENDING');saveMode='pending';await click('.directory-editor-footer button');

  for(let i=0;i<50&&!releaseSave;i++)await sleep(20);test(!!releaseSave,'Annuaire save genuinely pending');

  const beforePending=dialogs.length;await click('.directory-detail-panel .close-detail');test(dialogs.length===beforePending+1&&await get('document.querySelector(".directory-editor input").matches(":disabled")'),'Pending refuses close and disables edits');

  releaseSave.reject(Error('TEST03E save refused'));await wait('document.querySelector(".directory-page-stack > [role=alert]")','save refusal');

  test(await get('document.querySelector(".directory-editor input").value==="TEST03E PENDING"'),'Refused save keeps draft');

  saveMode='normal';await click('.directory-editor-footer button');await wait('!document.querySelector(".directory-editor")','saved after failure');

  test(db.crm.getOrganization(created.id).name==='TEST03E PENDING','Explicit retry saves same identity');

  await wait('document.querySelector(".directory-verification").textContent.includes("ont changé")','verification now stale');

  test(db.crm.directoryVerification('organization',created.id).verifiedAt!==null,'Prior human verification retained as provenance');

  await click('.directory-detail-panel .close-detail');await textClick('.directory-view-tabs button','Contacts');await click('.directory-toolbar .primary-button');

  await input('.directory-editor label:nth-child(1) input','TEST03E PERSON');await input('.directory-editor label:nth-child(2) input','SHARED');await input('.directory-editor input[inputmode=email]','person03e@example.test');

  await js(`const e=document.querySelector('.directory-editor select');e.value=${JSON.stringify(created.id)};e.dispatchEvent(new Event('change',{bubbles:true}));`);await sleep(60);await click('.directory-editor-footer button');

  await wait('document.querySelector(".directory-detail-panel")?.dataset.searchEntityType==="contact"&&!document.querySelector(".directory-editor")','created person');

  const person=db.crm.listDirectoryContacts().find(item=>item.firstName==='TEST03E PERSON');test(person.organizationId===created.id&&db.crm.listContactMethods('contact',person.id)[0].value==='person03e@example.test','Contact creation retains exact organization and coordinates');

  await textClick('.directory-status-row button','Modifier');await input('.directory-editor input','LOCAL PERSON');

  db.crm.updateContact(person.id,{...db.crm.getContact(person.id),jobTitle:'EXTERNAL TITLE'});await js('window.dispatchEvent(new Event("atoumweb:changed"))');await sleep(120);await click('.directory-editor-footer button');await wait('document.querySelector(".directory-page-stack > [role=alert]")','contact conflict');

  test(await get('document.querySelector(".directory-editor input").value==="LOCAL PERSON"')&&db.crm.getContact(person.id).jobTitle==='EXTERNAL TITLE','Contact conflict preserves local text and external identity');

  answers.push(1);await click('.directory-detail-panel .close-detail');

  const primary=db.crm.listDirectoryContacts().find(item=>item.firstName==='TEST03D'&&item.lastName==='CONTACT');

  await click(`[data-directory-id="${primary.id}"]`);await textClick('.directory-status-row button','Ouvrir le client');await wait(`document.querySelector('.client-summary-panel')?.dataset.searchEntityId===${JSON.stringify(primary.clientId)}`,'contact-linked Client');

  test(await get('document.querySelector(".client-summary-panel").dataset.searchEntityId')===primary.clientId,'Contact navigation opens exact linked Client, not another homonym');

  await wait('[...document.querySelectorAll("#client-panel-summary button")].some(e=>e.textContent.includes("Annuaire"))','Client identity fully loaded');
  await textClick('#client-panel-summary .contact-tab-heading button','Modifier');await input('#client-panel-summary .contact-inline-form input','LOCAL CLIENT CONTACT');
  const sharedOrganization=db.crm.getOrganization(primary.organizationId);db.crm.updateOrganization(primary.organizationId,{...sharedOrganization,city:'EXTERNAL CITY'});await js('window.dispatchEvent(new Event("atoumweb:changed"))');await sleep(130);
  await click('#client-panel-summary .contact-inline-form .primary-button');await wait('document.body.textContent.includes("Conflit Annuaire")','Client shared identity conflict');
  test(await get('document.querySelector("#client-panel-summary .contact-inline-form input").value==="LOCAL CLIENT CONTACT"')&&db.crm.getContact(primary.id).firstName==='TEST03D'&&db.crm.getOrganization(primary.organizationId).city==='EXTERNAL CITY','Client coordinate edit cannot overwrite shared Annuaire identity or partially rename Contact');
  answers.push(1);await textClick('#client-panel-summary .contact-inline-form button','Annuler');

  await textClick('#client-panel-summary button','Ouvrir l’organisation dans l’Annuaire');await wait(`document.querySelector('.directory-detail-panel')?.dataset.searchEntityId===${JSON.stringify(primary.organizationId)}`,'Client back to same identity');

  test(await get('document.querySelector(".directory-detail-panel").dataset.searchEntityId')===primary.organizationId,'Client-to-Annuaire keeps common organization');

  // Actual IPC list response delivered after a different identity/view has become active.

  const originalList=db.crm.listDirectoryOrganizations.bind(db.crm);let hold=false,finishList,rejectList;

  db.crm.listDirectoryOrganizations=(...args)=>{const rows=originalList(...args);if(!hold)return rows;hold=false;return new Promise((resolve,reject)=>{finishList=()=>resolve(rows);rejectList=reject;});};

  try{

    hold=true;await textClick('.directory-toolbar button','Actualiser');for(let i=0;i<50&&!finishList;i++)await sleep(20);test(!!finishList,'Old directory list actually held');

    await textClick('.directory-view-tabs button','Contacts');await click(`[data-directory-id="${person.id}"]`);finishList();await sleep(130);

    test(await get('document.querySelector(".directory-detail-panel").dataset.searchEntityId')===person.id,'Late organization list cannot replace Contact selection');

    finishList=null;hold=true;await textClick('.directory-toolbar button','Actualiser');for(let i=0;i<50&&!finishList;i++)await sleep(20);test(!!rejectList,'Old directory error actually armed');

    await textClick('.directory-view-tabs button','Organisations');await click(`[data-directory-id="${other.id}"]`);rejectList(Error('OBSOLETE_DIRECTORY_FAILURE'));await sleep(130);

    test(await get('document.querySelector(".directory-detail-panel").dataset.searchEntityId')===other.id&&!await get('document.body.textContent.includes("OBSOLETE_DIRECTORY_FAILURE")'),'Obsolete failure does not replace identity or add false error');

  }finally{db.crm.listDirectoryOrganizations=originalList;}

  await wait('document.querySelector(".directory-verification button")','current verification');
  await js('document.querySelector(".directory-detail-panel .contact-method-add").closest("details").open=true');await input('.directory-detail-panel .contact-method-add input','0612345678');
  await click('.directory-verification button');await wait('document.querySelector(".directory-verification [role=alert]")','unsaved method refuses verification');
  test(db.crm.directoryVerification('organization',other.id).verifiedAt===null&&await get('document.querySelector(".contact-method-add input").value==="0612345678"'),'Unsaved coordinate never becomes a human verification event');
  answers.push(1);await click('.directory-detail-panel .close-detail');
  test(await get('document.querySelectorAll(".global-timer").length===1')&&db.database.get('SELECT count(*) n FROM time_sessions').n===timerSessions,'Client and Directory preserve unique real timer without starting a session');
  console.log('DIRECTORY03E_EVIDENCE '+JSON.stringify({captures,dialogs:dialogs.length,convertedClientId:converted.id,organizationId:org.id,onlyTemp:true}));

 }finally{db.crm.saveDirectoryOrganization=originalSave;dialog.showMessageBoxSync=originalDialog;}

};


'use strict';
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {dialog}=require('electron'),fs=require('node:fs'),path=require('node:path');
 const originalDialog=dialog.showMessageBoxSync,answers=[],dialogs=[];
 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(60);};
 const textClick=async(selector,text)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()`);await sleep(60);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()`);await sleep(60);};
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
 const captureDir=process.env.ATOUMWEB_UXV2_03D_CAPTURES;
 const originalQuotes=db.quotes.list.bind(db.quotes);let failQuotes=false;
 db.quotes.list=(...args)=>{if(failQuotes)throw Error('TEST03D quotes unavailable');return originalQuotes(...args);};
 try{
  const org=db.crm.createOrganization({name:'TEST03D CLIENT'});
  const contact=db.crm.createContact({organizationId:org.id,firstName:'TEST03D',lastName:'CONTACT'});
  const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id});
  const second=db.crm.createClient({organizationId:db.crm.createOrganization({name:'TEST03D OTHER'}).id});
  const prospect=db.crm.createProspect({organizationId:org.id,contactId:contact.id});
  test(db.crm.convertProspectToClient(prospect.id).clientId===client.id,'Conversion reuses exact Client identity');
  const quote=db.quotes.create({clientAccountId:client.id,subject:'TEST03D QUOTE'});
  const baseline=snapshot();
  const oldSetSetting=db.setSetting.bind(db);let widthWrites=0;db.setSetting=(key,value)=>{if(key==='ux_v2_visual_preferences_v1')widthWrites++;return oldSetSetting(key,value);};
  await navigate('Clients');await textClick('.clients-table tr',client.displayName);
  await wait(`document.querySelector('.client-summary-panel')?.dataset.searchEntityId===${JSON.stringify(client.id)}&&!document.querySelector('.client-summary-panel [role=status]')`,'loaded Client');
  test(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8'),'Eight accessible tabs');
  test(await get('document.querySelectorAll(".client-summary-panel [role=tabpanel]").length===8'),'Eight panels mounted together');
  const widthBefore=widthWrites;
  await js(`document.querySelector('.client-splitter').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:600}));window.dispatchEvent(new PointerEvent('pointermove',{clientX:550}));window.dispatchEvent(new PointerEvent('pointermove',{clientX:500}));`);
  test(widthWrites===widthBefore,'Column resize preview has no preference writes');
  await js("window.dispatchEvent(new PointerEvent('pointerup'))");test(widthWrites===widthBefore+1,'Exactly one preference write at resize end through real IPC');
  await js('window.__clientPanel=document.querySelector(".client-summary-panel");window.__clientContacts=document.querySelector("#client-panel-contacts")');
  await click('#client-tab-contacts');await textClick('#client-panel-contacts button','+ Ajouter');
  await input('#client-panel-contacts .contact-inline-form input','TEST03D UNSAVED');
  await js('window.__clientInput=document.querySelector("#client-panel-contacts .contact-inline-form input")');
  for(const id of ['commercial','contracts','projects','operations','documents','history','summary','contacts']){
   await click('#client-tab-'+id);
   test(await get('window.__clientPanel===document.querySelector(".client-summary-panel")&&window.__clientContacts===document.querySelector("#client-panel-contacts")&&window.__clientInput.value==="TEST03D UNSAVED"'),'Tab '+id+' retains component identity and draft');
  }
  await click('.client-detail-expand');test(await get('window.__clientInput===document.querySelector("#client-panel-contacts .contact-inline-form input")'),'Enlarging preserves editor identity');
  await input('.client-toolbar .inline-search','NO MATCH');test(await get('document.querySelectorAll(".clients-table tbody tr.selected-row").length===0&&window.__clientInput.isConnected'),'Filtering out selected row keeps mounted Client');
  await input('.client-toolbar .inline-search','');
  const n=dialogs.length;await click('.client-summary-panel .close-detail');
  test(dialogs.length===n+1&&await get('window.__clientInput.value==="TEST03D UNSAVED"&&window.__clientInput.isConnected'),'Close Stay asks exactly once and retains text');
  const originalAdd=db.clientContacts.add.bind(db.clientContacts);let rejectSave;
  db.clientContacts.add=()=>new Promise((resolve,reject)=>{rejectSave=reject;});
  await click('#client-tab-contacts');await input('#client-panel-contacts .contact-inline-form label:nth-child(2) input','PENDING');await click('#client-panel-contacts .contact-inline-form button[type=submit]');
  for(let i=0;i<50&&!rejectSave;i++)await sleep(20);
  test(typeof rejectSave==='function','Contact persistence is actually pending');
  const pendingDialogs=dialogs.length;await click('.client-summary-panel .close-detail');test(dialogs.length===pendingDialogs+1&&await get("window.__clientInput.isConnected&&window.__clientInput.matches(':disabled')"),'Pending prevents closing and editing');
  rejectSave(Error('TEST03D contact save refused'));await wait('document.querySelector("#client-panel-contacts .form-error")','save error');
  test(await get("window.__clientInput.value==='TEST03D UNSAVED'&&!window.__clientInput.matches(':disabled')"),'Failed save preserves exact draft for retry');db.clientContacts.add=originalAdd;
  await click('#client-tab-commercial');test(await get(`document.querySelector('#client-panel-commercial').textContent.includes(${JSON.stringify(quote.number)})`),'Commercial reads exact linked Quote');
  await click('#client-tab-history');test(await get('document.querySelector("#client-panel-history").textContent.includes("Client")'),'Client history remains available');
  await js('document.querySelector("#client-tab-history").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Right'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Right'});await sleep(80);
  test(await get('document.activeElement.id==="client-tab-summary"'),'Native ArrowRight wraps focus to Summary');
  const captures=[];
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
   await sleep(70);test(await get('window.__clientInput.isConnected&&window.__clientInput.value==="TEST03D UNSAVED"'),'Theme/density retains draft '+theme+'/'+density);
   test(await get("parseFloat(getComputedStyle(window.__clientInput).fontSize)>=14"),'Functional text >=14px '+theme+'/'+density);
   for(const tab of ['summary','contacts','commercial','contracts','projects','operations','documents','history']){
    await click('#client-tab-'+tab);test(await get(`document.querySelector('#client-panel-${tab}').hidden===false&&document.querySelector('#client-tab-${tab}').getAttribute('aria-selected')==='true'`),'Visible tab '+tab+'/'+theme+'/'+density);
    if(captureDir)captures.push(await require('./verified-crm-capture.cjs')({win,js,test,folder:captureDir,file:theme+'-'+density+'-'+tab+'.png',theme,density,scene:'client-'+tab}));
   }
  }
  win.setSize(900,720);win.webContents.setZoomFactor(1.25);await sleep(100);test(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8&&window.__clientInput.isConnected'),'Narrow window and zoom retain tabs/editor');
  win.webContents.setZoomFactor(1);win.setSize(1510,1030);
  test(snapshot()===baseline,'Selection/filter/tabs/theme/zoom produce no business writes');
  answers.push(1);await click('.client-summary-panel .close-detail');test(dialogs.length===n+3&&await get('!document.querySelector(".client-summary-panel")'),'Explicit discard closes Client exactly once');
  test(await get('document.activeElement.closest("[data-client-id]")?.dataset.clientId')===client.id,'Closing Client restores exact row action after filter reconstructed it');
  failQuotes=true;await textClick('.clients-table tr',client.displayName);await wait('document.querySelector(".client-summary-panel [role=alert]")','partial quote failure');
  test(await get('document.querySelector(".client-summary-panel").textContent.includes("TEST03D quotes unavailable")'),'Partial service failure is explicit');
  await click('#client-tab-contacts');await wait('document.querySelector("#client-panel-contacts .contact-card")','independent Contacts');test(await get('document.querySelector("#client-panel-contacts").textContent.includes("TEST03D CONTACT")'),'Successful contacts survive Quote service failure');
  failQuotes=false;await textClick('.client-summary-panel [role=alert] button','Réessayer');await wait('!document.querySelector(".client-summary-panel [role=alert]")','explicit recovery');
  await click('#client-tab-summary');await textClick('#client-panel-summary button','Modifier la note de relation');
  await input('#client-panel-summary textarea','TEST03D relation dated');await textClick('#client-panel-summary button','Enregistrer la note');await wait('!document.querySelector("#client-panel-summary textarea")','relation saved');
  test(db.crm.listClients({includeArchived:true}).find(item=>item.id===client.id).relationshipNote==='TEST03D relation dated','Real UI saves only relationship note');
  test(db.crm.listActivity('client',client.id).some(e=>e.action==='relationship_note_changed'),'Relationship note change has dated history');
  await textClick('.clients-table tr',second.displayName);await wait(`document.querySelector('.client-summary-panel')?.dataset.searchEntityId===${JSON.stringify(second.id)}`,'second Client');
  test(await get('!document.querySelector("#client-panel-contacts .contact-inline-form")'),'Changing Client never reassigns former draft');
  await input('.client-toolbar .inline-search','NO MATCH LAST');await js('document.querySelector(".client-summary-panel .close-detail").focus()');await click('.client-summary-panel .close-detail');
  await wait('document.activeElement.matches(".client-toolbar .inline-search")','filtered Client close focus');test(await get('document.activeElement.value')==='NO MATCH LAST','Closing Client hidden by filter restores query focus without erasing it');await input('.client-toolbar .inline-search','');
  console.log('CLIENT03D_EVIDENCE '+JSON.stringify({captures,dialogs:dialogs.length,onlyTemp:true}));
 }finally{db.quotes.list=originalQuotes;dialog.showMessageBoxSync=originalDialog;}
};

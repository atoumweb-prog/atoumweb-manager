'use strict';
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path'),{dialog}=require('electron');
 const org=db.crm.createOrganization({name:'Atelier Horizon',city:'Lyon'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'04 00 00 00 00'});
 const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id,nextActionAt:'2026-10-20T09:00:00.000Z',nextActionText:'Faire le point sur le site vitrine',relationshipNote:'Privilégier les échanges le matin.'});
 const quote=db.quotes.create({clientAccountId:client.id,subject:'Site vitrine — proposition en cours'});db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});
 db.operations.createIntervention({clientAccountId:client.id,type:'incident',coverageMode:'internal',subject:'Vérifier le formulaire de contact'});
 const plan=db.maintenance.createPlan({name:'Maintenance WordPress',periodicPriceCents:4900,includedInterventions:2,includedMinutes:60});db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-15'});
 const click=async sel=>{await js('const e=document.querySelector('+JSON.stringify(sel)+');if(!e)throw Error("Missing control");e.click()');await sleep(80)};
 const text=async(sel,label)=>{await js('const e=[...document.querySelectorAll('+JSON.stringify(sel)+')].find(e=>e.textContent.includes('+JSON.stringify(label)+'));if(!e)throw Error("Missing label");e.click()');await sleep(80)};
 const input=async(sel,value)=>{await js('const e=document.querySelector('+JSON.stringify(sel)+');Object.getOwnPropertyDescriptor(e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}))');await sleep(80)};
 const snap=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
 const baseline=snap(),captureFolder=process.env.ATOUMWEB_CLIENT_B_CAPTURES,measurements=[];
 const oldSet=db.setSetting.bind(db);let widthWrites=0;db.setSetting=(key,value)=>{if(key==='ux_v2_visual_preferences_v1')widthWrites++;return oldSet(key,value)};
 const oldDialog=dialog.showMessageBoxSync;let confirms=0,answer=0;dialog.showMessageBoxSync=()=>{confirms++;return answer};
 try{
 win.setSize(1510,1030);win.webContents.setZoomFactor(1.25);await navigate('Clients');await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-detail-expand")','Client ready');await click('.client-detail-expand');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Sections loaded');
 await js('window.__clientB=document.querySelector(".client-summary-panel");window.__timerB=document.querySelector(".global-timer")');
 test(await get('!document.querySelector(".crm-record-left .eyebrow")&&document.querySelector(".client-summary-head h2").textContent==="Atelier Horizon"'),'Identity prioritizes company, not administrative title');
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus'])for(const [width,height,zoom]of [[1510,1030,1],[1510,1030,1.25],[1510,1030,1.5],[1920,1080,1],[1920,1080,1.25],[1920,1080,1.5],[1280,720,1],[1280,720,1.25],[1280,720,1.5]]){
  win.setSize(width,height);win.webContents.setZoomFactor(zoom);await js('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));await sleep(70);
  const m=await get('(()=>{const work=document.querySelector(".crm-record-work"),p=document.querySelector(".client-summary-priority").getBoundingClientRect(),c=document.querySelector(".client-summary-commercial").getBoundingClientRect(),a=document.querySelector(".client-summary-activity").getBoundingClientRect(),t=[...document.querySelectorAll(".client-v2-tabs button")].map(e=>e.getBoundingClientRect()),s=document.querySelector(".client-summary-scroll");return {available:document.querySelector("#client-panel-summary").getBoundingClientRect().width,columns:getComputedStyle(document.querySelector("#client-panel-summary")).gridTemplateColumns,priority:{top:p.top,right:p.right,bottom:p.bottom},commercial:{top:c.top,left:c.left,bottom:c.bottom},activityTop:a.top,overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth),tabs:t.length,tabRows:new Set(t.map(r=>Math.round(r.top))).size,workHeight:s.clientHeight,font:parseFloat(getComputedStyle(document.querySelector(".client-summary-priority button")).fontSize)}})()');
  measurements.push({theme,density,width,height,zoom,...m});
  test(m.overflow===0&&m.tabs===8&&m.tabRows===1&&m.workHeight>100,'No overflow, 8 single-row tabs and usable scrolling '+JSON.stringify({theme,density,width,zoom,m}));
  test(m.available>=600?Math.abs(m.priority.top-m.commercial.top)<2&&m.priority.right<=m.commercial.left: m.commercial.top>=m.priority.bottom,'Priority/commercial respond to actual work width');
  test(m.activityTop>=Math.max(m.priority.bottom,m.commercial.bottom)-2&&m.font>=14,'Activity below priorities; functional fonts not reduced');
  test(await get('window.__clientB===document.querySelector(".client-summary-panel")&&window.__timerB===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1'),'Same Client and unique timer through layout changes');
  if(captureFolder&&((width===1510&&zoom===1.25)||(theme==='noir'&&density==='comfort'&&zoom===1.5)))await require('./verified-crm-capture.cjs')({win,js,test,folder:captureFolder,file:'client-b-'+width+'-'+Math.round(zoom*100)+'-'+theme+'-'+density+'.png',theme,density,scene:'client-b-summary'});
 }
 win.setSize(1510,1030);win.webContents.setZoomFactor(1.25);await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');
 for(const tab of ['contacts','commercial','contracts','projects','operations','documents','history']){
  await click('#client-tab-'+tab);test(await get('document.querySelector("#client-panel-'+tab+'").hidden===false&&window.__clientB===document.querySelector(".client-summary-panel")'),'Same Client with visible tab '+tab);
  if(captureFolder)await require('./verified-crm-capture.cjs')({win,js,test,folder:captureFolder,file:'client-b-tab-'+tab+'.png',theme:'noir',density:'comfort',scene:'client-tab-'+tab});
 }
 await click('#client-tab-summary');
 win.setSize(1920,1080);win.webContents.setZoomFactor(1);await sleep(100);
 await js('window.atoumweb.visualPreferences.setItem("atoumweb:crm-record:client:v1",JSON.stringify({version:1,leftWidth:300,rightWidth:270,leftClosed:false,rightClosed:false}))');
 await wait('document.querySelector(".crm-record-layout").style.getPropertyValue("--crm-left")==="300px"','Existing user widths applied');
 test(await get('document.querySelector(".crm-record-layout").style.getPropertyValue("--crm-right")==="270px"&&window.__clientB===document.querySelector(".client-summary-panel")'),'Existing preferences retained with same record');
 await js('window.atoumweb.visualPreferences.removeItem("atoumweb:crm-record:client:v1")');await wait('document.querySelector(".crm-record-layout").style.getPropertyValue("--crm-right")==="190px"','Client B default association width');
 widthWrites=0;
 await js('const e=document.querySelector(".crm-pane-separator-right");e.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,pointerId:42,clientX:500}));window.dispatchEvent(new PointerEvent("pointermove",{pointerId:42,clientX:480}));window.dispatchEvent(new PointerEvent("pointermove",{pointerId:42,clientX:460}))');await sleep(80);
 test(widthWrites===0&&await get('document.querySelector(".crm-record-layout").style.getPropertyValue("--crm-right")==="230px"'),'Drag previews immediately without preference writes');
 await js('window.dispatchEvent(new PointerEvent("pointerup",{pointerId:42}))');await sleep(80);
 test(widthWrites===1&&await get('JSON.parse(window.atoumweb.visualPreferences.getItem("atoumweb:crm-record:client:v1")).rightWidth===230'),'One preference write at end of width gesture');
 await js('document.querySelector(".crm-pane-separator-right").focus()');win.focus();win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:'Home'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Home'});await sleep(80);
 test(await get('document.querySelector(".crm-pane-separator-right").getAttribute("aria-valuenow")==="190"'),'Accessible keyboard Home restores 190px association minimum');
 win.setSize(1510,1030);win.webContents.setZoomFactor(1.25);
 await click('#client-tab-contacts');await click('#client-panel-contacts .contact-tab-heading button');await input('#client-panel-contacts .contact-inline-form input','BROUILLON CONTACT CLIENT B');await js('window.__bContact=document.querySelector("#client-panel-contacts .contact-inline-form input")');await click('#client-tab-summary');
 await click('.client-summary-coordinates>summary');await text('.client-summary-coordinates button','Modifier');await input('.client-summary-coordinates fieldset input','BROUILLON COORD CLIENT B');await js('window.__bCoordinates=document.querySelector(".client-summary-coordinates fieldset input")');
 await text('.client-summary-commercial button','Modifier la note');await input('.client-summary-commercial textarea','BROUILLON RELATION CLIENT B');await js('window.__bRelation=document.querySelector(".client-summary-commercial textarea")');
 await text('.client-summary-priority button','Programmer une action');await input('.client-summary-priority input[placeholder]','BROUILLON ACTION CLIENT B');await js('window.__bAction=document.querySelector(".client-summary-priority input[placeholder]")');
 for(const tab of ['contacts','commercial','contracts','projects','operations','documents','history','summary']){
  await click('#client-tab-'+tab);
  test(await get('window.__bContact.isConnected&&window.__bContact.value==="BROUILLON CONTACT CLIENT B"&&window.__bCoordinates.isConnected&&window.__bCoordinates.value==="BROUILLON COORD CLIENT B"&&window.__bRelation.isConnected&&window.__bRelation.value==="BROUILLON RELATION CLIENT B"&&window.__bAction.isConnected&&window.__bAction.value==="BROUILLON ACTION CLIENT B"'),'Four mounted drafts retained across '+tab);
 }
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
  win.setSize(1280,720);win.webContents.setZoomFactor(1.5);await js('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));await sleep(80);
  test(await get('window.__bContact.isConnected&&window.__bCoordinates.isConnected&&window.__bRelation.isConnected&&window.__bAction.isConnected&&window.__bContact.value==="BROUILLON CONTACT CLIENT B"&&window.__bCoordinates.value==="BROUILLON COORD CLIENT B"&&window.__bRelation.value==="BROUILLON RELATION CLIENT B"&&window.__bAction.value==="BROUILLON ACTION CLIENT B"'),'Four exact drafts survive narrow 150% '+theme+'/'+density);
 }
 win.setSize(1510,1030);win.webContents.setZoomFactor(1.25);await sleep(100);
 await click('.client-summary-coordinates>summary');await click('.client-summary-coordinates>summary');test(await get('window.__bCoordinates===document.querySelector(".client-summary-coordinates fieldset input")'),'Folding coordinates retains exact editor');
 await js('document.querySelector("#client-tab-summary").focus()');win.focus();win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:'Right'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Right'});await sleep(100);
 test(await get('document.activeElement.id==="client-tab-contacts"'),'Native keyboard selects Contacts and restores tab focus');
 await click('#client-tab-summary');await click('.client-summary-panel .close-detail');test(confirms===1&&await get('window.__bContact.isConnected&&window.__bAction.value==="BROUILLON ACTION CLIENT B"'),'Stay exactly once retains all Client drafts');
 test(baseline===snap(),'Display, tabs, disclosures and Stay do not write business tables');
 test(db.database.get('PRAGMA integrity_check').integrity_check==='ok'&&db.database.all('PRAGMA foreign_key_check').length===0,'Client B TEMP integrity and FK');
 if(captureFolder)fs.writeFileSync(path.join(captureFolder,'measurements.json'),JSON.stringify(measurements,null,2));
 answer=1;await click('.client-summary-panel .close-detail');test(confirms===2&&await get('!document.querySelector(".client-summary-panel")'),'Explicit discard closes only after a second confirmation');
 const empty=db.crm.createClient({organizationId:db.crm.createOrganization({name:'Client vide — TEST B'}).id});await js('window.dispatchEvent(new Event("atoumweb:changed"))');await wait('!!document.querySelector(\'[data-record-id="'+empty.id+'"]\')','Empty Client row');await click('[data-record-id="'+empty.id+'"]');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Empty sections');
 test(await get('document.querySelector(".client-summary-priority").textContent.includes("Aucune action ni intervention à suivre")&&document.querySelectorAll(".client-v2-tabs [role=tab]").length===8'),'Empty Client shows honest empty state and eight tabs');
 console.log('CLIENT_B_RESULT '+JSON.stringify({configurations:measurements.length,captures:captureFolder?19:0,confirmations:confirms,businessMutation:false}));
 }finally{dialog.showMessageBoxSync=oldDialog;db.setSetting=oldSet}
};

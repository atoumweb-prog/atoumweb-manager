'use strict';

module.exports=async({win,db,registered,evalUI:js,get,wait,navigate,test,sleep})=>{

 const fs=require('node:fs'),path=require('node:path'),repo=path.resolve(__dirname,'../..'),{dialog}=require('electron');

 dialog.showMessageBoxSync=()=>1;

 const org=db.crm.createOrganization({name:'Atelier Horizon',city:'Lyon'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'04 00 00 00 00'});

 const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id,nextActionAt:'2026-10-20T09:00:00.000Z',nextActionText:'Faire le point sur le site vitrine',relationshipNote:'Privilégier les échanges le matin.'});

 const quote=db.quotes.create({clientAccountId:client.id,subject:'Site vitrine — proposition en cours'});db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});

 db.operations.createIntervention({clientAccountId:client.id,type:'incident',coverageMode:'internal',subject:'Vérifier le formulaire de contact'});

 const plan=db.maintenance.createPlan({name:'Maintenance WordPress',periodicPriceCents:4900,includedInterventions:2,includedMinutes:60});db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-15'});








 const click=async q=>{await js('document.querySelector('+JSON.stringify(q)+').click()');await sleep(100)};
 const select=async(label,value)=>{await js('const e=document.querySelector("select[aria-label="+'+JSON.stringify(JSON.stringify(label))+'+"]");e.value='+JSON.stringify(value)+';e.dispatchEvent(new Event("change",{bubbles:true}))');await sleep(80)};
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Clients');await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-quick-crm footer button")','Quick');await click('.client-quick-crm footer button');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Ready');await click('#client-tab-commercial');await sleep(100);
 test(await get('document.querySelector(".client-commercial-status").textContent==="Brouillon"&&document.querySelector(".client-commercial-reference p").textContent.includes("proposition en cours")'),'Real status distinct from subject');
 test(await get('document.querySelector(".client-commercial-card dl").textContent.includes("699")&&document.querySelector(".client-commercial-indicators strong").textContent==="1"'),'Actual amount and total displayed');
 const out=path.join(repo,'outputs','client-commercial-v2-1920x1080.png');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,(await win.webContents.capturePage()).toPNG());
 await select('Filtrer les devis du client','refused');test(await get('!document.querySelector(".client-commercial-card")&&document.querySelector(".client-commercial-empty").textContent.includes("Aucun devis avec ce statut")'),'Filtered empty state');await click('#client-tab-contacts');await click('#client-tab-commercial');test(await get('document.querySelector(".client-commercial-list-heading select").value==="refused"'),'Filter retained between tabs');await select('Filtrer les devis du client','all');
 const newer=db.quotes.create({clientAccountId:client.id,subject:'TEST — deuxième devis'});await js('window.dispatchEvent(new Event("atoumweb:changed"))');await wait('document.querySelectorAll(".client-commercial-card").length===2','Updated list');
 test(await get('document.querySelector(".client-commercial-card").dataset.quoteId==='+JSON.stringify(newer.id)),'Recent sort');await select('Trier les devis du client','oldest');test(await get('document.querySelector(".client-commercial-card").dataset.quoteId==='+JSON.stringify(quote.id)),'Oldest sort');
 const {ipcMain}=require('electron'),original=registered.get('quotes:list');ipcMain.removeHandler('quotes:list');ipcMain.handle('quotes:list',()=>{throw Error('TEST lecture indisponible')});await js('window.dispatchEvent(new Event("atoumweb:changed"))');await wait('!!document.querySelector(".client-commercial-tab [role=alert]")','Read error');test(await get('document.querySelector(".client-commercial-indicators strong").textContent==="—"'),'Read error does not show misleading totals');ipcMain.removeHandler('quotes:list');ipcMain.handle('quotes:list',original);await click('.client-commercial-tab [role=alert] button');await wait('document.querySelectorAll(".client-commercial-card").length===2','Retry restored list');
 await js('window.__quoteTarget=null;window.addEventListener("atoumweb:navigate",e=>{window.__quoteTarget=e.detail},{once:true});document.querySelector(".client-commercial-card[data-quote-id="+'+JSON.stringify(JSON.stringify(quote.id))+'+"] button").click()');await sleep(100);test(await get('window.__quoteTarget.entityId==='+JSON.stringify(quote.id)+'&&window.__quoteTarget.entityType==="quote"'),'Exact quote opened');console.log('COMMERCIAL_CAPTURE '+out);
};

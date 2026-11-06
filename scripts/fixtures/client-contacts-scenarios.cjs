'use strict';

module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{

 const fs=require('node:fs'),path=require('node:path'),repo=path.resolve(__dirname,'../..'),{dialog}=require('electron');

 dialog.showMessageBoxSync=()=>1;

 const org=db.crm.createOrganization({name:'Atelier Horizon',city:'Lyon'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'04 00 00 00 00'});

 const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id,nextActionAt:'2026-10-20T09:00:00.000Z',nextActionText:'Faire le point sur le site vitrine',relationshipNote:'Privilégier les échanges le matin.'});

 const quote=db.quotes.create({clientAccountId:client.id,subject:'Site vitrine — proposition en cours'});db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});

 db.operations.createIntervention({clientAccountId:client.id,type:'incident',coverageMode:'internal',subject:'Vérifier le formulaire de contact'});

 const plan=db.maintenance.createPlan({name:'Maintenance WordPress',periodicPriceCents:4900,includedInterventions:2,includedMinutes:60});db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-15'});







 const click=async q=>{await js('const e=document.querySelector('+JSON.stringify(q)+');if(!e)throw Error("Missing "+'+JSON.stringify(q)+');e.click()');await sleep(100)};
 const fill=async(label,value)=>{await js('const l=[...document.querySelectorAll("#client-panel-contacts form label")].find(e=>e.textContent.startsWith('+JSON.stringify(label)+'));const e=l.querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}))');await sleep(80)};
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Clients');await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-quick-crm footer button")','Quick');await click('.client-quick-crm footer button');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Ready');await click('#client-tab-contacts');await sleep(150);
 test(await get('document.querySelector(".client-contact-badges").textContent.includes("Contact principal")&&document.querySelector(".client-contact-coordinates").textContent.includes("camille@example.test")'),'Real identity badges and immediate coordinates');
 const out=path.join(repo,'outputs','client-contacts-v2-1920x1080.png');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,(await win.webContents.capturePage()).toPNG());
 await js('document.querySelectorAll(".client-contact-actions button")[1].click()');await sleep(80);test(await get('document.querySelector("#client-panel-contacts .contact-methods-panel").open'),'Manage coordinates opens existing detail');
 const person=db.crm.createContact({firstName:'TEST',lastName:'Annuaire'}),before=db.database.get('SELECT COUNT(*) AS count FROM contacts').count;
 await click('.client-contacts-heading>button');await wait('[...document.querySelectorAll(".contact-source-choice select option")].some(e=>e.value==='+JSON.stringify(person.id)+')','Directory choices');
 await js('const e=document.querySelector(".contact-source-choice select");e.value='+JSON.stringify(person.id)+';e.dispatchEvent(new Event("change",{bubbles:true}))');await sleep(80);await js('document.querySelector("#client-panel-contacts form").requestSubmit()');await wait('!document.querySelector("#client-panel-contacts form")','Linked');
 test(db.database.get('SELECT COUNT(*) AS count FROM contacts').count===before,'Link reuses person without duplication');
 await click('.client-contacts-heading>button');await fill('Prénom','TEST');await fill('Nom','Création');await fill('Fonction','Responsable');await fill('Email','nouveau@example.test');await js('document.querySelector("#client-panel-contacts form").requestSubmit()');await wait('!document.querySelector("#client-panel-contacts form")','Created');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Creation refresh');await sleep(150);test(db.database.get('SELECT COUNT(*) AS count FROM contacts').count===before+1,'Existing creation persists one person');
 await js('document.querySelector(".client-contact-actions button").click()');await wait('!!document.querySelector("#client-panel-contacts form input")','Person editor');await fill('Prénom','Camille TEST');await click('#client-tab-summary');await click('#client-tab-contacts');test(await get('document.querySelector("#client-panel-contacts form input").value==="Camille TEST"'),'Editing draft survives tab navigation');
 dialog.showMessageBoxSync=()=>0;await click('.client-contacts-heading>button');test(await get('!!document.querySelector("#client-panel-contacts form")'),'Stay protection retains person draft');dialog.showMessageBoxSync=()=>1;await click('.client-contacts-heading>button');
 test(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8&&document.querySelector(".client-associations-preview")!==null'),'Common structure preserved');console.log('CONTACTS_CAPTURE '+out);
};

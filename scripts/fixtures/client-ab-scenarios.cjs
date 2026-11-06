'use strict';

module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{

 const fs=require('node:fs'),path=require('node:path'),repo=path.resolve(__dirname,'../..'),{dialog}=require('electron');

 dialog.showMessageBoxSync=()=>1;

 const org=db.crm.createOrganization({name:'Atelier Horizon',city:'Lyon'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'04 00 00 00 00'});

 const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id,nextActionAt:'2026-10-20T09:00:00.000Z',nextActionText:'Faire le point sur le site vitrine',relationshipNote:'Privilégier les échanges le matin.'});

 const quote=db.quotes.create({clientAccountId:client.id,subject:'Site vitrine — proposition en cours'});db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});

 db.operations.createIntervention({clientAccountId:client.id,type:'incident',coverageMode:'internal',subject:'Vérifier le formulaire de contact'});

 const plan=db.maintenance.createPlan({name:'Maintenance WordPress',periodicPriceCents:4900,includedInterventions:2,includedMinutes:60});db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-15'});





 const click=async sel=>{await js('const e=document.querySelector('+JSON.stringify(sel)+');if(!e)throw Error("Missing "+'+JSON.stringify(sel)+');e.click()');await sleep(100)};

 for(const [name,first,last]of [['TEST - Studio Rivage','Alex','Morel'],['TEST - Association Les Horizons','Sam','Petit'],['TEST - Atelier du Parc','Lou','Robert']]){const o=db.crm.createOrganization({name}),c=db.crm.createContact({organizationId:o.id,firstName:first,lastName:last,email:first.toLowerCase()+'@example.test'});db.crm.createClient({organizationId:o.id,primaryContactId:c.id});}

 const capture=async name=>{await sleep(180);const out=path.join(repo,'outputs',name);fs.mkdirSync(path.dirname(out),{recursive:true});const img=await win.webContents.capturePage();test(img.getSize().width===1920&&img.getSize().height===1080,'Actual 1920x1080 image');fs.writeFileSync(out,img.toPNG());};

 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Clients');await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');await sleep(150);

 test(await get('!document.querySelector(".client-summary-panel")'),'Full list initially');const fullWidth=await get('document.querySelector(".table-panel").getBoundingClientRect().width');test(await get('document.querySelector(".table-panel").getBoundingClientRect().width>document.querySelector(".clients-layout").getBoundingClientRect().width-5'),'Full width');

 await click('.aw-table-preferences summary');test(await get('!!document.querySelector(".aw-table-preferences[open]")'),'Column/view controls retained');await click('.aw-table-preferences summary');



 await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-quick-crm")','Quick CRM');await wait('!document.querySelector(".client-quick-crm [role=status]")','Loaded summary');

 test(await get('!document.querySelector("th[data-column-id=coordinates]")'),'Default compact table hides coordinates');
 const preferenceKey='atoumweb:table-workshop:clients-directory:v1';
 await js('window.atoumweb.visualPreferences.setItem('+JSON.stringify(preferenceKey)+',JSON.stringify({version:2,visibleColumnIds:["identity","status","contact","coordinates","nextAction","open"],columnOrder:["identity","status","contact","coordinates","nextAction","open"],widths:{identity:300},sort:null,status:"",category:""}))');await sleep(100);
 test(await get('!!document.querySelector("th[data-column-id=coordinates]")'),'Saved columns override compact defaults');
 test(await get('JSON.parse(window.atoumweb.visualPreferences.getItem('+JSON.stringify(preferenceKey)+')).widths.identity===300'),'Saved manual width retained');
 await js('window.atoumweb.visualPreferences.removeItem('+JSON.stringify(preferenceKey)+')');await sleep(100);
 test(await get('document.querySelector(".client-toolbar").getBoundingClientRect().width>1500'),'Header spans working area');
 test(await get('getComputedStyle(document.querySelector(".client-detail-content")).display==="none"'),'Detailed view absent from quick presentation, still mounted');

 test(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8'),'Eight detailed tabs remain mounted');

 test(await get('document.querySelector(".client-quick-crm").textContent.includes("camille@example.test")'),'Real contact');

 test(await get('!!document.querySelector(".client-quick-command a[href^=mailto]")&&!!document.querySelector(".client-quick-command a[href^=tel]")'),'Actual call/email shortcuts');

 test(await get('document.querySelector(".table-panel").getBoundingClientRect().width>'+fullWidth+'*.6'),'Table keeps majority of work area');

 test(await get('document.querySelector(".client-quick-crm").getBoundingClientRect().height<780'),'Compact summary under 780px');

 await click('.client-quick-crm footer button');test(await get('!!document.querySelector(".client-large-view")'),'Enlargement available');

 await click('#client-tab-contacts');await click('#client-tab-summary');

 await js('const b=[...document.querySelectorAll(".client-summary-priority button")].find(e=>e.textContent.includes("Programmer une action"));b.click()');await sleep(80);

 await js('const e=document.querySelector(".client-summary-priority input[placeholder]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"BROUILLON TEST OPTION A");e.dispatchEvent(new Event("input",{bubbles:true}));window.__clientDraft=e');await sleep(100);

 await click('.client-large-view .client-detail-expand');await click('.client-quick-crm footer button');test(await get('window.__clientDraft.isConnected&&window.__clientDraft.value==="BROUILLON TEST OPTION A"'),'Draft retained through summary/full switch');

 await js('const b=[...document.querySelectorAll(".client-summary-priority button")].find(e=>e.textContent==="Annuler");b.click()');await sleep(100);await click('.client-large-view .client-detail-expand');await click('.client-quick-header .close-detail');test(await get('!document.querySelector(".client-summary-panel")'),'Close summary');test(await get('Math.abs(document.querySelector(".table-panel").getBoundingClientRect().width-'+fullWidth+')<3'),'Full width restored');

 const empty=db.crm.createClient({organizationId:db.crm.createOrganization({name:'TEST - Client sans coordonnees'}).id});await js('window.dispatchEvent(new Event("atoumweb:changed"))');await sleep(200);await click('[data-record-id="'+empty.id+'"]');await wait('!document.querySelector(".client-quick-crm [role=status]")','Empty summary');test(await get('!document.querySelector(".client-quick-command a")'),'No invented coordinates');await click('.client-quick-header .close-detail');

 await click('[data-record-id="'+client.id+'"]');await wait('!document.querySelector(".client-quick-crm [role=status]")','Final summary');

 test(await get('document.documentElement.scrollWidth===document.documentElement.clientWidth'),'No page overflow');

 console.log('OPTION_A_MEASUREMENTS '+JSON.stringify(await get('(()=>{const t=document.querySelector(".table-panel").getBoundingClientRect(),p=document.querySelector(".client-quick-crm").getBoundingClientRect();return {tableWidth:t.width,panelWidth:p.width,panelHeight:p.height,zoom:devicePixelRatio}})()')));

 test(await get('document.querySelector(".client-quick-next").dataset.overdue==="true"'),'Overdue open action identified');
 test(await get('!document.querySelector(".client-quick-command .client-detail-expand")'),'Duplicate expansion control removed');
 await click('.client-quick-crm footer button');await capture('client-expanded-current-1920x1080.png');

};

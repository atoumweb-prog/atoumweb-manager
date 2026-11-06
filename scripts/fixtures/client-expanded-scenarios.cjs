'use strict';

module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{

 const fs=require('node:fs'),path=require('node:path'),repo=path.resolve(__dirname,'../..'),{dialog}=require('electron');

 dialog.showMessageBoxSync=()=>1;

 const org=db.crm.createOrganization({name:'Atelier Horizon',city:'Lyon'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'04 00 00 00 00'});

 const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id,nextActionAt:'2026-10-20T09:00:00.000Z',nextActionText:'Faire le point sur le site vitrine',relationshipNote:'Privilégier les échanges le matin.'});

 const quote=db.quotes.create({clientAccountId:client.id,subject:'Site vitrine — proposition en cours'});db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});

 db.operations.createIntervention({clientAccountId:client.id,type:'incident',coverageMode:'internal',subject:'Vérifier le formulaire de contact'});

 const plan=db.maintenance.createPlan({name:'Maintenance WordPress',periodicPriceCents:4900,includedInterventions:2,includedMinutes:60});db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-15'});






 const click=async selector=>{await js('document.querySelector('+JSON.stringify(selector)+').click()');await sleep(80)};
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Clients');await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');
 await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-quick-crm footer button")','Quick ready');await click('.client-quick-crm footer button');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Expanded sections');await sleep(150);
 const sizes=await get('(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {left:r(".crm-record-left").width,center:r(".crm-record-work").width,right:r(".crm-record-right").width,tabs:[...document.querySelectorAll(".client-v2-tabs button")].reduce((n,e)=>n+e.getBoundingClientRect().width,0),availableTabs:r(".client-v2-tabs").width}})()');console.log('WIDTHS '+JSON.stringify(sizes));
 if(process.env.ATOUMWEB_CLIENT_MEASURE_ONLY==='1')return;
 test(await get('document.querySelector(".client-large-view").getBoundingClientRect().top>document.querySelector(".aw-workspace-header").getBoundingClientRect().bottom'),'Common header remains visible');
 test(await get('document.querySelector(".crm-record-left").getBoundingClientRect().width>=315'),'Identity widened');
 const shown=await get('(()=>{const t=[...document.querySelectorAll(".client-v2-tabs button")],w=document.querySelector(".client-v2-tabs").getBoundingClientRect();return t.length===8&&t.every(e=>e.getBoundingClientRect().right<=w.right+2)})()');test(shown,'Eight tabs fully visible');
 await click('#client-tab-contacts');await click('#client-tab-summary');test(await get('document.querySelector("#client-panel-summary").hidden===false'),'Tabs navigate without replacing the record');
 await js('const b=[...document.querySelectorAll(".client-summary-priority button")].find(e=>e.textContent.includes("Programmer une action"));b.click()');await sleep(80);await js('const e=document.querySelector(".client-summary-priority input[placeholder]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"BROUILLON FICHE AGRANDIE");e.dispatchEvent(new Event("input",{bubbles:true}));window.__expandedDraft=e');await sleep(80);await click('#client-tab-history');await click('#client-tab-summary');test(await get('window.__expandedDraft.isConnected&&window.__expandedDraft.value==="BROUILLON FICHE AGRANDIE"'),'Draft survives tabs');await js('const b=[...document.querySelectorAll(".client-summary-priority button")].find(e=>e.textContent==="Annuler");b.click()');await sleep(100);
 test(await get('!!document.querySelector(".client-expanded-overdue")&&document.querySelector(".client-quick-actions button").hidden'),'Late action signaled and duplicate programming hidden in Summary');
 await js('window.atoumweb.visualPreferences.setItem("atoumweb:crm-record:client:v1",JSON.stringify({version:1,leftWidth:320,rightWidth:280,leftClosed:false,rightClosed:false}))');await sleep(100);
 test(await get('document.querySelector(".crm-record-right").getBoundingClientRect().width===280&&document.querySelector(".crm-record-left").getBoundingClientRect().width===320'),'Saved right width respected without reducing identity');
 await js('window.atoumweb.visualPreferences.removeItem("atoumweb:crm-record:client:v1")');await sleep(100);
 test(await get('document.querySelector(".crm-record-right").getBoundingClientRect().right<=document.querySelector(".client-large-view").getBoundingClientRect().right'),'Associations inside record');
 await wait('!document.querySelector("[data-category=documents]").textContent.includes("Chargement")','Documents projection ready');
 test(await get('document.querySelector("[data-category=commercial] .association-count").textContent==="1"&&document.querySelector("[data-category=operations] .association-count").textContent==="1"&&document.querySelector("[data-category=contracts] .association-count").textContent==="0"'),'Real quote/intervention counts and no fabricated contract');
 await click('[data-category=commercial]>summary');await click('#client-tab-contacts');await click('#client-tab-summary');test(await get('!document.querySelector("[data-category=commercial]").open'),'Section disclosure survives tab changes');await click('[data-category=commercial]>summary');
 await js('window.__associated=null;window.addEventListener("atoumweb:navigate",e=>{window.__associated=e.detail;},{once:true});document.querySelector("[data-category=commercial] .association-record").click()');await sleep(100);
 test(await get('window.__associated.entityType==="quote"&&window.__associated.entityId==='+JSON.stringify(quote.id)),'Preview opens exact quote identity');
 await navigate('Clients');await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-quick-crm footer button")','Return to client');await click('.client-quick-crm footer button');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Return expanded');await sleep(150);
 const out=path.join(repo,'outputs','client-expanded-v2-1920x1080.png');fs.mkdirSync(path.dirname(out),{recursive:true});await sleep(150);fs.writeFileSync(out,(await win.webContents.capturePage()).toPNG());console.log('EXPANDED_CAPTURE '+out);
};

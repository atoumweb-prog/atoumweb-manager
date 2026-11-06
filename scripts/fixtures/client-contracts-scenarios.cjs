'use strict';

module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{

 const fs=require('node:fs'),path=require('node:path'),repo=path.resolve(__dirname,'../..'),{dialog}=require('electron');

 dialog.showMessageBoxSync=()=>1;

 const org=db.crm.createOrganization({name:'Atelier Horizon',city:'Lyon'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'04 00 00 00 00'});

 const client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id,nextActionAt:'2026-10-20T09:00:00.000Z',nextActionText:'Faire le point sur le site vitrine',relationshipNote:'Privilégier les échanges le matin.'});

 const quote=db.quotes.create({clientAccountId:client.id,subject:'Site vitrine — proposition en cours'});db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});

 db.operations.createIntervention({clientAccountId:client.id,type:'incident',coverageMode:'internal',subject:'Vérifier le formulaire de contact'});

 const plan=db.maintenance.createPlan({name:'Maintenance WordPress',periodicPriceCents:4900,includedInterventions:2,includedMinutes:60});db.maintenance.createSubscription({clientAccountId:client.id,planId:plan.id,startDate:'2026-10-15'});







 const helperFile=path.join(process.env.ATOUMWEB_UXV2_01A_LIVE_TMP,'contracts-helper.cjs');require('esbuild').buildSync({entryPoints:[path.join(repo,'src/main/testSupport/quotePreparationFixture.ts')],outfile:helperFile,bundle:true,platform:'node',format:'cjs',external:['electron'],logLevel:'silent'});const H=require(helperFile);H.finalizeForTest(db.database,db.quotes,quote.id);H.sendForTest(db.quotes,quote.id);H.acceptForTest(db.database,db.quotes,quote.id);
 const click=async q=>{await js('document.querySelector('+JSON.stringify(q)+').click()');await sleep(100)};
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Clients');await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');await click('[data-record-id="'+client.id+'"]');await wait('!!document.querySelector(".client-quick-crm footer button")','Quick');await click('.client-quick-crm footer button');await wait('!document.querySelector(".client-summary-scroll [role=status]")','Ready');await click('#client-tab-contracts');await wait('!!document.querySelector(".client-contracts-v2 .engagement-row")&&!document.querySelector(".client-contracts-v2 [role=status]")','Engagement projection');
 test(await get('document.querySelectorAll(".engagement-row").length===1&&document.querySelectorAll(".engagement-other").length===1'),'One actual subscription and one accepted line without operational follow-up');
 test(await get('document.querySelector(".engagement-row dl").textContent.includes("15/10/2026")&&document.querySelector(".engagement-row dl").textContent.includes("Non renseignée")'),'Service start from subscription, no fabricated end');
 test(await get('document.querySelector(".engagement-indicators strong").textContent==="1"&&!document.querySelector(".client-contracts-v2").textContent.includes("PDF signé rattaché")'),'Actual active subscription and no signature claim');
 await click('#client-tab-contacts');await click('#client-tab-contracts');await wait('!!document.querySelector(".engagement-other")&&!document.querySelector(".client-contracts-v2 [role=status]")','Return projection');test(await get('document.querySelectorAll(".engagement-other").length===1'),'Reload between tabs does not duplicate accepted lines');
 test(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8&&!!document.querySelector(".client-associations-preview")&&document.querySelector(".client-large-view").getBoundingClientRect().top>=document.querySelector(".aw-workspace-header").getBoundingClientRect().bottom'),'Common structure retained and header visible');
 console.log('FRAME '+JSON.stringify(await get('(()=>{const p=document.querySelector(".client-large-view"),h=document.querySelector(".aw-workspace-header"),w=document.querySelector(".crm-record-work"),s=document.querySelector(".client-summary-scroll");return {top:p.getBoundingClientRect().top,height:p.getBoundingClientRect().height,header:h.getBoundingClientRect().bottom,topvar:p.style.getPropertyValue("--client-desk-top"),scroll:scrollY,work:w.clientHeight,scrollh:s.clientHeight,inner:s.scrollHeight,position:getComputedStyle(p).position,minHeight:getComputedStyle(p).minHeight,top:getComputedStyle(p).top,bottom:getComputedStyle(p).bottom,cssHeight:getComputedStyle(p).height}})()')));
 await js('document.querySelector(".engagement-columns section:nth-child(2) details summary").click()');await sleep(100);
 test(await get('document.querySelector(".engagement-columns section:nth-child(2)").textContent.includes("Acceptation attestée enregistrée")&&!document.querySelector(".engagement-columns section:nth-child(2)").textContent.includes("PDF signé rattaché")'),'Recorded attestation distinguished from signed document');
 await js('document.querySelector(".engagement-columns section:nth-child(2) details summary").click()');
 const scrollWorks=await get('(()=>{const pane=document.querySelector(".client-summary-scroll"),targets=[...document.querySelectorAll(".client-contracts-v2 section,.engagement-history")].filter(e=>e.classList.contains("engagement-history")||e.querySelector("h4")?.textContent.match(/Documents|Autres engagements|Services complémentaires/));let ok=true;for(const target of targets){target.scrollIntoView({block:"nearest"});const r=target.getBoundingClientRect(),v=pane.getBoundingClientRect();ok=ok&&r.bottom>v.top&&r.top<v.bottom;}pane.scrollTop=0;return ok&&targets.length===4})()');test(scrollWorks,'Documents, unsupported lines, history and complementary needs are reachable by scrolling');
 test(await get('document.querySelector(".engagement-columns section:first-child").textContent.includes("Jalon prévu")&&!document.querySelector(".engagement-columns section:first-child").textContent.includes("Livraison · renouvellement")'),'Delivery milestone kept distinct from renewal');
 const out=path.join(repo,'outputs','client-contracts-services-v2-1920x1080.png');fs.mkdirSync(path.dirname(out),{recursive:true});await sleep(150);fs.writeFileSync(out,(await win.webContents.capturePage()).toPNG());console.log('CONTRACTS_CAPTURE '+out);await click('#client-tab-projects');await sleep(180);const projectCapture=path.join(repo,'outputs','client-projects-current-1920x1080.png');fs.writeFileSync(projectCapture,(await win.webContents.capturePage()).toPNG());console.log('PROJECTS_CAPTURE '+projectCapture);
};

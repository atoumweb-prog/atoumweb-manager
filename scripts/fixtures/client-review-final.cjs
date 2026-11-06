'use strict';
module.exports=async({win,db,temp,workspace,evalUI:js,get,wait,navigate,test,sleep,consoleErrors,dir,group})=>{
 const fs=require('node:fs'),path=require('node:path'),repo=path.resolve(__dirname,'../..');let checks=0;
 const check=(ok,label)=>{test(ok,label);checks++;};
 const click=async selector=>{await js('document.querySelector('+JSON.stringify(selector)+').click()');await sleep(130);};
 const button=async(scope,label)=>{await js('const b=[...document.querySelectorAll('+JSON.stringify(scope+' button')+')].find(e=>e.textContent.trim()==='+JSON.stringify(label)+');if(!b)throw Error("Button absent");b.click()');await sleep(130);};
 const capture=async(file,fixture,limit)=>{win.webContents.sendInputEvent({type:'mouseMove',x:1000,y:80});await js('return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await sleep(350);const frame=await win.webContents.capturePage();check(frame.getSize().width===1920&&frame.getSize().height===1080&&win.webContents.getZoomFactor()===1,'1920x1080 zoom 100 '+file);fs.writeFileSync(path.join(dir,file),frame.toPNG());fs.appendFileSync(path.join(dir,'captures.jsonl'),JSON.stringify({file,fixture,limit,theme:'Noir / Confort',width:1920,height:1080,zoom:1})+'\n');};
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await js('document.documentElement.dataset.theme="noir";document.documentElement.dataset.density="comfort"');
 if(group==='flowers'){
  await navigate('Clients');await click('[data-record-id="a28d825f-7e9a-4ff4-99e0-fc70077d553b"]');await wait('document.querySelector(".client-quick-link")','Quick data');
  check(await get('document.querySelector(".client-quick-crm").textContent.includes("Devis et projets liés")&&!document.querySelector(".client-quick-crm").textContent.includes("Prestations liées")'),'Neutral quick heading');
  await capture('01-fiche-rapide.png','TEST — Atelier des Fleurs',workspace.root+' ; base existante en lecture seule, devis Brouillon et projets réels inchangés.');
 }
 if(group==='horizon'){
  require('electron').dialog.showMessageBoxSync=()=>1;
  const source=fs.readFileSync(path.join(repo,'scripts/fixtures/client-contracts-scenarios.cjs'),'utf8'),a=source.indexOf(' const org='),b=source.indexOf(' const click=async',a);if(a<0||b<0)throw Error('Fixture seam absent');
  const {client,contact,quote}=new Function('db','repo','fs','path','require',source.slice(a,b)+';return {client,contact,quote};')(db,repo,fs,path,require);
  const beforeLinks=db.clientContacts.list(client.id),personCount=db.database.get('SELECT COUNT(*) AS n FROM contacts').n;
  const repeated=db.clientContacts.add(client.id,{firstName:'',lastName:''},'primary',true,contact.id);
  check(repeated.id===beforeLinks[0].id&&JSON.stringify(db.clientContacts.list(client.id))===JSON.stringify(beforeLinks),'Existing same-role service attachment idempotent');
  check(db.database.get('SELECT COUNT(*) AS n FROM contacts').n===personCount,'Service reuses exact person');
  await navigate('Clients');await button('.client-toolbar','+ Nouveau client');
  check((await win.webContents.executeJavaScript('window.atoumweb.app.getBootstrap()')).clientTestFillAllowed===false,'Main bootstrap denies helper on ordinary TEMP workspace');
  check(await get('!document.querySelector("form.crm-form").textContent.includes("Remplir avec des données test")'),'TEST command absent without trusted permission');
  await button('.client-toolbar','Fermer');await click('[data-record-id="'+client.id+'"]');await wait('document.querySelector(".client-quick-crm footer button")','Quick');await click('.client-quick-crm footer button');await click('#client-tab-contacts');await wait('document.querySelector(".contact-card")','Contacts loaded');
  const category=name=>'.client-association-preview[data-category="'+name+'"]';
  check(await get('document.querySelector('+JSON.stringify(category('commercial')+' .association-count')+').textContent==="1"&&document.querySelector('+JSON.stringify(category('contracts')+' .association-count')+').textContent==="1"'),'Both quote totals remain one');
  check(await get('document.querySelector('+JSON.stringify(category('commercial'))+').open&&!document.querySelector('+JSON.stringify(category('commercial')+' .association-record')+')&&document.querySelector('+JSON.stringify(category('commercial'))+').textContent.includes("Aucun devis non accepté")'),'Accepted-only preview has truthful empty state');
  check(await get('document.querySelectorAll('+JSON.stringify(category('contracts')+' .association-record')+').length===1'),'Accepted quote appears in accepted preview only');
  await capture('02-associations-sans-doublon.png','Atelier Horizon — recette TEST existante du dépôt','client-contracts-scenarios.cjs rejoué à l’identique en TEMP ; un devis accepté, sans enrichissement pour la capture.');
  await button('.client-contacts-heading','+ Ajouter un contact');
  check(await get('document.querySelector(".contact-source-choice small").textContent.includes("sera créée")&&document.querySelectorAll(".contact-inline-form input").length>=5'),'Creation mode displays its own help and fields');
  await capture('03-creation-contact-aide.png','Atelier Horizon — recette TEST existante du dépôt','Formulaire réel vide en mode création, aucune sauvegarde.');
  await js('const e=document.querySelector(".contact-source-choice select");e.value='+JSON.stringify(contact.id)+';e.dispatchEvent(new Event("change",{bubbles:true}))');await sleep(120);
  check(await get('document.querySelector(".contact-source-choice small").textContent.includes("déjà rattachée")&&!document.querySelector(".contact-inline-form").textContent.includes("Prénom")'),'Attachment mode explains already-linked person and hides creation fields');
  await button('.contact-inline-form','Rattacher la personne');
  check(await get('document.querySelector("#client-panel-contacts").textContent.includes("Cette personne est déjà rattachée à ce client")'),'Understandable duplicate attachment error');
  check(JSON.stringify(db.clientContacts.list(client.id))===JSON.stringify(beforeLinks)&&db.database.get('SELECT COUNT(*) AS n FROM contacts').n===personCount,'Different default role cannot duplicate link or person from Client form');
  await button('.client-contacts-heading','Fermer le formulaire');
  const unlinked=db.crm.createContact({firstName:'TEST',lastName:'Rattachement isolé'});
  await button('.client-contacts-heading','+ Ajouter un contact');await wait('document.querySelector(".contact-source-choice option[value=\\"'+unlinked.id+'\\"]")','Directory refresh');
  await js('const e=document.querySelector(".contact-source-choice select");e.value='+JSON.stringify(unlinked.id)+';e.dispatchEvent(new Event("change",{bubbles:true}))');await sleep(130);
  check(await get('document.querySelector(".contact-source-choice small").textContent.includes("sans être recréée")'),'Unlinked person receives attachment help');
  await button('.contact-inline-form','Rattacher la personne');await wait('!document.querySelector(".contact-inline-form")','Attachment saved in TEMP');
  check(db.clientContacts.list(client.id).filter(l=>l.contactId===unlinked.id).length===1,'Valid exact-person attachment still works in TEMP');
  const draft=db.quotes.create({clientAccountId:client.id,subject:'TEST — Aperçu Brouillon'}),cancelled=db.quotes.create({clientAccountId:client.id,subject:'TEST — Aperçu Annulé'});
  db.database.run("UPDATE quotes SET status='cancelled' WHERE id=?",[cancelled.id]);await js('window.dispatchEvent(new Event("atoumweb:changed"))');
  await wait('document.querySelector(".client-association-preview[data-category=commercial] .association-count").textContent==="3"','Mixed quote totals');
  check(await get('document.querySelectorAll('+JSON.stringify(category('commercial')+' .association-record')+').length===2&&!document.querySelector('+JSON.stringify(category('commercial'))+').textContent.includes('+JSON.stringify(quote.number+' · '+quote.subject)+')'),'Mixed preview retains non-accepted records and total three');
  await click(category('commercial')+' summary');await js('window.dispatchEvent(new Event("atoumweb:changed"))');await sleep(250);
  check(await get('!document.querySelector('+JSON.stringify(category('commercial'))+').open'),'Manual fold survives refresh');await click(category('commercial')+' summary');
  await button(category('commercial'),'Voir tous les devis');check(await get('document.querySelector("#client-tab-commercial").getAttribute("aria-selected")==="true"'),'Full list access remains functional');
  check(await get('document.querySelectorAll(".client-v2-tabs [role=tab]").length===8'),'Eight tabs preserved');
  // Observe the real navigation target without leaving the form under test.
  await js('window.__reviewTarget=null;window.addEventListener("atoumweb:navigate",e=>{window.__reviewTarget=e.detail;e.stopImmediatePropagation();},{capture:true,once:true})');
  await click(category('contracts')+' .association-record');check(await get('window.__reviewTarget.entityType==="quote"&&window.__reviewTarget.entityId==='+JSON.stringify(quote.id)),'Accepted dossier opens with exact original id');
  console.log('TEMP_ONLY_WRITES true');
 }
 check(consoleErrors.length===0,'No renderer errors');console.log('FINAL_REVIEW '+group+' checks='+checks);
};

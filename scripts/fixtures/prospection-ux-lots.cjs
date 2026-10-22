module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');const lot=process.env.ATOUMWEB_PRO_LOT||'01';
 const out=path.resolve('outputs/prospection-ux-lots/lot-'+lot);fs.mkdirSync(out,{recursive:true});const captures=[];
 const click=async s=>{await js(`document.querySelector(${JSON.stringify(s)}).click()`);await sleep(130);};
 async function shot(name){await sleep(150);fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());captures.push(name+'.png');}
 const ids=[];for(const [name,stage] of [['Toutes les Fleurs','qualifying'],['Euro Trans Sécurité','need_identified'],['Cazor Auto Passion','quote_to_prepare'],['Maison Lefèvre','quote_sent'],['Studio Photo','negotiation'],['Atelier du Bois','new']]){
 const o=db.crm.createOrganization({name:'TEST — '+name,industry:'Artisan',city:'Dijon',website:'https://example.test'}),c=db.crm.createContact({organizationId:o.id,firstName:'Camille',lastName:name.split(' ')[0],jobTitle:'Responsable'}),p=db.crm.createProspect({organizationId:o.id,contactId:c.id,stage,primaryNeed:'Refonte du site et développement de la visibilité locale.',source:'referral'});ids.push(p.id);db.crm.saveContactMethod({contactId:c.id,type:'email',value:'demo@example.test',isPrimary:true});db.crm.saveContactMethod({contactId:c.id,type:'phone',value:'0612345678',isPrimary:true});db.actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:'Échanger sur le projet',dueAt:new Date().toISOString()});if(stage==='quote_to_prepare')db.quotes.create({prospectId:p.id,subject:'TEST — Proposition site vitrine'});
 }
 const old=db.crm.createOrganization({name:'TEST — Dossier historique'}),lost=db.crm.createProspect({organizationId:old.id,stage:'new'});db.crm.changeProspectStage(lost.id,'lost','TEST — Sans suite');
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Prospection');await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");await wait('document.querySelector(".prospect-directory-table tbody tr")','annuaire');await shot('annuaire');

 if(lot==='01'){
 for(const [w,h,z] of [[1920,1080,1],[1440,900,1],[1366,768,1],[1920,1080,1.25],[1920,1080,1.5],[1366,768,1.5]]){
 win.setContentSize(w,h);win.webContents.setZoomFactor(z);await sleep(250);
 test(await get('(()=>{const e=document.querySelector(".aw-data-table-scroll");return e.scrollWidth<=e.clientWidth+2})()'),`Default table fits ${w}/${z}`);
 await click(`tr[data-record-id="${ids[0]}"]`);test(await get('(()=>{const e=document.querySelector(".prospect-side-panel-boundary aside").getBoundingClientRect();return e.left>=0&&e.right<=innerWidth+1&&e.bottom<=innerHeight+1})()'),`Quick panel contained ${w}/${z}`);
 await shot(`annuaire-${w}-${z}`);await click('[aria-label="Fermer la fiche prospect"]');
 }
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await click(`tr[data-record-id="${ids[0]}"]`);
 await click('[aria-label="Trier par Entreprise"]');test(await get(`document.querySelector('aside[data-prospect-id="${ids[0]}"]')!==null`),'Sort keeps selected ID');
 await click('[data-prospect-filter=qualifying]');test(await get('document.querySelectorAll(".prospect-directory-table tbody tr").length===1'),'KPI filters actual records');
 await click('[data-prospect-filter=all]');await click('.aw-table-preferences>summary');await shot('colonnes-vues');await click('.aw-table-preferences>summary');

 }else if(lot==='02'){
 await click('.prospection-pilot-heading .primary-button');test(await get('document.querySelector("dialog").open'),'Creation in native focus-contained modal');await shot('creation-1920');
 const {dialog}=require('electron'),original=dialog.showMessageBoxSync;let prompts=0;dialog.showMessageBoxSync=()=>{prompts++;return 0;};
 try{await js(`const e=document.querySelector('.prospect-create-v2 input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'TEST brouillon');e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(80);await click('.prospect-create-v2 .form-actions .secondary-button');test(prompts===1&&await get('document.querySelector("dialog").open'),'Stay protects creation draft');}finally{dialog.showMessageBoxSync=original;}
 await js(`const e=document.querySelector('.prospect-create-v2 input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(80);await click('.prospect-create-v2 .form-actions .secondary-button');
 await click(`tr[data-record-id="${ids[0]}"]`);await click('[aria-label="Agrandir la fiche"]');await click('[data-group=identity]>summary');await wait('document.querySelector(".identity-panel-v2 button")','identity loaded');await click('.identity-panel-v2 .button-row button:first-child');test(await get('document.querySelector(".identity-part[hidden]")!==null'),'Single entity editor');await shot('entreprise-1920');await click('.identity-panel-v2 .button-row button');
 await click('.linked-contacts-panel .work-section-heading button');test(await get('!!document.querySelector(".linked-contact-editor input[type=search]")'),'Existing contact search available');await shot('contact-search');
 win.setContentSize(1366,768);await shot('contacts-1366');
 }
 fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(captures,null,2));console.log('UX_PRO_LOT '+lot+' '+JSON.stringify(captures));
};

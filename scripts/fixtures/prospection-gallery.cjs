// Galerie de recette de la fiche de travail du prospect (refonte R3, thème Noir, densité Confort).
// Règles durables, pas de comptage de feuilles CSS : on vérifie la structure visible (en-tête, carte « Prochaine étape »,
// menu « Plus », sections repliables, fenêtre « Programmer une action », trois vues, en-tête de Clients).
module.exports=async({win,db,evalUI:js,get,wait,navigate,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');
 const out=path.resolve('outputs/prospection-galerie-r3-20261113');fs.mkdirSync(out,{recursive:true});const shots=[];
 const fail=[];const check=(ok,label)=>{if(!ok){fail.push(label);console.log('ECHEC '+label);}else console.log('OK '+label);};
 const click=async s=>{await js(`document.querySelector(${JSON.stringify(s)}).click()`);await sleep(200);};
 const clickText=async(scope,label)=>{await js(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(scope)})].find(e=>e.textContent.trim().includes(${JSON.stringify(label)}));if(!b)throw Error('Absent : '+${JSON.stringify(label)});b.click()})()`);await sleep(220);};
 async function shot(name){await js('document.activeElement?.blur()');await sleep(180);const file=String(shots.length+1).padStart(3,'0')+'-'+name+'.png';fs.writeFileSync(path.join(out,file),(await win.webContents.capturePage()).toPNG());shots.push(file);console.log('CAPTURE '+file);}
 const stages=[['Toutes les Fleurs','new'],['Euro Trans Sécurité','qualifying'],['Cazor Auto Passion','need_identified'],['Maison Lefèvre','quote_sent']];
 const ids=[];
 for(const [name,stage] of stages){
  const o=db.crm.createOrganization({name:'TEST — '+name,industry:'Artisan',city:'Dijon',website:'https://example.test'}),c=db.crm.createContact({organizationId:o.id,firstName:'Camille',lastName:name.split(' ')[0],jobTitle:'Responsable'}),p=db.crm.createProspect({organizationId:o.id,contactId:c.id,stage,primaryNeed:'Refonte du site et visibilité locale.',source:'referral'});
  ids.push(p.id);db.crm.saveContactMethod({contactId:c.id,type:'email',value:'demo@example.test',isPrimary:true});
  if(stage==='quote_sent')db.actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:'Relancer le devis',dueAt:new Date(Date.now()+7*864e5).toISOString()});
 }
 const old=db.crm.createOrganization({name:'TEST — Dossier historique'}),lost=db.crm.createProspect({organizationId:old.id,stage:'new'});db.crm.changeProspectStage(lost.id,'lost','TEST — Sans suite');
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);
 await navigate('Prospection');await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
 await wait('document.querySelector(".prospect-directory-table tbody tr")','liste');
 check(await get('document.querySelectorAll(".prospects-v2 .page-heading h1").length===1'),'un seul en-tête de page Prospection');
 check(await get('[...document.querySelectorAll(".prospect-view-switch button")].map(b=>b.textContent.trim().replace(/\\s*\\d+$/,"")).join("|")==="Liste|Parcours commercial|Historique"'),'trois vues : Liste, Parcours commercial, Historique');
 await shot('liste');
 await click('.prospects-v2>.page-heading .primary-button');await shot('creation');await click('.prospects-v2>.page-heading .secondary-button');
 // Une fiche par étape : carte « Prochaine étape », onglet d'ouverture, un seul bouton jaune dans la carte.
 const expected=[['new','Démarrer la prospection','Entreprise'],['qualifying','la qualification','Préparer l’échange'],['need_identified','Préparer le devis','Besoins'],['quote_sent','Poursuivre le devis','Devis']];
 for(let i=0;i<ids.length;i++){
  await click(`tr[data-record-id="${ids[i]}"]`);await click('[aria-label="Agrandir la fiche"]');await wait('document.querySelector(".prospect-record-header .aw-next-step")','fiche '+expected[i][0]);
  const info=await get('(()=>({primary:[...document.querySelectorAll(".aw-next-step .aw-ui-button--primary")].map(b=>b.textContent.trim()),active:document.querySelector(".prospect-desk-tabs .active")?.textContent.trim(),oldSave:document.body.textContent.includes("Enregistrer et continuer")}))()');
  check(info.primary.length===1&&info.primary[0].includes(expected[i][1]),`étape ${expected[i][0]} : action principale « ${expected[i][1]} »`);
  check(info.active===expected[i][2],`étape ${expected[i][0]} : ouverture sur l'onglet ${expected[i][2]} (obtenu ${info.active})`);
  check(!info.oldSave,`étape ${expected[i][0]} : plus de « Enregistrer et continuer »`);
  await shot('fiche-'+expected[i][0]);
  if(expected[i][0]==='need_identified'){
   await js('[...document.querySelectorAll(".needs-section-trigger")].forEach(b=>{if(b.getAttribute("aria-expanded")==="false")b.click()})');await sleep(250);
   check(await get('document.querySelectorAll(".needs-section-trigger").length===4&&[...document.querySelectorAll(".prospect-desk-content button")].filter(b=>b.textContent.trim()==="Enregistrer").length===1'),'Besoins : sections repliables et un seul « Enregistrer »');
   await shot('besoins-sections-ouvertes');
   await clickText('.prospect-record-header .aw-more-menu-trigger','Plus');await sleep(200);
   check(await get('[...document.querySelectorAll("[role=menuitem]")].map(b=>b.textContent.trim()).join("|").includes("Archiver")'),'menu « Plus » visible avec « Archiver »');
   await shot('menu-plus');
   await clickText('[role=menuitem]','Associations');await wait('document.querySelector("dialog[open], .prospect-dialog, [role=dialog]")','associations');await shot('associations');
   await js('(()=>{const b=[...document.querySelectorAll("[role=dialog] button, dialog button")].find(e=>e.textContent.trim()==="Fermer");if(b)b.click()})()');await sleep(250);
  }
  if(expected[i][0]==='quote_sent'){
   await clickText('.aw-next-step button','Programmer une action');await wait('document.querySelector(".prospect-action-dialog")','fenêtre action');
   check(await get('document.querySelectorAll(".prospect-action-dialog").length===1'),'une seule fenêtre « Planifier une action »');await shot('programmer-une-action');
   await js('(()=>{const b=[...document.querySelectorAll(".prospect-action-dialog button")].find(e=>e.textContent.trim().startsWith("Annuler"));if(b)b.click()})()');await sleep(250);
  }
  await click('.prospect-record-header .close-detail');await sleep(250);
 }
 await click('.prospect-view-switch button:nth-child(2)');await wait('document.querySelector(".kanban-board")','parcours');
 check(await get('document.querySelectorAll(".prospect-toolbar .primary-button").length===0'),'parcours commercial : aucun filtre en jaune');
 await shot('parcours-commercial');
 await click('.prospect-view-switch button:last-child');await sleep(300);await shot('historique');
 await navigate('Clients');await sleep(500);await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
 check(await get('document.querySelectorAll(".content-area .page-heading h1").length===1&&document.querySelector(".page-heading h1").textContent.trim()==="Clients"'),'Clients : un seul en-tête de page');
 await shot('clients');
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({date:'2026-11-13',viewport:[1920,1080],theme:'noir',density:'comfort',failures:fail,shots},null,2));
 console.log('GALERIE_TERMINEE '+shots.length+' captures, '+fail.length+' échec(s)');
 if(fail.length)throw new Error(fail.join(' ; '));
};

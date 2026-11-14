// Galerie de recette de la page Devis (refonte R4, thème Noir, densité Confort).
// Vérifie la structure visible : en-tête unique, assistant (« Suivant » bloqué avec sa raison), éditeur (menu « Plus », étape « Vérifier et envoyer »).
module.exports=async({win,db,evalUI:js,get,wait,navigate,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');
 const out=path.resolve('outputs/devis-galerie-r4-20261114');fs.mkdirSync(out,{recursive:true});const shots=[];
 const fail=[];const check=(ok,label)=>{if(!ok){fail.push(label);console.log('ECHEC '+label);}else console.log('OK '+label);};
 const click=async s=>{await js(`document.querySelector(${JSON.stringify(s)}).click()`);await sleep(220);};
 const clickText=async(scope,label)=>{await js(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(scope)})].find(e=>e.textContent.trim().includes(${JSON.stringify(label)}));if(!b)throw Error('Absent : '+${JSON.stringify(label)});b.click()})()`);await sleep(260);};
 async function shot(name){await js('document.activeElement?.blur()');await sleep(180);const file=String(shots.length+1).padStart(3,'0')+'-'+name+'.png';fs.writeFileSync(path.join(out,file),(await win.webContents.capturePage()).toPNG());shots.push(file);console.log('CAPTURE '+file);}
 const o=db.crm.createOrganization({name:'TEST — Maison Lefèvre',industry:'Artisan',city:'Dijon'}),c=db.crm.createContact({organizationId:o.id,firstName:'Camille',lastName:'Lefèvre'}),p=db.crm.createProspect({organizationId:o.id,contactId:c.id,stage:'quote_to_prepare',primaryNeed:'Site vitrine'});
 db.crm.saveContactMethod({contactId:c.id,type:'email',value:'demo@example.test',isPrimary:true});
 const quote=db.quotes.create({prospectId:p.id,subject:'TEST — Proposition site vitrine'});
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);
 await navigate('Devis');await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
 await wait('document.querySelector("tr[data-record-id]")','liste des devis');
 check(await get('document.querySelectorAll(".content-area .page-heading h1").length===1&&document.querySelector(".page-heading h1").textContent.trim()==="Devis"'),'un seul en-tête de page Devis');
 check(await get('!!document.querySelector(".aw-status-pill")&&!document.querySelector(".quote-status")'),'statut en pastille commune');
 await shot('liste');
 // Assistant : « Suivant » bloqué avec sa raison.
 await clickText('.quote-toolbar button','Nouveau devis');await wait('document.querySelector(".quote-wizard")','assistant');
 check(await get('(()=>{const b=[...document.querySelectorAll(".quote-wizard-actions button")].find(e=>e.textContent.includes("Suivant"));return !!b&&b.disabled&&!!document.querySelector(".quote-wizard-hint")&&document.querySelector(".quote-wizard-hint").textContent.includes("pour continuer")})()'),'assistant : « Suivant » inactif avec sa raison');
 check(await get('!document.querySelector(".quote-wizard .form-error")'),'assistant : aucune erreur affichée à l’ouverture');
 await shot('assistant-pour-qui');
 await clickText('.quote-toolbar button','Fermer');await sleep(300);
 // Éditeur : outils en « Plus », dernière étape « Vérifier et envoyer ».
 await click(`tr[data-record-id="${quote.id}"]`);await wait('document.querySelector(".quote-journey")','éditeur');
 check(await get('!!document.querySelector(".quote-editor-tools .aw-more-menu-trigger")&&![...document.querySelectorAll(".quote-editor-tools > button")].length'),'éditeur : les outils sont dans un seul menu « Plus »');
 await click('.quote-editor-tools .aw-more-menu-trigger');await sleep(250);
 check(await get('[...document.querySelectorAll("[role=menuitem]")].map(b=>b.textContent.trim()).join("|").includes("Réglages de l’entreprise et du modèle")'),'éditeur : le menu « Plus » liste l’aperçu, le modèle et les réglages');
 await shot('editeur-menu-plus');await click('.quote-editor-tools .aw-more-menu-trigger');await sleep(250);
 check(await get('[...document.querySelectorAll(".quote-journey [role=tab]")].map(b=>b.textContent.trim()).join("|").includes("3. Vérifier et envoyer")'),'éditeur : étape « 3. Vérifier et envoyer »');
 await clickText('.quote-journey [role=tab]','Vérifier et envoyer');await sleep(500);await shot('editeur-verifier-et-envoyer');
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({date:'2026-11-14',viewport:[1920,1080],theme:'noir',density:'comfort',failures:fail,shots},null,2));
 console.log('GALERIE_DEVIS_TERMINEE '+shots.length+' captures, '+fail.length+' échec(s)');
 if(fail.length)throw new Error(fail.join(' ; '));
};

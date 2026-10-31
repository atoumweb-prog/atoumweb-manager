// One configuration only; real App/preload/services on exclusively TEMP data.
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{dialog}=require('electron');
 const ids=[];
 for(const [name,industry,city,stage] of [['Toutes les Fleurs','Fleuriste','Dijon','qualifying'],['Euro Trans Sécurité','Sécurité','Chenôve','need_identified'],['Atelier du Bois','Artisan','Dijon','new'],['Cazor Auto Passion','Automobile','Dijon','quote_to_prepare'],['Studio Photo','Photographe','Talant','negotiation'],['Maison Lefèvre','Artisan','Dijon','quote_sent']]){
  const org=db.crm.createOrganization({name,industry,city}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:name.split(' ')[0],jobTitle:'Responsable',email:'demo@example.test'}),p=db.crm.createProspect({organizationId:org.id,contactId:contact.id,stage,temperature:'neutral',source:'referral'});ids.push(p.id);db.actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:stage==='quote_to_prepare'?'Préparer la proposition commerciale':'Échanger sur le projet',dueAt:new Date(Date.now()+86400000*(stage==='negotiation'?-1:0)).toISOString()});
 }
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')])),before=snapshot();
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);await navigate('Prospection');
 await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
 await wait('document.querySelectorAll(".prospect-directory-table tbody tr").length===6','six actual prospects');
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(50);};
 test(await get('document.querySelectorAll("h1").length===1&&!document.querySelector(".empty-module")'),'One meaningful title, no duplicated technical heading');
 test(await get('innerWidth===1920&&innerHeight===1080'),'Only standard 1920x1080 viewport');
 await click('[data-prospect-filter=qualifying]');test(await get('document.querySelectorAll(".prospect-directory-table tbody tr").length===1'),'Counter filters actual qualifying prospects');
 await click('[data-prospect-filter=all]');test(await get('document.querySelectorAll(".prospect-directory-table tbody tr").length===6'),'All counter restores actual rows');
 await click(`tr[data-record-id="${ids[0]}"]`);await wait(`document.querySelector('aside[data-prospect-id="${ids[0]}"]')`,'quick panel selected');
 await js('window.__prospectionPanel=document.querySelector("aside[data-prospect-id]");window.__prospectionTimer=document.querySelector(".global-timer")');
 await click('[data-prospect-filter=quote_to_prepare]');test(await get(`document.querySelector('aside[data-prospect-id]').dataset.prospectId===${JSON.stringify(ids[0])}&&document.querySelector('aside[data-prospect-id]')===window.__prospectionPanel`),'Filtering out a row preserves selection and mounted quick panel');
 await click('[data-prospect-filter=all]');await click('[aria-label="Trier par Entreprise"]');test(await get('document.querySelector("aside[data-prospect-id]")===window.__prospectionPanel'),'Sort preserves selected panel identity');
 test(await get('document.querySelectorAll("th[data-column-id=next_action]").length===1&&document.querySelectorAll("th[data-column-id=due]").length===1'),'Action and due-date columns available');
 test(await get(`[...document.querySelectorAll('.prospect-directory-filters input,.prospect-directory-filters select')].every(e=>e.getBoundingClientRect().width>=100)`),'Search and filters have readable widths');
 const out=path.resolve('outputs','prospection-pilot-standard');fs.mkdirSync(out,{recursive:true});const captures=[];
 async function capture(name){await js('document.querySelector(".content-area").scrollTop=0;document.activeElement?.blur();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await sleep(120);fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());captures.push(name+'.png');}
 await capture('annuaire-fiche-rapide');
 await click('[aria-label="Agrandir la fiche"]');await wait('document.querySelector(".prospect-detail-desk")','existing Prospect A desk');test(await get('document.querySelector(".prospect-focus-summary")&&document.querySelectorAll(".prospect-section-group").length===3'),'Existing Prospect A and its three groups retained');
 await click('.prospect-detail-desk [aria-label="Fermer la fiche prospect"]');
 await click('[aria-label="Fermer la fiche prospect"]');
 await click('.prospection-pilot-heading .primary-button');await wait('document.querySelector(".prospect-create-v2")','existing creation form');
 await js(`const input=document.querySelector('.prospect-create-v2 input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'BROUILLON TEMP CONSERVE');input.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(50);
 const original=dialog.showMessageBoxSync,confirmations=[];dialog.showMessageBoxSync=(...args)=>{confirmations.push(args.at(-1));return 0;};
 try{await click('[data-nav-module=Clients]');test(confirmations.length===1&&confirmations[0].defaultId===0,'UX01 asks exactly once with Stay default');test(await get('document.querySelector(".prospect-create-v2 input").value==="BROUILLON TEMP CONSERVE"'),'Stay retains exact creation draft');}finally{dialog.showMessageBoxSync=original;}
 // Keep the dirty creation draft mounted while visiting the same module views.
 await click('.prospect-view-switch button:nth-child(2)');await wait('document.querySelector(".kanban-board")','existing pipeline');
 test(await get('document.querySelectorAll(".kanban-board>.kanban-column").length===6&&!!document.querySelector(".pipeline-conversion-history")'),'Six active stages and separate conversion history');await capture('parcours-commercial');
 await click('.prospect-view-switch button:nth-child(3)');test(await get('!!document.querySelector(".history-view-stack")'),'Existing history preserved');await capture('historique');
 await click('.prospect-view-switch button:first-child');test(await get('document.querySelector(".prospect-create-v2 input").value==="BROUILLON TEMP CONSERVE"'),'Returning from views retains creation draft');
 test(await get('document.querySelector(".global-timer")===window.__prospectionTimer&&document.querySelectorAll(".global-timer").length===1'),'Unique existing timer unchanged');
 test(snapshot()===before,'All presentation and navigation actions preserve business data');
 const report={sha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),onlyTemp:true,theme:'noir',density:'comfort',viewport:[1920,1080],zoom:1,captures};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><title>Prospection — pilote réel</title><style>body{background:#031321;color:#eef4ff;font:16px system-ui;margin:24px}img{width:100%;height:auto}article{margin-block:32px}</style><h1>Prospection — candidat réel</h1><p>SHA '+report.sha+' — Noir / Confort / 1920×1080 / 100 %. Données synthétiques uniquement. Les écrans Pipeline/Historique sont des contrôles de conservation ; aucune donnée fictive n’est ajoutée dans leurs compteurs.</p>'+captures.map(f=>'<article><h2>'+f+'</h2><img src="'+f+'"></article>').join('')+'</html>');console.log('PROSPECTION_REVIEW '+JSON.stringify(report));
};

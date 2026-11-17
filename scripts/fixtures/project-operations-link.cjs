'use strict';
// P3b F20 : de l'onglet Interventions d'un projet à la page Interventions filtrée par projet.
// Base temporaire du harnais réel : jamais la préproduction.
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const org=db.crm.createOrganization({name:'TEST — P3B Organisation'}),client=db.crm.createClient({organizationId:org.id});
 const project=db.projects.createInternal({name:'TEST P3B PROJET'}),other=db.projects.createInternal({name:'TEST P3B AUTRE PROJET'});
 db.database.run('UPDATE projects SET client_account_id=? WHERE id IN (?,?)',[client.id,project.id,other.id]);
 for(let i=1;i<=8;i++)db.operations.createRequest({clientAccountId:client.id,projectId:project.id,subject:'TEST P3B DEMANDE '+i,source:'email'});
 db.operations.createRequest({clientAccountId:client.id,projectId:other.id,subject:'TEST P3B AUTRE DEMANDE',source:'email'});
 for(let i=1;i<=9;i++)db.operations.createIntervention({clientAccountId:client.id,projectId:project.id,subject:'TEST P3B INTERVENTION '+i,type:'incident',coverageMode:'internal'});
 db.operations.createIntervention({clientAccountId:client.id,projectId:other.id,subject:'TEST P3B AUTRE INTERVENTION',type:'incident',coverageMode:'internal'});
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
 const before=snapshot();
 win.setContentSize(1510,1030);win.webContents.setZoomFactor(1);
 const openProjectInterventions=async()=>{
  await navigate('Projets');
  await get("(()=>{const b=[...document.querySelectorAll('.content-area button')].find(x=>x.textContent.trim().startsWith('←')&&x.textContent.includes('Projets'));if(b)b.click();return true})()");await sleep(500);
  await js("const r=[...document.querySelectorAll('.content-area tbody tr')].find(x=>x.textContent.includes('TEST P3B PROJET')&&!x.textContent.includes('AUTRE'));if(!r)throw Error('Projet introuvable');const b=r.querySelector('.link-button');(b||r).click();");
  await wait('document.querySelector(".project-production-nav")','project opened');
  await js("const b=[...document.querySelectorAll('.project-production-nav button')].find(x=>x.textContent.trim()==='Interventions');if(!b)throw Error('Onglet Interventions absent');b.click();");
  await wait('document.querySelector(".project-operations-view")&&!document.body.innerText.includes("Chargement des opérations")','operations tab');
 };
 const toolbarCount=()=>get('document.querySelector(".aw-list-toolbar-count")?.textContent.trim()');

 await openProjectInterventions();
 test(await get('[...document.querySelectorAll(".project-operation-more")].some(e=>e.textContent.includes("+ 2 autres demandes non affichées"))'),'Hidden requests are still said');
 test(await get('[...document.querySelectorAll(".project-operation-more button.link-button")].map(b=>b.textContent.trim()).join("|")')==='Voir toutes (8)|Voir toutes (9)','Both lists offer a « Voir toutes (N) » link with the exact totals');

 await js('[...document.querySelectorAll(".project-operation-more button.link-button")].find(b=>b.textContent.trim()==="Voir toutes (8)").click()');
 await wait('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Interventions & Maintenance"&&document.querySelector(".aw-filter-chip")','filtered operations page');
 test(await get('document.querySelector(".aw-filter-chip").textContent.includes("Projet : TEST P3B PROJET")'),'Chip names the project');
 test(await toolbarCount()==='8 demandes','Only the 8 requests of the project are counted');
 test(await get('document.body.innerText.includes("TEST P3B DEMANDE 8")&&!document.body.innerText.includes("TEST P3B AUTRE DEMANDE")'),'No request of another project is shown');

 await js('document.querySelector(".aw-filter-chip-clear").click()');
 await wait('!document.querySelector(".aw-filter-chip")','chip removed');
 test(await toolbarCount()==='9 demandes','Removing the chip restores the complete list');
 test(await get('document.body.innerText.includes("TEST P3B AUTRE DEMANDE")'),'The request of the other project is back');

 await openProjectInterventions();
 await js('[...document.querySelectorAll(".project-operation-more button.link-button")].find(b=>b.textContent.trim()==="Voir toutes (9)").click()');
 await wait('document.querySelector(".aw-filter-chip")&&document.querySelector(".aw-list-toolbar-count")?.textContent.includes("intervention")','filtered interventions');
 test(await toolbarCount()==='9 interventions','Only the 9 interventions of the project are counted');
 test(await get('!document.body.innerText.includes("TEST P3B AUTRE INTERVENTION")'),'No intervention of another project is shown');

 await navigate('Projets');await navigate('Interventions & Maintenance');await sleep(400);
 test(await get('!document.querySelector(".aw-filter-chip")'),'Opening the page from the rail never keeps an old filter');
 test(snapshot()===before,'The filter writes nothing to the database');
};

'use strict';
module.exports=async context=>{
 const {win,db,evalUI:js,get,wait,navigate,test,sleep}=context;
 await require('./03e-directory-scenarios.cjs')(context);
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
 const baseline=snapshot();await js('window.__generalTimer=document.querySelector(".global-timer")');
 const textClick=async(selector,text)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()`);await sleep(70);};
 const cases=[
  ['Prospection','prospects-directory','.prospect-view-switch button','Annuaire prospects'],
  ['Clients','clients-directory'],
  ['Offres & Tarifs','catalog-administration','.catalog-toolbar button',"Tableau d'administration"],
  ['Devis','quotes-list'],['Projets','projects-list'],
  ['Interventions & Maintenance','requests-list','.operations-view-tabs button','Demandes'],
  ['Interventions & Maintenance','interventions-list','.operations-view-tabs button','Interventions'],
  ['Gestion des temps','time-sessions'],['Facturation','billing-list'],['Dépenses','expenses-list'],
  ['Documents & Contrats','documents-list'],
  ['Annuaire','directory-organizations','.directory-view-tabs button','Organisations'],
  ['Annuaire','directory-contacts','.directory-view-tabs button','Contacts'],
 ];
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
  for(const [page,scope,selector,label]of cases){
   await navigate(page);if(selector)await textClick(selector,label);
   const root='[data-table-scope="'+scope+'"]';await wait('!!document.querySelector('+JSON.stringify(root)+')','actual '+scope);
   await js(`window.__generalTable=document.querySelector(${JSON.stringify(root)});window.__generalTable.querySelector('summary').click()`);await sleep(50);
   test(await get('!window.__generalTable.querySelector("[role=alert]")'),'Preferences readable '+scope+'/'+theme+'/'+density);
   test(await get('window.__generalTable.querySelector("[data-column-toggle=identity]").disabled'),'Mandatory identity '+scope+'/'+theme+'/'+density);
   test(await get('window.__generalTable.querySelectorAll("[data-column-toggle]:disabled").length>=2'),'Mandatory identity/actions '+scope+'/'+theme+'/'+density);
   await js('window.__generalRecordIds=[...window.__generalTable.querySelectorAll("tbody tr")].map(e=>e.dataset.recordId).sort();window.__generalTable.querySelector("th .aw-ui-button")?.click()');await sleep(40);
   test(await get('JSON.stringify(window.__generalRecordIds)===JSON.stringify([...window.__generalTable.querySelectorAll("tbody tr")].map(e=>e.dataset.recordId).sort())'),'Sort preserves exact identities '+scope+'/'+theme+'/'+density);
   test(await get('window.__generalTimer===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1'),'Same business timer '+scope+'/'+theme+'/'+density);
   await js('window.__generalTable.querySelector("summary").click()');
   if(process.env.ATOUMWEB_VISUAL_GENERALIZATION_CAPTURES)await require('./verified-crm-capture.cjs')({win,js,test,folder:process.env.ATOUMWEB_VISUAL_GENERALIZATION_CAPTURES,file:scope+'-'+theme+'-'+density+'.png',theme,density,scene:scope});
   win.setSize(900,720);win.webContents.setZoomFactor(1.25);await sleep(40);
   test(await get('document.documentElement.scrollWidth<=innerWidth+2&&window.__generalTable.isConnected'),'Narrow/zoom table scroll stays local '+scope+'/'+theme+'/'+density);
   win.webContents.setZoomFactor(1);win.setSize(1510,1030);
  }
 }
 test(snapshot()===baseline,'All presentation/sort/theme/zoom commands leave business tables byte-for-byte unchanged');
 console.log('VISUAL_GENERALIZATION_EVIDENCE '+JSON.stringify({schemas:cases.length,configurations:9,onlyTemp:true,businessMutation:false}));
};

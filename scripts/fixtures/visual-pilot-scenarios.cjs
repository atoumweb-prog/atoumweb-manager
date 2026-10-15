// Real application, synthetic identities only. before/after use the same fixture.
module.exports=async({win,db,evalUI:js,get,wait,navigate,select,test,sleep,saveScreenshot})=>{
 const before=process.env.ATOUMWEB_VISUAL_PILOT==='before';
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click()`);await sleep(90);};
 const text=async(selector,value)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(value)}));if(!e)throw Error('Missing '+${JSON.stringify(value)});e.click()`);await sleep(90);};
 const records=[];
 for(const [name,industry,city,temperature,stage] of [['Atelier Lumière','Artisanat','Dijon','warm','new'],['Studio Rive','Design','Lyon','hot','qualifying'],['Maison Orbe','Commerce','Beaune','cold','need_identified'],['Les Jardins','Paysage','Dijon','neutral','qualifying']]){
  const org=db.crm.createOrganization({name,industry,city});
  const p=db.crm.createProspect({organizationId:org.id,temperature,primaryNeed:'Présenter son activité et recevoir des demandes de contact'});
  // Explicit synthetic state fixture; transition semantics are exercised by 03B.
  db.database.run('UPDATE prospects SET stage=? WHERE id=?',[stage,p.id]);records.push(p);
 }
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
 const domain=snapshot();
 await js('window.dispatchEvent(new Event("atoumweb:changed"))');
 for(const [theme,name] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']])for(const[density,label,font,height]of[['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48]]){
  await select(theme,name,density,label,font,height);await navigate('Prospection');
  await text('.prospect-view-switch button','Annuaire prospects');
  await wait('document.querySelectorAll(".prospects-v2 tbody tr").length>=4','four synthetic prospects');
  if(!before){
   test(await get('!document.querySelector(".aw-configured-table [role=alert]")'),'Real preferences readable '+theme+'/'+density);
   test(await get('document.querySelectorAll(".aw-rail-icon-slot,.aw-rail-logo-slot").length===0'),'No placeholder initials '+theme+'/'+density);
   test(await get('document.querySelector(".aw-brand-symbol").naturalWidth>0'),'Candidate brand actually decoded '+theme+'/'+density);
   test(await get('parseFloat(getComputedStyle(document.querySelector(".client-name-cell strong")).fontSize)==='+font),'Primary record font follows density '+theme+'/'+density);
   test(await get('document.querySelector(".aw-workspace-header").getBoundingClientRect().height<100'),'Header height below 100 CSS px on wide window '+theme+'/'+density);
  }
  await saveScreenshot(theme,density,'Prospection',(before?'avant':'apres')+'-liste');
  await click('.prospects-v2 tbody tr');await wait('!!document.querySelector(".prospect-detail-v2")','quick record');
  await saveScreenshot(theme,density,'Prospection',(before?'avant':'apres')+'-fiche-rapide');
  await click('[aria-label="Agrandir la fiche"]');await wait('!!document.querySelector(".prospect-desk-overlay")','expanded record');
  await saveScreenshot(theme,density,'Prospection',(before?'avant':'apres')+'-fiche-complete');
  await click('.prospect-desk-overlay [aria-label="Fermer la fiche prospect"]');
  if(await get('!!document.querySelector(".prospect-detail-v2")'))await click('.prospect-detail-v2 [aria-label="Fermer la fiche prospect"]');
  await text('.prospect-view-switch button','Parcours commercial');await wait('document.querySelectorAll(".pipeline-step-column").length===7','6+1 columns');
  await saveScreenshot(theme,density,'Prospection',(before?'avant':'apres')+'-pipeline');
  test(await get('document.querySelectorAll(".global-timer").length===1'),'Unique real timer '+theme+'/'+density);
 }
 if(!before){
  const {dialog}=require('electron'),originalDialog=dialog.showMessageBoxSync,answers=[],confirmations=[];
  dialog.showMessageBoxSync=(...args)=>{confirmations.push(args.at(-1));return answers.shift()??0;};
  const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))`);await sleep(90);};
  try{
   await text('.prospect-view-switch button','Annuaire prospects');
   await click('.prospects-v2 tbody tr');
   await js('window.__pilotQuick=document.querySelector(".prospect-detail-v2");window.__pilotTimer=document.querySelector(".global-timer")');
   await text('.prospect-directory-toolbar button','Ajouter une entreprise');
   await input('.prospect-create-v2 input','BROUILLON PILOTE À CONSERVER');
   await js('window.__pilotInput=document.querySelector(".prospect-create-v2 input")');
   await click('[aria-label="Trier par Entreprise"]');await click('[aria-label="Trier par Entreprise"]');
   await input('[aria-label="Rechercher les prospects"]','AUCUNE LIGNE');
   test(await get('document.querySelectorAll(".aw-data-table tbody tr").length===0'),'Filter really hides all rows');
   test(await get('window.__pilotQuick===document.querySelector(".prospect-detail-v2")'),'Filtered row does not unmount selected quick record');
   test(await get('window.__pilotInput===document.querySelector(".prospect-create-v2 input")&&window.__pilotInput.value==="BROUILLON PILOTE À CONSERVER"'),'Sort/filter retains mounted input and exact draft');
   await input('[aria-label="Rechercher les prospects"]','');
   await click('.aw-table-preferences>summary');
   test(await get('document.querySelector("[data-column-toggle=identity]").disabled&&document.querySelector("[data-column-toggle=open]").disabled'),'Identity and open columns mandatory');
   await click('[data-column-toggle=contact]');
   test(await get('!document.querySelector(".aw-data-table th[data-column-id=contact]")'),'Contact column can be hidden');
   await click('[aria-label="Avancer Ville"]');
   test(await get('[...document.querySelectorAll(".aw-data-table th")].map(e=>e.dataset.columnId).join(",")==="identity,city,industry,status,open"'),'Keyboard alternative reorders columns');
   const originalSetting=db.setSetting;let writes=0;db.setSetting=function(...args){writes++;return originalSetting.apply(this,args);};
   try{
    await js('const e=document.querySelector(".aw-data-table th[data-column-id=industry] .aw-column-sizer");e.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,pointerId:52,clientX:200}));window.dispatchEvent(new PointerEvent("pointermove",{pointerId:52,clientX:240}));window.dispatchEvent(new PointerEvent("pointermove",{pointerId:52,clientX:280}));');
    test(writes===0,'Resize preview writes no preference during pointermove');
    await js('window.dispatchEvent(new PointerEvent("pointerup",{pointerId:52,clientX:280}))');await sleep(90);
    test(writes===1,'Resize writes exactly once at end of gesture');
   }finally{db.setSetting=originalSetting;}
   await input('#table-view-name','Vue pilote');await text('.aw-saved-views button','Dupliquer la vue');
   test(await get('document.querySelector("#table-personal-view").value!=="standard"'),'Named duplicate selected');
   await input('#table-view-name','Vue renommée');await text('.aw-saved-views button','Renommer');
   test(await get('document.querySelector("#table-personal-view option:checked").textContent==="Vue renommée"'),'Personal view renamed');
   const raw=await get('window.atoumweb.visualPreferences.getItem("atoumweb:table-workshop:prospects-directory:personal:v1")');
   test(!raw.includes('BROUILLON')&&!raw.includes(records[0].id)&&!raw.includes('AUCUNE LIGNE'),'Preferences exclude IDs, draft and search text');
   await text('.aw-saved-views button','Supprimer la vue personnelle');
   test(await get('document.querySelector("#table-personal-view").value==="standard"'),'Delete personal view returns to standard');
   await text('.aw-saved-views button','Rétablir la vue standard');
   test(await get('document.querySelectorAll(".aw-data-table th").length===6'),'Standard columns restored');
   test(confirmations.length===0,'Visual preferences and filters never discard or confirm drafts');
   await click('[data-nav-module="Réglages"]');
   test(confirmations.length===1&&confirmations[0].defaultId===0,'Leaving dirty pilot asks once with Stay default');
   test(await get('document.querySelector(".prospect-create-v2 input").value==="BROUILLON PILOTE À CONSERVER"'),'Stay retains exact draft');
   answers.push(1);await navigate('Réglages');
   test(confirmations.length===2,'Explicit discard confirms exactly once');
   test(await get('window.__pilotTimer===document.querySelector(".global-timer")'),'Presentation and route retain exact true timer');
  }finally{dialog.showMessageBoxSync=originalDialog;}
 }
 test(snapshot()===domain,'Visual pilot navigation never mutates domain tables');
 test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','Pilot SQLite integrity');
 test(db.database.all('PRAGMA foreign_key_check').length===0,'Pilot foreign keys');
};

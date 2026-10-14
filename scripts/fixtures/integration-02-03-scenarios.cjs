'use strict';
module.exports=async context=>{
 const {win,db,temp,registered,evalUI:js,get,wait,navigate,test,sleep}=context;
 const {dialog,ipcMain}=require('electron');
 const path=require('node:path'),originalDialog=dialog.showMessageBoxSync,answers=[],dialogs=[];
 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click()`);await sleep(80);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()`);await sleep(60);};
 const search=async(term,type,id)=>{
  if(!await get('!!document.querySelector(".aw-header-search.is-open")'))await click('#header-search-trigger');await input('.global-search input','');await input('.global-search input',term);
  await wait(`!!document.querySelector('[data-search-type="${type}"][data-search-id="${id}"]')`,'search exact '+type);
  await click(`[data-search-type="${type}"][data-search-id="${id}"]`);
 };
 const loaded=(type,id)=>wait(`!!document.querySelector('[data-search-entity-type="${type}"][data-search-entity-id="${id}"]')`,'visible exact '+type);
 const textClick=async(selector,text)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()`);await sleep(80);};
 const emit=()=>js('window.dispatchEvent(new Event("atoumweb:changed"))');
 try{
  const org=db.crm.createOrganization({name:'CONVERGENCE JOURNEY'});
  const p=db.crm.createProspect({organizationId:org.id,primaryNeed:'CONVERGENCE SITE'});
  const q=db.quotes.create({prospectId:p.id,subject:'CONVERGENCE QUOTE'});
  db.quotes.addCustomLine(q.id,{label:'Prestation de recette uniquement',proposedUnitPriceCents:10000});
  const template=db.projects.createTemplate({name:'CONVERGENCE PLAN TEMP',projectType:'website'}).versions[0];
  db.projects.addTemplateNode(template.id,{type:'task',name:'Travail explicite TEMP'});db.projects.publishTemplateVersion(template.id);
  test(db.crm.listProspects().find(item=>item.id===p.id).stage==='new','C05 E72: quote creation preserves new');
  await navigate('Accueil');await search('CONVERGENCE JOURNEY','prospect',p.id);await loaded('prospect',p.id);
  test(await get('document.activeElement.dataset.searchEntityId')===p.id,'C08 Home search focuses exact Prospect');
  await textClick('.prospect-detail-panel button','Ouvrir la fiche de travail');
  await wait('!!document.querySelector(".prospect-desk-overlay")','work desk');
  test(await get('document.querySelector(".prospect-desk-overlay [data-search-entity-type=prospect]")?.dataset.searchEntityId')===p.id,'C02 work desk confirms its displayed identity');
  // Existing commercial APIs prepare deterministic fixture facts; UI never infers new rules.
  await click('.prospect-desk-overlay .start-qualification-button');
  await wait('!!document.querySelector(".qualification-panel-v2")','explicit UI start');
  db.workflow.saveNeed('prospect',p.id,{otherText:'CONVERGENCE SITE'});await emit();await sleep(100);
  test(db.crm.listProspects().find(item=>item.id===p.id).stage==='qualifying','C05 explicit start is distinct from quote creation');
  test(await get('!!document.querySelector(".prospect-qualification-panel,.qualification-panel,.prospect-workspace")')||await get('document.querySelector(".prospect-desk-overlay").textContent.includes("Qualification")'),'C08 qualification available in actual desk');
  await wait('!!document.querySelector(".qualification-panel-v2 textarea")','actual qualification field');
  await input('.qualification-panel-v2 textarea','CONVERGENCE QUALIFICATION DIRTY');
  await js('window.__combinedDesk=document.querySelector(".prospect-desk-overlay")');
  const before=dialogs.length;await search('CONVERGENCE QUOTE','quote',q.id);
  await wait('!!document.querySelector(".search-results-panel [role=alert]")','qualification Stay');
  test(dialogs.length===before+1&&dialogs.at(-1).defaultId===0,'C07 dirty qualification asks exactly once, Stay default');
  test(await get('window.__combinedDesk===document.querySelector(".prospect-desk-overlay")&&document.querySelector(".qualification-panel-v2 textarea").value==="CONVERGENCE QUALIFICATION DIRTY"'),'C07 search refusal keeps mounted desk and qualification draft');
  await js('document.querySelector(".global-search input").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(80);
  const realSave=db.crm.updateProspectQualificationBriefIfUnchanged.bind(db.crm);let rejectSave;
  db.crm.updateProspectQualificationBriefIfUnchanged=()=>new Promise((_resolve,reject)=>{rejectSave=reject;});
  try{
   await textClick('.qualification-actions button','Enregistrer la qualification');
   await wait('document.querySelector(".qualification-actions button").disabled','pending real qualification IPC');
   const pendingCount=dialogs.length;await search('CONVERGENCE QUOTE','quote',q.id);
   await wait('!!document.querySelector(".search-results-panel [role=alert]")','pending navigation denied');
   test(dialogs.length===pendingCount+1&&await get('window.__combinedDesk===document.querySelector(".prospect-desk-overlay")'),'C07 pending qualification blocks search replacement without remount');
   rejectSave(Error('Injected combined qualification save refusal'));
   await wait('!document.querySelector(".qualification-actions button").disabled','qualification failure completed');
   test(await get('document.querySelector(".qualification-panel-v2 textarea").value==="CONVERGENCE QUALIFICATION DIRTY"'),'C07 failed pending save never clears qualification draft');
  }finally{db.crm.updateProspectQualificationBriefIfUnchanged=realSave;}
  await js('document.querySelector(".global-search input").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(80);
  await textClick('.qualification-actions button','Enregistrer la qualification');
  await wait('!document.querySelector(".qualification-actions button").disabled','qualification save confirmed');
  test(db.crm.listProspects().find(item=>item.id===p.id).projectSummary==='CONVERGENCE QUALIFICATION DIRTY','C08 inbound qualification project summary persisted through optimistic IPC');
  db.crm.updateProspectQualification(p.id,{projectSummary:'CONVERGENCE SITE',decisionStatus:'unknown',budgetStatus:'not_disclosed',timelineStatus:'not_disclosed'});
  db.crm.changeProspectStage(p.id,'need_identified',null,true);await emit();
  await wait('document.querySelector(".need-identification-fields textarea")?.value==="CONVERGENCE SITE"','actual Needs model loaded');
  await input('.need-identification-fields textarea','CONVERGENCE NEEDS');
  await textClick('.need-identification-fields button','Enregistrer l’identification du besoin');
  await wait(`(await window.atoumweb.crm.prospects.list()).find(p=>p.id===${JSON.stringify(p.id)})?.projectSummary==='CONVERGENCE NEEDS'&&!document.querySelector('.need-identification-fields button.primary-button').disabled`,'Needs save confirmed by persisted model');
  test(db.crm.listProspects().find(item=>item.id===p.id).projectSummary==='CONVERGENCE NEEDS','C08 actual Needs saves correct Prospect, existing quote not duplicated');
  test(db.quotes.list({prospectId:p.id}).length===1,'C08 qualification and Needs never duplicate the Quote');
  await js('document.querySelector(".prospect-desk-overlay .close-detail").click()');await sleep(80);
  await search('CONVERGENCE QUOTE','quote',q.id);await loaded('quote',q.id);
  await wait('!!document.querySelector(".quote-project-create button.primary-button:not([disabled])")','project guard lookup');
  await js(`const e=document.querySelector('.quote-project-create select');e.value=${JSON.stringify(template.id)};e.dispatchEvent(new Event('change',{bubbles:true}))`);await sleep(80);
  await click('.quote-project-create button.primary-button');
  await wait('document.querySelector(".quote-project-create [role=status]")?.textContent.includes("Projet en préparation")','provisional project');
  let project=db.database.get('SELECT id,commercial_state FROM projects WHERE source_quote_id=?',[q.id]);
  test(project?.commercial_state==='provisional','C04/C08 real UI prepares provisional Project from exact Quote');
  const projectId=project.id;
  const fixture=path.join(temp,'quote-fixture.cjs');
  require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../../src/main/testSupport/quotePreparationFixture.ts')],outfile:fixture,bundle:true,platform:'node',format:'cjs',external:['electron'],logLevel:'silent'});
  require(fixture).finalizeForTest(db.database,db.quotes,q.id);db.quotes.markSent(q.id);
  db.quotePreparation.recordAcceptance(q.id,'Acceptation explicite TEMP','2026-10-13T12:00:00Z','Recette de convergence synthétique');
  const accepted=await get(`window.atoumweb.quotes.accept(${JSON.stringify(q.id)})`);
  const second=await get(`window.atoumweb.quotes.accept(${JSON.stringify(q.id)})`);
  test(accepted.acceptedClientAccountId===second.acceptedClientAccountId&&db.crm.listClients().length===1,'C06 conversion via real IPC is idempotent, one Client');
  project=db.database.get('SELECT id,commercial_state,client_account_id FROM projects WHERE id=?',[projectId]);
  test(project.id===projectId&&project.client_account_id===accepted.acceptedClientAccountId&&project.commercial_state!=='provisional','C08 acceptance activates same Project and links same Client');
  await emit();await search('CONVERGENCE JOURNEY','client',accepted.acceptedClientAccountId);await loaded('client',accepted.acceptedClientAccountId);
  test(await get('document.querySelector(".client-summary-panel").dataset.searchEntityId')===accepted.acceptedClientAccountId,'C08 converted Client navigation uses actual ID');
  await navigate('Prospection');await textClick('.prospect-view-switch button','Parcours commercial');await textClick('.pipeline-conversion-history button','Voir les conversions');
  await click('.history-prospect-row');await loaded('prospect',p.id);
  test(await get('document.querySelector(".history-view-stack [data-search-entity-type=prospect]")?.dataset.searchEntityId')===p.id,'C02 Conversion pane acknowledges converted Prospect');
  await input('.history-view-stack .inline-search','NO MATCH CONVERGENCE');
  test(await get('!document.querySelector(".history-view-stack [data-search-entity-type=prospect]")'),'C02 filtered historical pane is never falsely acknowledged');
  await search('CONVERGENCE JOURNEY','prospect',p.id);await loaded('prospect',p.id);
  test(await get(`document.querySelector('[data-search-entity-type=prospect][data-search-entity-id="${p.id}"]').getClientRects().length>0&&document.querySelector('.prospect-detail-panel').textContent.includes('CONVERGENCE JOURNEY')`),'C02 search from filtered Conversion returns to visible exact record');
  // Two real list refreshes return out of order while the actual Prospect remains selected.
  const handler=registered.get('crm:prospects:list'),delayed=[];
  ipcMain.removeHandler('crm:prospects:list');ipcMain.handle('crm:prospects:list',(...args)=>{const value=handler(...args);return new Promise(resolve=>delayed.push(()=>resolve(value)));});
  try{
   await emit();await wait('true','first refresh');await sleep(80);const obsolete=delayed.shift();test(!!obsolete,'C03 first list IPC intentionally delayed');
   const old=db.crm.listProspects({includeArchived:true});
   // Freeze the first response snapshot, then release the later real response first.
   ipcMain.removeHandler('crm:prospects:list');ipcMain.handle('crm:prospects:list',handler);
   db.crm.updateOrganization(org.id,{name:'CONVERGENCE LATEST'});await emit();
   await wait('document.querySelector(".prospect-detail-panel")?.textContent.includes("CONVERGENCE LATEST")','latest Prospect refresh');
   // Separate stale activity request is checked by the permanent 02C/UX-01 guards.
   obsolete();await sleep(100);
   test(await get('document.querySelector(".prospect-detail-panel")?.textContent.includes("CONVERGENCE LATEST")'),'C03 late refresh cannot replace current identity/details');
   test(old.some(item=>item.id===p.id),'C03 synthetic old snapshot contains same identity');
   let rejectList;
   await js('window.__combinedUnhandled=0;window.addEventListener("unhandledrejection",()=>window.__combinedUnhandled++)');
   ipcMain.removeHandler('crm:prospects:list');ipcMain.handle('crm:prospects:list',()=>new Promise((_resolve,reject)=>{rejectList=reject;}));
   await emit();for(let i=0;i<60&&!rejectList;i++)await sleep(20);test(!!rejectList,'C03 obsolete Prospect error actually armed');
   ipcMain.removeHandler('crm:prospects:list');ipcMain.handle('crm:prospects:list',handler);
   db.crm.updateOrganization(org.id,{name:'CONVERGENCE NEWEST'});await emit();
   await wait('document.querySelector(".prospect-detail-panel")?.textContent.includes("CONVERGENCE NEWEST")','newer successful refresh');
   rejectList(Error('OBSOLETE COMBINED PROSPECT FAILURE'));await sleep(100);
   test(await get('window.__combinedUnhandled===0&&!document.body.textContent.includes("OBSOLETE COMBINED PROSPECT FAILURE")&&document.querySelector(".prospect-detail-panel").textContent.includes("CONVERGENCE NEWEST")'),'C03 obsolete list failure cannot become unhandled or replace current success');
  }finally{ipcMain.removeHandler('crm:prospects:list');ipcMain.handle('crm:prospects:list',handler);}
  db.workflow.archiveProspect(p.id,true);
  test(db.crm.listProspects({includeArchived:true}).find(item=>item.id===p.id).clientAccountId===accepted.acceptedClientAccountId,'C06 historical conversion preserves its Client link after archival');
  const activeOrg=db.crm.createOrganization({name:'CONVERGENCE E73'}),active=db.crm.createProspect({organizationId:activeOrg.id});
  db.crm.changeProspectStage(active.id,'qualifying');db.workflow.saveNeed('prospect',active.id,{otherText:'TEMP'});
  const agreed=db.quotes.create({prospectId:active.id,subject:'CONVERGENCE AGREED'});db.quotes.addCustomLine(agreed.id,{label:'TEMP',proposedUnitPriceCents:100});
  require(fixture).finalizeForTest(db.database,db.quotes,agreed.id);db.quotes.markSent(agreed.id);db.quotes.confirmPrincipleAgreement(agreed.id);
  await navigate('Accueil');await wait('document.querySelectorAll("[data-home-source][data-source-status=ready]").length===9','combined Home sources');
  test(await get('document.querySelectorAll("[data-home-pipeline]").length===7&&document.querySelector("[data-home-pipeline=finalization] strong").textContent==="1"&&document.querySelector("[data-home-pipeline=conversions] strong").textContent==="1"'),'C06/C09 Home reuses real six+one projection including current E73 and archived historical Conversion');
  await click('[data-home-pipeline=conversions]');await wait('!!document.querySelector(".history-prospect-row")','Home Conversion navigation');
  test(await get('document.querySelector(".prospect-toolbar").textContent.includes("Conversions réelles")'),'C08 Home Conversion opens existing historical view');
  const qa=db.quotes.create({prospectId:active.id,subject:'CONVERGENCE LATE A'}),qb=db.quotes.create({prospectId:active.id,subject:'CONVERGENCE LATE B'});
  const realGet=db.quotes.get.bind(db.quotes);let reads=0,finish,rejectRead;
  db.quotes.get=id=>{const value=realGet(id);if(id===qa.id&&++reads===2)return new Promise((resolve,reject)=>{finish=()=>resolve(value);rejectRead=reject;});return value;};
  try{
   await search('CONVERGENCE LATE A','quote',qa.id);for(let i=0;i<60&&!finish;i++)await sleep(20);
   test(!!finish,'C03 quote detail, after successful preflight, actually delayed');
   await search('CONVERGENCE LATE B','quote',qb.id);await loaded('quote',qb.id);finish();await sleep(100);
   test(await get('document.querySelector(".quote-detail-panel").dataset.searchEntityId')===qb.id,'C03 obsolete Quote response cannot overwrite later exact Quote');
   reads=0;finish=null;
   await search('CONVERGENCE LATE A','quote',qa.id);for(let i=0;i<60&&!finish;i++)await sleep(20);
   test(!!finish,'C03 obsolete failure actually armed');
   await search('CONVERGENCE LATE B','quote',qb.id);await loaded('quote',qb.id);rejectRead(Error('OBSOLETE COMBINED QUOTE FAILURE'));await sleep(100);
   const state=await get('({quote:document.querySelector(".quote-detail-panel")?.dataset.searchEntityId??null,target:document.querySelector("[data-search-entity-type=quote]")?.dataset.searchEntityId??null,visibleError:document.body.textContent.includes("OBSOLETE COMBINED QUOTE FAILURE"),panels:document.querySelectorAll(".quote-detail-panel").length})');
   test(state.quote===qb.id&&!state.visibleError,'C03 obsolete Quote failure neither replaces identity nor adds false error; observed='+JSON.stringify(state));
  }finally{db.quotes.get=realGet;}
  test(db.database.get('PRAGMA integrity_check').integrity_check==='ok'&&db.database.all('PRAGMA foreign_key_check').length===0,'C11 combined journey integrity and FK');
 }finally{dialog.showMessageBoxSync=originalDialog;}
};

'use strict';
// Supplement the existing 81 reference images with populated panels, conflicts,
// drafts and the SAME prequote-created Quote -> provisional Project -> Client.
module.exports=async context=>{
 const {win,db,temp,evalUI:js,get,wait,navigate,test,sleep}=context;
 const fs=require('node:fs'),path=require('node:path'),{dialog}=require('electron');
 const folder=process.env.ATOUMWEB_UXV2_FINAL_CAPTURES||path.join(path.dirname(temp),'unused');
 // Captures are mandatory: never represent a DOM-only run as visual evidence.
 if(!process.env.ATOUMWEB_UXV2_FINAL_CAPTURES||!path.isAbsolute(folder)||/validation-msi/i.test(folder)||fs.existsSync(folder))throw Error('Fresh absolute final capture folder required');
 fs.mkdirSync(folder,{recursive:true});
 const manifest={source:'actual App+preload+IPC; synthetic TEMP only',captures:[],observations:[]};
 const write=()=>fs.writeFileSync(path.join(folder,'observations.json'),JSON.stringify(manifest,null,2));
 const business=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control');e.click()`);await sleep(80);};
 const textClick=async(selector,text)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()`);await sleep(80);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()`);await sleep(70);};
 const observe=async(name,selector)=>{
  await wait(`!!document.querySelector(${JSON.stringify(selector)})`,'final visual '+name);
  const before=business(),settings=await get('({...document.documentElement.dataset})');
  await js(`window.__finalPanel=document.querySelector(${JSON.stringify(selector)});window.__finalFields=()=>[...window.__finalPanel.querySelectorAll('input,textarea,select')].map(e=>[e.tagName,e.type,e.value,e.checked]);window.__finalValues=JSON.stringify(window.__finalFields());`);
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)};window.__finalPanel.scrollIntoView({block:'center'});`);await sleep(40);
   const metrics=await get(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return {mounted:e===window.__finalPanel,drafts:JSON.stringify(window.__finalFields())===window.__finalValues,visible:e.getClientRects().length>0,documentOverflow:document.documentElement.scrollWidth-innerWidth,timer:document.querySelectorAll('.global-timer').length,top:r.top,bottom:r.bottom,width:r.width,viewport:innerWidth};})()`);
   const contrasts=await get(`(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const paint=canvas.getContext('2d'),rgb=value=>{paint.clearRect(0,0,1,1);paint.fillStyle=value;paint.fillRect(0,0,1,1);return [...paint.getImageData(0,0,1,1).data].slice(0,3);},lum=value=>rgb(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);return [...window.__finalPanel.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea,select,button.primary-button:not(:disabled)')].filter(e=>e.getClientRects().length).map(e=>{const s=getComputedStyle(e),fg=s.webkitTextFillColor||s.color,bg=s.backgroundColor;if(bg==='rgba(0, 0, 0, 0)')return null;const a=lum(fg),b=lum(bg);return {tag:e.tagName,type:e.type,text:e.value||e.textContent,foreground:fg,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};}).filter(Boolean);})()`);
   test(contrasts.every(item=>item.ratio>=4.5),name+' '+theme+'/'+density+' field values and active primary buttons contrast >=4.5 '+JSON.stringify(contrasts.filter(item=>item.ratio<4.5)));
   test(metrics.mounted&&metrics.drafts&&metrics.visible&&metrics.documentOverflow<=2&&metrics.timer===1,name+' '+theme+'/'+density+' same mounted panel/drafts and no document overflow '+JSON.stringify(metrics));
   const n=manifest.captures.length+1,color=[32+n*53%193,32+n*89%193,32+n*127%193];
   await js(`let e=document.getElementById('final-frame-marker');if(!e){e=document.createElement('div');e.id='final-frame-marker';e.setAttribute('aria-hidden','true');document.body.append(e)}e.style.cssText='position:fixed!important;right:0;bottom:0;width:40px;height:40px;pointer-events:none;z-index:2147483647;background:rgb(${color.join(',')})';`);
   let image,matched=false;
   for(let frame=0;frame<24;frame++){
    await js('await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await sleep(60);
    image=await win.webContents.capturePage();const size=image.getSize(),bitmap=image.toBitmap(),offset=((size.height-17)*size.width+size.width-17)*4;
    const actual=[...bitmap.subarray(offset,offset+3)].sort((a,b)=>a-b),expected=[...color].sort((a,b)=>a-b);
    if(expected.every((v,i)=>Math.abs(v-actual[i])<=7)){matched=true;break;}
   }
   test(matched,'Final compositor matches '+name+' '+theme+'/'+density);
   const file=name+'-'+theme+'-'+density+'.png';fs.writeFileSync(path.join(folder,file),image.toPNG(),{flag:'wx'});
   manifest.captures.push({file,theme,density,scene:name,sha256:require('node:crypto').createHash('sha256').update(image.toPNG()).digest('hex')});
   manifest.observations.push({name,theme,density,...metrics,controlCount:contrasts.length,minControlContrast:contrasts.length?Math.min(...contrasts.map(item=>item.ratio)):null});
  }
  win.setSize(760,720);win.webContents.setZoomFactor(1.25);await sleep(100);
  test(await get(`document.querySelector(${JSON.stringify(selector)})===window.__finalPanel&&JSON.stringify(window.__finalFields())===window.__finalValues&&document.documentElement.scrollWidth<=innerWidth+2`),name+' narrow zoom125 retains instance/drafts and page bounds');
  win.setSize(1510,1030);win.webContents.setZoomFactor(1);await js(`document.documentElement.dataset.theme=${JSON.stringify(settings.theme)};document.documentElement.dataset.density=${JSON.stringify(settings.density)};document.getElementById('final-frame-marker')?.remove()`);await sleep(80);
  test(business()===before,name+' presentation never mutates any business row');write();
 };
 // Existing permanent CRM assertions and services are replayed, not replaced.
 await require('./lot03b-real-scenarios.cjs')({...context,observe});
 // Organization relation is the source of truth; no UI label used as an ID.
 const row=db.database.get('SELECT p.id FROM prospects p JOIN organizations o ON o.id=p.organization_id WHERE o.name=?',['TEST 03C Besoin Dijon']);
 if(!row)throw Error('Prequote fixture Prospect missing');
 const prospectId=row.id,quote=db.quotes.list({prospectId})[0],clientBefore=db.crm.listClients().length;
 test(!!quote&&quote.status==='draft'&&!db.crm.listProspects({includeArchived:true}).find(p=>p.id===prospectId).clientAccountId,'Final same prequote-created Quote remains Prospect');
 await wait(`document.querySelector('.quote-detail-panel')?.dataset.searchEntityId===${JSON.stringify(quote.id)}`,'actual prequote-created Quote visible');
 await click('.quote-contract-preparation details summary');
 await observe('contract-preparation','.quote-contract-preparation');
 const version=db.projects.createTemplate({name:'FINAL RECIPE TEMP TEMPLATE',projectType:'website'}).versions[0];db.projects.addTemplateNode(version.id,{type:'task',name:'TEMP explicit task'});db.projects.publishTemplateVersion(version.id);
 await js('window.dispatchEvent(new Event("atoumweb:changed"))');
 // Remount via genuine navigation/search so template lookup reloads legitimately.
 await navigate('Accueil');await click('#header-search-trigger');await input('.global-search input',quote.subject);
 await wait(`!!document.querySelector('[data-search-type="quote"][data-search-id="${quote.id}"]')`,'exact prequote-created quote search');await click(`[data-search-type="quote"][data-search-id="${quote.id}"]`);
 await wait(`!!document.querySelector('.quote-project-create select option[value="${version.id}"]')`,'published TEMP template available');
 await js(`const e=document.querySelector('.quote-project-create select');e.value=${JSON.stringify(version.id)};e.dispatchEvent(new Event('change',{bubbles:true}))`);await sleep(60);
 await click('.quote-project-create button.primary-button');await wait('document.querySelector(".quote-project-create [role=status]")?.textContent.includes("Projet en préparation")','provisional project from prequote');
 const project=db.database.get('SELECT id,commercial_state FROM projects WHERE source_quote_id=?',[quote.id]);
 test(project?.commercial_state==='provisional'&&db.crm.listClients().length===clientBefore,'Provisional preparation never implicitly converts Prospect');
 await observe('project-provisional','.quote-project-create');
 // Explicit pre-existing TEST helper supplies legal fixture facts; no actual signature simulated by the UI.
 const fixture=path.join(temp,'final-quote-fixture.cjs');require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../../src/main/testSupport/quotePreparationFixture.ts')],outfile:fixture,bundle:true,platform:'node',format:'cjs',external:['electron'],logLevel:'silent'});
 const full=db.quotes.get(quote.id);db.quotes.updateLine(full.lines[0].id,{label:full.lines[0].label,proposedUnitPriceCents:10000});
 require(fixture).finalizeForTest(db.database,db.quotes,quote.id);db.quotes.markSent(quote.id);
 db.quotePreparation.recordAcceptance(quote.id,'Acceptation explicite TEMP finale',new Date(Date.now()-60000).toISOString(),'Fixture technique, aucune signature réelle');
 const accepted=await get(`window.atoumweb.quotes.accept(${JSON.stringify(quote.id)})`),again=await get(`window.atoumweb.quotes.accept(${JSON.stringify(quote.id)})`);
 const linked=db.database.get('SELECT id,client_account_id,source_quote_id FROM projects WHERE id=?',[project.id]);
 test(accepted.acceptedClientAccountId===again.acceptedClientAccountId&&db.crm.listClients().length===clientBefore+1,'Same prequote Quote acceptance replay creates exactly one Client');
 test(linked.source_quote_id===quote.id&&linked.client_account_id===accepted.acceptedClientAccountId&&linked.id===project.id,'Same provisional Project retained and linked to exact converted Client');
 test(db.quotes.get(quote.id).finalizedAt&&db.quotes.get(quote.id).contractSnapshotJson,'Final contract snapshot remains on exact accepted Quote');
 await js('window.dispatchEvent(new Event("atoumweb:changed"))');await navigate('Accueil');await click('#header-search-trigger');await input('.global-search input','TEST 03C Besoin Dijon');
 await wait(`!!document.querySelector('[data-search-type="client"][data-search-id="${accepted.acceptedClientAccountId}"]')`,'converted exact Client result');await click(`[data-search-type="client"][data-search-id="${accepted.acceptedClientAccountId}"]`);
 await wait(`document.querySelector('.client-summary-panel')?.dataset.searchEntityId===${JSON.stringify(accepted.acceptedClientAccountId)}`,'exact converted Client visible');
 await observe('client-converted','.client-summary-panel');
 // Actual qualification editor: native Tab/Shift-Tab, then pending/error and
 // one existing UX-01 confirmation per close attempt. No second guard system.
 const qualification=db.database.get('SELECT p.id FROM prospects p JOIN organizations o ON o.id=p.organization_id WHERE o.name=?',['TEST 03B Prospection Dijon']);
 await navigate('Accueil');await click('#header-search-trigger');await input('.global-search input','TEST 03B Prospection Dijon');
 await wait(`!!document.querySelector('[data-search-type="prospect"][data-search-id="${qualification.id}"]')`,'qualification exact search');await click(`[data-search-type="prospect"][data-search-id="${qualification.id}"]`);
 await textClick('.prospect-detail-panel button','Ouvrir la fiche de travail');await wait('!!document.querySelector(".start-qualification-button")','qualification explicit start');await click('.start-qualification-button');
 await wait('!!document.querySelector(".qualification-panel-v2 textarea")','qualification editor');
 const beforeQualification=db.crm.listProspects().find(p=>p.id===qualification.id).projectSummary;
 await input('.qualification-panel-v2 textarea','FINAL QUALIFICATION DRAFT');
 await js('window.__finalQualification=document.querySelector(".qualification-panel-v2 textarea")');
 win.webContents.sendInputEvent({type:'keyDown',keyCode:'Tab'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Tab'});await sleep(70);
 test(await get('document.activeElement!==window.__finalQualification&&document.querySelector(".prospect-desk-overlay").contains(document.activeElement)'),'Native Tab advances within actual qualification desk');
 win.webContents.sendInputEvent({type:'keyDown',keyCode:'Tab',modifiers:['shift']});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Tab',modifiers:['shift']});await sleep(70);
 test(await get('document.activeElement===window.__finalQualification'),'Native Shift-Tab returns to same qualification textarea');
 await observe('qualification-dirty','.qualification-panel-v2');
 const save=db.crm.updateProspectQualificationBriefIfUnchanged.bind(db.crm),originalDialog=dialog.showMessageBoxSync;let rejectSave,confirmations=0;
 try{
  db.crm.updateProspectQualificationBriefIfUnchanged=()=>new Promise((_resolve,reject)=>{rejectSave=reject;});
  await textClick('.qualification-actions button','Enregistrer la qualification');await wait('document.querySelector(".qualification-actions button").disabled','final qualification pending');
  test(!!rejectSave,'Actual qualification pending IPC armed');await observe('qualification-pending','.qualification-panel-v2');
  rejectSave(Error('FINAL TEMP SAVE REFUSAL'));await wait('!document.querySelector(".qualification-actions button").disabled','final qualification error');
  test(await get('window.__finalQualification===document.querySelector(".qualification-panel-v2 textarea")&&window.__finalQualification.value==="FINAL QUALIFICATION DRAFT"'),'Failed save preserves exact textarea instance and draft');
  await observe('qualification-error','.qualification-panel-v2');
  dialog.showMessageBoxSync=()=>{confirmations++;return 0;};await click('.prospect-desk-overlay .close-detail');
  test(confirmations===1&&await get('window.__finalQualification===document.querySelector(".qualification-panel-v2 textarea")&&window.__finalQualification.value==="FINAL QUALIFICATION DRAFT"'),'One Stay confirmation preserves exact failed-save draft');
  dialog.showMessageBoxSync=()=>{confirmations++;return 1;};await click('.prospect-desk-overlay .close-detail');
  test(confirmations===2&&!await get('!!document.querySelector(".prospect-desk-overlay")'),'One further Discard confirmation closes actual desk');
  test(db.crm.listProspects().find(p=>p.id===qualification.id).projectSummary===beforeQualification,'Discard never silently persists refused qualification');
 }finally{db.crm.updateProspectQualificationBriefIfUnchanged=save;dialog.showMessageBoxSync=originalDialog;}
 await js('window.__finalTimer=document.querySelector(".global-timer")');await click('.timer-start-shortcut');
 await wait('!!document.querySelector(".global-timer .timer-popover")','actual unique timer dialog');
 await observe('timer-new-session','.global-timer .timer-popover');
 await textClick('.timer-popover button','Annuler');
 test(await get('window.__finalTimer===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1&&!document.querySelector(".timer-popover")'),'Timer cancellation preserves unique mounted timer, no second timer');
 console.log('FINAL_VISUAL_EVIDENCE '+JSON.stringify({captures:manifest.captures.length,scenes:[...new Set(manifest.captures.map(item=>item.scene))],onlyTemp:true,sameProspectId:prospectId,sameQuoteId:quote.id,sameProjectId:project.id,sameClientId:accepted.acceptedClientAccountId}));write();
};

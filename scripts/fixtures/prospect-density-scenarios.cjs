'use strict';
module.exports=async ctx=>{
 const {win,db,temp,evalUI:js,get,wait,navigate,test,sleep}=ctx,fs=require('node:fs'),path=require('node:path'),{dialog}=require('electron');
 const before=process.env.ATOUMWEB_PROSPECT_DENSITY_BEFORE==='1',folder=process.env.ATOUMWEB_PROSPECT_DENSITY_CAPTURES;
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click()`);await sleep(80);};
 const text=async(selector,value)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(value)}));if(!e)throw Error('Missing '+${JSON.stringify(value)});e.click()`);await sleep(80);};
 const capture=async(scene,theme,density)=>{if(folder)await require('./verified-crm-capture.cjs')({win,js,test,folder,file:scene+'-'+theme+'-'+density+'.png',theme,density,scene});};
 const org=db.crm.createOrganization({name:'Atelier Horizon',industry:'Architecture d’intérieur',city:'Lyon',website:'https://atelier-horizon.example.test',email:'contact@example.test'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Bernard',email:'camille@example.test',phone:'0600000000'});
 const prospect=db.crm.createProspect({organizationId:org.id,contactId:contact.id,stage:'quote_to_prepare',temperature:'warm',source:'referral',primaryNeed:'Site vitrine · présenter les réalisations',decisionMakerName:'Camille Bernard'});
 const quote=db.quotes.create({prospectId:prospect.id,subject:'Site vitrine · Atelier Horizon'});
 db.actions.create({ownerType:'prospect',ownerId:prospect.id,type:'follow_up',title:'Confirmer le périmètre du site vitrine',dueAt:'2026-10-20T09:00:00.000Z'});
 const bytes=await get(`(()=>{const c=document.createElement('canvas');c.width=c.height=96;const p=c.getContext('2d');p.fillStyle='#234e5c';p.fillRect(0,0,96,96);p.fillStyle='#f5d591';p.font='bold 58px sans-serif';p.textAlign='center';p.textBaseline='middle';p.fillText('H',48,52);return c.toDataURL('image/png').split(',')[1]})()`);const logo=path.join(temp,'atelier-horizon.png');fs.writeFileSync(logo,Buffer.from(bytes,'base64'));db.crmIdentityAssets.importFilePath('organization',org.id,'logo',logo);
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
 const baseline=snapshot(),old=dialog.showMessageBoxSync;let confirmations=0;dialog.showMessageBoxSync=()=>{confirmations++;return 0;};
 const presentation=async(theme,density,w=1510,h=1030,z=1.25)=>{win.setSize(w,h);win.webContents.setZoomFactor(z);await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await wait(`Math.abs(innerWidth-${w}/${z})<35`,'actual zoom viewport');await sleep(120);};
 try{
  await navigate('Prospection');await text('.prospect-view-switch button','Annuaire prospects');await click(`[data-record-id="${prospect.id}"]`);await click('[aria-label="Agrandir la fiche"]');await wait('!!document.querySelector(".prospect-detail-desk .crm-record-layout")','full Prospect');await wait('!!document.querySelector(".prospect-detail-desk .crm-identity-avatar img")','persisted identity logo');
  await js(`window.__densityDesk=document.querySelector('.prospect-detail-desk');window.__densityTimer=document.querySelector('.global-timer');window.atoumweb.visualPreferences.setItem('atoumweb:crm-record:prospect:v1',JSON.stringify({version:1,leftWidth:260,rightWidth:220,leftClosed:false,rightClosed:false}));window.dispatchEvent(new StorageEvent('storage',{key:'atoumweb:crm-record:prospect:v1'}));`);await sleep(100);
  const variants=before?['reference']:['balanced','action'];
  for(const variant of variants){
   if(!before)await js(`window.__densityDesk.dataset.prospectComposition=${JSON.stringify(variant)}`);
   for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
    await presentation(theme,density);
    if(!before){
     test(await get(`document.querySelectorAll('.prospect-focus-summary').length===1&&document.querySelector('.prospect-focus-next').textContent.includes('Confirmer le périmètre du site vitrine')&&document.querySelector('.prospect-focus-stage').textContent.trim().length>20`),'Single useful synthesis with exact shared next action '+variant+'/'+theme+'/'+density);
     test(await get(`!document.querySelector('.crm-record-left').textContent.includes('Fiche de travail prospect')&&!document.querySelector('.prospect-secondary-actions').open&&document.querySelector('.crm-record-left h2').textContent==='Atelier Horizon'`),'Name/logo/status before secondary actions, no large redundant title');
     test(await get(`(()=>{const e=document.querySelector('.prospect-work-accordion-trigger');return getComputedStyle(e).borderTopWidth==='0px'&&getComputedStyle(e).textTransform==='none'&&parseFloat(getComputedStyle(e).fontSize)>=14})()`),'Unframed section rows, sentence case, functional type not reduced');
     test(await get(`window.__densityDesk===document.querySelector('.prospect-detail-desk')&&window.__densityTimer===document.querySelector('.global-timer')&&document.querySelectorAll('.global-timer').length===1`),'Same record and unique timer through two compositions');
     const r=await get(`(()=>{const r=document.querySelector('.prospect-detail-desk .crm-record-layout'),c=r.querySelector('.crm-record-work').getBoundingClientRect();return {overflow:r.scrollWidth-r.clientWidth,centre:c.width,height:c.height,body:innerWidth}})()`);test(r.overflow<=2&&r.centre>300&&r.height>150,'Readable centre at125% '+variant+'/'+theme+'/'+density+' '+JSON.stringify(r));
    }
    if(!before)test(await get(`(()=>{const t=document.querySelector('.prospect-temperature-control select').getBoundingClientRect(),s=document.querySelector('.prospect-focus-stage').getBoundingClientRect(),l=document.querySelector('.crm-record-left').getBoundingClientRect();return t.right<=s.left+2&&[...document.querySelectorAll('.crm-record-properties p')].every(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().right<=l.right+2})})()`),'Temperature never overlaps status; identity text stays in its own region '+variant+'/'+theme+'/'+density);
    await capture(variant+'-1510-z1.25',theme,density);
   }
   for(const [w,h,z]of [[1920,1080,1.25],[1280,720,1.5]]){await presentation('noir','comfort',w,h,z);if(!before)test(await get(`(()=>{const r=document.querySelector('.prospect-detail-desk .crm-record-layout');return r.scrollWidth<=r.clientWidth+2&&r.querySelector('.crm-record-work').getBoundingClientRect().height>150})()`),'Wide/narrow layout retains central scroll area '+variant+'/'+w);await capture(variant+'-'+w+'-z'+z,'noir','comfort');}
  }
  if(!before){
   await presentation('noir','comfort');
   await click('.prospect-focus-next button');await wait(`document.querySelector('#prospect-followup-section-${prospect.id} > button')?.getAttribute('aria-expanded')==='true'`,'synthesis opens existing followup section');
   test(await get(`document.activeElement===document.querySelector('#prospect-followup-section-${prospect.id}>button')`),'Next-action link opens the real collapsed section and returns focus, without service mutation');
   await text('.prospect-work-accordion-trigger','Relances & prochaines actions');
   for(const variant of ['balanced','action']){
    await js(`window.__densityDesk.dataset.prospectComposition=${JSON.stringify(variant)}`);await click('.prospect-secondary-actions summary');test(await get(`document.querySelector('.prospect-secondary-actions').open&&!!document.querySelector('.prospect-secondary-actions [aria-label="Ouvrir la référence dans une fenêtre"]')`),'Original secondary window action reachable '+variant);await click('.crm-record-left .crm-identity-assets-toggle');await capture(variant+'-identity-details','noir','comfort');await click('.crm-record-left .crm-identity-assets-toggle');await click('.prospect-secondary-actions summary');
   }
   // Pause editor uses the SAME quote service/UX-01 guard; presentation changes
   // may hide its parent but must never discard or reassign its local draft.
   await text('.prospect-quote-panel button','Info manquante');await wait('!!document.querySelector(".prospect-quote-panel .inline-editor textarea")','existing pause draft');
   await js(`window.__densityDraft=document.querySelector('.prospect-quote-panel .inline-editor textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(window.__densityDraft,'Conserver les photos avant validation du devis');window.__densityDraft.dispatchEvent(new Event('input',{bubbles:true}));window.__densityQuote=document.querySelector('.prospect-quote-panel');`);await sleep(80);
   for(const variant of ['balanced','action']){
    await js(`window.__densityDesk.dataset.prospectComposition=${JSON.stringify(variant)}`);
    await text('.prospect-work-accordion-trigger','Devis');await text('.prospect-work-accordion-trigger','Devis');
    await click('.crm-record-right>.crm-record-side-toggle');test(await get(`document.querySelector('.crm-record-right .crm-record-side-body').hidden`),'Associations fold without actions or draft loss '+variant);await click('.crm-record-right>.crm-record-side-toggle');
    test(await get(`window.__densityDraft===document.querySelector('.prospect-quote-panel .inline-editor textarea')&&window.__densityDraft.value==='Conserver les photos avant validation du devis'&&window.__densityQuote===document.querySelector('.prospect-quote-panel')&&window.__densityDesk===document.querySelector('.prospect-detail-desk')`),'Same quote, record, textarea and exact text through fold/composition '+variant);
    await capture(variant+'-draft-preserved','noir','comfort');
   }
   const n=confirmations;await text('.prospect-desk-tabs button','Référence prospect');test(confirmations===n+1&&await get(`window.__densityDraft.isConnected&&document.querySelector('.prospect-quote-panel .inline-editor textarea')===window.__densityDraft`),'Stay on existing UX-01 confirmation retains the exact quote draft');
   const m=confirmations;await click('.prospect-detail-desk .close-detail');test(confirmations===m+1&&await get(`window.__densityDesk.isConnected&&window.__densityDraft.value==='Conserver les photos avant validation du devis'`),'Stay on closing record retains all draft text');
   test(snapshot()===baseline,'Presentation, links, draft and refused exits do not mutate ANY business table');
  }
  test(db.database.get('PRAGMA integrity_check').integrity_check==='ok'&&db.database.all('PRAGMA foreign_key_check').length===0,'TEMP integrity and foreign keys');
  console.log('PROSPECT_DENSITY_RESULT '+JSON.stringify({before,variants,onlyTemp:true,quoteId:quote.id,confirmations,businessMutation:false,captures:before?11:26}));
 }finally{dialog.showMessageBoxSync=old;}
};

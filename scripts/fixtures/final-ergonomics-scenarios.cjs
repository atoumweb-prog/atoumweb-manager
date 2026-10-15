'use strict';
module.exports=async ctx=>{
 const {win,db,temp,workspace,evalUI:js,get,wait,navigate,test,sleep}=ctx;
 const fs=require('node:fs'),path=require('node:path'),{dialog,nativeImage}=require('electron');
 const before=process.env.ATOUMWEB_ERGONOMICS_BEFORE==='1',folder=process.env.ATOUMWEB_ERGONOMICS_CAPTURES;
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click()`);await sleep(60);};
 const text=async(selector,value)=>{await js(`[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(value)})).click()`);await sleep(60);};
 const capture=async(scene,theme,density)=>{if(folder)await require('./verified-crm-capture.cjs')({win,js,test,folder,file:scene+'-'+theme+'-'+density+'.png',theme,density,scene});};
 const org=db.crm.createOrganization({name:'ATELIER SYNTHÉTIQUE',industry:'Artisanat'}),contact=db.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'EXEMPLE',email:'camille@example.test'}),client=db.crm.createClient({organizationId:org.id,primaryContactId:contact.id}),prospect=db.crm.createProspect({organizationId:org.id,contactId:contact.id,stage:'quote_to_prepare',primaryNeed:'Présenter son activité'});
 db.quotes.create({clientAccountId:client.id,subject:'Présentation du site'});db.quotes.create({prospectId:prospect.id,subject:'Projet vitrine'});
 const logo=path.join(temp,'logo-fixture.png');fs.writeFileSync(logo,nativeImage.createFromBitmap(Buffer.alloc(32*32*4,255),{width:32,height:32}).toPNG());
 const asset=db.crmIdentityAssets.importFilePath('organization',org.id,'logo',logo);
 // Real existing backup, then an isolated fresh destination: prove both limits and recovery.
 const backup=await db.createBackup('manual'),{DatabaseSync}=require('node:sqlite');
 const reader=new DatabaseSync(backup,{readOnly:true});let row;try{row=reader.prepare('SELECT * FROM crm_identity_assets WHERE id=?').get(asset.id);test(row&&row.relative_path===asset.relativePath,'Real SQLite backup retains exact logo association');test(reader.prepare('PRAGMA integrity_check').get().integrity_check==='ok','Backup integrity');test(reader.prepare('PRAGMA foreign_key_check').all().length===0,'Backup FK');}finally{reader.close();}
 const copied=path.join(temp,'workspace-copy');fs.mkdirSync(path.join(copied,'data'),{recursive:true});fs.copyFileSync(backup,path.join(copied,'data','atoumweb-manager.sqlite'));
 test(!fs.existsSync(path.join(copied,row.relative_path)),'SQLite-only transfer does NOT carry image bytes (explicit known limit)');
 fs.cpSync(path.join(workspace.root,'crm-identites'),path.join(copied,'crm-identites'),{recursive:true});
 test(fs.readFileSync(path.join(copied,row.relative_path)).equals(fs.readFileSync(logo)),'TEMP workspace copy with media restores exact associated image bytes');
 const baseline=JSON.stringify(db.database.all('SELECT * FROM crm_identity_assets'));
 const oldDialog=dialog.showMessageBoxSync;let confirmations=0;dialog.showMessageBoxSync=()=>{confirmations++;return 0;};
 try{
  await navigate('Clients');await click(`[data-client-id="${client.id}"]`);await wait('!!document.querySelector(".client-detail-expand")','Client');await click('.client-detail-expand');
  await click('#client-tab-contacts');await text('#client-panel-contacts button','+ Ajouter');
  await js(`window.__draft=document.querySelector('#client-panel-contacts .contact-inline-form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(window.__draft,'BROUILLON CONSERVÉ');window.__draft.dispatchEvent(new Event('input',{bubbles:true}));window.__record=document.querySelector('.client-summary-panel');window.__timer=document.querySelector('.global-timer');`);
  if(!before){
   // Three pointer previews => one write, then cancel and real keyboard increment.
   const set=db.setSetting.bind(db);let writes=0;db.setSetting=(k,v)=>{if(k==='ux_v2_visual_preferences_v1')writes++;return set(k,v);};
   try{
    await js(`const e=document.querySelector('.crm-pane-separator-left');e.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerId:71,clientX:260,bubbles:true}));for(const x of [270,280,290])window.dispatchEvent(new PointerEvent('pointermove',{pointerId:71,clientX:x}));`);await sleep(60);test(writes===0,'Repeated pointermove never persists');
    await js(`window.dispatchEvent(new PointerEvent('pointerup',{pointerId:71,clientX:290}))`);await sleep(80);test(writes===1,'Only one resize commit');
    await js(`const e=document.querySelector('.crm-pane-separator-left');e.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerId:72,clientX:290,bubbles:true}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:72,clientX:360}));window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:72}));`);await sleep(80);test(writes===1,'Pointer cancel restores without write');
    await js(`document.querySelector('.crm-pane-separator-left').focus()`);win.webContents.sendInputEvent({type:'keyDown',keyCode:'Right'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Right'});await sleep(80);test(writes===2,'Accessible keyboard separator writes one preference');
   }finally{db.setSetting=set;}
   // Reset visual widths so before/after scenarios share the defaults.
   await js(`window.atoumweb.visualPreferences.removeItem('atoumweb:crm-record:client:v1');window.dispatchEvent(new StorageEvent('storage',{key:'atoumweb:crm-record:client:v1'}));`);
  }
  const configurations=[];for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus'])configurations.push([theme,density]);
  const resize=async(w,h,z)=>{win.setSize(w,h);win.webContents.setZoomFactor(z);await wait(`Math.abs(innerWidth-${w}/ ${z})<35`,'zoom viewport');await sleep(120);};
  const presentation=async(theme,density)=>{await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);};
  for(const [theme,density]of configurations){
   await resize(1510,1030,1);await presentation(theme,density);
   for(const tab of ['summary','contacts','commercial','contracts','projects','operations','documents','history']){await click('#client-tab-'+tab);await capture('client-tab-'+tab,theme,density);}
   await click('#client-tab-contacts');
   for(const [w,h]of [[1510,1030],[1920,1080],[1280,720]])for(const z of [1,1.25,1.5]){
    await resize(w,h,z);
    if(!before){
     const m=await get(`(()=>{const r=document.querySelector('.crm-record-layout'),t=r.querySelector('.client-v2-tabs'),tabs=[...t.querySelectorAll('[role=tab]')],c=r.querySelector('.crm-record-work').getBoundingClientRect(),l=r.querySelector('.crm-record-left').getBoundingClientRect();return {oneLine:tabs.every(e=>Math.abs(e.getBoundingClientRect().top-tabs[0].getBoundingClientRect().top)<2),height:c.height,width:c.width,overflow:r.scrollWidth-r.clientWidth,compact:r.dataset.compact==='true',identity:l.height}})()`);
     test(m.oneLine&&m.overflow<=2,'One-line eight tabs, no outer overflow '+JSON.stringify({w,z,theme,density,...m}));
     test(m.height>150&&(!m.compact||m.identity<135),'Centre stays usable, compact Identity bounded '+JSON.stringify({w,z,theme,density,...m}));
     // All tabs reachable by real Home/End, selected item scrolled into view.
     await js(`document.querySelector('#client-tab-contacts').focus()`);win.webContents.sendInputEvent({type:'keyDown',keyCode:'End'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'End'});await sleep(70);
     test(await get(`(()=>{const e=document.querySelector('#client-tab-history'),r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return e===document.activeElement&&r.left>=p.left-2&&r.right<=p.right+2})()`),'Keyboard End reveals History '+w+'/'+z);
     await click('#client-tab-contacts');
     test(await get(`window.__draft===document.querySelector('#client-panel-contacts .contact-inline-form input')&&window.__draft.value==='BROUILLON CONSERVÉ'&&window.__record===document.querySelector('.client-summary-panel')&&window.__timer===document.querySelector('.global-timer')`),'Same mounted record, exact draft and unique timer after responsive/tab change');
    }
    await capture('client-'+w+'-z'+z,theme,density);
   }
  }
  // Native Stay keeps the dirty Client; discard only for explicit navigation.
  await click('.client-summary-panel .close-detail');test(await get('window.__draft.isConnected&&window.__draft.value==="BROUILLON CONSERVÉ"'),'Stay preserves exact Client draft');
  dialog.showMessageBoxSync=()=>{confirmations++;return 1;};await click('.client-summary-panel .close-detail');await wait('!document.querySelector(".client-summary-panel")','explicit discard');dialog.showMessageBoxSync=()=>{confirmations++;return 0;};
  win.webContents.setZoomFactor(1);win.setSize(1510,1030);await navigate('Prospection');await text('.prospect-view-switch button','Annuaire prospects');await click(`[data-record-id="${prospect.id}"]`);await click('[aria-label="Agrandir la fiche"]');await wait('!!document.querySelector(".prospect-detail-desk .crm-record-layout")','Prospect');
  await js(`window.__prospect=document.querySelector('.prospect-detail-desk')`);
  for(const [theme,density]of configurations){await presentation(theme,density);for(const [w,h]of [[1510,1030],[1920,1080],[1280,720]])for(const z of [1,1.25,1.5]){
   await resize(w,h,z);if(!before)test(await get(`(()=>{const r=document.querySelector('.prospect-detail-desk .crm-record-layout'),c=r.querySelector('.crm-record-work');return r.scrollWidth<=r.clientWidth+2&&c.getBoundingClientRect().height>150&&window.__prospect===document.querySelector('.prospect-detail-desk')})()`),'Prospect centre/mount/overflow '+w+'/'+z+'/'+theme+'/'+density);
   await capture('prospect-'+w+'-z'+z,theme,density);
  }}
  // No draft in Prospect fixture: close via the real existing guard.
  win.webContents.setZoomFactor(1);win.setSize(1510,1030);await click('.prospect-detail-desk .close-detail');await navigate('Prospection');await text('.prospect-view-switch button','Parcours commercial');
  for(const [theme,density]of configurations){await presentation(theme,density);await capture('pipeline',theme,density);}
  await navigate('Annuaire');await wait('!!document.querySelector(".directory-page-stack")','Directory');
  for(const [theme,density]of configurations){await presentation(theme,density);await capture('directory',theme,density);}
  test(confirmations===2,'Exactly Stay + explicit Client discard, no layout confirmation');test(JSON.stringify(db.database.all('SELECT * FROM crm_identity_assets'))===baseline,'Responsive/captures leave identity associations untouched');
  console.log('ERGONOMICS_RESULT '+JSON.stringify({before,configurations:9,sizes:3,zooms:3,captures:252,onlyTemp:true,confirmations}));
 }finally{dialog.showMessageBoxSync=oldDialog;}
};

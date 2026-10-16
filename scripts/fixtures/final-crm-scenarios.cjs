 'use strict';
module.exports=async ctx=>{
 const {win,db,temp,registered,evalUI:js,get,wait,navigate,test,sleep}=ctx;
 await require('./03d-client-scenarios.cjs')(ctx);
 const fs=require('node:fs'),path=require('node:path'),{dialog,nativeImage}=require('electron');
 const original={open:dialog.showOpenDialog,message:dialog.showMessageBox,sync:dialog.showMessageBoxSync};
 const answers=[],confirmations=[];dialog.showMessageBoxSync=(...args)=>{confirmations.push(args.at(-1));return answers.shift()??0;};
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click()`);await sleep(80);};
 const textClick=async(selector,text)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click()`);await sleep(80);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(80);};
 const contrast=async(selector,background)=>get(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),b=document.querySelector(${JSON.stringify(background)});if(!e||!b)return 0;const rgba=s=>{const n=s.match(/[0-9.]+/g).map(Number);return [n[0],n[1],n[2],n[3]??1]};const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));const layers=[];for(let n=b;n;n=n.parentElement)layers.push(rgba(getComputedStyle(n).backgroundColor));let pixel=[255,255,255];for(const c of layers.reverse())pixel=over(c,pixel);const style=getComputedStyle(e),ink=over(rgba(style.webkitTextFillColor.includes('rgb')?style.webkitTextFillColor:style.color),pixel);const lum=rgb=>{const n=rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4});return n[0]*.2126+n[1]*.7152+n[2]*.0722};const a=lum(ink),d=lum(pixel);return (Math.max(a,d)+.05)/(Math.min(a,d)+.05)})()`);
 const root=process.env.ATOUMWEB_FINAL_CRM_CAPTURES;
 const capture=async(scene,theme,density)=>{if(root)await require('./verified-crm-capture.cjs')({win,js,test,folder:root,file:scene+'-'+theme+'-'+density+'.png',theme,density,scene});};
 const client=db.crm.listClients({includeArchived:true}).find(c=>c.displayName==='TEST03D CLIENT');
 const prospect=db.crm.createProspect({organizationId:client.organizationId,contactId:client.primaryContactId,stage:'qualifying',primaryNeed:'Présenter son activité'});
 db.quotes.create({prospectId:prospect.id,subject:'TEST VISUEL — Présentation du site'});
 const source=path.join(temp,'test-company-logo.png');fs.writeFileSync(source,nativeImage.createFromBitmap(Buffer.alloc(80*80*4,255),{width:80,height:80}).toPNG());
 const importAsset=registered.get('crm:identity-assets:import'),removeAsset=registered.get('crm:identity-assets:remove');
 const assets=()=>db.crmIdentityAssets.list('organization',client.organizationId);
 try{
  const count=assets().length;
  dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});test(await importAsset({sender:win.webContents},'organization',client.organizationId,'logo')===null&&assets().length===count,'Cancelled file selection has no SQL/file mutation');
  dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});
  let previews=0,acceptPreview=false;dialog.showMessageBox=async options=>{previews++;test(options.icon&&!options.icon.isEmpty()&&options.defaultId===1&&options.cancelId===1,'Decoded preview before commit; default is Cancel');return {response:acceptPreview?0:1};};
  test(await importAsset({sender:win.webContents},'organization',client.organizationId,'logo')===null&&assets().length===count,'Cancelled preview preserves shared identity');test(previews===1,'One preview per selected image');
  const png=fs.readFileSync(source),icoHeader=Buffer.alloc(22);icoHeader.writeUInt16LE(1,2);icoHeader.writeUInt16LE(1,4);icoHeader[6]=icoHeader[7]=80;icoHeader.writeUInt16LE(1,10);icoHeader.writeUInt16LE(32,12);icoHeader.writeUInt32LE(png.length,14);icoHeader.writeUInt32LE(22,18);
  const webp=await get("(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;canvas.getContext('2d').fillRect(0,0,2,2);return canvas.toDataURL('image/webp').split(',')[1]})()");
  const formats=[['png',png],['jpg',nativeImage.createFromBuffer(png).toJPEG(90)],['webp',Buffer.from(webp,'base64')],['gif',Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')],['ico',Buffer.concat([icoHeader,png])]];
  const formatOwner=db.crm.createOrganization({name:'TEST FORMAT PERSISTENCE'});
  for(const [extension,bytes]of formats){
   const file=path.join(temp,'actual-format.'+extension);fs.writeFileSync(file,bytes);dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});
   const n=previews;test(await importAsset({sender:win.webContents},'organization',client.organizationId,'logo')===null&&previews===n+1&&assets().length===count,'Actual '+extension+' decoded before cancellation with no write');
   acceptPreview=true;const saved=await importAsset({sender:win.webContents},'organization',formatOwner.id,'logo');acceptPreview=false;
   test(saved&&fs.readFileSync(path.join(ctx.workspace.root,saved.relativePath)).equals(bytes),'Confirmed '+extension+' persists the full ORIGINAL bytes without conversion');
  }

  const corrupt=path.join(temp,'corrupt.png');fs.writeFileSync(corrupt,'not an image');dialog.showOpenDialog=async()=>({canceled:false,filePaths:[corrupt]});
  let rejected=false;try{await importAsset({sender:win.webContents},'organization',client.organizationId,'logo');}catch(e){rejected=/invalide/.test(e.message);}test(rejected&&assets().length===count,'Actual IPC rejects corrupt image without any write');
  dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});
  await navigate('Clients');await textClick('.clients-table tr',client.displayName);await wait('!!document.querySelector(".client-summary-panel")','Client');await click('.client-detail-expand');
  await click('#client-tab-contacts');await textClick('#client-panel-contacts button','+ Ajouter');await input('#client-panel-contacts .contact-inline-form input','BROUILLON TROIS ZONES');
  await js('window.__finalInput=document.querySelector("#client-panel-contacts .contact-inline-form input");window.__finalClient=document.querySelector(".client-summary-panel");window.__finalTimer=document.querySelector(".global-timer")');
  await click('.crm-record-left .crm-identity-assets-toggle');
  let finishPreview;dialog.showMessageBox=options=>new Promise(resolve=>{finishPreview=resolve;test(!!options.icon,'Renderer import uses real decoded preview');});
  await click('.crm-record-left .crm-identity-asset-slot.role-logo button');

  for(let i=0;i<60&&!finishPreview;i++)await sleep(25);
  test(typeof finishPreview==='function'&&assets().length===count,'Logo awaits explicit preview acceptance, no premature persistence');
  test(await get('!!document.querySelector(".crm-record-left [role=status]")&&document.querySelector(".crm-identity-asset-slot.role-logo button").disabled'),'Visible pending feedback and disabled duplicate import');
  const n=confirmations.length;await click('.client-summary-panel .close-detail');
  test(confirmations.length===n+1&&await get('window.__finalInput.isConnected&&window.__finalInput.value==="BROUILLON TROIS ZONES"'),'One UX01 confirmation preserves record during pending native image dialog');
  finishPreview({response:0});await wait('!document.querySelector(".crm-record-left [role=status]")','logo commit');
  test(assets().length===count+1&&fs.existsSync(path.join(ctx.workspace.root,assets().find(a=>a.role==='logo').relativePath)),'Confirmed logo really copied into TEMP workspace and persisted in SQLite');
  await wait('!!document.querySelector(".crm-record-left .crm-identity-avatar img")','shared logo decoded');

  const oldList=db.crmIdentityAssets.list.bind(db.crmIdentityAssets),delayed=[];
  db.crmIdentityAssets.list=(...args)=>{const snapshot=oldList(...args);return new Promise(resolve=>delayed.push(()=>resolve(snapshot)));};
  await js('window.dispatchEvent(new Event("atoumweb:crm-identity-changed"))');await sleep(80);
  test(delayed.length>0,'Old identity reload really held at IPC');
  db.crmIdentityAssets.list=oldList;
  const newerSource=path.join(temp,'newer-company-logo.png');fs.copyFileSync(source,newerSource);
  db.crmIdentityAssets.importFilePath('organization',client.organizationId,'logo',newerSource);
  await js('window.dispatchEvent(new Event("atoumweb:crm-identity-changed"))');
  await wait('document.querySelector(".crm-record-left .role-logo .crm-identity-asset-copy small").textContent==="newer-company-logo.png"','newer identity reload');
  delayed.forEach(resolve=>resolve());await sleep(100);
  test(await get('document.querySelector(".crm-record-left .role-logo .crm-identity-asset-copy small").textContent==="newer-company-logo.png"'),'Late old success cannot overwrite newer shared logo');

  const oldFailures=[];db.crmIdentityAssets.list=()=>new Promise((_resolve,reject)=>oldFailures.push(()=>reject(Error('TEST old image list failure'))));
  await js('window.dispatchEvent(new Event("atoumweb:crm-identity-changed"))');await sleep(80);test(oldFailures.length>0,'Old failing image reload really held');
  db.crmIdentityAssets.list=oldList;await js('window.dispatchEvent(new Event("atoumweb:crm-identity-changed"))');await sleep(100);oldFailures.forEach(reject=>reject());await sleep(100);
  test(await get('document.querySelector(".crm-record-left .role-logo .crm-identity-asset-copy small").textContent==="newer-company-logo.png"&&!document.querySelector(".crm-record-left [role=alert]")'),'Late old failure cannot erase current image or announce a false current error');
  const logo=assets().find(a=>a.role==='logo');
  const originalSet=db.setSetting.bind(db);let writes=0;db.setSetting=(key,v)=>{if(key==='ux_v2_visual_preferences_v1')writes++;return originalSet(key,v);};
  try{
   await js("const s=document.querySelector('.crm-pane-separator-left');s.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerId:31,clientX:260,bubbles:true}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:31,clientX:310}));");
   test(writes===0,'CRM separator previews without persistence');
   await js("window.dispatchEvent(new PointerEvent('pointerup',{pointerId:31,clientX:310}))");await sleep(80);test(writes===1,'Exactly one preference write at CRM resize end');

  }finally{db.setSetting=originalSet;}
  for(const side of ['left','right']){await click('.crm-record-'+side+'>button');test(await get('window.__finalInput===document.querySelector("#client-panel-contacts .contact-inline-form input")&&window.__finalInput.value==="BROUILLON TROIS ZONES"'),'Folding '+side+' retains same editor and text');await click('.crm-record-'+side+'>button');}
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
   for(const [width,height]of[[1920,1080],[1510,1030]]){
    win.setSize(width,height);await sleep(100);
    test(await get('(()=>{const r=document.querySelector(".crm-record-layout"),l=r.querySelector(".crm-record-left").getBoundingClientRect(),c=r.querySelector(".crm-record-work").getBoundingClientRect(),a=r.querySelector(".crm-record-right").getBoundingClientRect();return l.right<=c.left+2&&c.right<=a.left+2&&c.width>l.width&&c.width>a.width})()'),'Three unequal Client regions '+width+'/'+theme+'/'+density);
    test(await get('window.__finalInput.isConnected&&document.querySelectorAll(".client-v2-tabs [role=tab]").length===8'),'Eight tabs and exact draft remain '+width+'/'+theme+'/'+density);
    test(await get('(()=>{const h=document.querySelector(".crm-record-left .crm-identity-assets-heading");return h.firstElementChild.getBoundingClientRect().width>=h.clientWidth-2})()'),'Asset heading retains full pane width '+width+'/'+theme+'/'+density);
    test(await contrast('.contact-card .contact-card-main strong','.contact-card')>=4.5,'Client card text contrast >=4.5 '+width+'/'+theme+'/'+density);
    await capture('client-'+width,theme,density);
   }
  }
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus'])for(const zoom of [1,1.25,1.5]){
   win.setSize(1280,720);win.webContents.setZoomFactor(zoom);await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(100);
   test(await get('window.__finalInput.isConnected&&document.querySelector(".client-summary-panel").scrollWidth<=document.querySelector(".client-summary-panel").clientWidth+2'),'Client narrow/zoom local layout '+theme+'/'+zoom);
   await capture('client-narrow-'+zoom,theme,density);
  }
  win.webContents.setZoomFactor(1);win.setSize(1510,1030);
  const beforeClose=confirmations.length;answers.push(1);await click('.client-summary-panel .close-detail');test(confirmations.length===beforeClose+1&&await get('!document.querySelector(".client-summary-panel")'),'Explicit discard through existing UX01, exactly one confirmation');
  dialog.showMessageBox=async()=>({response:0});test(await removeAsset(null,logo.id)===false&&assets().some(a=>a.id===logo.id),'Removal Cancel leaves image unchanged');
  // Concurrent import while native confirmation is open must never be overwritten.
  dialog.showMessageBox=async()=>{db.crmIdentityAssets.importFilePath('organization',client.organizationId,'logo',source);return {response:0};};
  let conflict=false;try{await importAsset({sender:win.webContents},'organization',client.organizationId,'logo');}catch(e){conflict=/autre fenêtre/.test(e.message);}test(conflict,'Cross-window logo change is rejected instead of silently overwritten');
  await navigate('Prospection');await textClick('.prospect-view-switch button','Annuaire prospects');
  await wait(`!!document.querySelector('[data-record-id="${prospect.id}"]')`,'synthetic active Prospect row');
  await js(`document.querySelector('[data-record-id="${prospect.id}"]').click()`);await wait('!!document.querySelector(".prospect-detail-v2")','Prospect');await click('[aria-label="Agrandir la fiche"]');await wait('!!document.querySelector(".prospect-detail-desk .crm-record-layout")','three-zone prospect');
  await wait('!!document.querySelector(".prospect-detail-desk .crm-identity-avatar img")','same organization logo');
  test(await get('!!document.querySelector(".prospect-detail-desk .crm-identity-avatar img")'),'Prospect shares exact organization logo persisted from Client');
  await js("document.querySelectorAll('.prospect-detail-desk details.prospect-section-group:not([open])').forEach(e=>e.querySelector(':scope>summary').click())");await sleep(80);
  await js('window.__finalProspect=document.querySelector(".prospect-detail-desk");window.__finalAccordion=document.querySelector(".prospect-work-accordion")');
  const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
  const baseline=snapshot();
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
   for(const [width,height]of[[1920,1080],[1510,1030]]){
    win.setSize(width,height);await sleep(100);
    test(await get('(()=>{const r=document.querySelector(".prospect-detail-desk .crm-record-layout"),l=r.querySelector(".crm-record-left").getBoundingClientRect(),c=r.querySelector(".crm-record-work").getBoundingClientRect(),a=r.querySelector(".crm-record-right").getBoundingClientRect();return l.right<=c.left+2&&c.right<=a.left+2&&c.width>l.width&&c.width>a.width})()'),'Three unequal Prospect regions '+width+'/'+theme+'/'+density);
    test(await get('[...document.querySelectorAll(".prospect-work-accordion.open")].every(e=>e.scrollHeight<=e.clientHeight+2)'), 'Open Prospect content is never vertically clipped '+width+'/'+theme+'/'+density);
    test(await contrast('.quote-command-header small','.prospect-quote-panel')>=4.5,'Prospect quote subtitle contrast >=4.5 '+width+'/'+theme+'/'+density);
    await capture('prospect-'+width,theme,density);
   }
  }
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus'])for(const zoom of [1,1.25,1.5]){
   win.setSize(1280,720);win.webContents.setZoomFactor(zoom);await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(100);
   test(await get('window.__finalProspect===document.querySelector(".prospect-detail-desk")&&window.__finalAccordion.isConnected'),'Prospect retains exact component at narrow/zoom '+theme+'/'+zoom);await capture('prospect-narrow-'+zoom,theme,density);
  }
  win.webContents.setZoomFactor(1);win.setSize(1510,1030);await click('.prospect-desk-overlay [aria-label="Fermer la fiche prospect"]');
  if(await get('!!document.querySelector(".prospect-detail-v2")'))await click('.prospect-detail-v2 [aria-label="Fermer la fiche prospect"]');
  await textClick('.prospect-view-switch button','Parcours commercial');
  test(await get('document.querySelectorAll(".kanban-board>.pipeline-step-column").length===6&&!document.querySelector(".kanban-board .pipeline-conversion-history")&&!!document.querySelector(".pipeline-flow>.pipeline-conversion-history")'),'Exactly six active stages; Conversion outside active board');
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(80);
   test(await get('(()=>{const e=[...document.querySelectorAll(".kanban-board>.pipeline-step-column")].map(e=>e.getBoundingClientRect());return e.length===6&&e.every(r=>Math.abs(r.top-e[0].top)<2)&&e.every((r,i)=>i===0||r.left>e[i-1].left)})()'),'Six stages on one horizontal flow '+theme+'/'+density);await capture('pipeline',theme,density);
  }
  test(snapshot()===baseline,'Record presentation and pipeline/theme controls produce no domain mutation');
  await navigate('Clients');await click('.aw-rail-toggle');
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(100);
   test(await get('document.querySelector(".aw-brand-logotype img").complete&&document.querySelector(".aw-brand-logotype img").naturalWidth===2048'),'Exact original master decoded in header '+theme+'/'+density);
   test(await get('document.querySelector(".global-timer")===window.__finalTimer&&document.querySelectorAll(".global-timer").length===1'),'True timer instance survives record work '+theme+'/'+density);
   test(await get('(()=>{const s=document.querySelector(".aw-data-table-scroll");return s.scrollWidth<=s.clientWidth})()'),'No avoidable Client table horizontal scroll '+theme+'/'+density);
   test(await get('(()=>{const r=document.querySelector(".aw-brand-symbol").getBoundingClientRect();return r.width===44&&r.height===44})()'),'Rail brand keeps its actual 44px viewport '+theme+'/'+density);
   await capture('header-reduced-rail',theme,density);
  }
  const current=assets().find(a=>a.role==='logo');dialog.showMessageBox=async()=>({response:1});test(await removeAsset(null,current.id)===true&&assets().length===count,'Confirmed removal clears persisted shared logo');
  test(db.database.get('PRAGMA integrity_check').integrity_check==='ok'&&db.database.all('PRAGMA foreign_key_check').length===0,'TEMP integrity and FK after real asset operations');
  console.log('FINAL_CRM_EVIDENCE '+JSON.stringify({onlyTemp:true,threeZones:true,preview:true,pendingUX01:true,sharedLogo:true,crossWindowConflict:true,captures:root||null}));
 }catch(error){fs.writeFileSync(path.resolve(__dirname,'../../outputs/final-crm-debug.png'),(await win.webContents.capturePage()).toPNG());throw error;}finally{dialog.showOpenDialog=original.open;dialog.showMessageBox=original.message;dialog.showMessageBoxSync=original.sync;}
};

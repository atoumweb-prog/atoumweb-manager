// Production App/preload/IPC; only owned TEMP records and explicitly controlled read failures.
module.exports=async({win,db,temp,registered,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {ipcMain,BrowserWindow,dialog}=require('electron'),fs=require('node:fs'),path=require('node:path');
 const key='atoumweb:home:widgets:v1',originalAlerts=registered.get('operations-alerts:get');
 const originalSetting=db.setSetting.bind(db),originalDialog=dialog.showMessageBoxSync;let writes=0,second;
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control');e.click()`);await sleep(60);};
 const refresh=()=>js('window.dispatchEvent(new CustomEvent("atoumweb:changed"))');
 const ready=()=>wait('document.querySelectorAll("[data-home-source][data-source-status=ready]").length===9','nine independent confirmed sources, including current quotes');
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
 const replaceAlerts=handler=>{ipcMain.removeHandler('operations-alerts:get');ipcMain.handle('operations-alerts:get',handler);};
 try{
  const org=db.crm.createOrganization({name:'HOME TEMP CLIENT'}),client=db.crm.createClient({organizationId:org.id});
  const incident=db.operations.createIntervention({clientAccountId:client.id,type:'incident',priority:'urgent',incidentCriticality:'critical',status:'in_progress',coverageMode:'internal',subject:'HOME TEMP CRITICAL INCIDENT'});
  db.hourPacks.create({clientAccountId:client.id,name:'HOME TEMP EXPIRING PACK',purchasedSeconds:36000,contractPriceCents:1000,expiresAt:new Date(Date.now()+5*86400000).toISOString()});
  db.actions.create({ownerType:'client',ownerId:client.id,type:'follow_up',title:'HOME TEMP TODAY',dueAt:new Date(Date.now()-60000).toISOString()});
  const before=snapshot();await refresh();await ready();
  const actualAlerts=db.operationsAlerts.get().alerts;
  test(actualAlerts.some(alert=>alert.severity==='critical')&&actualAlerts.some(alert=>alert.severity==='warning'),'Actual service fixture includes critical and noncritical priorities');
  await js('window.__todayHome=document.querySelector("[data-home-widget=today]");window.__timerHome=document.querySelector(".global-timer")');
  test(await get('document.querySelectorAll("[data-home-critical]").length>=1'),'Actual service supplies critical incident banner');
  test(await get('document.querySelectorAll("[data-home-alert]").length>=2'),'All actual alerts accessible, not only first');
  test(await get('!document.querySelector(".home-dashboard").textContent.includes("Tout est à jour")'),'No universal all-clear claim');
  await click('.home-widget-settings summary');
  db.setSetting=(...args)=>{if(args[0]==='ux_v2_visual_preferences_v1')writes++;return originalSetting(...args);};
  await click('[data-widget-setting=watch] input');
  test(await get('document.querySelector("[data-home-widget=watch]").hidden&&document.querySelectorAll("[data-home-critical]").length>=1'),'Hiding watch keeps critical alerts visible');
  test(writes===1&&snapshot()===before,'One preference write, no business mutation');
  await click('[aria-label="Monter Temps et facturation"]');
  test(writes===2&&await get('window.__todayHome===document.querySelector("[data-home-widget=today]")'),'Keyboard reorder retains Today mounted and writes once');
  const preDrag=writes;
  await js("const event=new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:new DataTransfer()});document.querySelector('[data-widget-setting=kpis]').dispatchEvent(event)");
  test(writes===preDrag,'Drag preview never persists');
  await js("const data=new DataTransfer();data.setData('text/plain','actions');document.querySelector('[data-widget-setting=kpis]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:data}))");await sleep(60);
  test(writes===preDrag+1&&await get('document.querySelectorAll("[data-home-widget]")[1].dataset.homeWidget==="actions"'),'Drop commits one visual order change');
  const pref=await get(`window.atoumweb.visualPreferences.getItem(${JSON.stringify(key)})`);
  test(!/selectedId|entityId|HOME TEMP|notes|query/.test(pref),'Only widget presentation in persisted schema');
  second=new BrowserWindow({show:false,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});await second.loadFile(path.join(temp,'index.html'));
  for(let i=0;i<100;i++){if(await second.webContents.executeJavaScript('!!document.querySelector("[data-home-widget=watch]")?.hidden'))break;await sleep(40);}
  test(await second.webContents.executeJavaScript('document.querySelector("[data-home-widget=watch]").hidden'),'Second native window restores workspace Home layout');
  db.setSetting=(name,value)=>{if(name==='ux_v2_visual_preferences_v1')throw Error('Injected preference disk refusal');return originalSetting(name,value);};
  const layoutBefore=await get('Array.from(document.querySelectorAll("[data-home-widget]")).map(e=>e.dataset.homeWidget).join(",")');
  await click('[aria-label="Descendre Accès rapides"]');
  test(await get('!!document.querySelector(".home-dashboard .aw-ui-notice--error")')&&await get('Array.from(document.querySelectorAll("[data-home-widget]")).map(e=>e.dataset.homeWidget).join(",")')===layoutBefore,'Failed persistence never announces or applies saved layout');
  db.setSetting=originalSetting;
  // Cache remains explicitly stale on service error; no forced zero/false all-clear.
  replaceAlerts(()=>{throw Error('Injected alert service unavailable');});await refresh();
  await wait('document.querySelector("[data-home-source=alerts]")?.dataset.sourceStatus==="error"','alert source error');
  test(await get('document.querySelectorAll("[data-home-critical]").length>=1&&document.querySelector(".home-dashboard").textContent.includes("Sources indisponibles")'),'Cached critical alert survives failed refresh with visible error');
  test(await get('document.querySelector("[data-home-source=alerts]").textContent.includes("données anciennes")'),'Source freshness explicitly degraded');
  replaceAlerts(originalAlerts);await refresh();await ready();
  // An IPC completing after Home is unmounted cannot navigate or clear a Client draft.
  let finishAway;
  replaceAlerts((...args)=>new Promise(resolve=>{const value=originalAlerts(...args);finishAway=()=>resolve(value);}));
  await refresh();for(let i=0;i<60&&!finishAway;i++)await sleep(20);test(!!finishAway,'Pending Home source before context change');
  await click('.quick-prospect');await wait('!!document.querySelector(".prospection-v2,.prospects-v2,.prospects-page,.prospect-toolbar")||document.querySelector(".page-heading h1")?.textContent==="Prospection"','honest quick navigation');
  await navigate('Clients');
  await js("[...document.querySelectorAll('.client-toolbar button')].find(b=>b.textContent.includes('+ Nouveau client')).click()");await sleep(60);
  await js("const e=document.querySelector('.crm-form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'HOME IPC DRAFT');e.dispatchEvent(new Event('input',{bubbles:true}));window.__homeClientForm=document.querySelector('.crm-form')");await sleep(60);
  finishAway();await sleep(90);
  test(await get('window.__homeClientForm===document.querySelector(".crm-form")&&document.querySelector(".crm-form input").value==="HOME IPC DRAFT"&&!document.querySelector(".home-dashboard")'),'Late Home response keeps current Client draft and exact mounted instance');
  let dialogs=0;dialog.showMessageBoxSync=()=>{dialogs++;return 0;};
  await js("[...document.querySelectorAll('[data-nav-module]')].find(b=>b.getAttribute('aria-label')==='Accueil').click()");await sleep(60);
  test(dialogs===1&&await get('document.querySelector(".crm-form input").value==="HOME IPC DRAFT"'),'Returning Home asks existing UX01 once, Stay keeps draft');
  replaceAlerts(originalAlerts);dialog.showMessageBoxSync=()=>1;await navigate('Accueil');await ready();dialog.showMessageBoxSync=originalDialog;
  test(snapshot()===before,'Discard confirmation never inserts Client or other business data');
  // A slow old reply cannot replace the current real source snapshot.
  let delayedResolve,reads=0;
  replaceAlerts((...args)=>{const value=originalAlerts(...args);if(++reads===1)return new Promise(resolve=>{delayedResolve=()=>resolve({...value,alerts:value.alerts.map(alert=>({...alert,title:'STALE TEMP ALERT'}))});});return value;});
  await refresh();for(let i=0;i<60&&!delayedResolve;i++)await sleep(20);test(!!delayedResolve,'Controlled old actual IPC request started');
  await refresh();await ready();delayedResolve();await sleep(90);
  test(await get('!document.querySelector(".home-dashboard").textContent.includes("STALE TEMP ALERT")'),'Obsolete source response cannot overwrite current dashboard');
  replaceAlerts(originalAlerts);
  await click('[data-home-critical]');await wait(`!!document.querySelector('[data-search-entity-type="intervention"][data-search-entity-id="${incident.id}"]')`,'critical opens exact real intervention');
  test(await get('window.__timerHome===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1'),'Real unique timer retained across Home navigation');
  await navigate('Accueil');await ready();
  await click('.home-today-item');await wait(`!!document.querySelector('[data-search-entity-type="client"][data-search-entity-id="${client.id}"]')`,'today opens actual client');
  test(snapshot()===before,'Home alert/today navigation never writes business rows');
  await navigate('Accueil');await ready();await click('.home-widget-settings summary');
  await js("[...document.querySelectorAll('.home-widget-settings button')].find(b=>b.textContent==='Réinitialiser l’Accueil').click()");await sleep(80);
  test(await get('!document.querySelector("[data-home-widget=watch]").hidden&&document.querySelectorAll("[data-home-widget]")[1].dataset.homeWidget==="kpis"'),'Home reset restores only standard presentation');
  test(snapshot()===before,'Reset keeps all business tables and historic rows');
  // Fresh mount with a failed critical source must never claim all alerts are current.
  await navigate('Clients');replaceAlerts(()=>{throw Error('Injected fresh mount error');});await navigate('Accueil');
  await wait('document.querySelector("[data-home-source=alerts]")?.dataset.sourceStatus==="error"','fresh unknown alerts');
  test(await get('document.querySelector(".home-watch-copy").textContent.includes("Alertes non confirmées")&&!document.querySelector(".home-dashboard").textContent.includes("Tout est à jour")'),'Unknown failed source has no false zero assurance');
  replaceAlerts(originalAlerts);await refresh();await ready();
  const captureDir=process.env.ATOUMWEB_UXV2_02D_CAPTURES;
  for(const [selector,label] of [['.quick-quote','Devis'],['.quick-project','Projets'],['.quick-request','Interventions & Maintenance']]){
   await click(selector);await wait(`document.querySelector('.page-heading h1')?.textContent===${JSON.stringify(label)}`,'honest quick link '+label);
   test(snapshot()===before,'Quick '+label+' opens module without creating business entity');await navigate('Accueil');await ready();
  }
  if(captureDir){if(!path.isAbsolute(captureDir)||/validation-msi/i.test(captureDir)||fs.existsSync(captureDir))throw Error('Fresh absolute capture directory required');fs.mkdirSync(captureDir,{recursive:true});}
  let index=0;
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(50);
   const result=await get('({overflow:document.querySelector(".home-dashboard").scrollWidth>document.querySelector(".home-dashboard").clientWidth+2,font:parseFloat(getComputedStyle(document.querySelector(".home-quick-actions button")).fontSize),timer:document.querySelectorAll(".global-timer").length,today:!document.querySelector("[data-home-widget=today]").hidden})');
   test(!result.overflow&&result.font>=14&&result.timer===1&&result.today,theme+' '+density+' real Home readable and timer unique '+JSON.stringify(result));
   if(captureDir){
    const color=[40+index*13,80+index*11,100+index*9];index++;
    await js(`let marker=document.getElementById('home-capture-marker');if(!marker){marker=document.createElement('div');marker.id='home-capture-marker';document.body.append(marker);}marker.style.cssText='position:fixed;bottom:0;right:0;width:40px;height:40px;z-index:999999;background:rgb(${color.join(',')})';await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));`);
    // RAF updates DOM, but does not prove that Chromium submitted its composited frame.
    // Same sentinel protocol as the shared harness: await the requested frame, never save an old one.
    let image,matched=false;
    const expected=[...color].sort((a,b)=>a-b);
    for(let frame=0;frame<20;frame++){
     image=await win.webContents.capturePage();const size=image.getSize(),bitmap=image.toBitmap(),offset=((size.height-17)*size.width+size.width-17)*4;
     const actual=[...bitmap.subarray(offset,offset+3)].sort((a,b)=>a-b);
     if(expected.every((value,i)=>Math.abs(value-actual[i])<=7)){matched=true;break;}
     await sleep(25);
    }
    test(matched,'Synchronized composited capture '+theme+'/'+density);
    fs.writeFileSync(path.join(captureDir,theme+'-'+density+'-Accueil.png'),image.toPNG(),{flag:'wx'});
   }
  }
  await js('document.getElementById("home-capture-marker")?.remove()');
  win.setSize(1280,720);await sleep(100);
  await js('document.querySelector(".content-area").scrollTop=0');
  test(await get('document.querySelector("[data-home-widget=today]").getBoundingClientRect().bottom<=window.innerHeight'),'Today accessible in initial 1280x720 viewport '+JSON.stringify(await get('({height:window.innerHeight,bottom:document.querySelector("[data-home-widget=today]").getBoundingClientRect().bottom,top:document.querySelector(".home-dashboard").getBoundingClientRect().top})')));
  win.setSize(760,720);win.webContents.setZoomFactor(1.25);await sleep(120);
  test(await get('document.querySelector(".home-dashboard").scrollWidth<=document.querySelector(".home-dashboard").clientWidth+2'),'Narrow Home zoom125 has no horizontal overflow');
  test(snapshot()===before,'All Home gestures/faults preserve business data');
  console.log('02D_HOME_SCENARIOS passed');
 }finally{db.setSetting=originalSetting;dialog.showMessageBoxSync=originalDialog;replaceAlerts(originalAlerts);if(second&&!second.isDestroyed())second.destroy();}
};

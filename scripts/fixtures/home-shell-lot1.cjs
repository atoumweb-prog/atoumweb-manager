const fs=require('node:fs'),path=require('node:path');
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const cpSafe=(...args)=>require('node:child_process').execFileSync('git',args,{encoding:'utf8'});
 const out=process.env.ATOUMWEB_UX_LOT1_OUTPUT, states=[],checks=[];fs.mkdirSync(path.join(out,'details'),{recursive:true});
 const check=(ok,label)=>{checks.push({label,passed:!!ok});fs.writeFileSync(path.join(out,'checks-progress.json'),JSON.stringify(checks,null,2));test(ok,label);};
 const org=db.crm.createOrganization({name:'TEST — Atelier Synthétique'}), client=db.crm.createClient({organizationId:org.id});
 for(const [i,name,stage] of [[1,'TEST — Les Fleurs du Lac','qualifying'],[2,'TEST — Cabinet Archimed','need_identified'],[3,'TEST — Espace Vitalité, accompagnement du site et suivi technique','quote_to_prepare']]){
  const o=db.crm.createOrganization({name}),p=db.crm.createProspect({organizationId:o.id,stage});
  for(let k=0;k<4;k++)db.actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:'TEST — Échange de suivi '+(k+1),dueAt:new Date().toISOString()});
 }
 db.operations.createIntervention({clientAccountId:client.id,type:'incident',priority:'normal',status:'in_progress',coverageMode:'internal',subject:'TEST — Suivi technique'});
 for(let i=0;i<8;i++)db.hourPacks.create({clientAccountId:client.id,name:'TEST — Assistance à renouveler '+(i+1),purchasedSeconds:36000,contractPriceCents:1000,expiresAt:new Date(Date.now()+5*86400000).toISOString()});
 for(const name of ['TEST — Refonte du site Atelier Synthétique','TEST — Optimisation des performances et accessibilité','TEST — Site de démonstration'])await get('window.atoumweb.projects.projects.createInternal('+JSON.stringify({name})+')');
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
 const protectedSnapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%contract%' OR name LIKE '%catalog%' OR name LIKE '%rgpd%' OR name LIKE '%quote%') ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM \"'+name+'\" ORDER BY rowid')]));
 const protectedBefore=protectedSnapshot();
 const before=snapshot();
 await navigate('Accueil');await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort';window.dispatchEvent(new CustomEvent('atoumweb:changed'))");
 await wait('document.querySelectorAll("[data-home-source][data-source-status=ready]").length===9','all nine current sources');
 const timer=await js('window.__reviewTimer=document.querySelector(".global-timer");return true');
 let seq=0;
 async function capture(name){
  const rgb=[32+(++seq*53)%193,32+(seq*89)%193,32+(seq*127)%193];
  await js(`window.__captureFocus=document.activeElement;document.activeElement?.blur();let m=document.getElementById('review-frame-marker');if(!m){m=document.createElement('div');m.id='review-frame-marker';document.body.appendChild(m)}m.style.cssText='position:fixed;right:0;bottom:0;width:12px;height:12px;z-index:2147483647;pointer-events:none;background:rgb(${rgb.join(',')})';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  let frame;
  for(let i=0;i<25;i++){await sleep(90);const f=await win.webContents.capturePage(),size=f.getSize(),bitmap=f.toBitmap(),offset=((size.height-4)*size.width+size.width-4)*4;const actual=[...bitmap.subarray(offset,offset+3)].sort((a,b)=>a-b),want=[...rgb].sort((a,b)=>a-b);if(actual.every((v,j)=>Math.abs(v-want[j])<8)){frame=f;break;}}
  if(!frame)throw Error('Compositor marker unconfirmed: '+name);
  fs.writeFileSync(path.join(out,name+'.png'),frame.toPNG());await js('if(window.__captureFocus?.isConnected)window.__captureFocus.focus({preventScroll:true})');return {file:name+'.png',bitmap:frame.getSize()};
 }
 const measure=()=>get(`(()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect(),c=getComputedStyle(e);return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,display:c.display,font:c.fontSize}};return{viewport:[innerWidth,innerHeight],devicePixelRatio,header:r('.aw-workspace-header'),rail:r('.aw-navigation-rail'),home:r('.home-dashboard'),content:r('.content-area'),today:r('[data-home-widget=today]'),watch:r('[data-home-widget=watch]'),time:r('[data-home-widget=time]'),legend:r('.home-time-legend'),search:r('.aw-header-search'),searchButton:r('#header-search-trigger'),clock:r('.aw-header-date'),timer:r('.aw-header-timer'),bell:r('#header-alerts-trigger'),settings:r('#header-settings-trigger'),group:r('.aw-rail-group-heading'),timeCollision:(()=>{const legend=document.querySelector('.home-time-legend');const nodes=[...legend.querySelectorAll('small,em,strong')];const boxes=nodes.map(e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return{text:e.textContent,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}});const collisions=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)collisions.push([a.text,b.text]);}return{boxes,collisions,overflow:legend.scrollWidth-legend.clientWidth}})(),sameTimer:window.__reviewTimer===document.querySelector('.global-timer'),timerCount:document.querySelectorAll('.global-timer').length,sourceReady:document.querySelectorAll('[data-source-status=ready]').length}})()`);
 for(const [w,h] of [[1920,1080],[1366,768],[1280,720]])for(const z of [1,1.25,1.5])for(const collapsed of [false,true]){
  win.webContents.setZoomFactor(z);win.setContentSize(w,h);await sleep(100);
  const current=await get('document.querySelector(".aw-navigation-rail").dataset.railCollapsed==="true"');if(current!==collapsed)await js('document.querySelector(".aw-rail-toggle").click()');
  await js('document.querySelector(".content-area").scrollTop=0;document.querySelector(".aw-rail-scroll").scrollTop=0');await sleep(180);
  const name=`home-${w}x${h}-z${Math.round(z*100)}-${collapsed?'reduit':'deploye'}`;
  const state={name,requestedContent:[w,h],contentSize:win.getContentSize(),zoom:win.webContents.getZoomFactor(),collapsed,...await measure(),...await capture(name)};states.push(state);check(state.header.scrollWidth<=state.header.clientWidth+2&&state.home.scrollWidth<=state.home.clientWidth+2,'No global overflow '+name);check(state.timeCollision.collisions.length===0&&state.timeCollision.overflow<=2,'No time text collision '+name);check(state.sameTimer&&state.timerCount===1,'Same unique timer '+name);console.log('CAPTURE '+name+' '+JSON.stringify(state.viewport));
  if(w===1280&&z===1.5){await js('document.querySelector(".content-area").scrollTop=document.querySelector(".content-area").scrollHeight');await sleep(90);states.push({name:name+'-bas',...await measure(),...await capture(name+'-bas')});}
 }
 // Homologous baseline views, with the candidate layout.
 win.webContents.setZoomFactor(1.5);win.setContentSize(1280,720);await js('document.querySelector(".content-area").scrollTop=0');
 await js('document.querySelector("#header-alerts-trigger").click()');await wait('document.querySelectorAll(".aw-header-alert-item").length===8','eight real fixture alerts');
 states.push({name:'alertes-1280-z150',...await measure(),panel:await get(`(()=>{const r=document.querySelector('#header-alerts-panel').getBoundingClientRect();return{top:r.top,bottom:r.bottom}})()`),...await capture('alertes-1280-z150')});
 await js('document.querySelector("#header-alerts-panel header button").click()');
 await js('document.querySelector("[data-nav-group=Commercial]").click()');await sleep(80);states.push({name:'groupe-1280-z150',...await measure(),...await capture('groupe-1280-z150')});await js('document.querySelector(".aw-rail-flyout header button").click()');
 win.webContents.setZoomFactor(1);win.setContentSize(1920,1080);await js('document.querySelector(".aw-rail-toggle").click();document.querySelector(".home-personalize").click()');await sleep(100);
 states.push({name:'personnalisation-1920',displayOrder:await get('[...document.querySelectorAll(".home-widgets>[data-home-widget]")].map(e=>e.dataset.homeWidget)'),settingsOrder:await get('[...document.querySelectorAll("[data-widget-setting]")].map(e=>e.dataset.widgetSetting)'),...await capture('personnalisation-1920')});
 await js('document.querySelector(".home-personalize").click()');await sleep(70);

 for(const [w,h,z,collapsed] of [[1366,768,1,false],[1280,720,1,false],[1280,720,1.25,true],[1280,720,1.5,false]]){
  win.webContents.setZoomFactor(z);win.setContentSize(w,h);await sleep(80);
  if(await get('document.querySelector(".aw-navigation-rail").dataset.railCollapsed==="true"')!==collapsed)await js('document.querySelector(".aw-rail-toggle").click()');
  await js("document.querySelector('[data-home-widget=time]').scrollIntoView({block:'center'})");await sleep(100);
  const name=`details/detail-${w}x${h}-z${Math.round(z*100)}-${collapsed?'reduit':'deploye'}`;
  states.push({name,...await measure(),...await capture(name)});
  if(z===1.5){await js('document.querySelector(".content-area").scrollTop=document.querySelector(".content-area").scrollHeight');states.push({name:name+'-bas',...await measure(),...await capture(name+'-bas')});}
 }
 for(const [w,h] of [[1280,720],[1366,768]]){
  win.webContents.setZoomFactor(1.5);win.setContentSize(w,h);await js('document.querySelector(".content-area").scrollTop=0;document.querySelector("#header-alerts-trigger").click()');
  await wait('document.querySelectorAll(".aw-header-alert-item").length===8','fixture alert list');
  const anchored=await get(`(()=>{const h=document.querySelector('.aw-workspace-header').getBoundingClientRect(),p=document.querySelector('#header-alerts-panel').getBoundingClientRect();return{headerBottom:h.bottom,panelTop:p.top,panelBottom:p.bottom,height:innerHeight,closeVisible:document.querySelector('#header-alerts-panel header button').getBoundingClientRect().bottom<=innerHeight}})()`);
  check(anchored.panelTop>=anchored.headerBottom+7&&anchored.panelBottom<=anchored.height&&anchored.closeVisible,'Alert panel follows actual header '+w);
  const name=w===1280?'details/alertes-deploye-1280-z150':'extras/alertes-deploye-1366-z150';fs.mkdirSync(path.join(out,'extras'),{recursive:true});states.push({name,anchored,...await capture(name)});
  win.focus();win.webContents.focus();await js('document.querySelector("#header-alerts-panel header button").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(80);
  check(await get('!document.querySelector("#header-alerts-panel")&&document.activeElement.id==="header-alerts-trigger"'),'Native Escape returns to bell '+w);
 }
 check(snapshot()===before,'Zero fixture: presentation preserves all business rows');
 check(await get('parseFloat(getComputedStyle(document.querySelector(".aw-rail-group-heading")).fontSize)>=14'),'Noir/Confort group labels respect 14px minimum');
 check(await get('getComputedStyle(document.querySelector(".aw-brand-home-reference")).backgroundColor==="rgba(0, 0, 0, 0)"'),'Home brand has no white plate');
 // Personalization: effective order, explicit personal choice, persistence and focus.
 win.webContents.setZoomFactor(1);win.setContentSize(1920,1080);
 await js('if(!document.querySelector("#home-personalization").open)document.querySelector(".home-personalize").click()');await sleep(80);
 const order=()=>get('({display:[...document.querySelectorAll(".home-widgets>[data-home-widget]")].map(e=>e.dataset.homeWidget),settings:[...document.querySelectorAll("[data-widget-setting]")].map(e=>e.dataset.widgetSetting)})');
 await js('window.__lot1Today=document.querySelector("#home-content-today article")');
 let ordered=await order();check(JSON.stringify(ordered.display)===JSON.stringify(ordered.settings),'Settings order matches visible standard order');
 await js(`document.querySelector('[aria-label="Monter Indicateurs"]').click()`);await sleep(70);
 check(await get('window.__lot1Today===document.querySelector("#home-content-today article")'),'Reordering keeps Today mounted');
 const custom=await order();check(custom.display[1]==='kpis'&&JSON.stringify(custom.display)===JSON.stringify(custom.settings),'Move uses displayed order without resetting choices');
 await js('document.querySelector(".home-personalize").click()');await sleep(60);await js('document.querySelector(".home-personalize").click()');await sleep(80);check(JSON.stringify((await order()).display)===JSON.stringify(custom.display),'Custom order retained after reopening');
 await navigate('Gestion des temps');await navigate('Accueil');await wait('document.querySelectorAll("[data-source-status=ready]").length===9','restored Home');await js('document.querySelector(".home-personalize").click()');await sleep(60);check(JSON.stringify((await order()).display)===JSON.stringify(custom.display),'Custom order restored from existing preference store after remount');
 check(await get('document.querySelector(".home-personalize").getAttribute("aria-expanded")==="true"'),'Expanded state exposed');
 const contrast=await get(`(()=>{const e=document.querySelector('[data-widget-setting=kpis] .home-widget-drag'),s=getComputedStyle(e),lum=c=>{const rgb=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722},a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)})()`);
 check(contrast>=4.5,'Drag handle text contrast is at least 4.5:1 ('+contrast.toFixed(2)+')');
 win.focus();win.webContents.focus();await js('document.querySelector("#home-personalization summary").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(80);
 check(await get('!document.querySelector("#home-personalization").open&&document.activeElement.classList.contains("home-personalize")'),'Native Escape closes personalization and returns focus');
 await js('document.querySelector(".home-personalize").click()');await sleep(50);await js(`[...document.querySelectorAll('#home-personalization button')].find(e=>e.textContent==='Réinitialiser l’Accueil').click()`);await sleep(60);await js('document.querySelector(".home-personalize").click()');
 // Non-zero values come from actual TEMP services, not mocked renderer counters.
 const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1,0,0,0).getTime();
 db.time.addManual({category:'development',activityLabel:'TEST — Temps facturable',billable:true,startedAt:new Date(start).toISOString(),endedAt:new Date(start+36.5*3600000).toISOString()});
 db.time.addManual({category:'administrative',activityLabel:'TEST — Temps non facturable',billable:false,startedAt:new Date(start+37*3600000).toISOString(),endedAt:new Date(start+49.75*3600000).toISOString()});
 const pack=db.hourPacks.create({clientAccountId:client.id,name:'TEST — Valeur longue de recette',purchasedSeconds:36000,contractPriceCents:123456789});db.billingHandoff.ensureForHourPack(pack.id);
 await js('window.dispatchEvent(new CustomEvent("atoumweb:changed"))');await wait('document.querySelectorAll("[data-source-status=ready]").length===9&&document.querySelector(".home-time-donut strong").textContent!=="0 h"','non-zero real services');
 const nonzeroBefore=snapshot();
 for(const [w,h,z,collapsed] of [[1920,1080,1,false],[1366,768,1,false],[1280,720,1,false],[1280,720,1.25,true],[1280,720,1.5,false]]){
  win.webContents.setZoomFactor(z);win.setContentSize(w,h);if(await get('document.querySelector(".aw-navigation-rail").dataset.railCollapsed==="true"')!==collapsed)await js('document.querySelector(".aw-rail-toggle").click()');
  await js("document.querySelector('[data-home-widget=time]').scrollIntoView({block:'center'})");await sleep(100);
  const m=await measure();check(m.timeCollision.collisions.length===0&&m.timeCollision.overflow<=2,'Non-zero legend without collisions '+[w,z,collapsed]);
  const name=`extras/nonzero-${w}x${h}-z${z*100}-${collapsed?'reduit':'deploye'}`;states.push({name,phase:'nonzero',...m,...await capture(name)});
 }
 check(snapshot()===nonzeroBefore,'Non-zero presentation preserves all business rows');
 // Existing UX01 still owns unsaved drafts, including the header settings command.
 const {dialog}=require('electron'),originalDialog=dialog.showMessageBoxSync;
 try{
  let confirmations=0;dialog.showMessageBoxSync=()=>{confirmations++;return 0;};
  await navigate('Prospection');
  await js('[...document.querySelectorAll(".aw-rail-group-heading")].find(e=>e.textContent.trim()==="Commercial").click()');await sleep(50);
  check(await get('!!document.querySelector(".aw-rail-group-heading[data-group-active=true][aria-expanded=false]")'),'Collapsed group still identifies its active destination');
  states.push({name:'extras/active-group-collapsed',...await capture('extras/active-group-collapsed')});
  await js('[...document.querySelectorAll(".aw-rail-group-heading")].find(e=>e.textContent.trim()==="Commercial").click()');
  await js('document.querySelector(".prospection-pilot-heading .primary-button").click()');await sleep(50);
  await js(`const e=document.querySelector('.prospect-create-v2 input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'TEST UX LOT1 DRAFT');e.dispatchEvent(new Event('input',{bubbles:true}));window.__lot1Draft=document.querySelector('.prospect-create-v2')`);await sleep(60);
  await js('document.querySelector("#header-settings-trigger").click()');await sleep(60);
  check(confirmations===1&&await get('document.querySelector(".prospect-create-v2 input").value==="TEST UX LOT1 DRAFT"&&window.__lot1Draft===document.querySelector(".prospect-create-v2")'),'UX01 Stay preserves exact draft and mounted editor');
  check(await get('!document.querySelector(".aw-brand-home-reference")'),'Home logo variant is absent from Prospection');
  await js(`const e=document.querySelector('.prospect-create-v2 input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(50);
 }finally{dialog.showMessageBoxSync=originalDialog;}
 await navigate('Accueil');await wait('document.querySelectorAll("[data-source-status=ready]").length===9','back Home');
 const session=await get("window.atoumweb.time.start({activityLabel:'TEST — Chrono actif lot 1',category:'development',billable:false})");
 await js('window.dispatchEvent(new CustomEvent("atoumweb:time-changed"))');await wait('document.querySelector(".global-timer.running")','actual active timer');
 await js('window.__lot1ActiveTimer=document.querySelector(".global-timer")');
 for(const [w,z] of [[1280,1.5],[1366,1.25]]){win.setContentSize(w,720);win.webContents.setZoomFactor(z);await sleep(80);check(await get('document.querySelectorAll(".global-timer").length===1&&window.__lot1ActiveTimer===document.querySelector(".global-timer")'),'Active timer remains mounted '+w);}
 await js('window.dispatchEvent(new CustomEvent("atoumweb:timer-context",{detail:{activityLabel:"TEST — Changement proposé",category:"development",billable:false}}))');await wait('document.querySelector(".timer-switch-popover")','active timer switch dialog');
 check(await get('document.querySelector("#header-alerts-trigger").disabled&&document.querySelector("#header-settings-trigger").disabled&&window.__lot1ActiveTimer===document.querySelector(".global-timer")'),'Active timer dialog preserves timer and exclusive layer');
 states.push({name:'extras/active-timer-dialog',...await capture('extras/active-timer-dialog')});
 await js('document.querySelector(".timer-switch-popover .secondary-button").focus()');win.focus();win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(80);
 check(!await get('!!document.querySelector(".timer-switch-popover")')&&(await get('window.atoumweb.time.active()')).id===session.id,'Escape leaves the original active session running');
 // Stop the explicit TEST session only, then inspect the existing idle dialog.

 await get(`window.atoumweb.time.stop(${JSON.stringify(session.id)})`);await js('window.dispatchEvent(new CustomEvent("atoumweb:time-changed"))');await wait('!document.querySelector(".global-timer.running")','stop TEST timer');
 await js('document.querySelector(".timer-main-button").click()');await wait('document.querySelector(".timer-popover")','existing timer dialog');
 check(await get('document.querySelector("#header-alerts-trigger").disabled&&document.querySelector("#header-settings-trigger").disabled'),'Timer dialog keeps exclusive ownership of header commands');
 states.push({name:'extras/timer-dialog',...await capture('extras/timer-dialog')});
 win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(80);check(await get('!document.querySelector(".timer-popover")'),'Native Escape closes clean timer dialog');
 // Limited functional smoke only: no deliberate visual redesign of other palettes.
 const smoke=[];
 for(const [theme,density] of [['blanc','comfort'],['atoumweb','comfort'],['noir','compact'],['noir','comfort_plus']]){
  win.webContents.setZoomFactor(1);win.setContentSize(1366,768);await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);await sleep(70);
  const m=await measure();check(m.header.scrollWidth<=m.header.clientWidth+2&&m.home.scrollWidth<=m.home.clientWidth+2&&m.timerCount===1,'Limited shared behavior smoke '+theme+'/'+density);smoke.push({theme,density,...m});states.push({name:`extras/smoke-${theme}-${density}`,phase:'smoke',...await capture(`extras/smoke-${theme}-${density}`)});
 }
 await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
 if(await get('document.querySelector(".aw-navigation-rail").dataset.railCollapsed==="true"'))await js('document.querySelector(".aw-rail-toggle").click()');
 check(await get('document.querySelectorAll("[data-nav-module]").length===17'),'All seventeen destinations remain in expanded navigation');

 check(protectedSnapshot()===protectedBefore,'Contract, Catalogue, RGPD and quote fixture rows remain unchanged');
 const report={sha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),onlyTemp:true,workspace:db.workspacePath??'owned harness TEMP workspace',presentationBusinessRowsUnchanged:true,zeroPhaseBusinessRowsUnchanged:true,nonzeroPhaseBusinessRowsUnchanged:true,checks,smoke,dirty:!!cpSafe('status','--porcelain').trim(),sourceDiffSha256:require('node:crypto').createHash('sha256').update(cpSafe('diff','--binary')).digest('hex'),theme:'noir',density:'comfort',marker:'12px bottom-right compositor synchronization',states};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><meta charset="utf-8"><title>Manager — captures avant modification</title><style>body{font:16px system-ui;background:#071b2d;color:#edf4ff;margin:24px}img{max-width:100%;height:auto;border:1px solid #53718b}a{color:#ffd326}section{margin:32px 0}</style><h1>Accueil / en-tête / rail — avant modification</h1><p>HEAD '+report.sha+' · Noir / Confort · données TEST neuves et isolées. Dimensions demandées = surface de contenu Electron ; viewport CSS réduit au zoom. Carré de 12 px en bas à droite = contrôle de synchronisation.</p><a href="report.json">Mesures JSON</a>'+states.map(s=>'<section><h2>'+s.name+'</h2><p>Viewport CSS '+JSON.stringify(s.viewport??'détail')+'</p><a href="'+s.file+'"><img src="'+s.file+'"></a></section>').join(''));
 console.log('VISUAL_REVIEW '+JSON.stringify({states:states.length,presentationBusinessRowsUnchanged:report.presentationBusinessRowsUnchanged,sha:report.sha}));
};

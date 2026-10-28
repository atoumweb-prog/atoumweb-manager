// Native regression: real renderer/IPC, business fixtures and schema, never an installed profile.
module.exports=async ctx=>{
 const {win,db,temp,evalUI:js,get,wait,navigate,test,sleep}=ctx,fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
 await require('./real-shell-scenarios.cjs')({...ctx,preload:path.join(temp,'preload.js')});
 await navigate('Accueil');
 await require('./02d-home-scenarios.cjs')(ctx);
 for(const [name,stage] of [['Atelier Demo','qualifying'],['Boutique Demo','need_identified'],['Studio Demo','quote_to_prepare']]){
  const org=db.crm.createOrganization({name}),p=db.crm.createProspect({organizationId:org.id,stage});db.actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:'Contacter '+name,dueAt:new Date().toISOString()});
 }
 const business=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
 const before=business();await navigate('Accueil');await js('window.dispatchEvent(new CustomEvent("atoumweb:changed"))');await wait('document.querySelectorAll("[data-home-source][data-source-status=ready]").length===9','Home ready');
 await wait('Number(document.querySelector("[data-home-pipeline=qualifying] strong")?.textContent)>0||[...document.querySelectorAll(".home-pipeline-item strong")].reduce((n,e)=>n+Number(e.textContent),0)>=3','Seeded prospects confirmed in pipeline');
 await js('document.querySelector(".notice-close")?.click()');
 await js('window.__shellTimer=document.querySelector(".global-timer");window.__shellToday=document.querySelector("#home-content-today");window.__shellTodayChild=document.querySelector("#home-content-today article")');
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(40);};
 test(await get('document.querySelectorAll(".aw-rail-toggle").length===1&&!document.querySelector(".aw-header-primary [aria-label*=rail]")'),'One rail mode control in real shell');
 test(await get('document.querySelectorAll(".aw-brand-logotype").length===1'),'One full brand, original master retained');
 for(const key of ['today','kpis','pipeline','time','watch','actions']){
  await click(`[aria-controls="home-content-${key}"]`);
  test(await get(`document.querySelector('#home-content-${key}').hidden&&document.querySelector('[data-home-widget=${key}]').hidden===false`),'Fold '+key+' keeps its visible entry');
  if(key==='today')test(await get('window.__shellTodayChild===document.querySelector("#home-content-today article")'),'Fold preserves mounted Today node');
  test(await get('document.querySelectorAll("[data-home-critical]").length>0'),'Critical action remains accessible when '+key+' folds');
  await click(`[aria-controls="home-content-${key}"]`);
 }
 await click('[aria-controls="rail-group-0"]');test(await get('document.querySelector("#rail-group-0").hidden'),'Commercial group folds');
 await click('.aw-rail-toggle');await click('[data-nav-group="Commercial"]');test(await get('!!document.querySelector(".aw-rail-flyout [data-nav-module=Devis]")'),'Reduced rail still offers destinations from folded group');
 await click('.aw-rail-flyout header button');await click('.aw-rail-toggle');test(await get('document.querySelector("#rail-group-0").hidden'),'Rail mode does not reset group choice');await click('[aria-controls="rail-group-0"]');
 await click('#header-options-trigger');await js('document.querySelector(".aw-header-secondary #header-library, .aw-header-secondary").tabIndex=0;document.querySelector(".aw-header-secondary").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(40);test(await get('document.activeElement.id==="header-options-trigger"&&!document.querySelector(".aw-header-secondary.is-open")'),'Native Escape closes header details and restores focus');
 await js('const e=document.querySelector(".aw-header-search input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"");e.dispatchEvent(new Event("input",{bubbles:true}));e.blur()');
 const out=path.resolve('outputs','shell-home-review-'+Date.now());fs.mkdirSync(out,{recursive:true});const states=[],captures=[];
 async function capture(name){
  const color=[60+captures.length*7,110,165];await js(`let m=document.getElementById('shell-review-marker');if(!m){m=document.createElement('div');m.id='shell-review-marker';document.body.append(m);}m.style.cssText='position:fixed;right:0;bottom:0;width:40px;height:40px;z-index:999999;background:rgb(${color.join(',')})';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);
  let frame,matched=false;for(let i=0;i<20;i++){frame=await win.webContents.capturePage();const size=frame.getSize(),b=frame.toBitmap(),offset=((size.height-17)*size.width+size.width-17)*4,actual=[...b.subarray(offset,offset+3)].sort((a,b)=>a-b),expected=[...color].sort((a,b)=>a-b);if(expected.every((v,j)=>Math.abs(v-actual[j])<=7)){matched=true;break;}await sleep(30);}test(matched,'Current composited screenshot '+name);fs.writeFileSync(path.join(out,name+'.png'),frame.toPNG());captures.push(name+'.png');
 }
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)}`);
  for(const [width,height] of [[760,720],[1280,720],[1920,1080],[2560,1440],[3440,1440]])for(const zoom of [1,1.25,1.5])for(const collapsed of [false,true]){
   win.setSize(width,height);win.webContents.setZoomFactor(zoom);
   if(await get('document.querySelector(".aw-navigation-rail").dataset.railCollapsed')!==String(collapsed))await click('.aw-rail-toggle');await sleep(40);
   const state=await get(`(()=>{const h=document.querySelector('.aw-workspace-header'),home=document.querySelector('.home-dashboard'),timer=document.querySelector('.global-timer'),input=document.querySelector('.aw-header-search input'),trigger=document.querySelector('#header-search-trigger');return {width:innerWidth,height:innerHeight,bodyOverflow:document.documentElement.scrollWidth>innerWidth+2,headerOverflow:h.scrollWidth>h.clientWidth+2,homeOverflow:home.scrollWidth>home.clientWidth+2,timer:timer===window.__shellTimer&&document.querySelectorAll('.global-timer').length===1,today:window.__shellToday===document.querySelector('#home-content-today'),searchAccess:!!input?.getClientRects().length||!!trigger?.getClientRects().length,font:parseFloat(getComputedStyle(document.querySelector('.home-widget-fold')).fontSize),pipelineHeight:document.querySelector('.home-pipeline-item').getBoundingClientRect().height}})()`);
   states.push({theme,density,requestedWidth:width,requestedHeight:height,zoom,collapsed,...state});if(width>=1920)test(state.pipelineHeight<180,'Large screen keeps compact pipeline '+state.pipelineHeight);test(!state.bodyOverflow&&!state.headerOverflow&&!state.homeOverflow,'No horizontal page overflow '+JSON.stringify(states.at(-1)));test(state.timer&&state.today&&state.searchAccess&&state.font>=14,'Mounted timer, Home, readable controls, search accessible '+JSON.stringify(states.at(-1)));
   if(width===1920&&zoom===1&&!collapsed)await capture(theme+'-'+density+'-1920');
   if(theme==='atoumweb'&&density==='comfort'&&((width===1280&&zoom===1.5)||(width===2560&&zoom===1.25&&!collapsed)||(width===3440&&zoom===1.25&&!collapsed)))await capture('adaptive-'+width+'-zoom'+zoom+'-rail'+collapsed);
  }
 }
 test(business()===before,'All folds, zooms and screenshots preserve business rows');
 test(await get('document.querySelectorAll(".home-pipeline-item").length===7'),'Six operational stages plus historical conversion preserved');
 const report={sha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),states,captures,onlyTemp:true};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><title>Accueil et navigation — revue</title><style>body{background:#101820;color:#fff;font:16px system-ui;margin:24px}article{margin:32px 0}img{width:100%;height:auto;border:1px solid #59636e}a{color:#f5cc50}</style><h1>Accueil et navigation — captures réelles sur fixtures</h1><p>SHA '+report.sha+' — '+states.length+' configurations mesurées. Maquette de référence à comparer séparément. Les dimensions des images dépendent aussi de l’échelle native Windows.</p>'+captures.map(f=>'<article><h2>'+f+'</h2><a href="'+f+'"><img src="'+f+'" loading="lazy"></a></article>').join('')+'</html>');
 console.log('SHELL_HOME_REVIEW '+out);
};

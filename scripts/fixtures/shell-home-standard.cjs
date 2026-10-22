// One visual candidate only: Noir / Confort / 1920x1080 / 100%, owned TEMP.
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
 const org=db.crm.createOrganization({name:'Atelier Synthétique'}),client=db.crm.createClient({organizationId:org.id});
 for(const [name,stage] of [['Les Fleurs du Lac','qualifying'],['Cabinet Archimed','need_identified'],['Espace Vitalité','quote_to_prepare']]){
  const o=db.crm.createOrganization({name}),p=db.crm.createProspect({organizationId:o.id,stage});db.actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:'Préparer un échange — '+name,dueAt:new Date().toISOString()});
 }
 db.operations.createIntervention({clientAccountId:client.id,type:'incident',priority:'normal',status:'in_progress',coverageMode:'internal',subject:'Suivi technique — Atelier Synthétique'});
 db.hourPacks.create({clientAccountId:client.id,name:'Assistance à renouveler',purchasedSeconds:36000,contractPriceCents:1000,expiresAt:new Date(Date.now()+5*86400000).toISOString()});
 await get("window.atoumweb.projects.projects.createInternal({name:'Refonte du site — Atelier Synthétique'})");
 await navigate('Accueil');await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort';window.dispatchEvent(new CustomEvent('atoumweb:changed'))");
 win.setContentSize(1920,1080);win.webContents.setZoomFactor(1);
 await wait('document.querySelectorAll("[data-home-source][data-source-status=ready]").length===9','confirmed sources');
 await wait('document.querySelectorAll("[data-home-project]").length===1','recent project from existing source');
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));const before=snapshot();
 await js('window.__homeTimer=document.querySelector(".global-timer");window.__today=document.querySelector("#home-content-today article")');
 const geometry=await get(`(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return{width:innerWidth,height:innerHeight,today:r('[data-home-widget=today]').top,watch:r('[data-home-widget=watch]').top,kpis:r('[data-home-widget=kpis]').top,pipeline:r('[data-home-widget=pipeline]').top,overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
 test(geometry.width===1920&&geometry.height===1080,'Exact standard CSS viewport');test(await get(`(()=>{const s=getComputedStyle(document.querySelector('.aw-manager-shell'));return s.getPropertyValue('--canvas').trim()==='#031321'&&s.getPropertyValue('--surface').trim()==='#071b2d'&&s.getPropertyValue('--sidebar').trim()==='#041321'&&s.getPropertyValue('--accent').trim()==='#ffd326'})()`),'Latest approved blue-night Home palette');test(Math.abs(geometry.today-geometry.watch)<2,'Today and Watch side by side');test(geometry.kpis>geometry.today&&geometry.pipeline>geometry.kpis,'Reference reading order');test(!geometry.overflow,'No page overflow');
 for(const key of ['today','watch','kpis','pipeline','time','actions']){
  await js(`document.querySelector('[aria-controls=home-content-${key}]').click()`);await sleep(30);test(await get(`document.querySelector('#home-content-${key}').hidden`),'Fold '+key);await js(`document.querySelector('[aria-controls=home-content-${key}]').click()`);await sleep(30);
 }
 test(await get('window.__homeTimer===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1'),'Unique timer unchanged');test(await get('window.__today===document.querySelector("#home-content-today article")'),'Fold preserves mounted content');
 await js('document.querySelector(".home-personalize").click()');test(await get('document.querySelector("#home-personalization").open'),'Personalization still available');await js('document.querySelector(".home-personalize").click()');
 test(await get('document.querySelectorAll(".home-pipeline-item").length===7&&document.querySelectorAll("[data-nav-module]").length===17'),'6+1 pipeline and 17 routes preserved');test(snapshot()===before,'Presentation does not mutate business rows');
 const out=path.resolve('outputs','shell-reference-standard');fs.mkdirSync(out,{recursive:true});
 await js('document.querySelector(".content-area").scrollTop=0;document.activeElement?.blur();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await sleep(150);
 const frame=await win.webContents.capturePage();fs.writeFileSync(path.join(out,'accueil-noir-confort-1920.png'),frame.toPNG());
 const report={sha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),geometry,onlyTemp:true};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><title>Accueil — référence standard</title><style>body{background:#031321;color:#eef4ff;font:16px system-ui;margin:24px}img{width:100%;height:auto}a{color:#ffd326}</style><h1>Accueil réel — Noir, Confort, 1920 × 1080, 100 %</h1><p>Candidat '+report.sha+' — données synthétiques. Aucun remplacement de l’application.</p><img src="accueil-noir-confort-1920.png"></html>');
 console.log('STANDARD_REVIEW '+JSON.stringify(report));
};

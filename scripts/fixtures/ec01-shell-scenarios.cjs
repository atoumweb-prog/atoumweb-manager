'use strict';
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');
 const folder=process.env.ATOUMWEB_EC01_OUTPUT||path.resolve('outputs/ec01-shell');fs.mkdirSync(folder,{recursive:true});
 const rows=[];
 await js('window.__ec01Timer=document.querySelector(".global-timer");window.__ec01Logo=document.querySelector(".aw-brand-logotype")');
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
 await js('document.documentElement.dataset.theme='+JSON.stringify(theme)+';document.documentElement.dataset.density='+JSON.stringify(density));
 for(const page of ['Accueil','Clients','Offres & Tarifs','Projets','Réglages']){
  await navigate(page);
  for(const zoom of [1,1.25,1.5])for(const reduced of [false,true]){
   win.setSize(1280,720);win.webContents.setZoomFactor(zoom);
   await js(`if(document.querySelector('.app-shell').classList.contains('sidebar-collapsed')!==${reduced})document.querySelector('.aw-rail-toggle').click()`);await sleep(100);
   const geometry=await get(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};const controls=['.aw-brand-logotype','#header-search-trigger','.global-timer','#header-mode','#header-options-trigger'];return {viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,header:rect(document.querySelector('.aw-workspace-header')),controls:controls.map(selector=>({selector,...rect(document.querySelector(selector))})),sameTimer:window.__ec01Timer===document.querySelector('.global-timer'),sameLogo:window.__ec01Logo===document.querySelector('.aw-brand-logotype'),timers:document.querySelectorAll('.global-timer').length}})()`);
   rows.push({theme,density,page,zoom,reduced,...geometry});
   test(geometry.overflow===0,'Shell no horizontal overflow '+page+' '+zoom+' '+reduced);
   test(geometry.controls.every(r=>r.width>0&&r.right<=geometry.viewport+1&&r.left>=geometry.header.left),'Header controls within available width '+page+' '+zoom+' '+reduced);
   test(geometry.sameTimer&&geometry.sameLogo&&geometry.timers===1,'Logo and unique real timer stay mounted '+page+' '+zoom+' '+reduced);
   if(zoom===1.5&&page==='Réglages'&&density==='comfort')await win.webContents.capturePage().then(image=>fs.writeFileSync(path.join(folder,'shell-'+theme+(reduced?'-reduced':'-expanded')+'.png'),image.toPNG()));
  }
 }
 }
 await js('document.querySelector("#header-options-trigger").focus();document.querySelector("#header-options-trigger").click()');
 await wait('!!document.querySelector("#header-options-panel.is-open")&&document.querySelector("#header-options-panel").contains(document.activeElement)','Options opened and focus moved to its controls');
 win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(100);
 test(await get('!!document.querySelector("#header-options-panel.is-open")&&!document.querySelector(".field-help-short,.field-help-detail")'),'First Escape closes only the focused contextual help');
 win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(100);
 test(await get('!document.querySelector("#header-options-panel.is-open")&&document.activeElement?.id==="header-options-trigger"'),'Escape closes options and returns focus');
 test(db.database.get('PRAGMA integrity_check').integrity_check==='ok'&&db.database.all('PRAGMA foreign_key_check').length===0,'TEMP SQLite integrity and FK');
 fs.writeFileSync(path.join(folder,'geometry.json'),JSON.stringify({sha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),rows},null,2));
 console.log('EC01_GEOMETRY '+JSON.stringify({cases:rows.length,maxOverflow:Math.max(...rows.map(r=>r.overflow))}));
};

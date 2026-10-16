'use strict';
module.exports=async ctx=>{
 const {win,db,evalUI:js,get,wait,navigate,test,sleep}=ctx,fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{dialog}=require('electron');
 const repo=process.cwd(),sha=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),folder=process.env.ATOUMWEB_FINAL_HELP_CAPTURES||path.join(ctx.temp,'real-help-captures');
 const org=db.crm.createOrganization({name:'ATELIER SYNTHÉTIQUE',industry:'Artisanat'}),p=db.crm.createProspect({organizationId:org.id,stage:'qualifying'});
 const snapshot=()=>JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name+'" ORDER BY rowid')]));
 const before=snapshot(),original=dialog.showMessageBoxSync,confirmations=[];dialog.showMessageBoxSync=(...args)=>{confirmations.push(args.at(-1));return 0;};
 const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(60);};
 const text=async(selector,value)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(value)}));if(!e)throw Error('Missing '+${JSON.stringify(value)});e.click()`);await sleep(60);};
 const capture=async(scene,theme,density)=>require(path.join(repo,'scripts','fixtures','verified-crm-capture.cjs'))({win,js,test,folder,file:scene+'-'+theme+'-'+density+'.png',theme,density,scene});
 try{
  await navigate('Prospection');await wait(`!!document.querySelector('[data-record-id="${p.id}"]')`,'synthetic identity');await click(`[data-record-id="${p.id}"]`);await wait('!!document.querySelector(".prospect-detail-v2")','quick');await click('[aria-label="Agrandir la fiche"]');await text('.prospect-desk-tabs button','Référence prospect');await wait('!!document.querySelector(".prospect-desk-content .work-section-heading button")','identity');await text('.prospect-desk-content .work-section-heading button','Modifier');
  await wait('!!document.querySelector(".identity-editor-v2 .field-help")','editor help');
  await js('window.__helpDesk=document.querySelector(".prospect-detail-desk");window.__realHelp=[...document.querySelectorAll(".identity-editor-v2 .field-help")].find(e=>e.getAttribute("aria-label").includes("Permet d’identifier"));if(!window.__realHelp)throw Error("Activity help missing");window.__helpField=window.__realHelp.closest("label").querySelector("input");window.__helpFieldNode=window.__helpField');
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)};window.__helpField.scrollIntoView({block:'center'});window.__realHelp.closest('.field-help-anchor').dispatchEvent(new MouseEvent('mouseover',{bubbles:true}))`);
   await wait('!!document.querySelector(".field-help-short")','short help');test(await get('!window.__realHelp.hasAttribute("title")&&document.querySelectorAll(".field-help-short,.field-help-detail").length===1'),'One short layer, no native title '+theme+'/'+density);await capture('short',theme,density);
   await js('window.__realHelp.click()');await wait('!!document.querySelector(".field-help-detail[data-open-source=explicit]")','explicit detail');
   test(await get('(()=>{const h=document.querySelector(".field-help-detail").getBoundingClientRect(),f=window.__helpField.getBoundingClientRect();return document.querySelectorAll(".field-help-short,.field-help-detail").length===1&&(h.bottom<=f.top||h.top>=f.bottom||h.right<=f.left||h.left>=f.right)})()'),'One detail does not cover its own field '+theme+'/'+density);await capture('detail',theme,density);
   win.focus();win.webContents.focus();win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await wait('!document.querySelector(".field-help-short,.field-help-detail")','Escape only help');
   test(await get('document.activeElement===window.__realHelp&&document.querySelector(".prospect-detail-desk")===window.__helpDesk&&window.__helpFieldNode.isConnected&&window.__helpFieldNode.value==="Artisanat"'),'Real Escape restores focus, same record/field/text '+theme+'/'+density);
   await js(`window.__otherHelp=[...document.querySelectorAll('.identity-editor-v2 .field-help')].find(e=>e!==window.__realHelp);if(!window.__otherHelp)throw Error('Second real help missing');window.__realHelp.closest('.field-help-anchor').dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));window.__otherHelp.closest('.field-help-anchor').dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));`);
   await wait('!!document.querySelector(".field-help-short")','successive hover');
   test(await get(`document.querySelectorAll('.field-help-short,.field-help-detail').length===1&&document.querySelector('.field-help-short').id===window.__otherHelp.getAttribute('aria-controls')&&!window.__realHelp.hasAttribute('aria-controls')`),'Successive hover transfers ownership without duplicate '+theme+'/'+density);
   await js(`window.__otherHelp.focus()`);win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});win.webContents.sendInputEvent({type:'char',keyCode:'\r'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
   await wait('!!document.querySelector(".field-help-detail[data-open-source=explicit]")','keyboard detail');
   test(await get(`document.querySelectorAll('.field-help-short,.field-help-detail').length===1`),'Keyboard Enter opens only one detail '+theme+'/'+density);
   win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await wait('!document.querySelector(".field-help-short,.field-help-detail")','second Escape');
   test(await get(`document.activeElement===window.__otherHelp&&window.__helpFieldNode.isConnected&&window.__helpFieldNode.value==='Artisanat'`),'Second help Escape focus/draft '+theme+'/'+density);
  }
  test(confirmations.length===0,'Help/Escape never triggers an extra UX01 confirmation');test(snapshot()===before,'Real help changes no business data');console.log('FINAL_REAL_HELP_RESULT '+JSON.stringify({onlyTemp:true,sha,configurations:9,captures:18,confirmations:0,businessMutation:false}));
 }finally{dialog.showMessageBoxSync=original;}
};

// Real App, preload, IPC and SQLite TEMP; fault gates never touch installed data.
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {dialog}=require('electron');const original=dialog.showMessageBoxSync,answers=[],dialogs=[];
 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 const click=async selector=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});e.click()`);await sleep(80);};
 const text=async(selector,label)=>{await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(label)}));if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(label)});e.click()`);await sleep(80);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.matches(':disabled'))throw Error('Unavailable input');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(60);};
 const source=db.atoumWebTechnicalLibrary.createReusableCode({category:'section',name:'TEST07A SOURCE',html:'<section><h1>Source</h1></section>',css:'h1 {color:red}',javascript:'// source'});
 const sourceBefore=JSON.stringify(db.atoumWebTechnicalLibrary.get(source.id));
 const p=db.projects.createInternal({name:'TEST07A PROJECT'}),other=db.projects.createInternal({name:'TEST07A OTHER'});
 let detail=db.projects.addProjectNode(p.id,{name:'TEST07A PAGE A',type:'module',displaySubtype:'page'});
 detail=db.projects.addProjectNode(p.id,{name:'TEST07A PAGE B',type:'module',displaySubtype:'page'});
 const pages=detail.nodes.filter(x=>x.displaySubtype==='page');
 for(const page of pages){const c=db.atoumWebCompositions.ensureForProjectPage(page.id);db.atoumWebCompositions.addItem(c.id,{libraryItemId:source.id});db.atoumWebCompositions.addItem(c.id,{libraryItemId:source.id});}
 const site=db.projectSites.create(p.id,{name:'TEST07A SITE'});
 const originalSave=db.atoumWebCompositions.updateItemLocalCode.bind(db.atoumWebCompositions);let releaseSave,saveCalls=0;
 const settings='.project-component-settings-panel';
 try{
  await navigate('Projets');await text('tr',p.name);await text('.project-production-nav button','Sites');
  await text('.project-sites-tree-panel button',pages[0].name);await wait('document.querySelector(".project-page-composition-item-wrap")','composition loaded');
  await text('.project-page-composition-item-wrap button','Réglages');await wait('document.querySelector(".project-component-note textarea")','editor loaded');
  const captures=[];
  for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
   await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)};window.__editor=document.querySelector('${settings}');`);
   await input('.project-component-note textarea',theme+' '+density+' DRAFT');
   if(process.env.ATOUMWEB_07A_CAPTURES) captures.push(await require('./verified-crm-capture.cjs')({win,js,test,folder:process.env.ATOUMWEB_07A_CAPTURES,file:theme+'-'+density+'.png',theme,density,scene:'composition-07a'}));
   const n=dialogs.length;await click('[aria-label="Réduire Réglages"]');
   test(await get('window.__editor.isConnected'),'Collapse retains mounted editor '+theme+'/'+density);
   await click('[aria-label="Afficher Réglages"]');
   test(await get(`document.querySelector('.project-component-note textarea').value===${JSON.stringify(theme+' '+density+' DRAFT')}`),'Collapse retains exact note '+theme+'/'+density);

   await click('[aria-label="Fermer les réglages"]');
   test(dialogs.length===n+1&&await get('window.__editor.isConnected'),'Close Stay exactly once '+theme+'/'+density);
  }
  await js('document.querySelector(".project-component-advanced").open=true');
  for(const [index,value] of [[1,'<section>HTML DRAFT</section>'],[2,'h1 {color:blue}'],[3,'// JS DRAFT']]){
   await input('.project-component-advanced label:nth-of-type('+index+') textarea',value);
  }
  const raw=await get('[...document.querySelectorAll(".project-component-advanced textarea")].map(e=>e.value)');
  const nraw=dialogs.length;await click('.project-production-back');
  test(dialogs.length===nraw+1&&await get('JSON.stringify([...document.querySelectorAll(".project-component-advanced textarea")].map(e=>e.value))==='+JSON.stringify(JSON.stringify(raw))),'Back Stay preserves HTML CSS JS and context');
  const mutate=dialogs.length;await text('.project-page-composition-item-wrap button','Retirer');
  test(dialogs.length===mutate+1&&db.atoumWebCompositions.getForProjectPage(pages[0].id).items.length===2,'Remove Stay has zero service mutation');
  // Every destructive selection must preserve the same DOM and text on Stay.
  for(const action of [()=>text('.project-page-composition-item-wrap:last-child button','Réglages'),()=>text('.project-sites-tree-panel button',pages[1].name),()=>text('.project-sites-tree-panel button',site.name),()=>text('.project-production-nav button','Résumé')]){
   const n=dialogs.length;await action();test(dialogs.length===n+1&&await get('window.__editor.isConnected&&document.querySelector(".project-component-note textarea").value.includes("DRAFT")'),'Stay preserves selection and draft');
  }
  db.atoumWebCompositions.updateItemLocalCode=(...args)=>{saveCalls++;return new Promise((resolve,reject)=>{releaseSave=()=>resolve(originalSave(...args));});};
  await text(settings+' button','Valider les changements');await wait('document.querySelector(".project-component-note textarea").matches(":disabled")','save pending');
  answers.push(1);const pending=dialogs.length;await text('.project-sites-tree-panel button',pages[1].name);
  test(dialogs.length===pending+1&&await get('window.__editor.isConnected'),'Pending blocks confirmed page exit');
  test(saveCalls===1,'One save command only');releaseSave();await wait('!document.querySelector(".project-component-note textarea").matches(":disabled")','save completed');
  db.atoumWebCompositions.updateItemLocalCode=originalSave;
  await input('.project-component-note textarea','FAILED SAVE DRAFT');
  db.atoumWebCompositions.updateItemLocalCode=()=>{throw Error('TEST07A_SAVE_FAILURE');};
  await text(settings+' button','Valider les changements');await sleep(80);
  const failedSave=dialogs.length;await click('[aria-label="Fermer les réglages"]');
  test(dialogs.length===failedSave+1&&await get('document.querySelector(".project-component-note textarea").value==="FAILED SAVE DRAFT"'),'Save failure retains dirty draft and exit protection');
  db.atoumWebCompositions.updateItemLocalCode=originalSave;await text(settings+' button','Valider les changements');await sleep(80);
  const clean=dialogs.length;await click('[aria-label="Fermer les réglages"]');test(dialogs.length===clean,'Confirmed save clears dirty baseline');
  await text('.project-page-composition-item-wrap button','Réglages');await wait('document.querySelector(".project-component-note textarea")','reopen');
  await input('.project-component-note textarea','RESET DRAFT');const reset=dialogs.length;await text(settings+' button','Version Bibliothèque');test(dialogs.length===reset+1&&await get('document.querySelector(".project-component-note textarea").value==="RESET DRAFT"'),'Reset Stay preserves all text');
  answers.push(1);await text(settings+' button','Version Bibliothèque');await wait('document.querySelector(".project-component-note textarea").value===""','reset complete');
  test(JSON.stringify(db.atoumWebTechnicalLibrary.get(source.id))===sourceBefore,'Local save/reset never mutates source version');
  const beforeMove=db.atoumWebCompositions.getForProjectPage(pages[0].id).items.map(x=>x.id);
  await js('window.__movedEditor=document.querySelector(".project-component-settings-panel")');
  await click('.project-page-composition-item-wrap:first-child button[title="Descendre"]');
  test(db.atoumWebCompositions.getForProjectPage(pages[0].id).items.map(x=>x.id).join(',')===beforeMove.reverse().join(','),'Move changes only occurrence ordering once');
  test(await get('window.__movedEditor.isConnected'),'Move retains current settings instance');
  await text('.project-page-composition-actions button','Bibliothèque');const addedBefore=db.atoumWebCompositions.getForProjectPage(pages[0].id).items.length;
  await text('.project-page-library-card.ready button','Ajouter');
  test(db.atoumWebCompositions.getForProjectPage(pages[0].id).items.length===addedBefore+1,'Add creates exactly one occurrence');
  test(await get('window.__movedEditor.isConnected'),'Adding retains current settings instance');

  await input('.project-component-note textarea','DISCARD ME');answers.push(1);const yes=dialogs.length;await text('.project-sites-tree-panel button',pages[1].name);await wait(`document.querySelector('.project-sites-detail-head h3')?.textContent===${JSON.stringify(pages[1].name)}`,'confirmed page');test(dialogs.length===yes+1,'Confirmed page transition exactly once');
  const originalLoad=db.atoumWebCompositions.getForProjectPage.bind(db.atoumWebCompositions);let releaseOld;
  db.atoumWebCompositions.getForProjectPage=id=>id===pages[0].id?new Promise(resolve=>{releaseOld=()=>resolve(originalLoad(id));}):originalLoad(id);
  await text('.project-sites-tree-panel button',pages[0].name);await sleep(80);
  await text('.project-sites-tree-panel button',pages[1].name);await wait('document.querySelectorAll(".project-page-composition-item-wrap").length===2','new page after delayed load');
  test(typeof releaseOld==='function','Previous page load actually delayed');releaseOld();await sleep(100);
  test(await get(`document.querySelector('.project-sites-detail-head h3')?.textContent===${JSON.stringify(pages[1].name)}`),'Late old page response cannot replace current page');db.atoumWebCompositions.getForProjectPage=originalLoad;
  await text('.project-page-composition-actions button','Créer un composant');
  await input('.create-modal input','UNSAVED CREATION');const create=dialogs.length;await text('.create-modal button','Fermer');test(dialogs.length===create+1&&await get('document.querySelector(".create-modal input").value==="UNSAVED CREATION"'),'Creation close Stay retains form');
  const keyboard=dialogs.length;await js('document.querySelector(".create-modal input").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await sleep(100);
  test(dialogs.length===keyboard+1&&await get('document.querySelector(".create-modal input").value==="UNSAVED CREATION"'),'Escape stays in active modal and preserves parent context once');
  const backdrop=dialogs.length;await click('.create-modal .project-page-composition-modal-backdrop');test(dialogs.length===backdrop+1&&await get('!!document.querySelector(".create-modal")'),'Backdrop Stay preserves creation once');
  const changeMode=dialogs.length;await text('.create-modal button','Déclinaison');test(dialogs.length===changeMode+1&&await get('document.querySelector(".create-modal input").value==="UNSAVED CREATION"'),'Mode switch Stay preserves form once');
  answers.push(1);await text('.create-modal button','Fermer');test(await get('!document.querySelector(".create-modal")'),'Creation close confirmed');
  await text('.project-page-composition-item-wrap button','Réglages');await wait('document.querySelector(".project-component-note textarea")','last editor');
  await input('.project-component-note textarea','COMPONENT TARGET DRAFT');
  const componentConfirm=dialogs.length;answers.push(1);await text('.project-page-composition-item-wrap:last-child button','Réglages');
  await wait('document.querySelector(".project-component-note textarea")?.value===""','new component baseline');
  test(dialogs.length===componentConfirm+1,'Confirmed component change discards only previous editor once');
  const beforeRemove=db.atoumWebCompositions.getForProjectPage(pages[1].id).items.length;
  await input('.project-component-note textarea','REMOVE DRAFT');answers.push(1);await text('.project-page-composition-item-wrap:last-child button','Retirer');
  await wait('!document.querySelector(".project-component-note textarea")','removed selected editor');
  test(db.atoumWebCompositions.getForProjectPage(pages[1].id).items.length===beforeRemove-1,'Confirmed remove mutates exactly one composition occurrence');
  const getSource=db.atoumWebTechnicalLibrary.get.bind(db.atoumWebTechnicalLibrary);
  db.atoumWebTechnicalLibrary.get=id=>({...getSource(id),versions:[]});
  await text('.project-page-composition-item-wrap button','Réglages');await wait('document.querySelector(".project-component-note textarea")?.matches(":disabled")','missing source readonly');
  test(await get('document.querySelector(".project-component-validate-button").disabled'),'Unavailable source cannot overwrite local code');
  db.atoumWebTechnicalLibrary.get=getSource;await click('[aria-label="Fermer les réglages"]');
  await text('.project-page-composition-item-wrap button','Réglages');await wait('document.querySelector(".project-component-note textarea")&&!document.querySelector(".project-component-note textarea").matches(":disabled")','remaining editor');
  await input('.project-component-note textarea','PROJECT TARGET DRAFT');
  const projectPrompt=dialogs.length;await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'project',entityId:${JSON.stringify(other.id)},title:'Other'}}))`);await sleep(120);
  test(dialogs.length===projectPrompt+1&&await get('document.querySelector(".project-component-note textarea").value==="PROJECT TARGET DRAFT"'),'Other Project Stay preserves draft exactly once');
  answers.push(1);await click('.project-production-back');await wait('!document.querySelector(".project-component-note textarea")','back to projects');
  test(await get('!!document.querySelector(".projects-layout table")'),'Confirmed back returns to project list');
  console.log('COMPOSITION07A_EVIDENCE '+JSON.stringify({captures,dialogs:dialogs.length,projectId:p.id,pageIds:pages.map(x=>x.id),onlyTemp:true}));
  const integrity=db.database.get('PRAGMA integrity_check');test(integrity.integrity_check==='ok','SQLite integrity');test(db.database.all('PRAGMA foreign_key_check').length===0,'SQLite FK');test(db.database.all('SELECT id FROM schema_migrations ORDER BY id').map(x=>x.id).join(',')===Array.from({length:71},(_,i)=>i+1).join(','),'Migrations exactly 1-71');
 }finally{dialog.showMessageBoxSync=original;db.atoumWebCompositions.updateItemLocalCode=originalSave;}
};

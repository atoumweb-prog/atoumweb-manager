// Real Electron App, preload/IPC and isolated TEMP SQLite. No installed profile.
module.exports=async({win,db,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {dialog}=require('electron');const original=dialog.showMessageBoxSync,answers=[],dialogs=[];
 dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return answers.shift()??0;};
 const click=async(selector)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing control: '+${JSON.stringify(selector)});e.click()`);await sleep(120);};
 const input=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');const p=HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))`);await sleep(80);};
 try {
  const org=db.crm.createOrganization({name:'07AB ORGANISATION'}),client=db.crm.createClient({organizationId:org.id});
  const quote=db.quotes.create({clientAccountId:client.id,subject:'07AB DEVIS'});
  const project=db.projects.createInternal({name:'07AB PROJET'});
  // Isolated TEMP legacy fixture with an associated source quote.
  db.database.run('UPDATE projects SET source_quote_id=? WHERE id=?',[quote.id,project.id]);
  await navigate('Projets');await wait('document.querySelector(".projects-layout")','project list');
  await input('.projects-toolbar input.inline-search','07AB');
  await js(`const e=document.querySelector('select[aria-label="État commercial"]');e.value='legacy';e.dispatchEvent(new Event('change',{bubbles:true}))`);
  await wait('document.querySelector(".projects-toolbar input.inline-search")?.value==="07AB"','filter before navigation');
  await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'project',entityId:${JSON.stringify(project.id)},title:'Projet 07AB'}}))`);
  await wait(`document.querySelector('[data-search-entity-type="project"][data-search-entity-id="${project.id}"]')`,'project identity');
  test(await get(`!!document.querySelector('[data-search-entity-id="${project.id}"]')`),'Project ID stable before navigation');
  await js(`const b=[...document.querySelectorAll('.project-production-nav button')].find(x=>x.textContent.trim()==='Commercial');if(!b)throw Error('Missing commercial tab');b.click()`);
  await wait(`[...document.querySelectorAll('.project-production-nav button.active')].some(b=>b.textContent.trim()==='Commercial')`,'commercial Project tab before Quote');
  await wait('[...document.querySelectorAll(".project-production-title button")].some(b=>b.textContent.includes("Ouvrir le devis"))','real source Quote button');
  await js('const b=[...document.querySelectorAll(".project-production-title button")].find(b=>b.textContent.includes("Ouvrir le devis"));if(!b)throw Error("Missing source Quote button");b.click()');
  await wait(`document.querySelector('[data-search-entity-type="quote"][data-search-entity-id="${quote.id}"]')`,'source quote identity');
  test(await get(`!!document.querySelector('.quote-detail-heading-actions button')&&!![...document.querySelectorAll('.quote-detail-heading-actions button')].find(b=>b.textContent.includes('Retour au Projet'))`),'Quote exposes return to exact source Project');
  await input('.quote-add-line input[placeholder="Libellé"]','07AB UNSAVED DRAFT');
  const prior=dialogs.length;await click('.quote-detail-heading-actions button.secondary-button');
  test(dialogs.length===prior+1,'Dirty quote prompts exactly once on return');
  test(await get('document.querySelector(".quote-add-line input[placeholder=\\"Libellé\\"]")?.value==="07AB UNSAVED DRAFT"'),'Stay retains unsaved text');
  test(await get(`!!document.querySelector('[data-search-entity-type="quote"][data-search-entity-id="${quote.id}"]')`),'Stay retains current quote identity');
  answers.push(1);const before=dialogs.length;await click('.quote-detail-heading-actions button.secondary-button');
  await wait(`document.querySelector('[data-search-entity-type="project"][data-search-entity-id="${project.id}"]')`,'return to source project');
  test(dialogs.length===before+1,'Confirm triggers one guarded exit prompt');
  test(await get(`!!document.querySelector('[data-search-entity-type="project"][data-search-entity-id="${project.id}"]')`),'Confirm returns to original project ID');
  test(await get(`document.activeElement?.dataset?.searchEntityId===${JSON.stringify(project.id)}`),'Return restores targeted focus to Project');
  const returnedState=await get(`({tabs:[...document.querySelectorAll('.project-production-nav button')].map(b=>({label:b.textContent.trim(),active:b.classList.contains('active')})),visibleProject:!!document.querySelector('[data-search-entity-type="project"]'),heading:document.querySelector('.project-production-title')?.innerText?.slice(0,160)})`);
  console.log('NAVIGATION07B_RETURN_CONTEXT '+JSON.stringify(returnedState));
  test(await get(`[...document.querySelectorAll('.project-production-nav button.active')].some(b=>b.textContent.trim()==='Commercial')`),'Return restores commercial Project tab');
  await click('.project-production-back');
  await wait('!!document.querySelector(".projects-toolbar input.inline-search")','project list after return');
  test(await get('document.querySelector(".projects-toolbar input.inline-search")?.value==="07AB"'),'Return restores Project search text');
  test(await get('document.querySelector("select[aria-label=\\"État commercial\\"]")?.value==="legacy"'),'Return restores Project commercial filter');
  test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','TEMP SQLite integrity');
  test(db.database.all('PRAGMA foreign_key_check').length===0,'TEMP SQLite foreign keys');
  console.log('NAVIGATION07AB_NATIVE_EVIDENCE '+JSON.stringify({checks:'passed',projectId:project.id,quoteId:quote.id,dialogs:dialogs.length,onlyTemp:true}));
 }finally{dialog.showMessageBoxSync=original;}
};

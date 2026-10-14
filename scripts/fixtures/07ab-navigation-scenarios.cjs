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
  db.projectSites.create(project.id,{name:'07AB SITE A'});
  const siteB=db.projectSites.create(project.id,{name:'07AB SITE B'});
  const withPage=db.projects.addProjectNode(project.id,{name:'07AB TIMER PAGE',type:'module',displaySubtype:'page'});
  const timerPage=withPage.nodes.find(node=>node.name==='07AB TIMER PAGE');
  if(!timerPage)throw Error('Synthetic Page not created');
  db.projectSites.linkPage(siteB.id,timerPage.id,{role:'standard',desiredPath:'/timer-test'});
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
  try { await wait(`document.querySelector('[data-search-entity-type="project"][data-search-entity-id="${project.id}"]')`,'return to source project'); }
  catch(error){
    const state=await get(`({url:location.href,text:document.body?.innerText?.slice(0,1200),fatal:document.querySelector('.renderer-fatal-shell')?.innerText,returnButton:!!document.querySelector('.quote-detail-heading-actions button'),project:!!document.querySelector('[data-search-entity-type="project"]')})`);
    console.log('NAVIGATION07B_TIMEOUT_CONTEXT '+JSON.stringify({state,dialogs:dialogs.map(d=>({message:d.message,buttons:d.buttons})),answerQueue:answers}));
    throw error;
  }
  test(dialogs.length===before+1,'Confirm triggers one guarded exit prompt');
  test(await get(`!!document.querySelector('[data-search-entity-type="project"][data-search-entity-id="${project.id}"]')`),'Confirm returns to original project ID');
  test(await get(`document.activeElement?.dataset?.searchEntityId===${JSON.stringify(project.id)}`),'Return restores targeted focus to Project');
  const returnedState=await get(`({tabs:[...document.querySelectorAll('.project-production-nav button')].map(b=>({label:b.textContent.trim(),active:b.classList.contains('active')})),visibleProject:!!document.querySelector('[data-search-entity-type="project"]'),heading:document.querySelector('.project-production-title')?.innerText?.slice(0,160)})`);
  console.log('NAVIGATION07B_RETURN_CONTEXT '+JSON.stringify(returnedState));
  test(await get(`[...document.querySelectorAll('.project-production-nav button.active')].some(b=>b.textContent.trim()==='Commercial')`),'Return restores commercial Project tab');
  // The Site/Page workbench must also resume the same Site after a second real round-trip.
  await js(`const b=[...document.querySelectorAll('.project-production-nav button')].find(x=>x.textContent.trim()==='Sites & pages');if(!b)throw Error('Missing Sites tab');b.click()`);
  await wait('[...document.querySelectorAll(".project-site-tree-site")].some(b=>b.textContent.includes("07AB SITE B"))','sites tree loaded');
  await js(`const b=[...document.querySelectorAll('.project-site-tree-site')].find(x=>x.textContent.includes('07AB SITE B'));if(!b)throw Error('Missing Site B');b.click()`);
  await wait('[...document.querySelectorAll(".project-site-tree-site.active")].some(b=>b.textContent.includes("07AB SITE B"))','second site selected');
  // R07G-17, actual Electron buttons + SQLite TimeService. Not a simulated IPC.
  await js(`const b=[...document.querySelectorAll('.project-site-tree-pages button')].find(b=>b.textContent.includes('07AB TIMER PAGE'));if(!b)throw Error('Timer Page not linked to Site B');b.click()`);
  await wait('[...document.querySelectorAll(".project-sites-detail-head h3")].some(h=>h.textContent.includes("07AB TIMER PAGE"))','Page detail selected');
  await click('[title="Démarrer le travail sur cette Page"]');
  await wait('!!document.querySelector(".project-sites-page-work.running")','Page timer started');
  test(db.time.active()?.projectNodeId===timerPage.id,'R07G-17 timer attached to exact Page');
  test(db.time.list({projectId:project.id}).length===1,'R07G-17 one global timer session');
  await js(`const b=[...document.querySelectorAll('.project-sites-page-actions button')].find(b=>b.textContent.includes('Pause'));if(!b||b.disabled)throw Error('Page Pause missing');b.click()`);
  await wait('[...document.querySelectorAll(".project-sites-page-actions button")].some(b=>b.textContent.includes("Reprendre"))','timer paused');
  test(db.time.active()?.paused===true,'R07G-17 Page timer paused');
  await js(`const b=[...document.querySelectorAll('.project-sites-page-actions button')].find(b=>b.textContent.includes('Reprendre'));if(!b||b.disabled)throw Error('Page resume missing');b.click()`);
  await wait('[...document.querySelectorAll(".project-sites-page-actions button")].some(b=>b.textContent.includes("Pause"))','timer resumed');
  test(db.time.active()?.paused===false,'R07G-17 Page timer resumed');
  await js(`const b=[...document.querySelectorAll('.project-sites-page-actions button')].find(b=>b.textContent.includes('Arrêter'));if(!b||b.disabled)throw Error('Page stop missing');b.click()`);
  await wait('[...document.querySelectorAll(".project-sites-page-actions button")].some(b=>b.textContent.includes("Démarrer"))','timer stopped');
  test(db.time.active()===null,'R07G-17 global timer released');
  test(db.time.list({projectId:project.id}).filter(session=>session.projectNodeId===timerPage.id&&session.endedAt).length===1,'R07G-17 Page time recorded once');
  await js(`const b=[...document.querySelectorAll('.project-site-tree-site')].find(x=>x.textContent.includes('07AB SITE B'));if(!b)throw Error('Site B no longer accessible');b.click()`);
  await wait('[...document.querySelectorAll(".project-site-tree-site.active")].some(b=>b.textContent.includes("07AB SITE B"))','Site B restored after timer');
  await js('const b=[...document.querySelectorAll(".project-production-title button")].find(b=>b.textContent.includes("Ouvrir le devis"));if(!b)throw Error("Missing Quote button");b.click()');
  await wait(`document.querySelector('[data-search-entity-type="quote"][data-search-entity-id="${quote.id}"]')`,'Quote from Sites tab');
  await click('.quote-detail-heading-actions button.secondary-button');
  await wait(`document.querySelector('[data-search-entity-type="project"][data-search-entity-id="${project.id}"]')`,'return to Sites project');
  test(await get(`[...document.querySelectorAll('.project-production-nav button.active')].some(b=>b.textContent.trim()==='Sites & pages')`),'Return restores Sites & pages tab');
  await wait('[...document.querySelectorAll(".project-site-tree-site.active")].some(b=>b.textContent.includes("07AB SITE B"))','return to selected Site B');
  test(await get('[...document.querySelectorAll(".project-site-tree-site.active")].some(b=>b.textContent.includes("07AB SITE B"))'),'Return preserves exact selected Site');
  await click('.project-production-back');
  await wait('!!document.querySelector(".projects-toolbar input.inline-search")','project list after return');
  test(await get('document.querySelector(".projects-toolbar input.inline-search")?.value==="07AB"'),'Return restores Project search text');
  test(await get('document.querySelector("select[aria-label=\\"État commercial\\"]")?.value==="legacy"'),'Return restores Project commercial filter');
  test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','TEMP SQLite integrity');
  test(db.database.all('PRAGMA foreign_key_check').length===0,'TEMP SQLite foreign keys');
  console.log('NAVIGATION07AB_NATIVE_EVIDENCE '+JSON.stringify({checks:'passed',projectId:project.id,quoteId:quote.id,dialogs:dialogs.length,onlyTemp:true}));
 }finally{dialog.showMessageBoxSync=original;}
};

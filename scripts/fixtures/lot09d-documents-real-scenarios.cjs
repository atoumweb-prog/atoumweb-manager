'use strict';
// True Windows Electron/React/preload+IPC/SQLite with only TEMP workspace documents.
module.exports=async({win,db,temp,evalUI:js,get,wait,navigate,select,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');
 const {dialog}=require('electron');
 const crm=db.crm,documents=db.clientDocuments;
 const orgA=crm.createOrganization({name:'Client Alpha 09D'});
 const orgB=crm.createOrganization({name:'Client Bravo 09D'});
 const clientA=crm.createClient({organizationId:orgA.id});
 const clientB=crm.createClient({organizationId:orgB.id});
 const source=path.join(temp,'preuve-09d.pdf');
 fs.writeFileSync(source,'%PDF-1.4\n% document fixture 09D');
 const docA=documents.importPaths(clientA.id,[source],
   {category:'other',title:'Preuve client Alpha',retentionUntil:'2020-01-01'})[0];
 const docB=documents.importPaths(clientB.id,[source],
   {category:'other',title:'Preuve client Bravo'})[0];
 test(docA.id!==docB.id&&docA.relativePath!==docB.relativePath,
   '09D-01: identical filenames are isolated by real Client ID');
 test(!!docA.sha256&&docA.sha256===docB.sha256,
   '09D-02: both real files have SHA-256 after import');
 let allowExit=false;const confirms=[];const confirmOriginal=dialog.showMessageBoxSync;
 dialog.showMessageBoxSync=(...args)=>{confirms.push(args.at(-1));return allowExit?1:0;};
 try{
  await navigate('Documents & Contrats');
  await wait('document.querySelectorAll(".documents-table tbody tr").length>=2',
    'actual Documents list');
  test(await get('document.querySelectorAll(".documents-entry-grid .documents-entry").length===4'),
    '09D-UI-01: four honest navigation entry points');
  test(await get('document.querySelector(".documents-entry-unavailable")?.textContent.includes("non encore disponible")'),
    '09D-UI-02: general documents storage is not falsely advertised');
  await js('document.querySelector(".documents-entry-grid button").click()');
  await wait('!!document.querySelector(".contract-toolbar button")','true contract library route');
  test(await get('document.body.textContent.includes("Bibliothèque contractuelle")'),
    '09D-UI-03: canonical contract library reached');
  await js('const b=[...document.querySelectorAll(".contract-toolbar button")].find(e=>e.textContent.includes("Retour aux documents"));if(!b)throw Error("library back missing");b.click()');
  await wait('!!document.querySelector(".documents-table tbody tr")','documents route restored');
  await js('const row=[...document.querySelectorAll(".documents-table tbody tr")].find(e=>e.textContent.includes("Preuve client Alpha"));if(!row)throw Error("Document Alpha missing");row.click()');
  await wait('document.querySelector(".documents-detail-header h2")?.textContent==="Preuve client Alpha"',
    'Alpha document detail');
  test(await get('document.querySelector(".documents-info-sections")?.textContent.includes("Empreinte enregistrée")'),
    '09D-UI-04: SHA-256 provenance visibly recorded');
  test(await get('document.querySelector(".documents-status-row")?.textContent.includes("Conservation à vérifier")'),
    '09D-UI-05: overdue retention requires review, not deletion');
  await js('const b=[...document.querySelectorAll(".documents-primary-actions button")].find(e=>e.textContent.trim()==="Modifier");if(!b)throw Error("metadata edit missing");b.click()');
  await wait('!!document.querySelector(".documents-edit-form input")','document edit form');
  await js('const input=document.querySelector(".documents-edit-form input");input.focus();input.select()');
  await win.webContents.insertText('Brouillon 09D non enregistré');
  await wait('document.querySelector(".documents-edit-form input")?.value==="Brouillon 09D non enregistré"',
    'dirty document metadata field');
  await js('const item=[...document.querySelectorAll(".documents-compact-item")].find(e=>e.textContent.includes("Preuve client Bravo"));if(!item)throw Error("Bravo not found");item.click()');
  await sleep(90);
  test(confirms.length>0&&confirms.at(-1).title==='Modifications non enregistrées',
    '09D-UI-06: UX-01 prompts before switching document');
  test(await get('document.querySelector(".documents-detail-header h2")?.textContent==="Preuve client Alpha"'),
    '09D-UI-07: Stay keeps current document');
  test(await get('document.querySelector(".documents-edit-form input")?.value==="Brouillon 09D non enregistré"'),
    '09D-UI-08: Stay preserves draft metadata');
  allowExit=true;
  await js('const item=[...document.querySelectorAll(".documents-compact-item")].find(e=>e.textContent.includes("Preuve client Bravo"));item.click()');
  await wait('document.querySelector(".documents-detail-header h2")?.textContent==="Preuve client Bravo"',
    'confirmed Bravo selection');
  test(documents.get(docA.id).title==='Preuve client Alpha',
    '09D-UI-09: discarded metadata never silently persists');
  allowExit=false;
  await js('const b=[...document.querySelectorAll(".documents-primary-actions button")].find(e=>e.textContent.trim()==="Modifier");b.click()');
  await wait('!!document.querySelector(".documents-edit-form input")','Bravo editor');
  await js('const el=document.querySelector(".documents-edit-form input");el.focus();el.select()');
  await win.webContents.insertText('Brouillon 09D navigation');
  await wait('document.querySelector(".documents-edit-form input")?.value==="Brouillon 09D navigation"',
    'Bravo dirty draft');
  await js('document.querySelector("[data-nav-module][aria-label=Accueil]").click()');
  await sleep(75);
  test(await get('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Documents & Contrats"'),
    '09D-UI-10: Stay blocks module navigation');
  allowExit=true;
  await js('document.querySelector("[data-nav-module][aria-label=Accueil]").click()');
  await wait('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Accueil"',
    'confirmed module exit');
  test(documents.get(docB.id).title==='Preuve client Bravo',
    '09D-UI-11: module discard preserves stored title');
  const originalBytes=fs.readFileSync(documents.absolutePath(docA.id));
  const originalSha=documents.get(docA.id).sha256;
  documents.update(docA.id,{category:'other',title:'Preuve Alpha validée',retentionUntil:'2020-01-01'});
  test(documents.get(docA.id).sha256===originalSha
    &&fs.readFileSync(documents.absolutePath(docA.id)).equals(originalBytes),
    '09D-12: metadata updates never overwrite the original bytes or fingerprint');
  documents.archive(docA.id,true);
  test(!!documents.get(docA.id).archivedAt,'09D-13: archive is reversible');
  documents.archive(docA.id,false);
  test(!documents.get(docA.id).archivedAt
    &&fs.readFileSync(documents.absolutePath(docA.id)).equals(originalBytes),
    '09D-14: restoring preserves evidence bytes and document identity');
  db.database.run('UPDATE client_documents SET sha256=NULL WHERE id=?',[docA.id]);
  test(documents.get(docA.id).sha256==null && !!documents.verifiedPath(docA.id),
    '09D-15: old unhashed document is openable without falsely backfilling SHA');
  test(documents.get(docA.id).sha256==null,'09D-16: no fabricated legacy checksum');
  fs.writeFileSync(documents.absolutePath(docB.id),'%PDF-1.4\n% tampered 09D');
  let integrityRefused=false;
  try{documents.verifiedPath(docB.id);}catch(error){integrityRefused=/SHA-256 différente/.test(error.message);}
  test(integrityRefused,'09D-17: tampered document cannot be opened');
  const missing=documents.importPaths(clientA.id,[source],
    {category:'brief',title:'Justificatif manquant 09D'})
    .find(item=>item.title==='Justificatif manquant 09D');
  test(!!missing,'09D-17a: distinct missing-file fixture saved');
  fs.unlinkSync(documents.absolutePath(missing.id));
  test(documents.get(missing.id).missing===true,'09D-17b: physical absence reported without erasing metadata');
  let missingRefused=false;
  try{documents.verifiedPath(missing.id);}catch(error){missingRefused=/manquant/.test(error.message);}
  test(missingRefused,'09D-17c: a vanished document cannot be opened');

  const generic=documents.importPaths(clientA.id,[source],
    {category:'technical',title:'Suppression générique autorisée'})
    .find(item=>item.title==='Suppression générique autorisée');
  test(!!generic,'09D-18a: generic document created with distinct ID');
  documents.archive(generic.id,true);
  documents.deletePermanently(generic.id);
  test(!db.database.get('SELECT id FROM client_documents WHERE id=?',[generic.id]),
    '09D-18: archived unlinked generic document can be removed after confirmation at IPC');
  for(const [theme,title] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']]){
    for(const [density,label,font,height] of [['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48]]){
      await select(theme,title,density,label,font,height);
      await navigate('Documents & Contrats');
      await wait('!!document.querySelector(".documents-entry-grid")','Documents '+theme+'/'+density);
      const state=await get('({theme:document.documentElement.dataset.theme,density:document.documentElement.dataset.density,'+
       'entries:document.querySelectorAll(".documents-entry-grid .documents-entry").length,'+
       'scroll:document.querySelector(".content-area")?.scrollWidth,width:document.querySelector(".content-area")?.clientWidth})');
      test(state.theme===theme&&state.density===density&&state.entries===4,
        '09D-3x3: correct Documents navigation in '+theme+'/'+density);
      test(state.scroll<=state.width+20,
        '09D-3x3: no broad content overflow in '+theme+'/'+density);
    }
  }
  console.log('[UXV2 09D] Real Documents navigation, canonical library, drafts, archive, SHA-256 and 3x3 UI tested in TEMP.');
 }finally{dialog.showMessageBoxSync=confirmOriginal;}
};

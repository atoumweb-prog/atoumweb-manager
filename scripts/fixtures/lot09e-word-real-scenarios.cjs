'use strict';
// Whole Word roundtrip through real Windows Electron + preload + IPC + SQLite
// with a native file picker and a disposable TEMP-only DOCX.
module.exports=async({win,db,temp,evalUI:js,get,wait,navigate,select,test,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');
 const {dialog}=require('electron');
 const repack=require('./lot09e-repack-word.cjs');
 const exportPath=path.join(temp,'09e-brouillon-word.docx');
 const pdfPath=path.join(temp,'09e-travail-non-signe.pdf');
 const editedPath=path.join(temp,'09e-corrige-word.docx');
 const initial='Un texte Word original 09E';
 const corrected='Un texte Word corrigé 09E';
 const clause=db.contractTerms.createTemplate(
  {code:'09E-NATIVE',title:'Clause Word native',scope:'base'},
  {body:'Titre des CGV\n'+initial+'\nTroisième paragraphe'},
 );
 const original=clause.versions[0];
 const realSave=dialog.showSaveDialog,realOpen=dialog.showOpenDialog;
 dialog.showSaveDialog=async options=>({canceled:false,filePath:options?.filters?.[0]?.extensions?.includes('pdf')?pdfPath:exportPath});
 let selectionPath=exportPath,cancelNext=false;
 dialog.showOpenDialog=async()=>cancelNext?(cancelNext=false,{canceled:true,filePaths:[]}):
  ({canceled:false,filePaths:[selectionPath]});
 const button=label=>js('const button=[...document.querySelectorAll(".aw-word-draft-panel button")].find(e=>e.textContent.includes('+JSON.stringify(label)+'));if(!button)throw Error("Word action missing");button.click()');
 try {
  await navigate('Documents & Contrats');
  await wait('!!document.querySelector(".documents-toolbar")','Documents page');
  await js('const entry=[...document.querySelectorAll(".documents-page-stack button")].find(e=>e.textContent.includes("Bibliothèque contractuelle"));if(!entry)throw Error("Canonical library entry missing");entry.click()');
  await wait('!!document.querySelector("select[aria-label=\\"Consulter un module\\"]")','canonical contract library');
  await js('const el=document.querySelector("select[aria-label=\\"Consulter un module\\"]");el.value='+JSON.stringify(clause.id)+';el.dispatchEvent(new Event("change",{bubbles:true}));');
  await wait('!!document.querySelector(".aw-word-draft-panel")','clause Word panel');
  await wait('document.querySelector("textarea[aria-label=\\"Texte du module à versionner\\"]")?.value.includes('+JSON.stringify(initial)+')','original draft hydration');
  test(await get('document.querySelector(".aw-word-draft-panel")?.textContent.includes("nouvelle version brouillon")'),
   '09E-UI-01: source is visibly draft-only');
  await button('PDF de travail');
  for(let i=0;i<80&&!fs.existsSync(pdfPath);i++)await sleep(50);
  test(fs.existsSync(pdfPath)&&fs.readFileSync(pdfPath).subarray(0,5).toString()==='%PDF-',
   '09E-UI-PDF: genuine sandboxed non-official working PDF rendered in TEMP');
  await button('Exporter ce brouillon');
  for(let i=0;i<80&&!fs.existsSync(exportPath);i++)await sleep(50);
  test(fs.existsSync(exportPath),'09E-UI-02: native save dialog produced a real DOCX in TEMP');
  const docx=fs.readFileSync(exportPath);
  test(docx.subarray(0,2).toString()==='PK'&&docx.length>450,
   '09E-UI-03: DOCX is a real ZIP OpenXML package');
  cancelNext=true;
  await button('Réimporter un Word');
  await sleep(100);
  test(!await get('!!document.querySelector(".aw-word-review")'),
   '09E-UI-04: cancelled file selection never creates review or new version');
  test(db.contractTerms.getTemplate(clause.id).versions.length===1,
   '09E-UI-05: picker cancellation leaves SQLite unchanged');
  await button('Réimporter un Word');
  await wait('!!document.querySelector(".aw-word-review")','unchanged Word review');
  test(await get('document.querySelector(".aw-word-review")?.textContent.includes("Aucune modification textuelle")'),
   '09E-UI-06: unchanged Word produces empty diff');
  test(await get('document.querySelector(".aw-word-review button:first-of-type")?.disabled===true'),
   '09E-UI-07: no-op Word review cannot be approved');
  await button('Annuler sans enregistrer');
  await wait('!document.querySelector(".aw-word-review")','Word review cancelled');
  fs.writeFileSync(editedPath,repack(docx,initial,corrected));
  selectionPath=editedPath;
  await button('Réimporter un Word');
  await wait('document.querySelector(".aw-word-diff")?.textContent.includes('+JSON.stringify(corrected)+')',
   'changed Word diff');
  test(await get('document.querySelector(".aw-word-diff")?.textContent.includes('+JSON.stringify(initial)+')'),
   '09E-UI-08: old paragraph remains visible in diff');
  test(await get('document.querySelector(".aw-word-review button:first-of-type")?.disabled===true'),
   '09E-UI-09: explicit acceptance of Word formatting limits is required');
  test(db.contractTerms.getTemplate(clause.id).versions.length===1,
   '09E-UI-10: preview cannot silently modify clause');
  await js('document.querySelector(".aw-word-review input[type=checkbox]").click()');
  await wait('!document.querySelector(".aw-word-review button:first-of-type")?.disabled','Word reviewed');
  await button('Valider et créer une nouvelle version');
  for(let i=0;i<80&&db.contractTerms.getTemplate(clause.id).versions.length!==2;i++)await sleep(50);
  const versions=db.contractTerms.getTemplate(clause.id).versions;
  test(versions.length===2&&versions[0].body.includes(corrected)&&versions[0].status==='draft',
   '09E-UI-11: approved Word creates only a NEW draft with edited text');
  test(versions[1].body.includes(initial)&&versions[1].status==='draft',
   '09E-UI-12: source version is unchanged');
  test(db.contractTerms.getTemplate(clause.id).currentVersionId==null,
   '09E-UI-13: Word approval never publishes');
  test(!!db.database.get("SELECT id FROM activity_log WHERE entity_id=? AND action='contract_word_draft_approved'",[clause.id]),
   '09E-UI-14: explicit provenance activity is persisted');
  await wait('!document.querySelector(".aw-word-review")','Word review cleared after approval');
  // The old Word document must not be allowed to apply to a subsequent draft.
  await button('Réimporter un Word');
  await wait('!!document.querySelector(".contract-library .form-error")','stale Word refused');
  test(db.contractTerms.getTemplate(clause.id).versions.length===2,
   '09E-UI-15: stale Word rejection retains all revisions');
  for(const [theme,title] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']]){
   for(const [density,label,font,height] of [['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48]]){
    await select(theme,title,density,label,font,height);
    await navigate('Documents & Contrats');
    await wait('!!document.querySelector(".documents-toolbar")','Docs '+theme+'/'+density);
    test(await get('[...document.querySelectorAll(".documents-page-stack button")].some(e=>e.textContent.includes("Bibliothèque contractuelle"))'),
     '09E-3x3: canonical library entry remains accessible '+theme+'/'+density);
    const viewport=await get('({scroll:document.querySelector(".content-area")?.scrollWidth,width:document.querySelector(".content-area")?.clientWidth})');
    test(viewport.scroll<=viewport.width+20,'09E-3x3: no page overflow '+theme+'/'+density);
   }
  }
  console.log('[UXV2 09E] True DOCX export/edit/import/preview/approve/concurrency verified in TEMP.');
 }finally{dialog.showSaveDialog=realSave;dialog.showOpenDialog=realOpen;}
};
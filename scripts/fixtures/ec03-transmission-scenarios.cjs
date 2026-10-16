'use strict';
// Runs inside the real renderer/preload/IPC harness; all profiles and databases are TEMP.
module.exports=async({win,db,S,evalUI:js,get,wait,navigate,test,sleep})=>{
 const {clipboard}=require('electron'),beforeClipboard=clipboard.readText();
 const click=async label=>{await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled)`,label);await js(`const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled);b.click();`);await sleep(130);};
 const fill=async(selector,value)=>{await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Champ indisponible');for(let d=e.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(100);};
 const org=db.crm.createOrganization({name:'EC03 — organisation synthétique'}),client=db.crm.createClient({organizationId:org.id});
 const result=[];

 try{
 for(const theme of ['atoumweb','noir','blanc'])for(const density of ['compact','comfort','comfort_plus']){
  await navigate('Accueil');
  const q=db.quotes.create({clientAccountId:client.id,subject:`EC03 ${theme} ${density}`});
  db.quotes.addCustomLine(q.id,{label:'Service synthétique',proposedUnitPriceCents:12345});S.prepareQuoteForTest(db.database,q.id);
  db.contractTerms.addCustomQuoteClause(q.id,{title:'Condition négociée',body:'Texte négocié exact.'});
  const base=db.contractTerms.listTemplates().find(t=>t.scope==='base'&&t.currentVersionId),version=db.contractTerms.createVersion(base.id,{body:`CGV proposées explicitement — ${theme} ${density}`});db.contractTerms.publishVersion(version.id);
  const sqlState=()=>JSON.stringify({quote:db.database.get('SELECT * FROM quotes WHERE id=?',[q.id]),clauses:db.database.all('SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY id',[q.id]),history:db.database.all('SELECT * FROM activity_log WHERE entity_id=? ORDER BY rowid',[q.id])});
  const unopened=sqlState();await navigate('Devis');await js(`document.querySelector('[data-record-id="${q.id}"]').click();document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)};window.confirm=()=>true;window.prompt=()=> 'Envoi synthétique explicitement attesté';`);
  await wait('!!document.querySelector(".cgv-clause")','contract loaded');await sleep(200);
  test(sqlState()===unopened,theme+' '+density+' StrictMode opening is read-only');
  await click('Comparer les nouvelles versions CGV');await wait(`!!document.querySelector('[aria-label="Comparaison des CGV"]')`,'comparison');
  test(sqlState()===unopened,'comparison reads without writing');
  await click('Annuler la comparaison');test(sqlState()===unopened,'comparison cancellation preserves all rows');
  const customSelector='.cgv-clause-editor textarea:not([disabled])';await fill(customSelector,'Brouillon local conservé');
  await click('Comparer les nouvelles versions CGV');test(sqlState()===unopened,'dirty draft refuses library comparison without overwrite');
  test(await get(`document.querySelector(${JSON.stringify(customSelector)}).value==='Brouillon local conservé'`),'local clause draft retained');
  await fill(customSelector,'Texte négocié exact.');await click('Comparer les nouvelles versions CGV');await click('Appliquer les changements comparés');
  await wait(`!document.querySelector('[aria-label="Comparaison des CGV"]')`,'applied comparison');
  test(db.contractTerms.getQuoteBuild(q.id).compiledText.includes(version.body),'explicit comparison applied exact selected version');
  test(db.contractTerms.getQuoteBuild(q.id).clauses.some(c=>c.body==='Texte négocié exact.'),'custom clause unchanged');
  await click('Finaliser le devis');await wait('[...document.querySelectorAll("button")].some(b=>b.textContent===\"Reprendre le brouillon\")','prepared state');
  test(db.quotes.get(q.id).status==='draft'&&db.quotes.get(q.id).contractSnapshotJson===null,'preparation is neither sending nor final freeze');
  test(db.contractTerms.getQuoteBuild(q.id).snapshotState==='prepared','read panel distinguishes prepared state');
  const prepared=sqlState();await js('window.confirm=()=>false');await click('Reprendre le brouillon');test(sqlState()===prepared,'cancelled resume is mutation-free');
  await js('window.confirm=()=>true');await click('Reprendre le brouillon');await wait('!!document.querySelector(".cgv-clause-editor textarea:not([disabled])")','resumed draft');
  test(db.quotes.get(q.id).finalizedAt===null,'explicit resume unlocks only this new preparation');
  test(db.database.all('SELECT * FROM quote_contract_preparations WHERE quote_id=?',[q.id]).length===1,'previous preparation retained');
  await click('Finaliser le devis');await wait('[...document.querySelectorAll("button")].some(b=>b.textContent===\"Marquer envoyé\")','ready again');
  await click('Copier le bloc commercial pour Abby');test(db.quotes.get(q.id).status==='draft','Abby clipboard transfer is not a send');
  const beforeSend=sqlState();await js('window.confirm=()=>false');await click('Marquer envoyé');test(sqlState()===beforeSend,'cancelled attestation changes nothing');
  await js('window.confirm=()=>true');await click('Marquer envoyé');try{await wait('[...document.querySelectorAll("button")].some(b=>b.textContent===\"Marquer vu\")','sent status');}catch(error){console.log('EC03_SEND_DEBUG '+JSON.stringify({status:db.quotes.get(q.id).status,body:await get('document.body.innerText.slice(-6000)')}));throw error;}
  const sent=db.quotes.get(q.id),state=db.quotes.transmissionState(q.id);test(sent.status==='sent'&&!!sent.contractSnapshotJson&&!!state.transmissionId,'actual attestation freezes and identifies transmission');
  test(db.database.all('SELECT * FROM quote_contract_preparations WHERE quote_id=?',[q.id]).length===2,'two preparations retained without duplication of transmission');
  test(db.database.all('SELECT * FROM quote_contract_transmissions WHERE quote_id=?',[q.id]).length===1,'single transmission');
  const stored=sqlState();
  await js(`await window.atoumweb.quotes.generatePdf(${JSON.stringify(q.id)})`);test(sqlState()===stored,'real PDF generation leaves quote clauses and history intact');
  // Record explicit fixture evidence through the real preload/IPC, then accept through the actual UI.
  await js(`await window.atoumweb.quotePreparation.recordAcceptance(${JSON.stringify(q.id)},'Version synthétique effectivement acceptée','2026-09-02T12:00:00Z','Attestation fixture — ne vaut pas PDF signé');window.dispatchEvent(new Event('atoumweb:changed'));`);await sleep(150);
  await click('Confirmer accepté dans Abby');await wait('document.body.textContent.includes("Acceptation Abby confirmée")','acceptance');
  test(db.quotes.get(q.id).status==='accepted','correct quote accepted');
  test(db.quotes.get(q.id).contractSnapshotJson===sent.contractSnapshotJson,'acceptance preserves exact sent snapshot');
  test(db.quotePreparation.links(q.id).filter(l=>l.role==='acceptance').every(l=>l.transmissionId===state.transmissionId),'acceptance evidence bound to exact transmission');
  result.push({theme,density,quoteId:q.id,...state,status:db.quotes.get(q.id).status});
 }
 test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','EC03 SQLite integrity');test(db.database.all('PRAGMA foreign_key_check').length===0,'EC03 foreign keys');
 console.log('EC03_PATHS '+JSON.stringify(result));
 }finally{if(typeof beforeClipboard==='string')clipboard.writeText(beforeClipboard);}
};

'use strict';

/* Real Windows Electron + React renderer + preload + IPC + SQLite TEMP.
 * No production profile or files are touched. Only the native file-picker
 * response is redirected to files created by this isolated test.
 */
module.exports = async ({win,db,temp,evalUI:js,get,wait,navigate,test,sleep}) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { dialog } = require('electron');
  const now = '2026-10-14T12:00:00.000Z';
  const org = db.crm.createOrganization({name:'09B TEST CLIENT Abby'});
  const client = db.crm.createClient({organizationId:org.id});
  const id = 'native-09b-billing';
  db.database.run(
    `INSERT INTO billing_items
    (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id,client.id,'other','native-09b','other:native-09b','Prestation TEST 09B',14900,14900,'ready',now,now],
  );
  db.database.run(
    `INSERT INTO billing_items
    (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ['native-09b-second',client.id,'other','native-09b-second','other:native-09b-second',
      'Deuxième prestation TEST 09B',5500,5500,'ready','2026-10-13T10:00:00.000Z','2026-10-13T10:00:00.000Z'],
  );
  const original = path.join(temp,'abby-original.pdf');
  const corrected = path.join(temp,'abby-corrected.pdf');
  fs.writeFileSync(original,'%PDF-1.4\n% TEST original - fixture only\n');
  fs.writeFileSync(corrected,'%PDF-1.4\n% TEST correction - fixture only\n');
  let chosen = original;
  let cancelNext = true;
  const realDialog = dialog.showOpenDialog;
  const realConfirm = dialog.showMessageBoxSync;
  const confirmations = [];
  let approve = false;
  dialog.showOpenDialog = async () => cancelNext
    ? (cancelNext = false, {canceled:true,filePaths:[]})
    : ({canceled:false,filePaths:[chosen]});
  dialog.showMessageBoxSync = (...args) => {
    confirmations.push(args.at(-1));
    return approve ? 1 : 0;
  };
  try {
    await navigate('Facturation');
    await wait('!!document.querySelector(".billing-table tbody tr")','billing first row');
    test(await get('document.querySelector(".billing-guidance-strip")?.textContent.includes("Abby crée la facture")'),
      '09B-UI-01: Abby is only the invoice issuer');
    test(await get('document.querySelector(".billing-table tbody tr")?.textContent.includes("Prestation TEST 09B")'),
      '09B-UI-02: invoice appears in real billing list');
    await js('document.querySelector(".billing-table tbody tr").click()');
    await wait('!!document.querySelector(".billing-detail-panel")','real billing detail');
    test(await get('document.querySelector(".billing-invoice-state")?.textContent.includes("Aucune facture PDF")'),
      '09B-UI-03: no PDF before import');
    test(await get('!document.querySelector(".billing-status-field select option[value=invoiced]")'),
      '09B-UI-04: cannot select invoiced without a PDF');
    await js('document.querySelector(".billing-invoice-actions button.primary-button").click()');
    await wait('!document.querySelector(".billing-invoice-actions button.primary-button")?.disabled','cancelled file picker settled');
    test(db.billingHandoff.get(id).status==='ready'&&!db.billingHandoff.get(id).invoiceDocumentId,
      '09B-UI-05a: cancelling native file selection leaves item ready');
    await js('document.querySelector(".billing-invoice-actions button.primary-button").click()');
    await wait('!!document.querySelector(".billing-invoice-state.attached")','Abby original imported');
    test(db.billingHandoff.get(id).status==='invoiced','09B-UI-05: genuine IPC import marks item invoiced');
    const originalId = db.billingHandoff.get(id).invoiceDocumentId;
    test(!!originalId && !!fs.existsSync(db.clientDocuments.absolutePath(originalId)),
      '09B-UI-06: original PDF exists in client workspace');
    test(await get('document.querySelector(".billing-invoice-actions button.primary-button")?.textContent.includes("Remplacer")'),
      '09B-UI-07: real UI offers replacement');
    test(await get('!!document.querySelector(".billing-locked-status") && !document.querySelector(".billing-status-field select")'),
      '09B-UI-08: no status change after invoice linked');
    const originalBytes = fs.readFileSync(db.clientDocuments.absolutePath(originalId));
    chosen = corrected;
    await js('document.querySelector(".billing-invoice-actions button.primary-button").click()');
    await wait('document.querySelector(".billing-invoice-state.attached")?.textContent.includes("abby-corrected.pdf")',
      'replacement visible in React');
    const revised = db.billingHandoff.get(id);
    test(revised.status==='invoiced'&&revised.invoiceDocumentId!==originalId,
      '09B-UI-09: replacement has new document ID and stays invoiced');
    test(fs.readFileSync(db.clientDocuments.absolutePath(originalId)).equals(originalBytes),
      '09B-UI-10: original PDF bytes retained');
    const events = db.database.all(
      "SELECT action,metadata_json FROM activity_log WHERE entity_type='billing_item' AND entity_id=? AND action IN ('billing_invoice_attached','billing_invoice_replaced') ORDER BY id",
      [id],
    );
    test(events.length===2&&events[0].action==='billing_invoice_attached'&&events[1].action==='billing_invoice_replaced',
      '09B-UI-11: distinct import and replacement events');
    const trace = JSON.parse(events[1].metadata_json);
    test(trace.previousDocumentId===originalId&&trace.currentDocumentId===revised.invoiceDocumentId,
      '09B-UI-12: provenance captures both PDF document IDs');
    let deletionDenied=false;
    try{db.clientDocuments.deletePermanently(originalId);}catch(error){deletionDenied=/historique de facturation Abby/.test(error.message);}
    test(deletionDenied,'09B-UI-13: old invoice cannot be permanently deleted');
    fs.writeFileSync(db.clientDocuments.absolutePath(revised.invoiceDocumentId),'%PDF-1.4\n% tampered\n');
    const refused = await get('window.atoumweb.billing.openInvoice('+JSON.stringify(id)+').then(()=>false,err=>/empreinte SHA-256 différente/.test(String(err.message)))');
    test(refused,'09B-UI-14: genuine preload/IPC refuses tampered invoice opening');
    test(db.billingHandoff.get(id).invoiceDocumentId===revised.invoiceDocumentId,
      '09B-UI-15: tamper refusal preserves last attached invoice');
    await wait('!document.querySelector(".billing-invoice-actions button.primary-button")?.disabled','replacement settled');
    // Use real Chromium text input so React's onChange and UX-01 draft registry are exercised.
    const editReference = async value => {
      await js('const el=document.querySelector(".billing-invoice-fields input");el.focus();el.select();');
      await win.webContents.insertText(value);
      await wait('document.querySelector(".billing-invoice-fields input")?.value==='+JSON.stringify(value),
        'native text input '+value);
    };
    await editReference('BROUILLON-09B-NON-ENREGISTRE');
    await sleep(160);
    test(await get('document.querySelector(".billing-invoice-fields input")?.value==="BROUILLON-09B-NON-ENREGISTRE"'),
      '09B-UI-16: controlled reference field holds unsaved input');
    await js('document.querySelector(".billing-compact-item:not(.selected)").click()');
    await sleep(110);
    test(confirmations.length>0&&confirmations.at(-1).message.includes('non enregistrées'),
      '09B-UI-17: native UX-01 confirmation requested on invoice switch');
    test(await get('document.querySelector(".billing-detail-heading h2")?.textContent.trim()==="Prestation TEST 09B"'),
      '09B-UI-18: Stay keeps invoice selection and draft');
    test(await get('document.querySelector(".billing-invoice-fields input")?.value==="BROUILLON-09B-NON-ENREGISTRE"'),
      '09B-UI-19: Stay retains unsaved reference');
    approve=true;
    await js('document.querySelector(".billing-compact-item:not(.selected)").click()');
    await wait('document.querySelector(".billing-detail-heading h2")?.textContent.trim()==="Deuxième prestation TEST 09B"',
      'confirmed invoice selection');
    test(db.billingHandoff.get(id).invoiceReference!=='BROUILLON-09B-NON-ENREGISTRE',
      '09B-UI-20: discard does not silently save the abandoned draft');
    approve=false;
    await editReference('BROUILLON-NAVIGATION-09B');
    await sleep(150);
    await js('document.querySelector("[data-nav-module][aria-label=Accueil]").click()');
    await sleep(90);
    test(await get('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Facturation"'),
      '09B-UI-21: Stay blocks navigation with unsaved billing draft');
    approve=true;
    await js('document.querySelector("[data-nav-module][aria-label=Accueil]").click()');
    await wait('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Accueil"',
      'confirmed navigation away from dirty invoice');
    test(confirmations.length>=3,'09B-UI-22: both record change and module exit are guarded');
    await sleep(70);
    console.log('[UXV2 09B] Real renderer, imported and replaced PDF with native picker fixture; original preserved.');
  } finally {
    dialog.showOpenDialog = realDialog;
    dialog.showMessageBoxSync = realConfirm;
  }
};

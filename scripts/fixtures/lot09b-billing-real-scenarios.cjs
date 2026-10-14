'use strict';

/* Real Windows Electron + React renderer + preload + IPC + SQLite TEMP.
 * No production profile or files are touched. Only the native file-picker
 * response is redirected to files created by this isolated test.
 */
module.exports = async ({win,db,temp,evalUI:js,get,wait,navigate,select,test,sleep}) => {
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
    test(confirmations.length>0&&confirmations.at(-1).title==='Modifications non enregistrées'&&confirmations.at(-1).message.includes('pas enregistrées'),
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
    // Unlike the general UX smoke, this verifies the actual billing screen at all nine combinations.
    for (const [theme, themeLabel] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']]) {
      for (const [density, densityLabel, font, height] of [
        ['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48],
      ]) {
        await select(theme,themeLabel,density,densityLabel,font,height);
        await navigate('Facturation');
        await wait('!!document.querySelector(".billing-table tbody tr")','billing '+theme+'/'+density);
        const state = await get('({ theme:document.documentElement.dataset.theme, density:document.documentElement.dataset.density,'+
          ' guidance:!!document.querySelector(".billing-guidance-strip"), kpis:document.querySelectorAll(".billing-kpi-grid article").length,'+
          ' invoiceRows:document.querySelectorAll(".billing-table tbody tr").length,'+
          ' viewport:document.querySelector(".content-area")?.clientWidth, content:document.querySelector(".content-area")?.scrollWidth })');
        test(state.theme===theme&&state.density===density&&state.guidance&&state.kpis===4&&state.invoiceRows===2,
          '09B-3X3: billing React UI, data and style '+theme+'/'+density);
        test(state.content<=state.viewport+20,
          '09B-3X3: no horizontal overflow at '+theme+'/'+density);
      }
    }
    console.log('[UXV2 09B] Billing 3 themes x 3 densities passed in native Chromium.');
    // Real-client filters: each query must be applied by the mounted React page.
    const otherOrg = db.crm.createOrganization({name:'09B SECOND CLIENT TEMP'});
    const otherClient = db.crm.createClient({organizationId:otherOrg.id});
    db.database.run(
      `INSERT INTO billing_items
      (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,due_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      ['native-09b-other',otherClient.id,'other','native-09b-other','other:native-09b-other',
        'Facturation autre client TEMP',2500,2500,'ready','2026-10-20T12:00:00.000Z',now,now],
    );
    db.database.run('UPDATE billing_items SET due_at=? WHERE id=?',
      ['2026-10-15T12:00:00.000Z','native-09b-second']);
    db.billingHandoff.updateInvoiceMetadata(id,{reference:'ABBY-NATIVE-09B'});
    await js('document.querySelector(".billing-toolbar button.secondary-button").click()');
    await wait('document.querySelectorAll(".billing-table tbody tr").length===3','billing list refreshed for advanced filters');
    test(await get('document.querySelector(".billing-advanced-filters")!==null'),
      '09B-FILTER-01: advanced billing filter controls rendered');
    const changeSelect = async (label,value) => js('const el=document.querySelector("select[aria-label="+JSON.stringify('+JSON.stringify(label)+')+"]");'
      +'if(!el)throw Error("Missing filter");el.value='+JSON.stringify(value)+';el.dispatchEvent(new Event("change",{bubbles:true}));');
    const changeInput = async (label,value) => js('const el=document.querySelector("input[aria-label="+JSON.stringify('+JSON.stringify(label)+')+"]");'
      +'if(!el)throw Error("Missing filter");const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;'
      +'setter.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));');
    await changeSelect('Filtrer les factures selon la présence de PDF','with');
    await wait('document.querySelectorAll(".billing-table tbody tr").length===1','with invoice PDF');
    test(await get('document.querySelector(".billing-table tbody")?.textContent.includes("Prestation TEST 09B")'),
      '09B-FILTER-02: only items with PDF');
    await changeSelect('Filtrer les factures selon la présence de PDF','without');
    await wait('document.querySelectorAll(".billing-table tbody tr").length===2','without invoice PDF');
    test(await get('!document.querySelector(".billing-table tbody")?.textContent.includes("Prestation TEST 09B")'),
      '09B-FILTER-03: items without PDF');
    await changeSelect('Filtrer les factures selon la présence de PDF','all');
    await changeSelect('Filtrer les factures par client',otherClient.id);
    await wait('document.querySelectorAll(".billing-table tbody tr").length===1','other client');
    test(await get('document.querySelector(".billing-table tbody")?.textContent.includes("Facturation autre client TEMP")'),
      '09B-FILTER-04: client isolation');
    await changeSelect('Filtrer les factures par client','all');
    await changeInput('Filtrer par référence de facture exacte','ABBY-NATIVE-09B');
    await wait('document.querySelectorAll(".billing-table tbody tr").length===1','exact Abby reference');
    test(await get('document.querySelector(".billing-table tbody")?.textContent.includes("Prestation TEST 09B")'),
      '09B-FILTER-05: exact Abby invoice reference');
    await changeInput('Filtrer par référence de facture exacte','');
    await changeInput('Filtrer par échéance maximale','2026-10-15');
    await wait('document.querySelectorAll(".billing-table tbody tr").length===1','due before Oct 15');
    test(await get('document.querySelector(".billing-table tbody")?.textContent.includes("Deuxième prestation TEST 09B")'),
      '09B-FILTER-06: date threshold excludes later due dates and missing dates');
    await js('document.querySelector(".billing-advanced-fields button.secondary-button").click()');
    await wait('document.querySelectorAll(".billing-table tbody tr").length===3','filters reset');
    test(await get('document.querySelectorAll(".billing-table tbody tr").length===3'),
      '09B-FILTER-07: clearing advanced filters restores list');
    await sleep(70);
    console.log('[UXV2 09B] Real renderer, imported and replaced PDF with native picker fixture; original preserved.');
  } finally {
    dialog.showOpenDialog = realDialog;
    dialog.showMessageBoxSync = realConfirm;
  }
};

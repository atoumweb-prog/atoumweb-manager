'use strict';
// Native Windows Electron/React + preload/IPC + SQLite and real receipt files in a new TEMP workspace.
module.exports = async ({win,db,temp,evalUI:js,get,wait,navigate,select,test,sleep}) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const {dialog} = require('electron');
  const fixture = date => ({category:'software',label:'Frais TEST 09C '+date,
    amountCents:date===1?14900:3500,status:'committed',expenseDate:'2026-10-14T12:00:00.000Z'});
  const first = db.expenses.create(fixture(1));
  const second = db.expenses.create(fixture(2));
  const sourceA = path.join(temp,'09c-original.pdf');
  const sourceB = path.join(temp,'09c-replacement.pdf');
  fs.writeFileSync(sourceA,'%PDF-1.4\n% receipt original TEMP');
  fs.writeFileSync(sourceB,'%PDF-1.4\n% receipt replacement TEMP');
  let chosen=sourceA, cancelNext=true, approve=false;
  const dialogs=[];
  const previousPicker=dialog.showOpenDialog,previousConfirm=dialog.showMessageBoxSync;
  dialog.showOpenDialog=async()=>cancelNext?(cancelNext=false,{canceled:true,filePaths:[]}):({canceled:false,filePaths:[chosen]});
  dialog.showMessageBoxSync=(...args)=>{dialogs.push(args.at(-1));return approve?1:0;};
  try {
    await navigate('Dépenses');
    await wait('document.querySelectorAll(".expenses-table tbody tr").length===2','expense list');
    test(await get('document.querySelector(".expenses-kpi-grid")?.textContent.includes("Payé déclaré ce mois")'),
      '09C-UI-01: declared paid is not presented as bank-verified');
    test(await get('document.querySelector(".expenses-kpi-grid")?.textContent.includes("sans génération automatique")'),
      '09C-UI-02: recurring expenses do not claim auto-created occurrences');
    await js('const row=[...document.querySelectorAll(".expenses-table tbody tr")].find(e=>e.textContent.includes("Frais TEST 09C 1"));if(!row)throw Error("expense row absent");row.click()');
    await wait('document.querySelector(".expenses-detail-panel input[placeholder]")','selected expense');
    test(await get('document.querySelector(".expenses-detail-panel h2")?.textContent.includes("Frais TEST 09C 1")'),
      '09C-UI-03: real detail displays expense 1');
    await js('const el=document.querySelector(".expenses-form-grid input[placeholder]");el.focus();el.select();');
    await win.webContents.insertText('Brouillon 09C non enregistré');
    await wait('document.querySelector(".expenses-form-grid input[placeholder]")?.value==="Brouillon 09C non enregistré"',
      'native dirty input');
    await js('const el=[...document.querySelectorAll(".expenses-compact-item")].find(e=>e.textContent.includes("Frais TEST 09C 2"));el.click()');
    await sleep(80);
    test(dialogs.length>0&&dialogs.at(-1).title==='Modifications non enregistrées',
      '09C-UI-04: native UX-01 dialog blocks dirty expense change');
    test(await get('document.querySelector(".expenses-detail-panel h2")?.textContent.includes("Frais TEST 09C 1")'),
      '09C-UI-05: Stay retains expense selection');
    test(await get('document.querySelector(".expenses-form-grid input[placeholder]")?.value==="Brouillon 09C non enregistré"'),
      '09C-UI-06: Stay preserves unsaved value');
    approve=true;
    await js('const el=[...document.querySelectorAll(".expenses-compact-item")].find(e=>e.textContent.includes("Frais TEST 09C 2"));el.click()');
    await wait('document.querySelector(".expenses-detail-panel h2")?.textContent.includes("Frais TEST 09C 2")',
      'confirmed second expense');
    test(db.expenses.get(first.id).label==='Frais TEST 09C 1',
      '09C-UI-07: discard never silently saves a dirty form');
    approve=false;
    const clickReceipt=()=>js('const card=document.querySelector(".expense-receipt-card");if(!card)throw Error("Receipt section missing");card.closest(".expense-section").querySelector("button.primary-button").click()');
    await clickReceipt();
    await wait('!document.querySelector(".expense-receipt-card").closest(".expense-section").querySelector("button.primary-button").disabled',
      'cancelled receipt selection settled');
    test(!db.expenses.get(second.id).receiptRelativePath,
      '09C-UI-08: cancelling picker leaves receipt unchanged');
    await clickReceipt();
    await wait('document.querySelector(".expense-receipt-card.attached")?.textContent.includes("09c-original.pdf")',
      'first receipt imported');
    const original= db.expenses.absoluteReceiptPath(second.id);
    const originalBytes=fs.readFileSync(original);
    test(fs.existsSync(original)&&!!db.expenses.get(second.id).receiptRelativePath,
      '09C-UI-09: real IPC imports PDF to TEMP expense workspace');
    chosen=sourceB;
    await clickReceipt();
    await wait('document.querySelector(".expense-receipt-card.attached")?.textContent.includes("09c-replacement.pdf")',
      'receipt replacement shown');
    const versions=db.expenses.listReceiptVersions(second.id);
    test(versions.length===2&&versions.every(v=>v.integrity==='verified'),
      '09C-UI-10: both receipt versions SHA-256 verified');
    test(fs.readFileSync(original).equals(originalBytes),
      '09C-UI-11: previous PDF bytes are preserved');
    test(db.expenses.get(second.id).receiptFileName==='09c-replacement.pdf',
      '09C-UI-12: new receipt is active');
    const oldVersion=versions.find(v=>v.fileName==='09c-original.pdf');
    test(!!oldVersion&&db.expenses.verifiedReceiptVersionPath(second.id,oldVersion.relativePath)===original,
      '09C-UI-13: previous version can be located and checked');
    for(const [theme,title] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']]){
      for(const [density,label,font,height] of [['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48]]){
        await select(theme,title,density,label,font,height);
        await navigate('Dépenses');
        await wait('document.querySelectorAll(".expenses-table tbody tr").length===2','expenses '+theme+'/'+density);
        const state=await get('({theme:document.documentElement.dataset.theme,density:document.documentElement.dataset.density,'+
          'list:document.querySelectorAll(".expenses-table tbody tr").length,'+
          'scroll:document.querySelector(".content-area")?.scrollWidth,width:document.querySelector(".content-area")?.clientWidth})');
        test(state.theme===theme&&state.density===density&&state.list===2,
          '09C-3X3: real expenses UI in '+theme+'/'+density);
        test(state.scroll<=state.width+20,'09C-3X3: no horizontal overflow '+theme+'/'+density);
      }
    }
    console.log('[UXV2 09C] Native receipt import, replacement, dirty guards and 3x3 UI tested in TEMP.');
  }finally{
    dialog.showOpenDialog=previousPicker;
    dialog.showMessageBoxSync=previousConfirm;
  }
};

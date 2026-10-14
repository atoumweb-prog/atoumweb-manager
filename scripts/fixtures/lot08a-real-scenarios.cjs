'use strict';

// E226 — real Electron/React/preload/IPC recipe, isolated SQLite + profile in %TEMP%.
// Native confirmation is driven deterministically; business services are real.
module.exports = async ({db, evalUI: js, get, wait, navigate, test, sleep}) => {
  const {dialog} = require('electron');
  const originalDialog = dialog.showMessageBoxSync;
  const confirmations = [];
  const answers = [];
  dialog.showMessageBoxSync = (...args) => {
    confirmations.push(args.at(-1));
    return answers.shift() ?? 0; // 0 = Rester, 1 = Quitter
  };
  const input = async (selector, value) => {
    await js('const el=document.querySelector('+JSON.stringify(selector)+');'+
      'if(!el)throw Error("E226 textarea missing");'+
      'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(el,'+
        JSON.stringify(value)+');'+
      'el.dispatchEvent(new Event("input",{bubbles:true}));');
    await sleep(120);
  };
  const selectSubject = async (subject) => {
    await js('const items=[...document.querySelectorAll(".intervention-compact-item, .operations-table tbody tr")];'+
      'const item=items.find(e=>e.textContent.includes('+JSON.stringify(subject)+'));'+
      'if(!item)throw Error("E226 intervention missing: "+'+JSON.stringify(subject)+');item.click();');
    await wait('document.querySelector(".intervention-workbench-heading h2")?.textContent==='+
      JSON.stringify(subject),'selected '+subject);
  };
  const solutionSelector = '.intervention-conclusion-grid textarea[placeholder^="Correction réalisée"]';
  const openConclusion = async () => {
    if(!await get('!!document.querySelector(".intervention-conclusion-content")')){
      await js('document.querySelector(".intervention-conclusion-toggle").click()');
      await wait('!!document.querySelector(".intervention-conclusion-content")','conclusion opened');
    }
  };
  const value = () => get('document.querySelector('+JSON.stringify(solutionSelector)+')?.value ?? null');
  try {
    const org=db.crm.createOrganization({name:'E226 Native TEMP Dijon'});
    const client=db.crm.createClient({organizationId:org.id});
    const a=db.operations.createIntervention({
      clientAccountId:client.id,type:'incident',coverageMode:'internal',
      subject:'E226 Fiche A TEMP',status:'in_progress',
    });
    const b=db.operations.createIntervention({
      clientAccountId:client.id,type:'incident',coverageMode:'internal',
      subject:'E226 Fiche B TEMP',status:'in_progress',
    });
    await navigate('Interventions & Maintenance');
    await wait('!!document.querySelector(".operations-view-tabs")','Operations navigation tabs');
    await js('document.querySelector(".operations-view-tabs button:nth-child(2)").click()');
    await wait('!!document.querySelector(".operations-table tbody tr")','interventions loaded');
    await selectSubject('E226 Fiche A TEMP');
    await openConclusion();
    await input(solutionSelector,'BROUILLON E226 A');
    test(await value()==='BROUILLON E226 A','E226 dirty A visible in real React');
    test(db.operations.getIntervention(a.id).incidentSolution===null,'E226 dirty A never persisted');
    const before=confirmations.length;
    await selectSubjectAttempt('E226 Fiche B TEMP');
    test(confirmations.length===before+1,'E226 Stay prompts exactly once');
    test(confirmations.at(-1)?.defaultId===0,'E226 native dialog defaults to Stay');
    test(await get('document.querySelector(".intervention-workbench-heading h2")?.textContent')==='E226 Fiche A TEMP',
      'E226 Stay keeps intervention A');
    test(await value()==='BROUILLON E226 A','E226 Stay preserves exact draft');
    answers.push(1);
    await selectSubject('E226 Fiche B TEMP');
    await openConclusion();
    test(await value()==='','E226 Quit clears A and does not contaminate B');
    test(db.operations.getIntervention(a.id).incidentSolution===null,'E226 Quit does not write A');
    await input(solutionSelector,'BROUILLON E226 B');
    test(await value()==='BROUILLON E226 B','E226 B draft belongs to B');
    const beforeB=confirmations.length;
    await selectSubjectAttempt('E226 Fiche A TEMP');
    test(confirmations.length===beforeB+1,'E226 B to A prompts once');
    test(await value()==='BROUILLON E226 B','E226 Stay retains B input');
    answers.push(1);
    await selectSubject('E226 Fiche A TEMP');
    await openConclusion();
    test(await value()==='','E226 returning A sees baseline, not old B or discarded A');
    test(db.operations.getIntervention(b.id).incidentSolution===null,'E226 discarded B not saved');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'E226 SQLite foreign keys');
    console.log('[UXV2 08A E226] Native A→B→A Stay/Quit PASS; confirmations='+confirmations.length);
  } finally {
    dialog.showMessageBoxSync = originalDialog;
  }
  async function selectSubjectAttempt(subject) {
    await js('const items=[...document.querySelectorAll(".intervention-compact-item, .operations-table tbody tr")];'+
      'const item=items.find(e=>e.textContent.includes('+JSON.stringify(subject)+'));'+
      'if(!item)throw Error("E226 intervention missing: "+'+JSON.stringify(subject)+');item.click();');
    await sleep(150);
  }
};

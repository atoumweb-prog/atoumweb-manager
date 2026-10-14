'use strict';

// E226 — real Electron/React/preload/IPC recipe, isolated SQLite + profile in %TEMP%.
// Native confirmation is driven deterministically; business services are real.
module.exports = async ({db, registered, evalUI: js, get, wait, navigate, test, sleep}) => {
  const {dialog,ipcMain} = require('electron');
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

    // Le véritable IPC d'enregistrement est retardé volontairement pour
    // reproduire une écriture en cours, sans modifier le service ni les données.
    const channel='operations:interventions:update';
    const originalHandler=registered.get(channel);
    if(typeof originalHandler!=='function')throw Error('Missing real intervention update handler');
    let releaseUpdate=null;
    let updateStarted=false;
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, async (...args)=>{
      updateStarted=true;
      await new Promise(resolve=>{releaseUpdate=resolve;});
      return originalHandler(...args);
    });
    try {
      await input(solutionSelector,'PENDING E226 A');
      await js('document.querySelector(".intervention-conclusion-content .button-row button.secondary-button").click()');
      for(let i=0;i<80&&!updateStarted;i++)await sleep(30);
      test(updateStarted&&!!releaseUpdate,'E226 actual IPC save deliberately pending');
      test(await get('!!document.querySelector("fieldset.intervention-conclusion-grid")?.disabled'),
        'E226 pending locks the real conclusion form');
      const pendingConfirmations=confirmations.length;
      answers.push(1); // Même Quitter confirmé doit être refusé tant que pending.
      await selectSubjectAttempt('E226 Fiche B TEMP');
      test(confirmations.length===pendingConfirmations+1,'E226 pending prompts once');
      test(await get('document.querySelector(".intervention-workbench-heading h2")?.textContent')==='E226 Fiche A TEMP',
        'E226 pending never navigates away from A');
      test(await value()==='PENDING E226 A','E226 pending preserves draft content');
      test(db.operations.getIntervention(a.id).incidentSolution===null,'E226 pending has not committed');
      releaseUpdate();
      await wait('!document.querySelector("fieldset.intervention-conclusion-grid")?.disabled',
        'E226 save resumed and form unlocked');
      test(db.operations.getIntervention(a.id).incidentSolution==='PENDING E226 A',
        'E226 completed IPC persists A only');
      const confirmedCount=confirmations.length;
      await selectSubject('E226 Fiche B TEMP');
      test(confirmations.length===confirmedCount,'E226 saved draft needs no discard prompt');
      await sleep(250);
      test(await get('document.querySelector(".intervention-workbench-heading h2")?.textContent')==='E226 Fiche B TEMP',
        'E226 refresh after save never resurrects A');
      test(db.operations.getIntervention(b.id).incidentSolution===null,'E226 late response cannot mutate B');
    } finally {
      if(releaseUpdate)releaseUpdate();
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel,originalHandler);
    }

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

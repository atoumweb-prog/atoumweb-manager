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

    // E224 : les compteurs visibles sont lus depuis la vraie période SQLite
    // et différencient routine / quota mineur sans modifier la règle historique.
    const plan = db.maintenance.createPlan({
      name: 'E224 Quota TEMP', periodicPriceCents: 4900,
      includedInterventions: 1, includedMinutes: 60,
    });
    const subscription = db.maintenance.createSubscription({
      clientAccountId: client.id, planId: plan.id, startDate: '2026-09-01',
    });
    const period = db.maintenance.ensurePeriod(subscription.id, '2026-09-14');
    const minor = db.operations.createIntervention({
      clientAccountId: client.id, type: 'maintenance', coverageMode: 'maintenance',
      maintenancePeriodId: period.id, subject: 'E224 Dépannage TEMP',
    });
    const routine = db.operations.createIntervention({
      clientAccountId: client.id, type: 'maintenance', coverageMode: 'maintenance',
      maintenancePeriodId: period.id, subject: 'E224 Routine TEMP',
    });
    db.database.run("UPDATE interventions SET maintenance_usage_kind='routine' WHERE id=?", [routine.id]);
    db.time.addManual({ interventionId: minor.id, category: 'support',
      startedAt: '2026-09-14T08:00:00Z', endedAt: '2026-09-14T08:45:00Z' });
    db.time.addManual({ interventionId: routine.id, category: 'support',
      startedAt: '2026-09-14T09:00:00Z', endedAt: '2026-09-14T09:30:00Z' });
    await js('document.querySelector(".operations-view-tabs button:nth-child(3)").click()');
    await wait('!!document.querySelector(".maintenance-list-panel .operations-table tbody tr")',
      'maintenance subscriptions visible');
    await js('const row=[...document.querySelectorAll(".maintenance-list-panel .operations-table tbody tr")].find(e=>e.textContent.includes("E224 Quota TEMP"));if(!row)throw Error("E224 subscription missing");row.click()');
    await wait('!!document.querySelector(".maintenance-usage-grid")','E224 period usage shown');
    const values=await get('Object.fromEntries([...document.querySelectorAll(".maintenance-usage-grid > div")].map(e=>[e.querySelector("span")?.textContent.trim(),e.querySelector("strong")?.textContent.trim()]))');
    test(values['Temps réalisé (routines comprises)']==='1,3 h','E224 UI displays full 75-min actual time');
    test(values['Dont routines (hors quota mineur)']==='0,5 h','E224 UI distinguishes 30-min routine');
    test(values['Temps imputé au quota mineur']==='0,8 h','E224 UI quota counts only 45-min minor');
    test(values['Solde quota mineur']==='0,3 h','E224 UI displays remaining 15-min minor quota');
    test(db.maintenance.getPeriod(period.id).usage.interventionCount===1,'E224 routine does not consume intervention quota');
    test(db.maintenance.getPeriod(period.id).usage.secondsOverQuota===0,'E224 routine does not create overage');
    // E226 — créer un plan expose désormais la garde UX-01 commune.
    await js('document.querySelector(".maintenance-panel-stack .toolbar-controls button:nth-child(2)").click()');
    await wait('!!document.querySelector(".operation-create-panel input[placeholder]")','maintenance plan form opened');
    await js('const el=document.querySelector(".operation-create-panel input[placeholder]");'+
      'Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"BROUILLON PLAN E226");'+
      'el.dispatchEvent(new Event("input",{bubbles:true}));');
    await wait('document.querySelector(".operation-create-panel input[placeholder]")?.value==="BROUILLON PLAN E226"',
      'maintenance plan draft entered');
    const beforePlanConfirm=confirmations.length;
    await js('document.querySelector(".operation-create-panel .button-row button.secondary-button").click()');
    test(confirmations.length===beforePlanConfirm+1,'E226 plan creation cancel prompts once');
    test(await get('document.querySelector(".operation-create-panel input[placeholder]")?.value')==='BROUILLON PLAN E226',
      'E226 Stay preserves plan draft');
    answers.push(1);
    await js('document.querySelector(".operation-create-panel .button-row button.secondary-button").click()');
    await wait('!document.querySelector(".operation-create-panel")','E226 plan draft discarded');
    test(!db.maintenance.listPlans().some(p=>p.name==='BROUILLON PLAN E226'),
      'E226 cancel does not create commercial plan');
    await js('document.querySelector(".maintenance-panel-stack .toolbar-controls button:nth-child(2)").click()');
    await wait('!!document.querySelector(".operation-create-panel input[placeholder]")','new clean maintenance plan form');
    test(await get('document.querySelector(".operation-create-panel input[placeholder]")?.value')==='',
      'E226 new plan starts empty after confirmed discard');
    await js('document.querySelector(".operation-create-panel .button-row button.secondary-button").click()');
    test(!await get('!!document.querySelector(".operation-create-panel")'),'E226 pristine plan cancels without draft loss');

    test(db.database.all('PRAGMA foreign_key_check').length===0,'E224 native SQLite foreign keys');
    console.log('[UXV2 08A E224] Native quota display: '+JSON.stringify(values));

    // E225 : même lorsque deux clics surviennent avant un aller-retour React,
    // un ajustement manuel ne peut créer qu'un seul mouvement SQLite.
    const pack = db.hourPacks.create({
      clientAccountId: client.id, name: 'E225 Pack TEMP',
      purchasedSeconds: 3600, contractPriceCents: 10000,
    });
    await js('document.querySelector(".operations-view-tabs button:nth-child(4)").click()');
    await wait('!!document.querySelector(".hour-pack-list-panel .operations-table tbody tr")','E225 packs shown');
    await js('const row=[...document.querySelectorAll(".hour-pack-list-panel .operations-table tbody tr")].find(e=>e.textContent.includes("E225 Pack TEMP"));if(!row)throw Error("E225 pack missing");row.click()');
    await wait('!!document.querySelector(".hour-pack-workbench")','E225 pack workbench');
    await js('const section=[...document.querySelectorAll(".hour-pack-workbench details")].find(e=>e.querySelector("summary")?.textContent.includes("Ajustement manuel"));if(!section)throw Error("E225 adjustment missing");section.open=true;');
    const setPackInput = async (selector, value) => {
      await js('const el=document.querySelector('+JSON.stringify(selector)+');'+
        'if(!el)throw Error("E225 missing input");'+
        'Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');'+
        'el.dispatchEvent(new Event("input",{bubbles:true}));');
    };
    await setPackInput('.hour-pack-workbench input[placeholder^="Ex."]','-0.5');
    await setPackInput('.hour-pack-workbench input[placeholder="Motif obligatoire"]','E225 DOUBLE CLIC TEMP');
    await wait('[...document.querySelectorAll(".hour-pack-workbench button")].some(b=>b.textContent==="Ajouter le mouvement"&&!b.disabled)',
      'E225 adjustment enabled');
    const moveChannel='operations:hour-packs:add-movement';
    const originalMove=registered.get(moveChannel);
    if(typeof originalMove!=='function')throw Error('E225 real movement IPC handler missing');
    let releaseMove=null, moveCount=0;
    ipcMain.removeHandler(moveChannel);
    ipcMain.handle(moveChannel,(...args)=>{
      moveCount++;
      return new Promise(resolve=>{releaseMove=()=>resolve(originalMove(...args));});
    });
    try {
      await js('const b=[...document.querySelectorAll(".hour-pack-workbench button")].find(e=>e.textContent==="Ajouter le mouvement");if(!b)throw Error("E225 movement button missing");b.click();b.click();');
      for(let i=0;i<80&&moveCount===0;i++)await sleep(30);
      test(moveCount===1,'E225 double click invokes only one actual movement IPC');
      test(await get('[...document.querySelectorAll(".hour-pack-workbench button")].some(b=>b.textContent.includes("Enregistrement")&&b.disabled)'),
        'E225 correction button disabled while real IPC pending');
      test(db.hourPacks.get(pack.id).movements.filter(m=>m.type==='manual_correction').length===0,
        'E225 no movement committed before delayed IPC');
      releaseMove();
      for(let i=0;i<80&&db.hourPacks.get(pack.id).movements.filter(m=>m.type==='manual_correction').length===0;i++)await sleep(30);
      test(db.hourPacks.get(pack.id).movements.filter(m=>m.type==='manual_correction').length===1,
        'E225 only one persisted correction after double click');
      test(db.hourPacks.get(pack.id).balanceSeconds===1800,
        'E225 double click debits just 30 minutes, not twice');
    } finally {
      if(releaseMove)releaseMove();
      ipcMain.removeHandler(moveChannel);
      ipcMain.handle(moveChannel,originalMove);
    }
    // E226 : quitter le formulaire de création d'un pack doit confirmer
    // avant de supprimer le brouillon, sans créer de crédit fictif.
    await js('const b=[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==="+ Pack");if(!b)throw Error("E226 new pack command missing");b.click();');
    await wait('!!document.querySelector(".hour-pack-create-panel")','E226 pack form visible');
    await setPackInput('.hour-pack-create-panel input[placeholder="Ex. Forfait 10 h"]','BROUILLON PACK E226');
    await wait('document.querySelector(".hour-pack-create-panel input[placeholder]")?.value==="BROUILLON PACK E226"',
      'E226 pack draft typed');
    const beforePackConfirm=confirmations.length;
    await js('document.querySelector(".hour-pack-create-panel .button-row button.secondary-button").click()');
    test(confirmations.length===beforePackConfirm+1,'E226 new pack cancel prompts exactly once');
    test(await get('document.querySelector(".hour-pack-create-panel input[placeholder]")?.value')==='BROUILLON PACK E226',
      'E226 Stay preserves new pack draft');
    answers.push(1);
    await js('document.querySelector(".hour-pack-create-panel .button-row button.secondary-button").click()');
    await wait('!document.querySelector(".hour-pack-create-panel")','E226 pack form dismissed after confirmation');
    test(!db.hourPacks.list().some(p=>p.name==='BROUILLON PACK E226'),
      'E226 discarded pack draft creates no pack');
    await js('const b=[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==="+ Pack");if(!b)throw Error("E226 pack reopen command missing");b.click();');
    await wait('!!document.querySelector(".hour-pack-create-panel")','E226 new pack opened fresh');
    test(await get('document.querySelector(".hour-pack-create-panel input[placeholder]")?.value')==='',
      'E226 pack draft cleared after confirmed exit');
    await js('document.querySelector(".hour-pack-create-panel .button-row button.secondary-button").click()');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'E225 native SQLite foreign keys');

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

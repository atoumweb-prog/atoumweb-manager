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
    // 08C/08E : deux abonnements sur la véritable interface, réponses IPC
    // volontairement inversées et sauvegarde de rapport avec double clic.
    const planB = db.maintenance.createPlan({
      name: 'E08C B TEMP', periodicPriceCents: 9900,
      includedInterventions: 2, includedMinutes: 120,
    });
    const subscriptionB = db.maintenance.createSubscription({
      clientAccountId: client.id, planId: planB.id, startDate: '2026-10-01',
    });
    const periodB = db.maintenance.ensurePeriod(subscriptionB.id, '2026-10-14');
    await js('document.querySelector(".maintenance-panel-stack .toolbar-controls button").click()');
    await wait('[...document.querySelectorAll(".maintenance-compact-item, .maintenance-list-panel .operations-table tbody tr")].some(e=>e.textContent.includes("E08C B TEMP"))',
      'E08C second subscription visible');
    const chooseSubscription = (name) => js(
      'const row=[...document.querySelectorAll(".maintenance-compact-item, .maintenance-list-panel .operations-table tbody tr")].find(e=>e.textContent.includes('+
        JSON.stringify(name)+'));if(!row)throw Error("E08C missing subscription");row.click();');
    const periodChannel='operations:maintenance:periods:list';
    const originalPeriods=registered.get(periodChannel);
    if(typeof originalPeriods!=='function')throw Error('E08C real period IPC missing');
    let holdA=false,releaseA=null;
    ipcMain.removeHandler(periodChannel);
    ipcMain.handle(periodChannel,(...args)=>{
      if(holdA&&args[1]===subscription.id){
        holdA=false;
        return new Promise(resolve=>{releaseA=()=>resolve(originalPeriods(...args));});
      }
      return originalPeriods(...args);
    });
    try {
      await chooseSubscription('E08C B TEMP');
      await wait('document.querySelector(".maintenance-compact-item.selected")?.textContent.includes("E08C B TEMP")',
        'E08C B selected first');
      await wait('document.querySelector(".maintenance-period-list")?.textContent.includes("2026-10")',
        'E08C B period displayed');
      holdA=true;
      await chooseSubscription('E224 Quota TEMP');
      for(let i=0;i<90&&!releaseA;i++)await sleep(25);
      test(typeof releaseA==='function','E08C delayed period A request started');
      await chooseSubscription('E08C B TEMP');
      await wait('document.querySelector(".maintenance-period-list")?.textContent.includes("2026-10")',
        'E08C B period reloaded');
      releaseA();
      await sleep(180);
      test(await get('document.querySelector(".maintenance-compact-item.selected")?.textContent.includes("E08C B TEMP")')===true,
        'E08C late A response does not reopen subscription A');
      test(await get('document.querySelector(".maintenance-period-list")?.textContent.includes("2026-10")')===true,
        'E08C stale period A does not replace period B');
    } finally {
      if(releaseA)releaseA();
      ipcMain.removeHandler(periodChannel);
      ipcMain.handle(periodChannel,originalPeriods);
    }

    await js('document.querySelector(".maintenance-report-toggle").click()');
    await wait('!!document.querySelector(".maintenance-report-fields textarea")',
      'E08E report B loaded from real service');
    await input('.maintenance-report-fields textarea','E08E SAUVEGARDE TEMP B');
    const reportChannel='maintenance-reports:update-draft';
    const originalReport=registered.get(reportChannel);
    if(typeof originalReport!=='function')throw Error('E08E report update handler missing');
    let reportWrites=0,releaseReport=null;
    ipcMain.removeHandler(reportChannel);
    ipcMain.handle(reportChannel,(...args)=>{
      reportWrites++;
      return new Promise(resolve=>{releaseReport=()=>resolve(originalReport(...args));});
    });
    try {
      await js('const b=document.querySelector(".maintenance-report-content .button-row button.primary-button");if(!b)throw Error("E08E save button missing");b.click();b.click();');
      for(let i=0;i<90&&reportWrites===0;i++)await sleep(25);
      test(reportWrites===1,'E08E double save click sends exactly one IPC');
      test(await get('document.querySelector(".maintenance-report-content .button-row button.primary-button")?.disabled')===true,
        'E08E pending report save disables UI');
      const beforeReportExit=confirmations.length;
      answers.push(1);
      await chooseSubscription('E224 Quota TEMP');
      test(confirmations.length===beforeReportExit+1,'E08E pending report prompts once');
      test(await get('document.querySelector(".maintenance-compact-item.selected")?.textContent.includes("E08C B TEMP")')===true,
        'E08E pending report cannot leave B');
      releaseReport();
      for(let i=0;i<90&&db.maintenanceReports.get(periodB.id).clientSummary!=='E08E SAUVEGARDE TEMP B';i++)await sleep(25);
      test(db.maintenanceReports.get(periodB.id).clientSummary==='E08E SAUVEGARDE TEMP B',
        'E08E resumed IPC saved only report B');
      await wait('document.querySelector(".maintenance-report-content .button-row button.primary-button")?.disabled===false',
        'E08E report save settled');
    } finally {
      if(releaseReport)releaseReport();
      ipcMain.removeHandler(reportChannel);
      ipcMain.handle(reportChannel,originalReport);
    }
    await input('.maintenance-report-fields textarea','E08E BROUILLON ABANDONNE B');
    const beforeDirtyReportExit=confirmations.length;
    await chooseSubscription('E224 Quota TEMP');
    test(confirmations.length===beforeDirtyReportExit+1,'E08E dirty report navigation guarded');
    test(await get('document.querySelector(".maintenance-report-fields textarea")?.value')==='E08E BROUILLON ABANDONNE B',
      'E08E Stay retains unsaved report B');
    answers.push(1);
    await chooseSubscription('E224 Quota TEMP');
    await wait('document.querySelector(".maintenance-compact-item.selected")?.textContent.includes("E224 Quota TEMP")',
      'E08E confirmed navigation to report A');
    await wait('document.querySelector(".maintenance-period-list")?.textContent.includes("2026-09")',
      'E08E period A restored');
    await js('document.querySelector(".maintenance-report-toggle").click()');
    await wait('!!document.querySelector(".maintenance-report-fields textarea")',
      'E08E report A loaded');
    test(await get('document.querySelector(".maintenance-report-fields textarea")?.value')!=='E08E SAUVEGARDE TEMP B',
      'E08E saved B content never appears in A report');
    test(db.maintenanceReports.get(periodB.id).clientSummary==='E08E SAUVEGARDE TEMP B',
      'E08E discarded later edits do not overwrite B saved version');
    // 08E : deux périodes d'une même souscription doivent aussi avoir des
    // brouillons distincts ; « Rester » garde septembre, « Quitter » ouvre octobre.
    const october = db.maintenance.ensurePeriod(subscription.id, '2026-10-14');
    await chooseSubscription('E08C B TEMP');
    await wait('document.querySelector(".maintenance-compact-item.selected")?.textContent.includes("E08C B TEMP")',
      'E08E B reselected to refresh A periods');
    await chooseSubscription('E224 Quota TEMP');
    await wait('document.querySelectorAll(".maintenance-period-list button").length>=2',
      'E08E September and October periods listed');
    const choosePeriod = (month) => js(
      'const el=[...document.querySelectorAll(".maintenance-period-list button")].find(e=>e.textContent.includes('+
      JSON.stringify(month)+'));if(!el)throw Error("E08E month missing");el.click();');
    await choosePeriod('2026-09');
    await wait('document.querySelector(".maintenance-period-list button.selected")?.textContent.includes("2026-09")',
      'E08E September period selected');
    await js('document.querySelector(".maintenance-report-toggle").click()');
    await wait('!!document.querySelector(".maintenance-report-fields textarea")',
      'E08E September report opened');
    await input('.maintenance-report-fields textarea','E08E SEPTEMBRE NON ENREGISTRE');
    const beforePeriodPrompt=confirmations.length;
    await choosePeriod('2026-10');
    test(confirmations.length===beforePeriodPrompt+1,'E08E changing period protects unsaved report');
    test(await get('document.querySelector(".maintenance-period-list button.selected")?.textContent.includes("2026-09")')===true,
      'E08E Stay leaves September selected');
    test(await get('document.querySelector(".maintenance-report-fields textarea")?.value')==='E08E SEPTEMBRE NON ENREGISTRE',
      'E08E Stay retains September draft');
    answers.push(1);
    await choosePeriod('2026-10');
    await wait('document.querySelector(".maintenance-period-list button.selected")?.textContent.includes("2026-10")',
      'E08E Quit opens October');
    await js('document.querySelector(".maintenance-report-toggle").click()');
    await wait('!!document.querySelector(".maintenance-report-fields textarea")',
      'E08E October report opened');
    test(await get('document.querySelector(".maintenance-report-fields textarea")?.value')!=='E08E SEPTEMBRE NON ENREGISTRE',
      'E08E discarded September draft does not leak to October');
    test(db.maintenanceReports.get(period.id).clientSummary!=='E08E SEPTEMBRE NON ENREGISTRE',
      'E08E abandoned September edit never persisted');
    test(db.maintenanceReports.get(october.id).clientSummary!=='E08E SEPTEMBRE NON ENREGISTRE',
      'E08E October remains isolated');
    // 08C : une décision de dépassement non enregistrée doit être gardée
    // pendant les changements de période et ne doit générer aucun handoff.
    const extraMinor = db.operations.createIntervention({
      clientAccountId: client.id, maintenancePeriodId: period.id,
      type: 'maintenance', coverageMode: 'maintenance', subject: 'E08C Deuxième dépannage TEMP',
    });
    db.time.addManual({ interventionId: extraMinor.id, category: 'support',
      startedAt: '2026-09-15T08:00:00Z', endedAt: '2026-09-15T08:25:00Z' });
    await chooseSubscription('E08C B TEMP');
    await wait('document.querySelector(".maintenance-compact-item.selected")?.textContent.includes("E08C B TEMP")',
      'E08C B refreshed after minor intervention');
    await chooseSubscription('E224 Quota TEMP');
    await wait('document.querySelectorAll(".maintenance-period-list button").length>=2',
      'E08C A periods refreshed after extra minor');
    await choosePeriod('2026-09');
    await wait('!!document.querySelector(".maintenance-overage-item")','E08C overage decision editor shown');
    const fillOverage = async (selector, value) => {
      await js('const el=document.querySelector('+JSON.stringify(selector)+');'+
        'if(!el)throw Error("E08C overage field missing");'+
        'Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+
        JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));');
      await sleep(80);
    };
    await fillOverage('.maintenance-overage-item input[placeholder^="Ex."]','E08C DECISION NON ENREGISTREE');
    await fillOverage('.maintenance-overage-item input[type="number"]','42');
    const beforeOverageExit=confirmations.length;
    await choosePeriod('2026-10');
    test(confirmations.length===beforeOverageExit+1,'E08C overage draft triggers UX-01 confirmation');
    test(await get('document.querySelector(".maintenance-period-list button.selected")?.textContent.includes("2026-09")')===true,
      'E08C Stay retains overage period');
    test(await get('document.querySelector(".maintenance-overage-item input[placeholder^="Ex."]")?.value')==='E08C DECISION NON ENREGISTREE',
      'E08C Stay retains unrecorded overage reason');
    answers.push(1);
    await choosePeriod('2026-10');
    await wait('document.querySelector(".maintenance-period-list button.selected")?.textContent.includes("2026-10")',
      'E08C confirmed switch after overage draft');
    test(db.maintenanceOverages.review(period.id).unresolvedCount===1,
      'E08C discarding overage draft never records a financial decision');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'E08C overage SQLite foreign keys');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'E08C/E08E temp SQLite foreign keys');
    console.log('[UXV2 08C/08E] Native period-race/report pending and dirty navigation PASS');

    // 08B : la confirmation de clôture dispose désormais d'une projection
    // fournie par le service métier, purement consultative, via le vrai preload.
    const previewPack = db.hourPacks.create({
      clientAccountId: client.id, name: 'E08B Projection TEMP',
      purchasedSeconds: 3600, contractPriceCents: 12900,
    });
    const previewIntervention = db.operations.createIntervention({
      clientAccountId: client.id, hourPackId: previewPack.id,
      coverageMode: 'hour_pack', type: 'support',
      subject: 'E08B Débit prévisible TEMP', status: 'in_progress',
    });
    db.time.addManual({
      interventionId: previewIntervention.id, category: 'support',
      startedAt: '2026-09-14T10:00:00Z', endedAt: '2026-09-14T10:30:00Z',
    });
    const projection=await get('window.atoumweb.operations.hourPacks.previewInterventionDebit('+
      JSON.stringify(previewPack.id)+','+JSON.stringify(previewIntervention.id)+')');
    test(projection.secondsToDebit===1800&&projection.balanceBeforeSeconds===3600
      &&projection.balanceAfterSeconds===1800&&!projection.alreadyDebited,
      'E08B actual IPC previews exact pack debit and after-balance');
    test(db.hourPacks.get(previewPack.id).balanceSeconds===3600
      &&db.hourPacks.get(previewPack.id).movements.filter(m=>m.type==='intervention_debit').length===0,
      'E08B preflight did not write movement or balance');
    db.interventionCompletion.complete(previewIntervention.id);
    test(db.hourPacks.get(previewPack.id).balanceSeconds===projection.balanceAfterSeconds,
      'E08B effective closure matches read-only projection');
    const projectedAgain=await get('window.atoumweb.operations.hourPacks.previewInterventionDebit('+
      JSON.stringify(previewPack.id)+','+JSON.stringify(previewIntervention.id)+')');
    test(projectedAgain.alreadyDebited&&projectedAgain.secondsToDebit===0
      &&projectedAgain.balanceAfterSeconds===1800,
      'E08B same source key prevents any second projected debit');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'E08B preview SQLite foreign keys');
    console.log('[UXV2 08B] Read-only pack projection / IPC / effective debit PASS');

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
    await setPackInput('.hour-pack-workbench input[placeholder^=Motif]','E225 DOUBLE CLIC TEMP');
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
      await wait('document.querySelector(".hour-pack-workbench input[placeholder^=Motif]")?.value===""',
        'E225 correction form reset after IPC success');

    } finally {
      if(releaseMove)releaseMove();
      ipcMain.removeHandler(moveChannel);
      ipcMain.handle(moveChannel,originalMove);
    }
    // E226 — un ajustement non enregistré suit l'identité du pack sélectionné.
    const otherPack = db.hourPacks.create({
      clientAccountId: client.id, name: 'E226 Autre pack TEMP',
      purchasedSeconds: 7200, contractPriceCents: 20000,
    });
    await js('document.querySelector(".hour-pack-toolbar-controls button").click()');
    await wait('[...document.querySelectorAll(".hour-pack-compact-item, .hour-pack-list-panel .operations-table tbody tr")].some(e=>e.textContent.includes("E226 Autre pack TEMP"))',
      'E226 second pack loaded after refresh');
    await setPackInput('.hour-pack-workbench input[placeholder^="Ex."]','-0.25');
    await setPackInput('.hour-pack-workbench input[placeholder^=Motif]','BROUILLON E226 AJUSTEMENT');
    await wait('document.querySelector(".hour-pack-workbench input[placeholder^=Motif]")?.value==="BROUILLON E226 AJUSTEMENT"',
      'E226 adjustment draft typed');
    const beforeAdjustmentConfirm=confirmations.length;
    const clickOtherPack=()=>js('const row=[...document.querySelectorAll(".hour-pack-compact-item, .hour-pack-list-panel .operations-table tbody tr")].find(e=>e.textContent.includes("E226 Autre pack TEMP"));if(!row)throw Error("E226 second pack missing");row.click()');
    await clickOtherPack();
    test(confirmations.length===beforeAdjustmentConfirm+1,'E226 adjustment navigation confirms once');
    test(await get('document.querySelector(".hour-pack-workbench h2")?.textContent')==='E225 Pack TEMP',
      'E226 Stay retains original pack');
    test(await get('document.querySelector(".hour-pack-workbench input[placeholder^=Motif]")?.value')==='BROUILLON E226 AJUSTEMENT',
      'E226 Stay retains adjustment input');
    answers.push(1);
    await clickOtherPack();
    await wait('document.querySelector(".hour-pack-workbench h2")?.textContent==="E226 Autre pack TEMP"',
      'E226 confirmed pack switch');
    test(await get('document.querySelector(".hour-pack-workbench input[placeholder^=Motif]")?.value')==='',
      'E226 adjustment does not leak into other pack');
    test(db.hourPacks.get(otherPack.id).movements.filter(m=>m.type==='manual_correction').length===0,
      'E226 navigation does not create unrequested adjustment');

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

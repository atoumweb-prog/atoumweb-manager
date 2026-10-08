// Real App/preload/IPC on a temporary workspace built from migrations. No Validation-MSI access.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-phase7-ui-'));
  const env={...process.env,ATOUMWEB_PHASE7_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  try{const result=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:180000});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.error)throw result.error;process.exitCode=result.status??1;}
  finally{if(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(temp).startsWith('atoumweb-phase7-ui-'))fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}else{
  const {app,BrowserWindow}=require('electron'),args=process.argv.slice(2),temp=process.env.ATOUMWEB_PHASE7_TEMP;
  const output=args.includes('--output')?path.resolve(args[args.indexOf('--output')+1]):null;
  if(!temp||!output)throw Error('Run with node and --output outside the repository');
  fs.mkdirSync(output,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
  const esbuild=require('esbuild'),base=repo.replaceAll('\\','/');
  esbuild.buildSync({stdin:{contents:`export * from '${base}/src/main/database/DatabaseService';export * from '${base}/src/main/workspace';export * from '${base}/src/main/ipc';export * from '${base}/src/main/operations/operationsIpc';export * from '${base}/src/main/referentials/referentialsIpc';export * from '${base}/src/main/backups/businessBackupsIpc';export * from '${base}/src/main/time/timeIpc';`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
  for(const [entry,file,platform] of [['src/preload/preload.ts','preload.js','node'],['src/renderer/main.tsx','ui.js','browser']])esbuild.buildSync({entryPoints:[path.join(repo,entry)],bundle:true,platform,format:platform==='node'?'cjs':undefined,outfile:path.join(temp,file),external:platform==='node'?['electron']:[],logLevel:'silent'});
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="ui.css"></head><body><div id="root"></div><script src="ui.js"></script></body></html>');
  const S=require(path.join(temp,'services.cjs')),checks=[],errors=[];let database,win;
  const check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
  app.whenReady().then(async()=>{
    const workspace=S.ensureWorkspace(path.join(temp,'fixture'));database=new S.DatabaseService(workspace);await database.initialize();
    const db=database.database,date=new Date().toISOString().slice(0,10),now=new Date().toISOString();
    const client=database.crm.createClient({organizationId:database.crm.createOrganization({name:'TEST Phase7'}).id});
    const quote=database.quotes.create({clientAccountId:client.id,subject:'TEST Phase7 — devis'});
    db.run("UPDATE quotes SET status='accepted',catalog_value_cents=50000,contract_value_cents=42000,accepted_at=? WHERE id=?",[now,quote.id]);
    const project=database.projects.createInternal({name:'TEST Phase7 — Projet consolidé'});
    db.run("UPDATE projects SET status='completed',completed_at=?,contract_value_cents=42000,commercial_value_cents=50000 WHERE id=?",[now,project.id]);
    database.projects.addProjectNode(project.id,{name:'TEST production',type:'task',estimatedMinutes:120});
    db.run(`INSERT INTO time_sessions(id,project_id,category,activity_label,started_at,ended_at,billable,source,created_at,updated_at) VALUES('ui-time',?,'development','TEST production',?,?,1,'manual',?,?)`,[project.id,date+'T09:00:00Z',date+'T10:00:00Z',now,now]);
    db.run(`INSERT INTO billing_items(id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,status,invoiced_at,created_at,updated_at) VALUES('ui-invoice',?,'other','TEST','ui-test','TEST facture suivie',42000,'invoiced',?,?,?)`,[client.id,now,now,now]);
    db.run(`INSERT INTO expenses(id,category,label,amount_cents,status,expense_date,created_at,updated_at) VALUES('ui-expense','software','TEST dépense',12000,'committed',?,?,?)`,[date,now,now]);
    check('migrations 1–65',db.all('SELECT id FROM schema_migrations ORDER BY id').map(r=>r.id).join(',')===Array.from({length:65},(_,i)=>i+1).join(','));
    S.registerIpcHandlers(database,workspace);S.registerOperationsIpcHandlers(database);S.registerReferentialsIpcHandlers(database);S.registerBusinessBackupsIpcHandlers(database);S.registerTimeCorrectionIpcHandler(database);
    win=new BrowserWindow({show:false,width:1600,height:1200,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,offscreen:true}});
    win.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)errors.push(event.message);});await win.loadFile(path.join(temp,'index.html'));
    const js=async code=>{const r=await win.webContents.executeJavaScript(`(async()=>{try{return{ok:true,value:await(${code})}}catch(e){return{ok:false,error:e.message}}})()`);if(!r.ok)throw Error(r.error);return r.value;};
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const wait=async code=>{for(let i=0;i<120;i++){if(await js(code))return;await sleep(40);}throw Error('UI timeout '+code);};
    const page=async name=>{await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:${JSON.stringify(name)}}))`);await sleep(100);};
    const click=async(selector)=>{await wait(`!!document.querySelector(${JSON.stringify(selector)})`);await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(100);};
    const shot=async name=>{await sleep(120);fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
    await wait('!!window.atoumweb&&!!document.querySelector(".sidebar")');
    check('analytics + API récentes conservées',await js('!!window.atoumweb.analytics&&!!window.atoumweb.quotePreparation&&!!window.atoumweb.bridgeSnapshots&&!!window.atoumweb.projects.projects.previewQuote'));
    const metrics=await js('window.atoumweb.analytics.financialSnapshot({preset:"month"})');
    check('vraie IPC finance et sources actuelles',metrics.metrics.find(m=>m.key==='invoiced_revenue').currentCents===42000&&metrics.metrics.find(m=>m.key==='expenses').currentCents===12000&&metrics.metrics.find(m=>m.key==='cash_collected').currentCents===null);
    check('vraie IPC rendement', (await js('window.atoumweb.analytics.projectTimeSnapshot({preset:"month"})')).economics.estimateSample===1);
    for(const theme of ['atoumweb','noir','blanc']){
      await page('Réglages');await wait('!!document.querySelector(".theme-card")');
      await js(`[...document.querySelectorAll('.theme-card')].find(b=>b.querySelector('strong').textContent===${JSON.stringify({atoumweb:'AtoumWeb',noir:'Noir',blanc:'Blanc'}[theme])}).click()`);
      await wait(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);
      check(theme+' réglages aides conservés',await js('document.body.innerText.includes("Aides")||document.body.innerText.includes("survol")'));
      await page('Statistiques');await wait('!!document.querySelector(".statistics-tabs")');
      check(theme+' vue consolidée conservée',await js('document.querySelectorAll(".statistics-tabs button").length===5&&document.body.innerText.includes("Facturé suivi")'));
      await shot('statistiques-'+theme);
      await js(`[...document.querySelectorAll('.statistics-tabs button')].find(b=>b.textContent.includes('Rentabilité')).click()`);
      await wait('document.querySelector(".phase7-statistics-hero-score strong")?.textContent==="6/8"');
      for(const selector of ['.phase7-statistics-commercial-section > button','.phase7-statistics-project-time-section > button','.phase7-statistics-section.secondary > button'])await click(selector);
      check(theme+' analyse + rentabilité Phase7',await js('!!document.querySelector(".phase7-statistics-project-time-grid")&&!!document.querySelector(".phase7-statistics-commercial-grid")'));
      await shot('rentabilite-'+theme);
      await js("document.querySelector('.phase7-statistics-project-time-section').scrollIntoView({block:'start'})");await shot('rendement-'+theme);
      await js("document.querySelector('.phase7-statistics-section.secondary').scrollIntoView({block:'start'})");await shot('sources-'+theme);
      await click('.phase7-statistics-expand-button');await wait('!!document.querySelector("[role=dialog]")');check(theme+' détail agrandi',await js('!!document.querySelector(".phase7-statistics-metric-modal")'));await click('[aria-label="Fermer"]');
      for(const [name,selector] of [['Devis','.page-heading'],['Projets','.page-heading'],['Interventions & Maintenance','.page-heading'],['Offres & Tarifs','.page-heading']]){await page(name);await wait(`!!document.querySelector(${JSON.stringify(selector)})`);check(theme+' navigation '+name,await js('!document.querySelector(".renderer-fatal-shell")'));}
      await page('Devis');await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'quote',entityId:${JSON.stringify(quote.id)},title:'TEST'}}))`);await wait('!!document.querySelector(".quote-detail-panel")');check(theme+' Devis historique sans régénération',await js('document.querySelector(".quote-detail-panel").textContent.includes("TEST Phase7")'));await shot('devis-'+theme);
    }
    check('pas de nouvelle migration',db.all('SELECT id FROM schema_migrations').length===65);
    check('intégrité fixture',db.get('PRAGMA integrity_check').integrity_check==='ok');check('FK fixture',db.all('PRAGMA foreign_key_check').length===0);
    check('aucune erreur renderer',errors.length===0);
    process.stdout.write(JSON.stringify({checks:checks.length,errors})+'\n');
  }).catch(error=>{errors.push(error.stack||String(error));process.stderr.write(error.stack+'\n');process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(output,'controle-ui.json'),JSON.stringify({checks,errors},null,2));win?.destroy();database?.close();app.exit(process.exitCode||0);});
}

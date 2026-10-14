// Opt-in native contract recipe on temporary workspaces only. Never starts Manager on Validation-MSI.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-contract-library-')),env={...process.env,ATOUMWEB_CONTRACT_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  try{const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:240000});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;}
  finally{if(path.dirname(path.resolve(temp))===path.resolve(os.tmpdir())&&path.basename(temp).startsWith('atoumweb-contract-library-'))fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}else{
  const {app,BrowserWindow,clipboard,shell,dialog}=require('electron'),args=process.argv.slice(2),temp=process.env.ATOUMWEB_CONTRACT_TEMP;
  const output=args.includes('--output')?path.resolve(args[args.indexOf('--output')+1]):null;
  if(!temp||!output)throw Error('Use node wrapper and --output');fs.mkdirSync(output,{recursive:true});
  app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
  const base=repo.replaceAll('\\','/'),esbuild=require('esbuild'),checks=[],errors=[],opened=[];let database,win,dry;
  const check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
  const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  esbuild.buildSync({stdin:{contents:`export * from '${base}/src/main/database/DatabaseService';export * from '${base}/src/main/database/NodeSqliteAdapter';export * from '${base}/src/main/database/migrations';export * from '${base}/src/main/commercial/ContractTypeService';export * from '${base}/src/main/workspace';export * from '${base}/src/main/ipc';export * from '${base}/src/main/operations/operationsIpc';export * from '${base}/src/main/referentials/referentialsIpc';export * from '${base}/src/main/backups/businessBackupsIpc';export * from '${base}/src/main/time/timeIpc';export * from '${base}/src/main/testSupport/quotePreparationFixture';export * from '${base}/src/shared/contractPresentation';export * from '${base}/src/main/commercial/quotePdf';`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
  for(const [entry,file,platform] of [['src/preload/preload.ts','preload.js','node'],['src/renderer/main.tsx','ui.js','browser']])esbuild.buildSync({entryPoints:[path.join(repo,entry)],bundle:true,platform,format:platform==='node'?'cjs':undefined,outfile:path.join(temp,file),external:platform==='node'?['electron']:[],logLevel:'silent'});
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="ui.css"></head><body><div id="root"></div><script src="ui.js"></script></body></html>');
  const S=require(path.join(temp,'services.cjs'));
  shell.openPath=async p=>{check('OS PDF handoff references an existing isolated file',path.resolve(p).startsWith(path.resolve(temp)+path.sep)&&fs.existsSync(p));opened.push(p);return '';};
  app.whenReady().then(async()=>{
    if(args.includes('--source')){
      const source=path.resolve(args[args.indexOf('--source')+1]);check('Source opt-in is Validation-MSI',path.basename(path.dirname(path.dirname(source)))==='Validation-MSI');
      check('No active WAL frames before physical copy',!fs.existsSync(source+'-wal')||fs.statSync(source+'-wal').size===0);const before=sha(source),copy=path.join(temp,'copie.sqlite');fs.copyFileSync(source,copy);dry=new S.NodeSqliteAdapter(copy);dry.exec('PRAGMA foreign_keys=ON');
      const tables=dry.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t=>t.name),snap=()=>Object.fromEntries(tables.filter(t=>t!=='schema_migrations').map(t=>[t,JSON.stringify(dry.all('SELECT * FROM "'+t+'"'))]));const prior=snap();
      check('Real-copy migration applies only 66',S.applyPendingMigrations(dry).map(m=>m.id).join(',')==='66');check('Real-copy every previous table preserved',JSON.stringify(snap())===JSON.stringify(prior));
      const types=new S.ContractTypeService(dry),init=types.initialize();check('Real-copy 112 bindings',init.linked===112);check('Real-copy drafts only',types.list().every(t=>t.currentVersionId===null&&t.versions.every(v=>v.status==='draft')));
      const full=()=>JSON.stringify(dry.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>[t.name,dry.all('SELECT * FROM "'+t.name+'"')]));const replayBefore=full();check('Real-copy initialization replay neutral',JSON.stringify(types.initialize())===JSON.stringify({created:0,linked:0,unchanged:112})&&full()===replayBefore);
      check('Real-copy migration replay empty',S.applyPendingMigrations(dry).length===0);check('Real-copy references unchanged after initialization',tables.filter(t=>!['schema_migrations','activity_log'].includes(t)).every(t=>JSON.stringify(dry.all('SELECT * FROM "'+t+'"'))===prior[t]));
      check('Real-copy integrity',dry.get('PRAGMA integrity_check').integrity_check==='ok');check('Real-copy FK',dry.all('PRAGMA foreign_key_check').length===0);
      for(const t of ['quotes','projects','prospects','client_accounts','interventions','client_documents'])check('Real-copy no dossier '+t,dry.get('SELECT COUNT(*) AS n FROM '+t).n===0);
      fs.writeFileSync(path.join(output,'simulation-migration66.json'),JSON.stringify({beforeSha:before,initialization:init,types:types.list(),existingTableCount:tables.length,oldTablesUnchanged:true,counts:{clauses:dry.get('SELECT COUNT(*) AS n FROM contract_clause_templates').n,links:dry.get('SELECT COUNT(*) AS n FROM catalog_contract_clause_links').n,catalogue:dry.get('SELECT COUNT(*) AS n FROM catalog_versions').n,models:dry.get('SELECT COUNT(*) AS n FROM operational_model_versions').n},migrationReplay:[],sourceAfter:sha(source)},null,2));dry.close();dry=null;check('Source database SHA unchanged by opt-in simulation',sha(source)===before);
    }
    const workspace=S.ensureWorkspace(path.join(temp,'fixture'));database=new S.DatabaseService(workspace);await database.initialize();const db=database.database;
    const common=database.contractTerms.createTemplate({code:'UI-BASE',title:'CGV communes fixture',scope:'base'},{body:'Texte commun.\n'+Array.from({length:45},(_,i)=>`Paragraphe ${i+1} conservé pour contrôler la lecture scrollable.`).join('\n')});database.contractTerms.publishVersion(common.versions[0].id);
    const m=database.contractTerms.createTemplate({code:'UI-WEB',title:'Module Vitrine fixture',scope:'catalog'},{body:'Module spécifique au site vendu.'});database.contractTerms.publishVersion(m.versions[0].id);
    const refs={};for(const [code,name,family] of [['AW-WEB-VITRINE','Site vitrine fixture','WEB'],['AW-LP-BASE','Landing fixture','LANDING'],['AW-ECOM-BASE','E-commerce fixture','ECOM'],['AW-MARIAGE-HISTOIRE','Mariage fixture','MARIAGE'],['AW-MAINT-WP-M','Maintenance fixture','MAINT']]){
      const i=database.catalog.create({name,category:family,type:'service',canonicalCode:code,identityProvenance:{reference:'Isolated UI fixture'}},{priceMode:'fixed',priceCents:89900,familyCode:family});refs[code]=i;database.contractTerms.setCatalogLinks(m.id,[...database.contractTerms.getTemplate(m.id).catalogItemIds,i.id]);}
    S.registerIpcHandlers(database,workspace);S.registerOperationsIpcHandlers(database);S.registerReferentialsIpcHandlers(database);S.registerBusinessBackupsIpcHandlers(database);S.registerTimeCorrectionIpcHandler(database);
    win=new BrowserWindow({show:false,width:1650,height:1150,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:true,backgroundThrottling:false}});
    win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)errors.push(e.message);});await win.loadFile(path.join(temp,'index.html'));
    const js=async code=>{const r=await win.webContents.executeJavaScript(`(async()=>{try{return{ok:true,value:await new Function('return ('+${JSON.stringify(code)}+')')()}}catch(e){return{ok:false,error:e.message}}})()`);if(!r.ok)throw Error(r.error+' / '+code);return r.value;};
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const wait=async code=>{for(let i=0;i<140;i++){if(await js(code))return;await sleep(40);}throw Error('UI timeout '+code);};
    const click=async label=>{await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled)`);await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled).click()`);await sleep(100);};
    const input=async(label,value)=>{await js(`(()=>{const e=document.querySelector('[aria-label="${label}"]');if(!e)throw Error('Input missing');Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await sleep(90);};
    const shot=async name=>{await sleep(120);fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
    const go=async page=>{await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:${JSON.stringify(page)}}))`);await sleep(100);};
    await wait('!!window.atoumweb&&(!!document.querySelector(".aw-manager-shell")||!!document.querySelector(".renderer-fatal-shell"))');check('05B actual V2 shell mounted',await js('!!document.querySelector(".aw-manager-shell")'));
    for(const theme of ['atoumweb','noir','blanc']){
      await go('Réglages');await wait('!!document.querySelector(".theme-card")');await js(`[...document.querySelectorAll('.theme-card')].find(b=>b.querySelector('strong').textContent===${JSON.stringify({atoumweb:'AtoumWeb',noir:'Noir',blanc:'Blanc'}[theme])}).click()`);await wait(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);
      await go('Documents & Contrats');if(await js('!!document.querySelector(".contract-library")'))await click('Retour aux documents');await click('Bibliothèque contractuelle');check(theme+' library entry',await js('!!document.querySelector(".contract-library")'));
      if(theme==='atoumweb')await click('Initialiser depuis le Catalogue');await wait('document.querySelectorAll(".contract-type-list button").length>=5');
      if(theme==='atoumweb'&&args.includes('--ux05b')){
        // BrowserWindow, vrai IPC UX-01, SQLite et profil TEMP. Dialogues automatises sans mutation de base client.
        const originalDialog=dialog.showMessageBoxSync,dialogs=[];
        let decision=0;
        dialog.showMessageBoxSync=(...params)=>{const options=params.at(-1);if(options?.title==='Modifications non enregistrées'){dialogs.push({labels:options.detail,buttons:options.buttons});return decision;}return originalDialog(...params);};
        try{
          const first=await js('document.querySelector(".contract-type-list button strong")?.textContent');
          const next=await js('document.querySelectorAll(".contract-type-list button strong")[1]?.textContent');
          check('05B distinct contract types',!!first&&!!next&&first!==next);
          await js('document.querySelector(".contract-type-list button").click()');
          await wait(`document.querySelector('[aria-label="Nom du type"]')?.value===${JSON.stringify(first)}`);
          const selected=await js('document.querySelector(".contract-type-list button.active")?.textContent');
          const before=db.get('SELECT COUNT(*) AS n FROM contract_type_versions').n;
          await input('Description du type','DESCRIPTION_NON_ENREGISTREE_05B');
          await wait('!!document.querySelector(".contract-library-unsaved")');
          decision=0;await js('document.querySelectorAll(".contract-type-list button")[1].click()');
          check('05B stay triggers one confirmation',dialogs.length===1&&dialogs[0].buttons.join('|')==='Rester|Quitter sans enregistrer');
          check('05B stay preserves draft',await js('document.querySelector(`[aria-label="Description du type"]`)?.value')==='DESCRIPTION_NON_ENREGISTREE_05B');
          check('05B stay preserves selection',await js('document.querySelector(".contract-type-list button.active")?.textContent')===selected);
          decision=1;await js('document.querySelectorAll(".contract-type-list button")[1].click()');
          await wait(`document.querySelector('[aria-label="Nom du type"]')?.value===${JSON.stringify(next)}`);
          check('05B quit drops unsaved type only',dialogs.length===2&&db.get('SELECT COUNT(*) AS n FROM contract_type_versions').n===before);
          const clausesBefore=db.get('SELECT COUNT(*) AS n FROM contract_clause_templates').n;
          await click('Nouveau module');await input('Code du module','UNSAVED-05B');
          await wait('!!document.querySelector(".contract-library-unsaved")');
          decision=0;await click('Nouveau module');
          check('05B stay preserves new module',dialogs.length===3&&await js('!!document.querySelector(`[aria-label="Code du module"]`)'));
          decision=1;await click('Nouveau module');
          check('05B quit discards new module only',dialogs.length===4&&!await js('!!document.querySelector(`[aria-label="Code du module"]`)')&&db.get('SELECT COUNT(*) AS n FROM contract_clause_templates').n===clausesBefore);
          await input('Consulter un module',m.id);await wait('!!document.querySelector(`[aria-label="Texte du module à versionner"]`)');
          const oldBody=await js('document.querySelector(`[aria-label="Texte du module à versionner"]`).value');
          await input('Texte du module à versionner','UNSAVED_BODY_05B');
          await wait('!!document.querySelector(".contract-library-unsaved")');
          decision=0;await input('Consulter un module',common.id);
          check('05B stay preserves clause text',dialogs.length===5&&await js('document.querySelector(`[aria-label="Texte du module à versionner"]`)?.value')==='UNSAVED_BODY_05B');
          decision=1;await input('Consulter un module',common.id);
          await wait(`document.querySelector('[aria-label="Consulter un module"]')?.value===${JSON.stringify(common.id)}`);
          check('05B quit cannot rewrite clause version',dialogs.length===6&&database.contractTerms.getTemplate(m.id).currentVersion.body===oldBody);
          // 05B.3 : une sortie vers Catalogue ne doit pas court-circuiter UX-01.
          const serviceLinks=await js('document.querySelectorAll(".contract-associated-services button").length');
          check('05B.3 Catalogue link available in fixture',serviceLinks>0);
          await js('(()=>{window.__contract05b3Events=0;window.addEventListener("atoumweb:open-catalog-item",()=>window.__contract05b3Events++);return true;})()');
          const commonBody=await js('document.querySelector(`[aria-label="Texte du module à versionner"]`).value');
          await input('Texte du module à versionner','UNSAVED_CATALOG_NAV_05B3');
          await wait('!!document.querySelector(".contract-library-unsaved")');
          decision=0;
          await js('document.querySelector(".contract-associated-services button").click()');
          check('05B.3 stay intercepts external Catalog navigation',dialogs.length===7&&await js('window.__contract05b3Events')===0);
          check('05B.3 stay retains module draft',await js('document.querySelector(`[aria-label="Texte du module à versionner"]`).value')==='UNSAVED_CATALOG_NAV_05B3');
          await input('Texte du module à versionner',commonBody);
          await wait('!document.querySelector(".contract-library-unsaved")');
          console.log('[05B UX-01 NATIVE] '+JSON.stringify({dialogs:dialogs.length,checks:checks.length,sqlite:'TEMP'}));
        }finally{dialog.showMessageBoxSync=originalDialog;}
      }
      if(theme==='atoumweb'&&args.includes('--ux05b')){
        check('05B.2 both library clause groups visible',await js('document.querySelectorAll(".contract-clause-navigation-group").length')===2);
        await input('Rechercher une clause','UI-WEB');
        check('05B.2 search by real clause code',await js('[...document.querySelectorAll(".contract-clause-navigation-entry")].length')===1);
        await js('document.querySelector(".contract-clause-navigation-entry").click()');
        await wait('!!document.querySelector(".contract-module-editor")');
        check('05B.2 direct clause navigation preserves identity',await js('document.querySelector(".contract-module-editor h3")?.textContent')==='Module Vitrine fixture');
        await input('Rechercher une clause','');
        // 05C : filtres de lecture, sans changement des clauses en base ni navigation implicite.
        const canonicalBefore=JSON.stringify(database.contractTerms.listTemplates(true));
        await input('Filtrer famille de clauses','base');
        check('05C common clauses only',await js('[...document.querySelectorAll(".contract-clause-navigation-entry")].every(e=>e.textContent.includes("UI-BASE"))'));
        check('05C common clause visible',await js('document.querySelectorAll(".contract-clause-navigation-entry").length')===1);
        await input('Filtrer famille de clauses','catalog');
        check('05C service clause visible',await js('document.querySelectorAll(".contract-clause-navigation-entry").length')===1);
        await input('Filtrer public de clauses','professional');
        check('05C all-audience clauses remain visible for professionals',await js('document.querySelectorAll(".contract-clause-navigation-entry").length')===1);
        await input('Filtrer public de clauses','consumer');
        check('05C all-audience clauses remain visible for consumers',await js('document.querySelectorAll(".contract-clause-navigation-entry").length')===1);
        await input('Filtrer famille de clauses','all');await input('Filtrer public de clauses','all');
        check('05C all clauses restored after clearing filters',await js('document.querySelectorAll(".contract-clause-navigation-entry").length')===2);
        check('05C no canonical clause mutation',JSON.stringify(database.contractTerms.listTemplates(true))===canonicalBefore);

      }
      const names=await js('[...document.querySelectorAll(".contract-type-list button strong")].map(e=>e.textContent)');check(theme+' types alphabetical',JSON.stringify(names)===JSON.stringify([...names].sort((a,b)=>a.localeCompare(b,'fr'))));
      const initialTypes=database.contractTypes.list();
      for(const t of initialTypes){
        await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-contract-library',{detail:${JSON.stringify(t.id)}}))`);await wait(`document.querySelector('[aria-label="Nom du type"]')?.value===${JSON.stringify(t.versions[0].name)}`);
        await click('Voir le contrat type assemblé');await wait('!!document.querySelector(".contract-type-preview .contract-read-panel")');
        check(theme+' contract base preview '+t.code,await js('document.querySelector(".contract-type-preview .contract-reading-scroll").textContent.includes("CGV communes")'));
        if(t.code==='VITRINE'){await input('Client du contrat type','consumer');await wait('document.querySelector(".contract-type-preview .contract-reading-scroll").textContent.includes("Particulier / consommateur")');await js('document.querySelector(".contract-type-preview").scrollIntoView({block:"start"})');await shot('socle-vitrine-'+theme);}
      }
      check(theme+' type previews create no dossier',db.get('SELECT COUNT(*) AS n FROM quotes').n===(['atoumweb','noir','blanc'].indexOf(theme))&&db.get('SELECT COUNT(*) AS n FROM projects').n===0);
      await input('Rechercher un type de contrat','Landing');check(theme+' type search',await js('document.querySelectorAll(".contract-type-list button").length===1'));await input('Rechercher un type de contrat','');
      await click('Nouveau module');await input('Code du module','UI-'+theme.toUpperCase());await input('Titre du module','Module recette '+theme);await input('Texte du nouveau module','Texte initial '+theme);await click('Enregistrer le module en brouillon');
      let module=database.contractTerms.listTemplates().find(c=>c.code==='UI-'+theme.toUpperCase());check(theme+' new module draft',module.currentVersionId===null&&module.versions[0].status==='draft');
      await wait('!!document.querySelector(`[aria-label="Texte du module à versionner"]`)');await input('Texte du module à versionner','Texte adapté '+theme);await click('Créer la nouvelle version du module');await wait('document.querySelector(`[aria-label="Version du module"]`).options.length===2');await click('Publier la version du module');
      module=database.contractTerms.getTemplate(module.id);check(theme+' module versions',module.versions.length===2&&module.currentVersion.body==='Texte adapté '+theme);
      await click('Nouveau type de contrat');await input('Code du type','UI-TYPE-'+theme.toUpperCase());await input('Nom du type','Type recette '+theme);await input('Description du type','Composition explicite');await input('Rattacher un module existant',m.id);await input('Rattacher un module existant',module.id);
      await js(`document.querySelector('[aria-label="Monter ${module.code}"]').click()`);await sleep(50);await click('Enregistrer le type en brouillon');
      let type=database.contractTypes.list().find(t=>t.code==='UI-TYPE-'+theme.toUpperCase());check(theme+' creation and module reordering',type.versions[0].moduleIds.join(',')===[module.id,m.id].join(','));
      await wait('!!document.querySelector(`[aria-label="Description du type"]`)');await input('Description du type','Description modifiée');await click('Enregistrer le type en brouillon');check(theme+' edit type draft',database.contractTypes.get(type.id).versions[0].description==='Description modifiée');
      await click('Publier la version du type');await wait('document.querySelector(`[aria-label="Version du type"]`).selectedOptions[0].textContent.includes("Publiée")');type=database.contractTypes.get(type.id);
      // Attach to a fresh draft catalogue version, never edit the published commercial reference.
      const original=refs['AW-WEB-VITRINE'],v=database.catalog.createVersion(original.id,{priceMode:'fixed',priceCents:89900,familyCode:'WEB'});database.contractTypes.setCatalog(v.id,[type.id]);database.contractTerms.setCatalogLinks(module.id,[original.id]);database.catalog.publishVersion(v.id);
      await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-contract-library',{detail:${JSON.stringify(type.id)}}))`);await click('Retour aux documents');await click('Bibliothèque contractuelle');await wait('!!document.querySelector(".contract-associated-services button")');
      const services=await js('[...document.querySelectorAll(".contract-associated-services button")].map(e=>e.textContent)');check(theme+' linked service visible',services.some(s=>s.includes('Site vitrine fixture')));
      await js('document.querySelector(".contract-associated-services button").click()');await wait('!!document.querySelector(".catalog-detail-panel")&&!!document.querySelector(`[aria-label="Version Catalogue contractuelle"]`)');check(theme+' type to service navigation',await js('document.body.innerText.includes("Références contractuelles")'));
      await click('Ouvrir le type et ses modules');await wait(`document.querySelector('[aria-label="Nom du type"]')?.value===${JSON.stringify(type.currentVersion.name)}`);check(theme+' service to type navigation',await js(`document.querySelector('[aria-label="Nom du type"]').value===${JSON.stringify(type.currentVersion.name)}`));
      await input('Consulter un module',module.id);await wait(`document.querySelector('.contract-module-text')?.textContent===${JSON.stringify(module.currentVersion.body)}`);check(theme+' individual complete module',await js(`document.querySelector('.contract-module-text').textContent`)===module.currentVersion.body);
      await click('Nouvelle version du type');await wait('document.querySelector(`[aria-label="Version du type"]`).options.length===2');
      await click('Retirer de la composition');await click('Enregistrer le type en brouillon');
      check(theme+' remove from draft retains global clause and service trigger',database.contractTypes.get(type.id).versions[0].moduleIds.length===1&&database.contractTerms.getTemplate(module.id).catalogItemIds.includes(original.id));
      await input('Version du type',type.currentVersionId);check(theme+' previous type composition accessible',await js('document.querySelectorAll(".contract-type-detail fieldset .contract-module-row").length')===2);
      await shot('bibliotheque-'+theme);
      await js('document.querySelector(".contract-module-editor").scrollIntoView({block:"start"})');await shot('module-'+theme);
      const org=database.crm.createOrganization({name:'TEST isolé '+theme}),prospect=database.crm.createProspect({organizationId:org.id,primaryNeed:'Site'}),q=database.quotes.create({prospectId:prospect.id,subject:'TEST contrat '+theme});database.quotes.addCatalogLine(q.id,v.id);
      const rawBefore=db.get('SELECT contract_parameters_json FROM quotes WHERE id=?',[q.id]);
      await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'quote',entityId:${JSON.stringify(q.id)},title:'TEST'}}))`);await wait('!!document.querySelector(".quote-finalization-check [data-issue-code]")');
      const blocking=database.quotePreparation.get(q.id).issues.filter(i=>i.severity==='blocking');
      for(const issue of blocking){
        if(issue.code==='PUBLISHED_BASE_MISSING')continue;
        await js(`(()=>{document.querySelectorAll('.quote-contract-preparation details').forEach(d=>d.open=false);document.querySelector('.quote-finalization-check [data-issue-code="${issue.code}"]').click()})()`);
        check(theme+' issue shortcut '+issue.code,await js('(()=>{const e=document.activeElement;return !!e.dataset.contractField&&!e.disabled&&[...e.closest(".quote-contract-preparation").querySelectorAll("details")].filter(d=>d.contains(e)).every(d=>d.open)})()'));
      }
      check(theme+' shortcuts do not change quote data',JSON.stringify(db.get('SELECT contract_parameters_json FROM quotes WHERE id=?',[q.id]))===JSON.stringify(rawBefore));
      check(theme+' finalization disabled while decisions missing',await js('document.querySelector(".quote-finalization-check .primary-button").disabled'));
      await js('document.querySelector(".quote-finalization-check").scrollIntoView({block:"center"})');await shot('points-a-completer-'+theme);
      S.prepareQuoteForTest(db,q.id);await go('Accueil');
      await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'quote',entityId:${JSON.stringify(q.id)},title:'TEST'}}))`);await wait('!!document.querySelector(".contract-reading-scroll")');await wait('document.querySelector(".contract-reading-scroll").textContent.includes("Paramètres contractuels du devis")');
      const presentation=database.contractTerms.presentation(q.id);for(const label of ['Copier pour Abby','Copier le contrat','Copier tout']){await click(label);await wait(`document.querySelector('.contract-read-panel')?.textContent.includes(${JSON.stringify(label==='Copier pour Abby'?'Contenu pour Abby copié.':label==='Copier le contrat'?'Contrat copié.':'Bloc commercial et contrat copié.')})`);const text=await clipboard.readText();fs.writeFileSync(path.join(output,'expected-copy.txt'),presentation.text);fs.writeFileSync(path.join(output,'actual-copy.txt'),text);check(theme+' '+label,label==='Copier tout'?text.endsWith(presentation.text)&&text.includes('Total devis :'):text===presentation.text);check(theme+' copy has no presentation HTML '+label,!text.includes('<section class='));}
      await click('Copier cette section');await wait(`document.querySelector('.contract-read-panel')?.textContent.includes('Section copié.')`);check(theme+' section copy exact',await clipboard.readText()===presentation.sections[0].title+'\n\n'+presentation.sections[0].text);
      check(theme+' actual scroll overflows',await js('(()=>{const e=document.querySelector(".contract-reading-scroll");return e.scrollHeight>e.clientHeight})()'));
      await js('document.querySelector(".contract-reading-scroll").scrollTop=400');check(theme+' scroll works',await js('document.querySelector(".contract-reading-scroll").scrollTop>0'));
      await js('document.querySelector(".contract-read-panel").scrollIntoView({block:"start"})');await shot('contrat-'+theme);
      await click('Prévisualiser côté client');await wait('!!document.querySelector(".quote-client-preview")');check(theme+' same client contract sections',await js('document.querySelector(".quote-client-preview .contract-reading-scroll").textContent.includes("Texte adapté '+theme+'")'));await shot('client-'+theme);await click('Fermer');
      const frozen=S.finalizeForTest(db,database.quotes,q.id),frozenBefore=frozen.contractSnapshotJson;database.quotes.markSent(q.id);S.acceptForTest(db,database.quotes,q.id);
      const newer=database.contractTerms.createVersion(module.id,{body:'NOUVEAU TEXTE APRES ACCEPTATION '+theme});database.contractTerms.publishVersion(newer.id);
      check(theme+' snapshot unchanged',database.quotes.get(q.id).contractSnapshotJson===frozenBefore&&database.contractTerms.presentation(q.id).text.includes('Texte adapté '+theme));
      const acceptedQuote=database.quotes.get(q.id);
      check(theme+' acceptance preserves frozen snapshot and timestamp',acceptedQuote.contractSnapshotJson===frozenBefore&&!!acceptedQuote.finalizedAt);
      check(theme+' accepted contract excludes future clause library updates',!database.contractTerms.presentation(q.id).text.includes('NOUVEAU TEXTE APRES ACCEPTATION '+theme));
      check(theme+' accepted contract remains non-editable',acceptedQuote.status!=='draft');
      const fp=database.contractTerms.presentation(q.id),pdfHtml=S.buildQuoteHtml(database.quotes.get(q.id),fp);check(theme+' PDF common presentation',fp.sections.every(s=>pdfHtml.includes(s.title))&&!pdfHtml.includes('NOUVEAU TEXTE APRES ACCEPTATION '+theme));
      const pdf=await js(`window.atoumweb.quotes.generatePdf(${JSON.stringify(q.id)})`);dialog.showOpenDialog=async()=>({canceled:false,filePaths:[pdf.path]});
      await js(`window.atoumweb.quotes.importContractDocument(${JSON.stringify(q.id)},'TEST')`);await js(`window.atoumweb.quotes.openContractDocument(${JSON.stringify(q.id)})`);check(theme+' PDF system reader endpoint exercised',opened.length>0);
      database.contractTypes.setStatus(type.id,'archived');check(theme+' archive preserves versions',database.contractTypes.list().every(t=>t.id!==type.id)&&database.contractTypes.list(true).some(t=>t.id===type.id));
    }
    check('Fixture migrations 1–66',db.all('SELECT id FROM schema_migrations ORDER BY id').map(r=>r.id).join(',')===Array.from({length:66},(_,i)=>i+1).join(','));check('Fixture integrity',db.get('PRAGMA integrity_check').integrity_check==='ok');check('Fixture FK',db.all('PRAGMA foreign_key_check').length===0);check('No renderer errors',errors.length===0);
    process.stdout.write(JSON.stringify({checks:checks.length,errors})+'\n');
  }).catch(async e=>{errors.push(e.stack||String(e));process.stderr.write(e.stack+'\n');process.stderr.write('Renderer console errors: '+JSON.stringify(errors)+'\n');if(win){try{process.stderr.write('Renderer body on failure: '+String(await win.webContents.executeJavaScript('document.body?.innerText||""')).slice(0,3200)+'\n');}catch(debugError){process.stderr.write('Cannot inspect renderer: '+String(debugError)+'\n');}fs.writeFileSync(path.join(output,'failed-screen.png'),(await win.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(output,'failed-screen.txt'),await win.webContents.executeJavaScript('document.body.innerText'));}process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(output,'controle-ui.json'),JSON.stringify({checks,errors,temporaryWorkspace:true,shellOpening:'Real IPC handoff intercepted at OS boundary only'},null,2));win?.destroy();dry?.close();database?.close();app.exit(process.exitCode||0);});
}

// Opt-in integration on the explicitly authorized nonproductive development workspace.
// Real App, preload, IPC and business services; no operational-recipe bank or mocked business API.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const managedTemp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-native-ui-'));
 const env={...process.env,ATOUMWEB_NATIVE_UI_TEMP:managedTemp};delete env.ELECTRON_RUN_AS_NODE;
 const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:3600000});
 try{process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;}finally{if(path.resolve(managedTemp).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(managedTemp).startsWith('atoumweb-native-ui-'))fs.rmSync(managedTemp,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}else{
 const {app,BrowserWindow,clipboard,dialog}=require('electron'),args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1];
 if(!args.includes('--development-confirmed')||!args.includes('--workspace')||!args.includes('--output'))throw Error('Explicit development confirmation, workspace and output required');
 const workspace=path.resolve(option('--workspace')),output=path.resolve(option('--output'));
 if(path.basename(workspace)!=='Validation-MSI')throw Error('Only Validation-MSI development is authorized');
 fs.mkdirSync(output,{recursive:true});const temp=process.env.ATOUMWEB_NATIVE_UI_TEMP;if(!temp)throw Error('Run with node wrapper');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 const base=repo.replaceAll('\\','/'),esbuild=require('esbuild');
 esbuild.buildSync({stdin:{contents:`export * from '${base}/src/main/database/DatabaseService';export * from '${base}/src/main/workspace';export * from '${base}/src/main/ipc';export * from '${base}/src/main/operations/operationsIpc';export * from '${base}/src/main/referentials/referentialsIpc';export * from '${base}/src/main/backups/businessBackupsIpc';export * from '${base}/src/main/time/timeIpc';export * from '${base}/src/shared/quoteContractPreparation';`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
 esbuild.buildSync({entryPoints:[path.join(repo,'src/preload/preload.ts')],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'preload.js'),external:['electron'],logLevel:'silent'});
 esbuild.buildSync({entryPoints:[path.join(repo,'src/renderer/main.tsx')],bundle:true,platform:'browser',outfile:path.join(temp,'ui.js'),logLevel:'silent'});
 fs.writeFileSync(path.join(temp,'index.html'),'<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; style-src \'self\' \'unsafe-inline\'"><link rel="stylesheet" href="ui.css"></head><body><div id="root"></div><script src="ui.js"></script></body></html>');
 const S=require(path.join(temp,'services.cjs')),results=[],checks=[],errors=[];let database,win;
 const check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error('Failed: '+name);};
 const persist=()=>fs.writeFileSync(path.join(output,'recette-native.json'),JSON.stringify({checks,results,errors},null,2));
 app.whenReady().then(async()=>{
  const paths=S.ensureWorkspace(workspace);database=new S.DatabaseService(paths);await database.initialize();
  S.registerIpcHandlers(database,paths);S.registerOperationsIpcHandlers(database);S.registerReferentialsIpcHandlers(database);S.registerBusinessBackupsIpcHandlers(database);S.registerTimeCorrectionIpcHandler(database);
  win=new BrowserWindow({show:true,title:'AtoumWeb Manager — TEST recette automatisée',width:1500,height:1100,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  win.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)errors.push(event.message);});await win.loadFile(path.join(temp,'index.html'));
  const js=async code=>{const result=await win.webContents.executeJavaScript(`(async()=>{try{return{ok:true,value:await(${code})}}catch(e){return{ok:false,error:e.message||String(e)}}})()`);if(!result.ok){errors.push('Failed renderer expression: '+code);throw Error(result.error);}return result.value;},sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const call=async(method,...values)=>{const response=await js(`(async()=>{try{return{ok:true,value:await window.atoumweb.${method}(...${JSON.stringify(values)})}}catch(e){return{ok:false,error:e.message||String(e)}}})()`);if(!response.ok)throw Error(response.error);return response.value;};
  const wait=async code=>{for(let i=0;i<100;i++){if(await js(code))return;await sleep(40);}throw Error('UI timeout '+code+' / '+await js("[...document.querySelectorAll('.form-error')].map(e=>e.textContent).join(' | ')"));};
  const click=async(text,selector='button')=>{await wait(`[...document.querySelectorAll(${JSON.stringify(selector)})].some(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled)`);await js(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)return false;b.scrollIntoView({block:'center'});b.click();return true;})()`);await sleep(100);};
  const input=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await sleep(50);};
  const navigate=async(type,id)=>{await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:${JSON.stringify({entityType:type,entityId:id,title:'TEST'})}}))`);await sleep(150);};
  const openQuote=async quote=>{await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:'Accueil'}))`);await sleep(60);await navigate('quote',quote.id);await wait(`document.querySelector('.quote-detail-panel h2')?.textContent===${JSON.stringify(quote.subject)}`);};
  await wait('!!window.atoumweb && document.body.innerText.includes("DÉVELOPPEMENT")');
  await js("(()=>{window.confirm=()=>true;return true;})()"); // Explicit TEST operator acknowledgement; backend guards remain real.
  check('Native Manager API, no isolated recipe API',await js('!!window.atoumweb.quotes&&!window.atoumwebOperationalRecipe'));
  const admin=S.emptyAdministration();for(const key of Object.keys(admin))admin[key]={state:'filled',value:`TEST — ${key} fictif, non utilisable dans un dossier réel`,reason:'Recette de développement autorisée'};await call('quotePreparation.saveAdministration',admin);
  const catalog=await call('catalog.list',{status:'active'}),references=catalog.filter(item=>item.canonicalCode?.startsWith('AW-'));
  check('112 native selectable canonical references',references.length===112&&references.every(item=>item.currentVersion.status==='published'));
  const parameters=async quote=>{
   const p=S.emptyContractParameters(quote.contractAudience,quote.depositPercent);
   p.conclusion={...p.conclusion,channel:'on_premises',context:'TEST — faux dossier en établissement',purchasePurpose:'Recette de développement'};
   p.digital={...p.digital,kinds:['classical_service'],supply:'one_off',delivery:'TEST livraison explicitement convenue',qualificationReason:'Qualification fictive pour tester le parcours, non validation juridique de la prestation'};
   p.rights.reviewed=true;p.renewal.reviewed=true;p.milestones=[{label:'TEST livraison',date:'2027-06-01'}];
   p.payment.milestones=p.payment.milestones.map((m,i)=>({...m,event:i===0?'TEST commande':'TEST livraison'}));
   p.warranties=quote.lines.map(l=>({lineId:l.id,kind:'not_applicable',days:null,startEvent:'',statutoryRightsUnaffected:true}));
   if(p.audience==='consumer')p.consumer.informationDelivered=true;
   await call('quotePreparation.save',quote.id,p);
  };
  const newQuote=async(code,clientId)=>{
   let owner={clientAccountId:clientId};if(!clientId){const org=await call('crm.organizations.create',{name:`TEST — ${code} — ${new Date().toISOString()}`});const prospect=await call('crm.prospects.create',{organizationId:org.id,primaryNeed:`TEST ${code}`});owner={prospectId:prospect.id};}
   return call('quotes.create',{...owner,subject:`TEST — recette ${code} — ${Date.now()}`,contractAudience:code.includes('MARIAGE')?'consumer':'professional'});
  };
  const addUI=async(quote,code,quantity=1)=>{
   await input('[aria-label="Rechercher dans le catalogue"]',code);const item=references.find(r=>r.canonicalCode===code);if(!item)throw Error('Unknown canonical '+code);
   await input('.quote-add-line select',item.currentVersion.id);await input('[aria-label="Prix proposé pour la prestation"]',item.currentVersion.priceCents==null?'100':'');
   const prior=(await call('quotes.get',quote.id)).lines.length;await click('Ajouter une ligne');
   await wait(`document.querySelectorAll('.quote-lines .quote-line-block').length===${prior+1}`);
   let updated=await call('quotes.get',quote.id);
   if(quantity!==1){
     const blocks=await js(`document.querySelectorAll('.quote-lines .quote-line-block').length`);
     await js(`document.querySelectorAll('.quote-lines .quote-line-actions button[title=Modifier]')[${blocks-1}].click()`);await sleep(60);
     await input('.quote-line-editor label:nth-child(2) input',String(quantity));await click('Enregistrer la ligne','.quote-line-editor button');await sleep(100);updated=await call('quotes.get',quote.id);
   }
   return updated;
  };
  const prepareUI=async quote=>{await click('Vérifier le plan sans créer de Projet');await wait('document.querySelector(".quote-project-create [role=status]")!==null');await click('Préparer le Projet');await wait(`document.querySelector('[aria-label="Périmètre commercial du Projet"]')!==null`);return call('quotes.get',quote.id);};
  const acceptUI=async quote=>{
   await parameters(await call('quotes.get',quote.id));await openQuote(await call('quotes.get',quote.id));
   await click('Finaliser le devis','.quote-detail-panel button');await wait(`[...document.querySelectorAll('.quote-detail-panel button')].some(b=>b.textContent==='Marquer envoyé')`);
   await click('Marquer envoyé','.quote-detail-panel button');await wait(`document.querySelector('.quote-detail-panel .quote-status')?.textContent==='Envoyé'`);
   await call('quotePreparation.recordAcceptance',quote.id,'TEST — acceptation explicite fictive, aucune signature réelle',new Date().toISOString(),'Recette native');
   await click('Valider','.quote-detail-panel button');await wait(`document.querySelector('.quote-detail-panel .quote-status')?.textContent==='Accepté'`);return call('quotes.get',quote.id);
  };
  // A real fake Prospect -> Quote -> provisional Project -> same frozen Project, used as operational context.
  let seed=await newQuote('CONTEXTE-WOO');await openQuote(seed);seed=await addUI(seed,'AW-ECOM-BASE');seed=await prepareUI(seed);const seedProjectId=seed.projectId;seed=await acceptUI(seed);
  check('Native seed Prospect conversion, same Project',seed.projectId===seedProjectId&&!!seed.acceptedClientAccountId);
  const contextSite=(await call('projects.sites.list',seed.projectId))[0];
  const contextProject=await call('projects.projects.addNode',seed.projectId,{type:'module',name:'TEST — contexte logiciel / document',estimatedMinutes:0});const contextNode=contextProject.nodes.find(n=>n.name==='TEST — contexte logiciel / document');
  const clientId=seed.acceptedClientAccountId,codeFilter=args.includes('--codes')?option('--codes').split(','):null;
  const mainGbpProject=await call('projects.projects.addNode',seed.projectId,{type:'module',name:'TEST — établissement GBP principal'}),mainGbpNode=mainGbpProject.nodes.find(n=>n.name==='TEST — établissement GBP principal');
  const extraGbpProject=await call('projects.projects.addNode',seed.projectId,{type:'module',name:'TEST — établissement GBP supplémentaire'}),extraGbpNode=extraGbpProject.nodes.find(n=>n.name==='TEST — établissement GBP supplémentaire');
  let gbp=await newQuote('GBP-PRINCIPAL-DE-CONTEXTE',clientId);await openQuote(gbp);gbp=await addUI(gbp,'AW-SEO-GBP-M');
  await call('quotes.setLineParameters',gbp.lines[0].id,{serviceStartDate:new Date().toISOString().slice(0,10),periodAlignment:'anniversary',operationalProjectId:seed.projectId,contextNodeId:mainGbpNode.id});
  gbp=await acceptUI(gbp);const principalGbpSale=(await call('quotes.operationalSales',gbp.id))[0];

  for(const item of references.filter(item=>!codeFilter||codeFilter.includes(item.canonicalCode))){
   const code=item.canonicalCode,result={code,name:item.name,status:'OK',proof:[],quoteId:null,projectId:null};
   try{
    let quote=await newQuote(code,clientId);result.quoteId=quote.id;await openQuote(quote);
    const source=database.database.get(`SELECT l.*,m.model_json FROM catalog_operational_links l JOIN operational_model_versions m ON m.id=l.model_version_id WHERE l.catalog_version_id=? AND l.status='ready' ORDER BY l.revision DESC LIMIT 1`,[item.currentVersion.id]);
    const config=JSON.parse(source.provenance_json),model=JSON.parse(source.model_json),rules=JSON.parse(fs.readFileSync(path.join(repo,'data/catalogue/atoumweb-commercial-complements-v1.json'),'utf8')).rules[code];
    let parent=null;
    if(rules?.attachment){quote=await addUI(quote,rules.attachment.compatibleCodes[0]);parent=quote.lines[0];}
    else if(config.configuration?.structureClass==='B') {const baseCode=config.configuration.requires.includes('woocommerce')?'AW-ECOM-BASE':code.startsWith('AW-LP-')?'AW-LP-BASE':'AW-WEB-VITRINE';quote=await addUI(quote,baseCode);}
    quote=await addUI(quote,code);const line=quote.lines.at(-1);result.lineId=line.id;
    check(code+' native code/version label',await js(`document.querySelector('.quote-lines').innerText.includes(${JSON.stringify(code)})`));
    check(code+' Abby commercial native text',await js(`document.querySelector('[aria-label="Bloc commercial Abby"]').value.includes(${JSON.stringify(code)})`));
    const params={};if(rules?.attachment){params.parentLineId=parent.id;if(rules.attachment.kind==='priority'){params.requestedDeadline='2027-02-01T10:00';params.availabilityConfirmed=true;params.acceptedDeadline='2027-02-02T10:00';}}
    if(model.estimateRequired){params.scope='TEST — périmètre spécifique décrit';params.currentEstimateMinutes=model.referenceMinutes+240;params.productionPlan='TEST — production complémentaire et contrôle définis explicitement pour ce dossier';}
    if(model.lot==='8B'){params.serviceStartDate=new Date().toISOString().slice(0,10);params.periodAlignment='anniversary';params.operationalProjectId=seed.projectId;if(config.operations.targetRequirement==='site')params.siteId=contextSite.id;else if(config.operations.targetRequirement==='context')params.contextNodeId=code.startsWith('AW-SEO-GBP-')?(config.operations.kind==='recurring_addon'?extraGbpNode.id:mainGbpNode.id):contextNode.id;if(config.operations.kind==='recurring_addon')params.parentOperationalSaleId=principalGbpSale.id;if(config.operations.setupEstimateRequired)params.setupEstimateMinutes=60;}
    if(Object.keys(params).length)await call('quotes.setLineParameters',line.id,params);
    if(parent?.snapshot?.operational?.lot==='8B')await call('quotes.setLineParameters',parent.id,{serviceStartDate:new Date().toISOString().slice(0,10),periodAlignment:'anniversary',operationalProjectId:seed.projectId,siteId:contextSite.id});
    const build=await call('contractTerms.quotes.sync',quote.id);check(code+' base clauses',build.clauses.some(c=>c.sourceKind==='base'&&c.enabled));
    result.clauses=build.clauses.filter(c=>c.enabled).map(c=>c.title);result.proof.push('Ajout par sélection native ; snapshot AW/version/prix ; clauses compilées ; bloc Abby');
    if(code==='AW-MARIAGE-HISTOIRE')check('Histoire particular conditions present',build.clauses.some(c=>c.title==='Conditions particulières — Mariage Histoire'&&c.body.includes('soixante jours')));
    const prepareProject=model.lot==='8A'&&!(rules?.attachment?.kind==='priority'&&parent?.snapshot?.operational?.lot==='8B');
    if(prepareProject){
     quote=await prepareUI(await call('quotes.get',quote.id));result.projectId=quote.projectId;let project=await call('projects.projects.get',quote.projectId),scope=await call('projects.projects.commercialScope',quote.projectId);
     if(scope.targets.some(t=>t.state==='pending')){
      const pending=scope.targets.filter(t=>t.state==='pending');let site=scope.targetChoices.sites[0];
      if(pending.some(t=>t.kind!=='context')&&!site){site=await call('projects.sites.create',quote.projectId,{name:'TEST — Site explicitement choisi pour recette'});}
      let page=(await call('projects.sites.listPages',quote.projectId))[0];
      if(pending.some(t=>t.kind==='page')&&!page){project=await call('projects.projects.addNode',quote.projectId,{type:'module',displaySubtype:'page',name:'TEST — Page parente explicitement choisie'});const node=project.nodes.find(n=>n.name==='TEST — Page parente explicitement choisie');page=await call('projects.sites.linkPage',site.id,node.id,{desiredPath:'/test/'});}
      let context=null;if(pending.some(t=>t.kind==='context')){project=await call('projects.projects.addNode',quote.projectId,{type:'module',name:'TEST — contexte opérationnel'});context=project.nodes.find(n=>n.name==='TEST — contexte opérationnel');}
      for(const target of pending){scope=await call('projects.projects.commercialScope',quote.projectId);const selected=scope.targetChoices.sites.find(s=>target.requires.every(r=>s.provides.includes(r)));
       await call('projects.projects.assignTarget',quote.projectId,{lineOrigin:target.lineOrigin,slot:target.slot,unitIndex:target.unitIndex,siteId:target.kind==='context'?null:selected.id,siteOwnerOrigin:selected?.ownerOrigin||null,siteOwnerSlot:selected?.ownerSlot||null,pageNodeId:target.kind==='page'?page.projectNodeId:null,contextNodeId:target.kind==='context'?context.id:null,author:'TEST — opérateur recette'});
      }
     }
     if(model.estimateRequired){project=await call('projects.projects.get',quote.projectId);for(const node of project.nodes.filter(n=>n.operational?.code===code&&n.operational.action))await call('projects.projects.updateNode',node.id,{estimatedMinutes:node.operational.unitMinutes});await call('projects.projects.addNode',quote.projectId,{type:'task',name:'TEST — production spécifique décidée pour ce dossier',estimatedMinutes:240});}
     const beforeSync=(await call('projects.projects.get',quote.projectId)).nodes.map(n=>n.id);await call('projects.projects.syncCommercial',quote.projectId);check(code+' stable synchronization',JSON.stringify(beforeSync)===JSON.stringify((await call('projects.projects.get',quote.projectId)).nodes.map(n=>n.id)));
     result.sites=(await call('projects.sites.list',quote.projectId)).length;result.pages=(await call('projects.sites.listPages',quote.projectId)).length;result.actions=(await call('projects.projects.get',quote.projectId)).nodes.filter(n=>n.operational?.action&&n.operational.code===code).length;
     if(config.configuration?.structureClass==='C'&&!parent)check(code+' no fake Site/Page',result.sites===0&&result.pages===0);
     if(rules?.attachment?.kind==='priority')check(code+' no autonomous production',result.actions===0);
     result.proof.push('Prévisualisation et préparation depuis les boutons natifs ; cibles explicites ; rejeu sans doublon');
    }
    await openQuote(await call('quotes.get',quote.id));await click('Copier le bloc commercial pour Abby');check(code+' real clipboard',(await clipboard.readText()).includes(code));
    await parameters(await call('quotes.get',quote.id));quote=await acceptUI(quote);
    if(result.projectId)check(code+' same Project after acceptance',quote.projectId===result.projectId);
    else if(model.lot==='8B'){const sales=await call('quotes.operationalSales',quote.id);check(code+' correct operational object',sales.length===1&&sales[0].kind===config.operations.kind);result.sale=sales[0];result.proof.push('Objet 8B créé seulement après acceptation ; provenance vers la ligne vendue');
      const sale=sales[0],policy=config.operations;
      if(policy.kind==='hour_pack'){
        const pack=await call('operations.hourPacks.get',sale.hour_pack_id);check(code+' exact initial credit',pack.balanceSeconds===policy.creditMinutes*60);
        const intervention=await call('operations.interventions.create',{clientAccountId:clientId,projectId:sale.project_id,subject:'TEST — consommation 45 min '+code,coverageMode:'hour_pack',hourPackId:sale.hour_pack_id,type:'support'});
        const started=await call('time.start',{interventionId:intervention.id,category:'support',activityLabel:'TEST — travail réel simulé'});await sleep(1000);const stopped=await call('time.stop',started.id);
        const missing=2700-stopped.durationSeconds,start=new Date(new Date().toISOString().slice(0,10)+'T18:00:00Z');
        await call('time.addManual',{interventionId:intervention.id,category:'support',activityLabel:'TEST — complément explicite pour cas de 45 min',startedAt:start.toISOString(),endedAt:new Date(start.getTime()+missing*1000).toISOString()});
        await call('operations.interventions.complete',intervention.id);const consumed=await call('operations.hourPacks.get',sale.hour_pack_id);
        check(code+' consumed45 exact balance',consumed.balanceSeconds===(policy.creditMinutes-45)*60);result.balanceMinutes=consumed.balanceSeconds/60;result.sessionId=started.id;
        result.proof.push('Chrono + saisie TEST tracée ; clôture consomme exactement45min, journal et solde conservés');
      }else if(sale.subscription_id){
        const periods=await call('operations.maintenance.periods.list',sale.subscription_id);result.periods=periods.length;
        check(code+' operational cycles',periods.length===(policy.billingPeriod==='yearly'&&policy.cadence==='monthly'?12:1));
        const ownChecks=periods.map(p=>p.checks.filter(c=>c.operationalSaleId===sale.id));
        check(code+' routine definitions and reference',ownChecks.every(checks=>checks.length===model.actions.length&&checks.reduce((sum,c)=>sum+c.referenceMinutes,0)===model.referenceMinutes));
        const checkItem=ownChecks.at(-1)[0],routine=await call('operations.maintenance.periods.prepareRoutine',checkItem.id);
        const started=await call('time.start',{interventionId:routine.id,category:'support',activityLabel:'TEST — routine '+code});await sleep(1000);await call('time.stop',started.id);
        await call('operations.maintenance.periods.updateCheck',checkItem.id,'done','TEST contrôle effectué');result.sessionId=started.id;
        const refreshed=await call('operations.maintenance.periods.list',sale.subscription_id);check(code+' routines outside quota',refreshed.at(-1).usage.interventionCount===0);result.proof.push('Routine native et chrono ; temps réel mesuré sans consommer le quota');
      }else if(sale.intervention_id){
        const intervention=await call('operations.interventions.get',sale.intervention_id);check(code+' intervention model snapshot',intervention.operationalChecklist.length===model.actions.length);
        const started=await call('time.start',{interventionId:intervention.id,category:'development',activityLabel:'TEST — intervention '+code});await sleep(1000);await call('time.stop',started.id);await call('operations.interventions.complete',intervention.id);result.sessionId=started.id;result.proof.push('Intervention native : checklist vendue, référence/estimation/temps réel distincts, chrono et clôture');
      }
}
    result.proof.push('Snapshot contractuel figé ; acceptation explicite TEST');
    await openQuote(quote);await click('📋 Copier pour Abby','.quote-detail-panel button');check(code+' contract clipboard frozen', (await clipboard.readText()).includes(quote.contractTextSnapshot.slice(0,80)));
    await click('Prévisualiser côté client','.quote-detail-panel button');await wait('!!document.querySelector(".quote-document")');
    const pdf=path.join(output,code+'-PDF-TEST-accepte.pdf');fs.writeFileSync(pdf,await win.webContents.printToPDF({printBackground:true}));
    await click('Fermer','.quote-client-preview button');
    const chooser=dialog.showOpenDialog;dialog.showOpenDialog=async()=>({canceled:false,filePaths:[pdf]}); // Only the external TEST file chooser is supplied by automation.
    try{await click('Importer le PDF accepté Abby','.quote-detail-panel button');await wait(`document.querySelector('.quote-detail-panel')?.innerText?.includes('Importer une nouvelle version PDF')`);}finally{dialog.showOpenDialog=chooser;}
    quote=await call('quotes.get',quote.id);const preparation=await call('quotePreparation.get',quote.id),document=preparation.documents.find(d=>d.role==='accepted_pdf');
    check(code+' accepted master PDF linked and fingerprinted',!!quote.contractDocumentId&&document?.sha256?.length===64);result.contractDocumentId=quote.contractDocumentId;result.pdfSHA256=document.sha256;
    result.proof.push('PDF TEST du dossier importé par la vraie IPC, document maître Client, SHA256 et rattachement Devis');

    if(model.lot==='8A'&&result.projectId){const project=await call('projects.projects.get',result.projectId),task=project.nodes.find(n=>n.operational?.code===code&&n.operational.action);if(task){const session=await call('time.start',{projectId:project.id,projectNodeId:task.id,category:'production',activityLabel:'TEST — chrono '+code});await sleep(1000);await call('time.stop',session.id);result.sessionId=session.id;result.proof.push('Chrono natif sur action et temps réel conservé');}}
    await openQuote(quote);await sleep(150);fs.writeFileSync(path.join(output,code+'-devis.png'),(await win.webContents.capturePage()).toPNG());
    await navigate(result.projectId?'project':'quote',result.projectId||quote.id);await wait(!result.projectId?`document.querySelector('.quote-detail-panel h2')?.textContent===${JSON.stringify(quote.subject)}`:`document.querySelector('.page-heading h1')?.textContent==='Projets' && document.body.innerText.includes(${JSON.stringify(quote.subject)})`);await sleep(350);fs.writeFileSync(path.join(output,code+'.png'),(await win.webContents.capturePage()).toPNG());result.capture=path.join(output,code+'.png');
   }catch(error){result.status='bloquante';result.error=error.stack||String(error);}
   results.push(result);persist();process.stdout.write(code+' '+result.status+'\n');
  }
  const supplemental=[];
  const record=(name,data)=>supplemental.push({name,...data});
  if(!codeFilter||args.includes('--supplements')){
    let q=await newQuote('OPTIONS-ET-REVISIONS',clientId);await openQuote(q);q=await addUI(q,'AW-WEB-VITRINE');
    const available=await call('projects.projects.previewQuote',{quoteId:q.id,templateVersionId:null});
    check('Available option has no effects',available.operations.actions.filter(a=>a.action).length===21);record('Option disponible non achetée',{quoteId:q.id,actions:21});
    const buy=async(code,quantity=1)=>{
      const id=references.find(r=>r.canonicalCode===code).currentVersion.id;
      await js(`document.querySelector('[data-option-version="${id}"] button').click()`);await sleep(80);
      await input(`[data-option-version="${id}"] .quote-line-editor label:nth-child(2) input`,String(quantity));
      await js(`[...document.querySelectorAll('[data-option-version="${id}"] button')].find(b=>b.textContent==='Enregistrer la ligne').click()`);await sleep(150);
      q=await call('quotes.get',q.id);
    };
    await buy('AW-WEB-PAGE-SUP',2);await buy('AW-WEB-BLOG');
    check('Actual option purchases persisted',q.lines.slice(1).every(l=>l.optionPurchase?.state==='purchased'));
    q=await prepareUI(q);const p=await call('projects.projects.get',q.projectId),pages=await call('projects.sites.listPages',q.projectId);
    check('Vitrine +2 pages +Blog real dimensions',p.nodes.filter(n=>n.operational?.action).length===34&&p.estimatedMinutes===1860&&pages.length===8);record('Vitrine +2 Pages +Blog',{quoteId:q.id,projectId:p.id,actions:34,minutes:1860,pages:8});
    const renamed=pages.find(page=>page.role==='standard')||pages[1];await call('projects.projects.updateNode',renamed.projectNodeId,{name:'TEST — Page renommée humainement'});
    const revision=await call('quotes.createCommercialRevision',q.id);check('Commercial revision same Project',revision.projectId===p.id);await openQuote(revision);
    const pageOption=revision.lines.find(l=>l.snapshot?.canonicalCode==='AW-WEB-PAGE-SUP');await call('quotes.updateLine',pageOption.id,{label:pageOption.label,quantityMilli:1000,proposedUnitPriceCents:pageOption.proposedUnitPriceCents});await call('projects.projects.syncCommercial',p.id);
    check('Manual rename preserved', (await call('projects.projects.get',p.id)).nodes.some(n=>n.name==='TEST — Page renommée humainement'));
    record('Révision et conservation humaine',{originalQuoteId:q.id,revisedQuoteId:revision.id,projectId:p.id});
    const clone=await call('quotes.duplicate',revision.id);check('Plain duplication preserves purchases',clone.lines.filter(l=>l.optionPurchase).length===2&&clone.projectId===null);
    await call('quotes.removeLine',clone.lines.find(l=>l.snapshot?.canonicalCode==='AW-WEB-BLOG').id);check('Original quote intact after clone removal',(await call('quotes.get',revision.id)).lines.length===revision.lines.length);record('Duplication puis retrait dans la copie',{originalQuoteId:revision.id,copyQuoteId:clone.id});
    let photo=await newQuote('DETOUR-QUANTITES',clientId);await openQuote(photo);photo=await addUI(photo,'AW-PHOTO-DETOUR',2);check('Two images real native minimum45',photo.lines[0].quantityMilli===2000&&photo.contractValueCents===4500);record('Détourage2images',{quoteId:photo.id,quantityMilli:2000,priceCents:4500});
    for(const theme of ['atoumweb','noir','blanc']){
      await js("window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:'Réglages'}))");await wait('!!document.querySelector(".theme-card")');
      await js(`[...document.querySelectorAll('.theme-card')].find(b=>b.querySelector('strong').textContent===${JSON.stringify({atoumweb:'AtoumWeb',noir:'Noir',blanc:'Blanc'}[theme])}).click()`);await wait(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);await openQuote(photo);await sleep(100);
      check(theme+' visible native Abby control',await js(`document.querySelector('[aria-label="Bloc commercial Abby"]').value.includes('45,00')`));
      fs.writeFileSync(path.join(output,'devis-thematique-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
      await navigate('project',p.id);await wait(`document.querySelector('.page-heading h1')?.textContent==='Projets'`);await sleep(180);fs.writeFileSync(path.join(output,'projet-thematique-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
    }
    fs.writeFileSync(path.join(output,'scenarios-transversaux.json'),JSON.stringify(supplemental,null,2));
  }
  check('SQLite integrity',database.database.get('PRAGMA integrity_check').integrity_check==='ok');check('SQLite foreign keys',database.database.all('PRAGMA foreign_key_check').length===0);
  persist();process.stdout.write(JSON.stringify({references:results.length,blocked:results.filter(r=>r.status==='bloquante').length,checks:checks.length})+'\n');process.exitCode=results.some(r=>r.status==='bloquante')?1:0;
 }).catch(error=>{errors.push(error.stack||String(error));persist();process.stderr.write(error.stack+'\n');process.exitCode=1;}).finally(()=>{win?.destroy();database?.close();app.exit(process.exitCode||0);});
}

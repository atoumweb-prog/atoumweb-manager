// Native App/preload/IPC on a temporary migrated workspace. Shell opening is intercepted only to avoid launching Explorer.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-guided-reuse-ui-'));
  const env={...process.env,ATOUMWEB_REUSE_UI_TEMP:temp};delete env.ELECTRON_RUN_AS_NODE;
  try{const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:180000});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;}
  finally{if(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(temp).startsWith('atoumweb-guided-reuse-ui-'))fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}else{
  const {app,BrowserWindow,shell}=require('electron'),args=process.argv.slice(2),temp=process.env.ATOUMWEB_REUSE_UI_TEMP;
  const output=args.includes('--output')?path.resolve(args[args.indexOf('--output')+1]):null;
  if(!temp||!output)throw Error('Use node wrapper and --output');fs.mkdirSync(output,{recursive:true});
  app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
  const base=repo.replaceAll('\\','/'),esbuild=require('esbuild');
  esbuild.buildSync({stdin:{contents:`export * from '${base}/src/main/database/DatabaseService';export * from '${base}/src/main/workspace';export * from '${base}/src/main/ipc';export * from '${base}/src/main/operations/operationsIpc';export * from '${base}/src/main/referentials/referentialsIpc';export * from '${base}/src/main/backups/businessBackupsIpc';export * from '${base}/src/main/time/timeIpc';`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
  for(const [entry,file,platform] of [['src/preload/preload.ts','preload.js','node'],['src/renderer/main.tsx','ui.js','browser']])esbuild.buildSync({entryPoints:[path.join(repo,entry)],bundle:true,platform,format:platform==='node'?'cjs':undefined,outfile:path.join(temp,file),external:platform==='node'?['electron']:[],logLevel:'silent'});
  fs.writeFileSync(path.join(temp,'index.html'),'<html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="ui.css"></head><body><div id="root"></div><script src="ui.js"></script></body></html>');
  const S=require(path.join(temp,'services.cjs')),checks=[],errors=[],opened=[];let database,win;
  const check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
  shell.openPath=async p=>{check('ouverture shell sur un fichier réel de la fixture',path.resolve(p).startsWith(path.resolve(temp)+path.sep)&&fs.existsSync(p));opened.push(p);return '';};
  app.whenReady().then(async()=>{
    const workspace=S.ensureWorkspace(path.join(temp,'fixture'));database=new S.DatabaseService(workspace);await database.initialize();const db=database.database;
    const project=database.projects.createInternal({name:'TEST — réutilisation guidée'});database.projects.addProjectNode(project.id,{name:'TEST Phase source',type:'lot'});
    const original=database.projectTechnicalLibrary.create(project.id,{name:'TEST snippet client',category:'php',description:'Source spécifique client',tags:['client']},{contentType:'code',language:'php',contentText:'<?php echo "CLIENT";'});
    const v1=original.currentVersion.id;database.projectTechnicalLibrary.markStable(v1);
    database.projectTechnicalLibrary.createVersion(original.id,{contentType:'code',language:'php',contentText:'<?php echo "CLIENT V2";'});
    const inputFile=path.join(temp,'source-client.json');fs.writeFileSync(inputFile,'{"client":"CLIENT"}');
    const resource=database.projectResources.importFilePaths(project.id,[inputFile],'technical')[0];database.projectTechnicalLibrary.linkResource(v1,resource.id);
    const sourceResourcePath=database.projectResources.absolutePath(resource),sourceResourceBefore=fs.readFileSync(sourceResourcePath);
    const sourceBefore=JSON.stringify(database.projectTechnicalLibrary.get(original.id)),projectBefore=JSON.stringify(db.get('SELECT * FROM projects WHERE id=?',[project.id]));
    S.registerIpcHandlers(database,workspace);S.registerOperationsIpcHandlers(database);S.registerReferentialsIpcHandlers(database);S.registerBusinessBackupsIpcHandlers(database);S.registerTimeCorrectionIpcHandler(database);
    win=new BrowserWindow({show:false,width:1700,height:1250,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:true,backgroundThrottling:false}});
    win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)errors.push(e.message);});await win.loadFile(path.join(temp,'index.html'));
    const js=async code=>{const r=await win.webContents.executeJavaScript(`(async()=>{try{return{ok:true,value:await new Function('return ('+${JSON.stringify(code)}+')')()}}catch(e){return{ok:false,error:e.message}}})()`);if(!r.ok)throw Error(r.error+' / '+code);return r.value;};
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const wait=async code=>{for(let i=0;i<400;i++){if(await js(code))return;await sleep(50);}const state=await js(`({ready:document.readyState,sidebar:!!document.querySelector('.aw-navigation-rail'),preload:!!window.atoumweb,body:document.body?.innerText?.slice(0,900)})`);throw Error('UI timeout '+code+' '+JSON.stringify({state,consoleErrors:errors.slice(-5)}));};
    const click=async label=>{await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled)`);await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);await sleep(90);};
    const input=async(label,value)=>{await js(`(()=>{const e=document.querySelector('[aria-label="${label}"]');Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await sleep(60);};
    const shot=async name=>{await sleep(130);fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());};
    const go=async page=>{await js(`window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:${JSON.stringify(page)}}))`);await sleep(80);};
    await wait('!!window.atoumweb&&!!document.querySelector(".aw-navigation-rail")');
    for(const theme of ['atoumweb','noir','blanc']){
      await go('Réglages');await wait('!!document.querySelector(".theme-card")');
      await js(`[...document.querySelectorAll('.theme-card')].find(b=>b.querySelector('strong').textContent===${JSON.stringify({atoumweb:'AtoumWeb',noir:'Noir',blanc:'Blanc'}[theme])}).click()`);await wait(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);
      await js(`window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'project',entityId:${JSON.stringify(project.id)},title:'TEST'}}))`);
      await wait('!!document.querySelector(".project-phase-main")');await js('document.querySelector(".project-phase-main").click()');await click('Technique');
      await wait('!!document.querySelector(".technical-library-tab")');
      check(theme+' fonctions récentes conservées',await js(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Nouvelle version')&&[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Exporter le paquet simple')`));
      const beforeCount=database.atoumWebTechnicalLibrary.list().length;
      await click('Préparer pour réutilisation');await wait(`!!document.querySelector('[aria-label="Version Projet source"]')`);
      check(theme+' stable sélectionnée',await js(`document.querySelector('[aria-label="Version Projet source"]').value===${JSON.stringify(v1)}`));
      const v2=database.projectTechnicalLibrary.get(original.id).currentVersion.id;
      await input('Version Projet source',v2);check(theme+' choix de version charge contenu exact',await js(`document.querySelector('[aria-label="Version Projet source"]').value`)===v2);
      await input('Version Projet source',v1);await input('Notes de préparation','TEST — retirer les données client');await click('Créer la copie de travail');
      await wait(`!!document.querySelector('[aria-label="Contenu générique adapté"]')`);
      check(theme+' contenu de la version préparée',await js(`document.querySelector('[aria-label="Contenu générique adapté"]').value`)==='<?php echo "CLIENT";');
      check(theme+' aucune création automatique',database.atoumWebTechnicalLibrary.list().length===beforeCount);
      check(theme+' snippet catégorie actuelle',await js(`document.querySelector('[aria-label="Catégorie de la brique"]').value`)==='code_snippet');
      check(theme+' création verrouillée avant revue humaine',await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Créer la brique AtoumWeb').disabled`));
      const directory=path.join(workspace.exportsDirectory,'reutilisation');const packages=fs.readdirSync(directory).map(name=>path.join(directory,name)).filter(p=>fs.existsSync(path.join(p,'manifest.json')));const pkg=packages.at(-1);
      const manifest=JSON.parse(fs.readFileSync(path.join(pkg,'manifest.json'),'utf8'));check(theme+' manifeste indépendant et version exacts',manifest.version.id===v1&&manifest.safety.sourceProjectModified===false&&manifest.safety.automaticGlobalLibraryCreation===false);
      await click('Ouvrir la copie de travail');check(theme+' ouverture paquet via IPC existante',opened.includes(pkg));
      // Simulate the human adaptation of independent files, in addition to the native form editing below.
      for(const file of fs.readdirSync(path.join(pkg,'sources')))fs.writeFileSync(path.join(pkg,'sources',file),'{"template":"generic"}');
      for(const file of fs.readdirSync(path.join(pkg,'contenu')))fs.writeFileSync(path.join(pkg,'contenu',file),'<?php echo $label;');
      check(theme+' fichiers de travail indépendants du Projet',JSON.stringify(database.projectTechnicalLibrary.get(original.id))===sourceBefore&&fs.readFileSync(sourceResourcePath).equals(sourceResourceBefore)&&fs.readFileSync(inputFile,'utf8')==='{"client":"CLIENT"}');
      await input('Nom générique','TEST générique '+theme);await input('Description générique','Composant adapté humainement');await input('Tags génériques','test, generique');await input('Contenu générique adapté','<?php echo $label;');
      await js(`document.querySelector('[aria-label="Adaptation relue"]').click()`);await input('Notes de version générique','TEST adaptation humaine');check(theme+' nouvelle édition exige nouvelle revue',await js(`!document.querySelector('[aria-label="Adaptation relue"]').checked`));
      await js(`document.querySelector('[aria-label="Adaptation relue"]').click()`);
      await js('document.querySelector(".reuse-fields:last-of-type").scrollIntoView({block:"start"})');await shot('adaptation-'+theme);
      await click('Créer la brique AtoumWeb');await wait(`document.querySelector('.reuse-preparation-panel')?.textContent.includes('Brique créée : TEST générique ${theme}')`);
      const created=database.atoumWebTechnicalLibrary.list().find(i=>i.name==='TEST générique '+theme),detail=database.atoumWebTechnicalLibrary.get(created.id);
      check(theme+' création unique après action explicite',database.atoumWebTechnicalLibrary.list().length===beforeCount+1&&await js(`![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Créer la brique AtoumWeb')`));
      check(theme+' adaptation et provenance persistées',detail.category==='code_snippet'&&detail.originTechnicalItemId===original.id&&detail.currentVersion.contentText==='<?php echo $label;'&&detail.reuseStatus==='adapt');
      check(theme+' élément Projet et versions inchangés',JSON.stringify(database.projectTechnicalLibrary.get(original.id))===sourceBefore);
      check(theme+' projet et fichier source inchangés',JSON.stringify(db.get('SELECT * FROM projects WHERE id=?',[project.id]))===projectBefore&&fs.readFileSync(sourceResourcePath).equals(sourceResourceBefore)&&fs.readFileSync(inputFile,'utf8')==='{"client":"CLIENT"}');
      await shot('creation-'+theme);await click('Ouvrir la brique AtoumWeb');await wait('document.body.innerText.includes("TEST générique '+theme+'")&&!document.querySelector(".reuse-preparation-panel")');
      check(theme+' navigation Bibliothèque récente',await js('!document.querySelector(".renderer-fatal-shell")'));await shot('bibliotheque-'+theme);
    }
    check('migrations exactement1–65',db.all('SELECT id FROM schema_migrations ORDER BY id').map(r=>r.id).join(',')===Array.from({length:65},(_,i)=>i+1).join(','));
    check('integrité fixture',db.get('PRAGMA integrity_check').integrity_check==='ok');check('FK fixture',db.all('PRAGMA foreign_key_check').length===0);check('aucune erreur renderer',errors.length===0);
    process.stdout.write(JSON.stringify({checks:checks.length,errors})+'\n');
  }).catch(e=>{errors.push(e.stack||String(e));process.stderr.write(e.stack+'\n');process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(output,'controle-ui.json'),JSON.stringify({checks,errors,shellOpening:'Captured OS handoff only; real IPC and business services'},null,2));win?.destroy();database?.close();app.exit(process.exitCode||0);});
}

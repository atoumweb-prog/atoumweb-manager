// Lot 04D — native Electron/IPC/SQLite/React vertical using a disposable TEMP database.
// Never opens a real user workspace; the registered handlers are fixture-scoped.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-04d-native-'));
  const env={...process.env,ATOUMWEB_04D_NATIVE_DIR:dir};delete env.ELECTRON_RUN_AS_NODE;
  try{
    const child=require('node:child_process').spawnSync(require('electron'),[__filename],{
      cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:160000,
    });
    process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
    if(child.error)throw child.error;
    process.exitCode=child.status??1;
  }finally{
    if(dir.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('atoumweb-04d-native-'))
      fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}else{
  const {app,BrowserWindow,ipcMain}=require('electron');
  app.disableHardwareAcceleration();
  const dir=process.env.ATOUMWEB_04D_NATIVE_DIR;
  if(!dir||!dir.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(dir).startsWith('atoumweb-04d-native-'))
    throw Error('Explicit disposable TEMP directory required.');
  app.setPath('userData',path.join(dir,'profile'));
  const local=filename=>path.join(dir,filename);
  const fromRepo=p=>path.join(repo,p);
  const posix=p=>p.replaceAll('\\','/');
  async function run(){
    let db,win;
    try{
      const esbuild=require('esbuild');
      await esbuild.build({
        entryPoints:{
          adapter:fromRepo('src/main/database/NodeSqliteAdapter.ts'),
          migrations:fromRepo('src/main/database/migrations.ts'),
          catalog:fromRepo('src/main/commercial/CatalogService.ts'),
          recommendations:fromRepo('src/main/commercial/CatalogRecommendationsService.ts'),
        },
        outdir:local('native'),bundle:true,platform:'node',format:'cjs',
        packages:'external',logLevel:'silent',
      });
      const {NodeSqliteAdapter}=require(local('native/adapter.js'));
      const {applyPendingMigrations}=require(local('native/migrations.js'));
      const {CatalogService}=require(local('native/catalog.js'));
      const {CatalogRecommendationsService}=require(local('native/recommendations.js'));
      const dbFile=local('catalogue-only.sqlite');
      db=new NodeSqliteAdapter(dbFile);
      db.exec('PRAGMA foreign_keys=ON');
      applyPendingMigrations(db);
      const catalog=new CatalogService(db);
      const rec=new CatalogRecommendationsService(db);
      const audit=catalog.create({type:'service',name:'Audit technique'},{
        priceMode:'fixed',priceCents:9900,
      });
      const seo=catalog.create({type:'service',name:'SEO local'},{
        priceMode:'fixed',priceCents:14900,
      });
      catalog.publishVersion(audit.versions[0].id);
      catalog.publishVersion(seo.versions[0].id);
      const offer=catalog.create({type:'offer',name:'Offre vitrine'},{
        priceMode:'fixed',priceCents:69900,
      });
      const sourceId=offer.versions[0].id;
      const auditId=audit.versions[0].id;
      const seoId=seo.versions[0].id;
      ipcMain.handle('catalog:list-recommendations',(_event,id)=>rec.list(id));
      ipcMain.handle('catalog:replace-recommendations',(_event,id,ids,expected)=>rec.replace(id,ids,expected));

      // Browser uses a real Electron preload/IPC bridge, not mocked async catalog calls.
      const preload=String.raw`const {ipcRenderer}=require('electron');
window.atoumweb={
  catalog:{
    listRecommendations:id=>ipcRenderer.invoke('catalog:list-recommendations',id),
    replaceRecommendations:(id,ids,expected)=>ipcRenderer.invoke('catalog:replace-recommendations',id,ids,expected),
  },
  unsaved:{confirmExit:()=>false,publishState:()=>{}},
};`;
      fs.writeFileSync(local('preload.cjs'),preload);
      const entry=[
        "import React from 'react';",
        "import {createRoot} from 'react-dom/client';",
        "import {CatalogRecommendationsPanel} from '"+posix(fromRepo('src/renderer/commercial/CatalogRecommendationsPanel'))+"';",
        "import {unsavedRegistry} from '"+posix(fromRepo('src/renderer/unsaved/unsaved'))+"';",
        "window.fixtureErrors=[];",
        "window.addEventListener('error',e=>window.fixtureErrors.push(String(e.error||e.message)));",
        "window.addEventListener('unhandledrejection',e=>window.fixtureErrors.push(String(e.reason)));",
        "const offer="+JSON.stringify(catalog.getItem(offer.id))+";",
        "const items="+JSON.stringify(catalog.list({}))+";",
        "window.fixture={sourceId:"+JSON.stringify(sourceId)+",auditId:"+JSON.stringify(auditId)+",seoId:"+JSON.stringify(seoId)+"};",
        "window.unsavedEntries=()=>unsavedRegistry.active().map(x=>({label:x.label,pending:x.pending}));",
        "createRoot(document.getElementById('root')).render(<CatalogRecommendationsPanel item={offer} items={items} locked={false}/>);",
      ].join('\n');
      await esbuild.build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},
        bundle:true,nodePaths:[path.join(repo,'node_modules')],outfile:local('fixture.js'),
        jsx:'automatic',logLevel:'silent'});
      fs.writeFileSync(local('fixture.html'),
        '<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body><div id="root"></div><script src="fixture.js"></script></body></html>');
      win=new BrowserWindow({show:false,width:1100,height:800,webPreferences:{
        preload:local('preload.cjs'),contextIsolation:false,sandbox:false,nodeIntegration:false,
        backgroundThrottling:false,
      }});
      await win.loadFile(local('fixture.html'));
      const result=await win.webContents.executeJavaScript('('+async function(){
        const checks=[];
        const sleep=(ms=65)=>new Promise(resolve=>setTimeout(resolve,ms));
        async function until(fn,label){
          for(let i=0;i<90;i++){let v=fn();if(v)return v;await sleep();}
          throw Error('Timeout '+label+' text='+document.body.textContent+' errors='+JSON.stringify(window.fixtureErrors));
        }
        const check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error(name);};
        const save=()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Enregistrer les recommandations');
        async function add(id){
          const input=await until(()=>document.querySelector('select[aria-label="Ajouter une recommandation"]'),'select');
          Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(input,id);
          input.dispatchEvent(new Event('change',{bubbles:true}));await sleep();
        }
        await until(save,'save control');
        await add(window.fixture.auditId);
        check('native 04D dirty registry',window.unsavedEntries().length===1);
        save().click();
        await until(()=>document.querySelectorAll('.offer-component-row').length===1,'saved link');
        await until(()=>window.unsavedEntries().length===0,'clean registry');
        const saved=await window.atoumweb.catalog.listRecommendations(window.fixture.sourceId);
        check('native 04D real IPC/SQLite persisted Audit',saved.length===1&&saved[0].targetVersionId===window.fixture.auditId&&saved[0].targetName==='Audit technique');
        await add(window.fixture.seoId);
        const concurrent=await window.atoumweb.catalog.replaceRecommendations(
          window.fixture.sourceId,[window.fixture.seoId],[window.fixture.auditId]);
        check('native 04D concurrent SQLite committed',concurrent.length===1&&concurrent[0].targetVersionId===window.fixture.seoId);
        save().click();
        await until(()=>document.querySelector('[role="alert"]'),'CAS conflict');
        check('native 04D CAS reports conflict',document.querySelector('[role="alert"]').textContent.includes('Conflit'));
        check('native 04D conflict retains local changes',window.unsavedEntries().length===1&&document.querySelectorAll('.offer-component-row').length===2);
        const history=await window.atoumweb.catalog.listRecommendations(window.fixture.sourceId);
        check('native 04D conflict does not overwrite database',history.length===1&&history[0].targetVersionId===window.fixture.seoId);
        check('native 04D no renderer errors',window.fixtureErrors.length===0);
        return checks;
      }.toString()+')()');
      if(db.all('PRAGMA foreign_key_check').length)throw Error('Native 04D SQLite FK check failed');
      const saved=rec.list(sourceId);
      if(saved.length!==1||saved[0].targetVersionId!==seoId)throw Error('Native SQLite final state differs from renderer assertions');
      if(result.some(c=>!c.passed))throw Error('Failed native 04D assertions');
      console.log('LOT04D NATIVE IPC+SQLITE '+result.length+' checks, failed=0, FK=0');
      for(const check of result)console.log('PASS '+check.name);
      win.destroy();db.close();app.exit(0);
    }catch(error){
      console.error(error);
      if(win&&!win.isDestroyed())win.destroy();
      if(db){try{db.close();}catch{}}
      app.exit(1);
    }
  }
  app.whenReady().then(run);
}

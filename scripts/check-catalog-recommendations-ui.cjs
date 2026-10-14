// 04D: real React panel in Electron Chromium with isolated mocked IPC; no client data.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-04d-ui-'));
  const env={...process.env, ATOUMWEB_04D_UI_DIR:dir};delete env.ELECTRON_RUN_AS_NODE;
  try{
    const child=require('node:child_process').spawnSync(require('electron'),[__filename],{
      cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:120000,
    });
    process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
    if(child.error)throw child.error;
    process.exitCode=child.status??1;
  }finally{
    if(dir.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('atoumweb-04d-ui-'))
      fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}else{
  const {app,BrowserWindow}=require('electron');
  app.disableHardwareAcceleration();
  const dir=process.env.ATOUMWEB_04D_UI_DIR;
  if(!dir||!dir.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(dir).startsWith('atoumweb-04d-ui-'))
    throw Error('Isolated TEMP fixture required.');
  app.setPath('userData',path.join(dir,'profile'));
  const entry=[
    "import React from 'react';",
    "import {createRoot} from 'react-dom/client';",
    "import {CatalogRecommendationsPanel} from '"+repo.replaceAll('\\','/')+"/src/renderer/commercial/CatalogRecommendationsPanel';",
    "import {unsavedRegistry,requestUnsavedExit} from '"+repo.replaceAll('\\','/')+"/src/renderer/unsaved/unsaved';",
    "window.fixtureErrors=[];",
    "window.addEventListener('error',event=>window.fixtureErrors.push(String(event.error||event.message)));",
    "window.addEventListener('unhandledrejection',event=>window.fixtureErrors.push(String(event.reason)));",
    "const v=(id,status='published')=>({id,itemId:id.split('-')[0],versionNumber:1,status});",
    "const first={id:'offer',type:'offer',name:'Offre',status:'active',versions:[v('offer-draft','draft')],currentVersion:v('offer-published')};",
    "const second={id:'other',type:'service',name:'Autre fiche',status:'active',versions:[v('other-draft','draft')],currentVersion:v('other-published')};",
    "const available=[{id:'a',type:'service',status:'active',name:'Audit',currentVersion:v('a-published')},{id:'b',type:'service',status:'active',name:'SEO',currentVersion:v('b-published')}];",
    "const root=createRoot(document.getElementById('root'));",
    "window.fixture={current:first,store:{'offer-draft':[],'other-draft':[]},calls:[],allowExit:false,confirmation:[],delayed:false,release:null,failNext:false};",
    "window.atoumweb={unsaved:{confirmExit:(labels,pending)=>{window.fixture.confirmation.push({labels,pending});return window.fixture.allowExit;},publishState:()=>{}},catalog:{",
    "  listRecommendations:async id=>structuredClone(window.fixture.store[id]||[]),",
    "  replaceRecommendations:async (id,ids,expected)=>{",
    "    const f=window.fixture;f.calls.push({id,ids:[...ids],expected:[...expected]});",
    "    if(f.failNext){f.failNext=false;throw Error('IPC volontairement refusé');}",
    "    if(JSON.stringify((f.store[id]||[]).map(x=>x.targetVersionId))!==JSON.stringify(expected))throw Error('Conflit de sauvegarde');",
    "    if(f.delayed)await new Promise(resolve=>{f.release=resolve;});",
    "    const links=ids.map((targetVersionId,i)=>({id:'link-'+id+'-'+i,sourceVersionId:id,targetVersionId,sortOrder:i}));",
    "    f.store[id]=links;return structuredClone(links);",
    "  }",
    "}};",
    "const render=()=>root.render(<CatalogRecommendationsPanel item={window.fixture.current} items={available} locked={false}/>);",
    "window.swap=()=>{window.fixture.current=second;render();};",
    "window.unsavedEntries=()=>unsavedRegistry.active().map(x=>({group:x.group,label:x.label,pending:x.pending}));",
    "window.tryLeave=()=>requestUnsavedExit(()=>{window.fixture.left=true;},'catalog:'+window.fixture.current.id);",
    "render();"
  ].join('\n');
  async function run(){
    let win;
    try{
      await require('esbuild').build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},
        bundle:true,nodePaths:[path.join(repo,'node_modules')],outfile:path.join(dir,'fixture.js'),
        jsx:'automatic',logLevel:'silent'});
      fs.writeFileSync(path.join(dir,'fixture.html'),
        '<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body><div id="root"></div><script src="fixture.js"></script></body></html>');
      win=new BrowserWindow({show:false,width:1024,height:768,webPreferences:{
        contextIsolation:false,nodeIntegration:false,backgroundThrottling:false,
      }});
      await win.loadFile(path.join(dir,'fixture.html'));
      const result=await win.webContents.executeJavaScript('('+async function(){
        const checks=[];
        const sleep=(ms=70)=>new Promise(resolve=>setTimeout(resolve,ms));
        async function until(fn,label){
          for(let i=0;i<80;i++){const result=fn();if(result)return result;await sleep();}
          throw Error('Timeout '+label+' : '+document.body.textContent+' ERRORS '+JSON.stringify(window.fixtureErrors));
        }
        function assert(name,truth){checks.push({name,passed:!!truth});if(!truth)throw Error(name);}
        const button=(label)=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
        const select=()=>document.querySelector('select[aria-label="Ajouter une recommandation"]');
        async function add(id){
          const control=await until(select,'select');
          Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(control,id);
          control.dispatchEvent(new Event('change',{bubbles:true}));await sleep();
        }
        await until(()=>button('Enregistrer les recommandations'),'initial load');
        await add('a-published');
        assert('04D edit flagged unsaved',window.unsavedEntries().some(x=>x.label==='Recommandations Catalogue'));
        assert('04D save enabled',!button('Enregistrer les recommandations').disabled);
        assert('04D Stay blocks leaving',window.tryLeave()===false&&window.fixture.left!==true);
        await until(()=>window.fixture.confirmation.length>0,'confirmation');
        assert('04D label in confirmation',window.fixture.confirmation[0].labels.includes('Recommandations Catalogue'));
        button('Enregistrer les recommandations').click();
        await until(()=>window.fixture.store['offer-draft'].length===1,'save');
        assert('04D persisted selected target',window.fixture.store['offer-draft'][0].targetVersionId==='a-published');
        await until(()=>window.unsavedEntries().length===0,'clean after save');
        button('Retirer').click();await sleep();
        window.fixture.failNext=true;
        button('Enregistrer les recommandations').click();
        await until(()=>document.querySelector('[role="alert"]'),'failed save');
        assert('04D failed save keeps old database association',window.fixture.store['offer-draft'].length===1);
        assert('04D failed save keeps dirty local selection',window.unsavedEntries().length===1&&!button('Enregistrer les recommandations').disabled);
        window.fixture.allowExit=true;assert('04D accepted exit discards local edit',window.tryLeave()===true);
        await sleep();
        assert('04D discard restores persisted selection',!!button('Retirer'));
        await add('b-published');
        window.fixture.delayed=true;
        button('Enregistrer les recommandations').click();
        await until(()=>typeof window.fixture.release==='function','delayed reply');
        assert('04D pending blocks close',window.tryLeave()===false);
        const number=window.fixture.calls.length;
        const pendingButton=button('Enregistrement…');
        assert('04D button disabled while pending',pendingButton?.disabled===true);
        pendingButton.click();
        assert('04D double save blocked',window.fixture.calls.length===number);
        window.swap();
        await until(()=>document.body.textContent.includes('Aucune recommandation')&&!document.querySelector('.offer-component-row'),'second version');
        window.fixture.release();
        await sleep(180);
        assert('04D late IPC does not copy old targets to new version',document.querySelectorAll('.offer-component-row').length===0&&window.fixture.current.id==='other'&&window.fixture.store['other-draft'].length===0);
        assert('04D no renderer errors',window.fixtureErrors.length===0);
        return checks;
      }.toString()+')()');
      const failed=result.filter(x=>!x.passed);
      console.log('LOT04D ELECTRON WINDOWS TEMP '+result.length+' checks, failed='+failed.length);
      for(const check of result)console.log((check.passed?'PASS ':'FAIL ')+check.name);
      if(failed.length)throw Error('04D UI assertions failed.');
      win.destroy();app.exit(0);
    }catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();app.exit(1);}
  }
  app.whenReady().then(run);
}

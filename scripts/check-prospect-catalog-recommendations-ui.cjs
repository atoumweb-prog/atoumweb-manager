// Lot 04D: real Prospect selector in isolated Electron, with controlled Catalogue/IPC failures.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-prospect-recs-'));
  const env={...process.env,ATOUMWEB_PROSPECT_RECS_DIR:dir};delete env.ELECTRON_RUN_AS_NODE;
  try{
    const c=require('node:child_process').spawnSync(require('electron'),[__filename],{
      cwd:repo,env,encoding:'utf8',windowsHide:true,timeout:100000,
    });
    process.stdout.write(c.stdout||'');process.stderr.write(c.stderr||'');
    if(c.error)throw c.error;
    process.exitCode=c.status??1;
  }finally{
    if(dir.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('atoumweb-prospect-recs-'))
      fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}else{
  const {app,BrowserWindow}=require('electron');app.disableHardwareAcceleration();
  const dir=process.env.ATOUMWEB_PROSPECT_RECS_DIR;
  if(!dir||!dir.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(dir).startsWith('atoumweb-prospect-recs-'))
    throw Error('Only isolated TEMP fixtures are accepted.');
  app.setPath('userData',path.join(dir,'profile'));
  async function run(){
    let win;
    try{
      const entry=[
        "import React from 'react';",
        "import {createRoot} from 'react-dom/client';",
        "import {NeedDraftSelector} from '"+path.join(repo,'src/renderer/crm/ProspectNeedsPanel').replaceAll('\\','/')+"';",
        "window.errors=[];window.addEventListener('error',e=>window.errors.push(String(e.error||e.message)));",
        "window.addEventListener('unhandledrejection',e=>window.errors.push(String(e.reason)));",
        "const make=(id,name,type='service')=>({id,name,type,status:'active',category:'Web',visiblePublic:false,",
        "currentVersion:{id:id+'-v1',itemId:id,status:'published',versionNumber:1,priceMode:'fixed',priceCents:9900,",
        "commercialParameters:{},inclusions:[],exclusions:[],prerequisites:[]}});",
        "const offer=make('offer','Offre vitrine','offer'),service=make('svc','SEO local');",
        "window.fixture={catalogFail:true,recFail:true,needs:[{catalogItemId:'offer',otherText:''}],calls:0,quotesCalls:0,key:0};",
        "window.atoumweb={unsaved:{confirmExit:()=>false,publishState:()=>{}},catalog:{",
        "list:async()=>{window.fixture.calls++;if(window.fixture.catalogFail)throw Error('Catalogue temporairement indisponible');return [offer,service];},",
        "listRecommendations:async id=>{if(window.fixture.recFail)throw Error('Service indisponible');",
        "return id==='offer-v1'?[{id:'r',sourceVersionId:id,targetVersionId:'svc-v1',targetItemId:'svc',",
        "targetName:'SEO local',targetVersionNumber:1,targetVersionStatus:'published',targetItemStatus:'active',sortOrder:0}]:[];}}};",
        "const root=createRoot(document.getElementById('root'));",
        "window.mount=()=>root.render(<NeedDraftSelector key={window.fixture.key}",
        "value={window.fixture.needs} onChange={next=>{window.fixture.needs=next;window.mount();}}/>);",
        "window.mount();",
      ].join('\n');
      await require('esbuild').build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},
        bundle:true,nodePaths:[path.join(repo,'node_modules')],outfile:path.join(dir,'fixture.js'),
        jsx:'automatic',logLevel:'silent'});
      fs.writeFileSync(path.join(dir,'index.html'),
        '<!doctype html><html lang="fr"><meta charset="utf-8"><body><div id="root"></div><script src="fixture.js"></script></body>');
      win=new BrowserWindow({show:false,width:1000,height:780,webPreferences:{
        contextIsolation:false,nodeIntegration:false,backgroundThrottling:false,
      }});
      await win.loadFile(path.join(dir,'index.html'));
      const results=await win.webContents.executeJavaScript('('+async function(){
        const checks=[];
        const sleep=(ms=60)=>new Promise(resolve=>setTimeout(resolve,ms));
        async function until(fn,desc){for(let i=0;i<90;i++){const r=fn();if(r)return r;await sleep();}throw Error('Timeout '+desc+' '+document.body.textContent);}
        const check=(label,cond)=>{checks.push({label,passed:!!cond});if(!cond)throw Error(label);};
        const btn=t=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t));
        await until(()=>document.querySelector('[role="alert"]')?.textContent.includes('Catalogue indisponible'),'catalogue fail');
        check('04D catalogue failure is not interpreted as empty recommendations',
          document.querySelector('[role="alert"]').textContent.includes('Catalogue temporairement indisponible'));
        check('04D no implicit Prospect selection or quote',window.fixture.needs.length===1&&window.fixture.quotesCalls===0);
        window.fixture.catalogFail=false;btn('Réessayer').click();
        await until(()=>document.body.textContent.includes('Service indisponible'),'recommendations failure');
        check('04D recommendations IPC failure clearly reported',
          document.querySelector('[role="alert"]').textContent.includes('Service indisponible'));
        check('04D IPC error does not invent suggestions',
          !document.body.textContent.includes('Services complémentaires suggérés'));
        window.fixture.recFail=false;window.fixture.key++;window.mount();
        await until(()=>btn('+ SEO local'),'published recommendation');
        check('04D published managed recommendation appears after successful fetch',!!btn('+ SEO local'));
        check('04D advice alone does not add a Prospect need',window.fixture.needs.length===1);
        btn('+ SEO local').click();
        await until(()=>window.fixture.needs.length===2,'voluntary addition');
        check('04D only explicit click adds a Prospect need',window.fixture.needs[1].catalogItemId==='svc');
        check('04D no quote was created by advice',window.fixture.quotesCalls===0);
        check('04D no renderer exceptions',window.errors.length===0);
        return checks;
      }.toString()+')()');
      console.log('LOT04D PROSPECT ELECTRON '+results.length+' checks, failed=0');
      for(const r of results)console.log('PASS '+r.label);
      win.destroy();app.exit(0);
    }catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();app.exit(1);}
  }
  app.whenReady().then(run);
}

// Lot 04D / 04F — actual React Quote options/recommendations in isolated Electron Chromium.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-quote-recs-'));
  const env={...process.env,ATOUMWEB_QUOTE_RECS_DIR:dir};
  delete env.ELECTRON_RUN_AS_NODE;
  try{
    const child=require('node:child_process').spawnSync(require('electron'),[__filename],{
      cwd:repo,env,encoding:'utf8',windowsHide:true,timeout:110000,
    });
    process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
    if(child.error)throw child.error;
    process.exitCode=child.status??1;
  }finally{
    if(dir.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('atoumweb-quote-recs-'))
      fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}else{
  const {app,BrowserWindow}=require('electron');
  app.disableHardwareAcceleration();
  const dir=process.env.ATOUMWEB_QUOTE_RECS_DIR;
  if(!dir||!dir.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(dir).startsWith('atoumweb-quote-recs-'))
    throw Error('Missing isolated TEMP fixture.');
  app.setPath('userData',path.join(dir,'profile'));
  async function run(){
    let win;
    try{
      const entry=[
        "import React from 'react';",
        "import {createRoot} from 'react-dom/client';",
        "import {QuoteOfferOptionsPanel} from '"+path.join(repo,'src/renderer/commercial/QuoteOfferOptionsPanel').replaceAll('\\','/')+"';",
        "import {unsavedRegistry} from '"+path.join(repo,'src/renderer/unsaved/unsaved').replaceAll('\\','/')+"';",
        "window.fixtureErrors=[];",
        "window.addEventListener('error',e=>window.fixtureErrors.push(String(e.error||e.message)));",
        "window.addEventListener('unhandledrejection',e=>window.fixtureErrors.push(String(e.reason)));",
        "const source={id:'line-offer',quoteId:'q',source:'catalog',label:'Offre vitrine',sortOrder:0,",
        "  catalogItemId:'item-offer',catalogVersionId:'offer-v1',adjustmentMode:'none',",
        "  catalogLineValueCents:69900,contractLineValueCents:69900,createdAt:'2026-10-14',updatedAt:'2026-10-14',",
        "  snapshot:{itemType:'offer',versionId:'offer-v1',versionNumber:1,offerComponents:[]}};",
        "const rec=(id,name,status='published')=>({id:'rec-'+id,sourceVersionId:'offer-v1',",
        " targetVersionId:id+'-v1',targetItemId:id,targetName:name,targetVersionNumber:1,",
        " targetVersionStatus:status,targetItemStatus:'active',sortOrder:0});",
        "window.fixture={quote:{id:'q',status:'draft',lines:[source]},calls:[],links:[",
        " rec('audit','Audit technique'),rec('seo','SEO local'),rec('old','Service retiré','retired')],",
        " delay:false,release:null,failNext:false};",
        "window.atoumweb={unsaved:{confirmExit:()=>false,publishState:()=>{}},catalog:{",
        " listRecommendations:async id=>id==='offer-v1'?structuredClone(window.fixture.links):[],",
        " getItem:async()=>({versions:[]})},quotes:{addCatalogLine:async(id,version,input)=>{",
        " const f=window.fixture;f.calls.push({id,version,input});",
        " if(f.failNext){f.failNext=false;throw Error('IPC quote rejected');}",
        " if(f.delay)await new Promise(resolve=>{f.release=resolve;});",
        " const line={...source,id:'added-'+version,catalogItemId:version.split('-v1')[0],",
        "  catalogVersionId:version,label:version,source:'catalog',snapshot:{itemId:version.split('-v1')[0]}};",
        " return {...f.quote,lines:[...f.quote.lines,line]};",
        " }}};",
        "const root=createRoot(document.getElementById('root'));",
        "window.renderFixture=()=>root.render(<QuoteOfferOptionsPanel quote={window.fixture.quote}",
        " onSave={q=>{window.fixture.quote=q;window.renderFixture();}}/>);",
        "window.entries=()=>unsavedRegistry.active().map(x=>({label:x.label,pending:x.pending}));",
        "window.renderFixture();",
      ].join('\n');
      await require('esbuild').build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},
        bundle:true,nodePaths:[path.join(repo,'node_modules')],
        outfile:path.join(dir,'fixture.js'),jsx:'automatic',logLevel:'silent'});
      fs.writeFileSync(path.join(dir,'index.html'),
        '<!doctype html><html lang="fr"><meta charset="utf-8"><body><div id="root"></div><script src="fixture.js"></script></body>');
      win=new BrowserWindow({show:false,width:1024,height:820,
        webPreferences:{contextIsolation:false,nodeIntegration:false,backgroundThrottling:false}});
      await win.loadFile(path.join(dir,'index.html'));
      const results=await win.webContents.executeJavaScript('('+async function(){
        const checks=[];
        const sleep=(ms=60)=>new Promise(resolve=>setTimeout(resolve,ms));
        async function until(fn,name){for(let i=0;i<80;i++){let r=fn();if(r)return r;await sleep();}throw Error('Timeout '+name+' '+document.body.textContent);}
        const check=(name,ok)=>{checks.push({name,passed:!!ok});if(!ok)throw Error(name);};
        const row=id=>document.querySelector('[data-recommendation-version="'+id+'"]');
        const add=id=>[...row(id).querySelectorAll('button')].find(b=>b.textContent.includes('Ajouter ce service'));
        await until(()=>row('audit-v1')&&row('seo-v1')&&row('old-v1'),'recs load');
        check('04D quote read-only advice has no implicit purchase',window.fixture.calls.length===0&&window.fixture.quote.lines.length===1);
        check('04D published recommendation marked not yet bought',row('audit-v1').dataset.recommendationState==='recommended');
        check('04D withdrawn service remains visible and cannot be purchased',row('old-v1').dataset.recommendationState==='unavailable'&&!add('old-v1'));
        window.fixture.delay=true;
        add('audit-v1').click();
        await until(()=>typeof window.fixture.release==='function','delayed IPC');
        const called=window.fixture.calls.length;
        const still=add('audit-v1');if(still)still.click();
        check('04D double click blocked while quote IPC pending',window.fixture.calls.length===called);
        window.fixture.release();
        window.fixture.delay=false;
        await until(()=>row('audit-v1')?.dataset.recommendationState==='already-added','added state');
        check('04D explicit addition creates exactly one line',window.fixture.quote.lines.length===2&&window.fixture.calls.length===1);
        check('04D already present recommendation not purchasable twice',!add('audit-v1'));
        const price=row('seo-v1').querySelector('input');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(price,'49,00');
        price.dispatchEvent(new Event('input',{bubbles:true}));
        price.dispatchEvent(new Event('change',{bubbles:true}));
        await sleep();
        window.fixture.failNext=true;
        add('seo-v1').click();
        await until(()=>document.querySelector('[role="alert"]'),'IPC error');
        check('04D failed quote insertion leaves quote unchanged',window.fixture.quote.lines.length===2);
        check('04D failed insertion reports error and preserves input',document.querySelector('[role="alert"]').textContent.includes('IPC quote rejected')&&row('seo-v1').querySelector('input').value==='49,00');
        window.fixture.quote={...window.fixture.quote,status:'sent'};
        window.renderFixture();
        await sleep();
        check('04D sent quote exposes no purchasing action',!add('seo-v1')&&row('seo-v1').textContent.includes('consultative'));
        check('04D no renderer runtime exceptions',window.fixtureErrors.length===0);
        return checks;
      }.toString()+')()');
      console.log('LOT04D QUOTE ELECTRON '+results.length+' checks, failed=0');
      for(const r of results)console.log('PASS '+r.name);
      win.destroy();app.exit(0);
    }catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();app.exit(1);}
  }
  app.whenReady().then(run);
}

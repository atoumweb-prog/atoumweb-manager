// 04E: isolated Electron Chromium validation of the shared Prospect/Devis commercial help.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-04e-guidance-'));
  const env={...process.env,ATOUMWEB_04E_GUIDANCE_DIR:dir};
  delete env.ELECTRON_RUN_AS_NODE;
  try{
    const child=require('node:child_process').spawnSync(require('electron'),[__filename],{
      cwd:repo,env,encoding:'utf8',windowsHide:true,timeout:100000,
    });
    process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
    if(child.error)throw child.error;
    process.exitCode=child.status??1;
  }finally{
    if(dir.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('atoumweb-04e-guidance-'))
      fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}else{
  const {app,BrowserWindow}=require('electron');
  app.disableHardwareAcceleration();
  const dir=process.env.ATOUMWEB_04E_GUIDANCE_DIR;
  if(!dir||!dir.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(dir).startsWith('atoumweb-04e-guidance-'))
    throw Error('Disposable TEMP fixture required.');
  app.setPath('userData',path.join(dir,'profile'));
  async function run(){
    let win;
    try{
      const jsx=[
        "import React from 'react';",
        "import {createRoot} from 'react-dom/client';",
        "import {CommercialScope} from '"+path.join(repo,'src/renderer/commercial/CommercialScope').replaceAll('\\','/')+"';",
        "window.fixtureErrors=[];",
        "window.addEventListener('error',event=>window.fixtureErrors.push(String(event.error||event.message)));",
        "const old={description:'Original snapshot',commercialParameters:{salesPitch:'Old pitch',qualificationQuestions:'Old questions',commercialCautions:'No promise',relevantSituations:'Old situation'}};",
        "const newer={description:'New offer',commercialParameters:{salesPitch:'New pitch'}};",
        "createRoot(document.getElementById('old')).render(<CommercialScope version={old}/>);",
        "createRoot(document.getElementById('new')).render(<CommercialScope version={newer}/>);",
      ].join('\n');
      await require('esbuild').build({stdin:{contents:jsx,resolveDir:repo,loader:'tsx'},
        bundle:true,nodePaths:[path.join(repo,'node_modules')],outfile:path.join(dir,'fixture.js'),
        jsx:'automatic',logLevel:'silent'});
      fs.writeFileSync(path.join(dir,'index.html'),
        '<!doctype html><html lang="fr"><meta charset="utf-8"><body><div id="old"></div><div id="new"></div><script src="fixture.js"></script></body>');
      win=new BrowserWindow({show:false,width:900,height:690,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
      await win.loadFile(path.join(dir,'index.html'));
      const checks=await win.webContents.executeJavaScript('('+async function(){
        const result=[];
        const assert=(name,ok)=>{result.push({name,ok:!!ok});if(!ok)throw Error(name);};
        async function until(fn,label){for(let i=0;i<60;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout '+label);}
        await until(()=>document.querySelectorAll('summary').length===2,'React scopes');
        const first=document.querySelector('#old');
        const second=document.querySelector('#new');
        const details=first.querySelector('details');
        const summary=details.querySelector('summary');
        assert('04E historical snapshot remains selected',first.textContent.includes('Original snapshot')&&!first.textContent.includes('New pitch'));
        assert('04E current version remains separate',second.textContent.includes('New offer')&&!second.textContent.includes('Old pitch'));
        assert('04E details initially closed',!details.open);
        summary.focus();
        assert('04E summary keyboard-focusable',document.activeElement===summary);
        summary.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
        summary.click();
        assert('04E help opens without hover preference',details.open);
        assert('04E authored warning displayed',first.textContent.includes('No promise'));
        assert('04E no purchasing action',![...document.querySelectorAll('button')].some(b=>/ajouter au devis|acheter/i.test(b.textContent)));
        summary.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
        assert('04E Escape closes help',!details.open);
        assert('04E Escape restores summary focus',document.activeElement===summary);
        assert('04E no React runtime errors',window.fixtureErrors.length===0);
        return result;
      }.toString()+')()');
      console.log('LOT04E ELECTRON HELP '+checks.length+' checks, failed=0');
      for(const check of checks)console.log((check.ok?'PASS ':'FAIL ')+check.name);
      win.destroy();app.exit(0);
    }catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();app.exit(1);}
  }
  app.whenReady().then(run);
}

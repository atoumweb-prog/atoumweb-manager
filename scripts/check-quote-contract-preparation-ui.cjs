// Hidden Chromium + mocked IPC only. Never starts DatabaseService or opens Validation-MSI.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-preparation-ui-')),env={...process.env,ATOUMWEB_PREPARATION_UI_DIR:dir};delete env.ELECTRON_RUN_AS_NODE;try{const r=require('node:child_process').spawnSync(require('electron'),[__filename],{cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:45000});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;}finally{const target=path.resolve(dir);if(!target.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(target).startsWith('atoumweb-preparation-ui-'))throw Error('Chemin temporaire invalide');fs.rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});}}
else{
 const {app,BrowserWindow}=require('electron');app.disableHardwareAcceleration();const dir=process.env.ATOUMWEB_PREPARATION_UI_DIR;if(!dir)throw Error('Lancer avec node pour isoler le profil.');app.setPath('userData',path.join(dir,'profile'));
 const rootPath=repo.replaceAll('\\','/');
 const entry=`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import {QuoteContractPreparationPanel} from '${rootPath}/src/renderer/commercial/QuoteContractPreparationPanel';
 import {emptyContractParameters,emptyAdministration} from '${rootPath}/src/shared/quoteContractPreparation';
 import '${rootPath}/src/renderer/styles.css';
 const root=createRoot(document.getElementById('root'));let parameters=emptyContractParameters('professional'),admin=emptyAdministration(),state='draft',documents=[];
 window.calls={save:0,administration:0,attach:0};window.lastSaved=null;
 const build=()=>({parameters:structuredClone(parameters),state,documents:structuredClone(documents),snapshot:null,issues:state==='draft'?[{code:'INCOMPLETE',severity:'blocking',message:'Informations à renseigner'}]:[]});
 window.atoumweb={quotes:{get:async()=>({id:'q',status:state==='draft'?'draft':'sent',subject:'Devis fixture',lines:[{id:'l',label:'Ligne de test',snapshot:{familyCode:'MARIAGE'}}]})},quotePreparation:{get:async()=>build(),administration:async()=>structuredClone(admin),save:async(id,p)=>{window.calls.save++;parameters=structuredClone(p);window.lastSaved=structuredClone(p);return build()},saveAdministration:async(a)=>{window.calls.administration++;admin=structuredClone(a);return structuredClone(admin)},importDocument:async(id,role,provenance)=>{window.calls.attach++;documents.push({id:'e',documentId:null,relativePath:'preuve.pdf',fileName:'preuve.pdf',role,sha256:'a'.repeat(64),attachedAt:'2026-10-03T00:00:00Z',provenance});return build()},openDocument:async()=>{}}};
 window.render=(newState='draft',historical=false)=>{state=newState;if(historical)parameters=null;root.render(<QuoteContractPreparationPanel key={newState+historical} quote={{id:'q',status:newState==='draft'?'draft':'sent',subject:'Devis fixture',lines:[{id:'l',label:'Ligne de test',snapshot:{familyCode:'MARIAGE'}}]}} onSave={()=>{}}/>)};
 window.render();`;
 app.whenReady().then(async()=>{let win;try{
   await require('esbuild').build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},bundle:true,nodePaths:[path.join(repo,'node_modules')],outfile:path.join(dir,'fixture.js'),jsx:'automatic',logLevel:'silent'});
   fs.writeFileSync(path.join(dir,'fixture.html'),'<html lang="fr"><head><link rel="stylesheet" href="fixture.css"></head><body data-theme="atoumweb"><div id="root" style="max-width:1100px;margin:20px"></div><script src="fixture.js"></script></body></html>');
   win=new BrowserWindow({show:false,width:1280,height:1000,webPreferences:{contextIsolation:false,nodeIntegration:false,backgroundThrottling:false}});await win.loadFile(path.join(dir,'fixture.html'));
   const result=await win.webContents.executeJavaScript(`(async()=>{
     const checks=[],wait=()=>new Promise(r=>setTimeout(r,80)),assert=(name,v)=>{checks.push({name,passed:Boolean(v)});if(!v)throw Error(name)};
     const find=label=>[...document.querySelectorAll('label')].find(l=>l.firstChild?.textContent===label)?.querySelector('input,select');
     const fill=async(label,value)=>{const el=find(label);if(!el)throw Error('Champ absent : '+label);Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));await wait()};
     const click=async(label)=>{const el=[...document.querySelectorAll('button')].find(b=>b.textContent===label);if(!el)throw Error('Bouton absent : '+label);el.click();await wait()};
     await wait();assert('Défauts administratifs visibles',document.body.textContent.includes('Informations à renseigner'));
     assert('Liens de contrôle présents',document.querySelector('.contract-issue-link')!==null);assert('Paiement initial acompte par défaut',find('Paiement initial').value==='acompte');
     await fill('Audience','consumer');assert('Contrôles B2C exposés',document.body.textContent.includes('Contrôles consommateur'));
     await fill('Canal de conclusion','off_premises');assert('Parcours hors établissement exposé',document.body.textContent.includes('Parcours hors établissement vérifié'));
     await fill('Modèle d’échéancier','30_40_30');await click('Enregistrer la préparation');assert('Échéancier 30/40/30 enregistré',JSON.stringify(window.lastSaved.payment.milestones.map(m=>m.percent))==='[30,40,30]');assert('Aucune pénalité B2B dans paramètres consumer',window.lastSaved.payment.professionalTerms===null);
     await fill('Audience','professional');await click('Enregistrer la préparation');assert('Doctrine B2B séparée',window.lastSaved.payment.professionalTerms.lateRate==='three_times_legal');
     const rsvp=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Fonction RSVP prévue')).querySelector('input');rsvp.click();await wait();const sensitive=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Collecte sensible')).querySelector('input');assert('Collecte sensible désactivée et non sélectionnable',sensitive.disabled&&!sensitive.checked);
     await fill('Provenance réelle (document reçu, source, date…)','Document reçu, test isolé');await click('Rattacher une pièce');assert('Import de pièce générique via IPC dédié',window.calls.attach===1);assert('Provenance affichée',document.body.textContent.includes('Document reçu, test isolé'));
     for(const theme of ['atoumweb','noir','blanc']){document.documentElement.dataset.theme=theme;await wait();assert('Thème réellement appliqué '+theme,getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()===({atoumweb:'#f5f3ee',noir:'#0e1115',blanc:'#f7f8fa'})[theme]);assert('Pas de débordement horizontal thème '+theme,document.documentElement.scrollWidth<=window.innerWidth);}
     window.render('frozen');await wait();assert('Paramètres gelés non éditables',document.querySelector('fieldset').disabled);assert('Pas de bouton d’enregistrement au gel',![...document.querySelectorAll('button')].some(b=>b.textContent==='Enregistrer la préparation'));
     window.render('historical_missing',true);await wait();assert('Absence historique explicite',document.body.textContent.includes('Absence historique conservée'));assert('Pas de formulaire inventé pour historique',!document.querySelector('fieldset'));
     return {passed:checks.length,failed:0,checks};
   })()`);console.log(JSON.stringify(result,null,2));win.destroy();app.exit(0);
 }catch(e){console.error(e);if(win&&!win.isDestroyed())win.destroy();app.exit(1);}});
}

// Targeted Lot 1 checks in hidden Chromium, with mocked IPC and a temporary profile.
// No DatabaseService, workspace bootstrap or real client database is loaded.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const repo = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-contract-ui-'));
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  env.ATOUMWEB_CONTRACT_UI_DIR = fixtureDir;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename], {
    cwd: repo, env, windowsHide: true, encoding: 'utf8', timeout: 45000,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error.message);
  const target = path.resolve(fixtureDir);
  if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('atoumweb-contract-ui-')) throw Error('Chemin temporaire invalide');
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
app.disableHardwareAcceleration();
const dir = process.env.ATOUMWEB_CONTRACT_UI_DIR;
if (!dir) throw Error('Lancer ce script avec node pour isoler le profil de recette.');
app.setPath('userData', path.join(dir, 'profile'));
const importedSource = JSON.parse(fs.readFileSync(path.join(repo, 'data/contracts/atoumweb-contract-library-v1.json'), 'utf8'));
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {ContractTermsBuilder} from '${repo.replaceAll('\\', '/')}/src/renderer/commercial/ContractTermsBuilder';
import {ClientDocumentsPanel} from '${repo.replaceAll('\\', '/')}/src/renderer/crm/ClientDocumentsPanel';
const root=createRoot(document.getElementById('root'));
let templates=[];
let build={quoteId:'q',audience:'professional',locked:false,snapshotState:'draft',clauses:[],compiledText:'',snapshotText:null,compiledAt:null,warnings:[]};
window.calls={create:0,createVersion:0,publish:0,sync:0};
window.atoumweb={clientDocuments:{list:async()=>[{id:'doc',category:'contract',title:'PDF accepté',fileName:'preuve.pdf',archivedAt:'2026-10-03'}],deletePermanently:async()=>{throw Error('Preuve contractuelle rattachée : suppression interdite')}},catalog:{list:async()=>[]},contractTerms:{library:{
  list:async()=>structuredClone(templates),
  create:async(input,version)=>{window.calls.create++; const t={...input,id:'t',status:'active',catalogItemIds:[],currentVersion:null,currentVersionId:null,versions:[{id:'v1',versionNumber:1,status:'draft',body:version.body}]};templates.push(t);return structuredClone(t)},
  createVersion:async(id,input)=>{window.calls.createVersion++;const t=templates.find(t=>t.id===id);const v={id:'v'+(t.versions.length+1),versionNumber:t.versions.length+1,status:'draft',body:input.body};t.versions.push(v);return structuredClone(v)},
  publishVersion:async(id)=>{window.calls.publish++;const t=templates.find(t=>t.versions.some(v=>v.id===id));t.versions.forEach(v=>{if(v.status==='published')v.status='retired'});const v=t.versions.find(v=>v.id===id);v.status='published';t.currentVersion=v;t.currentVersionId=v.id;return structuredClone(t)},
},quotes:{get:async()=>structuredClone(build),sync:async()=>{window.calls.sync++;return structuredClone(build)}}}};
window.fixture={get templates(){return templates},get build(){return build},setBuild(v){build={...build,...v}}};
window.renderQuote=(input={})=>root.render(<ContractTermsBuilder quote={{id:'q',status:'draft',...input}}/>);
window.renderDocuments=()=>root.render(<ClientDocumentsPanel clientId="client"/>);
window.renderImportedLibrary=()=>{
 const source=JSON.parse(${JSON.stringify(JSON.stringify(importedSource))});
 templates=source.records.map(r=>({id:r.code,code:r.code,title:r.title,scope:r.scope,audience:r.audience,status:'active',currentVersion:null,currentVersionId:null,catalogItemIds:source.links.filter(l=>l.clauseCode===r.code).map(l=>l.awCode),versions:[{id:r.code+'-v1',versionNumber:1,status:'draft',body:r.body,review:r.review}]}));
 root.render(<ContractTermsBuilder key="imported" quote={{id:'q',status:'sent'}}/>);
};
window.renderQuote();
`;
app.whenReady().then(async () => {
  let win;
  try {
    await require('esbuild').build({ stdin: { contents: entry, resolveDir: repo, loader: 'tsx' }, bundle: true,
      nodePaths: [path.join(repo, 'node_modules')], outfile: path.join(dir, 'fixture.js'), jsx: 'automatic', logLevel: 'silent' });
    fs.writeFileSync(path.join(dir, 'fixture.html'), '<!doctype html><html><body><div id="root"></div><script src="fixture.js"></script></body></html>');
    win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false } });
    await win.loadFile(path.join(dir, 'fixture.html'));
    const result = await win.webContents.executeJavaScript(`(async()=>{
      const checks=[];
      const wait=()=>new Promise(resolve=>setTimeout(resolve,80));
      const assert=(name,value)=>{checks.push({name,passed:Boolean(value)});if(!value)throw Error(name)};
      const click=async(text)=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent===text);if(!button)throw Error('Bouton absent : '+text);button.click();await wait()};
      const fill=async(label,value)=>{const field=[...document.querySelectorAll('label')].find(l=>l.firstChild?.textContent===label)?.querySelector('input,textarea');if(!field)throw Error('Champ absent : '+label);Object.getOwnPropertyDescriptor(field.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));await wait()};
      await wait();
      await click('Bibliothèque CGV');await click('+ Nouvelle clause');
      await fill('Code','TEST-DRAFT');await fill('Titre','Clause de recette');await fill('Texte de la version 1','Texte version 1.');
      await click('Enregistrer le brouillon');
      assert('Création sans publication',calls.create===1&&calls.publish===0);
      assert('Brouillon lisible et publication séparée',document.body.textContent.includes('Brouillon · v1')&&document.body.textContent.includes('Publier le brouillon v1'));
      assert('Aucune version publiée après création',fixture.templates[0].currentVersionId===null);
      await click('Publier le brouillon v1');
      assert('Publication volontaire v1',calls.publish===1&&fixture.templates[0].currentVersionId==='v1');
      await click('Nouvelle version');await fill('Nouvelle version','Texte version 2.');
      await click('Enregistrer la version en brouillon');
      assert('Nouvelle version sans publication',calls.createVersion===1&&calls.publish===1&&fixture.templates[0].versions[1].status==='draft');
      assert('Version publiée précédente conservée',fixture.templates[0].currentVersionId==='v1');
      await click('Publier le brouillon v2');
      assert('Publication volontaire v2',calls.publish===2&&fixture.templates[0].currentVersionId==='v2');
      const syncBefore=calls.sync;
      fixture.setBuild({locked:true,snapshotState:'frozen',snapshotText:'',compiledText:'Texte futur à ne pas afficher',compiledAt:'2026-10-03'});
      renderQuote({finalizedAt:'2026-10-03',contractCompiledAt:'2026-10-03',updatedAt:'frozen'});await wait();
      assert('Snapshot vide identifié',document.body.textContent.includes('Snapshot figé · vide'));
      assert('Aucun fallback pour snapshot vide',document.querySelector('.cgv-output textarea').value==='');
      assert('Pas de synchronisation du devis figé',calls.sync===syncBefore);
      fixture.setBuild({snapshotState:'historical_missing',snapshotText:null,compiledAt:null});
      renderQuote({status:'sent',updatedAt:'historical'});await wait();
      assert('Absence historique explicite',document.body.textContent.includes('Absence historique de snapshot'));
      assert('Pas de contrat historique reconstruit',document.querySelector('.cgv-output textarea').value===''&&calls.sync===syncBefore);
      renderDocuments();await wait();await click('Supprimer définitivement');
      assert('Refus de suppression visible dans les documents Client',document.querySelector('.form-error')?.textContent.includes('suppression interdite'));
      assert('Document toujours présent après refus',document.body.textContent.includes('PDF accepté'));
      const publishBefore=calls.publish;
      renderImportedLibrary();await wait();await click('Bibliothèque CGV');
      assert('118 clauses importées visibles en bibliothèque',document.querySelectorAll('.cgv-template').length===118);
      assert('118 versions brouillon exactes',document.querySelectorAll('.cgv-version-editor textarea').length===118&&fixture.templates.every(t=>t.currentVersionId===null&&t.versions[0].status==='draft'));
      assert('Revue et provenance présentes pour chaque brouillon',document.querySelectorAll('.cgv-review').length===118&&[...document.querySelectorAll('.cgv-review')].every(e=>e.textContent.includes('6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8')));
      assert('Cinq niveaux de revue distincts conservés',new Set(fixture.templates.map(t=>t.versions[0].review.level)).size===5);
      assert('409 rattachements et clause dormante',fixture.templates.reduce((n,t)=>n+t.catalogItemIds.length,0)===409&&fixture.templates.find(t=>t.code==='LANDING-GESTION').catalogItemIds.length===0);
      assert('Aucune publication indirecte après chargement',calls.publish===publishBefore);
      assert('Textes brouillons chargés sans altération',fixture.templates.every(t=>[...document.querySelectorAll('.cgv-template')].find(e=>e.querySelector('summary span').textContent.startsWith(t.code+' ·')).querySelector('.cgv-version-editor textarea').value===t.versions[0].body));
      return {passed:checks.length,failed:0,checks};
    })()`);
    console.log(JSON.stringify(result, null, 2));
    win.destroy();
    app.exit(0);
  } catch (error) {
    console.error(error);
    if (win && !win.isDestroyed()) win.destroy();
    app.exit(1);
  }
});

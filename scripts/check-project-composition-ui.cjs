// Targeted Chromium checks for Lot 6B. Uses installed Electron/esbuild; no app database.
// Run: node scripts/check-project-composition-ui.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const repo = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const {spawnSync} = require('node:child_process');
  const env = {...process.env}; delete env.ELECTRON_RUN_AS_NODE;
  const child = spawnSync(require('electron'), [__filename], {cwd:repo,env,windowsHide:true,encoding:'utf8',timeout:45000});
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.error) console.error(child.error.message);
  process.exit(child.status ?? 1);
}
const {app,BrowserWindow} = require('electron');
// This hidden fixture does not need GPU rendering. Disabling hardware acceleration
// avoids platform-specific GPU process failures on Windows dev machines.
app.disableHardwareAcceleration();
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-6b-ui-'));
const esbuild = require('esbuild');
const css = [...fs.readFileSync(repo+'/src/renderer/main.tsx','utf8').matchAll(/import '(\.\/[^']+\.css)'/g)].map(m=>`import '${repo.replaceAll('\\','/')}/src/renderer/${m[1].slice(2)}';`).join('\n');
const secondaryPresent = fs.readFileSync(repo+'/src/renderer/projects/ProjectsPage.tsx','utf8').includes("{detailTab !== 'plan' && <main");
const entry = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {buildComponentPreview} from '${repo.replaceAll('\\','/')}/src/renderer/projects/componentPreview';
import {extractComponentTexts,extractComponentVisuals,replaceComponentText,updateComponentVisual} from '${repo.replaceAll('\\','/')}/src/renderer/projects/componentLocalEditor';
import {ProjectSitesTab} from '${repo.replaceAll('\\','/')}/src/renderer/projects/ProjectSitesTab';
${css}
const page={id:'p1',projectId:'p',name:'Accueil',type:'module',displaySubtype:'page',status:'todo'};
const code={html:'<section class="hero"><h1>Titre source</h1><p>Contenu source</p></section>',css:'.hero {padding:80px;color:#123456;background:#eee;border-color:hsl(120 100% 25%);outline-color:rgba(255,0,0,0.5)}',javascript:''};
const version={id:'v1',itemId:'s1',versionNumber:1,contentType:'json',contentText:JSON.stringify({reusable:code})};
const source={id:'s1',name:'CTA test',category:'section',reuseStatus:'ready',tags:['manager-direct'],versions:[version],currentVersion:version,stableVersion:version};
const items=[1,2,3].map(i=>({id:'i'+i,sourceItemId:'s1',sourceVersionId:'v1',sourceVersionNumber:1,displayName:'CTA test',category:'section',localSettings:{},hasLocalChanges:false}));
let composition={id:'c1',projectNodeId:'p1',status:'draft',items};
window.fixture={source,code,items,get composition(){return composition}}; window.buildPreview=buildComponentPreview; window.localEditor={extractComponentTexts,extractComponentVisuals,replaceComponentText,updateComponentVisual};
window.atoumweb={projects:{sites:{list:async()=>[{id:'site1',name:'fleuriste.com'}],listPages:async()=>[{projectNodeId:'p1',projectSiteId:'site1',role:'home'}]}},time:{list:async()=>[],active:async()=>null},referentials:{library:{get:async()=>source,createReusableCode:async(input)=>{window.createdInput=input;return source},createVariantCode:async(input)=>{window.createdInput=input;return source},list:async()=>[source,{...source,id:'s2',name:'Pas prêt',reuseStatus:'adapt'}]},compositions:{getForProjectPage:async()=>composition,list:async()=>[],addItem:async()=>{composition={...composition,items:[...composition.items,{...items[0],id:'added-'+composition.items.length}]};return composition},updateItemLocalCode:async(c,id,input)=>{composition={...composition,items:composition.items.map(i=>i.id===id?{...i,hasLocalChanges:true,localHtml:input.html,localCss:input.css,localJavascript:input.javascript,localSettings:input.settings}:i)};return composition},resetItemLocalCode:async(c,id)=>{composition={...composition,items:composition.items.map(i=>i.id===id?{...i,hasLocalChanges:false,localHtml:null,localCss:null,localJavascript:null,localSettings:{}}:i)};return composition}}}};
createRoot(document.getElementById('root')).render(<div className="content-area projects-content" style={{height:'100vh'}}><div className="project-production-page"><header className="project-production-header">Projet test</header><nav className="project-production-nav">Sites et pages</nav><ProjectSitesTab projectId="p" nodes={[page]} onMessage={m=>{window.lastMessage=m}} onProjectChanged={async()=>{}} onOpenPage={()=>{}}/>${secondaryPresent?'<main className="project-production-secondary"/>':''}</div></div>);
`;
app.setPath('userData', path.join(dir, 'profile'));
app.whenReady().then(async () => {
  const checks = [];
  try {
    await esbuild.build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},nodePaths:[repo+'/node_modules'],bundle:true,outfile:dir+'/fixture.js',jsx:'automatic',logLevel:'silent'});
    fs.writeFileSync(dir+'/fixture.html','<html><head><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script src="fixture.js"></script></body></html>');
    const win = new BrowserWindow({
      show:false,
      width:1600,
      height:1000,
      webPreferences:{
        sandbox:false,
        contextIsolation:false,
        nodeIntegration:false,
        backgroundThrottling:false,
      },
    });
    let lastLoadFailure = null;
    let rendererGone = null;
    const rendererConsole = [];
    win.webContents.on('did-fail-load', (_event, code, description, validatedURL, isMainFrame) => {
      if (isMainFrame) lastLoadFailure = {code,description,validatedURL};
    });
    win.webContents.on('render-process-gone', (_event, details) => {
      rendererGone = details;
    });
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      rendererConsole.push({level, message, line, sourceId});
      if (rendererConsole.length > 80) rendererConsole.shift();
    });
    try {
      await win.loadFile(dir+'/fixture.html');
    } catch (error) {
      throw new Error(`Fixture load failed: ${error}; did-fail-load=${JSON.stringify(lastLoadFailure)}; renderer-gone=${JSON.stringify(rendererGone)}; fixture=${dir}`);
    }
    const js = async (code, label = 'renderer-eval') => {
      const wrapped = `(async()=>{try{
        const value = (${code});
        return {__awOk:true,value};
      }catch(error){
        return {__awOk:false,error:String(error),stack:error&&error.stack?String(error.stack):null};
      }})()`;
      let result;
      try {
        result = await win.webContents.executeJavaScript(wrapped);
      } catch (error) {
        throw new Error(`[${label}] Electron executeJavaScript failed: ${error}; renderer-gone=${JSON.stringify(rendererGone)}; console=${JSON.stringify(rendererConsole.slice(-12))}`);
      }
      if (!result || result.__awOk !== true) {
        throw new Error(`[${label}] ${result?.error ?? 'Renderer evaluation failed'}\n${result?.stack ?? ''}\nconsole=${JSON.stringify(rendererConsole.slice(-12))}`);
      }
      return result.value;
    };
    const settle = () => new Promise(resolve => setTimeout(resolve, 220));
    const check = async (name, code) => {
      try {
        const result = await js(code, name);
        checks.push({name, passed:result === true, result});
      } catch (error) {
        checks.push({name, passed:false, error:String(error), stack:error?.stack});
        throw error;
      }
    };
    const click = async (text, scope = 'document') => {
      const label = `click ${text}`;
      await js(`(()=>{const root=${scope};if(!root)throw Error('Scope absent');const b=[...root.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)}));if(!b)throw Error('Bouton absent: '+${JSON.stringify(text)});if(b.disabled)throw Error('Bouton désactivé: '+${JSON.stringify(text)});b.click();return true})()`, label);
      await settle();
    };
    const input = async (selector, value) => {
      const label = `input ${selector}`;
      await js(`(()=>{let e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Champ absent: '+${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`, label);
      await settle();
    };
    await settle();
    await check('Texte ciblé : seule la feuille H1 concernée change', `(()=>{
      const hero='<section><div class="banner">Votre titre</div><div class="badge"><span>Votre titre</span></div><h1>Pour les <span>Votre titre</span><em> personnalisable</em></h1><p>Votre titre</p></section>';
      const fields=window.localEditor.extractComponentTexts(hero);
      const target=fields.find(field=>field.path.join('.')==='0.2.1.0');
      const replacement="N'attendez plus";
      const changed=window.localEditor.replaceComponentText(hero,target.path,replacement);
      const doc=new DOMParser().parseFromString(changed,'text/html');
      return doc.querySelector('h1').innerHTML===('Pour les <span>'+replacement+'</span><em> personnalisable</em>')
        && doc.querySelector('.banner').textContent==='Votre titre'
        && doc.querySelector('.badge').textContent==='Votre titre'
        && doc.querySelector('p').textContent==='Votre titre';
    })()`);
    await check('Avantages : texte et icône détectés puis modifiables localement', `(()=>{
      const hero='<ul><li><span class="benefit-icon">✓</span><span>Structure claire et évolutive</span></li><li><span class="benefit-icon">✓</span><span>Sites responsive</span></li><li><span class="benefit-icon">✓</span><span>Accompagnement humain</span></li></ul>';
      const visuals=window.localEditor.extractComponentVisuals(hero); if(visuals.length!==3)return false;
      let changed=window.localEditor.updateComponentVisual(hero,visuals[1],{label:'Sites adaptés',symbol:'★',color:'#d4b170',backgroundColor:'#fff3c9',hidden:true});
      const doc=new DOMParser().parseFromString(changed,'text/html'); const icon=doc.querySelectorAll('.benefit-icon')[1];
      return doc.querySelectorAll('li')[0].textContent==='✓Structure claire et évolutive'
        && doc.querySelectorAll('li')[1].textContent==='★Sites adaptés'
        && icon.style.color==='rgb(212, 177, 112)' && icon.style.backgroundColor==='rgb(255, 243, 201)' && icon.style.display==='none'
        && doc.querySelectorAll('li')[2].textContent==='✓Accompagnement humain';
    })()`);
    await check('Onglet Sites sans panneau secondaire vide', `!document.querySelector('.project-production-secondary')`);
    await click('Accueil', "document.querySelector('.project-site-tree-pages')");
    await check('Occurrences de même source distinctes et numérotées', `document.querySelectorAll('.project-page-composition-item-wrap').length===3 && document.querySelector('.project-page-composition-list').textContent.includes('occurrence 3')`);
    await click('Réglages');
    await check('Pas de contenu horizontal masqué dans les réglages', `[...document.querySelectorAll('.project-component-settings-panel *')].every(e=>e.matches('input,textarea')||!e.clientWidth||e.scrollWidth<=e.clientWidth+1)`);
    await check('Fin réelle de la fiche accessible', `(()=>{let e=document.querySelector('.project-sites-detail-panel');e.scrollTop=e.scrollHeight;return e.lastElementChild.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom})()`);
    await check('Aperçu intégré laisse la molette au panneau', `getComputedStyle(document.querySelector('.project-component-settings-preview iframe')).pointerEvents==='none'`);
    await check('Pickers visuels disponibles pour hex, rgb et hsl', `document.querySelectorAll('input[type=color]').length===4`);
    await input('.project-component-settings-section input', 'Titre client');
    await check('Modification texte locale', `document.querySelector('.project-component-settings-section input').value==='Titre client'`);
    await click('Annuler');
    await check('Undo texte', `document.querySelector('.project-component-settings-section input').value==='Titre source'`);
    await click('Rétablir');
    await input('input[type=color]', '#abcdef');
    await click('Annuler');
    await check('Undo couleur', `document.querySelector('input[type=color]').value==='#123456'`);
    await click('Rétablir');
    await check('Redo couleur', `document.querySelector('input[type=color]').value==='#abcdef'`);
    await js(`document.querySelector('.project-component-advanced').open=true`); await settle();
    await input('.project-component-advanced textarea', '<h2>Nouveau code</h2>');
    await check('Champs texte actualisés après code avancé', `document.querySelector('.project-component-settings-section input').value==='Nouveau code'`);
    await click('Annuler');
    await check('Undo code conserve texte préparé', `document.querySelector('.project-component-advanced textarea').value.includes('Titre client')`);
    await click('Rétablir');
    await check('Redo code', `document.querySelector('.project-component-advanced textarea').value==='<h2>Nouveau code</h2>'`);
    await click('Annuler');
    await input('.project-component-note textarea','Note client');
    await click('Enregistrer les réglages');
    await check('Note locale enregistrée', `window.fixture.composition.items[0].localSettings.note==='Note client'`);
    await check('Enregistrement local sans mutation Bibliothèque', `window.fixture.composition.items[0].localHtml.includes('Titre client') && window.fixture.source.versions[0].contentText.includes('Titre source')`);
    await click('Aperçu de la Page');
    await check('Aperçu global utilise local et version source selon occurrence', `(()=>{const html=document.querySelector('.project-page-global-preview iframe').srcdoc;return html.includes('Titre client')&&html.includes('Titre source')})()`);
    await click('Fermer', "document.querySelector('.page-preview')");
    await input('.project-component-settings-section input','Non enregistré');
    await check('Promotion bloquée pour brouillon non enregistré', `document.querySelector('.project-component-promotion button').disabled`);
    await click('Version Bibliothèque');
    await check('Reset exact source et suppression des overrides', `document.querySelector('.project-component-advanced textarea').value===window.fixture.code.html && !window.fixture.composition.items[0].hasLocalChanges`);
    await click('Voir le module seul');
    await check('Module seul : iframe interactive de hauteur utilisable', `(()=>{let e=document.querySelector('.interactive-preview');return e.getBoundingClientRect().height>=300 && getComputedStyle(e).pointerEvents==='auto'})()`);
    await click('Fermer', "document.querySelector('.module-only-preview')");
    await click('+ Bibliothèque');
    await check('Éléments non prêts visibles mais non ajoutables', `document.querySelectorAll('.project-page-library-card').length===2 && document.querySelector('.not-ready button').disabled`);
    await input('.library-modal input','Pas prêt');
    await check('Recherche Bibliothèque', `document.querySelectorAll('.project-page-library-card').length===1 && document.querySelector('.project-page-library-card').textContent.includes('Pas prêt')`);
    await input('.library-modal input','');
    await click('Ajouter', "document.querySelector('.library-modal')");
    await click('+ Bibliothèque');
    await click('Ajouter', "document.querySelector('.library-modal')");
    await check('Deux ajouts du même CTA non dédupliqués', `window.fixture.composition.items.length===5 && new Set(window.fixture.composition.items.map(i=>i.id)).size===5`);
    await click('+ Créer un composant');
    await input('.project-page-component-form-grid input','Nouveau module');
    await input('textarea[rows="22"]','<style>.demo{color:red}</style><section class="demo">Création</section><script>window.example=1;</script>');
    await click('Analyser et répartir le code');
    await check('Extraction HTML/CSS/JS complète', `(()=>{let t=[...document.querySelectorAll('.create-modal textarea')];return t.some(e=>e.value==='<section class="demo">Création</section>')&&t.some(e=>e.value==='.demo{color:red}')&&t.some(e=>e.value==='window.example=1;')})()`);
    await click('Créer le composant et l’ajouter');
    await check('Création transmet les trois parties et ajoute une occurrence', `window.createdInput?.name==='Nouveau module' && window.createdInput?.javascript==='window.example=1;' && window.fixture.composition.items.length===6`);
    await click('Aperçu de la Page');
    await check('Aperçu global : dimensions non nulles', `document.querySelector('.project-page-global-preview iframe').getBoundingClientRect().height>300`);
    await click('Tablette');
    await check('Largeur tablette', `(()=>{
      const frame=document.querySelector('.project-page-global-preview iframe');
      const wrapper=frame?.parentElement;
      const active=[...document.querySelectorAll('.project-page-preview-controls button.active')].map(button=>button.textContent.trim());
      const frameWidth=frame?.getBoundingClientRect().width ?? -1;
      const wrapperWidth=wrapper?.getBoundingClientRect().width ?? -1;
      const available=document.querySelector('.project-page-global-preview')?.getBoundingClientRect().width ?? -1;
      if (Math.abs(frameWidth-768)<2 && Math.abs(wrapperWidth-768)<2 && active.includes('Tablette')) return true;
      return {frameWidth,wrapperWidth,available,active,wrapperStyleWidth:wrapper?.style.width ?? null};
    })()`);
    await click('Mobile');
    await check('Largeur mobile', `(()=>{
      const frame=document.querySelector('.project-page-global-preview iframe');
      const wrapper=frame?.parentElement;
      const active=[...document.querySelectorAll('.project-page-preview-controls button.active')].map(button=>button.textContent.trim());
      const frameWidth=frame?.getBoundingClientRect().width ?? -1;
      const wrapperWidth=wrapper?.getBoundingClientRect().width ?? -1;
      const available=document.querySelector('.project-page-global-preview')?.getBoundingClientRect().width ?? -1;
      if (Math.abs(frameWidth-390)<2 && Math.abs(wrapperWidth-390)<2 && active.includes('Mobile')) return true;
      return {frameWidth,wrapperWidth,available,active,wrapperStyleWidth:wrapper?.style.width ?? null};
    })()`);
    // Test the generated document in a same-origin test frame to inspect layout.
    // Production frames keep sandbox=""; this frame never executes source scripts.
    await js(`(()=>{let f=document.createElement('iframe');f.id='test-preview';f.sandbox='allow-same-origin';f.style='position:fixed;inset:0;width:800px;height:500px';f.srcdoc=window.buildPreview([{label:'Agressif',html:'<style>section{display:none!important}</style><section>Masqué localement</section>',css:'body{background:red}*{color:red}'},{label:'Sain',html:'<section><h1>Visible indépendant</h1></section>',css:'h1{color:blue}'}],true);document.body.append(f)})()`); await settle();
    await check('CSS agressif isolé : second composant réellement visible', `(()=>{let d=document.querySelector('#test-preview').contentDocument;let h=d.querySelectorAll('.aw-preview-host')[1].shadowRoot.querySelector('h1');return h.getBoundingClientRect().height>0 && d.defaultView.getComputedStyle(h).color==='rgb(0, 0, 255)'})()`);
    await check('Inspection conserve ordre et libellés', `(()=>{let d=document.querySelector('#test-preview').contentDocument;return [...d.querySelectorAll('.aw-preview-label')].map(e=>e.textContent).join('|')==='1. Agressif|2. Sain'})()`);
    await js("document.querySelector('#test-preview').remove()");
    await click('Fermer', "document.querySelector('.page-preview')");
    win.setSize(1200,800); await settle();
    await check('Panneau étroit : actions accessibles sans débordement', `[...document.querySelectorAll('.project-sites-detail-panel *')].filter(e=>!e.matches('input,textarea,small,strong')).every(e=>!e.clientWidth||e.scrollWidth<=e.clientWidth+1)`);
    await check('Panneau étroit : dernier contenu atteignable', `(()=>{let e=document.querySelector('.project-sites-detail-panel');e.scrollTop=e.scrollHeight;return e.lastElementChild.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom})()`);
    win.destroy();
  } catch (error) {
    if (!checks.some((check) => check.error === String(error))) {
      checks.push({
        name:'Parcours interrompu',
        passed:false,
        error:String(error),
        stack:error?.stack,
        rendererGone,
        rendererConsole: rendererConsole?.slice(-20),
      });
    }
  }
  const report = {passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks};
  fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,failed:report.failed,failures:checks.filter(c=>!c.passed)},null,2));
  app.exit(report.failed ? 1 : 0);
});

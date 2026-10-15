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
window.atoumweb={unsaved:{confirmExit:()=>true},projects:{sites:{list:async()=>[{id:'site1',name:'fleuriste.com'}],listPages:async()=>[{projectNodeId:'p1',projectSiteId:'site1',role:'home'}]}},time:{list:async()=>[],active:async()=>null},referentials:{library:{get:async()=>source,createReusableCode:async(input)=>{window.createdInput=input;return source},createVariantCode:async(input)=>{window.createdInput=input;return source},list:async()=>[source,{...source,id:'s2',name:'Pas prêt',reuseStatus:'adapt'}]},compositions:{getForProjectPage:async()=>composition,list:async()=>[],listPageExports:async()=>[],addItem:async()=>{composition={...composition,items:[...composition.items,{...items[0],id:'added-'+composition.items.length}]};return composition},updateItemLocalCode:async(c,id,input)=>{composition={...composition,items:composition.items.map(i=>i.id===id?{...i,hasLocalChanges:true,localHtml:input.html,localCss:input.css,localJavascript:input.javascript,localSettings:input.settings}:i)};return composition},resetItemLocalCode:async(c,id)=>{composition={...composition,items:composition.items.map(i=>i.id===id?{...i,hasLocalChanges:false,localHtml:null,localCss:null,localJavascript:null,localSettings:{}}:i)};return composition}}}};
createRoot(document.getElementById('root')).render(<div className="content-area projects-content" style={{height:'100vh'}}><div className="project-production-page"><header className="project-production-header">Projet test</header><nav className="project-production-nav">Sites et pages</nav><ProjectSitesTab projectId="p" nodes={[page]} onMessage={m=>{window.lastMessage=m}} onProjectChanged={async()=>{}} onOpenPage={()=>{}}/>${secondaryPresent?'<main className="project-production-secondary"/>':''}</div></div>);
`;
app.setPath('userData', path.join(dir, 'profile'));
app.whenReady().then(async () => {
  const checks = [];
  let rendererGone = null;
  const rendererConsole = [];
  try {
    await esbuild.build({stdin:{contents:entry,resolveDir:repo,loader:'tsx'},nodePaths:[repo+'/node_modules'],bundle:true,loader:{'.png':'dataurl'},outfile:dir+'/fixture.js',jsx:'automatic',logLevel:'silent'});
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
    win.webContents.on('did-fail-load', (_event, code, description, validatedURL, isMainFrame) => {
      if (isMainFrame) lastLoadFailure = {code,description,validatedURL};
    });
    win.webContents.on('render-process-gone', (_event, details) => {
      rendererGone = details;
    });
    win.webContents.on('console-message', (_event, details) => {
      rendererConsole.push({
        level: details.level,
        message: details.message,
        line: details.lineNumber,
        sourceId: details.sourceId,
      });
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
      await js(`(()=>{const root=${scope};if(!root)throw Error('Scope absent');const wanted=${JSON.stringify(text)};const all=[...root.querySelectorAll('button')];const labels=b=>[b.textContent||'',b.getAttribute('aria-label')||'',b.getAttribute('title')||''];const b=all.find(b=>!b.disabled&&labels(b).some(value=>value.trim()===wanted))??all.find(b=>!b.disabled&&labels(b).some(value=>value.includes(wanted)));if(!b)throw Error('Bouton absent: '+wanted);if(b.disabled)throw Error('Bouton désactivé: '+wanted);b.click();return true})()`, label);
      await settle();
    };
    const input = async (selector, value) => {
      const label = `input ${selector}`;
      await js(`(()=>{let e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Champ absent: '+${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`, label);
      await settle();
    };
    await settle();
    // R07G-27: every supported theme × density must retain legible controls
    // and a real Site/Page workbench at desktop width, using rendered Chromium.
    for (const theme of ['blanc','noir','atoumweb']) {
      for (const density of ['compact','comfort','comfort_plus']) {
        await js(`(()=>{document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.dataset.density=${JSON.stringify(density)};return true})()`);
        await check(`R07G-27 ${theme} × ${density} : lisibilité et largeur atelier`, `(()=>{
          const body=getComputedStyle(document.body);
          const root=document.documentElement;
          const workspace=document.querySelector('.project-sites-workspace');
          const font=parseFloat(body.fontSize);
          const width=workspace?.getBoundingClientRect().width??0;
          if(font>=14 && width>0 && root.scrollWidth<=root.clientWidth+1) return true;
          return {font,width,viewport:root.clientWidth,scrollWidth:root.scrollWidth};
        })()`);
      }
    }
    await js("(()=>{document.documentElement.dataset.theme='atoumweb';document.documentElement.dataset.density='comfort';return true})()");
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
    await check('Informations Page placées avant la composition', `Boolean(document.querySelector('.project-sites-page-info')?.compareDocumentPosition(document.querySelector('.project-page-composition')) & Node.DOCUMENT_POSITION_FOLLOWING)`);
    await click('Informations de la Page');
    await check('Informations Page dépliables', `document.querySelector('.project-sites-page-info').classList.contains('open') && !!document.querySelector('.project-sites-page-info .project-sites-detail-form')`);
    await click('Informations de la Page');
    await js(`document.querySelector('.project-sites-tree-head button').click()`, 'replier arborescence'); await settle();
    await check('Arborescence rétractable', `document.querySelector('.project-sites-workspace').classList.contains('tree-collapsed') && !!document.querySelector('.project-sites-tree-restore')`);
    await js(`document.querySelector('.project-sites-tree-restore').click()`, 'rouvrir arborescence'); await settle();
    await check('Arborescence restaurable', `!document.querySelector('.project-sites-workspace').classList.contains('tree-collapsed') && !!document.querySelector('.project-sites-tree-panel')`);
    await click('Réduire la fiche Page', "document.querySelector('.project-sites-detail-panel')");
    await check('Fiche Page rétractable', `document.querySelector('.project-sites-workspace').classList.contains('detail-collapsed') && !!document.querySelector('.project-sites-detail-restore')`);
    await click('Afficher la fiche Page');
    await check('Fiche Page restaurable', `!document.querySelector('.project-sites-workspace').classList.contains('detail-collapsed') && !!document.querySelector('.project-sites-detail-panel')`);
    await click('Code / aperçu');
    await check('Timer Page compact', `(()=>{const height=document.querySelector('.project-sites-page-work').getBoundingClientRect().height;return height<=60?true:{height}})()`);
    await check('Code aperçu dans une troisième colonne indépendante', `(()=>{
      const workspace=document.querySelector('.project-sites-workspace');
      const detail=document.querySelector('.project-sites-detail-panel');
      const shell=document.querySelector('.project-sites-inspector-shell');
      const dock=document.querySelector('.project-page-inspector-dock');
      return !!dock && workspace.classList.contains('inspector-open') && !!shell
        && Boolean(detail.compareDocumentPosition(shell) & Node.DOCUMENT_POSITION_FOLLOWING)
        && !document.querySelector('.project-page-composition-workspace').classList.contains('with-inspector');
    })()`);
    await click('Réduire l’atelier latéral', "document.querySelector('.project-sites-inspector-shell')");
    await check('Atelier latéral rétractable', `document.querySelector('.project-sites-workspace').classList.contains('inspector-collapsed') && document.querySelector('.project-sites-inspector-shell').classList.contains('collapsed')`);
    await click('Afficher l’atelier latéral', "document.querySelector('.project-sites-inspector-shell')");
    await check('Atelier latéral restaurable', `!document.querySelector('.project-sites-workspace').classList.contains('inspector-collapsed') && !!document.querySelector('.project-page-inspector-dock')`);
    await click('Réduire Code / aperçu', "document.querySelector('.project-page-inspector-pane.code-pane')");
    await check('Panneau Code aperçu rétractable seul', `document.querySelector('.project-page-inspector-pane.code-pane').classList.contains('collapsed') && !!document.querySelector('.project-page-inspector-pane.code-pane .project-page-inspector-pane-restore')`);
    await click('Afficher Code / aperçu', "document.querySelector('.project-page-inspector-pane.code-pane')");
    await check('Panneau Code aperçu restaurable seul', `!document.querySelector('.project-page-inspector-pane.code-pane').classList.contains('collapsed') && !!document.querySelector('.project-page-inspector-dock')`);
    await click('Tablette', "document.querySelector('.project-page-inspector-dock')");
    await check('Aperçu docké tablette', `document.querySelector('.project-page-inspector-dock-preview>div')?.style.width==='768px'`);
    await click('Mobile', "document.querySelector('.project-page-inspector-dock')");
    await check('Aperçu docké mobile', `document.querySelector('.project-page-inspector-dock-preview>div')?.style.width==='390px'`);
    await click('Agrandir', "document.querySelector('.project-page-inspector-dock')");
    await check('Atelier grand format disponible depuis Code', `document.querySelector('.project-page-inspector-workbench')?.classList.contains('expanded') && !!document.querySelector('.project-page-inspector-workbench.expanded .code-pane')`);
    await check('Grand écran Code privilégie la visualisation', `(()=>{
      const root=document.querySelector('.project-page-inspector-workbench.expanded .code-pane');
      const preview=root?.querySelector('.project-page-inspector-dock-preview');
      const tools=root?.querySelector('.project-page-inspector-dock-code');
      const ratio=preview?.getBoundingClientRect().width/tools?.getBoundingClientRect().width;
      const scrollable=['auto','scroll'].includes(getComputedStyle(tools).overflowY);
      return !!preview && !!tools && ratio>=2.2 && scrollable ? true : {ratio,scrollable,rootClass:root?.className,previewWidth:preview?.getBoundingClientRect().width,toolsWidth:tools?.getBoundingClientRect().width,viewport:innerWidth,layout:root ? getComputedStyle(root).display : null};
    })()`);
    await click('Quitter le grand écran', "document.querySelector('.project-page-inspector-workbench.expanded')");
    await click('Fermer aperçu');
    await click('Réglages');
    await check('Réglages ouverts dans le volet latéral', `!!document.querySelector('.project-sites-inspector-host .project-component-settings-panel.docked') && !document.querySelector('.project-page-composition-item-wrap .project-component-settings-panel')`);
    await click('Réduire Réglages', "document.querySelector('.project-page-inspector-pane.settings-pane')");
    await check('Panneau Réglages rétractable seul', `document.querySelector('.project-page-inspector-pane.settings-pane').classList.contains('collapsed') && !!document.querySelector('.project-page-inspector-pane.settings-pane .project-page-inspector-pane-restore')`);
    await click('Afficher Réglages', "document.querySelector('.project-page-inspector-pane.settings-pane')");
    await check('Panneau Réglages restaurable seul', `!document.querySelector('.project-page-inspector-pane.settings-pane').classList.contains('collapsed') && !!document.querySelector('.project-component-settings-panel.docked')`);
    await check('Pas de contenu horizontal masqué dans les réglages', `(()=>{
      const panel=document.querySelector('.project-component-settings-panel');
      const offenders=[...panel.querySelectorAll('*')].filter((e)=>{
        if(e.matches('input,textarea')||!e.clientWidth||e.scrollWidth<=e.clientWidth+1) return false;
        const own=getComputedStyle(e).overflowX;
        if(['auto','scroll'].includes(own)) return false;
        let parent=e.parentElement;
        while(parent && parent!==panel){
          const overflow=getComputedStyle(parent).overflowX;
          if(['auto','scroll'].includes(overflow)) return false;
          parent=parent.parentElement;
        }
        return true;
      });
      return offenders.length===0 ? true : offenders.slice(0,8).map((e)=>({
        tag:e.tagName,
        className:e.className,
        clientWidth:e.clientWidth,
        scrollWidth:e.scrollWidth,
        html:e.outerHTML.slice(0,380),
        parentClass:e.parentElement?.className,
        computedOverflow:getComputedStyle(e).overflowX
      }));
    })()`);
    await check('Fin réelle de la fiche accessible', `(()=>{let e=document.querySelector('.project-sites-detail-panel');e.scrollTop=e.scrollHeight;return e.lastElementChild.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom})()`);
    await check('Aperçu Réglages interactif et scrollable', `(()=>{const frame=document.querySelector('.project-component-settings-preview iframe');const scroller=document.querySelector('.project-component-settings-panel.docked .project-component-settings-grid');return getComputedStyle(frame).pointerEvents==='auto' && ['auto','scroll'].includes(getComputedStyle(scroller).overflowY)})()`);
    await check('Réglages possède Desktop Tablette Mobile', `(()=>{
      const root=document.querySelector('.project-page-inspector-pane.settings-pane');
      const labels=[...root.querySelectorAll('.project-component-settings-preview-devices button')].map(b=>b.textContent.trim());
      return ['Desktop','Tablette','Mobile'].every(label=>labels.includes(label));
    })()`);
    await click('Tablette', "document.querySelector('.project-component-settings-preview-devices')");
    await check('Aperçu Réglages tablette', `document.querySelector('.project-component-settings-preview-viewport>div')?.style.width==='768px'`);
    await click('Desktop', "document.querySelector('.project-component-settings-preview-devices')");
    await click('Agrandir l’atelier', "document.querySelector('.project-page-inspector-pane.settings-pane')");
    await check('Grand écran Réglages utilise la même logique', `(()=>{
      const root=document.querySelector('.project-page-inspector-workbench.expanded .settings-pane');
      const preview=root?.querySelector('.project-component-settings-preview');
      const tools=root?.querySelector('.project-component-settings-controls');
      const ratio=preview?.getBoundingClientRect().width/tools?.getBoundingClientRect().width;
      const scrollable=['auto','scroll'].includes(getComputedStyle(tools).overflowY);
      return !!preview && !!tools && ratio>=2.2 && scrollable ? true : {ratio,scrollable,rootClass:root?.className,previewWidth:preview?.getBoundingClientRect().width,toolsWidth:tools?.getBoundingClientRect().width,viewport:innerWidth,layout:root ? getComputedStyle(root).display : null};
    })()`);
    await click('Quitter le grand écran', "document.querySelector('.project-page-inspector-workbench.expanded')");
    await click('Code / aperçu');
    await check('Réglages et Code côte à côte', `document.querySelector('.project-page-inspector-workbench')?.classList.contains('both-open') && document.querySelectorAll('.project-page-inspector-pane').length===2`);
    await click('Agrandir l’atelier', "document.querySelector('.project-page-inspector-pane.settings-pane')");
    await check('Grand écran contient Réglages et Code', `(()=>{
      const workbench=document.querySelector('.project-page-inspector-workbench.expanded');
      return !!workbench
        && !!workbench.querySelector('.project-component-settings-panel.docked')
        && !!workbench.querySelector('.project-page-inspector-dock')
        && !!workbench.querySelector('.project-component-settings-section input')
        && !!workbench.querySelector('.project-page-inspector-dock-code');
    })()`);
    await click('Quitter le grand écran', "document.querySelector('.project-page-inspector-workbench.expanded')");
    await click('Réduire la fiche Page', "document.querySelector('.project-sites-detail-panel')");
    await check('Réduire Page conserve Réglages et Code', `(()=>{
      const detail=document.querySelector('.project-sites-detail-panel');
      const settings=document.querySelector('.project-component-settings-panel.docked');
      const code=document.querySelector('.project-page-inspector-dock');
      return detail.classList.contains('collapsed')
        && !!document.querySelector('.project-sites-detail-restore')
        && !!settings
        && !!code
        && !!document.querySelector('.project-page-inspector-dock-code details[open] pre');
    })()`);
    await click('Afficher la fiche Page', "document.querySelector('.project-sites-detail-panel')");
    await check('Restaurer Page conserve les deux volets', `!document.querySelector('.project-sites-detail-panel').classList.contains('collapsed') && !!document.querySelector('.project-component-settings-panel.docked') && !!document.querySelector('.project-page-inspector-dock')`);
    await js(`window.__atelierWidthBeforeCollapse=document.querySelector('.project-sites-inspector-shell').getBoundingClientRect().width`, 'mémoriser largeur atelier');
    await click('Réduire Réglages', "document.querySelector('.project-page-inspector-pane.settings-pane')");
    await check('Réduire Réglages libère sa largeur sans fermer Code', `(()=>{
      const shell=document.querySelector('.project-sites-inspector-shell');
      const code=document.querySelector('.project-page-inspector-pane.code-pane');
      const workbench=document.querySelector('.project-page-inspector-workbench');
      const gained=window.__atelierWidthBeforeCollapse-shell.getBoundingClientRect().width;
      return workbench.classList.contains('both-open')
        && workbench.classList.contains('settings-collapsed')
        && !code.classList.contains('collapsed')
        && gained>=80;
    })()`);
    await click('Afficher Réglages', "document.querySelector('.project-page-inspector-pane.settings-pane')");
    await check('Quatre panneaux disposent d’un repli indépendant', `(()=>{
      const button=(label)=>[...document.querySelectorAll('button')].some(b=>(b.getAttribute('aria-label')||b.getAttribute('title')||'').includes(label));
      return button('Masquer l’arborescence') && button('Réduire la fiche Page') && button('Réduire Réglages') && button('Réduire Code / aperçu');
    })()`);
    await check('Code HTML visible dans le volet normal', `!!document.querySelector('.project-page-inspector-dock-code details[open] pre')`);
    await check('Pickers visuels disponibles pour hex, rgb et hsl', `document.querySelectorAll('input[type=color]').length===4`);
    await input('.project-component-settings-section input', 'Titre client');
    await check('Modification texte locale', `document.querySelector('.project-component-settings-section input').value==='Titre client'`);
    await check('Code aperçu synchronisé avec le brouillon', `document.querySelector('.project-page-inspector-dock-code details[open] pre').textContent.includes('Titre client')`);
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
    await check('Validation explicite visible', `[...document.querySelectorAll('.project-component-settings-toolbar button')].some(button=>button.textContent.includes('Valider les changements'))`);
    await click('Valider les changements');
    await check('Validation explicite terminée', `[...document.querySelectorAll('.project-component-settings-toolbar button')].some(button=>button.textContent.includes('Changements validés') && button.disabled)`);
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
    await click('Fermer aperçu');
    await click('Fermer réglages');
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
    // Double click in the same JS turn must issue a single Site IPC mutation.
    await click('+ Site');
    await input('.project-sites-create-panel input[placeholder="Ex. Site principal"]','SITE DOUBLE CLIC TEST');
    await js(`(()=>{
      window.__siteCreateCalls=0;
      window.__siteList=[{id:'site1',name:'fleuriste.com'}];
      window.atoumweb.projects.sites.list=async()=>window.__siteList;
      window.atoumweb.projects.sites.create=(_projectId,data)=>{
        window.__siteCreateCalls++;
        return new Promise(resolve=>{window.__resolveSiteCreate=()=>{
          const created={id:'site-created',name:data.name,archivedAt:null};
          window.__siteList.push(created);
          resolve(created);
        };});
      };
      const b=[...document.querySelectorAll('.project-sites-create-panel button')].find(button=>button.textContent.includes('Créer le Site'));
      if(!b||b.disabled)throw Error('Site create action absent or disabled');
      b.click();
      b.click();
      return true;
    })()`);
    await check('Double clic Site : un seul appel IPC avant rerender', 'window.__siteCreateCalls===1');
    await js('(()=>{if(!window.__resolveSiteCreate)throw Error("Site creation not pending");window.__resolveSiteCreate();return true})()');
    await settle();
    await check('Le Site créé reste sélectionné après rafraîchissement asynchrone',
      `[...document.querySelectorAll('.project-site-tree-site.active')].some(e=>e.textContent.includes('SITE DOUBLE CLIC TEST'))`);
    // Two asynchronous timer refreshes may finish out of order. Only the latest
    // response is allowed to update the real-time summary of the selected Page.
    await js(`(()=>{const b=document.querySelector('.project-site-tree-pages button');if(!b)throw Error('Page absente');b.click();return true})()`);
    await settle();
    await js(`(()=>{
      window.__timerResolvers=[];
      window.atoumweb.time.list=()=>new Promise(resolve=>window.__timerResolvers.push(resolve));
      window.atoumweb.time.active=async()=>null;
      window.dispatchEvent(new Event('atoumweb:time-changed'));
      window.dispatchEvent(new Event('atoumweb:time-changed'));
      return true;
    })()`);
    await check('Deux actualisations chrono concurrentes enregistrées', 'window.__timerResolvers.length===2');
    await js(`(()=>{
      const fresh={id:'fresh',projectNodeId:'p1',durationSeconds:7200,paused:false,endedAt:'2026-10-14T11:00:00Z'};
      const stale={id:'stale',projectNodeId:'p1',durationSeconds:60,paused:false,endedAt:'2026-10-14T10:00:00Z'};
      window.__timerResolvers[1]([fresh]);
      window.__timerResolvers[0]([stale]);
      return true;
    })()`);
    await settle();
    await check('Chrono : réponse obsolète ne remplace pas les données récentes',
      `document.querySelector('.project-sites-time-summary strong')?.textContent.trim()==='2 h'`);

    await js(`(()=>{
      window.__timerRequests=[];
      window.lastMessage='UNCHANGED';
      window.atoumweb.time.list=()=>new Promise((resolve,reject)=>window.__timerRequests.push({resolve,reject}));
      window.dispatchEvent(new Event('atoumweb:time-changed'));
      window.dispatchEvent(new Event('atoumweb:time-changed'));
      return true;
    })()`);
    await check('Deux actualisations chrono avant rejet ancien', 'window.__timerRequests.length===2');
    await js(`(()=>{
      window.__timerRequests[1].resolve([{id:'fresh',projectNodeId:'p1',durationSeconds:7200,endedAt:'2026-10-14T11:00:00Z'}]);
      window.__timerRequests[0].reject(new Error('STALE TIMER FAILURE'));
      return true;
    })()`);
    await settle();
    await check('Erreur IPC obsolète ignorée sans fausse alerte',
      `window.lastMessage==='UNCHANGED'&&document.querySelector('.project-sites-time-summary strong')?.textContent.trim()==='2 h'`);

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

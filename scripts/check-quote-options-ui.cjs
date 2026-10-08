// Actual React renderer in isolated hidden Chromium; mocked IPC, no Manager/database startup.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const repo = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-options-ui-'));
  const env = { ...process.env, ATOUMWEB_OPTIONS_UI_DIR: dir }; delete env.ELECTRON_RUN_AS_NODE;
  try {
    const result = require('node:child_process').spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], { cwd: repo, env, windowsHide: true, encoding: 'utf8', timeout: 45000 });
    process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
    if (result.error) throw result.error; process.exitCode = result.status ?? 1;
  } finally {
    const target = path.resolve(dir);
    if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('atoumweb-options-ui-')) throw Error('Chemin temporaire invalide');
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
} else {
  const { app, BrowserWindow } = require('electron'); app.disableHardwareAcceleration();
  const dir = process.env.ATOUMWEB_OPTIONS_UI_DIR; if (!dir) throw Error('Lancer avec node.');
  app.setPath('userData', path.join(dir, 'profile'));
  const rootPath = repo.replaceAll('\\', '/');
  const entry = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {QuoteOfferOptionsPanel} from '${rootPath}/src/renderer/commercial/QuoteOfferOptionsPanel';
    import '${rootPath}/src/renderer/styles.css'; import '${rootPath}/src/renderer/quote-line-editor.css';
    const root=createRoot(document.getElementById('root'));let seq=0;
    const components=[{componentId:'included',serviceName:'Conception incluse',isOptional:false,quantityMilli:1000},
      {componentId:'page',serviceName:'Page supplémentaire',serviceVersionId:'page-v1',isOptional:true,quantityMilli:1000,priceCents:2000},
      {componentId:'seo',serviceName:'SEO local',serviceVersionId:'seo-v1',isOptional:true,quantityMilli:1000,priceCents:3000}];
    const offer={id:'offer-line',quoteId:'q',label:'Site vitrine',snapshot:{itemType:'offer',versionNumber:1,offerComponents:components},source:'catalog',quantityMilli:1000,contractLineValueCents:10000};
    window.quote={id:'q',status:'draft',lines:[structuredClone(offer)]};window.calls=[];
    const clone=()=>structuredClone(window.quote);
    const price=input=>Math.round(input.proposedUnitPriceCents*input.quantityMilli/1000*(input.adjustmentMode==='percent'?1-input.adjustmentValue/10000:1));
    window.atoumweb={quotes:{
      selectOfferOption:async(offerId,componentId,input)=>{window.calls.push({method:'select',offerId,componentId,input});if(window.reject)throw Error('Refus de test : option non publiée');const c=components.find(c=>c.componentId===componentId);window.quote.lines.push({...input,id:'purchase-'+(++seq),quoteId:'q',source:'catalog',catalogUnitPriceCents:c.priceCents,contractLineValueCents:price(input),snapshot:{canonicalCode:'AW-TEST-L6-'+componentId,versionNumber:1,prerequisites:['Accès fournis']},optionPurchase:{state:'purchased',sourceOfferLineId:offerId,sourceComponentId:componentId}});return clone()},
      updateLine:async(id,input)=>{window.calls.push({method:'update',id,input});const index=window.quote.lines.findIndex(l=>l.id===id);window.quote.lines[index]={...window.quote.lines[index],...input,contractLineValueCents:price(input)};return clone()},
      deselectOfferOption:async(offerId,componentId)=>{window.calls.push({method:'deselect',offerId,componentId});window.quote.lines=window.quote.lines.filter(l=>l.optionPurchase?.sourceComponentId!==componentId);return clone()}
    }};
    window.render=()=>root.render(<QuoteOfferOptionsPanel quote={clone()} onSave={q=>{window.quote=q;window.render()}}/>);
    window.reset=()=>{window.quote={id:'q',status:'draft',lines:[structuredClone(offer)]};window.render()};window.render();
  `;
  let win;
  app.whenReady().then(async () => {
    try {
      fs.writeFileSync(path.join(dir, 'entry.tsx'), entry);
      await require('esbuild').build({ entryPoints: [path.join(dir, 'entry.tsx')], bundle: true, nodePaths: [path.join(repo, 'node_modules')], outfile: path.join(dir, 'fixture.js'), jsx: 'automatic', logLevel: 'silent' });
      fs.writeFileSync(path.join(dir, 'fixture.html'), '<html lang="fr"><head><link rel="stylesheet" href="fixture.css"></head><body><div id="root" style="max-width:1000px;margin:20px"></div><script src="fixture.js"></script></body></html>');
      win = new BrowserWindow({ show: false, width: 1280, height: 1100, webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false } });
      await win.loadFile(path.join(dir, 'fixture.html'));
      const result = await win.webContents.executeJavaScript(`(async()=>{
        const checks=[],wait=()=>new Promise(r=>setTimeout(r,90));
        const assert=(name,condition)=>{checks.push({name,passed:Boolean(condition)});if(!condition)throw Error(name)};
        const buttons=()=>[...document.querySelectorAll('button')];
        const click=async(label)=>{const button=buttons().find(b=>b.textContent===label);if(!button)throw Error('Bouton absent '+label);button.click();await wait()};
        const fill=async(label,value)=>{const el=[...document.querySelectorAll('label')].find(l=>l.firstChild.textContent===label)?.querySelector('input,select');if(!el)throw Error('Champ absent '+label);Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));await wait()};
        await wait();assert('Services obligatoires inclus visibles',document.body.textContent.includes('Conception incluse'));
        assert('Deux options disponibles non achetées',document.querySelectorAll('[data-purchased="false"]').length===2&&window.quote.lines.length===1);
        await click('Ajouter au devis');assert('Ouvrir le choix ne vend pas encore une option',window.calls.length===0&&window.quote.lines.length===1);
        await fill('Quantité','3');await fill('Prix proposé / unité (€)','18');await fill('Mode','percent');await fill('Remise (%)','10');
        await click('Enregistrer la ligne');assert('Achat via IPC dédié et identité exacte',window.calls[0].method==='select'&&window.calls[0].offerId==='offer-line'&&window.calls[0].componentId==='page');
        assert('Quantité et remise transmises',window.calls[0].input.quantityMilli===3000&&window.calls[0].input.adjustmentValue===1000);
        assert('Option achetée visible après persistance',document.querySelectorAll('[data-purchased="true"]').length===1&&document.body.textContent.includes('48,6'));
        
        const details=document.querySelector('[data-purchased="true"] details');details.open=true;await wait();assert('Provenance lisible offre/service/version',details.textContent.includes('Site vitrine')&&details.textContent.includes('AW-TEST-L6-page'));
        await click('Modifier l’option');await fill('Quantité','4');await click('Enregistrer la ligne');assert('Modification conserve la ligne achetée',window.quote.lines.length===2&&window.quote.lines[1].quantityMilli===4000&&window.calls.at(-1).method==='update');
        await click('Retirer l’option');assert('Retrait explicite retourne à disponible',window.calls.at(-1).method==='deselect'&&window.quote.lines.length===1&&!document.querySelector('[data-purchased="true"]'));
        window.reject=true;await click('Ajouter au devis');await click('Enregistrer la ligne');assert('Erreur de persistance visible, aucun achat affiché',document.querySelector('[role="alert"]').textContent.includes('non publiée')&&window.quote.lines.length===1);window.reject=false;
        await click('Enregistrer la ligne');
        for(const theme of ['atoumweb','noir','blanc']){document.documentElement.dataset.theme=theme;await wait();assert('Thème appliqué '+theme,getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()===({atoumweb:'#f5f3ee',noir:'#0e1115',blanc:'#f7f8fa'})[theme]);assert('Pas de débordement '+theme,document.documentElement.scrollWidth<=innerWidth)}
        window.quote.finalizedAt='2026-10-03';window.quote.contractSnapshotJson='{}';window.render();await wait();assert('Aucun contrôle achat/retrait sur devis finalisé',buttons().length===0&&document.body.textContent.includes('Option figée'));
        window.quote.status='accepted';window.render();await wait();assert('Accepté en lecture seule',buttons().length===0);
        window.reset();window.quote.lines[0].snapshot.offerComponents=window.quote.lines[0].snapshot.offerComponents.map(({componentId,...rest})=>rest);window.render();await wait();assert('Historique sans identité non requalifiable',buttons().length===0&&document.body.textContent.includes('Aucune requalification automatique'));
        window.quote.lines=[];window.render();await wait();assert('État sans offre sans options fantômes',!document.querySelector('.quote-offer-options'));
        window.reset();await wait();return{passed:checks.length,failed:0,checks};
      })()`);
      const outputIndex = process.argv.indexOf('--output');
      if (outputIndex >= 0) {
        const output = path.resolve(process.argv[outputIndex + 1]); fs.mkdirSync(output, { recursive: true });
        fs.writeFileSync(path.join(output, 'ui-lot6.json'), JSON.stringify(result, null, 2) + '\n');
        fs.writeFileSync(path.join(output, 'ui-lot6.png'), (await win.webContents.capturePage()).toPNG());
      }
      console.log(JSON.stringify(result, null, 2)); win.destroy(); app.exit(0);
    } catch (error) { console.error(error); if (win && !win.isDestroyed()) win.destroy(); app.exit(1); }
  });
}

// Lot 2: real renderer in hidden Chromium with mocked IPC, isolated from the real database.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const repo = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const args=process.argv.slice(2);
  if(args.length!==0&&(args.length!==2||args[0]!=='--captures'))throw Error('Usage: node scripts/check-catalog-identity-ui.cjs [--captures NEW_ABSOLUTE_DIRECTORY]');
  if(args.length===2&&(!path.isAbsolute(args[1])||fs.existsSync(args[1])||/validation-msi/i.test(args[1])))throw Error('Capture path must be a new absolute directory outside Validation-MSI.');
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-catalog-ui-'));
  const env = { ...process.env, ATOUMWEB_CATALOG_UI_DIR: fixtureDir }; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename,...args], {
    cwd: repo, env, windowsHide: true, encoding: 'utf8', timeout: args.length?140000:90000,
  });
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error.message);
  const target = path.resolve(fixtureDir);
  if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('atoumweb-catalog-ui-')) throw Error('Chemin temporaire invalide');
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
app.disableHardwareAcceleration();
const dir = process.env.ATOUMWEB_CATALOG_UI_DIR;
const captureIndex=process.argv.indexOf('--captures');
const capturePath=captureIndex>=0?process.argv[captureIndex+1]:null;
if(capturePath&&(!path.isAbsolute(capturePath)||fs.existsSync(capturePath)||/validation-msi/i.test(capturePath)))throw Error('Unsafe screenshot path.');
if (!dir) throw Error('Lancer avec node pour isoler le profil de recette.');
app.setPath('userData', path.join(dir, 'profile'));
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {CatalogPage} from '${repo.replaceAll('\\', '/')}/src/renderer/commercial/CatalogPage';
import commercialSource from '${repo.replaceAll('\\', '/')}/data/catalogue/atoumweb-catalogue-v1.json';
const oldVersion={id:'old-v1',itemId:'legacy-id',versionNumber:1,status:'published',priceMode:'fixed',priceCents:69900,description:'Ancienne offre',inclusions:[],exclusions:[],prerequisites:[],createdAt:'2026-09-14',publishedAt:'2026-09-14'};
const items=[{id:'legacy-id',type:'service',name:'Ancien élément témoin',category:'Web',status:'active',visiblePublic:false,canonicalCode:null,currentVersion:oldVersion,versions:[oldVersion],createdAt:'2026-09-14'}];
window.calls={create:[],version:[],saveDraft:[],assign:[],statuses:[],publish:0};window.items=items;window.messages=[];window.simulateLostVersionReply=false;
window.fixtureErrors=[];window.addEventListener('error',event=>window.fixtureErrors.push(String(event.error?.stack||event.message)));window.addEventListener('unhandledrejection',event=>window.fixtureErrors.push(String(event.reason?.stack||event.reason)));
window.importedVersion={...commercialSource.records.find(r=>r.canonicalCode==='AW-WEB-VITRINE').version,id:'legacy-import-v2',itemId:'legacy-id',versionNumber:2,status:'draft',createdAt:'2026-10-03'};
window.categoryRecords=[];window.categoryCalls=[];window.categorySequence=0;
const legacyCategories=()=>{
  const groups=new Map();
  for(const item of items){
    if(item.categoryId||!item.category||!item.category.trim())continue;
    const bucket=groups.get(item.category)||[];bucket.push(item.id);groups.set(item.category,bucket);
  }
  return [...groups.entries()].map(([rawValue,itemIds])=>({rawValue,itemIds:[...itemIds].sort(),itemCount:itemIds.length}));
};
const normalizeCategory=val=>val.trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ');
const categoryApi={
  list:async()=>structuredClone(window.categoryRecords),
  listLegacy:async()=>structuredClone(legacyCategories()),
  create:async name=>{
    const clean=name.trim();if(!clean||window.categoryRecords.some(c=>normalizeCategory(c.name)===normalizeCategory(clean)))throw Error('Une catégorie portant ce nom existe déjà.');
    const c={id:'cat-test-'+(++window.categorySequence),name:clean,normalizedKey:normalizeCategory(clean),
      status:'active',revision:1,itemCount:0,createdAt:'fixture',updatedAt:'fixture',archivedAt:null};
    window.categoryRecords.push(c);window.categoryCalls.push('create');return structuredClone(c);
  },
  rename:async(id,name,revision)=>{
    const c=window.categoryRecords.find(c=>c.id===id);if(!c||c.revision!==revision)throw Error('Conflit de catégorie.');
    const old=c.name;c.name=name.trim();c.revision++;window.categoryCalls.push('rename');
    for(const item of items)if(item.categoryId===id)item.category=c.name;
    return structuredClone(c);
  },
  setStatus:async(id,status,revision)=>{
    const c=window.categoryRecords.find(c=>c.id===id);if(!c||c.revision!==revision)throw Error('Conflit de catégorie.');
    c.status=status;c.revision++;window.categoryCalls.push(status);return structuredClone(c);
  },
  assign:async input=>{
    const item=items.find(item=>item.id===input.itemId);
    if(!item||item.category!==input.expectedRawValue||(item.categoryId||null)!==input.expectedCategoryId)throw Error('Conflit : recharge la fiche.');
    const c=window.categoryRecords.find(c=>c.id===input.categoryId);
    if(c&&c.status==='archived')throw Error('Catégorie archivée.');
    item.category=c?.name||null;item.categoryId=c?.id||null;
    window.categoryCalls.push('assign');return undefined;
  },
  reconcileLegacy:async(rawValue,categoryId,expectedItemIds)=>{
    const actual=legacyCategories().find(x=>x.rawValue===rawValue)?.itemIds||[];
    if(JSON.stringify([...actual].sort())!==JSON.stringify([...expectedItemIds].sort()))throw Error('Conflit historique.');
    const c=window.categoryRecords.find(c=>c.id===categoryId);
    if(!c||c.status!=='active')throw Error('Catégorie cible invalide.');
    for(const item of items)if(item.category===rawValue&&!item.categoryId){item.category=c.name;item.categoryId=c.id;}
    window.categoryCalls.push('reconcile');return actual.length;
  },
};
window.atoumweb={catalogCategories:categoryApi,catalog:{
  list:async()=>structuredClone(items),getItem:async(id)=>structuredClone(items.find(i=>i.id===id)),
  create:async(input,version)=>{calls.create.push({input,version});const id='new-'+calls.create.length;const v={...version,id:id+'-v1',itemId:id,versionNumber:1,status:'draft',createdAt:'2026-10-03'};const item={...input,id,status:'active',canonicalCode:input.canonicalCode?.toUpperCase()||null,currentVersion:v,versions:[v]};items.push(item);return structuredClone(item)},
  createVersion:async(id,input,requestId)=>{
    const item=items.find(i=>i.id===id);
    const previouslyCreated=item.versions.find(v=>v.id===requestId);
    if(previouslyCreated){
      if(previouslyCreated.priceCents!==input.priceCents)throw Error('Conflit : UUID utilisé avec contenu différent');
      return structuredClone(previouslyCreated);
    }
    calls.version.push({id,input,requestId});
    const nextVersion=Math.max(...item.versions.map(v=>v.versionNumber))+1;
    const v={...input,id:requestId??id+'-v'+nextVersion,itemId:id,versionNumber:nextVersion,status:'draft',createdAt:'2026-10-03'};
    item.versions.unshift(v);
    if(item.currentVersion?.status!=='published')item.currentVersion=v;
    if(window.simulateLostVersionReply){window.simulateLostVersionReply=false;throw Error('La réponse IPC a été perdue après écriture');}
    return structuredClone(v);
  },
  saveDraftVersion:async(id,expected,input)=>{
    const item=items.find(i=>i.versions.some(v=>v.id===id));
    const v=item?.versions.find(v=>v.id===id);
    if(!v||v.status!=='draft')throw Error('Version publiée ou retirée : crée un nouveau brouillon.');
    if(JSON.stringify(v)!==JSON.stringify(expected))throw Error('Conflit : le brouillon a été modifié dans une autre fenêtre.');
    calls.saveDraft.push({id,expected,input});
    Object.assign(v,input);
    if(item.currentVersion.id===id)item.currentVersion=v;
    return structuredClone(v);
  },
  assignCanonicalCode:async(id,code)=>{calls.assign.push({id,code});if(!/^AW-[A-Z0-9-]+$/.test(code))throw Error('Code canonique invalide');const item=items.find(i=>i.id===id);item.canonicalCode=code;item.identityProvenance={reference:'manual'};return structuredClone(item)},
  publishVersion:async()=>{calls.publish++},listOfferComponents:async()=>[],
  listRecommendations:async()=>[],replaceRecommendations:async()=>[],
  listProductionBlueprints:async()=>[],
  setStatus:async(id,status)=>{const item=items.find(x=>x.id===id);calls.statuses.push({id,status});item.status=status;return structuredClone(item)},
  setVisiblePublic:async(id,visible)=>{const item=items.find(x=>x.id===id);item.visiblePublic=visible;return structuredClone(item)}, 
},contractTypes:{
  list:async()=>[],catalog:async()=>[],setCatalog:async()=>[],
},contractTerms:{library:{list:async()=>[]}},
  unsaved:{confirmExit:()=>true,publishState:()=>{}},
};
createRoot(document.getElementById('root')).render(<CatalogPage onMessage={message=>messages.push(message)}/>);
`;
app.whenReady().then(async () => {
  let win;
  try {
    await require('esbuild').build({ stdin: { contents: entry, resolveDir: repo, loader: 'tsx' }, bundle: true,
      nodePaths: [path.join(repo, 'node_modules')], outfile: path.join(dir, 'fixture.js'), jsx: 'automatic', logLevel: 'silent' });
    // Use the production CSS import chain and the real two-column shell, not a naked
    // React mock that would miss theme, density and horizontal overflow regressions.
    const main=fs.readFileSync(path.join(repo,'src/renderer/main.tsx'),'utf8');
    const cssPaths=[...main.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(match=>match[1]);
    if(cssPaths.length<25)throw Error('Production renderer CSS import chain incomplete.');
    const css=cssPaths.map(file=>fs.readFileSync(path.join(repo,'src/renderer',file),'utf8')).join('\n');
    if(css.includes('</style'))throw Error('Unexpected HTML closer in stylesheet.');
    const shell='<div class="app-shell"><aside class="sidebar"><div class="brand-block">AtoumWeb</div></aside>'+
      '<main class="main-area"><header class="topbar"><strong>Catalogue · recette native isolée</strong></header>'+
      '<section class="content-area"><div id="root"></div></section></main></div>';
    fs.writeFileSync(path.join(dir,'fixture.html'),
      '<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>'+css+'</style></head><body>'+
      shell+'<script src="fixture.js"></script></body></html>');
    win = new BrowserWindow({ show: Boolean(capturePath), width: 1440, height: 900, webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false } });
    await win.loadFile(path.join(dir, 'fixture.html'));
    const result = await win.webContents.executeJavaScript(`(async()=>{
      const checks=[];const wait=()=>new Promise(resolve=>setTimeout(resolve,90));
      const waitFor=async(selector,label)=>{
        for(let attempt=0;attempt<45;attempt++){
          const element=document.querySelector(selector);if(element)return element;
          await wait();
        }
        throw Error('Élément non monté : '+label+' ('+selector+'); page='+document.body.textContent.slice(0,600)+'; rendererErrors='+JSON.stringify(window.fixtureErrors));
      };
      const assert=(name,value)=>{checks.push({name,passed:Boolean(value)});if(!value)throw Error(name)};
      const click=async(text)=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);if(!b)throw Error('Bouton absent : '+text);b.click();await wait()};
      const fillField=async(field,value)=>{if(!field)throw Error('Champ absent');const proto=field.tagName==='SELECT'?HTMLSelectElement.prototype:field.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(field,value);field.dispatchEvent(new Event(field.tagName==='SELECT'?'change':'input',{bubbles:true}));await wait()};
      const field=(label)=>[...document.querySelectorAll('label')].find(l=>l.textContent.trim().startsWith(label))?.querySelector('input,select,textarea');
      const fill=async(label,value)=>fillField(field(label),value);
      await wait();
      assert('Vue organisée Catalogue visible par défaut',!!document.querySelector('.catalog-overview')&&document.body.textContent.includes('Services complémentaires'));
      await click("Tableau d'administration");
      assert('Tableau historique accessible',!!document.querySelector('tbody tr'));
      document.querySelector('tbody tr').click();
      const identitySection=await waitFor('.catalog-identity-section','fiche après bascule organisée → tableau');
      assert('04C huit onglets accessibles',document.querySelectorAll('.catalog-editor-tabs [role=tab]').length===8);
      assert('04C panneau ARIA connecté',document.querySelector('[role=tab][aria-selected=true]').getAttribute('aria-controls')===
        document.querySelector('[role=tabpanel]').id);
      document.querySelector('[role=tab][aria-selected=true]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      await wait();
      assert('04C navigation clavier flèche droite',document.querySelector('[role=tab][aria-selected=true]').textContent==='Tarifs & Abby'&&
        document.activeElement===document.querySelector('[role=tab][aria-selected=true]'));
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
      await wait();
      assert('04C clavier Home revient à identité',document.querySelector('[role=tab][aria-selected=true]').textContent==='Identité');
      assert('Ancien élément sans identité inventée',identitySection.textContent.includes('Non attribué'));
      assert('Attribution désactivée sans code', [...document.querySelectorAll('button')].find(b=>b.textContent==='Attribuer ce code').disabled);
      await fill('Code AW à attribuer','invalide');await click('Attribuer ce code');
      assert('Erreur visible et aucune attribution après refus',messages.at(-1).includes('invalide')&&items[0].canonicalCode===null);
      await fill('Code AW à attribuer','AW-TEST-ANCIEN');await click('Attribuer ce code');
      assert('Attribution sur UUID explicite',calls.assign.at(-1).id==='legacy-id'&&items[0].canonicalCode==='AW-TEST-ANCIEN');
      assert('Code attribué consultable et non renommable',document.querySelector('.catalog-identity-section').textContent.includes('AW-TEST-ANCIEN')&&!field('Code AW à attribuer'));
      assert('Ancienne version préservée',items[0].versions.length===1&&items[0].currentVersion.description==='Ancienne offre');
      await click('Modifier via une nouvelle version');
      await click('Contenu & périmètre');
      await fill('Description','Nouvelle proposition après publication');
      window.simulateLostVersionReply=true;
      await click('Créer v2');
      assert('04C/E102 réponse IPC perdue, brouillon effectivement créé',items[0].versions.length===2&&
        items[0].versions[0].status==='draft'&&calls.version.length===1);
      assert('04C/E102 saisie locale et erreur conservées',!!document.querySelector('.catalog-version-editor .form-error')&&
        [...document.querySelectorAll('.catalog-version-editor textarea')].some(t=>t.value==='Nouvelle proposition après publication'));
      const requestId=calls.version[0].requestId;
      assert('04C/E102 UUID présent dans demande IPC',typeof requestId==='string'&&requestId.length===36);
      await click('Créer v2');
      assert('04C/E102 second clic utilise le même UUID',items[0].versions.length===2&&
        calls.version.length===1&&items[0].versions[0].id===requestId&&
        items[0].currentVersion.description==='Ancienne offre');
      await click('+ Service / Offre');
      await fill('Nom','Licence de recette');await fill('Code canonique AW','AW-TEST-LICENCE');
      await fill('Nature commerciale','subscription');await fill('Famille canonique','TECH');
      await fill('Libellé Abby','Licence fournisseur de recette');await fill('Unité','licence');await fill('Périodicité','annuelle');
      await fill('Base de prix','actual_cost');
      assert('Coût réel sans tarif fixe',field('Mode tarifaire').value==='quote_only'&&field('Mode tarifaire').disabled&&field('Prix AtoumWeb').disabled);
      await fill('Référence de source','Catalogue V1 témoin');await fill('Empreinte source SHA-256','ab'.repeat(32));await fill('Ligne ou clé de source','AW-TEST-LICENCE');
      await click('Créer le brouillon');
      const created=calls.create[0];
      assert('Code et nature transmis sans publication',created.input.canonicalCode==='AW-TEST-LICENCE'&&created.version.commercialKind==='subscription'&&calls.publish===0);
      assert('Unité, périodicité et provenance transmises',created.version.unit==='licence'&&created.version.periodicity==='annuelle'&&created.version.provenance.recordKey==='AW-TEST-LICENCE');
      assert('Pas de faux prix nul',created.version.priceCents===null&&created.version.priceBasis==='actual_cost');
      assert('Coût réel et nature visibles',document.body.textContent.includes('Coût tiers réel')&&document.body.textContent.includes('Abonnement'));
      await click('Reprendre le brouillon');
      assert('04C brouillon original rouvert',field('Unité').value==='licence'&&field('Périodicité').value==='annuelle'&&field('Base de prix').value==='actual_cost'&&field('Référence de source').value==='Catalogue V1 témoin');
      await click('Aide à la vente');
      assert('04E trois champs nouveaux éditables',
        !!field('Argumentaire commercial')&&!!field('Questions de qualification')&&!!field('Objections et réponses'));
      await fill('Argumentaire commercial','Présenter clairement le périmètre');
      await fill('Questions de qualification','Quels sont vos objectifs ?');
      await fill('Objections et réponses','Budget : décrire les livrables');
      await click('Historique');
      assert('04C publication bloquée pendant édition', [...document.querySelectorAll('.catalog-version-row button')].filter(b=>b.textContent==='Préparer la publication').every(b=>b.disabled));
      await click('Contenu & périmètre');
      await fill('Description','Enregistré en place, sans v2');
      await click('Tarifs & Abby');
      assert('04C champs tarifs réellement accessibles',!!field('Mode tarifaire')&&!!field('Prix AtoumWeb'));
      await fill('Acompte par défaut (%)','150');
      await click('Enregistrer le brouillon');
      assert('04C montant invalide préserve le brouillon et ne touche pas à SQLite',
        document.querySelector('.catalog-version-editor .form-error').textContent.includes('Acompte invalide')&&
        window.calls.saveDraft.length===0);
      await fill('Acompte par défaut (%)','30');
      await click('Contenu & périmètre');
      assert('04C changement d’onglet ne perd pas la saisie',field('Description').value==='Enregistré en place, sans v2');
      await click('Enregistrer le brouillon');
      assert('04C enregistrement sans nouvelle version',calls.saveDraft.length===1&&calls.version.length===1&&calls.publish===0&&items[1].versions.length===1);
      assert('04E argumentaire, qualification et objections sauvegardés via l’éditeur réel',
        calls.saveDraft[0].input.commercialParameters.salesPitch==='Présenter clairement le périmètre'&&
        calls.saveDraft[0].input.commercialParameters.qualificationQuestions==='Quels sont vos objectifs ?'&&
        calls.saveDraft[0].input.commercialParameters.objections==='Budget : décrire les livrables');
      assert('04C même ID de version conservé',calls.saveDraft[0].id===items[1].versions[0].id&&items[1].versions[0].description==='Enregistré en place, sans v2');
      await click('Identité');await click('Reprendre le brouillon');
      await click('Contenu & périmètre');
      await fill('Description','Brouillon local à conserver');
      items[1].versions[0].description='Changement fenêtre concurrente';
      await click('Enregistrer le brouillon');
      assert('04C conflit visible et éditeur conservé',!!document.querySelector('.catalog-version-editor .form-error')&&
        [...document.querySelectorAll('.catalog-version-editor textarea')].some(t=>t.value==='Brouillon local à conserver'));
      assert('04C aucune écriture concurrente ni duplication',calls.saveDraft.length===1&&items[1].versions.length===1&&
        items[1].versions[0].description==='Changement fenêtre concurrente');
      await click('Annuler');
      const search=document.querySelector('.inline-search');await fillField(search,'AW-TEST-LICENCE');
      assert('Recherche par code canonique',document.querySelectorAll('.catalog-compact-item').length===1&&document.querySelector('.catalog-compact-item').textContent.includes('Licence de recette'));
      await fillField(search,'Licence fournisseur de recette');
      assert('Recherche par libellé Abby',document.querySelectorAll('.catalog-compact-item').length===1);
      await fillField(search,'');items[0].versions.unshift(importedVersion);
      const legacyRow=[...document.querySelectorAll('.catalog-compact-item')].find(r=>r.textContent.includes('Ancien élément témoin'));if(!legacyRow)throw Error('Ancien item absent de la liste');legacyRow.click();await wait();
      await click('Historique');
      assert('Brouillon importé consultable sans remplacer la version publiée',!!document.querySelector('.catalog-import-draft')&&items[0].currentVersion.description==='Ancienne offre');
      document.querySelector('.catalog-import-draft summary').click();await wait();
      const importedDetail=document.querySelector('.catalog-import-draft');
      assert('Paramètres, inclusions et provenance importés visibles',importedDetail.open&&importedDetail.textContent.includes(importedVersion.commercialParameters.reviewTerms)&&importedDetail.textContent.includes(importedVersion.provenance.recordKey)&&importedDetail.textContent.includes(importedVersion.inclusions[0]));
      assert('Consultation du brouillon sans publication ni mutation de la version précédente',calls.publish===0&&items[0].currentVersion.id==='old-v1'&&items[0].currentVersion.priceCents===69900);
      // Lot 04B: the existing catalogue editor is still usable; exercise the new organized view
      // with synthetic, non-persisted entries only after all the historical identity assertions.
      document.querySelector('.catalog-detail-heading-actions .close-detail').click();await wait();
      const addV2Fixture=(id,name,code,category,type,kind,inclusions=[])=>{
        const v={id:id+'-v1',itemId:id,status:'published',versionNumber:1,
          priceMode:'fixed',priceCents:69900,description:'Description publiée '+name,
          inclusions,exclusions:[],prerequisites:[],commercialKind:kind,
          createdAt:'2026-10-14',publishedAt:'2026-10-14'};
        window.items.push({id,name,canonicalCode:code,category,type,status:'active',visiblePublic:false,
          createdAt:'2026-10-14',updatedAt:'2026-10-14',currentVersion:v,versions:[v]});
      };
      addV2Fixture('test-vitrine','Site vitrine 5 pages','AW-WEB-VITRINE','WEB','offer','offer',['Hébergement compris']);
      addV2Fixture('test-commerce','Boutique WooCommerce','AW-ECOM-BASE','ECOM','offer','offer');
      addV2Fixture('test-mariage','Mariage Essentiel','AW-MARIAGE-ESS','MARIAGE','offer','offer');
      addV2Fixture('test-maint','Maintenance WordPress mensuelle','AW-MAINT-WP-M','MAINT','service','subscription');
      addV2Fixture('test-seo','Audit SEO','AW-SEO-AUDIT','SEO','service','service');
      window.items.find(x=>x.id==='test-seo').currentVersion.commercialParameters={
        clientNeed:'Visibilité Google',benefits:'Être trouvé localement',keywords:'SEO de proximité',
      };
      await click('↻ Actualiser');await click('Vue organisée');
      const mainGroups=[...document.querySelectorAll('.catalog-overview-featured-group h4')].map(h=>h.textContent.trim());
      assert('04B quatre rubriques prioritaires',JSON.stringify(mainGroups)===JSON.stringify(['Site vitrine','Site e-commerce','Site mariage','Maintenance WordPress']));
      assert('04B maintenance conserve son item service',window.items.find(x=>x.id==='test-maint').type==='service');
      assert('04B inclusions publiées visibles',document.querySelector('[data-catalog-item-id="test-vitrine"]').textContent.includes('Hébergement compris'));
      assert('04B code secondaire masqué sur carte',!document.querySelector('[data-catalog-item-id="test-vitrine"]').textContent.includes('AW-WEB-VITRINE'));
      assert('04B service complémentaire classé', [...document.querySelectorAll('.catalog-overview-category h4')].some(h=>h.textContent.includes('Référencement et visibilité')));
      await fillField(document.querySelector('input.inline-search'),'VISIBILITE google');
      assert('E96 recherche par besoin client versionné',document.querySelectorAll('.catalog-overview-card').length===1&&
        document.querySelector('.catalog-overview-card').textContent.includes('Audit SEO'));
      await fillField(document.querySelector('input.inline-search'),'etre trouve localement');
      assert('E96 recherche par bénéfice versionné',document.querySelectorAll('.catalog-overview-card').length===1&&
        document.querySelector('.catalog-overview-card').textContent.includes('Audit SEO'));
      await fillField(document.querySelector('input.inline-search'),'seo de proximite');
      assert('E96 recherche par mot-clé versionné',document.querySelectorAll('.catalog-overview-card').length===1&&
        document.querySelector('.catalog-overview-card').textContent.includes('Audit SEO'));
      await click('Réinitialiser les filtres');
      await fillField(document.querySelector('select[aria-label="Filtrer par catégorie"]'),'SEO');
      assert('04B filtre catégorie explicite',document.querySelectorAll('.catalog-overview-card').length===1&&document.querySelector('.catalog-overview-card').textContent.includes('Audit SEO'));
      await click('Réinitialiser les filtres');
      assert('04B réinitialisation conserve toutes les prestations',document.querySelectorAll('.catalog-overview-card').length===window.items.length);
      document.querySelector('[data-catalog-item-id="test-vitrine"]').click();
      const openedFromCard=await waitFor('[data-search-entity-id="test-vitrine"]','fiche via carte 04B');
      assert('04B carte ouvre le bon item via route existante',openedFromCard.textContent.includes('Site vitrine'));
      await click('Production');
      assert('04C panneau production réel monté',!!document.querySelector('.catalog-production-panel'));
      assert('04C consultation de production sans Projet créé',document.querySelector('.catalog-production-panel').textContent.includes('Aucun blueprint lié'));
      await click('Aide à la vente');
      assert('04C aide commerciale non configurée signalée sans faux contenu',document.querySelector('.catalog-editor-tab-panel').textContent.includes('Aucune aide à la vente configurée'));
      await click('Historique');
      assert('04C versions historiques accessibles',!!document.querySelector('.catalog-versions'));
      // E95: exercise React category administration with a mocked IPC contract,
      // alongside backend SQLite tests that enforce actual transactions and FK.
      document.querySelector('.catalog-detail-heading-actions .close-detail').click();await wait();
      await click('Catégories existantes');
      await waitFor('.catalog-category-management','panneau gestion E95');
      assert('E95 inventaire affiche valeurs historiques réelles',document.querySelector('.catalog-category-inventory-table').textContent.includes('SEO'));
      assert('E95 valeurs historiques non assimilées en catégories',window.categoryRecords.length===0);
      await fill('Créer une catégorie métier','Création de contenu');
      await click('Créer la catégorie');
      assert('E95 création volontaire d’une catégorie stable',window.categoryRecords.length===1&&window.categoryRecords[0].name==='Création de contenu');
      assert('E95 création ne réaffecte aucune prestation',window.items.every(item=>!item.categoryId));
      await click('Renommer');
      await fill('Nouveau libellé','Contenu éditorial');
      await click('Enregistrer');
      assert('E95 renommage conserve ID et augmente révision',window.categoryRecords[0].name==='Contenu éditorial'&&window.categoryRecords[0].revision===2);
      await click('Archiver');
      await click('Confirmer');
      assert('E95 archivage conserve identité stable',window.categoryRecords[0].status==='archived'&&window.categoryRecords.length===1);
      await click('Restaurer');
      await click('Confirmer');
      assert('E95 restauration ne recrée pas la catégorie',window.categoryRecords[0].status==='active'&&window.categoryRecords[0].revision===4);
      // Select a known legacy item and target explicitly, then require confirmation.
      await fill('Prestation','test-seo');
      await fill('Catégorie cible',window.categoryRecords[0].id);
      await click('Préparer la réaffectation');
      assert('E95 aucun rattachement avant confirmation',!window.items.find(i=>i.id==='test-seo').categoryId);
      await click('Confirmer');
      assert('E95 réaffectation seulement après confirmation',
        window.items.find(i=>i.id==='test-seo').categoryId===window.categoryRecords[0].id);
      assert('E95 actions natives distinguées',
        ['create','rename','archived','active','assign'].every(action=>window.categoryCalls.includes(action)));
      await click('Fermer les catégories');
      await click('+ Service / Offre');
      await fill('Nom','Nouvel article classé');
      await fill('Catégorie métier administrée',window.categoryRecords[0].id);
      assert('E95 catégorie stable choisie pour nouvelle fiche',
        document.body.textContent.includes('Catégorie stable sélectionnée'));
      await click('Créer le brouillon');
      const newService=window.calls.create.at(-1);
      assert('E95 création Service transmet ID de catégorie gouvernée',
        newService.input.name==='Nouvel article classé'&&
        newService.input.categoryId===window.categoryRecords[0].id&&
        newService.input.category==='Contenu éditorial');
      assert('E95 première version non publiée',newService.version.priceMode==='fixed'&&window.calls.publish===0);
      await fillField(document.querySelector('select[aria-label="Statut de la prestation"]'),'archived');
      assert('04C changement de statut non encore écrit',window.calls.statuses.length===0&&
        window.items.at(-1).status==='active'&&!!document.querySelector('.catalog-status-confirmation'));
      await click('Annuler le changement');
      assert('04C annulation statut sans écriture',window.calls.statuses.length===0&&window.items.at(-1).status==='active');
      await fillField(document.querySelector('select[aria-label="Statut de la prestation"]'),'archived');
      await click('Confirmer le statut');
      assert('04C confirmation statut seule déclenche l’écriture',window.calls.statuses.length===1&&
        window.items.at(-1).status==='archived'&&window.items.at(-1).versions.length===1);
      document.querySelector('.catalog-detail-heading-actions .close-detail').click();await wait();
      await click('Catégories existantes');
      await waitFor('.catalog-category-management','administration catégories, recette visuelle');
      const visualModes=[];
      const modeDensities=[['compact',14],['comfort',16],['comfort_plus',18]];
      for(const theme of ['atoumweb','noir','blanc']){
        for(const [density,font] of modeDensities){
          document.documentElement.dataset.theme=theme;
          document.documentElement.dataset.density=density;
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const panel=document.querySelector('.catalog-category-management');
          const inventory=document.querySelector('.catalog-category-inventory');
          const content=document.querySelector('.content-area');
          const tableScroll=document.querySelector('.catalog-category-inventory-scroll');
          const bodyFont=parseFloat(getComputedStyle(document.body).fontSize);
          const labelFont=parseFloat(getComputedStyle(panel.querySelector('label')).fontSize);
          const heading=panel.querySelector('h3');
          const primary=panel.querySelector('button[type=submit]');
          assert('04B style réel et panneau monté '+theme+'/'+density,
            !!inventory&&!!content&&!!tableScroll&&!!heading&&!!primary);
          assert('04B police densité '+theme+'/'+density,bodyFont===font&&labelFont>=14);
          assert('04B controls visibles '+theme+'/'+density,
            primary.getBoundingClientRect().height>=32&&getComputedStyle(primary).display!=='none');
          assert('04B scroll horizontal confiné au tableau '+theme+'/'+density,
            document.documentElement.scrollWidth<=document.documentElement.clientWidth+12&&
            content.scrollWidth<=content.clientWidth+12);
          visualModes.push({theme,density,font:bodyFont,labelFont,
            bodyScroll:document.documentElement.scrollWidth,bodyWidth:document.documentElement.clientWidth,
            tableScroll:tableScroll.scrollWidth,tableWidth:tableScroll.clientWidth});
        }
      }
      window.__catalog04bModes=visualModes;
      return {passed:checks.length,failed:0,checks,visualModes};
    })()`);
    if(result.visualModes?.length!==9)throw Error('Visual modes incomplete');
    // Narrow window + native zoom: the category table may scroll inside its wrapper,
    // but the page itself must remain navigable.
    win.setSize(1024,720);
    win.webContents.setZoomFactor(1.25);
    await new Promise(resolve=>setTimeout(resolve,150));
    const narrow=await win.webContents.executeJavaScript(`(()=>{
      const content=document.querySelector('.content-area');
      const list=document.querySelector('.catalog-category-inventory-scroll');
      const field=document.querySelector('.catalog-category-management input');
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,
        client:document.documentElement.clientWidth,contentScroll:content?.scrollWidth,
        contentClient:content?.clientWidth,tableScroll:list?.scrollWidth,
        tableClient:list?.clientWidth,fieldAccessible:!!field&&field.getBoundingClientRect().width>100};
    })()`);
    if(!narrow.fieldAccessible||narrow.scroll>narrow.client+12||
       narrow.contentScroll>narrow.contentClient+12)
      throw Error('04B responsive width/zoom overflow '+JSON.stringify(narrow));
    console.log('[CATALOG 04B] RESPONSIVE ZOOM '+JSON.stringify(narrow));
    win.webContents.setZoomFactor(1);
    win.setSize(1440,900);
    if(capturePath){
      // Paint-frame sentinel ensures every PNG corresponds to the requested theme/density.
      const color=index=>[30+(index*41)%190,30+(index*83)%190,30+(index*117)%190];
      const verified=(photo,rgb)=>{
        const size=photo.getSize(),bytes=photo.toBitmap(),pos=((size.height-15)*size.width+(size.width-15))*4;
        if(bytes.length!==size.width*size.height*4)return false;
        const a=[...bytes.subarray(pos,pos+3)].sort((a,b)=>a-b),b=[...rgb].sort((a,b)=>a-b);
        return a.every((x,i)=>Math.abs(x-b[i])<=7);
      };
      fs.mkdirSync(capturePath);
      let n=0;
      for(const {theme,density} of result.visualModes){
        n++;
        const rgb=color(n);
        await win.webContents.executeJavaScript(`(()=>{
          document.documentElement.dataset.theme=${JSON.stringify(theme)};
          document.documentElement.dataset.density=${JSON.stringify(density)};
          let marker=document.getElementById('catalog-visual-frame-marker');
          if(!marker){marker=document.createElement('div');marker.id='catalog-visual-frame-marker';document.body.appendChild(marker);}
          marker.style.cssText='position:fixed!important;right:0!important;bottom:0!important;width:40px!important;height:40px!important;z-index:2147483647!important;pointer-events:none!important;background:rgb(${rgb.join(',')})!important';
        })()`);
        let photo=null;
        for(let attempt=0;attempt<20;attempt++){
          await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
          await new Promise(resolve=>setTimeout(resolve,80));
          const candidate=await win.webContents.capturePage();
          if(verified(candidate,rgb)){photo=candidate;break;}
        }
        if(!photo)throw Error('Stale or blank compositor frame '+theme+'/'+density);
        const destination=path.join(capturePath,theme+'-'+density+'.png');
        if(fs.existsSync(destination))throw Error('Screenshot already exists: '+destination);
        fs.writeFileSync(destination,photo.toPNG());
        console.log('[CATALOG 04B] VERIFIED CAPTURE '+n+'/9 '+theme+'/'+density);
      }
    }
    console.log(JSON.stringify(result, null, 2));win.destroy();app.exit(0);
  } catch (error) { console.error(error);if(win&&!win.isDestroyed())win.destroy();app.exit(1); }
});

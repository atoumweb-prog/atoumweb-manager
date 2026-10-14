// Lot 2: real renderer in hidden Chromium with mocked IPC, isolated from the real database.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const repo = path.resolve(__dirname, '..');
if (!process.versions.electron) {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-catalog-ui-'));
  const env = { ...process.env, ATOUMWEB_CATALOG_UI_DIR: fixtureDir }; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename], {
    cwd: repo, env, windowsHide: true, encoding: 'utf8', timeout: 45000,
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
if (!dir) throw Error('Lancer avec node pour isoler le profil de recette.');
app.setPath('userData', path.join(dir, 'profile'));
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {CatalogPage} from '${repo.replaceAll('\\', '/')}/src/renderer/commercial/CatalogPage';
import commercialSource from '${repo.replaceAll('\\', '/')}/data/catalogue/atoumweb-catalogue-v1.json';
const oldVersion={id:'old-v1',itemId:'legacy-id',versionNumber:1,status:'published',priceMode:'fixed',priceCents:69900,description:'Ancienne offre',inclusions:[],exclusions:[],prerequisites:[],createdAt:'2026-09-14',publishedAt:'2026-09-14'};
const items=[{id:'legacy-id',type:'service',name:'Ancien élément témoin',category:'Web',status:'active',visiblePublic:false,canonicalCode:null,currentVersion:oldVersion,versions:[oldVersion],createdAt:'2026-09-14'}];
window.calls={create:[],version:[],assign:[],publish:0};window.items=items;window.messages=[];
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
  createVersion:async(id,input)=>{calls.version.push({id,input});const item=items.find(i=>i.id===id);const v={...input,id:id+'-v2',itemId:id,versionNumber:2,status:'draft',createdAt:'2026-10-03'};item.versions.unshift(v);return structuredClone(v)},
  assignCanonicalCode:async(id,code)=>{calls.assign.push({id,code});if(!/^AW-[A-Z0-9-]+$/.test(code))throw Error('Code canonique invalide');const item=items.find(i=>i.id===id);item.canonicalCode=code;item.identityProvenance={reference:'manual'};return structuredClone(item)},
  publishVersion:async()=>{calls.publish++},listOfferComponents:async()=>[],
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
    fs.writeFileSync(path.join(dir, 'fixture.html'), '<!doctype html><html><body><div id="root"></div><script src="fixture.js"></script></body></html>');
    win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false } });
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
      const fillField=async(field,value)=>{if(!field)throw Error('Champ absent');const proto=field.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(field,value);field.dispatchEvent(new Event(field.tagName==='SELECT'?'change':'input',{bubbles:true}));await wait()};
      const field=(label)=>[...document.querySelectorAll('label')].find(l=>l.textContent.trim().startsWith(label))?.querySelector('input,select,textarea');
      const fill=async(label,value)=>fillField(field(label),value);
      await wait();
      assert('Vue organisée Catalogue visible par défaut',!!document.querySelector('.catalog-overview')&&document.body.textContent.includes('Services complémentaires'));
      await click("Tableau d'administration");
      assert('Tableau historique accessible',!!document.querySelector('tbody tr'));
      document.querySelector('tbody tr').click();
      const identitySection=await waitFor('.catalog-identity-section','fiche après bascule organisée → tableau');
      assert('Ancien élément sans identité inventée',identitySection.textContent.includes('Non attribué'));
      assert('Attribution désactivée sans code', [...document.querySelectorAll('button')].find(b=>b.textContent==='Attribuer ce code').disabled);
      await fill('Code AW à attribuer','invalide');await click('Attribuer ce code');
      assert('Erreur visible et aucune attribution après refus',messages.at(-1).includes('invalide')&&items[0].canonicalCode===null);
      await fill('Code AW à attribuer','AW-TEST-ANCIEN');await click('Attribuer ce code');
      assert('Attribution sur UUID explicite',calls.assign.at(-1).id==='legacy-id'&&items[0].canonicalCode==='AW-TEST-ANCIEN');
      assert('Code attribué consultable et non renommable',document.querySelector('.catalog-identity-section').textContent.includes('AW-TEST-ANCIEN')&&!field('Code AW à attribuer'));
      assert('Ancienne version préservée',items[0].versions.length===1&&items[0].currentVersion.description==='Ancienne offre');
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
      await click('Modifier via une nouvelle version');
      assert('Métadonnées reprises dans une nouvelle version',field('Unité').value==='licence'&&field('Périodicité').value==='annuelle'&&field('Base de prix').value==='actual_cost'&&field('Référence de source').value==='Catalogue V1 témoin');
      await click('Créer v2');
      assert('Nouvelle version en brouillon sans publication',calls.version.length===1&&calls.publish===0&&items[1].versions[0].status==='draft');
      const search=document.querySelector('.inline-search');await fillField(search,'AW-TEST-LICENCE');
      assert('Recherche par code canonique',document.querySelectorAll('.catalog-compact-item').length===1&&document.querySelector('.catalog-compact-item').textContent.includes('Licence de recette'));
      await fillField(search,'Licence fournisseur de recette');
      assert('Recherche par libellé Abby',document.querySelectorAll('.catalog-compact-item').length===1);
      await fillField(search,'');items[0].versions.unshift(importedVersion);
      const legacyRow=[...document.querySelectorAll('.catalog-compact-item')].find(r=>r.textContent.includes('Ancien élément témoin'));if(!legacyRow)throw Error('Ancien item absent de la liste');legacyRow.click();await wait();
      assert('Brouillon importé consultable sans remplacer la version publiée',document.querySelector('.catalog-import-draft')&&document.querySelector('.catalog-current-version').textContent.includes('Ancienne offre'));
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
      await click('↻ Actualiser');await click('Vue organisée');
      const mainGroups=[...document.querySelectorAll('.catalog-overview-featured-group h4')].map(h=>h.textContent.trim());
      assert('04B quatre rubriques prioritaires',JSON.stringify(mainGroups)===JSON.stringify(['Site vitrine','Site e-commerce','Site mariage','Maintenance WordPress']));
      assert('04B maintenance conserve son item service',window.items.find(x=>x.id==='test-maint').type==='service');
      assert('04B inclusions publiées visibles',document.querySelector('[data-catalog-item-id="test-vitrine"]').textContent.includes('Hébergement compris'));
      assert('04B code secondaire masqué sur carte',!document.querySelector('[data-catalog-item-id="test-vitrine"]').textContent.includes('AW-WEB-VITRINE'));
      assert('04B service complémentaire classé', [...document.querySelectorAll('.catalog-overview-category h4')].some(h=>h.textContent.includes('Référencement et visibilité')));
      await fillField(document.querySelector('select[aria-label="Filtrer par catégorie"]'),'SEO');
      assert('04B filtre catégorie explicite',document.querySelectorAll('.catalog-overview-card').length===1&&document.querySelector('.catalog-overview-card').textContent.includes('Audit SEO'));
      await click('Réinitialiser les filtres');
      assert('04B réinitialisation conserve toutes les prestations',document.querySelectorAll('.catalog-overview-card').length===window.items.length);
      document.querySelector('[data-catalog-item-id="test-vitrine"]').click();
      const openedFromCard=await waitFor('[data-search-entity-id="test-vitrine"]','fiche via carte 04B');
      assert('04B carte ouvre le bon item via route existante',openedFromCard.textContent.includes('Site vitrine'));
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
      return {passed:checks.length,failed:0,checks};
    })()`);
    console.log(JSON.stringify(result, null, 2));win.destroy();app.exit(0);
  } catch (error) { console.error(error);if(win&&!win.isDestroyed())win.destroy();app.exit(1); }
});

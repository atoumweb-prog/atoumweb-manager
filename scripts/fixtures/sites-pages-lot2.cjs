'use strict';
const fs = require('node:fs'), path = require('node:path');
module.exports = async ({ win, db, evalUI: js, get, wait, navigate, test, sleep }) => {
  const out = process.env.ATOUMWEB_SITES_LOT2_OUTPUT, checks = [], captures = [];
  const check = (ok, label) => { checks.push({ label, passed: !!ok }); test(ok, label); };
  const click = async selector => { await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable control');e.click()`); await sleep(100); };
  const text = async (selector, label) => {
    await js(`const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(label)}));if(!e||e.disabled)throw Error('Missing '+${JSON.stringify(label)});e.click()`); await sleep(120);
  };
  const input = async (selector, value) => {
    await js(`const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))`); await sleep(80);
  };
  const p = db.projects.createInternal({ name: 'TEST — Refonte Atelier des Fleurs' });
  const org = db.crm.createOrganization({ name: 'TEST — Atelier des Fleurs' });
  const client = db.crm.createClient({ organizationId: org.id });
  // This deterministic TEST fixture associates its internal project with its TEST client.
  db.database.run('UPDATE projects SET client_account_id=? WHERE id=?', [client.id, p.id]);
  const site = db.projectSites.create(p.id, { name: 'TEST — Atelier des Fleurs', desiredDomain: 'atelier-fleurs.example' });
  db.projectSites.create(p.id, { name: 'TEST — Boutique', desiredDomain: 'boutique.example' });
  const archived = db.projectSites.create(p.id, { name: 'TEST — Ancien site', desiredDomain: 'ancien-site.example' });
  let home, oldPage;
  for (const [name, role, slug] of [['Accueil', 'home', null], ['Nos créations', 'standard', '/creations'], ['Contact', 'standard', '/contact'], ['Ancienne présentation', 'standard', '/presentation']]) {
    const detail = db.projects.addProjectNode(p.id, { name: 'TEST — ' + name, type: 'module', displaySubtype: 'page' });
    const page = detail.nodes.find(node => node.name === 'TEST — ' + name);
    db.projectSites.linkPage(name.startsWith('Ancienne') ? archived.id : site.id, page.id, { role, desiredPath: slug });
    if (name.startsWith('Ancienne')) oldPage = page;
    if (role === 'home') home = page;
  }
  db.projectSites.setArchived(archived.id, true);
  const composition = db.atoumWebCompositions.ensureForProjectPage(home.id);
  for (const [name, html, css] of [
    ['Hero fleuriste', '<section class="hero"><p>ATELIER DES FLEURS · TEST</p><h1>Des fleurs pour chaque occasion</h1><p>Créations florales et bouquets de saison.</p><a>Découvrir nos créations</a></section>', '.hero{padding:48px 28px;background:#f5eee5;color:#263c35;font-family:Georgia;text-align:center}.hero h1{font-size:38px}.hero a{display:inline-block;padding:12px;background:#263c35;color:white}'],
    ['Présentation atelier', '<section><h2>Un atelier à votre écoute</h2><p>Des compositions imaginées pour vos événements.</p></section>', 'section{padding:32px;background:#fffaf3;color:#263c35}'],
    ['Contact', '<section><h2>Parlons de votre projet</h2></section>', 'section{padding:32px;background:#e7eee8;color:#263c35}'],
  ]) {
    const source = db.atoumWebTechnicalLibrary.createReusableCode({ category: 'section', name: 'TEST — ' + name, html, css, javascript: '' });
    db.atoumWebCompositions.addItem(composition.id, { libraryItemId: source.id });
  }
  const snapshot = () => JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name")
    .map(({ name }) => [name, db.database.all('SELECT * FROM "' + name.replaceAll('"', '""') + '" ORDER BY rowid')]));
  const before = snapshot();
  await navigate('Projets'); await text('tr', p.name); await text('.project-production-nav button', 'Sites');
  await text('.project-sites-tree-panel button', home.name);
  await wait('document.querySelectorAll(".project-page-composition-item-wrap").length===3', 'composition');
  await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
  await wait('document.querySelector(".sites-v2")', 'V2 restricted theme');
  check(await get('!document.querySelector(".project-sites-composition-badge").textContent.includes("6B")'), 'No technical lot badge');
  check(await get('document.querySelector(".project-sites-note").textContent.includes("fichier local")'), 'Bridge copy distinguishes local preparation');
  await input('.sites-v2-search input', 'Contact');
  check(await get('document.querySelectorAll(".project-site-tree-pages button:not(.project-site-tree-add-page)").length===1'), 'Search finds only matching Page');
  await input('.sites-v2-search input', 'no-such-test-page');
  check(await get('document.querySelector(".project-sites-tree-scroll").textContent.includes("Aucun résultat")'), 'Search has useful empty state');
  await input('.sites-v2-search input', '');
  await click('.sites-v2-site-fold');
  check(await get('document.querySelector(".sites-v2-site-fold").getAttribute("aria-expanded")==="false"'), 'Individual Site folds');
  await input('.sites-v2-search input', 'Contact');
  check(await get('document.querySelector(".project-site-tree-pages").textContent.includes("Contact")'), 'Search reveals matching Page in folded Site');
  await input('.sites-v2-search input', ''); await click('.sites-v2-site-fold');
  await text('.project-sites-tree-panel button', oldPage.name);
  await text('.project-sites-page-info-summary', oldPage.name);
  check(await get('document.querySelectorAll(".project-sites-page-info select:disabled").length===2 && document.querySelectorAll(".project-sites-page-info input:disabled").length===2'), 'Archived Page remains consultable with existing role/path restrictions');
  await text('.project-sites-tree-panel .project-site-tree-site', archived.name);
  check(await get('document.querySelectorAll(".project-sites-detail-form input:disabled").length===2 && !document.querySelector(".project-sites-detail-actions .primary-button")'), 'Archived Site fields locked and no create-Page action');
  await text('.project-sites-tree-panel button', home.name);
  await click('.sites-v2-more summary');
  check(await get('[...document.querySelectorAll(".sites-v2-more button")].some(e=>e.textContent==="Préparer pour Bridge") && document.querySelectorAll(".sites-v2-more button").length===4'), 'All secondary composition commands remain reachable');
  await text('.sites-v2-more button', 'Créer un composant');
  check(await get('!!document.querySelector(".create-modal")'), 'Secondary command opens the existing component creator');
  await text('.create-modal header button', 'Fermer');
  await click('.sites-v2-more summary');
  await text('.project-page-composition-actions button', 'Ajouter un composant');
  await wait('document.querySelector(".project-page-library-modal-body")', 'library');
  check(await get('document.querySelectorAll(".project-page-library-card.ready").length>=3'), 'Main command opens existing library items');
  await text('.project-page-composition-modal header button', 'Fermer');
  win.webContents.setZoomFactor(1); win.setContentSize(1920, 1080);
  await text('.project-page-composition-item-wrap button', 'Réglages');
  await wait('document.querySelector(".project-component-note textarea")', 'workshop');
  await js('document.querySelector(".project-sites-splitter").focus()');
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Left' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Left' }); await sleep(100);
  check(await get('document.querySelector(".project-sites-tree-panel").getBoundingClientRect().width<355'), 'Tree separator still resizes with the keyboard');
  await js('document.querySelector(".project-sites-splitter").dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))'); await sleep(100);
  await js('window.__lot2Editor=document.querySelector(".project-component-settings-panel")');
  const measure = () => get(`({viewport:[innerWidth,innerHeight],zoom:devicePixelRatio,focus:!!document.querySelector('.atelier-focus'),panes:[...document.querySelectorAll('.project-sites-tree-panel,.project-sites-detail-panel,.project-sites-inspector-shell')].map(e=>{const r=e.getBoundingClientRect();return {class:e.className,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,client:e.clientWidth,scroll:e.scrollWidth}}),bodyOverflow:document.documentElement.scrollWidth-innerWidth})`);
  // capturePage is awaited after two animation frames and a stable layout.
  // The four saved PNGs are native frames, with no DOM marker or CSS injection.
  const capture = async name => {
    await js('document.activeElement?.blur();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))'); await sleep(250);
    const frame = await win.webContents.capturePage(), metadata = await measure();
    fs.writeFileSync(path.join(out, name + '.png'), frame.toPNG());
    captures.push({ file: name + '.png', bitmap: frame.getSize(), ...metadata });
  };
  for (const [width, height] of [[1920, 1080], [2560, 1440], [1280, 720]]) {
    win.setContentSize(width, height); await sleep(250);
    const state = await measure(), visible = state.panes.filter(pane => pane.width > 0);
    check(state.bodyOverflow <= 1 && visible.every(pane => pane.right <= state.viewport[0] && pane.scroll <= pane.client + 2), 'No clipped workspace at ' + width);
    check(width === 1280 ? state.focus && visible.length === 1 : !state.focus && visible.length === 3, 'Useful pane arrangement at ' + width);
    check(await get('window.__lot2Editor===document.querySelector(".project-component-settings-panel")'), 'Same mounted editor at ' + width);
    if (width === 1280) check(visible[0].bottom >= height - 20, 'Focused workshop uses the available content height');
    await capture('sites-pages-' + width + 'x' + height);
  }
  await input('.project-component-note textarea', 'TEST — Brouillon conservé pendant adaptation');
  win.setContentSize(1920, 1080); win.webContents.setZoomFactor(1.5); await sleep(220);
  check(await get('!!document.querySelector(".atelier-focus") && document.querySelector(".project-component-note textarea").value.includes("Brouillon conservé")'), 'Scaling changes arrangement and retains the unsaved draft');
  check((await measure()).bodyOverflow <= 1, 'No global overflow with effective scaled width');
  win.setContentSize(1280, 720); await sleep(180);
  check((await measure()).bodyOverflow <= 1 && await get('!!document.querySelector(".atelier-focus") && document.querySelector(".project-component-note textarea").value.includes("Brouillon conservé")'), 'Small scaled window keeps workshop controls and draft reachable');
  await click('.sites-v2-workshop-nav button');
  check(await get('!document.querySelector(".atelier-focus") && window.__lot2Editor.isConnected'), 'Return to Page keeps editor mounted');
  await click('.project-sites-inspector-collapse');
  check(await get('!!document.querySelector(".atelier-focus") && document.querySelector(".project-component-note textarea").value.includes("Brouillon conservé")'), 'Reopen workshop restores the exact draft');
  const { dialog } = require('electron'), originalDialog = dialog.showMessageBoxSync; let confirmations = 0;
  dialog.showMessageBoxSync = () => { confirmations++; return 0; };
  try {
    await click('.sites-v2-workshop-nav button');
    await text('.project-sites-tree-panel button', oldPage.name);
    check(confirmations === 1 && await get('document.querySelector(".project-sites-detail-head h3").textContent.includes("Accueil")'), 'Existing unsaved guard blocks Page change');
  } finally { dialog.showMessageBoxSync = originalDialog; }
  await click('.project-sites-inspector-collapse'); await input('.project-component-note textarea', '');
  win.webContents.setZoomFactor(1); win.setContentSize(1920, 1080); await sleep(180);
  await text('.project-page-composition-item-wrap button', 'Code / aperçu');
  check(await get('!!document.querySelector(".project-page-inspector-workbench.both-open")'), 'Settings and Code can coexist');
  await click('[aria-label="Fermer le volet Code / aperçu"]');
  await js("document.documentElement.dataset.theme='blanc'"); await sleep(180);
  check(await get('!document.querySelector(".sites-v2") && !document.querySelector(".sites-v2-more") && window.__lot2Editor.isConnected'), 'Blanc retains legacy layout and mounted editor');
  await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='compact'"); await sleep(160);
  check(await get('!document.querySelector(".sites-v2")'), 'Other densities are outside the visual pilot');
  await js("document.documentElement.dataset.density='comfort'"); await sleep(160);
  await click('[aria-label="Fermer les réglages"]');
  check(snapshot() === before, 'Navigation, search, folding, responsive transitions and discarded draft do not mutate business rows');
  // A short TEST timer cycle exercises the existing page actions and unique timer.
  await text('.project-sites-page-actions button', 'Démarrer');
  check(await get('document.querySelectorAll(".global-timer").length===1 && document.querySelector(".project-sites-page-work").classList.contains("running")'), 'Page starts the existing unique global timer');
  await text('.project-sites-page-actions button', 'Arrêter');
  check(!await get('window.atoumweb.time.active()'), 'Page timer stops through the existing service');
  if (await get('!!document.querySelector(".notice-close")')) await click('.notice-close');
  win.setContentSize(1280, 720); await sleep(180);
  await input('.sites-v2-search input', 'Ancien');
  await text('.project-sites-tree-panel button', oldPage.name);
  await click('.project-sites-page-info-summary');
  await js('document.querySelector(".project-sites-detail-panel").scrollTop=0');
  await capture('sites-pages-1280x720-archives');
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ checks, captures }, null, 2));
  console.log('SITES_LOT2 ' + JSON.stringify({ checks: checks.length, captures: captures.length, allPassed: checks.every(check => check.passed) }));
};

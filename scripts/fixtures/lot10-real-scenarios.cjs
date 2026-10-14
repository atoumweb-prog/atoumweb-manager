'use strict';
// Vrai App/IPC Electron, base SQLite créée exclusivement sous TEMP par le banc hôte.
module.exports = async ({ win, db, evalUI: js, get, wait, navigate, test, sleep }) => {
  const { dialog } = require('electron');
  const initialBackups = db.database.get('SELECT COUNT(*) AS total FROM backup_records').total;
  const nativeInput = async (selector, value) => {
    await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus();`);
    await sleep(100);
  };
  const navClick = async (name) => {
    await js(`const e=[...document.querySelectorAll('[data-nav-module]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(name)});if(!e)throw Error('Missing '+${JSON.stringify(name)});e.click();`);
  };

  await navigate('Statistiques');
  await wait('!!document.querySelector(".statistics-tabs")', 'lot 10 statistiques avec vraies IPC');
  await js("const b=[...document.querySelectorAll('.statistics-tabs button')].find(e=>e.textContent.includes('Commercial'));if(!b)throw Error('Onglet Commercial absent');b.click();");
  await wait('document.querySelector(".statistics-kpis")?.textContent.includes("Contacts créés")', 'onglet statistiques commerciales');
  test(await get('document.querySelector(".statistics-kpis")?.textContent.includes("Conversion prospects")'), 'Lot 10B: indicateurs commerciaux accessibles sur UI simple');
  await js("const b=[...document.querySelectorAll('.statistics-tabs button')].find(e=>e.textContent.includes('Analyse financière'));if(!b)throw Error('Onglet analyse absent');b.click();");
  await wait('!!document.querySelector(".phase7-statistics-commercial-section button")', 'analytique consolidée');
  await js("document.querySelector('.phase7-statistics-commercial-section > button').click()");
  await wait('document.querySelector(".phase7-statistics-commercial-section")?.textContent.includes("Contacts créés")', 'contacts distincts prospection active');
  test(await get('document.querySelector(".phase7-statistics-commercial-section")?.textContent.includes("Contacts créés")'), 'Lot 10B: analytics ne confond pas nouveaux contacts et prospects actifs');
  await navigate('Réglages');
  test(await get('document.querySelectorAll(".theme-card").length===3 && document.querySelectorAll(".density-card").length===3'), 'Lot 10D: 3 thèmes et 3 densités réels');
  await nativeInput('#settings-quick-search', 'SÉCURITÉ');
  await wait('!!document.querySelector(".settings-grid button") && !document.querySelector(".theme-grid")', 'filtre de réglages sécurité');
  test(await get('document.querySelector(".settings-grid")?.textContent.includes("Sauvegarde de la base Manager")'), 'Lot 10D: recherche insensible aux accents retrouve sauvegarde SQLite');
  await js("const e=[...document.querySelectorAll('.settings-grid nav button')].find(e=>e.textContent.includes('Sauvegarde'));if(!e)throw Error('Accès direct sécurité introuvable');e.click()");
  test(await get('document.activeElement?.id==="settings-create-backup"'), 'Lot 10D: raccourci recherche sécurité transfère le focus sans activer backup');
  await nativeInput('#settings-quick-search', 'aide survol');
  await wait('!!document.querySelector(".settings-help-row") && !document.querySelector(".theme-grid")', 'filtre de réglages aide');
  test(await get('document.querySelector(".settings-help-row")?.textContent.includes("clic/clavier")'), 'Lot 10D: aide toujours accessible sans survol');
  await js("const e=[...document.querySelectorAll('.settings-grid nav button')].find(e=>e.textContent.includes('Aide contextuelle'));if(!e)throw Error('Accès direct aide introuvable');e.click()");
  test(await get('document.activeElement?.id==="settings-hover-help"'), 'Lot 10D: raccourci aide garde focus clavier et ne bascule pas la préférence');
  await nativeInput('#settings-quick-search', '');
  await wait('document.querySelectorAll(".theme-card").length===3 && document.querySelectorAll(".density-card").length===3', 'tous les réglages restaurés');
  test(await get('!!document.querySelector(".settings-grid .path-value")'), 'Lot 10D: la recherche n’efface pas le workspace courant');

  // R10D-18 : débordement horizontal réel signalé à 44px sur CI précédente.
  const originalTheme = await get('document.documentElement.dataset.theme');
  const originalDensity = await get('document.documentElement.dataset.density');
  const oldSize = win.getSize();
  try {
    await js("document.documentElement.dataset.theme='blanc';document.documentElement.dataset.density='comfort_plus';");
    await sleep(150);
    for (const width of [1510, 920]) {
      win.setSize(width, width === 920 ? 720 : 1030);
      await sleep(190);
      const result = await get('(()=>{const c=document.querySelector(".content-area");if(!c)throw Error("Missing content area");const b=c.getBoundingClientRect();return {pixels:c.scrollWidth-c.clientWidth,sections:document.querySelectorAll(".settings-grid > .panel").length,right:b.right,items:[...document.querySelectorAll(".settings-grid input,.settings-grid button")].filter(e=>e.getBoundingClientRect().right>b.right+3).map(e=>e.textContent.trim()||e.getAttribute("placeholder")).slice(0,8)}})()');
      test(result.pixels <= 2 && result.items.length===0,
        'Lot 10D: Blanc/Confort+ sans débordement ni commande hors cadre '+width+'px '+JSON.stringify(result));
    }
  } finally {
    win.setSize(...oldSize);
    await js(`document.documentElement.dataset.theme=${JSON.stringify(originalTheme)};document.documentElement.dataset.density=${JSON.stringify(originalDensity)};`);
    await sleep(140);
  }
  await navigate('Sauvegardes');
  await wait('document.querySelectorAll(".business-backups-toolbar select").length===4', 'filtres du registre sauvegardes');
  test(await get('!!document.querySelector(".business-backups-toolbar select[aria-label=\\"Filtrer par client\\"]") && !!document.querySelector(".business-backups-toolbar select[aria-label=\\"Filtrer par projet\\"]")'), 'Lot 10C: sélecteurs Client et Projet réels, sans création de sauvegarde');
  test(await get('document.querySelector(".business-backups-page .technical-safety-note")?.textContent.includes("ne crée pas de fichiers")'), 'Lot 10C: déclaration ne signifie pas sauvegarde réelle');
  await js(`const b=[...document.querySelectorAll('.business-backups-toolbar button')].find(b=>b.textContent.includes('Déclarer une sauvegarde'));if(!b)throw Error('Bouton déclaration absent');b.click();`);
  await wait('!!document.querySelector(".business-backups-create input[placeholder]")', 'formulaire de déclaration');
  await nativeInput('.business-backups-create input[placeholder]', 'LOT10 BROUILLON TEST');
  test(await get('document.querySelector(".business-backups-create input[placeholder]")?.value==="LOT10 BROUILLON TEST"'), 'Lot 10C: brouillon présent en vrai renderer');
  const originalDialog = dialog.showMessageBoxSync;
  let confirmations = 0;
  try {
    dialog.showMessageBoxSync = () => { confirmations++; return 0; }; // Rester
    await navClick('Réglages');
    for(let attempt=0;attempt<30&&confirmations===0;attempt++) await sleep(100);
    test(confirmations === 1, 'Lot 10C: une confirmation UX-01 pour sortir avec brouillon');
    test(await get('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Sauvegardes" && document.querySelector(".business-backups-create input[placeholder]")?.value==="LOT10 BROUILLON TEST"'), 'Lot 10C: Rester conserve le même brouillon');
    dialog.showMessageBoxSync = () => { confirmations++; return 1; }; // Abandonner
    await navClick('Réglages');
    await wait('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Réglages"', 'sortie confirmée après abandon');
    test(confirmations === 2, 'Lot 10C: seconde tentative distincte et confirmation unique');
  } finally {
    dialog.showMessageBoxSync = originalDialog;
  }
  test(db.database.get('SELECT COUNT(*) AS total FROM backup_records').total === initialBackups, 'Lot 10C/10D: aucune déclaration ou action de réglage ne crée une sauvegarde');
  // R10B-13/R10E-15 — vrais Clients + temps + facturation fictifs en base TEMP.
  const firstClient = db.crm.createClient({ organizationId: db.crm.createOrganization({ name: 'LOT10 TEST CLIENT A' }).id });
  const secondClient = db.crm.createClient({ organizationId: db.crm.createOrganization({ name: 'LOT10 TEST CLIENT B' }).id });
  const reference = new Date();
  const started = new Date(reference.getFullYear(), reference.getMonth(), 10, 10).toISOString();
  const firstEnd = new Date(new Date(started).getTime() + 3600000).toISOString();
  const secondEnd = new Date(new Date(started).getTime() + 10800000).toISOString();
  for (const [id,clientId,end] of [
    ['lot10-time-a',firstClient.id,firstEnd], ['lot10-time-b',secondClient.id,secondEnd],
  ]) db.database.run(
    'INSERT INTO time_sessions(id,client_account_id,category,activity_label,started_at,ended_at,billable,source,created_at,updated_at) VALUES (?,?,?,?,?,?,1,?,?,?)',
    [id,clientId,'development','LOT10 parcours temps',started,end,'manual',started,started],
  );
  for (const [id,clientId,amount] of [
    ['lot10-billing-a',firstClient.id,90000], ['lot10-billing-b',secondClient.id,10000],
  ]) db.database.run(
    "INSERT INTO billing_items(id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,status,invoiced_at,created_at,updated_at) VALUES (?,?,'other',?,?,?,?,'invoiced',?,?,?)",
    [id,clientId,id,'other:'+id,'LOT10 facture fictive suivie',amount,started,started,started],
  );
  await navigate('Statistiques');
  await js("window.dispatchEvent(new Event('atoumweb:changed'))");
  await js("const b=[...document.querySelectorAll('.statistics-tabs button')].find(e=>e.textContent==='Clients');if(!b)throw Error('Onglet Clients absent');b.click()");
  await wait('document.querySelectorAll(".statistics-client-card tbody tr").length===2', 'deux Clients fictifs affichés');
  const order = () => get('[...document.querySelectorAll(".statistics-client-card tbody tr td:first-child button")].map(e=>e.textContent.trim())');
  test(JSON.stringify(await order()) === JSON.stringify(['LOT10 TEST CLIENT A','LOT10 TEST CLIENT B']),
    'Lot 10B: classement montant facturé décroissant, source en centimes');
  await js("const b=[...document.querySelectorAll('.statistics-client-card th button')].find(e=>e.textContent.includes('Temps'));if(!b)throw Error('Tri Temps absent');b.click()");
  test(JSON.stringify(await order()) === JSON.stringify(['LOT10 TEST CLIENT B','LOT10 TEST CLIENT A']),
    'Lot 10B: clic Temps inverse classement selon secondes, pas score hybride');
  test(await get('document.querySelector(".statistics-client-card th[aria-sort=descending]")?.textContent.includes("Temps")'),
    'Lot 10B: état aria-sort clavier exposé sur la bonne colonne');

  test(db.database.get('PRAGMA integrity_check').integrity_check === 'ok', 'Lot 10: intégrité SQLite du fixture');
  test(db.database.all('PRAGMA foreign_key_check').length === 0, 'Lot 10: clés étrangères du fixture');
};

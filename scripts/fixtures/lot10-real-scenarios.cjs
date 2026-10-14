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
  // R10B-02/03/04 : une seule barre et période réellement partagée entre vues SQL et simples.
  const setStatisticsPeriod = async (value) => {
    await js(`const e=document.querySelector('.statistics-period select');if(!e)throw Error('Période commune absente');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('change',{bubbles:true}));`);
    await sleep(120);
  };
  test(await get('document.querySelectorAll(".statistics-period select").length===1 && !document.querySelector(".phase7-statistics-quick-periods")'), 'Lot 10B: barre canonique unique aussi en analyse avancée');
  await setStatisticsPeriod('quarter');
  await wait('document.querySelector(".statistics-period select")?.value==="quarter" && !!document.querySelector(".phase7-statistics-period-summary")', 'trimestre commun en analyse');
  await js("const b=[...document.querySelectorAll('.statistics-tabs button')].find(e=>e.textContent.includes('Vue d’ensemble'));b.click()");
  test(await get('document.querySelector(".statistics-period select")?.value==="quarter" && !!document.querySelector(".statistics-kpis")'), 'Lot 10B: le trimestre suit le retour vers la vue simple');
  await setStatisticsPeriod('custom');
  await wait('document.querySelectorAll(".statistics-custom-dates input").length===2', 'plage de dates commune');
  test(await get('!!document.querySelector(".statistics-period-warning[role=alert]") && !document.querySelector(".statistics-kpis")'), 'Lot 10B: période personnalisée incomplète sans KPI périmé');
  await nativeInput('.statistics-custom-dates label:first-child input', '2026-09-12');
  await nativeInput('.statistics-custom-dates label:last-child input', '2026-09-10');
  test(await get('document.querySelector(".statistics-period-warning[role=alert]")?.textContent.includes("début") && !document.querySelector(".statistics-kpis")'), 'Lot 10B: période inversée bloquée sans faux chiffre');
  await nativeInput('.statistics-custom-dates label:last-child input', '2026-09-14');
  await wait('!!document.querySelector(".statistics-kpis") && !document.querySelector(".statistics-period-warning[role=alert]")', 'période valide de nouveau');
  await js("const b=[...document.querySelectorAll('.statistics-tabs button')].find(e=>e.textContent.includes('Analyse financière'));b.click()");
  await wait('document.querySelector(".phase7-statistics-period-summary")?.textContent.includes("12/09/2026")', 'dates personnalisées transmises au SQL');
  test(await get('document.querySelector(".statistics-period select")?.value==="custom" && document.querySelector(".phase7-statistics-period-summary")?.textContent.includes("14/09/2026")'), 'Lot 10B: dates personnalisées conservées et appliquées au SQL');
  await setStatisticsPeriod('all');
  await wait('!!document.querySelector(".statistics-period-warning[role=status]")', 'indisponibilité détaillée toutes données explicite');
  test(await get('!document.querySelector(".phase7-statistics-page") && document.querySelector(".statistics-period-warning[role=status]")?.textContent.includes("comparaisons")'), 'Lot 10B: toutes données sans comparaison fictive SQL');
  await setStatisticsPeriod('month');
  await wait('!!document.querySelector(".phase7-statistics-page")', 'période mensuelle rétablie');

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

  // R10D-E309 Documents & Avancé : chemins du workspace et diagnostic IPC en lecture seule.
  test(await get('document.querySelector(".settings-documents")?.textContent.includes("clients") && document.querySelector(".settings-documents")?.textContent.includes("exports")'),
    'Lot 10D: sous-dossiers Documents réels décrits sans inventer une conservation globale');
  test(await get('document.querySelector(".settings-advanced")?.textContent.includes("Migrations appliquées") && document.querySelector(".settings-advanced")?.textContent.includes("lecture seule")'),
    'Lot 10D: états et version exposés sans opération SQLite mutable');
  const beforeRead = db.database.get('SELECT COUNT(*) AS total FROM backup_records').total;
  await js("document.getElementById('settings-read-diagnostics').click()");
  await wait('document.querySelector(".settings-advanced")?.textContent.includes("Migrations à la dernière lecture")', 'diagnostic SQLite IPC actuel');
  test(await get('!document.querySelector(".settings-diagnostic-error")'),
    'Lot 10D: diagnostic IPC lu sans erreur affichée');
  test(db.database.get('SELECT COUNT(*) AS total FROM backup_records').total === beforeRead,
    'Lot 10D: le diagnostic n’ajoute aucun enregistrement de sauvegarde');
  await js("document.getElementById('settings-open-documents').click()");
  await wait('document.querySelector(".page-heading h1")?.textContent==="Documents & Contrats"', 'navigation Documents depuis Réglages');
  await navigate('Réglages');
  await wait('!!document.querySelector(".settings-documents")', 'retour Réglages après Documents');

  // R10D-09/10 : stockage réellement disponible, disposition Clients seulement.
  await wait('!!document.querySelector(".settings-navigation")', 'préférences navigation dans réglages');
  const railBefore = await get('document.querySelector(".aw-navigation-rail")?.dataset.railCollapsed');
  await js("document.getElementById('settings-nav-collapse').click()");
  await wait('document.querySelector(".aw-navigation-rail")?.dataset.railCollapsed!=='+JSON.stringify(railBefore), 'rail mis à jour depuis Réglages');
  test(await get('document.querySelector(".settings-navigation")?.textContent.includes("Rail latéral")'),
    'Lot 10D: préférence rail réellement pilotée depuis Réglages');
  await js("document.getElementById('settings-nav-collapse').click()");
  await wait('document.querySelector(".aw-navigation-rail")?.dataset.railCollapsed==='+JSON.stringify(railBefore), 'préférence rail restaurée');
  await js("window.atoumweb.visualPreferences.setItem('atoumweb:layout:clients:list:v1','{\"version\":1,\"listPercent\":55}');window.atoumweb.visualPreferences.setItem('atoumweb:layout:directory:list:v1','{\"version\":1,\"listPercent\":45}')");
  await js("const b=[...document.querySelectorAll('.settings-navigation button')].find(e=>e.textContent.includes('Largeur liste Clients'));if(!b)throw Error('Reset Clients absent');b.click()");
  await wait('!!document.querySelector(".settings-navigation-confirm")', 'confirmation disposition liste Clients');
  test(await get('!!window.atoumweb.visualPreferences.getItem("atoumweb:layout:clients:list:v1")'), 'Lot 10D: première étape ne réinitialise pas Clients');
  await js("const b=[...document.querySelectorAll('.settings-navigation-confirm button')].find(e=>e.textContent.includes('Confirmer'));if(!b)throw Error('Confirmation reset absente');b.click()");
  await wait('window.atoumweb.visualPreferences.getItem("atoumweb:layout:clients:list:v1")===null', 'préférence Clients effacée seulement');
  test(await get('!!window.atoumweb.visualPreferences.getItem("atoumweb:layout:directory:list:v1")'),
    'Lot 10D: réinitialisation Clients préserve disposition Annuaire');
  test(await get('document.querySelector(".settings-navigation-confirm")===null'),
    'Lot 10D: confirmation nettoyée après réinitialisation visuelle');

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
  // Projets internes fictifs créés seulement dans la base et le workspace TEMP Electron.
  const alertProjectA = db.projects.createInternal({ name: 'LOT10 ALERTE SAUVEGARDE A' });
  const alertProjectB = db.projects.createInternal({ name: 'LOT10 ALERTE SAUVEGARDE B' });
  await navigate('Sauvegardes');
  await wait('document.querySelectorAll(".business-backups-toolbar select").length===4', 'filtres du registre sauvegardes');
  await wait('document.querySelector(".business-backups-alerts")?.textContent.includes("LOT10 ALERTE SAUVEGARDE A")', 'alertes projet sur SQLite TEMP');
  test(await get('document.querySelector(".business-backups-alerts")?.textContent.includes("LOT10 ALERTE SAUVEGARDE B")'), 'Lot 10C: alertes calculées sur les projets actifs réels du fixture TEMP');
  await js(`const e=document.querySelector('.business-backups-toolbar select[aria-label="Filtrer par projet"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,${JSON.stringify(alertProjectA.id)});e.dispatchEvent(new Event('change',{bubbles:true}));`);
  await wait('document.querySelector(".business-backups-alerts")?.textContent.includes("LOT10 ALERTE SAUVEGARDE A") && !document.querySelector(".business-backups-alerts")?.textContent.includes("LOT10 ALERTE SAUVEGARDE B")', 'alerte filtrée par Projet');
  test(await get('document.querySelectorAll(".business-backups-alert").length===1'), 'Lot 10C: alerte du projet B absente du contexte Projet A');
  await js("const e=document.querySelector('.business-backups-toolbar select[aria-label=\"Filtrer par projet\"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('change',{bubbles:true}));");
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

  // R10B-06/07 : les détails des KPI doivent partager les identifiants réellement agrégés.
  await js("const b=[...document.querySelectorAll('.statistics-tabs button')].find(e=>e.textContent.includes('Vue d’ensemble'));if(!b)throw Error('Vue ensemble absente');b.click()");
  await wait('!!document.querySelector(".statistics-kpi-inspect")', 'KPI inspectables');
  await js("const card=[...document.querySelectorAll('.statistics-kpi')].find(e=>e.textContent.includes('Facturé suivi'));if(!card)throw Error('KPI facture absent');card.querySelector('button.statistics-kpi-inspect').click()");
  await wait('document.querySelectorAll(".statistics-evidence-table tbody tr").length===2', 'facturation fictive en détail');
  const detailIds = () => get('[...document.querySelectorAll(".statistics-evidence-table td small[title]")].map(e=>e.title)');
  test(JSON.stringify(await detailIds().then(ids=>ids.sort()))===JSON.stringify(['lot10-billing-a','lot10-billing-b']),
    'Lot 10B: détails facture sur les vrais ID du compteur, sans faux routage');
  test(await get('document.querySelector(".statistics-evidence-panel")?.textContent.includes("billing_items") && document.querySelector(".statistics-evidence-panel")?.textContent.includes("Date facturée")'),
    'Lot 10B: source métier et unités explicites dans le détail');
  await js("const card=[...document.querySelectorAll('.statistics-kpi')].find(e=>e.textContent.includes('Temps travaillé'));card.querySelector('button.statistics-kpi-inspect').click()");
  await wait('document.querySelectorAll(".statistics-evidence-table tbody tr").length===2', 'sessions détaillées');
  test(JSON.stringify(await detailIds().then(ids=>ids.sort()))===JSON.stringify(['lot10-time-a','lot10-time-b']),
    'Lot 10B: détail temps avec les mêmes sessions que le KPI');
  test(await get('document.querySelector(".statistics-evidence-panel")?.textContent.includes("Début de session")'),
    'Lot 10B: date métier du temps explicitée');

  // R10B-17 : navigation réellement filtrée par les IDs figés du calcul, pas par statut seulement.
  db.database.run(
    "INSERT INTO billing_items(id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,status,invoiced_at,created_at,updated_at) VALUES (?,?,'other',?,?,?,?,'invoiced',?,?,?)",
    ['lot10-billing-outside',firstClient.id,'lot10-billing-outside','other:lot10-billing-outside','LOT10 facture hors cohorte affichée',5000,started,started,started],
  );
  // Ne pas actualiser Statistiques : cet ajout est volontairement postérieur au snapshot utilisateur.
  await js("document.querySelector('.statistics-open-drilldown').click()");
  await sleep(900);
  const routeDebug = await get('({ page:document.querySelector(".page-heading h1")?.textContent ?? null, banner:document.querySelector(".statistics-route-banner")?.textContent?.slice(0,160) ?? null, notice:document.querySelector(".notice")?.textContent?.slice(0,160) ?? null, app:!!document.querySelector(".billing-page-stack"), prompt:!!document.querySelector("[role=dialog]") })');
  if (!routeDebug.app || !routeDebug.banner) throw Error('R10B_ROUTE_DIAGNOSTIC '+JSON.stringify(routeDebug));
  await wait('document.querySelector(".statistics-route-banner")?.textContent.includes("Facturation suivie")', 'route Facturation à filtre exact');
  test(await get('document.querySelectorAll(".billing-list-panel tbody tr").length===2'), 'R10B-17 : seulement deux factures dans la route malgré la troisième nouvellement enregistrée');
  test(await get('!document.querySelector(".billing-list-panel")?.textContent.includes("LOT10 facture hors cohorte affichée")'), 'R10B-17 : aucun élargissement silencieux du filtre facturé');
  await js("document.querySelector('.statistics-route-banner button').click()");
  await wait('document.querySelectorAll(".billing-list-panel tbody tr").length===3', 'sortie explicite du filtre stats');
  test(await get('!document.querySelector(".statistics-route-banner")'), 'R10B-17 : retour à la liste métier complète');
  await navigate('Statistiques');
  await wait('!!document.querySelector(".statistics-kpi-inspect")', 'retour Statistiques après Facturation');
  await js("const card=[...document.querySelectorAll('.statistics-kpi')].find(e=>e.textContent.includes('Temps travaillé'));card.querySelector('button.statistics-kpi-inspect').click()");
  await wait('document.querySelector(".statistics-open-drilldown")?.textContent.includes("sessions")', 'route Temps disponible');
  await js("document.querySelector('.statistics-open-drilldown').click()");
  await wait('document.querySelector(".statistics-route-banner")?.textContent.includes("Sessions de temps")', 'route sessions exacte');
  test(await get('document.querySelectorAll(".time-table tbody tr").length===2'), 'R10B-17 : seulement les deux sessions réellement comptées');
  test(await get('document.querySelector(".time-kpi-grid")?.textContent.includes("4 h")'), 'R10B-17 : totaux métier du Temps réconciliés avec la cohorte');
  await js("document.querySelector('.statistics-route-banner button').click()");
  await wait('!document.querySelector(".statistics-route-banner")', 'sortie filtrage Temps');

  // R10C intervention : vrai IPC + SQLite TEMP, sans archive physique créée.
  const beforeIntervention = db.businessBackups.create({
    clientAccountId: firstClient.id,
    backupType: 'complete',
    label: 'LOT10 RÉFÉRENCE EXISTANTE AVANT',
    backupAt: new Date(Date.now() - 86400000).toISOString(),
  });
  const intervention = db.operations.createIntervention({
    clientAccountId: firstClient.id,
    type: 'modification',
    subject: 'LOT10 CONTRÔLE PRÉVENTIF',
  });
  await navigate('Sauvegardes');
  await wait('!![...document.querySelectorAll(".business-backups-interventions select option")].find(e=>e.value==='+JSON.stringify(intervention.id)+')', 'intervention de la fixture disponible');
  await js(`const s=document.querySelector(".business-backups-interventions select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(s,${JSON.stringify(intervention.id)});s.dispatchEvent(new Event("change",{bubbles:true}));`);
  await wait('document.querySelector(".business-backups-intervention-review")?.textContent.includes("Sauvegarde avant intervention à confirmer")', 'alerte avant intervention réelle');
  test(await get('document.querySelector(".business-backups-intervention-evidence")?.textContent.includes("Aucune référence associée")'), 'Lot 10C: référence avant intervention initialement absente');
  await js("const b=[...document.querySelectorAll('.business-backup-row')].find(e=>e.textContent.includes('LOT10 RÉFÉRENCE EXISTANTE AVANT'));if(!b)throw Error('Fiche préexistante absente');b.click();");
  await wait('!!document.querySelector(".business-backups-intervention-link")', 'fiche existante sélectionnée');
  await js("const b=[...document.querySelectorAll('.business-backups-intervention-link button')].find(e=>e.textContent.includes('Associer avant'));if(!b||b.disabled)throw Error('Association avant inaccessible');b.click()");
  await wait('!!document.querySelector(".business-backups-link-confirmation")', 'confirmation préalable au lien');
  test(db.database.get('SELECT COUNT(*) AS total FROM backup_intervention_links WHERE intervention_id=?',[intervention.id]).total === 0, 'Lot 10C: premier clic sans modification de lien SQLite');
  await js("const b=[...document.querySelectorAll('.business-backups-link-confirmation button')].find(e=>e.textContent.includes('Confirmer'));if(!b)throw Error('Confirmation absente');b.click()");
  await wait('document.querySelector(".business-backups-intervention-evidence")?.textContent.includes("LOT10 RÉFÉRENCE EXISTANTE AVANT")', 'association pré-intervention visible');
  test(db.businessBackupAlerts.reviewIntervention(intervention.id).preInterventionBackup?.id === beforeIntervention.id, 'Lot 10C: liaison sauvegarde avant enregistrée dans SQL TEMP');
  test(db.database.get('SELECT COUNT(*) AS total FROM backup_intervention_links WHERE intervention_id=?',[intervention.id]).total === 1, 'Lot 10C: association sans duplication');
  test(db.businessBackups.get(beforeIntervention.id).locations.length === 0, 'Lot 10C: la liaison ne crée aucune copie physique');
  db.operations.changeInterventionStatus(intervention.id,'completed');
  await navigate('Réglages');
  await navigate('Sauvegardes');
  await wait('!![...document.querySelectorAll(".business-backups-interventions select option")].find(e=>e.value==='+JSON.stringify(intervention.id)+')', 'intervention clôturée dans la liste');
  await js(`const s=document.querySelector(".business-backups-interventions select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(s,${JSON.stringify(intervention.id)});s.dispatchEvent(new Event("change",{bubbles:true}));`);
  await wait('document.querySelector(".business-backups-intervention-review")?.textContent.includes("Nouvelle version stable à envisager")', 'alerte post-validation réelle');
  test(await get('document.querySelector(".business-backups-intervention-evidence")?.textContent.includes("Aucune référence associée")'), 'Lot 10C: avertissement post-intervention distinct du lien avant');

  test(db.database.get('PRAGMA integrity_check').integrity_check === 'ok', 'Lot 10: intégrité SQLite du fixture');
  test(db.database.all('PRAGMA foreign_key_check').length === 0, 'Lot 10: clés étrangères du fixture');
};

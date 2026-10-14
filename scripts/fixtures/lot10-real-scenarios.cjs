'use strict';
// Vrai App/IPC Electron, base SQLite créée exclusivement sous TEMP par le banc hôte.
module.exports = async ({ db, evalUI: js, get, wait, navigate, test, sleep }) => {
  const { dialog } = require('electron');
  const initialBackups = db.database.get('SELECT COUNT(*) AS total FROM backup_records').total;
  const nativeInput = async (selector, value) => {
    await js(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.focus();`);
    await sleep(100);
  };
  const navClick = async (name) => {
    await js(`const e=[...document.querySelectorAll('[data-nav-module]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(name)});if(!e)throw Error('Missing '+${JSON.stringify(name)});e.click();`);
  };

  await navigate('Réglages');
  test(await get('document.querySelectorAll(".theme-card").length===3 && document.querySelectorAll(".density-card").length===3'), 'Lot 10D: 3 thèmes et 3 densités réels');
  await nativeInput('#settings-quick-search', 'SÉCURITÉ');
  await wait('!!document.querySelector(".settings-grid button") && !document.querySelector(".theme-grid")', 'filtre de réglages sécurité');
  test(await get('document.querySelector(".settings-grid")?.textContent.includes("Sauvegarde de la base Manager")'), 'Lot 10D: recherche insensible aux accents retrouve sauvegarde SQLite');
  await nativeInput('#settings-quick-search', 'aide survol');
  await wait('!!document.querySelector(".settings-help-row") && !document.querySelector(".theme-grid")', 'filtre de réglages aide');
  test(await get('document.querySelector(".settings-help-row")?.textContent.includes("clic/clavier")'), 'Lot 10D: aide toujours accessible sans survol');
  await nativeInput('#settings-quick-search', '');
  await wait('document.querySelectorAll(".theme-card").length===3 && document.querySelectorAll(".density-card").length===3', 'tous les réglages restaurés');
  test(await get('!!document.querySelector(".settings-grid .path-value")'), 'Lot 10D: la recherche n’efface pas le workspace courant');

  await navigate('Sauvegardes');
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
  test(db.database.get('PRAGMA integrity_check').integrity_check === 'ok', 'Lot 10: intégrité SQLite du fixture');
  test(db.database.all('PRAGMA foreign_key_check').length === 0, 'Lot 10: clés étrangères du fixture');
};

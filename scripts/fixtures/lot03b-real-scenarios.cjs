'use strict';

/**
 * 03B.6: vrai Manager + vrai preload/IPC/services sur SQLite %TEMP%.
 * Aucun profil installé, Validation-MSI, mock de service ou état commercial
 * productif n'est utilisé. Seules les confirmations natives sont pilotées.
 */
module.exports = async ({win, db, evalUI: js, get, wait, navigate, test, sleep, saveScreenshot}) => {
  const {dialog} = require('electron');
  const confirmations = [];
  let discardNext = false;
  const originalDialog = dialog.showMessageBoxSync;
  dialog.showMessageBoxSync = (...args) => {
    confirmations.push(args.at(-1));
    const answer = discardNext ? 1 : 0;
    discardNext = false;
    return answer; // Par défaut : Rester ; quitter seulement après confirmation explicite du test.
  };
  const clickText = async (selector, label) => {
    await js('const elements=[...document.querySelectorAll('+JSON.stringify(selector)+')];'+
      'const target=elements.find(e=>e.textContent.includes('+JSON.stringify(label)+'));'+
      'if(!target)throw Error("Commande absente: "+'+JSON.stringify(label)+');target.click();return true;');
    await sleep(110);
  };
  const recordCount = table => db.database.get('SELECT count(*) AS n FROM '+table).n;
  const prospectStage = id => db.crm.listProspects({includeArchived:true}).find(p=>p.id===id);
  const quoteStatus = id => db.quotes.get(id);

  try {
    const org = db.crm.createOrganization({name:'TEST 03B Prospection Dijon'});
    const newProspect = db.crm.createProspect({organizationId:org.id,primaryNeed:'Refonte du site'});
    const activeOrg = db.crm.createOrganization({name:'TEST 03B Actif Dijon'});
    const active = db.crm.createProspect({organizationId:activeOrg.id,primaryNeed:'Site vitrine'});
    db.workflow.saveNeed('prospect',active.id,{otherText:'Site vitrine'});
    db.crm.changeProspectStage(active.id,'qualifying');
    const quote = db.quotes.create({prospectId:active.id,subject:'Devis TEST 03B non signé'});
    db.quotes.addCustomLine(quote.id,{label:'Site vitrine',proposedUnitPriceCents:69900});
    // Fixture autorisée TEMP : un devis effectivement envoyé, sans détourner
    // l'acceptation et les contrôles contractuels Abby.
    db.database.run("UPDATE quotes SET status='sent' WHERE id=?",[quote.id]);
    db.database.run("UPDATE prospects SET stage='quote_sent' WHERE id=?",[active.id]);
    const lostOrg = db.crm.createOrganization({name:'TEST 03B Perdu'});
    const lost = db.crm.createProspect({organizationId:lostOrg.id});
    db.crm.changeProspectStage(lost.id,'lost','Projet non retenu');
    const convertedOrg = db.crm.createOrganization({name:'TEST 03B Converti'});
    const converted = db.crm.createProspect({organizationId:convertedOrg.id});
    const linked = db.crm.convertProspectToClient(converted.id);
    const archivedOrg = db.crm.createOrganization({name:'TEST 03B Archivé'});
    const archived = db.crm.createProspect({organizationId:archivedOrg.id});
    db.workflow.archiveProspect(archived.id,true);

    test(prospectStage(newProspect.id).stage==='new','R03B-01: un nouveau contact reste new');
    test(!prospectStage(newProspect.id).clientAccountId,'R03B-01: aucun Client créé');
    test(!quoteStatus(quote.id).principleAgreementAt,'R03B-13: envoyé ne suffit pas à Finalisation');
    await js('window.__03bConfirmations=[];window.confirm=message=>{window.__03bConfirmations.push(message);return true;};');
    await js('window.dispatchEvent(new Event("atoumweb:changed"));');
    await navigate('Prospection');
    await wait('!!document.querySelector(".prospect-view-switch")','vue Prospection montée');

    await clickText('.prospect-view-switch button','Parcours commercial');
    await wait('document.querySelectorAll(".pipeline-step-column").length===7','six colonnes et Conversion');
    test(await get('document.querySelectorAll(".pipeline-step-column").length')===7,'R03B-03: 6+1 colonnes vraies');
    test(await get('!document.querySelector(".kanban-board").textContent.includes("TEST 03B Prospection Dijon")'),
      'R03B-01: new absent du pipeline');
    test(await get('!document.querySelector(".kanban-board").textContent.includes("TEST 03B Perdu")'),
      'R03B-16: perdu absent du pipeline');
    test(await get('!document.querySelector(".kanban-board").textContent.includes("TEST 03B Converti")'),
      'R03B-15: converti absent des colonnes actives');
    test(await get('document.querySelector(".pipeline-conversion-history").textContent.includes("Conversion")'),
      'R03B-15: Conversion est une section historique');
    // Simuler un vrai dragstart Chromium, puis tenter Conversion et Finalisation :
    // ni la section historique ni la colonne E73 n'acceptent un drop métier.
    await js('const source=[...document.querySelectorAll(".prospect-card-head")].find(e=>e.textContent.includes("TEST 03B Actif Dijon"));'+
      'if(!source)throw Error("Source drag absente");window.__03bDragSource=source;'+
      'const transfer=new DataTransfer();window.__03bTransfer=transfer;'+
      'source.dispatchEvent(new DragEvent("dragstart",{bubbles:true,cancelable:true,dataTransfer:transfer}));');
    await sleep(90);
    await js('document.querySelector(".pipeline-conversion-history").dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:window.__03bTransfer}));');
    await js('const col=[...document.querySelectorAll(".pipeline-step-column")].find(e=>e.querySelector("header strong")?.textContent.trim()==="Finalisation");'+
      'col.dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:window.__03bTransfer}));'+
      'window.__03bDragSource.dispatchEvent(new DragEvent("dragend",{bubbles:true,cancelable:true,dataTransfer:window.__03bTransfer}));');
    await sleep(80);
    test(prospectStage(active.id).stage==='quote_sent'&&!prospectStage(active.id).clientAccountId,
      'R03B-15: DnD Conversion et Finalisation non confirmé refusé sans écriture CRM');
    test(recordCount('client_accounts')===1,
      'R03B-15: DnD historique ne fabrique aucun Client');
    // Chemin autorisé : depuis Attente du retour vers Négociation, avec
    // besoin réellement enregistré et validation par CrmService, pas par SQL.
    await js('const source=[...document.querySelectorAll(".prospect-card-head")].find(e=>e.textContent.includes("TEST 03B Actif Dijon"));'+
      'const transfer=new DataTransfer();window.__03bTransfer=transfer;window.__03bDragSource=source;'+
      'source.dispatchEvent(new DragEvent("dragstart",{bubbles:true,cancelable:true,dataTransfer:transfer}));');
    await sleep(70);
    await js('const col=[...document.querySelectorAll(".pipeline-step-column")].find(e=>e.querySelector("header strong")?.textContent.trim()==="Négociation");'+
      'col.dispatchEvent(new DragEvent("dragover",{bubbles:true,cancelable:true,dataTransfer:window.__03bTransfer}));'+
      'col.dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:window.__03bTransfer}));'+
      'window.__03bDragSource.dispatchEvent(new DragEvent("dragend",{bubbles:true,cancelable:true,dataTransfer:window.__03bTransfer}));');
    for(let i=0;i<40&&prospectStage(active.id).stage!=='negotiation';i++)await sleep(75);
    test(prospectStage(active.id).stage==='negotiation','R03B-04: DnD autorisé persiste via CrmService');
    test(!prospectStage(active.id).clientAccountId,'R03B-04: DnD autorisé ne crée pas de Client');

    test(!quoteStatus(quote.id).principleAgreementAt,'R03B-13: simple envoi ne vaut pas accord');

    await clickText('.prospect-card-head','TEST 03B Actif Dijon');
    await wait('!!document.querySelector(".prospect-detail-panel")','fiche rapide');
    await clickText('.prospect-detail-panel button','Ouvrir la fiche de travail');
    await wait('!!document.querySelector(".prospect-desk-overlay")','fiche de travail réelle');
    await wait('!!document.querySelector(".prospect-principle-agreement button")','commande E73 dans le vrai devis');
    await clickText('.prospect-principle-agreement button','Accord de principe confirmé');
    await wait('!!document.querySelector(".prospect-principle-agreement [role=status]")','confirmation E73 affichée');
    test(Boolean(quoteStatus(quote.id).principleAgreementAt),'R03B-12: accord horodaté dans SQLite TEMP');
    await wait('[...document.querySelectorAll(".pipeline-step-column")].find(e=>e.querySelector("header strong")?.textContent.trim()==="Finalisation")?.querySelectorAll(".prospect-card").length===1',
      'accord affiché dans Finalisation');
    test(await get('[...document.querySelectorAll(".pipeline-step-column")].find(e=>e.querySelector("header strong")?.textContent.trim()==="Finalisation")?.querySelector(".prospect-card-step")?.textContent.includes("Étape 6")'),
      'R03B-12: carte accord confirmé porte bien étape 6');
    test(quoteStatus(quote.id).status==='sent','R03B-12: envoi non converti en signature');
    test(prospectStage(active.id).stage==='negotiation'&&!prospectStage(active.id).clientAccountId,
      'R03B-12: l accord ne modifie ni l étape Négociation ni le Client');

    // Annulation volontaire et restitution dans la colonne correspondant au stage.
    await clickText('.prospect-principle-agreement button','Annuler l’accord de principe');
    await wait('!!document.querySelector(".prospect-principle-agreement button") && document.querySelector(".prospect-principle-agreement button").textContent.includes("Accord de principe confirmé")',
      'annulation E73 rendue');
    test(quoteStatus(quote.id).principleAgreementAt===null,'R03B-12: accord révoqué sans effacer le devis');
    await wait('[...document.querySelectorAll(".pipeline-step-column")].find(e=>e.querySelector("header strong")?.textContent.trim()==="Finalisation")?.querySelectorAll(".prospect-card").length===0',
      'Finalisation vide après annulation');
    const counts=db.database.all("SELECT action,count(*) AS n FROM activity_events WHERE entity_id=? AND action LIKE 'principle_agreement_%' GROUP BY action",[quote.id]);
    test(counts.length===2 && counts.every(row=>row.n===1),'R03B-12: événements de confirmation/révocation uniques');
    // UX-01: véritable brouillon de relance du Devis, avec refus de quitter.
    const modalBefore=confirmations.length;
    await js('const field=document.querySelector(".prospect-quote-panel .followup-inline input[type=date]");'+
      'if(!field)throw Error("Champ de relance absent");'+
      'Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(field,"2026-12-20");'+
      'field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new Event("change",{bubbles:true}));');
    await wait('document.querySelector(".prospect-quote-panel .followup-inline input[type=date]")?.value==="2026-12-20"',
      'brouillon de relance visible');
    await js('document.querySelector(".prospect-desk-overlay .close-detail").click();');
    await sleep(90);
    test(confirmations.length===modalBefore+1,'R03B-18: sortie dirty demande une seule confirmation');
    test(await get('!!document.querySelector(".prospect-desk-overlay") && document.querySelector(".prospect-quote-panel .followup-inline input[type=date]")?.value==="2026-12-20"'),
      'R03B-18: Rester garde le brouillon intact');
    test(!db.actions.list({ownerType:'prospect',ownerId:active.id}).some(a=>a.type==='follow_up'),
      'R03B-18: aucune relance créée en quittant un brouillon');
    discardNext=true;
    await js('document.querySelector(".prospect-desk-overlay .close-detail").click();');
    await wait('!document.querySelector(".prospect-desk-overlay")','sortie explicitement confirmée');
    test(await get('document.querySelector(".kanban-board").textContent.includes("TEST 03B Actif Dijon")'),
      'R03B-12: retour à la colonne actuelle après révocation');

    // Historique : une conversion réelle ne se confond ni avec perdu ni avec archivé.
    await clickText('.pipeline-conversion-history button','Voir les conversions');
    await wait('!!document.querySelector(".history-prospect-list")','historique Conversion');
    test(await get('document.querySelector(".history-prospect-list").textContent.includes("TEST 03B Converti")'),
      'R03B-17: conversion authentique affichée');
    test(await get('!document.querySelector(".history-prospect-list").textContent.includes("TEST 03B Perdu")'),
      'R03B-16: perdu n’apparaît pas en conversion');
    await clickText('.history-prospect-row','TEST 03B Converti');
    await wait('!!document.querySelector(".history-view-stack .prospect-detail-panel")','détail conversion');
    await clickText('.history-view-stack button','Ouvrir la fiche Client');
    await wait('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Clients"',
      'navigation exacte Client');
    test(await get('document.querySelector(".content-area .page-heading h1")?.textContent.trim()==="Clients"'),
      'R03B-17: Client exact ouvert via routage réel');
    test(db.crm.listClients().some(c=>c.id===linked.clientId),'R03B-17: Client lié, pas doublonné');
    test(recordCount('client_accounts')===1,'R03B-17: un seul Client issu du Prospect');

    // Le parcours utilise les neuf combinaisons de présentation V2 réelles.
    const combos=[['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']];
    const densities=[['compact','Compact'],['comfort','Confort'],['comfort_plus','Confort +']];
    for(const [theme,themeName] of combos)for(const [density,densityName] of densities){
      await navigate('Réglages');
      await clickText('.theme-card',themeName);
      await wait('document.documentElement.dataset.theme==='+JSON.stringify(theme),'thème '+theme);
      await clickText('.density-card',densityName);
      await wait('document.documentElement.dataset.density==='+JSON.stringify(density),'densité '+density);
      await navigate('Prospection');
      await clickText('.prospect-view-switch button','Parcours commercial');
      await wait('document.querySelectorAll(".pipeline-step-column").length===7','kanban '+theme+'/'+density);
      test(await get('document.documentElement.dataset.theme==='+JSON.stringify(theme)+'&&document.documentElement.dataset.density==='+JSON.stringify(density)),
        'R03B-19: présentation '+theme+'/'+density);
      test(await get('document.querySelector(".kanban-board").scrollWidth>0 && document.querySelector(".kanban-board").clientWidth>0'),
        'R03B-19: colonnes mesurables '+theme+'/'+density);
      if(saveScreenshot)await saveScreenshot(theme,density,'Prospection','pipeline-03b');
    }
    win.setSize(1024,720);
    await sleep(120);
    test(await get('document.querySelectorAll(".pipeline-step-column").length===7'),
      'R03B-19: colonnes restent montées dans fenêtre 1024x720');
    win.webContents.setZoomFactor(1.25);
    await sleep(120);
    test(await get('document.querySelectorAll(".pipeline-step-column").length===7'),
      'R03B-19: colonnes toujours accessibles à zoom 125 %');
    win.webContents.setZoomFactor(1);
    // 03C.5 : les deux chemins passent par les vrais handlers/preload. Le
    // retry depuis le renderer doit relire un lien durable, sans nouveau contact.
    const contactOrg = db.crm.createOrganization({name:'TEST 03C IPC Contacts'});
    const contactProspect = db.crm.createProspect({organizationId:contactOrg.id});
    const primaryInput = {organizationId:contactOrg.id,firstName:'Lucie',lastName:'Principale'};
    const decisionInput = {organizationId:contactOrg.id,firstName:'Nora',lastName:'Décision'};
    const primaryA = await get('window.atoumweb.crm.contacts.createAndAttachPrimaryProspect('+
      JSON.stringify(contactProspect.id)+','+JSON.stringify(primaryInput)+')');
    const primaryB = await get('window.atoumweb.crm.contacts.createAndAttachPrimaryProspect('+
      JSON.stringify(contactProspect.id)+','+JSON.stringify(primaryInput)+')');
    test(primaryA.id===primaryB.id && prospectStage(contactProspect.id).contactId===primaryA.id,
      'R03C-05: interlocuteur créé/rattaché une seule fois par IPC natif');
    const decisionA = await get('window.atoumweb.crm.contacts.createAndAttachDecisionProspect('+
      JSON.stringify(contactProspect.id)+','+JSON.stringify(decisionInput)+')');
    const decisionB = await get('window.atoumweb.crm.contacts.createAndAttachDecisionProspect('+
      JSON.stringify(contactProspect.id)+','+JSON.stringify(decisionInput)+')');
    test(decisionA.id===decisionB.id && prospectStage(contactProspect.id).decisionMakerContactId===decisionA.id,
      'R03C-05: décisionnaire distinct lié une seule fois par IPC natif');
    test(primaryA.id!==decisionA.id,'R03C-05: contact principal et décisionnaire distincts');
    test(db.database.get('SELECT count(*) AS n FROM contacts WHERE organization_id=?',[contactOrg.id]).n===2,
      'R03C-05: aucune duplication de Contact après replay IPC');

    // 03C : deux fenêtres sur la même checklist via le véritable preload.
    // La seconde fenêtre métier est simulée par une modification du service
    // principal : la même condition CAS est appliquée pour toutes les IPC.
    const conflictOrg = db.crm.createOrganization({name:'TEST 03C Checklist multifenêtre'});
    const conflictProspect = db.crm.createProspect({organizationId:conflictOrg.id});
    const firstInformation = JSON.stringify({version:1,items:[{
      id:'dns',label:'Accès DNS',status:'open',isBlocking:true,
    }]});
    const secondInformation = JSON.stringify({version:1,items:[{
      id:'hosting',label:'Accès hébergement',status:'resolved',isBlocking:false,
    }]});
    const firstChecklist = await get('window.atoumweb.crm.prospects.updateMissingInformationIfUnchanged('+
      JSON.stringify(conflictProspect.id)+',null,'+JSON.stringify(firstInformation)+')');
    test(firstChecklist.missingInformation===firstInformation,
      'R03C-16: première fenêtre sauvegarde le premier snapshot via IPC');
    const rejection = await get('window.atoumweb.crm.prospects.updateMissingInformationIfUnchanged('+
      JSON.stringify(conflictProspect.id)+',null,'+JSON.stringify(secondInformation)+
      ').then(()=>false,error=>String(error.message).includes("Conflit"))');
    test(rejection && db.crm.getProspect(conflictProspect.id).missingInformation===firstInformation,
      'R03C-16: la seconde fenêtre en retard est refusée sans effacement');
    db.crm.updateProspectQualification(conflictProspect.id,{projectSummary:'Contexte modifié dans une autre fenêtre'});
    const refreshed = await get('window.atoumweb.crm.prospects.updateMissingInformationIfUnchanged('+
      JSON.stringify(conflictProspect.id)+','+JSON.stringify(firstInformation)+','+JSON.stringify(secondInformation)+')');
    test(refreshed.missingInformation===secondInformation&&
      refreshed.projectSummary==='Contexte modifié dans une autre fenêtre',
      'R03C-16: relecture explicite permet de reprendre sans écraser le contexte');

    // 03C : besoin de texte libre réellement enregistré, sans devis implicite.
    const needOrg = db.crm.createOrganization({name:'TEST 03C Besoin Dijon'});
    const needProspect = db.crm.createProspect({organizationId:needOrg.id,primaryNeed:'Site vitrine 03C'});
    db.crm.changeProspectStage(needProspect.id,'qualifying');
    db.crm.updateProspectQualification(needProspect.id,{
      projectSummary:'Création de site pour commerce local',
      decisionStatus:'unknown',budgetStatus:'not_disclosed',timelineStatus:'not_disclosed',
    });
    db.crm.changeProspectStage(needProspect.id,'need_identified',null,true);
    db.workflow.saveNeed('prospect',needProspect.id,{otherText:'Audit de référencement 03C'});
    const startingChecklist = JSON.stringify({version:1,items:[{
      id:'verify-dns',label:'Vérifier les accès DNS',status:'open',isBlocking:false,answer:null,
    }]});
    db.crm.updateProspectMissingInformationIfUnchanged(needProspect.id,null,startingChecklist);
    test(db.quotes.list({prospectId:needProspect.id}).length===0,
      'R03C-05: sélectionner un besoin ne crée aucun devis');
    test(db.database.all('SELECT id FROM projects WHERE prospect_id=?',[needProspect.id]).length===0,
      'R03C-05: sélectionner un besoin ne crée aucun Projet');
    win.setSize(1510,1030);win.webContents.setZoomFactor(1);
    await navigate('Prospection');
    await clickText('.prospect-view-switch button','Parcours commercial');
    await wait('document.querySelectorAll(".pipeline-step-column").length===7',
      'pipeline 03C monté');
    // Les fixtures sont injectées côté main APRÈS le bootstrap du renderer :
    // forcer sa vraie synchronisation IPC plutôt que supposer un remount.
    await js('window.dispatchEvent(new Event("atoumweb:changed"));');
    await wait('[...document.querySelectorAll(".prospect-card-head")].some(e=>e.textContent.includes("TEST 03C Besoin Dijon"))',
      'nouveau Prospect 03C présent après refresh');
    await clickText('.prospect-card-head','TEST 03C Besoin Dijon');
    await wait('!!document.querySelector(".prospect-detail-panel")','fiche Besoins sélectionnée');
    await clickText('.prospect-detail-panel button','Ouvrir la fiche de travail');
    await wait('!!document.querySelector(".prospect-desk-overlay .prequote-entry button")',
      'pré-devis réel chargé depuis workflow et catalogue');
    // La fiche de travail voit le snapshot initial ; une seconde fenêtre
    // modifie ensuite la checklist avant qu'un utilisateur valide localement.
    await wait('!!document.querySelector(".prospect-desk-overlay .missing-info-row select")',
      'checklist réelle chargée dans le bureau 03C');
    const concurrentChecklist = JSON.stringify({version:1,items:[{
      id:'verify-dns',label:'Vérifier les accès DNS',status:'later',isBlocking:false,answer:'Revu dans la seconde fenêtre',
    }]});
    db.crm.updateProspectMissingInformationIfUnchanged(needProspect.id,startingChecklist,concurrentChecklist);
    await js('const choice=document.querySelector(".prospect-desk-overlay .missing-info-row select");'+
      'choice.value="resolved";choice.dispatchEvent(new Event("change",{bubbles:true}));');
    await wait('!!document.querySelector(".prospect-desk-overlay .prospect-checklist-conflict")',
      'conflit visible dans la fiche de travail');
    test(db.crm.getProspect(needProspect.id).missingInformation===concurrentChecklist,
      'R03C-16: la saisie obsolète ne remplace pas les informations de la seconde fenêtre');
    await clickText('.prospect-checklist-conflict button','Recharger uniquement la checklist');
    await wait('!document.querySelector(".prospect-desk-overlay .prospect-checklist-conflict")',
      'rechargement explicite accepté');
    test(await get('document.querySelector(".prospect-desk-overlay .missing-info-row select")?.value==="later"'),
      'R03C-16: checklist rechargée sans écriture silencieuse');
    test(db.crm.getProspect(needProspect.id).projectSummary==='Création de site pour commerce local',
      'R03C-16: autre champ de qualification préservé après recharge');

    await clickText('.prequote-entry button','Contrôler avant devis');
    await wait('!!document.querySelector(".prequote-actions button.primary-button")',
      'contrôle pré-devis ouvert');
    test(await get('document.querySelector(".prequote-solutions")?.textContent.includes("Audit de référencement 03C")'),
      'R03C-07: besoin libre présent et prix à préciser');
    test(await get('!document.querySelector(".prequote-actions button.primary-button").disabled'),
      'R03C-08: contrôle complet autorise la création volontaire');
    test(db.quotes.list({prospectId:needProspect.id}).length===0,
      'R03C-08: ouvrir le contrôle ne crée aucun devis');
    await clickText('.prequote-actions button.primary-button','Passer à l’édition du devis');
    for(let i=0;i<100&&db.quotes.list({prospectId:needProspect.id}).length===0;i++)await sleep(70);
    const made = db.quotes.list({prospectId:needProspect.id});
    test(made.length===1 && made[0].status==='draft',
      'R03C-08: un seul devis brouillon créé après clic');
    const full = db.quotes.get(made[0].id);
    test(full.lines.length===1 && full.lines[0].label==='Audit de référencement 03C',
      'R03C-08: seule la ligne libre volontaire est au devis');
    test(!prospectStage(needProspect.id).clientAccountId && db.crm.listClients().length===1,
      'R03C-08: préparer le devis ne convertit pas le Prospect');
    await wait('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==="Devis"',
      'naviguer vers le véritable brouillon de devis');
    test(db.database.get('PRAGMA integrity_check').integrity_check==='ok',
      'R03C-18: intégrité SQLite TEMP après création devis');
    test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','R03B-20: intégrité SQLite TEMP');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'R03B-20: zéro FK cassée');
    console.log('[UXV2 03B LIVE] RESULT '+JSON.stringify({
      passed:true,nativeDialogCount:confirmations.length,themeDensityCases:9,
      clientCount:recordCount('client_accounts'),onlyTemp:true,source:'real-app+preload+ipc+sqlite',
      note:'Validation native exige un lancement local ; ceci n est pas une preuve d execution par la CI.',
    }));
  } finally {
    dialog.showMessageBoxSync=originalDialog;
  }
};

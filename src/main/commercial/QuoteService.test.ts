import { sendForTest } from '../testSupport/quotePreparationFixture';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { join,resolve,sep } from 'node:path';
import { tmpdir } from 'node:os';
import { ClientDocumentService } from '../crm/ClientDocumentService';
import { createWorkspacePaths } from '../workspace';
import { ContractTermsService } from './ContractTermsService';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import { finalizeForTest, acceptForTest } from '../testSupport/quotePreparationFixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { CatalogRecommendationsService } from './CatalogRecommendationsService';
import { quoteRecommendationState } from '../../shared/quoteRecommendationStatus';
import { QuoteService } from './QuoteService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let catalog: CatalogService;
let quotes: QuoteService;
let documents: ClientDocumentService;
let root: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  catalog = new CatalogService(database);
  root=mkdtempSync(join(tmpdir(),'atoumweb-quote-lot5-'));
  documents=new ClientDocumentService(database,createWorkspacePaths(root));
  quotes = new QuoteService(database, crm,new ContractTermsService(database,documents),new QuoteContractPreparationService(database,documents));
});

afterEach(() => {database.close();const target=resolve(root);if(!target.startsWith(resolve(tmpdir())+sep)||!target.includes('atoumweb-quote-lot5-'))throw Error('Chemin invalide');rmSync(target,{recursive:true,force:true});});

function createProspect() {
  const organization = crm.createOrganization({ name: 'Client test' });
  return crm.createProspect({ organizationId: organization.id, primaryNeed: 'Site vitrine' });
}

function createPublishedService(priceCents = 10000, name = 'Service test') {
  const item = catalog.create(
    { type: 'service', name, category: 'Tests' },
    { priceMode: 'fixed', priceCents, description: 'Version initiale' },
  );
  catalog.publishVersion(item.versions[0].id);
  return catalog.getItem(item.id);
}

describe('04E — advice never mutates an accepted or historical quote snapshot', () => {
  it('preserves authored version fields on the existing quote after catalogue republishing', () => {
    const prospect=createProspect();
    const item=catalog.create({type:'service',name:'Conseil SEO contextualisé'},{
      priceMode:'fixed',priceCents:14900,commercialParameters:{
        salesPitch:'Ancien argumentaire',qualificationQuestions:'Ancienne question',
        relevantSituations:'Entreprises locales',commercialCautions:'Ne pas garantir le rang',
      },
    });
    const previousId=item.versions[0].id;
    catalog.publishVersion(previousId);
    const quote=quotes.create({prospectId:prospect.id,subject:'Conseil versionné'});
    const original=quotes.addCatalogLine(quote.id,previousId);
    const originalSnapshot=original.lines.find(line=>line.catalogVersionId===previousId)?.snapshot;
    expect(originalSnapshot?.commercialParameters).toMatchObject({
      salesPitch:'Ancien argumentaire',qualificationQuestions:'Ancienne question',
      relevantSituations:'Entreprises locales',commercialCautions:'Ne pas garantir le rang',
    });
    const newer=catalog.createVersion(item.id,{
      priceMode:'fixed',priceCents:16900,commercialParameters:{
        salesPitch:'Nouvel argumentaire',qualificationQuestions:'Nouvelle question',
        relevantSituations:'Autre situation',commercialCautions:'Autre vigilance',
      },
    });
    catalog.publishVersion(newer.id);
    const historical=quotes.get(quote.id).lines.find(line=>line.catalogVersionId===previousId)!;
    expect(historical.snapshot?.commercialParameters).toEqual(originalSnapshot?.commercialParameters);
    expect(historical.catalogVersionId).toBe(previousId);
    expect(historical.catalogUnitPriceCents).toBe(14900);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });
});

describe('04D — recommendations across Catalogue and Quote, no implicit purchase',()=>{
  it('keeps recommendations advisory until a deliberate separate quote-line insertion',()=>{
    const prospect=createProspect();
    const rec=new CatalogRecommendationsService(database);
    const offer=catalog.create({type:'offer',name:'Offre de départ'},{
      priceMode:'fixed',priceCents:69900,
    });
    const target=createPublishedService(14900,'SEO local recommandé');
    rec.replace(offer.versions[0].id,[target.currentVersion!.id],[]);
    catalog.publishVersion(offer.versions[0].id);
    const quote=quotes.create({prospectId:prospect.id,subject:'Devis avec conseil'});
    const selected=quotes.addCatalogLine(quote.id,offer.versions[0].id);
    expect(selected.lines).toHaveLength(1);
    expect(selected.lines[0].catalogVersionId).toBe(offer.versions[0].id);
    expect(selected.contractValueCents).toBe(69900);
    expect(rec.list(offer.versions[0].id)).toMatchObject([{
      targetItemId:target.id,targetVersionId:target.currentVersion!.id,
      targetName:'SEO local recommandé',targetVersionStatus:'published',
    }]);
    const state=quoteRecommendationState(selected.lines[0],rec.list(offer.versions[0].id)[0],selected.lines);
    expect(state).toBe('recommended');
    const added=quotes.addCatalogLine(quote.id,target.currentVersion!.id);
    expect(added.lines).toHaveLength(2);
    expect(added.contractValueCents).toBe(84800);
    expect(quoteRecommendationState(added.lines[0],rec.list(offer.versions[0].id)[0],added.lines)).toBe('already-added');
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('does not silently requalify a retired recommendation in an old Quote',()=>{
    const prospect=createProspect();
    const rec=new CatalogRecommendationsService(database);
    const offer=catalog.create({type:'offer',name:'Offre historique'},{
      priceMode:'fixed',priceCents:45000,
    });
    const service=createPublishedService(9900,'Service original');
    rec.replace(offer.versions[0].id,[service.currentVersion!.id],[]);
    catalog.publishVersion(offer.versions[0].id);
    const quote=quotes.create({prospectId:prospect.id,subject:'Devis historique'});
    const before=quotes.addCatalogLine(quote.id,offer.versions[0].id);
    const newer=catalog.createVersion(service.id,{priceMode:'fixed',priceCents:12900});
    catalog.publishVersion(newer.id);
    const links=rec.list(offer.versions[0].id);
    expect(links[0].targetVersionId).toBe(service.currentVersion!.id);
    expect(links[0].targetVersionStatus).toBe('retired');
    expect(quoteRecommendationState(before.lines[0],links[0],before.lines)).toBe('unavailable');
    expect(quotes.get(quote.id).lines).toEqual(before.lines);
    expect(()=>quotes.addCatalogLine(quote.id,service.currentVersion!.id)).toThrow(/publiée/);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });
});

describe('04F — traversée Catalogue recommandé → Devis réel SQLite', () => {
  it('n’ajoute aucune ligne sans choix puis conserve la provenance de la version choisie',()=>{
    const prospect=createProspect();
    const extra=createPublishedService(14900,'Audit additionnel');
    const offer=catalog.create({type:'offer',name:'Offre vitrine publiée'},{
      priceMode:'fixed',priceCents:69900,description:'Offre principale',
    });
    const offerId=offer.versions[0].id;
    const advice=new CatalogRecommendationsService(database);
    advice.replace(offerId,[extra.currentVersion!.id],[]);
    catalog.publishVersion(offerId);
    const quote=quotes.create({prospectId:prospect.id,subject:'Vitrine + audit conseillé'});
    const withOffer=quotes.addCatalogLine(quote.id,offerId);
    expect(withOffer.lines).toHaveLength(1);
    const source=withOffer.lines[0];
    expect(advice.list(offerId).map(row=>row.targetVersionId)).toEqual([extra.currentVersion!.id]);
    expect(quoteRecommendationState(source,advice.list(offerId)[0],withOffer.lines)).toBe('recommended');
    const chosen=quotes.addCatalogLine(quote.id,extra.currentVersion!.id);
    expect(chosen.lines).toHaveLength(2);
    expect(quoteRecommendationState(source,advice.list(offerId)[0],chosen.lines)).toBe('already-added');
    const purchased=chosen.lines.find(line=>line.catalogVersionId===extra.currentVersion!.id)!;
    expect(purchased.catalogUnitPriceCents).toBe(14900);
    const newer=catalog.createVersion(extra.id,{priceMode:'fixed',priceCents:19900});
    catalog.publishVersion(newer.id);
    const historical=quotes.get(quote.id).lines.find(line=>line.id===purchased.id)!;
    expect(historical.catalogVersionId).toBe(extra.currentVersion!.id);
    expect(historical.catalogUnitPriceCents).toBe(14900);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });
});

describe('QuoteService', () => {

  it('R06A-08 / R06E-05 : marquer vu ne signe pas le devis et ne convertit pas le prospect', () => {
    const prospect = createProspect();
    crm.changeProspectStage(prospect.id, 'qualifying');
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Consultation sans acceptation' });
    quotes.addCustomLine(quote.id, { label: 'Site vitrine', proposedUnitPriceCents: 69900 });

    expect(() => quotes.markViewed(quote.id)).toThrow(/envoyé/);
    const finalized = finalizeForTest(database, quotes, quote.id);
    expect(finalized.finalizedAt).toBeTruthy();
    expect(finalized.status).toBe('draft');
    const sent = sendForTest(quotes,quote.id);
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeTruthy();
    expect(sent.acceptedAt).toBeNull();
    const viewed = quotes.markViewed(quote.id);

    expect(viewed.status).toBe('viewed');
    expect(viewed.viewedAt).toBeTruthy();
    expect(quotes.get(quote.id).status).toBe('viewed');
    expect(quotes.get(quote.id).acceptedAt).toBeNull();
    expect(crm.listProspects({ includeArchived: true }).find(item => item.id === prospect.id)?.clientAccountId).toBeFalsy();
    expect(database.get<{ n: number }>("SELECT count(*) AS n FROM activity_events WHERE entity_id=? AND action='quote_accepted'", [quote.id])?.n).toBe(0);
  });


  it('R06A-15 / R06F-23 : la lecture historique ne reconstitue jamais les CGV absentes', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Ancien devis sans archive CGV' });
    quotes.addCustomLine(quote.id, { label: 'Prestation historique', proposedUnitPriceCents: 12000 });
    finalizeForTest(database, quotes, quote.id);
    // Simule uniquement une ancienne ligne persistée privée de snapshots, sans modifier le schéma.
    database.run('UPDATE quotes SET contract_text_snapshot=NULL, contract_snapshot_json=NULL WHERE id=?', [quote.id]);
    const before = database.get<{ contract_text_snapshot: string | null; contract_snapshot_json: string | null }>(
      'SELECT contract_text_snapshot, contract_snapshot_json FROM quotes WHERE id=?', [quote.id],
    );
    const historical = quotes.get(quote.id);
    expect(historical.finalizedAt).toBeTruthy();
    expect(historical.contractTextSnapshot).toBeNull();
    expect(historical.contractSnapshotJson).toBeNull();
    expect(quotes.get(quote.id).contractTextSnapshot).toBeNull();
    expect(quotes.get(quote.id).contractSnapshotJson).toBeNull();
    const after = database.get<{ contract_text_snapshot: string | null; contract_snapshot_json: string | null }>(
      'SELECT contract_text_snapshot, contract_snapshot_json FROM quotes WHERE id=?', [quote.id],
    );
    expect(after).toEqual(before);
  });

  it('E73 : un accord de principe explicite est horodaté, idempotent et révocable sans signature ni conversion', () => {
    const prospect = createProspect();
    crm.changeProspectStage(prospect.id, 'qualifying');
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Accord non contractuel' });
    quotes.addCustomLine(quote.id, { label: 'Site vitrine', proposedUnitPriceCents: 69900 });
    database.run("UPDATE quotes SET status='sent' WHERE id=?", [quote.id]);
    const beforeStage = crm.listProspects().find((item) => item.id === prospect.id)?.stage;
    const accepted = quotes.confirmPrincipleAgreement(quote.id);
    expect(accepted.principleAgreementAt).toBeTruthy();
    expect(accepted.status).toBe('sent');
    expect(quotes.list({ prospectId: prospect.id })[0].principleAgreementAt).toBe(accepted.principleAgreementAt);
    expect(quotes.confirmPrincipleAgreement(quote.id).principleAgreementAt).toBe(accepted.principleAgreementAt);
    expect(database.get<{ n: number }>("SELECT count(*) AS n FROM activity_events WHERE entity_id=? AND action='principle_agreement_confirmed'", [quote.id])?.n).toBe(1);
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.stage).toBe(beforeStage);
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.clientAccountId).toBeFalsy();
    expect(quotes.revokePrincipleAgreement(quote.id).principleAgreementAt).toBeNull();
    expect(quotes.revokePrincipleAgreement(quote.id).principleAgreementAt).toBeNull();
    expect(database.get<{ n: number }>("SELECT count(*) AS n FROM activity_events WHERE entity_id=? AND action='principle_agreement_revoked'", [quote.id])?.n).toBe(1);
    expect(quotes.confirmPrincipleAgreement(quote.id).principleAgreementAt).toBeTruthy();
  });

  it('E73 : accord refusé sur devis brouillon, vide ou Prospect hors prospection', () => {
    const prospect = createProspect();
    const draft = quotes.create({ prospectId: prospect.id, subject: 'Avant démarrage' });
    expect(() => quotes.confirmPrincipleAgreement(draft.id)).toThrow(/envoyé/);
    database.run("UPDATE quotes SET status='sent' WHERE id=?", [draft.id]);
    expect(() => quotes.confirmPrincipleAgreement(draft.id)).toThrow(/vide/);
    database.run("UPDATE quotes SET status='draft' WHERE id=?", [draft.id]);
    quotes.addCustomLine(draft.id, { label: 'Audit', proposedUnitPriceCents: 9000 });
    database.run("UPDATE quotes SET status='sent' WHERE id=?", [draft.id]);
    expect(() => quotes.confirmPrincipleAgreement(draft.id)).toThrow(/Prospect doit être actif/);
  });

  it('E73 : une révision plus récente rend l’ancien accord inactif sans effacer sa trace', () => {
    const prospect = createProspect();
    crm.changeProspectStage(prospect.id, 'qualifying');
    const oldQuote = quotes.create({ prospectId: prospect.id, subject: 'Révision originale' });
    quotes.addCustomLine(oldQuote.id, { label: 'Site', proposedUnitPriceCents: 10000 });
    database.run("UPDATE quotes SET status='sent' WHERE id=?", [oldQuote.id]);
    quotes.confirmPrincipleAgreement(oldQuote.id);
    const nextQuote = quotes.create({ prospectId: prospect.id, subject: 'Révision courante' });
    quotes.addCustomLine(nextQuote.id, { label: 'Site révisé', proposedUnitPriceCents: 20000 });
    database.run("UPDATE quotes SET status='sent' WHERE id=?", [nextQuote.id]);
    const now = new Date().toISOString();
    database.run('INSERT INTO commercial_project_dossiers(id,current_quote_id,created_at) VALUES(?,?,?)', ['dossier-e73', nextQuote.id, now]);
    for (const [id, number] of [[oldQuote.id, 1], [nextQuote.id, 2]] as const) {
      database.run('INSERT INTO commercial_quote_revisions(quote_id,dossier_id,revision_number,created_at) VALUES(?,?,?,?)',
        [id, 'dossier-e73', number, now]);
    }
    expect(quotes.get(oldQuote.id).principleAgreementAt).toBeNull();
    expect(() => quotes.confirmPrincipleAgreement(oldQuote.id)).toThrow(/révision plus récente/);
    expect(quotes.confirmPrincipleAgreement(nextQuote.id).principleAgreementAt).toBeTruthy();
    expect(database.get<{ n: number }>("SELECT count(*) AS n FROM activity_events WHERE entity_id=? AND action='principle_agreement_confirmed'", [oldQuote.id])?.n).toBe(1);
  });

  it('E72 : créer un devis ne démarre pas la prospection d’un nouveau contact', () => {
    const prospect = createProspect();
    expect(crm.listProspects({ includeArchived: true }).find((item) => item.id === prospect.id)?.stage).toBe('new');

    const first = quotes.create({ prospectId: prospect.id, subject: 'Devis avant prospection' });
    expect(first.prospectId).toBe(prospect.id);
    expect(crm.listProspects({ includeArchived: true }).find((item) => item.id === prospect.id)?.stage).toBe('new');

    const second = quotes.createWithLines({ prospectId: prospect.id, subject: 'Pré-devis avec lignes' }, [{ input: { label: 'Audit', quantityMilli: 1000, proposedUnitPriceCents: 10000 } }]);
    expect(second.prospectId).toBe(prospect.id);
    expect(second.lines).toHaveLength(1);
    expect(crm.listProspects({ includeArchived: true }).find((item) => item.id === prospect.id)?.stage).toBe('new');
    expect(quotes.list({ prospectId: prospect.id })).toHaveLength(2);
  });

  it('E72 : après démarrage volontaire, le workflow devis existant reste actif', () => {
    const prospect = createProspect();
    const started = crm.changeProspectStage(prospect.id, 'qualifying');
    expect(started.stage).toBe('qualifying');

    quotes.create({ prospectId: prospect.id, subject: 'Devis après démarrage' });
    expect(crm.listProspects({ includeArchived: true }).find((item) => item.id === prospect.id)?.stage).toBe('quote_to_prepare');
  });

  it('génère une numérotation annuelle unique', () => {
    const prospect = createProspect();
    const first = quotes.create({ prospectId: prospect.id, subject: 'Premier devis' });
    const second = quotes.create({ prospectId: prospect.id, subject: 'Deuxième devis' });

    expect(first.number).toMatch(/^DEV-\d{4}-001$/);
    expect(second.number).toMatch(/^DEV-\d{4}-002$/);
  });

  it('conserve le snapshot catalogue après publication d’une nouvelle version', () => {
    const prospect = createProspect();
    const service = createPublishedService(10000);
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Snapshot' });
    const withLine = quotes.addCatalogLine(quote.id, service.currentVersion!.id);

    const next = catalog.createVersion(service.id, { priceMode: 'fixed', priceCents: 15000, description: 'Nouvelle version' });
    catalog.publishVersion(next.id);

    const stored = quotes.get(quote.id).lines[0];
    expect(stored.catalogUnitPriceCents).toBe(10000);
    expect(stored.contractLineValueCents).toBe(10000);
    expect(stored.snapshot?.versionNumber).toBe(1);
    expect(catalog.getItem(service.id).currentVersion?.priceCents).toBe(15000);
    expect(withLine.contractValueCents).toBe(10000);
  });

  it('fige aussi la composition exacte d’une Offre dans le snapshot du devis', () => {
    const prospect = createProspect();
    const page = createPublishedService(9900, 'Page supplémentaire');
    const seo = createPublishedService(14900, 'Réglage SEO');
    const offer = catalog.create(
      { type: 'offer', name: 'Site vitrine', category: 'Création de site' },
      { priceMode: 'fixed', priceCents: 69900, description: 'Pack initial' },
    );
    const firstOfferVersion = offer.versions[0];
    catalog.setOfferComponents(firstOfferVersion.id, [
      { serviceVersionId: page.currentVersion!.id, quantityMilli: 5000 },
      { serviceVersionId: seo.currentVersion!.id, isOptional: true },
    ]);
    catalog.publishVersion(firstOfferVersion.id);

    const quote = quotes.create({ prospectId: prospect.id, subject: 'Offre figée' });
    quotes.addCatalogLine(quote.id, firstOfferVersion.id);

    const secondOfferVersion = catalog.createVersion(offer.id, { priceMode: 'fixed', priceCents: 74900, description: 'Pack suivant' });
    catalog.setOfferComponents(secondOfferVersion.id, [
      { serviceVersionId: page.currentVersion!.id, quantityMilli: 7000 },
    ]);
    catalog.publishVersion(secondOfferVersion.id);

    const stored = quotes.get(quote.id).lines[0];
    const components = stored.snapshot?.offerComponents as Array<Record<string, unknown>>;
    expect(stored.snapshot?.versionNumber).toBe(1);
    expect(components).toHaveLength(2);
    expect(components[0].serviceName).toBe('Page supplémentaire');
    expect(components[0].quantityMilli).toBe(5000);
    expect(components[1].serviceName).toBe('Réglage SEO');
    expect(components[1].isOptional).toBe(true);
    expect(catalog.listOfferComponents(secondOfferVersion.id)).toHaveLength(1);
  });

  it('calcule quantité 1,5 et remise en pourcentage sans flottants', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Calculs', depositPercent: 30 });
    const result = quotes.addCustomLine(quote.id, {
      label: 'Prestation',
      quantityMilli: 1500,
      catalogUnitPriceCents: 10000,
      proposedUnitPriceCents: 10000,
      adjustmentMode: 'percent',
      adjustmentValue: 1000,
      discountReasonCode: 'commercial_gesture',
    });

    expect(result.catalogValueCents).toBe(15000);
    expect(result.contractValueCents).toBe(13500);
    expect(result.discountValueCents).toBe(1500);
    expect(result.depositCents).toBe(4050);
    expect(result.balanceCents).toBe(9450);
  });

  it('finalise une seule fois et exige la finalisation avant l’envoi', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Finalisation' });
    quotes.addCustomLine(quote.id, { label: 'Site', proposedUnitPriceCents: 69900 });

    expect(() => sendForTest(quotes,quote.id)).toThrow(/finalise/i);

    const first = finalizeForTest(database,quotes,quote.id);
    const firstFinalizedAt = first.finalizedAt;
    const second = finalizeForTest(database,quotes,quote.id);
    const finalizationEvents = database.all<{ count: number }>(
      "SELECT COUNT(*) AS count FROM activity_log WHERE entity_type='quote' AND entity_id=? AND action='quote_finalized'",
      [quote.id],
    );

    expect(firstFinalizedAt).toBeTruthy();
    expect(second.finalizedAt).toBe(firstFinalizedAt);
    expect(Number(finalizationEvents[0]?.count ?? 0)).toBe(1);
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.stage).toBe('quote_to_send');

    const sent = sendForTest(quotes,quote.id);
    expect(sent.status).toBe('sent');
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.stage).toBe('quote_sent');
  });

  it('accepte un devis prospect sans créer deux clients et verrouille le snapshot', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Acceptation' });
    quotes.addCustomLine(quote.id, { label: 'Site', proposedUnitPriceCents: 69900 });
    finalizeForTest(database,quotes,quote.id);
    sendForTest(quotes,quote.id);

    const accepted = acceptForTest(database,quotes,quote.id);
    const second = acceptForTest(database,quotes,quote.id);

    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptedClientAccountId).toBeTruthy();
    expect(second.acceptedClientAccountId).toBe(accepted.acceptedClientAccountId);
    expect(crm.listClients()).toHaveLength(1);
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.stage).toBe('won');
    expect(accepted.projectReadyAt).toBeTruthy();
    expect(() => quotes.addCustomLine(quote.id, { label: 'Interdit', proposedUnitPriceCents: 1000 })).toThrow(/figé|accepté/i);
  });

  it('rattache le PDF contractuel Abby uniquement après acceptation du devis', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Devis signé Abby' });
    quotes.addCustomLine(quote.id, { label: 'Site', proposedUnitPriceCents: 69900 });

    expect(() => quotes.attachContractDocument(quote.id, 'doc-inexistant')).toThrow(/accepté/i);

    finalizeForTest(database,quotes,quote.id);
    sendForTest(quotes,quote.id);
    const accepted = acceptForTest(database,quotes,quote.id);
    const clientId = accepted.acceptedClientAccountId!;
    const source=join(root,'devis-signe.pdf');writeFileSync(source,'%PDF-1.4\nDocument test isolé');
    const doc=documents.importPaths(clientId,[source],{category:'contract',title:'Devis signé'})[0];
    const attached = quotes.attachContractDocument(quote.id, doc.id, 'ABBY-DEV-2026-42');
    expect(attached.contractDocumentId).toBe(doc.id);
    expect(attached.abbyReference).toBe('ABBY-DEV-2026-42');
    expect(attached.contractDocumentAttachedAt).toBeTruthy();

    const updated = quotes.updateAbbyReference(quote.id, 'ABBY-DEV-2026-43');
    expect(updated.abbyReference).toBe('ABBY-DEV-2026-43');
  });

  it('duplique un devis refusé avec un nouveau numéro', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'À dupliquer' });
    quotes.addCustomLine(quote.id, { label: 'Ligne libre', proposedUnitPriceCents: 50000 });
    finalizeForTest(database,quotes,quote.id);
    sendForTest(quotes,quote.id);
    quotes.refuse(quote.id);

    const copy = quotes.duplicate(quote.id);
    expect(copy.status).toBe('draft');
    expect(copy.number).not.toBe(quote.number);
    expect(copy.lines).toHaveLength(1);
    expect(copy.contractValueCents).toBe(50000);
  });
  it('06C : quantité, prix proposé et remise restent attachés à la version catalogue figée', () => {
    const prospect = createProspect();
    const service = createPublishedService(10000, 'Service 06C');
    const originalVersionId = service.currentVersion!.id;
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Calcul et version immuable' });

    const computed = quotes.addCatalogLine(quote.id, originalVersionId, {
      quantityMilli: 1500,
      proposedUnitPriceCents: 12000,
      adjustmentMode: 'percent',
      adjustmentValue: 1000,
      discountReasonCode: 'commercial_gesture',
    });

    expect(computed.lines).toHaveLength(1);
    expect(computed.lines[0].catalogVersionId).toBe(originalVersionId);
    expect(computed.lines[0].quantityMilli).toBe(1500);
    expect(computed.lines[0].catalogUnitPriceCents).toBe(10000);
    expect(computed.lines[0].proposedUnitPriceCents).toBe(12000);
    expect(computed.catalogValueCents).toBe(15000);
    expect(computed.contractValueCents).toBe(16200);

    const next = catalog.createVersion(service.id, { priceMode: 'fixed', priceCents: 20000 });
    catalog.publishVersion(next.id);
    const kept = quotes.get(quote.id);
    expect(kept.lines[0].catalogVersionId).toBe(originalVersionId);
    expect(kept.lines[0].snapshot?.versionNumber).toBe(1);
    expect(kept.lines[0].catalogUnitPriceCents).toBe(10000);
    expect(kept.lines[0].proposedUnitPriceCents).toBe(12000);
    expect(kept.contractValueCents).toBe(16200);
    expect(catalog.getItem(service.id).currentVersion?.priceCents).toBe(20000);
  });

  it('06C : achat d’option idempotent, provenance et retrait sans changer l’offre', () => {
    const prospect = createProspect();
    const option = createPublishedService(14900, 'Option SEO 06C');
    const optionVersionId = option.currentVersion!.id;
    const offer = catalog.create(
      { type: 'offer', name: 'Pack 06C', category: 'Tests' },
      { priceMode: 'fixed', priceCents: 69900, description: 'Pack de base' },
    );
    catalog.setOfferComponents(offer.versions[0].id, [
      { serviceVersionId: optionVersionId, isOptional: true },
    ]);
    catalog.publishVersion(offer.versions[0].id);
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Option isolée' });
    const initial = quotes.addCatalogLine(quote.id, offer.versions[0].id);
    const offerLine = initial.lines[0];
    const component = (offerLine.snapshot!.offerComponents as Array<{ componentId: string }>)[0];

    expect(initial.lines).toHaveLength(1);
    expect(initial.contractValueCents).toBe(69900);
    const purchased = quotes.selectOfferOption(offerLine.id, component.componentId);
    expect(purchased.lines).toHaveLength(2);
    const purchasedLine = purchased.lines.find(line => line.id !== offerLine.id)!;
    expect(purchasedLine.optionPurchase?.sourceOfferLineId).toBe(offerLine.id);
    expect(purchasedLine.optionPurchase?.sourceComponentId).toBe(component.componentId);
    expect(purchasedLine.catalogVersionId).toBe(optionVersionId);
    expect(purchased.contractValueCents).toBe(84800);

    const again = quotes.selectOfferOption(offerLine.id, component.componentId);
    expect(again.lines).toHaveLength(2);
    expect(again.lines.find(line => line.id !== offerLine.id)?.id).toBe(purchasedLine.id);

    const next = catalog.createVersion(option.id, { priceMode: 'fixed', priceCents: 19900 });
    catalog.publishVersion(next.id);
    expect(quotes.get(quote.id).lines.find(line => line.id === purchasedLine.id)?.catalogVersionId).toBe(optionVersionId);

    const removed = quotes.deselectOfferOption(offerLine.id, component.componentId);
    expect(removed.lines).toHaveLength(1);
    expect(removed.lines[0].id).toBe(offerLine.id);
    expect(removed.contractValueCents).toBe(69900);
    expect(quotes.deselectOfferOption(offerLine.id, component.componentId).lines).toHaveLength(1);
  });

  it('06C : option non achetée sans incidence et rejet d’une provenance inexistante', () => {
    const prospect = createProspect();
    const option = createPublishedService(9900, 'Option secondaire 06C');
    const offer = catalog.create(
      { type: 'offer', name: 'Offre isolée 06C', category: 'Tests' },
      { priceMode: 'fixed', priceCents: 39900 },
    );
    catalog.setOfferComponents(offer.versions[0].id, [
      { serviceVersionId: option.currentVersion!.id, isOptional: true },
    ]);
    catalog.publishVersion(offer.versions[0].id);
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Option non sélectionnée' });
    const added = quotes.addCatalogLine(quote.id, offer.versions[0].id);
    expect(added.lines).toHaveLength(1);
    expect(added.contractValueCents).toBe(39900);
    expect(() => quotes.selectOfferOption(added.lines[0].id, 'composant-inexistant'))
      .toThrow(/Option absente/);
    expect(quotes.get(quote.id).lines).toHaveLength(1);
    expect(quotes.get(quote.id).contractValueCents).toBe(39900);
  });

  it('06D : refuser un devis envoyé ne convertit pas le prospect ni ne prépare un projet', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Refus sans conversion' });
    quotes.addCustomLine(quote.id, { label: 'Prestation refusée', proposedUnitPriceCents: 15000 });
    finalizeForTest(database,quotes,quote.id);
    sendForTest(quotes,quote.id);
    const refused = quotes.refuse(quote.id);
    expect(refused.status).toBe('refused');
    expect(refused.acceptedClientAccountId).toBeFalsy();
    expect(refused.projectReadyAt).toBeFalsy();
    expect(crm.listClients()).toHaveLength(0);
    expect(crm.listProspects().find(item => item.id === prospect.id)?.clientAccountId).toBeFalsy();
    expect(() => quotes.addCustomLine(quote.id, { label: 'Modification interdite', proposedUnitPriceCents: 1000 }))
      .toThrow(/figé|refusé|brouillon|copie du devis/i);
  });

  it('06D : un devis marqué envoyé reste sans acceptation et sans conversion', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Envoi sans signature' });
    quotes.addCustomLine(quote.id, { label: 'Prestation proposée', proposedUnitPriceCents: 20000 });
    finalizeForTest(database,quotes,quote.id);
    const sent = sendForTest(quotes,quote.id);
    expect(sent.status).toBe('sent');
    expect(sent.acceptedClientAccountId).toBeFalsy();
    expect(sent.projectReadyAt).toBeFalsy();
    expect(crm.listClients()).toHaveLength(0);
    expect(crm.listProspects().find(item => item.id === prospect.id)?.clientAccountId).toBeFalsy();
  });

  it('R06D-07 : une clause orpheline activée ne figure pas dans le contrat compilé', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Contrat sans clause orpheline' });
    quotes.addCustomLine(quote.id, { label: 'Prestation active', proposedUnitPriceCents: 10000 });
    const terms = new ContractTermsService(database, documents);
    terms.addCustomQuoteClause(quote.id, { title: 'Clause valable', body: 'Texte valable uniquement' });
    terms.addCustomQuoteClause(quote.id, { title: 'Clause devenue orpheline', body: 'Texte à exclure du contrat' });
    database.run(
      "UPDATE quote_contract_clauses SET is_orphaned=1 WHERE quote_id=? AND title='Clause devenue orpheline'",
      [quote.id],
    );
    const build = terms.getQuoteBuild(quote.id);
    expect(build.compiledText).toContain('Texte valable uniquement');
    expect(build.compiledText).not.toContain('Texte à exclure du contrat');
    const archived = database.get<{ enabled: number; is_orphaned: number; body: string }>(
      "SELECT enabled,is_orphaned,body FROM quote_contract_clauses WHERE quote_id=? AND title='Clause devenue orpheline'",
      [quote.id],
    );
    expect(archived).toEqual({ enabled: 1, is_orphaned: 1, body: 'Texte à exclure du contrat' });
  });

  it('R06C-15 : une clause de ligne personnalisée devenue orpheline conserve le choix humain', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Clause orpheline personnalisée' });
    const first = quotes.addCustomLine(quote.id, { label: 'Service supprimé', proposedUnitPriceCents: 20000 });
    const lineId = first.lines[0].id;
    quotes.addCustomLine(quote.id, { label: 'Service conservé', proposedUnitPriceCents: 10000 });
    database.run(
      `INSERT INTO quote_contract_clauses
       (id,quote_id,source_key,source_kind,source_clause_id,source_clause_version_id,source_catalog_item_ids_json,
        title,body,sort_order,enabled,is_customized,is_orphaned,created_at,updated_at)
       VALUES (?,?,?,'catalog',NULL,NULL,'[]',?,?,1800,1,1,0,datetime('now'),datetime('now'))`,
      ['customized-orphan-clause',quote.id,`particular-line:${lineId}`,'Titre ajusté humainement','Contenu contractuel personnalisé'],
    );
    const changed = quotes.removeLine(lineId);
    const preserved = database.get<{ enabled: number; is_customized: number; is_orphaned: number; title: string; body: string }>(
      'SELECT enabled,is_customized,is_orphaned,title,body FROM quote_contract_clauses WHERE id=?',
      ['customized-orphan-clause'],
    );
    expect(changed.lines).toHaveLength(1);
    expect(changed.contractValueCents).toBe(10000);
    expect(preserved).toEqual({
      enabled: 1, is_customized: 1, is_orphaned: 1,
      title: 'Titre ajusté humainement', body: 'Contenu contractuel personnalisé',
    });
  });

  it('R06C-15 : une clause liée à une ligne retirée devient orpheline et désactivée', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Clause de prestation retirée' });
    const first = quotes.addCustomLine(quote.id, { label: 'Service supprimé', proposedUnitPriceCents: 20000 });
    const lineId = first.lines[0].id;
    quotes.addCustomLine(quote.id, { label: 'Service conservé', proposedUnitPriceCents: 10000 });
    // Représente une ancienne clause de provenance catalogue attachée à la ligne retirée.
    database.run(
      `INSERT INTO quote_contract_clauses
       (id,quote_id,source_key,source_kind,source_clause_id,source_clause_version_id,source_catalog_item_ids_json,
        title,body,sort_order,enabled,is_customized,is_orphaned,created_at,updated_at)
       VALUES (?,?,?,'catalog',NULL,NULL,'[]',?,?,1800,1,0,0,datetime('now'),datetime('now'))`,
      ['historical-line-clause',quote.id,`particular-line:${lineId}`,'Condition de prestation','Clause issue de la ligne retirée'],
    );
    const removed = quotes.removeLine(lineId);
    const clause = database.get<{ enabled: number; is_orphaned: number; body: string }>(
      'SELECT enabled,is_orphaned,body FROM quote_contract_clauses WHERE id=?', ['historical-line-clause'],
    );
    expect(removed.lines).toHaveLength(1);
    expect(removed.contractValueCents).toBe(10000);
    expect(clause).toEqual({ enabled: 0, is_orphaned: 1, body: 'Clause issue de la ligne retirée' });
  });

  it('R06C-15 : retirer une prestation préserve les clauses particulières du devis', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Retrait sans perte contractuelle' });
    const first = quotes.addCustomLine(quote.id, { label: 'Prestation à retirer', proposedUnitPriceCents: 20000 });
    quotes.addCustomLine(quote.id, { label: 'Prestation conservée', proposedUnitPriceCents: 10000 });
    const terms = new ContractTermsService(database, documents);
    terms.addCustomQuoteClause(quote.id, { title: 'Clause personnalisée', body: 'Texte spécifique à préserver' });
    const custom = () => database.get<{ id: string; title: string; body: string; enabled: number }>(
      "SELECT id,title,body,enabled FROM quote_contract_clauses WHERE quote_id=? AND source_kind='custom'", [quote.id],
    );
    const before = custom();
    expect(before?.body).toBe('Texte spécifique à préserver');

    const changed = quotes.removeLine(first.lines[0].id);
    expect(changed.lines).toHaveLength(1);
    expect(changed.lines[0].label).toBe('Prestation conservée');
    expect(changed.contractValueCents).toBe(10000);
    expect(custom()).toEqual(before);
  });

  it('R06D-03 / R06C-15 : synchroniser les CGV ne remplace pas une clause particulière du devis', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Synchronisation avec personnalisation' });
    quotes.addCustomLine(quote.id, { label: 'Prestation initiale', proposedUnitPriceCents: 10000 });
    const terms = new ContractTermsService(database, documents);
    terms.addCustomQuoteClause(quote.id, { title: 'Modalité personnelle', body: 'Texte convenu uniquement pour ce devis' });
    const read = () => database.get<{ id: string; title: string; body: string; enabled: number }>(
      "SELECT id,title,body,enabled FROM quote_contract_clauses WHERE quote_id=? AND source_kind='custom'",
      [quote.id],
    );
    const before = read();
    expect(before?.body).toBe('Texte convenu uniquement pour ce devis');
    quotes.addCustomLine(quote.id, { label: 'Prestation supplémentaire', proposedUnitPriceCents: 5000 });
    terms.syncQuote(quote.id);
    expect(read()).toEqual(before);
    expect(quotes.get(quote.id).contractValueCents).toBe(15000);
  });

  it('R06F-10 : une copie conserve ses clauses particulières sans modifier celles du devis original', () => {
    const prospect = createProspect();
    const original = quotes.create({ prospectId: prospect.id, subject: 'Conditions personnalisées' });
    quotes.addCustomLine(original.id, { label: 'Service personnalisé', proposedUnitPriceCents: 30000 });
    const terms = new ContractTermsService(database, documents);
    terms.addCustomQuoteClause(original.id, { title: 'Délai particulier', body: 'Délai contractuel initial' });

    const copy = quotes.duplicate(original.id);
    const rows = (quoteId: string) => database.all<{ id: string; title: string; body: string }>(
      "SELECT id,title,body FROM quote_contract_clauses WHERE quote_id=? AND source_kind='custom' ORDER BY sort_order", [quoteId],
    );
    expect(rows(original.id)).toHaveLength(1);
    expect(rows(copy.id)).toHaveLength(1);
    expect(rows(copy.id)[0].id).not.toBe(rows(original.id)[0].id);
    expect(rows(copy.id)[0].body).toBe('Délai contractuel initial');

    terms.updateQuoteClause(rows(copy.id)[0].id, { body: 'Délai propre à la copie' });
    expect(rows(original.id)[0].body).toBe('Délai contractuel initial');
    expect(rows(copy.id)[0].body).toBe('Délai propre à la copie');
    expect(quotes.get(original.id).contractValueCents).toBe(30000);
    expect(quotes.get(copy.id).contractValueCents).toBe(30000);
  });

  it('R06E-13 / R06F-21 : une révision non raccordée au Projet échoue sans copie partielle', () => {
    const prospect = createProspect();
    const original = quotes.create({ prospectId: prospect.id, subject: 'Dossier sans cycle Projet' });
    quotes.addCustomLine(original.id, { label: 'Service de référence', proposedUnitPriceCents: 24900 });
    const before = quotes.list({ prospectId: prospect.id });
    const originalBefore = quotes.get(original.id);

    expect(() => quotes.duplicate(original.id, true)).toThrow(/Cycle Projet prévisionnel non raccordé/);

    expect(quotes.list({ prospectId: prospect.id }).map(item => item.id)).toEqual(before.map(item => item.id));
    const after = quotes.get(original.id);
    expect(after.number).toBe(originalBefore.number);
    expect(after.contractValueCents).toBe(originalBefore.contractValueCents);
    expect(after.lines.map(line => line.id)).toEqual(originalBefore.lines.map(line => line.id));
    expect(database.get<{ count: number }>('SELECT COUNT(*) AS count FROM quotes WHERE prospect_id=?', [prospect.id])?.count).toBe(1);
  });

  it('06E : la révision par duplication garde les lignes, mais possède son propre numéro et historique', () => {
    const prospect = createProspect();
    const original = quotes.create({ prospectId: prospect.id, subject: 'Proposition historique' });
    const withLine = quotes.addCustomLine(original.id, { label: 'Prestation figée', quantityMilli: 1500, proposedUnitPriceCents: 20000 });
    finalizeForTest(database,quotes,original.id);
    sendForTest(quotes,original.id);
    quotes.refuse(original.id);
    const revision = quotes.duplicate(original.id);
    expect(revision.id).not.toBe(original.id);
    expect(revision.number).not.toBe(original.number);
    expect(revision.status).toBe('draft');
    expect(revision.lines).toHaveLength(1);
    expect(revision.lines[0].id).not.toBe(withLine.lines[0].id);
    expect(revision.lines[0].quantityMilli).toBe(1500);
    expect(revision.contractValueCents).toBe(30000);
    quotes.updateLine(revision.lines[0].id, { label: 'Prestation révisée', quantityMilli: 1500, proposedUnitPriceCents: 24000 });
    expect(quotes.get(revision.id).contractValueCents).toBe(36000);
    expect(quotes.get(original.id).contractValueCents).toBe(30000);
    expect(quotes.get(original.id).status).toBe('refused');
  });

  it('06E : duplication après refus préserve la version historique et permet une nouvelle validation autonome', () => {
    const prospect = createProspect();
    const first = quotes.create({ prospectId: prospect.id, subject: 'Première proposition' });
    quotes.addCustomLine(first.id, { label: 'Site historique', proposedUnitPriceCents: 69900 });
    finalizeForTest(database,quotes,first.id);
    sendForTest(quotes,first.id);
    quotes.refuse(first.id);
    const revised = quotes.duplicate(first.id);
    quotes.updateLine(revised.lines[0].id, { label: 'Site revisité', quantityMilli: 1000, proposedUnitPriceCents: 79900 });
    const finalized = finalizeForTest(database,quotes,revised.id);
    expect(finalized.finalizedAt).toBeTruthy();
    expect(finalized.contractValueCents).toBe(79900);
    expect(quotes.get(first.id).status).toBe('refused');
    expect(quotes.get(first.id).contractValueCents).toBe(69900);
    expect(quotes.get(first.id).finalizedAt).toBeTruthy();
    expect(() => quotes.addCustomLine(revised.id, { label: 'Ajout tardif', proposedUnitPriceCents: 1000 }))
      .toThrow(/figé|finalisé|copie du devis|envoi/i);
  });

});

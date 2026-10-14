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

describe('QuoteService', () => {

  it('R06A-08 / R06E-05 : marquer vu ne signe pas le devis et ne convertit pas le prospect', () => {
    const prospect = createProspect();
    crm.changeProspectStage(prospect.id, 'qualifying');
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Consultation sans acceptation' });
    quotes.addCustomLine(quote.id, { label: 'Site vitrine', proposedUnitPriceCents: 69900 });

    expect(() => quotes.markViewed(quote.id)).toThrow(/envoyé/);
    database.run("UPDATE quotes SET status='sent' WHERE id=?", [quote.id]);
    const viewed = quotes.markViewed(quote.id);

    expect(viewed.status).toBe('viewed');
    expect(viewed.viewedAt).toBeTruthy();
    expect(quotes.get(quote.id).status).toBe('viewed');
    expect(quotes.get(quote.id).acceptedAt).toBeNull();
    expect(crm.listProspects({ includeArchived: true }).find(item => item.id === prospect.id)?.clientAccountId).toBeFalsy();
    expect(database.get<{ n: number }>("SELECT count(*) AS n FROM activity_events WHERE entity_id=? AND action='quote_accepted'", [quote.id])?.n).toBe(0);
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

    expect(() => quotes.markSent(quote.id)).toThrow(/finalise/i);

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

    const sent = quotes.markSent(quote.id);
    expect(sent.status).toBe('sent');
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.stage).toBe('quote_sent');
  });

  it('accepte un devis prospect sans créer deux clients et verrouille le snapshot', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Acceptation' });
    quotes.addCustomLine(quote.id, { label: 'Site', proposedUnitPriceCents: 69900 });
    finalizeForTest(database,quotes,quote.id);
    quotes.markSent(quote.id);

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
    quotes.markSent(quote.id);
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
    quotes.markSent(quote.id);
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
    quotes.markSent(quote.id);
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
    const sent = quotes.markSent(quote.id);
    expect(sent.status).toBe('sent');
    expect(sent.acceptedClientAccountId).toBeFalsy();
    expect(sent.projectReadyAt).toBeFalsy();
    expect(crm.listClients()).toHaveLength(0);
    expect(crm.listProspects().find(item => item.id === prospect.id)?.clientAccountId).toBeFalsy();
  });

  it('06E : la révision par duplication garde les lignes, mais possède son propre numéro et historique', () => {
    const prospect = createProspect();
    const original = quotes.create({ prospectId: prospect.id, subject: 'Proposition historique' });
    const withLine = quotes.addCustomLine(original.id, { label: 'Prestation figée', quantityMilli: 1500, proposedUnitPriceCents: 20000 });
    finalizeForTest(database,quotes,original.id);
    quotes.markSent(original.id);
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
    quotes.markSent(first.id);
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

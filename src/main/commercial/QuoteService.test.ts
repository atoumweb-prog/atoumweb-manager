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

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  catalog = new CatalogService(database);
  quotes = new QuoteService(database, crm);
});

afterEach(() => database.close());

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

    const first = quotes.finalize(quote.id);
    const firstFinalizedAt = first.finalizedAt;
    const second = quotes.finalize(quote.id);
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
    quotes.finalize(quote.id);
    quotes.markSent(quote.id);

    const accepted = quotes.accept(quote.id);
    const second = quotes.accept(quote.id);

    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptedClientAccountId).toBeTruthy();
    expect(second.acceptedClientAccountId).toBe(accepted.acceptedClientAccountId);
    expect(crm.listClients()).toHaveLength(1);
    expect(crm.listProspects().find((item) => item.id === prospect.id)?.stage).toBe('won');
    expect(accepted.projectReadyAt).toBeTruthy();
    expect(() => quotes.addCustomLine(quote.id, { label: 'Interdit', proposedUnitPriceCents: 1000 })).toThrow(/figé|accepté/i);
  });

  it('duplique un devis refusé avec un nouveau numéro', () => {
    const prospect = createProspect();
    const quote = quotes.create({ prospectId: prospect.id, subject: 'À dupliquer' });
    quotes.addCustomLine(quote.id, { label: 'Ligne libre', proposedUnitPriceCents: 50000 });
    quotes.finalize(quote.id);
    quotes.markSent(quote.id);
    quotes.refuse(quote.id);

    const copy = quotes.duplicate(quote.id);
    expect(copy.status).toBe('draft');
    expect(copy.number).not.toBe(quote.number);
    expect(copy.lines).toHaveLength(1);
    expect(copy.contractValueCents).toBe(50000);
  });
});

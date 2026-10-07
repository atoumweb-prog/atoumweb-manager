import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { CatalogService } from './CatalogService';
import { QuoteService } from './QuoteService';
import { CATALOG_COMMERCIAL_KINDS, type CatalogIdentityManifest } from '../../shared/commercial';

let database: NodeSqliteAdapter, catalog: CatalogService, quotes: QuoteService, crm: CrmService;
const provenance = { reference: 'Référentiel V1 de recette', sha256: 'ab'.repeat(32), recordKey: 'AW-TEST' };
beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys=ON;');
  applyPendingMigrations(database);
  catalog = new CatalogService(database);
  crm = new CrmService(database);
  quotes = new QuoteService(database, crm);
});
afterEach(() => database.close());
const create = (name = 'Même libellé') => catalog.create({ type: 'service', name }, { priceMode: 'fixed', priceCents: 10000 });
const quote = () => {
  const organization = crm.createOrganization({ name: 'Client témoin' });
  const prospect = crm.createProspect({ organizationId: organization.id });
  return quotes.create({ prospectId: prospect.id, subject: 'Identité figée' });
};

describe('Identité catalogue V1 — Lot 2', () => {
  it('laisse les identités inconnues à null sans deviner un code depuis un nom', () => {
    const a = create(), b = create();
    expect(a.id).not.toBe(b.id);
    expect(a.canonicalCode).toBeNull(); expect(b.canonicalCode).toBeNull();
    expect(a.currentVersion).toMatchObject({ commercialKind: null, unit: null, periodicity: null, priceBasis: 'listed', provenance: null });
    expect(catalog.getItem('atoumweb-vitrine').canonicalCode).toBeNull();
  });

  it('normalise un code attribué explicitement et le réserve même après archivage', () => {
    const a = catalog.create({ type: 'service', name: 'Option', canonicalCode: ' aw-web-page-sup ' }, { priceMode: 'fixed', priceCents: 9900 });
    expect(a.canonicalCode).toBe('AW-WEB-PAGE-SUP');
    catalog.setStatus(a.id, 'archived');
    expect(() => catalog.create({ type: 'service', name: 'Autre', canonicalCode: 'AW-WEB-PAGE-SUP' }, { priceMode: 'free' })).toThrow(/déjà attribué/);
    const b = create();
    expect(() => catalog.assignCanonicalCode(b.id, a.canonicalCode!)).toThrow(/déjà attribué/);
    expect(() => catalog.assignCanonicalCode(a.id, 'AW-AUTRE')).toThrow(/immuable/);
    expect(catalog.list({ search: 'aw-web-page-sup' }).map(({ id }) => id)).toEqual([a.id]);
  });

  it.each(['WEB-TEST', 'AW-', 'AW-A--B', 'AW-é', 'AW-A B', 'AW-A-'])('refuse le code mal formé %s sans créer de version', code => {
    const before = database.all('SELECT * FROM catalog_versions ORDER BY id');
    expect(() => catalog.create({ type: 'service', name: 'Test', canonicalCode: code }, { priceMode: 'free' })).toThrow(/Code canonique invalide/);
    expect(database.all('SELECT * FROM catalog_versions ORDER BY id')).toEqual(before);
  });

  it.each(CATALOG_COMMERCIAL_KINDS)('versionne la nature %s, unité, périodicité et provenance sans altérer la version précédente', commercialKind => {
    const item = catalog.create({ type: 'service', name: 'Nature commerciale' }, {
      priceMode: 'fixed', priceCents: 9900, commercialKind, familyCode: 'web', abbyLabel: 'Libellé comptable',
      unit: 'page', periodicity: 'ponctuelle', provenance,
    });
    const first = catalog.publishVersion(item.versions[0].id);
    const next = catalog.createVersion(item.id, { priceMode: 'fixed', priceCents: 11000 });
    expect(next).toMatchObject({ status: 'draft', commercialKind, familyCode: 'WEB', abbyLabel: 'Libellé comptable', unit: 'page', periodicity: 'ponctuelle', provenance });
    expect(catalog.getItem(item.id).versions.find(({ id }) => id === first.id)).toEqual(first);
    const cleared = catalog.createVersion(item.id, { priceMode: 'fixed', priceCents: 11000, unit: null, provenance: null });
    expect(cleared.unit).toBeNull(); expect(cleared.provenance).toBeNull();
    expect(catalog.list({ search: 'comptable' }).map(({ id }) => id)).toContain(item.id);
  });

  it('distingue coût réel et sur devis sans montant inventé et exige un prix pour la ligne vendue', () => {
    const item = catalog.create({ type: 'service', name: 'Licence tiers' }, { priceMode: 'quote_only', priceBasis: 'actual_cost', priceCents: null, unit: 'licence', periodicity: 'annuelle' });
    expect(item.currentVersion).toMatchObject({ priceBasis: 'actual_cost', priceMode: 'quote_only', priceCents: null });
    expect(() => catalog.createVersion(item.id, { priceMode: 'fixed', priceCents: 100 })).toThrow(/coût tiers réel/);
    expect(() => catalog.createVersion(item.id, { priceMode: 'quote_only', priceCents: 100 })).toThrow(/coût tiers réel/);
    const regularQuoteOnly = catalog.create({ type: 'service', name: 'Sur devis' }, { priceMode: 'quote_only' });
    expect(regularQuoteOnly.currentVersion?.priceBasis).toBe('listed');
    catalog.publishVersion(item.versions[0].id);
    const q = quote();
    expect(() => quotes.addCatalogLine(q.id, item.versions[0].id)).toThrow(/prix proposé/);
    expect(quotes.get(q.id).lines).toHaveLength(0);
    const line = quotes.addCatalogLine(q.id, item.versions[0].id, { proposedUnitPriceCents: 12500 }).lines[0];
    expect(line.snapshot).toMatchObject({ priceBasis: 'actual_cost', priceCents: null, periodicity: 'annuelle' });
    expect(line.contractLineValueCents).toBe(12500);
  });

  it('rejette une provenance non traçable avant toute écriture', () => {
    expect(() => catalog.create({ type: 'service', name: 'Test' }, { priceMode: 'free', provenance: { reference: '' } })).toThrow(/référence/);
    expect(() => catalog.create({ type: 'service', name: 'Test' }, { priceMode: 'free', provenance: { reference: 'XLSX', sha256: 'faux' } })).toThrow(/SHA-256/);
  });

  it('applique un manifeste UUID → AW atomique et idempotent, sans toucher aux versions/compositions', () => {
    const a = create(), b = create();
    const versions = database.all('SELECT * FROM catalog_versions ORDER BY id');
    const components = database.all('SELECT * FROM offer_components ORDER BY id');
    const manifest: CatalogIdentityManifest = { schemaVersion: 1, assignments: [
      { itemId: a.id, canonicalCode: 'AW-TEST-A', provenance }, { itemId: b.id, canonicalCode: 'AW-TEST-B', provenance },
    ] };
    catalog.applyIdentityManifest(manifest);
    const items = database.all('SELECT * FROM catalog_items ORDER BY id');
    const activity = database.all('SELECT * FROM activity_log ORDER BY id');
    catalog.applyIdentityManifest(manifest);
    expect(database.all('SELECT * FROM catalog_items ORDER BY id')).toEqual(items);
    expect(database.all('SELECT * FROM activity_log ORDER BY id')).toEqual(activity);
    expect(database.all('SELECT * FROM catalog_versions ORDER BY id')).toEqual(versions);
    expect(database.all('SELECT * FROM offer_components ORDER BY id')).toEqual(components);
    expect(catalog.getItem(a.id).identityProvenance).toEqual(provenance);
  });

  it('refuse un manifeste ambigu/inconnu complet sans attribuer sa première entrée', () => {
    const a = create(), b = create();
    const assignment = { itemId: a.id, canonicalCode: 'AW-TEST-A', provenance };
    for (const second of [
      { itemId: 'id-inexistant', canonicalCode: 'AW-TEST-B', provenance },
      { itemId: b.id, canonicalCode: 'aw-test-a', provenance },
      { ...assignment, canonicalCode: 'AW-TEST-C' },
    ]) {
      expect(() => catalog.applyIdentityManifest({ schemaVersion: 1, assignments: [assignment, second] })).toThrow();
      expect(catalog.getItem(a.id).canonicalCode).toBeNull();
      expect(catalog.getItem(b.id).canonicalCode).toBeNull();
    }
  });

  it('ne réécrit jamais une ancienne ligne lors du rattachement du code ; fige les nouvelles métadonnées', () => {
    const item = create(); catalog.publishVersion(item.versions[0].id);
    const q = quote(); quotes.addCatalogLine(q.id, item.versions[0].id);
    const historical = database.all('SELECT * FROM quote_lines ORDER BY id');
    catalog.assignCanonicalCode(item.id, 'AW-TEST-PAGE');
    const next = catalog.createVersion(item.id, { priceMode: 'fixed', priceCents: 15000, commercialKind: 'option', unit: 'page', abbyLabel: 'Page supplémentaire', provenance });
    catalog.publishVersion(next.id);
    expect(database.all('SELECT * FROM quote_lines ORDER BY id')).toEqual(historical);
    const newQuote = quote();
    const line = quotes.addCatalogLine(newQuote.id, next.id).lines[0];
    expect(line.snapshot).toMatchObject({ canonicalCode: 'AW-TEST-PAGE', commercialKind: 'option', unit: 'page', provenance, versionId: next.id });
    const frozen = database.all('SELECT * FROM quote_lines ORDER BY id');
    catalog.publishVersion(catalog.createVersion(item.id, { priceMode: 'fixed', priceCents: 20000, unit: 'lot' }).id);
    expect(database.all('SELECT * FROM quote_lines ORDER BY id')).toEqual(frozen);
  });

  it('fige aussi l’identité des composants d’offre sans vendre automatiquement une option', () => {
    const service = catalog.create({ type: 'service', name: 'Option', canonicalCode: 'AW-TEST-OPTION' }, { priceMode: 'fixed', priceCents: 9900, commercialKind: 'option', unit: 'page', provenance });
    catalog.publishVersion(service.versions[0].id);
    const offer = catalog.create({ type: 'offer', name: 'Offre', canonicalCode: 'AW-TEST-OFFRE' }, { priceMode: 'fixed', priceCents: 69900, commercialKind: 'offer' });
    catalog.setOfferComponents(offer.versions[0].id, [{ serviceVersionId: service.versions[0].id, isOptional: true }]);
    catalog.publishVersion(offer.versions[0].id);
    const result = quotes.addCatalogLine(quote().id, offer.versions[0].id);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].snapshot?.offerComponents).toEqual([expect.objectContaining({ canonicalCode: 'AW-TEST-OPTION', unit: 'page', provenance, isOptional: true })]);
  });
});

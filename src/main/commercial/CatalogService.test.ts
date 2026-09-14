import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';

let database: NodeSqliteAdapter;
let catalog: CatalogService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  catalog = new CatalogService(database);
});

afterEach(() => database.close());

describe('CatalogService', () => {
  it('crée un service avec une première version brouillon', () => {
    const service = catalog.create(
      { type: 'service', name: 'Page supplémentaire', category: 'Création de site', visiblePublic: true },
      { priceMode: 'fixed', priceCents: 9900, recommendedPriceCents: 12000, description: 'Une page supplémentaire.' },
    );
    expect(service.name).toBe('Page supplémentaire');
    expect(service.visiblePublic).toBe(true);
    expect(service.currentVersion?.status).toBe('draft');
    expect(service.currentVersion?.priceCents).toBe(9900);
    expect(service.versions).toHaveLength(1);
  });

  it('publie une nouvelle version sans modifier l’ancienne', () => {
    const item = catalog.create(
      { type: 'offer', name: 'Site vitrine', category: 'Création de site' },
      { priceMode: 'starting_from', priceCents: 69900, description: 'Version initiale' },
    );
    const first = item.versions[0];
    catalog.publishVersion(first.id);
    const second = catalog.createVersion(item.id, {
      priceMode: 'starting_from',
      priceCents: 74900,
      description: 'Nouvelle version',
    });
    catalog.publishVersion(second.id);
    const detail = catalog.getItem(item.id);
    expect(detail.currentVersion?.versionNumber).toBe(2);
    expect(detail.currentVersion?.priceCents).toBe(74900);
    expect(detail.versions.find((version) => version.versionNumber === 1)?.priceCents).toBe(69900);
    expect(detail.versions.find((version) => version.versionNumber === 1)?.status).toBe('retired');
  });

  it('archive puis réactive un item sans supprimer ses versions', () => {
    const item = catalog.create(
      { type: 'service', name: 'Audit WordPress' },
      { priceMode: 'fixed', priceCents: 14900 },
    );
    catalog.setStatus(item.id, 'archived');
    expect(catalog.getItem(item.id).status).toBe('archived');
    catalog.setStatus(item.id, 'active');
    const active = catalog.getItem(item.id);
    expect(active.status).toBe('active');
    expect(active.versions).toHaveLength(1);
  });

  it('filtre les offres et services par type et mode tarifaire', () => {
    catalog.create({ type: 'service', name: 'Maintenance mensuelle' }, { priceMode: 'monthly', priceCents: 4900 });
    catalog.create({ type: 'offer', name: 'Landing page' }, { priceMode: 'fixed', priceCents: 49900 });
    const offers = catalog.list({ type: 'offer' });
    expect(offers).toHaveLength(12);
    expect(offers.every(item => item.type === 'offer')).toBe(true);
    const monthly = catalog.list({ priceMode: 'monthly' });
    expect(monthly).toHaveLength(3);
    expect(monthly.every(item => item.currentVersion?.priceMode === 'monthly')).toBe(true);
  });

  it('compose une offre avec des versions publiées de services', () => {
    const page = catalog.create({ type: 'service', name: 'Page supplémentaire' }, { priceMode: 'fixed', priceCents: 9900 });
    const seo = catalog.create({ type: 'service', name: 'Réglage SEO' }, { priceMode: 'fixed', priceCents: 14900 });
    catalog.publishVersion(page.versions[0].id);
    catalog.publishVersion(seo.versions[0].id);
    const offer = catalog.create({ type: 'offer', name: 'Site vitrine' }, { priceMode: 'starting_from', priceCents: 69900 });
    const components = catalog.setOfferComponents(offer.versions[0].id, [
      { serviceVersionId: page.versions[0].id, quantityMilli: 5000 },
      { serviceVersionId: seo.versions[0].id, isOptional: true },
    ]);
    expect(components).toHaveLength(2);
    expect(components[0].serviceName).toBe('Page supplémentaire');
    expect(components[0].quantityMilli).toBe(5000);
    expect(components[1].isOptional).toBe(true);
  });

  it('fige une composition publiée et la recopie vers une nouvelle version brouillon', () => {
    const service = catalog.create({ type: 'service', name: 'Formation' }, { priceMode: 'fixed', priceCents: 9900 });
    catalog.publishVersion(service.versions[0].id);
    const offer = catalog.create({ type: 'offer', name: 'Pack vitrine' }, { priceMode: 'fixed', priceCents: 79900 });
    const firstVersion = offer.versions[0];
    catalog.setOfferComponents(firstVersion.id, [{ serviceVersionId: service.versions[0].id }]);
    catalog.publishVersion(firstVersion.id);
    expect(() => catalog.setOfferComponents(firstVersion.id, [])).toThrow(/figée/);
    const secondVersion = catalog.createVersion(offer.id, { priceMode: 'fixed', priceCents: 84900 });
    const copied = catalog.listOfferComponents(secondVersion.id);
    expect(copied).toHaveLength(1);
    expect(copied[0].serviceName).toBe('Formation');
  });
});

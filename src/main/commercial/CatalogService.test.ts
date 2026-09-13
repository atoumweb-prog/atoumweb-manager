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

    expect(catalog.list({ type: 'offer' })).toHaveLength(1);
    expect(catalog.list({ priceMode: 'monthly' })).toHaveLength(1);
  });
});

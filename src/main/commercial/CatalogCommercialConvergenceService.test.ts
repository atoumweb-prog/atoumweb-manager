import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { CatalogCommercialConvergenceService, type CatalogCommercialConvergenceSource } from './CatalogCommercialConvergenceService';

const root = resolve(__dirname, '../../..');
const source = JSON.parse(readFileSync(resolve(root, 'data/catalogue/atoumweb-commercial-convergence-20261031.json'), 'utf8')) as CatalogCommercialConvergenceSource;
const canonical = JSON.parse(readFileSync(resolve(root, 'data/catalogue/atoumweb-catalogue-v1.json'), 'utf8')) as { records: Array<{ canonicalCode: string; name: string; type: 'offer' | 'service'; category: string; version: Record<string, unknown> }> };

let db: NodeSqliteAdapter;
let catalog: CatalogService;
let service: CatalogCommercialConvergenceService;

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  applyPendingMigrations(db);
  catalog = new CatalogService(db);
  for (const proposal of source.records) {
    const record = canonical.records.find((candidate) => candidate.canonicalCode === proposal.canonicalCode)!;
    const item = catalog.create({ name: record.name, type: record.type, category: record.category, canonicalCode: record.canonicalCode, identityProvenance: (record.version as any).provenance }, record.version as any);
    db.run('UPDATE catalog_versions SET id=? WHERE id=?', [proposal.expectedPublishedVersionId, item.versions[0].id]);
    catalog.publishVersion(proposal.expectedPublishedVersionId);
  }
  service = new CatalogCommercialConvergenceService(db);
});
afterEach(() => db.close());

describe('préparation Catalogue des décisions commerciales validées', () => {
  it('simule sans écriture', () => {
    const before = db.all('SELECT * FROM catalog_versions ORDER BY id');
    expect(service.simulate(source)).toHaveLength(6);
    expect(db.all('SELECT * FROM catalog_versions ORDER BY id')).toEqual(before);
  });
  it('crée six brouillons sans modifier les versions publiées ni leurs prix', () => {
    const publishedBefore = db.all('SELECT id,price_mode,price_cents,status FROM catalog_versions WHERE status=\'published\' ORDER BY id');
    const rows = service.simulate(source);
    expect(rows).toHaveLength(6);
    service.apply(source, rows);

    expect(db.all('SELECT id,price_mode,price_cents,status FROM catalog_versions WHERE status=\'published\' ORDER BY id')).toEqual(publishedBefore);
    expect(db.get<{ n: number }>('SELECT COUNT(*) n FROM catalog_versions WHERE status=\'draft\'')).toEqual({ n: 6 });
    expect(db.get<{ n: number }>("SELECT COUNT(*) n FROM activity_log WHERE action='catalog_commercial_drafts_prepared'")).toEqual({ n: 1 });
    const wp = catalog.getItem(rows.find((row) => row.canonicalCode === 'AW-MAINT-WP-M')!.itemId).versions[0];
    expect(wp).toMatchObject({ status: 'draft', priceCents: 4900, unit: 'mois', periodicity: 'mensuelle' });
    expect(wp.inclusions).toContain('Sauvegarde hebdomadaire conservée 30 jours');
    const woo = catalog.getItem(rows.find((row) => row.canonicalCode === 'AW-MAINT-WC-M')!.itemId).versions[0];
    expect(woo).toMatchObject({ status: 'draft', priceCents: 9900 });
    expect(woo.inclusions).toContain('Sauvegarde quotidienne conservée 30 jours');
    const hosting = catalog.getItem(rows.find((row) => row.canonicalCode === 'AW-TECH-HEBERG-WP')!.itemId).versions[0];
    expect(hosting).toMatchObject({ status: 'draft', priceCents: 14900, unit: 'an' });
    const migration = catalog.getItem(rows.find((row) => row.canonicalCode === 'AW-TECH-MIGRATION-AW')!.itemId).versions[0];
    expect(migration).toMatchObject({ status: 'draft', priceMode: 'quote_only', priceCents: null });
  });

  it('est idempotent et refuse une origine publiée différente', () => {
    const rows = service.simulate(source);
    service.apply(source, rows);
    service.apply(source, rows);
    expect(db.get<{ n: number }>('SELECT COUNT(*) n FROM catalog_versions WHERE status=\'draft\'')).toEqual({ n: 6 });
    expect(db.get<{ n: number }>("SELECT COUNT(*) n FROM activity_log WHERE action='catalog_commercial_drafts_prepared'")).toEqual({ n: 1 });
    db.run("UPDATE catalog_versions SET status='retired' WHERE id=?", [source.records.find((record) => record.canonicalCode === 'AW-MAINT-WP-M')!.expectedPublishedVersionId]);
    expect(() => service.simulate(source)).toThrow(/a changé/);
  });

  it('refuse un plan périmé et annule toute création partielle', () => {
    const rows = service.simulate(source);
    const stale = rows.map((row, index) => index === 0 ? { ...row, nextVersionNumber: 999 } : row);
    expect(() => service.apply(source, stale)).toThrow(/plan Catalogue a changé/);
    expect(db.get<{ n: number }>('SELECT COUNT(*) n FROM catalog_versions WHERE status=\'draft\'')).toEqual({ n: 0 });
  });
});

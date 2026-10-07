import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { CatalogService } from './CatalogService';
import { CatalogImportService, type CatalogImportSource, type CatalogImportManifest } from './CatalogImportService';

const source: CatalogImportSource = JSON.parse(readFileSync('data/catalogue/atoumweb-catalogue-v1.json', 'utf8'));
const manifest: CatalogImportManifest = JSON.parse(readFileSync('data/catalogue/atoumweb-reprise-v1.json', 'utf8'));
let database: NodeSqliteAdapter, importer: CatalogImportService, catalog: CatalogService;
const rows = (table: string) => database.all(`SELECT * FROM ${table} ORDER BY rowid`);
const state = () => ({ items: rows('catalog_items'), versions: rows('catalog_versions'), runs: rows('catalog_import_runs'),
  entries: rows('catalog_import_entries'), activity: rows('activity_log'), blueprints: rows('catalog_project_blueprints'), components: rows('offer_components') });
const rehearse = () => {
  const preview = importer.simulate(source, manifest);
  importer.apply(source, manifest, { expectedPlanSha256: preview.planSha256 });
  return preview;
};
beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys=ON;'); applyPendingMigrations(database);
  // Explicit historical UUID from the read-only audit; never matched by its label.
  database.run(`INSERT INTO catalog_items (id,item_type,name,status,visible_public,created_at,updated_at)
    VALUES (?,'service','Test de recette historique','active',0,?,?)`,
    ['9ad1710a-2b92-4e36-a899-005a00248cb9', '2026-09-14', '2026-09-14']);
  database.run(`INSERT INTO catalog_versions (id,item_id,version_number,status,inclusions_json,exclusions_json,prerequisites_json,price_mode,price_cents,created_at)
    VALUES (?,?,1,'draft','[]','[]','[]','fixed',69900,?)`,
    ['5b02381c-c76a-412d-a790-5e6de8540250', '9ad1710a-2b92-4e36-a899-005a00248cb9', '2026-09-14']);
  importer = new CatalogImportService(database); catalog = new CatalogService(database);
});
afterEach(() => database.close());

describe('Lot 3 — reprise commerciale explicite, simulée et idempotente', () => {
  it('contrôle 112 codes uniques, quatre modes exacts et les tarifs de référence', () => {
    expect(new Set(source.records.map(r => r.canonicalCode)).size).toBe(112);
    expect(source.records.filter(r => r.version.priceMode === 'fixed')).toHaveLength(77);
    expect(source.records.filter(r => r.version.priceMode === 'starting_from')).toHaveLength(16);
    expect(source.records.filter(r => r.version.priceMode === 'quote_only' && r.version.priceBasis !== 'actual_cost')).toHaveLength(18);
    expect(source.records.filter(r => r.version.priceBasis === 'actual_cost')).toHaveLength(1);
    const price = (code: string) => source.records.find(r => r.canonicalCode === code)!.version.priceCents;
    expect(price('AW-TECH-PACK-3H')).toBe(18900); expect(price('AW-TECH-PACK-5H')).toBe(29900);
    expect(price('AW-TECH-PACK-10H')).toBe(54900); expect(price('AW-WEB-PAGE-SUP')).toBe(7900);
    expect(price('AW-WEB-BLOG')).toBe(14900); expect(price('AW-SEO-LOCAL')).toBe(24900);
    expect(price('AW-MAINT-WP-A')).toBe(53900); expect(price('AW-MAINT-WC-A')).toBe(108900);
    expect(price('AW-TECH-HEBERG-WP')).toBe(9900);
  });

  it('simule sans écriture, couvre 112 cibles sans rapprochement des huit anciennes ambiguïtés', () => {
    const before = state(); const plan = importer.simulate(source, manifest);
    expect(state()).toEqual(before);
    expect(plan.counts).toEqual({ create: 91, update: 21, keep: 9, archive: 15, verify: 0 });
    expect(plan.pendingMappings).toBe(0); expect(plan.blockedCanonicalCodes).toEqual([]);
    expect(plan.anomalies).toEqual([]); expect(manifest.entries).toHaveLength(45);
    expect(plan.rows.find(r => r.key === 'AW-WEB-VITRINE')).toMatchObject({ action: 'update', itemId: 'atoumweb-vitrine', oldVersionId: 'atoumweb-vitrine-v1', newVersionNumber: 2 });
    expect(plan.rows.filter(r => r.canonicalCode)).toHaveLength(112);
    expect(plan.rows.filter(r => r.pending)).toEqual([]);
    expect(state()).toEqual(before);
  });

  it('continue de refuser une ambiguïté non décidée dans un autre manifeste', () => {
    const unresolved = structuredClone(manifest), entry = unresolved.entries.find(e => e.itemId === 'atoumweb-applications')!;
    delete entry.decision; entry.action = 'verify'; entry.blockedCodes = ['AW-APP-DEV'];
    const before = state(), preview = importer.simulate(source, unresolved);
    expect(preview.pendingMappings).toBe(1); expect(preview.blockedCanonicalCodes).toEqual(['AW-APP-DEV']);
    expect(() => importer.apply(source, unresolved, { expectedPlanSha256: preview.planSha256 })).toThrow(/décision métier/);
    expect(state()).toEqual(before);
  });

  it('archive les huit anciens objets sans code AW ni nouvelle version et crée huit identités V1 distinctes', () => {
    const legacy = manifest.entries.filter(e => e.decision === 'distinct_v1_archive_legacy');
    expect(legacy).toHaveLength(8);
    const oldItems = legacy.map(e => database.get('SELECT * FROM catalog_items WHERE id=?', [e.itemId])!);
    const oldVersions = legacy.map(e => catalog.getItem(e.itemId).versions);
    const mapped = new Set(manifest.entries.map(e => e.canonicalCode).filter(Boolean));
    const distinctCodes = [...new Set(legacy.flatMap(e => e.formerCandidates ?? []))].filter(c => !mapped.has(c));
    expect(distinctCodes).toHaveLength(8);
    rehearse();
    legacy.forEach((entry, i) => {
      const after = database.get('SELECT * FROM catalog_items WHERE id=?', [entry.itemId])!;
      const { status: _status, archived_at: _archived, updated_at: _updated, ...historical } = oldItems[i];
      expect(after).toMatchObject({ ...historical, status: 'archived', canonical_code: null });
      expect(catalog.getItem(entry.itemId).versions).toEqual(oldVersions[i]);
      expect(catalog.list({ status: 'active' }).map(item => item.id)).not.toContain(entry.itemId);
    });
    for (const code of distinctCodes) {
      const item = database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=?', [code])!;
      expect(item).toBeDefined(); expect(legacy.map(e => e.itemId)).not.toContain(item.id);
      expect(catalog.getItem(item.id).versions).toHaveLength(1);
      expect(catalog.getItem(item.id).versions[0]).toMatchObject({ versionNumber: 1, status: 'draft' });
    }
    catalog.setStatus('atoumweb-page', 'active');
    expect(catalog.getItem('atoumweb-page').versions).toEqual(oldVersions[legacy.findIndex(e => e.itemId === 'atoumweb-page')]);
  });

  it('refuse un code dupliqué, un mapping ambigu et un ancien UUID absent sans rapprochement de secours', () => {
    const duplicate = structuredClone(source); duplicate.records[1].canonicalCode = duplicate.records[0].canonicalCode;
    expect(() => importer.simulate(duplicate, manifest)).toThrow(/dupliqué/);
    const ambiguous = structuredClone(manifest); ambiguous.entries.push(ambiguous.entries[0]);
    expect(() => importer.simulate(source, ambiguous)).toThrow(/ambigu/);
    const missing = structuredClone(manifest); missing.entries[0].itemId = 'ancien-id-inexistant';
    const plan = importer.simulate(source, missing); expect(plan.anomalies.join()).toMatch(/Ancien ID absent/);
    const before = state();
    expect(() => importer.apply(source, missing, { expectedPlanSha256: plan.planSha256, allowPartial: true })).toThrow(/Import refusé/);
    expect(state()).toEqual(before);
  });

  it('crée des brouillons, reprend les UUID et conserve toutes les anciennes versions/compositions/blueprints', () => {
    const before = state(); rehearse();
    expect(rows('catalog_items')).toHaveLength(136); expect(rows('catalog_versions')).toHaveLength(157);
    for (const old of before.versions) expect(database.get('SELECT * FROM catalog_versions WHERE id=?', [String(old.id)])).toEqual(old);
    for (const old of before.components) expect(database.get('SELECT * FROM offer_components WHERE id=?', [String(old.id)])).toEqual(old);
    for (const old of before.blueprints) expect(database.get('SELECT * FROM catalog_project_blueprints WHERE id=?', [String(old.id)])).toEqual(old);
    expect(database.get("SELECT COUNT(*) n FROM catalog_items WHERE canonical_code IS NOT NULL")).toEqual({ n: 112 });
    expect(database.get("SELECT COUNT(*) n FROM catalog_versions WHERE status='published'")).toEqual({ n: 44 });
    expect(database.get("SELECT COUNT(*) n FROM catalog_versions WHERE status='draft'")).toEqual({ n: 113 });
    expect(catalog.getItem('atoumweb-vitrine').versions[0]).toMatchObject({ versionNumber: 2, status: 'draft', priceCents: 69900, commercialKind: 'offer' });
    expect(database.get('SELECT COUNT(*) n FROM catalog_import_entries')).toEqual({ n: 127 });
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('ne change aucun snapshot des trois devis historiques, projets ou tables contractuelles', () => {
    const crm = new CrmService(database); const org = crm.createOrganization({ name: 'Client historique' });
    const prospect = crm.createProspect({ organizationId: org.id }); const quotes = new QuoteService(database, crm);
    for (let i = 1; i <= 3; i++) {
      const q = quotes.create({ prospectId: prospect.id, subject: `Historique ${i}` });
      quotes.addCatalogLine(q.id, 'atoumweb-vitrine-v1');
      database.run('UPDATE quotes SET quote_number=?,status=?,finalized_at=? WHERE id=?', [`DEV-2026-00${i}`, i === 2 ? 'sent' : 'accepted', '2026-09-14', q.id]);
    }
    database.run("INSERT INTO projects (id,project_number,name,project_type,commercial_mode,created_at,updated_at) VALUES ('p1','PRO-2026-001','Ancien projet','internal','internal','2026-09-14','2026-09-14')");
    const tables = ['quotes','quote_lines','projects','project_services', ...database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%clause%' ORDER BY name").map(r => r.name)];
    const before = tables.map(table => rows(table)); rehearse();
    tables.forEach((table, i) => expect(rows(table), table).toEqual(before[i]));
  });

  it('recopie les compositions et liens blueprint de chaque nouvelle version sans toucher aux anciens', () => {
    const blueprint = database.all('SELECT template_version_id,role,sort_order FROM catalog_project_blueprints WHERE catalog_version_id=?', ['atoumweb-vitrine-v1']);
    const components = database.all('SELECT service_version_id,is_optional,quantity_milli,sort_order FROM offer_components WHERE offer_version_id=?', ['atoumweb-vitrine-v1']);
    expect(blueprint.length).toBeGreaterThan(0); expect(components.length).toBeGreaterThan(0);
    rehearse(); const next = catalog.getItem('atoumweb-vitrine').versions[0];
    expect(database.all('SELECT template_version_id,role,sort_order FROM catalog_project_blueprints WHERE catalog_version_id=?', [next.id])).toEqual(blueprint);
    expect(database.all('SELECT service_version_id,is_optional,quantity_milli,sort_order FROM offer_components WHERE offer_version_id=?', [next.id])).toEqual(components);
    const later = catalog.createVersion('atoumweb-vitrine', { priceMode: 'fixed', priceCents: 69900 });
    expect(database.all('SELECT template_version_id,role,sort_order FROM catalog_project_blueprints WHERE catalog_version_id=?', [later.id])).toEqual(blueprint);
    expect(later.commercialParameters).toEqual(next.commercialParameters);
  });

  it('conserve modes, unités, périodicités et paramètres commerciaux sans transformer un coût tiers en prix fixe', () => {
    const plan = rehearse();
    for (const record of source.records.filter(r => !plan.blockedCanonicalCodes.includes(r.canonicalCode))) {
      const id = database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=?', [record.canonicalCode])!.id;
      const stored = catalog.getItem(id).versions[0];
      expect(stored, record.canonicalCode).toMatchObject(record.version);
    }
    expect(source.records.find(r => r.canonicalCode === 'AW-TECH-HEBERG-WP')!.version).toMatchObject({ unit: 'an', periodicity: 'annuelle', priceMode: 'fixed', priceCents: 9900 });
    const actual = source.records.find(r => r.version.priceBasis === 'actual_cost')!;
    expect(actual.version).toMatchObject({ priceMode: 'quote_only', priceCents: null, priceBasis: 'actual_cost' });
  });

  it('rejoue sans doublon, nouvelle version ou activité supplémentaire', () => {
    rehearse(); const before = state(); const second = importer.simulate(source, manifest);
    expect(second.counts).toEqual({ create: 0, update: 0, keep: 136, archive: 0, verify: 0 }); expect(second.anomalies).toEqual([]);
    importer.apply(source, manifest, { expectedPlanSha256: second.planSha256 });
    expect(state()).toEqual(before);
  });

  it('archive réversiblement et respecte une réactivation humaine', () => {
    rehearse(); const item = catalog.getItem('atoumweb-pack20'); expect(item.status).toBe('archived');
    expect(catalog.list({ status: 'active' }).map(r => r.id)).not.toContain(item.id);
    catalog.setStatus(item.id, 'active'); const before = state(); const plan = importer.simulate(source, manifest);
    expect(plan.anomalies.join()).toMatch(/réactivée manuellement/);
    expect(() => importer.apply(source, manifest, { expectedPlanSha256: plan.planSha256, allowPartial: true })).toThrow(/Import refusé/);
    expect(state()).toEqual(before); expect(catalog.getItem(item.id).versions).toEqual(item.versions);
  });

  it('refuse une simulation périmée et une version importée modifiée manuellement', () => {
    const plan = importer.simulate(source, manifest); catalog.create({ type: 'service', name: 'Autre entrée' }, { priceMode: 'free' });
    const before = state(); expect(() => importer.apply(source, manifest, { expectedPlanSha256: plan.planSha256, allowPartial: true })).toThrow(/simulation a changé/); expect(state()).toEqual(before);
    rehearse(); const v = catalog.getItem('atoumweb-vitrine').versions[0];
    database.run('UPDATE catalog_versions SET description=? WHERE id=?', ['Correction humaine', v.id]);
    expect(importer.simulate(source, manifest).anomalies.join()).toMatch(/modifiée depuis/);
  });

  it('annule tout le lot en cas d’échec tardif, y compris codes, archives et journaux', () => {
    database.exec(`CREATE TRIGGER fixture_abort BEFORE INSERT ON catalog_versions
      WHEN NEW.item_id='atoumweb-pack10' AND NEW.version_number=2 BEGIN SELECT RAISE(ABORT,'fixture failure'); END;`);
    const before = state(); expect(() => rehearse()).toThrow(/fixture failure/); expect(state()).toEqual(before);
  });
});

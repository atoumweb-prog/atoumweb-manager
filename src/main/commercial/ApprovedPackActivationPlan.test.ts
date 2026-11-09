import {describe, it, expect} from 'vitest';
import {mkdtempSync, rmSync} from 'node:fs';
import path from 'node:path';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {APPROVED_PACK, approvedCatalogSource} from './ApprovedPackSource';
import {applyApprovedPackIdentityTemp, planApprovedPackIdentity} from './ApprovedPackActivationPlan';
import {APPROVED_FAMILY_LABELS, approvedFamilyLabel} from '../../shared/approvedFamilies';

function imported() {
  const db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const s = new ApprovedPackService(db); s.apply(s.simulate().planSha256); return db;
}
const untouched = (db: NodeSqliteAdapter) => ({
  versions: db.all('SELECT * FROM catalog_versions ORDER BY id'),
  quoteLines: db.all('SELECT * FROM quote_lines ORDER BY id'),
  clauses: db.all('SELECT * FROM contract_clause_versions ORDER BY id'),
  codes: db.all('SELECT id,canonical_code,identity_provenance_json FROM catalog_items ORDER BY id'),
});

describe('Décisions du 09/11/2026 — lecture des prix et familles à l’import', () => {
  it('reads « À vérifier — ancienne offre 499 € » as quote only and keeps every amount-led label priced', () => {
    const records = approvedCatalogSource().records;
    const brand = records.find(r => r.canonicalCode === 'AW-BRAND-IDENTITE')!;
    expect(brand.version.priceMode).toBe('quote_only');
    expect(brand.version.priceCents).toBeNull();
    expect(brand.version.commercialParameters?.sourcePriceLabel).toBe('À vérifier — ancienne offre 499 €');
    for (const r of records) {
      const label = String(r.version.commercialParameters?.sourcePriceLabel);
      if (/^(Dès\s+)?\d/.test(label)) expect(r.version.priceCents, r.canonicalCode).not.toBeNull();
    }
    const detour = records.find(r => r.canonicalCode === 'AW-PHOTO-DETOUR')!;
    expect([detour.version.priceMode, detour.version.priceCents, detour.version.unit]).toEqual(['fixed', 900, 'photo']);
  });

  it('gives every reference the single validated label of its family', () => {
    const records = approvedCatalogSource().records;
    for (const r of records) expect(r.category).toBe(approvedFamilyLabel(r.version.familyCode!));
    expect(new Set(records.map(r => r.category)).size).toBe(Object.keys(APPROVED_FAMILY_LABELS).length);
    expect(() => approvedFamilyLabel('INCONNUE')).toThrow('sans libellé validé');
  });
});

describe('Plan d’activation V3.9.4 — renommage et familles (TEMP)', {timeout: 20000}, () => {
  it('previews 13 renames and 18 categories, applies them once, and leaves versions, quotes and clauses intact', () => {
    const db = imported();
    try {
      const plan = planApprovedPackIdentity(db);
      expect(plan.blockers).toEqual([]);
      expect(plan.renames).toBe(13);
      expect(plan.categoriesToCreate).toHaveLength(18);
      expect(plan.changes.find(c => c.sourceCode === 'AW-MAINT-WP-M')).toMatchObject({currentName: 'Gestion WordPress', targetName: 'Maintenance WordPress mensuelle', targetCategory: 'Maintenance'});
      const before = untouched(db), activity = db.all('SELECT * FROM activity_log').length;
      const done = applyApprovedPackIdentityTemp(db, plan.planSha256);
      expect(done).toMatchObject({applied: true, renames: 13, categoriesCreated: 18});
      expect(untouched(db)).toEqual(before);
      expect(db.all('SELECT * FROM activity_log').length).toBe(activity + 13);
      const names = new Map(approvedCatalogSource().records.map(r => [r.canonicalCode, r.name]));
      const rows = db.all<{code: string; name: string; category: string; category_id: string | null; registry: string | null}>(
        `SELECT json_extract(v.provenance_json,'$.recordKey') AS code, i.name, i.category, i.category_id, c.name AS registry
           FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id LEFT JOIN catalog_categories c ON c.id=i.category_id
          WHERE json_extract(v.provenance_json,'$.sha256')=?`, [APPROVED_PACK.catalogue.sha256_word]);
      expect(rows).toHaveLength(130);
      for (const row of rows) { expect(row.name).toBe(names.get(row.code)); expect(row.registry).toBe(row.category); }
      expect(new Set(rows.map(r => r.category)).size).toBe(18);
      const replay = planApprovedPackIdentity(db);
      expect([replay.changes, replay.categoriesToCreate, replay.blockers]).toEqual([[], [], []]);
      expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    } finally { db.close(); }
  });

  it('refuses a stale plan and a manual change made after preview, without partial writes', () => {
    const db = imported();
    try {
      const plan = planApprovedPackIdentity(db);
      const target = plan.changes.find(c => c.currentName !== c.targetName)!;
      db.run('UPDATE catalog_items SET name=? WHERE id=?', ['TEST nom saisi à la main', target.itemId]);
      const items = db.all('SELECT * FROM catalog_items ORDER BY id'), categories = db.all('SELECT * FROM catalog_categories');
      expect(() => applyApprovedPackIdentityTemp(db, plan.planSha256)).toThrow('périmé');
      expect(() => applyApprovedPackIdentityTemp(db, 'f'.repeat(64))).toThrow('périmé');
      expect(db.all('SELECT * FROM catalog_items ORDER BY id')).toEqual(items);
      expect(db.all('SELECT * FROM catalog_categories')).toEqual(categories);
    } finally { db.close(); }
  });

  it('blocks when the pack is not imported and refuses a database outside the TEMP directory', () => {
    const empty = new NodeSqliteAdapter(':memory:'); applyPendingMigrations(empty);
    try { expect(planApprovedPackIdentity(empty).blockers).toHaveLength(130); } finally { empty.close(); }
    const dir = mkdtempSync(path.join(process.cwd(), '.tmp-activation-guard-'));
    const file = new NodeSqliteAdapter(path.join(dir, 'outside-temp.sqlite'));
    try { expect(() => applyApprovedPackIdentityTemp(file, 'x')).toThrow('base TEMP isolée'); }
    finally { file.close(); rmSync(dir, {recursive: true, force: true}); }
  });
});

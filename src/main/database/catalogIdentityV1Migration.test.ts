import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from '../commercial/QuoteService';

describe('migration 53 — identité catalogue additive', () => {
  it('préserve chaque colonne historique, trois devis, deux projets et les compositions ; reprise sans effet', () => {
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys=ON;');
    try {
      for (const migration of getPendingMigrations(database).filter(({ id }) => id <= 52)) {
        if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys=OFF;');
        database.exec(migration.sql);
        database.run('INSERT INTO schema_migrations VALUES (?,?,?)', [migration.id, migration.name, '2026-10-03']);
        if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys=ON;');
      }
      const crm = new CrmService(database);
      const organization = crm.createOrganization({ name: 'Dossier historique témoin' });
      const prospect = crm.createProspect({ organizationId: organization.id });
      // Build an actual schema-52 fixture, without invoking a service requiring the current schema.
      for (let i = 1; i <= 3; i++) {
        database.run('INSERT INTO quotes(id,quote_number,prospect_id,subject,status,finalized_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
          [`legacy${i}`,`DEV-2026-00${i}`,prospect.id,`Historique ${i}`,i===2?'sent':'accepted','2026-09-14','2026-09-14','2026-09-14']);
        database.run("INSERT INTO quote_lines(id,quote_id,source,label,proposed_unit_price_cents,snapshot_json,created_at,updated_at) VALUES(?,?,'custom',?,?,?,?,?)",
          [`line${i}`,`legacy${i}`,'Ancienne ligne',10000,'{"itemName":"Ancienne ligne","versionNumber":1,"specialTerms":"Ancien texte exact"}','2026-09-14','2026-09-14']);
      }
      for (let i = 1; i <= 2; i++) database.run(
        "INSERT INTO projects (id,project_number,name,project_type,commercial_mode,created_at,updated_at) VALUES (?,?,?,'internal','internal',?,?)",
        [`p${i}`, `PRO-2026-00${i}`, `Projet historique ${i}`, '2026-09-14', '2026-09-14']);

      // Compare all existing tables/columns, not just the catalogue or fixture counts.
      const tables = database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'schema_migrations' ORDER BY name");
      const before = tables.map(({ name }) => ({ name,
        columns: database.all<{ name: string }>(`PRAGMA table_info("${name}")`).map(({ name: column }) => column),
        rows: database.all(`SELECT * FROM "${name}" ORDER BY rowid`),
      }));
      expect(applyPendingMigrations(database).map(({ id }) => id)).toEqual([53, 54, 55, 56, 57]);
      for (const { name, columns, rows } of before) {
        expect(database.all(`SELECT ${columns.map(column => `"${column}"`).join(',')} FROM "${name}" ORDER BY rowid`), name).toEqual(rows);
      }
      expect(database.get('SELECT COUNT(*) AS n FROM catalog_items WHERE canonical_code IS NOT NULL')).toEqual({ n: 0 });
      expect(database.get("SELECT COUNT(*) AS n FROM catalog_versions WHERE commercial_kind IS NOT NULL OR price_basis<>'listed'")).toEqual({ n: 0 });
      expect(applyPendingMigrations(database)).toEqual([]);
      expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
      expect(database.get('PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
    } finally { database.close(); }
  });

  it('protège aussi au niveau SQL les codes durables et les coûts tiers non tarifés', () => {
    const database = new NodeSqliteAdapter(':memory:');
    try {
      applyPendingMigrations(database);
      database.run('UPDATE catalog_items SET canonical_code=? WHERE id=?', ['AW-WEB-VITRINE', 'atoumweb-vitrine']);
      expect(() => database.run('UPDATE catalog_items SET canonical_code=? WHERE id=?', ['AW-WEB-VITRINE', 'atoumweb-ecommerce'])).toThrow(/UNIQUE/);
      expect(() => database.run('UPDATE catalog_items SET canonical_code=NULL WHERE id=?', ['atoumweb-vitrine'])).toThrow(/immuable/);
      expect(() => database.run('UPDATE catalog_items SET canonical_code=? WHERE id=?', ['AW-AUTRE', 'atoumweb-vitrine'])).toThrow(/immuable/);
      expect(() => database.run('UPDATE catalog_items SET canonical_code=? WHERE id=?', ['PAS-AW', 'atoumweb-ecommerce'])).toThrow(/CHECK/);
      expect(() => database.run("UPDATE catalog_versions SET price_basis='actual_cost' WHERE id=?", ['atoumweb-vitrine-v1'])).toThrow(/coût tiers réel/);
      database.run("UPDATE catalog_versions SET price_basis='actual_cost',price_mode='quote_only',price_cents=NULL WHERE id=?", ['atoumweb-vitrine-v1']);
      expect(() => database.run('UPDATE catalog_versions SET price_cents=1 WHERE id=?', ['atoumweb-vitrine-v1'])).toThrow(/coût tiers réel/);
    } finally { database.close(); }
  });
});

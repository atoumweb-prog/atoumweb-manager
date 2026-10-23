import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations, MIGRATIONS } from './migrations';

/**
 * 04F — Safety gate for stacked lot integrations.
 * A duplicate migration ID can silently skip a distinct schema change because
 * schema_migrations is keyed by ID. Verify the final registry, not just MAX(id).
 */
describe('04F — migration registry convergence guard', () => {
  it('keeps every migration ID and name unique, in strictly ascending order', () => {
    const ids = MIGRATIONS.map(migration => migration.id);
    const names = MIGRATIONS.map(migration => migration.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(ids.every((id, index) => Number.isSafeInteger(id) && id > 0 &&
      (index === 0 || id > ids[index - 1]))).toBe(true);
  });

  it('upgrades a populated schema 66 fixture to 71 without losing legacy settings or foreign-key integrity', () => {
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    try {
      // Reconstruct only the known main baseline. Never modify a persistent
      // database or synthesize migration history for an existing user database.
      const baseline = getPendingMigrations(database).filter(migration => migration.id <= 66);
      expect(baseline.length).toBe(66);
      for (const migration of baseline) {
        database.exec(migration.sql);
        database.run(
          'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
          [migration.id, migration.name, '2026-10-14T00:00:00.000Z'],
        );
      }
      database.run('INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)', [
        'lot04-migration-sentinel', '"keep-me"', '2026-10-14T00:00:00.000Z',
      ]);
      const before = database.get('SELECT value_json FROM settings WHERE key=?', [
        'lot04-migration-sentinel',
      ]);
      expect(getPendingMigrations(database).map(migration => migration.id)).toEqual([67, 68, 69, 70, 71, 72, 73, 74]);
      expect(applyPendingMigrations(database).map(migration => migration.id)).toEqual([67, 68, 69, 70, 71, 72, 73, 74]);
      expect(database.get('SELECT value_json FROM settings WHERE key=?', [
        'lot04-migration-sentinel',
      ])).toEqual(before);
      expect(database.all('SELECT id, name FROM schema_migrations WHERE id >= 67 ORDER BY id'))
        .toEqual([
          { id: 67, name: 'catalog_category_registry_v1' },
          { id: 68, name: 'catalog_version_recommendations_v1' },
          { id: 69, name: 'contract_clause_section_review_v1' },
          { id: 70, name: 'catalog_recommendation_details_v1' },
          { id: 71, name: 'quote_contract_transmission_v1' },
          {id:72,name:'crm_single_source_reconciliation'}, {id:73,name:'crm_initial_request_and_legacy_brief'}, {id:74,name:'crm_organization_contact_links'},
        ]);
      expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
      expect(applyPendingMigrations(database)).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('keeps catalogue categories before version recommendations with stable identities', () => {
    const categories = MIGRATIONS.find(migration => migration.name === 'catalog_category_registry_v1');
    const recommendations = MIGRATIONS.find(migration => migration.name === 'catalog_version_recommendations_v1');
    expect(categories?.id).toBe(67);
    expect(recommendations?.id).toBe(68);
    expect(categories!.id).toBeLessThan(recommendations!.id);
    expect(categories!.sql).toContain('CREATE TABLE catalog_categories');
    expect(recommendations!.sql).toContain('CREATE TABLE catalog_version_recommendations');
  });
});

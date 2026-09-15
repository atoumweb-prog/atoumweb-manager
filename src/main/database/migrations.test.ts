import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations, MIGRATIONS } from './migrations';

describe('migrations SQLite', () => {
  it.each([4, 6, 10, 17])('met à niveau une base à %i migrations sans perdre les données existantes', (version) => {
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    try {
      for (const migration of getPendingMigrations(database).filter((item) => item.id <= version)) {
        database.exec(migration.sql);
        database.run('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
          [migration.id, migration.name, '2026-09-14T08:00:00.000Z']);
      }
      database.run('INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)',
        ['migration-sentinel', '"preserved"', '2026-09-14T08:00:00.000Z']);
      if (version === 10) {
        database.exec(`
          INSERT INTO time_sessions (id, category, started_at, ended_at, created_at, updated_at)
          VALUES ('phase3-session', 'support', '2026-09-14T08:00:00.000Z', '2026-09-14T09:15:00.000Z',
            '2026-09-14T08:00:00.000Z', '2026-09-14T09:15:00.000Z');
        `);
      }
      const sessionsBefore = version === 10 ? database.all('SELECT * FROM time_sessions') : [];
      expect(applyPendingMigrations(database).map((migration) => migration.id))
        .toEqual(Array.from({ length: MIGRATIONS.length - version }, (_, index) => version + index + 1));
      expect(database.all('SELECT id, name FROM schema_migrations ORDER BY id'))
        .toEqual(MIGRATIONS.map(({ id, name }) => ({ id, name })));
      expect(database.get('SELECT value_json FROM settings WHERE key=?', ['migration-sentinel']))
        .toEqual({ value_json: '"preserved"' });
      if (version === 10) expect(database.all('SELECT * FROM time_sessions')).toEqual(sessionsBefore);
      expect(database.all("SELECT name FROM pragma_table_info('time_sessions') WHERE name='intervention_id'"))
        .toEqual([{ name: 'intervention_id' }]);
      expect(database.all("SELECT name, desc FROM pragma_index_xinfo('idx_time_sessions_intervention') WHERE key=1 ORDER BY seqno"))
        .toEqual([{ name: 'intervention_id', desc: 0 }, { name: 'started_at', desc: 1 }]);
      const schemaBefore = database.all('SELECT type, name, sql FROM sqlite_master ORDER BY type, name');
      const ledgerBefore = database.all('SELECT * FROM schema_migrations ORDER BY id');
      expect(applyPendingMigrations(database)).toEqual([]);
      expect(database.all('SELECT type, name, sql FROM sqlite_master ORDER BY type, name')).toEqual(schemaBefore);
      expect(database.all('SELECT * FROM schema_migrations ORDER BY id')).toEqual(ledgerBefore);
      expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
      expect(database.get('PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
    } finally {
      database.close();
    }
  });

  it('applique chaque migration une seule fois', () => {
    const database = new NodeSqliteAdapter(':memory:');

    expect(getPendingMigrations(database)).toHaveLength(MIGRATIONS.length);
    expect(applyPendingMigrations(database).map((migration) => migration.id)).toEqual(MIGRATIONS.map((migration) => migration.id));
    expect(getPendingMigrations(database)).toHaveLength(0);
    expect(applyPendingMigrations(database)).toHaveLength(0);

    for (const table of [
      'settings', 'organizations', 'contacts', 'client_accounts', 'prospects', 'activity_events', 'search_documents', 'crm_actions',
      'catalog_items', 'catalog_versions', 'offer_components', 'number_sequences', 'quotes', 'quote_lines',
      'project_templates', 'project_template_versions', 'project_template_nodes', 'projects', 'project_nodes', 'project_services', 'project_prerequisites',
      'file_assets', 'file_asset_links', 'technical_items', 'technical_item_versions', 'technical_item_assets', 'time_sessions', 'time_session_pauses',
      'service_requests', 'interventions', 'maintenance_checklist_templates', 'maintenance_checklist_template_items', 'maintenance_plans',
      'maintenance_subscriptions', 'maintenance_periods', 'maintenance_checks', 'hour_packs', 'hour_pack_movements', 'billing_items',
      'maintenance_overage_decisions', 'maintenance_report_drafts', 'hour_pack_shortfall_decisions',
      'crm_needs', 'demo_batches', 'demo_records', 'demo_context', 'contact_methods', 'client_documents',
    ]) {
      const row = database.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [table]);
      expect(row?.name).toBe(table);
    }

    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('quotes') WHERE name='project_id'")?.name).toBe('project_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('time_sessions') WHERE name='intervention_id'")?.name).toBe('intervention_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('maintenance_subscriptions') WHERE name='carryover_mode_snapshot'")?.name).toBe('carryover_mode_snapshot');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('catalog_versions') WHERE name='special_terms'")?.name).toBe('special_terms');

    const seededPlans = database.all<{ name: string }>('SELECT name FROM maintenance_plans ORDER BY periodic_price_cents');
    expect(seededPlans.map((plan) => plan.name)).toEqual(['Maintenance 49 €/mois', 'Maintenance 99 €/mois']);

    database.close();
  });
});

import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations, MIGRATIONS } from './migrations';

describe('migrations SQLite', () => {
  it.each([4, 6, 10, 17, 21])('met à niveau une base à %i migrations sans perdre les données existantes', (version) => {
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
      expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('prospects') WHERE name='origin_type'")?.name).toBe('origin_type');
      expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('prospects') WHERE name='decision_maker_contact_id'")?.name).toBe('decision_maker_contact_id');
      expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('crm_actions') WHERE name='target_contact_id'")?.name).toBe('target_contact_id');
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

  it('répare une base déjà marquée en migration 36 sans bridge_snapshot_sections', () => {
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    try {
      for (const migration of getPendingMigrations(database).filter((item) => item.id <= 36)) {
        database.exec(migration.sql);
        database.run('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
          [migration.id, migration.name, '2026-09-24T00:00:00.000Z']);
      }

      database.exec('DROP TABLE bridge_snapshot_sections;');
      expect(database.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='bridge_snapshot_sections'",
      )).toBeUndefined();

      expect(applyPendingMigrations(database).map((migration) => migration.id)).toEqual([37, 38, 39, 40]);
      expect(database.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='bridge_snapshot_sections'",
      )?.name).toBe('bridge_snapshot_sections');
      expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('migration 38 conserve la Bibliothèque existante et ouvre les métiers / Code snippets', () => {
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    try {
      for (const migration of getPendingMigrations(database).filter((item) => item.id <= 37)) {
        if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys = OFF;');
        database.exec('BEGIN IMMEDIATE;');
        try {
          database.exec(migration.sql);
          database.run('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
            [migration.id, migration.name, '2026-09-25T00:00:00.000Z']);
          database.exec('COMMIT;');
          if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys = ON;');
        } catch (error) {
          database.exec('ROLLBACK;');
          if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys = ON;');
          throw error;
        }
      }

      database.run(
        `INSERT INTO technical_items
         (id,project_id,scope,category,name,description,tags_json,reuse_status,origin_technical_item_id,library_category,created_at,updated_at,archived_at)
         VALUES ('legacy-library-item',NULL,'atoumweb','section','Section historique','Conserver','["mariage"]','ready',NULL,'section',
           '2026-09-24T10:00:00.000Z','2026-09-24T10:00:00.000Z',NULL)`,
      );

      expect(applyPendingMigrations(database).map((migration) => migration.id)).toEqual([38, 39, 40]);

      expect(database.get<{ name: string; library_category: string; vertical: string | null }>(
        "SELECT name, library_category, vertical FROM technical_items WHERE id='legacy-library-item'",
      )).toEqual({
        name: 'Section historique',
        library_category: 'section',
        vertical: null,
      });

      database.run(
        `INSERT INTO technical_items
         (id,project_id,scope,category,name,description,tags_json,reuse_status,origin_technical_item_id,library_category,vertical,created_at,updated_at,archived_at)
         VALUES ('snippet-after-v38',NULL,'atoumweb','other','Snippet JS',NULL,'[]','ready',NULL,'code_snippet','fleuriste',
           '2026-09-25T10:00:00.000Z','2026-09-25T10:00:00.000Z',NULL)`,
      );
      expect(database.get<{ library_category: string; vertical: string }>(
        "SELECT library_category, vertical FROM technical_items WHERE id='snippet-after-v38'",
      )).toEqual({ library_category: 'code_snippet', vertical: 'fleuriste' });
      expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
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
      'atoumweb_technical_assets', 'backup_records', 'backup_locations', 'backup_policies', 'backup_intervention_links',
      'catalog_project_blueprints', 'project_node_sources', 'project_node_secrets', 'expenses', 'crm_identity_assets',
      'bridge_sites', 'bridge_snapshots', 'bridge_pages', 'bridge_page_snapshots', 'bridge_nodes', 'bridge_sources',
      'bridge_assets', 'bridge_dependencies', 'bridge_relations', 'bridge_snapshot_sections', 'bridge_objects', 'bridge_occurrence_returns',
      'atoumweb_component_families', 'atoumweb_component_variants',
    ]) {
      const row = database.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [table]);
      expect(row?.name).toBe(table);
    }

    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('quotes') WHERE name='project_id'")?.name).toBe('project_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('time_sessions') WHERE name='intervention_id'")?.name).toBe('intervention_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('maintenance_subscriptions') WHERE name='carryover_mode_snapshot'")?.name).toBe('carryover_mode_snapshot');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('catalog_versions') WHERE name='special_terms'")?.name).toBe('special_terms');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('prospects') WHERE name='origin_type'")?.name).toBe('origin_type');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('prospects') WHERE name='decision_maker_contact_id'")?.name).toBe('decision_maker_contact_id');
    for (const column of ['target_contact_id', 'reason_code', 'reason_text']) {
      expect(database.get<{ name: string }>(`SELECT name FROM pragma_table_info('crm_actions') WHERE name='${column}'`)?.name).toBe(column);
    }
    for (const column of ['reuse_status', 'origin_technical_item_id', 'library_category', 'vertical']) {
      expect(database.get<{ name: string }>(`SELECT name FROM pragma_table_info('technical_items') WHERE name='${column}'`)?.name).toBe(column);
    }
    expect(MIGRATIONS.at(-1)?.id).toBe(40);
    expect(() => database.run(
      `INSERT INTO technical_items (id,project_id,scope,category,library_category,name,description,tags_json,reuse_status,origin_technical_item_id,vertical,created_at,updated_at,archived_at)
       VALUES ('snippet-test',NULL,'atoumweb','other','code_snippet','Snippet test',NULL,'[]','ready',NULL,'fleuriste','2026-09-25T00:00:00.000Z','2026-09-25T00:00:00.000Z',NULL)`,
    )).not.toThrow();
    expect(database.get<{ vertical: string }>("SELECT vertical FROM technical_items WHERE id='snippet-test'")?.vertical).toBe('fleuriste');

    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('expenses') WHERE name='project_id'")?.name).toBe('project_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('expenses') WHERE name='receipt_relative_path'")?.name).toBe('receipt_relative_path');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('crm_identity_assets') WHERE name='role'")?.name).toBe('role');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('crm_identity_assets') WHERE name='relative_path'")?.name).toBe('relative_path');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('time_session_pauses') WHERE name='reason'")?.name).toBe('reason');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('time_session_pauses') WHERE name='reason_note'")?.name).toBe('reason_note');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('billing_items') WHERE name='invoice_document_id'")?.name).toBe('invoice_document_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('billing_items') WHERE name='invoice_reference'")?.name).toBe('invoice_reference');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('bridge_occurrence_returns') WHERE name='result_technical_item_id'")?.name).toBe('result_technical_item_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('bridge_occurrence_returns') WHERE name='result_variant_id'")?.name).toBe('result_variant_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('billing_items') WHERE name='invoiced_at'")?.name).toBe('invoiced_at');
    expect(database.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='backup_records'")?.name).toBe('backup_records');
    expect(database.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='backup_policies'")?.name).toBe('backup_policies');
    for (const column of ['semantic_key', 'work_card_json', 'advice_json', 'is_paused', 'pause_reason']) {
      expect(database.get<{ name: string }>(`SELECT name FROM pragma_table_info('project_nodes') WHERE name='${column}'`)?.name).toBe(column);
    }
    expect(database.get<{ id: string }>(
      "SELECT id FROM catalog_project_blueprints WHERE catalog_version_id='atoumweb-vitrine-v1' AND role='base'",
    )?.id).toBe('atoumweb-blueprint-link-vitrine');
    expect(database.get<{ id: string }>(
      "SELECT id FROM catalog_project_blueprints WHERE catalog_version_id='atoumweb-web-v1' AND role='base'",
    )?.id).toBe('atoumweb-blueprint-link-web-service');

    const seededPlans = database.all<{ name: string }>('SELECT name FROM maintenance_plans ORDER BY periodic_price_cents');
    expect(seededPlans.map((plan) => plan.name)).toEqual(['Maintenance 49 €/mois', 'Maintenance 99 €/mois']);

    database.close();
  });
});

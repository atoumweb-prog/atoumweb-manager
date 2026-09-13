import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

describe('migrations SQLite', () => {
  it('applique chaque migration une seule fois', () => {
    const database = new NodeSqliteAdapter(':memory:');

    expect(getPendingMigrations(database)).toHaveLength(11);
    expect(applyPendingMigrations(database)).toHaveLength(11);
    expect(getPendingMigrations(database)).toHaveLength(0);
    expect(applyPendingMigrations(database)).toHaveLength(0);

    for (const table of [
      'settings',
      'organizations',
      'contacts',
      'client_accounts',
      'prospects',
      'activity_events',
      'search_documents',
      'crm_actions',
      'catalog_items',
      'catalog_versions',
      'offer_components',
      'number_sequences',
      'quotes',
      'quote_lines',
      'project_templates',
      'project_template_versions',
      'project_template_nodes',
      'projects',
      'project_nodes',
      'project_services',
      'project_prerequisites',
      'file_assets',
      'file_asset_links',
      'technical_items',
      'technical_item_versions',
      'technical_item_assets',
      'time_sessions',
      'time_session_pauses',
      'service_requests',
      'interventions',
    ]) {
      const row = database.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table],
      );
      expect(row?.name).toBe(table);
    }

    const quoteProjectColumn = database.get<{ name: string }>(
      "SELECT name FROM pragma_table_info('quotes') WHERE name='project_id'",
    );
    expect(quoteProjectColumn?.name).toBe('project_id');

    const timeInterventionColumn = database.get<{ name: string }>(
      "SELECT name FROM pragma_table_info('time_sessions') WHERE name='intervention_id'",
    );
    expect(timeInterventionColumn?.name).toBe('intervention_id');

    database.close();
  });
});

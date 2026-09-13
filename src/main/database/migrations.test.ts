import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

describe('migrations SQLite', () => {
  it('applique chaque migration une seule fois', () => {
    const database = new NodeSqliteAdapter(':memory:');

    expect(getPendingMigrations(database)).toHaveLength(9);
    expect(applyPendingMigrations(database)).toHaveLength(9);
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

    database.close();
  });
});
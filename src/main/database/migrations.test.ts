import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

describe('migrations SQLite', () => {
  it('applique chaque migration une seule fois', () => {
    const database = new NodeSqliteAdapter(':memory:');

    expect(getPendingMigrations(database)).toHaveLength(6);
    expect(applyPendingMigrations(database)).toHaveLength(6);
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
    ]) {
      const row = database.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table],
      );
      expect(row?.name).toBe(table);
    }

    database.close();
  });
});

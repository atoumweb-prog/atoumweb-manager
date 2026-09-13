import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

describe('migrations SQLite', () => {
  it('applique chaque migration une seule fois', () => {
    const database = new NodeSqliteAdapter(':memory:');

    expect(getPendingMigrations(database)).toHaveLength(1);
    expect(applyPendingMigrations(database)).toHaveLength(1);
    expect(getPendingMigrations(database)).toHaveLength(0);
    expect(applyPendingMigrations(database)).toHaveLength(0);

    const settingsTable = database.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'",
    );
    expect(settingsTable?.name).toBe('settings');

    database.close();
  });
});

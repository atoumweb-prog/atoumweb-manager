import type { DatabaseAdapter } from './DatabaseAdapter';

export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'foundation_system_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        action TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_activity_log_entity
        ON activity_log(entity_type, entity_id, created_at DESC);
    `,
  },
];

export function ensureMigrationTable(database: DatabaseAdapter): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);
}

export function getPendingMigrations(database: DatabaseAdapter): Migration[] {
  ensureMigrationTable(database);
  const rows = database.all<{ id: number }>('SELECT id FROM schema_migrations ORDER BY id');
  const applied = new Set(rows.map((row) => Number(row.id)));
  return MIGRATIONS.filter((migration) => !applied.has(migration.id));
}

export function applyPendingMigrations(database: DatabaseAdapter): Migration[] {
  const pending = getPendingMigrations(database);

  for (const migration of pending) {
    database.exec('BEGIN IMMEDIATE;');
    try {
      database.exec(migration.sql);
      database.run(
        'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
        [migration.id, migration.name, new Date().toISOString()],
      );
      database.exec('COMMIT;');
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  }

  return pending;
}

import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations, MIGRATIONS } from './migrations';

describe('registre des migrations SQLite', () => {
  it('n’a aucun identifiant ni nom en double et suit un ordre strictement croissant', () => {
    expect(new Set(MIGRATIONS.map(m => m.id)).size).toBe(MIGRATIONS.length);
    expect(new Set(MIGRATIONS.map(m => m.name)).size).toBe(MIGRATIONS.length);
    expect(MIGRATIONS.map(m => m.id)).toEqual([...MIGRATIONS.map(m => m.id)].sort((a, b) => a - b));
  });

  it('refuse un historique appliqué dont le nom diffère, sans altérer les données', () => {
    const db = new NodeSqliteAdapter(':memory:');
    try {
      db.exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL) STRICT;");
      db.exec("INSERT INTO settings VALUES ('sentinel', 'preserved', '2026-10-14');");
      db.exec("CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;");
      db.run("INSERT INTO schema_migrations VALUES (?, ?, ?)", [67, 'contract_clause_section_review_v1', '2026-10-14']);
      expect(() => getPendingMigrations(db)).toThrow(/Historique SQLite incompatible/);
      expect(() => applyPendingMigrations(db)).toThrow(/Historique SQLite incompatible/);
      expect(db.get("SELECT value_json FROM settings WHERE key='sentinel'")).toEqual({value_json:'preserved'});
      expect(db.all("SELECT id, name FROM schema_migrations")).toEqual([{id:67,name:'contract_clause_section_review_v1'}]);
    } finally { db.close(); }
  });

  it('refuse aussi un identifiant inconnu dans le registre appliqué', () => {
    const db = new NodeSqliteAdapter(':memory:');
    try {
      db.exec("CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;");
      db.run("INSERT INTO schema_migrations VALUES (?, ?, ?)", [99999, 'untracked_extension', '2026-10-14']);
      expect(() => getPendingMigrations(db)).toThrow(/Historique SQLite incompatible/);
    } finally { db.close(); }
  });
});

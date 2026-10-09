import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import * as sqlite from 'node:sqlite';
import { NodeSqliteAdapter } from './database/NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations, MIGRATIONS } from './database/migrations';
import { ensureWorkspace, type WorkspacePaths } from './workspace';
import { applyPendingDatabaseRestore, DatabaseRestoreError, scheduleDatabaseRestore, validateRestoreSource } from './restore';

const context = vi.hoisted(() => ({ profile: '' }));
vi.mock('electron', () => ({ app: { getPath: () => context.profile } }));
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof fs>();
  return { ...actual, copyFileSync: vi.fn(actual.copyFileSync) };
});
vi.mock('node:sqlite', async importOriginal => {
  const actual = await importOriginal<typeof sqlite>();
  return { ...actual, backup: vi.fn(actual.backup) };
});

let root: string;
let workspace: WorkspacePaths;
let sourcePath: string;
let schemaFixture: Buffer | undefined;
const marker = () => join(context.profile, 'pending-database-restore.json');
function createFixture(file: string, label: string, version = MIGRATIONS.length): void {
  if (version === MIGRATIONS.length && schemaFixture) fs.writeFileSync(file, schemaFixture);
  const database = new NodeSqliteAdapter(file);
  try {
    if (version === MIGRATIONS.length && !schemaFixture) applyPendingMigrations(database);
    else if (version !== MIGRATIONS.length) for (const migration of getPendingMigrations(database).filter(item => item.id <= version)) {
      database.exec(migration.disableForeignKeys ? 'PRAGMA foreign_keys=OFF' : 'PRAGMA foreign_keys=ON');
      database.exec(migration.sql);
      database.run('INSERT INTO schema_migrations VALUES (?,?,?)', [migration.id, migration.name, '2026-09-14T08:00:00Z']);
    }
    database.run('INSERT INTO settings VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json', ['restore-fixture', JSON.stringify(label), '2026-09-14T08:00:00Z']);
  } finally { database.close(); }
}
beforeAll(() => {
  const templateRoot = fs.mkdtempSync(join(tmpdir(), 'atoumweb-restore-schema-'));
  try {
    const template = join(templateRoot, 'schema.sqlite');
    createFixture(template, 'schema-only');
    schemaFixture = fs.readFileSync(template);
  } finally { fs.rmSync(templateRoot, { recursive: true, force: true }); }
});
function modify(file: string, sql: string): void {
  const database = new sqlite.DatabaseSync(file);
  try { database.exec(sql); } finally { database.close(); }
}
function snapshot(file: string) {
  const database = new sqlite.DatabaseSync(file, { readOnly: true });
  try {
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    return Object.fromEntries(tables.map(table => [String(table.name), database.prepare(`SELECT * FROM "${String(table.name).replaceAll('"', '""')}" ORDER BY rowid`).all()]));
  } finally { database.close(); }
}
function health(file: string) {
  const database = new sqlite.DatabaseSync(file, { readOnly: true });
  try {
    expect(database.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }]);
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  } finally { database.close(); }
}
beforeEach(async () => {
  root = fs.mkdtempSync(join(tmpdir(), 'atoumweb-restore-test-'));
  context.profile = join(root, 'profile'); fs.mkdirSync(context.profile);
  workspace = ensureWorkspace(join(root, 'workspace-A'));
  sourcePath = join(root, 'backup.sqlite');
  createFixture(workspace.databaseFile, 'original'); createFixture(sourcePath, 'backup');
  const actualFs = await vi.importActual<typeof fs>('node:fs');
  const actualSqlite = await vi.importActual<typeof sqlite>('node:sqlite');
  vi.mocked(fs.copyFileSync).mockReset().mockImplementation(actualFs.copyFileSync);
  vi.mocked(sqlite.backup).mockReset().mockImplementation(actualSqlite.backup);
});
afterEach(() => {
  // Only fixtures created by this test, never a profile/workspace supplied by users.
  expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
  expect(fs.readdirSync(workspace.dataDirectory).filter(name => name.startsWith('.restore-') || name.endsWith('.restore-lock'))).toEqual([]);
  expect(fs.existsSync(`${marker()}.lock`)).toBe(false);
  fs.rmSync(root, { recursive: true, force: true });
  expect(fs.existsSync(root)).toBe(false);
});

describe('restauration SQLite isolée UX-16', { timeout: 20000 }, () => {
  it('sans demande ne crée aucun fichier ni connexion', async () => {
    expect(await applyPendingDatabaseRestore(workspace)).toEqual({ restored: false });
    expect(sqlite.backup).not.toHaveBeenCalled();
    expect(fs.readdirSync(context.profile)).toEqual([]);
  });

  it.each(['DELETE', 'WAL'])('restaure en mode %s, conserve une sauvegarde récupérable et ne rejoue pas la demande', async mode => {
    modify(workspace.databaseFile, `PRAGMA journal_mode=${mode}`);
    const before = snapshot(workspace.databaseFile), sourceBefore = fs.readFileSync(sourcePath);
    scheduleDatabaseRestore(sourcePath, workspace);
    const pending = JSON.parse(fs.readFileSync(marker(), 'utf8'));
    expect(pending.version).toBe(2); expect(pending.destinationIdentity).toBeTruthy(); expect(pending.sourceSha256).toHaveLength(64);
    const result = await applyPendingDatabaseRestore(workspace);
    expect(result.restored).toBe(true);
    expect(snapshot(workspace.databaseFile)).toEqual(snapshot(sourcePath));
    expect(snapshot(result.safetyBackupPath!)).toEqual(before);
    expect(fs.readFileSync(sourcePath)).toEqual(sourceBefore);
    const bytes = fs.readFileSync(workspace.databaseFile);
    expect(await applyPendingDatabaseRestore(workspace)).toEqual({ restored: false });
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes);
    health(workspace.databaseFile); health(result.safetyBackupPath!);
  });

  it.each([4, 65])('accepte un schéma historique compatible à %i migrations sans migrer la source', async version => {
    const historical = join(root, 'historical.sqlite'); createFixture(historical, 'historical', version);
    const bytes = fs.readFileSync(historical);
    expect(validateRestoreSource(historical).migrationCount).toBe(version);
    scheduleDatabaseRestore(historical, workspace);
    await applyPendingDatabaseRestore(workspace);
    expect(snapshot(workspace.databaseFile)).toEqual(snapshot(historical));
    expect(fs.readFileSync(historical)).toEqual(bytes);
    const database = new NodeSqliteAdapter(workspace.databaseFile);
    try {
      expect(applyPendingMigrations(database)).toHaveLength(MIGRATIONS.length - version);
      expect(applyPendingMigrations(database)).toEqual([]);
    } finally { database.close(); }
    health(workspace.databaseFile);
  });

  it('refuse A vers B avant toute copie et ne restaure pas A au démarrage suivant', async () => {
    scheduleDatabaseRestore(sourcePath, workspace);
    const b = ensureWorkspace(join(root, 'workspace-B')); createFixture(b.databaseFile, 'B-original');
    const aBytes = fs.readFileSync(workspace.databaseFile), bBytes = fs.readFileSync(b.databaseFile);
    await expect(applyPendingDatabaseRestore(b)).rejects.toThrow(/workspace ou la base cible a changé/);
    expect(sqlite.backup).not.toHaveBeenCalled(); expect(fs.copyFileSync).not.toHaveBeenCalled();
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(aBytes); expect(fs.readFileSync(b.databaseFile)).toEqual(bBytes);
    expect(fs.existsSync(marker())).toBe(false);
    expect(fs.readdirSync(context.profile).some(name => name.includes('.refused-'))).toBe(true);
    expect(await applyPendingDatabaseRestore(workspace)).toEqual({ restored: false });
  });

  it.each(['legacy', 'incomplete', 'interrupted', 'invalid-json'])('refuse une demande %s sans opération SQLite', async kind => {
    scheduleDatabaseRestore(sourcePath, workspace);
    const pending = JSON.parse(fs.readFileSync(marker(), 'utf8'));
    if (kind === 'legacy') fs.writeFileSync(marker(), JSON.stringify({ sourcePath, requestedAt: pending.requestedAt }));
    if (kind === 'incomplete') { delete pending.destinationPath; fs.writeFileSync(marker(), JSON.stringify(pending)); }
    if (kind === 'interrupted') { pending.state = 'applying'; fs.writeFileSync(marker(), JSON.stringify(pending)); }
    if (kind === 'invalid-json') fs.writeFileSync(marker(), '{broken');
    const bytes = fs.readFileSync(workspace.databaseFile);
    await expect(applyPendingDatabaseRestore(workspace)).rejects.toBeInstanceOf(DatabaseRestoreError);
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes);
    expect(sqlite.backup).not.toHaveBeenCalled();
    expect(await applyPendingDatabaseRestore(workspace)).toEqual({ restored: false });
  });

  it.each([
    ['non SQLite', 'text'], ['SQLite étrangère', 'foreign'], ['migrations futures', 'future'],
    ['migration manquante', 'gap'], ['migration inconnue', 'wrong-name'], ['table manquante', 'table'],
    ['colonne manquante', 'column'], ['clés étrangères invalides', 'fk'], ['intégrité incorrecte', 'integrity'],
  ])('refuse une source %s à la programmation sans toucher la cible', (_label, kind) => {
    if (kind === 'text') fs.writeFileSync(sourcePath, 'not SQLite');
    else if (kind === 'foreign') { const foreign = join(root, 'foreign.sqlite'); modify(foreign, 'CREATE TABLE foreign_data(value TEXT)'); sourcePath = foreign; }
    else if (kind === 'future') modify(sourcePath, "INSERT INTO schema_migrations VALUES (999,'future','now')");
    else if (kind === 'gap') modify(sourcePath, 'DELETE FROM schema_migrations WHERE id=3');
    else if (kind === 'wrong-name') modify(sourcePath, "UPDATE schema_migrations SET name='unknown' WHERE id=2");
    else if (kind === 'table') modify(sourcePath, 'DROP TABLE contract_types');
    else if (kind === 'column') modify(sourcePath, 'ALTER TABLE settings DROP COLUMN value_json');
    else if (kind === 'fk') modify(sourcePath, "PRAGMA foreign_keys=OFF; INSERT INTO contacts (id,organization_id,first_name,last_name,created_at,updated_at) VALUES ('orphan','missing','A','B','now','now')");
    else {
      const database = new sqlite.DatabaseSync(sourcePath, { readOnly: true });
      let page: number;
      try { page = Number(database.prepare("SELECT rootpage FROM sqlite_master WHERE type='index' AND sql IS NOT NULL LIMIT 1").get()!.rootpage); }
      finally { database.close(); }
      const bytes = fs.readFileSync(sourcePath);
      const pageSize = bytes.readUInt16BE(16) || 65536;
      bytes[(page - 1) * pageSize] = 255; // Invalid B-tree page, valid SQLite header.
      fs.writeFileSync(sourcePath, bytes);
    }
    const bytes = fs.readFileSync(workspace.databaseFile);
    expect(() => scheduleDatabaseRestore(sourcePath, workspace)).toThrow();
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes);
    expect(fs.existsSync(marker())).toBe(false); expect(sqlite.backup).not.toHaveBeenCalled();
  });

  it.each(['modified', 'missing', 'non-sqlite', 'wal'])('recontrôle la source devenue %s après confirmation', async kind => {
    scheduleDatabaseRestore(sourcePath, workspace);
    if (kind === 'modified') modify(sourcePath, "UPDATE settings SET value_json='\"changed\"' WHERE key='restore-fixture'");
    if (kind === 'missing') fs.unlinkSync(sourcePath);
    if (kind === 'non-sqlite') fs.writeFileSync(sourcePath, 'invalid source');
    if (kind === 'wal') fs.writeFileSync(`${sourcePath}-wal`, 'sidecar');
    const bytes = fs.readFileSync(workspace.databaseFile);
    await expect(applyPendingDatabaseRestore(workspace)).rejects.toBeInstanceOf(DatabaseRestoreError);
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes);
    expect(sqlite.backup).not.toHaveBeenCalled(); expect(fs.copyFileSync).not.toHaveBeenCalled();
  });

  it('vérifie aussi les contraintes CHECK sur la copie indépendante, sans écriture sur la source', async () => {
    modify(sourcePath, 'CREATE TABLE integrity_fixture (id INTEGER CHECK(id>0)); PRAGMA ignore_check_constraints=ON; INSERT INTO integrity_fixture VALUES (-1)');
    const sourceBytes = fs.readFileSync(sourcePath), targetBytes = fs.readFileSync(workspace.databaseFile);
    scheduleDatabaseRestore(sourcePath, workspace);
    await expect(applyPendingDatabaseRestore(workspace)).rejects.toThrow(/Intégrité SQLite incorrecte/);
    expect(fs.readFileSync(sourcePath)).toEqual(sourceBytes); expect(fs.readFileSync(workspace.databaseFile)).toEqual(targetBytes);
    expect(sqlite.backup).not.toHaveBeenCalled();
  });

  it('refuse une cible remplacée au même chemin', async () => {
    scheduleDatabaseRestore(sourcePath, workspace);
    fs.renameSync(workspace.databaseFile, join(root, 'old-target.sqlite'));
    createFixture(workspace.databaseFile, 'different-target');
    const bytes = fs.readFileSync(workspace.databaseFile);
    await expect(applyPendingDatabaseRestore(workspace)).rejects.toThrow(/base cible a changé/);
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes);
  });

  it('refuse une source identique à la cible, même via lien physique', () => {
    expect(() => scheduleDatabaseRestore(workspace.databaseFile, workspace)).toThrow(/distinctes/);
    const alias = join(root, 'hardlink.sqlite'); fs.linkSync(workspace.databaseFile, alias);
    expect(() => scheduleDatabaseRestore(alias, workspace)).toThrow(/distinctes/);
  });

  it('accepte les variantes Windows de casse et de séparateur', async () => {
    const windows = process.platform === 'win32';
    const file = windows ? sourcePath.toUpperCase().replaceAll('\\', '/') : sourcePath;
    scheduleDatabaseRestore(file, workspace);
    const alias = windows ? { ...workspace, root: workspace.root.toUpperCase().replaceAll('\\', '/'), databaseFile: workspace.databaseFile.toUpperCase() } : workspace;
    expect((await applyPendingDatabaseRestore(alias)).restored).toBe(true);
  });

  it('accepte une jonction vers la même cible et refuse son changement', async () => {
    const alias = join(root, 'workspace-alias'); fs.symlinkSync(workspace.root, alias, process.platform === 'win32' ? 'junction' : 'dir');
    const aliasWorkspace = ensureWorkspace(alias);
    scheduleDatabaseRestore(sourcePath, aliasWorkspace);
    expect((await applyPendingDatabaseRestore(workspace)).restored).toBe(true);
    scheduleDatabaseRestore(sourcePath, aliasWorkspace);
    const b = ensureWorkspace(join(root, 'workspace-B')); createFixture(b.databaseFile, 'B-original');
    fs.unlinkSync(alias); fs.symlinkSync(b.root, alias, process.platform === 'win32' ? 'junction' : 'dir');
    const bytes = fs.readFileSync(b.databaseFile);
    await expect(applyPendingDatabaseRestore(aliasWorkspace)).rejects.toThrow(/workspace ou la base cible a changé/);
    expect(fs.readFileSync(b.databaseFile)).toEqual(bytes);
  });

  it('refuse une copie préparatoire en échec sans sauvegarde ni remplacement', async () => {
    scheduleDatabaseRestore(sourcePath, workspace);
    const bytes = fs.readFileSync(workspace.databaseFile);
    vi.mocked(fs.copyFileSync).mockImplementation(() => { throw new Error('Copie indisponible'); });
    await expect(applyPendingDatabaseRestore(workspace)).rejects.toThrow(/Copie indisponible/);
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes);
    expect(sqlite.backup).not.toHaveBeenCalled();
  });

  it('refuse une copie préparatoire altérée', async () => {
    const actualFs = await vi.importActual<typeof fs>('node:fs');
    scheduleDatabaseRestore(sourcePath, workspace);
    const bytes = fs.readFileSync(workspace.databaseFile);
    vi.mocked(fs.copyFileSync).mockImplementation((from, to, flags) => { actualFs.copyFileSync(from, to, flags); modify(String(to), "UPDATE settings SET value_json='\"wrong copy\"' WHERE key='restore-fixture'"); });
    await expect(applyPendingDatabaseRestore(workspace)).rejects.toThrow(/copie préparée/);
    expect(fs.readFileSync(workspace.databaseFile)).toEqual(bytes); expect(sqlite.backup).not.toHaveBeenCalled();
  });

  it('conserve une sauvegarde récupérable après échec du remplacement', async () => {
    const actual = await vi.importActual<typeof sqlite>('node:sqlite');
    const before = snapshot(workspace.databaseFile);
    scheduleDatabaseRestore(sourcePath, workspace);
    vi.mocked(sqlite.backup).mockImplementation(async (database, destination, options) => {
      if (String(destination).toLowerCase() === workspace.databaseFile.toLowerCase()) throw new Error('Remplacement indisponible');
      return actual.backup(database, destination, options);
    });
    const error = await applyPendingDatabaseRestore(workspace).catch(error => error as DatabaseRestoreError);
    expect(error).toBeInstanceOf(DatabaseRestoreError);
    const failure = error as DatabaseRestoreError;
    expect(failure.message).toContain('Ancienne base récupérable');
    expect(snapshot(failure.safetyBackupPath!)).toEqual(before); health(failure.safetyBackupPath!);
    expect(snapshot(workspace.databaseFile)).toEqual(before);
    expect(await applyPendingDatabaseRestore(workspace)).toEqual({ restored: false });
    // Explicit recovery, in this fixture only, using the retained safety backup.
    vi.mocked(sqlite.backup).mockImplementation(actual.backup);
    modify(workspace.databaseFile, "UPDATE settings SET value_json='\"recovery needed\"' WHERE key='restore-fixture'");
    scheduleDatabaseRestore(failure.safetyBackupPath!, workspace);
    expect((await applyPendingDatabaseRestore(workspace)).restored).toBe(true);
    expect(snapshot(workspace.databaseFile)).toEqual(before); health(workspace.databaseFile);
  });

  it.each(['DELETE', 'WAL'])('refuse une cible occupée en mode %s et conserve les données', async mode => {
    modify(workspace.databaseFile, `PRAGMA journal_mode=${mode}`);
    scheduleDatabaseRestore(sourcePath, workspace);
    const before = snapshot(workspace.databaseFile);
    const writer = new sqlite.DatabaseSync(workspace.databaseFile);
    try {
      writer.exec('BEGIN IMMEDIATE;');
      const error = await applyPendingDatabaseRestore(workspace).catch(error => error);
      expect(error).toBeInstanceOf(DatabaseRestoreError);
      expect(error.message).toMatch(/locked|busy/i);
      if (error.safetyBackupPath) { expect(snapshot(error.safetyBackupPath)).toEqual(before); health(error.safetyBackupPath); }
    } finally { writer.exec('ROLLBACK'); writer.close(); }
    expect(snapshot(workspace.databaseFile)).toEqual(before); health(workspace.databaseFile);
  });

  it('exclut une écriture concurrente pendant la copie transactionnelle SQLite', async () => {
    const actual = await vi.importActual<typeof sqlite>('node:sqlite');
    scheduleDatabaseRestore(sourcePath, workspace);
    let attempted = false, blocked = false;
    vi.mocked(sqlite.backup).mockImplementation(async (database, destination, options) => {
      if (String(destination).toLowerCase() !== workspace.databaseFile.toLowerCase()) return actual.backup(database, destination, options);
      return actual.backup(database, destination, { rate: 32, progress: () => {
        if (attempted) return; attempted = true;
        const writer = new sqlite.DatabaseSync(workspace.databaseFile, { timeout: 0 });
        try { writer.exec('BEGIN IMMEDIATE;'); writer.exec('ROLLBACK;'); }
        catch (error) { blocked = /locked|busy/i.test(String(error)); }
        finally { writer.close(); }
      } });
    });
    expect((await applyPendingDatabaseRestore(workspace)).restored).toBe(true);
    expect(attempted).toBe(true); expect(blocked).toBe(true);
    expect(snapshot(workspace.databaseFile)).toEqual(snapshot(sourcePath)); health(workspace.databaseFile);
  });

  it('refuse une autre demande pendant la préparation et ne supprime pas son verrou', async () => {
    scheduleDatabaseRestore(sourcePath, workspace);
    fs.writeFileSync(`${marker()}.lock`, 'other restore');
    try {
      expect(() => scheduleDatabaseRestore(sourcePath, workspace)).toThrow(/déjà en cours/);
      await expect(applyPendingDatabaseRestore(workspace)).rejects.toThrow(/autre restauration/);
      expect(fs.existsSync(marker())).toBe(true); expect(fs.readFileSync(`${marker()}.lock`, 'utf8')).toBe('other restore');
    } finally { fs.unlinkSync(`${marker()}.lock`); }
  });
});

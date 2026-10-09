import { app } from 'electron';
import { createHash, randomUUID } from 'node:crypto';
import { backup, DatabaseSync } from 'node:sqlite';
import {
  closeSync, constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { MIGRATIONS } from './database/migrations';
import { NodeSqliteAdapter } from './database/NodeSqliteAdapter';
import { createWorkspacePaths, type WorkspacePaths } from './workspace';

interface PendingRestore {
  version: 2;
  state: 'pending' | 'applying';
  sourcePath: string;
  sourceSha256: string;
  workspaceRoot: string;
  destinationPath: string;
  destinationIdentity: string;
  requestedAt: string;
  safetyBackupPath?: string;
}

export class DatabaseRestoreError extends Error {
  constructor(message: string, readonly safetyBackupPath?: string, readonly refusedRequestPath?: string) {
    super(`${message}${safetyBackupPath ? `\nAncienne base récupérable : ${safetyBackupPath}` : ''}${refusedRequestPath ? `\nDemande refusée conservée : ${refusedRequestPath}` : ''}\nAucune nouvelle tentative automatique. Reprogramme explicitement la restauration après vérification.`);
    this.name = 'DatabaseRestoreError';
  }
}

const PENDING_RESTORE_FILENAME = 'pending-database-restore.json';
const expectedSchemas = new Map<number, { objects: { name: string; type: string }[]; columns: Map<string, string[]> }>();
const pendingRestorePath = (): string => join(app.getPath('userData'), PENDING_RESTORE_FILENAME);
const canonicalPath = (file: string): string => {
  const canonical = realpathSync.native(resolve(file));
  return process.platform === 'win32' ? canonical.toLowerCase() : canonical;
};
const fileIdentity = (file: string): string => { const stat = statSync(file, { bigint: true }); return `${stat.dev}:${stat.ino}`; };
const fingerprint = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');

function assertStandalone(file: string): void {
  if (!statSync(file).isFile()) throw new Error('La source doit être un fichier de sauvegarde.');
  if (['-wal', '-shm', '-journal'].some(suffix => existsSync(`${file}${suffix}`))) {
    throw new Error('La source possède des fichiers SQLite annexes. Sélectionne une sauvegarde autonome, pas une base en cours d’utilisation.');
  }
}

function checkIntegrity(database: DatabaseSync): void {
  const integrity = database.prepare('PRAGMA integrity_check').all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') throw new Error('Intégrité SQLite incorrecte.');
  if (database.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Clés étrangères incohérentes.');
}

function expectedSchema(count: number) {
  let schema = expectedSchemas.get(count);
  if (schema) return schema;
  const fixture = new NodeSqliteAdapter(':memory:');
  try {
    // Build the expected historical schema in memory, never migrate the source.
    fixture.exec('CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;');
    for (const migration of MIGRATIONS.slice(0, count)) {
      fixture.exec(migration.disableForeignKeys ? 'PRAGMA foreign_keys=OFF' : 'PRAGMA foreign_keys=ON');
      fixture.exec(migration.sql);
    }
    const objects = fixture.all<{ name: string; type: string }>("SELECT name,type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name");
    const columns = new Map<string, string[]>();
    for (const table of objects.filter(object => object.type === 'table')) {
      columns.set(table.name, fixture.all<{ name: string; type: string; pk: number; notnull: number }>('SELECT name,type,pk,"notnull" FROM pragma_table_info(?)', [table.name])
        .map(column => JSON.stringify(column)));
    }
    schema = { objects, columns };
    expectedSchemas.set(count, schema);
    return schema;
  } finally { fixture.close(); }
}

function checkManagerDatabase(database: DatabaseSync): number {
  checkIntegrity(database);
  const ledger = database.prepare('SELECT id,name FROM schema_migrations ORDER BY id').all();
  if (!ledger.length || ledger.length > MIGRATIONS.length || ledger.some((row, index) => row.id !== MIGRATIONS[index].id || row.name !== MIGRATIONS[index].name)) {
    throw new Error('Migrations AtoumWeb Manager inconnues, incomplètes ou incompatibles.');
  }
  const expected = expectedSchema(ledger.length);
  const actual = new Map(database.prepare("SELECT name,type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").all().map(row => [row.name, row.type]));
  for (const object of expected.objects) {
    if (actual.get(object.name) !== object.type) throw new Error(`Schéma Manager incompatible : ${object.name}.`);
  }
  for (const [table, required] of expected.columns) {
    const columns = database.prepare('SELECT name,type,pk,"notnull" FROM pragma_table_info(?)').all(table).map(column => JSON.stringify(column));
    if (required.some(column => !columns.includes(column))) throw new Error(`Colonnes Manager incompatibles : ${table}.`);
  }
  return ledger.length;
}

export function validateRestoreSource(sourcePath: string): { sha256: string; migrationCount: number } {
  assertStandalone(sourcePath);
  const sha256 = fingerprint(sourcePath);
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  let migrationCount: number;
  try { migrationCount = checkManagerDatabase(source); } finally { source.close(); }
  assertStandalone(sourcePath);
  if (fingerprint(sourcePath) !== sha256) throw new Error('La sauvegarde a changé pendant sa vérification.');
  return { sha256, migrationCount };
}

function writePending(pending: PendingRestore, marker = pendingRestorePath()): void {
  const temporary = `${marker}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(pending, null, 2), { encoding: 'utf8', flag: 'wx' });
    renameSync(temporary, marker);
  } finally { rmSync(temporary, { force: true }); }
}

function assertWorkspace(workspace: WorkspacePaths): void {
  if (canonicalPath(workspace.databaseFile) !== canonicalPath(createWorkspacePaths(workspace.root).databaseFile)) {
    throw new Error('La destination SQLite ne correspond pas au workspace.');
  }
}

export function scheduleDatabaseRestore(sourcePath: string, workspace: WorkspacePaths): void {
  assertWorkspace(workspace);
  const destinationPath = canonicalPath(workspace.databaseFile);
  const resolvedSource = canonicalPath(sourcePath);
  if (resolvedSource === destinationPath || fileIdentity(resolvedSource) === fileIdentity(destinationPath)) throw new Error('La sauvegarde et la destination doivent être distinctes.');
  if (existsSync(`${pendingRestorePath()}.lock`) || existsSync(`${destinationPath}.restore-lock`)) throw new Error('Une restauration est déjà en cours.');
  const source = validateRestoreSource(resolvedSource);
  const pending: PendingRestore = {
    version: 2, state: 'pending', sourcePath: resolvedSource, sourceSha256: source.sha256,
    workspaceRoot: canonicalPath(workspace.root), destinationPath,
    destinationIdentity: fileIdentity(destinationPath), requestedAt: new Date().toISOString(),
  };
  mkdirSync(app.getPath('userData'), { recursive: true });
  writePending(pending);
}

function parsePending(marker: string): PendingRestore {
  const value = JSON.parse(readFileSync(marker, 'utf8')) as Partial<PendingRestore> | null;
  if (!value || value.version !== 2 || value.state !== 'pending' ||
    !['sourcePath', 'sourceSha256', 'workspaceRoot', 'destinationPath', 'destinationIdentity', 'requestedAt'].every(key => typeof value[key as keyof PendingRestore] === 'string' && String(value[key as keyof PendingRestore]).trim())) {
    throw new Error('Demande de restauration ancienne, incomplète ou interrompue : destination non confirmée.');
  }
  return value as PendingRestore;
}

export async function applyPendingDatabaseRestore(workspace: WorkspacePaths): Promise<{ restored: boolean; sourcePath?: string; safetyBackupPath?: string }> {
  const marker = pendingRestorePath();
  if (!existsSync(marker)) return { restored: false };
  const profileLockPath = `${marker}.lock`;
  let profileLock: number;
  try { profileLock = openSync(profileLockPath, 'wx'); }
  catch { throw new DatabaseRestoreError('Une autre restauration utilise ce profil.'); }
  let destinationLock: number | undefined;
  let destinationLockPath: string | undefined;
  let temporaryDirectory: string | undefined;
  let safetyBackupPath: string | undefined;
  const claimedRequestPath = `${marker}.in-progress-${randomUUID()}.json`;
  try {
    // Consume the request before any checks/writes. Even a failed quarantine or
    // a process crash cannot leave an executable request for the next startup.
    renameSync(marker, claimedRequestPath);
    const pending = parsePending(claimedRequestPath);
    assertWorkspace(workspace);
    const destinationPath = canonicalPath(workspace.databaseFile);
    if (pending.workspaceRoot !== canonicalPath(workspace.root) || pending.destinationPath !== destinationPath || pending.destinationIdentity !== fileIdentity(destinationPath)) {
      throw new Error('Le workspace ou la base cible a changé depuis la confirmation. Restauration refusée.');
    }
    if (canonicalPath(pending.sourcePath) === destinationPath || fileIdentity(pending.sourcePath) === fileIdentity(destinationPath)) throw new Error('La source est aussi la destination.');
    const source = validateRestoreSource(pending.sourcePath);
    if (source.sha256 !== pending.sourceSha256) throw new Error('La sauvegarde a changé depuis la confirmation.');
    destinationLockPath = `${destinationPath}.restore-lock`;
    destinationLock = openSync(destinationLockPath, 'wx');
    temporaryDirectory = mkdtempSync(join(workspace.dataDirectory, '.restore-'));
    const stagedPath = join(temporaryDirectory, 'verified.sqlite');
    copyFileSync(pending.sourcePath, stagedPath, constants.COPYFILE_EXCL);
    if (fingerprint(stagedPath) !== pending.sourceSha256) throw new Error('La copie préparée ne correspond pas à la sauvegarde confirmée.');
    // SQLite's read-only integrity check may omit CHECK constraints. Validate
    // them on our independent writable copy, never on the user's source file.
    const verification = new DatabaseSync(stagedPath);
    try { checkManagerDatabase(verification); } finally { verification.close(); }

    const safetyDirectory = join(workspace.backupsDirectory, 'pre-restore');
    mkdirSync(safetyDirectory, { recursive: true });
    const candidateSafetyPath = join(safetyDirectory, `atoumweb-manager-before-restore-${randomUUID()}.sqlite`);
    const current = new DatabaseSync(destinationPath, { timeout: 0 });
    try {
      // Refuse an occupied destination instead of letting the backup API wait
      // indefinitely for an existing writer. This transaction changes no data.
      current.exec('BEGIN IMMEDIATE; ROLLBACK;');
      await backup(current, candidateSafetyPath, { rate: 4096 });
    } finally { current.close(); }
    const safety = new DatabaseSync(candidateSafetyPath, { readOnly: true });
    try { checkIntegrity(safety); } finally { safety.close(); }
    safetyBackupPath = candidateSafetyPath;
    // An interrupted request must never be retried automatically on next startup.
    if (canonicalPath(workspace.databaseFile) !== destinationPath || fileIdentity(destinationPath) !== pending.destinationIdentity) throw new Error('La cible a été remplacée pendant la préparation.');
    writePending({ ...pending, state: 'applying', safetyBackupPath }, claimedRequestPath);
    const staged = new DatabaseSync(stagedPath, { readOnly: true });
    try {
      // SQLite holds the destination write transaction and rolls back failed copies.
      // Never copy over a live SQLite file or remove its WAL/SHM manually.
      await backup(staged, destinationPath, { rate: 4096 });
    } finally { staged.close(); }
    const restored = new DatabaseSync(destinationPath, { readOnly: true });
    try { checkManagerDatabase(restored); } finally { restored.close(); }
    rmSync(claimedRequestPath);
    return { restored: true, sourcePath: pending.sourcePath, safetyBackupPath };
  } catch (error) {
    let refusedRequestPath: string | undefined;
    if (existsSync(claimedRequestPath)) {
      refusedRequestPath = `${marker}.refused-${randomUUID()}.json`;
      try { renameSync(claimedRequestPath, refusedRequestPath); } catch { refusedRequestPath = claimedRequestPath; }
    }
    throw new DatabaseRestoreError(error instanceof Error ? error.message : 'Restauration refusée.', safetyBackupPath, refusedRequestPath);
  } finally {
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    if (destinationLock !== undefined) { closeSync(destinationLock); rmSync(destinationLockPath!, { force: true }); }
    closeSync(profileLock); rmSync(profileLockPath, { force: true });
  }
}

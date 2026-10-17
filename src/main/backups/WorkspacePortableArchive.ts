/**
 * EC04-02/03/04 experimental core: read-only capture -> verifiable container ->
 * restore into a NEW workspace only. NO IPC, menu or automatic production call.
 * The caller MUST hold a cross-window DB+file write barrier while capturing.
 * Without that barrier, this is NOT a consistency-certified backup.
 *
 * Format: ASCII magic, u64LE manifest byte length, UTF-8 JSON manifest,
 * then raw file payloads concatenated in manifest order. No compression or
 * encryption, and SHA256 detects corruption but does not authenticate authors.
 */
import {createHash, randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync,
  renameSync, rmSync, rmdirSync, linkSync, readdirSync, writeFileSync, unlinkSync,
} from 'node:fs';
import {open as openFile, type FileHandle} from 'node:fs/promises';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {tmpdir} from 'node:os';
import {checkedWorkspaceRelativePath, inventoryWorkspaceFiles, WORKSPACE_FILE_ROOTS} from './WorkspaceFileInventory';
import {auditKnownWorkspaceFileReferences} from './WorkspaceFileReferenceAudit';

const MAGIC = Buffer.from('ATOUM-EC04-B1\n', 'ascii');
const MAX_MANIFEST = 32 * 1024 * 1024;
const MAX_ENTRIES = 200000;
// Prototype hard limit until disk-space preflight and quotas are implemented.
const MAX_TOTAL_BYTES = 64 * 1024 ** 3;
const CHUNK = 256 * 1024;
const DB_ENTRY = 'database/atoumweb-manager.sqlite';
const SHA256_RE = /^[0-9a-f]{64}$/;

export interface Ec04ArchiveEntry {path: string; sizeBytes: number; sha256: string}
export interface Ec04Migration {id: number; name: string}
export interface Ec04ArchiveManifest {
  format: 'atoum-ec04-b1'; version: 1; id: string; createdAt: string;
  files: Ec04ArchiveEntry[]; migrations: Ec04Migration[];
  /** Deliberately false until paths, DB associations and secrets are audited. */
  referencesVerified: false;
  /** This core does not guarantee quiescence; coordinator must be reviewed first. */
  consistencyCertified: false;
}

export interface Ec04CreateInput {
  workspaceRoot: string;
  destinationPath: string;
  /** Snapshot of the already-quiescent application's SQLite connection. */
  snapshotDatabase: (destinationFile: string) => Promise<void>;
}

function exactInside(root: string, target: string): boolean {
  const delta = relative(root, target);
  return delta === '' || (delta !== '..' && !delta.startsWith('..' + sep) && !isAbsolute(delta));
}

/**
 * The Manager ledger is a sequence of ID/NAME pairs, not a dense list of
 * numbers. Gaps may be valid as long as IDs rise strictly and are unique.
 * The actual app schema/migration compatibility is validated separately.
 */
export function validateEc04MigrationLedger(value: unknown): Ec04Migration[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 1000) {
    throw Error('EC04 : registre de migrations invalide.');
  }
  const ledger: Ec04Migration[] = [];
  const names = new Set<string>();
  let previous = 0;
  for (const row of value) {
    if (!row || typeof row !== 'object') throw Error('EC04 : migration invalide.');
    const item = row as Partial<Ec04Migration>;
    if (!Number.isSafeInteger(item.id) || typeof item.id !== 'number' ||
        item.id < 1 || item.id <= previous ||
        typeof item.name !== 'string' || !item.name.trim() ||
        names.has(item.name)) {
      throw Error('EC04 : migration invalide (id/nom/ordre/doublon).');
    }
    ledger.push({id:item.id,name:item.name});
    names.add(item.name);
    previous = item.id;
  }
  return ledger;
}

function readMigrationLedger(databasePath: string): Ec04Migration[] {
  const db = new DatabaseSync(databasePath, {readOnly: true});
  try {
    const integrity = db.prepare('PRAGMA integrity_check').all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') {
      throw Error('EC04 : intégrité SQLite incorrecte.');
    }
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw Error('EC04 : FK SQLite invalides.');
    const ledger = db.prepare('SELECT id,name FROM schema_migrations ORDER BY id').all();
    return validateEc04MigrationLedger(ledger);
  } finally { db.close(); }
}

async function hashFile(file: string): Promise<Ec04ArchiveEntry> {
  const handle = await openFile(file, 'r');
  try {
    const before = await handle.stat();
    if (!before.isFile() || !Number.isSafeInteger(before.size)) throw Error('EC04 : fichier incorrect.');
    const hash = createHash('sha256');
    const buffer = Buffer.allocUnsafe(CHUNK);
    let position = 0;
    while (position < before.size) {
      const {bytesRead} = await handle.read(buffer, 0, Math.min(CHUNK, before.size - position), position);
      if (!bytesRead) throw Error('EC04 : fichier tronqué durant le calcul d’empreinte.');
      hash.update(buffer.subarray(0, bytesRead)); position += bytesRead;
    }
    const after = await handle.stat();
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
      throw Error('EC04 : fichier modifié pendant la lecture.');
    }
    return {path: '', sizeBytes: before.size, sha256: hash.digest('hex')};
  } finally { await handle.close(); }
}

async function writeExactly(dest: FileHandle, data: Buffer, position: number): Promise<number> {
  let offset = 0;
  while (offset < data.length) {
    const {bytesWritten} = await dest.write(data, offset, data.length - offset, position + offset);
    if (!bytesWritten) throw Error('EC04 : écriture interrompue.');
    offset += bytesWritten;
  }
  return position + offset;
}

async function copyAndHash(source: FileHandle, dest: FileHandle | null, start: number,
  size: number, expectedHash: string, outputAt: number): Promise<void> {
  const hasher = createHash('sha256');
  const buffer = Buffer.allocUnsafe(CHUNK);
  let copied = 0;
  while (copied < size) {
    const n = Math.min(CHUNK, size - copied);
    const {bytesRead} = await source.read(buffer, 0, n, start + copied);
    if (!bytesRead) throw Error('EC04 : contenu tronqué.');
    hasher.update(buffer.subarray(0, bytesRead));
    if (dest) await writeExactly(dest, buffer.subarray(0, bytesRead), outputAt + copied);
    copied += bytesRead;
  }
  if (hasher.digest('hex') !== expectedHash) throw Error('EC04 : empreinte SHA-256 incohérente.');
}

function validatePath(path: string): void {
  if (typeof path !== 'string' || !path || path.includes('\\')) throw Error('EC04 : chemin de manifeste interdit.');
  const parts = path.split('/');
  if (checkedWorkspaceRelativePath(parts) !== path) throw Error('EC04 : chemin invalide.');
  if (path !== DB_ENTRY && (parts[0] !== 'workspace' || !WORKSPACE_FILE_ROOTS.some(root => root === parts[1]) || parts.length < 3)) {
    throw Error('EC04 : fichier hors des racines permises.');
  }
}

function validateManifest(value: unknown): Ec04ArchiveManifest {
  if (!value || typeof value !== 'object') throw Error('EC04 : manifeste absent.');
  const m = value as Partial<Ec04ArchiveManifest>;
  if (m.format !== 'atoum-ec04-b1' || m.version !== 1 || typeof m.id !== 'string' ||
    typeof m.createdAt !== 'string' || m.referencesVerified !== false || m.consistencyCertified !== false ||
    !Array.isArray(m.files) || !Array.isArray(m.migrations) || m.files.length < 1 || m.files.length > MAX_ENTRIES) {
    throw Error('EC04 : version ou structure de manifeste incompatible.');
  }
  const seen = new Set<string>();
  const canonicalDirs = new Map<string, string>();
  let total = 0;
  for (const entry of m.files) {
    if (!entry || typeof entry !== 'object') throw Error('EC04 : entrée invalide.');
    validatePath(entry.path);
    if (!Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes < 0 || !SHA256_RE.test(entry.sha256)) {
      throw Error('EC04 : taille ou empreinte invalide.');
    }
    const key = entry.path.normalize('NFC').toLowerCase();
    if (seen.has(key)) throw Error('EC04 : collision Windows dans l’archive.');
    seen.add(key);
    const segments = entry.path.split('/');
    for (let n = 1; n < segments.length; n++) {
      const actual = segments.slice(0, n).join('/');
      const folded = actual.normalize('NFC').toLowerCase();
      const previous = canonicalDirs.get(folded);
      if (previous && previous !== actual) throw Error('EC04 : collision de dossiers Windows dans l’archive.');
      canonicalDirs.set(folded, actual);
    }
    total += entry.sizeBytes;
    if (!Number.isSafeInteger(total) || total > MAX_TOTAL_BYTES) throw Error('EC04 : archive trop grande.');
  }
  if (m.files[0].path !== DB_ENTRY || m.files.slice(1).some(entry => entry.path === DB_ENTRY)) {
    throw Error('EC04 : entrée SQLite absente ou dupliquée.');
  }
  for (const key of seen) {
    let parent = key.lastIndexOf('/');
    while (parent !== -1) {
      if (seen.has(key.slice(0, parent))) throw Error('EC04 : fichier utilisé comme répertoire.');
      parent = key.lastIndexOf('/', parent - 1);
    }
  }
  // Same semantics for archive and SQLite; never infer id from array position.
  validateEc04MigrationLedger(m.migrations);
  return m as Ec04ArchiveManifest;
}

function existingPath(path: string): boolean {
  // existsSync misses dangling symlinks. Never replace one.
  try { lstatSync(path); return true; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
function ensureNewDestination(destination: string): string {
  const target = resolve(destination);
  if (existingPath(target)) throw Error('EC04 : destination déjà existante — aucun écrasement.');
  const parent = dirname(target);
  const parentStat = lstatSync(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    throw Error('EC04 : dossier de destination non sûr.');
  }
  return target;
}

/**
 * Prototype, deliberately inaccessible from production UI/IPC.
 * The cross-window mutation barrier MUST already be held by the caller.
 */
export async function createOfflineWorkspaceArchive(input: Ec04CreateInput): Promise<Ec04ArchiveManifest> {
  const root = resolve(input.workspaceRoot), target = ensureNewDestination(input.destinationPath);
  const parent = dirname(target);
  if (exactInside(realpathSync.native(root), realpathSync.native(parent))) {
    throw Error('EC04 : archive dans le workspace refusée.');
  }
  const stage = mkdtempSync(join(parent, '.ec04-build-'));
  const tempArchive = join(stage, 'backup.awbackup');
  try {
    const first = await inventoryWorkspaceFiles(root);
    const snapshotFile = join(stage, 'sqlite-snapshot.sqlite');
    await input.snapshotDatabase(snapshotFile);
    if (!existsSync(snapshotFile) || existsSync(snapshotFile + '-wal') || existsSync(snapshotFile + '-shm')) {
      throw Error('EC04 : instantané SQLite autonome manquant.');
    }
    const migrations = readMigrationLedger(snapshotFile);
    // Reject mismatches from known SQLite -> file links; coverage is still partial.
    const references = auditKnownWorkspaceFileReferences(snapshotFile, first);
    if (references.issues.length) {
      const firstIssue = references.issues[0];
      throw Error(`EC04 : ${references.issues.length} référence(s) fichier invalides, ` +
        `dont ${firstIssue.table}.${firstIssue.column} (${firstIssue.problem}).`);
    }
    const db = await hashFile(snapshotFile);
    const entries: Ec04ArchiveEntry[] = [{...db, path: DB_ENTRY}, ...first.files.map(file => ({
      path: 'workspace/' + file.relativePath, sizeBytes: file.sizeBytes, sha256: file.sha256,
    }))];
    const manifest = validateManifest({
      format: 'atoum-ec04-b1', version: 1, id: randomUUID(), createdAt: new Date().toISOString(),
      files: entries, migrations, referencesVerified: false, consistencyCertified: false,
    });
    const second = await inventoryWorkspaceFiles(root);
    if (JSON.stringify(first) !== JSON.stringify(second)) throw Error('EC04 : fichier ajouté ou modifié pendant le snapshot.');
    const encoded = Buffer.from(JSON.stringify(manifest), 'utf8');
    if (encoded.length > MAX_MANIFEST) throw Error('EC04 : manifeste trop grand.');
    const header = Buffer.alloc(MAGIC.length + 8);
    MAGIC.copy(header); header.writeBigUInt64LE(BigInt(encoded.length), MAGIC.length);
    const dest = await openFile(tempArchive, 'wx');
    let writePosition = 0;
    try {
      writePosition = await writeExactly(dest, header, writePosition);
      writePosition = await writeExactly(dest, encoded, writePosition);
      for (const entry of manifest.files) {
        const sourceName = entry.path === DB_ENTRY ? snapshotFile :
          join(root, ...entry.path.split('/').slice(1));
        const stat = lstatSync(sourceName);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== entry.sizeBytes) {
          throw Error('EC04 : fichier source remplacé pendant la copie.');
        }
        const source = await openFile(sourceName, 'r');
        try {
          await copyAndHash(source, dest, 0, entry.sizeBytes, entry.sha256, writePosition);
        } finally { await source.close(); }
        writePosition += entry.sizeBytes;
      }
      await dest.sync();
    } finally { await dest.close(); }
    // Verify serialized bytes and SQLite before advertising a completed archive.
    await verifyOfflineWorkspaceArchive(tempArchive);
    // Exclusive hard-link: do not overwrite a file created by another process.
    linkSync(tempArchive, target);
    return manifest;
  } finally { rmSync(stage, {recursive: true, force: true}); }
}

async function unpackAndCheck(archivePath: string, stagingPath: string | null, materializeAllFiles = true): Promise<Ec04ArchiveManifest> {
  const file = await openFile(archivePath, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size < MAGIC.length + 8) throw Error('EC04 : archive tronquée.');
    const header = Buffer.alloc(MAGIC.length + 8);
    if ((await file.read(header, 0, header.length, 0)).bytesRead !== header.length ||
      !header.subarray(0, MAGIC.length).equals(MAGIC)) throw Error('EC04 : signature de format invalide.');
    const manifestLength = header.readBigUInt64LE(MAGIC.length);
    if (manifestLength < 2n || manifestLength > BigInt(MAX_MANIFEST)) throw Error('EC04 : manifeste trop grand.');
    const length = Number(manifestLength);
    const json = Buffer.alloc(length);
    let got = 0;
    while (got < length) {
      const result = await file.read(json, got, length - got, header.length + got);
      if (!result.bytesRead) throw Error('EC04 : manifeste tronqué.');
      got += result.bytesRead;
    }
    let object: unknown;
    try { object = JSON.parse(json.toString('utf8')); }
    catch { throw Error('EC04 : JSON manifeste corrompu.'); }
    const manifest = validateManifest(object);
    const size = manifest.files.reduce((acc, item) => acc + item.sizeBytes, 0);
    if (header.length + length + size !== stat.size) throw Error('EC04 : taille du conteneur incohérente.');
    let position = header.length + length;
    for (const entry of manifest.files) {
      let target: FileHandle | null = null;
      // Verification needs only a temporary SQLite file. Other payloads are
      // streamed through SHA-256 without a second full extraction on disk.
      if (stagingPath && (materializeAllFiles || entry.path === DB_ENTRY)) {
        const path = join(stagingPath, ...entry.path.split('/'));
        mkdirSync(dirname(path), {recursive: true});
        target = await openFile(path, 'wx');
      }
      try { await copyAndHash(file, target, position, entry.sizeBytes, entry.sha256, 0); }
      finally { if (target) await target.close(); }
      position += entry.sizeBytes;
    }
    if (stagingPath) {
      const restored = readMigrationLedger(join(stagingPath, ...DB_ENTRY.split('/')));
      if (JSON.stringify(restored) !== JSON.stringify(manifest.migrations)) {
        throw Error('EC04 : registre SQLite différent du manifeste.');
      }
    }
    return manifest;
  } finally { await file.close(); }
}

/** Integrity only. An untrusted archive's SHA256 does not prove its origin. */
export async function verifyOfflineWorkspaceArchive(archivePath: string): Promise<Ec04ArchiveManifest> {
  const tmp = mkdtempSync(join(tmpdir(), 'atoum-ec04-check-'));
  try { return await unpackAndCheck(archivePath, tmp, false); }
  finally { rmSync(tmp, {recursive: true, force: true}); }
}

/** This validates the installed bytes, not the original backup's quiescence.
 * The known SQLite/file links are checked but coverage remains incomplete.
 */
export async function verifyRestoredWorkspaceAgainstManifest(
  workspaceRoot: string, untrustedManifest: Ec04ArchiveManifest,
): Promise<{verifiedFiles: number; totalBytes: number; referencesChecked: number}> {
  return verifyRestoredWorkspaceInternal(workspaceRoot, untrustedManifest, false);
}

async function verifyRestoredWorkspaceInternal(
  workspaceRoot: string, untrustedManifest: Ec04ArchiveManifest, allowIncompleteMarker: boolean,
): Promise<{verifiedFiles: number; totalBytes: number; referencesChecked: number}> {
  const manifest = validateManifest(untrustedManifest);
  const root = resolve(workspaceRoot);
  if (!allowIncompleteMarker && existingPath(join(root, '.EC04-RESTORE-INCOMPLETE'))) {
    throw Error('EC04 : restauration interrompue ou incomplète.');
  }
  const dataDir = join(root, 'data');
  const dataStat = lstatSync(dataDir);
  if (!dataStat.isDirectory() || dataStat.isSymbolicLink()) {
    throw Error('EC04 : dossier de base SQLite non sûr.');
  }
  const dataFiles = readdirSync(dataDir);
  if (dataFiles.length !== 1 || dataFiles[0] !== 'atoumweb-manager.sqlite') {
    throw Error('EC04 : dossier SQLite avec fichiers inattendus ou annexes.');
  }
  const dbPath = join(dataDir, dataFiles[0]);
  const dbStat = lstatSync(dbPath);
  if (!dbStat.isFile() || dbStat.isSymbolicLink()) throw Error('EC04 : fichier SQLite non sûr.');
  const expectedDb = manifest.files[0];
  const actualDb = await hashFile(dbPath);
  if (actualDb.sizeBytes !== expectedDb.sizeBytes || actualDb.sha256 !== expectedDb.sha256) {
    throw Error('EC04 : contenu SQLite restauré différent du manifeste.');
  }
  const ledger = readMigrationLedger(dbPath);
  if (JSON.stringify(ledger) !== JSON.stringify(manifest.migrations)) {
    throw Error('EC04 : migrations SQLite restaurées différentes.');
  }
  const actual = await inventoryWorkspaceFiles(root);
  const expected = manifest.files.slice(1).map(entry => ({
    relativePath: entry.path.slice('workspace/'.length),
    sizeBytes: entry.sizeBytes, sha256: entry.sha256,
  }));
  if (JSON.stringify(actual.files) !== JSON.stringify(expected)) {
    throw Error('EC04 : fichiers restaurés absents, modifiés ou supplémentaires.');
  }
  const audit = auditKnownWorkspaceFileReferences(dbPath, actual);
  if (audit.issues.length) {
    throw Error('EC04 : ' + audit.issues.length + ' référence(s) fichier cassées après restauration.');
  }
  return {
    verifiedFiles: manifest.files.length, totalBytes: actualDb.sizeBytes + actual.totalBytes,
    referencesChecked: audit.checked,
  };
}

/**
 * Reserve the new destination with mkdir(EXCLUSIVE) before installing bytes.
 * rename(stage,destination) can overwrite an EMPTY directory on POSIX.
 * On interruption, an INCOMPLETE marker remains; never claim success.
 */
export async function restoreOfflineArchiveToNewWorkspace(archivePath: string, newWorkspaceRoot: string): Promise<Ec04ArchiveManifest> {
  const destination = ensureNewDestination(newWorkspaceRoot);
  const staging = mkdtempSync(join(dirname(destination), '.ec04-restore-'));
  try {
    const manifest = await unpackAndCheck(archivePath, staging);
    // Convert to canonical workspace paths while the staging tree is private.
    const data = join(staging, 'data'); mkdirSync(data);
    renameSync(join(staging, 'database', 'atoumweb-manager.sqlite'), join(data, 'atoumweb-manager.sqlite'));
    rmSync(join(staging, 'database'), {recursive: true});
    const filesRoot = join(staging, 'workspace');
    if (existsSync(filesRoot)) {
      for (const dir of WORKSPACE_FILE_ROOTS) {
        const child = join(filesRoot, dir);
        if (existsSync(child)) renameSync(child, join(staging, dir));
      }
      rmSync(filesRoot, {recursive: true});
    }
    // EEXIST refusal even for an empty destination directory.
    mkdirSync(destination, {mode: 0o700});
    const incomplete = join(destination, '.EC04-RESTORE-INCOMPLETE');
    // Do not leave an apparently usable empty workspace if the marker fails.
    // Remove ONLY the exclusively created, still-empty destination.
    try {
      writeFileSync(incomplete,
        'Restauration EC04 incomplète. Ne pas ouvrir comme workspace.\n', {flag: 'wx'});
    } catch (error) {
      try { rmdirSync(destination); }
      catch (cleanup) {
        throw new AggregateError([error, cleanup], 'EC04 : marqueur de restauration impossible et dossier non nettoyé.');
      }
      throw error;
    }
    // If a move fails, preserve incomplete destination for explicit recovery.
    for (const name of readdirSync(staging)) renameSync(join(staging, name), join(destination, name));
    // Verify the final installed filesystem BEFORE removing the incomplete marker.
    await verifyRestoredWorkspaceInternal(destination, manifest, true);
    unlinkSync(incomplete);
    return manifest;
  } finally { if (existsSync(staging)) rmSync(staging, {recursive: true, force: true}); }
}

/**
 * EC04 experimental offline relocation: produce a NEW copy of an already
 * restored, manifest-verified B1 workspace. Never edit either source or the
 * active workspace. No IPC/production entrypoint is connected to this module.
 *
 * The original B1 manifest covers the original bytes. After SQLite path
 * relocation its DB digest deliberately differs. An explicit audit receipt
 * records before/after digests; B1 verify cannot certify migrated bytes.
 */
import {createHash} from 'node:crypto';
import {
  constants, copyFileSync, existsSync, lstatSync, mkdirSync,
  readFileSync, realpathSync, rmdirSync, statSync, writeFileSync, unlinkSync,
} from 'node:fs';
import {createReadStream} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {planProjectResourceRelocations} from './WorkspaceRelocationPlan';
import {inventoryWorkspaceFiles} from './WorkspaceFileInventory';
import {inspectWorkspacePortabilityRisks} from './WorkspacePortabilityPreflight';
import {verifyRestoredWorkspaceAgainstManifest, type Ec04ArchiveManifest} from './WorkspacePortableArchive';

export const EC04_RESOURCE_FOLDERS = [
  '01 Identité', '02 Textes', '03 Images & médias',
  '04 Documents projet', '05 Technique - Sources - Exports',
  '06 Livrables', '07 Archives',
] as const;

export interface Ec04RelocatedCopyRequest {
  /** A previously restored, unchanged B1 workspace; must not be in active use. */
  restoredWorkspaceRoot: string;
  /** Logical root stored in the original SQLite projects.resource_root_path. */
  originalWorkspaceRoot: string;
  /** Absolute, NON-EXISTING destination on this machine. No in-place migration. */
  newWorkspaceRoot: string;
  originalManifest: Ec04ArchiveManifest;
}

export interface Ec04RelocationReceipt {
  format: 'ec04-relocated-copy-v1';
  originManifestId: string;
  beforeSqliteSha256: string;
  afterSqliteSha256: string;
  relocatedProjects: number;
  recreatedResourceFolders: number;
  copiedAssetFiles: number;
  /** Explicitly NOT a full application or cross-PC certification. */
  crossPcCertified: false;
  fullReferenceCoverage: false;
  portableSecretsCertified: false;
}

function within(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}

function existsIncludingDanglingLink(path: string): boolean {
  try { lstatSync(path); return true; }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false; throw e; }
}

function safeSourceFile(path: string, allowedRoot: string): void {
  if (!within(allowedRoot, path)) throw Error('EC04 : chemin source hors workspace.');
  let cursor = resolve(allowedRoot);
  const rootStat = lstatSync(cursor);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw Error('EC04 : racine source non sûre.');
  }
  const segments = relative(allowedRoot, path).split(sep);
  // Reject symlinks in EVERY parent segment, not only the leaf file.
  for (const segment of segments.slice(0, -1)) {
    cursor = join(cursor, segment);
    const st = lstatSync(cursor);
    if (!st.isDirectory() || st.isSymbolicLink()) {
      throw Error('EC04 : dossier parent source non sûr.');
    }
  }
  const st = lstatSync(path);
  if (!st.isFile() || st.isSymbolicLink()) throw Error('EC04 : source non sûre ou lien symbolique.');
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function checkDb(dbPath: string): void {
  const db = new DatabaseSync(dbPath, {readOnly: true});
  try {
    const integrity = db.prepare('PRAGMA integrity_check').get();
    if (integrity?.integrity_check !== 'ok') throw Error('EC04 : SQLite relocalisé non intègre.');
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw Error('EC04 : clés étrangères invalides.');
  } finally { db.close(); }
}

/**
 * Offline proof-of-concept: clone complete B1 file payloads, update only
 * project resource paths on the cloned SQLite, and reconstruct seven expected
 * resource subfolders per project. On ANY failure the destination is either
 * absent or retains an INCOMPLETE marker and must not be used by the app.
 */

/**
 * Read-only verification of a relocated COPY against both the unchanged B1
 * source and the explicit relocation receipt. Unlike B1 verification, its
 * SQLite digest MUST differ from the original manifest when roots change.
 * It does not authenticate the receipt or certify application bootability.
 */
async function verifyRelocatedWorkspaceInternal(
  input: Ec04RelocatedCopyRequest,
  receipt: Ec04RelocationReceipt,
  allowIncompleteMarker: boolean,
): Promise<void> {
  const from = resolve(input.restoredWorkspaceRoot);
  const to = resolve(input.newWorkspaceRoot);
  const marker = join(to, '.EC04-RELOCATION-INCOMPLETE');
  if (existsIncludingDanglingLink(marker) !== allowIncompleteMarker) {
    throw Error('EC04 : marqueur de migration incohérent.');
  }
  if (receipt.format !== 'ec04-relocated-copy-v1' ||
      receipt.originManifestId !== input.originalManifest.id ||
      receipt.beforeSqliteSha256 !== input.originalManifest.files[0]?.sha256 ||
      receipt.crossPcCertified !== false ||
      receipt.fullReferenceCoverage !== false ||
      receipt.portableSecretsCertified !== false) {
    throw Error('EC04 : reçu de relocalisation incompatible.');
  }
  await verifyRestoredWorkspaceAgainstManifest(from, input.originalManifest);
  const originalDb = join(from, 'data', 'atoumweb-manager.sqlite');
  const copiedDb = join(to, 'data', 'atoumweb-manager.sqlite');
  safeSourceFile(copiedDb, to);
  if (existsIncludingDanglingLink(copiedDb + '-wal') ||
      existsIncludingDanglingLink(copiedDb + '-shm')) {
    throw Error('EC04 : journal SQLite inattendu dans le workspace relocalisé.');
  }
  if (await sha256File(copiedDb) !== receipt.afterSqliteSha256) {
    throw Error('EC04 : empreinte SQLite relocalisée incorrecte.');
  }
  checkDb(copiedDb);
  const plan = planProjectResourceRelocations(originalDb, input.originalWorkspaceRoot, to);
  if (plan.unavailableSchema.length || plan.proposals.some(p => p.status !== 'proposed')) {
    throw Error('EC04 : plan source non relocalisable.');
  }
  const expectedAssets = input.originalManifest.files.slice(1);
  if (receipt.relocatedProjects !== plan.proposals.length ||
      receipt.recreatedResourceFolders !== plan.proposals.length * EC04_RESOURCE_FOLDERS.length ||
      receipt.copiedAssetFiles !== expectedAssets.length) {
    throw Error('EC04 : compteurs du reçu de relocalisation incorrects.');
  }
  const db = new DatabaseSync(copiedDb, {readOnly: true});
  try {
    const ledger = db.prepare('SELECT id,name FROM schema_migrations ORDER BY id').all();
    if (JSON.stringify(ledger.map(row => ({id:Number(row.id),name:String(row.name)}))) !==
        JSON.stringify(input.originalManifest.migrations)) {
      throw Error('EC04 : migrations du workspace relocalisé différentes du manifeste.');
    }
    const rows = db.prepare('SELECT id,resource_root_path FROM projects WHERE resource_root_path IS NOT NULL').all();
    if (rows.length !== plan.proposals.length || rows.some(row =>
        !plan.proposals.some(p => p.projectId === row.id &&
          p.destinationPath === row.resource_root_path))) {
      throw Error('EC04 : chemin projet relocalisé incorrect.');
    }
  } finally { db.close(); }

  for (const p of plan.proposals) {
    if (!p.destinationPath || !within(to, resolve(p.destinationPath))) {
      throw Error('EC04 : chemin de projet hors workspace.');
    }
    for (const folder of EC04_RESOURCE_FOLDERS) {
      const target = join(p.destinationPath, folder);
      if (!within(to, target)) throw Error('EC04 : dossier Ressources hors workspace.');
      let cursor = to;
      for (const segment of relative(to, target).split(sep)) {
        cursor = join(cursor, segment);
        let stat: ReturnType<typeof lstatSync>;
        try { stat = lstatSync(cursor); }
        catch { throw Error('EC04 : dossier Ressources absent ou non sûr.'); }
        if (!stat.isDirectory() || stat.isSymbolicLink()) {
          throw Error('EC04 : dossier Ressources absent ou non sûr.');
        }
      }
    }
  }
  // Independent inventory catches EXTRA files, missing files, replaced parent
  // directories, junctions, Windows-case collisions and altered file hashes.
  const inventory = await inventoryWorkspaceFiles(to);
  const expected = expectedAssets.map(e => ({
    relativePath:e.path.slice('workspace/'.length),
    sizeBytes:e.sizeBytes, sha256:e.sha256,
  })).sort((a,b)=>a.relativePath.localeCompare(b.relativePath));
  const found = inventory.files.map(e => ({
    relativePath:e.relativePath,sizeBytes:e.sizeBytes,sha256:e.sha256,
  })).sort((a,b)=>a.relativePath.localeCompare(b.relativePath));
  if (JSON.stringify(found) !== JSON.stringify(expected)) {
    throw Error('EC04 : inventaire des fichiers relocalisés différent du manifeste.');
  }
}

/** Post-migration check on an OFFLINE, non-production relocated copy. */
export async function verifyRelocatedWorkspaceCopy(
  input: Ec04RelocatedCopyRequest,
): Promise<Ec04RelocationReceipt> {
  const to = resolve(input.newWorkspaceRoot);
  const file = join(to, '.EC04-RELOCATION-RECEIPT.json');
  safeSourceFile(file, to);
  if (statSync(file).size > 16 * 1024) throw Error('EC04 : reçu de migration trop volumineux.');
  let receipt: Ec04RelocationReceipt;
  try { receipt = JSON.parse(readFileSync(file,'utf8')) as Ec04RelocationReceipt; }
  catch { throw Error('EC04 : reçu de relocalisation illisible.'); }
  if (!receipt || typeof receipt !== 'object') {
    throw Error('EC04 : structure de reçu de relocalisation incorrecte.');
  }
  await verifyRelocatedWorkspaceInternal(input, receipt, false);
  return receipt;
}

export async function createRelocatedWorkspaceCopy(
  input: Ec04RelocatedCopyRequest,
): Promise<Ec04RelocationReceipt> {
  const from = resolve(input.restoredWorkspaceRoot);
  const to = resolve(input.newWorkspaceRoot);
  const parent = dirname(to);
  if (!isAbsolute(input.newWorkspaceRoot) || to === from ||
      within(from, to) || within(to, from)) {
    throw Error('EC04 : cible non absolue, imbriquée ou identique à la source.');
  }
  if (existsIncludingDanglingLink(to)) throw Error('EC04 : destination existante — écrasement interdit.');
  const srcStat = lstatSync(from), parStat = lstatSync(parent);
  if (!srcStat.isDirectory() || srcStat.isSymbolicLink() ||
      !parStat.isDirectory() || parStat.isSymbolicLink() ||
      within(realpathSync(from), realpathSync(parent))) {
    throw Error('EC04 : racine de copie ou parent non sûr.');
  }
  // Validate the SOURCE, including SQLite/file references, before any writes.
  await verifyRestoredWorkspaceAgainstManifest(from, input.originalManifest);
  const sourceDb = join(from, 'data', 'atoumweb-manager.sqlite');
  const initialDb = input.originalManifest.files[0];
  if (initialDb.path !== 'database/atoumweb-manager.sqlite') throw Error('EC04 : manifeste SQLite non conforme.');
  const plan = planProjectResourceRelocations(sourceDb, input.originalWorkspaceRoot, to);
  if (plan.unavailableSchema.length || plan.proposals.some(row => row.status !== 'proposed')) {
    throw Error('EC04 : chemins projet non relocalisables automatiquement — examen manuel requis.');
  }
  const portability = inspectWorkspacePortabilityRisks(sourceDb, input.originalWorkspaceRoot);
  if (portability.unavailableSchema.length || portability.encryptedSecretCount) {
    throw Error('EC04 : schéma incomplet ou secrets Windows nécessitant un transfert manuel.');
  }
  const assets = input.originalManifest.files.slice(1);
  // Exclusive creation: do not overwrite even an existing EMPTY directory.
  mkdirSync(to, {mode:0o700});
  const incomplete = join(to, '.EC04-RELOCATION-INCOMPLETE');
  // A failed marker creation must never leave behind an apparently valid
  // empty workspace. Remove ONLY the newly created empty directory.
  try {
    writeFileSync(incomplete, 'Copie EC04 en préparation. Ne pas ouvrir ce workspace.\n', {flag:'wx'});
  } catch (error) {
    try { rmdirSync(to); }
    catch (cleanup) {
      throw new AggregateError([error, cleanup], 'EC04 : marqueur impossible et dossier non nettoyé.');
    }
    throw error;
  }
  try {
    const newData = join(to, 'data');
    mkdirSync(newData);
    safeSourceFile(sourceDb, from);
    const newDbPath = join(newData, 'atoumweb-manager.sqlite');
    copyFileSync(sourceDb, newDbPath, constants.COPYFILE_EXCL);
    if (await sha256File(newDbPath) !== initialDb.sha256 ||
        await sha256File(sourceDb) !== initialDb.sha256) {
      throw Error('EC04 : copie SQLite différente du manifeste.');
    }
    // Copy only manifest-listed files; avoid symlink dereferencing and
    // refuse unexpected directory roots through the source verifier.
    for (const asset of assets) {
      if (!asset.path.startsWith('workspace/')) throw Error('EC04 : entrée de ressource incorrecte.');
      const rel = asset.path.slice('workspace/'.length);
      const src = resolve(from, ...rel.split('/'));
      const dest = resolve(to, ...rel.split('/'));
      if (!within(from, src) || !within(to, dest)) throw Error('EC04 : chemin sortant du workspace.');
      safeSourceFile(src, from);
      mkdirSync(dirname(dest), {recursive:true});
      copyFileSync(src, dest, constants.COPYFILE_EXCL);
      if (await sha256File(dest) !== asset.sha256) throw Error('EC04 : fichier copié altéré.');
    }
    // Detect mutation of the source while the copy was being built.
    await verifyRestoredWorkspaceAgainstManifest(from, input.originalManifest);
    const newPlan = planProjectResourceRelocations(newDbPath, input.originalWorkspaceRoot, to);
    if (JSON.stringify(newPlan.proposals) !== JSON.stringify(plan.proposals)) {
      throw Error('EC04 : les chemins SQLite ont changé pendant la copie.');
    }
    const db = new DatabaseSync(newDbPath);
    try {
      db.exec('PRAGMA journal_mode=DELETE; PRAGMA foreign_keys=ON; BEGIN IMMEDIATE');
      try {
        const update = db.prepare('UPDATE projects SET resource_root_path=? WHERE id=?');
        for (const p of plan.proposals) {
          if (!p.destinationPath || p.status !== 'proposed') throw Error('EC04 : plan refusé.');
          const result = update.run(p.destinationPath, p.projectId);
          if (result.changes !== 1) throw Error('EC04 : projet absent lors du transfert.');
        }
        const actual = db.prepare('SELECT id,resource_root_path FROM projects WHERE resource_root_path IS NOT NULL').all();
        if (actual.length !== plan.proposals.length || actual.some(row =>
          !plan.proposals.some(p => p.projectId === row.id && p.destinationPath === row.resource_root_path)
        )) throw Error('EC04 : nouvelles racines SQLite incorrectes.');
        if (db.prepare('PRAGMA foreign_key_check').all().length) throw Error('EC04 : FK invalides.');
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    } finally { db.close(); }
    if (existsSync(newDbPath + '-wal') || existsSync(newDbPath + '-shm')) {
      throw Error('EC04 : fichiers SQLite annexes inattendus.');
    }
    checkDb(newDbPath);
    let recreatedResourceFolders = 0;
    for (const p of plan.proposals) {
      if (!p.destinationPath) throw Error('EC04 : dossier projet sans cible.');
      // Path is a previously checked absolute path within the new workspace.
      if (!within(to, resolve(p.destinationPath))) throw Error('EC04 : dossier projet hors cible.');
      for (const folder of EC04_RESOURCE_FOLDERS) {
        const target = join(p.destinationPath, folder);
        if (existsIncludingDanglingLink(target)) {
          const stat = lstatSync(target);
          if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('EC04 : dossier Ressources incompatible.');
        } else mkdirSync(target, {recursive:true});
        recreatedResourceFolders++;
      }
    }
    // Recheck all copied file payloads after directory creation / SQLite work.
    for (const asset of assets) {
      const path = join(to, ...asset.path.split('/').slice(1));
      safeSourceFile(path, to);
      if (await sha256File(path) !== asset.sha256) throw Error('EC04 : ressource modifiée après migration.');
    }
    const afterSqliteSha256 = await sha256File(newDbPath);
    const receipt: Ec04RelocationReceipt = {
      format:'ec04-relocated-copy-v1', originManifestId:input.originalManifest.id,
      beforeSqliteSha256:initialDb.sha256, afterSqliteSha256,
      relocatedProjects:plan.proposals.length, recreatedResourceFolders,
      copiedAssetFiles:assets.length, crossPcCertified:false,
      fullReferenceCoverage:false, portableSecretsCertified:false,
    };
    // Receipt acknowledges intentional DB hash change. It is NOT the B1
    // manifest and DOES NOT authenticate a restored application.
    writeFileSync(join(to, '.EC04-RELOCATION-RECEIPT.json'), JSON.stringify(receipt,null,2), {flag:'wx'});
    await verifyRelocatedWorkspaceInternal(input, receipt, true);
    unlinkSync(incomplete);
    return receipt;
  } catch (e) {
    // Deliberately keep the incomplete destination for manual inspection.
    throw e;
  }
}

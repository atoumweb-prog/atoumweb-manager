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
  realpathSync, writeFileSync, unlinkSync,
} from 'node:fs';
import {createReadStream} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {planProjectResourceRelocations} from './WorkspaceRelocationPlan';
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

function safeSourceFile(path: string): void {
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
  writeFileSync(incomplete, 'Copie EC04 en préparation. Ne pas ouvrir ce workspace.\n', {flag:'wx'});
  try {
    const newData = join(to, 'data');
    mkdirSync(newData);
    safeSourceFile(sourceDb);
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
      safeSourceFile(src);
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
      safeSourceFile(path);
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
    unlinkSync(incomplete);
    return receipt;
  } catch (e) {
    // Deliberately keep the incomplete destination for manual inspection.
    throw e;
  }
}

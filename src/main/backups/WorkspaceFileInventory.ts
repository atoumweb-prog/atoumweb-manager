/**
 * EC04: read-only, bounded-memory inventory of workspace-owned file trees.
 *
 * This is NOT a backup, a consistency barrier, or a SQLite/file-reference audit.
 * It neither opens the active SQLite database nor copies/restores any data.
 * A future snapshot coordinator must freeze writers and verify DB references
 * before treating these records as a complete workspace backup manifest.
 */
import { createHash } from 'node:crypto';
import {
  closeSync, constants, createReadStream, fstatSync, lstatSync,
  openSync, readdirSync, realpathSync,
  type Stats,
} from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

/** Explicitly owned file trees; data, backups and Electron userData are excluded. */
export const WORKSPACE_FILE_ROOTS = [
  'crm-identites',
  'clients',
  'projets-internes',
  'projets-previsionnels',
  'depenses',
  'bibliotheque-atoumweb',
  'bridge',
  'exports',
] as const;

export type WorkspaceFileRoot = (typeof WORKSPACE_FILE_ROOTS)[number];

export interface WorkspaceFileEntry {
  /** Forward-slash path relative to workspace root. Never an absolute Windows path. */
  relativePath: string;
  sizeBytes: number;
  sha256: string;
}

export interface WorkspaceFileInventory {
  version: 1;
  files: WorkspaceFileEntry[];
  scannedRoots: WorkspaceFileRoot[];
  missingRoots: WorkspaceFileRoot[];
  totalBytes: number;
  /** Not yet cross-checked against SQLite: never interpret as backup complete. */
  referencesVerified: false;
}

const forbiddenWinName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;
const forbiddenSegment = /[<>:"\\|?*\u0000-\u001f]/;

/** Validate archive-relative paths before trusting any discovered name. */
export function checkedWorkspaceRelativePath(parts: readonly string[]): string {
  if (!parts.length) throw new Error('EC04 : chemin de fichier vide.');
  for (const part of parts) {
    if (!part || part === '.' || part === '..' || part.endsWith(' ') || part.endsWith('.') ||
        forbiddenSegment.test(part) || forbiddenWinName.test(part) || part.includes('/')) {
      throw new Error('EC04 : nom de fichier incompatible avec une restauration Windows sûre.');
    }
  }
  const value = parts.join('/');
  if (isAbsolute(value) || value.startsWith('/')) throw new Error('EC04 : chemin absolu refusé.');
  return value;
}

function inside(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function sameFile(before: Stats, after: Stats): boolean {
  return before.isFile() && after.isFile() &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs;
}

async function hashStableFile(file: string): Promise<{sizeBytes: number; sha256: string}> {
  const before = lstatSync(file);
  if (!before.isFile() || before.isSymbolicLink() || !Number.isSafeInteger(before.size)) {
    throw new Error('EC04 : fichier non ordinaire ou taille invalide.');
  }
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fstatSync(fd);
    if (!sameFile(before, opened)) throw new Error('EC04 : fichier modifié avant lecture.');
    const hash = createHash('sha256');
    let readBytes = 0;
    // Keep memory bounded even for large project archives.
    for await (const chunk of createReadStream(file, {fd, autoClose: false, highWaterMark: 256 * 1024})) {
      hash.update(chunk);
      readBytes += chunk.length;
    }
    const after = lstatSync(file);
    if (!sameFile(before, after) || !sameFile(before, fstatSync(fd)) || readBytes !== before.size) {
      throw new Error('EC04 : fichier modifié pendant l’inventaire.');
    }
    return {sizeBytes: before.size, sha256: hash.digest('hex')};
  } finally {
    closeSync(fd);
  }
}

/**
 * Read-only scanner used by the future EC04 capture coordinator.
 * Missing optional roots are reported, not silently invented.
 * Symlinks / junctions, unsupported file kinds, unsafe names and case collisions fail closed.
 * No writes to the workspace, no real workspace discovery and no SQLite access.
 */
export async function inventoryWorkspaceFiles(workspaceRoot: string): Promise<WorkspaceFileInventory> {
  const root = resolve(workspaceRoot);
  const rootInfo = lstatSync(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error('EC04 : la racine doit être un véritable répertoire.');
  }
  const realRoot = realpathSync.native(root);
  const files: WorkspaceFileEntry[] = [];
  const scannedRoots: WorkspaceFileRoot[] = [];
  const missingRoots: WorkspaceFileRoot[] = [];
  const collisionKeys = new Set<string>();
  let totalBytes = 0;

  async function walk(directory: string, segments: string[]): Promise<void> {
    const real = realpathSync.native(directory);
    if (!inside(realRoot, real)) throw new Error('EC04 : dossier hors workspace refusé.');
    const children = readdirSync(directory, {withFileTypes: true}).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const child of children) {
      const parts = [...segments, child.name];
      const archivePath = checkedWorkspaceRelativePath(parts);
      const key = archivePath.normalize('NFC').toLowerCase();
      if (collisionKeys.has(key)) throw new Error('EC04 : collision de noms Windows dans le workspace.');
      collisionKeys.add(key);
      const absolute = join(directory, child.name);
      const details = lstatSync(absolute);
      if (details.isSymbolicLink()) throw new Error('EC04 : lien symbolique ou jonction refusé.');
      if (!inside(realRoot, realpathSync.native(absolute))) {
        throw new Error('EC04 : ressource externe au workspace refusée.');
      }
      if (details.isDirectory()) {
        await walk(absolute, parts);
      } else if (details.isFile()) {
        const {sizeBytes, sha256} = await hashStableFile(absolute);
        totalBytes += sizeBytes;
        if (!Number.isSafeInteger(totalBytes)) throw new Error('EC04 : volume total trop élevé.');
        files.push({relativePath: archivePath, sizeBytes, sha256});
      } else {
        throw new Error('EC04 : type de ressource non pris en charge.');
      }
    }
  }

  for (const name of WORKSPACE_FILE_ROOTS) {
    const directory = join(root, name);
    let details: Stats;
    try { details = lstatSync(directory); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') { missingRoots.push(name); continue; }
      throw error;
    }
    if (!details.isDirectory() || details.isSymbolicLink()) {
      throw new Error('EC04 : racine de fichiers non sûre.');
    }
    scannedRoots.push(name);
    await walk(directory, [name]);
  }
  return {version: 1, files, scannedRoots, missingRoots, totalBytes, referencesVerified: false};
}

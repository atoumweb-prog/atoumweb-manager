import {openReadOnlyWorkspaceSnapshot} from './WorkspaceSnapshotDatabase';
/**
 * EC04: read-only project resource-root relocation PROPOSALS, never updates.
 * A proposal is not a validated restoration or permission to rewrite SQLite.
 * Only workspace-owned Ressources paths can be proposed. Existing external
 * roots, OS-bound secrets and paths absent from the inventory need review.
 */
import {relative, win32, posix} from 'node:path';
import {checkedWorkspaceRelativePath} from './WorkspaceFileInventory';

export type Ec04RelocationProblem =
  | 'missing-schema' | 'invalid-workspace-root' | 'invalid-resource-path'
  | 'external-resource-root' | 'unexpected-resource-root'
  | 'conflicting-resource-roots';

export interface Ec04ResourceRelocation {
  projectId: string;
  status: 'proposed' | 'manual-review';
  /** Relative path safe to append under a NEW workspace; proposals only. */
  relativePath?: string;
  /** Proposed absolute location, never written to SQLite here. */
  destinationPath?: string;
  problem?: Ec04RelocationProblem;
}

export interface Ec04RelocationPlan {
  proposals: readonly Ec04ResourceRelocation[];
  inspectedProjects: number;
  readyForAutomaticMigration: false;
  sqliteChanged: false;
  /** Empty folders are NOT currently serialized by the B1 archive. */
  emptyDirectoriesPreserved: false;
  unavailableSchema: readonly string[];
}

function absolutePlatformPath(value: string): 'win' | 'posix' | null {
  if (value.startsWith('/') && !value.startsWith('//')) return 'posix';
  if (/^[a-zA-Z]:[\\/]/.test(value)) return 'win';
  return null;
}

function unsafeRoot(value: string): boolean {
  return !value.trim() || /\0/.test(value) || value.startsWith('//') || value.startsWith('\\\\?\\') ||
    value.startsWith('\\\\.\\') || value.startsWith('\\\\') ||
    /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(value) ||
    /^[a-zA-Z]:[^\\/]/.test(value);
}

function normalizedRelative(resource: string, workspace: string): string | Ec04RelocationProblem {
  if (unsafeRoot(resource) || unsafeRoot(workspace)) return 'invalid-resource-path';
  const basePlatform = absolutePlatformPath(workspace);
  const resourcePlatform = absolutePlatformPath(resource);
  if (!basePlatform || !resourcePlatform) return 'invalid-resource-path';
  if (basePlatform !== resourcePlatform) return 'external-resource-root';
  const flavor = basePlatform === 'win' ? win32 : posix;
  const base = flavor.resolve(workspace);
  const candidate = flavor.resolve(resource);
  const diff = flavor.relative(base, candidate);
  const pathSeparator = basePlatform === 'win' ? '\\' : '/';
  if (!diff || diff === '..' || diff.startsWith('..' + pathSeparator) || flavor.isAbsolute(diff)) {
    return 'external-resource-root';
  }
  const segments = diff.split(pathSeparator);
  let checked: string;
  try { checked = checkedWorkspaceRelativePath(segments); }
  catch { return 'invalid-resource-path'; }
  if (checked !== checked.normalize('NFC')) return 'invalid-resource-path';
  if (!['clients','projets-internes','projets-previsionnels'].includes(segments[0]) ||
    segments.length < 3 || segments[segments.length - 1] !== 'Ressources') {
    return 'unexpected-resource-root';
  }
  return checked;
}

/**
 * Strictly informational. Uses readonly SQLite and refuses unknown source
 * roots, unsafe path segments and cross-project target collisions.
 */
export function planProjectResourceRelocations(
  sqliteSnapshot: string, sourceWorkspace: string, newWorkspace: string,
): Ec04RelocationPlan {
  const unavailableSchema: string[] = [];
  const proposals: Ec04ResourceRelocation[] = [];
  const targetPlatform = absolutePlatformPath(newWorkspace);
  const sourcePlatform = absolutePlatformPath(sourceWorkspace);
  if (!targetPlatform || !sourcePlatform || unsafeRoot(sourceWorkspace) || unsafeRoot(newWorkspace)) {
    throw new Error('EC04 : workspace source ou destination non absolu ou non sûr.');
  }
  const db = openReadOnlyWorkspaceSnapshot(sqliteSnapshot);
  try {
    const schema = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
    const columns = schema ? new Set(db.prepare('PRAGMA table_info("projects")').all().map(row=>String(row.name))) : new Set<string>();
    if (!columns.has('id') || !columns.has('resource_root_path')) {
      unavailableSchema.push('projects.resource_root_path');
      return {proposals, inspectedProjects:0, readyForAutomaticMigration:false,
        sqliteChanged:false, emptyDirectoriesPreserved:false, unavailableSchema};
    }
    const chosen = new Map<string, number[]>();
    for (const row of db.prepare('SELECT id,resource_root_path FROM projects WHERE resource_root_path IS NOT NULL ORDER BY id').iterate()) {
      const projectId = String(row.id);
      const resource = typeof row.resource_root_path === 'string' ? row.resource_root_path : '';
      const rel = normalizedRelative(resource, sourceWorkspace);
      if (rel === 'invalid-resource-path' || rel === 'external-resource-root' || rel === 'unexpected-resource-root') {
        proposals.push({projectId,status:'manual-review',problem:rel});
        continue;
      }
      const pathType = targetPlatform === 'win' ? win32 : posix;
      const target = pathType.resolve(newWorkspace, ...rel.split('/'));
      // Defensive second containment check (and Windows case-insensitive folding).
      const relCheck = pathType.relative(pathType.resolve(newWorkspace),target);
      if (relCheck === '..' || relCheck.startsWith(targetPlatform==='win'?'..\\':'../') || pathType.isAbsolute(relCheck)) {
        proposals.push({projectId,status:'manual-review',problem:'invalid-resource-path'});
        continue;
      }
      const index = proposals.length;
      proposals.push({projectId,status:'proposed',relativePath:rel,destinationPath:target});
      const key = rel.normalize('NFC').toLowerCase();
      const group = chosen.get(key) ?? [];
      group.push(index);
      chosen.set(key,group);
    }
    // Do not propose two different projects writing to the same resource folder.
    for (const indices of chosen.values()) {
      if (indices.length < 2) continue;
      for (const index of indices) proposals[index] = {
        projectId:proposals[index].projectId,status:'manual-review',problem:'conflicting-resource-roots',
      };
    }
  } finally { db.close(); }
  return {proposals, inspectedProjects:proposals.length,
    readyForAutomaticMigration:false, sqliteChanged:false,
    emptyDirectoriesPreserved:false, unavailableSchema};
}

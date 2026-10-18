import {openReadOnlyWorkspaceSnapshot} from './WorkspaceSnapshotDatabase';
/**
 * EC04 diagnostic only. A valid snapshot does not imply cross-PC portability.
 * Reads a SQLite snapshot with a read-only connection: never touches source DB.
 * In particular, Windows safeStorage/DPAPI encrypted strings cannot simply be
 * decrypted on another machine. Never persist decrypted secrets in an archive.
 */
import {isAbsolute, relative, resolve, sep, win32} from 'node:path';

export type Ec04PortabilityRisk =
  | 'root-outside-workspace'
  | 'absolute-root-needs-relocation'
  | 'relative-root-needs-normalization'
  | 'invalid-resource-root'
  | 'windows-encrypted-secret';

export interface Ec04PortabilityFinding {
  readonly kind: Ec04PortabilityRisk;
  readonly recordId: string;
  readonly table: 'projects' | 'project_node_secrets';
}

export interface Ec04PortabilityPreflight {
  readonly findings: readonly Ec04PortabilityFinding[];
  readonly inspectedProjects: number;
  readonly encryptedSecretCount: number;
  readonly unavailableSchema: readonly string[];
  readonly crossPcCertified: false;
  readonly completeReferenceCoverage: false;
}

function pathWithin(parent: string, child: string, windows: boolean): boolean {
  const path = windows ? win32 : {relative, isAbsolute};
  const delta = path.relative(parent, child);
  return delta === '' || (delta !== '..' && !delta.startsWith(windows ? '..\\' : '..' + sep) && !path.isAbsolute(delta));
}

export function inspectWorkspacePortabilityRisks(
  sqliteSnapshot: string, workspaceRoot: string,
): Ec04PortabilityPreflight {
  const db = openReadOnlyWorkspaceSnapshot(sqliteSnapshot);
  const findings: Ec04PortabilityFinding[] = [];
  const unavailableSchema: string[] = [];
  let inspectedProjects = 0, encryptedSecretCount = 0;
  try {
    const hasColumns = (table: string, columns: string[]): boolean => {
      if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)) return false;
      const existing = new Set(db.prepare('PRAGMA table_info("'+table+'")').all().map(row => String(row.name)));
      return columns.every(column => existing.has(column));
    };
    if (hasColumns('projects', ['id', 'resource_root_path'])) {
      const nativeRoot = resolve(workspaceRoot);
      for (const row of db.prepare('SELECT id,resource_root_path FROM projects WHERE resource_root_path IS NOT NULL').iterate()) {
        inspectedProjects++;
        const root = String(row.resource_root_path);
        let kind: Ec04PortabilityRisk;
        const windows = win32.isAbsolute(root) || /^[a-zA-Z]:/.test(root);
        if (!root.trim() || root.includes('\0')) kind = 'invalid-resource-root';
        else if (windows) {
          const workspaceIsWindows = win32.isAbsolute(workspaceRoot);
          kind = workspaceIsWindows && pathWithin(win32.resolve(workspaceRoot), win32.resolve(root), true)
            ? 'absolute-root-needs-relocation' : 'root-outside-workspace';
        } else if (isAbsolute(root)) {
          kind = pathWithin(nativeRoot, resolve(root), false)
            ? 'absolute-root-needs-relocation' : 'root-outside-workspace';
        } else {
          // ProjectResourceService uses this path directly for mkdir/copy.
          // A relative string in SQLite is not necessarily relative to workspaceRoot.
          kind = 'relative-root-needs-normalization';
        }
        findings.push({table: 'projects', recordId: String(row.id), kind});
      }
    } else unavailableSchema.push('projects.resource_root_path');

    if (hasColumns('project_node_secrets', ['id', 'secret_ciphertext'])) {
      for (const row of db.prepare("SELECT id FROM project_node_secrets WHERE secret_ciphertext IS NOT NULL AND TRIM(secret_ciphertext) != ''").iterate()) {
        encryptedSecretCount++;
        findings.push({table: 'project_node_secrets', recordId: String(row.id), kind: 'windows-encrypted-secret'});
      }
    } else unavailableSchema.push('project_node_secrets.secret_ciphertext');
  } finally { db.close(); }
  return {findings, inspectedProjects, encryptedSecretCount, unavailableSchema,
    crossPcCertified:false, completeReferenceCoverage:false};
}

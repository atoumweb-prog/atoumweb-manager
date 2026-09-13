import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import {
  PROJECT_RESOURCE_FOLDERS,
  PROJECT_RESOURCE_ROLES,
  PROJECT_RESOURCE_STATUSES,
  type ProjectResource,
  type ProjectResourceFolder,
  type ProjectResourceRole,
  type ProjectResourceStatus,
} from '../../shared/projects';

const FOLDER_NAMES: Record<ProjectResourceFolder, string> = {
  identity: '01 Identité',
  texts: '02 Textes',
  media: '03 Images & médias',
  documents: '04 Documents projet',
  technical: '05 Technique - Sources - Exports',
  deliverables: '06 Livrables',
  archives: '07 Archives',
};

interface ResourceRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  client_account_id: string | null;
  relative_path: string;
  original_name: string;
  resource_folder: ProjectResourceFolder;
  resource_status: ProjectResourceStatus;
  content_role: ProjectResourceRole;
  mime_type: string | null;
  size_bytes: number | null;
  checksum_sha256: string | null;
  created_at: string;
  updated_at: string;
  missing_at: string | null;
}

interface ProjectResourceRow extends Record<string, unknown> {
  id: string;
  client_account_id: string | null;
  resource_root_path: string | null;
}

export class ProjectResourceService {
  constructor(private readonly database: DatabaseAdapter, private readonly workspace: WorkspacePaths) {}

  list(projectId: string): ProjectResource[] {
    this.requireProject(projectId);
    return this.database
      .all<ResourceRow>('SELECT * FROM file_assets WHERE project_id=? ORDER BY created_at DESC', [projectId])
      .map((row) => this.map(row));
  }

  get(id: string): ProjectResource {
    const row = this.database.get<ResourceRow>('SELECT * FROM file_assets WHERE id=?', [id]);
    if (!row) throw new Error('Ressource introuvable.');
    return this.map(row);
  }

  importFilePaths(projectId: string, sourcePaths: string[], folder: ProjectResourceFolder, contentRole: ProjectResourceRole = 'other'): ProjectResource[] {
    if (!PROJECT_RESOURCE_FOLDERS.includes(folder)) throw new Error('Dossier Ressources invalide.');
    if (!PROJECT_RESOURCE_ROLES.includes(contentRole)) throw new Error('Rôle de ressource invalide.');
    const project = this.requireProject(projectId);
    if (!project.resource_root_path) throw new Error('Le projet ne possède pas de dossier Ressources.');
    if (!sourcePaths.length) return this.list(projectId);

    const targetDirectory = join(project.resource_root_path, FOLDER_NAMES[folder]);
    mkdirSync(targetDirectory, { recursive: true });

    for (const sourcePath of sourcePaths) {
      const source = resolve(sourcePath);
      if (!existsSync(source) || !statSync(source).isFile()) continue;

      const sourceName = basename(source);
      const sourceChecksum = this.checksum(source);
      const existingSameChecksum = this.database.get<ResourceRow>(
        'SELECT * FROM file_assets WHERE project_id=? AND checksum_sha256=? LIMIT 1',
        [projectId, sourceChecksum],
      );
      if (existingSameChecksum) continue;

      const destination = this.uniqueDestination(targetDirectory, sourceName);
      if (resolve(source) !== resolve(destination)) copyFileSync(source, destination);
      const stats = statSync(destination);
      const now = new Date().toISOString();
      const relativePath = relative(this.workspace.root, destination);

      this.database.run(
        `INSERT INTO file_assets (
          id, project_id, client_account_id, relative_path, original_name,
          resource_folder, resource_status, content_role, mime_type,
          size_bytes, checksum_sha256, created_at, updated_at, missing_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NULL)`,
        [
          randomUUID(), projectId, project.client_account_id, relativePath, sourceName,
          folder, 'received', contentRole, this.mimeType(sourceName), Number(stats.size),
          sourceChecksum, now, now,
        ],
      );
    }

    return this.list(projectId);
  }

  updateStatus(id: string, status: ProjectResourceStatus): ProjectResource {
    if (!PROJECT_RESOURCE_STATUSES.includes(status)) throw new Error('Statut de ressource invalide.');
    this.get(id);
    this.database.run('UPDATE file_assets SET resource_status=?, updated_at=? WHERE id=?', [status, new Date().toISOString(), id]);
    return this.get(id);
  }

  updateRole(id: string, role: ProjectResourceRole): ProjectResource {
    if (!PROJECT_RESOURCE_ROLES.includes(role)) throw new Error('Rôle de ressource invalide.');
    this.get(id);
    this.database.run('UPDATE file_assets SET content_role=?, updated_at=? WHERE id=?', [role, new Date().toISOString(), id]);
    return this.get(id);
  }

  linkToNode(id: string, nodeId: string): ProjectResource {
    const resource = this.get(id);
    const node = this.database.get<{ project_id: string }>('SELECT project_id FROM project_nodes WHERE id=?', [nodeId]);
    if (!node || node.project_id !== resource.projectId) throw new Error('La tâche choisie n’appartient pas à ce projet.');
    this.database.run(
      'INSERT OR IGNORE INTO file_asset_links (id,file_asset_id,project_node_id,created_at) VALUES (?,?,?,?)',
      [randomUUID(), id, nodeId, new Date().toISOString()],
    );
    return this.get(id);
  }

  unlinkFromNode(id: string, nodeId: string): ProjectResource {
    this.get(id);
    this.database.run('DELETE FROM file_asset_links WHERE file_asset_id=? AND project_node_id=?', [id, nodeId]);
    return this.get(id);
  }

  relocalize(id: string, replacementPath: string): ProjectResource {
    const resource = this.get(id);
    const source = resolve(replacementPath);
    if (!existsSync(source) || !statSync(source).isFile()) throw new Error('Le fichier choisi est introuvable.');

    const currentAbsolute = this.absolutePath(resource);
    const destination = existsSync(currentAbsolute) ? this.uniqueDestination(dirname(currentAbsolute), basename(source)) : currentAbsolute;
    mkdirSync(dirname(destination), { recursive: true });
    if (resolve(source) !== resolve(destination)) copyFileSync(source, destination);
    const stats = statSync(destination);
    const now = new Date().toISOString();
    this.database.run(
      `UPDATE file_assets SET relative_path=?, original_name=?, mime_type=?, size_bytes=?, checksum_sha256=?, missing_at=NULL, updated_at=? WHERE id=?`,
      [relative(this.workspace.root, destination), basename(source), this.mimeType(source), Number(stats.size), this.checksum(destination), now, id],
    );
    return this.get(id);
  }

  absolutePath(resourceOrId: ProjectResource | string): string {
    const resource = typeof resourceOrId === 'string' ? this.get(resourceOrId) : resourceOrId;
    return resolve(this.workspace.root, resource.relativePath);
  }

  projectResourceRoot(projectId: string): string {
    const project = this.requireProject(projectId);
    if (!project.resource_root_path) throw new Error('Le projet ne possède pas de dossier Ressources.');
    return project.resource_root_path;
  }

  private requireProject(id: string): ProjectResourceRow {
    const row = this.database.get<ProjectResourceRow>('SELECT id,client_account_id,resource_root_path FROM projects WHERE id=?', [id]);
    if (!row) throw new Error('Projet introuvable.');
    return row;
  }

  private map(row: ResourceRow): ProjectResource {
    const linkedNodeIds = this.database
      .all<{ project_node_id: string }>('SELECT project_node_id FROM file_asset_links WHERE file_asset_id=? ORDER BY created_at', [row.id])
      .map((link) => link.project_node_id);
    const absolute = resolve(this.workspace.root, row.relative_path);
    const missing = !existsSync(absolute);
    if (missing && !row.missing_at) {
      this.database.run('UPDATE file_assets SET missing_at=?, updated_at=? WHERE id=?', [new Date().toISOString(), new Date().toISOString(), row.id]);
    } else if (!missing && row.missing_at) {
      this.database.run('UPDATE file_assets SET missing_at=NULL, updated_at=? WHERE id=?', [new Date().toISOString(), row.id]);
    }
    return {
      id: row.id,
      projectId: row.project_id,
      clientAccountId: row.client_account_id,
      relativePath: row.relative_path,
      fileName: row.original_name,
      folder: row.resource_folder,
      status: row.resource_status,
      contentRole: row.content_role,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      checksumSha256: row.checksum_sha256,
      missing,
      linkedNodeIds,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private checksum(path: string): string {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  }

  private uniqueDestination(directory: string, fileName: string): string {
    const extension = extname(fileName);
    const stem = extension ? fileName.slice(0, -extension.length) : fileName;
    let candidate = join(directory, fileName);
    let index = 2;
    while (existsSync(candidate)) {
      candidate = join(directory, `${stem} (${index})${extension}`);
      index += 1;
    }
    return candidate;
  }

  private mimeType(fileName: string): string | null {
    const extension = extname(fileName).toLowerCase();
    const known: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
      '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain', '.md': 'text/markdown', '.json': 'application/json',
      '.css': 'text/css', '.js': 'text/javascript', '.ts': 'text/typescript', '.tsx': 'text/tsx', '.php': 'text/x-php',
      '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.zip': 'application/zip',
    };
    return known[extension] ?? null;
  }
}

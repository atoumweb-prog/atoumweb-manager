import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import type { ProjectTechnicalReuseExportResult } from '../../shared/projects';

interface ItemRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  category: string;
  name: string;
  description: string | null;
  tags_json: string;
  archived_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  id: string;
  technical_item_id: string;
  version_number: number;
  content_type: string;
  language: string | null;
  content_text: string | null;
  notes: string | null;
  is_current: number;
  is_stable: number;
  created_at: string;
}

interface ProjectRow extends Record<string, unknown> {
  id: string;
  project_number: string;
  name: string;
  client_account_id: string | null;
  resource_root_path: string | null;
}

interface AssetRow extends Record<string, unknown> {
  id: string;
  original_name: string;
  relative_path: string;
  resource_folder: string;
  resource_status: string;
  content_role: string;
  checksum_sha256: string | null;
}

export class ProjectReuseExportService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
  ) {}

  prepare(itemId: string, requestedVersionId?: string | null): ProjectTechnicalReuseExportResult {
    const item = this.database.get<ItemRow>(
      `SELECT id,project_id,category,name,description,tags_json,archived_at
       FROM technical_items WHERE id=? AND scope='project'`,
      [itemId],
    );
    if (!item) throw new Error('Élément technique projet introuvable.');
    if (item.archived_at) throw new Error('Un élément technique archivé ne peut pas être préparé pour réutilisation.');

    const project = this.database.get<ProjectRow>(
      `SELECT id,project_number,name,client_account_id,resource_root_path
       FROM projects WHERE id=?`,
      [item.project_id],
    );
    if (!project || !project.resource_root_path) throw new Error('Le projet ne possède pas de dossier Ressources exploitable.');

    const versions = this.database.all<VersionRow>(
      `SELECT id,technical_item_id,version_number,content_type,language,content_text,notes,is_current,is_stable,created_at
       FROM technical_item_versions WHERE technical_item_id=? ORDER BY version_number DESC`,
      [itemId],
    );
    const version = requestedVersionId
      ? versions.find((candidate) => candidate.id === requestedVersionId)
      : versions.find((candidate) => Boolean(candidate.is_stable))
        ?? versions.find((candidate) => Boolean(candidate.is_current))
        ?? versions[0];
    if (!version) throw new Error('Aucune version technique à exporter.');
    if (requestedVersionId && version.id !== requestedVersionId) throw new Error('La version demandée n’appartient pas à cet élément technique.');

    const linkedAssets = this.database.all<AssetRow>(
      `SELECT fa.id,fa.original_name,fa.relative_path,fa.resource_folder,fa.resource_status,fa.content_role,fa.checksum_sha256
       FROM technical_item_assets tia
       JOIN file_assets fa ON fa.id=tia.file_asset_id
       WHERE tia.technical_item_version_id=?
       ORDER BY fa.original_name COLLATE NOCASE`,
      [version.id],
    );

    const createdAt = new Date().toISOString();
    const packageData = {
      schemaVersion: 1,
      purpose: 'manual_adaptation_for_atoumweb_library',
      generatedAt: createdAt,
      safety: {
        automaticGeneralization: false,
        automaticGlobalLibraryCreation: false,
        note: 'Ce paquet est une copie de référence destinée à une adaptation manuelle ou assistée. Le code du projet client reste indépendant.',
      },
      project: {
        id: project.id,
        number: project.project_number,
        name: project.name,
      },
      technicalItem: {
        id: item.id,
        category: item.category,
        name: item.name,
        description: item.description,
        tags: this.parseTags(item.tags_json),
      },
      version: {
        id: version.id,
        number: Number(version.version_number),
        current: Boolean(version.is_current),
        stable: Boolean(version.is_stable),
        contentType: version.content_type,
        language: version.language,
        content: version.content_text,
        notes: version.notes,
        createdAt: version.created_at,
      },
      linkedResources: linkedAssets.map((asset) => ({
        id: asset.id,
        fileName: asset.original_name,
        relativePath: asset.relative_path,
        folder: asset.resource_folder,
        status: asset.resource_status,
        role: asset.content_role,
        checksumSha256: asset.checksum_sha256,
      })),
    };

    const directory = join(project.resource_root_path, '05 Technique - Sources - Exports');
    mkdirSync(directory, { recursive: true });
    const timestamp = createdAt.replace(/[:.]/g, '-');
    const fileName = `Réutilisation - ${this.safeSegment(item.name)} - v${Number(version.version_number)} - ${timestamp}.json`;
    const destination = join(directory, fileName);
    const content = `${JSON.stringify(packageData, null, 2)}\n`;
    writeFileSync(destination, content, 'utf8');

    const stats = statSync(destination);
    const checksum = createHash('sha256').update(content, 'utf8').digest('hex');
    const resourceId = randomUUID();
    const relativePath = relative(this.workspace.root, destination);

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO file_assets (
          id,project_id,client_account_id,relative_path,original_name,
          resource_folder,resource_status,content_role,mime_type,size_bytes,
          checksum_sha256,created_at,updated_at,missing_at
        ) VALUES (?,?,?,?,?,'technical','received','other','application/json',?,?,?,?,NULL)`,
        [
          resourceId,
          project.id,
          project.client_account_id,
          relativePath,
          fileName,
          Number(stats.size),
          checksum,
          createdAt,
          createdAt,
        ],
      );
      this.database.run(
        `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at)
         VALUES ('project',?,'technical_reuse_exported',?,?,?)`,
        [
          project.id,
          `Préparation pour réutilisation : ${item.name} v${Number(version.version_number)}`,
          JSON.stringify({ itemId: item.id, versionId: version.id, resourceId }),
          createdAt,
        ],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return {
      projectId: project.id,
      itemId: item.id,
      versionId: version.id,
      versionNumber: Number(version.version_number),
      path: destination,
      resourceId,
      createdAt,
    };
  }

  private parseTags(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
    } catch {
      return [];
    }
  }

  private safeSegment(value: string): string {
    return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 90) || 'Élément technique';
  }
}

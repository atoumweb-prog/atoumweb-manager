import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  PROJECT_TECHNICAL_CATEGORIES,
  PROJECT_TECHNICAL_CONTENT_TYPES,
  type ProjectTechnicalItemDetail,
  type ProjectTechnicalItemInput,
  type ProjectTechnicalItemSummary,
  type ProjectTechnicalVersion,
  type ProjectTechnicalVersionInput,
} from '../../shared/projects';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface ItemRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  category: ProjectTechnicalItemSummary['category'];
  name: string;
  description: string | null;
  tags_json: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  id: string;
  technical_item_id: string;
  version_number: number;
  content_type: ProjectTechnicalVersion['contentType'];
  language: string | null;
  content_text: string | null;
  notes: string | null;
  is_current: number;
  is_stable: number;
  created_at: string;
}

export class ProjectTechnicalLibraryService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(projectId: string, search?: string | null): ProjectTechnicalItemSummary[] {
    this.assertProject(projectId);
    const rows = this.database.all<ItemRow>(
      `SELECT * FROM technical_items
       WHERE project_id=? AND archived_at IS NULL
       ORDER BY category, name COLLATE NOCASE`,
      [projectId],
    );
    const needle = clean(search)?.toLocaleLowerCase('fr-FR');
    return rows
      .map((row) => this.mapSummary(row))
      .filter((item) => !needle || [item.name, item.description ?? '', item.category, ...(item.tags ?? [])]
        .some((value) => value.toLocaleLowerCase('fr-FR').includes(needle)));
  }

  get(id: string): ProjectTechnicalItemDetail {
    const row = this.database.get<ItemRow>('SELECT * FROM technical_items WHERE id=?', [id]);
    if (!row) throw new Error('Élément technique introuvable.');
    const summary = this.mapSummary(row);
    return { ...summary, versions: this.getVersions(id) };
  }

  create(projectId: string, itemInput: ProjectTechnicalItemInput, versionInput: ProjectTechnicalVersionInput): ProjectTechnicalItemDetail {
    this.assertProject(projectId);
    const name = clean(itemInput.name);
    if (!name) throw new Error('Nom de l’élément technique requis.');
    if (!PROJECT_TECHNICAL_CATEGORIES.includes(itemInput.category)) throw new Error('Catégorie technique invalide.');
    this.validateVersionInput(versionInput);

    const id = randomUUID();
    const versionId = randomUUID();
    const now = nowIso();
    const tags = JSON.stringify(this.normalizeTags(itemInput.tags));

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO technical_items (id,project_id,scope,category,name,description,tags_json,created_at,updated_at)
         VALUES (?,?,'project',?,?,?,?,?,?)`,
        [id, projectId, itemInput.category, name, clean(itemInput.description), tags, now, now],
      );
      this.database.run(
        `INSERT INTO technical_item_versions
         (id,technical_item_id,version_number,content_type,language,content_text,notes,is_current,is_stable,created_at)
         VALUES (?,?,1,?,?,?,?,1,0,?)`,
        [versionId, id, versionInput.contentType, clean(versionInput.language), versionInput.contentText ?? null, clean(versionInput.notes), now],
      );
      this.writeActivity(projectId, 'technical_item_created', `Élément technique créé : ${name}`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(id);
  }

  createVersion(itemId: string, input: ProjectTechnicalVersionInput): ProjectTechnicalItemDetail {
    this.validateVersionInput(input);
    const item = this.get(itemId);
    if (item.archivedAt) throw new Error('Cet élément technique est archivé.');
    const nextVersion = Math.max(0, ...item.versions.map((version) => version.versionNumber)) + 1;
    const now = nowIso();

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('UPDATE technical_item_versions SET is_current=0 WHERE technical_item_id=?', [itemId]);
      this.database.run(
        `INSERT INTO technical_item_versions
         (id,technical_item_id,version_number,content_type,language,content_text,notes,is_current,is_stable,created_at)
         VALUES (?,?,?,?,?,?,?,1,0,?)`,
        [randomUUID(), itemId, nextVersion, input.contentType, clean(input.language), input.contentText ?? null, clean(input.notes), now],
      );
      this.database.run('UPDATE technical_items SET updated_at=? WHERE id=?', [now, itemId]);
      this.writeActivity(item.projectId, 'technical_item_version_created', `${item.name} · version ${nextVersion}`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(itemId);
  }

  markStable(versionId: string): ProjectTechnicalItemDetail {
    const row = this.database.get<VersionRow>('SELECT * FROM technical_item_versions WHERE id=?', [versionId]);
    if (!row) throw new Error('Version technique introuvable.');
    const item = this.get(row.technical_item_id);
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('UPDATE technical_item_versions SET is_stable=0 WHERE technical_item_id=?', [item.id]);
      this.database.run('UPDATE technical_item_versions SET is_stable=1 WHERE id=?', [versionId]);
      this.database.run('UPDATE technical_items SET updated_at=? WHERE id=?', [now, item.id]);
      this.writeActivity(item.projectId, 'technical_item_stable', `${item.name} · version ${Number(row.version_number)} marquée stable`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(item.id);
  }

  linkResource(versionId: string, resourceId: string): ProjectTechnicalItemDetail {
    const version = this.getVersionRow(versionId);
    const item = this.get(version.technical_item_id);
    const asset = this.database.get<{ project_id: string }>('SELECT project_id FROM file_assets WHERE id=?', [resourceId]);
    if (!asset) throw new Error('Ressource projet introuvable.');
    if (asset.project_id !== item.projectId) throw new Error('La ressource appartient à un autre projet.');
    this.database.run(
      'INSERT OR IGNORE INTO technical_item_assets (id,technical_item_version_id,file_asset_id,created_at) VALUES (?,?,?,?)',
      [randomUUID(), versionId, resourceId, nowIso()],
    );
    return this.get(item.id);
  }

  unlinkResource(versionId: string, resourceId: string): ProjectTechnicalItemDetail {
    const version = this.getVersionRow(versionId);
    const item = this.get(version.technical_item_id);
    this.database.run('DELETE FROM technical_item_assets WHERE technical_item_version_id=? AND file_asset_id=?', [versionId, resourceId]);
    return this.get(item.id);
  }

  archive(itemId: string): ProjectTechnicalItemDetail {
    const item = this.get(itemId);
    if (item.archivedAt) return item;
    const now = nowIso();
    this.database.run('UPDATE technical_items SET archived_at=?, updated_at=? WHERE id=?', [now, now, itemId]);
    this.writeActivity(item.projectId, 'technical_item_archived', `Élément technique archivé : ${item.name}`);
    return this.get(itemId);
  }

  private mapSummary(row: ItemRow): ProjectTechnicalItemSummary {
    const versions = this.getVersions(row.id);
    return {
      id: row.id,
      projectId: row.project_id,
      category: row.category,
      name: row.name,
      description: row.description,
      tags: this.parseTags(row.tags_json),
      currentVersion: versions.find((version) => version.current) ?? null,
      stableVersion: versions.find((version) => version.stable) ?? null,
      versionCount: versions.length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  private getVersions(itemId: string): ProjectTechnicalVersion[] {
    return this.database.all<VersionRow>(
      'SELECT * FROM technical_item_versions WHERE technical_item_id=? ORDER BY version_number DESC',
      [itemId],
    ).map((row) => ({
      id: row.id,
      itemId: row.technical_item_id,
      versionNumber: Number(row.version_number),
      contentType: row.content_type,
      language: row.language,
      contentText: row.content_text,
      notes: row.notes,
      current: Boolean(row.is_current),
      stable: Boolean(row.is_stable),
      linkedResourceIds: this.database.all<{ file_asset_id: string }>(
        'SELECT file_asset_id FROM technical_item_assets WHERE technical_item_version_id=? ORDER BY created_at',
        [row.id],
      ).map((asset) => asset.file_asset_id),
      createdAt: row.created_at,
    }));
  }

  private getVersionRow(id: string): VersionRow {
    const row = this.database.get<VersionRow>('SELECT * FROM technical_item_versions WHERE id=?', [id]);
    if (!row) throw new Error('Version technique introuvable.');
    return row;
  }

  private validateVersionInput(input: ProjectTechnicalVersionInput): void {
    if (!PROJECT_TECHNICAL_CONTENT_TYPES.includes(input.contentType)) throw new Error('Type de contenu technique invalide.');
    if (input.contentType !== 'reference' && !clean(input.contentText)) throw new Error('Le contenu de la version est requis.');
  }

  private assertProject(projectId: string): void {
    const project = this.database.get<{ id: string }>('SELECT id FROM projects WHERE id=?', [projectId]);
    if (!project) throw new Error('Projet introuvable.');
  }

  private normalizeTags(tags?: string[]): string[] {
    return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))].slice(0, 30);
  }

  private parseTags(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  private writeActivity(projectId: string, action: string, summary: string): void {
    this.database.run(
      `INSERT INTO activity_events (id,entity_type,entity_id,action,summary,project_id,created_at)
       VALUES (?,?,?,?,?,?,?)`,
      [randomUUID(), 'project', projectId, action, summary, projectId, nowIso()],
    );
  }
}

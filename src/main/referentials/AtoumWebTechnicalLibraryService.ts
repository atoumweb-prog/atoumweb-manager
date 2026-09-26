import { randomUUID } from 'node:crypto';
import type { ProjectTechnicalCategory } from '../../shared/projects';
import { PROJECT_TECHNICAL_CONTENT_TYPES } from '../../shared/projects';
import { normalizeSlug } from '../../shared/componentIdentity';
import {
  ATOUMWEB_LIBRARY_CATEGORIES,
  ATOUMWEB_REUSE_STATUSES,
  type AtoumWebLibraryCategory,
  type AtoumWebTechnicalItemDetail,
  type AtoumWebTechnicalItemInput,
  type AtoumWebTechnicalItemSummary,
  type AtoumWebTechnicalLibraryFilters,
  type AtoumWebTechnicalVersion,
  type AtoumWebTechnicalVersionInput,
} from '../../shared/referentials';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const TECHNICAL_CATEGORY_BY_LIBRARY_CATEGORY: Record<AtoumWebLibraryCategory, ProjectTechnicalCategory> = {
  header: 'header',
  footer: 'footer',
  hero: 'hero',
  page: 'page',
  section: 'section',
  form: 'section',
  gallery: 'section',
  carousel: 'section',
  navigation: 'section',
  code_snippet: 'other',
  css: 'css',
  javascript: 'javascript',
  php: 'php',
  woocommerce: 'woocommerce',
  acf: 'acf',
  divi: 'divi',
  app: 'plugin',
  note: 'note',
};

interface ItemRow extends Record<string, unknown> {
  id: string;
  project_id: string | null;
  scope: 'project' | 'atoumweb';
  category: ProjectTechnicalCategory;
  library_category: AtoumWebLibraryCategory | null;
  name: string;
  description: string | null;
  tags_json: string;
  reuse_status: AtoumWebTechnicalItemSummary['reuseStatus'] | null;
  origin_technical_item_id: string | null;
  vertical: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  id: string;
  technical_item_id: string;
  version_number: number;
  content_type: AtoumWebTechnicalVersion['contentType'];
  language: string | null;
  content_text: string | null;
  notes: string | null;
  is_current: number;
  is_stable: number;
  created_at: string;
}

interface ComponentIdentityRow extends Record<string, unknown> {
  family_id: string;
  component_key: string;
  family_display_name: string;
  reusability_scope: 'generic' | 'vertical' | 'site_specific';
  variant_id: string;
  variant_key: string;
  variant_mode: 'base' | 'inherit' | 'forked';
  variant_of_id: string | null;
}

export class AtoumWebTechnicalLibraryService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(filters: AtoumWebTechnicalLibraryFilters = {}): AtoumWebTechnicalItemSummary[] {
    const rows = this.database.all<ItemRow>(
      `SELECT * FROM technical_items
       WHERE scope='atoumweb'
         AND (?=1 OR archived_at IS NULL)
       ORDER BY library_category, name COLLATE NOCASE`,
      [filters.includeArchived ? 1 : 0],
    );
    const needle = clean(filters.search)?.toLocaleLowerCase('fr-FR');
    return rows
      .map((row) => this.mapSummary(row))
      .filter((item) => !filters.category || item.category === filters.category)
      .filter((item) => !filters.reuseStatus || item.reuseStatus === filters.reuseStatus)
      .filter((item) => {
        const verticalNeedle = normalizeSlug(filters.vertical);
        return !verticalNeedle || Boolean(item.vertical?.includes(verticalNeedle));
      })
      .filter((item) => !needle || this.searchParts(item.id, item).some((value) => value.toLocaleLowerCase('fr-FR').includes(needle)));
  }

  get(id: string): AtoumWebTechnicalItemDetail {
    const row = this.database.get<ItemRow>("SELECT * FROM technical_items WHERE id=? AND scope='atoumweb'", [id]);
    if (!row) throw new Error('Composant AtoumWeb introuvable.');
    return { ...this.mapSummary(row), versions: this.getVersions(id) };
  }

  create(itemInput: AtoumWebTechnicalItemInput, versionInput: AtoumWebTechnicalVersionInput): AtoumWebTechnicalItemDetail {
    const name = clean(itemInput.name);
    if (!name) throw new Error('Nom du composant AtoumWeb requis.');
    this.validateItemInput(itemInput);
    this.validateVersionInput(versionInput);
    this.assertOrigin(itemInput.originTechnicalItemId);

    const id = randomUUID();
    const now = nowIso();
    const technicalCategory = TECHNICAL_CATEGORY_BY_LIBRARY_CATEGORY[itemInput.category];
    this.database.exec('SAVEPOINT library_create;');
    try {
      this.database.run(
        `INSERT INTO technical_items
         (id,project_id,scope,category,library_category,name,description,tags_json,reuse_status,origin_technical_item_id,vertical,created_at,updated_at)
         VALUES (?,NULL,'atoumweb',?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          technicalCategory,
          itemInput.category,
          name,
          clean(itemInput.description),
          JSON.stringify(this.normalizeTags(itemInput.tags)),
          itemInput.reuseStatus,
          itemInput.originTechnicalItemId ?? null,
          normalizeSlug(itemInput.vertical),
          now,
          now,
        ],
      );
      this.insertVersion(id, 1, versionInput, now);
      this.writeActivity(id, 'atoumweb_technical_item_created', `Composant AtoumWeb créé : ${name}`);
      this.database.exec('RELEASE SAVEPOINT library_create;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT library_create; RELEASE SAVEPOINT library_create;');
      throw error;
    }
    const created = this.get(id);
    this.indexItem(created);
    return created;
  }

  updateMetadata(id: string, input: Partial<AtoumWebTechnicalItemInput>): AtoumWebTechnicalItemDetail {
    const item = this.get(id);
    const next: AtoumWebTechnicalItemInput = {
      category: input.category ?? item.category,
      name: input.name ?? item.name,
      description: input.description === undefined ? item.description : input.description,
      tags: input.tags ?? item.tags,
      vertical: input.vertical === undefined ? item.vertical : input.vertical,
      reuseStatus: input.reuseStatus ?? item.reuseStatus,
      originTechnicalItemId: input.originTechnicalItemId === undefined ? item.originTechnicalItemId : input.originTechnicalItemId,
    };
    const name = clean(next.name);
    if (!name) throw new Error('Nom du composant AtoumWeb requis.');
    this.validateItemInput(next);
    this.assertOrigin(next.originTechnicalItemId);
    const now = nowIso();
    const technicalCategory = TECHNICAL_CATEGORY_BY_LIBRARY_CATEGORY[next.category];
    this.database.run(
      `UPDATE technical_items
       SET category=?, library_category=?, name=?, description=?, tags_json=?, reuse_status=?, origin_technical_item_id=?, vertical=?, updated_at=?
       WHERE id=? AND scope='atoumweb'`,
      [
        technicalCategory,
        next.category,
        name,
        clean(next.description),
        JSON.stringify(this.normalizeTags(next.tags)),
        next.reuseStatus,
        next.originTechnicalItemId ?? null,
        normalizeSlug(next.vertical),
        now,
        id,
      ],
    );
    this.writeActivity(id, 'atoumweb_technical_item_updated', `Composant AtoumWeb mis à jour : ${name}`);
    const updated = this.get(id);
    this.indexItem(updated);
    return updated;
  }

  createVersion(itemId: string, input: AtoumWebTechnicalVersionInput): AtoumWebTechnicalItemDetail {
    this.validateVersionInput(input);
    const item = this.get(itemId);
    if (item.archivedAt) throw new Error('Ce composant AtoumWeb est archivé.');
    const nextVersion = Math.max(0, ...item.versions.map((version) => version.versionNumber)) + 1;
    const now = nowIso();
    this.database.exec('SAVEPOINT library_version;');
    try {
      this.database.run('UPDATE technical_item_versions SET is_current=0 WHERE technical_item_id=?', [itemId]);
      this.insertVersion(itemId, nextVersion, input, now);
      this.database.run('UPDATE technical_items SET updated_at=? WHERE id=?', [now, itemId]);
      this.writeActivity(itemId, 'atoumweb_technical_item_version_created', `${item.name} · version ${nextVersion}`);
      this.database.exec('RELEASE SAVEPOINT library_version;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT library_version; RELEASE SAVEPOINT library_version;');
      throw error;
    }
    const updated = this.get(itemId);
    this.indexItem(updated);
    return updated;
  }

  markStable(versionId: string): AtoumWebTechnicalItemDetail {
    const row = this.database.get<VersionRow>('SELECT * FROM technical_item_versions WHERE id=?', [versionId]);
    if (!row) throw new Error('Version technique introuvable.');
    const item = this.get(row.technical_item_id);
    const now = nowIso();
    this.database.exec('SAVEPOINT library_stable;');
    try {
      this.database.run('UPDATE technical_item_versions SET is_stable=0 WHERE technical_item_id=?', [item.id]);
      this.database.run('UPDATE technical_item_versions SET is_stable=1 WHERE id=?', [versionId]);
      this.database.run('UPDATE technical_items SET updated_at=? WHERE id=?', [now, item.id]);
      this.writeActivity(item.id, 'atoumweb_technical_item_stable', `${item.name} · version ${Number(row.version_number)} marquée stable`);
      this.database.exec('RELEASE SAVEPOINT library_stable;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT library_stable; RELEASE SAVEPOINT library_stable;');
      throw error;
    }
    const updated = this.get(item.id);
    this.indexItem(updated);
    return updated;
  }

  archive(itemId: string): AtoumWebTechnicalItemDetail {
    const item = this.get(itemId);
    if (item.archivedAt) return item;
    const now = nowIso();
    this.database.run('UPDATE technical_items SET archived_at=?, updated_at=? WHERE id=?', [now, now, itemId]);
    this.database.run("DELETE FROM search_documents WHERE entity_type='atoumweb_library' AND entity_id=?", [itemId]);
    this.writeActivity(itemId, 'atoumweb_technical_item_archived', `Composant AtoumWeb archivé : ${item.name}`);
    return this.get(itemId);
  }

  reactivate(itemId: string): AtoumWebTechnicalItemDetail {
    const item = this.get(itemId);
    if (!item.archivedAt) return item;
    const now = nowIso();
    this.database.run('UPDATE technical_items SET archived_at=NULL, updated_at=? WHERE id=?', [now, itemId]);
    this.writeActivity(itemId, 'atoumweb_technical_item_reactivated', `Composant AtoumWeb réactivé : ${item.name}`);
    const updated = this.get(itemId);
    this.indexItem(updated);
    return updated;
  }

  rebuildSearchIndex(): { indexed: number } {
    this.database.run("DELETE FROM search_documents WHERE entity_type='atoumweb_library'");
    const ids = this.database.all<{ id: string }>("SELECT id FROM technical_items WHERE scope='atoumweb' AND archived_at IS NULL");
    ids.forEach(({ id }) => this.indexItem(this.get(id)));
    return { indexed: ids.length };
  }

  private insertVersion(itemId: string, versionNumber: number, input: AtoumWebTechnicalVersionInput, now: string): void {
    this.database.run(
      `INSERT INTO technical_item_versions
       (id,technical_item_id,version_number,content_type,language,content_text,notes,is_current,is_stable,created_at)
       VALUES (?,?,?,?,?,?,?,1,0,?)`,
      [randomUUID(), itemId, versionNumber, input.contentType, clean(input.language), input.contentText ?? null, clean(input.notes), now],
    );
  }

  private mapSummary(row: ItemRow): AtoumWebTechnicalItemSummary {
    if (!row.reuse_status || !ATOUMWEB_REUSE_STATUSES.includes(row.reuse_status)) {
      throw new Error(`Composant AtoumWeb ${row.id} sans statut de réutilisation valide.`);
    }
    if (!row.library_category || !ATOUMWEB_LIBRARY_CATEGORIES.includes(row.library_category)) {
      throw new Error(`Composant AtoumWeb ${row.id} sans catégorie de bibliothèque valide.`);
    }
    const versions = this.getVersions(row.id);
    const identity = this.getComponentIdentity(row.id);
    return {
      id: row.id,
      componentFamilyId: identity?.family_id ?? null,
      componentKey: identity?.component_key ?? null,
      familyDisplayName: identity?.family_display_name ?? null,
      libraryVariantId: identity?.variant_id ?? null,
      variantKey: identity?.variant_key ?? null,
      variantMode: identity?.variant_mode ?? null,
      variantOfId: identity?.variant_of_id ?? null,
      reusabilityScope: identity?.reusability_scope ?? null,
      category: row.library_category,
      name: row.name,
      description: row.description,
      tags: this.parseTags(row.tags_json),
      vertical: row.vertical,
      reuseStatus: row.reuse_status,
      originTechnicalItemId: row.origin_technical_item_id,
      currentVersion: versions.find((version) => version.current) ?? null,
      stableVersion: versions.find((version) => version.stable) ?? null,
      versionCount: versions.length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  private getComponentIdentity(itemId: string): ComponentIdentityRow | null {
    return this.database.get<ComponentIdentityRow>(
      `SELECT
         family.id AS family_id,
         family.component_key,
         family.display_name AS family_display_name,
         family.reusability_scope,
         variant.id AS variant_id,
         variant.variant_key,
         variant.variant_mode,
         variant.variant_of_id
       FROM atoumweb_component_variants variant
       JOIN atoumweb_component_families family ON family.id=variant.family_id
       WHERE variant.technical_item_id=?`,
      [itemId],
    ) ?? null;
  }

  private getVersions(itemId: string): AtoumWebTechnicalVersion[] {
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
      createdAt: row.created_at,
    }));
  }

  private searchParts(itemId: string, item: AtoumWebTechnicalItemSummary): string[] {
    const versions = this.getVersions(itemId);
    return [
      item.name,
      item.description ?? '',
      item.category,
      item.vertical ?? '',
      item.reuseStatus,
      item.familyDisplayName ?? '',
      item.componentKey ?? '',
      item.variantKey ?? '',
      item.variantMode ?? '',
      ...(item.tags ?? []),
      ...versions.flatMap((version) => [
        version.contentType,
        version.language ?? '',
        version.notes ?? '',
        version.contentText ?? '',
      ]),
    ];
  }

  private indexItem(item: AtoumWebTechnicalItemDetail): void {
    if (item.archivedAt) {
      this.database.run("DELETE FROM search_documents WHERE entity_type='atoumweb_library' AND entity_id=?", [item.id]);
      return;
    }
    const searchText = this.searchParts(item.id, item).filter(Boolean).join(' ').toLocaleLowerCase('fr-FR');
    this.database.run(
      `INSERT INTO search_documents (id, entity_type, entity_id, title, subtitle, status, search_text, updated_at)
       VALUES (?, 'atoumweb_library', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET
         title=excluded.title,
         subtitle=excluded.subtitle,
         status=excluded.status,
         search_text=excluded.search_text,
         updated_at=excluded.updated_at`,
      [
        `atoumweb_library:${item.id}`,
        item.id,
        item.name,
        `Bibliothèque AtoumWeb · ${item.category}`,
        item.reuseStatus,
        searchText,
        nowIso(),
      ],
    );
  }

  private validateItemInput(input: AtoumWebTechnicalItemInput): void {
    if (!ATOUMWEB_LIBRARY_CATEGORIES.includes(input.category)) throw new Error('Catégorie de Bibliothèque AtoumWeb invalide.');
    if (!ATOUMWEB_REUSE_STATUSES.includes(input.reuseStatus)) throw new Error('Statut de réutilisation invalide.');
  }

  private validateVersionInput(input: AtoumWebTechnicalVersionInput): void {
    if (!PROJECT_TECHNICAL_CONTENT_TYPES.includes(input.contentType)) throw new Error('Type de contenu technique invalide.');
    if (input.contentType !== 'reference' && !clean(input.contentText)) throw new Error('Le contenu de la version est requis.');
  }

  private assertOrigin(originId?: string | null): void {
    if (!originId) return;
    const origin = this.database.get<{ scope: string }>('SELECT scope FROM technical_items WHERE id=?', [originId]);
    if (!origin) throw new Error('Élément technique d’origine introuvable.');
    if (origin.scope !== 'project') throw new Error('L’origine d’un composant AtoumWeb doit être un élément de Bibliothèque projet.');
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

  private writeActivity(itemId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      ['atoumweb_technical_item', itemId, action, summary, nowIso()],
    );
  }
}

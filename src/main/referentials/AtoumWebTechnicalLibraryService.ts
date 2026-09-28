import { randomUUID } from 'node:crypto';
import type { ProjectTechnicalCategory } from '../../shared/projects';
import { PROJECT_TECHNICAL_CONTENT_TYPES } from '../../shared/projects';
import { normalizeComponentKey, normalizeSlug } from '../../shared/componentIdentity';
import {
  ATOUMWEB_LIBRARY_CATEGORIES,
  ATOUMWEB_REUSE_STATUSES,
  type AtoumWebDirectReusableCodeInput,
  type AtoumWebDirectVariantCodeInput,
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

interface ManagedFamilyRow extends Record<string, unknown> {
  id: string;
  component_key: string;
  display_name: string;
  category: string;
  vertical: string | null;
  reusability_scope: 'generic' | 'vertical' | 'site_specific';
  base_item_id: string;
}

interface ManagedVariantRow extends Record<string, unknown> {
  id: string;
  family_id: string;
  technical_item_id: string;
  variant_key: string;
  display_name: string;
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

  createReusableCode(input: AtoumWebDirectReusableCodeInput): AtoumWebTechnicalItemDetail {
    const name = clean(input.name);
    if (!name) throw new Error('Nom du composant requis.');
    if (!input.html?.trim()) throw new Error('Le HTML du composant est requis.');

    const familyId = `awfam:${randomUUID()}`;
    const variantId = `awvar:${randomUUID()}`;
    const componentKey = this.uniqueManagedComponentKey(input.category, name);
    const vertical = normalizeSlug(input.vertical);
    const scope = vertical ? 'vertical' as const : 'generic' as const;
    const payload = this.buildManagedReusablePayload({
      familyId,
      componentKey,
      variantId,
      variantKey: 'base',
      variantOfId: null,
      variantMode: 'base',
      vertical,
      scope,
      html: input.html,
      css: input.css,
      javascript: input.javascript,
      note: 'Composant créé directement depuis une Page du Manager.',
    });

    this.database.exec('SAVEPOINT library_direct_component;');
    try {
      let created = this.create(
        {
          category: input.category,
          name,
          description: input.description,
          tags: this.directManagedTags(input.tags),
          vertical,
          reuseStatus: 'ready',
        },
        {
          contentType: 'json',
          language: 'json',
          contentText: JSON.stringify(payload, null, 2),
          notes: 'Créé directement dans AtoumWeb Manager et validé explicitement pour réutilisation.',
        },
      );
      const now = nowIso();
      this.database.run(
        `INSERT INTO atoumweb_component_families
         (id,component_key,display_name,category,vertical,reusability_scope,base_item_id,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [familyId, componentKey, name, input.category, vertical, scope, created.id, now, now],
      );
      this.database.run(
        `INSERT INTO atoumweb_component_variants
         (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
         VALUES (?,?,?,?,?,'base',NULL,NULL,?,?)`,
        [variantId, familyId, created.id, 'base', 'Base', now, now],
      );
      if (created.currentVersion && markStable) created = this.markStable(created.currentVersion.id);
      this.refreshSearchIndex(created.id);
      this.database.exec('RELEASE SAVEPOINT library_direct_component;');
      return created;
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT library_direct_component; RELEASE SAVEPOINT library_direct_component;');
      throw error;
    }
  }

  createVariantCode(input: AtoumWebDirectVariantCodeInput): AtoumWebTechnicalItemDetail {
    const source = this.get(input.sourceItemId);
    const label = clean(input.name);
    if (!label) throw new Error('Nom de la déclinaison requis.');
    if (!input.html?.trim()) throw new Error('Le HTML de la déclinaison est requis.');

    this.database.exec('SAVEPOINT library_direct_variant;');
    try {
      const family = this.ensureManagedFamily(source);
      const parent = this.managedVariantForItem(source.id);
      if (!parent || parent.family_id !== family.id) throw new Error('Variante source introuvable dans sa famille.');

      const variantId = `awvar:${randomUUID()}`;
      const variantKey = this.uniqueManagedVariantKey(family.id, input.variantKey ?? label);
      const requestedVertical = normalizeSlug(input.vertical);
      const vertical = family.reusability_scope === 'vertical'
        ? family.vertical
        : requestedVertical ?? source.vertical ?? family.vertical;
      const itemName = label.toLocaleLowerCase('fr-FR').startsWith(source.name.toLocaleLowerCase('fr-FR'))
        ? label
        : `${source.name} — ${label}`;
      const payload = this.buildManagedReusablePayload({
        familyId: family.id,
        componentKey: family.component_key,
        variantId,
        variantKey,
        variantOfId: parent.id,
        variantMode: 'forked',
        vertical,
        scope: family.reusability_scope,
        html: input.html,
        css: input.css,
        javascript: input.javascript,
        note: `Déclinaison complète de « ${source.name} » créée directement dans le Manager.`,
      });

      const reuseStatus = input.reuseStatus ?? 'ready';
      const markStable = input.markStable ?? true;
      const variantTags = this.directManagedTags([...(source.tags ?? []), ...(input.tags ?? [])]);
      if (reuseStatus === 'adapt') {
        const readyIndex = variantTags.indexOf('bridge-human-validated');
        if (readyIndex >= 0) variantTags.splice(readyIndex, 1);
        if (!variantTags.includes('manager-variant-to-review')) variantTags.push('manager-variant-to-review');
      }
      let created = this.create(
        {
          category: source.category,
          name: itemName,
          description: input.description ?? `Déclinaison de « ${source.name} ».`,
          tags: variantTags,
          vertical,
          reuseStatus,
        },
        {
          contentType: 'json',
          language: 'json',
          contentText: JSON.stringify(payload, null, 2),
          notes: input.provenanceNote
            ? `Déclinaison « ${label} » du modèle « ${source.name} ». ${input.provenanceNote}`
            : `Déclinaison « ${label} » du modèle « ${source.name} ».`,
        },
      );
      const now = nowIso();
      this.database.run(
        `INSERT INTO atoumweb_component_variants
         (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
         VALUES (?,?,?,?,?,'forked',?,NULL,?,?)`,
        [variantId, family.id, created.id, variantKey, label, parent.id, now, now],
      );
      if (created.currentVersion) created = this.markStable(created.currentVersion.id);
      this.refreshSearchIndex(source.id);
      this.refreshSearchIndex(created.id);
      this.database.exec('RELEASE SAVEPOINT library_direct_variant;');
      return created;
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT library_direct_variant; RELEASE SAVEPOINT library_direct_variant;');
      throw error;
    }
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

  refreshSearchIndex(itemId: string): void {
    this.indexItem(this.get(itemId));
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

  private directManagedTags(tags?: string[]): string[] {
    return this.normalizeTags([...(tags ?? []), 'manager-direct', 'bridge-human-validated', 'bridge-family-managed']);
  }

  private buildManagedReusablePayload(input: {
    familyId: string;
    componentKey: string;
    variantId: string;
    variantKey: string;
    variantOfId: string | null;
    variantMode: 'base' | 'forked';
    vertical: string | null;
    scope: 'generic' | 'vertical' | 'site_specific';
    html: string;
    css?: string | null;
    javascript?: string | null;
    note: string;
  }): Record<string, unknown> {
    return {
      schemaVersion: 1,
      generatorRevision: 1,
      kind: 'atoumweb-library-reusable-component',
      origin: {
        site: null,
        page: 'AtoumWeb Manager',
        pageUrl: null,
        snapshotId: null,
        snapshotDate: null,
        builderGeneration: 'manager-direct',
        occurrenceId: `manager-direct:${randomUUID()}`,
      },
      identity: {
        componentFamilyId: input.familyId,
        componentKey: input.componentKey,
        libraryVariantId: input.variantId,
        variantKey: input.variantKey,
        variantOf: input.variantOfId,
        variantMode: input.variantMode,
        vertical: input.vertical,
        reusabilityScope: input.scope,
      },
      reusable: {
        html: input.html,
        css: input.css ?? '',
        javascript: input.javascript ?? '',
        rootClasses: [],
        method: 'divi-code',
        instructions: [],
        generalized: false,
        fields: [],
      },
      dependencies: [],
      assets: [],
      checks: { remoteAssetUrls: [] },
      notes: [input.note],
    };
  }

  private ensureManagedFamily(item: AtoumWebTechnicalItemDetail): ManagedFamilyRow {
    const existingVariant = this.managedVariantForItem(item.id);
    if (existingVariant) {
      const family = this.database.get<ManagedFamilyRow>('SELECT * FROM atoumweb_component_families WHERE id=?', [existingVariant.family_id]);
      if (!family) throw new Error('Famille du composant source introuvable.');
      return family;
    }

    const familyId = `awfam:${randomUUID()}`;
    const baseVariantId = `awvar:${randomUUID()}`;
    const componentKey = this.uniqueManagedComponentKey(item.category, item.name);
    const scope = item.vertical ? 'vertical' as const : 'generic' as const;
    const now = nowIso();
    this.database.run(
      `INSERT INTO atoumweb_component_families
       (id,component_key,display_name,category,vertical,reusability_scope,base_item_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [familyId, componentKey, item.name, item.category, item.vertical ?? null, scope, item.id, now, now],
    );
    this.database.run(
      `INSERT INTO atoumweb_component_variants
       (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
       VALUES (?,?,?,?,?,'base',NULL,NULL,?,?)`,
      [baseVariantId, familyId, item.id, 'base', 'Base', now, now],
    );
    this.refreshSearchIndex(item.id);
    return this.database.get<ManagedFamilyRow>('SELECT * FROM atoumweb_component_families WHERE id=?', [familyId])!;
  }

  private managedVariantForItem(itemId: string): ManagedVariantRow | null {
    return this.database.get<ManagedVariantRow>(
      'SELECT * FROM atoumweb_component_variants WHERE technical_item_id=?',
      [itemId],
    ) ?? null;
  }

  private uniqueManagedVariantKey(familyId: string, value: string): string {
    const normalized = normalizeSlug(value) ?? 'variant';
    const base = normalized === 'base' ? 'variant' : normalized;
    let candidate = base;
    let suffix = 2;
    while (this.database.get<{ id: string }>(
      'SELECT id FROM atoumweb_component_variants WHERE family_id=? AND variant_key=?',
      [familyId, candidate],
    )) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private uniqueManagedComponentKey(category: string, name: string): string {
    const categorySlug = normalizeSlug(category) ?? 'component';
    const nameSlug = normalizeSlug(name) ?? 'component';
    const stem = nameSlug === categorySlug || nameSlug.startsWith(`${categorySlug}-`) ? nameSlug : `${categorySlug}-${nameSlug}`;
    const base = normalizeComponentKey(`aw-${stem}`) ?? 'aw-component';
    let candidate = base;
    let suffix = 2;
    while (this.database.get<{ id: string }>('SELECT id FROM atoumweb_component_families WHERE component_key=?', [candidate])) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
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

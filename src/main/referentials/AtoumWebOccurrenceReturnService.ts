import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type {
  AtoumWebOccurrenceCreateFamilyInput,
  AtoumWebOccurrenceCreateVariantInput,
  AtoumWebOccurrenceReturnDecision,
  AtoumWebOccurrenceReturnDetail,
  AtoumWebOccurrenceReturnInspection,
  AtoumWebOccurrenceReturnSummary,
  AtoumWebOccurrenceUpdateVariantInput,
  AtoumWebOccurrenceVariantTarget,
} from '../../shared/referentials';
import { normalizeComponentKey, normalizeSlug } from '../../shared/componentIdentity';
import {
  type AtoumWebOccurrenceReturnFile,
  type AtoumWebOccurrenceReturnManifestV1,
  type AtoumWebSiteOccurrenceV1,
  validateOccurrenceReturnManifestV1,
  validateSiteOccurrenceV1,
} from '../../shared/siteOccurrence';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { readZipArchive, type ZipEntryOutput } from './ZipArchive';

interface ReturnRow extends Record<string, unknown> {
  id: string;
  package_fingerprint: string;
  site_occurrence_id: string;
  technical_item_id: string;
  technical_item_version_id: string;
  source_version_number: number;
  returned_at: string;
  occurrence_state: string;
  decision: AtoumWebOccurrenceReturnDecision | null;
  decided_at: string | null;
  changes_json: string;
  occurrence_json: string;
  assets_json: string;
  provenance_json: string;
  html_text: string;
  css_text: string | null;
  javascript_text: string | null;
  package_relative_path: string;
  result_technical_item_id: string | null;
  result_variant_id: string | null;
  created_at: string;
}

interface InspectedReturn {
  public: AtoumWebOccurrenceReturnInspection;
  manifest: AtoumWebOccurrenceReturnManifestV1;
  occurrence: AtoumWebSiteOccurrenceV1;
  html: string;
  css: string | null;
  javascript: string | null;
  assets: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

interface FamilyRow extends Record<string, unknown> {
  id: string;
  component_key: string;
  display_name: string;
  category: string;
  vertical: string | null;
  reusability_scope: 'generic' | 'vertical' | 'site_specific';
  base_item_id: string;
}

interface VariantRow extends Record<string, unknown> {
  id: string;
  family_id: string;
  technical_item_id: string;
  variant_key: string;
  display_name: string;
  variant_mode: 'base' | 'inherit' | 'forked';
  variant_of_id: string | null;
  source_occurrence_return_id: string | null;
}

interface SourceVersionRow extends Record<string, unknown> {
  content_text: string | null;
  is_stable: number;
}

interface SourceItemStateRow extends Record<string, unknown> {
  reuse_status: string | null;
  tags_json: string;
}

const nowIso = (): string => new Date().toISOString();

export class AtoumWebOccurrenceReturnService {
  private readonly library: AtoumWebTechnicalLibraryService;
  private readonly technicalAssets: AtoumWebTechnicalAssetService;

  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
  ) {
    this.library = new AtoumWebTechnicalLibraryService(database);
    this.technicalAssets = new AtoumWebTechnicalAssetService(database, workspace);
  }

  list(): AtoumWebOccurrenceReturnSummary[] {
    return this.database.all<ReturnRow>(
      'SELECT * FROM bridge_occurrence_returns ORDER BY returned_at DESC, created_at DESC',
    ).map((row) => this.mapSummary(row));
  }

  get(id: string): AtoumWebOccurrenceReturnDetail {
    const row = this.database.get<ReturnRow>('SELECT * FROM bridge_occurrence_returns WHERE id=?', [id]);
    if (!row) throw new Error('Retour Bridge introuvable.');
    return this.mapDetail(row);
  }

  inspectPackage(packagePath: string): AtoumWebOccurrenceReturnInspection {
    return this.inspect(packagePath).public;
  }

  importReturn(packagePath: string): AtoumWebOccurrenceReturnDetail {
    const inspection = this.inspect(packagePath);
    if (inspection.public.existingReturnId) return this.get(inspection.public.existingReturnId);

    const directory = join(this.workspace.bridgeDirectory, 'occurrence-returns');
    mkdirSync(directory, { recursive: true });
    const safeOccurrence = inspection.public.siteOccurrenceId.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'occurrence';
    const fileName = `${safeOccurrence}-${inspection.public.packageFingerprint.slice(0, 16)}.zip`;
    const destination = join(directory, fileName);
    let createdFile = false;
    if (!existsSync(destination)) {
      copyFileSync(resolve(packagePath), destination);
      createdFile = true;
    }
    if (this.sha256(readFileSync(destination)) !== inspection.public.packageFingerprint) {
      if (createdFile) rmSync(destination, { force: true });
      throw new Error('La copie locale du retour Bridge ne correspond pas au package inspecté.');
    }

    const id = randomUUID();
    const createdAt = nowIso();
    const packageRelativePath = relative(this.workspace.root, destination).replace(/\\/g, '/');
    this.database.exec('SAVEPOINT bridge_occurrence_return_import;');
    try {
      this.database.run(
        `INSERT INTO bridge_occurrence_returns (
          id, package_fingerprint, site_occurrence_id, technical_item_id, technical_item_version_id,
          source_version_number, returned_at, occurrence_state, decision, decided_at,
          changes_json, occurrence_json, assets_json, provenance_json,
          html_text, css_text, javascript_text, package_relative_path, created_at
        ) VALUES (?,?,?,?,?,?,?,?,NULL,NULL,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          inspection.public.packageFingerprint,
          inspection.public.siteOccurrenceId,
          inspection.public.libraryItemId,
          inspection.public.libraryVersionId,
          inspection.public.libraryVersionNumber,
          inspection.public.returnedAt,
          inspection.public.occurrenceState,
          JSON.stringify(inspection.public.changes),
          JSON.stringify(inspection.occurrence),
          JSON.stringify(inspection.assets),
          JSON.stringify(inspection.provenance),
          inspection.html,
          inspection.css,
          inspection.javascript,
          packageRelativePath,
          createdAt,
        ],
      );
      this.writeActivity(id, 'bridge_occurrence_return_imported', `Retour Bridge importé : ${inspection.public.siteOccurrenceId}`, {
        libraryItemId: inspection.public.libraryItemId,
        libraryVersionId: inspection.public.libraryVersionId,
        packageFingerprint: inspection.public.packageFingerprint,
      });
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_return_import;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_return_import; RELEASE SAVEPOINT bridge_occurrence_return_import;');
      if (createdFile) rmSync(destination, { force: true });
      throw error;
    }
    return this.get(id);
  }

  keepOccurrence(id: string): AtoumWebOccurrenceReturnDetail {
    const current = this.get(id);
    if (current.decision && current.decision !== 'keep_occurrence') {
      throw new Error('Une autre décision a déjà été enregistrée pour ce retour.');
    }
    if (current.decision === 'keep_occurrence') return current;
    const decidedAt = nowIso();
    this.database.exec('SAVEPOINT bridge_occurrence_return_decision;');
    try {
      this.database.run(
        "UPDATE bridge_occurrence_returns SET decision='keep_occurrence', decided_at=? WHERE id=?",
        [decidedAt, id],
      );
      this.writeActivity(id, 'bridge_occurrence_return_decided', 'Retour Bridge conservé comme occurrence uniquement.', {
        decision: 'keep_occurrence',
        siteOccurrenceId: current.siteOccurrenceId,
      });
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_return_decision;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_return_decision; RELEASE SAVEPOINT bridge_occurrence_return_decision;');
      throw error;
    }
    return this.get(id);
  }

  listVariantTargets(id: string): AtoumWebOccurrenceVariantTarget[] {
    const current = this.get(id);
    const sourceVariant = this.variantForItem(current.libraryItemId);
    if (!sourceVariant) return [];

    return this.database.all<VariantRow & { item_name: string }>(
      `SELECT variant.*, item.name AS item_name
       FROM atoumweb_component_variants variant
       JOIN technical_items item ON item.id=variant.technical_item_id
       WHERE variant.family_id=? AND variant.variant_mode<>'base' AND item.archived_at IS NULL
       ORDER BY variant.display_name COLLATE NOCASE`,
      [sourceVariant.family_id],
    ).map((variant) => ({
      variantId: variant.id,
      familyId: variant.family_id,
      technicalItemId: variant.technical_item_id,
      itemName: variant.item_name,
      variantKey: variant.variant_key,
      displayName: variant.display_name,
      variantMode: variant.variant_mode,
      isSourceVariant: variant.technical_item_id === current.libraryItemId,
    }));
  }

  createVariant(id: string, input: AtoumWebOccurrenceCreateVariantInput): AtoumWebOccurrenceReturnDetail {
    const current = this.get(id);
    if (current.decision === 'create_variant' && current.resultTechnicalItemId && current.resultVariantId) return current;
    this.assertDecisionAvailable(current, 'create_variant');

    const variantLabel = input.name?.trim();
    if (!variantLabel) throw new Error('Le nom de la variante est requis.');

    const createdFiles: string[] = [];
    this.database.exec('SAVEPOINT bridge_occurrence_create_variant;');
    try {
      const sourceItem = this.library.get(current.libraryItemId);
      const family = this.ensureSourceFamily(sourceItem.id, sourceItem.name, sourceItem.category, sourceItem.vertical ?? null);
      const parentVariant = this.variantForItem(sourceItem.id);
      if (!parentVariant || parentVariant.family_id !== family.id) {
        throw new Error('Variante source introuvable dans sa famille.');
      }

      const variantId = `awvar:${randomUUID()}`;
      const variantKey = this.uniqueVariantKey(family.id, input.variantKey ?? variantLabel);
      const itemName = this.variantItemName(sourceItem.name, variantLabel);
      const variantMode = current.changes.structuralChange ? 'forked' as const : 'inherit' as const;
      const inheritValidation = this.canInheritValidation(current);
      const tags = this.variantTags(sourceItem.tags ?? [], inheritValidation);
      const payload = this.buildReusablePayloadFromReturn(current, {
        componentFamilyId: family.id,
        componentKey: family.component_key,
        libraryVariantId: variantId,
        variantKey,
        variantOf: parentVariant.id,
        variantMode,
        vertical: family.vertical,
        reusabilityScope: family.reusability_scope,
      });

      let created = this.library.create(
        {
          category: sourceItem.category,
          name: itemName,
          description: `Variante de « ${sourceItem.name} » issue du retour Bridge ${current.siteOccurrenceId}.`,
          tags,
          vertical: sourceItem.vertical ?? null,
          reuseStatus: inheritValidation ? 'ready' : 'adapt',
        },
        {
          contentType: 'json',
          language: 'json',
          contentText: JSON.stringify(payload, null, 2),
          notes: `Variante créée depuis l’occurrence ${current.siteOccurrenceId}.`,
        },
      );

      const now = nowIso();
      this.database.run(
        `INSERT INTO atoumweb_component_variants
         (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [variantId, family.id, created.id, variantKey, variantLabel, variantMode, parentVariant.id, current.id, now, now],
      );

      if (created.currentVersion) {
        this.copySourceVersionAssets(current.libraryVersionId, created.currentVersion.id, createdFiles);
      }

      if (inheritValidation && created.currentVersion) {
        created = this.library.markStable(created.currentVersion.id);
      }

      this.recordDecision(current, 'create_variant', created.id, variantId, 'Occurrence promue en nouvelle variante de Bibliothèque.');
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_create_variant;');
      return this.get(id);
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_create_variant; RELEASE SAVEPOINT bridge_occurrence_create_variant;');
      this.cleanupCreatedFiles(createdFiles);
      throw error;
    }
  }

  updateVariant(id: string, input: AtoumWebOccurrenceUpdateVariantInput): AtoumWebOccurrenceReturnDetail {
    const current = this.get(id);
    if (current.decision === 'update_variant' && current.resultTechnicalItemId && current.resultVariantId) return current;
    this.assertDecisionAvailable(current, 'update_variant');

    const sourceVariant = this.variantForItem(current.libraryItemId);
    if (!sourceVariant) throw new Error('Le composant source doit d’abord appartenir à une famille.');
    const target = this.database.get<VariantRow>(
      'SELECT * FROM atoumweb_component_variants WHERE id=?',
      [input.targetVariantId],
    );
    if (!target || target.family_id !== sourceVariant.family_id || target.variant_mode === 'base') {
      throw new Error('La variante cible doit appartenir à la même famille et ne peut pas être la variante de base.');
    }

    const createdFiles: string[] = [];
    this.database.exec('SAVEPOINT bridge_occurrence_update_variant;');
    try {
      const family = this.familyById(target.family_id);
      const targetItem = this.library.get(target.technical_item_id);
      const payload = this.buildReusablePayloadFromReturn(current, {
        componentFamilyId: family.id,
        componentKey: family.component_key,
        libraryVariantId: target.id,
        variantKey: target.variant_key,
        variantOf: target.variant_of_id,
        variantMode: target.variant_mode,
        vertical: family.vertical,
        reusabilityScope: family.reusability_scope,
      });
      const inheritValidation = target.technical_item_id === current.libraryItemId && this.canInheritValidation(current);
      const tags = this.variantTags(targetItem.tags ?? [], inheritValidation);

      let changed = this.library.createVersion(targetItem.id, {
        contentType: 'json',
        language: 'json',
        contentText: JSON.stringify(payload, null, 2),
        notes: `Variante mise à jour depuis l’occurrence ${current.siteOccurrenceId}.`,
      });
      if (changed.currentVersion) {
        this.copySourceVersionAssets(current.libraryVersionId, changed.currentVersion.id, createdFiles);
      }
      changed = this.library.updateMetadata(changed.id, {
        reuseStatus: inheritValidation ? 'ready' : 'adapt',
        tags,
      });
      if (inheritValidation && changed.currentVersion) {
        changed = this.library.markStable(changed.currentVersion.id);
      }
      this.database.run('UPDATE atoumweb_component_variants SET updated_at=? WHERE id=?', [nowIso(), target.id]);

      this.recordDecision(current, 'update_variant', changed.id, target.id, 'Occurrence appliquée à une variante existante.');
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_update_variant;');
      return this.get(id);
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_update_variant; RELEASE SAVEPOINT bridge_occurrence_update_variant;');
      this.cleanupCreatedFiles(createdFiles);
      throw error;
    }
  }

  createFamily(id: string, input: AtoumWebOccurrenceCreateFamilyInput): AtoumWebOccurrenceReturnDetail {
    const current = this.get(id);
    if (current.decision === 'new_family' && current.resultTechnicalItemId && current.resultVariantId) return current;
    this.assertDecisionAvailable(current, 'new_family');

    const familyName = input.name?.trim();
    if (!familyName) throw new Error('Le nom de la nouvelle famille est requis.');

    const createdFiles: string[] = [];
    this.database.exec('SAVEPOINT bridge_occurrence_new_family;');
    try {
      const sourceItem = this.library.get(current.libraryItemId);
      const familyId = `awfam:${randomUUID()}`;
      const variantId = `awvar:${randomUUID()}`;
      const componentKey = this.uniqueComponentKey(sourceItem.category, familyName, input.componentKey);
      const scope = sourceItem.vertical ? 'vertical' as const : 'generic' as const;
      const payload = this.buildReusablePayloadFromReturn(current, {
        componentFamilyId: familyId,
        componentKey,
        libraryVariantId: variantId,
        variantKey: 'base',
        variantOf: null,
        variantMode: 'base',
        vertical: sourceItem.vertical ?? null,
        reusabilityScope: scope,
      });
      const tags = this.variantTags(sourceItem.tags ?? [], false);

      const created = this.library.create(
        {
          category: sourceItem.category,
          name: familyName,
          description: `Nouvelle famille détachée de « ${sourceItem.name} » depuis le retour Bridge ${current.siteOccurrenceId}.`,
          tags,
          vertical: sourceItem.vertical ?? null,
          reuseStatus: 'adapt',
        },
        {
          contentType: 'json',
          language: 'json',
          contentText: JSON.stringify(payload, null, 2),
          notes: `Famille créée depuis l’occurrence ${current.siteOccurrenceId}. Validation humaine requise.`,
        },
      );

      const now = nowIso();
      this.database.run(
        `INSERT INTO atoumweb_component_families
         (id,component_key,display_name,category,vertical,reusability_scope,base_item_id,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [familyId, componentKey, familyName, sourceItem.category, sourceItem.vertical ?? null, scope, created.id, now, now],
      );
      this.database.run(
        `INSERT INTO atoumweb_component_variants
         (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
         VALUES (?,?,?,?,?,'base',NULL,?,?,?)`,
        [variantId, familyId, created.id, 'base', 'Base', current.id, now, now],
      );

      if (created.currentVersion) {
        this.copySourceVersionAssets(current.libraryVersionId, created.currentVersion.id, createdFiles);
      }

      this.recordDecision(current, 'new_family', created.id, variantId, 'Occurrence détachée dans une nouvelle famille de Bibliothèque.');
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_new_family;');
      return this.get(id);
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_new_family; RELEASE SAVEPOINT bridge_occurrence_new_family;');
      this.cleanupCreatedFiles(createdFiles);
      throw error;
    }
  }

  private assertDecisionAvailable(current: AtoumWebOccurrenceReturnDetail, next: AtoumWebOccurrenceReturnDecision): void {
    if (!current.decision || current.decision === 'keep_occurrence') return;
    if (current.decision === next && current.resultTechnicalItemId && current.resultVariantId) return;
    throw new Error('Une autre décision de Bibliothèque a déjà été enregistrée pour ce retour.');
  }

  private ensureSourceFamily(
    itemId: string,
    itemName: string,
    category: string,
    vertical: string | null,
  ): FamilyRow {
    const existingVariant = this.variantForItem(itemId);
    if (existingVariant) return this.familyById(existingVariant.family_id);

    const familyId = `awfam:${randomUUID()}`;
    const baseVariantId = `awvar:${randomUUID()}`;
    const componentKey = this.uniqueComponentKey(category, itemName);
    const scope = vertical ? 'vertical' as const : 'generic' as const;
    const now = nowIso();

    this.database.run(
      `INSERT INTO atoumweb_component_families
       (id,component_key,display_name,category,vertical,reusability_scope,base_item_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [familyId, componentKey, itemName, category, vertical, scope, itemId, now, now],
    );
    this.database.run(
      `INSERT INTO atoumweb_component_variants
       (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
       VALUES (?,?,?,?,?,'base',NULL,NULL,?,?)`,
      [baseVariantId, familyId, itemId, 'base', 'Base', now, now],
    );
    return this.familyById(familyId);
  }

  private variantForItem(itemId: string): VariantRow | null {
    return this.database.get<VariantRow>(
      'SELECT * FROM atoumweb_component_variants WHERE technical_item_id=?',
      [itemId],
    ) ?? null;
  }

  private familyById(id: string): FamilyRow {
    const family = this.database.get<FamilyRow>('SELECT * FROM atoumweb_component_families WHERE id=?', [id]);
    if (!family) throw new Error('Famille de composant introuvable.');
    return family;
  }

  private uniqueVariantKey(familyId: string, value: string): string {
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

  private uniqueComponentKey(category: string, name: string, requested?: string | null): string {
    if (requested?.trim()) {
      const normalizedRequested = normalizeComponentKey(requested);
      if (!normalizedRequested) throw new Error('La clé de famille doit respecter le format aw-nom-de-famille.');
      const existing = this.database.get<{ id: string }>(
        'SELECT id FROM atoumweb_component_families WHERE component_key=?',
        [normalizedRequested],
      );
      if (existing) throw new Error('Cette clé de famille existe déjà.');
      return normalizedRequested;
    }

    const categorySlug = normalizeSlug(category) ?? 'component';
    const nameSlug = normalizeSlug(name) ?? 'component';
    const stem = nameSlug === categorySlug || nameSlug.startsWith(`${categorySlug}-`)
      ? nameSlug
      : `${categorySlug}-${nameSlug}`;
    const base = normalizeComponentKey(`aw-${stem}`) ?? 'aw-component';
    let candidate = base;
    let suffix = 2;
    while (this.database.get<{ id: string }>(
      'SELECT id FROM atoumweb_component_families WHERE component_key=?',
      [candidate],
    )) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private variantItemName(sourceName: string, variantLabel: string): string {
    const normalizedSource = sourceName.trim().toLocaleLowerCase('fr-FR');
    const normalizedLabel = variantLabel.trim().toLocaleLowerCase('fr-FR');
    return normalizedLabel.startsWith(normalizedSource)
      ? variantLabel.trim()
      : `${sourceName} — ${variantLabel.trim()}`;
  }

  private variantTags(tags: string[], inheritValidation: boolean): string[] {
    const next = new Set(tags.map((tag) => tag.trim()).filter(Boolean));
    next.add('bridge-family-managed');
    if (inheritValidation) next.add('bridge-human-validated');
    else next.delete('bridge-human-validated');
    return [...next];
  }

  private canInheritValidation(current: AtoumWebOccurrenceReturnDetail): boolean {
    const sourceVersion = this.database.get<SourceVersionRow>(
      'SELECT content_text, is_stable FROM technical_item_versions WHERE id=?',
      [current.libraryVersionId],
    );
    const sourceItem = this.database.get<SourceItemStateRow>(
      "SELECT reuse_status, tags_json FROM technical_items WHERE id=? AND scope='atoumweb'",
      [current.libraryItemId],
    );
    if (!sourceVersion || !sourceItem || !sourceVersion.is_stable || sourceItem.reuse_status !== 'ready') return false;

    let tags: unknown = [];
    try {
      tags = JSON.parse(sourceItem.tags_json);
    } catch {
      tags = [];
    }
    if (!Array.isArray(tags) || !tags.includes('bridge-human-validated')) return false;

    const changes = current.changes;
    if (changes.structuralChange || changes.javascriptChanged) return false;
    if (changes.htmlChanged && changes.changedFieldIds.length === 0) {
      const sourceHtml = this.sourceReusableHtml(sourceVersion.content_text);
      if (!sourceHtml || this.normalizeHtmlForComparison(sourceHtml) !== this.normalizeHtmlForComparison(current.html)) return false;
    }
    if (changes.cssChanged && changes.changedCssVariables.length === 0) return false;
    return true;
  }

  private sourceReusableHtml(contentText: string | null): string | null {
    if (!contentText) return null;
    try {
      const parsed = JSON.parse(contentText) as Record<string, unknown>;
      const reusable = parsed.reusable && typeof parsed.reusable === 'object' && !Array.isArray(parsed.reusable)
        ? parsed.reusable as Record<string, unknown>
        : null;
      return reusable && typeof reusable.html === 'string' ? reusable.html : null;
    } catch {
      return null;
    }
  }

  private normalizeHtmlForComparison(html: string): string {
    return html
      .replace(/\r\n?/g, '\n')
      .trim()
      .replace(/[ \t]+(<\/(?:h[1-6]|p|div|section|article|header|footer|main|aside|nav|li|ul|ol|form|blockquote|figure|figcaption|table|thead|tbody|tfoot|tr|td|th)>)/gi, '$1');
  }

  private buildReusablePayloadFromReturn(
    current: AtoumWebOccurrenceReturnDetail,
    identity: {
      componentFamilyId: string;
      componentKey: string;
      libraryVariantId: string;
      variantKey: string;
      variantOf: string | null;
      variantMode: 'base' | 'inherit' | 'forked';
      vertical: string | null;
      reusabilityScope: 'generic' | 'vertical' | 'site_specific';
    },
  ): Record<string, unknown> {
    const sourceVersion = this.database.get<SourceVersionRow>(
      'SELECT content_text, is_stable FROM technical_item_versions WHERE id=?',
      [current.libraryVersionId],
    );
    if (!sourceVersion?.content_text) throw new Error('Le contenu de la version source est introuvable.');

    let parsed: unknown;
    try {
      parsed = JSON.parse(sourceVersion.content_text);
    } catch {
      throw new Error('La version source ne contient pas un paquet réutilisable JSON valide.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('La version source ne contient pas un paquet réutilisable exploitable.');
    }
    const source = parsed as Record<string, unknown>;
    if (source.kind !== 'atoumweb-library-reusable-component') {
      throw new Error('Seule une version réutilisable peut devenir une famille ou une variante.');
    }

    const payload = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
    const reusable = payload.reusable && typeof payload.reusable === 'object' && !Array.isArray(payload.reusable)
      ? payload.reusable as Record<string, unknown>
      : null;
    if (!reusable) throw new Error('Bloc réutilisable absent de la version source.');

    reusable.html = current.html;
    reusable.css = current.css ?? '';
    reusable.javascript = current.javascript ?? '';

    const configuration = current.occurrence.configuration;
    if (Array.isArray(reusable.fields)) {
      reusable.fields = reusable.fields.map((raw) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
        const field = { ...(raw as Record<string, unknown>) };
        const id = typeof field.id === 'string' ? field.id : '';
        const binding = field.binding && typeof field.binding === 'object' && !Array.isArray(field.binding)
          ? field.binding as Record<string, unknown>
          : null;

        let configured: unknown = undefined;
        if (binding?.type === 'css_variable' && typeof binding.name === 'string') {
          configured = configuration.cssVariables[binding.name];
        } else if (id && Object.prototype.hasOwnProperty.call(configuration.fieldValues, id)) {
          configured = configuration.fieldValues[id];
        } else if (id && Object.prototype.hasOwnProperty.call(configuration.assetSelections, id)) {
          configured = configuration.assetSelections[id];
        }

        if (configured !== undefined && configured !== null) {
          const value = String(configured);
          field.originalValue = value;
          field.defaultValue = value;
        }
        return field;
      });
    }

    payload.identity = identity;
    const notes = Array.isArray(payload.notes)
      ? payload.notes.filter((note): note is string => typeof note === 'string')
      : [];
    payload.notes = [...notes, `Dérivé de l’occurrence Bridge ${current.siteOccurrenceId}.`];
    return payload;
  }

  private copySourceVersionAssets(sourceVersionId: string, targetVersionId: string, createdFiles: string[]): void {
    for (const asset of this.technicalAssets.list(sourceVersionId)) {
      if (asset.missing) continue;
      const sourcePath = this.technicalAssets.absolutePath(asset.id);
      this.technicalAssets.importFilePaths(targetVersionId, [sourcePath], asset.role, createdFiles);
    }
  }

  private cleanupCreatedFiles(paths: string[]): void {
    for (const path of [...paths].reverse()) {
      rmSync(path, { force: true });
    }
  }

  private recordDecision(
    current: AtoumWebOccurrenceReturnDetail,
    decision: AtoumWebOccurrenceReturnDecision,
    resultTechnicalItemId: string,
    resultVariantId: string,
    summary: string,
  ): void {
    const decidedAt = nowIso();
    this.database.run(
      `UPDATE bridge_occurrence_returns
       SET decision=?, decided_at=?, result_technical_item_id=?, result_variant_id=?
       WHERE id=?`,
      [decision, decidedAt, resultTechnicalItemId, resultVariantId, current.id],
    );
    this.writeActivity(current.id, 'bridge_occurrence_return_decided', summary, {
      decision,
      siteOccurrenceId: current.siteOccurrenceId,
      resultTechnicalItemId,
      resultVariantId,
    });
  }

  private inspect(packagePath: string): InspectedReturn {
    const absolute = resolve(packagePath);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error('Package de retour Bridge introuvable.');
    if (extname(absolute).toLowerCase() !== '.zip') throw new Error('Le retour Bridge doit être un fichier ZIP.');
    if (statSync(absolute).size > 220 * 1024 * 1024) throw new Error('Le package de retour Bridge est trop volumineux.');

    const packageFingerprint = this.sha256(readFileSync(absolute));
    const entries = new Map<string, ZipEntryOutput>(readZipArchive(absolute).map((entry) => [entry.name, entry]));
    const manifestEntry = entries.get('manifest.json');
    if (!manifestEntry) throw new Error('manifest.json absent du retour Bridge.');

    const manifest = this.parseJson<AtoumWebOccurrenceReturnManifestV1>(manifestEntry.data, 'manifest.json');
    const manifestErrors = validateOccurrenceReturnManifestV1(manifest);
    if (manifestErrors.length) throw new Error('Manifest Occurrence Return V1 invalide : ' + manifestErrors.join(' '));

    const declared = [
      manifest.files.occurrence,
      manifest.files.html,
      manifest.files.css,
      manifest.files.javascript,
      manifest.files.assets,
      manifest.files.provenance,
    ].filter((file): file is AtoumWebOccurrenceReturnFile => file !== null);
    for (const file of declared) {
      const entry = entries.get(file.path);
      if (!entry) throw new Error(`Fichier déclaré absent du retour Bridge : ${file.path}`);
      if (this.sha256(entry.data) !== file.sha256.toLowerCase()) {
        throw new Error(`Checksum SHA-256 invalide dans le retour Bridge : ${file.path}`);
      }
    }

    const occurrence = this.parseJson<AtoumWebSiteOccurrenceV1>(
      entries.get(manifest.files.occurrence.path)!.data,
      manifest.files.occurrence.path,
    );
    const occurrenceErrors = validateSiteOccurrenceV1(occurrence);
    if (occurrenceErrors.length) throw new Error('Site Occurrence V1 invalide : ' + occurrenceErrors.join(' '));
    if (occurrence.siteOccurrenceId !== manifest.siteOccurrenceId) {
      throw new Error('siteOccurrenceId incohérent entre le manifest et occurrence.json.');
    }
    if (!isDeepStrictEqual(occurrence.changes, manifest.changes)) {
      throw new Error('Résumé des changements incohérent entre le manifest et occurrence.json.');
    }
    if (occurrence.source.componentPackageContractVersion !== manifest.sourceComponentPackageContractVersion) {
      throw new Error('Version du Component Package source incohérente.');
    }

    const item = this.database.get<{ id: string; name: string }>(
      "SELECT id, name FROM technical_items WHERE id=? AND scope='atoumweb'",
      [occurrence.source.libraryItemId],
    );
    if (!item) throw new Error('Le composant Bibliothèque source du retour Bridge est introuvable.');
    const version = this.database.get<{ id: string; version_number: number; technical_item_id: string }>(
      'SELECT id, version_number, technical_item_id FROM technical_item_versions WHERE id=?',
      [occurrence.source.libraryVersionId],
    );
    if (!version || version.technical_item_id !== item.id) {
      throw new Error('La version Bibliothèque source du retour Bridge est introuvable ou incohérente.');
    }
    if (Number(version.version_number) !== occurrence.source.libraryVersionNumber) {
      throw new Error('Le numéro de version Bibliothèque source du retour Bridge est incohérent.');
    }

    const assets = this.parseObject(entries.get(manifest.files.assets.path)!.data, manifest.files.assets.path);
    const provenance = this.parseObject(entries.get(manifest.files.provenance.path)!.data, manifest.files.provenance.path);
    const html = entries.get(manifest.files.html.path)!.data.toString('utf8');
    const css = manifest.files.css ? entries.get(manifest.files.css.path)!.data.toString('utf8') : null;
    const javascript = manifest.files.javascript ? entries.get(manifest.files.javascript.path)!.data.toString('utf8') : null;
    const existing = this.database.get<{ id: string }>(
      'SELECT id FROM bridge_occurrence_returns WHERE package_fingerprint=?',
      [packageFingerprint],
    );

    return {
      public: {
        packagePath: absolute,
        packageFingerprint,
        siteOccurrenceId: manifest.siteOccurrenceId,
        libraryItemId: item.id,
        libraryVersionId: version.id,
        libraryVersionNumber: Number(version.version_number),
        libraryItemName: item.name,
        returnedAt: manifest.returnedAt,
        occurrenceState: occurrence.state,
        changes: manifest.changes,
        alreadyImported: Boolean(existing),
        existingReturnId: existing?.id ?? null,
      },
      manifest,
      occurrence,
      html,
      css,
      javascript,
      assets,
      provenance,
    };
  }

  private mapSummary(row: ReturnRow): AtoumWebOccurrenceReturnSummary {
    const item = this.database.get<{ name: string }>('SELECT name FROM technical_items WHERE id=?', [row.technical_item_id]);
    return {
      id: row.id,
      packageFingerprint: row.package_fingerprint,
      siteOccurrenceId: row.site_occurrence_id,
      libraryItemId: row.technical_item_id,
      libraryVersionId: row.technical_item_version_id,
      libraryVersionNumber: Number(row.source_version_number),
      libraryItemName: item?.name ?? 'Composant introuvable',
      returnedAt: row.returned_at,
      occurrenceState: row.occurrence_state,
      changes: JSON.parse(row.changes_json),
      decision: row.decision,
      decidedAt: row.decided_at,
      resultTechnicalItemId: row.result_technical_item_id,
      resultVariantId: row.result_variant_id,
      createdAt: row.created_at,
    };
  }

  private mapDetail(row: ReturnRow): AtoumWebOccurrenceReturnDetail {
    return {
      ...this.mapSummary(row),
      occurrence: JSON.parse(row.occurrence_json),
      html: row.html_text,
      css: row.css_text,
      javascript: row.javascript_text,
      assets: JSON.parse(row.assets_json),
      provenance: JSON.parse(row.provenance_json),
      packageRelativePath: row.package_relative_path,
    };
  }

  private parseJson<T>(data: Buffer, label: string): T {
    try {
      return JSON.parse(data.toString('utf8')) as T;
    } catch {
      throw new Error(`JSON invalide dans ${label}.`);
    }
  }

  private parseObject(data: Buffer, label: string): Record<string, unknown> {
    const value = this.parseJson<unknown>(data, label);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} doit contenir un objet JSON.`);
    return value as Record<string, unknown>;
  }

  private sha256(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private writeActivity(entityId: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type, entity_id, action, summary, metadata_json, created_at) VALUES (?,?,?,?,?,?)',
      ['bridge_occurrence_return', entityId, action, summary, JSON.stringify(metadata), nowIso()],
    );
  }
}

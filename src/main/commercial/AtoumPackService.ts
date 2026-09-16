import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import {
  type AtoumPackageData,
  type AtoumPackageSummary,
  type CatalogItemRow,
  type CatalogMapping,
  type CatalogVersionRow,
  type PackageCatalogEntry,
  type PackageDocumentTemplate,
} from './AtoumPackTypes';
import { parseAtoumPackage, readZipEntries } from './atoumZip';

const BUILTIN_PACK_FILES = [
  'Site-Vitrine-v0.2.atoum',
  'E-commerce-v0.2.atoum',
  'Maintenance-v0.2.atoum',
] as const;

const SUPPORTED_BOOTSTRAP_CAPABILITIES = new Set([
  'offer-pack-import-v2',
  'portable-refs-v1',
  'contract-templates-v1',
  'docx-templates-v1',
  'snapshots-v1',
]);

const LEGACY_CATALOG_ALIASES: Record<string, string[]> = {
  'catalog.offer.site-vitrine': ['atoumweb-vitrine'],
  'catalog.offer.ecommerce': ['atoumweb-ecommerce'],
  'catalog.offer.maintenance.wordpress': ['atoumweb-wordpress'],
  'catalog.offer.maintenance.woocommerce': ['atoumweb-woocommerce'],
  'catalog.service.maintenance-audit': ['atoumweb-audit'],
  'catalog.service.migration': ['atoumweb-migration'],
  'catalog.service.page-extra': ['atoumweb-page-eco'],
  'catalog.service.content-client-integration': ['atoumweb-contenu-client'],
  'catalog.service.atoumweb-writing': ['atoumweb-redaction'],
  'catalog.service.image-search': ['atoumweb-images'],
  'catalog.service.variable-product-simple': ['atoumweb-variable-simple'],
  'catalog.service.variable-product-intermediate': ['atoumweb-variable-inter'],
  'catalog.service.variable-product-complex': ['atoumweb-variable-complexe'],
  'catalog.service.catalog-import': ['atoumweb-import'],
  'catalog.service.advanced-shipping': ['atoumweb-livraison'],
  'catalog.service.extra-payment-methods': ['atoumweb-paiement'],
  'catalog.hourpack.10h': ['atoumweb-pack10'],
  'catalog.hourpack.20h': ['atoumweb-pack20'],
  'catalog.hourpack.30h': ['atoumweb-pack30'],
};

const LEGACY_REPLACED_ITEMS = [
  'atoumweb-produits11', 'atoumweb-produits21', 'atoumweb-produits51', 'atoumweb-produits100',
  'atoumweb-wordpress', 'atoumweb-woocommerce',
];

const nowIso = (): string => new Date().toISOString();
const sha256 = (value: Uint8Array): string => createHash('sha256').update(value).digest('hex');
const shortHash = (value: string): string => createHash('sha1').update(value).digest('hex').slice(0, 20);
const safeSegment = (value: string): string => value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || shortHash(value);
const workspaceRelative = (workspace: WorkspacePaths, path: string): string => relative(workspace.root, path).replace(/\\/g, '/');

function versionMatches(row: CatalogVersionRow, entry: PackageCatalogEntry): boolean {
  const version = entry.version;
  return row.description === (version.description ?? null)
    && row.inclusions_json === JSON.stringify(version.inclusions ?? [])
    && row.exclusions_json === JSON.stringify(version.exclusions ?? [])
    && row.prerequisites_json === JSON.stringify(version.prerequisites ?? [])
    && row.price_mode === version.priceMode
    && row.price_cents === (version.priceCents ?? null)
    && row.recommended_price_cents === (version.recommendedPriceCents ?? null)
    && row.estimated_minutes === (version.estimatedMinutes ?? null)
    && row.recommended_delay_days === (version.recommendedDelayDays ?? null)
    && row.default_deposit_percent === (version.defaultDepositPercent ?? null)
    && row.contract_type === (version.contractType ?? null)
    && row.internal_advice === (version.internalAdvice ?? null)
    && row.special_terms === (version.specialTerms ?? null);
}

export class AtoumPackService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
    private readonly appRoot: string,
  ) {}

  list(): AtoumPackageSummary[] {
    return this.database.all<Record<string, unknown>>(
      `SELECT id,package_id,package_version,schema_version,display_name,install_state,capability_gaps_json,source_sha256,installed_at,updated_at
       FROM atoum_packages ORDER BY display_name COLLATE NOCASE, package_version`,
    ).map((row) => ({
      id: String(row.id),
      packageId: String(row.package_id),
      packageVersion: String(row.package_version),
      schemaVersion: String(row.schema_version),
      displayName: String(row.display_name),
      state: row.install_state as AtoumPackageSummary['state'],
      capabilityGaps: JSON.parse(String(row.capability_gaps_json ?? '[]')) as string[],
      sourceSha256: String(row.source_sha256),
      installedAt: String(row.installed_at),
      updatedAt: String(row.updated_at),
    }));
  }

  bootstrapBuiltins(): AtoumPackageSummary[] {
    const directory = join(this.appRoot, 'resources', 'offer-packs');
    if (!existsSync(directory)) return [];
    const imported: AtoumPackageSummary[] = [];
    const loaded: Array<{ recordId: string; data: AtoumPackageData }> = [];
    for (const filename of BUILTIN_PACK_FILES) {
      const path = join(directory, filename);
      if (!existsSync(path)) continue;
      const result = this.installFromFile(path, 'builtin');
      imported.push(result.summary);
      loaded.push({ recordId: result.summary.id, data: result.data });
    }
    for (const pack of loaded) this.reconcileRequirements(pack.recordId, pack.data);
    this.archiveLegacyReplacements();
    return imported;
  }

  installFromFile(sourcePath: string, sourceKind: 'builtin' | 'file' = 'file'): { summary: AtoumPackageSummary; data: AtoumPackageData } {
    const archive = readFileSync(sourcePath);
    const sourceSha = sha256(archive);
    const entries = readZipEntries(archive);
    const data = parseAtoumPackage(entries);
    const manifest = data.manifest;
    const existing = this.database.get<Record<string, unknown>>(
      'SELECT id,source_sha256 FROM atoum_packages WHERE package_id=? AND package_version=?',
      [manifest.packageId, manifest.packageVersion],
    );
    if (existing && String(existing.source_sha256) !== sourceSha) {
      throw new Error(`Le pack ${manifest.packageId} ${manifest.packageVersion} existe déjà avec un contenu différent. Publie une nouvelle packageVersion au lieu d’écraser une version installée.`);
    }

    const requiredCapabilities = manifest.compatibility?.requiredCapabilities ?? [];
    const capabilityGaps = requiredCapabilities.filter((capability) => !SUPPORTED_BOOTSTRAP_CAPABILITIES.has(capability));
    const state: AtoumPackageSummary['state'] = capabilityGaps.length === 0 ? 'installed' : 'staged';
    const now = nowIso();
    const recordId = existing ? String(existing.id) : `atoum-package-${shortHash(`${manifest.packageId}@${manifest.packageVersion}`)}`;
    const packageDirectory = join(this.workspace.packagesDirectory, safeSegment(manifest.packageId), safeSegment(manifest.packageVersion));
    const contractDirectory = join(this.workspace.contractTemplatesDirectory, safeSegment(manifest.packageId), safeSegment(manifest.packageVersion));
    mkdirSync(packageDirectory, { recursive: true });
    mkdirSync(contractDirectory, { recursive: true });
    const installedSourcePath = join(packageDirectory, basename(sourcePath));
    writeFileSync(installedSourcePath, archive);

    const extractedDocuments: Array<{ template: PackageDocumentTemplate; path: string; digest: string }> = [];
    for (const template of data.documents?.templates ?? []) {
      const bytes = entries.get(template.file);
      if (!bytes) throw new Error(`Fichier documentaire absent : ${template.file}.`);
      const destination = join(contractDirectory, basename(template.file));
      writeFileSync(destination, bytes);
      extractedDocuments.push({ template, path: destination, digest: sha256(bytes) });
    }

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.upsertPackage(recordId, data, state, sourceKind, sourceSha, installedSourcePath, capabilityGaps, now, Boolean(existing));
      this.registerPackageDefinitions(recordId, data);
      for (const entry of data.catalog.entries) {
        const mapping = this.installCatalogEntry(recordId, data, entry, now);
        this.upsertPortableRef(recordId, entry.ref, `catalog_${entry.item.type}`, 'materialized', mapping.itemId, mapping.versionId, entry);
      }
      this.reconcileRequirements(recordId, data);
      for (const document of extractedDocuments) this.registerDocument(recordId, document, now);
      this.database.run(
        `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)`,
        ['atoum_package', recordId, existing ? 'refreshed' : 'installed', `${manifest.displayName} ${manifest.packageVersion} ${state === 'installed' ? 'installé' : 'préparé'}`, JSON.stringify({ capabilityGaps }), now],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      if (!existing) {
        rmSync(packageDirectory, { recursive: true, force: true });
        rmSync(contractDirectory, { recursive: true, force: true });
      }
      throw error;
    }
    return { summary: this.getSummary(recordId), data };
  }

  private upsertPackage(recordId: string, data: AtoumPackageData, state: AtoumPackageSummary['state'], sourceKind: 'builtin' | 'file', sourceSha: string, sourcePath: string, capabilityGaps: string[], now: string, exists: boolean): void {
    const manifest = data.manifest;
    if (!exists) {
      this.database.run(
        `INSERT INTO atoum_packages (
          id,package_id,package_version,schema_version,display_name,description,install_state,source_kind,source_sha256,source_relative_path,
          manifest_json,package_snapshot_json,capability_gaps_json,installed_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [recordId, manifest.packageId, manifest.packageVersion, manifest.schemaVersion, manifest.displayName, manifest.description ?? null, state, sourceKind, sourceSha, workspaceRelative(this.workspace, sourcePath), JSON.stringify(manifest), JSON.stringify(data), JSON.stringify(capabilityGaps), now, now],
      );
      return;
    }
    this.database.run(
      `UPDATE atoum_packages SET display_name=?,description=?,install_state=?,source_kind=?,source_relative_path=?,manifest_json=?,package_snapshot_json=?,capability_gaps_json=?,updated_at=? WHERE id=?`,
      [manifest.displayName, manifest.description ?? null, state, sourceKind, workspaceRelative(this.workspace, sourcePath), JSON.stringify(manifest), JSON.stringify(data), JSON.stringify(capabilityGaps), now, recordId],
    );
  }

  private registerDocument(recordId: string, document: { template: PackageDocumentTemplate; path: string; digest: string }, now: string): void {
    const documentId = `atoum-document-${shortHash(`${recordId}|${document.template.ref}|${document.template.version}`)}`;
    this.database.run(
      `INSERT INTO atoum_package_documents (
        id,package_record_id,document_ref,document_version,document_kind,format,engine,source_file,relative_path,sha256,metadata_json,created_at,updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(package_record_id,document_ref,document_version) DO UPDATE SET
         document_kind=excluded.document_kind,format=excluded.format,engine=excluded.engine,source_file=excluded.source_file,
         relative_path=excluded.relative_path,sha256=excluded.sha256,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`,
      [documentId, recordId, document.template.ref, document.template.version, document.template.kind, document.template.format, document.template.engine ?? null, document.template.file, workspaceRelative(this.workspace, document.path), document.digest, JSON.stringify(document.template), now, now],
    );
    this.upsertPortableRef(recordId, document.template.ref, 'document_template', 'materialized', documentId, null, document.template);
  }

  private getSummary(id: string): AtoumPackageSummary {
    const summary = this.list().find((item) => item.id === id);
    if (!summary) throw new Error('Pack .atoum introuvable après installation.');
    return summary;
  }

  private registerPackageDefinitions(recordId: string, data: AtoumPackageData): void {
    const topLevelKinds: Array<[string, string]> = [
      ['fieldDefinitions', 'field'], ['derivedValues', 'derived_value'], ['rules', 'rule'], ['pricingRules', 'pricing_rule'],
      ['paymentSchedules', 'payment_schedule'], ['projectTemplates', 'project_template'], ['prerequisiteDefinitions', 'prerequisite'],
      ['projectPolicies', 'project_policy'], ['validationFlows', 'validation_flow'], ['warrantyPolicies', 'warranty_policy'],
      ['managedAssetPolicies', 'managed_asset_policy'], ['maintenanceActivities', 'maintenance_activity'], ['maintenanceDefinitions', 'maintenance_definition'],
    ];
    for (const [property, kind] of topLevelKinds) {
      const values = data[property];
      if (!Array.isArray(values)) continue;
      for (const value of values) {
        const ref = value && typeof value === 'object' ? (value as { ref?: unknown }).ref : null;
        if (typeof ref === 'string' && ref.trim()) this.upsertPortableRef(recordId, ref, kind, 'package_definition', null, null, value);
      }
    }
    const documentKinds: Array<['variableBindings' | 'parts' | 'contracts', string]> = [
      ['variableBindings', 'document_binding'], ['parts', 'document_part'], ['contracts', 'document_contract'],
    ];
    for (const [property, kind] of documentKinds) {
      for (const value of data.documents?.[property] ?? []) {
        const ref = value && typeof value === 'object' ? (value as { ref?: unknown }).ref : null;
        if (typeof ref === 'string' && ref.trim()) this.upsertPortableRef(recordId, ref, kind, 'package_definition', null, null, value);
      }
    }
    for (const dependency of data.dependencies ?? []) {
      this.upsertPortableRef(recordId, dependency.ref, dependency.kind || 'dependency', `dependency_${dependency.resolution}`, null, null, dependency);
    }
  }

  private installCatalogEntry(recordId: string, data: AtoumPackageData, entry: PackageCatalogEntry, now: string): CatalogMapping {
    const shared = this.database.get<Record<string, unknown>>(
      `SELECT pr.local_id,pr.local_version_id FROM atoum_portable_refs pr JOIN atoum_packages p ON p.id=pr.package_record_id
       WHERE pr.portable_ref=? AND pr.local_id IS NOT NULL AND pr.local_version_id IS NOT NULL AND pr.package_record_id<>?
       ORDER BY p.updated_at DESC LIMIT 1`, [entry.ref, recordId],
    );
    if (shared?.local_id && shared.local_version_id) return { itemId: String(shared.local_id), versionId: String(shared.local_version_id) };

    const aliases = [...new Set([...(data.manifest.installHints?.localAliases?.[entry.ref] ?? []), ...(LEGACY_CATALOG_ALIASES[entry.ref] ?? [])])];
    let item: CatalogItemRow | undefined;
    for (const alias of aliases) {
      const candidate = this.database.get<CatalogItemRow>('SELECT id,item_type FROM catalog_items WHERE id=?', [alias]);
      if (!candidate) continue;
      if (candidate.item_type === entry.item.type) { item = candidate; break; }
      this.database.run(`UPDATE catalog_items SET status='archived',archived_at=COALESCE(archived_at,?),updated_at=? WHERE id=?`, [now, now, alias]);
    }

    if (!item) {
      let itemId = `atoum-${safeSegment(entry.ref)}`;
      const collision = this.database.get<CatalogItemRow>('SELECT id,item_type FROM catalog_items WHERE id=?', [itemId]);
      if (collision && collision.item_type !== entry.item.type) itemId = `${itemId}-${shortHash(entry.ref)}`;
      item = this.database.get<CatalogItemRow>('SELECT id,item_type FROM catalog_items WHERE id=?', [itemId]);
      if (!item) {
        this.database.run(
          `INSERT INTO catalog_items (id,item_type,name,category,subcategory,status,visible_public,created_at,updated_at,archived_at)
           VALUES (?,?,?,?,?,'active',?,?,?,NULL)`,
          [itemId, entry.item.type, entry.item.name, entry.item.category ?? null, entry.item.subcategory ?? null, entry.item.visiblePublic ? 1 : 0, now, now],
        );
        item = { id: itemId, item_type: entry.item.type };
      }
    }

    this.database.run(
      `UPDATE catalog_items SET name=?,category=?,subcategory=?,status='active',visible_public=?,archived_at=NULL,updated_at=? WHERE id=?`,
      [entry.item.name, entry.item.category ?? null, entry.item.subcategory ?? null, entry.item.visiblePublic ? 1 : 0, now, item.id],
    );
    const current = this.database.get<CatalogVersionRow>(`SELECT * FROM catalog_versions WHERE item_id=? AND status='published' ORDER BY version_number DESC LIMIT 1`, [item.id]);
    if (current && versionMatches(current, entry)) return { itemId: item.id, versionId: current.id };

    const latest = this.database.get<Record<string, unknown>>('SELECT version_number FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC LIMIT 1', [item.id]);
    const versionNumber = Number(latest?.version_number ?? 0) + 1;
    const versionId = `atoum-version-${shortHash(`${entry.ref}@${data.manifest.packageVersion}`)}`;
    const version = entry.version;
    this.database.run(`UPDATE catalog_versions SET status='retired' WHERE item_id=? AND status='published'`, [item.id]);
    const existingVersion = this.database.get<Record<string, unknown>>('SELECT id FROM catalog_versions WHERE id=?', [versionId]);
    if (!existingVersion) {
      this.database.run(
        `INSERT INTO catalog_versions (
          id,item_id,version_number,status,description,inclusions_json,exclusions_json,prerequisites_json,price_mode,price_cents,
          recommended_price_cents,estimated_minutes,recommended_delay_days,default_deposit_percent,contract_type,internal_advice,special_terms,published_at,created_at
         ) VALUES (?,?,?,'published',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [versionId, item.id, versionNumber, version.description ?? null, JSON.stringify(version.inclusions ?? []), JSON.stringify(version.exclusions ?? []), JSON.stringify(version.prerequisites ?? []), version.priceMode, version.priceCents ?? null, version.recommendedPriceCents ?? null, version.estimatedMinutes ?? null, version.recommendedDelayDays ?? null, version.defaultDepositPercent ?? null, version.contractType ?? null, version.internalAdvice ?? null, version.specialTerms ?? null, now, now],
      );
    } else {
      this.database.run(`UPDATE catalog_versions SET status='published',published_at=? WHERE id=?`, [now, versionId]);
    }
    return { itemId: item.id, versionId };
  }

  private reconcileRequirements(recordId: string, data: AtoumPackageData): void {
    for (const requirement of data.catalog.requirements ?? []) {
      const resolved = this.resolveCatalogReference(requirement.ref);
      this.upsertPortableRef(recordId, requirement.ref, 'catalog_requirement', requirement.resolution, resolved?.itemId ?? null, resolved?.versionId ?? null, requirement);
    }
  }

  private resolveCatalogReference(ref: string): CatalogMapping | null {
    const mapped = this.database.get<Record<string, unknown>>(
      `SELECT local_id,local_version_id FROM atoum_portable_refs WHERE portable_ref=? AND local_id IS NOT NULL AND local_version_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1`, [ref],
    );
    if (mapped?.local_id && mapped.local_version_id) return { itemId: String(mapped.local_id), versionId: String(mapped.local_version_id) };
    for (const alias of LEGACY_CATALOG_ALIASES[ref] ?? []) {
      const version = this.database.get<Record<string, unknown>>(
        `SELECT i.id AS item_id,v.id AS version_id FROM catalog_items i JOIN catalog_versions v ON v.item_id=i.id AND v.status='published' WHERE i.id=? LIMIT 1`, [alias],
      );
      if (version?.item_id && version.version_id) return { itemId: String(version.item_id), versionId: String(version.version_id) };
    }
    return this.ensureCoreCatalogReference(ref);
  }

  private ensureCoreCatalogReference(ref: string): CatalogMapping | null {
    const definitions: Record<string, { id: string; name: string }> = {
      'catalog.service.hosting.annual': { id: 'atoum-core-hosting-annual', name: 'Hébergement annuel' },
      'catalog.service.domain.annual': { id: 'atoum-core-domain-annual', name: 'Nom de domaine annuel' },
    };
    const definition = definitions[ref];
    if (!definition) return null;
    const now = nowIso();
    if (!this.database.get<Record<string, unknown>>('SELECT id FROM catalog_items WHERE id=?', [definition.id])) {
      this.database.run(
        `INSERT INTO catalog_items (id,item_type,name,category,subcategory,status,visible_public,created_at,updated_at,archived_at)
         VALUES (?,'service',?,'Web','Hébergement & domaine','active',0,?,?,NULL)`, [definition.id, definition.name, now, now],
      );
    }
    const published = this.database.get<Record<string, unknown>>(`SELECT id FROM catalog_versions WHERE item_id=? AND status='published' ORDER BY version_number DESC LIMIT 1`, [definition.id]);
    if (published?.id) return { itemId: definition.id, versionId: String(published.id) };
    const versionId = `${definition.id}-v1`;
    this.database.run(
      `INSERT OR IGNORE INTO catalog_versions (
        id,item_id,version_number,status,description,inclusions_json,exclusions_json,prerequisites_json,price_mode,price_cents,
        recommended_price_cents,estimated_minutes,recommended_delay_days,default_deposit_percent,contract_type,internal_advice,special_terms,published_at,created_at
       ) VALUES (?,?,1,'published',?,'[]','[]','[]','quote_only',NULL,NULL,NULL,NULL,NULL,NULL,?,NULL,?,?)`,
      [versionId, definition.id, definition.name, 'Valeur commerciale à renseigner dans le catalogue AtoumWeb avant utilisation sur un devis.', now, now],
    );
    return { itemId: definition.id, versionId };
  }

  private upsertPortableRef(recordId: string, ref: string, kind: string, resolution: string, localId: string | null, localVersionId: string | null, metadata: unknown): void {
    const now = nowIso();
    const id = `atoum-ref-${shortHash(`${recordId}|${ref}`)}`;
    this.database.run(
      `INSERT INTO atoum_portable_refs (id,package_record_id,portable_ref,ref_kind,resolution,local_id,local_version_id,metadata_json,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(package_record_id,portable_ref) DO UPDATE SET
         ref_kind=excluded.ref_kind,resolution=excluded.resolution,local_id=COALESCE(excluded.local_id,atoum_portable_refs.local_id),
         local_version_id=COALESCE(excluded.local_version_id,atoum_portable_refs.local_version_id),metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`,
      [id, recordId, ref, kind, resolution, localId, localVersionId, JSON.stringify(metadata ?? null), now, now],
    );
  }

  private archiveLegacyReplacements(): void {
    const now = nowIso();
    for (const id of LEGACY_REPLACED_ITEMS) {
      const mapped = this.database.get<Record<string, unknown>>('SELECT COUNT(*) AS count FROM atoum_portable_refs WHERE local_id=?', [id]);
      if (Number(mapped?.count ?? 0) > 0) continue;
      this.database.run(`UPDATE catalog_items SET status='archived',archived_at=COALESCE(archived_at,?),updated_at=? WHERE id=? AND status<>'archived'`, [now, now, id]);
    }
  }
}

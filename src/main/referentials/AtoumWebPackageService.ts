import { inspectAssetTransport, preparePackageAssets, packageAssetReferences, type PackageManifestAsset } from './AtoumWebPackageAssets';
import { isDeepStrictEqual } from 'node:util';
import fieldsSchema from '../../../docs/ATOUMWEB_COMPONENT_FIELDS_V1.schema.json';
import identitySchema from '../../../docs/ATOUMWEB_COMPONENT_IDENTITY_V1.schema.json';
import { validateContractSchemaV1 } from '../../shared/contractSchemaV1';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ATOUMWEB_LIBRARY_CATEGORIES,
  ATOUMWEB_REUSE_STATUSES,
  ATOUMWEB_TECHNICAL_ASSET_ROLES,
  type AtoumWebLibraryCategory,
  type AtoumWebPackageDuplicateCandidate,
  type AtoumWebPackageExportResult,
  type AtoumWebPackageImportInput,
  type AtoumWebPackageImportResult,
  type AtoumWebPackageInspection,
  type AtoumWebReuseStatus,
  type AtoumWebTechnicalAssetRole,
  type AtoumWebTechnicalItemDetail,
  type AtoumWebTechnicalVersion,
} from '../../shared/referentials';
import { PROJECT_TECHNICAL_CONTENT_TYPES, type ProjectTechnicalContentType } from '../../shared/projects';
import { ATOUMWEB_COMPONENT_FIELD_TYPES, canonicalizeComponentFields } from '../../shared/componentPackageFields';
import {
  ATOUMWEB_COMPONENT_REUSABILITY_SCOPES,
  ATOUMWEB_COMPONENT_VARIANT_MODES,
  buildComponentIdentityV1,
  type AtoumWebComponentIdentityV1,
} from '../../shared/componentIdentity';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { readZipArchive, writeZipArchive, type ZipEntryInput, type ZipEntryOutput } from './ZipArchive';

interface BridgeReusableExportPayload {
  schemaVersion: number;
  kind: 'atoumweb-library-reusable-component';
  origin: {
    site: string | null;
    page: string;
    pageUrl: string | null;
    snapshotId: string | null;
    snapshotDate: string | null;
    builderGeneration: string | null;
    occurrenceId: string;
  };
  reusable: {
    html: string;
    css: string;
    javascript: string;
    rootClasses: string[];
    method: string;
    generalized: boolean;
    fields: unknown[];
  };
  identity: Record<string, unknown> | null;
  dependencies: unknown[];
  assets: unknown[];
}

interface BridgeWorkbenchManifest {
  contract: 'atoumweb_bridge_component_package';
  schemaVersion: 1;
  componentPackageContractVersion: 1;
  fieldsContractVersion: 1;
  identityContractVersion: 1;
  flow: 'workbench_first';
  workbenchRequired: true;
  directProductionInjection: false;
  component: {
    libraryItemId: string;
    libraryVersionId: string;
    libraryVersionNumber: number;
    name: string;
    category: AtoumWebLibraryCategory;
    rootClasses: string[];
    generalized: boolean;
    method: string;
    identity: AtoumWebComponentIdentityV1;
  };
  files: {
    html: { path: string; sha256: string };
    css: { path: string; sha256: string } | null;
    javascript: { path: string; sha256: string } | null;
    fields: { path: string; sha256: string };
    identity: { path: string; sha256: string };
    dependencies: { path: string; sha256: string };
    sourceAssets: { path: string; sha256: string };
    provenance: { path: string; sha256: string };
  };
  provenance: BridgeReusableExportPayload['origin'] & {
    libraryItemId: string;
    libraryVersionId: string;
    libraryVersionNumber: number;
  };
}

interface PackageManifestV1 {
  schemaVersion: number;
  purpose: string;
  exportedAt: string;
  safety: {
    automaticCodeExecution: false;
    sourceProjectMutation: false;
  };
  item: {
    name: string;
    category: AtoumWebLibraryCategory;
    description: string | null;
    tags: string[];
    vertical?: string | null;
    reuseStatus: AtoumWebReuseStatus;
  };
  version: {
    exportedVersionNumber: number;
    contentType: ProjectTechnicalContentType;
    language: string | null;
    notes: string | null;
    stable: boolean;
    contentFile: string | null;
    contentSha256: string | null;
  };
  assets: PackageManifestAsset[];
  bridgeWorkbench?: BridgeWorkbenchManifest;
}

interface LoadedPackage {
  inspection: AtoumWebPackageInspection;
  manifest: PackageManifestV1;
  entries: Map<string, ZipEntryOutput>;
}

export class AtoumWebPackageService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
    private readonly library: AtoumWebTechnicalLibraryService,
    private readonly assets: AtoumWebTechnicalAssetService,
  ) {}

  exportItem(itemId: string, requestedVersionId?: string | null): AtoumWebPackageExportResult {
    const item = this.library.get(itemId);
    const version = this.pickVersion(item, requestedVersionId);
    const versionAssets = this.assets.list(version.id);
    const zipEntries: ZipEntryInput[] = [];
    const prepared = preparePackageAssets(version.contentText, versionAssets.map(asset => ({
      role: asset.role, fileName: asset.fileName, mimeType: asset.mimeType ?? null, sizeBytes: asset.sizeBytes,
      checksumSha256: asset.checksumSha256, missing: asset.missing, archivePath: null,
      absolutePath: this.assets.absolutePath(asset),
    })), this.database, this.workspace, zipEntries);
    const exportVersion = { ...version, contentText: prepared.contentText };
    const bridgePayload = this.parseBridgeReusablePayload(exportVersion.contentText);

    let contentFile: string | null = null;
    let contentSha256: string | null = null;
    if (exportVersion.contentText != null) {
      contentFile = `technical/source${this.contentExtension(version.contentType, version.language)}`;
      const data = Buffer.from(exportVersion.contentText, 'utf8');
      contentSha256 = this.sha256(data);
      zipEntries.push({ name: contentFile, data });
    }

    const manifestAssets = prepared.assets;

    const createdAt = new Date().toISOString();
    const bridgeWorkbench = bridgePayload
      ? this.buildBridgeWorkbenchPackage(item, exportVersion, bridgePayload, zipEntries)
      : undefined;

    const manifest: PackageManifestV1 = {
      schemaVersion: 1,
      purpose: 'atoumweb_technical_library_package',
      exportedAt: createdAt,
      safety: { automaticCodeExecution: false, sourceProjectMutation: false },
      item: {
        name: item.name,
        category: item.category,
        description: item.description ?? null,
        tags: item.tags ?? [],
        vertical: item.vertical ?? null,
        reuseStatus: item.reuseStatus,
      },
      version: {
        exportedVersionNumber: version.versionNumber,
        contentType: version.contentType,
        language: version.language ?? null,
        notes: version.notes ?? null,
        stable: version.stable,
        contentFile,
        contentSha256,
      },
      assets: manifestAssets,
      bridgeWorkbench,
    };
    zipEntries.unshift({ name: 'manifest.json', data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8') });

    const directory = join(this.workspace.exportsDirectory, 'bibliotheque-atoumweb');
    mkdirSync(directory, { recursive: true });
    const fileName = `${this.safeSegment(item.name)} - v${version.versionNumber} - ${createdAt.replace(/[:.]/g, '-')}.zip`;
    const destination = join(directory, fileName);
    writeZipArchive(destination, zipEntries);

    this.writeActivity(item.id, 'atoumweb_package_exported', `Paquet ZIP exporté : ${item.name} v${version.versionNumber}`, {
      versionId: version.id,
      path: destination,
      assetCount: manifestAssets.length,
    });

    return {
      path: destination,
      fileName,
      itemId: item.id,
      versionId: version.id,
      versionNumber: version.versionNumber,
      assetCount: manifestAssets.length,
      assetTransport: prepared.transport,
      createdAt,
    };
  }

  private buildBridgeWorkbenchPackage(
    item: AtoumWebTechnicalItemDetail,
    version: AtoumWebTechnicalVersion,
    payload: BridgeReusableExportPayload,
    zipEntries: ZipEntryInput[],
  ): BridgeWorkbenchManifest {
    const addText = (path: string, content: string): { path: string; sha256: string } => {
      const data = Buffer.from(content, 'utf8');
      zipEntries.push({ name: path, data });
      return { path, sha256: this.sha256(data) };
    };

    const html = addText('component/component.html', payload.reusable.html);
    const css = payload.reusable.css.trim()
      ? addText('component/component.css', payload.reusable.css)
      : null;
    const javascript = payload.reusable.javascript.trim()
      ? addText('component/component.js', payload.reusable.javascript)
      : null;
    const canonicalFields = canonicalizeComponentFields(payload.reusable.fields ?? []);
    this.validateComponentFieldsJson(Buffer.from(JSON.stringify(canonicalFields), 'utf8'));
    const fields = addText('component/fields.json', `${JSON.stringify(canonicalFields, null, 2)}\n`);
    const sourceIdentity = payload.identity ?? {};
    const identityValue = buildComponentIdentityV1({
      libraryDisplayName: item.name,
      libraryItemId: item.id,
      libraryVersionId: version.id,
      libraryVersionNumber: version.versionNumber,
      tags: item.tags ?? [],
      componentFamilyId: this.optionalString(sourceIdentity.componentFamilyId ?? sourceIdentity.component_family_id),
      componentKey: this.optionalString(sourceIdentity.componentKey ?? sourceIdentity.component_key),
      libraryVariantId: this.optionalString(sourceIdentity.libraryVariantId ?? sourceIdentity.variant_id),
      variantKey: this.optionalString(sourceIdentity.variantKey ?? sourceIdentity.variant_key),
      variantOf: this.optionalString(sourceIdentity.variantOf ?? sourceIdentity.variant_of),
      variantMode: this.optionalVariantMode(sourceIdentity.variantMode ?? sourceIdentity.variant_mode),
      vertical: this.optionalString(sourceIdentity.vertical) ?? item.vertical ?? null,
      reusabilityScope: this.optionalReusabilityScope(sourceIdentity.reusabilityScope ?? sourceIdentity.reusability_scope),
    });
    this.validateComponentIdentityJson(Buffer.from(JSON.stringify(identityValue), 'utf8'), identityValue);
    const identity = addText('component/identity.json', `${JSON.stringify(identityValue, null, 2)}\n`);
    const dependencies = addText('component/dependencies.json', `${JSON.stringify(payload.dependencies ?? [], null, 2)}\n`);
    const sourceAssets = addText('component/source-assets.json', `${JSON.stringify(payload.assets ?? [], null, 2)}\n`);
    const provenanceValue = {
      ...payload.origin,
      libraryItemId: item.id,
      libraryVersionId: version.id,
      libraryVersionNumber: version.versionNumber,
    };
    const provenance = addText('component/provenance.json', `${JSON.stringify(provenanceValue, null, 2)}\n`);

    return {
      contract: 'atoumweb_bridge_component_package',
      schemaVersion: 1,
      componentPackageContractVersion: 1,
      fieldsContractVersion: 1,
      identityContractVersion: 1,
      flow: 'workbench_first',
      workbenchRequired: true,
      directProductionInjection: false,
      component: {
        libraryItemId: item.id,
        libraryVersionId: version.id,
        libraryVersionNumber: version.versionNumber,
        name: item.name,
        category: item.category,
        rootClasses: payload.reusable.rootClasses,
        generalized: payload.reusable.generalized,
        method: payload.reusable.method,
        identity: identityValue,
      },
      files: { html, css, javascript, fields, identity, dependencies, sourceAssets, provenance },
      provenance: provenanceValue,
    };
  }

  private parseBridgeReusablePayload(contentText: string | null | undefined): BridgeReusableExportPayload | null {
    if (!contentText?.trim()) return null;
    try {
      const value = JSON.parse(contentText) as Record<string, unknown>;
      if (value.kind !== 'atoumweb-library-reusable-component') return null;
      const origin = value.origin;
      const reusable = value.reusable;
      if (!origin || typeof origin !== 'object' || !reusable || typeof reusable !== 'object') return null;
      const reusableValue = reusable as Record<string, unknown>;
      if (typeof reusableValue.html !== 'string' || typeof reusableValue.css !== 'string' || typeof reusableValue.javascript !== 'string') return null;

      const originValue = origin as Record<string, unknown>;
      return {
        schemaVersion: Number(value.schemaVersion ?? 1),
        kind: 'atoumweb-library-reusable-component',
        origin: {
          site: typeof originValue.site === 'string' ? originValue.site : null,
          page: typeof originValue.page === 'string' ? originValue.page : 'Page inconnue',
          pageUrl: typeof originValue.pageUrl === 'string' ? originValue.pageUrl : null,
          snapshotId: typeof originValue.snapshotId === 'string' ? originValue.snapshotId : null,
          snapshotDate: typeof originValue.snapshotDate === 'string' ? originValue.snapshotDate : null,
          builderGeneration: typeof originValue.builderGeneration === 'string' ? originValue.builderGeneration : null,
          occurrenceId: typeof originValue.occurrenceId === 'string' ? originValue.occurrenceId : '',
        },
        reusable: {
          html: reusableValue.html,
          css: reusableValue.css,
          javascript: reusableValue.javascript,
          rootClasses: Array.isArray(reusableValue.rootClasses)
            ? reusableValue.rootClasses.filter((entry): entry is string => typeof entry === 'string')
            : [],
          method: typeof reusableValue.method === 'string' ? reusableValue.method : 'divi-code',
          generalized: reusableValue.generalized === true,
          fields: Array.isArray(reusableValue.fields) ? reusableValue.fields : [],
        },
        identity: value.identity && typeof value.identity === 'object' ? value.identity as Record<string, unknown> : null,
        dependencies: Array.isArray(value.dependencies) ? value.dependencies : [],
        assets: Array.isArray(value.assets) ? value.assets : [],
      };
    } catch {
      return null;
    }
  }

  inspectPackage(path: string): AtoumWebPackageInspection {
    return this.loadPackage(path).inspection;
  }

  importPackage(input: AtoumWebPackageImportInput): AtoumWebPackageImportResult {
    const { inspection, manifest, entries } = this.loadPackage(input.packagePath);
    if (input.mode !== 'new_item' && input.mode !== 'new_version') throw new Error('Mode d’import invalide.');
    if (!inspection.assetTransport.complete) {
      throw new Error('Import incomplet refusé : ' + inspection.assetTransport.issues.join(' '));
    }
    if (input.mode === 'new_version') {
      if (!input.targetItemId) throw new Error('Un composant AtoumWeb cible est requis pour importer comme nouvelle version.');
      this.library.get(input.targetItemId);
    }
    const versionInput = {
      contentType: inspection.version.contentType,
      language: inspection.version.language ?? null,
      contentText: inspection.version.contentText ?? null,
      notes: inspection.version.notes ?? null,
    };
    const tempDirectory = mkdtempSync(join(tmpdir(), 'atoumweb-package-import-'));
    const createdFiles: string[] = [];
    let transactionStarted = false;
    const cleanTemporary = () => {
      const temporaryRoot = resolve(tmpdir());
      const candidate = resolve(tempDirectory);
      if (!candidate.startsWith(temporaryRoot + sep) || !basename(candidate).startsWith('atoumweb-package-import-')) {
        throw new Error('Dossier temporaire d’import invalide.');
      }
      rmSync(candidate, { recursive: true, force: true });
    };
    try {
      // Stage and verify every physical file before creating any item/version.
      const staged: Array<{ path: string; asset: PackageManifestAsset }> = [];
      const hashes = new Set<string>();
      for (const asset of manifest.assets) {
        const hash = asset.checksumSha256.toLowerCase();
        if (hashes.has(hash)) continue;
        const entry = asset.archivePath ? entries.get(asset.archivePath) : undefined;
        if (!entry || asset.missing) throw new Error('Asset indispensable absent : ' + asset.fileName);
        const directory = join(tempDirectory, String(staged.length));
        mkdirSync(directory);
        const path = join(directory, this.safeFileName(asset.fileName));
        writeFileSync(path, entry.data);
        if (this.sha256(readFileSync(path)) !== hash) throw new Error('Asset préparé altéré : ' + asset.fileName);
        staged.push({ path, asset });
        hashes.add(hash);
      }

      this.database.exec('BEGIN IMMEDIATE;');
      transactionStarted = true;
      let detail: AtoumWebTechnicalItemDetail;
      if (input.mode === 'new_item') {
        const overrides = input.itemOverrides ?? {};
        detail = this.library.create({
          name: overrides.name ?? inspection.item.name,
          category: overrides.category ?? inspection.item.category,
          description: overrides.description === undefined ? inspection.item.description : overrides.description,
          tags: overrides.tags ?? inspection.item.tags,
          vertical: overrides.vertical === undefined ? inspection.item.vertical ?? null : overrides.vertical,
          reuseStatus: overrides.reuseStatus ?? inspection.item.reuseStatus,
          originTechnicalItemId: null,
        }, versionInput);
      } else {
        detail = this.library.createVersion(input.targetItemId!, versionInput);
      }
      const targetVersionId = detail.currentVersion?.id;
      if (!targetVersionId) throw new Error('La version importée est introuvable.');
      for (const { path, asset } of staged) {
        const imported = this.assets.importFilePaths(targetVersionId, [path], asset.role, createdFiles);
        const match = imported.find(file => file.checksumSha256.toLowerCase() === asset.checksumSha256.toLowerCase());
        if (!match || match.missing || this.sha256(readFileSync(this.assets.absolutePath(match))) !== asset.checksumSha256.toLowerCase()) {
          throw new Error('Import du fichier non confirmé : ' + asset.fileName);
        }
      }
      detail = input.markStable ? this.library.markStable(targetVersionId) : this.library.get(detail.id);
      this.writeActivity(detail.id, 'atoumweb_package_imported', 'Paquet ZIP importé : ' + detail.name, {
        packagePath: input.packagePath, importedAs: input.mode, importedAssetCount: staged.length,
        exportedVersionNumber: inspection.version.exportedVersionNumber,
      });
      cleanTemporary();
      this.database.exec('COMMIT;');
      transactionStarted = false;
      return { item: detail, importedAssetCount: staged.length, importedAs: input.mode };
    } catch (error) {
      const failures: unknown[] = [error];
      if (transactionStarted) {
        try { this.database.exec('ROLLBACK;'); } catch (rollbackError) { failures.push(rollbackError); }
      }
      // Remove only files created by this attempt, never shared vault objects.
      for (const file of createdFiles) {
        try {
          const candidate = resolve(file);
          if (!candidate.startsWith(resolve(this.workspace.atoumWebLibraryDirectory) + sep)) {
            throw new Error('Chemin de compensation hors Bibliothèque.');
          }
          rmSync(candidate, { force: true });
        } catch (cleanupError) { failures.push(cleanupError); }
      }
      try { cleanTemporary(); } catch (cleanupError) { failures.push(cleanupError); }
      if (failures.length > 1) throw new AggregateError(failures, 'Import annulé ; nettoyage incomplet à vérifier : ' + failures.map(String).join(' ; '));
      throw error;
    }
  }

  assertExportPath(path: string): string {
    const root = resolve(this.workspace.exportsDirectory, 'bibliotheque-atoumweb');
    const candidate = resolve(path);
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
      throw new Error('Ce chemin ne correspond pas à un export Bibliothèque AtoumWeb.');
    }
    return candidate;
  }

  private loadPackage(path: string): LoadedPackage {
    const absolute = resolve(path);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error('Paquet ZIP introuvable.');
    if (extname(absolute).toLowerCase() !== '.zip') throw new Error('Le paquet Bibliothèque doit être un fichier ZIP.');
    if (statSync(absolute).size > 220 * 1024 * 1024) throw new Error('Le paquet ZIP est trop volumineux.');

    const entriesArray = readZipArchive(absolute);
    const entries = new Map(entriesArray.map((entry) => [entry.name, entry]));
    const manifestEntry = entries.get('manifest.json');
    if (!manifestEntry) throw new Error('Le paquet ne contient pas de manifest.json.');
    if (manifestEntry.data.length > 1024 * 1024) throw new Error('Le manifeste du paquet est trop volumineux.');

    let manifest: PackageManifestV1;
    try {
      manifest = JSON.parse(manifestEntry.data.toString('utf8')) as PackageManifestV1;
    } catch {
      throw new Error('Le manifeste du paquet est invalide.');
    }
    this.validateManifest(manifest, entries);

    const contentText = manifest.version.contentFile
      ? entries.get(manifest.version.contentFile)!.data.toString('utf8')
      : null;
    if (manifest.bridgeWorkbench) {
      const declared = JSON.parse(entries.get(manifest.bridgeWorkbench.files.sourceAssets.path)!.data.toString('utf8'));
      if (!isDeepStrictEqual(declared, packageAssetReferences(contentText))) throw new Error('Références d’assets incohérentes entre source et composant.');
    }
    const inspection: AtoumWebPackageInspection = {
      packagePath: absolute,
      schemaVersion: manifest.schemaVersion,
      item: {
        name: manifest.item.name,
        category: manifest.item.category,
        description: manifest.item.description,
        tags: manifest.item.tags,
        vertical: typeof manifest.item.vertical === 'string' ? manifest.item.vertical : null,
        reuseStatus: manifest.item.reuseStatus,
      },
      version: {
        contentType: manifest.version.contentType,
        language: manifest.version.language,
        contentText,
        notes: manifest.version.notes,
        exportedVersionNumber: manifest.version.exportedVersionNumber,
        stable: manifest.version.stable,
      },
      assetCount: manifest.assets.length,
      missingAssetCount: manifest.assets.filter((asset) => asset.missing).length,
      assetTransport: inspectAssetTransport(contentText, manifest.assets),
      probableDuplicates: this.findProbableDuplicates(manifest, contentText),
    };
    return { inspection, manifest, entries };
  }

  private validateManifest(manifest: PackageManifestV1, entries: Map<string, ZipEntryOutput>): void {
    if (manifest.schemaVersion !== 1 || manifest.purpose !== 'atoumweb_technical_library_package') {
      throw new Error('Format de paquet Bibliothèque AtoumWeb non pris en charge.');
    }
    if (!manifest.item || typeof manifest.item.name !== 'string' || !manifest.item.name.trim()) {
      throw new Error('Nom du composant manquant dans le manifeste.');
    }
    if (!ATOUMWEB_LIBRARY_CATEGORIES.includes(manifest.item.category)) throw new Error('Catégorie de paquet invalide.');
    if (!ATOUMWEB_REUSE_STATUSES.includes(manifest.item.reuseStatus)) throw new Error('Statut de réutilisation invalide dans le paquet.');
    if (!Array.isArray(manifest.item.tags) || manifest.item.tags.some((tag) => typeof tag !== 'string')) throw new Error('Tags invalides dans le paquet.');
    if (manifest.item.vertical != null && typeof manifest.item.vertical !== 'string') throw new Error('Métier invalide dans le paquet.');
    if (!manifest.version || !PROJECT_TECHNICAL_CONTENT_TYPES.includes(manifest.version.contentType)) throw new Error('Type de contenu invalide dans le paquet.');
    if (!Number.isInteger(manifest.version.exportedVersionNumber) || manifest.version.exportedVersionNumber < 1) throw new Error('Numéro de version exportée invalide.');

    if (manifest.version.contentFile) {
      const entry = entries.get(manifest.version.contentFile);
      if (!entry) throw new Error('Le contenu technique déclaré est absent du ZIP.');
      if (manifest.version.contentSha256 && this.sha256(entry.data) !== manifest.version.contentSha256) {
        throw new Error('Checksum du contenu technique invalide.');
      }
    }

    if (manifest.bridgeWorkbench) {
      const bridge = manifest.bridgeWorkbench;
      if (bridge.contract !== 'atoumweb_bridge_component_package' || bridge.schemaVersion !== 1) {
        throw new Error('Format du package Bridge Workbench non pris en charge.');
      }
      if (bridge.componentPackageContractVersion !== 1 || bridge.fieldsContractVersion !== 1 || bridge.identityContractVersion !== 1) {
        throw new Error('Version du Component Package Contract, de fields.json ou de identity.json non prise en charge.');
      }
      if (bridge.flow !== 'workbench_first' || bridge.workbenchRequired !== true || bridge.directProductionInjection !== false) {
        throw new Error('Le package Bridge doit imposer un passage par Workbench avant production.');
      }
      if (!bridge.files || !bridge.component || !bridge.provenance) throw new Error('Sections Bridge obligatoires manquantes.');
      for (const key of ['html', 'fields', 'identity', 'dependencies', 'sourceAssets', 'provenance'] as const) {
        if (!bridge.files[key]) throw new Error('Fichier Bridge obligatoire manquant : ' + key);
      }
      const declaredFiles = [
        bridge.files.html,
        bridge.files.css,
        bridge.files.javascript,
        bridge.files.fields,
        bridge.files.identity,
        bridge.files.dependencies,
        bridge.files.sourceAssets,
        bridge.files.provenance,
      ].filter((entry): entry is { path: string; sha256: string } => Boolean(entry));
      for (const file of declaredFiles) {
        if (typeof file.path !== 'string' || !file.path.trim()) throw new Error('Chemin de fichier Bridge invalide.');
        if (typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sha256)) throw new Error(`Checksum Bridge invalide : ${file.path}`);
        const entry = entries.get(file.path);
        if (!entry) throw new Error(`Fichier Bridge déclaré absent du ZIP : ${file.path}`);
        if (this.sha256(entry.data) !== file.sha256) throw new Error(`Checksum Bridge invalide : ${file.path}`);
      }

      const fieldsEntry = entries.get(bridge.files.fields.path);
      if (!fieldsEntry) throw new Error('fields.json déclaré absent du package Bridge.');
      this.validateComponentFieldsJson(fieldsEntry.data);

      const identityEntry = entries.get(bridge.files.identity.path);
      if (!identityEntry) throw new Error('identity.json déclaré absent du package Bridge.');
      this.validateComponentIdentityJson(identityEntry.data, bridge.component.identity);
      const provenance = JSON.parse(entries.get(bridge.files.provenance.path)!.data.toString('utf8')) as Record<string, unknown>;
      if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) throw new Error('Provenance invalide.');
      for (const key of ['libraryItemId', 'libraryVersionId', 'libraryVersionNumber'] as const) {
        const expected = bridge.component.identity[key];
        if (bridge.component[key] !== expected || bridge.provenance[key] !== expected || provenance[key] !== expected) {
          throw new Error('Identifiant incohérent dans le package : ' + key);
        }
      }
      if (manifest.version.exportedVersionNumber !== bridge.component.identity.libraryVersionNumber) {
        throw new Error('Numéro de version incohérent dans le package.');
      }
    }

    if (!Array.isArray(manifest.assets)) throw new Error('Liste des assets invalide.');
    for (const asset of manifest.assets) {
      if (!ATOUMWEB_TECHNICAL_ASSET_ROLES.includes(asset.role)) throw new Error('Rôle d’asset invalide dans le paquet.');
      if (typeof asset.fileName !== 'string' || !asset.fileName.trim()) throw new Error('Nom d’asset invalide dans le paquet.');
      if (!Number.isInteger(asset.sizeBytes) || asset.sizeBytes < 0) throw new Error(`Taille d’asset invalide : ${asset.fileName}`);
      if (typeof asset.checksumSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(asset.checksumSha256)) throw new Error(`Checksum d’asset invalide : ${asset.fileName}`);
      if (asset.missing) continue;
      if (!asset.archivePath) throw new Error(`Chemin d’asset absent : ${asset.fileName}`);
      const entry = entries.get(asset.archivePath);
      if (!entry) throw new Error(`Asset déclaré absent du ZIP : ${asset.fileName}`);
      if (entry.data.length !== asset.sizeBytes) throw new Error(`Taille d’asset incohérente : ${asset.fileName}`);
      if (this.sha256(entry.data) !== asset.checksumSha256) throw new Error(`Checksum d’asset invalide : ${asset.fileName}`);
    }
  }

  private validateComponentIdentityJson(data: Buffer, manifestIdentity: AtoumWebComponentIdentityV1): void {
    let value: unknown;
    try {
      value = JSON.parse(data.toString('utf8'));
    } catch {
      throw new Error('component/identity.json est invalide.');
    }
    if (!value || typeof value !== 'object') throw new Error('component/identity.json doit être un objet.');
    const identityErrors = [...validateContractSchemaV1(value, identitySchema), ...validateContractSchemaV1(manifestIdentity, identitySchema)];
    if (identityErrors.length) throw new Error('identity.json invalide : ' + identityErrors.join(' '));
    const identity = value as Record<string, unknown>;
    if (identity.contract !== 'atoumweb_component_identity' || identity.schemaVersion !== 1) {
      throw new Error('Component Identity Contract non pris en charge.');
    }
    if (identity.classificationStatus !== 'classified' && identity.classificationStatus !== 'unclassified') {
      throw new Error('Statut de classification du composant invalide.');
    }
    if (typeof identity.libraryDisplayName !== 'string' || !identity.libraryDisplayName.trim()) {
      throw new Error('Nom affiché de Bibliothèque manquant dans identity.json.');
    }
    if (identity.componentKey != null && (typeof identity.componentKey !== 'string' || !/^aw-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identity.componentKey))) {
      throw new Error('component_key invalide dans identity.json.');
    }
    if (typeof identity.reusabilityScope !== 'string' || !(ATOUMWEB_COMPONENT_REUSABILITY_SCOPES as readonly string[]).includes(identity.reusabilityScope)) {
      throw new Error('Réutilisabilité invalide dans identity.json.');
    }
    if (typeof identity.variantMode !== 'string' || !(ATOUMWEB_COMPONENT_VARIANT_MODES as readonly string[]).includes(identity.variantMode)) {
      throw new Error('Mode de variante invalide dans identity.json.');
    }
    if (!isDeepStrictEqual(identity, manifestIdentity)) {
      throw new Error('identity.json ne correspond pas à l’identité déclarée dans le manifeste.');
    }
  }

  private optionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private optionalVariantMode(value: unknown): AtoumWebComponentIdentityV1['variantMode'] | null {
    return typeof value === 'string' && (ATOUMWEB_COMPONENT_VARIANT_MODES as readonly string[]).includes(value)
      ? value as AtoumWebComponentIdentityV1['variantMode']
      : null;
  }

  private optionalReusabilityScope(value: unknown): AtoumWebComponentIdentityV1['reusabilityScope'] | null {
    return typeof value === 'string' && (ATOUMWEB_COMPONENT_REUSABILITY_SCOPES as readonly string[]).includes(value)
      ? value as AtoumWebComponentIdentityV1['reusabilityScope']
      : null;
  }

  private validateComponentFieldsJson(data: Buffer): void {
    let value: unknown;
    try {
      value = JSON.parse(data.toString('utf8'));
    } catch {
      throw new Error('component/fields.json est invalide.');
    }
    if (!value || typeof value !== 'object') throw new Error('component/fields.json doit être un objet.');
    const fieldErrors = validateContractSchemaV1(value, fieldsSchema);
    if (fieldErrors.length) throw new Error('fields.json invalide : ' + fieldErrors.join(' '));
    const document = value as Record<string, unknown>;
    if (document.contract !== 'atoumweb_component_fields' || document.schemaVersion !== 1 || !Array.isArray(document.fields)) {
      throw new Error('Component Fields Contract non pris en charge.');
    }

    const ids = new Set<string>();
    for (const entry of document.fields) {
      if (!entry || typeof entry !== 'object') throw new Error('Champ configurable invalide.');
      const field = entry as Record<string, unknown>;
      if (typeof field.id !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/.test(field.id)) throw new Error('ID de champ configurable invalide.');
      if (ids.has(field.id)) throw new Error(`ID de champ configurable dupliqué : ${field.id}`);
      ids.add(field.id);
      if (typeof field.type !== 'string' || !(ATOUMWEB_COMPONENT_FIELD_TYPES as readonly string[]).includes(field.type)) {
        throw new Error(`Type de champ configurable invalide : ${field.id}`);
      }
      if (typeof field.label !== 'string' || !field.label.trim()) throw new Error(`Libellé de champ configurable manquant : ${field.id}`);
      if (typeof field.required !== 'boolean') throw new Error(`Propriété required invalide : ${field.id}`);
      if (!field.binding || typeof field.binding !== 'object') throw new Error(`Binding manquant : ${field.id}`);
      const binding = field.binding as Record<string, unknown>;
      const bindingType = binding.type;
      if (!['html_text', 'html_html', 'html_attribute', 'css_variable', 'css_url', 'unresolved'].includes(String(bindingType))) {
        throw new Error(`Binding non pris en charge : ${field.id}`);
      }
      if (!field.source || typeof field.source !== 'object') throw new Error(`Source du champ manquante : ${field.id}`);
      const source = field.source as Record<string, unknown>;
      if (source.mode !== 'declared' && source.mode !== 'auto_detected') throw new Error(`Source du champ invalide : ${field.id}`);
    }
  }

  private findProbableDuplicates(manifest: PackageManifestV1, contentText: string | null): AtoumWebPackageDuplicateCandidate[] {
    const results = new Map<string, AtoumWebPackageDuplicateCandidate>();
    const normalizedName = manifest.item.name.trim().toLocaleLowerCase('fr-FR');
    const contentHash = contentText == null ? null : this.sha256(Buffer.from(contentText, 'utf8'));
    for (const item of this.library.list({ includeArchived: true })) {
      if (item.category === manifest.item.category && item.name.trim().toLocaleLowerCase('fr-FR') === normalizedName) {
        results.set(item.id, { itemId: item.id, name: item.name, category: item.category, reason: 'same_name_category' });
      }
      if (contentHash) {
        const detail = this.library.get(item.id);
        const candidateVersions = [detail.currentVersion, detail.stableVersion].filter(Boolean) as AtoumWebTechnicalVersion[];
        if (candidateVersions.some((version) => version.contentText != null && this.sha256(Buffer.from(version.contentText, 'utf8')) === contentHash)) {
          results.set(item.id, { itemId: item.id, name: item.name, category: item.category, reason: 'same_content' });
        }
      }
    }
    return [...results.values()];
  }

  private pickVersion(item: AtoumWebTechnicalItemDetail, requestedVersionId?: string | null): AtoumWebTechnicalVersion {
    const version = requestedVersionId
      ? item.versions.find((candidate) => candidate.id === requestedVersionId)
      : item.stableVersion ?? item.currentVersion ?? item.versions[0];
    if (!version) throw new Error('Aucune version à exporter.');
    if (requestedVersionId && version.id !== requestedVersionId) throw new Error('La version demandée n’appartient pas à ce composant AtoumWeb.');
    return version;
  }

  private contentExtension(contentType: ProjectTechnicalContentType, language?: string | null): string {
    if (contentType === 'json') return '.json';
    if (contentType === 'text') return '.txt';
    const normalized = language?.trim().toLowerCase();
    const extensions: Record<string, string> = {
      php: '.php', css: '.css', javascript: '.js', js: '.js', typescript: '.ts', ts: '.ts', tsx: '.tsx', jsx: '.jsx',
      html: '.html', json: '.json', sql: '.sql', markdown: '.md', md: '.md',
    };
    return normalized ? (extensions[normalized] ?? `.${normalized.replace(/[^a-z0-9_-]/g, '') || 'txt'}`) : '.txt';
  }

  private safeFileName(value: string): string {
    const clean = basename(value).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '').trim();
    return clean.slice(0, 120) || 'fichier';
  }

  private safeSegment(value: string): string {
    return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 90) || 'Composant AtoumWeb';
  }

  private sha256(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private writeActivity(itemId: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      ['atoumweb_technical_item', itemId, action, summary, JSON.stringify(metadata), new Date().toISOString()],
    );
  }
}

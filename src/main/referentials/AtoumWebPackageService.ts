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
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { readZipArchive, writeZipArchive, type ZipEntryInput, type ZipEntryOutput } from './ZipArchive';

interface PackageManifestAsset {
  role: AtoumWebTechnicalAssetRole;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  checksumSha256: string;
  archivePath: string | null;
  missing: boolean;
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

    let contentFile: string | null = null;
    let contentSha256: string | null = null;
    if (version.contentText != null) {
      contentFile = `technical/source${this.contentExtension(version.contentType, version.language)}`;
      const data = Buffer.from(version.contentText, 'utf8');
      contentSha256 = this.sha256(data);
      zipEntries.push({ name: contentFile, data });
    }

    const manifestAssets: PackageManifestAsset[] = [];
    for (const asset of versionAssets) {
      if (asset.missing) {
        manifestAssets.push({
          role: asset.role,
          fileName: asset.fileName,
          mimeType: asset.mimeType ?? null,
          sizeBytes: asset.sizeBytes,
          checksumSha256: asset.checksumSha256,
          archivePath: null,
          missing: true,
        });
        continue;
      }
      const absolute = this.assets.absolutePath(asset);
      if (!existsSync(absolute) || !statSync(absolute).isFile()) {
        manifestAssets.push({
          role: asset.role,
          fileName: asset.fileName,
          mimeType: asset.mimeType ?? null,
          sizeBytes: asset.sizeBytes,
          checksumSha256: asset.checksumSha256,
          archivePath: null,
          missing: true,
        });
        continue;
      }
      const data = readFileSync(absolute);
      const archivePath = `assets/${asset.role}/${asset.id}-${this.safeFileName(asset.fileName)}`;
      const checksum = this.sha256(data);
      zipEntries.push({ name: archivePath, data });
      manifestAssets.push({
        role: asset.role,
        fileName: asset.fileName,
        mimeType: asset.mimeType ?? null,
        sizeBytes: data.length,
        checksumSha256: checksum,
        archivePath,
        missing: false,
      });
    }

    const createdAt = new Date().toISOString();
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
      createdAt,
    };
  }

  inspectPackage(path: string): AtoumWebPackageInspection {
    return this.loadPackage(path).inspection;
  }

  importPackage(input: AtoumWebPackageImportInput): AtoumWebPackageImportResult {
    const loaded = this.loadPackage(input.packagePath);
    const { inspection, manifest, entries } = loaded;
    const versionInput = {
      contentType: inspection.version.contentType,
      language: inspection.version.language ?? null,
      contentText: inspection.version.contentText ?? null,
      notes: inspection.version.notes ?? null,
    };

    let detail: AtoumWebTechnicalItemDetail;
    let importedAs: 'new_item' | 'new_version';
    if (input.mode === 'new_item') {
      const overrides = input.itemOverrides ?? {};
      detail = this.library.create(
        {
          name: overrides.name ?? inspection.item.name,
          category: overrides.category ?? inspection.item.category,
          description: overrides.description === undefined ? inspection.item.description : overrides.description,
          tags: overrides.tags ?? inspection.item.tags,
          reuseStatus: overrides.reuseStatus ?? inspection.item.reuseStatus,
          originTechnicalItemId: null,
        },
        versionInput,
      );
      importedAs = 'new_item';
    } else {
      if (!input.targetItemId) throw new Error('Un composant AtoumWeb cible est requis pour importer comme nouvelle version.');
      detail = this.library.createVersion(input.targetItemId, versionInput);
      importedAs = 'new_version';
    }

    const targetVersionId = detail.currentVersion?.id;
    if (!targetVersionId) throw new Error('La version importée est introuvable.');

    let importedAssetCount = 0;
    const tempDirectory = mkdtempSync(join(tmpdir(), 'atoumweb-package-import-'));
    try {
      for (const asset of manifest.assets) {
        if (asset.missing || !asset.archivePath) continue;
        const entry = entries.get(asset.archivePath);
        if (!entry) throw new Error(`Asset manquant dans le ZIP : ${asset.fileName}`);
        const roleDirectory = join(tempDirectory, asset.role);
        mkdirSync(roleDirectory, { recursive: true });
        const destination = join(roleDirectory, this.safeFileName(asset.fileName));
        writeFileSync(destination, entry.data);
        const before = this.assets.list(targetVersionId).length;
        const after = this.assets.importFilePaths(targetVersionId, [destination], asset.role).length;
        if (after > before) importedAssetCount += 1;
      }
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }

    if (input.markStable) {
      detail = this.library.markStable(targetVersionId);
    } else {
      detail = this.library.get(detail.id);
    }

    this.writeActivity(detail.id, 'atoumweb_package_imported', `Paquet ZIP importé : ${detail.name}`, {
      packagePath: input.packagePath,
      importedAs,
      importedAssetCount,
      exportedVersionNumber: inspection.version.exportedVersionNumber,
    });

    return { item: detail, importedAssetCount, importedAs };
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
    const inspection: AtoumWebPackageInspection = {
      packagePath: absolute,
      schemaVersion: manifest.schemaVersion,
      item: {
        name: manifest.item.name,
        category: manifest.item.category,
        description: manifest.item.description,
        tags: manifest.item.tags,
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
    if (!manifest.version || !PROJECT_TECHNICAL_CONTENT_TYPES.includes(manifest.version.contentType)) throw new Error('Type de contenu invalide dans le paquet.');
    if (!Number.isInteger(manifest.version.exportedVersionNumber) || manifest.version.exportedVersionNumber < 1) throw new Error('Numéro de version exportée invalide.');

    if (manifest.version.contentFile) {
      const entry = entries.get(manifest.version.contentFile);
      if (!entry) throw new Error('Le contenu technique déclaré est absent du ZIP.');
      if (manifest.version.contentSha256 && this.sha256(entry.data) !== manifest.version.contentSha256) {
        throw new Error('Checksum du contenu technique invalide.');
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

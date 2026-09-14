import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import type {
  ReuseCreateGlobalInput,
  ReusePreparationCopiedFile,
  ReusePreparationInput,
  ReusePreparationResult,
} from '../../shared/referentials';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';

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

export class ReusePreparationService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
    private readonly globalLibrary: AtoumWebTechnicalLibraryService,
    private readonly globalAssets: AtoumWebTechnicalAssetService,
  ) {}

  prepareProjectItem(input: ReusePreparationInput): ReusePreparationResult {
    const item = this.requireProjectItem(input.itemId);
    if (item.archived_at) throw new Error('Un élément technique archivé ne peut pas être préparé pour réutilisation.');
    const project = this.requireProject(item.project_id);
    const version = this.pickVersion(item.id, input.versionId);
    const linkedAssets = this.linkedAssets(version.id);
    const createdAt = new Date().toISOString();

    const packageDirectory = this.createPackageDirectory(item.name, Number(version.version_number), createdAt);
    const contentDirectory = join(packageDirectory, 'contenu');
    const sourcesDirectory = join(packageDirectory, 'sources');
    mkdirSync(contentDirectory, { recursive: true });
    mkdirSync(sourcesDirectory, { recursive: true });

    const contentPath = this.writeContentFile(version, contentDirectory);
    const copiedFiles = linkedAssets.map((asset) => this.copyLinkedAsset(asset, sourcesDirectory, packageDirectory));
    const adaptationNotesPath = join(packageDirectory, 'notes-adaptation.md');
    writeFileSync(adaptationNotesPath, this.adaptationNotes(project, item, version, input.adaptationNotes), 'utf8');

    const resultBase = {
      projectId: project.id,
      itemId: item.id,
      versionId: version.id,
      versionNumber: Number(version.version_number),
      packageDirectory,
      contentPath,
      adaptationNotesPath,
      copiedFiles,
      createdAt,
    };
    const manifestPath = join(packageDirectory, 'manifest.json');
    const manifest = {
      schemaVersion: 2,
      purpose: 'assisted_manual_adaptation_for_atoumweb_library',
      generatedAt: createdAt,
      safety: {
        automaticGeneralization: false,
        automaticGlobalLibraryCreation: false,
        automaticCodeExecution: false,
        sourceProjectModified: false,
        note: 'Ce paquet est une copie de travail. Toute généralisation et toute création dans la Bibliothèque AtoumWeb nécessitent une action explicite.',
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
        notes: version.notes,
        createdAt: version.created_at,
        contentFile: contentPath ? relative(packageDirectory, contentPath) : null,
      },
      adaptation: {
        notesFile: relative(packageDirectory, adaptationNotesPath),
        initialNotes: input.adaptationNotes?.trim() || null,
      },
      linkedResources: copiedFiles,
    };
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    this.writeActivity(
      project.id,
      'technical_reuse_package_prepared',
      `Paquet de réutilisation préparé : ${item.name} v${Number(version.version_number)}`,
      { itemId: item.id, versionId: version.id, manifestPath },
    );

    return { ...resultBase, manifestPath };
  }

  createGlobal(input: ReuseCreateGlobalInput) {
    const preparation = input.preparation;
    const item = this.requireProjectItem(preparation.itemId);
    const version = this.pickVersion(item.id, preparation.versionId);
    if (version.id !== preparation.versionId || Number(version.version_number) !== preparation.versionNumber) {
      throw new Error('Le paquet de préparation ne correspond plus à la version source attendue.');
    }
    this.assertPackagePath(preparation.packageDirectory);
    if (!existsSync(preparation.manifestPath)) throw new Error('Le manifeste du paquet de réutilisation est introuvable.');

    const created = this.globalLibrary.create(
      { ...input.item, originTechnicalItemId: item.id },
      input.version,
    );
    const targetVersionId = created.currentVersion?.id;
    if (!targetVersionId) throw new Error('La version initiale du composant AtoumWeb est introuvable.');

    const sourcePaths = preparation.copiedFiles
      .filter((file) => file.copied && file.packageRelativePath)
      .map((file) => join(preparation.packageDirectory, file.packageRelativePath as string))
      .filter((path) => existsSync(path));
    if (preparation.contentPath && existsSync(preparation.contentPath)) sourcePaths.push(preparation.contentPath);
    if (sourcePaths.length) this.globalAssets.importFilePaths(targetVersionId, sourcePaths, 'source');

    const attachments = [preparation.manifestPath, preparation.adaptationNotesPath].filter((path) => existsSync(path));
    if (attachments.length) this.globalAssets.importFilePaths(targetVersionId, attachments, 'attachment');

    this.writeActivity(
      preparation.projectId,
      'technical_reuse_promoted_to_global',
      `Composant AtoumWeb créé volontairement depuis ${item.name} v${Number(version.version_number)} : ${created.name}`,
      { sourceItemId: item.id, sourceVersionId: version.id, globalItemId: created.id },
    );
    return created;
  }

  assertPackagePath(path: string): string {
    const root = resolve(this.workspace.exportsDirectory, 'reutilisation');
    const candidate = resolve(path);
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
      throw new Error('Ce chemin ne correspond pas à un paquet de réutilisation AtoumWeb.');
    }
    return candidate;
  }

  private requireProjectItem(id: string): ItemRow {
    const row = this.database.get<ItemRow>(
      `SELECT id,project_id,category,name,description,tags_json,archived_at
       FROM technical_items WHERE id=? AND scope='project'`,
      [id],
    );
    if (!row) throw new Error('Élément technique projet introuvable.');
    return row;
  }

  private requireProject(id: string): ProjectRow {
    const row = this.database.get<ProjectRow>('SELECT id,project_number,name FROM projects WHERE id=?', [id]);
    if (!row) throw new Error('Projet source introuvable.');
    return row;
  }

  private pickVersion(itemId: string, requestedVersionId?: string | null): VersionRow {
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
    if (!version) throw new Error('Aucune version technique à préparer.');
    if (requestedVersionId && version.id !== requestedVersionId) throw new Error('La version demandée n’appartient pas à cet élément technique.');
    return version;
  }

  private linkedAssets(versionId: string): AssetRow[] {
    return this.database.all<AssetRow>(
      `SELECT fa.id,fa.original_name,fa.relative_path,fa.resource_folder,fa.resource_status,fa.content_role,fa.checksum_sha256
       FROM technical_item_assets tia
       JOIN file_assets fa ON fa.id=tia.file_asset_id
       WHERE tia.technical_item_version_id=?
       ORDER BY fa.original_name COLLATE NOCASE`,
      [versionId],
    );
  }

  private createPackageDirectory(name: string, versionNumber: number, createdAt: string): string {
    const root = join(this.workspace.exportsDirectory, 'reutilisation');
    mkdirSync(root, { recursive: true });
    const timestamp = createdAt.replace(/[:.]/g, '-');
    const directory = join(root, `${timestamp} - ${this.safeSegment(name)} - v${versionNumber}`);
    mkdirSync(directory, { recursive: false });
    return directory;
  }

  private writeContentFile(version: VersionRow, directory: string): string | null {
    if (!version.content_text) return null;
    const extension = this.contentExtension(version.content_type, version.language);
    const path = join(directory, `source${extension}`);
    writeFileSync(path, version.content_text, 'utf8');
    return path;
  }

  private copyLinkedAsset(asset: AssetRow, sourcesDirectory: string, packageDirectory: string): ReusePreparationCopiedFile {
    const source = resolve(this.workspace.root, asset.relative_path);
    if (!existsSync(source) || !statSync(source).isFile()) {
      return {
        resourceId: asset.id,
        fileName: asset.original_name,
        sourceRelativePath: asset.relative_path,
        packageRelativePath: null,
        copied: false,
        missing: true,
        checksumSha256: asset.checksum_sha256,
      };
    }
    const destination = this.uniqueDestination(sourcesDirectory, asset.original_name);
    copyFileSync(source, destination);
    return {
      resourceId: asset.id,
      fileName: asset.original_name,
      sourceRelativePath: asset.relative_path,
      packageRelativePath: relative(packageDirectory, destination),
      copied: true,
      missing: false,
      checksumSha256: asset.checksum_sha256,
    };
  }

  private adaptationNotes(project: ProjectRow, item: ItemRow, version: VersionRow, notes?: string | null): string {
    return [
      '# Notes d’adaptation',
      '',
      `Source : ${project.project_number} — ${project.name}`,
      `Élément : ${item.name} — version ${Number(version.version_number)}`,
      '',
      '## Consigne',
      '',
      'Identifier et retirer uniquement ce qui est spécifique au client (classes, champs ACF, couleurs, URLs, textes ou règles métier) avant toute création dans la Bibliothèque AtoumWeb.',
      'Aucune adaptation n’est appliquée automatiquement par AtoumWeb Manager.',
      '',
      '## Notes',
      '',
      notes?.trim() || '_À compléter pendant l’adaptation._',
      '',
    ].join('\n');
  }

  private contentExtension(contentType: string, language: string | null): string {
    if (contentType === 'json') return '.json';
    if (contentType === 'text') return '.txt';
    const normalized = language?.trim().toLowerCase();
    const extensions: Record<string, string> = {
      php: '.php', css: '.css', javascript: '.js', js: '.js', typescript: '.ts', ts: '.ts',
      tsx: '.tsx', jsx: '.jsx', html: '.html', json: '.json', sql: '.sql', markdown: '.md', md: '.md',
    };
    return normalized ? (extensions[normalized] ?? `.${normalized.replace(/[^a-z0-9_-]/g, '') || 'txt'}`) : '.txt';
  }

  private uniqueDestination(directory: string, fileName: string): string {
    const safeName = this.safeFileName(fileName);
    const extension = extname(safeName);
    const stem = extension ? safeName.slice(0, -extension.length) : safeName;
    let destination = join(directory, safeName);
    let index = 2;
    while (existsSync(destination)) {
      destination = join(directory, `${stem} (${index})${extension}`);
      index += 1;
    }
    return destination;
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

  private safeFileName(value: string): string {
    return this.safeSegment(basename(value));
  }

  private writeActivity(projectId: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at)
       VALUES ('project',?,?,?,?,?)`,
      [projectId, action, summary, JSON.stringify(metadata), new Date().toISOString()],
    );
  }
}

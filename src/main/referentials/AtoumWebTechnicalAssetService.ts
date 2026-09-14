import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import type {
  AtoumWebTechnicalAsset,
  AtoumWebTechnicalAssetRole,
} from '../../shared/referentials';
import { ATOUMWEB_TECHNICAL_ASSET_ROLES } from '../../shared/referentials';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';

const ROLE_DIRECTORIES: Record<AtoumWebTechnicalAssetRole, string> = {
  screenshot: 'captures',
  preview: 'apercus',
  source: 'sources',
  attachment: 'fichiers',
};

interface AssetRow extends Record<string, unknown> {
  id: string;
  technical_item_version_id: string;
  asset_role: AtoumWebTechnicalAssetRole;
  relative_path: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  checksum_sha256: string;
  created_at: string;
  missing_at: string | null;
}

interface VersionContext extends Record<string, unknown> {
  version_id: string;
  version_number: number;
  item_id: string;
  scope: string;
}

export class AtoumWebTechnicalAssetService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
  ) {}

  list(versionId: string): AtoumWebTechnicalAsset[] {
    this.requireGlobalVersion(versionId);
    return this.database
      .all<AssetRow>(
        'SELECT * FROM atoumweb_technical_assets WHERE technical_item_version_id=? ORDER BY asset_role, created_at DESC',
        [versionId],
      )
      .map((row) => this.map(row));
  }

  get(id: string): AtoumWebTechnicalAsset {
    const row = this.database.get<AssetRow>('SELECT * FROM atoumweb_technical_assets WHERE id=?', [id]);
    if (!row) throw new Error('Fichier de Bibliothèque AtoumWeb introuvable.');
    this.requireGlobalVersion(row.technical_item_version_id);
    return this.map(row);
  }

  importFilePaths(versionId: string, sourcePaths: string[], role: AtoumWebTechnicalAssetRole): AtoumWebTechnicalAsset[] {
    if (!ATOUMWEB_TECHNICAL_ASSET_ROLES.includes(role)) throw new Error('Rôle de fichier Bibliothèque invalide.');
    const context = this.requireGlobalVersion(versionId);
    if (!sourcePaths.length) return this.list(versionId);

    const targetDirectory = this.roleDirectory(context, role);
    mkdirSync(targetDirectory, { recursive: true });

    for (const sourcePath of sourcePaths) {
      const source = resolve(sourcePath);
      if (!existsSync(source) || !statSync(source).isFile()) continue;

      const checksum = this.checksum(source);
      const duplicate = this.database.get<{ id: string }>(
        'SELECT id FROM atoumweb_technical_assets WHERE technical_item_version_id=? AND checksum_sha256=? LIMIT 1',
        [versionId, checksum],
      );
      if (duplicate) continue;

      const sourceName = basename(source);
      const destination = this.uniqueDestination(targetDirectory, sourceName);
      if (resolve(source) !== resolve(destination)) copyFileSync(source, destination);
      const stats = statSync(destination);
      const now = new Date().toISOString();

      this.database.run(
        `INSERT INTO atoumweb_technical_assets (
          id, technical_item_version_id, asset_role, relative_path, original_name,
          mime_type, size_bytes, checksum_sha256, created_at, missing_at
        ) VALUES (?,?,?,?,?,?,?,?,?,NULL)`,
        [
          randomUUID(),
          versionId,
          role,
          relative(this.workspace.root, destination),
          sourceName,
          this.mimeType(sourceName),
          Number(stats.size),
          checksum,
          now,
        ],
      );
      this.writeActivity(context.item_id, `Fichier ${role} ajouté à la version ${Number(context.version_number)} : ${sourceName}`);
    }

    return this.list(versionId);
  }

  absolutePath(assetOrId: AtoumWebTechnicalAsset | string): string {
    const asset = typeof assetOrId === 'string' ? this.get(assetOrId) : assetOrId;
    return resolve(this.workspace.root, asset.relativePath);
  }

  versionDirectory(versionId: string): string {
    return this.versionDirectoryFromContext(this.requireGlobalVersion(versionId));
  }

  private requireGlobalVersion(versionId: string): VersionContext {
    const row = this.database.get<VersionContext>(
      `SELECT v.id AS version_id, v.version_number, i.id AS item_id, i.scope
       FROM technical_item_versions v
       JOIN technical_items i ON i.id=v.technical_item_id
       WHERE v.id=?`,
      [versionId],
    );
    if (!row) throw new Error('Version technique introuvable.');
    if (row.scope !== 'atoumweb') throw new Error('Les fichiers globaux ne peuvent être liés qu’à une version Bibliothèque AtoumWeb.');
    return row;
  }

  private map(row: AssetRow): AtoumWebTechnicalAsset {
    const absolute = resolve(this.workspace.root, row.relative_path);
    const missing = !existsSync(absolute);
    if (missing && !row.missing_at) {
      this.database.run('UPDATE atoumweb_technical_assets SET missing_at=? WHERE id=?', [new Date().toISOString(), row.id]);
    } else if (!missing && row.missing_at) {
      this.database.run('UPDATE atoumweb_technical_assets SET missing_at=NULL WHERE id=?', [row.id]);
    }
    return {
      id: row.id,
      versionId: row.technical_item_version_id,
      role: row.asset_role,
      relativePath: row.relative_path,
      fileName: row.original_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      checksumSha256: row.checksum_sha256,
      missing,
      createdAt: row.created_at,
    };
  }

  private versionDirectoryFromContext(context: VersionContext): string {
    return join(this.workspace.atoumWebLibraryDirectory, context.item_id, `v${Number(context.version_number)}`);
  }

  private roleDirectory(context: VersionContext, role: AtoumWebTechnicalAssetRole): string {
    return join(this.versionDirectoryFromContext(context), ROLE_DIRECTORIES[role]);
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
      '.zip': 'application/zip', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return known[extension] ?? null;
  }

  private writeActivity(itemId: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      ['atoumweb_technical_item', itemId, 'atoumweb_technical_asset_added', summary, new Date().toISOString()],
    );
  }
}

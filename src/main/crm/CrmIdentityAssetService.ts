import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import type {
  CrmIdentityAsset,
  CrmIdentityAssetPreview,
  CrmIdentityAssetRole,
  CrmIdentityOwnerType,
} from '../../shared/crm';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';

const MAX_IDENTITY_ASSET_BYTES = 8 * 1024 * 1024;

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

interface IdentityAssetRow extends Record<string, unknown> {
  id: string;
  organization_id: string | null;
  contact_id: string | null;
  role: CrmIdentityAssetRole;
  relative_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export class CrmIdentityAssetService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
  ) {}

  list(owner: CrmIdentityOwnerType, ownerId: string): CrmIdentityAsset[] {
    this.requireOwner(owner, ownerId);
    const column = owner === 'organization' ? 'organization_id' : 'contact_id';
    return this.database.all<IdentityAssetRow>(
      `SELECT * FROM crm_identity_assets WHERE ${column}=? ORDER BY CASE role WHEN 'logo' THEN 1 WHEN 'favicon' THEN 2 ELSE 3 END`,
      [ownerId],
    ).map((row) => this.map(row));
  }

  importFilePath(
    owner: CrmIdentityOwnerType,
    ownerId: string,
    role: CrmIdentityAssetRole,
    sourcePath: string,
  ): CrmIdentityAsset {
    this.requireOwner(owner, ownerId);
    this.assertRoleForOwner(owner, role);

    const source = resolve(sourcePath);
    if (!existsSync(source) || !statSync(source).isFile()) throw new Error('Image introuvable.');
    const extension = extname(source).toLowerCase();
    const mimeType = MIME_TYPES[extension];
    if (!mimeType) throw new Error('Format non pris en charge. Utilise JPG, PNG, WEBP, GIF ou ICO.');

    const sourceStats = statSync(source);
    if (sourceStats.size > MAX_IDENTITY_ASSET_BYTES) throw new Error('L’image dépasse 8 Mo.');

    const directory = join(this.workspace.root, 'crm-identites', owner === 'organization' ? 'entreprises' : 'contacts', ownerId);
    mkdirSync(directory, { recursive: true });

    const destination = join(directory, `${role}${extension}`);
    const existing = this.find(owner, ownerId, role);
    if (existing) {
      const existingPath = resolve(this.workspace.root, existing.relative_path);
      if (existingPath !== destination && existsSync(existingPath)) this.safeDelete(existingPath);
    }

    if (source !== resolve(destination)) copyFileSync(source, destination);
    const stats = statSync(destination);
    const now = new Date().toISOString();
    const id = existing?.id ?? randomUUID();
    const organizationId = owner === 'organization' ? ownerId : null;
    const contactId = owner === 'contact' ? ownerId : null;

    if (existing) {
      this.database.run(
        `UPDATE crm_identity_assets
         SET relative_path=?, original_name=?, mime_type=?, size_bytes=?, updated_at=?
         WHERE id=?`,
        [relative(this.workspace.root, destination), basename(source), mimeType, Number(stats.size), now, id],
      );
    } else {
      this.database.run(
        `INSERT INTO crm_identity_assets (
          id, organization_id, contact_id, role, relative_path, original_name,
          mime_type, size_bytes, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          id, organizationId, contactId, role, relative(this.workspace.root, destination),
          basename(source), mimeType, Number(stats.size), now, now,
        ],
      );
    }

    this.writeActivity(owner, ownerId, role, existing ? 'remplacée' : 'ajoutée');
    return this.get(id);
  }

  get(id: string): CrmIdentityAsset {
    const row = this.database.get<IdentityAssetRow>('SELECT * FROM crm_identity_assets WHERE id=?', [id]);
    if (!row) throw new Error('Image d’identité introuvable.');
    return this.map(row);
  }

  preview(id: string): CrmIdentityAssetPreview {
    const asset = this.get(id);
    if (asset.missing) return { available: false, error: 'Le fichier image est introuvable.' };
    const absolute = resolve(this.workspace.root, asset.relativePath);
    const stats = statSync(absolute);
    if (stats.size > MAX_IDENTITY_ASSET_BYTES) return { available: false, error: 'L’image dépasse 8 Mo.' };
    const data = readFileSync(absolute);
    return {
      available: true,
      dataUrl: `data:${asset.mimeType};base64,${data.toString('base64')}`,
      mimeType: asset.mimeType,
    };
  }

  remove(id: string): void {
    const asset = this.get(id);
    const absolute = resolve(this.workspace.root, asset.relativePath);
    if (existsSync(absolute)) this.safeDelete(absolute);
    this.database.run('DELETE FROM crm_identity_assets WHERE id=?', [id]);
    this.writeActivity(asset.ownerType, asset.ownerId, asset.role, 'supprimée');
  }

  private find(owner: CrmIdentityOwnerType, ownerId: string, role: CrmIdentityAssetRole): IdentityAssetRow | undefined {
    const column = owner === 'organization' ? 'organization_id' : 'contact_id';
    return this.database.get<IdentityAssetRow>(
      `SELECT * FROM crm_identity_assets WHERE ${column}=? AND role=?`,
      [ownerId, role],
    );
  }

  private map(row: IdentityAssetRow): CrmIdentityAsset {
    const ownerType: CrmIdentityOwnerType = row.organization_id ? 'organization' : 'contact';
    const ownerId = row.organization_id ?? row.contact_id;
    if (!ownerId) throw new Error('Image d’identité sans propriétaire.');
    const absolute = resolve(this.workspace.root, row.relative_path);
    return {
      id: row.id,
      ownerType,
      ownerId,
      role: row.role,
      relativePath: row.relative_path,
      fileName: row.original_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      missing: !existsSync(absolute),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private requireOwner(owner: CrmIdentityOwnerType, ownerId: string): void {
    if (!ownerId.trim()) throw new Error('Identité CRM invalide.');
    const table = owner === 'organization' ? 'organizations' : 'contacts';
    const row = this.database.get<{ id: string }>(`SELECT id FROM ${table} WHERE id=?`, [ownerId]);
    if (!row) throw new Error(owner === 'organization' ? 'Entreprise introuvable.' : 'Contact introuvable.');
  }

  private assertRoleForOwner(owner: CrmIdentityOwnerType, role: CrmIdentityAssetRole): void {
    if (owner === 'organization' && !['logo', 'favicon'].includes(role)) {
      throw new Error('Une entreprise accepte un logo ou une favicon.');
    }
    if (owner === 'contact' && role !== 'avatar') {
      throw new Error('Un contact accepte uniquement une photo/avatar.');
    }
  }

  private safeDelete(path: string): void {
    const root = resolve(this.workspace.root);
    const target = resolve(path);
    if (!target.startsWith(root)) throw new Error('Chemin image invalide.');
    unlinkSync(target);
  }

  private writeActivity(owner: CrmIdentityOwnerType, ownerId: string, role: CrmIdentityAssetRole, action: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [
        owner,
        ownerId,
        'crm_identity_asset_changed',
        `${role === 'favicon' ? 'Favicon' : role === 'logo' ? 'Logo' : 'Photo'} ${action}`,
        new Date().toISOString(),
      ],
    );
  }
}

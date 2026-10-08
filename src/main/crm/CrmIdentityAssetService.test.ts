import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { CrmService } from './CrmService';
import { CrmIdentityAssetService } from './CrmIdentityAssetService';

describe('CrmIdentityAssetService', () => {
  let database: NodeSqliteAdapter;
  let assets: CrmIdentityAssetService;
  let crm: CrmService;
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'atoumweb-crm-identity-'));
    database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    applyPendingMigrations(database);
    crm = new CrmService(database);
    assets = new CrmIdentityAssetService(database, createWorkspacePaths(root));
  });

  afterEach(() => {
    database.close();
    const target = resolve(root);
    if (!target.startsWith(resolve(tmpdir()))) throw new Error('Chemin temporaire invalide.');
    rmSync(target, { recursive: true, force: true });
  });

  it('importe et remplace le logo d une entreprise avec aperçu local', () => {
    const organization = crm.createOrganization({ name: 'Atelier Visuel', website: 'atelier-visuel.fr' });
    const first = join(root, 'logo.png');
    const second = join(root, 'nouveau-logo.webp');
    writeFileSync(first, Buffer.from('fake-png'));
    writeFileSync(second, Buffer.from('fake-webp'));

    const imported = assets.importFilePath('organization', organization.id, 'logo', first);
    expect(imported.role).toBe('logo');
    expect(imported.fileName).toBe('logo.png');
    expect(imported.relativePath).toContain('crm-identites');
    expect(assets.preview(imported.id)).toMatchObject({ available: true, mimeType: 'image/png' });

    const replaced = assets.importFilePath('organization', organization.id, 'logo', second);
    expect(replaced.id).toBe(imported.id);
    expect(replaced.fileName).toBe('nouveau-logo.webp');
    expect(assets.list('organization', organization.id)).toHaveLength(1);
    expect(existsSync(resolve(root, replaced.relativePath))).toBe(true);
  });

  it('gère avatar contact et interdit un rôle incohérent', () => {
    const contact = crm.createContact({ firstName: 'Léa', lastName: 'Durand' });
    const source = join(root, 'lea.jpg');
    writeFileSync(source, Buffer.from('fake-jpg'));

    const avatar = assets.importFilePath('contact', contact.id, 'avatar', source);
    expect(avatar.ownerType).toBe('contact');
    expect(avatar.role).toBe('avatar');
    expect(() => assets.importFilePath('contact', contact.id, 'logo', source)).toThrow(/uniquement une photo/i);

    assets.remove(avatar.id);
    expect(assets.list('contact', contact.id)).toHaveLength(0);
  });
});

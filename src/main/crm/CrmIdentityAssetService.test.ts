import { existsSync, readFileSync, readdirSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { CrmService } from './CrmService';
import { CrmIdentityAssetService } from './CrmIdentityAssetService';

const png=(marker:string)=>Buffer.concat([Buffer.from('89504e470d0a1a0a0000000d49484452','hex'),Buffer.from(marker)]);
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
    writeFileSync(first, png('first'));
    writeFileSync(second, Buffer.from('RIFF0000WEBPtest'));

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
    writeFileSync(source, Buffer.from([255,216,255,0,1,2]));

    const avatar = assets.importFilePath('contact', contact.id, 'avatar', source);
    expect(avatar.ownerType).toBe('contact');
    expect(avatar.role).toBe('avatar');
    expect(() => assets.importFilePath('contact', contact.id, 'logo', source)).toThrow(/uniquement une photo/i);

    assets.remove(avatar.id);
    expect(assets.list('contact', contact.id)).toHaveLength(0);
  });
  it('preserves previous bytes and SQL history on journal failure during replacement',()=>{
    const org=crm.createOrganization({name:'SAFE'}),source=join(root,'logo.png');writeFileSync(source,png('original'));
    const first=assets.importFilePath('organization',org.id,'logo',source),activity=database.all('SELECT * FROM activity_log');
    writeFileSync(source,png('replacement'));const original=database.run.bind(database);
    const spy=vi.spyOn(database,'run').mockImplementation((sql,args)=>{if(sql.includes('INSERT INTO activity_log'))throw Error('journal failure');return original(sql,args);});
    expect(()=>assets.importFilePath('organization',org.id,'logo',source)).toThrow('journal failure');spy.mockRestore();
    expect(assets.get(first.id)).toEqual(first);expect(readFileSync(resolve(root,first.relativePath)).equals(png('original'))).toBe(true);
    expect(database.all('SELECT * FROM activity_log')).toEqual(activity);
    expect(readdirSync(resolve(root,first.relativePath,'..'))).toHaveLength(1);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('survives service restart and retains revisions needed by SQLite-only backups',()=>{
    const org=crm.createOrganization({name:'PERSIST'}),source=join(root,'logo.png');writeFileSync(source,png('one'));
    const first=assets.importFilePath('organization',org.id,'logo',source);writeFileSync(source,png('two'));
    const second=assets.importFilePath('organization',org.id,'logo',source);expect(second.relativePath).not.toBe(first.relativePath);
    expect(readFileSync(resolve(root,first.relativePath)).equals(png('one'))).toBe(true);
    assets=new CrmIdentityAssetService(database,createWorkspacePaths(root));expect(assets.preview(first.id).dataUrl).toContain(png('two').toString('base64'));
    assets.remove(second.id);expect(assets.list('organization',org.id)).toEqual([]);expect(existsSync(resolve(root,second.relativePath))).toBe(true);
  });
  it('rolls back removal when journalling fails',()=>{
    const org=crm.createOrganization({name:'REMOVE'}),source=join(root,'logo.png');writeFileSync(source,png('one'));
    const first=assets.importFilePath('organization',org.id,'logo',source),original=database.run.bind(database);
    const spy=vi.spyOn(database,'run').mockImplementation((sql,args)=>{if(sql.includes('INSERT INTO activity_log'))throw Error('journal failure');return original(sql,args);});
    expect(()=>assets.remove(first.id)).toThrow('journal failure');spy.mockRestore();expect(assets.get(first.id)).toEqual(first);expect(existsSync(resolve(root,first.relativePath))).toBe(true);
  });
  it('rejects empty, oversized, unsupported, missing and escaping images without replacing current image',()=>{
    const org=crm.createOrganization({name:'VALIDATE'}),source=join(root,'logo.png');writeFileSync(source,png('old'));const first=assets.importFilePath('organization',org.id,'logo',source);
    writeFileSync(source,'');expect(()=>assets.importFilePath('organization',org.id,'logo',source)).toThrow(/vide/);
    writeFileSync(source,Buffer.alloc(8*1024*1024+1));expect(()=>assets.importFilePath('organization',org.id,'logo',source)).toThrow(/8 Mo/);
    expect(()=>assets.importFilePath('organization',org.id,'logo',join(root,'absent.png'))).toThrow(/introuvable/);
    const html=join(root,'bad.svg');writeFileSync(html,'<svg/>');expect(()=>assets.importFilePath('organization',org.id,'logo',html)).toThrow(/Format/);
    expect(()=>assets.importFilePath('organization','../other','logo',source)).toThrow(/invalide/);expect(assets.get(first.id)).toEqual(first);
    database.run('UPDATE crm_identity_assets SET relative_path=? WHERE id=?',[root+'-outside/logo.png',first.id]);expect(()=>assets.preview(first.id)).toThrow(/Chemin/);
  });

  it('rejects a mismatching file signature without saving even if its extension is allowed',()=>{
    const org=crm.createOrganization({name:'SIGNATURE'}),source=join(root,'bad.png');writeFileSync(source,'not PNG');
    expect(()=>assets.importFilePath('organization',org.id,'logo',source)).toThrow(/contenu/);expect(assets.list('organization',org.id)).toEqual([]);
  });
  it('reopens the actual on-disk database and resolves the same stored image after restart',()=>{
    database.close();database=new NodeSqliteAdapter(join(root,'persistent.sqlite'));database.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(database);crm=new CrmService(database);assets=new CrmIdentityAssetService(database,createWorkspacePaths(root));
    const org=crm.createOrganization({name:'REOPEN'}),source=join(root,'logo.png');writeFileSync(source,png('persisted'));
    const first=assets.importFilePath('organization',org.id,'logo',source);database.close();database=new NodeSqliteAdapter(join(root,'persistent.sqlite'));database.exec('PRAGMA foreign_keys=ON');assets=new CrmIdentityAssetService(database,createWorkspacePaths(root));
    expect(assets.get(first.id)).toEqual(first);expect(assets.preview(first.id).dataUrl).toContain(png('persisted').toString('base64'));
    expect(database.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
    mkdirSync(join(root,'other-workspace'));
    const otherWorkspace=new CrmIdentityAssetService(database,createWorkspacePaths(join(root,'other-workspace')));
    expect(otherWorkspace.get(first.id).missing).toBe(true);expect(otherWorkspace.preview(first.id).available).toBe(false);
  });

});

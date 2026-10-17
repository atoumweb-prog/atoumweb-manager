import {backup,DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {createOfflineWorkspaceArchive,restoreOfflineArchiveToNewWorkspace,verifyRestoredWorkspaceAgainstManifest} from './WorkspacePortableArchive';
import {createRelocatedWorkspaceCopy,EC04_RESOURCE_FOLDERS} from './WorkspaceRelocatedCopy';
import {ProjectResourceService} from '../projects/ProjectResourceService';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';

let base:string,root:string,restored:string,migrated:string,archive:string,db:DatabaseSync;
let manifest:Awaited<ReturnType<typeof createOfflineWorkspaceArchive>>;
const asset='projets-internes/i1/Ressources/04 Documents projet/source.txt';
const rootPath=()=>join(root,'projets-internes','i1','Ressources');
beforeEach(()=>{
  base=mkdtempSync(join(tmpdir(),'ec04-relocated-fixture-'));
  root=join(base,'original-workspace');
  restored=join(base,'verified-restore');
  migrated=join(base,'migrated-copy');
  archive=join(base,'snapshot.awbackup');
  mkdirSync(join(root,'data'),{recursive:true});
  db=new DatabaseSync(join(root,'data','atoumweb-manager.sqlite'));
  db.exec("CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY,name TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'fixture');");
  db.exec("CREATE TABLE projects(id TEXT PRIMARY KEY,client_account_id TEXT,resource_root_path TEXT);");
  db.exec("CREATE TABLE project_node_secrets(id TEXT PRIMARY KEY,secret_ciphertext TEXT);");
  db.exec("CREATE TABLE file_assets(id TEXT PRIMARY KEY,relative_path TEXT NOT NULL);");
  db.prepare('INSERT INTO projects VALUES (?,?,?)').run('p1',null,rootPath());
  db.prepare('INSERT INTO file_assets VALUES (?,?)').run('f1',asset);
  const file=join(root,...asset.split('/'));
  mkdirSync(dirname(file),{recursive:true});
  writeFileSync(file,'EC04 test document; do not modify original');
});
afterEach(()=>{db.close();rmSync(base,{recursive:true,force:true});});
async function restoreFixture() {
  manifest=await createOfflineWorkspaceArchive({workspaceRoot:root,destinationPath:archive,
    snapshotDatabase:async path=>{await backup(db,path);}});
  await restoreOfflineArchiveToNewWorkspace(archive,restored);
}
const run=()=>createRelocatedWorkspaceCopy({
  restoredWorkspaceRoot:restored,originalWorkspaceRoot:root,
  newWorkspaceRoot:migrated,originalManifest:manifest,
});
const sha=(buf:Buffer)=>createHash('sha256').update(buf).digest('hex');

describe('EC04 restored-copy relocation integration (offline fixtures)',()=>{
  it('clones a verified archive, rewrites only copied project paths and rebuilds seven folder slots',async()=>{
    await restoreFixture();
    const originalDb=readFileSync(join(restored,'data','atoumweb-manager.sqlite'));
    const receipt=await run();
    expect(receipt.relocatedProjects).toBe(1);
    expect(receipt.recreatedResourceFolders).toBe(EC04_RESOURCE_FOLDERS.length);
    expect(receipt.copiedAssetFiles).toBe(1);
    expect(receipt.beforeSqliteSha256).toBe(sha(originalDb));
    expect(receipt.afterSqliteSha256).not.toBe(receipt.beforeSqliteSha256);
    expect(receipt.crossPcCertified).toBe(false);
    expect(receipt.fullReferenceCoverage).toBe(false);
    expect(existsSync(join(migrated,'.EC04-RELOCATION-INCOMPLETE'))).toBe(false);
    const report=JSON.parse(readFileSync(join(migrated,'.EC04-RELOCATION-RECEIPT.json'),'utf8'));
    expect(report.afterSqliteSha256).toBe(receipt.afterSqliteSha256);
    for(const sub of EC04_RESOURCE_FOLDERS)expect(existsSync(join(migrated,'projets-internes','i1','Ressources',sub))).toBe(true);
    expect(readFileSync(join(migrated,...asset.split('/')),'utf8')).toBe('EC04 test document; do not modify original');
    const migratedDb=new DatabaseSync(join(migrated,'data','atoumweb-manager.sqlite'),{readOnly:true});
    try {
      expect(migratedDb.prepare('SELECT resource_root_path FROM projects WHERE id=?').get('p1')?.resource_root_path)
        .toBe(join(migrated,'projets-internes','i1','Ressources'));
      expect(migratedDb.prepare('SELECT relative_path FROM file_assets WHERE id=?').get('f1')?.relative_path).toBe(asset);
      expect(migratedDb.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(migratedDb.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      // Exercise the real resource service, not just raw SQL.
      const adapter={
        get:<T>(sql:string,args?:any[])=>migratedDb.prepare(sql).get(...(args??[])) as T|undefined,
      } as unknown as DatabaseAdapter;
      const svc=new ProjectResourceService(adapter,{root:migrated} as any);
      expect(svc.projectResourceRoot('p1')).toBe(join(migrated,'projets-internes','i1','Ressources'));
    } finally {migratedDb.close();}
    expect(sha(readFileSync(join(restored,'data','atoumweb-manager.sqlite')))).toBe(sha(originalDb));
    await expect(verifyRestoredWorkspaceAgainstManifest(migrated,manifest)).rejects.toThrow(/SQLite restauré différent/);
    await expect(verifyRestoredWorkspaceAgainstManifest(restored,manifest)).resolves.toBeDefined();
  });

  it('refuses external project roots and leaves no destination',async()=>{
    db.prepare('UPDATE projects SET resource_root_path=? WHERE id=?')
      .run(join(base,'external','Ressources'),'p1');
    await restoreFixture();
    await expect(run()).rejects.toThrow(/non relocalisables/);
    expect(existsSync(migrated)).toBe(false);
    await expect(verifyRestoredWorkspaceAgainstManifest(restored,manifest)).resolves.toBeDefined();
  });

  it('refuses encrypted Windows secrets before cloning any byte',async()=>{
    db.prepare('INSERT INTO project_node_secrets VALUES (?,?)').run('s1','dpapi-ciphertext');
    await restoreFixture();
    await expect(run()).rejects.toThrow(/secrets Windows/);
    expect(existsSync(migrated)).toBe(false);
  });

  it('refuses two projects that share one Resources directory',async()=>{
    db.prepare('INSERT INTO projects VALUES (?,?,?)').run('p2',null,rootPath());
    await restoreFixture();
    await expect(run()).rejects.toThrow(/non relocalisables/);
    expect(existsSync(migrated)).toBe(false);
  });

  it('never overwrites an existing directory or writes inside the source',async()=>{
    await restoreFixture();
    mkdirSync(migrated);
    writeFileSync(join(migrated,'KEEP.txt'),'KEEP');
    await expect(run()).rejects.toThrow(/destination existante/);
    expect(readFileSync(join(migrated,'KEEP.txt'),'utf8')).toBe('KEEP');
    await expect(createRelocatedWorkspaceCopy({
      restoredWorkspaceRoot:restored,originalWorkspaceRoot:root,
      newWorkspaceRoot:join(restored,'nested'),originalManifest:manifest,
    })).rejects.toThrow(/imbriquée/);
  });

  it('refuses an incomplete or altered restored source',async()=>{
    await restoreFixture();
    writeFileSync(join(restored,'.EC04-RESTORE-INCOMPLETE'),'crash');
    await expect(run()).rejects.toThrow(/incomplète/);
    rmSync(join(restored,'.EC04-RESTORE-INCOMPLETE'));
    writeFileSync(join(restored,...asset.split('/')),'tampered');
    await expect(run()).rejects.toThrow(/fichiers restaurés/);
    expect(existsSync(migrated)).toBe(false);
  });
  it('keeps an INCOMPLETE marker if an expected Resources subfolder is a file',async()=>{
    const bad=join(root,'projets-internes','i1','Ressources','01 Identité');
    writeFileSync(bad,'not a directory');
    await restoreFixture();
    await expect(run()).rejects.toThrow(/dossier Ressources incompatible/);
    expect(existsSync(join(migrated,'.EC04-RELOCATION-INCOMPLETE'))).toBe(true);
    expect(readFileSync(bad,'utf8')).toBe('not a directory');
    await expect(verifyRestoredWorkspaceAgainstManifest(restored,manifest)).resolves.toBeDefined();
  });

});

import {backup, DatabaseSync} from 'node:sqlite';
import {appendFileSync, linkSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createOfflineWorkspaceArchive, restoreOfflineArchiveToNewWorkspace, verifyOfflineWorkspaceArchive, verifyRestoredWorkspaceAgainstManifest} from './WorkspacePortableArchive';

let base: string;
let root: string;
let db: DatabaseSync;
let destination: string;
const expectedAssets: Array<[string, string]> = [
  ['crm-identites/entreprises/org1/logo.png', 'LOGO 2026'],
  ['crm-identites/entreprises/org1/logo-old.png', 'LOGO 2025'],
  ['clients/client1/Documents/Contrats/contrat.pdf', 'SIGNED DOC'],
  ['projets-internes/preuves-devis/quote1/preuve.pdf', 'TRANSMISSION'],
  ['depenses/recu.pdf', 'RECEIPT'],
  ['bibliotheque-atoumweb/c1/v2/export.html', '<html/>'],
  ['bridge/objects/sha256/aa/data', 'BRIDGE DATA'],
];
function save(name: string, data: string) {
  const full = join(root, ...name.split('/'));
  mkdirSync(dirname(full), {recursive: true});
  writeFileSync(full, data);
}

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'atoum-ec04-archive-fixture-'));
  root = join(base, 'workspace');
  mkdirSync(join(root, 'data'), {recursive: true});
  destination = join(base, 'archives', 'snapshot.awbackup');
  mkdirSync(dirname(destination));
  db = new DatabaseSync(join(root, 'data', 'atoumweb-manager.sqlite'));
  db.exec("CREATE TABLE schema_migrations(id INTEGER PRIMARY KEY,name TEXT NOT NULL);"+
    "INSERT INTO schema_migrations VALUES (1,'test_v1');"+
    "CREATE TABLE clients(id TEXT PRIMARY KEY);"+
    "INSERT INTO clients VALUES ('client-1');");
});
afterEach(() => {
  db.close();
  rmSync(base, {recursive: true, force: true});
});
const makeArchive = () => createOfflineWorkspaceArchive({
  workspaceRoot: root, destinationPath: destination,
  snapshotDatabase: async file => { await backup(db, file); },
});

describe('EC04 — archive et restauration isolées, jamais raccordées à la production', () => {
  it('archive SQLite + identités/documents/preuves/Bridge puis restaure dans un NOUVEAU workspace', async () => {
    for (const [p, content] of expectedAssets) save(p, content);
    save('backups/manual/old.sqlite', 'old backup excluded');
    const manifest = await makeArchive();
    expect(manifest.files).toHaveLength(expectedAssets.length + 1);
    expect(manifest.files[0].path).toBe('database/atoumweb-manager.sqlite');
    expect(manifest.files.map(file => file.path)).not.toContain('workspace/backups/manual/old.sqlite');
    expect(manifest.consistencyCertified).toBe(false);
    expect(manifest.referencesVerified).toBe(false);
    expect((await verifyOfflineWorkspaceArchive(destination)).migrations).toEqual([{id: 1, name: 'test_v1'}]);
    const restored = join(base, 'restore-new');
    await restoreOfflineArchiveToNewWorkspace(destination, restored);
    for (const [name, content] of expectedAssets) {
      expect(readFileSync(join(restored, ...name.split('/')), 'utf8')).toBe(content);
    }
    const restoredDb = new DatabaseSync(join(restored, 'data', 'atoumweb-manager.sqlite'), {readOnly: true});
    try {expect(restoredDb.prepare('SELECT id FROM clients').get()?.id).toBe('client-1');}
    finally {restoredDb.close();}
    expect(readFileSync(join(root, 'clients/client1/Documents/Contrats/contrat.pdf'), 'utf8')).toBe('SIGNED DOC');
    expect(existsSync(join(restored, 'backups'))).toBe(false);
  });

  it('refuse la destination existante et ne remplace aucun dossier utilisateur', async () => {
    save('clients/c1/note.txt', 'source');
    await makeArchive();
    await expect(makeArchive()).rejects.toThrow(/destination déjà existante/);
    const restored = join(base, 'existing');
    mkdirSync(restored);
    writeFileSync(join(restored, 'KEEP.txt'), 'do not erase');
    await expect(restoreOfflineArchiveToNewWorkspace(destination, restored)).rejects.toThrow(/destination déjà existante/);
    expect(readFileSync(join(restored, 'KEEP.txt'), 'utf8')).toBe('do not erase');
  });

  it('refuse une archive altérée et nettoie tout staging de restauration', async () => {
    save('clients/c1/a.bin', 'abc');
    await makeArchive();
    const damaged = join(base, 'archives', 'damaged.awbackup');
    const bytes = readFileSync(destination); bytes[bytes.length - 1] ^= 0x10;
    writeFileSync(damaged, bytes);
    await expect(verifyOfflineWorkspaceArchive(damaged)).rejects.toThrow(/empreinte SHA-256/);
    const restored = join(base, 'restore-bad');
    await expect(restoreOfflineArchiveToNewWorkspace(damaged, restored)).rejects.toThrow(/empreinte SHA-256/);
    expect(existsSync(restored)).toBe(false);
  });

  it('refuse les archives tronquées, étendues ou avec mauvaise signature', async () => {
    await makeArchive();
    const original = readFileSync(destination);
    for (const [name, data] of [
      ['short', original.subarray(0, 7)],
      ['truncated', original.subarray(0, -1)],
      ['appended', Buffer.concat([original, Buffer.from('extra')])],
      ['badmagic', Buffer.concat([Buffer.from('WRONG'), original.subarray(5)])],
    ] as Array<[string, Buffer]>) {
      const altered = join(base, name + '.awbackup');
      writeFileSync(altered, data);
      await expect(verifyOfflineWorkspaceArchive(altered)).rejects.toThrow();
    }
  });

  it('refuse un nouveau fichier ajouté entre inventaire et instantané SQLite', async () => {
    save('clients/c1/a.txt', 'before');
    await expect(createOfflineWorkspaceArchive({
      workspaceRoot: root, destinationPath: destination,
      snapshotDatabase: async file => {
        await backup(db, file);
        save('clients/c1/new.txt', 'created during capture');
      },
    })).rejects.toThrow(/fichier ajouté ou modifié/);
    expect(existsSync(destination)).toBe(false);
  });

  it('ne crée aucune archive lorsque la capture SQLite échoue', async () => {
    await expect(createOfflineWorkspaceArchive({
      workspaceRoot: root, destinationPath: destination,
      snapshotDatabase: async () => {throw Error('DISK FULL (fixture)');},
    })).rejects.toThrow(/DISK FULL/);
    expect(existsSync(destination)).toBe(false);
  });

  it('refuse un lien symbolique cassé comme destination, sans le remplacer', async () => {
    const dangling = join(base, 'archives', 'dangling.awbackup');
    symlinkSync(join(base, 'does-not-exist'), dangling, process.platform === 'win32' ? 'junction' : 'file');
    await expect(createOfflineWorkspaceArchive({
      workspaceRoot: root, destinationPath: dangling,
      snapshotDatabase: async file => { await backup(db, file); },
    })).rejects.toThrow(/destination déjà existante/);
    expect(existsSync(destination)).toBe(false);
  });

  it('rejette un manifeste forgé avec collision de dossiers Windows', async () => {
    save('clients/A/first.txt', 'one');
    save('clients/B/second.txt', 'two');
    await makeArchive();
    const raw = readFileSync(destination).toString('latin1');
    const forged = raw.replace('workspace/clients/B/second.txt', 'workspace/clients/a/second.txt');
    expect(forged).not.toBe(raw);
    const target = join(base, 'archives', 'case-forged.awbackup');
    writeFileSync(target, Buffer.from(forged, 'latin1'));
    await expect(verifyOfflineWorkspaceArchive(target)).rejects.toThrow(/collision de dossiers Windows/);
  });

  it('refuse la création lorsque SQLite référence un fichier client absent', async () => {
    db.exec('CREATE TABLE client_documents(id TEXT PRIMARY KEY,relative_path TEXT);');
    db.prepare('INSERT INTO client_documents VALUES (?,?)').run('doc-1', 'clients/c1/Documents/missing.pdf');
    await expect(makeArchive()).rejects.toThrow(/référence\(s\) fichier invalides/);
    expect(existsSync(destination)).toBe(false);
  });

  it('archive le fichier référencé sans prétendre certifier toute la couverture', async () => {
    db.exec('CREATE TABLE client_documents(id TEXT PRIMARY KEY,relative_path TEXT);');
    const ref = 'clients/c1/Documents/brief.pdf';
    db.prepare('INSERT INTO client_documents VALUES (?,?)').run('doc-2', ref);
    save(ref, 'CLIENT PDF');
    const manifest = await makeArchive();
    expect(manifest.files.some(file => file.path === 'workspace/' + ref)).toBe(true);
    expect(manifest.referencesVerified).toBe(false);
    expect(manifest.consistencyCertified).toBe(false);
  });


  it('revérifie le workspace restauré et refuse tampering, fichier supplémentaire et marqueur', async () => {
    db.exec('CREATE TABLE client_documents(id TEXT PRIMARY KEY, relative_path TEXT);');
    const path = 'clients/c1/Documents/contrat.pdf';
    db.prepare('INSERT INTO client_documents VALUES (?,?)').run('doc-1', path);
    save(path, 'PDF initial');
    const manifest = await makeArchive();
    const target = join(base, 'new-verified-workspace');
    await restoreOfflineArchiveToNewWorkspace(destination, target);
    const status = await verifyRestoredWorkspaceAgainstManifest(target, manifest);
    expect(status.verifiedFiles).toBe(2);
    expect(status.referencesChecked).toBe(1);
    expect(status.totalBytes).toBe(manifest.files.reduce((total, item) => total + item.sizeBytes, 0));
    const restored = join(target, ...path.split('/'));
    writeFileSync(restored, 'PDF modifié');
    await expect(verifyRestoredWorkspaceAgainstManifest(target, manifest)).rejects.toThrow(/fichiers restaurés/);
    writeFileSync(restored, 'PDF initial');
    writeFileSync(join(target, 'clients', 'nouveau.txt'), 'unexpected');
    await expect(verifyRestoredWorkspaceAgainstManifest(target, manifest)).rejects.toThrow(/fichiers restaurés/);
    rmSync(join(target, 'clients', 'nouveau.txt'));
    const marker = join(target, '.EC04-RESTORE-INCOMPLETE');
    writeFileSync(marker, 'crash');
    await expect(verifyRestoredWorkspaceAgainstManifest(target, manifest)).rejects.toThrow(/restauration interrompue/);
    rmSync(marker);
    await expect(verifyRestoredWorkspaceAgainstManifest(target, manifest)).resolves.toMatchObject({referencesChecked:1});
  });

  it('refuse les modifications SQLite et les fichiers WAL inattendus après restauration', async () => {
    const manifest = await makeArchive();
    const target = join(base, 'new-sqlite-verified-workspace');
    await restoreOfflineArchiveToNewWorkspace(destination, target);
    const sqlite = join(target, 'data', 'atoumweb-manager.sqlite');
    const wal = sqlite + '-wal';
    writeFileSync(wal, 'stray WAL');
    await expect(verifyRestoredWorkspaceAgainstManifest(target, manifest)).rejects.toThrow(/fichiers inattendus/);
    rmSync(wal);
    appendFileSync(sqlite, 'unexpected');
    await expect(verifyRestoredWorkspaceAgainstManifest(target, manifest)).rejects.toThrow(/SQLite restauré différent/);
  });

  it('accepts a legitimate non-consecutive SQLite migration ledger, preserving exact IDs and names',async()=>{
    db.exec("INSERT INTO schema_migrations VALUES (3,'migration_3'); INSERT INTO schema_migrations VALUES (71,'migration_71');");
    save('clients/c1/note.txt','nonconsecutive');
    const manifest=await makeArchive();
    expect(manifest.migrations).toEqual([
      {id:1,name:'test_v1'},{id:3,name:'migration_3'},{id:71,name:'migration_71'},
    ]);
    expect((await verifyOfflineWorkspaceArchive(destination)).migrations).toEqual(manifest.migrations);
    const restored=join(base,'restored-nonconsecutive');
    await restoreOfflineArchiveToNewWorkspace(destination,restored);
    await expect(verifyRestoredWorkspaceAgainstManifest(restored,manifest)).resolves.toBeDefined();
  });

  it('rejects duplicate migration names, invalid IDs and out-of-order IDs in the fixture',async()=>{
    db.exec("INSERT INTO schema_migrations VALUES (71,'test_v1');");
    await expect(makeArchive()).rejects.toThrow(/migration invalide/);
    db.exec("DELETE FROM schema_migrations WHERE id=71");
    db.exec("INSERT INTO schema_migrations VALUES (0,'wrong-id');");
    await expect(makeArchive()).rejects.toThrow(/migration invalide/);
  });

});

 it('normalizes a private WAL snapshot and repeatedly verifies without new sidecars or source changes',async()=>{
   db.exec('PRAGMA journal_mode=WAL');
   db.exec("INSERT INTO clients VALUES ('wal-client')");
   const before=readFileSync(join(root,'data','atoumweb-manager.sqlite'));
   const manifest=await makeArchive(),restored=join(base,'wal-restored');
   await restoreOfflineArchiveToNewWorkspace(destination,restored);
   await verifyRestoredWorkspaceAgainstManifest(restored,manifest);
   await verifyRestoredWorkspaceAgainstManifest(restored,manifest);
   expect(existsSync(join(restored,'data','atoumweb-manager.sqlite-wal'))).toBe(false);
   expect(existsSync(join(restored,'data','atoumweb-manager.sqlite-shm'))).toBe(false);
   expect(readFileSync(join(root,'data','atoumweb-manager.sqlite')).equals(before)).toBe(true);
   expect(db.prepare('PRAGMA journal_mode').get()?.journal_mode).toBe('wal');
   expect(db.prepare('SELECT count(*) AS n FROM clients').get()?.n).toBe(2);
 });

 it('refuses a hardlinked snapshot before any normalization of the source database',async()=>{
   db.exec('PRAGMA journal_mode=WAL');const source=join(root,'data','atoumweb-manager.sqlite'),before=readFileSync(source);
   await expect(createOfflineWorkspaceArchive({workspaceRoot:root,destinationPath:destination,
     snapshotDatabase:async file=>{linkSync(source,file);}})).rejects.toThrow(/lien physique/);
   expect(readFileSync(source).equals(before)).toBe(true);
   expect(db.prepare('PRAGMA journal_mode').get()?.journal_mode).toBe('wal');
   expect(existsSync(destination)).toBe(false);
 });

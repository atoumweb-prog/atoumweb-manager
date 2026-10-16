import {backup, DatabaseSync} from 'node:sqlite';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createOfflineWorkspaceArchive, restoreOfflineArchiveToNewWorkspace, verifyOfflineWorkspaceArchive} from './WorkspacePortableArchive';

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
});

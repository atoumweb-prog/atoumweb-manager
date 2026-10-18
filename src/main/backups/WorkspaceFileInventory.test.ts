import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {checkedWorkspaceRelativePath, inventoryWorkspaceFiles} from './WorkspaceFileInventory';

let workspace: string;
let outside: string;
beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'ec04-inventory-workspace-'));
  outside = mkdtempSync(join(tmpdir(), 'ec04-inventory-outside-'));
});
afterEach(() => {
  rmSync(workspace, {recursive: true, force: true});
  rmSync(outside, {recursive: true, force: true});
});
const addFile = (path: string, content: string): void => {
  mkdirSync(join(path, '..'), {recursive: true});
  writeFileSync(path, content);
};

describe('EC04 — inventaire en lecture seule des fichiers du workspace', () => {
  it('recense logos courants et anciens, pièces, prévisionnel, bibliothèque et Bridge sans toucher aux fichiers', async () => {
    const records: Array<[string, string]> = [
      ['crm-identites/entreprises/id/logo.png', 'LOGO COURANT'],
      ['crm-identites/entreprises/id/ancien.png', 'LOGO ANCIEN'],
      ['clients/client/Documents/Contrats/devis.pdf', 'PDF PREUVE'],
      ['projets-internes/preuves-devis/qid/envoi.pdf', 'PREUVE'],
      ['projets-previsionnels/a/Ressources/notes.txt', 'PREVISION'],
      ['depenses/justificatif.jpg', 'FACTURE'],
      ['bibliotheque-atoumweb/id/v2/module.js', 'MODULE'],
      ['bridge/objects/sha256/ab/objet', 'BRIDGE'],
      ['exports/compositions-atoumweb/ébauche.zip', 'EXPORT'],
    ];
    for (const [name, content] of records) addFile(join(workspace, ...name.split('/')), content);
    addFile(join(workspace, 'backups/old-backup.zip'), 'DO NOT SCAN');
    addFile(join(workspace, 'data/atoumweb-manager.sqlite'), 'ACTIVE SQLITE DO NOT SCAN');
    const inventory = await inventoryWorkspaceFiles(workspace);
    expect(inventory.version).toBe(1);
    expect(inventory.files).toHaveLength(records.length);
    expect(inventory.files.map(item => item.relativePath).sort()).toEqual(records.map(item => item[0]).sort());
    expect(inventory.files.find(file => file.relativePath.endsWith('logo.png'))?.sha256)
      .toBe(createHash('sha256').update('LOGO COURANT').digest('hex'));
    expect(inventory.totalBytes).toBe(records.reduce((sum, [, content]) => sum + Buffer.byteLength(content), 0));
    expect(inventory.referencesVerified).toBe(false);
    expect(inventory.files.some(file => file.relativePath.includes('backups/') || file.relativePath.startsWith('data/'))).toBe(false);
    expect(readFileSync(join(workspace, 'clients/client/Documents/Contrats/devis.pdf'), 'utf8')).toBe('PDF PREUVE');
    expect(existsSync(join(workspace, 'backups/old-backup.zip'))).toBe(true);
  });

  it('signale explicitement les racines absentes ; ne crée aucun dossier', async () => {
    const inventory = await inventoryWorkspaceFiles(workspace);
    expect(inventory.files).toEqual([]);
    expect(inventory.missingRoots).toHaveLength(8);
    expect(existsSync(join(workspace, 'crm-identites'))).toBe(false);
  });

  it('refuse les chemins non portables, les traversées et les noms réservés Windows', () => {
    for (const unsafe of ['..', '.', 'CON.txt', 'nul', 'test:', 'foo\\bar', 'name ', 'name.', 'a/b', '']) {
      expect(() => checkedWorkspaceRelativePath(['clients', unsafe])).toThrow();
    }
    expect(checkedWorkspaceRelativePath(['clients', 'Été', 'pièce.pdf'])).toBe('clients/Été/pièce.pdf');
  });

  it('refuse un lien dans une racine possédée plutôt que suivre une destination externe', async () => {
    mkdirSync(join(workspace, 'bridge'), {recursive: true});
    const destination = join(outside, 'secret.txt');
    writeFileSync(destination, 'CONFIDENTIEL');
    symlinkSync(process.platform === 'win32' ? outside : destination, join(workspace, 'bridge', 'shortcut.txt'), process.platform === 'win32' ? 'junction' : 'file');
    await expect(inventoryWorkspaceFiles(workspace)).rejects.toThrow(/lien symbolique/);
  });

  it('détecte un fichier modifié sans convertir un inventaire incomplet en réussite', async () => {
    addFile(join(workspace, 'exports', 'x.txt'), 'TEST');
    const first = await inventoryWorkspaceFiles(workspace);
    writeFileSync(join(workspace, 'exports', 'x.txt'), 'TEST CHANGÉ');
    const second = await inventoryWorkspaceFiles(workspace);
    expect(first.files[0].sha256).not.toBe(second.files[0].sha256);
  });
});

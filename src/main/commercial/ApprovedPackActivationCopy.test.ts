import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {createHash} from 'node:crypto';
import {appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {comparePreservation, prepareApprovedActivationCopy, snapshotTables} from './ApprovedPackActivationCopy';

const sha = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex');
let root = '', base = '';

/** Scénario de l'étape A : une base « en service » et sa sauvegarde, plus le rapport JSON. */
function scenario(name: string) {
  const dir = path.join(root, name); mkdirSync(path.join(dir, 'service'), {recursive: true}); mkdirSync(path.join(dir, 'sauvegarde'));
  const source = path.join(dir, 'service', 'atoumweb-manager.sqlite'), backup = path.join(dir, 'sauvegarde', 'backup-coherent.sqlite');
  copyFileSync(base, source); copyFileSync(base, backup);
  const report = path.join(dir, 'sauvegarde', 'SAUVEGARDE-RESTAURATION.json');
  writeFileSync(report, JSON.stringify({source, backup, backupSha256: sha(backup), sourceFingerprintsBefore: {[source]: sha(source), [source + '-wal']: null}}));
  return {dir, source, backup, report, output: path.join(dir, 'copie-prete')};
}

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), 'atoumweb-activation-copy-test-'));
  base = path.join(root, 'base.sqlite');
  const db = new NodeSqliteAdapter(base); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  db.exec('PRAGMA journal_mode=DELETE'); db.close();
});
afterAll(() => rmSync(root, {recursive: true, force: true}));

describe('Copie propre de mise en service V3.9.4', {timeout: 60000}, () => {
  it('prepares a clean, verified copy without touching the live database or its backup', async () => {
    const s = scenario('ok'), sourceBefore = sha(s.source), backupBefore = sha(s.backup);
    const result = await prepareApprovedActivationCopy(s.report, s.output);
    expect(result.status).toBe('PRETE');
    expect(result.counts).toMatchObject({tarifsV394: 130, tarifsV394Publies: 0, clausesV394: 119, clausesV394Publiees: 0, fichesTest: 0, migration81: 1});
    expect(result.preservation.violations).toEqual([]);
    expect(result.stages.nomsEtFamilles).toMatchObject({applied: true, renames: 13, categoriesCreated: 18});
    expect(sha(result.output.path)).toBe(result.output.sha256);
    expect(existsSync(result.output.path + '-wal')).toBe(false);
    expect([sha(s.source), sha(s.backup)]).toEqual([sourceBefore, backupBefore]);
    const db = new NodeSqliteAdapter(result.output.path);
    try {
      expect(db.get<{n: number}>("SELECT count(*) n FROM catalog_items WHERE name LIKE 'TEST%'")!.n).toBe(0);
      expect(db.get<{integrity_check: string}>('PRAGMA integrity_check')!.integrity_check).toBe('ok');
    } finally { db.close(); }
  });

  it('refuses when the live database changed after the backup, and leaves no output', async () => {
    const s = scenario('source-modifiee');
    appendFileSync(s.source, Buffer.from([0]));
    await expect(prepareApprovedActivationCopy(s.report, s.output)).rejects.toThrow('a changé depuis la sauvegarde');
    expect(existsSync(s.output)).toBe(false);
  });

  it('refuses an altered backup, an existing output folder and an output next to the live database', async () => {
    const altered = scenario('sauvegarde-alteree');
    appendFileSync(altered.backup, Buffer.from([0]));
    await expect(prepareApprovedActivationCopy(altered.report, altered.output)).rejects.toThrow('Sauvegarde absente ou modifiée');
    const existing = scenario('sortie-existante'); mkdirSync(existing.output);
    await expect(prepareApprovedActivationCopy(existing.report, existing.output)).rejects.toThrow('existe déjà');
    const beside = scenario('sortie-a-cote');
    await expect(prepareApprovedActivationCopy(beside.report, path.join(path.dirname(beside.source), 'copie'))).rejects.toThrow('à côté de la base en service');
    expect(existsSync(path.join(path.dirname(beside.source), 'copie'))).toBe(false);
  });

  it('detects lost rows, forbidden changes, changes outside the pack and unexpected additions', () => {
    const db = new NodeSqliteAdapter(':memory:');
    try {
      db.exec(`CREATE TABLE catalog_items (id TEXT PRIMARY KEY, name TEXT, category TEXT);
        CREATE TABLE quotes (id TEXT PRIMARY KEY, total INTEGER);
        CREATE TABLE notes (body TEXT);
        INSERT INTO catalog_items VALUES ('pack','Ancien','Web'),('hors-pack','Autre','Web');
        INSERT INTO quotes VALUES ('q1',100),('q2',200);
        INSERT INTO notes VALUES ('a');`);
      const before = snapshotTables(db);
      db.exec(`UPDATE catalog_items SET name='Nouveau', category='Sites vitrines et options' WHERE id='pack';
        UPDATE catalog_items SET name='Changé' WHERE id='hors-pack';
        UPDATE quotes SET total=101 WHERE id='q1'; DELETE FROM quotes WHERE id='q2';
        INSERT INTO notes VALUES ('b');`);
      const report = comparePreservation(before, snapshotTables(db), new Set(['pack']));
      expect(report.violations).toEqual(expect.arrayContaining([
        expect.stringContaining('Fiche hors pack modifiée : hors-pack'),
        expect.stringContaining('Ligne existante modifiée : quotes'),
        expect.stringContaining('Ligne disparue : quotes'),
        expect.stringContaining('Ajout inattendu : 1 ligne(s) dans notes'),
      ]));
      expect(report.violations.some(v => v.includes('"pack"'))).toBe(false);
    } finally { db.close(); }
  });
});

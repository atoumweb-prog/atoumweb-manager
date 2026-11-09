import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {inspectCatalogDraftActivation, rehearseCatalogDraftActivationTemp} from '../database/catalogDraftActivation';
import {ApprovedPackService} from './ApprovedPackService';
import {APPROVED_PACK} from './ApprovedPackSource';
import {applyApprovedPackIdentityTemp, planApprovedPackIdentity} from './ApprovedPackActivationPlan';

/**
 * Copie PROPRE de mise en service de la V3.9.4 (aucune donnée de test) :
 * sauvegarde vérifiée → copie TEMP neuve → migration 81 → import du pack → noms et familles →
 * contrôles de conservation → fichier final dans un dossier NOUVEAU.
 * Ne lit la base en service que pour vérifier son empreinte ; ne l'ouvre ni ne la modifie jamais.
 * Le remplacement de la base en service reste un geste manuel, sur accord explicite.
 */

export type SnapshotReport = {
  source: string; backup: string; backupSha256: string;
  sourceFingerprintsBefore: Record<string, string | null>;
};

/** Colonnes de lignes EXISTANTES que l'activation a le droit de modifier (et seulement pour les fiches du pack). */
export const ALLOWED_EXISTING_ROW_CHANGES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  catalog_items: ['name', 'category', 'category_id', 'updated_at', 'canonical_code', 'identity_provenance_json'],
});

/** Tables où l'activation a le droit d'AJOUTER des lignes. Toute autre création est une anomalie. */
export const ALLOWED_NEW_ROWS: ReadonlySet<string> = new Set([
  'schema_migrations',
  'catalog_items', 'catalog_versions', 'catalog_import_runs', 'catalog_import_entries',
  'catalog_categories', 'catalog_category_audit', 'catalog_command_receipts',
  // Ajouts documentés par le rapport d'intégration du 08/11 (règles par version 0→130,
  // compositions 11→19, rattachements de modèles de projet 2→3), constatés sur la préproduction.
  'catalog_commercial_rules', 'offer_components', 'catalog_project_blueprints',
  'contract_clause_templates', 'contract_clause_versions', 'contract_editorial_import_runs', 'contract_editorial_import_entries',
  'activity_log',
]);

const sha256File = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sha256OrNull = (file: string) => existsSync(file) ? sha256File(file) : null;

type TableSnapshot = {columns: string[]; rows: Map<string, Record<string, unknown>>};

function serialize(value: unknown): unknown {
  return value instanceof Uint8Array ? 'hex:' + Buffer.from(value).toString('hex') : typeof value === 'bigint' ? value.toString() : value;
}

/** Instantané de toutes les lignes de toutes les tables, indexées par clé primaire (ou rowid). */
export function snapshotTables(db: DatabaseAdapter): Map<string, TableSnapshot> {
  const tables = db.all<{name: string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const result = new Map<string, TableSnapshot>();
  for (const {name} of tables) {
    const info = db.all<{name: string; pk: number}>(`PRAGMA table_info("${name.replace(/"/g, '""')}")`);
    const columns = info.map(c => c.name);
    const pk = info.filter(c => c.pk > 0).sort((a, b) => a.pk - b.pk).map(c => c.name);
    const keyColumns = pk.length ? pk : ['rowid'];
    const select = (pk.length ? '' : 'rowid AS "__rowid", ') + columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
    const rows = new Map<string, Record<string, unknown>>();
    for (const row of db.all<Record<string, unknown>>(`SELECT ${select} FROM "${name.replace(/"/g, '""')}"`)) {
      const key = JSON.stringify(keyColumns.map(k => serialize(k === 'rowid' ? row.__rowid : row[k])));
      const clean: Record<string, unknown> = {};
      for (const c of columns) clean[c] = serialize(row[c]);
      rows.set(key, clean);
    }
    result.set(name, {columns, rows});
  }
  return result;
}

export type PreservationReport = {
  violations: string[];
  changedExistingRows: Record<string, number>;
  newRows: Record<string, number>;
};

/** Compare avant/après : aucune ligne existante perdue ou modifiée hors des colonnes autorisées ; ajouts seulement là où prévu. */
export function comparePreservation(before: Map<string, TableSnapshot>, after: Map<string, TableSnapshot>, packItemIds: ReadonlySet<string>): PreservationReport {
  const violations: string[] = [], changedExistingRows: Record<string, number> = {}, newRows: Record<string, number> = {};
  for (const [table, old] of before) {
    const now = after.get(table);
    if (!now) { violations.push(`Table disparue : ${table}`); continue; }
    for (const column of old.columns) if (!now.columns.includes(column)) violations.push(`Colonne disparue : ${table}.${column}`);
    const allowed = ALLOWED_EXISTING_ROW_CHANGES[table] ?? [];
    for (const [key, row] of old.rows) {
      const current = now.rows.get(key);
      if (!current) { violations.push(`Ligne disparue : ${table} ${key}`); continue; }
      const changed = old.columns.filter(c => JSON.stringify(row[c]) !== JSON.stringify(current[c]));
      if (!changed.length) continue;
      changedExistingRows[table] = (changedExistingRows[table] ?? 0) + 1;
      const forbidden = changed.filter(c => !allowed.includes(c));
      if (forbidden.length) violations.push(`Ligne existante modifiée : ${table} ${key} (${forbidden.join(', ')})`);
      else if (table === 'catalog_items' && !packItemIds.has(String(row.id))) violations.push(`Fiche hors pack modifiée : ${row.id}`);
    }
    const added = [...now.rows.keys()].filter(k => !old.rows.has(k)).length;
    if (added) { newRows[table] = added; if (!ALLOWED_NEW_ROWS.has(table)) violations.push(`Ajout inattendu : ${added} ligne(s) dans ${table}`); }
  }
  for (const [table, now] of after) if (!before.has(table)) {
    newRows[table] = now.rows.size;
    if (now.rows.size && !ALLOWED_NEW_ROWS.has(table)) violations.push(`Nouvelle table remplie inattendue : ${table}`);
  }
  return {violations, changedExistingRows, newRows};
}

function packItemIds(db: DatabaseAdapter): Set<string> {
  return new Set(db.all<{item_id: string}>("SELECT DISTINCT item_id FROM catalog_versions WHERE json_extract(provenance_json,'$.sha256')=?",
    [APPROVED_PACK.catalogue.sha256_word]).map(r => r.item_id));
}

function count(db: DatabaseAdapter, sql: string, params: (string | number)[] = []): number {
  return Number(db.get<{n: number}>(sql, params)!.n);
}

/** Contrôles métier finaux sur une base activée ; renvoie la liste des anomalies (vide = conforme). */
export function verifyActivatedDatabase(db: DatabaseAdapter): {anomalies: string[]; counts: Record<string, number>} {
  const sha = APPROVED_PACK.catalogue.sha256_word, anomalies: string[] = [];
  const counts = {
    tarifsV394: count(db, "SELECT count(*) n FROM catalog_versions WHERE json_extract(provenance_json,'$.sha256')=?", [sha]),
    tarifsV394Publies: count(db, "SELECT count(*) n FROM catalog_versions WHERE json_extract(provenance_json,'$.sha256')=? AND (status<>'draft' OR published_at IS NOT NULL)", [sha]),
    clausesV394: count(db, "SELECT count(*) n FROM contract_clause_versions WHERE json_extract(review_metadata_json,'$.provenance.sha256')=?", [APPROVED_PACK.library.sha256_word]),
    clausesV394Publiees: count(db, "SELECT count(*) n FROM contract_clause_versions WHERE json_extract(review_metadata_json,'$.provenance.sha256')=? AND (status<>'draft' OR published_at IS NOT NULL)", [APPROVED_PACK.library.sha256_word]),
    fichesTest: count(db, "SELECT count(*) n FROM catalog_items WHERE name LIKE 'TEST%'"),
    migration81: count(db, 'SELECT count(*) n FROM schema_migrations WHERE id=81'),
  };
  if (counts.tarifsV394 !== 130) anomalies.push(`${counts.tarifsV394} tarifs V3.9.4 au lieu de 130`);
  if (counts.tarifsV394Publies) anomalies.push(`${counts.tarifsV394Publies} tarif(s) V3.9.4 publié(s) : la mise en service ne publie rien`);
  if (counts.clausesV394 !== 119) anomalies.push(`${counts.clausesV394} clauses V3.9.4 au lieu de 119`);
  if (counts.clausesV394Publiees) anomalies.push(`${counts.clausesV394Publiees} clause(s) V3.9.4 publiée(s)`);
  if (counts.migration81 !== 1) anomalies.push('Migration 81 absente');
  const identity = planApprovedPackIdentity(db);
  if (identity.blockers.length || identity.changes.length) anomalies.push('Noms et familles incomplets : ' + [...identity.blockers, `${identity.changes.length} fiche(s) à reprendre`].join(' ; '));
  const draft = inspectCatalogDraftActivation(db);
  if (!draft.applied || !draft.compatible) anomalies.push('Schéma 81 non conforme : ' + draft.blockers.join(' ; '));
  const integrity = db.all<{integrity_check: string}>('PRAGMA integrity_check');
  if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') anomalies.push('Intégrité SQLite non conforme');
  if (db.all('PRAGMA foreign_key_check').length) anomalies.push('Clés étrangères orphelines');
  return {anomalies, counts};
}

export type ActivationCopyResult = {
  status: 'PRETE'; preparedAt: string; snapshotReport: string; source: string;
  backup: {path: string; sha256: string}; output: {path: string; sha256: string};
  sourceUnchangedSinceBackup: true; stages: Record<string, unknown>;
  preservation: PreservationReport; counts: Record<string, number>;
};

/**
 * Prépare la copie. Lève une erreur (et ne produit aucun fichier final) au moindre écart.
 * `outputDir` doit être un dossier qui n'existe pas encore et qui n'est pas celui de la base en service.
 */
export async function prepareApprovedActivationCopy(snapshotReportPath: string, outputDir: string): Promise<ActivationCopyResult> {
  const reportFile = realpathSync(snapshotReportPath);
  const report = JSON.parse(readFileSync(reportFile, 'utf8').replace(/^﻿/, '')) as SnapshotReport;
  if (!report?.source || !report.backup || !/^[a-f0-9]{64}$/.test(report.backupSha256 ?? '') || !report.sourceFingerprintsBefore)
    throw Error('Rapport de sauvegarde incomplet : relancez la sauvegarde (étape A).');
  const output = path.resolve(outputDir);
  if (existsSync(output)) throw Error('Le dossier de sortie existe déjà : choisissez un dossier nouveau.');
  const sourceDir = path.dirname(path.resolve(report.source));
  if (output === sourceDir || output.startsWith(sourceDir + path.sep)) throw Error('Le dossier de sortie ne doit pas être à côté de la base en service.');

  if (!existsSync(report.backup) || sha256File(report.backup) !== report.backupSha256) throw Error('Sauvegarde absente ou modifiée depuis sa création : relancez la sauvegarde (étape A).');
  for (const [file, expected] of Object.entries(report.sourceFingerprintsBefore)) {
    const current = sha256OrNull(file);
    // Un journal WAL vide et absent sont équivalents.
    const emptyWal = (h: string | null) => h === null || h === createHash('sha256').update('').digest('hex');
    if (current !== expected && !(file.endsWith('-wal') && emptyWal(current) && emptyWal(expected)))
      throw Error(`La base en service a changé depuis la sauvegarde (${path.basename(file)}) : refaites la sauvegarde (étape A).`);
  }

  const work = mkdtempSync(path.join(tmpdir(), 'atoumweb-activation-copy-'));
  const candidate = path.join(work, 'candidate.sqlite');
  let createdOutput = false;
  try {
    copyFileSync(report.backup, candidate);
    if (sha256File(candidate) !== report.backupSha256) throw Error('Copie de travail différente de la sauvegarde.');
    const db = new NodeSqliteAdapter(candidate);
    const stages: Record<string, unknown> = {};
    let preservation: PreservationReport, counts: Record<string, number>;
    try {
      db.exec('PRAGMA foreign_keys=ON');
      const before = snapshotTables(db);
      const preflight = inspectCatalogDraftActivation(db);
      if (!preflight.compatible) throw Error('Précontrôle migration 81 bloquant : ' + preflight.blockers.join(' ; '));
      stages.migration81 = preflight.applied ? 'déjà appliquée' : (rehearseCatalogDraftActivationTemp(db), 'appliquée');

      const pack = new ApprovedPackService(db), plan = pack.simulate();
      if (plan.blockers.length) throw Error('Import du pack bloqué : ' + plan.blockers.join(' ; '));
      const applied = pack.apply(plan.planSha256);
      stages.importPack = {planSha256: plan.planSha256, catalogue: applied.catalogue.counts, clauses: applied.contracts.counts};

      const identityPlan = planApprovedPackIdentity(db);
      if (identityPlan.blockers.length) throw Error('Noms et familles bloqués : ' + identityPlan.blockers.join(' ; '));
      stages.nomsEtFamilles = applyApprovedPackIdentityTemp(db, identityPlan.planSha256);

      const replay = pack.simulate();
      if (replay.blockers.length) throw Error('Rejeu de l’import non neutre : ' + replay.blockers.join(' ; '));
      stages.rejeu = {catalogue: replay.catalogue.counts};

      preservation = comparePreservation(before, snapshotTables(db), packItemIds(db));
      if (preservation.violations.length) throw Error('Conservation des données non respectée :\n' + preservation.violations.slice(0, 20).join('\n'));
      const verified = verifyActivatedDatabase(db);
      if (verified.anomalies.length) throw Error('Contrôles finaux non conformes :\n' + verified.anomalies.join('\n'));
      counts = verified.counts;

      mkdirSync(output, {recursive: true});
      createdOutput = true;
      await db.backupTo(path.join(output, 'atoumweb-manager.sqlite'));
    } finally { db.close(); }

    const finalFile = path.join(output, 'atoumweb-manager.sqlite');
    const reopened = new NodeSqliteAdapter(finalFile);
    try {
      const recheck = verifyActivatedDatabase(reopened);
      if (recheck.anomalies.length) throw Error('Fichier final non conforme :\n' + recheck.anomalies.join('\n'));
      reopened.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } finally { reopened.close(); }
    for (const extra of ['-wal', '-shm']) if (existsSync(finalFile + extra)) rmSync(finalFile + extra);

    return {
      status: 'PRETE', preparedAt: new Date().toISOString(), snapshotReport: reportFile, source: report.source,
      backup: {path: report.backup, sha256: report.backupSha256}, output: {path: finalFile, sha256: sha256File(finalFile)},
      sourceUnchangedSinceBackup: true, stages, preservation: preservation!, counts: counts!,
    };
  } catch (error) {
    // Aucun fichier final partiel : en cas d'écart, le dossier de sortie créé ici est retiré.
    if (createdOutput) rmSync(output, {recursive: true, force: true});
    throw error;
  } finally { rmSync(work, {recursive: true, force: true}); }
}

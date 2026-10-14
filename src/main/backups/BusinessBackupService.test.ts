import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { BusinessBackupService } from './BusinessBackupService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let backups: BusinessBackupService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-business-backups-'));
  const workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, workspace);
  backups = new BusinessBackupService(database);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('BusinessBackupService', () => {
  it('distingue une sauvegarde connue serveur d’une vraie copie locale', () => {
    const project = projects.createInternal({ name: 'Site client test' });
    const backup = backups.create({
      projectId: project.id,
      backupType: 'complete',
      label: 'Sauvegarde complète avant mise à jour',
      backupAt: '2026-09-14T01:00:00.000Z',
    });
    backups.addLocation(backup.id, {
      locationType: 'server',
      label: 'JetBackup hébergeur',
      pathOrReference: 'JetBackup / snapshot 2026-09-14',
    });

    const beforeLocal = backups.overview({ projectId: project.id });
    expect(beforeLocal.latestKnown?.id).toBe(backup.id);
    expect(beforeLocal.latestLocal).toBeNull();
    expect(beforeLocal.localCopies).toBe(0);

    const localPath = join(workspaceRoot, 'site-backup.zip');
    writeFileSync(localPath, 'backup', 'utf8');
    backups.addLocation(backup.id, {
      locationType: 'local',
      label: 'Copie PC AtoumWeb',
      pathOrReference: localPath,
    });

    const afterLocal = backups.overview({ projectId: project.id });
    expect(afterLocal.latestLocal?.id).toBe(backup.id);
    expect(afterLocal.localCopies).toBe(1);
    expect(afterLocal.missingLocalCopies).toBe(0);
  });

  it('détecte une copie locale manquante et permet sa relocalisation', () => {
    const project = projects.createInternal({ name: 'Projet sauvegarde relocalisée' });
    const backup = backups.create({ projectId: project.id, backupType: 'database', label: 'Base SQL' });
    const missingPath = join(workspaceRoot, 'absente.sql');
    const withLocation = backups.addLocation(backup.id, {
      locationType: 'local',
      label: 'Dump local',
      pathOrReference: missingPath,
    });

    expect(withLocation.locations[0].exists).toBe(false);
    expect(backups.overview({ projectId: project.id }).missingLocalCopies).toBe(1);

    const replacement = join(workspaceRoot, 'retrouvee.sql');
    writeFileSync(replacement, 'CREATE TABLE demo(id INTEGER);', 'utf8');
    const relocated = backups.relocalizePath(withLocation.locations[0].id, replacement);

    expect(relocated.locations[0].pathOrReference).toBe(replacement);
    expect(relocated.locations[0].exists).toBe(true);
    expect(relocated.locations[0].missingAt).toBeNull();
  });

  it('garde une seule version stable par projet', () => {
    const project = projects.createInternal({ name: 'Projet stable' });
    const first = backups.create({
      projectId: project.id,
      backupType: 'post_validation',
      label: 'Version stable 1',
      backupAt: '2026-09-12T10:00:00.000Z',
    });
    const second = backups.create({
      projectId: project.id,
      backupType: 'post_validation',
      label: 'Version stable 2',
      backupAt: '2026-09-13T10:00:00.000Z',
    });

    backups.markStable(first.id);
    backups.markStable(second.id);

    expect(backups.get(first.id).stable).toBe(false);
    expect(backups.get(second.id).stable).toBe(true);
    expect(backups.overview({ projectId: project.id }).latestStable?.id).toBe(second.id);
  });

  it('une confirmation serveur reste manuelle et ne devient pas une copie locale', () => {
    const project = projects.createInternal({ name: 'Projet serveur' });
    const backup = backups.create({ projectId: project.id, backupType: 'complete', label: 'Snapshot serveur' });
    const located = backups.addLocation(backup.id, {
      locationType: 'server',
      label: 'Sauvegarde o2switch',
      pathOrReference: 'référence hébergeur non accessible localement',
    });

    const verified = backups.verifyLocation(located.locations[0].id);

    expect(verified.locations[0].verifiedAt).toBeTruthy();
    expect(verified.locations[0].exists).toBeNull();
    expect(backups.overview({ projectId: project.id }).latestLocal).toBeNull();
  });

  it('filtre Client et Projet sans mélanger les registres et les compteurs', () => {
    database.run(
      `INSERT INTO organizations(id,name,created_at,updated_at)
       VALUES ('org-a','Client A','2026-10-14T08:00:00Z','2026-10-14T08:00:00Z'),
              ('org-b','Client B','2026-10-14T08:00:00Z','2026-10-14T08:00:00Z')`,
    );
    database.run(
      `INSERT INTO client_accounts(id,organization_id,status,became_client_at,created_at,updated_at)
       VALUES ('client-a','org-a','active','2026-10-14T08:00:00Z','2026-10-14T08:00:00Z','2026-10-14T08:00:00Z'),
              ('client-b','org-b','active','2026-10-14T08:00:00Z','2026-10-14T08:00:00Z','2026-10-14T08:00:00Z')`,
    );
    const first = backups.create({ clientAccountId: 'client-a', backupType: 'complete', label: 'Copie A' });
    const second = backups.create({ clientAccountId: 'client-b', backupType: 'complete', label: 'Copie B' });
    const project = projects.createInternal({ name: 'Projet filtré' });
    const projectRecord = backups.create({ projectId: project.id, backupType: 'database', label: 'Copie projet' });
    expect(backups.list({ clientAccountId: 'client-a' }).map((record) => record.id)).toEqual([first.id]);
    expect(backups.list({ clientAccountId: 'client-b' }).map((record) => record.id)).toEqual([second.id]);
    expect(backups.list({ projectId: project.id }).map((record) => record.id)).toEqual([projectRecord.id]);
    expect(backups.overview({ clientAccountId: 'client-a' }).totalRecords).toBe(1);
    expect(backups.overview({ projectId: project.id }).latestKnown?.id).toBe(projectRecord.id);
  });

  it('indexe les sauvegardes dans la recherche globale sans dupliquer les données métier', () => {
    const project = projects.createInternal({ name: 'Projet index sauvegarde' });
    const backup = backups.create({ projectId: project.id, backupType: 'config_export', label: 'Export Divi stable' });
    backups.addLocation(backup.id, {
      locationType: 'server',
      label: 'Serveur client',
      pathOrReference: 'export-divi-septembre.json',
    });

    const indexed = database.get<{ title: string; search_text: string }>(
      "SELECT title,search_text FROM search_documents WHERE entity_type='backup_record' AND entity_id=?",
      [backup.id],
    );

    expect(indexed?.title).toBe('Export Divi stable');
    expect(indexed?.search_text).toContain('export-divi-septembre.json');
  });
});

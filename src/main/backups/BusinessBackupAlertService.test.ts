import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { OperationsService } from '../operations/OperationsService';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { BusinessBackupAlertService } from './BusinessBackupAlertService';
import { BusinessBackupService } from './BusinessBackupService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let crm: CrmService;
let projects: ProjectService;
let operations: OperationsService;
let backups: BusinessBackupService;
let alerts: BusinessBackupAlertService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-backup-alerts-'));
  const workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  projects = new ProjectService(database, workspace);
  operations = new OperationsService(database);
  backups = new BusinessBackupService(database);
  alerts = new BusinessBackupAlertService(database, backups);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

function createClientProject(name = 'Client sauvegardes') {
  const organization = crm.createOrganization({ name });
  const client = crm.createClient({ organizationId: organization.id });
  const project = projects.createInternal({ name: `${name} — site` });
  database.run('UPDATE projects SET client_account_id=? WHERE id=?', [client.id, project.id]);
  return { client, project: projects.getProject(project.id) };
}

describe('BusinessBackupAlertService', () => {
  it('alerte quand un projet actif ne possède aucune sauvegarde connue', () => {
    const { project } = createClientProject();

    const list = alerts.listAlerts();

    expect(list.some((alert) => alert.projectId === project.id && alert.code === 'no_backup')).toBe(true);
  });

  it('distingue sauvegarde serveur seule et copie locale récente', () => {
    const { client, project } = createClientProject('Serveur seulement');
    const record = backups.create({
      clientAccountId: client.id,
      projectId: project.id,
      backupType: 'complete',
      label: 'Snapshot hébergeur',
    });
    backups.addLocation(record.id, {
      locationType: 'server',
      label: 'JetBackup',
      pathOrReference: 'snapshot serveur',
    });

    expect(alerts.listAlerts().some((alert) => alert.projectId === project.id && alert.code === 'server_only')).toBe(true);

    const localPath = join(workspaceRoot, 'copie-locale.zip');
    writeFileSync(localPath, 'backup', 'utf8');
    backups.addLocation(record.id, {
      locationType: 'local',
      label: 'Copie locale',
      pathOrReference: localPath,
    });

    const afterLocal = alerts.listAlerts().filter((alert) => alert.projectId === project.id);
    expect(afterLocal.some((alert) => alert.code === 'server_only')).toBe(false);
    expect(afterLocal.some((alert) => alert.code === 'no_recent_local')).toBe(false);
  });

  it('applique une politique projet personnalisée sans modifier les valeurs globales', () => {
    const { client, project } = createClientProject('Politique spécifique');
    alerts.updatePolicy({
      clientAccountId: client.id,
      projectId: project.id,
      maxKnownAgeDays: 1,
      maxLocalAgeDays: 2,
      warnServerOnly: false,
      remindBeforeIntervention: true,
      remindAfterMajorChange: false,
    });

    const policy = alerts.getPolicy({ clientAccountId: client.id, projectId: project.id });

    expect(policy.inherited).toBe(false);
    expect(policy.maxKnownAgeDays).toBe(1);
    expect(policy.maxLocalAgeDays).toBe(2);
    expect(policy.warnServerOnly).toBe(false);
    expect(policy.remindAfterMajorChange).toBe(false);
  });

  it('rappelle une sauvegarde avant intervention technique puis conserve son lien', () => {
    const { client, project } = createClientProject('Intervention technique');
    const intervention = operations.createIntervention({
      clientAccountId: client.id,
      projectId: project.id,
      type: 'modification',
      subject: 'Modifier le header',
    });

    const before = alerts.reviewIntervention(intervention.id);
    expect(before.alerts.some((alert) => alert.code === 'pre_intervention_missing')).toBe(true);

    const after = alerts.recordForIntervention({ interventionId: intervention.id, role: 'pre_intervention' });
    expect(after.preInterventionBackup).toBeTruthy();
    expect(after.preInterventionBackup?.backupType).toBe('pre_intervention');
    expect(after.alerts.some((alert) => alert.code === 'pre_intervention_missing')).toBe(false);
  });

  it('retrouve une copie locale client même après création d une trace avant intervention', () => {
    const organization = crm.createOrganization({ name: 'Client sans projet' });
    const client = crm.createClient({ organizationId: organization.id });
    const localPath = join(workspaceRoot, 'copie-client.zip');
    writeFileSync(localPath, 'backup', 'utf8');
    const existing = backups.create({
      clientAccountId: client.id,
      backupType: 'files_code',
      label: 'Copie locale client',
      backupAt: '2026-09-20T17:00:00.000Z',
    });
    backups.addLocation(existing.id, {
      locationType: 'local',
      label: 'Copie locale MSI',
      pathOrReference: localPath,
    });
    const intervention = operations.createIntervention({
      clientAccountId: client.id,
      type: 'correction',
      subject: 'Correction sans projet',
    });

    const after = alerts.recordForIntervention({ interventionId: intervention.id, role: 'pre_intervention' });

    expect(after.preInterventionBackup).toBeTruthy();
    expect(after.latestLocal?.id).toBe(existing.id);
  });

  it('propose une sauvegarde post-validation après une modification terminée', () => {
    const { client, project } = createClientProject('Post validation');
    const intervention = operations.createIntervention({
      clientAccountId: client.id,
      projectId: project.id,
      type: 'modification',
      subject: 'Refonte du footer',
    });
    alerts.recordForIntervention({ interventionId: intervention.id, role: 'pre_intervention' });
    operations.changeInterventionStatus(intervention.id, 'completed');

    const completed = alerts.reviewIntervention(intervention.id);
    expect(completed.alerts.some((alert) => alert.code === 'post_change_missing')).toBe(true);

    const withPost = alerts.recordForIntervention({ interventionId: intervention.id, role: 'post_intervention' });
    expect(withPost.postInterventionBackup).toBeTruthy();
    expect(withPost.alerts.some((alert) => alert.code === 'post_change_missing')).toBe(false);

    const stable = backups.markStable(withPost.postInterventionBackup!.id);
    expect(stable.stable).toBe(true);
  });

  it('rejette les références hors chronologie et rend le même lien pré/post idempotent', () => {
    const { client, project } = createClientProject('Chronologie intervention');
    const intervention = operations.createIntervention({
      clientAccountId: client.id,
      projectId: project.id,
      type: 'modification',
      subject: 'Correction métier chronologie',
    });
    database.run('UPDATE interventions SET started_at=?,completed_at=? WHERE id=?', [
      '2026-10-14T10:00:00.000Z', '2026-10-14T12:00:00.000Z', intervention.id,
    ]);
    const prior = backups.create({
      clientAccountId: client.id, projectId: project.id, backupType: 'complete',
      label: 'Copie déclarée préalable', backupAt: '2026-10-14T09:00:00.000Z',
    });
    const later = backups.create({
      clientAccountId: client.id, projectId: project.id, backupType: 'complete',
      label: 'Copie déclarée postérieure', backupAt: '2026-10-14T13:00:00.000Z',
    });
    expect(() => alerts.linkExisting(intervention.id, later.id, 'pre_intervention')).toThrow(/après le début/);
    expect(() => alerts.linkExisting(intervention.id, prior.id, 'post_intervention')).toThrow(/avant la clôture/);
    expect(database.get<{ total: number }>('SELECT COUNT(*) AS total FROM backup_intervention_links WHERE intervention_id=?', [intervention.id])?.total).toBe(0);
    alerts.linkExisting(intervention.id, prior.id, 'pre_intervention');
    alerts.linkExisting(intervention.id, prior.id, 'pre_intervention');
    alerts.linkExisting(intervention.id, later.id, 'post_intervention');
    alerts.linkExisting(intervention.id, later.id, 'post_intervention');
    expect(database.get<{ total: number }>('SELECT COUNT(*) AS total FROM backup_intervention_links WHERE intervention_id=?', [intervention.id])?.total).toBe(2);
    const reviewed = alerts.reviewIntervention(intervention.id);
    expect(reviewed.preInterventionBackup?.id).toBe(prior.id);
    expect(reviewed.postInterventionBackup?.id).toBe(later.id);
  });

  it('refuse de lier une sauvegarde provenant d’un autre projet', () => {
    const first = createClientProject('Premier client');
    const second = createClientProject('Second client');
    const intervention = operations.createIntervention({
      clientAccountId: first.client.id,
      projectId: first.project.id,
      type: 'maintenance',
      subject: 'Mise à jour WordPress',
    });
    const foreign = backups.create({
      clientAccountId: second.client.id,
      projectId: second.project.id,
      backupType: 'complete',
      label: 'Sauvegarde étrangère',
    });

    expect(() => alerts.linkExisting(intervention.id, foreign.id, 'pre_intervention')).toThrow(/n’appartient pas au projet/i);
  });
});

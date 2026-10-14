import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { TimeService } from './TimeService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let time: TimeService;
let now: Date;

function advance(minutes: number): void {
  now = new Date(now.getTime() + minutes * 60_000);
}

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-time-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  now = new Date('2026-09-13T10:00:00.000Z');
  time = new TimeService(database, () => new Date(now));
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('TimeService', () => {
  it('mesure une session avec pause et reprise sans compter le temps de pause', () => {
    const project = projects.createInternal({ name: 'AtoumWeb Manager' });
    const withTask = projects.addProjectNode(project.id, { type: 'task', name: 'Interface Projets' });
    const task = withTask.nodes[0];

    const started = time.start({
      projectId: project.id,
      projectNodeId: task.id,
      category: 'development',
      activityLabel: 'Développer la fiche Projet',
      billable: false,
    });
    expect(started.durationSeconds).toBe(0);
    expect(time.active()?.id).toBe(started.id);

    advance(30);
    const paused = time.pause(started.id);
    expect(paused.paused).toBe(true);
    expect(paused.durationSeconds).toBe(1800);

    advance(15);
    expect(time.active()?.durationSeconds).toBe(1800);

    time.resume(started.id);
    advance(30);
    const stopped = time.stop(started.id);

    expect(stopped.paused).toBe(false);
    expect(stopped.durationSeconds).toBe(3600);
    expect(stopped.projectId).toBe(project.id);
    expect(stopped.projectNodeId).toBe(task.id);
    expect(stopped.projectLabel).toBe('AtoumWeb Manager');
    expect(stopped.projectNodeLabel).toBe('Interface Projets');
    expect(time.active()).toBeNull();
  });

  it('conserve le motif métier d une pause', () => {
    const session = time.start({ category: 'support', activityLabel: 'Incident client' });
    advance(12);
    const paused = time.pause(session.id, 'need_information', 'Attente accès administrateur');

    expect(paused.paused).toBe(true);
    expect(paused.pauses).toHaveLength(1);
    expect(paused.pauses[0]).toMatchObject({
      reason: 'need_information',
      reasonNote: 'Attente accès administrateur',
    });

    expect(() => time.resume(session.id)).not.toThrow();
  });

  it('R07G-17 : chrono Page unique, pause/reprise et cumul par Page sans temps de pause', () => {
    const project = projects.createInternal({ name: 'Projet Page chronométrée' });
    const withPage = projects.addProjectNode(project.id, {
      type: 'module', displaySubtype: 'page', name: 'Accueil',
    });
    const page = withPage.nodes.find((node) => node.name === 'Accueil')!;
    const other = projects.addProjectNode(project.id, {
      type: 'module', displaySubtype: 'page', name: 'Contact',
    }).nodes.find((node) => node.name === 'Contact')!;

    const first = time.start({
      projectId: project.id,
      projectNodeId: page.id,
      category: 'production',
      activityLabel: 'Travailler sur Accueil',
      billable: true,
    });
    advance(12);
    const paused = time.pause(first.id);
    expect(paused.paused).toBe(true);
    expect(paused.durationSeconds).toBe(720);
    advance(25);
    expect(time.active()?.id).toBe(first.id);
    expect(time.active()?.durationSeconds).toBe(720);
    expect(() => time.start({
      projectId: project.id,
      projectNodeId: other.id,
      category: 'production',
    })).toThrow(/déjà active/i);
    expect(time.list({ projectId: project.id })).toHaveLength(1);

    const resumed = time.resume(first.id);
    expect(resumed.paused).toBe(false);
    advance(8);
    const stopped = time.stop(first.id);
    expect(stopped.durationSeconds).toBe(1200);
    expect(stopped.projectNodeId).toBe(page.id);
    expect(time.active()).toBeNull();

    const second = time.start({
      projectId: project.id,
      projectNodeId: page.id,
      category: 'production',
      activityLabel: 'Finir Accueil',
      billable: true,
    });
    advance(5);
    time.stop(second.id);
    const pageSessions = time.list({ projectId: project.id }).filter((session) => session.projectNodeId === page.id);
    expect(pageSessions).toHaveLength(2);
    expect(pageSessions.reduce((sum, session) => sum + session.durationSeconds, 0)).toBe(1500);
    expect(time.summary({ projectId: project.id })).toMatchObject({
      sessionCount: 2, totalSeconds: 1500, billableSeconds: 1500,
    });
    expect(database.all('PRAGMA foreign_key_check')).toHaveLength(0);
    expect(database.get<{ integrity_check: string }>('PRAGMA integrity_check')?.integrity_check).toBe('ok');
  });

  it('refuse une deuxième session active', () => {
    const project = projects.createInternal({ name: 'Premier projet' });
    time.start({ projectId: project.id, category: 'development' });

    expect(() => time.start({ category: 'administrative' })).toThrow(/déjà active/i);
    expect(time.list()).toHaveLength(1);
  });

  it('dérive automatiquement le projet depuis la tâche et vérifie la cohérence', () => {
    const projectA = projects.createInternal({ name: 'Projet A' });
    const projectB = projects.createInternal({ name: 'Projet B' });
    const taskA = projects.addProjectNode(projectA.id, { type: 'task', name: 'Tâche A' }).nodes[0];

    const session = time.start({ projectNodeId: taskA.id, category: 'production' });
    expect(session.projectId).toBe(projectA.id);
    time.stop(session.id);

    expect(() => time.start({ projectId: projectB.id, projectNodeId: taskA.id, category: 'production' }))
      .toThrow(/n’appartient pas/i);
  });

  it('ajoute du temps manuel et calcule les totaux facturables', () => {
    const project = projects.createInternal({ name: 'Projet temps manuel' });

    time.addManual({
      projectId: project.id,
      category: 'production',
      activityLabel: 'Production',
      startedAt: '2026-09-12T08:00:00.000Z',
      endedAt: '2026-09-12T10:00:00.000Z',
      billable: true,
    });
    time.addManual({
      projectId: project.id,
      category: 'administrative',
      activityLabel: 'Classement',
      startedAt: '2026-09-12T10:00:00.000Z',
      endedAt: '2026-09-12T10:30:00.000Z',
      billable: false,
    });

    const summary = time.summary({ projectId: project.id });
    expect(summary.sessionCount).toBe(2);
    expect(summary.totalSeconds).toBe(9000);
    expect(summary.billableSeconds).toBe(7200);
    expect(summary.nonBillableSeconds).toBe(1800);
  });

  it('refuse une saisie manuelle dont la fin précède le début', () => {
    expect(() => time.addManual({
      category: 'other',
      startedAt: '2026-09-12T11:00:00.000Z',
      endedAt: '2026-09-12T10:00:00.000Z',
    })).toThrow(/postérieure/i);
  });

  it('fige une session ancienne au dernier point de vie et peut l’arrêter à cet instant', () => {
    const session = time.start({ category: 'administrative', activityLabel: 'Travail avant fermeture' });
    advance(30);
    time.heartbeat(session.id);
    advance(8 * 60);

    const recovered = time.active();
    expect(recovered?.durationSeconds).toBe(1800);

    const stopped = time.stopAtLastKnown(session.id);
    expect(stopped.endedAt).toBe('2026-09-13T10:30:00.000Z');
    expect(stopped.durationSeconds).toBe(1800);
    expect(time.active()).toBeNull();
  });

  it('reprend une session ancienne sans compter le temps où le Manager était fermé', () => {
    const session = time.start({ category: 'development', activityLabel: 'Développement' });
    advance(20);
    time.heartbeat(session.id);
    advance(120);

    expect(time.active()?.durationSeconds).toBe(1200);

    const resumed = time.recoverResume(session.id);
    expect(resumed.paused).toBe(false);
    expect(resumed.durationSeconds).toBe(1200);

    advance(10);
    const stopped = time.stop(session.id);
    expect(stopped.durationSeconds).toBe(1800);
  });

  it('reprend aussi une session qui était déjà en pause avant la fermeture', () => {
    const session = time.start({ category: 'production' });
    advance(10);
    time.pause(session.id);
    advance(180);

    expect(time.active()?.durationSeconds).toBe(600);
    expect(time.active()?.paused).toBe(true);

    const resumed = time.recoverResume(session.id);
    expect(resumed.paused).toBe(false);
    expect(resumed.durationSeconds).toBe(600);

    advance(5);
    expect(time.stop(session.id).durationSeconds).toBe(900);
  });
});

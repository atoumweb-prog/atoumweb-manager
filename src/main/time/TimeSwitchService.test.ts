import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { TimeService } from './TimeService';
import { TimeSwitchService } from './TimeSwitchService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let time: TimeService;
let switches: TimeSwitchService;
let now: Date;

function advance(minutes: number): void {
  now = new Date(now.getTime() + minutes * 60_000);
}

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-time-switch-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  now = new Date('2026-09-13T10:00:00.000Z');
  time = new TimeService(database, () => new Date(now));
  switches = new TimeSwitchService(database, time, () => new Date(now));
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('TimeSwitchService', () => {
  it('termine la session active et démarre la suivante au même instant', () => {
    const project = projects.createInternal({ name: 'AtoumWeb Manager' });
    const first = time.start({ projectId: project.id, category: 'development', activityLabel: 'Écran Projets' });
    advance(45);
    time.heartbeat(first.id);
    advance(1);

    const next = switches.switchTo({ projectId: project.id, category: 'design', activityLabel: 'Maquette dashboard' });
    const previous = time.list({ projectId: project.id }).find((session) => session.id === first.id);

    expect(previous?.endedAt).toBe('2026-09-13T10:46:00.000Z');
    expect(next.startedAt).toBe('2026-09-13T10:46:00.000Z');
    expect(next.category).toBe('design');
    expect(time.active()?.id).toBe(next.id);
    expect(time.list({ projectId: project.id })).toHaveLength(2);
  });

  it('préserve une pause en cours en la fermant au moment du changement', () => {
    const first = time.start({ category: 'administrative' });
    advance(20);
    time.pause(first.id);
    advance(30);

    const next = switches.switchTo({ category: 'research_training', activityLabel: 'Formation' });
    const previous = time.list().find((session) => session.id === first.id);

    expect(previous?.durationSeconds).toBe(1200);
    expect(next.activityLabel).toBe('Formation');
    expect(time.active()?.id).toBe(next.id);
  });

  it('refuse de remplacer silencieusement une session ancienne à récupérer', () => {
    time.start({ category: 'development' });
    advance(5);

    expect(() => switches.switchTo({ category: 'production' })).toThrow(/d’abord être récupéré/i);
    expect(time.list()).toHaveLength(1);
  });
});

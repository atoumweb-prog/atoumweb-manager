import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { TimeCorrectionService } from './TimeCorrectionService';
import { TimeService } from './TimeService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let time: TimeService;
let corrections: TimeCorrectionService;
let now: Date;

function advance(minutes: number): void {
  now = new Date(now.getTime() + minutes * 60_000);
}

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-time-correction-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  now = new Date('2026-09-13T10:00:00.000Z');
  time = new TimeService(database, () => new Date(now));
  corrections = new TimeCorrectionService(database, time);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('TimeCorrectionService', () => {
  it('corrige les horaires, le contexte et les informations d’une session terminée', () => {
    const project = projects.createInternal({ name: 'Site AtoumWeb' });
    const session = time.addManual({
      category: 'production',
      activityLabel: 'Ancien libellé',
      startedAt: '2026-09-13T08:00:00.000Z',
      endedAt: '2026-09-13T09:00:00.000Z',
      billable: true,
    });

    const updated = corrections.update(session.id, {
      projectId: project.id,
      category: 'development',
      activityLabel: 'Correction responsive',
      startedAt: '2026-09-13T08:15:00.000Z',
      endedAt: '2026-09-13T09:45:00.000Z',
      billable: false,
      note: 'Horaire corrigé après vérification.',
    });

    expect(updated.projectId).toBe(project.id);
    expect(updated.category).toBe('development');
    expect(updated.activityLabel).toBe('Correction responsive');
    expect(updated.billable).toBe(false);
    expect(updated.note).toBe('Horaire corrigé après vérification.');
    expect(updated.durationSeconds).toBe(5400);
  });

  it('refuse de corriger une session encore active', () => {
    const session = time.start({ category: 'administrative' });

    expect(() => corrections.update(session.id, {
      category: 'administrative',
      startedAt: '2026-09-13T10:00:00.000Z',
      endedAt: '2026-09-13T10:30:00.000Z',
    })).toThrow(/arrête le chrono/i);
  });

  it('refuse une correction qui placerait une pause existante hors de la session', () => {
    const session = time.start({ category: 'development' });
    advance(20);
    time.pause(session.id);
    advance(10);
    time.resume(session.id);
    advance(20);
    const stopped = time.stop(session.id);

    expect(stopped.durationSeconds).toBe(2400);
    expect(() => corrections.update(session.id, {
      category: 'development',
      startedAt: '2026-09-13T10:25:00.000Z',
      endedAt: '2026-09-13T10:50:00.000Z',
    })).toThrow(/pause existante/i);
  });
});

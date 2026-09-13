import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectCompletionService } from './ProjectCompletionService';
import { ProjectResourceService } from './ProjectResourceService';
import { ProjectService } from './ProjectService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let resources: ProjectResourceService;
let completion: ProjectCompletionService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-completion-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  const workspace = createWorkspacePaths(workspaceRoot);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
  completion = new ProjectCompletionService(database);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ProjectCompletionService', () => {
  it('signale les tâches et prérequis ouverts sans bloquer la terminaison', () => {
    const project = projects.createInternal({ name: 'Projet à terminer' });
    projects.addProjectNode(project.id, { type: 'task', name: 'Finir la page', required: true });
    projects.addPrerequisite(project.id, { label: 'Validation finale', required: true });

    const review = completion.review(project.id);

    expect(review.canComplete).toBe(true);
    expect(review.warningCount).toBe(2);
    expect(review.items.find((item) => item.key === 'required_tasks')?.state).toBe('warning');
    expect(review.items.find((item) => item.key === 'prerequisites')?.state).toBe('warning');
    expect(review.items.find((item) => item.key === 'final_backup')?.state).toBe('check');
  });

  it('reconnaît tâches, prérequis et livrables quand ils sont prêts', () => {
    let project = projects.createInternal({ name: 'Projet prêt' });
    project = projects.addProjectNode(project.id, { type: 'task', name: 'Livraison', required: true });
    const task = project.nodes[0];
    projects.updateProjectNode(task.id, { status: 'done' });

    project = projects.addPrerequisite(project.id, { label: 'Accord final', required: true });
    projects.updatePrerequisiteStatus(project.prerequisites[0].id, 'validated');

    const source = join(workspaceRoot, 'livrable.txt');
    writeFileSync(source, 'livrable final', 'utf8');
    resources.importFilePaths(project.id, [source], 'deliverables', 'final_validated');

    const review = completion.review(project.id);

    expect(review.items.find((item) => item.key === 'required_tasks')?.state).toBe('ok');
    expect(review.items.find((item) => item.key === 'prerequisites')?.state).toBe('ok');
    expect(review.items.find((item) => item.key === 'deliverables')?.state).toBe('ok');
    expect(review.canComplete).toBe(true);
  });
});

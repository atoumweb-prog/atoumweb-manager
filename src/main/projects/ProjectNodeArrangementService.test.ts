import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectNodeArrangementService } from './ProjectNodeArrangementService';
import { ProjectService } from './ProjectService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let arrangement: ProjectNodeArrangementService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-tree-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  arrangement = new ProjectNodeArrangementService(database, projects);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ProjectNodeArrangementService', () => {
  it('réordonne les éléments d’un même niveau avec des positions normalisées', () => {
    let project = projects.createInternal({ name: 'Arbre ordre' });
    project = projects.addProjectNode(project.id, { type: 'task', name: 'A' });
    project = projects.addProjectNode(project.id, { type: 'task', name: 'B' });
    project = projects.addProjectNode(project.id, { type: 'task', name: 'C' });
    const nodeC = project.nodes.find((node) => node.name === 'C')!;

    const moved = arrangement.move(nodeC.id, { parentId: null, targetIndex: 0 });
    const root = moved.nodes.filter((node) => !node.parentId).sort((a, b) => a.sortOrder - b.sortOrder);

    expect(root.map((node) => node.name)).toEqual(['C', 'A', 'B']);
    expect(root.map((node) => node.sortOrder)).toEqual([0, 10, 20]);
  });

  it('déplace une tâche sous un module et protège contre les cycles', () => {
    let project = projects.createInternal({ name: 'Arbre parent' });
    project = projects.addProjectNode(project.id, { type: 'module', name: 'Module' });
    const moduleNode = project.nodes.find((node) => node.name === 'Module')!;
    project = projects.addProjectNode(project.id, { type: 'task', name: 'Tâche' });
    const task = project.nodes.find((node) => node.name === 'Tâche')!;

    const nested = arrangement.move(task.id, { parentId: moduleNode.id, targetIndex: 0 });
    expect(nested.nodes.find((node) => node.id === task.id)?.parentId).toBe(moduleNode.id);

    expect(() => arrangement.move(moduleNode.id, { parentId: task.id, targetIndex: 0 }))
      .toThrow(/boucle/i);
  });
});

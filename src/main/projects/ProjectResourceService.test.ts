import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectResourceService } from './ProjectResourceService';
import { ProjectService } from './ProjectService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let resources: ProjectResourceService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-resources-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  const workspace = createWorkspacePaths(workspaceRoot);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ProjectResourceService', () => {
  it('importe une seule copie physique et permet de la rattacher à une tâche', () => {
    const project = projects.createInternal({ name: 'Projet ressources' });
    const withTask = projects.addProjectNode(project.id, { type: 'task', name: 'Intégrer le logo', required: true });
    const task = withTask.nodes[0];
    const source = join(workspaceRoot, 'logo-source.txt');
    writeFileSync(source, 'logo test', 'utf8');

    const imported = resources.importFilePaths(project.id, [source], 'identity', 'client_provided');
    expect(imported).toHaveLength(1);
    expect(imported[0].folder).toBe('identity');
    expect(imported[0].contentRole).toBe('client_provided');
    expect(existsSync(resources.absolutePath(imported[0]))).toBe(true);

    const duplicateAttempt = resources.importFilePaths(project.id, [source], 'identity', 'client_provided');
    expect(duplicateAttempt).toHaveLength(1);

    const linked = resources.linkToNode(imported[0].id, task.id);
    expect(linked.linkedNodeIds).toEqual([task.id]);
  });

  it('détecte un fichier disparu puis le relocalise', () => {
    const project = projects.createInternal({ name: 'Projet fichier manquant' });
    const source = join(workspaceRoot, 'document-source.txt');
    writeFileSync(source, 'version 1', 'utf8');
    const imported = resources.importFilePaths(project.id, [source], 'documents')[0];
    const managedPath = resources.absolutePath(imported);

    rmSync(managedPath, { force: true });
    expect(resources.get(imported.id).missing).toBe(true);

    const replacement = join(workspaceRoot, 'document-remplacement.txt');
    writeFileSync(replacement, 'version 2', 'utf8');
    const relocated = resources.relocalize(imported.id, replacement);

    expect(relocated.missing).toBe(false);
    expect(existsSync(resources.absolutePath(relocated))).toBe(true);
    expect(relocated.fileName).toBe('document-remplacement.txt');
  });

  it('conserve statut et rôle comme métadonnées sans déplacer le fichier', () => {
    const project = projects.createInternal({ name: 'Projet texte' });
    const source = join(workspaceRoot, 'texte.txt');
    writeFileSync(source, 'texte client', 'utf8');
    const imported = resources.importFilePaths(project.id, [source], 'texts', 'client_provided')[0];
    const pathBefore = resources.absolutePath(imported);

    const rewritten = resources.updateRole(imported.id, 'atoumweb_rewrite');
    const validated = resources.updateStatus(imported.id, 'validated');

    expect(rewritten.contentRole).toBe('atoumweb_rewrite');
    expect(validated.status).toBe('validated');
    expect(resources.absolutePath(validated)).toBe(pathBefore);
  });
});

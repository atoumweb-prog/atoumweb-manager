import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectResourceService } from './ProjectResourceService';
import { ProjectSearchService } from './ProjectSearchService';
import { ProjectService } from './ProjectService';
import { ProjectTechnicalLibraryService } from './ProjectTechnicalLibraryService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let resources: ProjectResourceService;
let technical: ProjectTechnicalLibraryService;
let search: ProjectSearchService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-project-search-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  const workspace = createWorkspacePaths(workspaceRoot);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
  technical = new ProjectTechnicalLibraryService(database);
  search = new ProjectSearchService(database);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ProjectSearchService', () => {
  it('retrouve projet, tâche, ressource et élément technique', () => {
    let project = projects.createInternal({ name: 'Projet Cazor de test' });
    project = projects.addProjectNode(project.id, { type: 'task', name: 'Pagination véhicules', required: true });

    const source = join(workspaceRoot, 'export-vehicules.json');
    writeFileSync(source, '{"ok":true}', 'utf8');
    resources.importFilePaths(project.id, [source], 'technical', 'other');

    technical.create(
      project.id,
      { category: 'php', name: 'Snippet logique vendu', tags: ['vehicule', 'vendu'] },
      { contentType: 'code', language: 'php', contentText: '<?php // vendu' },
    );

    expect(search.search('Cazor').some((result) => result.entityId === project.id)).toBe(true);
    expect(search.search('Pagination').some((result) => result.title.includes('Pagination véhicules'))).toBe(true);
    expect(search.search('export-vehicules').some((result) => result.title.includes('Ressource'))).toBe(true);
    expect(search.search('logique vendu').some((result) => result.title.includes('Bibliothèque'))).toBe(true);
  });
});

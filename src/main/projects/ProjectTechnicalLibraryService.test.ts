import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectResourceService } from './ProjectResourceService';
import { ProjectService } from './ProjectService';
import { ProjectTechnicalLibraryService } from './ProjectTechnicalLibraryService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let resources: ProjectResourceService;
let library: ProjectTechnicalLibraryService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-technical-library-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  const workspace = createWorkspacePaths(workspaceRoot);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
  library = new ProjectTechnicalLibraryService(database);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ProjectTechnicalLibraryService', () => {
  it('versionne un élément technique sans réécrire les anciennes versions', () => {
    const project = projects.createInternal({ name: 'Projet bibliothèque' });
    const created = library.create(
      project.id,
      { category: 'css', name: 'Styles accueil', tags: ['Divi', 'Accueil'] },
      { contentType: 'code', language: 'css', contentText: '.hero { min-height: 700px; }' },
    );

    const v2 = library.createVersion(created.id, {
      contentType: 'code',
      language: 'css',
      contentText: '.hero { min-height: 760px; }',
      notes: 'Ajustement desktop',
    });

    expect(v2.versions).toHaveLength(2);
    expect(v2.currentVersion?.versionNumber).toBe(2);
    expect(v2.versions.find((version) => version.versionNumber === 1)?.contentText).toContain('700px');
    expect(v2.versions.find((version) => version.versionNumber === 2)?.contentText).toContain('760px');
  });

  it('conserve une version stable distincte de la version courante', () => {
    const project = projects.createInternal({ name: 'Projet stable' });
    const created = library.create(
      project.id,
      { category: 'php', name: 'Snippet véhicules' },
      { contentType: 'code', language: 'php', contentText: '<?php return true;' },
    );
    const stable = library.markStable(created.currentVersion!.id);
    expect(stable.stableVersion?.versionNumber).toBe(1);

    const changed = library.createVersion(created.id, {
      contentType: 'code',
      language: 'php',
      contentText: '<?php return false;',
    });

    expect(changed.currentVersion?.versionNumber).toBe(2);
    expect(changed.stableVersion?.versionNumber).toBe(1);
  });

  it('lie une ressource réelle à une version technique sans dupliquer le fichier', () => {
    const project = projects.createInternal({ name: 'Projet asset technique' });
    const source = join(workspaceRoot, 'export-divi.json');
    writeFileSync(source, '{"layout":"home"}', 'utf8');
    const resource = resources.importFilePaths(project.id, [source], 'technical')[0];
    const item = library.create(
      project.id,
      { category: 'divi', name: 'Accueil Divi' },
      { contentType: 'reference', language: 'json', notes: 'Export réel du projet' },
    );

    const linked = library.linkResource(item.currentVersion!.id, resource.id);
    expect(linked.currentVersion?.linkedResourceIds).toEqual([resource.id]);

    const unlinked = library.unlinkResource(item.currentVersion!.id, resource.id);
    expect(unlinked.currentVersion?.linkedResourceIds).toEqual([]);
  });

  it('refuse de lier une ressource appartenant à un autre projet', () => {
    const projectA = projects.createInternal({ name: 'Projet A' });
    const projectB = projects.createInternal({ name: 'Projet B' });
    const source = join(workspaceRoot, 'asset.txt');
    writeFileSync(source, 'test', 'utf8');
    const foreignResource = resources.importFilePaths(projectB.id, [source], 'technical')[0];
    const item = library.create(
      projectA.id,
      { category: 'note', name: 'Documentation' },
      { contentType: 'text', contentText: 'Documentation projet A' },
    );

    expect(() => library.linkResource(item.currentVersion!.id, foreignResource.id)).toThrow(/autre projet/i);
  });
});

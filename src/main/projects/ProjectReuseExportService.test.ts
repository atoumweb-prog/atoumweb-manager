import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectResourceService } from './ProjectResourceService';
import { ProjectReuseExportService } from './ProjectReuseExportService';
import { ProjectService } from './ProjectService';
import { ProjectTechnicalLibraryService } from './ProjectTechnicalLibraryService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let resources: ProjectResourceService;
let technical: ProjectTechnicalLibraryService;
let reuse: ProjectReuseExportService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-reuse-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  const workspace = createWorkspacePaths(workspaceRoot);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
  technical = new ProjectTechnicalLibraryService(database);
  reuse = new ProjectReuseExportService(database, workspace);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ProjectReuseExportService', () => {
  it('prépare un paquet JSON sans créer un élément global AtoumWeb', () => {
    const project = projects.createInternal({ name: 'Projet réutilisation' });
    const item = technical.create(
      project.id,
      { category: 'php', name: 'Snippet galerie', tags: ['galerie', 'cazor'] },
      { contentType: 'code', language: 'php', contentText: '<?php echo "galerie";' },
    );
    technical.markStable(item.currentVersion!.id);

    const source = join(workspaceRoot, 'config-galerie.json');
    writeFileSync(source, '{"lightbox":true}', 'utf8');
    const resource = resources.importFilePaths(project.id, [source], 'technical')[0];
    technical.linkResource(item.currentVersion!.id, resource.id);

    const result = reuse.prepare(item.id);

    expect(existsSync(result.path)).toBe(true);
    const payload = JSON.parse(readFileSync(result.path, 'utf8')) as {
      safety: { automaticGeneralization: boolean; automaticGlobalLibraryCreation: boolean };
      technicalItem: { name: string };
      linkedResources: Array<{ fileName: string }>;
    };
    expect(payload.technicalItem.name).toBe('Snippet galerie');
    expect(payload.linkedResources[0]?.fileName).toBe('config-galerie.json');
    expect(payload.safety.automaticGeneralization).toBe(false);
    expect(payload.safety.automaticGlobalLibraryCreation).toBe(false);

    const globalCount = database.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM technical_items WHERE scope='atoumweb'",
    );
    expect(Number(globalCount?.total ?? 0)).toBe(0);

    const exportedResource = resources.get(result.resourceId);
    expect(exportedResource.folder).toBe('technical');
    expect(exportedResource.fileName.endsWith('.json')).toBe(true);
  });
});

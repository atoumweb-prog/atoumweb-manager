import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
  it('ne laisse aucun fichier orphelin si SQLite rejette l export', () => {
    const project = projects.createInternal({ name: 'Projet export transactionnel' });
    const item = technical.create(
      project.id,
      { category: 'php', name: 'Snippet panne simulée' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "test";' },
    );
    const row = database.get<{ resource_root_path: string | null }>(
      'SELECT resource_root_path FROM projects WHERE id=?', [project.id],
    );
    const directory = join(row!.resource_root_path!, '05 Technique - Sources - Exports');
    const previousFiles = existsSync(directory) ? readdirSync(directory) : [];
    const assetsBefore = Number(database.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM file_assets WHERE project_id=?', [project.id],
    )?.total ?? 0);
    database.exec(
      "CREATE TRIGGER ux07e_abort_export BEFORE INSERT ON file_assets " +
      "BEGIN SELECT RAISE(ABORT, 'UX07E_SIMULATED_SQLITE_FAILURE'); END;",
    );

    expect(() => reuse.prepare(item.id)).toThrow('UX07E_SIMULATED_SQLITE_FAILURE');
    expect(readdirSync(directory)).toEqual(previousFiles);
    expect(Number(database.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM file_assets WHERE project_id=?', [project.id],
    )?.total ?? 0)).toBe(assetsBefore);
    expect(database.get<{ integrity_check: string }>('PRAGMA integrity_check')?.integrity_check).toBe('ok');
    expect(database.all('PRAGMA foreign_key_check')).toHaveLength(0);
  });

  it('échec du journal après création de ressource : rollback atomique et aucun ZIP/JSON orphelin', () => {
    const project = projects.createInternal({ name: 'Projet activité refusée' });
    const item = technical.create(
      project.id,
      { category: 'php', name: 'Composant activité' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "stable";' },
    );
    const row = database.get<{ resource_root_path: string | null }>(
      'SELECT resource_root_path FROM projects WHERE id=?', [project.id],
    );
    const directory = join(row!.resource_root_path!, '05 Technique - Sources - Exports');
    const before = existsSync(directory) ? readdirSync(directory) : [];
    const assetsBefore = Number(database.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM file_assets WHERE project_id=?', [project.id],
    )?.total ?? 0);
    database.exec(
      "CREATE TRIGGER ux07e_abort_activity BEFORE INSERT ON activity_log " +
      "WHEN NEW.action='technical_reuse_exported' " +
      "BEGIN SELECT RAISE(ABORT, 'UX07E_ACTIVITY_FAILURE'); END;",
    );
    expect(() => reuse.prepare(item.id)).toThrow('UX07E_ACTIVITY_FAILURE');
    expect(readdirSync(directory)).toEqual(before);
    expect(Number(database.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM file_assets WHERE project_id=?', [project.id],
    )?.total ?? 0)).toBe(assetsBefore);
    expect(database.all('PRAGMA foreign_key_check')).toHaveLength(0);
    expect(database.get<{ integrity_check: string }>('PRAGMA integrity_check')?.integrity_check).toBe('ok');
  });

  it('un échec BEGIN conserve la transaction du demandeur et ne laisse aucun fichier', () => {
    const project = projects.createInternal({ name: 'Projet transaction déjà ouverte' });
    const item = technical.create(
      project.id,
      { category: 'php', name: 'Export sous verrou' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "safe";' },
    );
    const row = database.get<{ resource_root_path: string | null }>(
      'SELECT resource_root_path FROM projects WHERE id=?', [project.id],
    );
    const directory = join(row!.resource_root_path!, '05 Technique - Sources - Exports');
    const filesBefore = existsSync(directory) ? readdirSync(directory) : [];

    database.exec('BEGIN IMMEDIATE;');
    expect(() => reuse.prepare(item.id)).toThrow(/transaction/i);
    // A failed nested BEGIN must not roll back the caller's transaction.
    database.exec('ROLLBACK;');
    expect(readdirSync(directory)).toEqual(filesBefore);
    expect(database.get<{ integrity_check: string }>('PRAGMA integrity_check')?.integrity_check).toBe('ok');
  });

  it('deux exports rapides ne réécrivent pas le même fichier', () => {
    const project = projects.createInternal({ name: 'Projet export simultané' });
    const item = technical.create(
      project.id,
      { category: 'php', name: 'Version conservée' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "v1";' },
    );
    const first = reuse.prepare(item.id);
    const firstBytes = readFileSync(first.path, 'utf8');
    const second = reuse.prepare(item.id);
    expect(second.path).not.toBe(first.path);
    expect(existsSync(first.path)).toBe(true);
    expect(existsSync(second.path)).toBe(true);
    expect(readFileSync(first.path, 'utf8')).toBe(firstBytes);
    expect(second.versionId).toBe(first.versionId);
  });

});

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectResourceService } from '../projects/ProjectResourceService';
import { ProjectService } from '../projects/ProjectService';
import { ProjectTechnicalLibraryService } from '../projects/ProjectTechnicalLibraryService';
import { createWorkspacePaths, type WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { ReusePreparationService } from './ReusePreparationService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let workspace: WorkspacePaths;
let projects: ProjectService;
let resources: ProjectResourceService;
let projectLibrary: ProjectTechnicalLibraryService;
let globalLibrary: AtoumWebTechnicalLibraryService;
let globalAssets: AtoumWebTechnicalAssetService;
let reuse: ReusePreparationService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-assisted-reuse-'));
  workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
  projectLibrary = new ProjectTechnicalLibraryService(database);
  globalLibrary = new AtoumWebTechnicalLibraryService(database);
  globalAssets = new AtoumWebTechnicalAssetService(database, workspace);
  reuse = new ReusePreparationService(database, workspace, globalLibrary, globalAssets);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ReusePreparationService', () => {
  it('prépare le cas Cazor en paquet indépendant puis crée volontairement une Galerie dynamique ACF', () => {
    const project = projects.createInternal({ name: 'Cazor Auto Passion', projectType: 'site-vitrine' });
    const sourceItem = projectLibrary.create(
      project.id,
      {
        category: 'php',
        name: 'Galerie véhicules Cazor',
        description: 'Galerie spécifique aux véhicules Cazor',
        tags: ['cazor', 'acf', 'galerie'],
      },
      {
        contentType: 'code',
        language: 'php',
        contentText: '<?php $gallery = get_field("galerie_cazor"); echo "#d4af37";',
        notes: 'Version client avec champ et couleur Cazor',
      },
    );
    projectLibrary.markStable(sourceItem.currentVersion!.id);

    const sourceFile = join(workspaceRoot, 'export-divi-cazor.json');
    writeFileSync(sourceFile, '{"module":"gallery","client":"cazor"}', 'utf8');
    const resource = resources.importFilePaths(project.id, [sourceFile], 'technical')[0];
    projectLibrary.linkResource(sourceItem.currentVersion!.id, resource.id);

    const preparation = reuse.prepareProjectItem({
      itemId: sourceItem.id,
      versionId: sourceItem.currentVersion!.id,
      adaptationNotes: 'Remplacer galerie_cazor par un champ configurable et retirer la couleur Cazor.',
    });

    expect(preparation.packageDirectory).toContain(join('exports', 'reutilisation'));
    expect(preparation.packageDirectory).not.toContain('projets-internes');
    expect(existsSync(preparation.manifestPath)).toBe(true);
    expect(existsSync(preparation.adaptationNotesPath)).toBe(true);
    expect(preparation.contentPath && existsSync(preparation.contentPath)).toBe(true);
    expect(preparation.copiedFiles).toHaveLength(1);
    expect(preparation.copiedFiles[0].copied).toBe(true);
    expect(preparation.copiedFiles[0].packageRelativePath).toContain('sources');

    const manifest = JSON.parse(readFileSync(preparation.manifestPath, 'utf8')) as {
      safety: {
        automaticGeneralization: boolean;
        automaticGlobalLibraryCreation: boolean;
        automaticCodeExecution: boolean;
        sourceProjectModified: boolean;
      };
      technicalItem: { name: string };
      adaptation: { initialNotes: string | null };
    };
    expect(manifest.technicalItem.name).toBe('Galerie véhicules Cazor');
    expect(manifest.safety.automaticGeneralization).toBe(false);
    expect(manifest.safety.automaticGlobalLibraryCreation).toBe(false);
    expect(manifest.safety.automaticCodeExecution).toBe(false);
    expect(manifest.safety.sourceProjectModified).toBe(false);
    expect(manifest.adaptation.initialNotes).toContain('champ configurable');

    const globalCountBefore = database.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM technical_items WHERE scope='atoumweb'",
    );
    expect(Number(globalCountBefore?.total ?? 0)).toBe(0);

    const created = reuse.createGlobal({
      preparation,
      item: {
        category: 'gallery',
        name: 'Galerie dynamique ACF',
        description: 'Galerie générique configurable par champ ACF',
        tags: ['acf', 'galerie', 'wordpress'],
        reuseStatus: 'ready',
      },
      version: {
        contentType: 'code',
        language: 'php',
        contentText: '<?php $gallery = get_field($field_name); ?>',
        notes: 'Version généralisée après adaptation manuelle du cas Cazor',
      },
    });

    expect(created.originTechnicalItemId).toBe(sourceItem.id);
    expect(created.name).toBe('Galerie dynamique ACF');
    expect(created.currentVersion?.contentText).toContain('$field_name');
    expect(globalAssets.list(created.currentVersion!.id).length).toBeGreaterThanOrEqual(3);

    const sourceAfter = projectLibrary.get(sourceItem.id);
    expect(sourceAfter.currentVersion?.contentText).toContain('galerie_cazor');
    expect(sourceAfter.versions).toHaveLength(1);
  });

  it('utilise la version stable par défaut et signale une ressource projet manquante sans bloquer le paquet', () => {
    const project = projects.createInternal({ name: 'Projet test réutilisation' });
    const item = projectLibrary.create(
      project.id,
      { category: 'css', name: 'Hero client' },
      { contentType: 'code', language: 'css', contentText: '.hero { color: gold; }' },
    );
    const stabilized = projectLibrary.markStable(item.currentVersion!.id);
    const stableVersion = stabilized.stableVersion!;
    const changed = projectLibrary.createVersion(item.id, {
      contentType: 'code',
      language: 'css',
      contentText: '.hero { color: navy; }',
    });

    const sourceFile = join(workspaceRoot, 'capture-hero.png');
    writeFileSync(sourceFile, 'fake-image', 'utf8');
    const resource = resources.importFilePaths(project.id, [sourceFile], 'media')[0];
    projectLibrary.linkResource(stableVersion.id, resource.id);
    rmSync(resources.absolutePath(resource), { force: true });

    const preparation = reuse.prepareProjectItem({ itemId: item.id });

    expect(preparation.versionNumber).toBe(1);
    expect(preparation.versionId).toBe(stableVersion.id);
    expect(preparation.versionId).not.toBe(changed.currentVersion!.id);
    expect(preparation.copiedFiles[0].missing).toBe(true);
    expect(preparation.copiedFiles[0].copied).toBe(false);
    expect(existsSync(preparation.manifestPath)).toBe(true);
  });

  it('refuse les chemins de paquet ou fichiers préparés hors exports/reutilisation', () => {
    expect(() => reuse.assertPackagePath(workspace.clientsDirectory)).toThrow(/paquet de réutilisation/i);

    const project = projects.createInternal({ name: 'Projet sécurité paquet' });
    const item = projectLibrary.create(
      project.id,
      { category: 'note', name: 'Note source' },
      { contentType: 'text', contentText: 'Contenu client' },
    );
    const preparation = reuse.prepareProjectItem({ itemId: item.id });
    const outsidePath = join(workspace.clientsDirectory, 'faux-manifest.json');
    writeFileSync(outsidePath, '{}', 'utf8');

    expect(() => reuse.createGlobal({
      preparation: { ...preparation, manifestPath: outsidePath },
      item: { category: 'note', name: 'Note globale', reuseStatus: 'reference' },
      version: { contentType: 'text', contentText: 'Note globale' },
    })).toThrow(/en dehors du dossier/i);
  });
});

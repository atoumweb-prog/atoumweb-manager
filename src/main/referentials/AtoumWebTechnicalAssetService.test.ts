import { existsSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { ProjectTechnicalLibraryService } from '../projects/ProjectTechnicalLibraryService';
import { createWorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let projectLibrary: ProjectTechnicalLibraryService;
let library: AtoumWebTechnicalLibraryService;
let assets: AtoumWebTechnicalAssetService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-global-assets-'));
  const workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, workspace);
  projectLibrary = new ProjectTechnicalLibraryService(database);
  library = new AtoumWebTechnicalLibraryService(database);
  assets = new AtoumWebTechnicalAssetService(database, workspace);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('AtoumWebTechnicalAssetService', () => {
  it('copie les captures dans la Bibliothèque AtoumWeb et jamais dans un dossier client', () => {
    const item = library.create(
      { category: 'gallery', name: 'Galerie générique', reuseStatus: 'ready' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "gallery";' },
    );
    const source = join(workspaceRoot, 'capture.png');
    writeFileSync(source, 'fake-image', 'utf8');

    const imported = assets.importFilePaths(item.currentVersion!.id, [source], 'screenshot');

    expect(imported).toHaveLength(1);
    expect(imported[0].relativePath).toContain('bibliotheque-atoumweb');
    expect(imported[0].relativePath).not.toContain('clients');
    expect(existsSync(assets.absolutePath(imported[0]))).toBe(true);
  });

  it('évite un doublon évident par checksum dans une même version', () => {
    const item = library.create(
      { category: 'divi', name: 'Header global', reuseStatus: 'adapt' },
      { contentType: 'json', language: 'json', contentText: '{"header":true}' },
    );
    const source = join(workspaceRoot, 'header.json');
    writeFileSync(source, '{"header":true}', 'utf8');

    assets.importFilePaths(item.currentVersion!.id, [source], 'source');
    const importedAgain = assets.importFilePaths(item.currentVersion!.id, [source], 'source');

    expect(importedAgain).toHaveLength(1);
  });

  it('refuse de rattacher un fichier global à une version de Bibliothèque projet', () => {
    const project = projects.createInternal({ name: 'Projet client source' });
    const projectItem = projectLibrary.create(
      project.id,
      { category: 'css', name: 'CSS client' },
      { contentType: 'code', language: 'css', contentText: '.client { color: red; }' },
    );
    const source = join(workspaceRoot, 'client.css');
    writeFileSync(source, '.client { color: red; }', 'utf8');

    expect(() => assets.importFilePaths(projectItem.currentVersion!.id, [source], 'source')).toThrow(/Bibliothèque AtoumWeb/i);
  });

  it('signale un fichier manquant sans perdre sa métadonnée', () => {
    const item = library.create(
      { category: 'app', name: 'Composant application', reuseStatus: 'reference' },
      { contentType: 'text', contentText: 'Référence application' },
    );
    const source = join(workspaceRoot, 'note.txt');
    writeFileSync(source, 'référence', 'utf8');
    const imported = assets.importFilePaths(item.currentVersion!.id, [source], 'attachment');
    unlinkSync(assets.absolutePath(imported[0]));

    const afterDeletion = assets.list(item.currentVersion!.id);
    expect(afterDeletion).toHaveLength(1);
    expect(afterDeletion[0].missing).toBe(true);
  });

  it('renvoie un data URL uniquement pour une capture raster autorisée', () => {
    const item = library.create(
      { category: 'hero', name: 'Hero visuel', reuseStatus: 'ready' },
      { contentType: 'text', contentText: 'Hero de référence' },
    );
    const source = join(workspaceRoot, 'hero.png');
    writeFileSync(source, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]), 'binary');
    const imported = assets.importFilePaths(item.currentVersion!.id, [source], 'screenshot');

    const preview = assets.preview(imported[0].id);

    expect(preview.available).toBe(true);
    expect(preview.mimeType).toBe('image/png');
    expect(preview.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('ne prévisualise pas directement une source, même si son extension est une image', () => {
    const item = library.create(
      { category: 'divi', name: 'Export visuel', reuseStatus: 'adapt' },
      { contentType: 'json', contentText: '{"module":true}' },
    );
    const source = join(workspaceRoot, 'source.png');
    writeFileSync(source, 'fake-image', 'utf8');
    const imported = assets.importFilePaths(item.currentVersion!.id, [source], 'source');

    const preview = assets.preview(imported[0].id);

    expect(preview.available).toBe(false);
    expect(preview.error).toMatch(/captures|aperçus/i);
  });

  it('ne prévisualise pas directement les SVG', () => {
    const item = library.create(
      { category: 'section', name: 'Section SVG', reuseStatus: 'reference' },
      { contentType: 'text', contentText: 'Référence' },
    );
    const source = join(workspaceRoot, 'capture.svg');
    writeFileSync(source, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'utf8');
    const imported = assets.importFilePaths(item.currentVersion!.id, [source], 'screenshot');

    const preview = assets.preview(imported[0].id);

    expect(preview.available).toBe(false);
    expect(preview.error).toMatch(/sécurité/i);
  });
});

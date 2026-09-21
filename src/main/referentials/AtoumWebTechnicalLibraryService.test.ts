import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { ProjectTechnicalLibraryService } from '../projects/ProjectTechnicalLibraryService';
import { createWorkspacePaths } from '../workspace';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let projects: ProjectService;
let projectLibrary: ProjectTechnicalLibraryService;
let library: AtoumWebTechnicalLibraryService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-global-library-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  projectLibrary = new ProjectTechnicalLibraryService(database);
  library = new AtoumWebTechnicalLibraryService(database);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('AtoumWebTechnicalLibraryService', () => {
  it('crée et versionne un composant global sans modifier le composant projet d’origine', () => {
    const project = projects.createInternal({ name: 'Projet source' });
    const source = projectLibrary.create(
      project.id,
      { category: 'php', name: 'Galerie véhicules Cazor' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "cazor";' },
    );

    const globalItem = library.create(
      {
        category: 'php',
        name: 'Galerie dynamique ACF',
        reuseStatus: 'adapt',
        tags: ['ACF', 'galerie'],
        originTechnicalItemId: source.id,
      },
      { contentType: 'code', language: 'php', contentText: '<?php echo "generic";' },
    );

    const changed = library.createVersion(globalItem.id, {
      contentType: 'code',
      language: 'php',
      contentText: '<?php echo "generic-v2";',
    });

    expect(changed.currentVersion?.versionNumber).toBe(2);
    expect(changed.originTechnicalItemId).toBe(source.id);
    expect(projectLibrary.get(source.id).versions).toHaveLength(1);
    expect(projectLibrary.get(source.id).currentVersion?.contentText).toContain('cazor');
  });

  it('conserve une version stable distincte de la version courante', () => {
    const item = library.create(
      { category: 'css', name: 'Hero AtoumWeb', reuseStatus: 'ready' },
      { contentType: 'code', language: 'css', contentText: '.hero { min-height: 700px; }' },
    );
    const stable = library.markStable(item.currentVersion!.id);
    expect(stable.stableVersion?.versionNumber).toBe(1);

    const changed = library.createVersion(item.id, {
      contentType: 'code',
      language: 'css',
      contentText: '.hero { min-height: 760px; }',
    });
    expect(changed.currentVersion?.versionNumber).toBe(2);
    expect(changed.stableVersion?.versionNumber).toBe(1);
  });

  it('filtre par statut et réactive un composant archivé', () => {
    const ready = library.create(
      { category: 'divi', name: 'Header principal', reuseStatus: 'ready' },
      { contentType: 'json', language: 'json', contentText: '{"header":true}' },
    );
    library.create(
      { category: 'note', name: 'Référence technique', reuseStatus: 'reference' },
      { contentType: 'text', contentText: 'Exemple uniquement' },
    );

    expect(library.list({ reuseStatus: 'ready' }).map((item) => item.id)).toEqual([ready.id]);

    library.archive(ready.id);
    expect(library.list({ reuseStatus: 'ready' })).toHaveLength(0);
    expect(library.list({ reuseStatus: 'ready', includeArchived: true })).toHaveLength(1);

    const reactivated = library.reactivate(ready.id);
    expect(reactivated.archivedAt).toBeNull();
  });

  it('refuse une origine globale pour préserver la notion d’origine projet', () => {
    const first = library.create(
      { category: 'note', name: 'Composant global', reuseStatus: 'reference' },
      { contentType: 'text', contentText: 'Global' },
    );

    expect(() => library.create(
      {
        category: 'note',
        name: 'Mauvaise origine',
        reuseStatus: 'adapt',
        originTechnicalItemId: first.id,
      },
      { contentType: 'text', contentText: 'Test' },
    )).toThrow(/Bibliothèque projet/i);
  });

  it('indexe nom, tags, notes et contenu dans la recherche générale', () => {
    const item = library.create(
      {
        category: 'carousel',
        name: 'Carrousel véhicules générique',
        description: 'Composant réutilisable',
        reuseStatus: 'ready',
        tags: ['automobile', 'slider'],
      },
      {
        contentType: 'code',
        language: 'javascript',
        contentText: 'const rotationAutomatique = true;',
        notes: 'Boucle continue',
      },
    );

    const indexed = database.get<{ search_text: string }>(
      "SELECT search_text FROM search_documents WHERE entity_type='atoumweb_library' AND entity_id=?",
      [item.id],
    );
    expect(indexed?.search_text).toContain('automobile');
    expect(indexed?.search_text).toContain('boucle continue');
    expect(indexed?.search_text).toContain('rotationautomatique');

    library.archive(item.id);
    expect(database.get("SELECT id FROM search_documents WHERE entity_type='atoumweb_library' AND entity_id=?", [item.id])).toBeUndefined();

    library.reactivate(item.id);
    expect(database.get("SELECT id FROM search_documents WHERE entity_type='atoumweb_library' AND entity_id=?", [item.id])).toBeTruthy();
  });
});

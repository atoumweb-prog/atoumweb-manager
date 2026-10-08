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

  it('classe par métier et filtre la Bibliothèque sans confondre métier et tags', () => {
    const florist = library.create(
      {
        category: 'section',
        name: 'Section bulles Fleuriste',
        reuseStatus: 'ready',
        vertical: 'Fleuriste',
        tags: ['services', 'présentation'],
      },
      { contentType: 'code', language: 'html', contentText: '<section>Fleurs</section>' },
    );
    library.create(
      {
        category: 'section',
        name: 'Section bulles Automobile',
        reuseStatus: 'ready',
        vertical: 'automobile',
        tags: ['services'],
      },
      { contentType: 'code', language: 'html', contentText: '<section>Auto</section>' },
    );

    expect(library.get(florist.id).vertical).toBe('fleuriste');
    expect(library.list({ vertical: 'fleur' }).map((item) => item.id)).toEqual([florist.id]);
  });

  it('accepte la catégorie Code snippets avec le langage porté par la version', () => {
    const snippet = library.create(
      {
        category: 'code_snippet',
        name: 'Masquer un élément au scroll',
        reuseStatus: 'ready',
        tags: ['scroll', 'ui'],
      },
      {
        contentType: 'code',
        language: 'javascript',
        contentText: 'window.addEventListener("scroll", () => {});',
      },
    );

    expect(snippet.category).toBe('code_snippet');
    expect(snippet.currentVersion?.language).toBe('javascript');
    expect(library.list({ category: 'code_snippet' }).map((item) => item.id)).toEqual([snippet.id]);
  });

  it('expose et recherche les métadonnées Famille / Variante', () => {
    const item = library.create(
      {
        category: 'section',
        name: 'Section mariage premium',
        reuseStatus: 'ready',
        vertical: 'mariage',
        tags: ['bridge'],
      },
      { contentType: 'json', language: 'json', contentText: '{"kind":"atoumweb-library-reusable-component"}' },
    );
    const now = '2026-09-26T06:00:00.000Z';
    database.run(
      `INSERT INTO atoumweb_component_families
       (id,component_key,display_name,category,vertical,reusability_scope,base_item_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      ['awfam:library-test', 'aw-section-mariage-premium', 'Famille Mariage Premium', 'section', 'mariage', 'vertical', item.id, now, now],
    );
    database.run(
      `INSERT INTO atoumweb_component_variants
       (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
       VALUES (?,?,?,?,?,'base',NULL,NULL,?,?)`,
      ['awvar:library-test-base', 'awfam:library-test', item.id, 'base', 'Base', now, now],
    );

    const detailed = library.get(item.id);
    expect(detailed).toMatchObject({
      componentFamilyId: 'awfam:library-test',
      componentKey: 'aw-section-mariage-premium',
      familyDisplayName: 'Famille Mariage Premium',
      libraryVariantId: 'awvar:library-test-base',
      variantKey: 'base',
      variantMode: 'base',
      reusabilityScope: 'vertical',
    });
    expect(library.list({ search: 'famille mariage premium' }).map((candidate) => candidate.id)).toContain(item.id);
    expect(library.list({ search: 'aw-section-mariage-premium' }).map((candidate) => candidate.id)).toContain(item.id);

    library.rebuildSearchIndex();
    const indexed = database.get<{ search_text: string }>(
      "SELECT search_text FROM search_documents WHERE entity_type='atoumweb_library' AND entity_id=?",
      [item.id],
    );
    expect(indexed?.search_text).toContain('aw-section-mariage-premium');
  });

  it('crée directement un composant réutilisable stable avec identité Famille / Variante', () => {
    const created = library.createReusableCode({
      category: 'hero',
      name: 'Hero Fleuriste',
      vertical: 'fleuriste',
      html: '<section class="hero-fleuriste"><h1>Fleuriste</h1></section>',
      css: '.hero-fleuriste{padding:80px 24px}',
      javascript: '',
    });

    expect(created.reuseStatus).toBe('ready');
    expect(created.stableVersion?.id).toBe(created.currentVersion?.id);
    expect(created.componentFamilyId).toBeTruthy();
    expect(created.variantKey).toBe('base');
    expect(created.variantMode).toBe('base');
    expect(created.tags).toEqual(expect.arrayContaining(['manager-direct', 'bridge-human-validated']));
    expect(created.currentVersion?.contentText).toContain('atoumweb-library-reusable-component');
    expect(created.currentVersion?.contentText).toContain('hero-fleuriste');
  });

  it('crée une déclinaison complète sans écraser le modèle source', () => {
    const source = library.createReusableCode({
      category: 'hero',
      name: 'Hero générique',
      html: '<section class="hero-base">Base</section>',
      css: '.hero-base{padding:60px}',
    });

    const variant = library.createVariantCode({
      sourceItemId: source.id,
      name: 'Fleuriste',
      variantKey: 'fleuriste',
      vertical: 'fleuriste',
      html: '<section class="hero-fleuriste">Fleurs</section>',
      css: '.hero-fleuriste{padding:90px}',
    });

    const reloadedSource = library.get(source.id);
    expect(variant.id).not.toBe(source.id);
    expect(variant.componentFamilyId).toBe(source.componentFamilyId);
    expect(variant.variantKey).toBe('fleuriste');
    expect(variant.variantMode).toBe('forked');
    expect(variant.variantOfId).toBe(source.libraryVariantId);
    expect(reloadedSource.currentVersion?.contentText).toContain('hero-base');
    expect(variant.currentVersion?.contentText).toContain('hero-fleuriste');
  });

  it('crée une variante à valider sans la marquer stable lorsqu’elle vient d’une adaptation locale', () => {
    const source = library.createReusableCode({
      category: 'section',
      name: 'Section modèle',
      html: '<section>Source</section>',
      css: '.source{color:#111111}',
    });

    const variant = library.createVariantCode({
      sourceItemId: source.id,
      name: 'Variante locale',
      html: '<section>Adaptée</section>',
      css: '.source{color:#445566}',
      reuseStatus: 'adapt',
      markStable: false,
      provenanceNote: 'Promue depuis une occurrence locale de Page.',
      tags: ['composition-promotion'],
    });

    expect(variant.reuseStatus).toBe('adapt');
    expect(variant.currentVersion).not.toBeNull();
    expect(variant.stableVersion).toBeNull();
    expect(variant.tags).toEqual(expect.arrayContaining(['composition-promotion', 'manager-variant-to-review']));
    expect(variant.tags).not.toContain('bridge-human-validated');
    expect(variant.currentVersion?.notes).toContain('occurrence locale');
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

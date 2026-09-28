import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { AtoumWebCompositionService } from './AtoumWebCompositionService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';

let database: NodeSqliteAdapter;
let library: AtoumWebTechnicalLibraryService;
let compositions: AtoumWebCompositionService;
let projects: ProjectService;
let workspaceRoot: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  library = new AtoumWebTechnicalLibraryService(database);
  compositions = new AtoumWebCompositionService(database, library);
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-page-compositions-'));
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('AtoumWebCompositionService', () => {
  it('crée et retrouve une composition partielle liée à une Page du Projet', () => {
    const project = projects.createInternal({ name: 'Projet Fleuriste', projectType: 'website' });
    const detail = projects.addProjectNode(project.id, { type: 'module', displaySubtype: 'page', name: 'Accueil' });
    const page = detail.nodes.find((node) => node.displaySubtype === 'page')!;

    expect(compositions.getForProjectPage(page.id)).toBeNull();
    const created = compositions.ensureForProjectPage(page.id);
    expect(created.name).toContain('Accueil');
    expect(compositions.getForProjectPage(page.id)?.id).toBe(created.id);
    expect(compositions.ensureForProjectPage(page.id).id).toBe(created.id);
  });

  it('rattache une composition historique sans la dupliquer et interdit son partage entre deux Pages', () => {
    const project = projects.createInternal({ name: 'Projet historique', projectType: 'website' });
    let detail = projects.addProjectNode(project.id, { type: 'module', displaySubtype: 'page', name: 'Accueil' });
    detail = projects.addProjectNode(project.id, { type: 'module', displaySubtype: 'page', name: 'Contact' });
    const [home, contact] = detail.nodes.filter((node) => node.displaySubtype === 'page');
    const composition = compositions.create({ name: 'Composition historique' });

    expect(compositions.attachToProjectPage(home.id, composition.id).id).toBe(composition.id);
    expect(() => compositions.attachToProjectPage(contact.id, composition.id)).toThrow(/autre Page/i);
    compositions.detachFromProjectPage(home.id);
    expect(compositions.getForProjectPage(home.id)).toBeNull();
    expect(compositions.attachToProjectPage(contact.id, composition.id).id).toBe(composition.id);
  });

  it('refuse de rattacher une composition à un nœud qui n’est pas une Page', () => {
    const project = projects.createInternal({ name: 'Projet contrôle', projectType: 'website' });
    const detail = projects.addProjectNode(project.id, { type: 'task', name: 'Tâche' });
    const task = detail.nodes.find((node) => node.type === 'task')!;
    const composition = compositions.create({ name: 'Composition' });

    expect(() => compositions.attachToProjectPage(task.id, composition.id)).toThrow(/type Page/i);
  });

  it('accepte immédiatement un composant créé volontairement depuis une Page', () => {
    const direct = library.createReusableCode({
      category: 'hero',
      name: 'Hero direct',
      html: '<section class="hero-direct">Hero</section>',
      css: '.hero-direct{padding:80px}',
    });
    const composition = compositions.create({ name: 'Accueil' });
    const result = compositions.addItem(composition.id, { libraryItemId: direct.id });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      sourceItemId: direct.id,
      sourceVersionId: direct.stableVersion?.id,
      variantKey: 'base',
      variantMode: 'base',
    });
  });

  it('compose plusieurs composants sans modifier les sources de Bibliothèque', () => {
    const header = library.create(
      { category: 'header', name: 'Header A', reuseStatus: 'ready', vertical: 'fleuriste' },
      { contentType: 'code', language: 'html', contentText: '<header>A</header>' },
    );
    library.markStable(header.currentVersion!.id);

    const hero = library.create(
      { category: 'hero', name: 'Hero B', reuseStatus: 'ready', vertical: 'fleuriste' },
      { contentType: 'code', language: 'html', contentText: '<section>B</section>' },
    );
    library.markStable(hero.currentVersion!.id);

    const composition = compositions.create({ name: 'Site Fleuriste', targetVertical: 'Fleuriste' });
    const withHeader = compositions.addItem(composition.id, { libraryItemId: header.id });
    const withHero = compositions.addItem(composition.id, { libraryItemId: hero.id });

    expect(withHeader.items).toHaveLength(1);
    expect(withHero.items.map((item) => item.displayName)).toEqual(['Header A', 'Hero B']);
    expect(withHero.items[0]).toMatchObject({
      sourceItemId: header.id,
      sourceVersionNumber: 1,
      category: 'header',
      vertical: 'fleuriste',
    });

    library.updateMetadata(header.id, { name: 'Header A renommé' });
    library.createVersion(header.id, { contentType: 'code', language: 'html', contentText: '<header>A v2</header>' });

    const persisted = compositions.get(composition.id);
    expect(persisted.items[0].displayName).toBe('Header A');
    expect(persisted.items[0].sourceVersionNumber).toBe(1);
    expect(library.get(header.id).currentVersion?.versionNumber).toBe(2);
  });

  it('conserve les réglages locaux sur une occurrence sans modifier la source Bibliothèque', () => {
    const source = library.createReusableCode({
      category: 'section',
      name: 'Section offres',
      html: '<section><h2>Titre source</h2></section>',
      css: '.section{color:#112233}',
    });
    const composition = compositions.create({ name: 'Accueil' });
    const withItem = compositions.addItem(composition.id, { libraryItemId: source.id });
    const item = withItem.items[0];

    const updated = compositions.updateItemLocalCode(composition.id, item.id, {
      html: '<section><h2>Titre client</h2></section>',
      css: '.section{color:#445566}',
      javascript: '',
      settings: {
        textEdits: [{ from: 'Titre source', to: 'Titre client' }],
        colorEdits: [{ from: '#112233', to: '#445566' }],
        note: 'Préparation Accueil',
      },
    });

    expect(updated.items[0]).toMatchObject({
      hasLocalChanges: true,
      localHtml: '<section><h2>Titre client</h2></section>',
      localCss: '.section{color:#445566}',
    });
    expect(updated.items[0].localSettings.textEdits).toEqual([{ from: 'Titre source', to: 'Titre client' }]);
    expect(library.get(source.id).currentVersion?.contentText).toContain('Titre source');
    expect(library.get(source.id).currentVersion?.contentText).not.toContain('Titre client');

    const reset = compositions.resetItemLocalCode(composition.id, item.id);
    expect(reset.items[0].hasLocalChanges).toBe(false);
    expect(reset.items[0].localHtml).toBeNull();
  });

  it('promeut une adaptation locale en variante à valider sans toucher au modèle source', () => {
    const source = library.createReusableCode({
      category: 'hero',
      name: 'Hero source',
      html: '<section>Source</section>',
      css: '.hero{color:#111111}',
    });
    const composition = compositions.create({ name: 'Accueil fleuriste' });
    let result = compositions.addItem(composition.id, { libraryItemId: source.id });
    const item = result.items[0];

    result = compositions.updateItemLocalCode(composition.id, item.id, {
      html: '<section>Fleuriste</section>',
      css: '.hero{color:#778866}',
      javascript: '',
    });

    const promoted = compositions.promoteItemVariant(composition.id, item.id, {
      name: 'Fleuriste pastel',
    });

    expect(promoted.id).not.toBe(source.id);
    expect(promoted.reuseStatus).toBe('adapt');
    expect(promoted.stableVersion).toBeNull();
    expect(promoted.variantMode).toBe('forked');
    expect(promoted.variantOfId).toBe(source.libraryVariantId);
    expect(promoted.currentVersion?.contentText).toContain('Fleuriste');
    expect(promoted.tags).toEqual(expect.arrayContaining(['manager-variant-to-review', 'composition-promotion']));
    expect(promoted.tags).not.toContain('bridge-human-validated');
    expect(library.get(source.id).currentVersion?.contentText).toContain('Source');
  });

  it('réordonne et retire des occurrences de composition indépendamment des sources', () => {
    const items = ['Header', 'Hero', 'Footer'].map((name, index) => {
      const item = library.create(
        { category: index === 0 ? 'header' : index === 1 ? 'hero' : 'footer', name, reuseStatus: 'ready' },
        { contentType: 'code', language: 'html', contentText: `<div>${name}</div>` },
      );
      library.markStable(item.currentVersion!.id);
      return item;
    });

    let composition = compositions.create({ name: 'Composition test' });
    for (const item of items) composition = compositions.addItem(composition.id, { libraryItemId: item.id });

    composition = compositions.moveItem(composition.id, composition.items[2].id, { targetIndex: 0 });
    expect(composition.items.map((item) => item.displayName)).toEqual(['Footer', 'Header', 'Hero']);
    expect(composition.items.map((item) => item.sortOrder)).toEqual([0, 1, 2]);

    composition = compositions.removeItem(composition.id, composition.items[1].id);
    expect(composition.items.map((item) => item.displayName)).toEqual(['Footer', 'Hero']);
    expect(composition.items.map((item) => item.sortOrder)).toEqual([0, 1]);
    expect(library.list()).toHaveLength(3);
  });

  it('refuse un composant non prêt et conserve une version explicitement choisie', () => {
    const adaptable = library.create(
      { category: 'section', name: 'Section à adapter', reuseStatus: 'adapt' },
      { contentType: 'code', language: 'html', contentText: '<section>adapt</section>' },
    );
    const composition = compositions.create({ name: 'Site test' });

    expect(() => compositions.addItem(composition.id, { libraryItemId: adaptable.id })).toThrow(/Prêt à réutiliser/i);

    const ready = library.create(
      { category: 'section', name: 'Section prête', reuseStatus: 'ready' },
      { contentType: 'code', language: 'html', contentText: '<section>v1</section>' },
    );
    library.markStable(ready.currentVersion!.id);
    const v2 = library.createVersion(ready.id, { contentType: 'code', language: 'html', contentText: '<section>v2</section>' });

    const result = compositions.addItem(composition.id, { libraryItemId: ready.id, versionId: v2.currentVersion!.id });
    expect(result.items[0].sourceVersionNumber).toBe(2);
  });

  it('refuse un composant Bridge marqué ready sans validation humaine', () => {
    const bridge = library.create(
      { category: 'section', name: 'Bridge non validé', reuseStatus: 'ready', tags: ['bridge'] },
      { contentType: 'json', language: 'json', contentText: '{"kind":"atoumweb-library-reusable-component"}' },
    );
    library.markStable(bridge.currentVersion!.id);
    const composition = compositions.create({ name: 'Site Bridge' });

    expect(() => compositions.addItem(composition.id, { libraryItemId: bridge.id })).toThrow(/réellement.*Prêt à réutiliser/i);

    library.updateMetadata(bridge.id, { tags: ['bridge', 'bridge-human-validated'] });
    const accepted = compositions.addItem(composition.id, { libraryItemId: bridge.id });
    expect(accepted.items).toHaveLength(1);
  });

  it('archive puis réactive une composition sans toucher à ses composants', () => {
    const component = library.create(
      { category: 'footer', name: 'Footer', reuseStatus: 'ready' },
      { contentType: 'code', language: 'html', contentText: '<footer />' },
    );
    library.markStable(component.currentVersion!.id);

    let composition = compositions.create({ name: 'Site démo' });
    composition = compositions.addItem(composition.id, { libraryItemId: component.id });
    expect(compositions.archive(composition.id).status).toBe('archived');
    expect(compositions.list()).toHaveLength(0);
    expect(compositions.list(true)).toHaveLength(1);

    const active = compositions.reactivate(composition.id);
    expect(active.status).toBe('draft');
    expect(active.items).toHaveLength(1);
    expect(library.get(component.id).name).toBe('Footer');
  });
});

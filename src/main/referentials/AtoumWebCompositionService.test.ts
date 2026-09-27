import { beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { AtoumWebCompositionService } from './AtoumWebCompositionService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';

let database: NodeSqliteAdapter;
let library: AtoumWebTechnicalLibraryService;
let compositions: AtoumWebCompositionService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  library = new AtoumWebTechnicalLibraryService(database);
  compositions = new AtoumWebCompositionService(database, library);
});

describe('AtoumWebCompositionService', () => {
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

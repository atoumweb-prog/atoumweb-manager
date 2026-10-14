import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths, type WorkspacePaths } from '../workspace';
import { ProjectService } from '../projects/ProjectService';
import { ProjectSiteService } from '../projects/ProjectSiteService';
import { AtoumWebCompositionPackageService } from './AtoumWebCompositionPackageService';
import { AtoumWebCompositionService } from './AtoumWebCompositionService';
import { AtoumWebPackageService } from './AtoumWebPackageService';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { readZipArchive } from './ZipArchive';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let workspace: WorkspacePaths;
let library: AtoumWebTechnicalLibraryService;
let assets: AtoumWebTechnicalAssetService;
let packages: AtoumWebPackageService;
let compositions: AtoumWebCompositionService;
let projectPackages: AtoumWebCompositionPackageService;
let projectService: ProjectService;
let projectSites: ProjectSiteService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-composition-package-'));
  workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  library = new AtoumWebTechnicalLibraryService(database);
  assets = new AtoumWebTechnicalAssetService(database, workspace);
  packages = new AtoumWebPackageService(database, workspace, library, assets);
  compositions = new AtoumWebCompositionService(database, library);
  projectPackages = new AtoumWebCompositionPackageService(database, workspace, compositions, packages, library);
  projectSites = new ProjectSiteService(database);
  projectService = new ProjectService(database, workspace, projectSites);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

function reusable(name: string, category: 'header' | 'hero' | 'section' | 'footer', suffix: string) {
  const item = library.create(
    {
      category,
      name,
      reuseStatus: 'ready',
      vertical: 'fleuriste',
      tags: ['bridge', 'bridge-human-validated'],
    },
    {
      contentType: 'json',
      language: 'json',
      contentText: JSON.stringify({
        schemaVersion: 2,
        generatorRevision: 2,
        kind: 'atoumweb-library-reusable-component',
        origin: {
          site: 'atoumweb.fr',
          page: 'Bibliothèque',
          pageUrl: 'https://www.atoumweb.fr/',
          snapshotId: 'awb-snap:composition-test',
          snapshotDate: '2026-09-27T12:00:00Z',
          builderGeneration: '5',
          occurrenceId: `module-${suffix}`,
        },
        identity: null,
        reusable: {
          html: `<section class="aw-${suffix}"><h2 data-aw-field-text="title">${name}</h2></section>`,
          css: `.aw-${suffix}{padding:1rem}`,
          javascript: '',
          rootClasses: [`aw-${suffix}`],
          method: 'divi-code',
          instructions: [],
          generalized: true,
          fields: [{
            id: 'title',
            label: 'Titre',
            type: 'text',
            selector: '[data-aw-field-text="title"]',
            originalValue: name,
            defaultValue: name,
          }],
        },
        dependencies: [],
        assets: [],
        checks: { remoteAssetUrls: [] },
        notes: [],
      }),
    },
  );
  return library.markStable(item.currentVersion!.id);
}

describe('AtoumWebCompositionPackageService', () => {
  it('exporte une préparation de Page V2 avec une destination et un exportId immuables', () => {
    const hero = reusable('Hero Fleuriste', 'hero', 'page-hero');
    const project = projectService.createInternal({ name: 'Projet export Page' });
    const updated = projectService.addProjectNode(project.id, {
      type: 'module', displaySubtype: 'page', name: 'Accueil', semanticKey: 'pages.home',
    });
    const page = updated.nodes.find((node) => node.semanticKey === 'pages.home')!;
    const site = projectSites.create(project.id, { name: 'Site principal' });
    projectSites.linkPage(site.id, page.id, { role: 'home' });
    let composition = compositions.ensureForProjectPage(page.id);
    composition = compositions.addItem(composition.id, { libraryItemId: hero.id });
    composition = compositions.updateItemLocalCode(composition.id, composition.items[0].id, {
      html: '<section class="prepared-hero">Hero préparé pour cette Page</section>',
      css: '.prepared-hero{color:#123456}',
      javascript: '',
    });

    const exported = projectPackages.exportPagePackage(page.id);
    const entries = readZipArchive(exported.path);
    const manifest = JSON.parse(entries.find((entry) => entry.name === 'manifest.json')!.data.toString('utf8'));

    expect(exported).toMatchObject({
      compositionId: composition.id,
      projectId: project.id,
      siteId: site.id,
      pageId: page.id,
      componentCount: 1,
    });
    expect(exported.exportId).toMatch(/^awexp:/);
    expect(manifest).toMatchObject({
      contract: 'atoumweb_bridge_project_package',
      schemaVersion: 2,
      scope: 'page',
      exportId: exported.exportId,
      destination: { projectId: project.id, siteId: site.id, pageId: page.id },
    });
    expect(manifest.components[0].compositionItemId).toBe(composition.items[0].id);
    const preparedHtml = entries.find((entry) => entry.name === manifest.components[0].files.html.path)!;
    const preparedCss = entries.find((entry) => entry.name === manifest.components[0].files.css.path)!;
    expect(preparedHtml.data.toString('utf8')).toContain('Hero préparé pour cette Page');
    expect(preparedCss.data.toString('utf8')).toBe('.prepared-hero{color:#123456}');
    expect(manifest.components[0].files.javascript).toBeNull();
    expect(database.get<{ total: number }>('SELECT COUNT(*) total FROM project_page_exports WHERE id=?', [exported.exportId!])?.total).toBe(1);
  });

  it('R07G-22 exporte trois occurrences ordonnées, destination exacte et nouveaux exportId sans écrasement', () => {
    const sources = [
      reusable('En-tête', 'header', 'r07g-header'),
      reusable('Hero', 'hero', 'r07g-hero'),
      reusable('Pied de page', 'footer', 'r07g-footer'),
    ];
    const project = projectService.createInternal({ name: 'R07G trois composants' });
    const updated = projectService.addProjectNode(project.id, {
      type: 'module', displaySubtype: 'page', name: 'Accueil', semanticKey: 'r07g.home',
    });
    const page = updated.nodes.find(node => node.semanticKey === 'r07g.home')!;
    const site = projectSites.create(project.id, { name: 'Site R07G' });
    projectSites.linkPage(site.id, page.id, { role: 'home' });
    let composition = compositions.ensureForProjectPage(page.id);
    for (const item of sources) composition = compositions.addItem(composition.id, { libraryItemId: item.id });

    const first = projectPackages.exportPagePackage(page.id);
    const firstBytes = readZipArchive(first.path).find(entry => entry.name === 'manifest.json')!.data.toString('utf8');
    const second = projectPackages.exportPagePackage(page.id);
    const manifest = JSON.parse(readZipArchive(second.path).find(entry => entry.name === 'manifest.json')!.data.toString('utf8'));

    expect(first.exportId).toMatch(/^awexp:/);
    expect(second.exportId).toMatch(/^awexp:/);
    expect(second.exportId).not.toBe(first.exportId);
    expect(second.path).not.toBe(first.path);
    expect(readZipArchive(first.path).find(entry => entry.name === 'manifest.json')!.data.toString('utf8')).toBe(firstBytes);
    expect(manifest.destination).toEqual({projectId: project.id, siteId: site.id, pageId: page.id});
    expect(manifest.exportId).toBe(second.exportId);
    expect(manifest.components).toHaveLength(3);
    expect(manifest.components.map((item: {compositionItemId: string}) => item.compositionItemId))
      .toEqual(composition.items.map(item => item.id));
    expect(manifest.components.map((item: {sortOrder: number}) => item.sortOrder)).toEqual([0,1,2]);
    expect(manifest.components.map((item: {files: {html: {path:string}}}) => item.files.html.path))
      .toEqual(['components/001/component/component.html','components/002/component/component.html','components/003/component/component.html']);
    expect(database.all<{id:string}>(
      'SELECT id FROM project_page_exports WHERE project_node_id=? ORDER BY created_at,id',[page.id],
    ).map(row => row.id).sort()).toEqual([first.exportId,second.exportId].sort());
  });

  it('R07G-21 refuse aussi les Sites archivés et les compositions vides sans historique d export', () => {
    const source = reusable('Hero refus', 'hero', 'refusal');
    const project = projectService.createInternal({name:'R07G refus export'});
    const updated = projectService.addProjectNode(project.id,{type:'module',displaySubtype:'page',name:'Page test'});
    const page = updated.nodes.find(node => node.displaySubtype==='page')!;
    const site = projectSites.create(project.id,{name:'Site à archiver'});
    projectSites.linkPage(site.id,page.id,{role:'standard'});
    const composition = compositions.ensureForProjectPage(page.id);
    expect(() => projectPackages.exportPagePackage(page.id)).toThrow(/au moins un composant/);
    projectSites.setArchived(site.id,true);
    compositions.addItem(composition.id,{libraryItemId:source.id});
    expect(() => projectPackages.exportPagePackage(page.id)).toThrow(/Site actif.*composition/i);
    expect(database.all('SELECT id FROM project_page_exports WHERE project_node_id=?',[page.id])).toHaveLength(0);
  });

  it('refuse un export Page sans Site actif ou sans composition', () => {
    const project = projectService.createInternal({ name: 'Projet incomplet' });
    const updated = projectService.addProjectNode(project.id, { type: 'module', displaySubtype: 'page', name: 'Page isolée' });
    const page = updated.nodes.find((node) => node.displaySubtype === 'page')!;
    expect(() => projectPackages.exportPagePackage(page.id)).toThrow(/Site actif.*composition/i);
  });

  it('exporte un package projet ordonné contenant plusieurs Component Package V1', () => {
    const header = reusable('Header Fleuriste', 'header', 'header');
    const hero = reusable('Hero Fleuriste', 'hero', 'hero');

    let composition = compositions.create({ name: 'Site Fleuriste Dupont', targetVertical: 'Fleuriste' });
    composition = compositions.addItem(composition.id, { libraryItemId: header.id });
    composition = compositions.addItem(composition.id, { libraryItemId: hero.id });

    const exported = projectPackages.exportPackage(composition.id);
    expect(exported.componentCount).toBe(2);
    expect(exported.fileName.endsWith('.zip')).toBe(true);

    const entries = readZipArchive(exported.path);
    const manifest = JSON.parse(entries.find((entry) => entry.name === 'manifest.json')!.data.toString('utf8'));
    expect(manifest).toMatchObject({
      contract: 'atoumweb_bridge_project_package',
      schemaVersion: 1,
      safety: {
        flow: 'workbench_first',
        workbenchRequired: true,
        directProductionInjection: false,
        sourceLibraryMutation: false,
      },
      composition: {
        id: composition.id,
        name: 'Site Fleuriste Dupont',
        targetVertical: 'fleuriste',
      },
    });
    expect(manifest.components).toHaveLength(2);
    expect(manifest.components.map((component: { displayName: string }) => component.displayName))
      .toEqual(['Header Fleuriste', 'Hero Fleuriste']);
    expect(manifest.components.map((component: { sortOrder: number }) => component.sortOrder)).toEqual([0, 1]);

    for (const component of manifest.components) {
      const htmlPath = component.files.html.path;
      const identityPath = component.files.identity.path;
      expect(entries.some((entry) => entry.name === htmlPath)).toBe(true);
      expect(entries.some((entry) => entry.name === identityPath)).toBe(true);
      expect(htmlPath).toMatch(/^components\/00[12]\/component\/component\.html$/);
    }
  });

  it('refuse une composition vide et encapsule un composant HTML prêt sans package Workbench V1', () => {
    const empty = compositions.create({ name: 'Vide' });
    expect(() => projectPackages.exportPackage(empty.id)).toThrow(/au moins un composant/i);

    const plain = library.create(
      { category: 'section', name: 'HTML simple', reuseStatus: 'ready' },
      { contentType: 'code', language: 'html', contentText: '<section>Simple</section>' },
    );
    library.markStable(plain.currentVersion!.id);
    let composition = compositions.create({ name: 'Incompatible' });
    composition = compositions.addItem(composition.id, { libraryItemId: plain.id });

    const exported = projectPackages.exportPackage(composition.id);
    const entries = readZipArchive(exported.path);
    const manifest = JSON.parse(entries.find((entry) => entry.name === 'manifest.json')!.data.toString('utf8'));
    expect(manifest.components[0].provenance.source).toBe('manager_plain_html');
    expect(entries.some((entry) => entry.name === 'components/001/component/component.html')).toBe(true);
  });
});

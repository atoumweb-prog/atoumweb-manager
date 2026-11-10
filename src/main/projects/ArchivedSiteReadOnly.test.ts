import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectService } from './ProjectService';
import { ProjectSiteService } from './ProjectSiteService';
import { ProjectNodeArrangementService } from './ProjectNodeArrangementService';
import { AtoumWebCompositionService } from '../referentials/AtoumWebCompositionService';
import { AtoumWebTechnicalLibraryService } from '../referentials/AtoumWebTechnicalLibraryService';

let database: NodeSqliteAdapter, root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atoumweb-site-readonly-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys=ON;');
  applyPendingMigrations(database);
});
afterEach(() => { database.close(); rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const sites = new ProjectSiteService(database);
  const projects = new ProjectService(database, createWorkspacePaths(root), sites);
  const library = new AtoumWebTechnicalLibraryService(database);
  const compositions = new AtoumWebCompositionService(database, library);
  const arrangement = new ProjectNodeArrangementService(database, projects);
  const p = projects.createInternal({ name: 'TEST — Lecture seule' });
  const add = (name: string, page = false, parentId?: string) => projects.addProjectNode(p.id, {
    name, type: page ? 'module' : 'lot', displaySubtype: page ? 'page' : null, parentId,
  }).nodes.find(node => node.name === name)!;
  const phase = add('TEST — Phase archivée'), livePhase = add('TEST — Phase active');
  const page = add('TEST — Page archivée', true, phase.id), empty = add('TEST — Sans composition', true, phase.id);
  const live = add('TEST — Page active', true, livePhase.id);
  const site = sites.create(p.id, { name: 'TEST — Site archivé' }), active = sites.create(p.id, { name: 'TEST — Site actif' });
  sites.linkPage(site.id, page.id, { desiredPath: '/archive' });
  sites.linkPage(site.id, empty.id);
  sites.linkPage(active.id, live.id);
  const source = library.createReusableCode({ category: 'section', name: 'TEST — Source', html: '<h1>TEST</h1>', css: '', javascript: '' });
  let comp = compositions.ensureForProjectPage(page.id);
  comp = compositions.addItem(comp.id, { libraryItemId: source.id });
  comp = compositions.addItem(comp.id, { libraryItemId: source.id });
  sites.setArchived(site.id, true);
  return { library, sites, projects, compositions, arrangement, p, phase, page, empty, live, site, active, source, comp };
}
function snapshot() {
  return JSON.stringify(database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .map(({ name }) => [name, database.all('SELECT * FROM "' + name.replaceAll('"', '""') + '" ORDER BY rowid')]));
}

it('refuse les écritures Site/Page et commandes Production indirectes sans aucune écriture partielle', () => {
  const f = fixture(), before = snapshot();
  const attempts = [
    () => f.sites.update(f.site.id, { name: 'Non' }),
    () => f.sites.update(f.site.id, { desiredDomain: 'non.example' }),
    () => f.projects.updateProjectNode(f.page.id, { name: 'Non' }),
    () => f.projects.updateProjectNode(f.page.id, { parentId: null }),
    () => f.sites.linkPage(f.site.id, f.page.id, { role: 'home', desiredPath: '/' }),
    () => f.sites.linkPage(f.active.id, f.page.id),
    () => f.sites.linkPage(f.site.id, f.live.id),
    () => f.sites.unlinkPage(f.page.id),
    () => f.projects.addProjectNode(f.p.id, { type: 'task', name: 'Non', parentId: f.page.id }),
    () => f.arrangement.move(f.page.id, { parentId: null, targetIndex: 0 }),
    () => f.arrangement.move(f.phase.id, { parentId: null, targetIndex: 1 }),
    () => f.projects.setProjectNodePause(f.page.id, true),
    () => f.projects.completeProjectPhase(f.phase.id),
  ];
  for (const attempt of attempts) { expect(attempt).toThrow(/archiv/i); expect(snapshot()).toBe(before); }
});

it('refuse toute mutation de composition attachée au Site archivé, y compris depuis son identifiant direct', () => {
  const f = fixture(), c = f.compositions, id = f.comp.id, item = f.comp.items[0].id;
  const ids = f.comp.items.map(item => item.id), before = snapshot();
  const attempts = [
    () => c.ensureForProjectPage(f.empty.id),
    () => c.attachToProjectPage(f.empty.id, id),
    () => c.attachToProjectPage(f.live.id, id),
    () => c.detachFromProjectPage(f.page.id),
    () => c.update(id, { name: 'Non' }),
    () => c.addItem(id, { libraryItemId: f.source.id }),
    () => c.updateItemLocalCode(id, item, { html: '<h1>Non</h1>' }),
    () => c.resetItemLocalCode(id, item),
    () => c.removeItem(id, item),
    () => c.moveItem(id, item, { targetIndex: 1 }),
    () => c.restoreOrder(id, ids, ids.slice().reverse()),
    () => c.archive(id),
    () => c.reactivate(id),
  ];
  for (const attempt of attempts) { expect(attempt).toThrow(/lecture seule/i); expect(snapshot()).toBe(before); }
  expect(c.getForProjectPage(f.page.id)?.items).toHaveLength(2);
  expect(c.ensureForProjectPage(f.page.id).id).toBe(id); // Existing read remains idempotent.
  expect(snapshot()).toBe(before);
});

it('conserve les mutations des Sites actifs et les rétablit après réactivation explicite', () => {
  const f = fixture();
  f.projects.updateProjectNode(f.live.id, { name: 'TEST — Renommée' });
  const activeComp = f.compositions.ensureForProjectPage(f.live.id);
  expect(f.compositions.addItem(activeComp.id, { libraryItemId: f.source.id }).items).toHaveLength(1);
  f.sites.setArchived(f.site.id, false);
  f.sites.update(f.site.id, { desiredDomain: 'reactive.example' });
  f.projects.updateProjectNode(f.page.id, { name: 'TEST — Réactivée' });
  f.compositions.updateItemLocalCode(f.comp.id, f.comp.items[0].id, { html: '<h1>Réactivée</h1>' });
  f.compositions.moveItem(f.comp.id, f.comp.items[0].id, { targetIndex: 1 });
  f.sites.linkPage(f.active.id, f.page.id, { desiredPath: '/nouveau' });
  f.sites.unlinkPage(f.page.id);
  expect(f.sites.listPages(f.p.id).some(link => link.projectNodeId === f.page.id)).toBe(false);
  expect(f.compositions.get(f.comp.id).items[1].localHtml).toContain('Réactivée');
});

it('réutilise un module prêt dans un autre projet actif sans modifier son occurrence archivée', () => {
  const f = fixture(), sourceBefore = JSON.stringify(f.compositions.get(f.comp.id));
  const targetProject = f.projects.createInternal({ name: 'TEST — Projet destination' });
  const target = f.projects.addProjectNode(targetProject.id, { type: 'module', displaySubtype: 'page', name: 'TEST — Destination' }).nodes[0];
  const site = f.sites.create(targetProject.id, { name: 'TEST — Destination active' });
  f.sites.linkPage(site.id, target.id);
  const comp = f.compositions.ensureForProjectPage(target.id);
  const copy = f.compositions.addItem(comp.id, { libraryItemId: f.source.id }).items[0];
  expect(copy.id).not.toBe(f.comp.items[0].id);
  f.compositions.updateItemLocalCode(comp.id, copy.id, { html: '<h1>Copie modifiée</h1>' });
  expect(JSON.stringify(f.compositions.get(f.comp.id))).toBe(sourceBefore);
  expect(f.sites.get(f.site.id).archivedAt).toBeTruthy();
});

it('capitalise une adaptation enregistrée dans une nouvelle variante sans modifier la source archivée ni contourner sa validation', () => {
  const f = fixture();
  f.sites.setArchived(f.site.id, false);
  f.compositions.updateItemLocalCode(f.comp.id, f.comp.items[0].id, { html: '<h1>Adaptation enregistrée</h1>' });
  f.sites.setArchived(f.site.id, true);
  const source = () => JSON.stringify({ site: f.sites.get(f.site.id), page: f.projects.getProject(f.p.id).nodes,
    composition: f.compositions.get(f.comp.id), library: f.library.get(f.source.id) });
  const before = source();
  const variant = f.compositions.promoteItemVariant(f.comp.id, f.comp.items[0].id, { name: 'TEST — Copie indépendante' });
  expect(variant.id).not.toBe(f.source.id);
  expect(variant.reuseStatus).toBe('adapt');
  expect(variant.stableVersion).toBeNull();
  expect(variant.currentVersion?.contentText).toContain('Adaptation enregistrée');
  const target = f.compositions.ensureForProjectPage(f.live.id);
  expect(() => f.compositions.addItem(target.id, { libraryItemId: variant.id })).toThrow(/Prêt à réutiliser/);
  expect(source()).toBe(before);
});

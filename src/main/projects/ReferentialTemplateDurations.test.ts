import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { projectCompositionFixture } from '../testSupport/projectCompositionFixture';
import { applyReferentialTemplates, planReferentialTemplates } from './ReferentialProjectTemplates';
import { applyTemplateDurations, planTemplateDurations, type TemplateDurations } from './ReferentialTemplateDurations';

/** Durées des modèles du référentiel (décision de Carlos du 17/11/2026) : nouvelle version, liens déplacés, projets existants inchangés. */
const P = 'Proposé, à valider : test.';
const offers = [{code: 'AW-LP-BASE', name: 'Landing Page', steps: ['Définir l’action attendue du visiteur.', 'Réaliser la page et la tester sur mobile.', 'Mettre en ligne et remettre les accès.'], provenance: P, family: 'Landing page'}];
let db: NodeSqliteAdapter, root: string, f: ReturnType<typeof projectCompositionFixture>;
const durations: TemplateDurations = {modeles: [{modele: 'Référentiel · Landing Page', taches: [
  {lot: 'Démarrage', name: 'Définir l’action attendue du visiteur', minutes: 15},
  {lot: 'Réalisation', name: 'Réaliser la page et la tester sur mobile', minutes: 600},
  {lot: 'Livraison', name: 'Mettre en ligne et remettre les accès', minutes: 20}]}]};
const state = () => db.all<{name: string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .map(t => ({table: t.name, rows: db.all('SELECT * FROM ' + t.name).map(r => JSON.stringify(r)).sort()}));
const landing = () => f.projects.listTemplates().find(t => t.name === 'Référentiel · Landing Page')!;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atoumweb-template-durations-'));
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  f = projectCompositionFixture(db, createWorkspacePaths(join(root, 'workspace')));
  const item = f.catalog.create({type: 'service', name: 'Landing Page', canonicalCode: 'AW-LP-BASE', identityProvenance: {reference: 'Test uniquement'}}, {priceMode: 'fixed', priceCents: 49900});
  f.catalog.publishVersion(item.versions[0].id);
  applyReferentialTemplates(db, f.projects, offers, planReferentialTemplates(db, offers).planSha256);
});
afterEach(() => { db.close(); if (!root.startsWith(join(tmpdir(), 'atoumweb-template-durations-'))) throw Error('Unsafe temp'); rmSync(root, {recursive: true, force: true}); });

describe('setTemplateNodeMinutes', () => {
  it('modifie la durée d’une tâche d’une version brouillon et refuse une version publiée', () => {
    const published = f.projects.getTemplate(landing().id).versions[0];
    const task = published.nodes.find(n => n.type === 'task')!;
    expect(() => f.projects.setTemplateNodeMinutes(task.id, 30)).toThrow(/figée/);
    const draft = f.projects.createTemplateVersion(landing().id);
    const draftTask = draft.nodes.find(n => n.type === 'task' && n.name === task.name)!;
    expect(f.projects.setTemplateNodeMinutes(draftTask.id, 30).nodes.find(n => n.id === draftTask.id)!.estimatedMinutes).toBe(30);
    expect(() => f.projects.setTemplateNodeMinutes(draftTask.id, -5)).toThrow(/Durée/);
  });
});

describe('planTemplateDurations et applyTemplateDurations', () => {
  it('le plan n’écrit rien et annonce la mise à jour', () => {
    const before = state();
    const plan = planTemplateDurations(db, durations);
    expect(state()).toEqual(before);
    expect(plan.templates).toEqual([{modele: 'Référentiel · Landing Page', action: 'update', tasks: 3}]);
    expect(plan.missing).toEqual([]);
  });

  it('publie une nouvelle version avec les durées, déplace les liens, garde les projets existants ; rejouable', () => {
    const oldVersion = f.projects.getTemplate(landing().id).versions[0].id;
    const done = applyTemplateDurations(db, f.projects, durations, planTemplateDurations(db, durations).planSha256);
    expect(done).toEqual({templatesUpdated: 1, linksMoved: 1});
    const versions = f.projects.getTemplate(landing().id).versions;
    const current = versions.find(v => v.status === 'published')!;
    expect(current.id).not.toBe(oldVersion);
    expect(versions.find(v => v.id === oldVersion)!.status).toBe('retired');
    expect(Object.fromEntries(current.nodes.filter(n => n.type === 'task').map(n => [n.name, n.estimatedMinutes]))).toEqual({
      'Définir l’action attendue du visiteur': 15, 'Réaliser la page et la tester sur mobile': 600, 'Mettre en ligne et remettre les accès': 20});
    expect(db.get<{n: number}>('SELECT count(*) n FROM catalog_project_blueprints WHERE template_version_id=?', [current.id])!.n).toBe(1);
    const again = planTemplateDurations(db, durations);
    expect(again.templates[0].action).toBe('unchanged');
    const before = state();
    expect(applyTemplateDurations(db, f.projects, durations, again.planSha256)).toEqual({templatesUpdated: 0, linksMoved: 0});
    expect(state()).toEqual(before);
  });

  it('refuse une empreinte différente sans rien écrire', () => {
    const before = state();
    expect(() => applyTemplateDurations(db, f.projects, durations, '0'.repeat(64))).toThrow(/empreinte/i);
    expect(state()).toEqual(before);
  });
});

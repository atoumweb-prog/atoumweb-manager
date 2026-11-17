import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { projectCompositionFixture } from '../testSupport/projectCompositionFixture';
import { applyReferentialTemplates, planReferentialTemplates } from './ReferentialProjectTemplates';
import { applyTemplateSites, planTemplateSites } from './ReferentialTemplateSites';

/** Fiche « Site » des modèles de sites, boutiques, mariage et landing (décision de Carlos du 17/11/2026). */
const P = 'Proposé, à valider : test.';
const offers = [
  {code: 'AW-LP-BASE', name: 'Landing Page', steps: ['Réaliser la page et la tester sur mobile.', 'Mettre en ligne et remettre les accès.'], provenance: P, family: 'Landing page'},
  {code: 'AW-BRAND-LOGO', name: 'Logo Standard', steps: ['Faire le brief.', 'Réaliser le logo.'], provenance: P, family: 'Identité visuelle'},
];
const NAMES = ['Référentiel · Landing Page'];
let db: NodeSqliteAdapter, root: string, f: ReturnType<typeof projectCompositionFixture>;
const state = () => db.all<{name: string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .map(t => ({table: t.name, rows: db.all('SELECT * FROM ' + t.name).map(r => JSON.stringify(r)).sort()}));
const publish = (code: string, name: string) => { const item = f.catalog.create({type: 'service', name, canonicalCode: code, identityProvenance: {reference: 'Test uniquement'}}, {priceMode: 'fixed', priceCents: 10000}); f.catalog.publishVersion(item.versions[0].id); };
const quoteWith = (...codes: string[]) => {
  const q = f.quotes.create({prospectId: f.createQuote().prospectId!, subject: 'TEST sites ' + codes.join('+')});
  for (const code of codes) f.quotes.addCatalogLine(q.id, f.catalog.list({status: 'active'}).find(i => i.canonicalCode === code)!.currentVersion!.id);
  return q;
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atoumweb-template-sites-'));
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  f = projectCompositionFixture(db, createWorkspacePaths(join(root, 'workspace')));
  publish('AW-LP-BASE', 'Landing Page'); publish('AW-BRAND-LOGO', 'Logo Standard');
  applyReferentialTemplates(db, f.projects, offers, planReferentialTemplates(db, offers).planSha256);
});
afterEach(() => { db.close(); if (!root.startsWith(join(tmpdir(), 'atoumweb-template-sites-'))) throw Error('Unsafe temp'); rmSync(root, {recursive: true, force: true}); });

describe('planTemplateSites et applyTemplateSites', () => {
  it('le plan n’écrit rien', () => {
    const before = state();
    expect(planTemplateSites(db, NAMES).templates).toEqual([{modele: 'Référentiel · Landing Page', action: 'add_site'}]);
    expect(state()).toEqual(before);
  });

  it('ajoute un « Site principal » par nouvelle version, déplace les liens ; une vente crée la fiche Site ; rejouable', () => {
    expect(applyTemplateSites(db, f.projects, NAMES, planTemplateSites(db, NAMES).planSha256)).toEqual({templatesUpdated: 1, linksMoved: 1});
    const project = f.projects.commercial.prepare({quoteId: quoteWith('AW-LP-BASE').id});
    expect(f.sites.list(project.id).map(s => s.name)).toEqual(['Site principal']);
    const mixed = f.projects.commercial.prepare({quoteId: quoteWith('AW-LP-BASE', 'AW-BRAND-LOGO').id});
    expect(f.sites.list(mixed.id)).toHaveLength(1);
    expect(db.all<{name: string}>('SELECT name FROM project_nodes WHERE project_id=?', [mixed.id]).map(n => n.name)).toContain('Réaliser le logo');
    const again = planTemplateSites(db, NAMES);
    expect(again.templates[0].action).toBe('unchanged');
    const before = state();
    expect(applyTemplateSites(db, f.projects, NAMES, again.planSha256)).toEqual({templatesUpdated: 0, linksMoved: 0});
    expect(state()).toEqual(before);
  });

  it('refuse une empreinte différente sans rien écrire', () => {
    const before = state();
    expect(() => applyTemplateSites(db, f.projects, NAMES, '0'.repeat(64))).toThrow(/empreinte/i);
    expect(state()).toEqual(before);
  });
});

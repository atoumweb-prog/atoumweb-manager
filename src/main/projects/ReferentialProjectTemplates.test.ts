import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { projectCompositionFixture } from '../testSupport/projectCompositionFixture';
import { applyReferentialTemplates, planReferentialTemplates, type ReferentialOffer } from './ReferentialProjectTemplates';

/** Modèles de projet du référentiel (fiche validée par Carlos le 16/11/2026) : plan en lecture seule, application vérifiée par empreinte. */
const P = 'Proposé, à valider : le référentiel ne décrit pas de procédure pour cette prestation.';
const LANDING_STEPS = [
  'Définir l’action attendue du visiteur : appeler, remplir un formulaire, réserver.',
  'Chiffrer au devis la page et ses options.',
  'Réaliser la page et la tester sur mobile.',
  'Faire valider par écrit.',
  'Mettre en ligne et remettre les accès.',
];
const OPTION_STEPS = ['Vérifier que l’option n’est pas déjà comprise dans la formule vendue.', 'Réaliser l’option dans le site.', 'Faire valider par écrit.'];
const offers: ReferentialOffer[] = [
  {code: 'AW-LP-BASE', name: 'Landing Page', steps: LANDING_STEPS, provenance: P, family: 'Landing page'},
  {code: 'AW-LP-SECTION', name: 'Section standard supplémentaire', steps: OPTION_STEPS, provenance: P, family: 'Options de landing'},
  {code: 'AW-MAINT-WP-M', name: 'Maintenance WordPress mensuelle', steps: ['Vérifier l’hébergement.'], provenance: P, family: 'Maintenance'},
  {code: 'V39-NL-PONCT-SIMPLE', name: 'Newsletter ponctuelle simple', steps: ['Vérifier l’origine licite des contacts.', 'Rédiger et envoyer la newsletter.'], provenance: P, family: 'Newsletter ponctuelle'},
  {code: 'AW-ABSENT', name: 'Offre absente du catalogue', steps: ['Réaliser.'], provenance: P, family: 'Absente'},
];

let db: NodeSqliteAdapter, root: string, f: ReturnType<typeof projectCompositionFixture>;
const state = () => db.all<{name: string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .map(t => ({table: t.name, rows: db.all('SELECT * FROM ' + t.name).map(r => JSON.stringify(r)).sort()}));
const publish = (code: string | null, name: string) => {
  const item = f.catalog.create({type: 'service', name, canonicalCode: code ?? undefined, identityProvenance: {reference: 'Test uniquement'}}, {priceMode: 'fixed', priceCents: 10000});
  f.catalog.publishVersion(item.versions[0].id);
  return f.catalog.getItem(item.id);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atoumweb-referential-templates-'));
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  f = projectCompositionFixture(db, createWorkspacePaths(join(root, 'workspace')));
  publish('AW-LP-BASE', 'Landing Page'); publish('AW-LP-SECTION', 'Section standard supplémentaire');
  publish('AW-MAINT-WP-M', 'Maintenance WordPress mensuelle'); publish(null, 'Newsletter ponctuelle simple');
});
afterEach(() => { db.close(); if (!root.startsWith(join(tmpdir(), 'atoumweb-referential-templates-'))) throw Error('Unsafe temp'); rmSync(root, {recursive: true, force: true}); });

const quoteWith = (...codes: string[]) => {
  const prospectId = f.createQuote().prospectId!;
  const quote = f.quotes.create({prospectId, subject: 'TEST référentiel ' + codes.join('+')});
  for (const code of codes) {
    const item = f.catalog.list({status: 'active'}).find(i => i.canonicalCode === code || i.name === offers.find(o => o.code === code)?.name)!;
    f.quotes.addCatalogLine(quote.id, item.currentVersion!.id);
  }
  return f.quotes.get(quote.id);
};

describe('planReferentialTemplates : lecture seule', () => {
  it('classe les offres, retrouve une offre sans code par son nom, n’écrit rien', () => {
    const before = state();
    const plan = planReferentialTemplates(db, offers);
    expect(state()).toEqual(before);
    expect(plan.templates.map(t => [t.name, t.nature])).toEqual(expect.arrayContaining([
      ['Référentiel · Landing Page', 'base'], ['Référentiel · Section standard supplémentaire', 'addon'], ['Référentiel · Newsletter ponctuelle simple', 'base'],
    ]));
    expect(plan.recurring).toEqual(['AW-MAINT-WP-M']);
    expect(plan.unmatched).toEqual(['AW-ABSENT']);
    expect(plan.matchedByName).toEqual(['V39-NL-PONCT-SIMPLE']);
    expect(plan.links).toHaveLength(3);
    expect(plan.planSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('nomme un modèle partagé par plusieurs familles avec toutes ces familles', () => {
    publish('AW-ECOM-PROD-VAR', 'Produit variable'); publish('AW-LP-POPUP', 'Pop-up ciblée simple');
    const plan = planReferentialTemplates(db, [
      {code: 'AW-LP-POPUP', name: 'Pop-up ciblée simple', steps: OPTION_STEPS, provenance: P, family: 'Options de landing'},
      {code: 'AW-ECOM-PROD-VAR', name: 'Produit variable', steps: OPTION_STEPS, provenance: P, family: 'Options de boutique'},
    ]);
    expect(plan.templates.map(t => t.name)).toEqual(['Référentiel · Options de landing et Options de boutique']);
  });

  it('laisse telle quelle une offre déjà reliée à un modèle de projet', () => {
    const plan = planReferentialTemplates(db, [{code: f.offer.canonicalCode ?? 'FIXTURE', name: f.offer.name, steps: LANDING_STEPS, provenance: P, family: 'Fixture'}]);
    expect(plan.links).toHaveLength(0);
    expect(plan.skipped).toEqual([{code: f.offer.canonicalCode ?? 'FIXTURE', reason: 'déjà reliée à un modèle de projet'}]);
  });
});

describe('applyReferentialTemplates : écriture vérifiée', () => {
  it('refuse une empreinte différente sans rien écrire', () => {
    const before = state();
    expect(() => applyReferentialTemplates(db, f.projects, offers, '0'.repeat(64))).toThrow(/empreinte/i);
    expect(state()).toEqual(before);
  });

  it('crée les modèles publiés, sans durée, et les liens ; une seconde application n’écrit rien', () => {
    const plan = planReferentialTemplates(db, offers);
    const done = applyReferentialTemplates(db, f.projects, offers, plan.planSha256);
    expect(done).toEqual({templatesCreated: 3, linksCreated: 3});
    const landing = f.projects.listTemplates().find(t => t.name === 'Référentiel · Landing Page')!;
    const version = f.projects.getTemplate(landing.id).versions[0];
    expect(version.status).toBe('published');
    expect(version.nodes.filter(n => n.type === 'lot').map(n => n.name)).toEqual(['Démarrage', 'Réalisation', 'Corrections et validation', 'Livraison']);
    expect(version.nodes.filter(n => n.type === 'task').every(n => n.estimatedMinutes == null)).toBe(true);
    expect(version.nodes.some(n => /^Chiffrer/.test(n.name))).toBe(false);
    const again = planReferentialTemplates(db, offers);
    expect(again.links).toHaveLength(0);
    const before = state();
    expect(applyReferentialTemplates(db, f.projects, offers, again.planSha256)).toEqual({templatesCreated: 0, linksCreated: 0});
    expect(state()).toEqual(before);
  });

  it('un devis avec la landing devient un projet avec ses tâches ; l’option ajoute les siennes', () => {
    applyReferentialTemplates(db, f.projects, offers, planReferentialTemplates(db, offers).planSha256);
    const tasksOf = (quoteId: string) => { const project = f.projects.commercial.prepare({quoteId}); return db.all<{name: string}>('SELECT name FROM project_nodes WHERE project_id=?', [project.id]).map(n => n.name); };
    expect(tasksOf(quoteWith('AW-LP-BASE').id)).toContain('Réaliser la page et la tester sur mobile');
    const both = tasksOf(quoteWith('AW-LP-BASE', 'AW-LP-SECTION').id);
    expect(both).toContain('Réaliser la page et la tester sur mobile');
    expect(both).toContain('Réaliser l’option dans le site');
    expect(both.filter(n => n === 'Réalisation')).toHaveLength(1);
  });

  it('devis mixte (décision de Carlos du 17/11/2026) : l’offre qui porte un site porte le projet, les autres y ajoutent leurs tâches', () => {
    applyReferentialTemplates(db, f.projects, offers, planReferentialTemplates(db, offers).planSha256);
    const prospectId = f.createQuote().prospectId!;
    const quote = f.quotes.create({prospectId, subject: 'TEST devis mixte'});
    f.quotes.addCatalogLine(quote.id, f.offer.currentVersion!.id);
    f.quotes.addCatalogLine(quote.id, f.catalog.list({status: 'active'}).find(i => i.canonicalCode === 'AW-LP-BASE')!.currentVersion!.id);
    const project = f.projects.commercial.prepare({quoteId: quote.id});
    const names = db.all<{name: string}>('SELECT name FROM project_nodes WHERE project_id=?', [project.id]).map(n => n.name);
    expect(names).toContain('Accueil');
    expect(names).toContain('Réaliser la page et la tester sur mobile');
    expect(f.sites.list(project.id)).toHaveLength(1);
  });

  it('devis mixte sans site : la première ligne porte le projet, la seconde y ajoute ses tâches', () => {
    applyReferentialTemplates(db, f.projects, offers, planReferentialTemplates(db, offers).planSha256);
    const names = (() => { const q = quoteWith('AW-LP-BASE', 'V39-NL-PONCT-SIMPLE'); const p = f.projects.commercial.prepare({quoteId: q.id}); return db.all<{name: string}>('SELECT name FROM project_nodes WHERE project_id=?', [p.id]).map(n => n.name); })();
    expect(names).toContain('Réaliser la page et la tester sur mobile');
    expect(names).toContain('Rédiger et envoyer la newsletter');
  });

  it('une option vendue sans base est refusée par l’aperçu, sans écriture', () => {
    applyReferentialTemplates(db, f.projects, offers, planReferentialTemplates(db, offers).planSha256);
    const quote = quoteWith('AW-LP-SECTION');
    const before = state();
    expect(() => f.projects.commercial.preview({quoteId: quote.id})).toThrow(/blueprint de base/i);
    expect(state()).toEqual(before);
  });
});

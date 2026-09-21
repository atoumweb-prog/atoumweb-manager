import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from '../commercial/CatalogService';
import { QuoteService } from '../commercial/QuoteService';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ProjectService } from './ProjectService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let catalog: CatalogService;
let quotes: QuoteService;
let projects: ProjectService;
let workspaceRoot: string;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-projects-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  catalog = new CatalogService(database);
  quotes = new QuoteService(database, crm);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

function createPublishedTemplate() {
  const template = projects.createTemplate({ name: 'Site vitrine', projectType: 'website', description: 'Modèle site vitrine' });
  const version = template.versions[0];
  const withLot = projects.addTemplateNode(version.id, { type: 'lot', name: 'Structure', sortOrder: 10 });
  const lot = withLot.nodes.find((node) => node.name === 'Structure')!;
  const withModule = projects.addTemplateNode(version.id, { parentId: lot.id, type: 'module', displaySubtype: 'page', name: 'Accueil', sortOrder: 10 });
  const module = withModule.nodes.find((node) => node.name === 'Accueil')!;
  projects.addTemplateNode(version.id, { parentId: module.id, type: 'task', name: 'Créer le Hero', estimatedMinutes: 120, required: true, sortOrder: 10 });
  projects.addTemplateNode(version.id, { parentId: module.id, type: 'task', name: 'Optimiser les images', estimatedMinutes: 60, required: true, sortOrder: 20 });
  return projects.publishTemplateVersion(version.id);
}

function createAcceptedQuote() {
  const organization = crm.createOrganization({ name: 'Société Test Projet' });
  const prospect = crm.createProspect({ organizationId: organization.id, primaryNeed: 'Site vitrine' });
  const service = catalog.create(
    { type: 'service', name: 'Site vitrine', category: 'Création web' },
    {
      priceMode: 'fixed',
      priceCents: 69900,
      prerequisites: ['Logo', 'Textes', 'Photos'],
      description: 'Création du site vitrine',
    },
  );
  catalog.publishVersion(service.versions[0].id);
  const quote = quotes.create({ prospectId: prospect.id, subject: 'Création du site vitrine', prerequisitesText: 'Accès hébergement' });
  quotes.addCatalogLine(quote.id, service.versions[0].id);
  quotes.finalize(quote.id);
  quotes.markSent(quote.id);
  return quotes.accept(quote.id);
}

function createAcceptedSeededVitrineQuote(extraCatalogVersionId?: string) {
  const organization = crm.createOrganization({ name: 'Client Blueprint AtoumWeb' });
  const prospect = crm.createProspect({ organizationId: organization.id, primaryNeed: 'Site vitrine' });
  const quote = quotes.create({ prospectId: prospect.id, subject: 'Site vitrine Blueprint' });
  quotes.addCatalogLine(quote.id, 'atoumweb-vitrine-v1');
  if (extraCatalogVersionId) quotes.addCatalogLine(quote.id, extraCatalogVersionId);
  quotes.finalize(quote.id);
  quotes.markSent(quote.id);
  return quotes.accept(quote.id);
}

describe('ProjectService', () => {
  it('versionne un modèle sans modifier la version publiée précédente', () => {
    const published = createPublishedTemplate();
    const template = projects.getTemplate(published.templateId);
    expect(template.currentVersion?.status).toBe('published');
    expect(template.currentVersion?.nodes).toHaveLength(4);

    const draftV2 = projects.createTemplateVersion(template.id, 'Version 2');
    expect(draftV2.versionNumber).toBe(2);
    expect(draftV2.nodes).toHaveLength(4);
    projects.addTemplateNode(draftV2.id, { type: 'lot', name: 'SEO', sortOrder: 20 });

    const after = projects.getTemplate(template.id);
    const v1 = after.versions.find((version) => version.versionNumber === 1)!;
    const v2 = after.versions.find((version) => version.versionNumber === 2)!;
    expect(v1.nodes).toHaveLength(4);
    expect(v2.nodes).toHaveLength(5);
  });

  it('transforme un devis accepté une seule fois en projet complet', () => {
    const template = createPublishedTemplate();
    const quote = createAcceptedQuote();

    const first = projects.transformQuote({ quoteId: quote.id, templateVersionId: template.id });
    const second = projects.transformQuote({ quoteId: quote.id, templateVersionId: template.id });

    expect(first.id).toBe(second.id);
    expect(first.number).toMatch(/^PRO-\d{4}-001$/);
    expect(first.clientLabel).toBe('Société Test Projet');
    expect(first.nodes).toHaveLength(4);
    expect(first.services).toHaveLength(1);
    expect(first.commercialValueCents).toBe(69900);
    expect(first.contractValueCents).toBe(69900);
    expect(first.estimatedMinutes).toBe(180);
    expect(first.progressPercent).toBe(0);
    expect(first.prerequisites.map((item) => item.label).sort()).toEqual(['Accès hébergement', 'Logo', 'Photos', 'Textes'].sort());
    expect(first.resourceRootPath).toBeTruthy();
    expect(existsSync(join(first.resourceRootPath!, '01 Identité'))).toBe(true);
    expect(existsSync(join(first.resourceRootPath!, '06 Livrables'))).toBe(true);
    expect(projects.listProjects()).toHaveLength(1);
  });

  it('calcule la progression uniquement depuis les tâches obligatoires', () => {
    const template = createPublishedTemplate();
    const quote = createAcceptedQuote();
    const project = projects.transformQuote({ quoteId: quote.id, templateVersionId: template.id });
    const tasks = project.nodes.filter((node) => node.type === 'task');

    const half = projects.updateProjectNode(tasks[0].id, { status: 'done' });
    expect(half.progressPercent).toBe(50);

    const done = projects.updateProjectNode(tasks[1].id, { status: 'done' });
    expect(done.progressPercent).toBe(100);
  });

  it('permet un projet interne sans client externe', () => {
    const template = createPublishedTemplate();
    const internal = projects.createInternal({
      name: 'AtoumWeb Manager',
      projectType: 'internal',
      templateVersionId: template.id,
      notes: 'Développement interne',
    });

    expect(internal.clientAccountId).toBeFalsy();
    expect(internal.clientLabel).toBe('AtoumWeb');
    expect(internal.commercialMode).toBe('internal');
    expect(internal.projectType).toBe('internal');
    expect(internal.nodes).toHaveLength(4);
    expect(existsSync(join(internal.resourceRootPath!, '05 Technique - Sources - Exports'))).toBe(true);
  });

  it('génère automatiquement le blueprint Site vitrine depuis l’offre du devis', () => {
    const quote = createAcceptedSeededVitrineQuote();

    const project = projects.transformQuote({ quoteId: quote.id });

    expect(project.projectType).toBe('website');
    expect(project.templateVersionId).toBe('atoumweb-project-template-vitrine-v1');
    expect(project.nodes.length).toBeGreaterThan(15);

    const hero = project.nodes.find((node) => node.semanticKey === 'pages.home.hero');
    expect(hero).toBeTruthy();
    expect(hero?.name).toBe('Hero');
    expect(hero?.workCard?.fields.map((field) => field.key)).toEqual(expect.arrayContaining(['h1', 'lead', 'cta', 'visual_notes', 'code_notes']));
    expect(hero?.advice?.some((advice) => advice.kind === 'library')).toBe(true);
    expect(hero?.sources).toEqual([
      expect.objectContaining({
        quoteLineId: quote.lines[0]?.id,
        catalogVersionId: 'atoumweb-vitrine-v1',
        templateVersionId: 'atoumweb-project-template-vitrine-v1',
        sourceRole: 'direct',
      }),
    ]);

    const folders = ['01 Identité', '02 Textes', '03 Images & médias', '04 Documents projet', '05 Technique - Sources - Exports', '06 Livrables', '07 Archives'];
    for (const folder of folders) expect(existsSync(join(project.resourceRootPath!, folder))).toBe(true);
  });

  it('conserve la fiche projet indépendante et permet de mettre un module en pause', () => {
    const quote = createAcceptedSeededVitrineQuote();
    const project = projects.transformQuote({ quoteId: quote.id });
    const home = project.nodes.find((node) => node.semanticKey === 'pages.home')!;

    const editedCard = {
      ...(home.workCard ?? { fields: [] }),
      fields: (home.workCard?.fields ?? []).map((field) =>
        field.key === 'page_goal' ? { ...field, value: 'Présenter clairement la proposition de valeur du client.' } : field,
      ),
    };

    const edited = projects.updateProjectNode(home.id, { workCard: editedCard });
    const editedHome = edited.nodes.find((node) => node.id === home.id)!;
    expect(editedHome.workCard?.fields.find((field) => field.key === 'page_goal')?.value)
      .toBe('Présenter clairement la proposition de valeur du client.');

    const paused = projects.setProjectNodePause(home.id, true, 'En attente des textes du client');
    const pausedHome = paused.nodes.find((node) => node.id === home.id)!;
    expect(pausedHome.paused).toBe(true);
    expect(pausedHome.pauseReason).toBe('En attente des textes du client');

    const resumed = projects.setProjectNodePause(home.id, false);
    const resumedHome = resumed.nodes.find((node) => node.id === home.id)!;
    expect(resumedHome.paused).toBe(false);
    expect(resumedHome.pauseReason).toBeNull();

    database.run(
      "UPDATE project_template_nodes SET work_card_json='{\"goal\":\"Modèle modifié après création\",\"fields\":[]}' WHERE id='aw-vitrine-home'",
    );
    const reloaded = projects.getProject(project.id);
    expect(reloaded.nodes.find((node) => node.id === home.id)?.workCard?.goal).not.toBe('Modèle modifié après création');
  });

  it('fusionne un blueprint additionnel dans le bon nœud grâce à la clé sémantique', () => {
    const addon = projects.createTemplate({ name: 'Module Rédaction', projectType: 'website', description: 'Rédaction intégrée aux pages' });
    const draft = addon.versions[0];
    const homeAnchor = projects.addTemplateNode(draft.id, {
      type: 'module',
      displaySubtype: 'page',
      name: 'Accueil',
      semanticKey: 'pages.home',
      required: false,
    }).nodes.find((node) => node.semanticKey === 'pages.home')!;
    projects.addTemplateNode(draft.id, {
      parentId: homeAnchor.id,
      type: 'task',
      name: 'Rédaction de la page Accueil',
      semanticKey: 'pages.home.copywriting',
      estimatedMinutes: 60,
      required: true,
      timeCategory: 'production',
      workCard: {
        goal: 'Rédiger le contenu directement dans le contexte de la page.',
        fields: [
          { key: 'client_source', label: 'Texte client / source', type: 'textarea' },
          { key: 'final_copy', label: 'Texte final', type: 'textarea' },
        ],
      },
    });
    const publishedAddon = projects.publishTemplateVersion(draft.id);

    const service = catalog.create(
      { type: 'service', name: 'Rédaction AtoumWeb test', category: 'Contenu' },
      { priceMode: 'fixed', priceCents: 9900, description: 'Rédaction intégrée au site' },
    );
    const serviceVersion = catalog.publishVersion(service.versions[0].id);
    database.run(
      `INSERT INTO catalog_project_blueprints
       (id,catalog_version_id,template_version_id,role,sort_order,created_at)
       VALUES ('test-addon-writing',?,?,'addon',10,'2026-09-21T00:00:00.000Z')`,
      [serviceVersion.id, publishedAddon.id],
    );

    const quote = createAcceptedSeededVitrineQuote(serviceVersion.id);
    const project = projects.transformQuote({ quoteId: quote.id });

    expect(project.nodes.filter((node) => node.semanticKey === 'pages.home')).toHaveLength(1);
    const home = project.nodes.find((node) => node.semanticKey === 'pages.home')!;
    const writing = project.nodes.find((node) => node.semanticKey === 'pages.home.copywriting')!;
    expect(writing.parentId).toBe(home.id);
    expect(writing.workCard?.fields.map((field) => field.key)).toEqual(['client_source', 'final_copy']);
    expect(writing.sources).toEqual([
      expect.objectContaining({
        catalogVersionId: serviceVersion.id,
        templateVersionId: publishedAddon.id,
        sourceRole: 'direct',
      }),
    ]);
    expect(home.sources.length).toBeGreaterThanOrEqual(2);
  });

  it('empêche une boucle dans l’arbre projet', () => {
    const template = createPublishedTemplate();
    const quote = createAcceptedQuote();
    const project = projects.transformQuote({ quoteId: quote.id, templateVersionId: template.id });
    const lot = project.nodes.find((node) => node.type === 'lot')!;
    const module = project.nodes.find((node) => node.type === 'module')!;

    expect(() => projects.updateProjectNode(lot.id, { parentId: module.id })).toThrow(/boucle/i);
  });
});

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

  it('empêche une boucle dans l’arbre projet', () => {
    const template = createPublishedTemplate();
    const quote = createAcceptedQuote();
    const project = projects.transformQuote({ quoteId: quote.id, templateVersionId: template.id });
    const lot = project.nodes.find((node) => node.type === 'lot')!;
    const module = project.nodes.find((node) => node.type === 'module')!;

    expect(() => projects.updateProjectNode(lot.id, { parentId: module.id })).toThrow(/boucle/i);
  });
});

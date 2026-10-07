import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { createWorkspacePaths } from '../workspace';
import { ProjectService } from './ProjectService';
import { ProjectSiteService } from './ProjectSiteService';

let database: NodeSqliteAdapter;
let projects: ProjectService;
let sites: ProjectSiteService;
let workspaceRoot: string;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-project-sites-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  sites = new ProjectSiteService(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot), sites);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

function createProject(name: string) {
  return projects.createInternal({ name, projectType: 'website' });
}

function addPage(projectId: string, name: string) {
  const detail = projects.addProjectNode(projectId, { type: 'module', displaySubtype: 'page', name });
  return detail.nodes.find((node) => node.name === name && node.displaySubtype === 'page')!;
}

describe('ProjectSiteService', () => {
  it('initialise un ancien Projet web depuis le blueprint vitrine de compatibilité', () => {
    const legacyTemplate = projects.createTemplate({ name: 'Projet standard', projectType: 'web' });
    let legacyVersion = legacyTemplate.versions[0];
    legacyVersion = projects.addTemplateNode(legacyVersion.id, { type: 'task', name: 'Validation de la livraison' });
    const publishedLegacyVersion = projects.publishTemplateVersion(legacyVersion.id);
    const project = projects.createInternal({ name: 'Création de site vitrine', templateVersionId: publishedLegacyVersion.id });
    const crm = new CrmService(database);
    const organization = crm.createOrganization({ name: 'Client historique' });
    const client = crm.createClient({ organizationId: organization.id });
    database.run("UPDATE projects SET project_type='web', client_account_id=? WHERE id=?", [client.id, project.id]);

    const generated = sites.applyBlueprint(project.id);

    expect(generated.templateVersionId).toBe('atoumweb-project-template-vitrine-v1');
    expect(generated.createdSiteIds).toHaveLength(1);
    expect(generated.linkedPageIds).toHaveLength(5);
    expect(sites.list(project.id)).toHaveLength(1);
    expect(sites.listPages(project.id)).toHaveLength(5);
    const refreshed = projects.getProject(project.id);
    expect(refreshed.templateVersionId).toBe(publishedLegacyVersion.id);
    expect(refreshed.nodes.filter((node) => node.displaySubtype === 'page')).toHaveLength(5);
    expect(refreshed.nodes.some((node) => node.semanticKey === 'pages.home')).toBe(true);

    const replay = sites.applyBlueprint(project.id);
    expect(replay.createdSiteIds).toHaveLength(0);
    expect(replay.linkedPageIds).toHaveLength(0);
    expect(sites.list(project.id)).toHaveLength(1);
    expect(sites.listPages(project.id)).toHaveLength(5);
  });

  it('ne substitue pas de structure à un type de Projet sans compatibilité déclarée', () => {
    const template = projects.createTemplate({ name: 'Projet applicatif', projectType: 'application' });
    const published = projects.publishTemplateVersion(template.versions[0].id);
    const project = projects.createInternal({ name: 'Application interne', templateVersionId: published.id });

    const result = sites.applyBlueprint(project.id);

    expect(result.declaredSiteCount).toBe(0);
    expect(result.createdSiteIds).toHaveLength(0);
    expect(sites.list(project.id)).toHaveLength(0);
  });

  it('génère le squelette Sites/Pages du blueprint et peut être rejoué sans doublon', () => {
    const project = projects.createInternal({
      name: 'Projet blueprint vitrine',
      templateVersionId: 'atoumweb-project-template-vitrine-v1',
    });

    const firstSites = sites.list(project.id);
    const firstPages = sites.listPages(project.id);
    expect(firstSites).toHaveLength(1);
    expect(firstPages).toHaveLength(5);
    expect(firstPages).toContainEqual(expect.objectContaining({ role: 'home', desiredPath: '/' }));

    const replay = sites.applyBlueprint(project.id);
    expect(replay.createdSiteIds).toHaveLength(0);
    expect(replay.linkedPageIds).toHaveLength(0);
    expect(replay.preservedSiteIds).toEqual([firstSites[0].id]);
    expect(replay.preservedPageIds).toHaveLength(5);
    expect(sites.list(project.id)).toHaveLength(1);
    expect(sites.listPages(project.id)).toHaveLength(5);
    expect(database.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM activity_log WHERE entity_id=? AND action='project_blueprint_sites_applied'",
      [project.id],
    )?.total).toBe(1);
  });

  it('préserve les changements manuels et les Pages ajoutées lors d’une réapplication', () => {
    const project = projects.createInternal({
      name: 'Projet blueprint modifiable',
      templateVersionId: 'atoumweb-project-template-vitrine-v1',
    });
    const site = sites.list(project.id)[0];
    const homeLink = sites.listPages(project.id).find((page) => page.role === 'home')!;
    sites.update(site.id, { name: 'Nom choisi par Carlos', desiredDomain: 'client.fr' });
    projects.updateProjectNode(homeLink.projectNodeId, { name: 'Bienvenue' });
    const manualPage = addPage(project.id, 'Page ajoutée manuellement');

    sites.applyBlueprint(project.id);

    expect(sites.get(site.id)).toEqual(expect.objectContaining({ name: 'Nom choisi par Carlos', desiredDomain: 'client.fr' }));
    expect(projects.getProject(project.id).nodes.find((node) => node.id === homeLink.projectNodeId)?.name).toBe('Bienvenue');
    expect(projects.getProject(project.id).nodes.some((node) => node.id === manualPage.id)).toBe(true);
    expect(sites.listPages(project.id)).toHaveLength(5);
  });

  it('génère deux Sites distincts avec une Accueil chacun à partir de rôles explicites', () => {
    const template = projects.createTemplate({ name: 'Blueprint multi-sites', projectType: 'website' });
    let version = template.versions[0];
    version = projects.addTemplateNode(version.id, { type: 'module', displaySubtype: 'page', name: 'Accueil principal', semanticKey: 'main.home' });
    version = projects.addTemplateNode(version.id, { type: 'module', displaySubtype: 'page', name: 'Accueil campagne', semanticKey: 'campaign.home' });
    const mainNode = version.nodes.find((node) => node.semanticKey === 'main.home')!;
    const campaignNode = version.nodes.find((node) => node.semanticKey === 'campaign.home')!;
    projects.configureTemplateSites(version.id, [
      { key: 'main', name: 'Site principal', sortOrder: 10, pages: [
        { key: 'home', templateNodeId: mainNode.id, role: 'home', desiredPath: '/', sortOrder: 10 },
      ] },
      { key: 'campaign', name: 'Campagne', sortOrder: 20, pages: [
        { key: 'home', templateNodeId: campaignNode.id, role: 'home', desiredPath: '/', sortOrder: 10 },
      ] },
    ]);
    const published = projects.publishTemplateVersion(version.id);

    const project = projects.createInternal({ name: 'Projet deux Sites', templateVersionId: published.id });
    const generatedSites = sites.list(project.id);
    const links = sites.listPages(project.id);

    expect(generatedSites.map((item) => item.name)).toEqual(expect.arrayContaining(['Site principal', 'Campagne']));
    expect(links).toHaveLength(2);
    expect(links.every((link) => link.role === 'home' && link.desiredPath === '/')).toBe(true);
    expect(new Set(links.map((link) => link.projectSiteId)).size).toBe(2);

    const nextVersion = projects.createTemplateVersion(template.id, 'Nouvelle version');
    expect(database.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM project_template_sites WHERE template_version_id=?', [nextVersion.id],
    )?.total).toBe(2);
    expect(database.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM project_template_site_pages p
       JOIN project_template_sites s ON s.id=p.template_site_id
       JOIN project_template_nodes n ON n.id=p.template_node_id
       WHERE s.template_version_id=? AND n.template_version_id=?`, [nextVersion.id, nextVersion.id],
    )?.total).toBe(2);
  });

  it('gère deux Sites possédant chacun leur propre Page Accueil', () => {
    const project = createProject('Projet multi-sites');
    const homeMain = addPage(project.id, 'Accueil principal');
    const homeLanding = addPage(project.id, 'Accueil campagne');
    const main = sites.create(project.id, { name: 'Site principal', desiredDomain: 'exemple.fr' });
    const landing = sites.create(project.id, { name: 'Landing campagne' });

    sites.linkPage(main.id, homeMain.id, { role: 'home', desiredPath: '/' });
    sites.linkPage(landing.id, homeLanding.id, { role: 'home', desiredPath: '/' });

    expect(sites.list(project.id)).toHaveLength(2);
    expect(sites.listPages(project.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({ projectNodeId: homeMain.id, projectSiteId: main.id, role: 'home', desiredPath: '/' }),
      expect.objectContaining({ projectNodeId: homeLanding.id, projectSiteId: landing.id, role: 'home', desiredPath: '/' }),
    ]));
  });

  it('renomme un Site sans changer son identité ni ses rattachements', () => {
    const project = createProject('Projet renommage');
    const home = addPage(project.id, 'Accueil');
    const site = sites.create(project.id, { name: 'Nom initial' });
    sites.linkPage(site.id, home.id, { role: 'home' });

    const renamed = sites.update(site.id, { name: 'Nom final', desiredDomain: 'final.fr' });

    expect(renamed.id).toBe(site.id);
    expect(renamed.name).toBe('Nom final');
    expect(renamed.desiredDomain).toBe('final.fr');
    expect(sites.listPages(project.id)).toEqual([
      expect.objectContaining({ projectNodeId: home.id, projectSiteId: site.id }),
    ]);
  });

  it('refuse les rattachements incohérents ou les nœuds qui ne sont pas des Pages', () => {
    const projectA = createProject('Projet A');
    const projectB = createProject('Projet B');
    const siteA = sites.create(projectA.id, { name: 'Site A' });
    const pageB = addPage(projectB.id, 'Accueil B');
    const task = projects.addProjectNode(projectA.id, { type: 'task', name: 'Tâche simple' })
      .nodes.find((node) => node.name === 'Tâche simple')!;

    expect(() => sites.linkPage(siteA.id, pageB.id)).toThrow(/même Projet/i);
    expect(() => sites.linkPage(siteA.id, task.id)).toThrow(/type Page/i);
  });

  it('empêche de retyper silencieusement une Page déjà rattachée à un Site', () => {
    const project = createProject('Projet protection');
    const page = addPage(project.id, 'Accueil');
    const site = sites.create(project.id, { name: 'Site protégé' });
    sites.linkPage(site.id, page.id, { role: 'home' });

    expect(() => projects.updateProjectNode(page.id, { displaySubtype: null })).toThrow(/rattachée à un Site/i);
    expect(() => projects.updateProjectNode(page.id, { type: 'task' })).toThrow(/rattachée à un Site/i);
  });

  it('archive un Site sans supprimer son identité ni ses Pages et peut le réactiver', () => {
    const project = createProject('Projet archive');
    const page = addPage(project.id, 'Accueil');
    const site = sites.create(project.id, { name: 'Site à archiver' });
    sites.linkPage(site.id, page.id, { role: 'home' });

    const archived = sites.setArchived(site.id, true);
    expect(archived.archivedAt).toBeTruthy();
    expect(sites.list(project.id)).toHaveLength(0);
    expect(sites.list(project.id, true)).toEqual([expect.objectContaining({ id: site.id })]);
    expect(sites.listPages(project.id)).toEqual([expect.objectContaining({ projectNodeId: page.id, projectSiteId: site.id })]);

    const reactivated = sites.setArchived(site.id, false);
    expect(reactivated.archivedAt).toBeNull();
    expect(sites.list(project.id)).toHaveLength(1);
  });

  it('réserve / à l’accueil et force ce slug quand le rôle devient Accueil', () => {
    const project = createProject('Projet chemins');
    const first = addPage(project.id, 'Accueil');
    const second = addPage(project.id, 'Contact');
    const site = sites.create(project.id, { name: 'Site unique' });

    const home = sites.linkPage(site.id, first.id, { role: 'home', desiredPath: '/ancien-slug' });
    expect(home.desiredPath).toBe('/');

    expect(() => sites.linkPage(site.id, second.id, { role: 'home' })).toThrow(/déjà une Page d’accueil/i);
    expect(() => sites.linkPage(site.id, second.id, { role: 'standard', desiredPath: '/' })).toThrow(/réservé/i);
  });
});

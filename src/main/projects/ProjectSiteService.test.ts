import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
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
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  sites = new ProjectSiteService(database);
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

  it('refuse deux chemins identiques et deux Pages d’accueil dans un même Site', () => {
    const project = createProject('Projet chemins');
    const first = addPage(project.id, 'Accueil');
    const second = addPage(project.id, 'Contact');
    const site = sites.create(project.id, { name: 'Site unique' });

    sites.linkPage(site.id, first.id, { role: 'home' });

    expect(() => sites.linkPage(site.id, second.id, { role: 'home' })).toThrow(/déjà une Page d’accueil/i);
    expect(() => sites.linkPage(site.id, second.id, { role: 'standard', desiredPath: '/' })).toThrow(/chemin/i);
  });
});

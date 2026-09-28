import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  PROJECT_SITE_PAGE_ROLES,
  type ProjectSite,
  type ProjectSiteInput,
  type ProjectSitePage,
  type ProjectSitePageInput,
  type ProjectSitePageRole,
} from '../../shared/projects';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface ProjectSiteRow extends Record<string, unknown> {
  id: string; project_id: string; name: string; desired_domain: string | null;
  created_at: string; updated_at: string; archived_at: string | null;
}
interface ProjectSitePageRow extends Record<string, unknown> {
  project_node_id: string; project_site_id: string; role: ProjectSitePageRole;
  desired_path: string | null; created_at: string; updated_at: string;
}
interface ProjectNodeIdentityRow extends Record<string, unknown> {
  id: string; project_id: string; node_type: string; display_subtype: string | null; name: string;
}

export class ProjectSiteService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(projectId: string, includeArchived = false): ProjectSite[] {
    this.assertProject(projectId);
    return this.database.all<ProjectSiteRow>(
      `SELECT * FROM project_sites
       WHERE project_id=? ${includeArchived ? '' : 'AND archived_at IS NULL'}
       ORDER BY archived_at IS NOT NULL, created_at ASC, name COLLATE NOCASE ASC`,
      [projectId],
    ).map((row) => this.mapSite(row));
  }

  get(id: string): ProjectSite {
    const row = this.getSiteRow(id);
    if (!row) throw new Error('Site projet introuvable.');
    return this.mapSite(row);
  }

  create(projectId: string, input: ProjectSiteInput): ProjectSite {
    this.assertProject(projectId);
    const name = clean(input.name);
    if (!name) throw new Error('Nom du site requis.');
    this.assertActiveSiteNameAvailable(projectId, name);
    const id = randomUUID(); const now = nowIso();
    this.database.run(
      `INSERT INTO project_sites
       (id,project_id,name,desired_domain,created_at,updated_at,archived_at)
       VALUES (?,?,?,?,?,?,NULL)`,
      [id, projectId, name, clean(input.desiredDomain), now, now],
    );
    this.writeActivity(projectId, 'project_site_created', `Site créé : ${name}`, { siteId: id });
    return this.get(id);
  }

  update(id: string, input: Partial<ProjectSiteInput>): ProjectSite {
    const row = this.getSiteRow(id);
    if (!row) throw new Error('Site projet introuvable.');
    const name = input.name === undefined ? row.name : clean(input.name);
    if (!name) throw new Error('Nom du site requis.');
    if (!row.archived_at) this.assertActiveSiteNameAvailable(row.project_id, name, id);
    this.database.run(
      'UPDATE project_sites SET name=?, desired_domain=?, updated_at=? WHERE id=?',
      [name, input.desiredDomain === undefined ? row.desired_domain : clean(input.desiredDomain), nowIso(), id],
    );
    this.writeActivity(row.project_id, 'project_site_updated', `Site mis à jour : ${name}`, { siteId: id });
    return this.get(id);
  }

  setArchived(id: string, archived: boolean): ProjectSite {
    const row = this.getSiteRow(id);
    if (!row) throw new Error('Site projet introuvable.');
    if (!archived) this.assertActiveSiteNameAvailable(row.project_id, row.name, id);
    this.database.run('UPDATE project_sites SET archived_at=?, updated_at=? WHERE id=?', [archived ? nowIso() : null, nowIso(), id]);
    this.writeActivity(
      row.project_id,
      archived ? 'project_site_archived' : 'project_site_reactivated',
      archived ? `Site archivé : ${row.name}` : `Site réactivé : ${row.name}`,
      { siteId: id },
    );
    return this.get(id);
  }

  listPages(projectId: string): ProjectSitePage[] {
    this.assertProject(projectId);
    return this.database.all<ProjectSitePageRow>(
      `SELECT psp.* FROM project_site_pages psp
       JOIN project_nodes pn ON pn.id=psp.project_node_id
       WHERE pn.project_id=? ORDER BY psp.created_at ASC`,
      [projectId],
    ).map((row) => this.mapPage(row));
  }

  linkPage(projectSiteId: string, projectNodeId: string, input: ProjectSitePageInput = {}): ProjectSitePage {
    const site = this.getSiteRow(projectSiteId);
    if (!site) throw new Error('Site projet introuvable.');
    if (site.archived_at) throw new Error('Impossible de rattacher une page à un site archivé.');
    const node = this.getPageNode(projectNodeId);
    if (node.project_id !== site.project_id) throw new Error('La Page et le Site doivent appartenir au même Projet.');

    const role = this.normalizeRole(input.role);
    const desiredPath = this.normalizePath(input.desiredPath, role);
    this.assertPageDestinationAvailable(projectSiteId, projectNodeId, role, desiredPath);
    const existing = this.database.get<ProjectSitePageRow>('SELECT * FROM project_site_pages WHERE project_node_id=?', [projectNodeId]);
    const now = nowIso();

    if (existing) {
      this.database.run(
        'UPDATE project_site_pages SET project_site_id=?, role=?, desired_path=?, updated_at=? WHERE project_node_id=?',
        [projectSiteId, role, desiredPath, now, projectNodeId],
      );
    } else {
      this.database.run(
        `INSERT INTO project_site_pages
         (project_node_id,project_site_id,role,desired_path,created_at,updated_at)
         VALUES (?,?,?,?,?,?)`,
        [projectNodeId, projectSiteId, role, desiredPath, now, now],
      );
    }

    this.writeActivity(
      site.project_id,
      existing ? 'project_page_relinked' : 'project_page_linked',
      `Page rattachée au site ${site.name} : ${node.name}`,
      { siteId: projectSiteId, pageNodeId: projectNodeId, role, desiredPath },
    );
    return this.getPageLink(projectNodeId);
  }

  unlinkPage(projectNodeId: string): void {
    const node = this.database.get<ProjectNodeIdentityRow>(
      'SELECT id,project_id,node_type,display_subtype,name FROM project_nodes WHERE id=?',
      [projectNodeId],
    );
    if (!node) throw new Error('Page projet introuvable.');
    const existing = this.database.get<ProjectSitePageRow>('SELECT * FROM project_site_pages WHERE project_node_id=?', [projectNodeId]);
    if (!existing) return;
    this.database.run('DELETE FROM project_site_pages WHERE project_node_id=?', [projectNodeId]);
    this.writeActivity(node.project_id, 'project_page_unlinked', `Page détachée de son site : ${node.name}`, {
      siteId: existing.project_site_id, pageNodeId: projectNodeId,
    });
  }

  private getPageLink(projectNodeId: string): ProjectSitePage {
    const row = this.database.get<ProjectSitePageRow>('SELECT * FROM project_site_pages WHERE project_node_id=?', [projectNodeId]);
    if (!row) throw new Error('Rattachement de Page introuvable.');
    return this.mapPage(row);
  }

  private getPageNode(projectNodeId: string): ProjectNodeIdentityRow {
    const node = this.database.get<ProjectNodeIdentityRow>(
      'SELECT id,project_id,node_type,display_subtype,name FROM project_nodes WHERE id=?',
      [projectNodeId],
    );
    if (!node) throw new Error('Page projet introuvable.');
    if (node.node_type !== 'module' || node.display_subtype !== 'page') {
      throw new Error('Seul un nœud Projet de type Page peut être rattaché à un Site.');
    }
    return node;
  }

  private normalizeRole(value?: ProjectSitePageRole | null): ProjectSitePageRole {
    const role = value ?? 'standard';
    if (!PROJECT_SITE_PAGE_ROLES.includes(role)) throw new Error('Rôle de Page invalide.');
    return role;
  }

  private normalizePath(value: string | null | undefined, role: ProjectSitePageRole): string | null {
    const path = clean(value);
    if (!path) return role === 'home' ? '/' : null;
    if (/[?#]/.test(path)) throw new Error('Le chemin souhaité doit être un chemin de Page sans query string ni ancre.');
    if (path === '/') return '/';
    return '/' + path.replace(/^\/+|\/+$/g, '');
  }

  private assertPageDestinationAvailable(siteId: string, pageNodeId: string, role: ProjectSitePageRole, desiredPath: string | null): void {
    if (role === 'home') {
      const existingHome = this.database.get<{ project_node_id: string }>(
        "SELECT project_node_id FROM project_site_pages WHERE project_site_id=? AND role='home' AND project_node_id<>?",
        [siteId, pageNodeId],
      );
      if (existingHome) throw new Error('Ce Site possède déjà une Page d’accueil.');
    }
    if (desiredPath) {
      const existingPath = this.database.get<{ project_node_id: string }>(
        'SELECT project_node_id FROM project_site_pages WHERE project_site_id=? AND desired_path=? AND project_node_id<>?',
        [siteId, desiredPath, pageNodeId],
      );
      if (existingPath) throw new Error('Ce chemin est déjà utilisé par une autre Page du Site.');
    }
  }

  private assertProject(projectId: string): void {
    if (!this.database.get<{ id: string }>('SELECT id FROM projects WHERE id=?', [projectId])) throw new Error('Projet introuvable.');
  }

  private getSiteRow(id: string): ProjectSiteRow | undefined {
    return this.database.get<ProjectSiteRow>('SELECT * FROM project_sites WHERE id=?', [id]);
  }

  private assertActiveSiteNameAvailable(projectId: string, name: string, ignoreId?: string): void {
    const duplicate = this.database.get<{ id: string }>(
      `SELECT id FROM project_sites
       WHERE project_id=? AND name=? COLLATE NOCASE AND archived_at IS NULL ${ignoreId ? 'AND id<>?' : ''}
       LIMIT 1`,
      ignoreId ? [projectId, name, ignoreId] : [projectId, name],
    );
    if (duplicate) throw new Error('Un Site actif porte déjà ce nom dans ce Projet.');
  }

  private mapSite(row: ProjectSiteRow): ProjectSite {
    return {
      id: row.id, projectId: row.project_id, name: row.name, desiredDomain: row.desired_domain,
      createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at,
    };
  }

  private mapPage(row: ProjectSitePageRow): ProjectSitePage {
    return {
      projectNodeId: row.project_node_id, projectSiteId: row.project_site_id, role: row.role,
      desiredPath: row.desired_path, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  private writeActivity(projectId: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      ['project', projectId, action, summary, JSON.stringify(metadata), nowIso()],
    );
  }
}

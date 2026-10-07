import { ProjectBlueprintCompositionService } from './ProjectBlueprintCompositionService';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  PROJECT_SITE_PAGE_ROLES,
  type ProjectBlueprintGenerationResult,
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
interface TemplateSiteRow extends Record<string, unknown> {
  template_version_id: string; blueprint_key: string; name: string; desired_domain: string | null;
}
interface TemplateSitePageRow extends Record<string, unknown> {
  site_blueprint_key: string; page_blueprint_key: string; template_node_id: string;
  role: ProjectSitePageRole; desired_path: string | null;
}
interface TemplateNodeRow extends Record<string, unknown> {
  id: string; parent_id: string | null; node_type: string; display_subtype: string | null;
  name: string; description: string | null; sort_order: number; estimated_minutes: number | null;
  is_required: number; initial_status: string; time_category: string | null; semantic_key: string | null;
  work_card_json: string | null; advice_json: string | null;
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
       WHERE pn.project_id=? AND pn.archived_at IS NULL ORDER BY psp.created_at ASC`,
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

  applyBlueprint(projectId: string, templateVersionId?: string | null, manageTransaction = true): ProjectBlueprintGenerationResult {
    if (this.database.get<{commercial_state:string}>('SELECT commercial_state FROM projects WHERE id=?',[projectId])?.commercial_state==='provisional') {
      throw new Error('Projet prévisionnel : utiliser Synchroniser le périmètre commercial.');
    }
    if (this.database.get('SELECT project_id FROM project_blueprint_plans WHERE project_id=?', [projectId])) {
      return new ProjectBlueprintCompositionService(this.database, this).replay(projectId, templateVersionId, manageTransaction);
    }
    const project = this.database.get<{ id: string; project_type: string; template_version_id: string | null }>(
      'SELECT id,project_type,template_version_id FROM projects WHERE id=?',
      [projectId],
    );
    if (!project) throw new Error('Projet introuvable.');
    let versionId = clean(templateVersionId) ?? project.template_version_id;
    if (!versionId) throw new Error('Ce Projet ne possède pas de blueprint à appliquer.');
    this.assertFrozenTemplateVersion(versionId);

    let definitions = this.loadTemplateSites(versionId);
    if (!definitions.length) {
      const compatibility = this.database.get<{ template_version_id: string }>(
        'SELECT template_version_id FROM project_type_site_blueprints WHERE project_type=?',
        [project.project_type],
      );
      if (compatibility) {
        versionId = compatibility.template_version_id;
        this.assertFrozenTemplateVersion(versionId);
        definitions = this.loadTemplateSites(versionId);
      }
    }
    const pages = this.loadTemplateSitePages(versionId);
    const result: ProjectBlueprintGenerationResult = {
      projectId, templateVersionId: versionId, declaredSiteCount: definitions.length,
      createdSiteIds: [], linkedPageIds: [],
      preservedSiteIds: [], preservedPageIds: [],
    };
    const sitesByKey = new Map<string, string>();
    const now = nowIso();

    if (manageTransaction) this.database.exec('BEGIN IMMEDIATE;');
    try {
      for (const definition of definitions) {
        const binding = this.database.get<{ project_site_id: string }>(
          `SELECT project_site_id FROM project_blueprint_site_bindings
           WHERE project_id=? AND template_version_id=? AND blueprint_key=?`,
          [projectId, versionId, definition.blueprint_key],
        );
        if (binding) {
          sitesByKey.set(definition.blueprint_key, binding.project_site_id);
          result.preservedSiteIds.push(binding.project_site_id);
          continue;
        }
        const created = this.create(projectId, { name: definition.name, desiredDomain: definition.desired_domain });
        this.database.run(
          `INSERT INTO project_blueprint_site_bindings
           (project_id,template_version_id,blueprint_key,project_site_id,created_at) VALUES (?,?,?,?,?)`,
          [projectId, versionId, definition.blueprint_key, created.id, now],
        );
        sitesByKey.set(definition.blueprint_key, created.id);
        result.createdSiteIds.push(created.id);
      }

      for (const definition of pages) {
        const existingBinding = this.database.get<{ project_node_id: string }>(
          `SELECT project_node_id FROM project_blueprint_page_bindings
           WHERE project_id=? AND template_version_id=? AND site_blueprint_key=? AND page_blueprint_key=?`,
          [projectId, versionId, definition.site_blueprint_key, definition.page_blueprint_key],
        );
        if (existingBinding) {
          result.preservedPageIds.push(existingBinding.project_node_id);
          continue;
        }
        const node = { id: this.ensureProjectNode(projectId, definition.template_node_id, now) };
        const existingLink = this.database.get<ProjectSitePageRow>(
          'SELECT * FROM project_site_pages WHERE project_node_id=?',
          [node.id],
        );
        if (!existingLink) {
          const siteId = sitesByKey.get(definition.site_blueprint_key);
          if (!siteId) throw new Error(`Le Site blueprint ${definition.site_blueprint_key} est introuvable.`);
          this.linkPage(siteId, node.id, { role: definition.role, desiredPath: definition.desired_path });
          result.linkedPageIds.push(node.id);
        } else {
          result.preservedPageIds.push(node.id);
        }
        this.database.run(
          `INSERT INTO project_blueprint_page_bindings
           (project_id,template_version_id,site_blueprint_key,page_blueprint_key,project_node_id,created_at)
           VALUES (?,?,?,?,?,?)`,
          [projectId, versionId, definition.site_blueprint_key, definition.page_blueprint_key, node.id, now],
        );
      }
      if (result.createdSiteIds.length || result.linkedPageIds.length) {
        this.writeActivity(projectId, 'project_blueprint_sites_applied', 'Structure Sites / Pages du blueprint appliquée', {
          templateVersionId: versionId,
          createdSites: result.createdSiteIds.length,
          linkedPages: result.linkedPageIds.length,
        });
      }
      if (manageTransaction) this.database.exec('COMMIT;');
      return result;
    } catch (error) {
      if (manageTransaction) this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  private assertFrozenTemplateVersion(versionId: string): void {
    const version = this.database.get<{ id: string; status: string }>(
      'SELECT id,status FROM project_template_versions WHERE id=?',
      [versionId],
    );
    if (!version || version.status === 'draft') throw new Error('Le blueprint à appliquer doit être une version figée.');
  }

  private loadTemplateSites(versionId: string): TemplateSiteRow[] {
    return this.database.all<TemplateSiteRow>(
      `SELECT template_version_id,blueprint_key,name,desired_domain
       FROM project_template_sites WHERE template_version_id=? ORDER BY sort_order,created_at`,
      [versionId],
    );
  }

  private loadTemplateSitePages(versionId: string): TemplateSitePageRow[] {
    return this.database.all<TemplateSitePageRow>(
      `SELECT pts.blueprint_key AS site_blueprint_key,ptsp.blueprint_key AS page_blueprint_key,
              ptsp.template_node_id,ptsp.role,ptsp.desired_path
       FROM project_template_site_pages ptsp
       JOIN project_template_sites pts ON pts.id=ptsp.template_site_id
       WHERE pts.template_version_id=? ORDER BY pts.sort_order,ptsp.sort_order,ptsp.created_at`,
      [versionId],
    );
  }

  private ensureProjectNode(projectId: string, templateNodeId: string, now: string): string {
    const sourced = this.database.get<{ id: string }>(
      'SELECT id FROM project_nodes WHERE project_id=? AND source_template_node_id=?',
      [projectId, templateNodeId],
    );
    if (sourced) return sourced.id;

    const templateNode = this.database.get<TemplateNodeRow>('SELECT * FROM project_template_nodes WHERE id=?', [templateNodeId]);
    if (!templateNode) throw new Error('Un nœud déclaré par le blueprint est introuvable.');
    if (templateNode.semantic_key) {
      const semantic = this.database.get<{ id: string }>(
        'SELECT id FROM project_nodes WHERE project_id=? AND semantic_key=?',
        [projectId, templateNode.semantic_key],
      );
      if (semantic) return semantic.id;
    }

    const parentId = templateNode.parent_id ? this.ensureProjectNode(projectId, templateNode.parent_id, now) : null;
    const id = randomUUID();
    this.database.run(
      `INSERT INTO project_nodes (
         id,project_id,parent_id,source_template_node_id,node_type,display_subtype,name,description,sort_order,
         estimated_minutes,is_required,status,time_category,created_at,updated_at,semantic_key,work_card_json,advice_json
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, projectId, parentId, templateNode.id, templateNode.node_type, templateNode.display_subtype,
        templateNode.name, templateNode.description, templateNode.sort_order, templateNode.estimated_minutes,
        templateNode.is_required, templateNode.initial_status, templateNode.time_category, now, now,
        templateNode.semantic_key, templateNode.work_card_json, templateNode.advice_json,
      ],
    );
    return id;
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
    if (role === 'home') return '/';
    const path = clean(value);
    if (!path) return null;
    if (/[?#]/.test(path)) throw new Error('Le slug doit être un chemin de Page sans query string ni ancre.');
    if (path === '/') throw new Error('Le chemin / est réservé à la Page d’accueil.');
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

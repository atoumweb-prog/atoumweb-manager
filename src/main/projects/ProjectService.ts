import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import {
  PROJECT_COMMERCIAL_MODES,
  PROJECT_NODE_STATUSES,
  PROJECT_NODE_TYPES,
  PROJECT_PREREQUISITE_STATUSES,
  PROJECT_STATUSES,
  type InternalProjectInput,
  type ProjectCommercialMode,
  type ProjectCompanionAdvice,
  type ProjectDetail,
  type ProjectFilters,
  type ProjectNode,
  type ProjectNodeInput,
  type ProjectNodeSource,
  type ProjectNodeStatus,
  type ProjectPrerequisite,
  type ProjectPrerequisiteInput,
  type ProjectPrerequisiteStatus,
  type ProjectServiceSnapshot,
  type ProjectStatus,
  type ProjectSummary,
  type ProjectTemplateDetail,
  type ProjectTemplateInput,
  type ProjectTemplateNode,
  type ProjectTemplateNodeInput,
  type ProjectTemplateSummary,
  type ProjectTemplateVersion,
  type ProjectWorkCard,
  type TransformQuoteToProjectInput,
} from '../../shared/projects';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseJsonObject = <T>(value?: string | null): T | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    return null;
  }
};

const parseJsonArray = <T>(value?: string | null): T[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
};

interface TemplateRow extends Record<string, unknown> {
  id: string; name: string; project_type: string; status: ProjectTemplateSummary['status']; created_at: string; updated_at: string; archived_at: string | null;
}
interface TemplateVersionRow extends Record<string, unknown> {
  id: string; template_id: string; version_number: number; status: ProjectTemplateVersion['status']; description: string | null; published_at: string | null; created_at: string;
}
interface TemplateNodeRow extends Record<string, unknown> {
  id: string; template_version_id: string; parent_id: string | null; node_type: ProjectTemplateNode['type']; display_subtype: string | null; name: string; description: string | null; sort_order: number; estimated_minutes: number | null; is_required: number; initial_status: ProjectNodeStatus; time_category: string | null; created_at: string;
  semantic_key: string | null; work_card_json: string | null; advice_json: string | null;
}
interface ProjectRow extends Record<string, unknown> {
  id: string; project_number: string; client_account_id: string | null; source_quote_id: string | null; template_version_id: string | null;
  name: string; project_type: string; status: ProjectStatus; commercial_mode: ProjectCommercialMode; start_date: string | null; target_date: string | null;
  commercial_value_cents: number; contract_value_cents: number; resource_root_path: string | null; notes: string | null; created_at: string; updated_at: string; completed_at: string | null; archived_at: string | null;
}
interface ProjectNodeRow extends Record<string, unknown> {
  id: string; project_id: string; parent_id: string | null; source_template_node_id: string | null; node_type: ProjectNode['type']; display_subtype: string | null; name: string; description: string | null; sort_order: number; estimated_minutes: number | null; is_required: number; status: ProjectNodeStatus; time_category: string | null; created_at: string; updated_at: string;
  semantic_key: string | null; work_card_json: string | null; advice_json: string | null; is_paused: number; pause_reason: string | null;
}
interface ProjectServiceRow extends Record<string, unknown> {
  id: string; project_id: string; source_quote_line_id: string | null; catalog_item_id: string | null; catalog_version_id: string | null; label: string; snapshot_json: string | null; catalog_value_cents: number; contract_value_cents: number; created_at: string;
}
interface PrerequisiteRow extends Record<string, unknown> {
  id: string; project_id: string; label: string; description: string | null; status: ProjectPrerequisiteStatus; is_required: number; sort_order: number; requested_at: string | null; received_at: string | null; validated_at: string | null; created_at: string; updated_at: string;
}
interface QuoteProjectRow extends Record<string, unknown> {
  id: string; quote_number: string; status: string; subject: string; client_account_id: string | null; accepted_client_account_id: string | null; catalog_value_cents: number; contract_value_cents: number; prerequisites_text: string | null; project_id: string | null;
}
interface QuoteLineProjectRow extends Record<string, unknown> {
  id: string; catalog_item_id: string | null; catalog_version_id: string | null; label: string; snapshot_json: string | null; catalog_line_value_cents: number; contract_line_value_cents: number;
}

interface BlueprintLinkRow extends Record<string, unknown> {
  id: string;
  catalog_version_id: string;
  template_version_id: string;
  role: 'base' | 'addon';
  sort_order: number;
}

interface ProjectNodeSourceRow extends Record<string, unknown> {
  id: string;
  project_node_id: string;
  quote_line_id: string | null;
  catalog_version_id: string | null;
  template_version_id: string | null;
  source_role: ProjectNodeSource['sourceRole'];
  created_at: string;
}

interface BlueprintContribution {
  templateVersionId: string;
  quoteLineId: string | null;
  catalogVersionId: string | null;
  sourceRole: ProjectNodeSource['sourceRole'];
}


export class ProjectService {
  constructor(private readonly database: DatabaseAdapter, private readonly workspace: WorkspacePaths) {}

  listTemplates(): ProjectTemplateSummary[] {
    return this.database.all<TemplateRow>('SELECT * FROM project_templates ORDER BY name COLLATE NOCASE').map((row) => {
      const versions = this.getTemplateVersions(row.id);
      const currentVersion = versions.find((version) => version.status === 'published') ?? versions.find((version) => version.status === 'draft') ?? versions[0] ?? null;
      return { id: row.id, name: row.name, projectType: row.project_type, status: row.status, currentVersion, createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at };
    });
  }

  getTemplate(id: string): ProjectTemplateDetail {
    const summary = this.listTemplates().find((template) => template.id === id);
    if (!summary) throw new Error('Modèle de projet introuvable.');
    return { ...summary, versions: this.getTemplateVersions(id) };
  }

  createTemplate(input: ProjectTemplateInput): ProjectTemplateDetail {
    const name = clean(input.name); const projectType = clean(input.projectType);
    if (!name || !projectType) throw new Error('Nom et type de projet requis.');
    const id = randomUUID(); const versionId = randomUUID(); const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('INSERT INTO project_templates (id,name,project_type,status,created_at,updated_at) VALUES (?,?,?,\'active\',?,?)', [id, name, projectType, now, now]);
      this.database.run('INSERT INTO project_template_versions (id,template_id,version_number,status,description,created_at) VALUES (?,?,1,\'draft\',?,?)', [versionId, id, clean(input.description), now]);
      this.writeActivity('project_template', id, 'project_template_created', `Modèle créé : ${name}`);
      this.database.exec('COMMIT;');
    } catch (error) { this.database.exec('ROLLBACK;'); throw error; }
    return this.getTemplate(id);
  }

  createTemplateVersion(templateId: string, description?: string | null): ProjectTemplateVersion {
    const template = this.getTemplate(templateId);
    if (template.versions.some((version) => version.status === 'draft')) throw new Error('Ce modèle possède déjà une version brouillon.');
    const previous = template.versions[0];
    const versionNumber = (previous?.versionNumber ?? 0) + 1;
    const id = randomUUID(); const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('INSERT INTO project_template_versions (id,template_id,version_number,status,description,created_at) VALUES (?,?,?,\'draft\',?,?)', [id, templateId, versionNumber, clean(description) ?? previous?.description ?? null, now]);
      if (previous) this.copyTemplateNodes(previous.id, id, now);
      this.database.run('UPDATE project_templates SET updated_at=? WHERE id=?', [now, templateId]);
      this.writeActivity('project_template', templateId, 'project_template_version_created', `Version v${versionNumber} créée`);
      this.database.exec('COMMIT;');
    } catch (error) { this.database.exec('ROLLBACK;'); throw error; }
    return this.getTemplateVersion(id);
  }

  publishTemplateVersion(versionId: string): ProjectTemplateVersion {
    const target = this.getTemplateVersion(versionId);
    if (target.status === 'published') return target;
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('UPDATE project_template_versions SET status=\'retired\' WHERE template_id=? AND status=\'published\' AND id<>?', [target.templateId, target.id]);
      this.database.run('UPDATE project_template_versions SET status=\'published\', published_at=? WHERE id=?', [now, target.id]);
      this.database.run('UPDATE project_templates SET updated_at=? WHERE id=?', [now, target.templateId]);
      this.writeActivity('project_template', target.templateId, 'project_template_version_published', `Version v${target.versionNumber} publiée`);
      this.database.exec('COMMIT;');
    } catch (error) { this.database.exec('ROLLBACK;'); throw error; }
    return this.getTemplateVersion(versionId);
  }

  addTemplateNode(versionId: string, input: ProjectTemplateNodeInput): ProjectTemplateVersion {
    const version = this.getTemplateVersion(versionId);
    if (version.status !== 'draft') throw new Error('Une version publiée est figée. Crée une nouvelle version.');
    this.validateNodeInput(input);
    if (input.parentId) {
      const parent = this.database.get<{ template_version_id: string }>('SELECT template_version_id FROM project_template_nodes WHERE id=?', [input.parentId]);
      if (!parent || parent.template_version_id !== versionId) throw new Error('Parent invalide.');
    }
    const now = nowIso();
    this.database.run(
      `INSERT INTO project_template_nodes (
         id,template_version_id,parent_id,node_type,display_subtype,name,description,sort_order,estimated_minutes,
         is_required,initial_status,time_category,created_at,semantic_key,work_card_json,advice_json
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        randomUUID(), versionId, input.parentId ?? null, input.type, clean(input.displaySubtype), clean(input.name),
        clean(input.description), input.sortOrder ?? this.nextTemplateNodeOrder(versionId, input.parentId ?? null),
        input.estimatedMinutes ?? null, input.required === false ? 0 : 1, input.initialStatus ?? 'todo',
        clean(input.timeCategory), now, clean(input.semanticKey), input.workCard ? JSON.stringify(input.workCard) : null,
        input.advice?.length ? JSON.stringify(input.advice) : null,
      ],
    );
    return this.getTemplateVersion(versionId);
  }

  removeTemplateNode(nodeId: string): ProjectTemplateVersion {
    const row = this.database.get<{ template_version_id: string }>('SELECT template_version_id FROM project_template_nodes WHERE id=?', [nodeId]);
    if (!row) throw new Error('Nœud de modèle introuvable.');
    const version = this.getTemplateVersion(row.template_version_id);
    if (version.status !== 'draft') throw new Error('Une version publiée est figée.');
    this.database.run('DELETE FROM project_template_nodes WHERE id=?', [nodeId]);
    return this.getTemplateVersion(row.template_version_id);
  }

  listProjects(filters: ProjectFilters = {}): ProjectSummary[] {
    const where: string[] = []; const params: SqlValue[] = [];
    if (filters.status) { where.push('status=?'); params.push(filters.status); }
    if (clean(filters.clientAccountId)) { where.push('client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectType)) { where.push('project_type=?'); params.push(clean(filters.projectType) as string); }
    if (filters.commercialMode) { where.push('commercial_mode=?'); params.push(filters.commercialMode); }
    let rows = this.database.all<ProjectRow>(`SELECT * FROM projects ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC`, params).map((row) => this.mapProjectSummary(row));
    const needle = clean(filters.search)?.toLocaleLowerCase('fr-FR');
    if (needle) rows = rows.filter((project) => [project.number, project.name, project.clientLabel].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle)));
    return rows;
  }

  getProject(id: string): ProjectDetail {
    const row = this.database.get<ProjectRow>('SELECT * FROM projects WHERE id=?', [id]);
    if (!row) throw new Error('Projet introuvable.');
    return {
      ...this.mapProjectSummary(row),
      notes: row.notes,
      nodes: this.getProjectNodes(id),
      services: this.getProjectServices(id),
      prerequisites: this.getPrerequisites(id),
    };
  }

  transformQuote(input: TransformQuoteToProjectInput): ProjectDetail {
    const existing = this.database.get<{ id: string }>('SELECT id FROM projects WHERE source_quote_id=?', [input.quoteId]);
    if (existing) return this.getProject(existing.id);

    const quote = this.database.get<QuoteProjectRow>(
      'SELECT id,quote_number,status,subject,client_account_id,accepted_client_account_id,catalog_value_cents,contract_value_cents,prerequisites_text,project_id FROM quotes WHERE id=?',
      [input.quoteId],
    );
    if (!quote) throw new Error('Devis introuvable.');
    if (quote.project_id) return this.getProject(quote.project_id);
    if (quote.status !== 'accepted') throw new Error('Le devis doit être accepté avant création du projet.');

    const clientId = quote.accepted_client_account_id ?? quote.client_account_id;
    if (!clientId) throw new Error('Le devis accepté doit être rattaché à un Client.');

    const blueprintPlan = this.resolveBlueprintPlan(input.quoteId, clean(input.templateVersionId));
    const templateVersion = this.getTemplateVersion(blueprintPlan.base.templateVersionId);
    if (templateVersion.status !== 'published') throw new Error('Le blueprint principal doit être publié.');
    const template = this.getTemplate(templateVersion.templateId);

    const name = clean(input.name) ?? quote.subject;
    const mode = input.commercialMode ?? this.inferCommercialMode(Number(quote.catalog_value_cents), Number(quote.contract_value_cents));
    if (!PROJECT_COMMERCIAL_MODES.includes(mode)) throw new Error('Mode commercial invalide.');

    const id = randomUUID(); const now = nowIso(); const year = new Date().getFullYear();
    const number = this.nextProjectNumber(year, now);
    const clientLabel = this.clientLabel(clientId);
    const paths = this.projectPaths(clientLabel, number, name, false);
    const existedBefore = existsSync(paths.projectDirectory);

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.createResourceFolders(paths.resourceRoot);
      this.database.run(
        `INSERT INTO projects (id,project_number,client_account_id,source_quote_id,template_version_id,name,project_type,status,commercial_mode,start_date,target_date,commercial_value_cents,contract_value_cents,resource_root_path,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,'to_prepare',?,?,?,?,?,?,?,?)`,
        [id, number, clientId, quote.id, templateVersion.id, name, template.projectType, mode, null, input.targetDate ?? null, Number(quote.catalog_value_cents), Number(quote.contract_value_cents), paths.resourceRoot, now, now],
      );

      this.copyTemplateTreeToProject(templateVersion.id, id, now, blueprintPlan.base, false);
      for (const addon of blueprintPlan.addons) {
        this.copyTemplateTreeToProject(addon.templateVersionId, id, now, addon, true);
      }

      this.copyQuoteServicesToProject(quote.id, id, now);
      this.seedPrerequisitesFromQuote(quote.id, id, quote.prerequisites_text, now);
      this.database.run('UPDATE quotes SET project_id=?, updated_at=? WHERE id=?', [id, now, quote.id]);
      this.writeActivity(
        'project',
        id,
        'project_created_from_quote',
        `Projet ${number} créé depuis ${quote.quote_number} avec blueprint ${template.name}${blueprintPlan.addons.length ? ` + ${blueprintPlan.addons.length} module(s)` : ''}`,
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      if (!existedBefore) rmSync(paths.projectDirectory, { recursive: true, force: true });
      throw error;
    }
    return this.getProject(id);
  }

  createInternal(input: InternalProjectInput): ProjectDetail {
    const name = clean(input.name); if (!name) throw new Error('Nom du projet requis.');
    const id = randomUUID(); const now = nowIso(); const year = new Date().getFullYear(); const number = this.nextProjectNumber(year, now);
    let templateVersionId: string | null = clean(input.templateVersionId);
    if (templateVersionId) {
      const templateVersion = this.getTemplateVersion(templateVersionId);
      if (templateVersion.status !== 'published') throw new Error('Le modèle doit être publié.');
    }
    const paths = this.projectPaths('AtoumWeb', number, name, true); const existedBefore = existsSync(paths.projectDirectory);
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.createResourceFolders(paths.resourceRoot);
      this.database.run(
        `INSERT INTO projects (id,project_number,client_account_id,source_quote_id,template_version_id,name,project_type,status,commercial_mode,target_date,commercial_value_cents,contract_value_cents,resource_root_path,notes,created_at,updated_at)
         VALUES (?,?,NULL,NULL,?,?, 'internal','to_prepare','internal',?,0,0,?,?,?,?)`,
        [id, number, templateVersionId, name, input.targetDate ?? null, paths.resourceRoot, clean(input.notes), now, now],
      );
      if (templateVersionId) this.copyTemplateTreeToProject(templateVersionId, id, now);
      this.writeActivity('project', id, 'internal_project_created', `Projet interne ${number} créé`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      if (!existedBefore) rmSync(paths.projectDirectory, { recursive: true, force: true });
      throw error;
    }
    return this.getProject(id);
  }

  changeProjectStatus(id: string, status: ProjectStatus): ProjectDetail {
    if (!PROJECT_STATUSES.includes(status)) throw new Error('Statut projet invalide.');
    this.getProject(id); const now = nowIso();
    this.database.run('UPDATE projects SET status=?, completed_at=?, archived_at=?, updated_at=? WHERE id=?', [status, status === 'completed' ? now : null, status === 'archived' ? now : null, now, id]);
    this.writeActivity('project', id, 'project_status_changed', `Statut projet : ${status}`);
    return this.getProject(id);
  }

  addProjectNode(projectId: string, input: ProjectNodeInput): ProjectDetail {
    this.getProject(projectId); this.validateNodeInput(input);
    if (input.parentId) this.assertProjectParent(projectId, input.parentId);
    const now = nowIso();
    this.database.run(
      `INSERT INTO project_nodes (
         id,project_id,parent_id,source_template_node_id,node_type,display_subtype,name,description,sort_order,
         estimated_minutes,is_required,status,time_category,created_at,updated_at,semantic_key,work_card_json,advice_json
       ) VALUES (?,?,?,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        randomUUID(), projectId, input.parentId ?? null, input.type, clean(input.displaySubtype), clean(input.name),
        clean(input.description), input.sortOrder ?? this.nextProjectNodeOrder(projectId, input.parentId ?? null),
        input.estimatedMinutes ?? null, input.required === false ? 0 : 1, input.status ?? 'todo', clean(input.timeCategory),
        now, now, clean(input.semanticKey), input.workCard ? JSON.stringify(input.workCard) : null,
        input.advice?.length ? JSON.stringify(input.advice) : null,
      ],
    );
    return this.getProject(projectId);
  }

  updateProjectNode(nodeId: string, input: Partial<ProjectNodeInput>): ProjectDetail {
    const row = this.database.get<ProjectNodeRow>('SELECT * FROM project_nodes WHERE id=?', [nodeId]);
    if (!row) throw new Error('Tâche introuvable.');
    const parentId = input.parentId === undefined ? row.parent_id : input.parentId;
    if (parentId) {
      if (parentId === nodeId) throw new Error('Un nœud ne peut pas être son propre parent.');
      this.assertProjectParent(row.project_id, parentId);
      this.assertNoCycle(nodeId, parentId);
    }
    const type = input.type ?? row.node_type; const status = input.status ?? row.status;
    if (!PROJECT_NODE_TYPES.includes(type) || !PROJECT_NODE_STATUSES.includes(status)) throw new Error('Type ou statut de tâche invalide.');
    this.database.run(
      `UPDATE project_nodes
       SET parent_id=?, node_type=?, display_subtype=?, name=?, description=?, sort_order=?, estimated_minutes=?,
           is_required=?, status=?, time_category=?, semantic_key=?, work_card_json=?, advice_json=?, updated_at=?
       WHERE id=?`,
      [
        parentId ?? null, type, clean(input.displaySubtype ?? row.display_subtype), clean(input.name ?? row.name),
        clean(input.description ?? row.description), input.sortOrder ?? row.sort_order,
        input.estimatedMinutes === undefined ? row.estimated_minutes : input.estimatedMinutes,
        input.required === undefined ? row.is_required : input.required ? 1 : 0, status,
        clean(input.timeCategory ?? row.time_category),
        input.semanticKey === undefined ? row.semantic_key : clean(input.semanticKey),
        input.workCard === undefined ? row.work_card_json : input.workCard ? JSON.stringify(input.workCard) : null,
        input.advice === undefined ? row.advice_json : input.advice.length ? JSON.stringify(input.advice) : null,
        nowIso(), nodeId,
      ],
    );
    if (status === 'done' && row.status !== 'done') this.writeActivity('project', row.project_id, 'project_node_done', `Tâche terminée : ${input.name ?? row.name}`);
    return this.getProject(row.project_id);
  }

  addPrerequisite(projectId: string, input: ProjectPrerequisiteInput): ProjectDetail {
    this.getProject(projectId); const label = clean(input.label); if (!label) throw new Error('Libellé requis.'); const now = nowIso();
    this.database.run(
      `INSERT INTO project_prerequisites (id,project_id,label,description,status,is_required,sort_order,created_at,updated_at) VALUES (?,?,?,?, 'to_request', ?,?,?,?)`,
      [randomUUID(), projectId, label, clean(input.description), input.required === false ? 0 : 1, input.sortOrder ?? this.nextPrerequisiteOrder(projectId), now, now],
    );
    return this.getProject(projectId);
  }

  updatePrerequisiteStatus(id: string, status: ProjectPrerequisiteStatus): ProjectDetail {
    if (!PROJECT_PREREQUISITE_STATUSES.includes(status)) throw new Error('Statut prérequis invalide.');
    const row = this.database.get<{ project_id: string; label: string }>('SELECT project_id,label FROM project_prerequisites WHERE id=?', [id]);
    if (!row) throw new Error('Prérequis introuvable.');
    const now = nowIso();
    this.database.run(
      `UPDATE project_prerequisites SET status=?, requested_at=CASE WHEN ?='requested' THEN ? ELSE requested_at END,
       received_at=CASE WHEN ?='received' THEN ? ELSE received_at END,
       validated_at=CASE WHEN ?='validated' THEN ? ELSE validated_at END, updated_at=? WHERE id=?`,
      [status, status, now, status, now, status, now, now, id],
    );
    if (['received', 'validated'].includes(status)) this.writeActivity('project', row.project_id, 'project_prerequisite_changed', `${row.label} : ${status}`);
    return this.getProject(row.project_id);
  }

  private getTemplateVersions(templateId: string): ProjectTemplateVersion[] {
    return this.database.all<TemplateVersionRow>('SELECT * FROM project_template_versions WHERE template_id=? ORDER BY version_number DESC', [templateId]).map((row) => this.mapTemplateVersion(row));
  }

  private getTemplateVersion(id: string): ProjectTemplateVersion {
    const row = this.database.get<TemplateVersionRow>('SELECT * FROM project_template_versions WHERE id=?', [id]);
    if (!row) throw new Error('Version de modèle introuvable.');
    return this.mapTemplateVersion(row);
  }

  private mapTemplateVersion(row: TemplateVersionRow): ProjectTemplateVersion {
    const nodes = this.database.all<TemplateNodeRow>('SELECT * FROM project_template_nodes WHERE template_version_id=? ORDER BY sort_order, created_at', [row.id]).map((node) => ({
      id: node.id,
      templateVersionId: node.template_version_id,
      parentId: node.parent_id,
      type: node.node_type,
      displaySubtype: node.display_subtype,
      name: node.name,
      description: node.description,
      sortOrder: Number(node.sort_order),
      estimatedMinutes: node.estimated_minutes,
      required: Boolean(node.is_required),
      initialStatus: node.initial_status,
      timeCategory: node.time_category,
      semanticKey: node.semantic_key,
      workCard: parseJsonObject<ProjectWorkCard>(node.work_card_json),
      advice: parseJsonArray<ProjectCompanionAdvice>(node.advice_json),
      createdAt: node.created_at,
    }));
    return { id: row.id, templateId: row.template_id, versionNumber: Number(row.version_number), status: row.status, description: row.description, publishedAt: row.published_at, createdAt: row.created_at, nodes };
  }

  private mapProjectSummary(row: ProjectRow): ProjectSummary {
    const stats = this.database.get<{ total_required: number; done_required: number; estimated_minutes: number }>(
      `SELECT
        SUM(CASE WHEN is_required=1 AND node_type IN ('task','checklist') THEN 1 ELSE 0 END) AS total_required,
        SUM(CASE WHEN is_required=1 AND node_type IN ('task','checklist') AND status='done' THEN 1 ELSE 0 END) AS done_required,
        COALESCE(SUM(CASE WHEN node_type IN ('task','checklist') THEN estimated_minutes ELSE 0 END),0) AS estimated_minutes
       FROM project_nodes WHERE project_id=?`, [row.id]);
    const total = Number(stats?.total_required ?? 0); const done = Number(stats?.done_required ?? 0);
    return {
      id: row.id, number: row.project_number, clientAccountId: row.client_account_id, clientLabel: row.client_account_id ? this.clientLabel(row.client_account_id) : 'AtoumWeb',
      sourceQuoteId: row.source_quote_id, templateVersionId: row.template_version_id, name: row.name, projectType: row.project_type, status: row.status,
      commercialMode: row.commercial_mode, startDate: row.start_date, targetDate: row.target_date,
      commercialValueCents: Number(row.commercial_value_cents), contractValueCents: Number(row.contract_value_cents), progressPercent: total === 0 ? 0 : Math.round(done * 100 / total),
      estimatedMinutes: Number(stats?.estimated_minutes ?? 0), resourceRootPath: row.resource_root_path, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at, archivedAt: row.archived_at,
    };
  }

  private getProjectNodes(projectId: string): ProjectNode[] {
    return this.database.all<ProjectNodeRow>('SELECT * FROM project_nodes WHERE project_id=? ORDER BY sort_order, created_at', [projectId]).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      parentId: row.parent_id,
      sourceTemplateNodeId: row.source_template_node_id,
      type: row.node_type,
      displaySubtype: row.display_subtype,
      name: row.name,
      description: row.description,
      sortOrder: Number(row.sort_order),
      estimatedMinutes: row.estimated_minutes,
      required: Boolean(row.is_required),
      status: row.status,
      timeCategory: row.time_category,
      semanticKey: row.semantic_key,
      workCard: parseJsonObject<ProjectWorkCard>(row.work_card_json),
      advice: parseJsonArray<ProjectCompanionAdvice>(row.advice_json),
      paused: Boolean(row.is_paused),
      pauseReason: row.pause_reason,
      sources: this.getProjectNodeSources(row.id),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getProjectNodeSources(nodeId: string): ProjectNodeSource[] {
    return this.database.all<ProjectNodeSourceRow>(
      'SELECT * FROM project_node_sources WHERE project_node_id=? ORDER BY created_at',
      [nodeId],
    ).map((row) => ({
      id: row.id,
      projectNodeId: row.project_node_id,
      quoteLineId: row.quote_line_id,
      catalogVersionId: row.catalog_version_id,
      templateVersionId: row.template_version_id,
      sourceRole: row.source_role,
      createdAt: row.created_at,
    }));
  }

  private getProjectServices(projectId: string): ProjectServiceSnapshot[] {
    return this.database.all<ProjectServiceRow>('SELECT * FROM project_services WHERE project_id=? ORDER BY created_at', [projectId]).map((row) => {
      let snapshot: Record<string, unknown> | null = null; if (row.snapshot_json) { try { snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>; } catch { snapshot = null; } }
      return { id: row.id, projectId: row.project_id, sourceQuoteLineId: row.source_quote_line_id, catalogItemId: row.catalog_item_id, catalogVersionId: row.catalog_version_id, label: row.label, snapshot, catalogValueCents: Number(row.catalog_value_cents), contractValueCents: Number(row.contract_value_cents), createdAt: row.created_at };
    });
  }

  private getPrerequisites(projectId: string): ProjectPrerequisite[] {
    return this.database.all<PrerequisiteRow>('SELECT * FROM project_prerequisites WHERE project_id=? ORDER BY sort_order, created_at', [projectId]).map((row) => ({
      id: row.id, projectId: row.project_id, label: row.label, description: row.description, status: row.status, required: Boolean(row.is_required), sortOrder: Number(row.sort_order), requestedAt: row.requested_at, receivedAt: row.received_at, validatedAt: row.validated_at, createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  }

  private copyTemplateNodes(fromVersionId: string, toVersionId: string, now: string): void {
    const source = this.database.all<TemplateNodeRow>('SELECT * FROM project_template_nodes WHERE template_version_id=? ORDER BY sort_order, created_at', [fromVersionId]);
    const pending = [...source]; const ids = new Map<string, string>(); let guard = 0;
    while (pending.length && guard++ < source.length + 2) {
      let progressed = false;
      for (let index = pending.length - 1; index >= 0; index--) {
        const node = pending[index]; if (node.parent_id && !ids.has(node.parent_id)) continue;
        const newId = randomUUID(); ids.set(node.id, newId);
        this.database.run(
          `INSERT INTO project_template_nodes (
             id,template_version_id,parent_id,node_type,display_subtype,name,description,sort_order,estimated_minutes,
             is_required,initial_status,time_category,created_at,semantic_key,work_card_json,advice_json
           ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            newId, toVersionId, node.parent_id ? ids.get(node.parent_id)! : null, node.node_type, node.display_subtype,
            node.name, node.description, node.sort_order, node.estimated_minutes, node.is_required, node.initial_status,
            node.time_category, now, node.semantic_key, node.work_card_json, node.advice_json,
          ],
        ); pending.splice(index, 1); progressed = true;
      }
      if (!progressed) throw new Error('Arbre du modèle invalide.');
    }
  }

  private resolveBlueprintPlan(quoteId: string, explicitTemplateVersionId?: string | null): { base: BlueprintContribution; addons: BlueprintContribution[] } {
    const lines = this.database.all<QuoteLineProjectRow>(
      'SELECT id,catalog_item_id,catalog_version_id,label,snapshot_json,catalog_line_value_cents,contract_line_value_cents FROM quote_lines WHERE quote_id=? ORDER BY sort_order, created_at',
      [quoteId],
    );

    let mappedBase: BlueprintContribution | null = null;
    const addons: BlueprintContribution[] = [];

    const pushAddon = (contribution: BlueprintContribution) => {
      const duplicate = addons.some((item) =>
        item.templateVersionId === contribution.templateVersionId
        && item.quoteLineId === contribution.quoteLineId
        && item.catalogVersionId === contribution.catalogVersionId,
      );
      if (!duplicate) addons.push(contribution);
    };

    for (const line of lines) {
      if (line.catalog_version_id) {
        for (const link of this.blueprintLinksForCatalogVersion(line.catalog_version_id)) {
          const contribution: BlueprintContribution = {
            templateVersionId: link.template_version_id,
            quoteLineId: line.id,
            catalogVersionId: line.catalog_version_id,
            sourceRole: 'direct',
          };
          if (link.role === 'base' && !mappedBase) mappedBase = contribution;
          if (link.role === 'addon') pushAddon(contribution);
        }
      }

      if (!line.snapshot_json) continue;
      let snapshot: Record<string, unknown> | null = null;
      try {
        const parsed = JSON.parse(line.snapshot_json) as unknown;
        snapshot = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
      } catch {
        snapshot = null;
      }
      const components = snapshot?.offerComponents;
      if (!Array.isArray(components)) continue;

      for (const raw of components) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
        const component = raw as Record<string, unknown>;
        if (component.isOptional === true) continue;
        const serviceVersionId = typeof component.serviceVersionId === 'string' ? component.serviceVersionId : null;
        if (!serviceVersionId) continue;
        for (const link of this.blueprintLinksForCatalogVersion(serviceVersionId)) {
          if (link.role !== 'addon') continue;
          pushAddon({
            templateVersionId: link.template_version_id,
            quoteLineId: line.id,
            catalogVersionId: serviceVersionId,
            sourceRole: 'offer_component',
          });
        }
      }
    }

    const explicit = clean(explicitTemplateVersionId);
    const base: BlueprintContribution | null = explicit
      ? { templateVersionId: explicit, quoteLineId: null, catalogVersionId: null, sourceRole: 'manual' }
      : mappedBase;

    if (!base) {
      throw new Error('Aucun blueprint de base n’est lié à ce devis. Choisis un modèle publié ou configure le lien Catalogue → Projet.');
    }

    const baseVersion = this.getTemplateVersion(base.templateVersionId);
    if (baseVersion.status !== 'published') throw new Error('Le blueprint de base doit être publié.');

    const filteredAddons = addons.filter((addon) => addon.templateVersionId !== base.templateVersionId);
    for (const addon of filteredAddons) {
      const version = this.getTemplateVersion(addon.templateVersionId);
      if (version.status !== 'published') throw new Error('Un module de production lié au devis n’est pas publié.');
    }

    return { base, addons: filteredAddons };
  }

  private blueprintLinksForCatalogVersion(catalogVersionId: string): BlueprintLinkRow[] {
    return this.database.all<BlueprintLinkRow>(
      'SELECT * FROM catalog_project_blueprints WHERE catalog_version_id=? ORDER BY CASE role WHEN \'base\' THEN 0 ELSE 1 END, sort_order, created_at',
      [catalogVersionId],
    );
  }

  private copyTemplateTreeToProject(
    versionId: string,
    projectId: string,
    now: string,
    sourceContribution?: BlueprintContribution,
    mergeExisting = false,
  ): void {
    const source = this.database.all<TemplateNodeRow>(
      'SELECT * FROM project_template_nodes WHERE template_version_id=? ORDER BY sort_order, created_at',
      [versionId],
    );
    const pending = [...source];
    const ids = new Map<string, string>();
    const existingBySemanticKey = new Map(
      this.database.all<{ id: string; semantic_key: string }>(
        'SELECT id,semantic_key FROM project_nodes WHERE project_id=? AND semantic_key IS NOT NULL',
        [projectId],
      ).map((row) => [row.semantic_key, row.id] as const),
    );
    let guard = 0;

    while (pending.length && guard++ < source.length + 2) {
      let progressed = false;
      for (let index = pending.length - 1; index >= 0; index--) {
        const node = pending[index];
        if (node.parent_id && !ids.has(node.parent_id)) continue;

        const existingId = mergeExisting && node.semantic_key ? existingBySemanticKey.get(node.semantic_key) : undefined;
        if (existingId) {
          ids.set(node.id, existingId);
          if (sourceContribution) this.linkProjectNodeSource(existingId, sourceContribution, versionId, now);
          pending.splice(index, 1);
          progressed = true;
          continue;
        }

        const newId = randomUUID();
        const parentId = node.parent_id ? ids.get(node.parent_id)! : null;
        ids.set(node.id, newId);
        this.database.run(
          `INSERT INTO project_nodes (
             id,project_id,parent_id,source_template_node_id,node_type,display_subtype,name,description,sort_order,
             estimated_minutes,is_required,status,time_category,created_at,updated_at,semantic_key,work_card_json,advice_json
           ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            newId, projectId, parentId, node.id, node.node_type, node.display_subtype, node.name, node.description,
            node.sort_order, node.estimated_minutes, node.is_required, node.initial_status, node.time_category,
            now, now, node.semantic_key, node.work_card_json, node.advice_json,
          ],
        );
        if (node.semantic_key) existingBySemanticKey.set(node.semantic_key, newId);
        if (sourceContribution) this.linkProjectNodeSource(newId, sourceContribution, versionId, now);
        pending.splice(index, 1);
        progressed = true;
      }
      if (!progressed) throw new Error('Arbre du modèle invalide.');
    }
  }

  private linkProjectNodeSource(nodeId: string, source: BlueprintContribution, templateVersionId: string, now: string): void {
    const existing = this.database.get<{ id: string }>(
      `SELECT id FROM project_node_sources
       WHERE project_node_id=?
         AND quote_line_id IS ?
         AND catalog_version_id IS ?
         AND template_version_id IS ?
         AND source_role=?`,
      [nodeId, source.quoteLineId, source.catalogVersionId, templateVersionId, source.sourceRole],
    );
    if (existing) return;
    this.database.run(
      `INSERT INTO project_node_sources
       (id,project_node_id,quote_line_id,catalog_version_id,template_version_id,source_role,created_at)
       VALUES (?,?,?,?,?,?,?)`,
      [randomUUID(), nodeId, source.quoteLineId, source.catalogVersionId, templateVersionId, source.sourceRole, now],
    );
  }

  private copyQuoteServicesToProject(quoteId: string, projectId: string, now: string): void {
    const lines = this.database.all<QuoteLineProjectRow>('SELECT id,catalog_item_id,catalog_version_id,label,snapshot_json,catalog_line_value_cents,contract_line_value_cents FROM quote_lines WHERE quote_id=? ORDER BY sort_order', [quoteId]);
    for (const line of lines) {
      this.database.run(
        `INSERT INTO project_services (id,project_id,source_quote_line_id,catalog_item_id,catalog_version_id,label,snapshot_json,catalog_value_cents,contract_value_cents,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [randomUUID(), projectId, line.id, line.catalog_item_id, line.catalog_version_id, line.label, line.snapshot_json, line.catalog_line_value_cents, line.contract_line_value_cents, now],
      );
    }
  }

  private seedPrerequisitesFromQuote(quoteId: string, projectId: string, quoteText: string | null, now: string): void {
    const labels = new Set<string>();
    if (quoteText) quoteText.split(/\r?\n|;/).map((value) => value.trim()).filter(Boolean).forEach((value) => labels.add(value));
    const lines = this.database.all<{ snapshot_json: string | null }>('SELECT snapshot_json FROM quote_lines WHERE quote_id=?', [quoteId]);
    for (const line of lines) {
      if (!line.snapshot_json) continue;
      try {
        const snapshot = JSON.parse(line.snapshot_json) as Record<string, unknown>;
        const prerequisites = snapshot.prerequisites;
        if (Array.isArray(prerequisites)) prerequisites.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean).forEach((value) => labels.add(value));
      } catch { /* snapshot legacy invalide ignoré */ }
    }
    let order = 0;
    for (const label of labels) {
      this.database.run('INSERT INTO project_prerequisites (id,project_id,label,status,is_required,sort_order,created_at,updated_at) VALUES (?,?,?,\'to_request\',1,?,?,?)', [randomUUID(), projectId, label, order, now, now]);
      order += 10;
    }
  }

  private inferCommercialMode(catalog: number, contract: number): ProjectCommercialMode {
    if (contract === 0 && catalog > 0) return 'free';
    if (contract < catalog) return 'discounted';
    return 'normal';
  }

  private nextProjectNumber(year: number, now: string): string {
    const row = this.database.get<{ current_value: number }>('SELECT current_value FROM number_sequences WHERE sequence_key=? AND sequence_year=?', ['project', year]);
    const next = Number(row?.current_value ?? 0) + 1;
    this.database.run(
      `INSERT INTO number_sequences (sequence_key,sequence_year,current_value,updated_at) VALUES ('project',?,?,?)
       ON CONFLICT(sequence_key,sequence_year) DO UPDATE SET current_value=excluded.current_value, updated_at=excluded.updated_at`, [year, next, now]);
    return `PRO-${year}-${String(next).padStart(3, '0')}`;
  }

  private clientLabel(clientId: string): string {
    const row = this.database.get<{ label: string }>(
      `SELECT COALESCE(o.name, trim(c.first_name || ' ' || c.last_name), 'Client') AS label FROM client_accounts ca
       LEFT JOIN organizations o ON o.id=ca.organization_id LEFT JOIN contacts c ON c.id=ca.primary_contact_id WHERE ca.id=?`, [clientId]);
    return row?.label || 'Client';
  }

  private projectPaths(clientLabel: string, number: string, name: string, internal: boolean): { projectDirectory: string; resourceRoot: string } {
    const base = internal ? this.workspace.internalDirectory : join(this.workspace.clientsDirectory, this.safeSegment(clientLabel));
    const projectDirectory = join(base, this.safeSegment(`${number} - ${name}`));
    return { projectDirectory, resourceRoot: join(projectDirectory, 'Ressources') };
  }

  private createResourceFolders(resourceRoot: string): void {
    for (const folder of ['01 Identité', '02 Textes', '03 Images & médias', '04 Documents projet', '05 Technique - Sources - Exports', '06 Livrables', '07 Archives']) {
      mkdirSync(join(resourceRoot, folder), { recursive: true });
    }
  }

  private safeSegment(value: string): string {
    return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 100) || 'Projet';
  }

  private validateNodeInput(input: Partial<ProjectNodeInput | ProjectTemplateNodeInput>): void {
    if (!input.type || !PROJECT_NODE_TYPES.includes(input.type)) throw new Error('Type de nœud invalide.');
    if (!clean(input.name)) throw new Error('Nom du nœud requis.');
    if (input.estimatedMinutes != null && (!Number.isInteger(input.estimatedMinutes) || input.estimatedMinutes < 0)) throw new Error('Temps estimé invalide.');
    const status = 'status' in input ? input.status : 'initialStatus' in input ? input.initialStatus : undefined;
    if (status && !PROJECT_NODE_STATUSES.includes(status)) throw new Error('Statut de nœud invalide.');
  }

  private nextTemplateNodeOrder(versionId: string, parentId: string | null): number {
    const row = this.database.get<{ next_order: number }>('SELECT COALESCE(MAX(sort_order),-10)+10 AS next_order FROM project_template_nodes WHERE template_version_id=? AND parent_id IS ?', [versionId, parentId]);
    return Number(row?.next_order ?? 0);
  }
  private nextProjectNodeOrder(projectId: string, parentId: string | null): number {
    const row = this.database.get<{ next_order: number }>('SELECT COALESCE(MAX(sort_order),-10)+10 AS next_order FROM project_nodes WHERE project_id=? AND parent_id IS ?', [projectId, parentId]);
    return Number(row?.next_order ?? 0);
  }
  private nextPrerequisiteOrder(projectId: string): number {
    const row = this.database.get<{ next_order: number }>('SELECT COALESCE(MAX(sort_order),-10)+10 AS next_order FROM project_prerequisites WHERE project_id=?', [projectId]);
    return Number(row?.next_order ?? 0);
  }

  private assertProjectParent(projectId: string, parentId: string): void {
    const row = this.database.get<{ project_id: string }>('SELECT project_id FROM project_nodes WHERE id=?', [parentId]);
    if (!row || row.project_id !== projectId) throw new Error('Parent de tâche invalide.');
  }

  private assertNoCycle(nodeId: string, parentId: string): void {
    let current: string | null = parentId; let guard = 0;
    while (current && guard++ < 200) {
      if (current === nodeId) throw new Error('Ce déplacement créerait une boucle dans l’arbre.');
      const row: { parent_id: string | null } | undefined = this.database.get<{ parent_id: string | null }>('SELECT parent_id FROM project_nodes WHERE id=?', [current]);
      current = row?.parent_id ?? null;
    }
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run('INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)', [entityType, entityId, action, summary, nowIso()]);
  }
}

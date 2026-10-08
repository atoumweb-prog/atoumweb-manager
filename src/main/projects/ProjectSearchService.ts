import type { SearchResult } from '../../shared/crm';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

interface ProjectMatchRow extends Record<string, unknown> {
  id: string;
  project_number: string;
  name: string;
  status: string;
}

interface NodeMatchRow extends Record<string, unknown> {
  project_id: string;
  node_name: string;
  node_type: string;
  project_number: string;
  project_name: string;
  node_status: string;
}

interface ResourceMatchRow extends Record<string, unknown> {
  project_id: string;
  original_name: string;
  resource_folder: string;
  resource_status: string;
  project_number: string;
  project_name: string;
}

interface TechnicalMatchRow extends Record<string, unknown> {
  project_id: string;
  item_name: string;
  category: string;
  project_number: string;
  project_name: string;
}

const nodeLabel = (type: string): string => {
  if (type === 'lot') return 'Lot';
  if (type === 'module') return 'Module / Page';
  if (type === 'checklist') return 'Checklist';
  return 'Tâche';
};

export class ProjectSearchService {
  constructor(private readonly database: DatabaseAdapter) {}

  search(query: string, limit = 16): SearchResult[] {
    const normalized = query.trim();
    if (normalized.length < 2) return [];
    const pattern = `%${normalized}%`;
    const perGroup = Math.max(2, Math.ceil(limit / 4));

    const projects = this.database.all<ProjectMatchRow>(
      `SELECT id, project_number, name, status
       FROM projects
       WHERE project_number LIKE ? OR name LIKE ?
       ORDER BY updated_at DESC
       LIMIT ?`,
      [pattern, pattern, perGroup],
    ).map<SearchResult>((row) => ({
      entityType: 'project',
      entityId: row.id,
      title: `${row.project_number} · ${row.name}`,
      subtitle: 'Projet',
      status: row.status,
    }));

    const nodes = this.database.all<NodeMatchRow>(
      `SELECT pn.project_id, pn.name AS node_name, pn.node_type,
              p.project_number, p.name AS project_name, pn.status AS node_status
       FROM project_nodes pn
       JOIN projects p ON p.id=pn.project_id
       WHERE pn.name LIKE ? OR COALESCE(pn.description,'') LIKE ?
       ORDER BY pn.updated_at DESC
       LIMIT ?`,
      [pattern, pattern, perGroup],
    ).map<SearchResult>((row) => ({
      entityType: 'project',
      entityId: row.project_id,
      title: `${nodeLabel(row.node_type)} · ${row.node_name}`,
      subtitle: `${row.project_number} · ${row.project_name}`,
      status: row.node_status,
    }));

    const resources = this.database.all<ResourceMatchRow>(
      `SELECT fa.project_id, fa.original_name, fa.resource_folder, fa.resource_status,
              p.project_number, p.name AS project_name
       FROM file_assets fa
       JOIN projects p ON p.id=fa.project_id
       WHERE fa.original_name LIKE ? OR fa.relative_path LIKE ?
       ORDER BY fa.updated_at DESC
       LIMIT ?`,
      [pattern, pattern, perGroup],
    ).map<SearchResult>((row) => ({
      entityType: 'project',
      entityId: row.project_id,
      title: `Ressource · ${row.original_name}`,
      subtitle: `${row.project_number} · ${row.project_name} · ${row.resource_folder}`,
      status: row.resource_status,
    }));

    const technical = this.database.all<TechnicalMatchRow>(
      `SELECT ti.project_id, ti.name AS item_name, ti.category,
              p.project_number, p.name AS project_name
       FROM technical_items ti
       JOIN projects p ON p.id=ti.project_id
       WHERE ti.scope='project' AND ti.archived_at IS NULL
         AND (ti.name LIKE ? OR COALESCE(ti.description,'') LIKE ? OR ti.tags_json LIKE ?)
       ORDER BY ti.updated_at DESC
       LIMIT ?`,
      [pattern, pattern, pattern, perGroup],
    ).map<SearchResult>((row) => ({
      entityType: 'project',
      entityId: row.project_id,
      title: `Bibliothèque · ${row.item_name}`,
      subtitle: `${row.project_number} · ${row.project_name} · ${row.category}`,
      status: 'technical',
    }));

    return [...projects, ...nodes, ...resources, ...technical].slice(0, limit);
  }
}

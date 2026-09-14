import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { MoveProjectNodeInput, ProjectDetail } from '../../shared/projects';
import type { ProjectService } from './ProjectService';

interface NodeRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
}

export class ProjectNodeArrangementService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly projects: ProjectService,
  ) {}

  move(nodeId: string, input: MoveProjectNodeInput): ProjectDetail {
    if (!Number.isInteger(input.targetIndex) || input.targetIndex < 0) throw new Error('Position de destination invalide.');
    const node = this.requireNode(nodeId);
    const targetParentId = input.parentId ?? null;

    if (targetParentId) {
      if (targetParentId === nodeId) throw new Error('Un élément ne peut pas être son propre parent.');
      const parent = this.requireNode(targetParentId);
      if (parent.project_id !== node.project_id) throw new Error('Le parent appartient à un autre projet.');
      this.assertNoCycle(nodeId, targetParentId);
    }

    const oldParentId = node.parent_id;
    const targetSiblings = this.siblings(node.project_id, targetParentId).filter((item) => item.id !== nodeId);
    const targetIndex = Math.min(input.targetIndex, targetSiblings.length);
    targetSiblings.splice(targetIndex, 0, node);

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const now = new Date().toISOString();
      this.database.run('UPDATE project_nodes SET parent_id=?, updated_at=? WHERE id=?', [targetParentId, now, nodeId]);
      this.resequence(targetSiblings, now);
      if (oldParentId !== targetParentId) {
        const oldSiblings = this.siblings(node.project_id, oldParentId);
        this.resequence(oldSiblings, now);
      }
      this.database.run(
        `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at)
         VALUES ('project',?,'project_node_moved',?,NULL,?)`,
        [node.project_id, `Organisation modifiée : ${node.name}`, now],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return this.projects.getProject(node.project_id);
  }

  private resequence(nodes: NodeRow[], now: string): void {
    nodes.forEach((item, index) => {
      this.database.run('UPDATE project_nodes SET sort_order=?, updated_at=? WHERE id=?', [index * 10, now, item.id]);
    });
  }

  private siblings(projectId: string, parentId: string | null): NodeRow[] {
    return this.database.all<NodeRow>(
      `SELECT id,project_id,parent_id,name,sort_order,created_at
       FROM project_nodes
       WHERE project_id=? AND parent_id IS ?
       ORDER BY sort_order, created_at`,
      [projectId, parentId],
    );
  }

  private requireNode(id: string): NodeRow {
    const row = this.database.get<NodeRow>(
      'SELECT id,project_id,parent_id,name,sort_order,created_at FROM project_nodes WHERE id=?',
      [id],
    );
    if (!row) throw new Error('Élément du projet introuvable.');
    return row;
  }

  private assertNoCycle(nodeId: string, parentId: string): void {
    let current: string | null = parentId;
    let guard = 0;
    while (current && guard++ < 300) {
      if (current === nodeId) throw new Error('Ce déplacement créerait une boucle dans l’arbre du projet.');
      const row: { parent_id: string | null } | undefined = this.database.get<{ parent_id: string | null }>('SELECT parent_id FROM project_nodes WHERE id=?', [current]);
      current = row?.parent_id ?? null;
    }
    if (guard >= 300) throw new Error('Arbre du projet invalide ou trop profond.');
  }
}

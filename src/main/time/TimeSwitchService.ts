import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  TIME_CATEGORIES,
  TIME_RECOVERY_STALE_AFTER_SECONDS,
  type StartTimeSessionInput,
  type TimeSession,
} from '../../shared/time';
import type { TimeService } from './TimeService';

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export class TimeSwitchService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly time: TimeService,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  switchTo(input: StartTimeSessionInput): TimeSession {
    if (!TIME_CATEGORIES.includes(input.category)) throw new Error('Catégorie de temps invalide.');
    const context = this.resolveContext(input.projectId ?? null, input.projectNodeId ?? null, input.interventionId ?? null);
    const current = this.time.active();
    if (!current) return this.time.start(input);

    const now = this.clock();
    const lastKnown = Date.parse(current.updatedAt);
    if (!current.paused && !Number.isNaN(lastKnown) && now.getTime() - lastKnown > TIME_RECOVERY_STALE_AFTER_SECONDS * 1000) {
      throw new Error('Le chrono actuel doit d’abord être récupéré ou arrêté au dernier point connu.');
    }

    const nowIso = now.toISOString();
    const id = randomUUID();

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        'UPDATE time_session_pauses SET ended_at=? WHERE time_session_id=? AND ended_at IS NULL',
        [nowIso, current.id],
      );
      this.database.run(
        'UPDATE time_sessions SET ended_at=?, updated_at=? WHERE id=? AND ended_at IS NULL',
        [nowIso, nowIso, current.id],
      );
      this.database.run(
        `INSERT INTO time_sessions
         (id,client_account_id,project_id,project_node_id,intervention_id,category,activity_label,started_at,ended_at,billable,source,note,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,NULL,?,'timer',?,?,?)`,
        [
          id,
          context.clientAccountId,
          context.projectId,
          context.projectNodeId,
          context.interventionId,
          input.category,
          clean(input.activityLabel),
          nowIso,
          input.billable === false ? 0 : 1,
          clean(input.note),
          nowIso,
          nowIso,
        ],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return this.time.get(id);
  }

  private resolveContext(projectId?: string | null, nodeId?: string | null, interventionId?: string | null): {
    clientAccountId: string | null;
    projectId: string | null;
    projectNodeId: string | null;
    interventionId: string | null;
  } {
    let resolvedProjectId = clean(projectId);
    let resolvedNodeId = clean(nodeId);
    const resolvedInterventionId = clean(interventionId);
    let interventionClientId: string | null = null;

    if (resolvedInterventionId) {
      const intervention = this.database.get<{ client_account_id: string; project_id: string | null; project_node_id: string | null; status: string }>(
        'SELECT client_account_id,project_id,project_node_id,status FROM interventions WHERE id=?',
        [resolvedInterventionId],
      );
      if (!intervention) throw new Error('Intervention introuvable.');
      if (['completed', 'cancelled', 'archived'].includes(intervention.status)) throw new Error('Cette intervention est clôturée. Réouvre-la avant de démarrer du temps.');
      interventionClientId = intervention.client_account_id;
      if (resolvedProjectId && intervention.project_id && intervention.project_id !== resolvedProjectId) throw new Error('L’intervention appartient à un autre projet.');
      resolvedProjectId = resolvedProjectId ?? intervention.project_id;
      if (!resolvedNodeId && intervention.project_node_id) resolvedNodeId = intervention.project_node_id;
    }

    if (resolvedNodeId) {
      const node = this.database.get<{ project_id: string }>('SELECT project_id FROM project_nodes WHERE id=?', [resolvedNodeId]);
      if (!node) throw new Error('Tâche de projet introuvable.');
      if (resolvedProjectId && node.project_id !== resolvedProjectId) throw new Error('La tâche n’appartient pas au projet sélectionné.');
      resolvedProjectId = node.project_id;
    }

    if (!resolvedProjectId) {
      return { clientAccountId: interventionClientId, projectId: null, projectNodeId: resolvedNodeId, interventionId: resolvedInterventionId };
    }

    const project = this.database.get<{ client_account_id: string | null }>(
      'SELECT client_account_id FROM projects WHERE id=?',
      [resolvedProjectId],
    );
    if (!project) throw new Error('Projet introuvable.');
    if (interventionClientId && project.client_account_id !== interventionClientId) throw new Error('Le projet et l’intervention appartiennent à des clients différents.');

    return {
      clientAccountId: interventionClientId ?? project.client_account_id,
      projectId: resolvedProjectId,
      projectNodeId: resolvedNodeId,
      interventionId: resolvedInterventionId,
    };
  }
}

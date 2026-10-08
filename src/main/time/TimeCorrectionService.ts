import {ProjectContributionTargetService} from '../projects/ProjectContributionTargetService';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  TIME_CATEGORIES,
  type TimeSession,
  type UpdateTimeSessionInput,
} from '../../shared/time';
import type { TimeService } from './TimeService';

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface PauseRow extends Record<string, unknown> {
  started_at: string;
  ended_at: string | null;
}

export class TimeCorrectionService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly time: TimeService,
  ) {}

  update(id: string, input: UpdateTimeSessionInput): TimeSession {
    const current = this.time.get(id);
    if (!current.endedAt) throw new Error('Arrête le chrono avant de corriger cette session.');
    if (!TIME_CATEGORIES.includes(input.category)) throw new Error('Catégorie de temps invalide.');

    const started = this.parseDate(input.startedAt, 'Date de début invalide.');
    const ended = this.parseDate(input.endedAt, 'Date de fin invalide.');
    if (ended.getTime() <= started.getTime()) throw new Error('La fin doit être postérieure au début.');

    this.assertPausesInsideInterval(id, started.getTime(), ended.getTime());
    const interventionId = input.interventionId === undefined ? current.interventionId ?? null : input.interventionId;
    const context = this.resolveContext(input.projectId ?? null, input.projectNodeId ?? null, interventionId);
    if(context.projectNodeId&&context.projectNodeId!==current.projectNodeId)new ProjectContributionTargetService(this.database).assertAction(context.projectNodeId);
    const businessCategory=this.time.resolveBusinessCategory({...input,businessCategory:input.businessCategory===undefined?current.businessCategory:input.businessCategory});
    const now = new Date().toISOString();

    this.database.run(
      `UPDATE time_sessions
       SET client_account_id=?, project_id=?, project_node_id=?, intervention_id=?, category=?, activity_label=?,
           started_at=?, ended_at=?, billable=?, note=?, updated_at=?, business_category=?
       WHERE id=?`,
      [
        context.clientAccountId,
        context.projectId,
        context.projectNodeId,
        context.interventionId,
        input.category,
        clean(input.activityLabel),
        started.toISOString(),
        ended.toISOString(),
        input.billable === false ? 0 : 1,
        clean(input.note),
        now,
        businessCategory,
        id,
      ],
    );

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
      const intervention = this.database.get<{ client_account_id: string; project_id: string | null; project_node_id: string | null }>(
        'SELECT client_account_id,project_id,project_node_id FROM interventions WHERE id=?',
        [resolvedInterventionId],
      );
      if (!intervention) throw new Error('Intervention introuvable.');
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

  private assertPausesInsideInterval(sessionId: string, startMs: number, endMs: number): void {
    const pauses = this.database.all<PauseRow>(
      'SELECT started_at,ended_at FROM time_session_pauses WHERE time_session_id=? ORDER BY started_at',
      [sessionId],
    );

    for (const pause of pauses) {
      if (!pause.ended_at) throw new Error('Une pause est encore ouverte sur cette session.');
      const pauseStart = Date.parse(pause.started_at);
      const pauseEnd = Date.parse(pause.ended_at);
      if (pauseStart < startMs || pauseEnd > endMs) {
        throw new Error('Les nouveaux horaires excluent une pause existante. Élargis la période ou conserve les horaires actuels.');
      }
    }
  }

  private parseDate(value: string, message: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date;
  }
}

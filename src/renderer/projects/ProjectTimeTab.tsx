import { useEffect, useMemo, useState } from 'react';
import type { ProjectNode } from '../../shared/projects';
import type { TimeSession, TimeSummary } from '../../shared/time';

function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}

function dateLabel(value: string): string {
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function ProjectTimeTab({ projectId, nodes, onMessage }: {
  projectId: string;
  nodes: ProjectNode[];
  onMessage: (message: string) => void;
}) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [summary, setSummary] = useState<TimeSummary>({ totalSeconds: 0, billableSeconds: 0, nonBillableSeconds: 0, sessionCount: 0 });

  async function refresh(): Promise<void> {
    try {
      const [nextSessions, nextSummary] = await Promise.all([
        window.atoumweb.time.list({ projectId }),
        window.atoumweb.time.summary({ projectId }),
      ]);
      setSessions(nextSessions);
      setSummary(nextSummary);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger le temps du projet.');
    }
  }

  useEffect(() => {
    void refresh();
    const changed = () => void refresh();
    window.addEventListener('atoumweb:time-changed', changed);
    return () => window.removeEventListener('atoumweb:time-changed', changed);
  }, [projectId]);

  function prepareTimer(node?: ProjectNode): void {
    window.dispatchEvent(new CustomEvent('atoumweb:timer-context', {
      detail: {
        projectId,
        nodeId: node?.id ?? null,
        activityLabel: node?.name ?? null,
        category: node?.timeCategory || 'production',
        billable: true,
      },
    }));
  }

  const timedNodes = nodes.filter((node) => ['module', 'task', 'checklist'].includes(node.type) && node.status !== 'done');
  const estimatedSeconds = useMemo(() => nodes
    .filter((node) => ['task', 'checklist'].includes(node.type))
    .reduce((total, node) => total + (node.estimatedMinutes ?? 0) * 60, 0), [nodes]);
  const varianceSeconds = summary.totalSeconds - estimatedSeconds;
  const varianceLabel = estimatedSeconds === 0
    ? 'Pas d’estimation'
    : varianceSeconds === 0
      ? 'Conforme à l’estimation'
      : varianceSeconds > 0
        ? `+ ${duration(varianceSeconds)}`
        : `− ${duration(Math.abs(varianceSeconds))}`;

  return (
    <div className="project-tab-content project-time-tab">
      <div className="project-time-summary">
        <div><span>Temps estimé</span><strong>{estimatedSeconds ? duration(estimatedSeconds) : '—'}</strong></div>
        <div><span>Temps réel</span><strong>{duration(summary.totalSeconds)}</strong></div>
        <div><span>Écart</span><strong>{varianceLabel}</strong></div>
        <div><span>Facturable</span><strong>{duration(summary.billableSeconds)}</strong></div>
        <div><span>Non facturable</span><strong>{duration(summary.nonBillableSeconds)}</strong></div>
      </div>

      <div className="project-time-start">
        <div><strong>Démarrer le timer</strong><small>Le contexte sera prérempli dans le timer global.</small></div>
        <button className="primary-button" type="button" onClick={() => prepareTimer()}>▶ Projet entier</button>
      </div>

      {timedNodes.length > 0 && (
        <div className="project-time-tasks">
          <strong>Tâches et modules actifs</strong>
          {timedNodes.map((node) => (
            <button key={node.id} type="button" onClick={() => prepareTimer(node)}>
              <span>▶</span>
              <div><strong>{node.name}</strong><small>{node.type === 'module' ? 'Module / Page' : node.type === 'checklist' ? 'Checklist' : 'Tâche'}{node.estimatedMinutes ? ` · ${Math.round(node.estimatedMinutes / 60 * 10) / 10} h estimées` : ''}</small></div>
            </button>
          ))}
        </div>
      )}

      <div className="project-time-history">
        <strong>Dernières sessions</strong>
        {sessions.slice(0, 10).map((session) => (
          <div key={session.id}>
            <div><strong>{session.projectNodeLabel || session.activityLabel || 'Projet'}</strong><small>{dateLabel(session.startedAt)} · {session.category}</small></div>
            <span>{duration(session.durationSeconds)}</span>
          </div>
        ))}
        {sessions.length === 0 && <p className="muted">Aucun temps enregistré pour ce projet.</p>}
      </div>
    </div>
  );
}

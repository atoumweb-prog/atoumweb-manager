import { useEffect, useMemo, useState } from 'react';
import type { ProjectDetail, ProjectSummary } from '../../shared/projects';
import { TIME_CATEGORIES, type TimeCategory, type TimeSession } from '../../shared/time';

const CATEGORY_LABELS: Record<TimeCategory, string> = {
  production: 'Production',
  development: 'Développement',
  design: 'Design',
  meeting: 'Réunion',
  support: 'Support',
  client_correction: 'Correction client',
  internal_correction: 'Correction interne',
  research_training: 'Recherche / formation',
  administrative: 'Administratif',
  other: 'Autre',
};

interface TimerContextEvent {
  projectId?: string | null;
  nodeId?: string | null;
  activityLabel?: string | null;
  category?: TimeCategory;
  billable?: boolean;
}

function clock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
}

export function GlobalTimer({ onMessage }: { onMessage: (message: string) => void }) {
  const [active, setActive] = useState<TimeSession | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [category, setCategory] = useState<TimeCategory>('development');
  const [activityLabel, setActivityLabel] = useState('');
  const [billable, setBillable] = useState(true);
  const [snapshotAt, setSnapshotAt] = useState(Date.now());
  const [tick, setTick] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  async function loadActive(showRecovery = false): Promise<void> {
    try {
      const current = await window.atoumweb.time.active();
      setActive(current);
      setSnapshotAt(Date.now());
      if (showRecovery && current) onMessage(`Session de temps retrouvée : ${contextLabel(current)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger le timer.');
    }
  }

  useEffect(() => {
    void Promise.all([
      window.atoumweb.projects.projects.list(),
      window.atoumweb.time.active(),
    ]).then(([nextProjects, current]) => {
      setProjects(nextProjects.filter((project) => !['completed', 'archived'].includes(project.status)));
      setActive(current);
      setSnapshotAt(Date.now());
      if (current) onMessage(`Session de temps retrouvée : ${contextLabel(current)}.`);
    }).catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Impossible d’initialiser le timer.'));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const refreshActive = () => void loadActive();
    const prepareContext = (event: Event) => {
      if (active) {
        onMessage('Un timer est déjà actif. Arrête-le avant d’en démarrer un autre.');
        return;
      }
      const context = (event as CustomEvent<TimerContextEvent>).detail ?? {};
      setProjectId(context.projectId ?? '');
      setNodeId(context.nodeId ?? '');
      setActivityLabel(context.activityLabel ?? '');
      if (context.category) setCategory(context.category);
      if (typeof context.billable === 'boolean') setBillable(context.billable);
      setOpen(true);
    };
    window.addEventListener('atoumweb:time-changed', refreshActive);
    window.addEventListener('atoumweb:timer-context', prepareContext);
    return () => {
      window.removeEventListener('atoumweb:time-changed', refreshActive);
      window.removeEventListener('atoumweb:timer-context', prepareContext);
    };
  }, [active]);

  useEffect(() => {
    if (!projectId) {
      setProjectDetail(null);
      setNodeId('');
      return;
    }
    void window.atoumweb.projects.projects.get(projectId)
      .then((project) => {
        setProjectDetail(project);
        setNodeId((current) => project.nodes.some((node) => node.id === current) ? current : '');
      })
      .catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Impossible de charger le projet.'));
  }, [projectId]);

  const displayedSeconds = useMemo(() => {
    if (!active) return 0;
    if (active.paused || active.endedAt) return active.durationSeconds;
    return active.durationSeconds + Math.max(0, Math.floor((tick - snapshotAt) / 1000));
  }, [active, snapshotAt, tick]);

  async function start(): Promise<void> {
    setBusy(true);
    try {
      const session = await window.atoumweb.time.start({
        projectId: projectId || null,
        projectNodeId: nodeId || null,
        category,
        activityLabel: activityLabel.trim() || null,
        billable,
      });
      setActive(session);
      setSnapshotAt(Date.now());
      setOpen(false);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Timer démarré : ${contextLabel(session)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de démarrer le timer.');
      await loadActive();
    } finally {
      setBusy(false);
    }
  }

  async function pauseOrResume(): Promise<void> {
    if (!active) return;
    setBusy(true);
    try {
      const next = active.paused
        ? await window.atoumweb.time.resume(active.id)
        : await window.atoumweb.time.pause(active.id);
      setActive(next);
      setSnapshotAt(Date.now());
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le timer.');
    } finally {
      setBusy(false);
    }
  }

  async function stop(): Promise<void> {
    if (!active) return;
    setBusy(true);
    try {
      const stopped = await window.atoumweb.time.stop(active.id);
      setActive(null);
      setSnapshotAt(Date.now());
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Session terminée · ${clock(stopped.durationSeconds)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter le timer.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`global-timer ${active ? 'running' : ''} ${active?.paused ? 'paused' : ''}`}>
      <button className="timer-main-button" type="button" onClick={() => !active && setOpen((value) => !value)} title={active ? contextLabel(active) : 'Démarrer une session de temps'}>
        <span className="timer-label">Timer{active?.paused ? ' · Pause' : ''}</span>
        <strong>{clock(displayedSeconds)}</strong>
        <span className="timer-context">{active ? contextLabel(active) : 'Aucune activité'}</span>
      </button>

      {active ? (
        <div className="timer-actions">
          <button type="button" disabled={busy} onClick={() => void pauseOrResume()} title={active.paused ? 'Reprendre' : 'Mettre en pause'}>{active.paused ? '▶' : 'Ⅱ'}</button>
          <button type="button" disabled={busy} onClick={() => void stop()} title="Arrêter">■</button>
        </div>
      ) : <button className="timer-start-shortcut" type="button" onClick={() => setOpen((value) => !value)} title="Démarrer">▶</button>}

      {open && !active && (
        <div className="timer-popover">
          <div><span className="eyebrow">Nouvelle session</span><strong>Que fais-tu ?</strong></div>
          <label>Projet<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">AtoumWeb · sans projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.clientLabel} · {project.name}</option>)}</select></label>
          <label>Tâche / activité du projet<select value={nodeId} onChange={(event) => setNodeId(event.target.value)} disabled={!projectDetail}><option value="">Projet entier</option>{projectDetail?.nodes.filter((node) => ['task', 'module', 'checklist'].includes(node.type)).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label>
          <label>Catégorie<select value={category} onChange={(event) => setCategory(event.target.value as TimeCategory)}>{TIME_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
          <label>Libellé<input value={activityLabel} onChange={(event) => setActivityLabel(event.target.value)} placeholder="Ex. Corrections responsive" /></label>
          <label className="timer-billable"><input type="checkbox" checked={billable} onChange={(event) => setBillable(event.target.checked)} /> Temps facturable</label>
          <div className="button-row"><button className="primary-button" type="button" disabled={busy} onClick={() => void start()}>▶ Démarrer</button><button className="secondary-button" type="button" onClick={() => setOpen(false)}>Annuler</button></div>
        </div>
      )}
    </div>
  );
}

function contextLabel(session: TimeSession): string {
  const parts = [session.clientLabel, session.projectNumber ? `${session.projectNumber} · ${session.projectLabel ?? ''}` : session.projectLabel, session.projectNodeLabel, session.activityLabel]
    .map((value) => value?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(' › ') : CATEGORY_LABELS[session.category];
}

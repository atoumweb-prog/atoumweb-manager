import { useEffect, useMemo, useState } from 'react';
import type { ProjectDetail, ProjectSummary } from '../../shared/projects';
import {
  TIME_CATEGORIES,
  TIME_RECOVERY_STALE_AFTER_SECONDS,
  type TimeCategory,
  type TimeSession,
} from '../../shared/time';

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

function isStaleSession(session: TimeSession | null): boolean {
  if (!session || session.endedAt || session.paused) return false;
  const updatedAt = Date.parse(session.updatedAt);
  if (Number.isNaN(updatedAt)) return false;
  return Date.now() - updatedAt > TIME_RECOVERY_STALE_AFTER_SECONDS * 1000;
}

export function GlobalTimer({ onMessage }: { onMessage: (message: string) => void }) {
  const [active, setActive] = useState<TimeSession | null>(null);
  const [recovery, setRecovery] = useState<TimeSession | null>(null);
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

  function installActive(current: TimeSession | null, announce = false): void {
    setActive(current);
    setSnapshotAt(Date.now());
    const needsRecovery = isStaleSession(current);
    setRecovery(needsRecovery ? current : null);
    if (announce && current) {
      onMessage(needsRecovery
        ? `Un chrono oublié a été retrouvé : ${contextLabel(current)}. Choisis comment le reprendre.`
        : `Session de temps retrouvée : ${contextLabel(current)}.`);
    }
  }

  async function loadActive(showRecovery = false): Promise<void> {
    try {
      installActive(await window.atoumweb.time.active(), showRecovery);
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
      installActive(current, true);
    }).catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Impossible d’initialiser le timer.'));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active || active.paused || active.endedAt || recovery) return;
    const heartbeat = async () => {
      try {
        const next = await window.atoumweb.time.heartbeat(active.id);
        setActive(next);
        setSnapshotAt(Date.now());
      } catch (error) {
        onMessage(error instanceof Error ? error.message : 'Impossible de sécuriser le chrono en cours.');
      }
    };
    const interval = window.setInterval(() => { void heartbeat(); }, 30_000);
    return () => window.clearInterval(interval);
  }, [active?.id, active?.paused, active?.endedAt, recovery?.id]);

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
    if (active.paused || active.endedAt || recovery) return active.durationSeconds;
    return active.durationSeconds + Math.max(0, Math.floor((tick - snapshotAt) / 1000));
  }, [active, recovery, snapshotAt, tick]);

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
      installActive(session);
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
    if (!active || recovery) return;
    setBusy(true);
    try {
      const next = active.paused
        ? await window.atoumweb.time.resume(active.id)
        : await window.atoumweb.time.pause(active.id);
      installActive(next);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le timer.');
    } finally {
      setBusy(false);
    }
  }

  async function stop(): Promise<void> {
    if (!active || recovery) return;
    setBusy(true);
    try {
      const stopped = await window.atoumweb.time.stop(active.id);
      installActive(null);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Session terminée · ${clock(stopped.durationSeconds)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter le timer.');
    } finally {
      setBusy(false);
    }
  }

  async function recoverAndResume(): Promise<void> {
    if (!recovery) return;
    setBusy(true);
    try {
      const resumed = await window.atoumweb.time.recoverResume(recovery.id);
      installActive(resumed);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage('Chrono repris. Le temps où AtoumWeb Manager était fermé n’a pas été compté.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de reprendre ce chrono.');
    } finally {
      setBusy(false);
    }
  }

  async function stopAtLastKnown(): Promise<void> {
    if (!recovery) return;
    setBusy(true);
    try {
      const stopped = await window.atoumweb.time.stopAtLastKnown(recovery.id);
      installActive(null);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Chrono arrêté au dernier point connu · ${clock(stopped.durationSeconds)}. Tu pourras corriger la session dans Gestion des temps.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter ce chrono.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`global-timer ${active ? 'running' : ''} ${active?.paused ? 'paused' : ''} ${recovery ? 'needs-recovery' : ''}`}>
      <button className="timer-main-button" type="button" onClick={() => !active && setOpen((value) => !value)} title={active ? contextLabel(active) : 'Démarrer une session de temps'}>
        <span className="timer-label">{recovery ? 'Timer · À vérifier' : `Timer${active?.paused ? ' · Pause' : ''}`}</span>
        <strong>{clock(displayedSeconds)}</strong>
        <span className="timer-context">{active ? contextLabel(active) : 'Aucune activité'}</span>
      </button>

      {active ? (
        <div className="timer-actions">
          <button type="button" disabled={busy || Boolean(recovery)} onClick={() => void pauseOrResume()} title={active.paused ? 'Reprendre' : 'Mettre en pause'}>{active.paused ? '▶' : 'Ⅱ'}</button>
          <button type="button" disabled={busy || Boolean(recovery)} onClick={() => void stop()} title="Arrêter">■</button>
        </div>
      ) : <button className="timer-start-shortcut" type="button" onClick={() => setOpen((value) => !value)} title="Démarrer">▶</button>}

      {recovery && (
        <div className="timer-popover timer-recovery-popover" role="dialog" aria-label="Chrono à récupérer">
          <div><span className="eyebrow">Chrono retrouvé</span><strong>AtoumWeb Manager a été interrompu pendant cette session.</strong></div>
          <p>Le compteur est figé au dernier point connu. La période où l’application était fermée ne sera pas ajoutée automatiquement.</p>
          <div className="timer-recovery-summary"><span>Activité</span><strong>{contextLabel(recovery)}</strong><span>Dernier point connu</span><strong>{new Date(recovery.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</strong><span>Temps conservé</span><strong>{clock(recovery.durationSeconds)}</strong></div>
          <div className="button-row">
            <button className="primary-button" type="button" disabled={busy} onClick={() => void recoverAndResume()}>▶ Reprendre maintenant</button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => void stopAtLastKnown()}>■ Arrêter au dernier point connu</button>
          </div>
          <small>Tu pourras toujours corriger ensuite les horaires dans Gestion des temps.</small>
        </div>
      )}

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

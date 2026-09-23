import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectDetail, ProjectSummary } from '../../shared/projects';
import {
  TIME_CATEGORIES,
  TIME_RECOVERY_STALE_AFTER_SECONDS,
  type TimeCategory,
  type TimePauseReason,
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

const PAUSE_REASON_LABELS: Record<TimePauseReason, string> = {
  need_information: 'Besoin d’informations complémentaires',
  not_enough_time: 'Pas assez de temps maintenant',
  other_emergency: 'Autre urgence à traiter',
  other: 'Autre raison',
};

interface TimerContextEvent {
  interventionId?: string | null;
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
  const [pendingSwitch, setPendingSwitch] = useState<TimerContextEvent | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [interventionId, setInterventionId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [category, setCategory] = useState<TimeCategory>('development');
  const [activityLabel, setActivityLabel] = useState('');
  const [billable, setBillable] = useState(true);
  const [snapshotAt, setSnapshotAt] = useState(Date.now());
  const [tick, setTick] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [stopDecisionOpen, setStopDecisionOpen] = useState(false);
  const [pauseReasonOpen, setPauseReasonOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<TimePauseReason>('need_information');
  const [pauseReasonNote, setPauseReasonNote] = useState('');
  const timerRef = useRef<HTMLDivElement | null>(null);

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

  function notifyInterventionChanged(interventionIdToRefresh?: string | null): void {
    if (!interventionIdToRefresh) return;
    window.dispatchEvent(new CustomEvent('atoumweb:intervention-updated', { detail: { interventionId: interventionIdToRefresh } }));
  }

  async function setInterventionStatus(interventionIdToUpdate: string | null | undefined, status: 'in_progress' | 'waiting_client' | 'blocked' | 'to_validate'): Promise<void> {
    if (!interventionIdToUpdate) return;
    await window.atoumweb.operations.interventions.changeStatus(interventionIdToUpdate, status);
    notifyInterventionChanged(interventionIdToUpdate);
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
      const context = (event as CustomEvent<TimerContextEvent>).detail ?? {};
      if (active) {
        if (recovery) {
          onMessage('Le chrono actuel doit d’abord être repris ou arrêté au dernier point connu.');
          return;
        }
        setPendingSwitch(context);
        setOpen(false);
        setStopDecisionOpen(false);
        setPauseReasonOpen(false);
        return;
      }
      setInterventionId(context.interventionId ?? '');
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
  }, [active, recovery]);

  useEffect(() => {
    if (!open && !pendingSwitch && !stopDecisionOpen && !pauseReasonOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || timerRef.current?.contains(target)) return;
      setOpen(false);
      setPendingSwitch(null);
      setStopDecisionOpen(false);
      setPauseReasonOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [open, pendingSwitch, stopDecisionOpen, pauseReasonOpen]);

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

  function toggleManualTimer(): void {
    if (!open) {
      setInterventionId('');
      setNodeId('');
      setActivityLabel('');
    }
    setOpen((value) => !value);
  }

  async function start(): Promise<void> {
    setBusy(true);
    try {
      const session = await window.atoumweb.time.start({
        interventionId: interventionId || null,
        projectId: projectId || null,
        projectNodeId: nodeId || null,
        category,
        activityLabel: activityLabel.trim() || null,
        billable,
      });
      if (session.interventionId) await setInterventionStatus(session.interventionId, 'in_progress');
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

  async function confirmSwitch(): Promise<void> {
    if (!pendingSwitch) return;
    setBusy(true);
    try {
      const session = await window.atoumweb.time.switchTo({
        interventionId: pendingSwitch.interventionId ?? null,
        projectId: pendingSwitch.projectId ?? null,
        projectNodeId: pendingSwitch.nodeId ?? null,
        category: pendingSwitch.category ?? 'production',
        activityLabel: pendingSwitch.activityLabel?.trim() || null,
        billable: pendingSwitch.billable ?? true,
      });
      if (session.interventionId) await setInterventionStatus(session.interventionId, 'in_progress');
      installActive(session);
      setPendingSwitch(null);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Activité précédente terminée. Nouveau timer : ${contextLabel(session)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de changer d’activité.');
      await loadActive();
    } finally {
      setBusy(false);
    }
  }

  async function pauseOrResume(): Promise<void> {
    if (!active || recovery) return;
    if (!active.paused && active.interventionId) {
      setPauseReason('need_information');
      setPauseReasonNote('');
      setStopDecisionOpen(false);
      setPauseReasonOpen(true);
      return;
    }

    setBusy(true);
    try {
      const next = active.paused
        ? await window.atoumweb.time.resume(active.id)
        : await window.atoumweb.time.pause(active.id);
      if (active.paused && next.interventionId) await setInterventionStatus(next.interventionId, 'in_progress');
      installActive(next);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le timer.');
    } finally {
      setBusy(false);
    }
  }

  function requestStop(): void {
    if (!active || recovery) return;
    if (active.interventionId) {
      setPauseReasonOpen(false);
      setStopDecisionOpen(true);
      return;
    }
    void stopSession();
  }

  async function stopSession(): Promise<void> {
    if (!active || recovery) return;
    setBusy(true);
    try {
      const stopped = await window.atoumweb.time.stop(active.id);
      installActive(null);
      setInterventionId('');
      setPendingSwitch(null);
      setStopDecisionOpen(false);
      setPauseReasonOpen(false);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Session terminée · ${clock(stopped.durationSeconds)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter le timer.');
    } finally {
      setBusy(false);
    }
  }

  async function pauseIntervention(): Promise<void> {
    if (!active?.interventionId || recovery) return;
    setBusy(true);
    try {
      const next = await window.atoumweb.time.pause(active.id, pauseReason, pauseReasonNote);
      const status = pauseReason === 'need_information' ? 'waiting_client' : 'blocked';
      await setInterventionStatus(active.interventionId, status);
      installActive(next);
      setPauseReasonOpen(false);
      setStopDecisionOpen(false);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Timer mis en pause · ${PAUSE_REASON_LABELS[pauseReason]}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de mettre l’intervention en pause.');
    } finally {
      setBusy(false);
    }
  }

  async function resolveIntervention(): Promise<void> {
    if (!active?.interventionId || recovery) return;
    setBusy(true);
    try {
      const intervention = await window.atoumweb.operations.interventions.get(active.interventionId);
      const stopped = await window.atoumweb.time.stop(active.id);
      if (intervention.type === 'incident') {
        await window.atoumweb.operations.interventions.update(intervention.id, {
          incidentResolvedAt: intervention.incidentResolvedAt ?? new Date().toISOString(),
        });
      }
      await setInterventionStatus(intervention.id, 'to_validate');
      installActive(null);
      setInterventionId('');
      setPendingSwitch(null);
      setStopDecisionOpen(false);
      setPauseReasonOpen(false);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      if (intervention.type === 'incident') {
        window.dispatchEvent(new CustomEvent('atoumweb:open-intervention-conclusion', { detail: { interventionId: intervention.id } }));
        onMessage(`Timer arrêté · ${clock(stopped.durationSeconds)}. Complète maintenant la conclusion de panne avant clôture.`);
      } else {
        onMessage(`Timer arrêté · ${clock(stopped.durationSeconds)}. L’intervention passe « À valider ».`);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de terminer le travail en cours.');
    } finally {
      setBusy(false);
    }
  }

  async function recoverAndResume(): Promise<void> {
    if (!recovery) return;
    setBusy(true);
    try {
      const resumed = await window.atoumweb.time.recoverResume(recovery.id);
      if (resumed.interventionId) await setInterventionStatus(resumed.interventionId, 'in_progress');
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
      setPendingSwitch(null);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Chrono arrêté au dernier point connu · ${clock(stopped.durationSeconds)}. Tu pourras corriger la session dans Gestion des temps.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter ce chrono.');
    } finally {
      setBusy(false);
    }
  }

  const switchProject = pendingSwitch?.projectId ? projects.find((project) => project.id === pendingSwitch.projectId) : null;
  const switchLabel = pendingSwitch?.activityLabel?.trim()
    || (switchProject ? `${switchProject.number} · ${switchProject.name}` : null)
    || (pendingSwitch?.category ? CATEGORY_LABELS[pendingSwitch.category] : 'Nouvelle activité');

  return (
    <div ref={timerRef} className={`global-timer ${active ? 'running' : ''} ${active?.paused ? 'paused' : ''} ${recovery ? 'needs-recovery' : ''}`}>
      <button className="timer-main-button" type="button" onClick={() => !active && toggleManualTimer()} title={active ? contextLabel(active) : 'Démarrer une session de temps'}>
        <span className="timer-label">{recovery ? 'Timer · À vérifier' : `Timer${active?.paused ? ' · Pause' : active?.interventionId ? ' · En cours' : ''}`}</span>
        <strong>{clock(displayedSeconds)}</strong>
        <span className="timer-context">{active ? contextLabel(active) : 'Aucune activité'}</span>
      </button>

      {active ? (
        <div className="timer-actions">
          <button type="button" disabled={busy || Boolean(recovery)} onClick={() => void pauseOrResume()} title={active.paused ? 'Reprendre' : 'Mettre en pause'}>{active.paused ? '▶' : 'Ⅱ'}</button>
          <button type="button" disabled={busy || Boolean(recovery)} onClick={requestStop} title="Arrêter">■</button>
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

      {stopDecisionOpen && active?.interventionId && !recovery && (
        <div className="timer-popover timer-stop-decision" role="dialog" aria-label="Arrêter le timer d’intervention">
          <div><span className="eyebrow">Arrêt du timer</span><strong>L’intervention est-elle résolue ?</strong></div>
          <p>Choisis si le travail est terminé ou si tu dois simplement interrompre l’intervention.</p>
          <div className="button-row">
            <button className="primary-button" type="button" disabled={busy} onClick={() => void resolveIntervention()}>✓ Oui · conclusion</button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => { setStopDecisionOpen(false); setPauseReasonOpen(true); }}>Ⅱ Mettre en pause</button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => setStopDecisionOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      {pauseReasonOpen && active?.interventionId && !recovery && (
        <div className="timer-popover timer-pause-reason" role="dialog" aria-label="Motif de pause">
          <div><span className="eyebrow">Pause intervention</span><strong>Pourquoi interromps-tu le travail ?</strong></div>
          <label>Motif<select value={pauseReason} onChange={(event) => setPauseReason(event.target.value as TimePauseReason)}>{Object.entries(PAUSE_REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Précision facultative<textarea value={pauseReasonNote} onChange={(event) => setPauseReasonNote(event.target.value)} placeholder="Ex. attente d’un accès client, reprise demain matin…" /></label>
          <div className="button-row">
            <button className="primary-button" type="button" disabled={busy} onClick={() => void pauseIntervention()}>Enregistrer la pause</button>
            <button className="secondary-button" type="button" disabled={busy} onClick={() => setPauseReasonOpen(false)}>Annuler</button>
          </div>
        </div>
      )}

      {pendingSwitch && active && !recovery && (
        <div className="timer-popover timer-switch-popover" role="dialog" aria-label="Changer d’activité">
          <div><span className="eyebrow">Changer d’activité</span><strong>Un chrono est déjà en cours.</strong></div>
          <p>La session actuelle sera terminée à l’instant du changement, puis la nouvelle activité démarrera immédiatement.</p>
          <div className="timer-switch-summary"><span>En cours</span><strong>{contextLabel(active)}</strong><span>Nouvelle activité</span><strong>{switchLabel}</strong></div>
          <div className="button-row"><button className="primary-button" type="button" disabled={busy} onClick={() => void confirmSwitch()}>Terminer et démarrer</button><button className="secondary-button" type="button" disabled={busy} onClick={() => setPendingSwitch(null)}>Annuler</button></div>
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
  const parts = [session.clientLabel, session.projectNumber ? `${session.projectNumber} · ${session.projectLabel ?? ''}` : session.projectLabel, session.interventionNumber ? `${session.interventionNumber} · ${session.interventionLabel ?? ''}` : null, session.projectNodeLabel, session.activityLabel]
    .map((value) => value?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(' › ') : CATEGORY_LABELS[session.category];
}

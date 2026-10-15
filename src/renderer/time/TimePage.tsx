import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import { BUSINESS_TIME_CATEGORIES, type BusinessTimeCategory } from '../../shared/operational';
import { useEffect, useMemo, useState } from 'react';
import type { ProjectSummary } from '../../shared/projects';
import { OperationIcon } from '../operations/OperationIcon';
import { TIME_CATEGORIES, type TimeCategory, type TimeSession, type TimeSessionFilters, type TimeSummary } from '../../shared/time';
import { matchStatisticsDrilldown, type StatisticsDrilldownRoute } from '../../shared/statisticsDrilldown';

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

type Period = 'today' | 'week' | 'month';

function secondsLabel(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}

function dateTimeLabel(value: string): string {
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function periodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  if (period === 'today') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (period === 'week') {
    const day = from.getDay() || 7;
    from.setDate(from.getDate() - day + 1);
    from.setHours(0, 0, 0, 0);
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to.setMonth(to.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TimePage({ onMessage, statisticsDrilldown, onClearStatisticsDrilldown }: {
  onMessage: (message: string) => void;
  statisticsDrilldown?: StatisticsDrilldownRoute | null;
  onClearStatisticsDrilldown?: () => void;
}) {
  const [period, setPeriod] = useState<Period>('today');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<'all' | TimeCategory>('all');
  const [billable, setBillable] = useState<'all' | 'yes' | 'no'>('all');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [summary, setSummary] = useState<TimeSummary>({ totalSeconds: 0, billableSeconds: 0, nonBillableSeconds: 0, sessionCount: 0 });
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [manualOpen, setManualOpen] = useState(false);
  const [manualProjectId, setManualProjectId] = useState('');
  const [manualCategory, setManualCategory] = useState<TimeCategory>('production');
  const [manualActivity, setManualActivity] = useState('');
  const [manualBusinessCategory,setManualBusinessCategory]=useState<BusinessTimeCategory|null>(null);
  const [manualBillable, setManualBillable] = useState(true);
  const [manualStart, setManualStart] = useState(() => {
    const date = new Date(); date.setMinutes(date.getMinutes() - 60); return toLocalInput(date);
  });
  const [manualEnd, setManualEnd] = useState(() => toLocalInput(new Date()));
  const [manualNote, setManualNote] = useState('');

  const [editing, setEditing] = useState<TimeSession | null>(null);
  const [editProjectId, setEditProjectId] = useState('');
  const [editCategory, setEditCategory] = useState<TimeCategory>('production');
  const [editActivity, setEditActivity] = useState('');
  const [editBillable, setEditBillable] = useState(true);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects) {
      if (project.clientAccountId) map.set(project.clientAccountId, project.clientLabel);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr-FR'));
  }, [projects]);

  const filteredProjects = useMemo(
    () => clientId ? projects.filter((project) => project.clientAccountId === clientId) : projects,
    [projects, clientId],
  );

  const drilldown = statisticsDrilldown?.kind === 'time' ? statisticsDrilldown : null;
  const filters = useMemo<TimeSessionFilters>(() => {
    const range = periodRange(period);
    return {
      ...range,
      clientAccountId: clientId || null,
      projectId: projectId || null,
      category: category === 'all' ? null : category,
      billable: billable === 'all' ? null : billable === 'yes',
    };
  }, [period, clientId, projectId, category, billable]);

  async function refresh(): Promise<void> {
    try {
      const [nextSessions, nextSummary, nextProjects, nextActive] = await Promise.all([
        drilldown ? window.atoumweb.time.list() : window.atoumweb.time.list(filters),
        drilldown ? Promise.resolve(null) : window.atoumweb.time.summary(filters),
        window.atoumweb.projects.projects.list(),
        window.atoumweb.time.active(),
      ]);
      const exact = drilldown ? matchStatisticsDrilldown(nextSessions, drilldown).rows : nextSessions;
      setSessions(exact);
      if (drilldown) {
        const totalSeconds = exact.reduce((sum, item) => sum + item.durationSeconds, 0);
        const billableSeconds = exact.filter(item => item.billable).reduce((sum, item) => sum + item.durationSeconds, 0);
        setSummary({ totalSeconds, billableSeconds, nonBillableSeconds: totalSeconds - billableSeconds, sessionCount: exact.length });
      } else if (nextSummary) setSummary(nextSummary);
      setProjects(nextProjects);
      setActiveSession(nextActive);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les temps.');
    }
  }

  useEffect(() => { void refresh(); }, [filters, drilldown]);

  useEffect(() => {
    const refreshEvent = () => void refresh();
    window.addEventListener('atoumweb:time-changed', refreshEvent);
    const interval = window.setInterval(refreshEvent, 30_000);
    return () => {
      window.removeEventListener('atoumweb:time-changed', refreshEvent);
      window.clearInterval(interval);
    };
  }, [filters, drilldown]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function addManual(): Promise<void> {
    try {
      if (!manualStart || !manualEnd) throw new Error('Renseigne le début et la fin.');
      const created = await window.atoumweb.time.addManual({
        projectId: manualProjectId || null,
        category: manualCategory,
        businessCategory:manualBusinessCategory,
        activityLabel: manualActivity.trim() || null,
        billable: manualBillable,
        startedAt: new Date(manualStart).toISOString(),
        endedAt: new Date(manualEnd).toISOString(),
        note: manualNote.trim() || null,
      });
      setManualOpen(false);
      setManualActivity('');
      setManualNote('');
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Temps manuel ajouté · ${secondsLabel(created.durationSeconds)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter ce temps.');
    }
  }

  function openCorrection(session: TimeSession): void {
    if (!session.endedAt) {
      onMessage('Arrête le chrono avant de corriger cette session.');
      return;
    }
    setEditing(session);
    setEditProjectId(session.projectId ?? '');
    setEditCategory(session.category);
    setEditActivity(session.activityLabel ?? '');
    setEditBillable(session.billable);
    setEditStart(toLocalInput(new Date(session.startedAt)));
    setEditEnd(toLocalInput(new Date(session.endedAt)));
    setEditNote(session.note ?? '');
    setManualOpen(false);
  }

  async function saveCorrection(): Promise<void> {
    if (!editing) return;
    setEditBusy(true);
    try {
      if (!editStart || !editEnd) throw new Error('Renseigne le début et la fin.');
      const updated = await window.atoumweb.time.update(editing.id, {
        projectId: editProjectId || null,
        projectNodeId: editProjectId === (editing.projectId ?? '') ? editing.projectNodeId ?? null : null,
        category: editCategory,
        businessCategory:editing.businessCategory,
        activityLabel: editActivity.trim() || null,
        billable: editBillable,
        startedAt: new Date(editStart).toISOString(),
        endedAt: new Date(editEnd).toISOString(),
        note: editNote.trim() || null,
      });
      setEditing(null);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Session corrigée · ${secondsLabel(updated.durationSeconds)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de corriger cette session.');
    } finally {
      setEditBusy(false);
    }
  }

  const secondsAngle = now.getSeconds() * 6;
  const minutesAngle = now.getMinutes() * 6 + now.getSeconds() * 0.1;
  const hoursAngle = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;

  return (
    <div className="time-page-stack">
      {drilldown && <section className="panel statistics-route-banner" aria-label="Filtre exact Statistiques">
        <strong>Sessions de temps · {drilldown.periodLabel}</strong>
        <p>Durées et tableau calculés uniquement sur les {drilldown.ids.length} sessions identifiées par le KPI. Les contrôles standards de période sont suspendus jusqu’à la sortie de ce filtre.</p>
        {sessions.length < new Set(drilldown.ids).size && <p role="alert">{new Set(drilldown.ids).size - sessions.length} session(s) de la cohorte sont devenues indisponibles ; aucune session de remplacement n’est ajoutée.</p>}
        <button className="secondary-button" type="button" onClick={onClearStatisticsDrilldown}>Quitter le filtre et revenir à ce mois</button>
      </section>}
      <div className="module-toolbar time-toolbar">
        <div className="time-period-tabs">
          <button className={period === 'today' ? 'active' : ''} type="button" disabled={!!drilldown} onClick={() => setPeriod('today')}>Aujourd’hui</button>
          <button className={period === 'week' ? 'active' : ''} type="button" disabled={!!drilldown} onClick={() => setPeriod('week')}>Cette semaine</button>
          <button className={period === 'month' ? 'active' : ''} type="button" disabled={!!drilldown} onClick={() => setPeriod('month')}>Ce mois</button>
        </div>
        <div className="toolbar-controls time-filters">
          <select value={clientId} disabled={!!drilldown} onChange={(event) => {
            const next = event.target.value;
            setClientId(next);
            if (projectId && next && !projects.some((project) => project.id === projectId && project.clientAccountId === next)) setProjectId('');
          }}><option value="">Tous les clients</option>{clientOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
          <select value={projectId} disabled={!!drilldown} onChange={(event) => setProjectId(event.target.value)}><option value="">Tous les projets</option>{filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select>
          <select value={category} disabled={!!drilldown} onChange={(event) => setCategory(event.target.value as 'all' | TimeCategory)}><option value="all">Toutes les catégories</option>{TIME_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select>
          <select value={billable} disabled={!!drilldown} onChange={(event) => setBillable(event.target.value as typeof billable)}><option value="all">Facturable + non facturable</option><option value="yes">Facturable</option><option value="no">Non facturable</option></select>
          <button className="primary-button" type="button" onClick={() => { setEditing(null); setManualOpen((value) => !value); }}>+ Temps manuel</button>
        </div>
      </div>

      <section className={`time-visual-strip ${activeSession ? 'has-active-timer' : ''}`}>
        <div className="time-analog-clock" aria-hidden="true">
          <span className="time-clock-center" />
          <span className="time-clock-hand time-clock-hour" style={{ transform: `translateX(-50%) rotate(${hoursAngle}deg)` }} />
          <span className="time-clock-hand time-clock-minute" style={{ transform: `translateX(-50%) rotate(${minutesAngle}deg)` }} />
          <span className="time-clock-hand time-clock-second" style={{ transform: `translateX(-50%) rotate(${secondsAngle}deg)` }} />
          <span className="time-clock-mark mark-12">12</span>
          <span className="time-clock-mark mark-3">3</span>
          <span className="time-clock-mark mark-6">6</span>
          <span className="time-clock-mark mark-9">9</span>
        </div>
        <div className="time-now-copy">
          <span className="eyebrow">Maintenant</span>
          <strong>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
          <p>{activeSession
            ? `Chrono en cours · ${activeSession.activityLabel || activeSession.projectNodeLabel || activeSession.projectLabel || 'Activité AtoumWeb'}`
            : 'Aucun chrono actif · prêt pour une nouvelle session.'}</p>
        </div>
        <div className="time-visual-status">
          <span className={`time-live-dot ${activeSession ? 'running' : ''}`} />
          <div><strong>{activeSession ? (activeSession.paused ? 'Chrono en pause' : 'Chrono actif') : 'Disponible'}</strong><small>{activeSession ? CATEGORY_LABELS[activeSession.category] : 'Suivi du temps'}</small></div>
        </div>
      </section>

      <div className="time-kpi-grid">
        <article className="kpi-card time-kpi-card"><span className="time-kpi-icon" aria-hidden="true"><OperationIcon name="clock" size={29} /></span><div><strong className="time-kpi-label">Temps total</strong><span className="time-kpi-value">{secondsLabel(summary.totalSeconds)}</span><small>{summary.sessionCount} session{summary.sessionCount > 1 ? 's' : ''}</small></div></article>
        <article className="kpi-card time-kpi-card"><span className="time-kpi-icon" aria-hidden="true"><OperationIcon name="euro" size={30} /></span><div><strong className="time-kpi-label">Facturable</strong><span className="time-kpi-value">{secondsLabel(summary.billableSeconds)}</span><small>Calculé depuis les sessions</small></div></article>
        <article className="kpi-card time-kpi-card"><span className="time-kpi-icon time-kpi-icon-nonbillable" aria-hidden="true"><OperationIcon name="piggy-broken" size={31} /></span><div><strong className="time-kpi-label">Non facturable</strong><span className="time-kpi-value">{secondsLabel(summary.nonBillableSeconds)}</span><small>Interne, formation, gestes…</small></div></article>
      </div>

      {manualOpen && (
        <section className="panel manual-time-panel">
          <div className="panel-title"><div><span className="eyebrow">Saisie manuelle</span><h2>Ajouter une session</h2></div><button className="close-detail" type="button" onClick={() => setManualOpen(false)} aria-label="Fermer" title="Fermer"><OperationIcon name="close"/></button></div>
          <div className="manual-time-grid">
            <label>Projet<select value={manualProjectId} onChange={(event) => setManualProjectId(event.target.value)}><option value="">AtoumWeb · sans projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
            <label>Catégorie<select value={manualCategory} onChange={(event) => setManualCategory(event.target.value as TimeCategory)}>{TIME_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
            <label>Début<input type="datetime-local" value={manualStart} onChange={(event) => setManualStart(event.target.value)} /></label>
            <label>Fin<input type="datetime-local" value={manualEnd} onChange={(event) => setManualEnd(event.target.value)} /></label>
            <label className="wide">Activité<input value={manualActivity} onChange={(event) => setManualActivity(event.target.value)} placeholder="Ex. Préparation maquette" /></label>
            <label className="wide">Note<textarea value={manualNote} onChange={(event) => setManualNote(event.target.value)} placeholder="Note facultative" /></label>
            <label>Catégorie métier<select aria-label="Catégorie métier manuelle" value={manualBusinessCategory ?? ''} onChange={e=>setManualBusinessCategory(e.target.value as BusinessTimeCategory || null)}><option value="">Non qualifiée</option>{BUSINESS_TIME_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
            <label className="time-checkbox"><input type="checkbox" checked={manualBillable} onChange={(event) => setManualBillable(event.target.checked)} /> Facturable</label>
          </div>
          <div className="button-row"><button className="primary-button" type="button" onClick={() => void addManual()}>Ajouter la session</button><button className="secondary-button" type="button" onClick={() => setManualOpen(false)}>Annuler</button></div>
        </section>
      )}

      {editing && (
        <section className="panel manual-time-panel time-correction-panel">
          <div className="panel-title"><div><span className="eyebrow">Correction</span><h2>Corriger une session terminée</h2><p className="muted">Les pauses déjà enregistrées sont conservées. Si les nouveaux horaires excluent une pause, le Manager refusera la correction pour éviter un calcul faux.</p></div><button className="close-detail" type="button" onClick={() => setEditing(null)} aria-label="Fermer" title="Fermer"><OperationIcon name="close"/></button></div>
          <div className="manual-time-grid">
            <label>Projet<select value={editProjectId} onChange={(event) => setEditProjectId(event.target.value)}><option value="">AtoumWeb · sans projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
            <label>Catégorie<select value={editCategory} onChange={(event) => setEditCategory(event.target.value as TimeCategory)}>{TIME_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
            <label>Début<input type="datetime-local" value={editStart} onChange={(event) => setEditStart(event.target.value)} /></label>
            <label>Fin<input type="datetime-local" value={editEnd} onChange={(event) => setEditEnd(event.target.value)} /></label>
            <label className="wide">Activité<input value={editActivity} onChange={(event) => setEditActivity(event.target.value)} /></label>
            <label className="wide">Note<textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} placeholder="Pourquoi cette correction ?" /></label>
            <label className="time-checkbox"><input type="checkbox" checked={editBillable} onChange={(event) => setEditBillable(event.target.checked)} /> Facturable</label>
          </div>
          {editing.projectNodeLabel && <p className="time-correction-context">Tâche liée : <strong>{editing.projectNodeLabel}</strong>{editProjectId !== (editing.projectId ?? '') ? ' · la tâche sera retirée car le projet a changé.' : ' · elle sera conservée.'}</p>}
          <div className="button-row"><button className="primary-button" type="button" disabled={editBusy} onClick={() => void saveCorrection()}>{editBusy ? 'Enregistrement…' : 'Enregistrer la correction'}</button><button className="secondary-button" type="button" disabled={editBusy} onClick={() => setEditing(null)}>Annuler</button></div>
        </section>
      )}

      <section className="panel time-list-panel">
        <ConfiguredDataTable<(typeof sessions)[number]> scope="time-sessions" store={window.atoumweb.visualPreferences} rows={sessions} selectedId={null} getId={session=>session.id} className="time-table" caption="Sessions de la période et des filtres courants · source complète" columns={[
{id:'identity',label:"Date",required:true,sortValue:session=>session.startedAt??null,render:session=><><span className="time-cell-value">{dateTimeLabel(session.startedAt)}</span>{!session.endedAt && <small className="time-live">En cours{session.paused ? ' · pause' : ''}</small>}</>},
{id:'context',label:"Contexte",sortValue:session=>session.projectLabel??null,render:session=><><span className="time-cell-value">{session.projectNumber ? `${session.projectNumber} · ${session.projectLabel ?? ''}` : session.projectLabel || 'AtoumWeb'}</span><small>{session.projectNodeLabel || session.activityLabel || '—'}</small></>},
{id:'category',label:"Catégorie",sortValue:session=>session.category??null,render:session=><><span className="time-category-pill">{CATEGORY_LABELS[session.category]}</span><small>{session.businessCategory ?? 'Métier non qualifié'}</small></>},
{id:'duration',label:"Durée",sortValue:session=>session.durationSeconds??null,render:session=><><span className="time-cell-value">{secondsLabel(session.durationSeconds)}</span></>},
{id:'billable',label:"Facturable",sortValue:session=>session.billable?1:0,render:session=><><span className={`time-billable-pill ${session.billable ? 'yes' : 'no'}`}>{session.billable ? 'Oui' : 'Non'}</span></>},
{id:'source',label:"Source",sortValue:session=>session.source??null,render:session=><><span className={`time-source-pill source-${session.source}`}><OperationIcon name={session.source==='timer'?'clock':session.source==='manual'?'file-text':'upload'}/>{session.source === 'timer' ? 'Timer' : session.source === 'manual' ? 'Manuel' : 'Import'}</span></>},
{id:'actions',label:"Actions",required:true,render:session=><>{session.endedAt ? <button className="text-button" type="button" onClick={() => openCorrection(session)}>Corriger</button> : <span className="muted">En cours</span>}</>}
]}/>
      </section>
    </div>
  );
}

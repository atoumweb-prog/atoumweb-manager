import { useEffect, useMemo, useState } from 'react';
import {
  INCIDENT_CRITICALITIES,
  type IncidentCriticality,
  type Intervention,
} from '../../shared/operations';
import type { OperationsAlert, OperationsAlertsSnapshot } from '../../shared/operationsAlerts';
import { OperationIcon } from './OperationIcon';
import './incident-quick-editor.css';

type TargetView = 'interventions' | 'maintenance' | 'packs';

const SEVERITY_LABELS = { critical: 'Urgent', warning: 'À surveiller', info: 'Information' } as const;
const CRITICALITY_LABELS: Record<IncidentCriticality, string> = {
  normal: 'Normale',
  urgent: 'Urgente',
  critical: 'Critique',
};

function targetFor(alert: OperationsAlert): TargetView {
  if (alert.interventionId) return 'interventions';
  if (alert.hourPackId) return 'packs';
  return 'maintenance';
}

function toLocalDateTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function OperationsAlertsPanel({ refreshKey, onNavigate, onMessage }: {
  refreshKey: number;
  onNavigate: (view: TargetView) => void;
  onMessage: (message: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<OperationsAlertsSnapshot | null>(null);
  const [incidents, setIncidents] = useState<Intervention[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [incidentsExpanded, setIncidentsExpanded] = useState(false);

  async function load(): Promise<void> {
    try {
      const [nextSnapshot, nextIncidents] = await Promise.all([
        window.atoumweb.operationsAlerts.get(),
        window.atoumweb.operations.interventions.list({ type: 'incident' }),
      ]);
      setSnapshot(nextSnapshot);
      const openIncidents = nextIncidents.filter((incident) => !['completed', 'cancelled', 'archived'].includes(incident.status));
      setIncidents(openIncidents);
      if (selectedIncidentId && !openIncidents.some((incident) => incident.id === selectedIncidentId)) setSelectedIncidentId(null);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les alertes opérations.');
    }
  }

  useEffect(() => { void load(); }, [refreshKey]);

  const alerts = snapshot?.alerts ?? [];
  const visible = useMemo(() => expanded ? alerts : alerts.slice(0, 4), [alerts, expanded]);
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId) ?? null;

  async function handleAlert(alert: OperationsAlert): Promise<void> {
    if (alert.kind === 'incident_critical_open' && alert.interventionId) {
      const known = incidents.find((incident) => incident.id === alert.interventionId);
      if (known) {
        setSelectedIncidentId(known.id);
        setIncidentsExpanded(true);
        return;
      }
      try {
        const incident = await window.atoumweb.operations.interventions.get(alert.interventionId);
        setIncidents((current) => current.some((item) => item.id === incident.id) ? current : [incident, ...current]);
        setSelectedIncidentId(incident.id);
        setIncidentsExpanded(true);
        return;
      } catch (error) {
        onMessage(error instanceof Error ? error.message : 'Incident introuvable.');
      }
    }
    onNavigate(targetFor(alert));
  }

  const incidentAlertIds = new Set(alerts.filter((alert) => alert.kind === 'incident_critical_open').map((alert) => alert.interventionId).filter(Boolean));
  const additionalIncidentCount = incidents.filter((incident) => !incidentAlertIds.has(incident.id)).length;
  const attentionCount = alerts.length + additionalIncidentCount;
  const billingCount = alerts.filter((alert) => alert.kind === 'intervention_ready_to_bill').length;
  const maintenanceCount = alerts.filter((alert) => alert.kind.startsWith('maintenance_')).length;
  const packCount = alerts.filter((alert) => alert.kind.startsWith('hour_pack_')).length;

  return <section className={`panel operations-alerts-panel health-strip ${attentionCount === 0 ? 'is-clear' : 'has-attention'}`}>
    <div className="operations-health-main">
      <span className="operations-health-icon"><OperationIcon name={attentionCount === 0 ? 'shield-check' : 'alert'} size={22} /></span>
      <div>
        <span className="eyebrow">Suivi opérationnel</span>
        <strong>{attentionCount === 0 ? 'Tout est à jour' : `${attentionCount} point(s) à traiter`}</strong>
        <small>Incidents, facturation, maintenance et packs d’heures.</small>
      </div>
    </div>

    <div className="operations-health-counters" aria-label="Points suivis">
      <button type="button" className={incidents.length ? 'operations-health-chip has-value' : 'operations-health-chip'} onClick={() => incidents.length && setIncidentsExpanded((value) => !value)} disabled={!incidents.length}>
        <OperationIcon name="alert" size={16} /><span>Incidents</span><strong>{incidents.length}</strong>
      </button>
      <span className={billingCount ? 'operations-health-chip has-value' : 'operations-health-chip'}><OperationIcon name="receipt" size={16} /><span>À facturer</span><strong>{billingCount}</strong></span>
      <span className={maintenanceCount ? 'operations-health-chip has-value' : 'operations-health-chip'}><OperationIcon name="maintenance" size={16} /><span>Maintenance</span><strong>{maintenanceCount}</strong></span>
      <span className={packCount ? 'operations-health-chip has-value' : 'operations-health-chip'}><OperationIcon name="hourglass" size={16} /><span>Packs</span><strong>{packCount}</strong></span>
    </div>

    <div className="operations-health-actions">
      {criticalCount > 0 && <span className="operation-priority priority-urgent">{criticalCount} urgent(s)</span>}
      <button className="icon-button" type="button" title="Actualiser le suivi" aria-label="Actualiser le suivi" onClick={() => void load()}><OperationIcon name="refresh" size={17} /></button>
    </div>

    {alerts.length > 0 && <div className="operations-alerts-list">
      {visible.map((alert) => <button key={alert.id} type="button" className={`operations-alert alert-${alert.severity}`} onClick={() => void handleAlert(alert)}>
        <span className="operations-alert-severity">{SEVERITY_LABELS[alert.severity]}</span>
        <strong>{alert.title}</strong>
        <small>{alert.clientLabel}{alert.projectLabel ? ` · ${alert.projectLabel}` : ''}</small>
        <p>{alert.detail}</p>
      </button>)}
      {alerts.length > 4 && <button className="operations-alerts-more" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Réduire' : `Afficher les ${alerts.length - 4} autre(s)`}</button>}
    </div>}

    {incidentsExpanded && <div className="incident-watch-layout">
      <div className="incident-watch-list">
        {incidents.length === 0 && <p className="muted">Aucun incident ouvert.</p>}
        {incidents.map((incident) => <button key={incident.id} type="button" className={selectedIncidentId === incident.id ? 'incident-watch-item selected' : 'incident-watch-item'} onClick={() => setSelectedIncidentId(incident.id)}>
          <span className={`incident-criticality criticality-${incident.incidentCriticality ?? 'normal'}`}>{CRITICALITY_LABELS[incident.incidentCriticality ?? 'normal']}</span>
          <strong>{incident.number} · {incident.subject}</strong>
          <small>{incident.clientLabel}{incident.projectLabel ? ` · ${incident.projectLabel}` : ''}</small>
        </button>)}
      </div>
      {selectedIncident && <IncidentQuickEditor
        intervention={selectedIncident}
        onSaved={async (updated) => {
          setIncidents((current) => current.map((incident) => incident.id === updated.id ? updated : incident));
          await load();
        }}
        onOpenInterventions={() => onNavigate('interventions')}
        onMessage={onMessage}
      />}
    </div>}

    {snapshot && <small className="operations-alert-thresholds">Seuil pack : {Math.round(snapshot.thresholds.hourPackLowSeconds / 3600 * 10) / 10} h ou {snapshot.thresholds.hourPackLowPercent} % · expiration : {snapshot.thresholds.hourPackExpiryDays} j</small>}
  </section>;
}

function IncidentQuickEditor({ intervention, onSaved, onOpenInterventions, onMessage }: {
  intervention: Intervention;
  onSaved: (updated: Intervention) => Promise<void>;
  onOpenInterventions: () => void;
  onMessage: (message: string) => void;
}) {
  const [criticality, setCriticality] = useState<IncidentCriticality>(intervention.incidentCriticality ?? 'normal');
  const [startedAt, setStartedAt] = useState(toLocalDateTime(intervention.incidentStartedAt));
  const [resolvedAt, setResolvedAt] = useState(toLocalDateTime(intervention.incidentResolvedAt));
  const [downtimeMinutes, setDowntimeMinutes] = useState(intervention.downtimeMinutes?.toString() ?? '');
  const [cause, setCause] = useState(intervention.incidentCause ?? '');
  const [diagnosis, setDiagnosis] = useState(intervention.incidentDiagnosis ?? '');
  const [solution, setSolution] = useState(intervention.incidentSolution ?? '');
  const [followUp, setFollowUp] = useState(intervention.incidentFollowUp ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCriticality(intervention.incidentCriticality ?? 'normal');
    setStartedAt(toLocalDateTime(intervention.incidentStartedAt));
    setResolvedAt(toLocalDateTime(intervention.incidentResolvedAt));
    setDowntimeMinutes(intervention.downtimeMinutes?.toString() ?? '');
    setCause(intervention.incidentCause ?? '');
    setDiagnosis(intervention.incidentDiagnosis ?? '');
    setSolution(intervention.incidentSolution ?? '');
    setFollowUp(intervention.incidentFollowUp ?? '');
  }, [intervention.id, intervention.updatedAt]);

  async function save(): Promise<void> {
    const downtime = downtimeMinutes.trim() === '' ? null : Number(downtimeMinutes);
    if (downtime != null && (!Number.isInteger(downtime) || downtime < 0)) {
      onMessage('La durée d’indisponibilité doit être un nombre entier de minutes.');
      return;
    }
    setSaving(true);
    try {
      const updated = await window.atoumweb.operations.interventions.update(intervention.id, {
        incidentCriticality: criticality,
        incidentStartedAt: startedAt || null,
        incidentResolvedAt: resolvedAt || null,
        downtimeMinutes: downtime,
        incidentCause: cause.trim() || null,
        incidentDiagnosis: diagnosis.trim() || null,
        incidentSolution: solution.trim() || null,
        incidentFollowUp: followUp.trim() || null,
      });
      await onSaved(updated);
      onMessage(`Incident ${updated.number} mis à jour.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour l’incident.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="incident-quick-editor">
    <div className="incident-quick-editor-heading">
      <div><span className="eyebrow">Fiche Incident</span><h3>{intervention.number}</h3><p>{intervention.subject}</p></div>
      <button className="text-button" type="button" onClick={onOpenInterventions}>Voir dans Interventions</button>
    </div>
    <div className="incident-quick-grid">
      <label>Criticité<select value={criticality} onChange={(event) => setCriticality(event.target.value as IncidentCriticality)}>{INCIDENT_CRITICALITIES.map((value) => <option key={value} value={value}>{CRITICALITY_LABELS[value]}</option>)}</select></label>
      <label>Début<input type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} /></label>
      <label>Résolution<input type="datetime-local" value={resolvedAt} onChange={(event) => setResolvedAt(event.target.value)} /></label>
      <label>Indisponibilité (min)<input type="number" min="0" step="1" value={downtimeMinutes} onChange={(event) => setDowntimeMinutes(event.target.value)} /></label>
    </div>
    <label>Cause<textarea value={cause} onChange={(event) => setCause(event.target.value)} placeholder="Cause identifiée ou supposée" /></label>
    <label>Diagnostic<textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Constat technique" /></label>
    <label>Solution<textarea value={solution} onChange={(event) => setSolution(event.target.value)} placeholder="Action réalisée / solution" /></label>
    <label>Suivi<textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Contrôles ou actions à prévoir" /></label>
    <div className="incident-quick-actions">
      <span className="muted">Sauvegarde liée : disponible à partir de la Phase 6 / Sauvegardes métier.</span>
      <button className="primary-button" type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Enregistrement…' : 'Enregistrer l’incident'}</button>
    </div>
  </div>;
}

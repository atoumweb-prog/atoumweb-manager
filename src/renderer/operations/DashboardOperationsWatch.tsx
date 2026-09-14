import { useEffect, useMemo, useState } from 'react';
import type { Intervention, ServiceRequest } from '../../shared/operations';
import type { OperationsAlert, OperationsAlertsSnapshot } from '../../shared/operationsAlerts';
import type { OperationsSearchTarget } from './OperationsPage';
import './DashboardOperationsWatch.css';

const SEVERITY_LABELS = { critical: 'Urgent', warning: 'À surveiller', info: 'Information' } as const;

function targetFor(alert: OperationsAlert): OperationsSearchTarget | null {
  if (alert.interventionId) return { entityType: 'intervention', entityId: alert.interventionId };
  if (alert.hourPackId) return { entityType: 'hour_pack', entityId: alert.hourPackId };
  if (alert.maintenanceSubscriptionId) return { entityType: 'maintenance', entityId: alert.maintenanceSubscriptionId };
  return null;
}

export function DashboardOperationsWatch({ onOpen, onMessage }: {
  onOpen: (target: OperationsSearchTarget) => void;
  onMessage: (message: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<OperationsAlertsSnapshot | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  async function load(): Promise<void> {
    try {
      const [nextSnapshot, nextRequests, nextInterventions] = await Promise.all([
        window.atoumweb.operationsAlerts.get(),
        window.atoumweb.operations.requests.list(),
        window.atoumweb.operations.interventions.list(),
      ]);
      setSnapshot(nextSnapshot);
      setRequests(nextRequests);
      setInterventions(nextInterventions);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger le suivi opérationnel.');
    }
  }

  useEffect(() => { void load(); }, []);

  const alerts = snapshot?.alerts ?? [];
  const visible = useMemo(() => alerts.slice(0, 5), [alerts]);
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const requestsToHandle = requests.filter((request) => !['closed', 'converted', 'archived'].includes(request.status)).length;
  const interventionsInProgress = interventions.filter((intervention) => intervention.status === 'in_progress').length;
  const interventionsToValidate = interventions.filter((intervention) => intervention.status === 'to_validate').length;

  return <article className="panel panel-large dashboard-operations-watch">
    <div className="dashboard-watch-heading">
      <div>
        <span className="eyebrow">À surveiller</span>
        <h2>{alerts.length ? `${alerts.length} point(s) opérationnel(s)` : 'Tout est à jour'}</h2>
      </div>
      <div className="dashboard-watch-actions">
        {criticalCount > 0 && <span className="operation-priority priority-urgent">{criticalCount} urgent(s)</span>}
        <button className="secondary-button" type="button" onClick={() => void load()}>↻</button>
      </div>
    </div>

    <div className="dashboard-operation-kpis">
      <div><span>Demandes à traiter</span><strong>{requestsToHandle}</strong></div>
      <div><span>Interventions en cours</span><strong>{interventionsInProgress}</strong></div>
      <div><span>À valider</span><strong>{interventionsToValidate}</strong></div>
      <div><span>Alertes urgentes</span><strong>{criticalCount}</strong></div>
    </div>

    {alerts.length === 0 ? <p className="muted">Aucun incident critique ouvert, aucune maintenance en retard, aucun dépassement à décider, aucune intervention prête à facturer et aucun pack sous les seuils d’alerte.</p> : <div className="dashboard-watch-list">
      {visible.map((alert) => {
        const target = targetFor(alert);
        return <button key={alert.id} type="button" className={`dashboard-watch-item watch-${alert.severity}`} disabled={!target} onClick={() => target && onOpen(target)}>
          <span className="dashboard-watch-severity">{SEVERITY_LABELS[alert.severity]}</span>
          <span className="dashboard-watch-main"><strong>{alert.title}</strong><small>{alert.clientLabel}{alert.projectLabel ? ` · ${alert.projectLabel}` : ''}</small><span>{alert.detail}</span></span>
          <span aria-hidden="true">›</span>
        </button>;
      })}
      {alerts.length > visible.length && <small className="dashboard-watch-more">+ {alerts.length - visible.length} autre(s) point(s) dans Interventions & Maintenance</small>}
    </div>}
  </article>;
}

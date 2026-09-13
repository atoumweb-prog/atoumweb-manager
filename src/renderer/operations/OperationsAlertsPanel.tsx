import { useEffect, useMemo, useState } from 'react';
import type { OperationsAlert, OperationsAlertsSnapshot } from '../../shared/operationsAlerts';

type TargetView = 'maintenance' | 'packs';

const SEVERITY_LABELS = { critical: 'Urgent', warning: 'À surveiller', info: 'Information' } as const;

function targetFor(alert: OperationsAlert): TargetView {
  return alert.hourPackId ? 'packs' : 'maintenance';
}

export function OperationsAlertsPanel({ refreshKey, onNavigate, onMessage }: {
  refreshKey: number;
  onNavigate: (view: TargetView) => void;
  onMessage: (message: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<OperationsAlertsSnapshot | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function load(): Promise<void> {
    try {
      setSnapshot(await window.atoumweb.operationsAlerts.get());
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les alertes opérations.');
    }
  }

  useEffect(() => { void load(); }, [refreshKey]);

  const alerts = snapshot?.alerts ?? [];
  const visible = useMemo(() => expanded ? alerts : alerts.slice(0, 4), [alerts, expanded]);
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;

  return <section className="panel operations-alerts-panel">
    <div className="operations-alerts-heading">
      <div><span className="eyebrow">À surveiller</span><h2>{alerts.length ? `${alerts.length} point(s) à suivre` : 'Aucune alerte opérationnelle'}</h2></div>
      <div className="operations-alerts-actions">
        {criticalCount > 0 && <span className="operation-priority priority-urgent">{criticalCount} urgent(s)</span>}
        <button className="secondary-button" type="button" onClick={() => void load()}>↻</button>
      </div>
    </div>
    {alerts.length === 0 ? <p className="muted">Maintenance, quotas et packs ne présentent actuellement aucun point critique selon les seuils configurés.</p> : <div className="operations-alerts-list">
      {visible.map((alert) => <button key={alert.id} type="button" className={`operations-alert alert-${alert.severity}`} onClick={() => onNavigate(targetFor(alert))}>
        <span className="operations-alert-severity">{SEVERITY_LABELS[alert.severity]}</span>
        <strong>{alert.title}</strong>
        <small>{alert.clientLabel}{alert.projectLabel ? ` · ${alert.projectLabel}` : ''}</small>
        <p>{alert.detail}</p>
      </button>)}
      {alerts.length > 4 && <button className="operations-alerts-more" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Réduire' : `Afficher les ${alerts.length - 4} autre(s)`}</button>}
    </div>}
    {snapshot && <small className="operations-alert-thresholds">Seuil pack : {Math.round(snapshot.thresholds.hourPackLowSeconds / 3600 * 10) / 10} h ou {snapshot.thresholds.hourPackLowPercent} % · expiration : {snapshot.thresholds.hourPackExpiryDays} j</small>}
  </section>;
}

import { useEffect, useState } from 'react';
import type {
  HourPack,
  Intervention,
  MaintenanceSubscription,
  ServiceRequest,
} from '../../shared/operations';
import './ClientOperationsTab.css';

function duration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${String(rest).padStart(2, '0')}` : `${rest} min`;
}

export function ClientOperationsTab({ clientId, onMessage }: { clientId: string; onMessage: (message: string) => void }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceSubscription[]>([]);
  const [packs, setPacks] = useState<HourPack[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const [nextRequests, nextInterventions, nextMaintenance, nextPacks] = await Promise.all([
        window.atoumweb.operations.requests.list({ clientAccountId: clientId, includeArchived: true }),
        window.atoumweb.operations.interventions.list({ clientAccountId: clientId, includeArchived: true }),
        window.atoumweb.operations.maintenance.subscriptions.list({ clientAccountId: clientId, includeArchived: true }),
        window.atoumweb.operations.hourPacks.list({ clientAccountId: clientId, includeArchived: true }),
      ]);
      setRequests(nextRequests);
      setInterventions(nextInterventions);
      setMaintenance(nextMaintenance);
      setPacks(nextPacks);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les opérations de ce client.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [clientId]);

  if (loading) return <p className="muted">Chargement des interventions du client…</p>;

  const openRequests = requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status));
  const openInterventions = interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status));
  const activeMaintenance = maintenance.filter((item) => !['ended', 'archived'].includes(item.status));
  const activePacks = packs.filter((item) => !['archived', 'expired'].includes(item.status));

  return <div className="client-operations-tab">
    <div className="client-operations-kpis">
      <OperationKpi label="Demandes ouvertes" value={String(openRequests.length)} />
      <OperationKpi label="Interventions en cours" value={String(openInterventions.length)} />
      <OperationKpi label="Maintenances" value={String(activeMaintenance.length)} />
      <OperationKpi label="Packs actifs" value={String(activePacks.length)} />
    </div>

    <OperationSection title="Demandes" empty="Aucune demande enregistrée.">
      {requests.slice(0, 5).map((request) => <div className="client-operation-row" key={request.id}><div><strong>{request.subject}</strong><small>{request.projectLabel || 'Sans projet'} · {request.source}</small></div><span>{request.status}</span></div>)}
    </OperationSection>

    <OperationSection title="Interventions" empty="Aucune intervention enregistrée.">
      {interventions.slice(0, 5).map((intervention) => <div className="client-operation-row" key={intervention.id}><div><strong>{intervention.number} · {intervention.subject}</strong><small>{intervention.projectLabel || 'Sans projet'} · {duration(intervention.totalTimeSeconds)}</small></div><span>{intervention.status}</span></div>)}
    </OperationSection>

    <OperationSection title="Maintenance" empty="Aucune souscription de maintenance.">
      {maintenance.map((subscription) => <div className="client-operation-row" key={subscription.id}><div><strong>{subscription.planName}</strong><small>{subscription.projectLabel || 'Tous / sans projet dédié'} · {subscription.includedInterventions} intervention(s) / période</small></div><span>{subscription.status}</span></div>)}
    </OperationSection>

    <OperationSection title="Packs d’heures" empty="Aucun pack d’heures.">
      {packs.map((pack) => <div className="client-operation-row" key={pack.id}><div><strong>{pack.name}</strong><small>{pack.projectLabel || 'Sans projet dédié'} · {duration(pack.balanceSeconds)} restant</small></div><span>{pack.status}</span></div>)}
    </OperationSection>

    <button className="secondary-button client-operations-refresh" type="button" onClick={() => void load()}>↻ Actualiser</button>
  </div>;
}

function OperationKpi({ label, value }: { label: string; value: string }) {
  return <div className="client-operation-kpi"><span>{label}</span><strong>{value}</strong></div>;
}

function OperationSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="client-operation-section"><strong>{title}</strong>{hasChildren ? children : <p className="muted">{empty}</p>}</section>;
}

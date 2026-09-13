import { useEffect, useState } from 'react';
import type {
  HourPack,
  Intervention,
  MaintenanceSubscription,
  ServiceRequest,
} from '../../shared/operations';
import './ProjectOperationsTab.css';

function duration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${String(rest).padStart(2, '0')}` : `${rest} min`;
}

export function ProjectOperationsTab({ projectId, onMessage }: { projectId: string; onMessage: (message: string) => void }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceSubscription[]>([]);
  const [packs, setPacks] = useState<HourPack[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const [nextRequests, nextInterventions, nextMaintenance, nextPacks] = await Promise.all([
        window.atoumweb.operations.requests.list({ projectId, includeArchived: true }),
        window.atoumweb.operations.interventions.list({ projectId, includeArchived: true }),
        window.atoumweb.operations.maintenance.subscriptions.list({ projectId, includeArchived: true }),
        window.atoumweb.operations.hourPacks.list({ projectId, includeArchived: true }),
      ]);
      setRequests(nextRequests);
      setInterventions(nextInterventions);
      setMaintenance(nextMaintenance);
      setPacks(nextPacks);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les opérations de ce projet.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [projectId]);

  if (loading) return <div className="project-tab-content"><p className="muted">Chargement des opérations du projet…</p></div>;

  const openRequests = requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status));
  const openInterventions = interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status));

  return <div className="project-tab-content project-operations-tab">
    <div className="project-operation-kpis">
      <OperationKpi label="Demandes ouvertes" value={String(openRequests.length)} />
      <OperationKpi label="Interventions en cours" value={String(openInterventions.length)} />
      <OperationKpi label="Maintenances" value={String(maintenance.filter((item) => !['ended', 'archived'].includes(item.status)).length)} />
      <OperationKpi label="Packs" value={String(packs.filter((item) => !['expired', 'archived'].includes(item.status)).length)} />
    </div>

    <OperationSection title="Demandes" empty="Aucune demande pour ce projet.">
      {requests.slice(0, 6).map((request) => <div className="project-operation-row" key={request.id}><div><strong>{request.subject}</strong><small>{request.source} · priorité {request.priority}</small></div><span>{request.status}</span></div>)}
    </OperationSection>

    <OperationSection title="Interventions" empty="Aucune intervention pour ce projet.">
      {interventions.slice(0, 8).map((intervention) => <div className="project-operation-row" key={intervention.id}><div><strong>{intervention.number} · {intervention.subject}</strong><small>{intervention.type} · {duration(intervention.totalTimeSeconds)} · {intervention.coverageMode}</small></div><span>{intervention.status}</span></div>)}
    </OperationSection>

    <OperationSection title="Maintenance" empty="Aucune maintenance liée à ce projet.">
      {maintenance.map((subscription) => <div className="project-operation-row" key={subscription.id}><div><strong>{subscription.planName}</strong><small>{subscription.includedInterventions} intervention(s) incluse(s) / période</small></div><span>{subscription.status}</span></div>)}
    </OperationSection>

    <OperationSection title="Packs d’heures" empty="Aucun pack lié à ce projet.">
      {packs.map((pack) => <div className="project-operation-row" key={pack.id}><div><strong>{pack.name}</strong><small>{duration(pack.balanceSeconds)} restant · {duration(pack.consumedSeconds)} consommé</small></div><span>{pack.status}</span></div>)}
    </OperationSection>

    <button className="secondary-button project-operations-refresh" type="button" onClick={() => void load()}>↻ Actualiser</button>
  </div>;
}

function OperationKpi({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function OperationSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="project-operation-section"><strong>{title}</strong>{hasChildren ? children : <p className="muted">{empty}</p>}</section>;
}

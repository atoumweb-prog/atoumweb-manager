import type { ReactNode } from 'react';
import { OperationIcon } from '../operations/OperationIcon';
import { useEffect, useState } from 'react';
import type {
  HourPack,
  Intervention,
  MaintenanceSubscription,
  ServiceRequest,
} from '../../shared/operations';
import {
  COVERAGE_LABELS,
  HOUR_PACK_STATUS_LABELS,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_TYPE_LABELS,
  MAINTENANCE_SUBSCRIPTION_STATUS_LABELS,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  SOURCE_LABELS,
  readableLabel,
} from '../../shared/operationLabels';
import { limitItems, plural } from '../../shared/projectTabs';
import { StatusPill } from '../ui/StatusPill';
import { operationStatusTone } from '../ui/operationStatusTone';
import './ProjectOperationsTab.css';

const REQUEST_LIMIT = 6;
const INTERVENTION_LIMIT = 8;

function duration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${String(rest).padStart(2, '0')}` : `${rest} min`;
}

/** « + 2 autres demandes non affichées » : ce que la limite d'affichage cache est toujours dit. */
function hiddenLabel(hidden: number, noun: string): string {
  const many = hidden > 1;
  return `+ ${hidden} ${many ? 'autres' : 'autre'} ${noun}${many ? 's' : ''} non affichée${many ? 's' : ''}`;
}

export interface ProjectOperationsViewProps {
  requests: ServiceRequest[];
  interventions: Intervention[];
  maintenance: MaintenanceSubscription[];
  packs: HourPack[];
  onRefresh: () => void;
}

/** Interventions d'un projet : un seul message quand tout est vide, sinon seulement les sections qui ont du contenu. */
export function ProjectOperationsView({ requests, interventions, maintenance, packs, onRefresh }: ProjectOperationsViewProps) {
  const empty = requests.length + interventions.length + maintenance.length + packs.length === 0;
  const openRequests = requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status)).length;
  const openInterventions = interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status)).length;
  const shownRequests = limitItems(requests, REQUEST_LIMIT);
  const shownInterventions = limitItems(interventions, INTERVENTION_LIMIT);

  return <div className="project-tab-content project-operations-view">
    {empty && <p className="project-empty">Aucune demande ni intervention sur ce projet pour l’instant.</p>}

    {requests.length > 0 && <OperationSection title={openRequests > 0 ? `Demandes · ${plural(openRequests, 'ouverte', 'ouvertes')}` : 'Demandes'}>
      {shownRequests.shown.map((request) => <div className="project-operation-row" key={request.id}>
        <div><strong>{request.subject}</strong><small>{readableLabel(SOURCE_LABELS, request.source)}{request.priority !== 'normal' ? ` · Priorité : ${readableLabel(PRIORITY_LABELS, request.priority)}` : ''}</small></div>
        <StatusPill tone={operationStatusTone(request.status)}>{readableLabel(REQUEST_STATUS_LABELS, request.status)}</StatusPill>
      </div>)}
      {shownRequests.hidden > 0 && <p className="project-operation-more">{hiddenLabel(shownRequests.hidden, 'demande')}</p>}
    </OperationSection>}

    {interventions.length > 0 && <OperationSection title={openInterventions > 0 ? `Interventions · ${openInterventions} en cours` : 'Interventions'}>
      {shownInterventions.shown.map((intervention) => <div className="project-operation-row" key={intervention.id}>
        <div><strong>{intervention.number} · {intervention.subject}</strong><small>{[readableLabel(INTERVENTION_TYPE_LABELS, intervention.type), intervention.totalTimeSeconds > 0 ? duration(intervention.totalTimeSeconds) : null, readableLabel(COVERAGE_LABELS, intervention.coverageMode)].filter(Boolean).join(' · ')}</small></div>
        <StatusPill tone={operationStatusTone(intervention.status)}>{readableLabel(INTERVENTION_STATUS_LABELS, intervention.status)}</StatusPill>
      </div>)}
      {shownInterventions.hidden > 0 && <p className="project-operation-more">{hiddenLabel(shownInterventions.hidden, 'intervention')}</p>}
    </OperationSection>}

    {maintenance.length > 0 && <OperationSection title="Maintenance">
      {maintenance.map((subscription) => <div className="project-operation-row" key={subscription.id}>
        <div><strong>{subscription.planName}</strong><small>{plural(subscription.includedInterventions, 'intervention incluse', 'interventions incluses')} par période</small></div>
        <StatusPill tone={operationStatusTone(subscription.status)}>{readableLabel(MAINTENANCE_SUBSCRIPTION_STATUS_LABELS, subscription.status)}</StatusPill>
      </div>)}
    </OperationSection>}

    {packs.length > 0 && <OperationSection title="Packs d’heures">
      {packs.map((pack) => <div className="project-operation-row" key={pack.id}>
        <div><strong>{pack.name}</strong><small>{duration(pack.balanceSeconds)} restant · {duration(pack.consumedSeconds)} consommé</small></div>
        <StatusPill tone={operationStatusTone(pack.status)}>{readableLabel(HOUR_PACK_STATUS_LABELS, pack.status)}</StatusPill>
      </div>)}
    </OperationSection>}

    <button className="secondary-button project-operations-refresh" type="button" onClick={onRefresh}><OperationIcon name="refresh"/>Actualiser</button>
  </div>;
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

  if (loading) return <div className="project-tab-content"><p className="project-empty">Chargement des opérations du projet…</p></div>;
  return <ProjectOperationsView requests={requests} interventions={interventions} maintenance={maintenance} packs={packs} onRefresh={() => void load()} />;
}

function OperationSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="project-operation-section"><strong className="project-section-title">{title}</strong>{children}</section>;
}

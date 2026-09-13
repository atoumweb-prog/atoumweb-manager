import { useEffect, useMemo, useState } from 'react';
import type { ClientSummary } from '../../shared/crm';
import {
  INTERVENTION_COVERAGE_MODES,
  INTERVENTION_STATUSES,
  INTERVENTION_TYPES,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_SOURCES,
  SERVICE_REQUEST_STATUSES,
  type Intervention,
  type InterventionCoverageMode,
  type InterventionStatus,
  type InterventionType,
  type ServiceRequest,
  type ServiceRequestPriority,
  type ServiceRequestSource,
  type ServiceRequestStatus,
} from '../../shared/operations';
import type { ProjectSummary } from '../../shared/projects';
import type { TimeCategory } from '../../shared/time';
import { HourPacksPanel } from './HourPacksPanel';
import { MaintenancePanel } from './MaintenancePanel';

type OperationsView = 'requests' | 'interventions' | 'maintenance' | 'packs';

const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'Nouveau',
  to_qualify: 'À qualifier',
  waiting_client: 'En attente client',
  planned: 'Planifié',
  converted: 'Transformé',
  closed: 'Clos sans intervention',
  archived: 'Archivé',
};
const SOURCE_LABELS: Record<ServiceRequestSource, string> = {
  email: 'Email', phone: 'Téléphone', website_form: 'Formulaire site', message: 'Message', meeting: 'Réunion', atoumweb_detection: 'Détection AtoumWeb', other: 'Autre',
};
const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = { low: 'Basse', normal: 'Normale', high: 'Haute', urgent: 'Urgente' };
const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  correction: 'Correction', modification: 'Modification', addition: 'Ajout', maintenance: 'Maintenance', incident: 'Incident', support: 'Support', training: 'Formation', other: 'Autre',
};
const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  to_plan: 'À planifier', planned: 'Planifiée', in_progress: 'En cours', waiting_client: 'En attente client', blocked: 'Bloquée', to_validate: 'À valider', completed: 'Terminée', cancelled: 'Annulée', archived: 'Archivée',
};
const COVERAGE_LABELS: Record<InterventionCoverageMode, string> = {
  maintenance: 'Inclus maintenance', hour_pack: 'Déduit pack d’heures', out_of_scope: 'Hors forfait facturable', commercial_gesture: 'Geste commercial', included_project: 'Inclus projet', internal: 'Interne AtoumWeb',
};

function money(cents?: number): string {
  return `${((cents ?? 0) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}
function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}
function dateLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function OperationsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [view, setView] = useState<OperationsView>('requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [requestStatus, setRequestStatus] = useState<'all' | ServiceRequestStatus>('all');
  const [interventionStatus, setInterventionStatus] = useState<'all' | InterventionStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [createInterventionOpen, setCreateInterventionOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [requestClientId, setRequestClientId] = useState('');
  const [requestProjectId, setRequestProjectId] = useState('');
  const [requestSource, setRequestSource] = useState<ServiceRequestSource>('email');
  const [requestPriority, setRequestPriority] = useState<ServiceRequestPriority>('normal');
  const [requestSubject, setRequestSubject] = useState('');
  const [requestDescription, setRequestDescription] = useState('');

  const [interventionClientId, setInterventionClientId] = useState('');
  const [interventionProjectId, setInterventionProjectId] = useState('');
  const [interventionType, setInterventionType] = useState<InterventionType>('correction');
  const [interventionCoverage, setInterventionCoverage] = useState<InterventionCoverageMode>('out_of_scope');
  const [interventionPriority, setInterventionPriority] = useState<ServiceRequestPriority>('normal');
  const [interventionSubject, setInterventionSubject] = useState('');
  const [interventionDescription, setInterventionDescription] = useState('');

  const [transformType, setTransformType] = useState<InterventionType>('correction');
  const [transformCoverage, setTransformCoverage] = useState<InterventionCoverageMode>('out_of_scope');
  const [closeReason, setCloseReason] = useState('');

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const [nextRequests, nextInterventions, nextClients, nextProjects] = await Promise.all([
        window.atoumweb.operations.requests.list(),
        window.atoumweb.operations.interventions.list(),
        window.atoumweb.crm.clients.list(),
        window.atoumweb.projects.projects.list(),
      ]);
      setRequests(nextRequests);
      setInterventions(nextInterventions);
      setClients(nextClients);
      setProjects(nextProjects);
      if (selectedRequest) {
        const next = nextRequests.find((item) => item.id === selectedRequest.id);
        setSelectedRequest(next ?? null);
      }
      if (selectedIntervention) {
        const next = nextInterventions.find((item) => item.id === selectedIntervention.id);
        setSelectedIntervention(next ?? null);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les opérations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filteredRequests = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return requests.filter((request) => {
      if (requestStatus !== 'all' && request.status !== requestStatus) return false;
      if (!needle) return true;
      return [request.subject, request.description ?? '', request.clientLabel, request.projectLabel ?? ''].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [requests, query, requestStatus]);

  const filteredInterventions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return interventions.filter((intervention) => {
      if (interventionStatus !== 'all' && intervention.status !== interventionStatus) return false;
      if (!needle) return true;
      return [intervention.number, intervention.subject, intervention.description ?? '', intervention.clientLabel, intervention.projectLabel ?? ''].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [interventions, query, interventionStatus]);

  const requestProjects = projects.filter((project) => project.clientAccountId === requestClientId && project.status !== 'archived');
  const interventionProjects = projects.filter((project) => project.clientAccountId === interventionClientId && project.status !== 'archived');

  function resetRequestForm(): void {
    setRequestClientId(''); setRequestProjectId(''); setRequestSource('email'); setRequestPriority('normal'); setRequestSubject(''); setRequestDescription('');
  }
  function resetInterventionForm(): void {
    setInterventionClientId(''); setInterventionProjectId(''); setInterventionType('correction'); setInterventionCoverage('out_of_scope'); setInterventionPriority('normal'); setInterventionSubject(''); setInterventionDescription('');
  }

  async function createRequest(): Promise<void> {
    setSaving(true);
    try {
      const created = await window.atoumweb.operations.requests.create({
        clientAccountId: requestClientId,
        projectId: requestProjectId || null,
        source: requestSource,
        subject: requestSubject,
        description: requestDescription || null,
        priority: requestPriority,
      });
      resetRequestForm(); setCreateRequestOpen(false); await refresh(); setSelectedRequest(created); onMessage('Demande créée.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer la demande.'); }
    finally { setSaving(false); }
  }

  async function createIntervention(): Promise<void> {
    setSaving(true);
    try {
      const created = await window.atoumweb.operations.interventions.create({
        clientAccountId: interventionClientId,
        projectId: interventionProjectId || null,
        type: interventionType,
        coverageMode: interventionCoverage,
        subject: interventionSubject,
        description: interventionDescription || null,
        priority: interventionPriority,
      });
      resetInterventionForm(); setCreateInterventionOpen(false); await refresh(); setSelectedIntervention(created); setView('interventions'); onMessage(`Intervention ${created.number} créée.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer l’intervention.'); }
    finally { setSaving(false); }
  }

  async function transformRequest(): Promise<void> {
    if (!selectedRequest) return;
    setSaving(true);
    try {
      const intervention = await window.atoumweb.operations.requests.transform({ requestId: selectedRequest.id, type: transformType, coverageMode: transformCoverage });
      await refresh(); setSelectedRequest(null); setSelectedIntervention(intervention); setView('interventions'); onMessage(`Demande transformée en ${intervention.number}.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Transformation impossible.'); }
    finally { setSaving(false); }
  }

  async function closeRequest(): Promise<void> {
    if (!selectedRequest) return;
    try {
      const updated = await window.atoumweb.operations.requests.closeWithoutIntervention(selectedRequest.id, closeReason || null);
      setSelectedRequest(updated); setCloseReason(''); await refresh(); onMessage('Demande close sans intervention.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de clore la demande.'); }
  }

  async function changeRequestStatus(status: ServiceRequestStatus): Promise<void> {
    if (!selectedRequest) return;
    try { const updated = await window.atoumweb.operations.requests.changeStatus(selectedRequest.id, status); setSelectedRequest(updated); await refresh(); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.'); }
  }

  async function changeInterventionStatus(status: InterventionStatus): Promise<void> {
    if (!selectedIntervention) return;
    try { const updated = await window.atoumweb.operations.interventions.changeStatus(selectedIntervention.id, status); setSelectedIntervention(updated); await refresh(); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.'); }
  }

  async function changeCoverage(coverageMode: InterventionCoverageMode): Promise<void> {
    if (!selectedIntervention) return;
    try { const updated = await window.atoumweb.operations.interventions.update(selectedIntervention.id, { coverageMode }); setSelectedIntervention(updated); await refresh(); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier la prise en charge.'); }
  }

  function startInterventionTimer(intervention: Intervention): void {
    if (['completed', 'cancelled', 'archived'].includes(intervention.status)) {
      onMessage('Réouvre cette intervention avant de démarrer du temps.');
      return;
    }
    window.dispatchEvent(new CustomEvent('atoumweb:timer-context', { detail: {
      interventionId: intervention.id,
      projectId: intervention.projectId ?? null,
      nodeId: intervention.projectNodeId ?? null,
      activityLabel: `${intervention.number} · ${intervention.subject}`,
      category: categoryForIntervention(intervention.type),
      billable: !['commercial_gesture', 'internal'].includes(intervention.coverageMode),
    } }));
  }

  return (
    <div className="operations-stack">
      <div className="operations-view-tabs">
        <button type="button" className={view === 'requests' ? 'active' : ''} onClick={() => setView('requests')}>Demandes <span>{requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status)).length}</span></button>
        <button type="button" className={view === 'interventions' ? 'active' : ''} onClick={() => setView('interventions')}>Interventions <span>{interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status)).length}</span></button>
        <button type="button" className={view === 'maintenance' ? 'active' : ''} onClick={() => setView('maintenance')}>Maintenance</button>
        <button type="button" className={view === 'packs' ? 'active' : ''} onClick={() => setView('packs')}>Packs d’heures</button>
      </div>

      {(view === 'requests' || view === 'interventions') && <div className="module-toolbar operations-toolbar">
        <div><strong>{view === 'requests' ? filteredRequests.length : filteredInterventions.length}</strong><span>{view === 'requests' ? ' demande(s)' : ' intervention(s)'}</span></div>
        <div className="toolbar-controls">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
          <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher client, sujet, numéro…" />
          {view === 'requests' ? <select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value as typeof requestStatus)}><option value="all">Tous les statuts</option>{SERVICE_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select> : <select value={interventionStatus} onChange={(event) => setInterventionStatus(event.target.value as typeof interventionStatus)}><option value="all">Tous les statuts</option>{INTERVENTION_STATUSES.map((status) => <option key={status} value={status}>{INTERVENTION_STATUS_LABELS[status]}</option>)}</select>}
          {view === 'requests' ? <button className="primary-button" type="button" onClick={() => setCreateRequestOpen((value) => !value)}>+ Demande</button> : <button className="primary-button" type="button" onClick={() => setCreateInterventionOpen((value) => !value)}>+ Intervention</button>}
        </div>
      </div>}

      {view === 'requests' && <>
        {createRequestOpen && <section className="panel operation-create-panel"><div className="panel-title"><div><span className="eyebrow">Nouvelle demande</span><h2>Enregistrer un besoin entrant</h2></div><button className="close-detail" type="button" onClick={() => setCreateRequestOpen(false)}>×</button></div><div className="operation-create-grid">
          <label>Client<select value={requestClientId} onChange={(event) => { setRequestClientId(event.target.value); setRequestProjectId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
          <label>Projet éventuel<select value={requestProjectId} onChange={(event) => setRequestProjectId(event.target.value)} disabled={!requestClientId}><option value="">Aucun projet</option>{requestProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
          <label>Origine<select value={requestSource} onChange={(event) => setRequestSource(event.target.value as ServiceRequestSource)}>{SERVICE_REQUEST_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>
          <label>Priorité<select value={requestPriority} onChange={(event) => setRequestPriority(event.target.value as ServiceRequestPriority)}>{SERVICE_REQUEST_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}</select></label>
          <label className="wide">Sujet<input value={requestSubject} onChange={(event) => setRequestSubject(event.target.value)} placeholder="Ex. Modifier le formulaire de contact" /></label>
          <label className="wide">Description<textarea value={requestDescription} onChange={(event) => setRequestDescription(event.target.value)} placeholder="Demande du client, contexte…" /></label>
        </div><div className="button-row"><button className="primary-button" disabled={saving || !requestClientId || !requestSubject.trim()} type="button" onClick={() => void createRequest()}>Créer la demande</button><button className="secondary-button" type="button" onClick={() => { resetRequestForm(); setCreateRequestOpen(false); }}>Annuler</button></div></section>}
        {loading ? <section className="panel"><p className="muted">Chargement…</p></section> : <div className={selectedRequest ? 'operations-layout with-detail' : 'operations-layout'}><section className="panel operation-list-panel"><table className="operations-table"><thead><tr><th>Reçue</th><th>Client</th><th>Sujet</th><th>Priorité</th><th>Statut</th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.id} className={selectedRequest?.id === request.id ? 'selected-row' : ''} onClick={() => { setSelectedRequest(request); setSelectedIntervention(null); }}><td>{dateLabel(request.receivedAt)}</td><td><strong>{request.clientLabel}</strong><small>{request.projectLabel || 'Sans projet'}</small></td><td><strong>{request.subject}</strong><small>{SOURCE_LABELS[request.source]}</small></td><td><span className={`operation-priority priority-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span></td><td>{REQUEST_STATUS_LABELS[request.status]}</td></tr>)}{filteredRequests.length === 0 && <tr><td colSpan={5}><div className="empty-table">Aucune demande dans cette vue.</div></td></tr>}</tbody></table></section>{selectedRequest && <RequestDetail request={selectedRequest} transformType={transformType} setTransformType={setTransformType} transformCoverage={transformCoverage} setTransformCoverage={setTransformCoverage} closeReason={closeReason} setCloseReason={setCloseReason} saving={saving} onClose={() => setSelectedRequest(null)} onStatus={changeRequestStatus} onTransform={transformRequest} onCloseRequest={closeRequest} />}</div>}
      </>}

      {view === 'interventions' && <>
        {createInterventionOpen && <section className="panel operation-create-panel"><div className="panel-title"><div><span className="eyebrow">Nouvelle intervention</span><h2>Créer une intervention directe</h2></div><button className="close-detail" type="button" onClick={() => setCreateInterventionOpen(false)}>×</button></div><div className="operation-create-grid">
          <label>Client<select value={interventionClientId} onChange={(event) => { setInterventionClientId(event.target.value); setInterventionProjectId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
          <label>Projet éventuel<select value={interventionProjectId} onChange={(event) => setInterventionProjectId(event.target.value)} disabled={!interventionClientId}><option value="">Aucun projet</option>{interventionProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
          <label>Type<select value={interventionType} onChange={(event) => setInterventionType(event.target.value as InterventionType)}>{INTERVENTION_TYPES.map((type) => <option key={type} value={type}>{INTERVENTION_TYPE_LABELS[type]}</option>)}</select></label>
          <label>Prise en charge<select value={interventionCoverage} onChange={(event) => setInterventionCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label>
          <label>Priorité<select value={interventionPriority} onChange={(event) => setInterventionPriority(event.target.value as ServiceRequestPriority)}>{SERVICE_REQUEST_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}</select></label>
          <label className="wide">Sujet<input value={interventionSubject} onChange={(event) => setInterventionSubject(event.target.value)} /></label>
          <label className="wide">Description<textarea value={interventionDescription} onChange={(event) => setInterventionDescription(event.target.value)} /></label>
        </div><div className="button-row"><button className="primary-button" disabled={saving || !interventionClientId || !interventionSubject.trim()} type="button" onClick={() => void createIntervention()}>Créer l’intervention</button><button className="secondary-button" type="button" onClick={() => { resetInterventionForm(); setCreateInterventionOpen(false); }}>Annuler</button></div></section>}
        {loading ? <section className="panel"><p className="muted">Chargement…</p></section> : <div className={selectedIntervention ? 'operations-layout with-detail' : 'operations-layout'}><section className="panel operation-list-panel"><table className="operations-table"><thead><tr><th>Numéro</th><th>Client</th><th>Intervention</th><th>Prise en charge</th><th>Temps</th><th>Statut</th></tr></thead><tbody>{filteredInterventions.map((intervention) => <tr key={intervention.id} className={selectedIntervention?.id === intervention.id ? 'selected-row' : ''} onClick={() => { setSelectedIntervention(intervention); setSelectedRequest(null); }}><td><strong>{intervention.number}</strong></td><td><strong>{intervention.clientLabel}</strong><small>{intervention.projectLabel || 'Sans projet'}</small></td><td><strong>{intervention.subject}</strong><small>{INTERVENTION_TYPE_LABELS[intervention.type]}</small></td><td>{COVERAGE_LABELS[intervention.coverageMode]}</td><td>{duration(intervention.totalTimeSeconds)}</td><td>{INTERVENTION_STATUS_LABELS[intervention.status]}</td></tr>)}{filteredInterventions.length === 0 && <tr><td colSpan={6}><div className="empty-table">Aucune intervention dans cette vue.</div></td></tr>}</tbody></table></section>{selectedIntervention && <InterventionDetail intervention={selectedIntervention} onClose={() => setSelectedIntervention(null)} onStatus={changeInterventionStatus} onCoverage={changeCoverage} onTimer={startInterventionTimer} />}</div>}
      </>}

      {view === 'maintenance' && <MaintenancePanel clients={clients} projects={projects} onMessage={onMessage} onInterventionCreated={(intervention) => { setSelectedRequest(null); setSelectedIntervention(intervention); setView('interventions'); void refresh(); }} />}
      {view === 'packs' && <HourPacksPanel clients={clients} projects={projects} interventions={interventions} onMessage={onMessage} onOperationsChanged={refresh} />}
    </div>
  );
}

function RequestDetail({ request, transformType, setTransformType, transformCoverage, setTransformCoverage, closeReason, setCloseReason, saving, onClose, onStatus, onTransform, onCloseRequest }: {
  request: ServiceRequest; transformType: InterventionType; setTransformType: (value: InterventionType) => void; transformCoverage: InterventionCoverageMode; setTransformCoverage: (value: InterventionCoverageMode) => void; closeReason: string; setCloseReason: (value: string) => void; saving: boolean; onClose: () => void; onStatus: (status: ServiceRequestStatus) => Promise<void>; onTransform: () => Promise<void>; onCloseRequest: () => Promise<void>;
}) {
  const locked = request.status === 'converted' || request.status === 'archived';
  return <aside className="panel operation-detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Demande · {SOURCE_LABELS[request.source]}</span><h2>{request.subject}</h2><p className="muted">{request.clientLabel}{request.projectLabel ? ` · ${request.projectLabel}` : ''}</p></div><button className="close-detail" type="button" onClick={onClose}>×</button></div><div className="operation-detail-grid"><div><span>Reçue</span><strong>{dateLabel(request.receivedAt)}</strong></div><div><span>Priorité</span><strong>{PRIORITY_LABELS[request.priority]}</strong></div></div><label>Statut<select disabled={request.status === 'converted'} value={request.status} onChange={(event) => void onStatus(event.target.value as ServiceRequestStatus)}>{SERVICE_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></label>{request.description && <div className="operation-description"><span className="eyebrow">Description</span><p>{request.description}</p></div>}{request.interventionId ? <div className="operation-linked"><strong>✓ Transformée en intervention</strong><span>L’intervention liée est conservée comme source unique du travail réalisé.</span></div> : !locked && <><div className="operation-action-box"><strong>Créer une intervention</strong><label>Type<select value={transformType} onChange={(event) => setTransformType(event.target.value as InterventionType)}>{INTERVENTION_TYPES.map((type) => <option key={type} value={type}>{INTERVENTION_TYPE_LABELS[type]}</option>)}</select></label><label>Prise en charge<select value={transformCoverage} onChange={(event) => setTransformCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label><button className="primary-button" type="button" disabled={saving} onClick={() => void onTransform()}>Créer l’intervention</button></div><div className="operation-action-box subtle"><strong>Ou clore sans travail</strong><input value={closeReason} onChange={(event) => setCloseReason(event.target.value)} placeholder="Motif facultatif" /><button className="secondary-button" type="button" onClick={() => void onCloseRequest()}>Clore sans intervention</button></div></>}</aside>;
}

function InterventionDetail({ intervention, onClose, onStatus, onCoverage, onTimer }: { intervention: Intervention; onClose: () => void; onStatus: (status: InterventionStatus) => Promise<void>; onCoverage: (coverage: InterventionCoverageMode) => Promise<void>; onTimer: (intervention: Intervention) => void }) {
  return <aside className="panel operation-detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">{intervention.number}</span><h2>{intervention.subject}</h2><p className="muted">{intervention.clientLabel}{intervention.projectLabel ? ` · ${intervention.projectLabel}` : ''}</p></div><button className="close-detail" type="button" onClick={onClose}>×</button></div><div className="operation-detail-grid"><div><span>Type</span><strong>{INTERVENTION_TYPE_LABELS[intervention.type]}</strong></div><div><span>Temps réel</span><strong>{duration(intervention.totalTimeSeconds)}</strong></div><div><span>Valeur théorique</span><strong>{money(intervention.theoreticalValueCents)}</strong></div><div><span>Facturable</span><strong>{money(intervention.billableAmountCents)}</strong></div></div><label>Statut<select value={intervention.status} onChange={(event) => void onStatus(event.target.value as InterventionStatus)}>{INTERVENTION_STATUSES.map((status) => <option key={status} value={status}>{INTERVENTION_STATUS_LABELS[status]}</option>)}</select></label><label>Prise en charge<select value={intervention.coverageMode} onChange={(event) => void onCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label><button className="primary-button operation-timer-button" type="button" disabled={['completed', 'cancelled', 'archived'].includes(intervention.status)} onClick={() => onTimer(intervention)}>▶ Démarrer le timer sur cette intervention</button>{intervention.description && <div className="operation-description"><span className="eyebrow">Description</span><p>{intervention.description}</p></div>}{intervention.type === 'incident' && <div className="incident-summary"><span className="eyebrow">Incident</span><strong>{intervention.incidentCriticality ? `Criticité ${intervention.incidentCriticality}` : 'Incident'}</strong>{intervention.downtimeMinutes != null && <span>Indisponibilité : {intervention.downtimeMinutes} min</span>}{intervention.incidentDiagnosis && <p>{intervention.incidentDiagnosis}</p>}</div>}<div className="operation-meta"><span>Créée : {dateLabel(intervention.createdAt)}</span>{intervention.startedAt && <span>Démarrée : {dateLabel(intervention.startedAt)}</span>}{intervention.completedAt && <span>Terminée : {dateLabel(intervention.completedAt)}</span>}</div></aside>;
}

function categoryForIntervention(type: InterventionType): TimeCategory {
  if (['addition', 'modification'].includes(type)) return 'development';
  if (type === 'training') return 'meeting';
  if (type === 'incident' || type === 'support' || type === 'maintenance' || type === 'correction') return 'support';
  return 'production';
}

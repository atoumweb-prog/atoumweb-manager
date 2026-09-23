import {InterventionEditor,InterventionExtraFields} from '../workflow/InterventionFields';
import type {InterventionInput} from '../../shared/operations';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClientSummary, SearchResult } from '../../shared/crm';
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
import type { ProjectNode, ProjectSummary } from '../../shared/projects';
import type { TimeCategory } from '../../shared/time';
import { HourPacksPanel } from './HourPacksPanel';
import { MaintenancePanel } from './MaintenancePanel';
import { OperationsAlertsPanel } from './OperationsAlertsPanel';
import { InterventionBackupPanel } from './InterventionBackupPanel';
import { OperationIcon } from './OperationIcon';

type OperationsView = 'requests' | 'interventions' | 'maintenance' | 'packs';
export type OperationsSearchTarget = {
  entityType: Extract<SearchResult['entityType'], 'service_request' | 'intervention' | 'maintenance' | 'hour_pack'>;
  entityId: string;
};

const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'Nouveau', to_qualify: 'À qualifier', waiting_client: 'En attente client', planned: 'Planifié', converted: 'Transformé', closed: 'Clos sans intervention', archived: 'Archivé',
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

function money(cents?: number): string { return `${((cents ?? 0) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`; }
function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60); const hours = Math.floor(minutes / 60); const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}
function dateLabel(value?: string | null): string {
  if (!value) return '—'; const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
function attachableProjectNodes(nodes: ProjectNode[]): ProjectNode[] {
  return nodes.filter((node) => ['module', 'task', 'checklist'].includes(node.type)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fr-FR'));
}
function projectNodeLabel(node: ProjectNode): string {
  const kind = node.type === 'module' ? (node.displaySubtype === 'page' ? 'Page' : 'Module') : node.type === 'checklist' ? 'Checklist' : 'Tâche';
  return `${kind} · ${node.name}`;
}

export function OperationsPage({ onMessage, initialTarget }: { onMessage: (message: string) => void; initialTarget?: OperationsSearchTarget | null }) {
  const [view, setView] = useState<OperationsView>('requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertRefreshKey, setAlertRefreshKey] = useState(0);
  const [query, setQuery] = useState('');
  const [requestStatus, setRequestStatus] = useState<'all' | ServiceRequestStatus>('all');
  const [interventionStatus, setInterventionStatus] = useState<'all' | InterventionStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [requestSplitPercent, setRequestSplitPercent] = useState(38);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [interventionSplitPercent, setInterventionSplitPercent] = useState(34);
  const [interventionExpanded, setInterventionExpanded] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [createInterventionOpen, setCreateInterventionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interventionDemoMode, setInterventionDemoMode] = useState(false);
  const requestDetailRef = useRef<HTMLDivElement | null>(null);
  const interventionDetailRef = useRef<HTMLDivElement | null>(null);

  const [requestClientId, setRequestClientId] = useState('');
  const [requestProjectId, setRequestProjectId] = useState('');
  const [requestSource, setRequestSource] = useState<ServiceRequestSource>('email');
  const [requestPriority, setRequestPriority] = useState<ServiceRequestPriority>('normal');
  const [requestSubject, setRequestSubject] = useState('');
  const [requestDescription, setRequestDescription] = useState('');

  const [interventionClientId, setInterventionClientId] = useState('');
  const [interventionProjectId, setInterventionProjectId] = useState('');
  const [interventionProjectNodeId, setInterventionProjectNodeId] = useState('');
  const [interventionProjectNodes, setInterventionProjectNodes] = useState<ProjectNode[]>([]);
  const [interventionType, setInterventionType] = useState<InterventionType>('correction');
  const [interventionCoverage, setInterventionCoverage] = useState<InterventionCoverageMode>('out_of_scope');
  const [interventionPriority, setInterventionPriority] = useState<ServiceRequestPriority>('normal');
  const [interventionSubject, setInterventionSubject] = useState('');
  const [extra,setExtra]=useState<Partial<InterventionInput>>({});
  const [interventionInitialStatus,setInterventionInitialStatus]=useState<InterventionStatus>('to_plan');
  const [interventionDescription, setInterventionDescription] = useState('');

  const [transformType, setTransformType] = useState<InterventionType>('correction');
  const [transformCoverage, setTransformCoverage] = useState<InterventionCoverageMode>('out_of_scope');
  const [transformProjectNodeId, setTransformProjectNodeId] = useState('');
  const [transformProjectNodes, setTransformProjectNodes] = useState<ProjectNode[]>([]);
  const [closeReason, setCloseReason] = useState('');

  async function refresh(options: { showLoading?: boolean } = {}): Promise<void> {
    const showLoading = options.showLoading ?? true;
    if (showLoading) setLoading(true);
    try {
      const [nextRequests, nextInterventions, nextClients, nextProjects] = await Promise.all([
        window.atoumweb.operations.requests.list(), window.atoumweb.operations.interventions.list(), window.atoumweb.crm.clients.list(), window.atoumweb.projects.projects.list(),
      ]);
      setRequests(nextRequests); setInterventions(nextInterventions); setClients(nextClients); setProjects(nextProjects);
      if (selectedRequest) setSelectedRequest(nextRequests.find((item) => item.id === selectedRequest.id) ?? null);
      if (selectedIntervention) setSelectedIntervention(nextInterventions.find((item) => item.id === selectedIntervention.id) ?? null);
      setAlertRefreshKey((value) => value + 1);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de charger les opérations.'); }
    finally { if (showLoading) setLoading(false); }
  }

  useEffect(() => { void refresh({ showLoading: true }); }, []);
  useEffect(() => {
    if (!selectedRequest) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedRequest(null);
        setRequestExpanded(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedRequest?.id]);

  useEffect(() => {
    if (!selectedIntervention) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedIntervention(null);
        setInterventionExpanded(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedIntervention?.id]);

  useEffect(() => {
    if (!initialTarget) return;
    setQuery('');
    setSelectedRequest(null);
    setSelectedIntervention(null);

    if (initialTarget.entityType === 'service_request') {
      setView('requests');
      setRequestStatus('all');
      void window.atoumweb.operations.requests.get(initialTarget.entityId)
        .then((request) => setSelectedRequest(request))
        .catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Demande introuvable.'));
      return;
    }
    if (initialTarget.entityType === 'intervention') {
      setView('interventions');
      setInterventionStatus('all');
      void window.atoumweb.operations.interventions.get(initialTarget.entityId)
        .then((intervention) => setSelectedIntervention(intervention))
        .catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Intervention introuvable.'));
      return;
    }
    if (initialTarget.entityType === 'maintenance') {
      setView('maintenance');
      return;
    }
    setView('packs');
  }, [initialTarget?.entityType, initialTarget?.entityId]);

  useEffect(() => {
    if (!interventionProjectId) {
      setInterventionProjectNodes([]);
      setInterventionProjectNodeId('');
      return;
    }
    let active = true;
    void window.atoumweb.projects.projects.get(interventionProjectId)
      .then((project) => {
        if (!active) return;
        const nodes = attachableProjectNodes(project.nodes);
        setInterventionProjectNodes(nodes);
        setInterventionProjectNodeId((current) => nodes.some((node) => node.id === current) ? current : '');
      })
      .catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Impossible de charger le plan du projet.'));
    return () => { active = false; };
  }, [interventionProjectId]);

  useEffect(() => {
    const projectId = selectedRequest?.projectId ?? null;
    setTransformProjectNodeId('');
    if (!projectId) {
      setTransformProjectNodes([]);
      return;
    }
    let active = true;
    void window.atoumweb.projects.projects.get(projectId)
      .then((project) => {
        if (!active) return;
        setTransformProjectNodes(attachableProjectNodes(project.nodes));
      })
      .catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Impossible de charger le plan du projet.'));
    return () => { active = false; };
  }, [selectedRequest?.id, selectedRequest?.projectId]);

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
      return [intervention.number, intervention.subject, intervention.description ?? '', intervention.clientLabel, intervention.projectLabel ?? '', intervention.projectNodeLabel ?? ''].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [interventions, query, interventionStatus]);

  const requestProjects = projects.filter((project) => project.clientAccountId === requestClientId && project.status !== 'archived');
  const interventionProjects = projects.filter((project) => project.clientAccountId === interventionClientId && project.status !== 'archived');

  function resetRequestForm(): void { setRequestClientId(''); setRequestProjectId(''); setRequestSource('email'); setRequestPriority('normal'); setRequestSubject(''); setRequestDescription(''); }
  function resetInterventionForm(): void { setExtra({});setInterventionInitialStatus('to_plan'); setInterventionClientId(''); setInterventionProjectId(''); setInterventionProjectNodeId(''); setInterventionProjectNodes([]); setInterventionType('correction'); setInterventionCoverage('out_of_scope'); setInterventionPriority('normal'); setInterventionSubject(''); setInterventionDescription(''); }

  async function createRequest(): Promise<void> {
    setSaving(true);
    try {
      const created = await window.atoumweb.operations.requests.create({ clientAccountId: requestClientId, projectId: requestProjectId || null, source: requestSource, subject: requestSubject, description: requestDescription || null, priority: requestPriority });
      resetRequestForm(); setCreateRequestOpen(false); await refresh({ showLoading: false }); setSelectedRequest(created); onMessage('Demande créée.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer la demande.'); } finally { setSaving(false); }
  }

  async function createIntervention(): Promise<void> {
    setSaving(true);
    let demoBatch: string | null = null;
    try {
      if (interventionDemoMode) demoBatch = await window.atoumweb.workflow.beginDemoCapture('intervention saisie manuellement');
      const created = await window.atoumweb.operations.interventions.create({ ...extra,status:interventionInitialStatus,clientAccountId: interventionClientId, projectId: interventionProjectId || null, projectNodeId: interventionProjectNodeId || null, type: interventionType, coverageMode: interventionCoverage, subject: interventionSubject, description: interventionDescription || null, priority: interventionPriority });
      setInterventionDemoMode(false); resetInterventionForm(); setCreateInterventionOpen(false); await refresh({ showLoading: false }); setSelectedIntervention(created); setView('interventions'); onMessage(`Intervention ${created.number} créée.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer l’intervention.'); } finally { if (demoBatch) await window.atoumweb.workflow.endDemoCapture(demoBatch); setSaving(false); }
  }

  async function transformRequest(): Promise<void> {
    if (!selectedRequest) return; setSaving(true);
    try {
      const intervention = await window.atoumweb.operations.requests.transform({ requestId: selectedRequest.id, type: transformType, coverageMode: transformCoverage, projectNodeId: transformProjectNodeId || null });
      await refresh({ showLoading: false }); setSelectedRequest(null); setSelectedIntervention(intervention); setView('interventions'); onMessage(`Demande transformée en ${intervention.number}.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Transformation impossible.'); } finally { setSaving(false); }
  }

  async function closeRequest(): Promise<void> {
    if (!selectedRequest) return;
    try { const updated = await window.atoumweb.operations.requests.closeWithoutIntervention(selectedRequest.id, closeReason || null); setSelectedRequest(updated); setCloseReason(''); await refresh({ showLoading: false }); onMessage('Demande close sans intervention.'); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de clore la demande.'); }
  }

  async function changeRequestStatus(status: ServiceRequestStatus): Promise<void> {
    if (!selectedRequest) return;
    try { const updated = await window.atoumweb.operations.requests.changeStatus(selectedRequest.id, status); setSelectedRequest(updated); await refresh({ showLoading: false }); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.'); }
  }

  async function changeInterventionStatus(status: InterventionStatus): Promise<void> {
    if (!selectedIntervention) return;
    try {
      const updated = status === 'completed'
        ? await window.atoumweb.operations.interventions.complete(selectedIntervention.id)
        : await window.atoumweb.operations.interventions.changeStatus(selectedIntervention.id, status);
      setSelectedIntervention(updated);
      await refresh({ showLoading: false });
      if (status === 'completed') onMessage(`${updated.number} terminée · prise en charge traitée.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.'); }
  }

  async function changeCoverage(coverageMode: InterventionCoverageMode): Promise<void> {
    if (!selectedIntervention) return;
    try { const updated = await window.atoumweb.operations.interventions.update(selectedIntervention.id, { coverageMode }); setSelectedIntervention(updated); await refresh({ showLoading: false }); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier la prise en charge.'); }
  }

  async function changeInterventionProjectNode(projectNodeId: string | null): Promise<void> {
    if (!selectedIntervention) return;
    try {
      const updated = await window.atoumweb.operations.interventions.update(selectedIntervention.id, { projectNodeId });
      setSelectedIntervention(updated);
      await refresh({ showLoading: false });
      onMessage(projectNodeId ? 'Rattachement au plan du projet mis à jour.' : 'Rattachement précis au plan du projet retiré.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le rattachement au projet.');
    }
  }

  function startInterventionTimer(intervention: Intervention): void {
    if (['completed', 'cancelled', 'archived'].includes(intervention.status)) { onMessage('Réouvre cette intervention avant de démarrer du temps.'); return; }
    window.dispatchEvent(new CustomEvent('atoumweb:timer-context', { detail: { interventionId: intervention.id, projectId: intervention.projectId ?? null, nodeId: intervention.projectNodeId ?? null, activityLabel: `${intervention.number} · ${intervention.subject}`, category: categoryForIntervention(intervention.type), billable: !['commercial_gesture', 'internal'].includes(intervention.coverageMode) } }));
  }

  function beginRequestResize(): void {
    const workspace = document.querySelector<HTMLElement>('.request-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setRequestSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  function beginInterventionResize(): void {
    const workspace = document.querySelector<HTMLElement>('.intervention-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setInterventionSplitPercent(Math.max(20, Math.min(55, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  const openRequests = requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status));
  const urgentOpenRequests = openRequests.filter((item) => item.priority === 'urgent');
  const waitingClientCount =
    requests.filter((item) => item.status === 'waiting_client').length
    + interventions.filter((item) => item.status === 'waiting_client').length;
  const activeInterventions = interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status));

  return <div className="operations-stack">
    <section className="operations-kpi-grid" aria-label="Synthèse Interventions et Maintenance">
      <article><span className="operations-kpi-icon"><OperationIcon name="inbox" /></span><div><strong>Demandes ouvertes</strong><span>{openRequests.length}</span><small>À traiter ou à qualifier</small></div></article>
      <article><span className="operations-kpi-icon"><OperationIcon name="alert" /></span><div><strong>Urgentes</strong><span>{urgentOpenRequests.length}</span><small>Demandes ouvertes prioritaires</small></div></article>
      <article><span className="operations-kpi-icon"><OperationIcon name="wrench" /></span><div><strong>Interventions actives</strong><span>{activeInterventions.length}</span><small>Planifiées, en cours ou à valider</small></div></article>
      <article><span className="operations-kpi-icon"><OperationIcon name="clock" /></span><div><strong>En attente client</strong><span>{waitingClientCount}</span><small>Demandes + interventions</small></div></article>
    </section>
    <OperationsAlertsPanel refreshKey={alertRefreshKey} onNavigate={(target) => setView(target)} onMessage={onMessage} />
    <div className="operations-view-tabs">
      <button type="button" className={view === 'requests' ? 'active' : ''} onClick={() => setView('requests')}>Demandes <span>{requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status)).length}</span></button>
      <button type="button" className={view === 'interventions' ? 'active' : ''} onClick={() => setView('interventions')}>Interventions <span>{interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status)).length}</span></button>
      <button type="button" className={view === 'maintenance' ? 'active' : ''} onClick={() => setView('maintenance')}>Maintenance</button>
      <button type="button" className={view === 'packs' ? 'active' : ''} onClick={() => setView('packs')}>Packs d’heures</button>
    </div>

    {(view === 'requests' || view === 'interventions') && <div className="module-toolbar operations-toolbar"><div><strong>{view === 'requests' ? filteredRequests.length : filteredInterventions.length}</strong><span>{view === 'requests' ? ' demande(s)' : ' intervention(s)'}</span></div><div className="toolbar-controls"><button className="secondary-button" type="button" onClick={() => void refresh({ showLoading: false })}><OperationIcon name="refresh" size={16} /> Actualiser</button><input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher client, sujet, numéro…" />{view === 'requests' ? <select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value as typeof requestStatus)}><option value="all">Tous les statuts</option>{SERVICE_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select> : <select value={interventionStatus} onChange={(event) => setInterventionStatus(event.target.value as typeof interventionStatus)}><option value="all">Tous les statuts</option>{INTERVENTION_STATUSES.map((status) => <option key={status} value={status}>{INTERVENTION_STATUS_LABELS[status]}</option>)}</select>}{view === 'requests' ? <button className="primary-button" type="button" onClick={() => setCreateRequestOpen((value) => !value)}>+ Nouvelle demande</button> : <button className="primary-button" type="button" onClick={() => setCreateInterventionOpen((value) => !value)}>+ Intervention</button>}</div></div>}

    {view === 'requests' && <>
      {createRequestOpen && <section className="panel operation-create-panel"><div className="panel-title"><div><span className="eyebrow">Nouvelle demande</span><h2>Enregistrer un besoin entrant</h2></div><button className="close-detail" type="button" onClick={() => setCreateRequestOpen(false)}>×</button></div><div className="operation-create-grid"><label>Client<select value={requestClientId} onChange={(event) => { setRequestClientId(event.target.value); setRequestProjectId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label><label>Projet éventuel<select value={requestProjectId} onChange={(event) => setRequestProjectId(event.target.value)} disabled={!requestClientId}><option value="">Aucun projet</option>{requestProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label><label>Origine<select value={requestSource} onChange={(event) => setRequestSource(event.target.value as ServiceRequestSource)}>{SERVICE_REQUEST_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label><label>Priorité<select value={requestPriority} onChange={(event) => setRequestPriority(event.target.value as ServiceRequestPriority)}>{SERVICE_REQUEST_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}</select></label><label className="wide">Sujet<input value={requestSubject} onChange={(event) => setRequestSubject(event.target.value)} placeholder="Ex. Modifier le formulaire de contact" /></label><label className="wide">Description<textarea value={requestDescription} onChange={(event) => setRequestDescription(event.target.value)} placeholder="Demande du client, contexte…" /></label></div><div className="button-row"><button className="primary-button" disabled={saving || !requestClientId || !requestSubject.trim()} type="button" onClick={() => void createRequest()}>Créer la demande</button><button className="secondary-button" type="button" onClick={() => { resetRequestForm(); setCreateRequestOpen(false); }}>Annuler</button></div></section>}
      {loading ? <section className="panel"><p className="muted">Chargement…</p></section> : <div
        className={selectedRequest ? `operations-layout request-workspace with-detail ${requestExpanded ? 'detail-expanded' : ''}` : 'operations-layout request-workspace'}
        style={selectedRequest && !requestExpanded ? { gridTemplateColumns: `${requestSplitPercent}% 8px minmax(0, 1fr)` } : undefined}
      >
        {!requestExpanded && <section className="panel operation-list-panel request-list-panel">
          {selectedRequest ? <div className="request-compact-list" role="list" aria-label="Demandes">
            {filteredRequests.map((request) => <button
              key={request.id}
              type="button"
              role="listitem"
              className={`request-compact-item ${selectedRequest.id === request.id ? 'selected' : ''}`}
              onClick={() => { setSelectedRequest(request); setSelectedIntervention(null); }}
            >
              <span className="request-compact-heading"><strong>{request.subject}</strong><span className={`operation-priority priority-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span></span>
              <span className="request-compact-client">{request.clientLabel}</span>
              <span className="request-compact-meta"><span>{SOURCE_LABELS[request.source]}</span><span>{REQUEST_STATUS_LABELS[request.status]}</span></span>
              <span className="request-compact-date">{dateLabel(request.receivedAt)}</span>
            </button>)}
            {filteredRequests.length === 0 && <div className="empty-table">Aucune demande dans cette vue.</div>}
          </div> : <table className="operations-table"><thead><tr><th>Reçue</th><th>Client</th><th>Sujet</th><th>Priorité</th><th>Statut</th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.id} className={selectedRequest?.id === request.id ? 'selected-row' : ''} onClick={() => { setSelectedRequest(request); setSelectedIntervention(null); setRequestExpanded(false); }}><td>{dateLabel(request.receivedAt)}</td><td><strong>{request.clientLabel}</strong><small>{request.projectLabel || 'Sans projet'}</small></td><td><strong>{request.subject}</strong><small>{SOURCE_LABELS[request.source]}</small></td><td><span className={`operation-priority priority-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span></td><td>{REQUEST_STATUS_LABELS[request.status]}</td></tr>)}{filteredRequests.length === 0 && <tr><td colSpan={5}><div className="empty-table">Aucune demande dans cette vue.</div></td></tr>}</tbody></table>}
        </section>}
        {selectedRequest && !requestExpanded && <div
          className="operation-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la liste et la demande"
          tabIndex={0}
          onPointerDown={() => beginRequestResize()}
          onDoubleClick={() => setRequestSplitPercent(38)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setRequestSplitPercent((value) => Math.max(20, value - 3));
            if (event.key === 'ArrowRight') setRequestSplitPercent((value) => Math.min(58, value + 3));
          }}
        ><span /></div>}
        {selectedRequest && <div ref={requestDetailRef} className="operation-detail-boundary"><RequestDetail
          request={selectedRequest}
          expanded={requestExpanded}
          onExpand={() => setRequestExpanded((value) => !value)}
          transformType={transformType}
          setTransformType={setTransformType}
          transformCoverage={transformCoverage}
          setTransformCoverage={setTransformCoverage}
          transformProjectNodeId={transformProjectNodeId}
          setTransformProjectNodeId={setTransformProjectNodeId}
          transformProjectNodes={transformProjectNodes}
          closeReason={closeReason}
          setCloseReason={setCloseReason}
          saving={saving}
          onClose={() => { setSelectedRequest(null); setRequestExpanded(false); }}
          onStatus={changeRequestStatus}
          onTransform={transformRequest}
          onCloseRequest={closeRequest}
        /></div>}
      </div>}
    </>}

    {view === 'interventions' && <>
      {createInterventionOpen && <section className="panel operation-create-panel"><button type="button" className="secondary-button" onClick={()=>{setInterventionDemoMode(true);setInterventionSubject('DEMO — Correction page Accueil');setInterventionDescription('Vérifier le contenu et les liens avant validation.');setInterventionType('correction');setInterventionPriority('normal');}}>Remplir avec des données test</button><div className="panel-title"><div><span className="eyebrow">Nouvelle intervention</span><h2>Créer une intervention directe</h2></div><button className="close-detail" type="button" onClick={() => setCreateInterventionOpen(false)}>×</button></div><div className="operation-create-grid"><label>Client<select value={interventionClientId} onChange={(event) => { setInterventionClientId(event.target.value); setInterventionProjectId(''); setInterventionProjectNodeId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label><label>Projet éventuel<select value={interventionProjectId} onChange={(event) => { setInterventionProjectId(event.target.value); setInterventionProjectNodeId(''); }} disabled={!interventionClientId}><option value="">Aucun projet</option>{interventionProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label><label>Module / Page / Tâche<select value={interventionProjectNodeId} onChange={(event) => setInterventionProjectNodeId(event.target.value)} disabled={!interventionProjectId || interventionProjectNodes.length === 0}><option value="">Aucun rattachement précis</option>{interventionProjectNodes.map((node) => <option key={node.id} value={node.id}>{projectNodeLabel(node)}</option>)}</select></label><label>Type<select value={interventionType} onChange={(event) => setInterventionType(event.target.value as InterventionType)}>{INTERVENTION_TYPES.map((type) => <option key={type} value={type}>{INTERVENTION_TYPE_LABELS[type]}</option>)}</select></label><label>Prise en charge<select value={interventionCoverage} onChange={(event) => setInterventionCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label><label>Priorité<select value={interventionPriority} onChange={(event) => setInterventionPriority(event.target.value as ServiceRequestPriority)}>{SERVICE_REQUEST_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}</select></label><label className="wide">Sujet<input value={interventionSubject} onChange={(event) => setInterventionSubject(event.target.value)} /></label><label>Statut initial<select value={interventionInitialStatus} onChange={e=>setInterventionInitialStatus(e.target.value as InterventionStatus)}>{INTERVENTION_STATUSES.filter(s=>!['completed','cancelled','archived'].includes(s)).map(s=><option key={s} value={s}>{INTERVENTION_STATUS_LABELS[s]}</option>)}</select></label><InterventionExtraFields value={{...extra,clientAccountId:interventionClientId,type:interventionType}} onChange={setExtra}/><label className="wide">Description<textarea value={interventionDescription} onChange={(event) => setInterventionDescription(event.target.value)} /></label></div><div className="button-row"><button className="primary-button" disabled={saving || !interventionClientId || !interventionSubject.trim()} type="button" onClick={() => void createIntervention()}>Créer l’intervention</button><button className="secondary-button" type="button" onClick={() => { resetInterventionForm(); setCreateInterventionOpen(false); }}>Annuler</button></div></section>}
      {loading ? <section className="panel"><p className="muted">Chargement…</p></section> : <div
        className={selectedIntervention ? `operations-layout intervention-workspace with-detail ${interventionExpanded ? 'detail-expanded' : ''}` : 'operations-layout intervention-workspace'}
        style={selectedIntervention && !interventionExpanded ? { gridTemplateColumns: `${interventionSplitPercent}% 8px minmax(0, 1fr)` } : undefined}
      >
        {!interventionExpanded && <section className="panel operation-list-panel intervention-list-panel">
          {selectedIntervention ? <div className="intervention-compact-list" role="list" aria-label="Interventions">
            {filteredInterventions.map((intervention) => <button
              key={intervention.id}
              type="button"
              role="listitem"
              className={`intervention-compact-item ${selectedIntervention.id === intervention.id ? 'selected' : ''}`}
              onClick={() => { setSelectedIntervention(intervention); setSelectedRequest(null); }}
            >
              <span className="intervention-compact-heading"><strong>{intervention.number}</strong><span className={`operation-status-chip status-${intervention.status}`}>{INTERVENTION_STATUS_LABELS[intervention.status]}</span></span>
              <span className="intervention-compact-subject">{intervention.subject}</span>
              <span className="intervention-compact-client">{intervention.clientLabel}</span>
              <span className="intervention-compact-meta"><span>{INTERVENTION_TYPE_LABELS[intervention.type]}</span><span>{duration(intervention.totalTimeSeconds)}</span></span>
              <span className="intervention-compact-coverage">{COVERAGE_LABELS[intervention.coverageMode]}</span>
            </button>)}
            {filteredInterventions.length === 0 && <div className="empty-table">Aucune intervention dans cette vue.</div>}
          </div> : <table className="operations-table"><thead><tr><th>Numéro</th><th>Client</th><th>Intervention</th><th>Prise en charge</th><th>Temps</th><th>Statut</th></tr></thead><tbody>{filteredInterventions.map((intervention) => <tr key={intervention.id} onClick={() => { setSelectedIntervention(intervention); setSelectedRequest(null); setInterventionExpanded(false); }}><td><strong>{intervention.number}</strong></td><td><strong>{intervention.clientLabel}</strong><small>{intervention.projectLabel || 'Sans projet'}{intervention.projectNodeLabel ? ` · ${intervention.projectNodeLabel}` : ''}</small></td><td><strong>{intervention.subject}</strong><small>{INTERVENTION_TYPE_LABELS[intervention.type]}</small></td><td>{COVERAGE_LABELS[intervention.coverageMode]}</td><td>{duration(intervention.totalTimeSeconds)}</td><td><span className={`operation-status-chip status-${intervention.status}`}>{INTERVENTION_STATUS_LABELS[intervention.status]}</span></td></tr>)}{filteredInterventions.length === 0 && <tr><td colSpan={6}><div className="empty-table">Aucune intervention dans cette vue.</div></td></tr>}</tbody></table>}
        </section>}
        {selectedIntervention && !interventionExpanded && <div
          className="operation-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la liste et l’atelier"
          tabIndex={0}
          onPointerDown={() => beginInterventionResize()}
          onDoubleClick={() => setInterventionSplitPercent(34)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setInterventionSplitPercent((value) => Math.max(20, value - 3));
            if (event.key === 'ArrowRight') setInterventionSplitPercent((value) => Math.min(55, value + 3));
          }}
        ><span /></div>}
        {selectedIntervention && <div ref={interventionDetailRef} className="operation-detail-boundary"><InterventionDetail
          onSaved={() => void refresh({ showLoading: false })}
          intervention={selectedIntervention}
          expanded={interventionExpanded}
          onExpand={() => setInterventionExpanded((value) => !value)}
          onClose={() => { setSelectedIntervention(null); setInterventionExpanded(false); }}
          onStatus={changeInterventionStatus}
          onCoverage={changeCoverage}
          onProjectNode={changeInterventionProjectNode}
          onTimer={startInterventionTimer}
          onMessage={onMessage}
        /></div>}
      </div>}
    </>}

    {view === 'maintenance' && <MaintenancePanel clients={clients} projects={projects} onMessage={onMessage} initialSubscriptionId={initialTarget?.entityType === 'maintenance' ? initialTarget.entityId : null} onInterventionCreated={(intervention) => { setSelectedRequest(null); setSelectedIntervention(intervention); setView('interventions'); void refresh({ showLoading: false }); }} />}
    {view === 'packs' && <HourPacksPanel clients={clients} projects={projects} interventions={interventions} onMessage={onMessage} onOperationsChanged={refresh} initialPackId={initialTarget?.entityType === 'hour_pack' ? initialTarget.entityId : null} />}
  </div>;
}

function RequestDetail({ request, expanded, onExpand, transformType, setTransformType, transformCoverage, setTransformCoverage, transformProjectNodeId, setTransformProjectNodeId, transformProjectNodes, closeReason, setCloseReason, saving, onClose, onStatus, onTransform, onCloseRequest }: { request: ServiceRequest; expanded: boolean; onExpand: () => void; transformType: InterventionType; setTransformType: (value: InterventionType) => void; transformCoverage: InterventionCoverageMode; setTransformCoverage: (value: InterventionCoverageMode) => void; transformProjectNodeId: string; setTransformProjectNodeId: (value: string) => void; transformProjectNodes: ProjectNode[]; closeReason: string; setCloseReason: (value: string) => void; saving: boolean; onClose: () => void; onStatus: (status: ServiceRequestStatus) => Promise<void>; onTransform: () => Promise<void>; onCloseRequest: () => Promise<void>; }) {
  const locked = request.status === 'converted' || request.status === 'archived';
  return <aside className={`panel operation-detail-panel request-workbench-panel ${expanded ? 'expanded' : ''}`}><div className="detail-panel-heading"><div><span className="eyebrow">Demande · {SOURCE_LABELS[request.source]}</span><h2>{request.subject}</h2><p className="muted">{request.clientLabel}{request.projectLabel ? ` · ${request.projectLabel}` : ''}</p></div><div className="request-workbench-heading-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire la demande' : 'Agrandir la demande'} aria-label={expanded ? 'Réduire la demande' : 'Agrandir la demande'} onClick={onExpand}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" aria-label="Fermer" onClick={onClose}><OperationIcon name="close" size={18} /></button></div></div><div className="operation-detail-grid"><div><span>Reçue</span><strong>{dateLabel(request.receivedAt)}</strong></div><div><span>Priorité</span><strong>{PRIORITY_LABELS[request.priority]}</strong></div></div><label>Statut<select disabled={request.status === 'converted'} value={request.status} onChange={(event) => void onStatus(event.target.value as ServiceRequestStatus)}>{SERVICE_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></label>{request.description && <div className="operation-description"><span className="eyebrow">Description</span><p>{request.description}</p></div>}{request.interventionId ? <div className="operation-linked"><strong>✓ Transformée en intervention</strong><span>L’intervention liée est conservée comme source unique du travail réalisé.</span></div> : !locked && <><div className="operation-action-box"><strong>Créer une intervention</strong>{request.projectId && <label>Module / Page / Tâche<select value={transformProjectNodeId} onChange={(event) => setTransformProjectNodeId(event.target.value)} disabled={transformProjectNodes.length === 0}><option value="">Aucun rattachement précis</option>{transformProjectNodes.map((node) => <option key={node.id} value={node.id}>{projectNodeLabel(node)}</option>)}</select></label>}<label>Type<select value={transformType} onChange={(event) => setTransformType(event.target.value as InterventionType)}>{INTERVENTION_TYPES.map((type) => <option key={type} value={type}>{INTERVENTION_TYPE_LABELS[type]}</option>)}</select></label><label>Prise en charge<select value={transformCoverage} onChange={(event) => setTransformCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label><button className="primary-button" type="button" disabled={saving} onClick={() => void onTransform()}>Créer l’intervention</button></div><div className="operation-action-box subtle"><strong>Ou clore sans travail</strong><input value={closeReason} onChange={(event) => setCloseReason(event.target.value)} placeholder="Motif facultatif" /><button className="secondary-button" type="button" onClick={() => void onCloseRequest()}>Clore sans intervention</button></div></>}</aside>;
}

function InterventionDetail({ onSaved, intervention, expanded, onExpand, onClose, onStatus, onCoverage, onProjectNode, onTimer, onMessage }: { onSaved:()=>void; intervention: Intervention; expanded: boolean; onExpand: () => void; onClose: () => void; onStatus: (status: InterventionStatus) => Promise<void>; onCoverage: (coverage: InterventionCoverageMode) => Promise<void>; onProjectNode: (projectNodeId: string | null) => Promise<void>; onTimer: (intervention: Intervention) => void; onMessage: (message: string) => void; }) {
  const [projectNodes, setProjectNodes] = useState<ProjectNode[]>([]);
  useEffect(() => {
    if (!intervention.projectId) {
      setProjectNodes([]);
      return;
    }
    let active = true;
    void window.atoumweb.projects.projects.get(intervention.projectId)
      .then((project) => {
        if (active) setProjectNodes(attachableProjectNodes(project.nodes));
      })
      .catch((error: unknown) => onMessage(error instanceof Error ? error.message : 'Impossible de charger le plan du projet.'));
    return () => { active = false; };
  }, [intervention.projectId]);

  const locked = ['completed', 'cancelled', 'archived'].includes(intervention.status);
  return <aside className={`panel operation-detail-panel intervention-workbench-panel ${expanded ? 'expanded' : ''}`}>
    <div className="detail-panel-heading intervention-workbench-heading">
      <div>
        <span className="eyebrow">{intervention.number}</span>
        <h2>{intervention.subject}</h2>
        <p className="muted">{intervention.clientLabel}{intervention.projectLabel ? ` · ${intervention.projectLabel}` : ''}</p>
      </div>
      <div className="intervention-workbench-heading-actions">
        <button className="operation-detail-expand" type="button" title={expanded ? 'Réduire l’atelier' : 'Agrandir l’atelier'} aria-label={expanded ? 'Réduire l’atelier' : 'Agrandir l’atelier'} onClick={onExpand}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button>
        <button className="close-detail" type="button" title="Fermer" aria-label="Fermer" onClick={onClose}><OperationIcon name="close" size={18} /></button>
      </div>
    </div>

    <div className="intervention-workbench-badges">
      <span className={`operation-status-chip status-${intervention.status}`}>{INTERVENTION_STATUS_LABELS[intervention.status]}</span>
      <span className="status-pill">{INTERVENTION_TYPE_LABELS[intervention.type]}</span>
      <span className={`operation-priority priority-${intervention.priority}`}>{PRIORITY_LABELS[intervention.priority]}</span>
    </div>

    <div className="intervention-kpi-grid">
      <div><strong>Temps réel</strong><span>{duration(intervention.totalTimeSeconds)}</span></div>
      <div><strong>Facturable</strong><span>{money(intervention.billableAmountCents)}</span></div>
      <div><strong>Valeur théorique</strong><span>{money(intervention.theoreticalValueCents)}</span></div>
      <div><strong>Prise en charge</strong><span>{COVERAGE_LABELS[intervention.coverageMode]}</span></div>
    </div>

    <div className="intervention-workbench-actions">
      <button className="primary-button" type="button" disabled={locked} onClick={() => onTimer(intervention)}>▶ {intervention.totalTimeSeconds > 0 ? 'Reprendre le timer' : 'Démarrer le timer'}</button>
      <InterventionEditor intervention={intervention} onSaved={onSaved}/>
    </div>

    <details className="intervention-workbench-section" open>
      <summary><span><strong>Pilotage</strong><small>Statut, prise en charge et rattachement au projet</small></span></summary>
      <div className="intervention-workbench-section-body intervention-pilot-grid">
        <label>Statut<select value={intervention.status} onChange={(event) => void onStatus(event.target.value as InterventionStatus)}>{INTERVENTION_STATUSES.map((status) => <option key={status} value={status}>{INTERVENTION_STATUS_LABELS[status]}</option>)}</select></label>
        <label>Prise en charge<select value={intervention.coverageMode} onChange={(event) => void onCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label>
        {intervention.projectId && <label className="wide">Module / Page / Tâche<select value={intervention.projectNodeId ?? ''} onChange={(event) => void onProjectNode(event.target.value || null)}><option value="">Aucun rattachement précis</option>{projectNodes.map((node) => <option key={node.id} value={node.id}>{projectNodeLabel(node)}</option>)}</select></label>}
      </div>
    </details>

    <details className="intervention-workbench-section" open>
      <summary><span><strong>Contexte & compte rendu</strong><small>Description, notes et informations d’incident</small></span></summary>
      <div className="intervention-workbench-section-body">
        {intervention.description ? <div className="operation-description"><strong>Description</strong><p>{intervention.description}</p></div> : <p className="muted">Aucune description renseignée.</p>}
        {intervention.notes && <div className="operation-description"><strong>Notes</strong><p>{intervention.notes}</p></div>}
        {intervention.type === 'incident' && <div className="incident-summary"><strong>{intervention.incidentCriticality ? `Criticité ${intervention.incidentCriticality}` : 'Incident'}</strong>{intervention.downtimeMinutes != null && <span>Indisponibilité : {intervention.downtimeMinutes} min</span>}{intervention.incidentDiagnosis && <p><b>Diagnostic :</b> {intervention.incidentDiagnosis}</p>}{intervention.incidentSolution && <p><b>Solution :</b> {intervention.incidentSolution}</p>}{intervention.incidentFollowUp && <p><b>Suivi :</b> {intervention.incidentFollowUp}</p>}</div>}
      </div>
    </details>

    <details className="intervention-workbench-section">
      <summary><span><strong>Sécurité & sauvegardes</strong><small>Protection et points de restauration liés à l’intervention</small></span></summary>
      <div className="intervention-workbench-section-body"><InterventionBackupPanel intervention={intervention} onMessage={onMessage} onChanged={onSaved} /></div>
    </details>

    <div className="operation-meta intervention-workbench-meta">
      <span>Créée : {dateLabel(intervention.createdAt)}</span>
      {intervention.scheduledAt && <span>Prévue : {dateLabel(intervention.scheduledAt)}</span>}
      {intervention.startedAt && <span>Démarrée : {dateLabel(intervention.startedAt)}</span>}
      {intervention.completedAt && <span>Terminée : {dateLabel(intervention.completedAt)}</span>}
    </div>
  </aside>;
}

function categoryForIntervention(type: InterventionType): TimeCategory {
  if (['addition', 'modification'].includes(type)) return 'development';
  if (type === 'training') return 'meeting';
  if (type === 'incident' || type === 'support' || type === 'maintenance' || type === 'correction') return 'support';
  return 'production';
}

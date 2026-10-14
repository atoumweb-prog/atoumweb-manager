import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import {requestUnsavedExit,useUnsavedDraft} from '../unsaved/unsaved';
import {useDraftSection} from '../unsaved/useDraftSection';
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
import { acquireCompletionLock, isCurrentOperationsRefresh, resolveInterventionCompletion } from './operationAsyncGuards';
import { MaintenancePanel } from './MaintenancePanel';
import { OperationsAlertsPanel } from './OperationsAlertsPanel';
import { InterventionBackupPanel } from './InterventionBackupPanel';
import { OperationIcon } from './OperationIcon';

type OperationsView = 'requests' | 'interventions' | 'maintenance' | 'packs';
export type OperationsSearchTarget = {
  entityType: Extract<SearchResult['entityType'], 'service_request' | 'intervention' | 'maintenance' | 'hour_pack'>;
  entityId: string;
  focus?: 'conclusion';
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

export function OperationsPage({ onEntityReady, onMessage, initialTarget, initialRequest }: { onMessage: (message: string) => void; initialTarget?: OperationsSearchTarget | null;initialRequest?:number;onEntityReady?:EntityReady }) {
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
  useSearchTargetConfirmation(view==='requests'?'service_request':'intervention',view==='requests'?selectedRequest?.id:selectedIntervention?.id,loading,view==='requests'||view==='interventions'?onEntityReady:undefined);

  const [interventionSplitPercent, setInterventionSplitPercent] = useState(34);
  const [interventionExpanded, setInterventionExpanded] = useState(false);
  const [conclusionInterventionId, setConclusionInterventionId] = useState<string | null>(null);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [createInterventionOpen, setCreateInterventionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interventionDemoMode, setInterventionDemoMode] = useState(false);
  const requestDetailRef = useRef<HTMLDivElement | null>(null);
  const interventionDetailRef = useRef<HTMLDivElement | null>(null);
  const refreshGeneration = useRef(0);
  const interventionWriteGeneration = useRef(0);
  const completionInFlight = useRef(new Set<string>());

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

  async function refresh(options: { showLoading?: boolean } = {}): Promise<boolean> {
    const showLoading = options.showLoading ?? true;
    const generation = ++refreshGeneration.current;
    const writeAtStart = interventionWriteGeneration.current;
    if (showLoading) setLoading(true);
    try {
      const [nextRequests, nextInterventions, nextClients, nextProjects] = await Promise.all([
        window.atoumweb.operations.requests.list(), window.atoumweb.operations.interventions.list(), window.atoumweb.crm.clients.list(), window.atoumweb.projects.projects.list(),
      ]);
      if (!isCurrentOperationsRefresh(generation, refreshGeneration.current, writeAtStart, interventionWriteGeneration.current)) return false;
      setRequests(nextRequests); setInterventions(nextInterventions); setClients(nextClients); setProjects(nextProjects);
      setSelectedRequest((current) => current ? nextRequests.find((item) => item.id === current.id) ?? null : null);
      setSelectedIntervention((current) => current ? nextInterventions.find((item) => item.id === current.id) ?? current : null);
      setAlertRefreshKey((value) => value + 1);
      return true;
    } catch (error) { if (generation === refreshGeneration.current) onMessage(error instanceof Error ? error.message : 'Impossible de charger les opérations.'); return false; }
    finally { if (showLoading && generation === refreshGeneration.current) setLoading(false); }
  }

  useEffect(() => { void refresh({ showLoading: true }); }, []);
  useEffect(() => {
    if (!selectedRequest) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if(!requestUnsavedExit(()=>{}))return;
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
        if(!requestUnsavedExit(()=>{}))return;
        setSelectedIntervention(null);
        setInterventionExpanded(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedIntervention?.id]);

  useEffect(() => {
    const refreshIntervention = (event: Event) => {
      const interventionId = (event as CustomEvent<{ interventionId?: string }>).detail?.interventionId;
      if (!interventionId) return;
      void window.atoumweb.operations.interventions.get(interventionId)
        .then((intervention) => {
          setInterventions((current) => current.map((item) => item.id === intervention.id ? intervention : item));
          setSelectedIntervention((current) => current?.id === intervention.id ? intervention : current);
          setAlertRefreshKey((value) => value + 1);
        })
        .catch(() => undefined);
    };
    window.addEventListener('atoumweb:intervention-updated', refreshIntervention);
    return () => window.removeEventListener('atoumweb:intervention-updated', refreshIntervention);
  }, []);

  useEffect(() => {
    if (!initialTarget) return;
    let live=true;
    if(initialTarget.entityType==='intervention'&&selectedIntervention?.id===initialTarget.entityId){
      if(initialTarget.focus==='conclusion'){setConclusionInterventionId(selectedIntervention.id);setInterventionExpanded(true);}
      return()=>{live=false;};
    }
    setQuery('');
    setSelectedRequest(null);
    setSelectedIntervention(null);

    if (initialTarget.entityType === 'service_request') {
      setView('requests');
      setRequestStatus('all');
      void window.atoumweb.operations.requests.get(initialTarget.entityId)
        .then((request) => {if(live)setSelectedRequest(request);})
        .catch((error: unknown) => {if(!live)return;const message=error instanceof Error?error.message:'Demande introuvable.';onEntityReady?.('service_request',initialTarget.entityId,message);onMessage(message);});
      return()=>{live=false;};
    }
    if (initialTarget.entityType === 'intervention') {
      setView('interventions');
      setInterventionStatus('all');
      void window.atoumweb.operations.interventions.get(initialTarget.entityId)
        .then((intervention) => {
          if(!live)return;
          setSelectedIntervention(intervention);
          if (initialTarget.focus === 'conclusion') {
            setConclusionInterventionId(intervention.id);
            setInterventionExpanded(true);
          }
        })
        .catch((error: unknown) => {if(!live)return;const message=error instanceof Error?error.message:'Intervention introuvable.';onEntityReady?.('intervention',initialTarget.entityId,message);onMessage(message);});
      return()=>{live=false;};
    }
    if (initialTarget.entityType === 'maintenance') {
      setView('maintenance');
      return()=>{live=false;};
    }
    setView('packs');
    return()=>{live=false;};
  }, [initialTarget?.entityType, initialTarget?.entityId, initialTarget?.focus,initialRequest]);

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

  async function changeInterventionStatus(status: InterventionStatus): Promise<boolean> {
    if (!selectedIntervention) return false;
    const interventionId = selectedIntervention.id;
    const releaseLock = status === 'completed' ? acquireCompletionLock(completionInFlight.current, interventionId) : undefined;
    if (status === 'completed' && !releaseLock) return false;
    try {
    let updated: Intervention;
    if (status === 'completed') {
      const outcome = await resolveInterventionCompletion(
        interventionId,
        (id) => window.atoumweb.operations.interventions.complete(id),
        (id) => window.atoumweb.operations.interventions.get(id),
      );
      if (outcome.kind === 'unknown') {
        onMessage('Résultat de clôture inconnu : la confirmation et la relecture ont échoué. Vérifie le statut avant toute nouvelle tentative.');
        return false;
      }
      if (outcome.kind === 'not_confirmed') {
        onMessage(`Clôture non confirmée : ${outcome.intervention.number} est toujours « ${INTERVENTION_STATUS_LABELS[outcome.intervention.status]} ». Vérifie avant de relancer.`);
        return false;
      }
      updated = outcome.intervention;
    } else {
      try {
        updated = await window.atoumweb.operations.interventions.changeStatus(interventionId, status);
      } catch (error) {
        onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.');
        return false;
      }
    }
    interventionWriteGeneration.current += 1;
    setSelectedIntervention((current) => current?.id === updated.id ? updated : current);
    setInterventions((current) => current.map((item) => item.id === updated.id ? updated : item));
    const refreshed = await refresh({ showLoading: false });
    if (status === 'completed') {
      onMessage(refreshed
        ? `${updated.number} terminée · prise en charge traitée.`
        : `${updated.number} terminée dans les données, mais l’actualisation des listes n’a pas été confirmée. Vérifie avant toute nouvelle action.`);
    }
    return true;
    } finally {
      releaseLock?.();
    }
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
      <button type="button" className={view === 'requests' ? 'active' : ''} onClick={() => {if(view!=='requests')requestUnsavedExit(()=>setView('requests'));}}>Demandes <span>{requests.filter((item) => !['closed', 'converted', 'archived'].includes(item.status)).length}</span></button>
      <button type="button" className={view === 'interventions' ? 'active' : ''} onClick={() => {if(view!=='interventions')requestUnsavedExit(()=>setView('interventions'));}}>Interventions <span>{interventions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status)).length}</span></button>
      <button type="button" className={view === 'maintenance' ? 'active' : ''} onClick={() => {if(view!=='maintenance')requestUnsavedExit(()=>setView('maintenance'));}}>Maintenance</button>
      <button type="button" className={view === 'packs' ? 'active' : ''} onClick={() => {if(view!=='packs')requestUnsavedExit(()=>setView('packs'));}}>Packs d’heures</button>
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
              onClick={() => requestUnsavedExit(()=>{ setSelectedRequest(request); setSelectedIntervention(null); })}
            >
              <span className="request-compact-heading"><strong>{request.subject}</strong><span className={`operation-priority priority-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span></span>
              <span className="request-compact-client">{request.clientLabel}</span>
              <span className="request-compact-meta"><span>{SOURCE_LABELS[request.source]}</span><span>{REQUEST_STATUS_LABELS[request.status]}</span></span>
              <span className="request-compact-date">{dateLabel(request.receivedAt)}</span>
            </button>)}
            {filteredRequests.length === 0 && <div className="empty-table">Aucune demande dans cette vue.</div>}
          </div> : <table className="operations-table"><thead><tr><th>Reçue</th><th>Client</th><th>Sujet</th><th>Priorité</th><th>Statut</th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.id} onClick={() => requestUnsavedExit(()=>{ setSelectedRequest(request); setSelectedIntervention(null); setRequestExpanded(false); })}><td>{dateLabel(request.receivedAt)}</td><td><strong>{request.clientLabel}</strong><small>{request.projectLabel || 'Sans projet'}</small></td><td><strong>{request.subject}</strong><small>{SOURCE_LABELS[request.source]}</small></td><td><span className={`operation-priority priority-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span></td><td>{REQUEST_STATUS_LABELS[request.status]}</td></tr>)}{filteredRequests.length === 0 && <tr><td colSpan={5}><div className="empty-table">Aucune demande dans cette vue.</div></td></tr>}</tbody></table>}
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
              onClick={() => requestUnsavedExit(()=>{ setSelectedIntervention(intervention); setSelectedRequest(null); })}
            >
              <span className="intervention-compact-heading"><strong>{intervention.number}</strong><span className={`operation-status-chip status-${intervention.status}`}>{INTERVENTION_STATUS_LABELS[intervention.status]}</span></span>
              <span className="intervention-compact-subject">{intervention.subject}</span>
              <span className="intervention-compact-client">{intervention.clientLabel}</span>
              <span className="intervention-compact-meta"><span>{INTERVENTION_TYPE_LABELS[intervention.type]}</span><span>{duration(intervention.totalTimeSeconds)}</span></span>
              <span className="intervention-compact-coverage">{COVERAGE_LABELS[intervention.coverageMode]}</span>
            </button>)}
            {filteredInterventions.length === 0 && <div className="empty-table">Aucune intervention dans cette vue.</div>}
          </div> : <table className="operations-table"><thead><tr><th>Numéro</th><th>Client</th><th>Intervention</th><th>Prise en charge</th><th>Temps</th><th>Statut</th></tr></thead><tbody>{filteredInterventions.map((intervention) => <tr key={intervention.id} onClick={() => requestUnsavedExit(()=>{ setSelectedIntervention(intervention); setSelectedRequest(null); setInterventionExpanded(false); })}><td><strong>{intervention.number}</strong></td><td><strong>{intervention.clientLabel}</strong><small>{intervention.projectLabel || 'Sans projet'}{intervention.projectNodeLabel ? ` · ${intervention.projectNodeLabel}` : ''}</small></td><td><strong>{intervention.subject}</strong><small>{INTERVENTION_TYPE_LABELS[intervention.type]}</small></td><td>{COVERAGE_LABELS[intervention.coverageMode]}</td><td>{duration(intervention.totalTimeSeconds)}</td><td><span className={`operation-status-chip status-${intervention.status}`}>{INTERVENTION_STATUS_LABELS[intervention.status]}</span></td></tr>)}{filteredInterventions.length === 0 && <tr><td colSpan={6}><div className="empty-table">Aucune intervention dans cette vue.</div></td></tr>}</tbody></table>}
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
          onClose={() => requestUnsavedExit(()=>{ setSelectedIntervention(null); setInterventionExpanded(false); })}
          onStatus={changeInterventionStatus}
          onCoverage={changeCoverage}
          onProjectNode={changeInterventionProjectNode}
          onTimer={startInterventionTimer}
          conclusionRequested={conclusionInterventionId === selectedIntervention.id}
          onConclusionHandled={() => setConclusionInterventionId(null)}
          onMessage={onMessage}
        /></div>}
      </div>}
    </>}

    {view === 'maintenance' && <MaintenancePanel initialRequest={initialRequest} onEntityReady={onEntityReady} clients={clients} projects={projects} onMessage={onMessage} initialSubscriptionId={initialTarget?.entityType === 'maintenance' ? initialTarget.entityId : null} onInterventionCreated={(intervention) => { setSelectedRequest(null); setSelectedIntervention(intervention); setView('interventions'); void refresh({ showLoading: false }); }} />}
    {view === 'packs' && <HourPacksPanel initialRequest={initialRequest} onEntityReady={onEntityReady} clients={clients} projects={projects} interventions={interventions} onMessage={onMessage} onOperationsChanged={refresh} initialPackId={initialTarget?.entityType === 'hour_pack' ? initialTarget.entityId : null} />}
  </div>;
}

function RequestDetail({ request, expanded, onExpand, transformType, setTransformType, transformCoverage, setTransformCoverage, transformProjectNodeId, setTransformProjectNodeId, transformProjectNodes, closeReason, setCloseReason, saving, onClose, onStatus, onTransform, onCloseRequest }: { request: ServiceRequest; expanded: boolean; onExpand: () => void; transformType: InterventionType; setTransformType: (value: InterventionType) => void; transformCoverage: InterventionCoverageMode; setTransformCoverage: (value: InterventionCoverageMode) => void; transformProjectNodeId: string; setTransformProjectNodeId: (value: string) => void; transformProjectNodes: ProjectNode[]; closeReason: string; setCloseReason: (value: string) => void; saving: boolean; onClose: () => void; onStatus: (status: ServiceRequestStatus) => Promise<void>; onTransform: () => Promise<void>; onCloseRequest: () => Promise<void>; }) {
  const locked = request.status === 'converted' || request.status === 'archived';
  return <aside className={`panel operation-detail-panel request-workbench-panel ${expanded ? 'expanded' : ''}`}><div className="detail-panel-heading"><div><span className="eyebrow">Demande · {SOURCE_LABELS[request.source]}</span><h2>{request.subject}</h2><p className="muted">{request.clientLabel}{request.projectLabel ? ` · ${request.projectLabel}` : ''}</p></div><div className="request-workbench-heading-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire la demande' : 'Agrandir la demande'} aria-label={expanded ? 'Réduire la demande' : 'Agrandir la demande'} onClick={onExpand}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" aria-label="Fermer" onClick={onClose}><OperationIcon name="close" size={18} /></button></div></div><div className="operation-detail-grid"><div><span>Reçue</span><strong>{dateLabel(request.receivedAt)}</strong></div><div><span>Priorité</span><strong>{PRIORITY_LABELS[request.priority]}</strong></div></div><label>Statut<select disabled={request.status === 'converted'} value={request.status} onChange={(event) => void onStatus(event.target.value as ServiceRequestStatus)}>{SERVICE_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>)}</select></label>{request.description && <div className="operation-description"><span className="eyebrow">Description</span><p>{request.description}</p></div>}{request.interventionId ? <div className="operation-linked"><strong>✓ Transformée en intervention</strong><span>L’intervention liée est conservée comme source unique du travail réalisé.</span></div> : !locked && <><div className="operation-action-box"><strong>Créer une intervention</strong>{request.projectId && <label>Module / Page / Tâche<select value={transformProjectNodeId} onChange={(event) => setTransformProjectNodeId(event.target.value)} disabled={transformProjectNodes.length === 0}><option value="">Aucun rattachement précis</option>{transformProjectNodes.map((node) => <option key={node.id} value={node.id}>{projectNodeLabel(node)}</option>)}</select></label>}<label>Type<select value={transformType} onChange={(event) => setTransformType(event.target.value as InterventionType)}>{INTERVENTION_TYPES.map((type) => <option key={type} value={type}>{INTERVENTION_TYPE_LABELS[type]}</option>)}</select></label><label>Prise en charge<select value={transformCoverage} onChange={(event) => setTransformCoverage(event.target.value as InterventionCoverageMode)}>{INTERVENTION_COVERAGE_MODES.map((mode) => <option key={mode} value={mode}>{COVERAGE_LABELS[mode]}</option>)}</select></label><button className="primary-button" type="button" disabled={saving} onClick={() => void onTransform()}>Créer l’intervention</button></div><div className="operation-action-box subtle"><strong>Ou clore sans travail</strong><input value={closeReason} onChange={(event) => setCloseReason(event.target.value)} placeholder="Motif facultatif" /><button className="secondary-button" type="button" onClick={() => void onCloseRequest()}>Clore sans intervention</button></div></>}</aside>;
}

function InterventionDetail({ onSaved, intervention, expanded, onExpand, onClose, onStatus, onCoverage, onProjectNode, onTimer, conclusionRequested, onConclusionHandled, onMessage }: { onSaved:()=>void; intervention: Intervention; expanded: boolean; onExpand: () => void; onClose: () => void; onStatus: (status: InterventionStatus) => Promise<boolean>; onCoverage: (coverage: InterventionCoverageMode) => Promise<void>; onProjectNode: (projectNodeId: string | null) => Promise<void>; onTimer: (intervention: Intervention) => void; conclusionRequested: boolean; onConclusionHandled: () => void; onMessage: (message: string) => void; }) {
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
      <div><strong>Temps réel</strong><span>{duration(intervention.totalTimeSeconds)}</span></div><div><strong>Référence initiale</strong><span>{intervention.referenceMinutes==null?'Non définie':`${intervention.referenceMinutes} min`}</span></div><label>Estimation actuelle (minutes)<input type="number" min="0" value={intervention.estimatedMinutes??''} disabled={locked} onChange={e=>void window.atoumweb.operations.interventions.update(intervention.id,{estimatedMinutes:e.target.value===''?null:Number(e.target.value)}).then(onSaved).catch(e=>onMessage(String(e)))}/></label>
      <div><strong>Facturable</strong><span>{money(intervention.billableAmountCents)}</span></div>
      <div><strong>Valeur théorique</strong><span>{money(intervention.theoreticalValueCents)}</span></div>
      <div><strong>Prise en charge</strong><span>{COVERAGE_LABELS[intervention.coverageMode]}</span></div>
    </div>

    <div className="intervention-workbench-actions">
      {!!intervention.operationalChecklist?.length&&<details><summary>Phases et checklist de la prestation vendue</summary>{intervention.operationalChecklist.map(a=><section key={a.key}><strong>{a.phase} — {a.name} · {a.minutes} min de référence</strong><p>{a.checklist}</p></section>)}</details>}
      <button className="primary-button" type="button" disabled={locked} onClick={() => onTimer(intervention)}>▶ {intervention.totalTimeSeconds > 0 ? 'Reprendre le timer' : 'Démarrer le timer'}</button>
      <InterventionEditor intervention={intervention} onSaved={onSaved}/>
    </div>

    {intervention.type === 'incident' && <InterventionConclusionPanel
      intervention={intervention}
      forceOpen={conclusionRequested}
      onHandled={onConclusionHandled}
      onSaved={onSaved}
      onComplete={() => onStatus('completed')}
      onMessage={onMessage}
    />}

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

function InterventionConclusionPanel({ intervention, forceOpen, onHandled, onSaved, onComplete, onMessage }: {
  intervention: Intervention;
  forceOpen: boolean;
  onHandled: () => void;
  onSaved: () => void;
  onComplete: () => Promise<boolean>;
  onMessage: (message: string) => void;
}) {
  const [open, setOpen] = useState(forceOpen);
  const remote={cause:intervention.incidentCause??'',diagnosis:intervention.incidentDiagnosis??'',solution:intervention.incidentSolution??'',followUp:intervention.incidentFollowUp??''};
  const draft=useDraftSection(intervention.id,remote);
  const {cause,diagnosis,solution,followUp}=draft.value;
  const setCause=(value:string)=>draft.section.set(current=>({...current,cause:value}));
  const setDiagnosis=(value:string)=>draft.section.set(current=>({...current,diagnosis:value}));
  const setSolution=(value:string)=>draft.section.set(current=>({...current,solution:value}));
  const setFollowUp=(value:string)=>draft.section.set(current=>({...current,followUp:value}));
  const [busy, setBusy] = useState(false);
  const panel=useRef<HTMLElement>(null),focusRequested=useRef(forceOpen);
  useUnsavedDraft('Conclusion intervention',draft.value,{group:'intervention:'+intervention.id+':conclusion',dirty:draft.section.dirty,pending:busy,discard:()=>draft.section.discard()});

  useEffect(() => {
    draft.section.receive(remote);
  }, [intervention.id, intervention.incidentCause, intervention.incidentDiagnosis, intervention.incidentSolution, intervention.incidentFollowUp]);

  useEffect(() => {
    if (!forceOpen) return;
    focusRequested.current=true;
    setOpen(true);
    onHandled();
  }, [forceOpen, intervention.id]);
  useEffect(()=>{if(open&&focusRequested.current){focusRequested.current=false;panel.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();}},[open,forceOpen,intervention.id]);

  async function save(finalize: boolean): Promise<void> {
    if(draft.conflicts.length){onMessage('Vérifiez le conflit de conclusion avant de l’enregistrer.');return;}
    if (finalize && !solution.trim()) {
      onMessage('Renseigne au minimum la solution apportée avant de clôturer l’incident.');
      return;
    }
    setBusy(true);
    const submitted=draft.value;
    try {
      const updated=await window.atoumweb.operations.interventions.update(intervention.id, {
        incidentResolvedAt: intervention.incidentResolvedAt ?? new Date().toISOString(),
        incidentCause: cause.trim() || null,
        incidentDiagnosis: diagnosis.trim() || null,
        incidentSolution: solution.trim() || null,
        incidentFollowUp: followUp.trim() || null,
      });
      draft.section.receive({cause:updated.incidentCause??'',diagnosis:updated.incidentDiagnosis??'',solution:updated.incidentSolution??'',followUp:updated.incidentFollowUp??''},{value:submitted});
      onSaved();
      if (finalize) {
        const completed = await onComplete();
        if (!completed) return;
        setOpen(false);
        onMessage(`${intervention.number} clôturée · conclusion enregistrée.`);
      } else {
        onMessage('Conclusion de panne enregistrée.');
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la conclusion.');
    } finally {
      setBusy(false);
    }
  }

  return <section ref={panel} className={`intervention-conclusion-panel ${open ? 'open' : ''}`}>
    <button className="intervention-conclusion-toggle" type="button" onClick={() => setOpen((value) => !value)}>
      <span><span className="eyebrow">Fin d’incident</span><strong>Conclusion & rapport de fin</strong><small>{intervention.incidentResolvedAt ? `Résolution : ${dateLabel(intervention.incidentResolvedAt)}` : 'À compléter avant clôture'}</small></span>
      <span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <div className="intervention-conclusion-content">
      {draft.conflicts.length>0&&<div role="alert">La conclusion a changé ailleurs. Votre saisie est conservée ; vérifiez les champs en conflit avant de poursuivre. <button type="button" disabled={busy} onClick={()=>draft.section.receive(draft.baseline,{value:draft.baseline})}>Conserver ma saisie après vérification</button></div>}
      <fieldset disabled={busy} className="intervention-conclusion-grid">
        <label>Cause constatée<textarea value={cause} onChange={(event) => setCause(event.target.value)} placeholder="Origine du défaut ou cause probable…" /></label>
        <label>Diagnostic<textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Constats, contrôles et diagnostic…" /></label>
        <label>Solution apportée <span className="required-mark">*</span><textarea value={solution} onChange={(event) => setSolution(event.target.value)} placeholder="Correction réalisée et résultat obtenu…" /></label>
        <label>Suivi / recommandation<textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Surveillance, action future ou recommandation…" /></label>
      </fieldset>
      <div className="intervention-final-report-preview">
        <div><span className="eyebrow">Rapport de fin</span><strong>{intervention.number} · {intervention.subject}</strong></div>
        <div className="intervention-final-report-stats">
          <span>Client <strong>{intervention.clientLabel}</strong></span>
          <span>Temps <strong>{duration(intervention.totalTimeSeconds)}</strong></span>
          <span>Résolution <strong>{intervention.incidentResolvedAt ? dateLabel(intervention.incidentResolvedAt) : 'Maintenant'}</strong></span>
          <span>Statut <strong>{INTERVENTION_STATUS_LABELS[intervention.status]}</strong></span>
        </div>
        <small>Ces informations serviront de base au document/PDF de fin dans Documents & Contrats.</small>
      </div>
      <div className="button-row">
        <button className="secondary-button" type="button" disabled={busy} onClick={() => void save(false)}>Enregistrer la conclusion</button>
        <button className="primary-button" type="button" disabled={busy || !solution.trim()} onClick={() => void save(true)}>{busy ? 'Enregistrement…' : 'Clôturer l’incident'}</button>
      </div>
    </div>}
  </section>;
}

function categoryForIntervention(type: InterventionType): TimeCategory {
  if (['addition', 'modification'].includes(type)) return 'development';
  if (type === 'training') return 'meeting';
  if (type === 'incident' || type === 'support' || type === 'maintenance' || type === 'correction') return 'support';
  return 'production';
}

import { useEffect, useMemo, useState } from 'react';
import type { QuoteSummary } from '../../shared/commercial';
import {
  PROJECT_COMMERCIAL_MODES,
  PROJECT_NODE_STATUSES,
  PROJECT_PREREQUISITE_STATUSES,
  PROJECT_STATUSES,
  type ProjectCommercialMode,
  type ProjectCompletionReview,
  type ProjectDetail,
  type ProjectNode,
  type ProjectNodeInput,
  type ProjectNodeStatus,
  type ProjectPrerequisiteStatus,
  type ProjectStatus,
  type ProjectSummary,
  type ProjectTemplateDetail,
  type ProjectTemplateSummary,
  type ProjectTemplateVersion,
  type ProjectWorkCard,
} from '../../shared/projects';
import { ProjectCompletionReviewPanel } from './ProjectCompletionReviewPanel';
import { ProjectOperationsTab } from './ProjectOperationsTab';
import { ProjectResourcesTab } from './ProjectResourcesTab';
import { ProjectTechnicalLibraryTab } from './ProjectTechnicalLibraryTab';
import { ProjectTimeTab } from './ProjectTimeTab';
import type { TimeSession } from '../../shared/time';

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  to_prepare: 'À préparer',
  in_progress: 'En cours',
  waiting_client: 'En attente client',
  blocked: 'Bloqué',
  to_validate: 'À valider',
  completed: 'Terminé',
  archived: 'Archivé',
};

const NODE_STATUS_LABELS: Record<ProjectNodeStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  waiting_client: 'En attente client',
  blocked: 'Bloqué',
  to_validate: 'À valider',
  done: 'Terminé',
};

const PREREQUISITE_STATUS_LABELS: Record<ProjectPrerequisiteStatus, string> = {
  to_request: 'À demander',
  requested: 'Demandé',
  received: 'Reçu',
  incomplete: 'Incomplet',
  validated: 'Validé',
  not_applicable: 'Non applicable',
};

const COMMERCIAL_MODE_LABELS: Record<ProjectCommercialMode, string> = {
  normal: 'Normal',
  discounted: 'Remisé',
  free: 'Offert',
  partnership: 'Partenariat',
  internal: 'Interne AtoumWeb',
};

type ProjectHistoryAction =
  | {
      kind: 'update';
      nodeId: string;
      before: Partial<ProjectNodeInput>;
      after: Partial<ProjectNodeInput>;
      label: string;
    }
  | {
      kind: 'move';
      nodeId: string;
      before: { parentId: string | null; targetIndex: number };
      after: { parentId: string | null; targetIndex: number };
      label: string;
    }
  | {
      kind: 'pause';
      nodeId: string;
      before: { paused: boolean; reason: string | null };
      after: { paused: boolean; reason: string | null };
      label: string;
    };

interface ProjectNodePosition {
  phaseIndex: number;
  phaseId: string;
  phaseName: string;
  stepIndex?: number;
}

const PROJECT_TYPES = [
  ['website', 'Site vitrine'],
  ['ecommerce', 'E-commerce'],
  ['landing', 'Landing page'],
  ['application', 'Application'],
  ['software', 'Logiciel'],
  ['internal', 'Projet interne AtoumWeb'],
] as const;

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

function duration(minutes: number): string {
  if (!minutes) return '0 h';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest.toString().padStart(2, '0')}` : `${hours} h`;
}

function dateLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}

function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, '0')).join(':');
}

export function ProjectsPage({ onMessage, initialProjectId }: { onMessage: (message: string) => void; initialProjectId?: string | null }) {
  const [view, setView] = useState<'projects' | 'templates'>('projects');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplateSummary[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<QuoteSummary[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Set<string>>(() => new Set());
  const [undoStack, setUndoStack] = useState<ProjectHistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectHistoryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState<'quote' | 'internal' | null>(null);
  const [quoteId, setQuoteId] = useState('');
  const [templateVersionId, setTemplateVersionId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [commercialMode, setCommercialMode] = useState<ProjectCommercialMode>('normal');
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<'summary' | 'plan' | 'prerequisites' | 'resources' | 'technical' | 'operations' | 'time' | 'commercial'>('summary');
  const [completionReview, setCompletionReview] = useState<ProjectCompletionReview | null>(null);
  const [completionBusy, setCompletionBusy] = useState(false);

  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'lot' | 'module' | 'task' | 'checklist'>('task');
  const [newNodeParentId, setNewNodeParentId] = useState('');
  const [newNodeMinutes, setNewNodeMinutes] = useState('');
  const [newNodeRequired, setNewNodeRequired] = useState(true);
  const [newPrerequisite, setNewPrerequisite] = useState('');

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const [nextProjects, nextTemplates, nextQuotes] = await Promise.all([
        window.atoumweb.projects.projects.list(),
        window.atoumweb.projects.templates.list(),
        window.atoumweb.quotes.list({ status: 'accepted' }),
      ]);
      setProjects(nextProjects);
      setTemplates(nextTemplates);
      const usedQuoteIds = new Set(nextProjects.map((project) => project.sourceQuoteId).filter(Boolean));
      setAcceptedQuotes(nextQuotes.filter((quote) => !usedQuoteIds.has(quote.id)));
      if (selectedId && nextProjects.some((project) => project.id === selectedId)) {
        setDetail(await window.atoumweb.projects.projects.get(selectedId));
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (!initialProjectId) return;
    setView('projects');
    void openProject(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    if (!detail) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProjectDetail();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detail?.id]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return projects.filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) return false;
      if (!needle) return true;
      return [project.number, project.name, project.clientLabel, project.projectType].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [projects, query, statusFilter]);

  const publishedTemplates = useMemo(
    () => templates.filter((template) => template.currentVersion?.status === 'published'),
    [templates],
  );

  async function openProject(id: string): Promise<void> {
    try {
      setSelectedId(id);
      setSelectedNodeId(null);
      setExpandedPhaseIds(new Set());
      setUndoStack([]);
      setRedoStack([]);
      setCompletionReview(null);
      setDetail(await window.atoumweb.projects.projects.get(id));
      setDetailTab('plan');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Projet introuvable.');
    }
  }

  function togglePhase(phaseId: string): void {
    setExpandedPhaseIds((current) => {
      const next = new Set(current);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }

  function closeProjectDetail(): void {
    setCompletionReview(null);
    setSelectedNodeId(null);
    setExpandedPhaseIds(new Set());
    setUndoStack([]);
    setRedoStack([]);
    setDetail(null);
    setSelectedId(null);
  }

  function resetCreate(): void {
    setCreateMode(null);
    setQuoteId('');
    setTemplateVersionId('');
    setProjectName('');
    setTargetDate('');
    setCommercialMode('normal');
  }

  function openQuoteProjectCreate(): void {
    if (createMode === 'quote') {
      resetCreate();
      return;
    }
    setCreateMode('quote');
    setTemplateVersionId('');
  }

  async function createProject(): Promise<void> {
    if (!createMode) return;
    setSaving(true);
    try {
      let created: ProjectDetail;
      if (createMode === 'quote') {
        if (!quoteId) throw new Error('Choisis un devis accepté.');
        created = await window.atoumweb.projects.projects.transformQuote({
          quoteId,
          templateVersionId: templateVersionId || null,
          name: projectName.trim() || null,
          targetDate: targetDate || null,
          commercialMode,
        });
      } else {
        if (!projectName.trim()) throw new Error('Renseigne le nom du projet interne.');
        created = await window.atoumweb.projects.projects.createInternal({
          name: projectName.trim(),
          projectType: 'internal',
          templateVersionId: templateVersionId || null,
          targetDate: targetDate || null,
        });
      }
      resetCreate();
      await refresh();
      await openProject(created.id);
      onMessage(`Projet ${created.number} créé.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer le projet.');
    } finally {
      setSaving(false);
    }
  }

  async function changeProjectStatus(status: ProjectStatus): Promise<void> {
    if (!detail) return;
    if (status === 'completed' && detail.status !== 'completed') {
      try {
        setCompletionReview(await window.atoumweb.projects.projects.completionReview(detail.id));
      } catch (error) {
        onMessage(error instanceof Error ? error.message : 'Impossible de vérifier la fin du projet.');
      }
      return;
    }
    try {
      setCompletionReview(null);
      const updated = await window.atoumweb.projects.projects.changeStatus(detail.id, status);
      setDetail(updated);
      await refresh();
      onMessage(`Statut du projet : ${PROJECT_STATUS_LABELS[status]}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de changer le statut.');
    }
  }

  async function confirmProjectCompletion(): Promise<void> {
    if (!detail) return;
    setCompletionBusy(true);
    try {
      const updated = await window.atoumweb.projects.projects.changeStatus(detail.id, 'completed');
      setDetail(updated);
      setCompletionReview(null);
      await refresh();
      onMessage('Projet terminé. Les avertissements de clôture restent non bloquants par conception.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de terminer le projet.');
    } finally {
      setCompletionBusy(false);
    }
  }

  async function addProjectNode(): Promise<void> {
    if (!detail || !newNodeName.trim()) return;
    try {
      const minutes = newNodeMinutes.trim() ? Number(newNodeMinutes) : null;
      if (minutes != null && (!Number.isFinite(minutes) || minutes < 0)) throw new Error('Temps estimé invalide.');
      const updated = await window.atoumweb.projects.projects.addNode(detail.id, {
        parentId: newNodeParentId || null,
        type: newNodeType,
        name: newNodeName.trim(),
        estimatedMinutes: minutes,
        required: newNodeRequired,
      });
      setDetail(updated);
      setNewNodeName('');
      setNewNodeMinutes('');
      setNewNodeParentId('');
      await refresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter la tâche.');
    }
  }

  function rememberProjectChange(action: ProjectHistoryAction): void {
    setUndoStack((current) => [...current.slice(-29), action]);
    setRedoStack([]);
  }

  async function applyProjectHistoryAction(action: ProjectHistoryAction, direction: 'undo' | 'redo'): Promise<ProjectDetail> {
    if (action.kind === 'update') {
      return window.atoumweb.projects.projects.updateNode(action.nodeId, direction === 'undo' ? action.before : action.after);
    }
    if (action.kind === 'move') {
      const target = direction === 'undo' ? action.before : action.after;
      return window.atoumweb.projects.projects.moveNode(action.nodeId, target);
    }
    const target = direction === 'undo' ? action.before : action.after;
    return window.atoumweb.projects.projects.setNodePause(action.nodeId, target.paused, target.reason);
  }

  async function undoProjectChange(): Promise<void> {
    const action = undoStack.at(-1);
    if (!action) return;
    try {
      const updated = await applyProjectHistoryAction(action, 'undo');
      setDetail(updated);
      setUndoStack((current) => current.slice(0, -1));
      setRedoStack((current) => [...current, action]);
      await refresh();
      onMessage(`Annulé : ${action.label}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’annuler la dernière modification.');
    }
  }

  async function redoProjectChange(): Promise<void> {
    const action = redoStack.at(-1);
    if (!action) return;
    try {
      const updated = await applyProjectHistoryAction(action, 'redo');
      setDetail(updated);
      setRedoStack((current) => current.slice(0, -1));
      setUndoStack((current) => [...current, action]);
      await refresh();
      onMessage(`Rétabli : ${action.label}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de rétablir la modification.');
    }
  }

  async function updateProjectNodeWithHistory(nodeId: string, input: Partial<ProjectNodeInput>): Promise<void> {
    if (!detail) return;
    const currentNode = detail.nodes.find((node) => node.id === nodeId);
    if (!currentNode) return;

    const before: Partial<ProjectNodeInput> = {};
    if (input.workCard !== undefined) before.workCard = currentNode.workCard ?? null;
    if (input.estimatedMinutes !== undefined) before.estimatedMinutes = currentNode.estimatedMinutes ?? null;
    if (input.name !== undefined) before.name = currentNode.name;
    if (input.description !== undefined) before.description = currentNode.description ?? null;

    const updated = await window.atoumweb.projects.projects.updateNode(nodeId, input);
    setDetail(updated);
    rememberProjectChange({ kind: 'update', nodeId, before, after: input, label: currentNode.name });
    await refresh();
  }

  async function updateNodeStatus(node: ProjectNode, status: ProjectNodeStatus): Promise<void> {
    if (status === node.status) return;
    try {
      const updated = await window.atoumweb.projects.projects.updateNode(node.id, { status });
      setDetail(updated);
      rememberProjectChange({ kind: 'update', nodeId: node.id, before: { status: node.status }, after: { status }, label: node.name });
      await refresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour la tâche.');
    }
  }

  async function setNodePause(node: ProjectNode, paused: boolean, reason?: string | null): Promise<void> {
    if (node.paused === paused && (node.pauseReason ?? null) === (reason ?? null)) return;
    try {
      const updated = await window.atoumweb.projects.projects.setNodePause(node.id, paused, reason);
      setDetail(updated);
      rememberProjectChange({
        kind: 'pause',
        nodeId: node.id,
        before: { paused: node.paused, reason: node.pauseReason ?? null },
        after: { paused, reason: reason ?? null },
        label: node.name,
      });
      await refresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier la pause.');
    }
  }

  async function moveProjectNode(node: ProjectNode, parentId: string | null, targetIndex: number): Promise<void> {
    if (!detail) return;
    const currentIndex = detail.nodes
      .filter((candidate) => (candidate.parentId ?? null) === (node.parentId ?? null))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .findIndex((candidate) => candidate.id === node.id);
    try {
      const updated = await window.atoumweb.projects.projects.moveNode(node.id, { parentId, targetIndex });
      setDetail(updated);
      rememberProjectChange({
        kind: 'move',
        nodeId: node.id,
        before: { parentId: node.parentId ?? null, targetIndex: Math.max(0, currentIndex) },
        after: { parentId, targetIndex },
        label: node.name,
      });
      await refresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de déplacer cet élément du projet.');
    }
  }

  async function addPrerequisite(): Promise<void> {
    if (!detail || !newPrerequisite.trim()) return;
    try {
      const updated = await window.atoumweb.projects.projects.addPrerequisite(detail.id, { label: newPrerequisite.trim(), required: true });
      setDetail(updated);
      setNewPrerequisite('');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter le prérequis.');
    }
  }

  async function updatePrerequisiteStatus(id: string, status: ProjectPrerequisiteStatus): Promise<void> {
    try {
      setDetail(await window.atoumweb.projects.projects.updatePrerequisiteStatus(id, status));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour le prérequis.');
    }
  }

  const detailUsesBlueprint = Boolean(detail?.nodes.some((node) => node.semanticKey));

  if (view === 'templates') {
    return <ProjectTemplatesView templates={templates} onBack={() => setView('projects')} onRefresh={refresh} onMessage={onMessage} />;
  }

  if (detail) {
    const selectedNode = detail.nodes.find((node) => node.id === selectedNodeId) ?? null;
    const nodePositions = buildProjectNodePositions(detail.nodes);
    const selectedPosition = selectedNode ? nodePositions.get(selectedNode.id) ?? null : null;
    return (
      <div className="project-production-page">
        <header className="project-production-header">
          <div className="project-production-title">
            <button className="secondary-button project-production-back" type="button" onClick={closeProjectDetail}>← Projets</button>
            <div>
              <span className="eyebrow">{detail.number} · Mode production</span>
              <h2>{detail.name}</h2>
              <p>{detail.clientLabel}</p>
            </div>
          </div>
          <div className="project-production-actions">
            <div className="project-history-buttons" aria-label="Historique des modifications">
              <button type="button" className="secondary-button" disabled={undoStack.length === 0} title={undoStack.length ? `Annuler : ${undoStack.at(-1)?.label}` : 'Rien à annuler'} onClick={() => void undoProjectChange()}>↶</button>
              <button type="button" className="secondary-button" disabled={redoStack.length === 0} title={redoStack.length ? `Rétablir : ${redoStack.at(-1)?.label}` : 'Rien à rétablir'} onClick={() => void redoProjectChange()}>↷</button>
            </div>
            <div className="project-production-status">
              <label>
              <span>Statut</span>
              <select value={detail.status} onChange={(event) => void changeProjectStatus(event.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>)}
              </select>
            </label>
              <div className="project-production-progress">
                <strong>{detail.progressPercent} %</strong>
                <i><b style={{ width: `${detail.progressPercent}%` }} /></i>
              </div>
            </div>
          </div>
        </header>

        {completionReview && <ProjectCompletionReviewPanel review={completionReview} busy={completionBusy} onConfirm={confirmProjectCompletion} onCancel={() => setCompletionReview(null)} />}

        <nav className="project-production-nav" aria-label="Sections du projet">
          <button className={detailTab === 'plan' ? 'active' : ''} type="button" onClick={() => setDetailTab('plan')}>Production</button>
          <button className={detailTab === 'prerequisites' ? 'active' : ''} type="button" onClick={() => setDetailTab('prerequisites')}>Prérequis</button>
          <button className={detailTab === 'resources' ? 'active' : ''} type="button" onClick={() => setDetailTab('resources')}>Ressources</button>
          <button className={detailTab === 'technical' ? 'active' : ''} type="button" onClick={() => setDetailTab('technical')}>Bibliothèque</button>
          <button className={detailTab === 'operations' ? 'active' : ''} type="button" onClick={() => setDetailTab('operations')}>Interventions</button>
          <button className={detailTab === 'time' ? 'active' : ''} type="button" onClick={() => setDetailTab('time')}>Temps</button>
          <button className={detailTab === 'commercial' ? 'active' : ''} type="button" onClick={() => setDetailTab('commercial')}>Commercial</button>
          <button className={detailTab === 'summary' ? 'active' : ''} type="button" onClick={() => setDetailTab('summary')}>Résumé</button>
        </nav>

        {detailTab === 'plan' && (
          <main className="project-production-workspace">
            <section className="project-production-tree-panel">
              <div className="project-production-tree-head">
                <div>
                  <span className="eyebrow">Plan de production</span>
                  <strong>{detail.nodes.filter((node) => !node.parentId).length} phase{detail.nodes.filter((node) => !node.parentId).length > 1 ? 's' : ''}</strong>
                </div>
                <details className="project-production-add">
                  <summary>+ Ajouter</summary>
                  <div className="project-node-add">
                    <div className="project-node-add-grid">
                      <input value={newNodeName} onChange={(event) => setNewNodeName(event.target.value)} placeholder="Nom de la tâche / module…" />
                      <select value={newNodeType} onChange={(event) => setNewNodeType(event.target.value as typeof newNodeType)}>
                        <option value="lot">Lot</option><option value="module">Module / Page</option><option value="task">Tâche</option><option value="checklist">Checklist</option>
                      </select>
                      <select value={newNodeParentId} onChange={(event) => setNewNodeParentId(event.target.value)}>
                        <option value="">Racine du projet</option>{detail.nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
                      </select>
                      <input type="number" min="0" value={newNodeMinutes} onChange={(event) => setNewNodeMinutes(event.target.value)} placeholder="Minutes estimées" />
                      <label className="project-checkbox"><input type="checkbox" checked={newNodeRequired} onChange={(event) => setNewNodeRequired(event.target.checked)} /> Obligatoire</label>
                      <button className="secondary-button" type="button" onClick={() => void addProjectNode()}>Ajouter au plan</button>
                    </div>
                  </div>
                </details>
              </div>
              {!detailUsesBlueprint && <div className="project-legacy-plan-note">
                <div><strong>Ce projet utilise un ancien plan</strong><span>Il conserve le modèle utilisé lors de sa création.</span></div>
              </div>}
              <div className="project-production-tree-scroll">
                <div className="project-tree">{renderProjectProductionTree(
                  detail.nodes,
                  updateNodeStatus,
                  moveProjectNode,
                  setSelectedNodeId,
                  selectedNodeId,
                  expandedPhaseIds,
                  togglePhase,
                  nodePositions,
                )}</div>
                {detail.nodes.length === 0 && <p className="muted">Le plan est vide. Ajoute un lot, un module ou une tâche.</p>}
              </div>
            </section>

            <ProjectNodeWorkbench
              projectId={detail.id}
              node={selectedNode}
              position={selectedPosition}
              onUpdate={updateProjectNodeWithHistory}
              onPause={setNodePause}
              onOpenResources={() => setDetailTab('resources')}
              onOpenTechnical={() => setDetailTab('technical')}
              onOpenTime={() => setDetailTab('time')}
              onMessage={onMessage}
            />
          </main>
        )}

        {detailTab !== 'plan' && <main className="project-production-secondary">
          {detailTab === 'summary' && <ProjectSummaryTab project={detail} />}
          {detailTab === 'prerequisites' && (
            <div className="project-tab-content">
              <div className="project-prerequisite-add"><input value={newPrerequisite} onChange={(event) => setNewPrerequisite(event.target.value)} placeholder="Ajouter un prérequis…" /><button className="secondary-button" type="button" onClick={() => void addPrerequisite()}>Ajouter</button></div>
              <div className="project-prerequisites">{detail.prerequisites.map((item) => <div key={item.id} className="project-prerequisite"><div><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</div><select value={item.status} onChange={(event) => void updatePrerequisiteStatus(item.id, event.target.value as ProjectPrerequisiteStatus)}>{PROJECT_PREREQUISITE_STATUSES.map((status) => <option key={status} value={status}>{PREREQUISITE_STATUS_LABELS[status]}</option>)}</select></div>)}</div>
              {detail.prerequisites.length === 0 && <p className="muted">Aucun prérequis enregistré.</p>}
            </div>
          )}
          {detailTab === 'resources' && <ProjectResourcesTab projectId={detail.id} nodes={detail.nodes} resourceRootPath={detail.resourceRootPath} onMessage={onMessage} />}
          {detailTab === 'technical' && <ProjectTechnicalLibraryTab projectId={detail.id} onMessage={onMessage} />}
          {detailTab === 'operations' && <ProjectOperationsTab projectId={detail.id} onMessage={onMessage} />}
          {detailTab === 'time' && <ProjectTimeTab projectId={detail.id} nodes={detail.nodes} onMessage={onMessage} />}
          {detailTab === 'commercial' && <ProjectCommercialTab project={detail} />}
        </main>}
      </div>
    );
  }

  return (
    <div className="projects-stack">
      <div className="module-toolbar projects-toolbar">
        <div><strong>{filtered.length}</strong><span> projet{filtered.length > 1 ? 's' : ''}</span></div>
        <div className="toolbar-controls project-toolbar-controls">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
          <button className="secondary-button" type="button" onClick={() => setView('templates')}>Modèles de projets</button>
          <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher projet, client, numéro…" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ProjectStatus)}>
            <option value="all">Tous les statuts</option>
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>)}
          </select>
          <button className="primary-button" type="button" onClick={openQuoteProjectCreate}>+ Depuis un devis</button>
          <button className="secondary-button" type="button" onClick={() => setCreateMode(createMode === 'internal' ? null : 'internal')}>+ Projet interne</button>
        </div>
      </div>

      {createMode && (
        <section className="panel project-create-panel">
          <div className="panel-title">
            <div><span className="eyebrow">Nouveau projet</span><h2>{createMode === 'quote' ? 'Transformer un devis accepté' : 'Projet interne AtoumWeb'}</h2></div>
            <button className="close-detail" type="button" onClick={resetCreate}>×</button>
          </div>
          <div className="project-create-grid">
            {createMode === 'quote' && (
              <label>Devis accepté<select value={quoteId} onChange={(event) => {
                const id = event.target.value;
                setQuoteId(id);
                const quote = acceptedQuotes.find((item) => item.id === id);
                if (quote && !projectName.trim()) setProjectName(quote.subject);
              }}><option value="">Choisir…</option>{acceptedQuotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.number} · {quote.ownerLabel} · {quote.subject}</option>)}</select></label>
            )}
            <label>Nom du projet<input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder={createMode === 'internal' ? 'Ex. AtoumWeb Manager' : 'Par défaut : objet du devis'} /></label>
            <label>Modèle<select value={templateVersionId} onChange={(event) => setTemplateVersionId(event.target.value)}><option value="">{createMode === 'internal' ? 'Aucun modèle' : 'Automatique depuis le devis (recommandé)'}</option>{publishedTemplates.map((template) => <option key={template.currentVersion!.id} value={template.currentVersion!.id}>{template.name} · v{template.currentVersion!.versionNumber}</option>)}</select></label>
            <label>Date cible<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
            {createMode === 'quote' && <label>Mode commercial<select value={commercialMode} onChange={(event) => setCommercialMode(event.target.value as ProjectCommercialMode)}>{PROJECT_COMMERCIAL_MODES.filter((mode) => mode !== 'internal').map((mode) => <option key={mode} value={mode}>{COMMERCIAL_MODE_LABELS[mode]}</option>)}</select></label>}
          </div>
          {createMode === 'quote' && acceptedQuotes.length === 0 && <p className="muted">Aucun devis accepté n’attend actuellement sa transformation en projet.</p>}
          {createMode === 'quote' && <div className="project-template-required project-blueprint-hint">
            <div>
              <strong>Génération depuis le devis</strong>
              <span>Si l’offre vendue possède un blueprint AtoumWeb, le plan de production est généré automatiquement. Tu peux encore forcer un modèle publié si nécessaire.</span>
            </div>
            <button className="secondary-button" type="button" onClick={() => { resetCreate(); setView('templates'); }}>Voir les modèles</button>
          </div>}
          <div className="button-row"><button className="primary-button" type="button" disabled={saving || (createMode === 'quote' && !quoteId)} onClick={() => void createProject()}>{saving ? 'Création…' : 'Créer le projet'}</button><button className="secondary-button" type="button" onClick={resetCreate}>Annuler</button></div>
        </section>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement des projets…</p></div> : (
        <div className="projects-layout">
          <section className="panel project-list-panel">
            <table className="project-table">
              <thead><tr><th>Numéro</th><th>Client</th><th>Projet</th><th>Statut</th><th>Progression</th><th>Temps estimé</th><th>Cible</th></tr></thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id} className={selectedId === project.id ? 'selected-row' : ''} onClick={() => void openProject(project.id)}>
                    <td><strong>{project.number}</strong></td><td>{project.clientLabel}</td><td><strong>{project.name}</strong><small>{project.projectType}</small></td><td><span className={`project-status status-${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span></td><td><div className="project-progress-cell"><span>{project.progressPercent} %</span><i><b style={{ width: `${project.progressPercent}%` }} /></i></div></td><td>{duration(project.estimatedMinutes)}</td><td>{dateLabel(project.targetDate)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7}><div className="empty-table">Aucun projet dans cette vue.</div></td></tr>}
              </tbody>
            </table>
          </section>

        </div>
      )}
    </div>
  );
}

function ProjectSummaryTab({ project }: { project: ProjectDetail }) {
  const missingPrerequisites = project.prerequisites.filter((item) => item.required && !['validated', 'not_applicable'].includes(item.status)).length;
  const openTasks = project.nodes.filter((node) => ['task', 'checklist'].includes(node.type) && node.required && node.status !== 'done').length;
  return (
    <div className="project-tab-content">
      <div className="project-kpis"><div><span>Progression</span><strong>{project.progressPercent} %</strong></div><div><span>Temps estimé</span><strong>{duration(project.estimatedMinutes)}</strong></div><div><span>Tâches restantes</span><strong>{openTasks}</strong></div><div><span>Prérequis à traiter</span><strong>{missingPrerequisites}</strong></div></div>
      <div className="project-summary-list"><div><span>Type</span><strong>{project.projectType}</strong></div><div><span>Mode commercial</span><strong>{COMMERCIAL_MODE_LABELS[project.commercialMode]}</strong></div><div><span>Date cible</span><strong>{dateLabel(project.targetDate)}</strong></div><div><span>Créé le</span><strong>{dateLabel(project.createdAt)}</strong></div>{project.sourceQuoteId && <div><span>Origine</span><strong>Devis accepté</strong></div>}</div>
      {project.notes && <div className="project-note"><span className="eyebrow">Notes</span><p>{project.notes}</p></div>}
    </div>
  );
}

function ProjectCommercialTab({ project }: { project: ProjectDetail }) {
  return (
    <div className="project-tab-content">
      <div className="project-commercial-values"><div><span>Valeur commerciale</span><strong>{money(project.commercialValueCents)}</strong></div><div><span>Montant contractuel</span><strong>{money(project.contractValueCents)}</strong></div><div><span>Écart / valeur offerte</span><strong>{money(Math.max(0, project.commercialValueCents - project.contractValueCents))}</strong></div></div>
      <strong className="project-section-title">Prestations figées depuis le devis</strong>
      <div className="project-services">{project.services.map((service) => <div key={service.id}><div><strong>{service.label}</strong><small>{service.catalogVersionId ? 'Version catalogue figée' : 'Ligne libre'}</small></div><span>{money(service.contractValueCents)}</span></div>)}</div>
      {project.services.length === 0 && <p className="muted">Aucune prestation commerciale rattachée.</p>}
    </div>
  );
}

function ProjectNodeWorkbench({ projectId, node, onUpdate, onPause, onOpenResources, onOpenTechnical, onOpenTime, onMessage }: {
  projectId: string;
  node: ProjectNode | null;
  onUpdate: (nodeId: string, input: Partial<ProjectNode>) => Promise<void>;
  onPause: (node: ProjectNode, paused: boolean, reason?: string | null) => Promise<void>;
  onOpenResources: () => void;
  onOpenTechnical: () => void;
  onOpenTime: () => void;
  onMessage: (message: string) => void;
}) {
  const [card, setCard] = useState<ProjectWorkCard | null>(node?.workCard ?? null);
  const [pauseReason, setPauseReason] = useState(node?.pauseReason ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(node?.estimatedMinutes?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [activeTime, setActiveTime] = useState<TimeSession | null>(null);
  const [timerBusy, setTimerBusy] = useState(false);
  const [timerTick, setTimerTick] = useState(Date.now());

  useEffect(() => {
    setCard(node?.workCard ? {
      ...node.workCard,
      fields: node.workCard.fields.map((field) => ({ ...field, options: field.options ? [...field.options] : undefined })),
    } : null);
    setPauseReason(node?.pauseReason ?? '');
    setEstimatedMinutes(node?.estimatedMinutes?.toString() ?? '');
  }, [node?.id, node?.updatedAt]);

  useEffect(() => {
    const refreshTimer = () => void window.atoumweb.time.active().then(setActiveTime).catch(() => setActiveTime(null));
    refreshTimer();
    window.addEventListener('atoumweb:time-changed', refreshTimer);
    const interval = window.setInterval(() => setTimerTick(Date.now()), 1000);
    return () => {
      window.removeEventListener('atoumweb:time-changed', refreshTimer);
      window.clearInterval(interval);
    };
  }, [projectId]);

  if (!node) {
    return <aside className="project-workbench empty">
      <div className="project-workbench-empty-mark" aria-hidden="true">AW</div>
      <span className="eyebrow">Atelier AtoumWeb</span>
      <h3>Sélectionne une fiche</h3>
      <p>Choisis une étape dans l’arbre pour retrouver son objectif, ses informations de travail, ses ressources et les conseils associés.</p>
    </aside>;
  }

  function updateField(key: string, value: string | boolean): void {
    setCard((current) => {
      if (!current) return current;
      return {
        ...current,
        fields: current.fields.map((field) => field.key === key ? { ...field, value } : field),
      };
    });
  }

  async function save(): Promise<void> {
    if (!node) return;
    setSaving(true);
    try {
      const minutes = estimatedMinutes.trim() ? Number(estimatedMinutes) : null;
      if (minutes != null && (!Number.isInteger(minutes) || minutes < 0)) throw new Error('Temps estimé invalide.');
      await onUpdate(node.id, { workCard: card, estimatedMinutes: minutes });
      onMessage(`Fiche « ${node.name} » enregistrée.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la fiche.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePause(): Promise<void> {
    if (!node) return;
    if (!node.paused && !pauseReason.trim()) {
      onMessage('Indique la raison de la pause pour garder un historique utile.');
      return;
    }
    await onPause(node, !node.paused, node.paused ? null : pauseReason.trim());
  }

  async function startNodeTimer(): Promise<void> {
    if (!node) return;
    setTimerBusy(true);
    try {
      const current = await window.atoumweb.time.active();
      if (current) {
        if (current.projectNodeId === node.id) {
          setActiveTime(current);
          onMessage('Le chrono est déjà actif sur cette fiche.');
          return;
        }
        window.dispatchEvent(new CustomEvent('atoumweb:timer-context', {
          detail: { projectId, nodeId: node.id, activityLabel: node.name, category: node.timeCategory || 'production', billable: true },
        }));
        onMessage('Un autre chrono est en cours : confirme le changement dans le timer.');
        return;
      }
      const session = await window.atoumweb.time.start({
        projectId,
        projectNodeId: node.id,
        category: (node.timeCategory || 'production') as TimeSession['category'],
        activityLabel: node.name,
        billable: true,
      });
      setActiveTime(session);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Chrono démarré sur « ${node.name} ».`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de démarrer le chrono.');
    } finally {
      setTimerBusy(false);
    }
  }

  async function pauseOrResumeNodeTimer(): Promise<void> {
    if (!node || !activeTime || activeTime.projectNodeId !== node.id) return;
    setTimerBusy(true);
    try {
      const next = activeTime.paused
        ? await window.atoumweb.time.resume(activeTime.id)
        : await window.atoumweb.time.pause(activeTime.id);
      setActiveTime(next);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le chrono.');
    } finally {
      setTimerBusy(false);
    }
  }

  async function stopNodeTimer(): Promise<void> {
    if (!node || !activeTime || activeTime.projectNodeId !== node.id) return;
    setTimerBusy(true);
    try {
      await window.atoumweb.time.stop(activeTime.id);
      setActiveTime(null);
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Chrono arrêté sur « ${node.name} ».`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter le chrono.');
    } finally {
      setTimerBusy(false);
    }
  }

  const activeOnNode = activeTime?.projectNodeId === node.id && !activeTime.endedAt;
  const displayedTimerSeconds = activeOnNode && activeTime
    ? activeTime.paused
      ? activeTime.durationSeconds
      : activeTime.durationSeconds + Math.max(0, Math.floor((timerTick - Date.parse(activeTime.updatedAt)) / 1000))
    : 0;

  const sourceLabel = node.sources.length > 0
    ? node.sources.some((source) => source.quoteLineId) ? 'Issu du devis' : 'Ajout manuel'
    : node.sourceTemplateNodeId ? 'Issu du modèle' : 'Ajout manuel';

  return <aside className="project-workbench">
    <header className="project-workbench-head">
      <div>
        <span className="eyebrow">Fiche de travail</span>
        <h3>{node.name}</h3>
        <div className="project-workbench-badges">
          <span>{node.type === 'module' && node.displaySubtype === 'page' ? 'Page' : node.type}</span>
          <span>{sourceLabel}</span>
          {node.paused && <span className="paused">⏸ En pause</span>}
        </div>
      </div>
      <div className="project-workbench-estimate">
        <label>Estimé
          <div><input type="number" min="0" step="5" value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} /><span>min</span></div>
        </label>
      </div>
    </header>

    {node.description && <p className="project-workbench-description">{node.description}</p>}

    {card?.goal && <section className="project-workbench-goal">
      <span className="eyebrow">Objectif</span>
      <p>{card.goal}</p>
    </section>}

    {card && card.fields.length > 0 && <section className="project-workbench-fields">
      <div className="project-workbench-section-title"><strong>Informations de travail</strong><span>{card.fields.length} champ{card.fields.length > 1 ? 's' : ''}</span></div>
      <div className="project-work-card-fields">
        {card.fields.map((field) => <label key={field.key} className={field.type === 'check' ? 'check-field' : ''}>
          {field.type === 'check'
            ? <><input type="checkbox" checked={field.value === true} onChange={(event) => updateField(field.key, event.target.checked)} /><span>{field.label}</span></>
            : <>
                <span>{field.label}</span>
                {field.type === 'textarea'
                  ? <textarea value={typeof field.value === 'string' ? field.value : ''} onChange={(event) => updateField(field.key, event.target.value)} />
                  : field.type === 'select'
                    ? <select value={typeof field.value === 'string' ? field.value : ''} onChange={(event) => updateField(field.key, event.target.value)}>
                        <option value="">À renseigner…</option>
                        {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    : <input type={field.type === 'url' ? 'url' : 'text'} value={typeof field.value === 'string' ? field.value : ''} onChange={(event) => updateField(field.key, event.target.value)} />
                }
              </>}
        </label>)}
      </div>
    </section>}

    <section className={`project-node-timer ${activeOnNode ? 'running' : ''}`}>
      <div>
        <span className="eyebrow">Chrono de la fiche</span>
        <strong>{activeOnNode ? formatTimer(displayedTimerSeconds) : '00:00:00'}</strong>
        <small>{activeOnNode ? (activeTime?.paused ? 'En pause' : 'Temps en cours') : 'Le temps sera rattaché directement à cette étape.'}</small>
      </div>
      <div className="project-node-timer-actions">
        {!activeOnNode
          ? <button className="primary-button" type="button" disabled={timerBusy} onClick={() => void startNodeTimer()}>▶ Démarrer</button>
          : <>
              <button className="secondary-button" type="button" disabled={timerBusy} onClick={() => void pauseOrResumeNodeTimer()}>{activeTime?.paused ? '▶ Reprendre' : 'Ⅱ Pause'}</button>
              <button className="secondary-button" type="button" disabled={timerBusy} onClick={() => void stopNodeTimer()}>■ Arrêter</button>
            </>}
      </div>
    </section>

    <section className="project-workbench-tools">
      <div className="project-workbench-section-title"><strong>Travailler sur cette fiche</strong></div>
      <div className="project-workbench-tool-grid">
        <button type="button" onClick={onOpenTime}><span aria-hidden="true">◷</span><strong>Temps</strong><small>Chrono & sessions</small></button>
        <button type="button" onClick={onOpenResources}><span aria-hidden="true">▧</span><strong>Ressources</strong><small>Textes, logos, visuels</small></button>
        <button type="button" onClick={onOpenTechnical}><span aria-hidden="true">&lt;/&gt;</span><strong>Technique</strong><small>Code & bibliothèque</small></button>
      </div>
    </section>

    <section className="project-workbench-pause">
      <div>
        <strong>{node.paused ? 'Module en pause' : 'Besoin de mettre cette étape en pause ?'}</strong>
        <span>{node.paused ? node.pauseReason || 'Aucune raison renseignée.' : 'Ex. attente des textes, validation client, accès manquant…'}</span>
      </div>
      {!node.paused && <input value={pauseReason} onChange={(event) => setPauseReason(event.target.value)} placeholder="Raison de la pause…" />}
      <button className="secondary-button" type="button" onClick={() => void togglePause()}>{node.paused ? 'Reprendre' : 'Mettre en pause'}</button>
    </section>

    {node.advice && node.advice.length > 0 && <section className="project-companion">
      <div className="project-companion-title">
        <div className="project-companion-mark" aria-hidden="true">AW</div>
        <div><span className="eyebrow">Compagnon AtoumWeb</span><strong>Conseils pour cette étape</strong></div>
      </div>
      <div className="project-companion-cards">
        {node.advice.map((advice, index) => <article className={`advice-${advice.kind}`} key={`${advice.title}-${index}`}>
          <span aria-hidden="true">{advice.kind === 'warning' ? '!' : advice.kind === 'library' ? '◇' : advice.kind === 'check' ? '✓' : '💡'}</span>
          <div><strong>{advice.title}</strong><p>{advice.body}</p></div>
        </article>)}
      </div>
    </section>}

    <footer className="project-workbench-footer">
      <div>
        <span>{node.sources.length} source{node.sources.length > 1 ? 's' : ''} liée{node.sources.length > 1 ? 's' : ''}</span>
        {node.semanticKey && <code>{node.semanticKey}</code>}
      </div>
      <button className="primary-button" type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Enregistrement…' : 'Enregistrer la fiche'}</button>
    </footer>
  </aside>;
}

function descendantIds(nodes: ProjectNode[], nodeId: string): Set<string> {
  const result = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const parent = queue.shift()!;
    for (const candidate of nodes) {
      if ((candidate.parentId ?? null) === parent && !result.has(candidate.id)) {
        result.add(candidate.id);
        queue.push(candidate.id);
      }
    }
  }
  return result;
}

function renderProjectTree(
  nodes: ProjectNode[],
  parentId: string | null,
  onStatus: (node: ProjectNode, status: ProjectNodeStatus) => Promise<void>,
  onMove: (node: ProjectNode, parentId: string | null, targetIndex: number) => Promise<void>,
  onSelect: (id: string) => void,
  selectedNodeId: string | null,
  depth = 0,
) {
  const siblings = nodes
    .filter((node) => (node.parentId ?? null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return siblings.map((node, index) => {
    const blockedParents = descendantIds(nodes, node.id);
    blockedParents.add(node.id);
    const parentOptions = nodes
      .filter((candidate) => ['lot', 'module'].includes(candidate.type) && !blockedParents.has(candidate.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr-FR'));

    return (
      <div key={node.id} className="project-tree-branch">
        <div
          className={`project-tree-node node-${node.type} ${selectedNodeId === node.id ? 'selected' : ''} ${node.paused ? 'paused' : ''}`}
          style={{ marginLeft: `${depth * 14}px` }}
          onClick={() => onSelect(node.id)}
        >
          <span className="project-node-kind">{node.type === 'lot' ? 'LOT' : node.type === 'module' ? (node.displaySubtype === 'page' ? 'PAGE' : 'MODULE') : node.type === 'checklist' ? 'CHECK' : 'TÂCHE'}</span>
          <div className="project-node-name"><strong>{node.name}</strong><small>{node.estimatedMinutes ? duration(node.estimatedMinutes) : 'Sans estimation'}{node.required ? ' · obligatoire' : ' · optionnel'}{node.paused ? ' · ⏸ en pause' : ''}</small></div>
          <div className="project-node-controls">
            <select className="project-node-status" value={node.status} onChange={(event) => void onStatus(node, event.target.value as ProjectNodeStatus)}>{PROJECT_NODE_STATUSES.map((status) => <option key={status} value={status}>{NODE_STATUS_LABELS[status]}</option>)}</select>
            <div className="project-node-arrange">
              <button type="button" disabled={index === 0} title="Monter" onClick={() => void onMove(node, parentId, index - 1)}>↑</button>
              <button type="button" disabled={index === siblings.length - 1} title="Descendre" onClick={() => void onMove(node, parentId, index + 1)}>↓</button>
              <select
                className="project-node-parent"
                value={node.parentId ?? ''}
                title="Déplacer dans un autre lot ou module"
                onChange={(event) => {
                  const nextParentId = event.target.value || null;
                  if (nextParentId === (node.parentId ?? null)) return;
                  const targetIndex = nodes.filter((candidate) => candidate.id !== node.id && (candidate.parentId ?? null) === nextParentId).length;
                  void onMove(node, nextParentId, targetIndex);
                }}
              >
                <option value="">Racine</option>
                {parentOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        {renderProjectTree(nodes, node.id, onStatus, onMove, onSelect, selectedNodeId, depth + 1)}
      </div>
    );
  });
}

function ProjectTemplatesView({ templates, onBack, onRefresh, onMessage }: { templates: ProjectTemplateSummary[]; onBack: () => void; onRefresh: () => Promise<void>; onMessage: (message: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const [detail, setDetail] = useState<ProjectTemplateDetail | null>(null);
  const [name, setName] = useState('Site vitrine');
  const [projectType, setProjectType] = useState('website');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'lot' | 'module' | 'task' | 'checklist'>('task');
  const [newNodeParent, setNewNodeParent] = useState('');
  const [newNodeMinutes, setNewNodeMinutes] = useState('');

  async function load(id: string): Promise<void> {
    try { setSelectedId(id); setDetail(await window.atoumweb.projects.templates.get(id)); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Modèle introuvable.'); }
  }

  useEffect(() => { if (selectedId) void load(selectedId); }, []);

  const workingVersion: ProjectTemplateVersion | null = detail?.versions.find((version) => version.status === 'draft') ?? detail?.versions.find((version) => version.status === 'published') ?? detail?.versions[0] ?? null;

  async function createTemplate(): Promise<void> {
    setCreateError(null);
    try {
      if (!name.trim()) {
        setCreateError('Donne un nom au modèle avant de le créer.');
        return;
      }
      const created = await window.atoumweb.projects.templates.create({ name: name.trim(), projectType, description: description.trim() || null });
      const defaultName = PROJECT_TYPES.find(([value]) => value === projectType)?.[1] ?? '';
      setName(defaultName);
      setDescription('');
      await onRefresh();
      await load(created.id);
      onMessage('Modèle créé en brouillon v1. Ajoute les éléments souhaités puis clique sur « Publier v1 et rendre disponible ».');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de créer le modèle.';
      setCreateError(message);
      onMessage(message);
    }
  }

  async function createVersion(): Promise<void> {
    if (!detail) return;
    try {
      await window.atoumweb.projects.templates.createVersion(detail.id, `Nouvelle version de ${detail.name}`);
      await onRefresh();
      await load(detail.id);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer une nouvelle version.'); }
  }

  async function addNode(): Promise<void> {
    if (!workingVersion || workingVersion.status !== 'draft' || !newNodeName.trim()) return;
    try {
      const minutes = newNodeMinutes.trim() ? Number(newNodeMinutes) : null;
      if (minutes != null && (!Number.isFinite(minutes) || minutes < 0)) throw new Error('Temps estimé invalide.');
      await window.atoumweb.projects.templates.addNode(workingVersion.id, { parentId: newNodeParent || null, type: newNodeType, name: newNodeName.trim(), estimatedMinutes: minutes, required: true });
      setNewNodeName(''); setNewNodeMinutes(''); setNewNodeParent('');
      await load(detail!.id);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter le nœud.'); }
  }

  async function publish(): Promise<void> {
    if (!workingVersion || workingVersion.status !== 'draft' || !detail) return;
    try {
      await window.atoumweb.projects.templates.publishVersion(workingVersion.id);
      await onRefresh();
      await load(detail.id);
      onMessage(`Modèle ${detail.name} publié.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de publier le modèle.'); }
  }

  async function removeNode(id: string): Promise<void> {
    if (!detail) return;
    try { await window.atoumweb.projects.templates.removeNode(id); await load(detail.id); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de supprimer ce nœud.'); }
  }

  return (
    <div className="project-templates-stack">
      <div className="module-toolbar"><div><button className="secondary-button" type="button" onClick={onBack}>← Retour aux projets</button></div><div><strong>{templates.length}</strong><span> modèle{templates.length > 1 ? 's' : ''}</span></div></div>
      <div className="project-templates-layout">
        <section className="panel project-template-list">
          <span className="eyebrow">Modèles de projets</span><h2>Structures réutilisables</h2>
          <div className="project-template-create">
            <p className="project-template-help">1. Crée le modèle · 2. Ajoute ses lots / tâches · 3. Publie la v1. Seuls les modèles publiés sont proposés lors de la transformation d’un devis en projet.</p>
            <label>Nom du modèle <span>obligatoire</span><input value={name} onChange={(event) => { setName(event.target.value); setCreateError(null); }} placeholder="Ex. Site vitrine standard" /></label>
            <label>Type de projet<select value={projectType} onChange={(event) => {
              const previousLabel = PROJECT_TYPES.find(([value]) => value === projectType)?.[1] ?? '';
              const nextType = event.target.value;
              const nextLabel = PROJECT_TYPES.find(([value]) => value === nextType)?.[1] ?? '';
              setProjectType(nextType);
              setName((current) => !current.trim() || current === previousLabel ? nextLabel : current);
            }}>{PROJECT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Description <span>facultative</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Structure standard pour un site vitrine 5 pages" /></label>
            {createError && <p className="form-error project-template-create-error">{createError}</p>}
            <button className="primary-button" type="button" disabled={!name.trim()} onClick={() => void createTemplate()}>Créer le modèle en brouillon</button>
          </div>
          <div className="project-template-items">{templates.map((template) => <button key={template.id} className={selectedId === template.id ? 'active' : ''} type="button" onClick={() => void load(template.id)}><div><strong>{template.name}</strong><small>{template.projectType}</small></div><span>{template.currentVersion ? `v${template.currentVersion.versionNumber} · ${template.currentVersion.status}` : 'Aucune version'}</span></button>)}</div>
        </section>

        <section className="panel project-template-editor">
          {!detail ? <div className="empty-table">Sélectionne ou crée un modèle.</div> : <>
            <div className="panel-title"><div><span className="eyebrow">{detail.projectType}</span><h2>{detail.name}</h2></div><div className="button-row">{workingVersion?.status === 'published' && <button className="secondary-button" type="button" onClick={() => void createVersion()}>Créer v{workingVersion.versionNumber + 1}</button>}{workingVersion?.status === 'draft' && <button className="primary-button" type="button" onClick={() => void publish()}>Publier v{workingVersion.versionNumber} et rendre disponible</button>}</div></div>
            {workingVersion && <div className="template-version-banner"><span>Version de travail</span><strong>v{workingVersion.versionNumber}</strong><span className={`status-pill ${workingVersion.status}`}>{workingVersion.status === 'draft' ? 'Brouillon modifiable' : 'Publiée · figée'}</span></div>}
            {workingVersion?.status === 'draft' && <div className="template-node-add"><input value={newNodeName} onChange={(event) => setNewNodeName(event.target.value)} placeholder="Lot, page, tâche…" /><select value={newNodeType} onChange={(event) => setNewNodeType(event.target.value as typeof newNodeType)}><option value="lot">Lot</option><option value="module">Module / Page</option><option value="task">Tâche</option><option value="checklist">Checklist</option></select><select value={newNodeParent} onChange={(event) => setNewNodeParent(event.target.value)}><option value="">Racine</option>{workingVersion.nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select><input type="number" min="0" value={newNodeMinutes} onChange={(event) => setNewNodeMinutes(event.target.value)} placeholder="Minutes" /><button className="secondary-button" type="button" onClick={() => void addNode()}>Ajouter</button></div>}
            {workingVersion && <div className="template-tree">{renderTemplateTree(workingVersion, null, workingVersion.status === 'draft' ? removeNode : undefined)}</div>}
            {workingVersion && workingVersion.nodes.length === 0 && <p className="muted">Cette version ne contient encore aucun lot ou tâche.</p>}
            <div className="template-history"><strong>Historique des versions</strong>{detail.versions.map((version) => <div key={version.id}><span>v{version.versionNumber}</span><span>{version.status}</span><span>{version.nodes.length} élément{version.nodes.length > 1 ? 's' : ''}</span><span>{dateLabel(version.publishedAt || version.createdAt)}</span></div>)}</div>
          </>}
        </section>
      </div>
    </div>
  );
}

function renderTemplateTree(version: ProjectTemplateVersion, parentId: string | null, onRemove?: (id: string) => Promise<void>, depth = 0) {
  return version.nodes.filter((node) => (node.parentId ?? null) === parentId).sort((a, b) => a.sortOrder - b.sortOrder).map((node) => (
    <div key={node.id} className="template-tree-branch"><div className={`template-tree-node node-${node.type}`} style={{ marginLeft: `${depth * 15}px` }}><span className="project-node-kind">{node.type.toUpperCase()}</span><div><strong>{node.name}</strong><small>{node.estimatedMinutes ? duration(node.estimatedMinutes) : 'Sans estimation'}</small></div>{onRemove && <button className="icon-button danger-outline" type="button" onClick={() => void onRemove(node.id)}>×</button>}</div>{renderTemplateTree(version, node.id, onRemove, depth + 1)}</div>
  ));
}

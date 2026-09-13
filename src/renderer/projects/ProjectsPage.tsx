import { useEffect, useMemo, useState } from 'react';
import type { QuoteSummary } from '../../shared/commercial';
import {
  PROJECT_COMMERCIAL_MODES,
  PROJECT_NODE_STATUSES,
  PROJECT_PREREQUISITE_STATUSES,
  PROJECT_STATUSES,
  type ProjectCommercialMode,
  type ProjectDetail,
  type ProjectNode,
  type ProjectNodeStatus,
  type ProjectPrerequisiteStatus,
  type ProjectStatus,
  type ProjectSummary,
  type ProjectTemplateDetail,
  type ProjectTemplateSummary,
  type ProjectTemplateVersion,
} from '../../shared/projects';
import { ProjectResourcesTab } from './ProjectResourcesTab';
import { ProjectTechnicalLibraryTab } from './ProjectTechnicalLibraryTab';
import { ProjectTimeTab } from './ProjectTimeTab';

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

export function ProjectsPage({ onMessage, initialProjectId }: { onMessage: (message: string) => void; initialProjectId?: string | null }) {
  const [view, setView] = useState<'projects' | 'templates'>('projects');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplateSummary[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<QuoteSummary[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState<'quote' | 'internal' | null>(null);
  const [quoteId, setQuoteId] = useState('');
  const [templateVersionId, setTemplateVersionId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [commercialMode, setCommercialMode] = useState<ProjectCommercialMode>('normal');
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<'summary' | 'plan' | 'prerequisites' | 'resources' | 'technical' | 'time' | 'commercial'>('summary');

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
      setDetail(await window.atoumweb.projects.projects.get(id));
      setDetailTab('summary');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Projet introuvable.');
    }
  }

  function resetCreate(): void {
    setCreateMode(null);
    setQuoteId('');
    setTemplateVersionId('');
    setProjectName('');
    setTargetDate('');
    setCommercialMode('normal');
  }

  async function createProject(): Promise<void> {
    if (!createMode) return;
    setSaving(true);
    try {
      let created: ProjectDetail;
      if (createMode === 'quote') {
        if (!quoteId) throw new Error('Choisis un devis accepté.');
        if (!templateVersionId) throw new Error('Choisis un modèle de projet publié.');
        created = await window.atoumweb.projects.projects.transformQuote({
          quoteId,
          templateVersionId,
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
    try {
      const updated = await window.atoumweb.projects.projects.changeStatus(detail.id, status);
      setDetail(updated);
      await refresh();
      onMessage(`Statut du projet : ${PROJECT_STATUS_LABELS[status]}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de changer le statut.');
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

  async function updateNodeStatus(node: ProjectNode, status: ProjectNodeStatus): Promise<void> {
    try {
      const updated = await window.atoumweb.projects.projects.updateNode(node.id, { status });
      setDetail(updated);
      await refresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour la tâche.');
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

  if (view === 'templates') {
    return <ProjectTemplatesView templates={templates} onBack={() => setView('projects')} onRefresh={refresh} onMessage={onMessage} />;
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
          <button className="primary-button" type="button" onClick={() => setCreateMode(createMode === 'quote' ? null : 'quote')}>+ Depuis un devis</button>
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
            <label>Modèle<select value={templateVersionId} onChange={(event) => setTemplateVersionId(event.target.value)}><option value="">{createMode === 'internal' ? 'Aucun modèle' : 'Choisir un modèle publié…'}</option>{publishedTemplates.map((template) => <option key={template.currentVersion!.id} value={template.currentVersion!.id}>{template.name} · v{template.currentVersion!.versionNumber}</option>)}</select></label>
            <label>Date cible<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
            {createMode === 'quote' && <label>Mode commercial<select value={commercialMode} onChange={(event) => setCommercialMode(event.target.value as ProjectCommercialMode)}>{PROJECT_COMMERCIAL_MODES.filter((mode) => mode !== 'internal').map((mode) => <option key={mode} value={mode}>{COMMERCIAL_MODE_LABELS[mode]}</option>)}</select></label>}
          </div>
          {createMode === 'quote' && acceptedQuotes.length === 0 && <p className="muted">Aucun devis accepté n’attend actuellement sa transformation en projet.</p>}
          {createMode === 'quote' && publishedTemplates.length === 0 && <p className="form-error">Aucun modèle publié. Ouvre « Modèles de projets » pour en préparer un avant la transformation.</p>}
          <div className="button-row"><button className="primary-button" type="button" disabled={saving || (createMode === 'quote' && (!quoteId || !templateVersionId))} onClick={() => void createProject()}>{saving ? 'Création…' : 'Créer le projet'}</button><button className="secondary-button" type="button" onClick={resetCreate}>Annuler</button></div>
        </section>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement des projets…</p></div> : (
        <div className={detail ? 'projects-layout with-detail' : 'projects-layout'}>
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

          {detail && (
            <aside className="panel project-detail-panel">
              <div className="detail-panel-heading"><div><span className="eyebrow">{detail.number}</span><h2>{detail.name}</h2><p className="muted">{detail.clientLabel}</p></div><button className="close-detail" type="button" onClick={() => { setDetail(null); setSelectedId(null); }}>×</button></div>
              <div className="project-detail-status"><select value={detail.status} onChange={(event) => void changeProjectStatus(event.target.value as ProjectStatus)}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>)}</select><span>{detail.progressPercent} %</span></div>
              <div className="project-main-progress"><i><b style={{ width: `${detail.progressPercent}%` }} /></i></div>

              <div className="project-tabs">
                <button className={detailTab === 'summary' ? 'active' : ''} type="button" onClick={() => setDetailTab('summary')}>Résumé</button>
                <button className={detailTab === 'plan' ? 'active' : ''} type="button" onClick={() => setDetailTab('plan')}>Plan / Tâches</button>
                <button className={detailTab === 'prerequisites' ? 'active' : ''} type="button" onClick={() => setDetailTab('prerequisites')}>Prérequis</button>
                <button className={detailTab === 'resources' ? 'active' : ''} type="button" onClick={() => setDetailTab('resources')}>Ressources</button>
                <button className={detailTab === 'technical' ? 'active' : ''} type="button" onClick={() => setDetailTab('technical')}>Bibliothèque</button>
                <button className={detailTab === 'time' ? 'active' : ''} type="button" onClick={() => setDetailTab('time')}>Temps</button>
                <button className={detailTab === 'commercial' ? 'active' : ''} type="button" onClick={() => setDetailTab('commercial')}>Commercial</button>
              </div>

              {detailTab === 'summary' && <ProjectSummaryTab project={detail} />}
              {detailTab === 'plan' && (
                <div className="project-tab-content">
                  <div className="project-node-add"><strong>Ajouter au plan</strong><div className="project-node-add-grid"><input value={newNodeName} onChange={(event) => setNewNodeName(event.target.value)} placeholder="Nom de la tâche / module…" /><select value={newNodeType} onChange={(event) => setNewNodeType(event.target.value as typeof newNodeType)}><option value="lot">Lot</option><option value="module">Module / Page</option><option value="task">Tâche</option><option value="checklist">Checklist</option></select><select value={newNodeParentId} onChange={(event) => setNewNodeParentId(event.target.value)}><option value="">Racine du projet</option>{detail.nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select><input type="number" min="0" value={newNodeMinutes} onChange={(event) => setNewNodeMinutes(event.target.value)} placeholder="Minutes estimées" /><label className="project-checkbox"><input type="checkbox" checked={newNodeRequired} onChange={(event) => setNewNodeRequired(event.target.checked)} /> Obligatoire</label><button className="secondary-button" type="button" onClick={() => void addProjectNode()}>Ajouter</button></div></div>
                  <div className="project-tree">{renderProjectTree(detail.nodes, null, updateNodeStatus)}</div>
                  {detail.nodes.length === 0 && <p className="muted">Le plan est vide. Ajoute un lot, un module ou une tâche.</p>}
                </div>
              )}
              {detailTab === 'prerequisites' && (
                <div className="project-tab-content">
                  <div className="project-prerequisite-add"><input value={newPrerequisite} onChange={(event) => setNewPrerequisite(event.target.value)} placeholder="Ajouter un prérequis…" /><button className="secondary-button" type="button" onClick={() => void addPrerequisite()}>Ajouter</button></div>
                  <div className="project-prerequisites">{detail.prerequisites.map((item) => <div key={item.id} className="project-prerequisite"><div><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</div><select value={item.status} onChange={(event) => void updatePrerequisiteStatus(item.id, event.target.value as ProjectPrerequisiteStatus)}>{PROJECT_PREREQUISITE_STATUSES.map((status) => <option key={status} value={status}>{PREREQUISITE_STATUS_LABELS[status]}</option>)}</select></div>)}</div>
                  {detail.prerequisites.length === 0 && <p className="muted">Aucun prérequis enregistré.</p>}
                </div>
              )}
              {detailTab === 'resources' && <ProjectResourcesTab projectId={detail.id} nodes={detail.nodes} resourceRootPath={detail.resourceRootPath} onMessage={onMessage} />}
              {detailTab === 'technical' && <ProjectTechnicalLibraryTab projectId={detail.id} onMessage={onMessage} />}
              {detailTab === 'time' && <ProjectTimeTab projectId={detail.id} nodes={detail.nodes} onMessage={onMessage} />}
              {detailTab === 'commercial' && <ProjectCommercialTab project={detail} />}
            </aside>
          )}
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

function renderProjectTree(nodes: ProjectNode[], parentId: string | null, onStatus: (node: ProjectNode, status: ProjectNodeStatus) => Promise<void>, depth = 0) {
  return nodes
    .filter((node) => (node.parentId ?? null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((node) => (
      <div key={node.id} className="project-tree-branch">
        <div className={`project-tree-node node-${node.type}`} style={{ marginLeft: `${depth * 14}px` }}>
          <span className="project-node-kind">{node.type === 'lot' ? 'LOT' : node.type === 'module' ? (node.displaySubtype === 'page' ? 'PAGE' : 'MODULE') : node.type === 'checklist' ? 'CHECK' : 'TÂCHE'}</span>
          <div className="project-node-name"><strong>{node.name}</strong><small>{node.estimatedMinutes ? duration(node.estimatedMinutes) : 'Sans estimation'}{node.required ? ' · obligatoire' : ' · optionnel'}</small></div>
          <select value={node.status} onChange={(event) => void onStatus(node, event.target.value as ProjectNodeStatus)}>{PROJECT_NODE_STATUSES.map((status) => <option key={status} value={status}>{NODE_STATUS_LABELS[status]}</option>)}</select>
        </div>
        {renderProjectTree(nodes, node.id, onStatus, depth + 1)}
      </div>
    ));
}

function ProjectTemplatesView({ templates, onBack, onRefresh, onMessage }: { templates: ProjectTemplateSummary[]; onBack: () => void; onRefresh: () => Promise<void>; onMessage: (message: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const [detail, setDetail] = useState<ProjectTemplateDetail | null>(null);
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('website');
  const [description, setDescription] = useState('');
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
    try {
      if (!name.trim()) throw new Error('Nom du modèle requis.');
      const created = await window.atoumweb.projects.templates.create({ name: name.trim(), projectType, description: description.trim() || null });
      setName(''); setDescription('');
      await onRefresh();
      await load(created.id);
      onMessage('Modèle de projet créé. Ajoute maintenant ses lots, modules et tâches.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer le modèle.'); }
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
          <div className="project-template-create"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom du modèle" /><select value={projectType} onChange={(event) => setProjectType(event.target.value)}>{PROJECT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description facultative" /><button className="primary-button" type="button" onClick={() => void createTemplate()}>Créer le modèle</button></div>
          <div className="project-template-items">{templates.map((template) => <button key={template.id} className={selectedId === template.id ? 'active' : ''} type="button" onClick={() => void load(template.id)}><div><strong>{template.name}</strong><small>{template.projectType}</small></div><span>{template.currentVersion ? `v${template.currentVersion.versionNumber} · ${template.currentVersion.status}` : 'Aucune version'}</span></button>)}</div>
        </section>

        <section className="panel project-template-editor">
          {!detail ? <div className="empty-table">Sélectionne ou crée un modèle.</div> : <>
            <div className="panel-title"><div><span className="eyebrow">{detail.projectType}</span><h2>{detail.name}</h2></div><div className="button-row">{workingVersion?.status === 'published' && <button className="secondary-button" type="button" onClick={() => void createVersion()}>Créer v{workingVersion.versionNumber + 1}</button>}{workingVersion?.status === 'draft' && <button className="primary-button" type="button" onClick={() => void publish()}>Publier v{workingVersion.versionNumber}</button>}</div></div>
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
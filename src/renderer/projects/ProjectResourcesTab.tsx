import { useEffect, useMemo, useState } from 'react';
import {
  PROJECT_RESOURCE_FOLDERS,
  PROJECT_RESOURCE_ROLES,
  PROJECT_RESOURCE_STATUSES,
  type ProjectNode,
  type ProjectResource,
  type ProjectResourceFolder,
  type ProjectResourceRole,
  type ProjectResourceStatus,
} from '../../shared/projects';

const FOLDER_LABELS: Record<ProjectResourceFolder, string> = {
  identity: '01 Identité',
  texts: '02 Textes',
  media: '03 Images & médias',
  documents: '04 Documents projet',
  technical: '05 Technique / Sources / Exports',
  deliverables: '06 Livrables',
  archives: '07 Archives',
};

const STATUS_LABELS: Record<ProjectResourceStatus, string> = {
  received: 'Reçu',
  to_process: 'À traiter',
  in_progress: 'En cours',
  validated: 'Validé',
  obsolete: 'Obsolète',
};

const ROLE_LABELS: Record<ProjectResourceRole, string> = {
  client_provided: 'Fourni par le client',
  atoumweb_rewrite: 'Réécriture AtoumWeb',
  final_validated: 'Version finale validée',
  other: 'Autre',
};

function sizeLabel(bytes?: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

export function ProjectResourcesTab({ projectId, nodes, resourceRootPath, onMessage }: {
  projectId: string;
  nodes: ProjectNode[];
  resourceRootPath?: string | null;
  onMessage: (message: string) => void;
}) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<ProjectResourceFolder>('documents');
  const [role, setRole] = useState<ProjectResourceRole>('other');
  const [filter, setFilter] = useState<'all' | ProjectResourceFolder>('all');

  async function refresh(): Promise<void> {
    setLoading(true);
    try { setResources(await window.atoumweb.projects.resources.list(projectId)); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de charger les ressources.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, [projectId]);

  const visible = useMemo(
    () => resources.filter((resource) => filter === 'all' || resource.folder === filter),
    [resources, filter],
  );

  async function importFiles(): Promise<void> {
    try {
      setResources(await window.atoumweb.projects.resources.importFiles(projectId, folder, role));
      onMessage('Ressources du projet mises à jour.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Import impossible.'); }
  }

  async function updateStatus(resource: ProjectResource, status: ProjectResourceStatus): Promise<void> {
    try {
      const updated = await window.atoumweb.projects.resources.updateStatus(resource.id, status);
      setResources((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Mise à jour impossible.'); }
  }

  async function updateRole(resource: ProjectResource, nextRole: ProjectResourceRole): Promise<void> {
    try {
      const updated = await window.atoumweb.projects.resources.updateRole(resource.id, nextRole);
      setResources((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Mise à jour impossible.'); }
  }

  async function toggleNode(resource: ProjectResource, nodeId: string): Promise<void> {
    if (!nodeId) return;
    try {
      const linked = resource.linkedNodeIds.includes(nodeId);
      const updated = linked
        ? await window.atoumweb.projects.resources.unlinkFromNode(resource.id, nodeId)
        : await window.atoumweb.projects.resources.linkToNode(resource.id, nodeId);
      setResources((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Liaison impossible.'); }
  }

  async function openFile(resource: ProjectResource): Promise<void> {
    const result = await window.atoumweb.projects.resources.openFile(resource.id);
    if (!result.ok) onMessage(result.error || 'Impossible d’ouvrir le fichier.');
  }

  async function openFolder(): Promise<void> {
    const result = await window.atoumweb.projects.resources.openFolder(projectId);
    if (!result.ok) onMessage(result.error || 'Impossible d’ouvrir le dossier Ressources.');
  }

  async function relocalize(resource: ProjectResource): Promise<void> {
    try {
      const updated = await window.atoumweb.projects.resources.relocalize(resource.id);
      if (!updated) return;
      setResources((items) => items.map((item) => item.id === updated.id ? updated : item));
      onMessage('Fichier relocalisé.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Relocalisation impossible.'); }
  }

  return (
    <div className="project-tab-content project-resources-tab">
      <div className="project-resource-heading">
        <div><span className="eyebrow">Dossier réel</span><strong>Ressources projet</strong><p className="project-path">{resourceRootPath || 'Chemin non disponible'}</p></div>
        <button className="secondary-button" type="button" onClick={() => void openFolder()}>Ouvrir le dossier</button>
      </div>

      <div className="project-resource-import">
        <select value={folder} onChange={(event) => setFolder(event.target.value as ProjectResourceFolder)}>
          {PROJECT_RESOURCE_FOLDERS.map((value) => <option key={value} value={value}>{FOLDER_LABELS[value]}</option>)}
        </select>
        <select value={role} onChange={(event) => setRole(event.target.value as ProjectResourceRole)}>
          {PROJECT_RESOURCE_ROLES.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}
        </select>
        <button className="primary-button" type="button" onClick={() => void importFiles()}>+ Ajouter des fichiers</button>
      </div>

      <div className="project-resource-filters">
        <button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>Tous ({resources.length})</button>
        {PROJECT_RESOURCE_FOLDERS.map((value) => {
          const count = resources.filter((resource) => resource.folder === value).length;
          return <button key={value} className={filter === value ? 'active' : ''} type="button" onClick={() => setFilter(value)}>{FOLDER_LABELS[value].replace(/^\d+\s/, '')} ({count})</button>;
        })}
      </div>

      {loading ? <p className="muted">Chargement des ressources…</p> : (
        <div className="project-resource-list">
          {visible.map((resource) => (
            <article key={resource.id} className={`project-resource-card ${resource.missing ? 'missing' : ''}`}>
              <div className="project-resource-main">
                <div className="project-resource-file"><span className="project-resource-extension">{resource.fileName.includes('.') ? resource.fileName.split('.').pop()?.toUpperCase() : 'FILE'}</span><div><strong>{resource.fileName}</strong><small>{FOLDER_LABELS[resource.folder]} · {sizeLabel(resource.sizeBytes)}</small><small>{resource.relativePath}</small></div></div>
                {resource.missing && <span className="resource-warning">Fichier introuvable</span>}
              </div>
              <div className="project-resource-controls">
                <select value={resource.status} onChange={(event) => void updateStatus(resource, event.target.value as ProjectResourceStatus)}>{PROJECT_RESOURCE_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>
                <select value={resource.contentRole} onChange={(event) => void updateRole(resource, event.target.value as ProjectResourceRole)}>{PROJECT_RESOURCE_ROLES.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}</select>
                <select value="" onChange={(event) => { void toggleNode(resource, event.target.value); event.currentTarget.value = ''; }}><option value="">Lier / délier une tâche…</option>{nodes.map((node) => <option key={node.id} value={node.id}>{resource.linkedNodeIds.includes(node.id) ? '✓ ' : ''}{node.name}</option>)}</select>
              </div>
              <div className="project-resource-links">{resource.linkedNodeIds.map((nodeId) => <span key={nodeId}>{nodes.find((node) => node.id === nodeId)?.name || 'Tâche'}</span>)}</div>
              <div className="button-row"><button className="secondary-button" type="button" disabled={resource.missing} onClick={() => void openFile(resource)}>Ouvrir</button>{resource.missing && <button className="secondary-button" type="button" onClick={() => void relocalize(resource)}>Relocaliser</button>}</div>
            </article>
          ))}
          {visible.length === 0 && <div className="empty-table">Aucune ressource dans cette catégorie.</div>}
        </div>
      )}
    </div>
  );
}

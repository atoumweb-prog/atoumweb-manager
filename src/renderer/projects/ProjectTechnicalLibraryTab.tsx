import { useEffect, useMemo, useState } from 'react';
import { ProjectReusePreparationPanel } from './ProjectReusePreparationPanel';
import { requestUnsavedExit } from '../unsaved/unsaved';
import {
  PROJECT_TECHNICAL_CATEGORIES,
  PROJECT_TECHNICAL_CONTENT_TYPES,
  type ProjectResource,
  type ProjectTechnicalCategory,
  type ProjectTechnicalContentType,
  type ProjectTechnicalItemDetail,
  type ProjectTechnicalItemSummary,
  type ProjectTechnicalVersion,
} from '../../shared/projects';

const CATEGORY_LABELS: Record<ProjectTechnicalCategory, string> = {
  header: 'Header',
  footer: 'Footer',
  hero: 'Hero',
  page: 'Page',
  section: 'Section',
  css: 'CSS',
  javascript: 'JavaScript',
  php: 'PHP / Snippet',
  acf: 'ACF',
  divi: 'Divi',
  woocommerce: 'WooCommerce',
  plugin: 'Extension / Plugin',
  config: 'Configuration',
  note: 'Note technique',
  other: 'Autre',
};

const CONTENT_LABELS: Record<ProjectTechnicalContentType, string> = {
  code: 'Code',
  json: 'JSON / Export',
  text: 'Texte / Documentation',
  reference: 'Référence fichier',
};

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}

export function ProjectTechnicalLibraryTab({ projectId, onMessage }: {
  projectId: string;
  onMessage: (message: string) => void;
}) {
  const [items, setItems] = useState<ProjectTechnicalItemSummary[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectTechnicalItemDetail | null>(null);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newVersion, setNewVersion] = useState(false);
  const [reuseBusy, setReuseBusy] = useState(false);
  const [reuseOpen, setReuseOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectTechnicalCategory>('note');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [contentType, setContentType] = useState<ProjectTechnicalContentType>('text');
  const [language, setLanguage] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [resourceId, setResourceId] = useState('');

  async function refresh(selectId?: string | null): Promise<void> {
    try {
      const [nextItems, nextResources] = await Promise.all([
        window.atoumweb.projects.technicalLibrary.list(projectId, query || null),
        window.atoumweb.projects.resources.list(projectId),
      ]);
      setItems(nextItems);
      setResources(nextResources);
      const targetId = selectId ?? selectedId;
      if (targetId && nextItems.some((item) => item.id === targetId)) {
        setSelectedId(targetId);
        setDetail(await window.atoumweb.projects.technicalLibrary.get(targetId));
      } else if (nextItems.length > 0) {
        setSelectedId(nextItems[0].id);
        setDetail(await window.atoumweb.projects.technicalLibrary.get(nextItems[0].id));
      } else {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger la bibliothèque technique.');
    }
  }

  useEffect(() => { void refresh(); }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  function openItem(id: string): void {
    requestUnsavedExit(() => { void openItemAllowed(id); }, 'project-reuse');
  }

  async function openItemAllowed(id: string): Promise<void> {
    setReuseOpen(false);
    try {
      setSelectedId(id);
      setDetail(await window.atoumweb.projects.technicalLibrary.get(id));
      setNewVersion(false);
      setReuseOpen(false);
      setResourceId('');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Élément technique introuvable.');
    }
  }

  function resetEditor(): void {
    setName('');
    setCategory('note');
    setDescription('');
    setTags('');
    setContentType('text');
    setLanguage('');
    setContent('');
    setNotes('');
  }

  async function createItem(): Promise<void> {
    try {
      const created = await window.atoumweb.projects.technicalLibrary.create(
        projectId,
        {
          name: name.trim(),
          category,
          description: description.trim() || null,
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        },
        {
          contentType,
          language: language.trim() || null,
          contentText: contentType === 'reference' ? null : content,
          notes: notes.trim() || null,
        },
      );
      resetEditor();
      setCreating(false);
      await refresh(created.id);
      onMessage(`Élément technique « ${created.name} » créé.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer l’élément technique.');
    }
  }

  function startNewVersion(): void {
    if (!detail?.currentVersion) return;
    requestUnsavedExit(() => {
      setContentType(detail.currentVersion.contentType);
    setLanguage(detail.currentVersion.language ?? '');
    setContent(detail.currentVersion.contentText ?? '');
    setNotes('');
      setNewVersion(true);
      setReuseOpen(false);
    }, 'project-reuse');
  }

  async function createNextVersion(): Promise<void> {
    if (!detail) return;
    try {
      const updated = await window.atoumweb.projects.technicalLibrary.createVersion(detail.id, {
        contentType,
        language: language.trim() || null,
        contentText: contentType === 'reference' ? null : content,
        notes: notes.trim() || null,
      });
      setDetail(updated);
      setNewVersion(false);
      setNotes('');
      await refresh(updated.id);
      onMessage(`Nouvelle version créée pour « ${updated.name} ».`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer la version.');
    }
  }

  async function markStable(version: ProjectTechnicalVersion): Promise<void> {
    try {
      const updated = await window.atoumweb.projects.technicalLibrary.markStable(version.id);
      setDetail(updated);
      await refresh(updated.id);
      onMessage(`Version ${version.versionNumber} marquée stable.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de marquer cette version stable.');
    }
  }

  async function toggleResource(version: ProjectTechnicalVersion, id: string): Promise<void> {
    if (!id || !detail) return;
    try {
      const updated = version.linkedResourceIds.includes(id)
        ? await window.atoumweb.projects.technicalLibrary.unlinkResource(version.id, id)
        : await window.atoumweb.projects.technicalLibrary.linkResource(version.id, id);
      setDetail(updated);
      setResourceId('');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de lier la ressource.');
    }
  }

  async function prepareForReuse(): Promise<void> {
    if (!detail) return;
    setReuseBusy(true);
    try {
      const result = await window.atoumweb.projects.technicalLibrary.prepareForReuse(detail.id);
      await refresh(detail.id);
      onMessage(`Paquet de réutilisation préparé depuis la v${result.versionNumber} : ${result.path}`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de préparer cet élément pour réutilisation.');
    } finally {
      setReuseBusy(false);
    }
  }

  function archive(): void {
    if (!detail) return;
    requestUnsavedExit(() => { void archiveAllowed(); }, 'project-reuse');
  }

  async function archiveAllowed(): Promise<void> {
    try {
      await window.atoumweb.projects.technicalLibrary.archive(detail.id);
      setSelectedId(null);
      setDetail(null);
      await refresh(null);
      onMessage('Élément technique archivé.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Archivage impossible.');
    }
  }

  function toggleReuse(): void {
    if (reuseOpen) {
      requestUnsavedExit(() => setReuseOpen(false), 'project-reuse');
    } else {
      setReuseOpen(true);
      setNewVersion(false);
    }
  }

  function searchItems(next: string): void {
    // Searching can replace the selected item when a result disappears.
    // Closing the preparation first keeps the user's consent explicit.
    if (reuseOpen) {
      requestUnsavedExit(() => {
        setReuseOpen(false);
        setQuery(next);
      }, 'project-reuse');
    } else {
      setQuery(next);
    }
  }

  const resourceById = useMemo(() => new Map(resources.map((resource) => [resource.id, resource])), [resources]);

  return (
    <div className="project-tab-content technical-library-tab">
      <div className="technical-library-toolbar">
        <input value={query} onChange={(event) => searchItems(event.target.value)} placeholder="Rechercher Header, CSS, snippet, ACF…" />
        <button className="primary-button" type="button" onClick={() => setCreating((value) => !value)}>+ Élément technique</button>
      </div>

      {creating && (
        <div className="technical-editor technical-create-editor">
          <div className="technical-editor-grid">
            <label>Nom<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Header principal" /></label>
            <label>Catégorie<select value={category} onChange={(event) => setCategory(event.target.value as ProjectTechnicalCategory)}>{PROJECT_TECHNICAL_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
            <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Rôle / emplacement / dépendances" /></label>
            <label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Divi, mobile, accueil…" /></label>
            <label>Type de contenu<select value={contentType} onChange={(event) => setContentType(event.target.value as ProjectTechnicalContentType)}>{PROJECT_TECHNICAL_CONTENT_TYPES.map((value) => <option key={value} value={value}>{CONTENT_LABELS[value]}</option>)}</select></label>
            <label>Langage<input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="css, javascript, php, json…" /></label>
          </div>
          {contentType !== 'reference' && <textarea className="technical-code-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Code, JSON ou documentation…" spellCheck={false} />}
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes techniques facultatives" />
          <div className="button-row"><button className="primary-button" type="button" onClick={() => void createItem()}>Créer</button><button className="secondary-button" type="button" onClick={() => { setCreating(false); resetEditor(); }}>Annuler</button></div>
        </div>
      )}

      <div className="technical-library-layout">
        <div className="technical-item-list">
          {items.map((item) => (
            <button key={item.id} type="button" className={selectedId === item.id ? 'active' : ''} onClick={() => void openItem(item.id)}>
              <span className="technical-category">{CATEGORY_LABELS[item.category]}</span>
              <strong>{item.name}</strong>
              <small>v{item.currentVersion?.versionNumber ?? '—'}{item.stableVersion ? ` · stable v${item.stableVersion.versionNumber}` : ''}</small>
            </button>
          ))}
          {items.length === 0 && <div className="empty-table">Aucun élément technique dans ce projet.</div>}
        </div>

        <div className="technical-detail">
          {!detail ? <div className="empty-table">Sélectionne un élément technique.</div> : <>
            <div className="technical-detail-heading">
              <div><span className="eyebrow">{CATEGORY_LABELS[detail.category]}</span><h3>{detail.name}</h3>{detail.description && <p className="muted">{detail.description}</p>}</div>
              <div className="button-row"><button className="secondary-button" type="button" onClick={toggleReuse}>Préparer pour réutilisation</button><button className="secondary-button" type="button" disabled={reuseBusy} onClick={() => void prepareForReuse()}>{reuseBusy ? 'Export…' : 'Exporter le paquet simple'}</button><button className="secondary-button" type="button" onClick={startNewVersion}>Nouvelle version</button><button className="secondary-button danger-outline" type="button" onClick={() => void archive()}>Archiver</button></div>
            </div>

            {reuseOpen&&<ProjectReusePreparationPanel key={detail.id} detail={detail} onMessage={onMessage} onClose={()=>setReuseOpen(false)}/>}

            {detail.tags && detail.tags.length > 0 && <div className="technical-tags">{detail.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}

            {newVersion && (
              <div className="technical-editor">
                <strong>Créer la version {detail.versionCount + 1}</strong>
                <div className="technical-editor-grid compact">
                  <label>Type<select value={contentType} onChange={(event) => setContentType(event.target.value as ProjectTechnicalContentType)}>{PROJECT_TECHNICAL_CONTENT_TYPES.map((value) => <option key={value} value={value}>{CONTENT_LABELS[value]}</option>)}</select></label>
                  <label>Langage<input value={language} onChange={(event) => setLanguage(event.target.value)} /></label>
                </div>
                {contentType !== 'reference' && <textarea className="technical-code-input" value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} />}
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pourquoi cette nouvelle version ?" />
                <div className="button-row"><button className="primary-button" type="button" onClick={() => void createNextVersion()}>Enregistrer la version</button><button className="secondary-button" type="button" onClick={() => setNewVersion(false)}>Annuler</button></div>
              </div>
            )}

            {detail.currentVersion && <TechnicalVersionCard version={detail.currentVersion} title="Version actuelle" resources={resourceById} onStable={markStable} resourceId={resourceId} setResourceId={setResourceId} allResources={resources} onToggleResource={toggleResource} />}

            <div className="technical-history">
              <strong>Historique ({detail.versions.length})</strong>
              {detail.versions.filter((version) => !version.current).map((version) => (
                <TechnicalVersionCard key={version.id} version={version} title={`Version ${version.versionNumber}`} resources={resourceById} onStable={markStable} resourceId="" setResourceId={() => undefined} allResources={[]} onToggleResource={toggleResource} compact />
              ))}
            </div>

            <p className="technical-safety-note">Le contenu est conservé comme donnée de référence et n’est jamais exécuté automatiquement. L’export simple reste dans les Ressources. Le parcours guidé crée une copie de travail indépendante ; une brique globale n’est créée qu’après adaptation et action explicite.</p>
          </>}
        </div>
      </div>
    </div>
  );
}

function TechnicalVersionCard({ version, title, resources, onStable, resourceId, setResourceId, allResources, onToggleResource, compact = false }: {
  version: ProjectTechnicalVersion;
  title: string;
  resources: Map<string, ProjectResource>;
  onStable: (version: ProjectTechnicalVersion) => Promise<void>;
  resourceId: string;
  setResourceId: (id: string) => void;
  allResources: ProjectResource[];
  onToggleResource: (version: ProjectTechnicalVersion, resourceId: string) => Promise<void>;
  compact?: boolean;
}) {
  return (
    <article className={`technical-version-card ${compact ? 'compact' : ''}`}>
      <div className="technical-version-heading">
        <div><strong>{title}</strong><small>v{version.versionNumber} · {CONTENT_LABELS[version.contentType]} · {dateLabel(version.createdAt)}</small></div>
        <div className="technical-version-badges">{version.current && <span>Actuelle</span>}{version.stable && <span>Stable</span>}{!version.stable && <button className="text-button" type="button" onClick={() => void onStable(version)}>Marquer stable</button>}</div>
      </div>
      {version.language && <span className="technical-language">{version.language}</span>}
      {version.contentText && <pre className="technical-code-view"><code>{version.contentText}</code></pre>}
      {version.notes && <p className="muted">{version.notes}</p>}
      <div className="technical-assets">
        {version.linkedResourceIds.map((id) => <button key={id} className="technical-asset-chip" type="button" onClick={() => void onToggleResource(version, id)}>× {resources.get(id)?.fileName ?? 'Ressource liée'}</button>)}
        {!compact && allResources.length > 0 && <select value={resourceId} onChange={(event) => { const id = event.target.value; setResourceId(id); if (id) void onToggleResource(version, id); }}><option value="">Lier une ressource du projet…</option>{allResources.filter((resource) => !version.linkedResourceIds.includes(resource.id)).map((resource) => <option key={resource.id} value={resource.id}>{resource.fileName}</option>)}</select>}
      </div>
    </article>
  );
}

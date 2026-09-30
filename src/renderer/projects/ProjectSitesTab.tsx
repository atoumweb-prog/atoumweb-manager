import { useEffect, useMemo, useState } from 'react';
import {
  PROJECT_SITE_PAGE_ROLES,
  type ProjectDetail,
  type ProjectNode,
  type ProjectSite,
  type ProjectSitePage,
  type ProjectSitePageRole,
} from '../../shared/projects';
import type { TimeSession } from '../../shared/time';
import { ProjectPageCompositionPanel } from './ProjectPageCompositionPanel';
import './ProjectSitesTab.css';

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} h ${String(minutes).padStart(2, '0')}` : `${hours} h`;
}

const ROLE_LABELS: Record<ProjectSitePageRole, string> = {
  home: 'Accueil',
  standard: 'Page standard',
  legal: 'Page légale',
  landing: 'Landing page',
  blog: 'Blog',
  other: 'Autre',
};

export function ProjectSitesTab({
  projectId,
  nodes,
  onMessage,
  onProjectChanged,
  onOpenPage,
}: {
  projectId: string;
  nodes: ProjectNode[];
  onMessage: (message: string) => void;
  onProjectChanged: (detail: ProjectDetail) => Promise<void>;
  onOpenPage: (pageId: string) => void;
}) {
  const [sites, setSites] = useState<ProjectSite[]>([]);
  const [links, setLinks] = useState<ProjectSitePage[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<'site' | 'page' | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageSiteId, setPageSiteId] = useState('');
  const [busy, setBusy] = useState(false);
  const [splitPercent, setSplitPercent] = useState(40);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [introCollapsed, setIntroCollapsed] = useState(false);
  const [pageInfoOpen, setPageInfoOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorDual, setInspectorDual] = useState(false);
  const [inspectorExpandedCount, setInspectorExpandedCount] = useState(0);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [inspectorPercent, setInspectorPercent] = useState(34);
  const [timeSessions, setTimeSessions] = useState<TimeSession[]>([]);
  const [activeTime, setActiveTime] = useState<TimeSession | null>(null);
  const [timeSnapshotAt, setTimeSnapshotAt] = useState(Date.now());
  const [tick, setTick] = useState(Date.now());

  const pages = useMemo(
    () => nodes.filter((node) => node.type === 'module' && node.displaySubtype === 'page'),
    [nodes],
  );
  const activeSites = sites.filter((site) => !site.archivedAt);
  const archivedSites = sites.filter((site) => Boolean(site.archivedAt));

  async function reload(): Promise<void> {
    const [nextSites, nextLinks] = await Promise.all([
      window.atoumweb.projects.sites.list(projectId, true),
      window.atoumweb.projects.sites.listPages(projectId),
    ]);
    setSites(nextSites);
    setLinks(nextLinks);
    if (!selectedSiteId && !selectedPageId) {
      const firstActive = nextSites.find((site) => !site.archivedAt);
      if (firstActive) setSelectedSiteId(firstActive.id);
      else if (pages[0]) setSelectedPageId(pages[0].id);
    }
  }

  async function reloadTime(): Promise<void> {
    const [sessions, current] = await Promise.all([
      window.atoumweb.time.list({ projectId }),
      window.atoumweb.time.active(),
    ]);
    setTimeSessions(sessions);
    setActiveTime(current);
    setTimeSnapshotAt(Date.now());
  }

  useEffect(() => {
    void Promise.all([reload(), reloadTime()]).catch((error) =>
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les Sites du projet.'),
    );
    const refreshTime = () => void reloadTime().catch((error) =>
      onMessage(error instanceof Error ? error.message : 'Impossible d’actualiser le temps du projet.'),
    );
    window.addEventListener('atoumweb:time-changed', refreshTime);
    return () => window.removeEventListener('atoumweb:time-changed', refreshTime);
  }, [projectId]);

  useEffect(() => {
    if (!activeTime || activeTime.paused || activeTime.endedAt) return;
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTime?.id, activeTime?.paused, activeTime?.endedAt]);

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.project-sites-workspace');
    if (!workspace) return;
    document.body.classList.add('project-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(24, Math.min(68, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('project-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function beginInspectorResize(): void {
    const workspace = document.querySelector<HTMLElement>('.project-sites-workspace');
    if (!workspace) return;
    document.body.classList.add('project-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((rect.right - event.clientX) / rect.width) * 100;
      const max = inspectorExpandedCount >= 2 ? 58 : 45;
      setInspectorPercent(Math.max(24, Math.min(max, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('project-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  async function run(action: () => Promise<unknown>, success?: string): Promise<void> {
    setBusy(true);
    try {
      await action();
      await reload();
      if (success) onMessage(success);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier les Sites du projet.');
    } finally {
      setBusy(false);
    }
  }

  async function applyBlueprint(): Promise<void> {
    setBusy(true);
    try {
      const result = await window.atoumweb.projects.sites.applyBlueprint(projectId);
      const updatedProject = await window.atoumweb.projects.projects.get(projectId);
      await onProjectChanged(updatedProject);
      await reload();
      const created = result.createdSiteIds.length;
      const linked = result.linkedPageIds.length;
      onMessage(result.declaredSiteCount === 0
        ? 'Ce blueprint ne déclare aucun Site ni aucune Page à initialiser.'
        : created || linked
          ? `Blueprint appliqué : ${created} Site(s) créé(s), ${linked} Page(s) rattachée(s).`
          : 'Blueprint déjà appliqué : aucun doublon créé, modifications manuelles conservées.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’appliquer le blueprint Sites / Pages.');
    } finally {
      setBusy(false);
    }
  }

  function linkFor(pageId: string): ProjectSitePage | undefined {
    return links.find((link) => link.projectNodeId === pageId);
  }

  async function createSite(): Promise<void> {
    if (!siteName.trim()) return;
    setBusy(true);
    try {
      const created = await window.atoumweb.projects.sites.create(projectId, {
        name: siteName.trim(),
        desiredDomain: siteDomain.trim() || null,
      });
      setSiteName('');
      setSiteDomain('');
      setCreateMode(null);
      setSelectedPageId(null);
      setSelectedSiteId(created.id);
      await reload();
      onMessage('Site ajouté au projet.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer le Site.');
    } finally {
      setBusy(false);
    }
  }

  async function createPage(): Promise<void> {
    const name = pageName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const beforeIds = new Set(nodes.map((node) => node.id));
      const pageRoot = nodes.find((node) => node.semanticKey === 'pages' && !node.parentId)
        ?? nodes.find((node) => node.name.toLocaleLowerCase('fr-FR') === 'pages' && !node.parentId)
        ?? null;
      const updated = await window.atoumweb.projects.projects.addNode(projectId, {
        parentId: pageRoot?.id ?? null,
        type: 'module',
        displaySubtype: 'page',
        name,
        required: true,
      });
      const created = updated.nodes.find((node) => !beforeIds.has(node.id) && node.type === 'module' && node.displaySubtype === 'page');
      if (!created) throw new Error('La nouvelle Page n’a pas pu être identifiée.');

      if (pageSiteId) {
        await window.atoumweb.projects.sites.linkPage(pageSiteId, created.id, { role: 'standard' });
      }

      setPageName('');
      setPageSiteId('');
      setCreateMode(null);
      setSelectedSiteId(null);
      setSelectedPageId(created.id);
      await onProjectChanged(updated);
      await reload();
      onMessage(pageSiteId ? 'Page créée et rattachée au Site.' : 'Page créée dans le Projet.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer la Page.');
    } finally {
      setBusy(false);
    }
  }

  const selectedPage = selectedPageId ? pages.find((page) => page.id === selectedPageId) ?? null : null;
  const selectedLink = selectedPage ? linkFor(selectedPage.id) : undefined;
  const selectedSite = selectedPage
    ? (selectedLink ? sites.find((site) => site.id === selectedLink.projectSiteId) ?? null : null)
    : (selectedSiteId ? sites.find((site) => site.id === selectedSiteId) ?? null : null);

  function selectSite(id: string): void {
    setSelectedPageId(null);
    setSelectedSiteId(id);
    setDetailCollapsed(false);
    setInspectorOpen(false);
    setInspectorCollapsed(false);
  }

  function selectPage(id: string): void {
    setSelectedSiteId(null);
    setSelectedPageId(id);
    setDetailCollapsed(false);
    setPageInfoOpen(false);
    setInspectorOpen(false);
    setInspectorCollapsed(false);
  }

  const selectedPageSessions = selectedPage
    ? timeSessions.filter((session) => session.projectNodeId === selectedPage.id)
    : [];
  const activeOnSelectedPage = Boolean(
    selectedPage
    && activeTime
    && !activeTime.endedAt
    && activeTime.projectNodeId === selectedPage.id,
  );
  const selectedPageBaseSeconds = selectedPageSessions.reduce((total, session) => total + session.durationSeconds, 0);
  const selectedPageLiveExtra = activeOnSelectedPage && activeTime && !activeTime.paused
    ? Math.max(0, Math.floor((tick - timeSnapshotAt) / 1000))
    : 0;
  const selectedPageRealSeconds = selectedPageBaseSeconds + selectedPageLiveExtra;

  async function startSelectedPageTimer(): Promise<void> {
    if (!selectedPage) return;
    setBusy(true);
    try {
      const current = await window.atoumweb.time.active();
      if (current) {
        if (current.projectNodeId === selectedPage.id) {
          setActiveTime(current);
          setTimeSnapshotAt(Date.now());
          onMessage('Le chrono est déjà actif sur cette Page.');
          return;
        }
        window.dispatchEvent(new CustomEvent('atoumweb:timer-context', {
          detail: {
            projectId,
            nodeId: selectedPage.id,
            activityLabel: selectedPage.name,
            category: selectedPage.timeCategory || 'production',
            billable: true,
          },
        }));
        onMessage('Un autre chrono est en cours : confirme le changement dans le timer global.');
        return;
      }
      const session = await window.atoumweb.time.start({
        projectId,
        projectNodeId: selectedPage.id,
        category: (selectedPage.timeCategory || 'production') as TimeSession['category'],
        activityLabel: selectedPage.name,
        billable: true,
      });
      setActiveTime(session);
      setTimeSnapshotAt(Date.now());
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Chrono démarré sur « ${selectedPage.name} ».`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de démarrer le chrono.');
    } finally {
      setBusy(false);
    }
  }

  async function pauseOrResumeSelectedPageTimer(): Promise<void> {
    if (!activeTime || !activeOnSelectedPage) return;
    setBusy(true);
    try {
      const next = activeTime.paused
        ? await window.atoumweb.time.resume(activeTime.id)
        : await window.atoumweb.time.pause(activeTime.id);
      setActiveTime(next);
      setTimeSnapshotAt(Date.now());
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le chrono.');
    } finally {
      setBusy(false);
    }
  }

  async function stopSelectedPageTimer(): Promise<void> {
    if (!activeTime || !activeOnSelectedPage) return;
    setBusy(true);
    try {
      const stopped = await window.atoumweb.time.stop(activeTime.id);
      setActiveTime(null);
      setTimeSnapshotAt(Date.now());
      window.dispatchEvent(new CustomEvent('atoumweb:time-changed'));
      onMessage(`Chrono arrêté · ${formatElapsed(stopped.durationSeconds)}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’arrêter le chrono.');
    } finally {
      setBusy(false);
    }
  }

  const inspectorHostId = 'project-sites-code-inspector-host';
  const effectiveLeftPercent = inspectorOpen && !treeCollapsed
    ? Math.min(splitPercent, inspectorExpandedCount >= 2 ? 22 : 30)
    : splitPercent;
  const workspaceColumns = (() => {
    const detailWidth = detailCollapsed ? '46px' : 'minmax(360px, 1fr)';
    if (!inspectorOpen) {
      if (treeCollapsed) return detailCollapsed ? '46px 46px' : `46px ${detailWidth}`;
      return detailCollapsed
        ? 'minmax(0, 1fr) 8px 46px'
        : `${effectiveLeftPercent}% 8px ${detailWidth}`;
    }
    if (inspectorCollapsed) {
      return treeCollapsed
        ? `46px ${detailWidth} 46px`
        : `${effectiveLeftPercent}% 8px ${detailWidth} 46px`;
    }
    const rightWidth = inspectorExpandedCount === 0
      ? (inspectorDual ? '138px' : '88px')
      : detailCollapsed
        ? 'minmax(340px, 1fr)'
        : inspectorExpandedCount >= 2
          ? `clamp(620px, ${Math.max(inspectorPercent, 46)}%, 940px)`
          : inspectorDual
            ? `clamp(390px, ${Math.min(inspectorPercent, 38)}%, 730px)`
            : `clamp(340px, ${inspectorPercent}%, 680px)`;
    return treeCollapsed
      ? `46px ${detailWidth} 8px ${rightWidth}`
      : `${effectiveLeftPercent}% 8px ${detailWidth} 8px ${rightWidth}`;
  })();

  return <section className="project-sites-tab">
    <div className={`project-sites-intro panel ${introCollapsed ? 'collapsed' : ''}`}>
      <div className="project-sites-intro-copy">
        <span className="eyebrow">Destination opérationnelle</span>
        <h2>Sites & pages</h2>
        {!introCollapsed && <p>Le Projet conserve la structure métier. Divi restera l’atelier de construction : ici, on organise les Sites et les Pages avant leur préparation dans Bridge.</p>}
      </div>
      <div className="project-sites-toolbar">
        <button className="secondary-button" type="button" disabled={busy} title="Créer uniquement les Sites et Pages manquants prévus par le blueprint" onClick={() => void applyBlueprint()}>Initialiser depuis le blueprint</button>
        <button className="secondary-button" type="button" onClick={() => setCreateMode(createMode === 'site' ? null : 'site')}>+ Site</button>
        <button className="primary-button" type="button" onClick={() => {
          setCreateMode(createMode === 'page' ? null : 'page');
          if (!pageSiteId && selectedSite && !selectedSite.archivedAt) setPageSiteId(selectedSite.id);
        }}>+ Page</button>
        <button className="secondary-button project-sites-intro-toggle" type="button" title={introCollapsed ? 'Déployer le bandeau Sites & pages' : 'Réduire le bandeau Sites & pages'} onClick={() => setIntroCollapsed((value) => !value)}>
          {introCollapsed ? '↓' : '↑'}
        </button>
      </div>
    </div>

    {createMode === 'site' && <div className="panel project-sites-create-panel">
      <div><span className="eyebrow">Nouveau Site</span><h3>Ajouter une destination au Projet</h3></div>
      <label>Nom du site
        <input value={siteName} onChange={(event) => setSiteName(event.target.value)} placeholder="Ex. Site principal" />
      </label>
      <label>Nom de domaine prévu <span>facultatif</span>
        <input value={siteDomain} onChange={(event) => setSiteDomain(event.target.value)} placeholder="Ex. fleuriste.com" />
      </label>
      <div className="button-row">
        <button className="secondary-button" type="button" onClick={() => setCreateMode(null)}>Annuler</button>
        <button className="primary-button" type="button" disabled={busy || !siteName.trim()} onClick={() => void createSite()}>Créer le Site</button>
      </div>
    </div>}

    {createMode === 'page' && <div className="panel project-sites-create-panel">
      <div><span className="eyebrow">Nouvelle Page</span><h3>Créer une Page dans le Projet</h3></div>
      <label>Nom de la Page
        <input value={pageName} onChange={(event) => setPageName(event.target.value)} placeholder="Ex. Contact" />
      </label>
      <label>Rattacher au Site
        <select value={pageSiteId} onChange={(event) => setPageSiteId(event.target.value)}>
          <option value="">Pas encore rattachée</option>
          {activeSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
      </label>
      <div className="button-row">
        <button className="secondary-button" type="button" onClick={() => setCreateMode(null)}>Annuler</button>
        <button className="primary-button" type="button" disabled={busy || !pageName.trim()} onClick={() => void createPage()}>Créer la Page</button>
      </div>
    </div>}

    <div
      className={`project-sites-workspace ${treeCollapsed ? 'tree-collapsed' : ''} ${detailCollapsed ? 'detail-collapsed' : ''} ${inspectorOpen ? 'inspector-open' : ''} ${inspectorCollapsed ? 'inspector-collapsed' : ''}`}
      style={{ gridTemplateColumns: workspaceColumns }}
    >
      {treeCollapsed ? <button className="project-sites-tree-restore" type="button" title="Afficher l’arborescence" aria-label="Afficher l’arborescence" onClick={() => setTreeCollapsed(false)}>→</button> : <section className="panel project-sites-tree-panel">
        <div className="project-sites-tree-head">
          <div><span className="eyebrow">Arborescence</span><strong>{activeSites.length} Site{activeSites.length > 1 ? 's' : ''} · {pages.length} Page{pages.length > 1 ? 's' : ''}</strong></div>
          <button className="project-tree-size-button" type="button" title="Masquer l’arborescence" aria-label="Masquer l’arborescence" onClick={() => setTreeCollapsed(true)}>←</button>
        </div>
        <div className="project-sites-tree-scroll">
          {activeSites.map((site) => {
            const sitePages = pages.filter((page) => linkFor(page.id)?.projectSiteId === site.id);
            return <div key={site.id} className="project-site-tree-group">
              <button type="button" className={selectedSite?.id === site.id && !selectedPage ? 'project-site-tree-site active' : 'project-site-tree-site'} onClick={() => selectSite(site.id)}>
                <span>▾</span><div><strong>{site.name}</strong><small>{site.desiredDomain || 'Domaine non renseigné'} · {sitePages.length} page(s)</small></div>
              </button>
              <div className="project-site-tree-pages">
                {sitePages.map((page) => {
                  const link = linkFor(page.id);
                  return <button type="button" key={page.id} className={selectedPageId === page.id ? 'active' : ''} onClick={() => selectPage(page.id)}>
                    <span>↳</span><div><strong>{page.name}</strong><small>{link?.role === 'home' ? 'Accueil' : link?.desiredPath || 'Slug à définir'}</small></div>
                  </button>;
                })}
                {sitePages.length === 0 && <span className="project-sites-empty-inline">Aucune Page rattachée</span>}
                <button type="button" className="project-site-tree-add-page" onClick={() => {
                  setPageSiteId(site.id);
                  setCreateMode('page');
                }}>+ Ajouter une Page</button>
              </div>
            </div>;
          })}

          {pages.some((page) => !linkFor(page.id)) && <div className="project-site-tree-group unlinked">
            <div className="project-site-tree-label"><strong>Pages non rattachées</strong></div>
            <div className="project-site-tree-pages">
              {pages.filter((page) => !linkFor(page.id)).map((page) => <button type="button" key={page.id} className={selectedPageId === page.id ? 'active' : ''} onClick={() => selectPage(page.id)}>
                <span>↳</span><div><strong>{page.name}</strong><small>Non rattachée</small></div>
              </button>)}
            </div>
          </div>}

          {archivedSites.length > 0 && <div className="project-site-tree-group archived">
            <div className="project-site-tree-label"><strong>Sites archivés</strong></div>
            {archivedSites.map((site) => <button type="button" key={site.id} className={selectedSite?.id === site.id && !selectedPage ? 'project-site-tree-site active' : 'project-site-tree-site'} onClick={() => selectSite(site.id)}>
              <span>○</span><div><strong>{site.name}</strong><small>Archivé</small></div>
            </button>)}
          </div>}

          {sites.length === 0 && pages.length === 0 && <p className="muted">Aucun Site ni Page pour le moment.</p>}
        </div>
      </section>}

      {!treeCollapsed && <div
        className="project-sites-splitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner l’arborescence et la fiche"
        tabIndex={0}
        onPointerDown={beginResize}
        onDoubleClick={() => setSplitPercent(40)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(24, value - 3));
          if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(68, value + 3));
        }}
      ><span /></div>}

      <section className={`panel project-sites-detail-panel ${detailCollapsed ? 'collapsed' : ''}`}>
        {detailCollapsed && <button className="project-sites-detail-restore" type="button" title="Afficher la fiche Page" aria-label="Afficher la fiche Page" onClick={() => setDetailCollapsed(false)}>→</button>}
        <div className="project-sites-detail-content" aria-hidden={detailCollapsed}>
        {!selectedSite && !selectedPage && <div className="project-sites-empty-detail">
          <button className="project-sites-detail-collapse" type="button" title="Réduire la fiche" aria-label="Réduire la fiche" onClick={() => setDetailCollapsed(true)}>←</button>
          <span className="eyebrow">Fiche</span>
          <h3>Sélectionne un Site ou une Page</h3>
          <p>Tu pourras ensuite modifier son rattachement et ses informations.</p>
        </div>}

        {selectedSite && !selectedPage && <>
          <header className="project-sites-detail-head">
            <div><span className="eyebrow">Site du Projet</span><h3>{selectedSite.name}</h3><p>{selectedSite.desiredDomain || 'Nom de domaine non renseigné'}</p></div>
            <div className="project-sites-detail-head-actions">
              {selectedSite.archivedAt && <span className="status-pill">Archivé</span>}
              <button className="project-sites-detail-collapse" type="button" title="Réduire la fiche Site" aria-label="Réduire la fiche Page" onClick={() => setDetailCollapsed(true)}>←</button>
            </div>
          </header>
          <div className="project-sites-detail-form">
            <label>Nom du site
              <input
                key={`${selectedSite.id}-name-${selectedSite.updatedAt}`}
                defaultValue={selectedSite.name}
                disabled={busy || Boolean(selectedSite.archivedAt)}
                onBlur={(event) => {
                  const next = event.currentTarget.value.trim();
                  if (!next || next === selectedSite.name) return;
                  void run(() => window.atoumweb.projects.sites.update(selectedSite.id, { name: next }), 'Site renommé.');
                }}
              />
            </label>
            <label>Nom de domaine prévu
              <input
                key={`${selectedSite.id}-domain-${selectedSite.updatedAt}`}
                defaultValue={selectedSite.desiredDomain ?? ''}
                disabled={busy || Boolean(selectedSite.archivedAt)}
                placeholder="Ex. fleuriste.com"
                onBlur={(event) => {
                  const next = event.currentTarget.value.trim() || null;
                  if (next === (selectedSite.desiredDomain ?? null)) return;
                  void run(() => window.atoumweb.projects.sites.update(selectedSite.id, { desiredDomain: next }), 'Nom de domaine mis à jour.');
                }}
              />
            </label>
          </div>
          <div className="project-sites-detail-actions">
            {!selectedSite.archivedAt && <button className="primary-button" type="button" onClick={() => {
              setPageSiteId(selectedSite.id);
              setCreateMode('page');
            }}>+ Nouvelle Page</button>}
            <button className="secondary-button" type="button" disabled={busy} onClick={() => void run(
              () => window.atoumweb.projects.sites.setArchived(selectedSite.id, !selectedSite.archivedAt),
              selectedSite.archivedAt ? 'Site réactivé.' : 'Site archivé. Les Pages restent rattachées.',
            )}>{selectedSite.archivedAt ? 'Réactiver le Site' : 'Archiver le Site'}</button>
          </div>
        </>}

        {selectedPage && <>
          <header className="project-sites-detail-head">
            <div><span className="eyebrow">Page du Projet</span><h3>{selectedPage.name}</h3><p>{selectedSite ? selectedSite.name : 'Non rattachée à un Site'}</p></div>
            <div className="project-sites-detail-head-actions">
              <span className="status-pill project-sites-composition-badge">6B · Composition AtoumWeb</span>
              <button className="project-sites-detail-collapse" type="button" title="Réduire la fiche Page" aria-label="Réduire la fiche Page" onClick={() => setDetailCollapsed(true)}>←</button>
            </div>
          </header>

          <section className={`project-sites-page-work ${activeOnSelectedPage ? 'running' : ''}`}>
            <div className="project-sites-time-summary">
              <span>Temps réel</span>
              <strong>{formatElapsed(selectedPageRealSeconds)}</strong>
              <small>{selectedPageSessions.length} session{selectedPageSessions.length > 1 ? 's' : ''}{activeOnSelectedPage ? activeTime?.paused ? ' · en pause' : ' · chrono en cours' : ''}</small>
            </div>
            <div className="project-sites-page-actions">
              <button className="secondary-button" type="button" title="Ouvrir la fiche Production de cette Page" onClick={() => onOpenPage(selectedPage.id)}>Production →</button>
              {!activeOnSelectedPage
                ? <button className="primary-button" type="button" title="Démarrer le travail sur cette Page" disabled={busy} onClick={() => void startSelectedPageTimer()}>
                    ▶ Démarrer
                  </button>
                : <>
                    <button className="primary-button" type="button" disabled={busy} onClick={() => void pauseOrResumeSelectedPageTimer()}>
                      {activeTime?.paused ? '▶ Reprendre' : 'Ⅱ Pause'}
                    </button>
                    <button className="secondary-button" type="button" disabled={busy} onClick={() => void stopSelectedPageTimer()}>■ Arrêter</button>
                  </>}
            </div>
          </section>

          <section className={`project-sites-page-info ${pageInfoOpen ? 'open' : ''}`}>
            <button className="project-sites-page-info-summary" type="button" onClick={() => setPageInfoOpen((value) => !value)}>
              <span>
                <span className="eyebrow">Informations de la Page</span>
                <strong>{selectedPage.name}</strong>
                <small>{selectedSite?.name ?? 'Non rattachée'} · {ROLE_LABELS[selectedLink?.role ?? 'standard']} · {selectedLink?.role === 'home' ? '/' : selectedLink?.desiredPath || 'slug à définir'}</small>
              </span>
              <b>{pageInfoOpen ? '▴' : '▾'}</b>
            </button>
            {pageInfoOpen && <div className="project-sites-detail-form">
              <label>Nom de la Page
                <input
                  key={`${selectedPage.id}-name-${selectedPage.updatedAt}`}
                  defaultValue={selectedPage.name}
                  disabled={busy}
                  onBlur={(event) => {
                    const next = event.currentTarget.value.trim();
                    if (!next || next === selectedPage.name) return;
                    void run(async () => {
                      const updated = await window.atoumweb.projects.projects.updateNode(selectedPage.id, { name: next });
                      await onProjectChanged(updated);
                    }, 'Page renommée.');
                  }}
                />
              </label>
              <label>Site
                <select
                  value={selectedLink?.projectSiteId ?? ''}
                  disabled={busy}
                  onChange={(event) => {
                    const siteId = event.target.value;
                    if (!siteId) {
                      void run(() => window.atoumweb.projects.sites.unlinkPage(selectedPage.id), 'Page détachée du Site.');
                      return;
                    }
                    void run(() => window.atoumweb.projects.sites.linkPage(siteId, selectedPage.id, {
                      role: selectedLink?.role ?? 'standard',
                      desiredPath: selectedLink?.desiredPath ?? null,
                    }), 'Page rattachée au Site.');
                  }}
                >
                  <option value="">Non rattachée</option>
                  {activeSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                  {selectedSite?.archivedAt && <option value={selectedSite.id}>{selectedSite.name} · archivé</option>}
                </select>
              </label>
              <label>Rôle
                <select
                  value={selectedLink?.role ?? 'standard'}
                  disabled={busy || !selectedLink || Boolean(selectedSite?.archivedAt)}
                  onChange={(event) => {
                    if (!selectedLink) return;
                    const role = event.target.value as ProjectSitePageRole;
                    void run(() => window.atoumweb.projects.sites.linkPage(selectedLink.projectSiteId, selectedPage.id, {
                      role,
                      desiredPath: role === 'home' || selectedLink.desiredPath === '/' ? null : selectedLink.desiredPath,
                    }), 'Rôle de Page mis à jour.');
                  }}
                >
                  {PROJECT_SITE_PAGE_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                </select>
              </label>
              <label>Slug / chemin URL
                <input
                  key={`${selectedPage.id}-${selectedLink?.projectSiteId ?? 'none'}-${selectedLink?.desiredPath ?? ''}`}
                  defaultValue={selectedLink?.desiredPath ?? ''}
                  placeholder={!selectedLink ? 'Rattacher la Page à un Site' : selectedLink.role === 'home' ? '/' : 'Ex. /contact'}
                  disabled={busy || !selectedLink || selectedLink.role === 'home' || Boolean(selectedSite?.archivedAt)}
                  onBlur={(event) => {
                    if (!selectedLink) return;
                    const next = event.currentTarget.value.trim() || null;
                    if (next === (selectedLink.desiredPath ?? null)) return;
                    void run(() => window.atoumweb.projects.sites.linkPage(selectedLink.projectSiteId, selectedPage.id, {
                      role: selectedLink.role,
                      desiredPath: next,
                    }), 'Slug de Page mis à jour.');
                  }}
                />
              </label>
            </div>}
          </section>

          <ProjectPageCompositionPanel
            page={selectedPage}
            onMessage={onMessage}
            inspectorHostId={inspectorHostId}
            onInspectorOpenChange={(open, dual, expandedCount) => {
              setInspectorOpen(open);
              setInspectorDual(dual);
              setInspectorExpandedCount(expandedCount);
              if (open) {
                setInspectorCollapsed(false);
                if (expandedCount >= 2) setInspectorPercent((value) => Math.max(value, 46));
              }
            }}
          />

          <div className="project-sites-note">
            <strong>Divi reste l’atelier principal.</strong>
            <span>Cette fiche décrit la destination métier de la Page. Le bouton de préparation Bridge sera ajouté dans un lot ultérieur.</span>
          </div>
        </>}
        </div>
      </section>

      {inspectorOpen && !inspectorCollapsed && <div
        className="project-sites-inspector-splitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner la fiche et l’atelier latéral"
        tabIndex={0}
        onPointerDown={beginInspectorResize}
        onDoubleClick={() => setInspectorPercent(inspectorExpandedCount >= 2 ? 50 : 34)}
        onKeyDown={(event) => {
          const max = inspectorExpandedCount >= 2 ? 58 : 45;
          if (event.key === 'ArrowLeft') setInspectorPercent((value) => Math.min(max, value + 3));
          if (event.key === 'ArrowRight') setInspectorPercent((value) => Math.max(24, value - 3));
        }}
      ><span /></div>}

      <aside
        className={`panel project-sites-inspector-shell ${!inspectorOpen ? 'inactive' : ''} ${inspectorCollapsed ? 'collapsed' : ''}`}
        aria-hidden={!inspectorOpen}
      >
        <button
          className="project-sites-inspector-collapse"
          type="button"
          title={inspectorCollapsed ? 'Afficher l’atelier latéral' : 'Réduire l’atelier latéral'}
          aria-label={inspectorCollapsed ? 'Afficher l’atelier latéral' : 'Réduire l’atelier latéral'}
          onClick={() => setInspectorCollapsed((value) => !value)}
          tabIndex={inspectorOpen ? 0 : -1}
        >{inspectorCollapsed ? '←' : '→'}</button>
        <div id={inspectorHostId} className="project-sites-inspector-host" />
      </aside>
    </div>
  </section>;
}

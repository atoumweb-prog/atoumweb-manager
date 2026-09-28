import { useEffect, useMemo, useState } from 'react';
import {
  PROJECT_SITE_PAGE_ROLES,
  type ProjectDetail,
  type ProjectNode,
  type ProjectSite,
  type ProjectSitePage,
  type ProjectSitePageRole,
} from '../../shared/projects';
import './ProjectSitesTab.css';

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

  useEffect(() => {
    void reload().catch((error) => onMessage(error instanceof Error ? error.message : 'Impossible de charger les Sites du projet.'));
  }, [projectId]);

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
  }

  function selectPage(id: string): void {
    setSelectedSiteId(null);
    setSelectedPageId(id);
  }

  return <section className="project-sites-tab">
    <div className="project-sites-intro panel">
      <div>
        <span className="eyebrow">Destination opérationnelle</span>
        <h2>Sites & pages</h2>
        <p>Le Projet conserve la structure métier. Divi restera l’atelier de construction : ici, on organise les Sites et les Pages avant leur préparation dans Bridge.</p>
      </div>
      <div className="project-sites-toolbar">
        <button className="secondary-button" type="button" onClick={() => setCreateMode(createMode === 'site' ? null : 'site')}>+ Site</button>
        <button className="primary-button" type="button" onClick={() => {
          setCreateMode(createMode === 'page' ? null : 'page');
          if (!pageSiteId && selectedSite && !selectedSite.archivedAt) setPageSiteId(selectedSite.id);
        }}>+ Page</button>
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

    <div className="project-sites-workspace">
      <section className="panel project-sites-tree-panel">
        <div className="project-sites-tree-head">
          <div><span className="eyebrow">Arborescence</span><strong>{activeSites.length} Site{activeSites.length > 1 ? 's' : ''} · {pages.length} Page{pages.length > 1 ? 's' : ''}</strong></div>
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
      </section>

      <section className="panel project-sites-detail-panel">
        {!selectedSite && !selectedPage && <div className="project-sites-empty-detail">
          <span className="eyebrow">Fiche</span>
          <h3>Sélectionne un Site ou une Page</h3>
          <p>Tu pourras ensuite modifier son rattachement et ses informations.</p>
        </div>}

        {selectedSite && !selectedPage && <>
          <header className="project-sites-detail-head">
            <div><span className="eyebrow">Site du Projet</span><h3>{selectedSite.name}</h3><p>{selectedSite.desiredDomain || 'Nom de domaine non renseigné'}</p></div>
            {selectedSite.archivedAt && <span className="status-pill">Archivé</span>}
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
            <button className="primary-button" type="button" onClick={() => onOpenPage(selectedPage.id)}>Ouvrir dans Production →</button>
          </header>
          <div className="project-sites-detail-form">
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
          </div>
          <div className="project-sites-note">
            <strong>Divi reste l’atelier principal.</strong>
            <span>Cette fiche décrit la destination métier de la Page. Le bouton de préparation Bridge sera ajouté dans un lot ultérieur.</span>
          </div>
        </>}
      </section>
    </div>
  </section>;
}

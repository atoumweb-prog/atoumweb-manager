import { useEffect, useMemo, useState } from 'react';
import {
  PROJECT_SITE_PAGE_ROLES,
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
}: {
  projectId: string;
  nodes: ProjectNode[];
  onMessage: (message: string) => void;
}) {
  const [sites, setSites] = useState<ProjectSite[]>([]);
  const [links, setLinks] = useState<ProjectSitePage[]>([]);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState(false);

  const pages = useMemo(
    () => nodes.filter((node) => node.type === 'module' && node.displaySubtype === 'page'),
    [nodes],
  );

  async function reload(): Promise<void> {
    const [nextSites, nextLinks] = await Promise.all([
      window.atoumweb.projects.sites.list(projectId, true),
      window.atoumweb.projects.sites.listPages(projectId),
    ]);
    setSites(nextSites);
    setLinks(nextLinks);
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

  async function createSite(): Promise<void> {
    if (!name.trim()) return;
    await run(
      () => window.atoumweb.projects.sites.create(projectId, {
        name: name.trim(),
        desiredDomain: domain.trim() || null,
      }),
      'Site ajouté au projet.',
    );
    setName('');
    setDomain('');
  }

  function linkFor(pageId: string): ProjectSitePage | undefined {
    return links.find((link) => link.projectNodeId === pageId);
  }

  const activeSites = sites.filter((site) => !site.archivedAt);

  return <section className="project-sites-tab">
    <div className="project-sites-intro panel">
      <div>
        <span className="eyebrow">Destination opérationnelle</span>
        <h2>Sites & pages</h2>
        <p>La Page reste un élément du plan Projet. Ici, tu indiques simplement à quel Site elle appartient. Aucun contenu Divi n’est dupliqué dans le Manager.</p>
      </div>
      <div className="project-site-create">
        <label>Nom du site
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Site principal" />
        </label>
        <label>Nom de domaine prévu <span>facultatif</span>
          <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Ex. fleuriste.com" />
        </label>
        <button className="primary-button" type="button" disabled={busy || !name.trim()} onClick={() => void createSite()}>Ajouter le site</button>
      </div>
    </div>

    <div className="project-sites-grid">
      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">Sites</span><h3>{activeSites.length} actif{activeSites.length > 1 ? 's' : ''}</h3></div></div>
        {sites.length === 0 && <p className="muted">Aucun Site n’est encore rattaché à ce Projet.</p>}
        <div className="project-site-list">
          {sites.map((site) => <article key={site.id} className={site.archivedAt ? 'archived' : ''}>
            <div className="project-site-fields">
              <label>Nom du site
                <input
                  key={`${site.id}-name-${site.updatedAt}`}
                  defaultValue={site.name}
                  disabled={busy || Boolean(site.archivedAt)}
                  onBlur={(event) => {
                    const next = event.currentTarget.value.trim();
                    if (!next || next === site.name) return;
                    void run(() => window.atoumweb.projects.sites.update(site.id, { name: next }), 'Site renommé.');
                  }}
                />
              </label>
              <label>Nom de domaine prévu
                <input
                  key={`${site.id}-domain-${site.updatedAt}`}
                  defaultValue={site.desiredDomain ?? ''}
                  disabled={busy || Boolean(site.archivedAt)}
                  placeholder="exemple.fr"
                  onBlur={(event) => {
                    const next = event.currentTarget.value.trim() || null;
                    if (next === (site.desiredDomain ?? null)) return;
                    void run(() => window.atoumweb.projects.sites.update(site.id, { desiredDomain: next }), 'Nom de domaine mis à jour.');
                  }}
                />
              </label>
            </div>
            <div className="project-site-meta">
              <span>{links.filter((link) => link.projectSiteId === site.id).length} page(s)</span>
              {site.archivedAt && <span>Archivé</span>}
              <button
                className="secondary-button"
                type="button"
                disabled={busy}
                onClick={() => void run(
                  () => window.atoumweb.projects.sites.setArchived(site.id, !site.archivedAt),
                  site.archivedAt ? 'Site réactivé.' : 'Site archivé. Les rattachements sont conservés.',
                )}
              >{site.archivedAt ? 'Réactiver' : 'Archiver'}</button>
            </div>
          </article>)}
        </div>
      </section>

      <section className="panel project-sites-pages-panel">
        <div className="panel-title"><div><span className="eyebrow">Pages du plan</span><h3>{pages.length} page{pages.length > 1 ? 's' : ''}</h3></div></div>
        {pages.length === 0 && <p className="muted">Ajoute une Page dans le plan de production pour pouvoir la rattacher à un Site.</p>}
        <div className="project-site-page-list">
          {pages.map((page) => {
            const link = linkFor(page.id);
            const linkedSite = link ? sites.find((site) => site.id === link.projectSiteId) : undefined;
            return <article key={page.id}>
              <div><strong>{page.name}</strong><small>{linkedSite ? linkedSite.name : 'Non rattachée'}</small></div>
              <label>Site
                <select
                  value={link?.projectSiteId ?? ''}
                  disabled={busy}
                  onChange={(event) => {
                    const siteId = event.target.value;
                    if (!siteId) {
                      void run(() => window.atoumweb.projects.sites.unlinkPage(page.id), 'Page détachée du Site.');
                      return;
                    }
                    void run(() => window.atoumweb.projects.sites.linkPage(siteId, page.id, {
                      role: link?.role ?? 'standard',
                      desiredPath: link?.desiredPath ?? null,
                    }), 'Page rattachée au Site.');
                  }}
                >
                  <option value="">Non rattachée</option>
                  {activeSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                  {linkedSite?.archivedAt && <option value={linkedSite.id}>{linkedSite.name} · archivé</option>}
                </select>
              </label>
              <label>Rôle
                <select
                  value={link?.role ?? 'standard'}
                  disabled={busy || !link || Boolean(linkedSite?.archivedAt)}
                  onChange={(event) => {
                    if (!link) return;
                    const role = event.target.value as ProjectSitePageRole;
                    void run(() => window.atoumweb.projects.sites.linkPage(link.projectSiteId, page.id, {
                      role,
                      desiredPath: role === 'home' || link.desiredPath === '/' ? null : link.desiredPath,
                    }), 'Rôle de Page mis à jour.');
                  }}
                >
                  {PROJECT_SITE_PAGE_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                </select>
              </label>
              <label>Slug / chemin URL
                <input
                  key={`${page.id}-${link?.projectSiteId ?? 'none'}-${link?.desiredPath ?? ''}`}
                  defaultValue={link?.desiredPath ?? ''}
                  placeholder={!link ? 'Rattacher la page à un Site' : link.role === 'home' ? '/' : 'Ex. /contact'}
                  disabled={busy || !link || link.role === 'home' || Boolean(linkedSite?.archivedAt)}
                  onBlur={(event) => {
                    if (!link) return;
                    const next = event.currentTarget.value.trim() || null;
                    if (next === (link.desiredPath ?? null)) return;
                    void run(() => window.atoumweb.projects.sites.linkPage(link.projectSiteId, page.id, {
                      role: link.role,
                      desiredPath: next,
                    }), 'Slug de Page mis à jour.');
                  }}
                />
              </label>
            </article>;
          })}
        </div>
      </section>
    </div>
  </section>;
}

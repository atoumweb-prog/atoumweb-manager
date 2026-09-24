import { useEffect, useMemo, useState } from 'react';
import type {
  BridgeObjectPreview,
  BridgePageSnapshotDetail,
  BridgePageSummary,
  BridgeSiteDetail,
  BridgeSiteSummary,
  BridgeSnapshotInspection,
  BridgeSnapshotSummary,
} from '../../shared/bridgeSnapshots';
import { OperationIcon } from '../operations/OperationIcon';
import './BridgeSitesPage.css';

interface Props {
  onMessage: (message: string) => void;
}

type DetailTab = 'structure' | 'sources' | 'assets' | 'dependencies';

export function BridgeSitesPage({ onMessage }: Props) {
  const [sites, setSites] = useState<BridgeSiteSummary[]>([]);
  const [site, setSite] = useState<BridgeSiteDetail | null>(null);
  const [snapshot, setSnapshot] = useState<BridgeSnapshotSummary | null>(null);
  const [pages, setPages] = useState<BridgePageSummary[]>([]);
  const [allContents, setAllContents] = useState<BridgePageSummary[]>([]);
  const [page, setPage] = useState<BridgePageSnapshotDetail | null>(null);
  const [inspection, setInspection] = useState<BridgeSnapshotInspection | null>(null);
  const [preview, setPreview] = useState<BridgeObjectPreview | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<DetailTab>('structure');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshSites(preferredId?: string | null): Promise<void> {
    const nextSites = await window.atoumweb.bridgeSnapshots.listSites();
    setSites(nextSites);
    const target = preferredId ?? site?.id ?? nextSites[0]?.id ?? null;
    if (target && nextSites.some((item) => item.id === target)) await openSite(target);
    else {
      setSite(null);
      setSnapshot(null);
      setPages([]);
      setAllContents([]);
      setPage(null);
    }
  }

  useEffect(() => {
    void refreshSites().catch((reason) => setError(reason instanceof Error ? reason.message : 'Impossible de charger les sites Bridge.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openSite(id: string): Promise<void> {
    try {
      setError(null);
      const detail = await window.atoumweb.bridgeSnapshots.getSite(id);
      setSite(detail);
      const latest = detail.snapshots[0] ?? null;
      setSnapshot(latest);
      setPage(null);
      setTab('structure');
      if (latest) {
        const nextContents = await window.atoumweb.bridgeSnapshots.listPages(latest.id);
        setAllContents(nextContents);
        setPages(nextContents);
      } else {
        setAllContents([]);
        setPages([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir ce site Bridge.');
    }
  }

  async function openSnapshot(next: BridgeSnapshotSummary): Promise<void> {
    try {
      setError(null);
      setSnapshot(next);
      setPage(null);
      setTab('structure');
      const nextContents = await window.atoumweb.bridgeSnapshots.listPages(next.id);
      setAllContents(nextContents);
      setPages(search ? filterBridgeContents(nextContents, search) : nextContents);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger ce snapshot.');
    }
  }

  async function runSearch(value: string): Promise<void> {
    setSearch(value);
    if (!snapshot) return;
    try {
      setPages(filterBridgeContents(allContents, value));
      setPage(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Recherche impossible.');
    }
  }

  async function openPage(item: BridgePageSummary): Promise<void> {
    try {
      setError(null);
      setPage(await window.atoumweb.bridgeSnapshots.getPage(item.pageSnapshotId));
      setTab('structure');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir cette page.');
    }
  }

  async function inspectImport(): Promise<void> {
    setBusy(true);
    try {
      setError(null);
      const next = await window.atoumweb.bridgeSnapshots.inspectImport();
      if (next) setInspection(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Le snapshot Bridge ne peut pas être validé.');
    } finally {
      setBusy(false);
    }
  }

  async function importSnapshot(): Promise<void> {
    if (!inspection) return;
    setBusy(true);
    try {
      setError(null);
      const result = await window.atoumweb.bridgeSnapshots.importSnapshot(inspection.packagePath);
      setInspection(null);
      await refreshSites(result.site.id);
      onMessage(result.alreadyImported
        ? 'Ce snapshot Bridge était déjà importé : aucune duplication créée.'
        : `Snapshot Bridge importé : ${result.site.name} · ${result.snapshot.counts.pages} contenu(s).`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import du snapshot Bridge impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function showObject(objectRef: string): Promise<void> {
    try {
      setError(null);
      setPreview(await window.atoumweb.bridgeSnapshots.getObjectPreview(objectRef));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de lire ce payload.');
    }
  }

  async function exportDiagnostic(): Promise<void> {
    if (!snapshot) return;
    try {
      setError(null);
      const result = await window.atoumweb.bridgeSnapshots.exportDiagnostic(snapshot.id);
      if (!result.cancelled) onMessage(`Diagnostic Bridge exporté : ${result.path ?? 'fichier JSON'}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Export du diagnostic Bridge impossible.');
    }
  }

  const currentWarnings = snapshot?.issues.filter((issue) => issue.severity === 'warning' || issue.severity === 'error' || issue.severity === 'fatal') ?? [];
  const pageStats = useMemo(() => {
    if (!page) return null;
    return {
      modules: page.nodes.filter((node) => node.nodeType === 'module').length,
      sources: page.sources.length,
      assets: page.assets.length,
      dependencies: page.dependencies.length,
    };
  }, [page]);

  const contentBreakdown = useMemo(() => {
    const result = { pages: 0, posts: 0, diviLibrary: 0, themeBuilder: 0, other: 0 };
    allContents.forEach((item) => {
      if (item.postType === 'page') result.pages += 1;
      else if (item.postType === 'post') result.posts += 1;
      else if (item.scope === 'divi_library') result.diviLibrary += 1;
      else if (item.scope === 'theme_builder') result.themeBuilder += 1;
      else result.other += 1;
    });
    return result;
  }, [allContents]);

  return (
    <div className="bridge-page">
      <section className="bridge-toolbar panel">
        <div>
          <span className="eyebrow">AtoumWeb Bridge</span>
          <h2>Copies techniques des sites</h2>
          <p className="muted">Snapshots WordPress / Divi en lecture seule, historiques et séparés de la Bibliothèque AtoumWeb.</p>
        </div>
        <button className="primary-button bridge-import-button" type="button" disabled={busy} onClick={() => void inspectImport()}>
          <OperationIcon name="upload" size={18} />
          {busy ? 'Validation…' : 'Importer un snapshot Bridge'}
        </button>
      </section>

      {error && <div className="bridge-error" role="alert"><OperationIcon name="alert" size={18} /><span>{error}</span><button type="button" onClick={() => setError(null)}>×</button></div>}

      {inspection && <section className="bridge-inspection panel">
        <div className="bridge-inspection-heading">
          <div>
            <span className="eyebrow">Snapshot validé avant import</span>
            <h2>{inspection.site.name}</h2>
            <p>{inspection.site.canonicalUrl ?? inspection.sourceSiteKey}</p>
          </div>
          <span className={`bridge-status ${inspection.scanStatus === 'complete' ? 'ok' : 'warning'}`}>
            <OperationIcon name={inspection.scanStatus === 'complete' ? 'check-circle' : 'alert'} size={17} />
            {scanStatusLabel(inspection.scanStatus)}
          </span>
        </div>
        <div className="bridge-inspection-grid">
          <Metric label="Bridge" value={`v${inspection.bridgeVersion}`} />
          <Metric label="Contenus" value={String(inspection.counts.pages)} />
          <Metric label="Nœuds" value={String(inspection.counts.nodes)} />
          <Metric label="Sources" value={String(inspection.counts.sources)} />
          <Metric label="Assets" value={String(inspection.counts.assets)} />
          <Metric label="Dépendances" value={String(inspection.counts.dependencies)} />
        </div>
        {inspection.issues.length > 0 && <div className="bridge-warning-list">
          {inspection.issues.map((issue, index) => <div key={`${issue.code}-${index}`}><strong>{issue.code}</strong><span>{issue.message}</span></div>)}
        </div>}
        <div className="bridge-inspection-footer">
          <span>Généré le {formatDate(inspection.generatedAt)} · SHA-256 vérifiés</span>
          <div className="button-row">
            <button className="secondary-button" type="button" disabled={busy} onClick={() => setInspection(null)}>Annuler</button>
            <button className="primary-button" type="button" disabled={busy} onClick={() => void importSnapshot()}>
              <OperationIcon name="database" size={17} />Importer dans le Manager
            </button>
          </div>
        </div>
      </section>}

      <section className={`bridge-workspace ${page ? 'with-detail' : ''}`}>
        <aside className="bridge-sites panel">
          <div className="bridge-panel-title"><div><span className="eyebrow">Sites</span><h3>{sites.length} site{sites.length > 1 ? 's' : ''}</h3></div></div>
          {sites.length === 0
            ? <div className="bridge-empty"><OperationIcon name="server" size={30} /><strong>Aucun site importé</strong><span>Importe le premier snapshot produit par AtoumWeb Bridge.</span></div>
            : <div className="bridge-site-list">{sites.map((item) => <button key={item.id} type="button" className={`bridge-site-card ${site?.id === item.id ? 'selected' : ''}`} onClick={() => void openSite(item.id)}>
                <span className="bridge-site-icon"><OperationIcon name="server" size={18} /></span>
                <span><strong>{item.name}</strong><small>{item.latestPageCount} contenus · {item.snapshotCount} snapshot{item.snapshotCount > 1 ? 's' : ''}</small></span>
                <i className={item.latestScanStatus === 'complete' ? 'ok' : 'warning'} />
              </button>)}</div>}
        </aside>

        <div className="bridge-browser panel">
          {!site ? <div className="bridge-empty large"><OperationIcon name="folder" size={38} /><strong>Sélectionne un site</strong><span>Les contenus et snapshots apparaîtront ici.</span></div> : <>
            <div className="bridge-site-header">
              <div><span className="eyebrow">Site collecté</span><h2>{site.name}</h2><p>{site.canonicalUrl ?? site.sourceSiteKey}</p></div>
              <div className="bridge-snapshot-actions">
                <div className="bridge-snapshot-select">
                  <label htmlFor="bridge-snapshot">Snapshot</label>
                  <select id="bridge-snapshot" value={snapshot?.id ?? ''} onChange={(event) => {
                    const next = site.snapshots.find((item) => item.id === event.target.value);
                    if (next) void openSnapshot(next);
                  }}>
                    {site.snapshots.map((item) => <option key={item.id} value={item.id}>{formatDate(item.generatedAt)} · {scanStatusLabel(item.scanStatus)}</option>)}
                  </select>
                </div>
                {snapshot && <button className="secondary-button bridge-diagnostic-button" type="button" onClick={() => void exportDiagnostic()}>
                  <OperationIcon name="file-text" size={16} />Exporter diagnostic
                </button>}
              </div>
            </div>

            {snapshot && <div className="bridge-snapshot-strip">
              <Metric label="Contenus" value={String(snapshot.counts.pages)} />
              <Metric label="Nœuds" value={String(snapshot.counts.nodes)} />
              <Metric label="Sources" value={String(snapshot.counts.sources)} />
              <Metric label="Assets" value={String(snapshot.counts.assets)} />
              <Metric label="Objets" value={String(snapshot.counts.objects)} />
              <span className={`bridge-status ${snapshot.scanStatus === 'complete' ? 'ok' : 'warning'}`}>{scanStatusLabel(snapshot.scanStatus)}</span>
            </div>}

            {snapshot && <div className="bridge-content-breakdown" aria-label="Répartition des contenus importés">
              <span><strong>{allContents.length}</strong><small>contenus importés</small></span>
              <span><strong>{contentBreakdown.pages}</strong><small>pages WordPress</small></span>
              <span><strong>{contentBreakdown.posts}</strong><small>articles</small></span>
              <span><strong>{contentBreakdown.diviLibrary}</strong><small>bibliothèque Divi</small></span>
              <span><strong>{contentBreakdown.themeBuilder}</strong><small>Theme Builder</small></span>
              <span><strong>{contentBreakdown.other}</strong><small>autres / plugins</small></span>
            </div>}

            {currentWarnings.length > 0 && <details className="bridge-snapshot-warnings">
              <summary><OperationIcon name="alert" size={16} />{currentWarnings.length} avertissement{currentWarnings.length > 1 ? 's' : ''} conservé{currentWarnings.length > 1 ? 's' : ''}</summary>
              <div>{currentWarnings.map((issue, index) => <p key={`${issue.code}-${index}`}><strong>{issue.code}</strong> — {issue.message}</p>)}</div>
            </details>}

            {snapshot && <details className="bridge-snapshot-technical">
              <summary><OperationIcon name="shield-check" size={16} />Périmètre technique du snapshot</summary>
              <div className="bridge-tech-grid">
                <div><strong>Capacités Bridge</strong><span>{trueKeys(snapshot.scannerCapabilities).join(' · ') || 'Non renseigné'}</span></div>
                <div><strong>Contenu observé</strong><span>{trueKeys(snapshot.observedContent).join(' · ') || 'Non renseigné'}</span></div>
                <div><strong>Couverture</strong><span>{Object.keys(snapshot.coverage).join(' · ') || 'Non renseignée'}</span></div>
                <div><strong>Sécurité</strong><span>{snapshot.security.redaction_applied === true ? 'Redaction appliquée' : 'Redaction non annoncée'} · payloads en lecture seule</span></div>
              </div>
            </details>}

            <div className="bridge-page-tools">
              <div className="search-field"><OperationIcon name="folder" size={16} /><input value={search} onChange={(event) => void runSearch(event.target.value)} placeholder="Rechercher un contenu, un type, un slug…" /></div>
              <span>{pages.length} résultat{pages.length > 1 ? 's' : ''}</span>
            </div>

            <div className="bridge-page-list">
              {pages.map((item) => <button key={item.pageSnapshotId} type="button" className={`bridge-page-row ${page?.page.pageSnapshotId === item.pageSnapshotId ? 'selected' : ''}`} onClick={() => void openPage(item)}>
                <span className="bridge-page-type">{item.postType}</span>
                <span className="bridge-page-copy"><strong>{item.title}</strong><small>{item.slug || item.sourcePageKey}</small></span>
                <span className="bridge-page-builder">{item.builderGeneration === '4' ? 'Divi 4' : item.builderGeneration === '5' ? 'Divi 5' : item.builder ?? 'WordPress'}</span>
                <span className="bridge-page-count">{item.nodeCount} nœuds</span>
              </button>)}
              {snapshot && pages.length === 0 && <div className="bridge-empty"><strong>Aucun contenu</strong><span>Aucun contenu ne correspond à cette recherche.</span></div>}
            </div>
          </>}
        </div>

        {page && <article className="bridge-detail panel">
          <div className="bridge-detail-header">
            <div><span className="eyebrow">{page.page.postType} · {page.page.status ?? '—'}</span><h2>{page.page.title}</h2><p>{page.page.canonicalUrl ?? page.page.sourcePageKey}</p></div>
            <button className="icon-button" type="button" aria-label="Fermer la fiche" title="Fermer la fiche" onClick={() => setPage(null)}><OperationIcon name="close" size={18} /></button>
          </div>

          {pageStats && <div className="bridge-detail-kpis">
            <Metric label="Nœuds" value={String(page.page.nodeCount)} />
            <Metric label="Modules" value={String(pageStats.modules)} />
            <Metric label="Sources" value={String(pageStats.sources)} />
            <Metric label="Assets" value={String(pageStats.assets)} />
          </div>}

          <div className="bridge-tabs">
            <button type="button" className={tab === 'structure' ? 'active' : ''} onClick={() => setTab('structure')}>Structure</button>
            <button type="button" className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>Sources</button>
            <button type="button" className={tab === 'assets' ? 'active' : ''} onClick={() => setTab('assets')}>Assets</button>
            <button type="button" className={tab === 'dependencies' ? 'active' : ''} onClick={() => setTab('dependencies')}>Dépendances</button>
          </div>

          <div className="bridge-detail-body">
            {tab === 'structure' && <div className="bridge-tree">
              {page.nodes.map((node) => <div className="bridge-node" key={node.occurrenceId} style={{ paddingLeft: `${12 + node.depth * 18}px` }}>
                <span className="bridge-node-kind">{node.nodeType}</span>
                <span><strong>{node.label || node.moduleType || node.nodeType}</strong><small>{node.moduleType ?? node.builder ?? ''}</small></span>
                <div className="bridge-node-actions">
                  {node.contentObjectRef && <button type="button" title="Voir le contenu" onClick={() => void showObject(node.contentObjectRef!)}><OperationIcon name="code" size={15} /></button>}
                  {node.rawObjectRef && <button type="button" title="Voir la source brute" onClick={() => void showObject(node.rawObjectRef!)}><OperationIcon name="file-text" size={15} /></button>}
                </div>
              </div>)}
            </div>}

            {tab === 'sources' && <div className="bridge-source-list">
              {page.sources.map((source) => <div className="bridge-source" key={source.sourceId}>
                <span className="bridge-source-icon"><OperationIcon name="code" size={17} /></span>
                <span><strong>{source.kind.toUpperCase()} · {source.origin}</strong><small>{source.scope} · {source.owner}{source.lines != null ? ` · ${source.lines} lignes` : ''}</small></span>
                {source.payloadObjectRef && <button className="secondary-button" type="button" onClick={() => void showObject(source.payloadObjectRef!)}>Voir</button>}
              </div>)}
              {page.sources.length === 0 && <div className="bridge-empty"><strong>Aucune source spécifique</strong><span>Cette page ne référence pas de source CSS / JS / HTML distincte.</span></div>}
            </div>}

            {tab === 'assets' && <div className="bridge-source-list">
              {page.assets.map((asset) => <div className="bridge-source" key={asset.assetId}>
                <span className="bridge-source-icon"><OperationIcon name={asset.type === 'image' ? 'image' : 'file-text'} size={17} /></span>
                <span><strong>{asset.type} · {asset.mimeType ?? 'type inconnu'}</strong><small>{asset.url ?? asset.localPath ?? asset.assetId}{asset.width ? ` · ${asset.width}×${asset.height ?? '?'}` : ''}</small></span>
                <span className="status-pill">{asset.archiveMode ?? 'référence'}</span>
              </div>)}
              {page.assets.length === 0 && <div className="bridge-empty"><strong>Aucun asset lié</strong><span>Aucun média structuré n’est rattaché à cette page.</span></div>}
            </div>}

            {tab === 'dependencies' && <div className="bridge-source-list">
              {page.dependencies.map((dependency) => <div className="bridge-source" key={dependency.dependencyId}>
                <span className="bridge-source-icon"><OperationIcon name="package" size={17} /></span>
                <span><strong>{dependency.name}</strong><small>{dependency.type}{dependency.version ? ` · v${dependency.version}` : ''}{dependency.slug ? ` · ${dependency.slug}` : ''}</small></span>
                {dependency.active != null && <span className="status-pill">{dependency.active ? 'Actif' : 'Inactif'}</span>}
              </div>)}
              {page.dependencies.length === 0 && <div className="bridge-empty"><strong>Aucune dépendance liée</strong><span>Aucune dépendance structurée n’est rattachée à cette page.</span></div>}
            </div>}
          </div>
        </article>}
      </section>

      {preview && <div className="bridge-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <section className="bridge-preview panel" role="dialog" aria-modal="true" aria-label="Aperçu du payload Bridge">
          <div className="bridge-detail-header">
            <div><span className="eyebrow">Payload en lecture seule</span><h2>{preview.contentType ?? preview.serialization ?? 'Objet Bridge'}</h2><p>{preview.objectRef}</p></div>
            <button className="icon-button" type="button" aria-label="Fermer" onClick={() => setPreview(null)}><OperationIcon name="close" size={18} /></button>
          </div>
          {preview.available
            ? preview.text != null
              ? <pre>{preview.text}{preview.truncated ? '\n\n[… aperçu limité à 256 Ko …]' : ''}</pre>
              : <div className="bridge-empty"><strong>Objet binaire</strong><span>Le payload est bien conservé, mais son contenu n’est pas rendu dans l’interface.</span></div>
            : <div className="bridge-empty"><strong>Payload introuvable</strong><span>Les métadonnées existent mais le fichier n’est plus disponible dans le workspace.</span></div>}
        </section>
      </div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bridge-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function filterBridgeContents(contents: BridgePageSummary[], query: string): BridgePageSummary[] {
  const needle = query.trim().toLocaleLowerCase('fr-FR');
  if (!needle) return contents;
  return contents.filter((item) => [
    item.title,
    item.slug ?? '',
    item.postType,
    item.scope ?? '',
    item.builder ?? '',
    item.builderGeneration ?? '',
    item.sourcePageKey,
    item.canonicalUrl ?? '',
  ].join(' ').toLocaleLowerCase('fr-FR').includes(needle));
}

function scanStatusLabel(value: string): string {
  if (value === 'complete') return 'Complet';
  if (value === 'complete_with_warnings') return 'Complet avec avertissements';
  if (value === 'partial_failure') return 'Partiel avec erreurs';
  if (value === 'failed') return 'Échec';
  return value;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}


function trueKeys(value: Record<string, unknown>): string[] {
  return Object.entries(value).filter(([, enabled]) => enabled === true).map(([key]) => key);
}

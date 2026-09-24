import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type {
  BridgeModulePreview,
  BridgeObjectPreview,
  BridgePagePreview,
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

type ContentView = 'pages' | 'posts' | 'diviLibrary' | 'themeBuilder' | 'other' | 'all';
type ModulePreviewTab = 'preview' | 'html' | 'css' | 'js' | 'divi';

export function BridgeSitesPage({ onMessage }: Props) {
  const [sites, setSites] = useState<BridgeSiteSummary[]>([]);
  const [site, setSite] = useState<BridgeSiteDetail | null>(null);
  const [snapshot, setSnapshot] = useState<BridgeSnapshotSummary | null>(null);
  const [contents, setContents] = useState<BridgePageSummary[]>([]);
  const [allContents, setAllContents] = useState<BridgePageSummary[]>([]);
  const [page, setPage] = useState<BridgePageSnapshotDetail | null>(null);
  const [inspection, setInspection] = useState<BridgeSnapshotInspection | null>(null);
  const [preview, setPreview] = useState<BridgeObjectPreview | null>(null);
  const [modulePreview, setModulePreview] = useState<BridgeModulePreview | null>(null);
  const [moduleAnalyses, setModuleAnalyses] = useState<Record<string, BridgeModulePreview>>({});
  const [pagePreview, setPagePreview] = useState<BridgePagePreview | null>(null);
  const [libraryCandidate, setLibraryCandidate] = useState<BridgeModulePreview | null>(null);
  const [modulePreviewTab, setModulePreviewTab] = useState<ModulePreviewTab>('preview');
  const [search, setSearch] = useState('');
  const [contentView, setContentView] = useState<ContentView>('pages');
  const [splitPercent, setSplitPercent] = useState(62);
  const [detailExpanded, setDetailExpanded] = useState(false);
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
      setContents([]);
      setAllContents([]);
      setPage(null);
      setDetailExpanded(false);
      setModuleAnalyses({});
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
      setDetailExpanded(false);
      setModuleAnalyses({});
      setSearch('');
      setContentView('pages');
      if (latest) {
        const nextContents = await window.atoumweb.bridgeSnapshots.listPages(latest.id);
        setAllContents(nextContents);
        setContents(filterBridgeContents(nextContents, 'pages', ''));
      } else {
        setAllContents([]);
        setContents([]);
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
      setDetailExpanded(false);
      setSearch('');
      setContentView('pages');
      const nextContents = await window.atoumweb.bridgeSnapshots.listPages(next.id);
      setAllContents(nextContents);
      setContents(filterBridgeContents(nextContents, 'pages', ''));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger ce snapshot.');
    }
  }

  function applyContentFilter(nextView: ContentView, nextSearch: string): void {
    setContentView(nextView);
    setSearch(nextSearch);
    setContents(filterBridgeContents(allContents, nextView, nextSearch));
    setPage(null);
    setDetailExpanded(false);
  }

  async function openPage(item: BridgePageSummary): Promise<void> {
    try {
      setError(null);
      const detail = await window.atoumweb.bridgeSnapshots.getPage(item.pageSnapshotId);
      setPage(detail);
      setDetailExpanded(false);
      const codeNodes = detail.nodes.filter((node) => node.nodeType === 'module' && isCustomCodeModule(node.moduleType));
      const previews = await Promise.all(codeNodes.map((node) =>
        window.atoumweb.bridgeSnapshots.getModulePreview(item.pageSnapshotId, node.occurrenceId)
          .then((preview) => [node.occurrenceId, preview] as const)
          .catch(() => null),
      ));
      setModuleAnalyses(Object.fromEntries(previews.filter((entry): entry is readonly [string, BridgeModulePreview] => entry !== null)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir ce contenu.');
    }
  }

  function closePage(): void {
    setPage(null);
    setModuleAnalyses({});
    setDetailExpanded(false);
  }

  function beginResize(splitter: HTMLElement): void {
    const workspace = splitter.parentElement;
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const requested = ((event.clientX - rect.left) / rect.width) * 100;
      const maxForDetail = ((rect.width - 360) / rect.width) * 100;
      const maxPercent = Math.max(54, Math.min(72, maxForDetail));
      setSplitPercent(Math.max(42, Math.min(maxPercent, requested)));
    };
    const onUp = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
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
      setError(reason instanceof Error ? reason.message : 'Impossible de lire ce contenu.');
    }
  }

  async function showModule(occurrenceId: string): Promise<void> {
    if (!page) return;
    try {
      setError(null);
      const next = await window.atoumweb.bridgeSnapshots.getModulePreview(page.page.pageSnapshotId, occurrenceId);
      setModulePreview(next);
      setModulePreviewTab('preview');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de reconstruire ce module.');
    }
  }

  async function showPagePreview(): Promise<void> {
    if (!page) return;
    try {
      setError(null);
      setPagePreview(await window.atoumweb.bridgeSnapshots.getPagePreview(page.page.pageSnapshotId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de reconstruire cette page.');
    }
  }

  async function createLibraryCandidate(candidate: BridgeModulePreview): Promise<void> {
    try {
      setError(null);
      const bundle = {
        schemaVersion: 1,
        kind: 'atoumweb-bridge-library-candidate',
        origin: {
          site: site?.name ?? null,
          page: candidate.pageTitle,
          pageUrl: candidate.pageUrl,
          snapshotId: snapshot?.externalSnapshotId ?? null,
          snapshotDate: snapshot?.generatedAt ?? null,
          builderGeneration: candidate.builderGeneration,
          occurrenceId: candidate.occurrenceId,
        },
        original: {
          html: candidate.html,
          cssModule: candidate.moduleCss,
          cssPage: candidate.pageCss,
          cssGlobal: candidate.globalCss,
          javascript: candidate.javascript,
          diviSource: candidate.diviSource,
        },
        prepared: {
          cssPageUseful: candidate.reuse.relevantPageCss,
          cssGlobalUseful: candidate.reuse.relevantGlobalCss,
          rootClasses: candidate.reuse.rootClasses,
          instructions: candidate.reuse.instructions,
          notes: candidate.reuse.notes,
        },
      };
      const created = await window.atoumweb.referentials.library.create(
        {
          category: candidate.reuse.suggestedCategory,
          name: candidate.reuse.suggestedName,
          reuseStatus: 'adapt',
          description: `Candidat préparé depuis ${site?.name ?? 'un site Bridge'} → ${candidate.pageTitle}. La version originale est conservée avant nettoyage et généralisation.`,
          tags: ['bridge', 'snapshot', candidate.builderGeneration === '5' ? 'divi5' : 'divi4', ...candidate.reuse.rootClasses.slice(0, 4)],
        },
        {
          contentType: 'json',
          language: 'json',
          contentText: JSON.stringify(bundle, null, 2),
          notes: 'V1 — Source originale du site. À nettoyer puis généraliser avant de marquer le composant comme prêt à réutiliser.',
        },
      );
      setLibraryCandidate(null);
      onMessage(`Candidat « ${created.name} » ajouté à la Bibliothèque AtoumWeb avec sa source originale.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de préparer ce composant pour la Bibliothèque.');
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
    const customCodeModules = page.nodes.filter((node) => node.nodeType === 'module' && isCustomCodeModule(node.moduleType)).length;
    return {
      modules: page.nodes.filter((node) => node.nodeType === 'module').length,
      customCodeModules,
      assets: page.assets.length,
    };
  }, [page]);

  const contentBreakdown = useMemo(() => {
    const result = { pages: 0, posts: 0, diviLibrary: 0, themeBuilder: 0, other: 0 };
    allContents.forEach((item) => { result[contentCategory(item)] += 1; });
    return result;
  }, [allContents]);

  const workspaceStyle = page && !detailExpanded
    ? { gridTemplateColumns: `${splitPercent}% 8px minmax(340px, 1fr)` }
    : undefined;

  return (
    <div className="bridge-page">
      <section className="bridge-toolbar panel">
        <div>
          <span className="eyebrow">Sites AtoumWeb</span>
          <h2>Copies des sites</h2>
          <p className="muted">Une photographie lisible de chaque site. Les informations techniques restent disponibles sans encombrer le travail courant.</p>
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
            <span className="eyebrow">Prêt à importer</span>
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
          <Metric label="Contenus trouvés" value={String(inspection.counts.pages)} />
          <Metric label="Date de la copie" value={formatDate(inspection.generatedAt)} />
        </div>
        {inspection.issues.length > 0 && <details className="bridge-snapshot-warnings">
          <summary><OperationIcon name="alert" size={16} />{inspection.issues.length} information{inspection.issues.length > 1 ? 's' : ''} technique{inspection.issues.length > 1 ? 's' : ''}</summary>
          <div>{inspection.issues.map((issue, index) => <p key={`${issue.code}-${index}`}><strong>{issue.code}</strong> — {issue.message}</p>)}</div>
        </details>}
        <div className="bridge-inspection-footer">
          <span>Le snapshot reste une copie en lecture seule dans le Manager.</span>
          <div className="button-row">
            <button className="secondary-button" type="button" disabled={busy} onClick={() => setInspection(null)}>Annuler</button>
            <button className="primary-button" type="button" disabled={busy} onClick={() => void importSnapshot()}>
              <OperationIcon name="database" size={17} />Importer dans le Manager
            </button>
          </div>
        </div>
      </section>}

      <section className={`bridge-workspace ${page ? 'with-detail' : ''} ${detailExpanded ? 'detail-expanded' : ''}`} style={workspaceStyle}>
        {!detailExpanded && <div className="bridge-master">
          <aside className="bridge-sites panel">
            <div className="bridge-panel-title"><div><span className="eyebrow">Mes sites</span><h3>{sites.length} site{sites.length > 1 ? 's' : ''}</h3></div></div>
            {sites.length === 0
              ? <div className="bridge-empty"><OperationIcon name="server" size={30} /><strong>Aucun site importé</strong><span>Importe le premier snapshot produit par AtoumWeb Bridge.</span></div>
              : <div className="bridge-site-list">{sites.map((item) => <button key={item.id} type="button" className={`bridge-site-card ${site?.id === item.id ? 'selected' : ''}`} onClick={() => void openSite(item.id)}>
                  <span className="bridge-site-icon"><OperationIcon name="server" size={18} /></span>
                  <span><strong>{item.name}</strong><small>{item.snapshotCount} copie{item.snapshotCount > 1 ? 's' : ''} enregistrée{item.snapshotCount > 1 ? 's' : ''}</small></span>
                  <i className={item.latestScanStatus === 'complete' ? 'ok' : 'warning'} />
                </button>)}</div>}
          </aside>

          <div className="bridge-browser panel">
            {!site ? <div className="bridge-empty large"><OperationIcon name="folder" size={38} /><strong>Sélectionne un site</strong><span>Ses pages apparaîtront ici.</span></div> : <>
              <div className="bridge-site-header">
                <div><span className="eyebrow">Site sauvegardé</span><h2>{site.name}</h2><p>{site.canonicalUrl ?? site.sourceSiteKey}</p></div>
                <div className="bridge-snapshot-select">
                  <label htmlFor="bridge-snapshot">Copie du site</label>
                  <select id="bridge-snapshot" value={snapshot?.id ?? ''} onChange={(event) => {
                    const next = site.snapshots.find((item) => item.id === event.target.value);
                    if (next) void openSnapshot(next);
                  }}>
                    {site.snapshots.map((item) => <option key={item.id} value={item.id}>{formatDate(item.generatedAt)}</option>)}
                  </select>
                </div>
              </div>

              {snapshot && <div className="bridge-content-tabs" role="tablist" aria-label="Contenus du site">
                <ContentTab label="Pages" count={contentBreakdown.pages} active={contentView === 'pages'} onClick={() => applyContentFilter('pages', search)} />
                <ContentTab label="Articles" count={contentBreakdown.posts} active={contentView === 'posts'} onClick={() => applyContentFilter('posts', search)} />
                <ContentTab label="Bibliothèque Divi" count={contentBreakdown.diviLibrary} active={contentView === 'diviLibrary'} onClick={() => applyContentFilter('diviLibrary', search)} />
                <ContentTab label="Theme Builder" count={contentBreakdown.themeBuilder} active={contentView === 'themeBuilder'} onClick={() => applyContentFilter('themeBuilder', search)} />
                <ContentTab label="Autres" count={contentBreakdown.other} active={contentView === 'other'} onClick={() => applyContentFilter('other', search)} />
                <ContentTab label="Tout" count={allContents.length} active={contentView === 'all'} onClick={() => applyContentFilter('all', search)} />
              </div>}

              <div className="bridge-page-tools">
                <div className="search-field"><OperationIcon name="folder" size={16} /><input value={search} onChange={(event) => applyContentFilter(contentView, event.target.value)} placeholder="Rechercher dans cette rubrique…" /></div>
                <span>{contents.length} élément{contents.length > 1 ? 's' : ''}</span>
              </div>

              <div className="bridge-page-list">
                {contents.map((item) => <button key={item.pageSnapshotId} type="button" className={`bridge-page-row ${page?.page.pageSnapshotId === item.pageSnapshotId ? 'selected' : ''}`} onClick={() => void openPage(item)}>
                  <span className={`bridge-page-status ${item.status === 'publish' ? 'published' : ''}`}>{statusLabel(item.status)}</span>
                  <span className="bridge-page-copy"><strong>{item.title}</strong><small>{item.canonicalUrl ?? item.slug ?? item.sourcePageKey}</small></span>
                  <span className="bridge-page-builder">{builderLabel(item)}</span>
                </button>)}
                {snapshot && contents.length === 0 && <div className="bridge-empty"><strong>Aucun élément</strong><span>Aucun contenu ne correspond à cette rubrique ou à cette recherche.</span></div>}
              </div>

              {snapshot && <details className="bridge-snapshot-technical">
                <summary><OperationIcon name="wrench" size={16} />Diagnostic technique de cette copie</summary>
                <div className="bridge-tech-summary">
                  <Metric label="Contenus" value={String(snapshot.counts.pages)} />
                  <Metric label="Nœuds Divi/WordPress" value={String(snapshot.counts.nodes)} />
                  <Metric label="Sources" value={String(snapshot.counts.sources)} />
                  <Metric label="Assets" value={String(snapshot.counts.assets)} />
                </div>
                {currentWarnings.length > 0 && <div className="bridge-warning-list">{currentWarnings.map((issue, index) => <div key={`${issue.code}-${index}`}><strong>{issue.code}</strong><span>{issue.message}</span></div>)}</div>}
                <div className="bridge-tech-actions">
                  <button className="secondary-button" type="button" onClick={() => void exportDiagnostic()}><OperationIcon name="file-text" size={16} />Exporter le diagnostic</button>
                  <span>Bridge v{snapshot.bridgeVersion} · {scanStatusLabel(snapshot.scanStatus)}</span>
                </div>
              </details>}
            </>}
          </div>
        </div>}

        {page && !detailExpanded && <div
          className="operation-splitter bridge-workspace-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la liste des pages et la fiche"
          tabIndex={0}
          onPointerDown={(event) => { event.stopPropagation(); beginResize(event.currentTarget); }}
          onDoubleClick={() => setSplitPercent(62)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(42, value - 3));
            if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(72, value + 3));
          }}
        ><span /></div>}

        {page && <article className={`bridge-detail panel ${detailExpanded ? 'expanded' : ''}`}>
          <div className="bridge-detail-header">
            <div>
              <span className="eyebrow">{contentTypeLabel(page.page)} · {statusLabel(page.page.status)}</span>
              <h2>{page.page.title}</h2>
              <p>{page.page.canonicalUrl ?? page.page.slug ?? page.page.sourcePageKey}</p>
            </div>
            <div className="bridge-detail-actions">
              <button className="primary-button bridge-page-preview-button" type="button" onClick={() => void showPagePreview()}><OperationIcon name="image" size={16} />Visualiser la page</button>
              <button className="operation-detail-expand" type="button" title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}><OperationIcon name={detailExpanded ? 'collapse' : 'expand'} size={18} /></button>
              <button className="close-detail" type="button" aria-label="Fermer la fiche" title="Fermer" onClick={closePage}><OperationIcon name="close" size={18} /></button>
            </div>
          </div>

          {pageStats && <div className="bridge-page-summary">
            <span><strong>{builderLabel(page.page)}</strong><small>construction détectée</small></span>
            <span><strong>{pageStats.modules}</strong><small>modules</small></span>
            <span><strong>{pageStats.customCodeModules}</strong><small>modules Code</small></span>
            <span><strong>{pageStats.assets}</strong><small>médias liés</small></span>
          </div>}

          <div className="bridge-detail-intro">
            <strong>Construction de la page</strong>
            <span>Les éléments internes de Divi sont conservés mais simplifiés ici. Ouvre un module Code pour voir son rendu reconstruit et ce qui se trouve derrière.</span>
          </div>

          <div className="bridge-detail-body">
            <div className="bridge-tree">
              {page.nodes.map((node) => {
                const customCode = node.nodeType === 'module' && isCustomCodeModule(node.moduleType);
                const analysis = customCode ? moduleAnalyses[node.occurrenceId] : null;
                return <div className={`bridge-node ${customCode ? 'custom-code' : ''}`} key={node.occurrenceId} style={{ '--bridge-depth': Math.min(node.depth, 8) } as CSSProperties}>
                  <span className="bridge-node-kind">{nodeTypeLabel(node.nodeType)}</span>
                  <span className="bridge-node-copy">
                    <strong>{analysis?.reuse.suggestedName ?? humanNodeLabel(node.label, node.moduleType, node.nodeType)}</strong>
                    {customCode
                      ? <small className="bridge-reuse-summary">
                          <span className={`bridge-reuse-status ${analysis?.reuse.status ?? 'review'}`}>{reuseStatusLabel(analysis?.reuse.status)}</span>
                          <span>{analysis ? reuseDependencySummary(analysis) : 'Analyse en cours…'}</span>
                        </small>
                      : <small>{builderNodeHint(node.moduleType, node.builder)}</small>}
                  </span>
                  <div className="bridge-node-actions">
                    {customCode && <button className="secondary-button bridge-code-button" type="button" onClick={() => void showModule(node.occurrenceId)}><OperationIcon name="image" size={15} />Voir</button>}
                    {customCode && analysis && <button className="secondary-button bridge-library-button" type="button" onClick={() => setLibraryCandidate(analysis)}><OperationIcon name="folder" size={15} />Bibliothèque</button>}
                    {!customCode && node.contentObjectRef && <button className="icon-button" type="button" title="Voir le contenu enregistré" onClick={() => void showObject(node.contentObjectRef!)}><OperationIcon name="file-text" size={15} /></button>}
                  </div>
                </div>;
              })}
            </div>

            <details className="bridge-page-technical">
              <summary><OperationIcon name="wrench" size={15} />Code et ressources associés à la page</summary>
              <div className="bridge-page-technical-grid">
                <section>
                  <h4>CSS / JS / sources</h4>
                  {page.sources.length === 0 ? <p className="muted">Aucune source spécifique rattachée à cette page.</p> : page.sources.map((source) => <div className="bridge-source" key={source.sourceId}>
                    <span className="bridge-source-icon"><OperationIcon name="code" size={17} /></span>
                    <span><strong>{source.kind.toUpperCase()} · {sourceOriginLabel(source.origin)}</strong><small>{sourceScopeLabel(source.scope)}</small></span>
                    {source.payloadObjectRef && <button className="secondary-button" type="button" onClick={() => void showObject(source.payloadObjectRef!)}>Voir</button>}
                  </div>)}
                </section>
                <section>
                  <h4>Médias</h4>
                  {page.assets.length === 0 ? <p className="muted">Aucun média structuré rattaché.</p> : page.assets.map((asset) => <div className="bridge-source" key={asset.assetId}>
                    <span className="bridge-source-icon"><OperationIcon name={asset.type === 'image' ? 'image' : 'file-text'} size={17} /></span>
                    <span><strong>{asset.type}</strong><small>{asset.url ?? asset.localPath ?? asset.assetId}</small></span>
                  </div>)}
                </section>
              </div>
              {page.dependencies.length > 0 && <div className="bridge-dependencies"><strong>Dépendances détectées</strong><span>{page.dependencies.map((dependency) => dependency.name).join(' · ')}</span></div>}
            </details>
          </div>
        </article>}
      </section>

      {pagePreview && <div className="bridge-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPagePreview(null); }}>
        <section className="bridge-preview bridge-page-preview-modal panel" role="dialog" aria-modal="true" aria-label="Visualisation reconstruite de la page">
          <div className="bridge-detail-header">
            <div><span className="eyebrow">Page complète · {pagePreview.builderGeneration === '5' ? 'Divi 5' : pagePreview.builderGeneration === '4' ? 'Divi 4' : 'WordPress'}</span><h2>{pagePreview.title}</h2><p>{pagePreview.url}</p></div>
            <button className="close-detail" type="button" aria-label="Fermer" onClick={() => setPagePreview(null)}><OperationIcon name="close" size={18} /></button>
          </div>
          <div className="bridge-preview-confidence reconstructed">
            <OperationIcon name="alert" size={16} />
            <span>Rendu reconstruit depuis le snapshot Bridge : {pagePreview.renderedModuleCount} module(s) affiché(s) sur {pagePreview.totalModuleCount}. {pagePreview.omittedModuleCount > 0 ? `${pagePreview.omittedModuleCount} élément(s) Divi non reconstructible(s) automatiquement peuvent manquer.` : 'Tous les modules détectés ont pu être reconstruits.'}</span>
          </div>
          <iframe className="bridge-html-preview bridge-page-html-preview" sandbox="" title={`Visualisation de ${pagePreview.title}`} srcDoc={buildReconstructedPagePreview(pagePreview)} />
        </section>
      </div>}

      {modulePreview && <div className="bridge-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModulePreview(null); }}>
        <section className="bridge-preview bridge-module-preview panel" role="dialog" aria-modal="true" aria-label="Aperçu reconstruit du module">
          <div className="bridge-detail-header">
            <div>
              <span className="eyebrow">Module du snapshot · {modulePreview.builderGeneration === '5' ? 'Divi 5' : modulePreview.builderGeneration === '4' ? 'Divi 4' : 'Divi'}</span>
              <h2>{modulePreview.reuse.suggestedName}</h2>
              <p>{modulePreview.pageTitle}{modulePreview.pageUrl ? ` · ${modulePreview.pageUrl}` : ''}</p>
            </div>
            <button className="close-detail" type="button" aria-label="Fermer" onClick={() => setModulePreview(null)}><OperationIcon name="close" size={18} /></button>
          </div>

          <div className={`bridge-preview-confidence ${modulePreview.frontendValidated ? 'validated' : 'reconstructed'}`}>
            <OperationIcon name={modulePreview.frontendValidated ? 'check-circle' : 'alert'} size={16} />
            <span>{modulePreview.frontendValidated
              ? 'Aperçu reconstruit à partir des sources Bridge avec contrôle frontend joint au snapshot.'
              : 'Aperçu reconstruit — ce n’est pas une capture exacte du site. Bridge n’a pas joint de contrôle frontend pour ce snapshot.'}</span>
          </div>

          <div className="bridge-reuse-banner">
            <div><strong>{reuseStatusLabel(modulePreview.reuse.status)}</strong><span>{reuseDependencySummary(modulePreview)}</span></div>
            <button className="primary-button" type="button" onClick={() => setLibraryCandidate(modulePreview)}><OperationIcon name="folder" size={16} />Préparer pour la Bibliothèque</button>
          </div>

          <div className="bridge-preview-layers" aria-label="Éléments nécessaires pour la réutilisation">
            <span className={modulePreview.html ? 'present' : ''}>HTML <strong>{modulePreview.html ? 'oui' : '—'}</strong></span>
            <span className={modulePreview.moduleCss ? 'present' : ''}>CSS module <strong>{modulePreview.moduleCss ? 'oui' : '—'}</strong></span>
            <span className={modulePreview.reuse.relevantPageRuleCount ? 'present' : ''}>CSS page utile <strong>{modulePreview.reuse.relevantPageRuleCount}/{modulePreview.reuse.pageCssRuleCount}</strong></span>
            <span className={modulePreview.reuse.relevantGlobalRuleCount ? 'present' : ''}>CSS global utile <strong>{modulePreview.reuse.relevantGlobalRuleCount}/{modulePreview.reuse.globalCssRuleCount}</strong></span>
            <span className={modulePreview.javascript ? 'warning' : ''}>JavaScript <strong>{modulePreview.javascript ? 'à vérifier' : 'aucun'}</strong></span>
          </div>

          <div className="bridge-preview-modes" role="tablist" aria-label="Voir le module">
            <PreviewTab label="Aperçu" active={modulePreviewTab === 'preview'} onClick={() => setModulePreviewTab('preview')} />
            <PreviewTab label="HTML" active={modulePreviewTab === 'html'} onClick={() => setModulePreviewTab('html')} />
            <PreviewTab label="CSS" active={modulePreviewTab === 'css'} onClick={() => setModulePreviewTab('css')} />
            {modulePreview.javascript && <PreviewTab label="JS" active={modulePreviewTab === 'js'} onClick={() => setModulePreviewTab('js')} />}
            {modulePreview.diviSource && <PreviewTab label="Source Divi originale" active={modulePreviewTab === 'divi'} onClick={() => setModulePreviewTab('divi')} />}
          </div>

          <div className="bridge-module-preview-body">
            {modulePreviewTab === 'preview' && <iframe className="bridge-html-preview" sandbox="" title="Aperçu reconstruit du module" srcDoc={buildReconstructedPreview(modulePreview)} />}
            {modulePreviewTab === 'html' && <CodePanel title="HTML du module" content={modulePreview.html} empty="Aucun HTML séparé n’a été fourni pour ce module." />}
            {modulePreviewTab === 'css' && <div className="bridge-css-use">
              <div className="bridge-css-layers">
                <CodePanel title="CSS du module — à emporter" content={modulePreview.moduleCss} empty="Aucun CSS propre à ce module." />
                <CodePanel title={`CSS de page utile — ${modulePreview.reuse.relevantPageRuleCount}/${modulePreview.reuse.pageCssRuleCount} règle(s)`} content={modulePreview.reuse.relevantPageCss} empty="Le CSS de page existe, mais aucune règle propre à ce composant n’a été détectée." />
                <CodePanel title={`CSS global utile — ${modulePreview.reuse.relevantGlobalRuleCount}/${modulePreview.reuse.globalCssRuleCount} règle(s)`} content={modulePreview.reuse.relevantGlobalCss} empty="Le CSS global existe, mais aucune règle propre à ce composant n’a été détectée." />
              </div>
              <details className="bridge-original-css">
                <summary>Voir les CSS source complets conservés dans le snapshot</summary>
                <div className="bridge-css-layers">
                  <CodePanel title="CSS de page original" content={modulePreview.pageCss} empty="Aucun CSS de page." />
                  <CodePanel title="CSS global original" content={modulePreview.globalCss} empty="Aucun CSS global." />
                </div>
              </details>
            </div>}
            {modulePreviewTab === 'js' && <><div className="bridge-js-warning"><OperationIcon name="shield-check" size={16} />JavaScript conservé mais non exécuté dans l’aperçu.</div><CodePanel title="JavaScript du module" content={modulePreview.javascript} empty="Aucun JavaScript." /></>}
            {modulePreviewTab === 'divi' && <CodePanel title="Source Divi originale" content={modulePreview.diviSource ?? ''} empty="Aucune source Divi brute disponible." />}
          </div>
        </section>
      </div>}

      {libraryCandidate && <div className="bridge-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLibraryCandidate(null); }}>
        <section className="bridge-preview bridge-library-candidate panel" role="dialog" aria-modal="true" aria-label="Préparer pour la Bibliothèque AtoumWeb">
          <div className="bridge-detail-header">
            <div><span className="eyebrow">Candidat Bibliothèque AtoumWeb</span><h2>{libraryCandidate.reuse.suggestedName}</h2><p>{site?.name} → {libraryCandidate.pageTitle}</p></div>
            <button className="close-detail" type="button" aria-label="Fermer" onClick={() => setLibraryCandidate(null)}><OperationIcon name="close" size={18} /></button>
          </div>
          <div className="bridge-candidate-grid">
            <div><span>Type proposé</span><strong>{libraryCategoryLabel(libraryCandidate.reuse.suggestedCategory)}</strong></div>
            <div><span>État</span><strong>{reuseStatusLabel(libraryCandidate.reuse.status)}</strong></div>
            <div><span>HTML</span><strong>{libraryCandidate.html ? 'Disponible' : 'À analyser'}</strong></div>
            <div><span>CSS module</span><strong>{libraryCandidate.moduleCss ? 'À emporter' : 'Aucun'}</strong></div>
            <div><span>CSS page utile</span><strong>{libraryCandidate.reuse.relevantPageRuleCount} règle(s)</strong></div>
            <div><span>CSS global utile</span><strong>{libraryCandidate.reuse.relevantGlobalRuleCount} règle(s)</strong></div>
          </div>
          <section className="bridge-candidate-instructions">
            <h3>Pour le réutiliser ailleurs</h3>
            {libraryCandidate.reuse.instructions.map((instruction) => <p key={instruction}><OperationIcon name="check-circle" size={15} />{instruction}</p>)}
            {libraryCandidate.reuse.notes.map((note) => <p className="muted" key={note}><OperationIcon name="alert" size={15} />{note}</p>)}
          </section>
          <div className="bridge-candidate-footer">
            <p>La Bibliothèque recevra d’abord une <strong>V1 originale</strong> contenant la source du snapshot. Elle restera « à adapter » tant qu’une version nettoyée/réutilisable n’aura pas été créée.</p>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setLibraryCandidate(null)}>Annuler</button>
              <button className="primary-button" type="button" onClick={() => void createLibraryCandidate(libraryCandidate)}><OperationIcon name="folder" size={16} />Créer le candidat</button>
            </div>
          </div>
        </section>
      </div>}

      {preview && <div className="bridge-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <section className="bridge-preview panel" role="dialog" aria-modal="true" aria-label="Contenu technique du snapshot">
          <div className="bridge-detail-header">
            <div><span className="eyebrow">Donnée technique en lecture seule</span><h2>{preview.contentType ?? preview.serialization ?? 'Contenu Bridge'}</h2><p>{preview.objectRef}</p></div>
            <button className="close-detail" type="button" aria-label="Fermer" onClick={() => setPreview(null)}><OperationIcon name="close" size={18} /></button>
          </div>
          {preview.available
            ? preview.text != null
              ? <pre>{preview.text}{preview.truncated ? '\n\n[… aperçu limité à 256 Ko …]' : ''}</pre>
              : <div className="bridge-empty"><strong>Fichier conservé</strong><span>Ce contenu est binaire et ne peut pas être affiché ici.</span></div>
            : <div className="bridge-empty"><strong>Contenu introuvable</strong><span>Les métadonnées existent mais le fichier n’est plus disponible dans le workspace.</span></div>}
        </section>
      </div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bridge-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function ContentTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return <button type="button" className={active ? 'active' : ''} onClick={onClick}><span>{label}</span><strong>{count}</strong></button>;
}

function PreviewTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={active ? 'active' : ''} onClick={onClick}>{label}</button>;
}

function CodePanel({ title, content, empty }: { title: string; content: string; empty: string }) {
  return <section className="bridge-code-panel">
    <header><strong>{title}</strong><span>{content ? `${content.split(/\r?\n/).length} lignes` : '—'}</span></header>
    {content ? <pre>{content}</pre> : <p className="muted">{empty}</p>}
  </section>;
}

function contentCategory(item: BridgePageSummary): Exclude<ContentView, 'all'> {
  if (item.postType === 'page') return 'pages';
  if (item.postType === 'post') return 'posts';
  if (item.scope === 'divi_library') return 'diviLibrary';
  if (item.scope === 'theme_builder') return 'themeBuilder';
  return 'other';
}

function filterBridgeContents(items: BridgePageSummary[], view: ContentView, query: string): BridgePageSummary[] {
  const needle = query.trim().toLocaleLowerCase('fr-FR');
  return items.filter((item) => {
    if (view !== 'all' && contentCategory(item) !== view) return false;
    if (!needle) return true;
    return [
      item.title,
      item.slug ?? '',
      item.postType,
      item.scope ?? '',
      item.builder ?? '',
      item.builderGeneration ?? '',
      item.sourcePageKey,
      item.canonicalUrl ?? '',
    ].join(' ').toLocaleLowerCase('fr-FR').includes(needle);
  });
}

function scanStatusLabel(value: string): string {
  if (value === 'complete') return 'Complet';
  if (value === 'complete_with_warnings') return 'Complet avec avertissements';
  if (value === 'partial_failure') return 'Partiel avec erreurs';
  if (value === 'failed') return 'Échec';
  return value;
}

function statusLabel(value: string | null): string {
  if (value === 'publish') return 'Publiée';
  if (value === 'draft') return 'Brouillon';
  if (value === 'private') return 'Privée';
  if (value === 'pending') return 'En attente';
  if (value === 'trash') return 'Corbeille';
  return value || 'Statut inconnu';
}

function builderLabel(item: Pick<BridgePageSummary, 'builderGeneration' | 'builder'>): string {
  if (item.builderGeneration === '4') return 'Divi 4';
  if (item.builderGeneration === '5') return 'Divi 5';
  return item.builder ? item.builder : 'WordPress';
}

function contentTypeLabel(item: BridgePageSummary): string {
  const category = contentCategory(item);
  if (category === 'pages') return 'Page';
  if (category === 'posts') return 'Article';
  if (category === 'diviLibrary') return 'Bibliothèque Divi';
  if (category === 'themeBuilder') return 'Theme Builder';
  return 'Contenu technique';
}

function nodeTypeLabel(value: string): string {
  if (value === 'section') return 'Section';
  if (value === 'row') return 'Ligne';
  if (value === 'column') return 'Colonne';
  if (value === 'module') return 'Module';
  return value;
}

function humanNodeLabel(label: string | null, moduleType: string | null, nodeType: string): string {
  if (label?.trim()) return cleanDiviLabel(label);
  if (!moduleType) return nodeTypeLabel(nodeType);
  if (isCustomCodeModule(moduleType)) return 'Module Code';
  return cleanDiviLabel(moduleType);
}

function builderNodeHint(moduleType: string | null, builder: string | null): string {
  if (moduleType) return cleanDiviLabel(moduleType);
  return builder ?? '';
}

function cleanDiviLabel(value: string): string {
  const cleaned = value.replace(/^et_pb_/, '').replace(/^divi\//, '').replace(/^wp:divi\//, '').replace(/[_-]+/g, ' ');
  if (cleaned.toLowerCase() === 'row') return 'Ligne';
  if (cleaned.toLowerCase() === 'column') return 'Colonne';
  if (cleaned.toLowerCase() === 'section') return 'Section';
  if (cleaned.toLowerCase() === 'code') return 'Code';
  return cleaned;
}

function isCustomCodeModule(moduleType: string | null): boolean {
  return Boolean(moduleType && /(^|[/_-])code($|[/_-])/i.test(moduleType));
}

function sourceOriginLabel(origin: string): string {
  if (origin === 'divi_code_module') return 'HTML module Code';
  if (origin === 'divi_code_module_style_block') return 'CSS du module';
  if (origin === 'divi_code_module_script_block') return 'JavaScript du module';
  if (origin === 'post_meta') return 'CSS de la page';
  if (origin === 'wordpress_additional_css') return 'CSS global WordPress';
  if (origin === 'divi_global_option') return 'CSS global Divi';
  return origin.replace(/[_-]+/g, ' ');
}

function sourceScopeLabel(scope: string): string {
  if (scope === 'element') return 'Lié à un module';
  if (scope === 'page') return 'Lié à cette page';
  if (scope === 'global') return 'Global au site';
  return scope;
}

function buildReconstructedPreview(preview: BridgeModulePreview): string {
  const globalCss = safeCss(preview.globalCss);
  const pageCss = safeCss(preview.pageCss);
  const moduleCss = safeCss(preview.moduleCss);
  const base = preview.pageUrl ? `<base href="${escapeHtmlAttribute(preview.pageUrl)}">` : '';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${base}
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:; media-src https: data:;">
<style>
html,body{margin:0;min-height:100%;background:#fff;color:#111}
body{font-family:Arial,Helvetica,sans-serif}
*,*::before,*::after{box-sizing:border-box}
</style>
<style data-bridge-layer="global">${globalCss}</style>
<style data-bridge-layer="page">${pageCss}</style>
<style data-bridge-layer="module">${moduleCss}</style>
</head>
<body>
${preview.html}
</body>
</html>`;
}

function safeCss(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style');
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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

type ContentView = 'pages' | 'posts' | 'diviLibrary' | 'themeBuilder' | 'other' | 'all';
type PreviewMode = 'visual' | 'code';

export function BridgeSitesPage({ onMessage }: Props) {
  const [sites, setSites] = useState<BridgeSiteSummary[]>([]);
  const [site, setSite] = useState<BridgeSiteDetail | null>(null);
  const [snapshot, setSnapshot] = useState<BridgeSnapshotSummary | null>(null);
  const [contents, setContents] = useState<BridgePageSummary[]>([]);
  const [allContents, setAllContents] = useState<BridgePageSummary[]>([]);
  const [page, setPage] = useState<BridgePageSnapshotDetail | null>(null);
  const [inspection, setInspection] = useState<BridgeSnapshotInspection | null>(null);
  const [preview, setPreview] = useState<BridgeObjectPreview | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('code');
  const [search, setSearch] = useState('');
  const [contentView, setContentView] = useState<ContentView>('pages');
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
  }

  async function openPage(item: BridgePageSummary): Promise<void> {
    try {
      setError(null);
      setPage(await window.atoumweb.bridgeSnapshots.getPage(item.pageSnapshotId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir ce contenu.');
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
      const next = await window.atoumweb.bridgeSnapshots.getObjectPreview(objectRef);
      setPreview(next);
      setPreviewMode(canRenderHtml(next) ? 'visual' : 'code');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de lire ce contenu.');
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
    const customCodeModules = page.nodes.filter((node) => isCustomCodeModule(node.moduleType) && node.contentObjectRef).length;
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

  return (
    <div className="bridge-page">
      <section className="bridge-toolbar panel">
        <div>
          <span className="eyebrow">Sites AtoumWeb</span>
          <h2>Copies des sites</h2>
          <p className="muted">Une photographie lisible de chaque site. Le diagnostic technique reste disponible sans encombrer le travail courant.</p>
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

      <section className={`bridge-workspace ${page ? 'with-detail' : ''}`}>
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

        {page && <article className="bridge-detail panel">
          <div className="bridge-detail-header">
            <div>
              <span className="eyebrow">{contentTypeLabel(page.page)} · {statusLabel(page.page.status)}</span>
              <h2>{page.page.title}</h2>
              <p>{page.page.canonicalUrl ?? page.page.slug ?? page.page.sourcePageKey}</p>
            </div>
            <button className="icon-button" type="button" aria-label="Fermer la fiche" title="Fermer la fiche" onClick={() => setPage(null)}><OperationIcon name="close" size={18} /></button>
          </div>

          {pageStats && <div className="bridge-page-summary">
            <span><strong>{builderLabel(page.page)}</strong><small>construction</small></span>
            <span><strong>{pageStats.modules}</strong><small>modules</small></span>
            <span><strong>{pageStats.customCodeModules}</strong><small>modules code</small></span>
            <span><strong>{pageStats.assets}</strong><small>médias liés</small></span>
          </div>}

          <div className="bridge-detail-intro">
            <strong>Construction de la page</strong>
            <span>Ouvre un module Code pour voir ce que Bridge a réellement sauvegardé. Les informations internes de Divi restent masquées par défaut.</span>
          </div>

          <div className="bridge-detail-body">
            <div className="bridge-tree">
              {page.nodes.map((node) => {
                const customCode = isCustomCodeModule(node.moduleType);
                return <div className={`bridge-node ${customCode ? 'custom-code' : ''}`} key={node.occurrenceId} style={{ '--bridge-depth': Math.min(node.depth, 8) } as CSSProperties}>
                  <span className="bridge-node-kind">{nodeTypeLabel(node.nodeType)}</span>
                  <span className="bridge-node-copy">
                    <strong>{humanNodeLabel(node.label, node.moduleType, node.nodeType)}</strong>
                    <small>{customCode ? 'Code personnalisé récupéré' : builderNodeHint(node.moduleType, node.builder)}</small>
                  </span>
                  <div className="bridge-node-actions">
                    {customCode && node.contentObjectRef && <button className="secondary-button bridge-code-button" type="button" onClick={() => void showObject(node.contentObjectRef!)}><OperationIcon name="code" size={15} />Voir le code</button>}
                    {!customCode && node.contentObjectRef && <button className="icon-button" type="button" title="Voir le contenu enregistré" onClick={() => void showObject(node.contentObjectRef!)}><OperationIcon name="file-text" size={15} /></button>}
                  </div>
                </div>;
              })}
            </div>

            <details className="bridge-page-technical">
              <summary><OperationIcon name="wrench" size={15} />Code et ressources associés</summary>
              <div className="bridge-page-technical-grid">
                <section>
                  <h4>CSS / JS / sources</h4>
                  {page.sources.length === 0 ? <p className="muted">Aucune source spécifique rattachée à cette page.</p> : page.sources.map((source) => <div className="bridge-source" key={source.sourceId}>
                    <span className="bridge-source-icon"><OperationIcon name="code" size={17} /></span>
                    <span><strong>{source.kind.toUpperCase()} · {source.origin}</strong><small>{source.scope} · {source.owner}</small></span>
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

      {preview && <div className="bridge-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <section className="bridge-preview panel" role="dialog" aria-modal="true" aria-label="Contenu sauvegardé par Bridge">
          <div className="bridge-detail-header">
            <div><span className="eyebrow">Copie en lecture seule</span><h2>{preview.contentType ?? preview.serialization ?? 'Contenu Bridge'}</h2><p>{preview.objectRef}</p></div>
            <button className="icon-button" type="button" aria-label="Fermer" onClick={() => setPreview(null)}><OperationIcon name="close" size={18} /></button>
          </div>
          {preview.available && preview.text != null && canRenderHtml(preview) && <div className="bridge-preview-modes">
            <button type="button" className={previewMode === 'visual' ? 'active' : ''} onClick={() => setPreviewMode('visual')}>Aperçu</button>
            <button type="button" className={previewMode === 'code' ? 'active' : ''} onClick={() => setPreviewMode('code')}>Code</button>
          </div>}
          {preview.available
            ? preview.text != null
              ? previewMode === 'visual' && canRenderHtml(preview)
                ? <iframe className="bridge-html-preview" sandbox="" title="Aperçu du contenu HTML" srcDoc={buildSafeHtmlPreview(preview.text)} />
                : <pre>{preview.text}{preview.truncated ? '\n\n[… aperçu limité à 256 Ko …]' : ''}</pre>
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
  if (label?.trim()) return label;
  if (!moduleType) return nodeTypeLabel(nodeType);
  if (isCustomCodeModule(moduleType)) return 'Module Code';
  return moduleType.replace(/^et_pb_/, '').replace(/^divi\//, '').replace(/[_-]+/g, ' ');
}

function builderNodeHint(moduleType: string | null, builder: string | null): string {
  if (moduleType) return moduleType.replace(/^et_pb_/, '').replace(/^divi\//, '').replace(/[_-]+/g, ' ');
  return builder ?? '';
}

function isCustomCodeModule(moduleType: string | null): boolean {
  return Boolean(moduleType && /(^|[/_-])code($|[/_-])/i.test(moduleType));
}

function canRenderHtml(preview: BridgeObjectPreview): boolean {
  const type = (preview.contentType ?? '').toLowerCase();
  const serialization = (preview.serialization ?? '').toLowerCase();
  return type === 'text/html' || serialization === 'html';
}

function buildSafeHtmlPreview(content: string): string {
  if (/<!doctype\s+html|<html[\s>]/i.test(content)) return content;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:;">
<style>html,body{margin:0;min-height:100%;background:#fff}body{font-family:Arial,Helvetica,sans-serif}*,*::before,*::after{box-sizing:border-box}</style>
</head>
<body>${content}</body>
</html>`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

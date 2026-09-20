import { useEffect, useMemo, useState } from 'react';
import type {
  AtoumWebLibraryCategory,
  AtoumWebPackageInspection,
  AtoumWebReuseStatus,
  AtoumWebTechnicalAsset,
  AtoumWebTechnicalAssetRole,
  AtoumWebTechnicalItemDetail,
  AtoumWebTechnicalItemSummary,
} from '../../shared/referentials';
import type { ProjectTechnicalContentType } from '../../shared/projects';
import { TechnicalContentViewer } from './TechnicalContentViewer';
import './AtoumWebLibraryPage.css';

const CATEGORIES: Array<{ id: AtoumWebLibraryCategory; label: string }> = [
  { id: 'header', label: 'Headers' },
  { id: 'footer', label: 'Footers' },
  { id: 'hero', label: 'Heroes' },
  { id: 'page', label: 'Pages' },
  { id: 'section', label: 'Sections' },
  { id: 'form', label: 'Formulaires' },
  { id: 'gallery', label: 'Galeries' },
  { id: 'carousel', label: 'Carrousels' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'css', label: 'CSS' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'php', label: 'PHP' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'acf', label: 'ACF' },
  { id: 'divi', label: 'Divi' },
  { id: 'app', label: 'App / Extension' },
  { id: 'note', label: 'Notes' },
];

const REUSE_STATUSES: Array<{ id: AtoumWebReuseStatus; label: string }> = [
  { id: 'ready', label: 'Prêt à réutiliser' },
  { id: 'adapt', label: 'À adapter' },
  { id: 'reference', label: 'Référence' },
];

const CONTENT_TYPES: Array<{ id: ProjectTechnicalContentType; label: string }> = [
  { id: 'code', label: 'Code' },
  { id: 'json', label: 'JSON' },
  { id: 'text', label: 'Texte' },
  { id: 'reference', label: 'Référence' },
];

const ASSET_ROLES: Array<{ id: AtoumWebTechnicalAssetRole; label: string }> = [
  { id: 'screenshot', label: 'Capture' },
  { id: 'preview', label: 'Aperçu' },
  { id: 'source', label: 'Source / export' },
  { id: 'attachment', label: 'Fichier lié' },
];

interface Props {
  onMessage: (message: string) => void;
  initialItemId?: string | null;
}

interface CreationForm {
  name: string;
  category: AtoumWebLibraryCategory;
  reuseStatus: AtoumWebReuseStatus;
  description: string;
  tags: string;
  contentType: ProjectTechnicalContentType;
  language: string;
  contentText: string;
  notes: string;
}

interface MetadataForm {
  name: string;
  category: AtoumWebLibraryCategory;
  reuseStatus: AtoumWebReuseStatus;
  description: string;
  tags: string;
  originTechnicalItemId: string;
}

const EMPTY_FORM: CreationForm = {
  name: '',
  category: 'section',
  reuseStatus: 'adapt',
  description: '',
  tags: '',
  contentType: 'code',
  language: '',
  contentText: '',
  notes: '',
};

function metadataFromItem(item: AtoumWebTechnicalItemDetail): MetadataForm {
  return {
    name: item.name,
    category: item.category,
    reuseStatus: item.reuseStatus,
    description: item.description ?? '',
    tags: (item.tags ?? []).join(', '),
    originTechnicalItemId: item.originTechnicalItemId ?? '',
  };
}

export function AtoumWebLibraryPage({ onMessage, initialItemId }: Props) {
  const [items, setItems] = useState<AtoumWebTechnicalItemSummary[]>([]);
  const [selected, setSelected] = useState<AtoumWebTechnicalItemDetail | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AtoumWebLibraryCategory | ''>('');
  const [reuseStatus, setReuseStatus] = useState<AtoumWebReuseStatus | ''>('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [form, setForm] = useState<CreationForm>(EMPTY_FORM);
  const [metadataForm, setMetadataForm] = useState<MetadataForm | null>(null);
  const [versionForm, setVersionForm] = useState({ contentType: 'code' as ProjectTechnicalContentType, language: '', contentText: '', notes: '' });
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [assetVersionId, setAssetVersionId] = useState('');
  const [assetRole, setAssetRole] = useState<AtoumWebTechnicalAssetRole>('screenshot');
  const [assets, setAssets] = useState<AtoumWebTechnicalAsset[]>([]);
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({});
  const [packageInspection, setPackageInspection] = useState<AtoumWebPackageInspection | null>(null);
  const [packageMode, setPackageMode] = useState<'new_item' | 'new_version'>('new_item');
  const [packageTargetItemId, setPackageTargetItemId] = useState('');
  const [packageMarkStable, setPackageMarkStable] = useState(false);
  const [packageBusy, setPackageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadVersionAssets(versionId: string): Promise<void> {
    if (!versionId) {
      setAssets([]);
      setAssetPreviews({});
      return;
    }
    const nextAssets = await window.atoumweb.referentials.library.assets.list(versionId);
    setAssets(nextAssets);
    const previewable = nextAssets
      .filter((asset) => !asset.missing && (asset.role === 'screenshot' || asset.role === 'preview'))
      .slice(0, 12);
    const pairs = await Promise.all(previewable.map(async (asset) => {
      const preview = await window.atoumweb.referentials.library.assets.preview(asset.id);
      return preview.available && preview.dataUrl ? [asset.id, preview.dataUrl] as const : null;
    }));
    setAssetPreviews(Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => pair !== null)));
  }

  async function setOpenedItem(detail: AtoumWebTechnicalItemDetail): Promise<void> {
    setSelected(detail);
    setMetadataForm(metadataFromItem(detail));
    setExpandedVersionId(null);
    const preferredVersion = detail.currentVersion?.id ?? detail.versions[0]?.id ?? '';
    setAssetVersionId(preferredVersion);
    await loadVersionAssets(preferredVersion);
  }

  async function load(preferredId?: string | null): Promise<void> {
    try {
      setError(null);
      const next = await window.atoumweb.referentials.library.list({
        search: search || null,
        category: category || null,
        reuseStatus: reuseStatus || null,
        includeArchived,
      });
      setItems(next);
      const nextId = preferredId ?? selected?.id;
      if (nextId && next.some((item) => item.id === nextId)) {
        await setOpenedItem(await window.atoumweb.referentials.library.get(nextId));
      } else if (selected && !next.some((item) => item.id === selected.id)) {
        setSelected(null);
        setMetadataForm(null);
        setAssets([]);
        setAssetPreviews({});
        setAssetVersionId('');
        setExpandedVersionId(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la Bibliothèque AtoumWeb.');
    }
  }

  useEffect(() => {
    void load(initialItemId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, reuseStatus, includeArchived, initialItemId]);

  const summary = useMemo(() => ({
    total: items.length,
    ready: items.filter((item) => item.reuseStatus === 'ready').length,
    adapt: items.filter((item) => item.reuseStatus === 'adapt').length,
    references: items.filter((item) => item.reuseStatus === 'reference').length,
  }), [items]);

  async function openItem(id: string): Promise<void> {
    try {
      setError(null);
      setEditingMetadata(false);
      await setOpenedItem(await window.atoumweb.referentials.library.get(id));
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Impossible d’ouvrir ce composant.');
    }
  }

  async function createItem(): Promise<void> {
    try {
      setError(null);
      const created = await window.atoumweb.referentials.library.create(
        {
          name: form.name,
          category: form.category,
          reuseStatus: form.reuseStatus,
          description: form.description || null,
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        },
        {
          contentType: form.contentType,
          language: form.language || null,
          contentText: form.contentText || null,
          notes: form.notes || null,
        },
      );
      setCreating(false);
      setForm(EMPTY_FORM);
      await load(created.id);
      await setOpenedItem(created);
      onMessage(`Composant « ${created.name} » ajouté à la Bibliothèque AtoumWeb.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Création impossible.');
    }
  }

  async function saveMetadata(): Promise<void> {
    if (!selected || !metadataForm) return;
    try {
      setError(null);
      const changed = await window.atoumweb.referentials.library.update(selected.id, {
        name: metadataForm.name,
        category: metadataForm.category,
        reuseStatus: metadataForm.reuseStatus,
        description: metadataForm.description || null,
        tags: metadataForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        originTechnicalItemId: metadataForm.originTechnicalItemId || null,
      });
      setEditingMetadata(false);
      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(`Métadonnées de « ${changed.name} » mises à jour.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Mise à jour des métadonnées impossible.');
    }
  }

  async function addVersion(): Promise<void> {
    if (!selected) return;
    try {
      const changed = await window.atoumweb.referentials.library.createVersion(selected.id, {
        contentType: versionForm.contentType,
        language: versionForm.language || null,
        contentText: versionForm.contentText || null,
        notes: versionForm.notes || null,
      });
      setVersionForm({ contentType: 'code', language: '', contentText: '', notes: '' });
      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(`Nouvelle version créée pour « ${changed.name} ».`);
    } catch (versionError) {
      setError(versionError instanceof Error ? versionError.message : 'Création de version impossible.');
    }
  }

  async function markStable(versionId: string): Promise<void> {
    if (!selected) return;
    try {
      const changed = await window.atoumweb.referentials.library.markStable(versionId);
      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(`Version stable mise à jour pour « ${changed.name} ».`);
    } catch (stableError) {
      setError(stableError instanceof Error ? stableError.message : 'Impossible de marquer cette version stable.');
    }
  }

  async function toggleArchive(): Promise<void> {
    if (!selected) return;
    try {
      const wasArchived = Boolean(selected.archivedAt);
      const changed = wasArchived
        ? await window.atoumweb.referentials.library.reactivate(selected.id)
        : await window.atoumweb.referentials.library.archive(selected.id);
      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(wasArchived ? `« ${changed.name} » réactivé.` : `« ${changed.name} » archivé.`);
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Action impossible.');
    }
  }

  async function changeAssetVersion(versionId: string): Promise<void> {
    setAssetVersionId(versionId);
    try {
      await loadVersionAssets(versionId);
    } catch (assetError) {
      setError(assetError instanceof Error ? assetError.message : 'Impossible de charger les fichiers liés.');
    }
  }

  async function importAssets(): Promise<void> {
    if (!assetVersionId) return;
    try {
      setError(null);
      await window.atoumweb.referentials.library.assets.importFiles(assetVersionId, assetRole);
      await loadVersionAssets(assetVersionId);
      onMessage(`${assetRoleLabel(assetRole)} ajouté à la Bibliothèque AtoumWeb.`);
    } catch (assetError) {
      setError(assetError instanceof Error ? assetError.message : 'Import du fichier impossible.');
    }
  }

  async function openAsset(assetId: string): Promise<void> {
    const result = await window.atoumweb.referentials.library.assets.openFile(assetId);
    if (!result.ok) setError(result.error ?? 'Impossible d’ouvrir ce fichier.');
  }

  async function openAssetFolder(): Promise<void> {
    if (!assetVersionId) return;
    const result = await window.atoumweb.referentials.library.assets.openFolder(assetVersionId);
    if (!result.ok) setError(result.error ?? 'Impossible d’ouvrir le dossier de cette version.');
  }

  async function exportPackage(): Promise<void> {
    if (!selected) return;
    setPackageBusy(true);
    try {
      setError(null);
      const exported = await window.atoumweb.referentials.packages.exportItem(selected.id, assetVersionId || null);
      const shown = await window.atoumweb.referentials.packages.showExport(exported.path);
      if (!shown.ok) setError(shown.error ?? 'Le paquet a été créé mais son emplacement ne peut pas être affiché.');
      onMessage(`Paquet ZIP exporté : ${exported.fileName} · v${exported.versionNumber} · ${exported.assetCount} fichier(s).`);
    } catch (packageError) {
      setError(packageError instanceof Error ? packageError.message : 'Export du paquet impossible.');
    } finally {
      setPackageBusy(false);
    }
  }

  async function inspectPackage(): Promise<void> {
    setPackageBusy(true);
    try {
      setError(null);
      const inspection = await window.atoumweb.referentials.packages.inspectImport();
      if (!inspection) return;
      setPackageInspection(inspection);
      const duplicate = inspection.probableDuplicates[0];
      if (duplicate) {
        setPackageMode('new_version');
        setPackageTargetItemId(duplicate.itemId);
      } else {
        setPackageMode('new_item');
        setPackageTargetItemId('');
      }
      setPackageMarkStable(inspection.version.stable);
    } catch (packageError) {
      setError(packageError instanceof Error ? packageError.message : 'Inspection du paquet impossible.');
    } finally {
      setPackageBusy(false);
    }
  }

  async function importInspectedPackage(): Promise<void> {
    if (!packageInspection) return;
    if (packageMode === 'new_version' && !packageTargetItemId) {
      setError('Choisis le composant qui doit recevoir cette nouvelle version.');
      return;
    }
    setPackageBusy(true);
    try {
      setError(null);
      const imported = await window.atoumweb.referentials.packages.importPackage({
        packagePath: packageInspection.packagePath,
        mode: packageMode,
        targetItemId: packageMode === 'new_version' ? packageTargetItemId : null,
        markStable: packageMarkStable,
      });
      setPackageInspection(null);
      setPackageTargetItemId('');
      await load(imported.item.id);
      await setOpenedItem(imported.item);
      onMessage(`Paquet importé comme ${imported.importedAs === 'new_item' ? 'nouveau composant' : 'nouvelle version'} · ${imported.importedAssetCount} asset(s) copié(s).`);
    } catch (packageError) {
      setError(packageError instanceof Error ? packageError.message : 'Import du paquet impossible.');
    } finally {
      setPackageBusy(false);
    }
  }

  return (
    <div className="aw-library">
      <div className="aw-library-summary">
        <Summary label="Composants affichés" value={summary.total} />
        <Summary label="Prêts" value={summary.ready} />
        <Summary label="À adapter" value={summary.adapt} />
        <Summary label="Références" value={summary.references} />
      </div>

      {error && <div className="notice aw-library-error"><span>{error}</span><button type="button" onClick={() => setError(null)}>×</button></div>}

      <article className="panel aw-library-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher nom, tag, notes ou contenu technique…" />
        <select value={category} onChange={(event) => setCategory(event.target.value as AtoumWebLibraryCategory | '')}>
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
        <select value={reuseStatus} onChange={(event) => setReuseStatus(event.target.value as AtoumWebReuseStatus | '')}>
          <option value="">Tous les statuts</option>
          {REUSE_STATUSES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
        <label className="aw-library-checkbox"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} /> Archivés</label>
        <button className="secondary-button" type="button" disabled={packageBusy} onClick={() => void inspectPackage()}>Importer ZIP</button>
        <button className="primary-button" type="button" onClick={() => setCreating((value) => !value)}>{creating ? 'Fermer' : 'Nouveau composant'}</button>
      </article>

      {packageInspection && <article className="panel aw-library-package-review">
        <div className="panel-title"><div><span className="eyebrow">Import contrôlé</span><h2>{packageInspection.item.name}</h2></div><button className="secondary-button" type="button" onClick={() => setPackageInspection(null)}>Fermer</button></div>
        <div className="aw-library-package-grid">
          <div><span>Catégorie</span><strong>{categoryLabel(packageInspection.item.category)}</strong></div>
          <div><span>Version exportée</span><strong>v{packageInspection.version.exportedVersionNumber}{packageInspection.version.stable ? ' · stable' : ''}</strong></div>
          <div><span>Assets</span><strong>{packageInspection.assetCount}{packageInspection.missingAssetCount ? ` · ${packageInspection.missingAssetCount} manquant(s)` : ''}</strong></div>
          <div><span>Doublons probables</span><strong>{packageInspection.probableDuplicates.length}</strong></div>
        </div>
        {packageInspection.probableDuplicates.length > 0 && <div className="aw-library-package-duplicates"><strong>Correspondances détectées</strong>{packageInspection.probableDuplicates.map((duplicate) => <button type="button" key={duplicate.itemId} onClick={() => { setPackageMode('new_version'); setPackageTargetItemId(duplicate.itemId); }}><span>{duplicate.reason === 'same_content' ? 'Même contenu' : 'Même nom / catégorie'}</span><strong>{duplicate.name}</strong></button>)}</div>}
        <div className="aw-library-form-grid">
          <label>Mode<select value={packageMode} onChange={(event) => setPackageMode(event.target.value as 'new_item' | 'new_version')}><option value="new_item">Créer un nouveau composant</option><option value="new_version">Ajouter une nouvelle version</option></select></label>
          {packageMode === 'new_version' && <label>Composant cible<select value={packageTargetItemId} onChange={(event) => setPackageTargetItemId(event.target.value)}><option value="">Choisir…</option>{items.filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        </div>
        <label className="aw-library-checkbox"><input type="checkbox" checked={packageMarkStable} onChange={(event) => setPackageMarkStable(event.target.checked)} /> Marquer la version importée comme stable</label>
        <p className="technical-safety-note">Le paquet est inspecté avant création. Le code/JSON reste une donnée de référence et n’est jamais exécuté automatiquement.</p>
        <button className="primary-button" type="button" disabled={packageBusy} onClick={() => void importInspectedPackage()}>Confirmer l’import</button>
      </article>}

      {creating && <CreationPanel form={form} setForm={setForm} onCreate={createItem} />}

      <div className="aw-library-layout">
        <article className="panel aw-library-list">
          <div className="panel-title"><div><span className="eyebrow">Bibliothèque</span><h2>Composants AtoumWeb</h2></div><span className="status-pill">{items.length}</span></div>
          {items.length === 0 && <p className="muted">Aucun composant ne correspond aux filtres.</p>}
          {items.map((item) => (
            <button className={`aw-library-item ${selected?.id === item.id ? 'selected' : ''}`} key={item.id} type="button" onClick={() => void openItem(item.id)}>
              <div><strong>{item.name}</strong><span>{categoryLabel(item.category)} · {reuseStatusLabel(item.reuseStatus)}</span></div>
              <div className="aw-library-item-meta"><span>v{item.currentVersion?.versionNumber ?? '—'}</span>{item.stableVersion && <span>stable v{item.stableVersion.versionNumber}</span>}{item.archivedAt && <span>archivé</span>}</div>
            </button>
          ))}
        </article>

        <article className="panel aw-library-detail">
          {!selected && <div className="aw-library-empty"><span className="eyebrow">Phase 6</span><h2>Sélectionne un composant</h2><p className="muted">Tu retrouveras ici ses métadonnées, versions, captures, fichiers techniques et export portable.</p></div>}
          {selected && <>
            <div className="panel-title">
              <div><span className="eyebrow">{categoryLabel(selected.category)} · {reuseStatusLabel(selected.reuseStatus)}</span><h2>{selected.name}</h2></div>
              <div className="button-row">
                {!selected.archivedAt && <button className="secondary-button" type="button" onClick={() => setEditingMetadata((value) => !value)}>{editingMetadata ? 'Annuler édition' : 'Modifier'}</button>}
                <button className="secondary-button" type="button" disabled={packageBusy} onClick={() => void exportPackage()}>Exporter ZIP</button>
                <button className="secondary-button" type="button" onClick={() => void toggleArchive()}>{selected.archivedAt ? 'Réactiver' : 'Archiver'}</button>
              </div>
            </div>

            {editingMetadata && metadataForm ? <MetadataEditor form={metadataForm} setForm={setMetadataForm} onSave={saveMetadata} /> : <>
              {selected.description && <p>{selected.description}</p>}
              <div className="aw-library-tags">{selected.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {selected.originTechnicalItemId && <p className="muted">Origine conservée : composant de Bibliothèque projet {selected.originTechnicalItemId}</p>}
            </>}

            <div className="aw-library-assets">
              <div className="aw-library-section-title"><div><span className="eyebrow">Fichiers indépendants</span><h3>Captures & assets</h3></div><button className="secondary-button" type="button" disabled={!assetVersionId} onClick={() => void openAssetFolder()}>Ouvrir le dossier</button></div>
              <div className="aw-library-asset-toolbar">
                <label>Version<select value={assetVersionId} onChange={(event) => void changeAssetVersion(event.target.value)}>{selected.versions.map((version) => <option key={version.id} value={version.id}>Version {version.versionNumber}{version.current ? ' · courante' : ''}{version.stable ? ' · stable' : ''}</option>)}</select></label>
                <label>Type<select value={assetRole} onChange={(event) => setAssetRole(event.target.value as AtoumWebTechnicalAssetRole)}>{ASSET_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
                <button className="primary-button" type="button" disabled={!assetVersionId || Boolean(selected.archivedAt)} onClick={() => void importAssets()}>Ajouter des fichiers</button>
              </div>
              {assets.length === 0 ? <p className="muted">Aucun fichier lié à cette version.</p> : <div className="aw-library-asset-list">{assets.map((asset) => <button key={asset.id} type="button" className={`aw-library-asset ${asset.missing ? 'missing' : ''}`} onClick={() => void openAsset(asset.id)}>{assetPreviews[asset.id] && <img src={assetPreviews[asset.id]} alt={`Aperçu ${asset.fileName}`} loading="lazy" />}<span>{assetRoleLabel(asset.role)}</span><strong>{asset.fileName}</strong><small>{formatBytes(asset.sizeBytes)}{asset.missing ? ' · fichier manquant' : ''}</small></button>)}</div>}
            </div>

            {!selected.archivedAt && <div className="aw-library-version-form">
              <h3>Créer une nouvelle version</h3>
              <p className="muted">Le contenu existant n’est jamais écrasé : toute évolution technique significative crée une nouvelle version.</p>
              <div className="aw-library-form-grid">
                <label>Type<select value={versionForm.contentType} onChange={(event) => setVersionForm((value) => ({ ...value, contentType: event.target.value as ProjectTechnicalContentType }))}>{CONTENT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                <label>Langage<input value={versionForm.language} onChange={(event) => setVersionForm((value) => ({ ...value, language: event.target.value }))} placeholder="php, css, json…" /></label>
              </div>
              <label>Contenu<textarea rows={7} value={versionForm.contentText} onChange={(event) => setVersionForm((value) => ({ ...value, contentText: event.target.value }))} /></label>
              <label>Notes<textarea rows={2} value={versionForm.notes} onChange={(event) => setVersionForm((value) => ({ ...value, notes: event.target.value }))} /></label>
              <button className="primary-button" type="button" onClick={() => void addVersion()}>Créer la version</button>
            </div>}

            <div className="aw-library-versions">
              <h3>Historique des versions</h3>
              {selected.versions.map((version) => <div className="aw-library-version" key={version.id}>
                <div><strong>Version {version.versionNumber}</strong><span>{version.contentType}{version.language ? ` · ${version.language}` : ''}</span></div>
                <div className="aw-library-version-flags">{version.current && <span>courante</span>}{version.stable && <span>stable</span>}{!version.stable && !selected.archivedAt && <button type="button" className="secondary-button" onClick={() => void markStable(version.id)}>Marquer stable</button>}</div>
                {version.notes && <p>{version.notes}</p>}
                {version.contentText && <TechnicalContentViewer
                  contentType={version.contentType}
                  language={version.language}
                  content={version.contentText}
                  title={`Version ${version.versionNumber}`}
                  onMessage={onMessage}
                  expanded={expandedVersionId === version.id}
                  onToggleExpanded={() => setExpandedVersionId((current) => current === version.id ? null : version.id)}
                />}
              </div>)}
            </div>
          </>}
        </article>
      </div>
    </div>
  );
}

function CreationPanel({ form, setForm, onCreate }: { form: CreationForm; setForm: (value: CreationForm) => void; onCreate: () => Promise<void> }) {
  return <article className="panel aw-library-create">
    <div className="panel-title"><div><span className="eyebrow">Nouveau</span><h2>Ajouter un composant AtoumWeb</h2></div></div>
    <div className="aw-library-form-grid">
      <label>Nom<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Catégorie<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as AtoumWebLibraryCategory })}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Statut<select value={form.reuseStatus} onChange={(event) => setForm({ ...form, reuseStatus: event.target.value as AtoumWebReuseStatus })}>{REUSE_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Tags<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Divi, header, responsive…" /></label>
    </div>
    <label>Description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
    <div className="aw-library-form-grid">
      <label>Type initial<select value={form.contentType} onChange={(event) => setForm({ ...form, contentType: event.target.value as ProjectTechnicalContentType })}>{CONTENT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Langage<input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} placeholder="php, css, json…" /></label>
    </div>
    <label>Contenu initial<textarea rows={7} value={form.contentText} onChange={(event) => setForm({ ...form, contentText: event.target.value })} /></label>
    <label>Notes<textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
    <button className="primary-button" type="button" onClick={() => void onCreate()}>Créer le composant</button>
  </article>;
}

function MetadataEditor({ form, setForm, onSave }: { form: MetadataForm; setForm: (value: MetadataForm) => void; onSave: () => Promise<void> }) {
  return <div className="aw-library-metadata-editor">
    <div className="aw-library-form-grid">
      <label>Nom<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Catégorie<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as AtoumWebLibraryCategory })}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Statut<select value={form.reuseStatus} onChange={(event) => setForm({ ...form, reuseStatus: event.target.value as AtoumWebReuseStatus })}>{REUSE_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Tags<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Séparés par des virgules" /></label>
    </div>
    <label>Description<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
    <label>ID origine Bibliothèque projet<input value={form.originTechnicalItemId} onChange={(event) => setForm({ ...form, originTechnicalItemId: event.target.value })} placeholder="Optionnel · uniquement un composant projet" /></label>
    <button className="primary-button" type="button" onClick={() => void onSave()}>Enregistrer les métadonnées</button>
  </div>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <article className="kpi-card"><span>{label}</span><strong>{value}</strong><small>Bibliothèque AtoumWeb</small></article>;
}

function categoryLabel(category: AtoumWebLibraryCategory): string {
  return CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function reuseStatusLabel(status: AtoumWebReuseStatus): string {
  return REUSE_STATUSES.find((item) => item.id === status)?.label ?? status;
}

function assetRoleLabel(role: AtoumWebTechnicalAssetRole): string {
  return ASSET_ROLES.find((item) => item.id === role)?.label ?? role;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

import { useEffect, useMemo, useState } from 'react';
import type {
  AtoumWebLibraryCategory,
  AtoumWebPackageInspection,
  AtoumWebReuseStatus,
  AtoumWebTechnicalAsset,
  AtoumWebTechnicalAssetRole,
  AtoumWebTechnicalItemDetail,
  AtoumWebTechnicalItemSummary,
  AtoumWebTechnicalVersion,
} from '../../shared/referentials';
import type { ProjectTechnicalContentType } from '../../shared/projects';
import { TechnicalContentViewer } from './TechnicalContentViewer';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
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

interface BridgeLibraryCandidate {
  schemaVersion: number;
  kind: 'atoumweb-bridge-library-candidate';
  origin: {
    site: string | null;
    page: string;
    pageUrl: string | null;
    snapshotId: string | null;
    snapshotDate: string | null;
    builderGeneration: string | null;
    occurrenceId: string;
  };
  original: {
    html: string;
    cssModule: string;
    cssPage: string;
    cssGlobal: string;
    javascript: string;
    diviSource: string | null;
  };
  prepared: {
    cssPageUseful: string;
    cssGlobalUseful: string;
    rootClasses: string[];
    instructions: string[];
    notes: string[];
  };
}

interface BridgeCleanedComponent {
  schemaVersion: number;
  kind: 'atoumweb-library-cleaned-component';
  origin: BridgeLibraryCandidate['origin'];
  cleaned: {
    html: string;
    css: string;
    javascript: string;
    rootClasses: string[];
  };
  checks: {
    remoteAssetUrls: string[];
  };
  instructions: string[];
  notes: string[];
}

interface BridgeReusableComponent {
  schemaVersion: number;
  kind: 'atoumweb-library-reusable-component';
  origin: BridgeLibraryCandidate['origin'];
  reusable: {
    html: string;
    css: string;
    javascript: string;
    rootClasses: string[];
    method: 'divi-code';
    instructions: string[];
  };
  checks: {
    remoteAssetUrls: string[];
  };
  notes: string[];
}

type BridgeLibraryPayload =
  | { stage: 'original'; value: BridgeLibraryCandidate }
  | { stage: 'cleaned'; value: BridgeCleanedComponent }
  | { stage: 'reusable'; value: BridgeReusableComponent };

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
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
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
  const [bridgeWorkflowBusy, setBridgeWorkflowBusy] = useState(false);
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
    setDetailExpanded(false);
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

  const currentVersion = selected?.currentVersion ?? selected?.versions[0] ?? null;
  const currentBridgePayload = useMemo(
    () => parseBridgeLibraryPayload(currentVersion?.contentType, currentVersion?.contentText),
    [currentVersion?.id, currentVersion?.contentType, currentVersion?.contentText],
  );
  const bridgeWorkflow = useMemo(() => {
    const parsed = (selected?.versions ?? [])
      .map((version) => ({ version, payload: parseBridgeLibraryPayload(version.contentType, version.contentText) }))
      .filter((entry): entry is { version: AtoumWebTechnicalVersion; payload: BridgeLibraryPayload } => Boolean(entry.payload));
    return {
      original: parsed.find((entry) => entry.payload.stage === 'original') ?? null,
      cleaned: parsed.find((entry) => entry.payload.stage === 'cleaned') ?? null,
      reusable: parsed.find((entry) => entry.payload.stage === 'reusable') ?? null,
    };
  }, [selected?.id, selected?.versions]);
  const originalBridgeCandidate = bridgeWorkflow.original?.payload.stage === 'original' ? bridgeWorkflow.original.payload.value : null;
  const recommendedBridgeCategory = originalBridgeCandidate ? inferBridgeLibraryCategory(originalBridgeCandidate) : null;
  const recommendedBridgeName = originalBridgeCandidate && recommendedBridgeCategory
    ? suggestedBridgeLibraryName(originalBridgeCandidate, recommendedBridgeCategory)
    : null;
  const bridgeClassificationMismatch = Boolean(selected && recommendedBridgeCategory && recommendedBridgeName
    && (selected.category !== recommendedBridgeCategory || selected.name !== recommendedBridgeName));

  function closeDetail(): void {
    setSelected(null);
    setDetailExpanded(false);
    setEditingMetadata(false);
    setMetadataForm(null);
    setAssets([]);
    setAssetPreviews({});
    setAssetVersionId('');
    setExpandedVersionId(null);
  }

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected?.id]);

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.aw-library-layout.with-detail');
    if (!workspace) return;
    document.body.classList.add('aw-library-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('aw-library-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

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

  async function correctBridgeClassification(): Promise<void> {
    if (!selected) return;
    const payload = bridgeWorkflow.original?.payload;
    if (!payload || payload.stage !== 'original') return;
    const category = inferBridgeLibraryCategory(payload.value);
    const name = suggestedBridgeLibraryName(payload.value, category);
    if (selected.category === category && selected.name === name) return;

    setBridgeWorkflowBusy(true);
    try {
      setError(null);
      const changed = await window.atoumweb.referentials.library.update(selected.id, { category, name });
      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(`Classement corrigé : « ${changed.name} » est maintenant rangé dans ${categoryLabel(changed.category)}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de corriger le classement de ce composant.');
    } finally {
      setBridgeWorkflowBusy(false);
    }
  }

  async function createBridgeCleanedVersion(): Promise<void> {
    if (!selected || bridgeWorkflow.cleaned) return;
    const payload = bridgeWorkflow.original?.payload;
    if (!payload || payload.stage !== 'original') {
      setError('La version originale Bridge est introuvable.');
      return;
    }

    setBridgeWorkflowBusy(true);
    try {
      setError(null);
      const cleaned = buildBridgeCleanedComponent(payload.value);
      let changed = await window.atoumweb.referentials.library.createVersion(selected.id, {
        contentType: 'json',
        language: 'json',
        contentText: JSON.stringify(cleaned, null, 2),
        notes: 'Version nettoyée — HTML isolé, CSS utile consolidé, JavaScript séparé. La V1 originale reste conservée.',
      });

      const category = inferBridgeLibraryCategory(payload.value);
      const name = suggestedBridgeLibraryName(payload.value, category);
      if (changed.category !== category || changed.name !== name) {
        changed = await window.atoumweb.referentials.library.update(changed.id, { category, name, reuseStatus: 'adapt' });
      }

      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(`Version nettoyée créée pour « ${changed.name} ».`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de créer la version nettoyée.');
    } finally {
      setBridgeWorkflowBusy(false);
    }
  }

  async function createBridgeReusableVersion(): Promise<void> {
    if (!selected || bridgeWorkflow.reusable) return;
    const payload = bridgeWorkflow.cleaned?.payload;
    if (!payload || payload.stage !== 'cleaned') {
      setError('Crée d’abord la version nettoyée.');
      return;
    }

    setBridgeWorkflowBusy(true);
    try {
      setError(null);
      const reusable = buildBridgeReusableComponent(payload.value);
      let changed = await window.atoumweb.referentials.library.createVersion(selected.id, {
        contentType: 'json',
        language: 'json',
        contentText: JSON.stringify(reusable, null, 2),
        notes: reusable.checks.remoteAssetUrls.length
          ? `Version réutilisable préparée — ${reusable.checks.remoteAssetUrls.length} média(s) distant(s) restent à embarquer localement.`
          : 'Version réutilisable prête à copier dans un module Code Divi.',
      });

      if (reusable.checks.remoteAssetUrls.length === 0) {
        changed = await window.atoumweb.referentials.library.update(changed.id, { reuseStatus: 'ready' });
        if (changed.currentVersion?.id) changed = await window.atoumweb.referentials.library.markStable(changed.currentVersion.id);
      } else {
        changed = await window.atoumweb.referentials.library.update(changed.id, { reuseStatus: 'adapt' });
      }

      await load(changed.id);
      await setOpenedItem(changed);
      onMessage(reusable.checks.remoteAssetUrls.length
        ? `Version réutilisable préparée pour « ${changed.name} ». Les médias distants restent à intégrer localement.`
        : `« ${changed.name} » est prêt à réutiliser.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de préparer la version réutilisable.');
    } finally {
      setBridgeWorkflowBusy(false);
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
        <Summary icon="package" label="Composants affichés" value={summary.total} />
        <Summary icon="check-circle" label="Prêts" value={summary.ready} />
        <Summary icon="wrench" label="À adapter" value={summary.adapt} />
        <Summary icon="file-text" label="Références" value={summary.references} />
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
        <button className="secondary-button" type="button" disabled={packageBusy} onClick={() => void inspectPackage()}><OperationIcon name="upload" size={16} /> Importer ZIP</button>
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

      <div
        className={`aw-library-layout ${selected ? 'with-detail' : 'aw-library-layout-list-only'} ${detailExpanded ? 'detail-expanded' : ''}`}
        style={selected && !detailExpanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
      >
        {!detailExpanded && <article className="panel aw-library-list">
          <div className="panel-title"><div><span className="eyebrow">Bibliothèque</span><h2>Composants AtoumWeb</h2></div><span className="status-pill">{items.length}</span></div>
          {items.length === 0 && <p className="muted">Aucun composant ne correspond aux filtres.</p>}
          {items.map((item) => (
            <button className={`aw-library-item ${selected?.id === item.id ? 'selected' : ''}`} key={item.id} type="button" onClick={() => void openItem(item.id)}>
              <div><strong>{item.name}</strong><span>{categoryLabel(item.category)} · {reuseStatusLabel(item.reuseStatus)}</span></div>
              <div className="aw-library-item-meta"><span>v{item.currentVersion?.versionNumber ?? '—'}</span>{item.stableVersion && <span>stable v{item.stableVersion.versionNumber}</span>}{item.archivedAt && <span>archivé</span>}</div>
            </button>
          ))}
        </article>}

        {selected && !detailExpanded && <div className="aw-library-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la bibliothèque et la fiche" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(38)} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
          if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
        }}><span /></div>}

        {selected && <article className={`panel aw-library-detail ${detailExpanded ? 'expanded' : ''}`}>
            <div className="panel-title aw-library-detail-heading">
              <div><span className="eyebrow">{categoryLabel(selected.category)} · {reuseStatusLabel(selected.reuseStatus)}</span><h2>{selected.name}</h2></div>
              <div className="button-row">
                {!selected.archivedAt && <button className="secondary-button" type="button" onClick={() => setEditingMetadata((value) => !value)}>{editingMetadata ? 'Annuler édition' : 'Modifier'}</button>}
                <button className="secondary-button" type="button" disabled={packageBusy} onClick={() => void exportPackage()}><OperationIcon name="package" size={16} /> Exporter ZIP</button>
                <button className="secondary-button" type="button" onClick={() => void toggleArchive()}><OperationIcon name="archive" size={16} /> {selected.archivedAt ? 'Réactiver' : 'Archiver'}</button>
                <button className="operation-detail-expand" type="button" title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}><OperationIcon name={detailExpanded ? 'collapse' : 'expand'} size={18} /></button>
                <button className="close-detail" type="button" aria-label="Fermer la fiche composant" title="Fermer" onClick={closeDetail}><OperationIcon name="close" size={18} /></button>
              </div>
            </div>

            <>
            {editingMetadata && metadataForm ? <MetadataEditor form={metadataForm} setForm={setMetadataForm} onSave={saveMetadata} /> : <>
              {selected.description && <p>{selected.description}</p>}
              <div className="aw-library-tags">{selected.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {selected.originTechnicalItemId && <p className="muted">Origine conservée : composant de Bibliothèque projet {selected.originTechnicalItemId}</p>}
            </>}

            {bridgeWorkflow.original && <section className="aw-library-bridge-workflow">
              <div className="aw-library-section-title">
                <div><span className="eyebrow">Parcours du composant</span><h3>Original → Nettoyé → Réutilisable</h3></div>
              </div>

              {bridgeClassificationMismatch && <div className="aw-library-classification-warning">
                <OperationIcon name="alert" size={17} />
                <div><strong>Classement à corriger</strong><span>Ce composant ressemble à « {recommendedBridgeName} » et doit être rangé dans {recommendedBridgeCategory ? categoryLabel(recommendedBridgeCategory) : 'la bonne catégorie'}, pas dans {categoryLabel(selected.category)}.</span></div>
                <button className="secondary-button" type="button" disabled={bridgeWorkflowBusy} onClick={() => void correctBridgeClassification()}>Corriger</button>
              </div>}

              <div className="aw-library-stage-grid">
                <div className="done">
                  <span>1</span>
                  <div><strong>Originale</strong><small>V{bridgeWorkflow.original.version.versionNumber} · snapshot conservé intact</small></div>
                  <OperationIcon name="check-circle" size={18} />
                </div>
                <div className={bridgeWorkflow.cleaned ? 'done' : 'next'}>
                  <span>2</span>
                  <div><strong>Nettoyée</strong><small>{bridgeWorkflow.cleaned ? `V${bridgeWorkflow.cleaned.version.versionNumber} · HTML/CSS/JS séparés` : 'Consolider uniquement le code utile'}</small></div>
                  {bridgeWorkflow.cleaned
                    ? <OperationIcon name="check-circle" size={18} />
                    : <button className="primary-button" type="button" disabled={bridgeWorkflowBusy} onClick={() => void createBridgeCleanedVersion()}>Nettoyer</button>}
                </div>
                <div className={bridgeWorkflow.reusable ? 'done' : bridgeWorkflow.cleaned ? 'next' : 'locked'}>
                  <span>3</span>
                  <div><strong>Réutilisable</strong><small>{bridgeWorkflow.reusable ? `V${bridgeWorkflow.reusable.version.versionNumber} · paquet prêt` : 'Version finale + mode d’emploi + contrôle des médias'}</small></div>
                  {bridgeWorkflow.reusable
                    ? <OperationIcon name="check-circle" size={18} />
                    : <button className="primary-button" type="button" disabled={bridgeWorkflowBusy || !bridgeWorkflow.cleaned} onClick={() => void createBridgeReusableVersion()}>Préparer</button>}
                </div>
              </div>
            </section>}

            {currentVersion && <section className="aw-library-current-version">
              <div className="aw-library-section-title">
                <div><span className="eyebrow">Aperçu principal</span><h3>Version courante · v{currentVersion.versionNumber}</h3></div>
                <div className="aw-library-version-flags">{currentVersion.stable && <span>stable</span>}<span>{currentVersion.contentType}{currentVersion.language ? ` · ${currentVersion.language}` : ''}</span></div>
              </div>
              {currentVersion.notes && <p className="muted aw-library-current-notes">{currentVersion.notes}</p>}
              {currentBridgePayload
                ? currentBridgePayload.stage === 'original'
                  ? <BridgeCandidateViewer candidate={currentBridgePayload.value} rawContent={currentVersion.contentText ?? ''} onMessage={onMessage} />
                  : currentBridgePayload.stage === 'cleaned'
                    ? <BridgeCleanedViewer component={currentBridgePayload.value} rawContent={currentVersion.contentText ?? ''} onMessage={onMessage} />
                    : <BridgeReusableViewer component={currentBridgePayload.value} rawContent={currentVersion.contentText ?? ''} onMessage={onMessage} />
                : <TechnicalContentViewer
                    contentType={currentVersion.contentType}
                    language={currentVersion.language}
                    content={currentVersion.contentText}
                    title="Version courante"
                    onMessage={onMessage}
                    expanded={expandedVersionId === currentVersion.id}
                    onToggleExpanded={() => setExpandedVersionId((current) => current === currentVersion.id ? null : currentVersion.id)}
                  />}
            </section>}

            <div className="aw-library-assets">
              <div className="aw-library-section-title"><div><span className="eyebrow">Fichiers indépendants</span><h3>Captures & assets</h3></div><button className="secondary-button" type="button" disabled={!assetVersionId} onClick={() => void openAssetFolder()}><OperationIcon name="folder" size={16} /> Ouvrir le dossier</button></div>
              <div className="aw-library-asset-toolbar">
                <label>Version<select value={assetVersionId} onChange={(event) => void changeAssetVersion(event.target.value)}>{selected.versions.map((version) => <option key={version.id} value={version.id}>Version {version.versionNumber}{version.current ? ' · courante' : ''}{version.stable ? ' · stable' : ''}</option>)}</select></label>
                <label>Type<select value={assetRole} onChange={(event) => setAssetRole(event.target.value as AtoumWebTechnicalAssetRole)}>{ASSET_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
                <button className="primary-button" type="button" disabled={!assetVersionId || Boolean(selected.archivedAt)} onClick={() => void importAssets()}><OperationIcon name="upload" size={16} /> Ajouter des fichiers</button>
              </div>
              {assets.length === 0 ? <p className="muted">Aucun fichier lié à cette version.</p> : <div className="aw-library-asset-list">{assets.map((asset) => <button key={asset.id} type="button" className={`aw-library-asset ${asset.missing ? 'missing' : ''}`} onClick={() => void openAsset(asset.id)}>{assetPreviews[asset.id] && <img src={assetPreviews[asset.id]} alt={`Aperçu ${asset.fileName}`} loading="lazy" />}<span>{assetRoleLabel(asset.role)}</span><strong>{asset.fileName}</strong><small>{formatBytes(asset.sizeBytes)}{asset.missing ? ' · fichier manquant' : ''}</small></button>)}</div>}
            </div>

            {!selected.archivedAt && !bridgeWorkflow.original && <div className="aw-library-version-form">
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
              {selected.versions.filter((version) => version.id !== currentVersion?.id).map((version) => <div className="aw-library-version" key={version.id}>
                <div><strong>Version {version.versionNumber}</strong><span>{version.contentType}{version.language ? ` · ${version.language}` : ''}</span></div>
                <div className="aw-library-version-flags">{version.current && <span>courante</span>}{version.stable && <span>stable</span>}{!version.stable && !selected.archivedAt && <button type="button" className="secondary-button" onClick={() => void markStable(version.id)}>Marquer stable</button>}</div>
                {version.notes && <p>{version.notes}</p>}
                {version.contentText && <button className="secondary-button aw-library-version-toggle" type="button" onClick={() => setExpandedVersionId((current) => current === version.id ? null : version.id)}>
                  {expandedVersionId === version.id ? 'Masquer cette version' : 'Voir cette version'}
                </button>}
                {version.contentText && expandedVersionId === version.id && <TechnicalContentViewer
                  contentType={version.contentType}
                  language={version.language}
                  content={version.contentText}
                  title={`Version ${version.versionNumber}`}
                  onMessage={onMessage}
                />}
              </div>)}
              {selected.versions.filter((version) => version.id !== currentVersion?.id).length === 0 && <p className="muted">Aucune ancienne version : seule la version courante existe pour le moment.</p>}
            </div>
            </>
        </article>}
      </div>
    </div>
  );
}

function BridgeCandidateViewer({ candidate, rawContent, onMessage }: { candidate: BridgeLibraryCandidate; rawContent: string; onMessage: (message: string) => void }) {
  const previewDocument = buildBridgeCandidatePreview(candidate);
  const usefulPageLines = lineCount(candidate.prepared.cssPageUseful);
  const usefulGlobalLines = lineCount(candidate.prepared.cssGlobalUseful);
  const moduleCssLines = lineCount(candidate.original.cssModule);

  return <div className="aw-bridge-candidate-viewer">
    <div className="aw-bridge-candidate-origin">
      <div><span>Site d’origine</span><strong>{candidate.origin.site || 'Site Bridge'}</strong></div>
      <div><span>Page d’origine</span><strong>{candidate.origin.page}</strong></div>
      <div><span>Builder</span><strong>{candidate.origin.builderGeneration ? `Divi ${candidate.origin.builderGeneration}` : 'Divi'}</strong></div>
      <div><span>Snapshot</span><strong>{candidate.origin.snapshotDate ? formatDateTime(candidate.origin.snapshotDate) : 'Date non disponible'}</strong></div>
    </div>

    <div className="aw-bridge-candidate-state">
      <OperationIcon name="archive" size={18} />
      <div><strong>Version originale du site</strong><span>Cette V1 conserve la source telle qu’elle existait dans le snapshot. Elle n’est pas encore la version nettoyée à copier sur un autre site.</span></div>
    </div>

    <section className="aw-bridge-candidate-preview">
      <div className="aw-library-section-title">
        <div><span className="eyebrow">Rendu</span><h3>Aperçu du composant</h3></div>
        {candidate.origin.pageUrl && <span className="muted">{candidate.origin.pageUrl}</span>}
      </div>
      {candidate.original.html
        ? <iframe className="aw-bridge-candidate-frame" title={`Aperçu ${candidate.origin.page}`} sandbox="" srcDoc={previewDocument} />
        : <div className="technical-content-empty">Le HTML n’a pas pu être isolé pour ce candidat.</div>}
    </section>

    <section className="aw-bridge-candidate-reuse">
      <div className="aw-library-section-title"><div><span className="eyebrow">Réutilisation</span><h3>Ce qu’il faut emporter</h3></div></div>
      <div className="aw-bridge-candidate-grid">
        <div><span>HTML</span><strong>{candidate.original.html ? 'Disponible' : 'À analyser'}</strong></div>
        <div><span>CSS du module</span><strong>{moduleCssLines ? `${moduleCssLines} ligne(s)` : 'Aucun'}</strong></div>
        <div><span>CSS page utile</span><strong>{usefulPageLines ? `${usefulPageLines} ligne(s)` : 'Aucun détecté'}</strong></div>
        <div><span>CSS global utile</span><strong>{usefulGlobalLines ? `${usefulGlobalLines} ligne(s)` : 'Aucun détecté'}</strong></div>
        <div><span>JavaScript</span><strong>{candidate.original.javascript ? 'Présent · à vérifier' : 'Aucun'}</strong></div>
        <div><span>Classes principales</span><strong>{candidate.prepared.rootClasses.length ? candidate.prepared.rootClasses.join(' · ') : 'Non détectées'}</strong></div>
      </div>

      {candidate.prepared.instructions.length > 0 && <div className="aw-bridge-candidate-instructions">
        <strong>Mode d’emploi provisoire</strong>
        {candidate.prepared.instructions.map((instruction) => <p key={instruction}><OperationIcon name="check-circle" size={15} />{instruction}</p>)}
      </div>}
      {candidate.prepared.notes.length > 0 && <div className="aw-bridge-candidate-notes">
        {candidate.prepared.notes.map((note) => <p key={note}><OperationIcon name="alert" size={15} />{note}</p>)}
      </div>}
    </section>

    <details className="aw-bridge-candidate-source">
      <summary>Voir la source originale complète</summary>
      <TechnicalContentViewer contentType="json" language="json" content={rawContent} title="Archive technique du candidat" onMessage={onMessage} />
    </details>
  </div>;
}

function BridgeCleanedViewer({ component, rawContent, onMessage }: { component: BridgeCleanedComponent; rawContent: string; onMessage: (message: string) => void }) {
  const previewDocument = buildBridgeCleanedPreview(component);
  return <div className="aw-bridge-candidate-viewer">
    <div className="aw-bridge-candidate-state cleaned">
      <OperationIcon name="wrench" size={18} />
      <div><strong>Version nettoyée</strong><span>Le HTML a été isolé et le CSS utile du module, de la page et du site a été consolidé dans une seule feuille.</span></div>
    </div>
    <section className="aw-bridge-candidate-preview">
      <div className="aw-library-section-title"><div><span className="eyebrow">Rendu</span><h3>Aperçu nettoyé</h3></div></div>
      <iframe className="aw-bridge-candidate-frame" title={`Aperçu nettoyé ${component.origin.page}`} sandbox="" srcDoc={previewDocument} />
    </section>
    <section className="aw-bridge-candidate-reuse">
      <div className="aw-bridge-candidate-grid">
        <div><span>HTML</span><strong>{lineCount(component.cleaned.html)} ligne(s)</strong></div>
        <div><span>CSS consolidé</span><strong>{lineCount(component.cleaned.css)} ligne(s)</strong></div>
        <div><span>JavaScript</span><strong>{component.cleaned.javascript ? `${lineCount(component.cleaned.javascript)} ligne(s)` : 'Aucun'}</strong></div>
        <div><span>Médias distants</span><strong>{component.checks.remoteAssetUrls.length}</strong></div>
      </div>
      <div className="aw-bridge-copy-grid">
        <CopyCodeCard title="HTML nettoyé" content={component.cleaned.html} onMessage={onMessage} />
        <CopyCodeCard title="CSS final du composant" content={component.cleaned.css} onMessage={onMessage} />
        {component.cleaned.javascript && <CopyCodeCard title="JavaScript séparé" content={component.cleaned.javascript} onMessage={onMessage} />}
      </div>
    </section>
    <details className="aw-bridge-candidate-source">
      <summary>Voir le paquet nettoyé complet</summary>
      <TechnicalContentViewer contentType="json" language="json" content={rawContent} title="Paquet nettoyé" onMessage={onMessage} />
    </details>
  </div>;
}

function BridgeReusableViewer({ component, rawContent, onMessage }: { component: BridgeReusableComponent; rawContent: string; onMessage: (message: string) => void }) {
  const previewDocument = buildBridgeReusablePreview(component);
  const ready = component.checks.remoteAssetUrls.length === 0;
  return <div className="aw-bridge-candidate-viewer">
    <div className={`aw-bridge-candidate-state ${ready ? 'ready' : 'reusable'}`}>
      <OperationIcon name={ready ? 'check-circle' : 'alert'} size={18} />
      <div><strong>{ready ? 'Version réutilisable prête' : 'Version réutilisable préparée'}</strong><span>{ready ? 'Le composant peut être copié sur un autre site.' : `${component.checks.remoteAssetUrls.length} média(s) utilisent encore une URL distante. Le code est prêt mais les assets doivent être embarqués localement.`}</span></div>
    </div>
    <section className="aw-bridge-candidate-preview">
      <div className="aw-library-section-title"><div><span className="eyebrow">Rendu</span><h3>Aperçu réutilisable</h3></div></div>
      <iframe className="aw-bridge-candidate-frame" title={`Aperçu réutilisable ${component.origin.page}`} sandbox="" srcDoc={previewDocument} />
    </section>
    <section className="aw-bridge-candidate-reuse">
      <div className="aw-library-section-title"><div><span className="eyebrow">Mode d’emploi</span><h3>Utiliser dans un autre site</h3></div></div>
      <div className="aw-bridge-candidate-instructions">
        {component.reusable.instructions.map((instruction) => <p key={instruction}><OperationIcon name="check-circle" size={15} />{instruction}</p>)}
      </div>
      <div className="aw-bridge-copy-grid">
        <CopyCodeCard title="HTML prêt à copier" content={component.reusable.html} onMessage={onMessage} />
        <CopyCodeCard title="CSS prêt à copier" content={component.reusable.css} onMessage={onMessage} />
        {component.reusable.javascript && <CopyCodeCard title="JavaScript prêt à copier" content={component.reusable.javascript} onMessage={onMessage} />}
      </div>
      {component.checks.remoteAssetUrls.length > 0 && <details className="aw-bridge-remote-assets">
        <summary>{component.checks.remoteAssetUrls.length} média(s) encore chargés depuis le site d’origine</summary>
        {component.checks.remoteAssetUrls.map((url) => <code key={url}>{url}</code>)}
      </details>}
    </section>
    <details className="aw-bridge-candidate-source">
      <summary>Voir le paquet réutilisable complet</summary>
      <TechnicalContentViewer contentType="json" language="json" content={rawContent} title="Paquet réutilisable" onMessage={onMessage} />
    </details>
  </div>;
}

function CopyCodeCard({ title, content, onMessage }: { title: string; content: string; onMessage: (message: string) => void }) {
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      onMessage(`${title} copié.`);
    } catch {
      onMessage('Copie impossible depuis cet environnement.');
    }
  }
  return <div className="aw-bridge-copy-card">
    <div><strong>{title}</strong><span>{lineCount(content)} ligne(s)</span></div>
    <button className="secondary-button" type="button" onClick={() => void copy()}>Copier</button>
  </div>;
}

function parseBridgeLibraryPayload(contentType?: ProjectTechnicalContentType | null, content?: string | null): BridgeLibraryPayload | null {
  if (contentType !== 'json' || !content?.trim()) return null;
  try {
    const value = JSON.parse(content) as Record<string, unknown>;
    if (value.kind === 'atoumweb-bridge-library-candidate') {
      const candidate = parseBridgeLibraryCandidate(contentType, content);
      return candidate ? { stage: 'original', value: candidate } : null;
    }
    if (value.kind === 'atoumweb-library-cleaned-component') {
      const cleaned = parseBridgeCleanedComponent(value);
      return cleaned ? { stage: 'cleaned', value: cleaned } : null;
    }
    if (value.kind === 'atoumweb-library-reusable-component') {
      const reusable = parseBridgeReusableComponent(value);
      return reusable ? { stage: 'reusable', value: reusable } : null;
    }
    return null;
  } catch {
    return null;
  }
}

function parseBridgeCleanedComponent(value: Record<string, unknown>): BridgeCleanedComponent | null {
  const origin = parseBridgeOrigin(value.origin);
  const cleaned = value.cleaned && typeof value.cleaned === 'object' ? value.cleaned as Record<string, unknown> : null;
  const checks = value.checks && typeof value.checks === 'object' ? value.checks as Record<string, unknown> : {};
  if (!origin || !cleaned) return null;
  return {
    schemaVersion: Number(value.schemaVersion ?? 1),
    kind: 'atoumweb-library-cleaned-component',
    origin,
    cleaned: {
      html: typeof cleaned.html === 'string' ? cleaned.html : '',
      css: typeof cleaned.css === 'string' ? cleaned.css : '',
      javascript: typeof cleaned.javascript === 'string' ? cleaned.javascript : '',
      rootClasses: stringArray(cleaned.rootClasses),
    },
    checks: { remoteAssetUrls: stringArray(checks.remoteAssetUrls) },
    instructions: stringArray(value.instructions),
    notes: stringArray(value.notes),
  };
}

function parseBridgeReusableComponent(value: Record<string, unknown>): BridgeReusableComponent | null {
  const origin = parseBridgeOrigin(value.origin);
  const reusable = value.reusable && typeof value.reusable === 'object' ? value.reusable as Record<string, unknown> : null;
  const checks = value.checks && typeof value.checks === 'object' ? value.checks as Record<string, unknown> : {};
  if (!origin || !reusable) return null;
  return {
    schemaVersion: Number(value.schemaVersion ?? 1),
    kind: 'atoumweb-library-reusable-component',
    origin,
    reusable: {
      html: typeof reusable.html === 'string' ? reusable.html : '',
      css: typeof reusable.css === 'string' ? reusable.css : '',
      javascript: typeof reusable.javascript === 'string' ? reusable.javascript : '',
      rootClasses: stringArray(reusable.rootClasses),
      method: 'divi-code',
      instructions: stringArray(reusable.instructions),
    },
    checks: { remoteAssetUrls: stringArray(checks.remoteAssetUrls) },
    notes: stringArray(value.notes),
  };
}

function parseBridgeOrigin(value: unknown): BridgeLibraryCandidate['origin'] | null {
  if (!value || typeof value !== 'object') return null;
  const origin = value as Record<string, unknown>;
  return {
    site: typeof origin.site === 'string' ? origin.site : null,
    page: typeof origin.page === 'string' ? origin.page : 'Page inconnue',
    pageUrl: typeof origin.pageUrl === 'string' ? origin.pageUrl : null,
    snapshotId: typeof origin.snapshotId === 'string' ? origin.snapshotId : null,
    snapshotDate: typeof origin.snapshotDate === 'string' ? origin.snapshotDate : null,
    builderGeneration: typeof origin.builderGeneration === 'string' ? origin.builderGeneration : null,
    occurrenceId: typeof origin.occurrenceId === 'string' ? origin.occurrenceId : '',
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function inferBridgeLibraryCategory(candidate: BridgeLibraryCandidate): AtoumWebLibraryCategory {
  const roots = candidate.prepared.rootClasses.join(' ').toLowerCase();
  const markup = candidate.original.html.slice(0, 6000).toLowerCase();
  if (/\b(hero|banner-hero|main-hero)\b/.test(roots)) return 'hero';
  if (/\b(blog|articles?|posts?|news|actualit[eé]s?)\b/.test(roots)) return 'section';
  if (/\b(gallery|galerie)\b/.test(roots)) return 'gallery';
  if (/\b(carousel|slider)\b/.test(roots)) return 'carousel';
  if (/\b(form|formulaire|contact-form)\b/.test(roots)) return 'form';
  if (/\b(nav|navigation|menu)\b/.test(roots)) return 'navigation';
  if (/\b(site-header|global-header|main-header|header-global)\b/.test(roots) || /^\s*<header\b/.test(markup)) return 'header';
  if (/\b(site-footer|global-footer|main-footer|footer-global)\b/.test(roots) || /^\s*<footer\b/.test(markup)) return 'footer';
  return 'section';
}

function suggestedBridgeLibraryName(candidate: BridgeLibraryCandidate, category: AtoumWebLibraryCategory): string {
  const labels: Partial<Record<AtoumWebLibraryCategory, string>> = {
    header: 'Header', footer: 'Footer', hero: 'Hero', section: 'Section', form: 'Formulaire',
    gallery: 'Galerie', carousel: 'Carrousel', navigation: 'Navigation',
  };
  const root = candidate.prepared.rootClasses[0] ?? '';
  const cleaned = root.replace(/^atoum[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
  const detail = cleaned && !['hero', 'section', 'module', 'code'].includes(cleaned.toLowerCase())
    ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : candidate.origin.page;
  return `${labels[category] ?? 'Composant'} — ${detail}`;
}

function buildBridgeCleanedComponent(candidate: BridgeLibraryCandidate): BridgeCleanedComponent {
  const cssParts = [
    candidate.original.cssModule.trim() ? `/* CSS du module */\n${candidate.original.cssModule.trim()}` : '',
    candidate.prepared.cssPageUseful.trim() ? `/* CSS utile extrait de la page */\n${candidate.prepared.cssPageUseful.trim()}` : '',
    candidate.prepared.cssGlobalUseful.trim() ? `/* CSS global utile extrait du site */\n${candidate.prepared.cssGlobalUseful.trim()}` : '',
  ].filter(Boolean);
  const html = normalizeReusableText(candidate.original.html);
  const css = normalizeReusableText(cssParts.join('\n\n'));
  const javascript = normalizeReusableText(candidate.original.javascript);
  const remoteAssetUrls = extractRemoteAssetUrls(`${html}\n${css}`);

  return {
    schemaVersion: 1,
    kind: 'atoumweb-library-cleaned-component',
    origin: candidate.origin,
    cleaned: { html, css, javascript, rootClasses: candidate.prepared.rootClasses },
    checks: { remoteAssetUrls },
    instructions: [
      'Coller le HTML dans un module Code Divi.',
      ...(css ? ['Ajouter le CSS final du composant.'] : []),
      ...(javascript ? ['Ajouter le JavaScript séparé après vérification.'] : []),
    ],
    notes: [
      'Le CSS sans rapport avec les classes du composant n’est pas repris depuis la page ou le global.',
      ...(remoteAssetUrls.length ? [`${remoteAssetUrls.length} média(s) utilisent encore une URL distante.`] : []),
    ],
  };
}

function buildBridgeReusableComponent(cleaned: BridgeCleanedComponent): BridgeReusableComponent {
  return {
    schemaVersion: 1,
    kind: 'atoumweb-library-reusable-component',
    origin: cleaned.origin,
    reusable: {
      html: cleaned.cleaned.html,
      css: cleaned.cleaned.css,
      javascript: cleaned.cleaned.javascript,
      rootClasses: cleaned.cleaned.rootClasses,
      method: 'divi-code',
      instructions: [
        'Dans Divi, ajouter un module Code.',
        'Copier le HTML du composant dans le module Code.',
        ...(cleaned.cleaned.css ? ['Ajouter le CSS fourni dans le CSS de la page ou dans la zone prévue pour les composants AtoumWeb.'] : []),
        ...(cleaned.cleaned.javascript ? ['Ajouter le JavaScript fourni dans une zone d’intégration contrôlée et le tester avant mise en ligne.'] : []),
        ...(cleaned.checks.remoteAssetUrls.length ? ['Remplacer les URLs des médias par les copies locales du nouveau site dès que les assets auront été embarqués.'] : []),
      ],
    },
    checks: { remoteAssetUrls: cleaned.checks.remoteAssetUrls },
    notes: cleaned.notes,
  };
}

function normalizeReusableText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

function extractRemoteAssetUrls(value: string): string[] {
  const matches = value.match(/https?:\/\/[^"'\s)]+/gi) ?? [];
  return [...new Set(matches.filter((url) => /\.(?:avif|gif|jpe?g|png|svg|webp|woff2?|ttf|otf)(?:[?#].*)?$/i.test(url)))];
}

function buildBridgeCleanedPreview(component: BridgeCleanedComponent): string {
  return buildReusablePreviewDocument(component.origin.pageUrl, component.cleaned.html, component.cleaned.css);
}

function buildBridgeReusablePreview(component: BridgeReusableComponent): string {
  return buildReusablePreviewDocument(component.origin.pageUrl, component.reusable.html, component.reusable.css);
}

function buildReusablePreviewDocument(pageUrl: string | null, html: string, css: string): string {
  const base = pageUrl ? `<base href="${escapeAttribute(pageUrl)}">` : '';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${base}
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:; media-src https: data:;">
<style>html,body{margin:0;min-height:100%;background:#fff;color:#111}body{font-family:Arial,Helvetica,sans-serif}*,*::before,*::after{box-sizing:border-box}</style>
<style>${safeStyle(css)}</style>
</head>
<body>${html}</body>
</html>`;
}

function parseBridgeLibraryCandidate(contentType?: ProjectTechnicalContentType | null, content?: string | null): BridgeLibraryCandidate | null {
  if (contentType !== 'json' || !content?.trim()) return null;
  try {
    const value = JSON.parse(content) as Partial<BridgeLibraryCandidate>;
    if (value.kind !== 'atoumweb-bridge-library-candidate' || !value.origin || !value.original || !value.prepared) return null;
    return {
      schemaVersion: Number(value.schemaVersion ?? 1),
      kind: 'atoumweb-bridge-library-candidate',
      origin: {
        site: typeof value.origin.site === 'string' ? value.origin.site : null,
        page: typeof value.origin.page === 'string' ? value.origin.page : 'Page inconnue',
        pageUrl: typeof value.origin.pageUrl === 'string' ? value.origin.pageUrl : null,
        snapshotId: typeof value.origin.snapshotId === 'string' ? value.origin.snapshotId : null,
        snapshotDate: typeof value.origin.snapshotDate === 'string' ? value.origin.snapshotDate : null,
        builderGeneration: typeof value.origin.builderGeneration === 'string' ? value.origin.builderGeneration : null,
        occurrenceId: typeof value.origin.occurrenceId === 'string' ? value.origin.occurrenceId : '',
      },
      original: {
        html: typeof value.original.html === 'string' ? value.original.html : '',
        cssModule: typeof value.original.cssModule === 'string' ? value.original.cssModule : '',
        cssPage: typeof value.original.cssPage === 'string' ? value.original.cssPage : '',
        cssGlobal: typeof value.original.cssGlobal === 'string' ? value.original.cssGlobal : '',
        javascript: typeof value.original.javascript === 'string' ? value.original.javascript : '',
        diviSource: typeof value.original.diviSource === 'string' ? value.original.diviSource : null,
      },
      prepared: {
        cssPageUseful: typeof value.prepared.cssPageUseful === 'string' ? value.prepared.cssPageUseful : '',
        cssGlobalUseful: typeof value.prepared.cssGlobalUseful === 'string' ? value.prepared.cssGlobalUseful : '',
        rootClasses: Array.isArray(value.prepared.rootClasses) ? value.prepared.rootClasses.filter((item): item is string => typeof item === 'string') : [],
        instructions: Array.isArray(value.prepared.instructions) ? value.prepared.instructions.filter((item): item is string => typeof item === 'string') : [],
        notes: Array.isArray(value.prepared.notes) ? value.prepared.notes.filter((item): item is string => typeof item === 'string') : [],
      },
    };
  } catch {
    return null;
  }
}

function buildBridgeCandidatePreview(candidate: BridgeLibraryCandidate): string {
  const base = candidate.origin.pageUrl ? `<base href="${escapeAttribute(candidate.origin.pageUrl)}">` : '';
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
<style>${safeStyle(candidate.prepared.cssGlobalUseful)}</style>
<style>${safeStyle(candidate.prepared.cssPageUseful)}</style>
<style>${safeStyle(candidate.original.cssModule)}</style>
</head>
<body>
${candidate.original.html}
</body>
</html>`;
}

function safeStyle(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style');
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function lineCount(value: string): number {
  return value.trim() ? value.split(/\r?\n/).length : 0;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
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

function Summary({ icon, label, value }: { icon: OperationIconName; label: string; value: number }) {
  return <article className="kpi-card aw-library-kpi"><span className="aw-library-kpi-icon"><OperationIcon name={icon} size={27} /></span><div><span>{label}</span><strong>{value}</strong><small>Bibliothèque AtoumWeb</small></div></article>;
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

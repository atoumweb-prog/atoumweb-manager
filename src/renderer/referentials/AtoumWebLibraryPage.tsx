import { useEffect, useMemo, useState } from 'react';
import type {
  AtoumWebLibraryCategory,
  AtoumWebOccurrenceReturnDetail,
  AtoumWebOccurrenceReturnInspection,
  AtoumWebOccurrenceReturnSummary,
  AtoumWebOccurrenceVariantTarget,
  AtoumWebPackageInspection,
  AtoumWebReuseStatus,
  AtoumWebTechnicalAsset,
  AtoumWebTechnicalAssetRole,
  AtoumWebTechnicalItemDetail,
  AtoumWebTechnicalItemSummary,
  AtoumWebTechnicalVersion,
} from '../../shared/referentials';
import type { ProjectTechnicalContentType } from '../../shared/projects';
import { assessBridgeReusableValidation } from '../../shared/bridgeReusableValidation';
import { generalizeReusableCssColors } from '../../shared/reusableCssColors';
import { TechnicalContentViewer } from './TechnicalContentViewer';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
import './AtoumWebLibraryPage.css';

const BRIDGE_REUSABLE_GENERATOR_REVISION = 2;

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
  { id: 'code_snippet', label: 'Code snippets' },
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

const VERTICAL_SUGGESTIONS = [
  'mariage',
  'automobile',
  'fleuriste',
  'patisserie',
  'restaurant',
  'artisan',
  'coach',
  'immobilier',
] as const;

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

const BRIDGE_HUMAN_VALIDATION_TAG = 'bridge-human-validated';

interface Props {
  onMessage: (message: string) => void;
  initialItemId?: string | null;
  headerCollapsed?: boolean;
  onToggleHeader?: () => void;
}

interface CreationForm {
  name: string;
  category: AtoumWebLibraryCategory;
  reuseStatus: AtoumWebReuseStatus;
  description: string;
  tags: string;
  vertical: string;
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
  vertical: string;
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
    dependencies?: Array<{
      dependencyId: string;
      type: string;
      slug: string | null;
      name: string;
      version: string | null;
      active: boolean | null;
    }>;
    assets?: Array<{
      assetId: string;
      type: string;
      url: string | null;
      localPath: string | null;
      mimeType: string | null;
      hash: string | null;
      archiveMode: string | null;
    }>;
    instructions: string[];
    notes: string[];
  };
}

interface BridgeWorkComponent {
  schemaVersion: number;
  kind: 'atoumweb-library-work-component';
  origin: BridgeLibraryCandidate['origin'];
  work: {
    html: string;
    css: string;
    javascript: string;
    rootClasses: string[];
  };
  dependencies: NonNullable<BridgeLibraryCandidate['prepared']['dependencies']>;
  assets: NonNullable<BridgeLibraryCandidate['prepared']['assets']>;
  checks: {
    remoteAssetUrls: string[];
  };
  instructions: string[];
  notes: string[];
}

interface BridgeReusableField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'rich_text' | 'link' | 'url' | 'image' | 'color' | 'number' | 'select' | 'toggle' | 'icon';
  selector: string;
  originalValue: string;
  defaultValue: string;
  group?: string | null;
  required?: boolean;
  binding?: Record<string, unknown> | null;
  sourceMode?: 'declared' | 'auto_detected';
}

interface BridgeReusableComponent {
  schemaVersion: number;
  generatorRevision: number;
  kind: 'atoumweb-library-reusable-component';
  origin: BridgeLibraryCandidate['origin'];
  reusable: {
    html: string;
    css: string;
    javascript: string;
    rootClasses: string[];
    method: 'divi-code';
    instructions: string[];
    generalized: boolean;
    fields: BridgeReusableField[];
  };
  dependencies: NonNullable<BridgeLibraryCandidate['prepared']['dependencies']>;
  assets: NonNullable<BridgeLibraryCandidate['prepared']['assets']>;
  checks: {
    remoteAssetUrls: string[];
  };
  notes: string[];
}

type BridgeLibraryPayload =
  | { stage: 'original'; value: BridgeLibraryCandidate }
  | { stage: 'work'; value: BridgeWorkComponent }
  | { stage: 'reusable'; value: BridgeReusableComponent };

type BridgeStageView = 'original' | 'work' | 'reusable';

const EMPTY_FORM: CreationForm = {
  name: '',
  category: 'section',
  reuseStatus: 'adapt',
  description: '',
  tags: '',
  vertical: '',
  contentType: 'code',
  language: '',
  contentText: '',
  notes: '',
};

function metadataFromItem(item: AtoumWebTechnicalItemDetail): MetadataForm {
  return {
    name: item.name,
    category: item.category,
    reuseStatus: effectiveReuseStatus(item),
    description: item.description ?? '',
    tags: (item.tags ?? []).filter((tag) => tag !== BRIDGE_HUMAN_VALIDATION_TAG).join(', '),
    vertical: item.vertical ?? '',
    originTechnicalItemId: item.originTechnicalItemId ?? '',
  };
}

export function AtoumWebLibraryPage({ onMessage, initialItemId, headerCollapsed = false, onToggleHeader }: Props) {
  const [items, setItems] = useState<AtoumWebTechnicalItemSummary[]>([]);
  const [selected, setSelected] = useState<AtoumWebTechnicalItemDetail | null>(null);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AtoumWebLibraryCategory | ''>('');
  const [reuseStatus, setReuseStatus] = useState<AtoumWebReuseStatus | ''>('');
  const [vertical, setVertical] = useState('');
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
  const [occurrenceReturns, setOccurrenceReturns] = useState<AtoumWebOccurrenceReturnSummary[]>([]);
  const [occurrenceReturnInspection, setOccurrenceReturnInspection] = useState<AtoumWebOccurrenceReturnInspection | null>(null);
  const [selectedOccurrenceReturn, setSelectedOccurrenceReturn] = useState<AtoumWebOccurrenceReturnDetail | null>(null);
  const [occurrenceVariantTargets, setOccurrenceVariantTargets] = useState<AtoumWebOccurrenceVariantTarget[]>([]);
  const [occurrenceDecisionMode, setOccurrenceDecisionMode] = useState<'create_variant' | 'update_variant' | 'new_family' | null>(null);
  const [occurrenceDecisionName, setOccurrenceDecisionName] = useState('');
  const [occurrenceDecisionTargetVariantId, setOccurrenceDecisionTargetVariantId] = useState('');
  const [showOccurrenceReturns, setShowOccurrenceReturns] = useState(false);
  const [occurrenceReturnBusy, setOccurrenceReturnBusy] = useState(false);
  const [bridgeWorkflowBusy, setBridgeWorkflowBusy] = useState(false);
  const [bridgeStageView, setBridgeStageView] = useState<BridgeStageView>('original');
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
    const sameItem = selected?.id === detail.id;
    setSelected(detail);
    if (!sameItem) setDetailExpanded(false);
    setMetadataForm(metadataFromItem(detail));
    setExpandedVersionId(null);
    const preferredVersion = detail.currentVersion?.id ?? detail.versions[0]?.id ?? '';
    const currentPayload = parseBridgeLibraryPayload(detail.currentVersion?.contentType, detail.currentVersion?.contentText);
    if (!sameItem) setBridgeStageView(currentPayload?.stage ?? 'original');
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
        vertical: vertical || null,
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
  }, [search, category, reuseStatus, vertical, includeArchived, initialItemId]);

  useEffect(() => {
    void loadOccurrenceReturns();
  }, []);

  const summary = useMemo(() => ({
    total: items.length,
    ready: items.filter((item) => effectiveReuseStatus(item) === 'ready').length,
    adapt: items.filter((item) => effectiveReuseStatus(item) === 'adapt').length,
    references: items.filter((item) => effectiveReuseStatus(item) === 'reference').length,
  }), [items]);

  const pendingOccurrenceReturnCount = useMemo(
    () => occurrenceReturns.filter((item) => !item.decision).length,
    [occurrenceReturns],
  );

  const currentVersion = selected?.currentVersion ?? selected?.versions[0] ?? null;
  const bridgeWorkflow = useMemo(() => {
    const parsed = (selected?.versions ?? [])
      .map((version) => ({ version, payload: parseBridgeLibraryPayload(version.contentType, version.contentText) }))
      .filter((entry): entry is { version: AtoumWebTechnicalVersion; payload: BridgeLibraryPayload } => Boolean(entry.payload));
    return {
      original: parsed.find((entry) => entry.payload.stage === 'original') ?? null,
      work: parsed.find((entry) => entry.payload.stage === 'work') ?? null,
      reusable: parsed.find((entry) => entry.payload.stage === 'reusable') ?? null,
    };
  }, [selected?.id, selected?.versions]);
  const displayedBridgeEntry = bridgeStageView === 'original'
    ? bridgeWorkflow.original
    : bridgeStageView === 'work'
      ? bridgeWorkflow.work
      : bridgeWorkflow.reusable;
  const reusableNeedsRefresh = Boolean(
    bridgeWorkflow.work
    && (
      !bridgeWorkflow.reusable
      || bridgeWorkflow.work.version.versionNumber > bridgeWorkflow.reusable.version.versionNumber
      || (bridgeWorkflow.reusable.payload.stage === 'reusable'
        && (
          !bridgeWorkflow.reusable.payload.value.reusable.generalized
          || bridgeWorkflow.reusable.payload.value.generatorRevision < BRIDGE_REUSABLE_GENERATOR_REVISION
        ))
    ),
  );
  const reusableValidation = bridgeWorkflow.reusable?.payload.stage === 'reusable'
    ? bridgeReusableValidation(bridgeWorkflow.reusable.payload.value)
    : null;
  const reusableValidated = Boolean(
    selected
    && bridgeWorkflow.reusable
    && !reusableNeedsRefresh
    && bridgeWorkflow.reusable.version.stable
    && selected.reuseStatus === 'ready'
    && selected.tags?.includes(BRIDGE_HUMAN_VALIDATION_TAG)
    && reusableValidation?.automaticChecksPassed
  );
  const legacyReusableStable = Boolean(
    selected
    && bridgeWorkflow.reusable
    && !reusableNeedsRefresh
    && bridgeWorkflow.reusable.version.stable
    && selected.reuseStatus === 'ready'
    && !selected.tags?.includes(BRIDGE_HUMAN_VALIDATION_TAG)
  );

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
          vertical: form.vertical || null,
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
    if (bridgeWorkflow.original && metadataForm.reuseStatus === 'ready' && !reusableValidated) {
      setError('Pour un composant Bridge, le statut « Prêt à réutiliser » est attribué uniquement après validation humaine de la version réutilisable.');
      return;
    }
    try {
      setError(null);
      const changed = await window.atoumweb.referentials.library.update(selected.id, {
        name: metadataForm.name,
        category: metadataForm.category,
        reuseStatus: metadataForm.reuseStatus,
        description: metadataForm.description || null,
        tags: mergeLibraryTags(
          metadataForm.tags.split(',').map((tag) => tag.trim()).filter((tag) => Boolean(tag) && tag !== BRIDGE_HUMAN_VALIDATION_TAG),
          selected.tags?.includes(BRIDGE_HUMAN_VALIDATION_TAG) ? [BRIDGE_HUMAN_VALIDATION_TAG] : [],
        ),
        vertical: metadataForm.vertical || null,
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

  async function createBridgeWorkVersion(): Promise<void> {
    if (!selected || bridgeWorkflow.work) return;
    const payload = bridgeWorkflow.original?.payload;
    if (!payload || payload.stage !== 'original') {
      setError('La version originale Bridge est introuvable.');
      return;
    }

    setBridgeWorkflowBusy(true);
    try {
      setError(null);
      const work = buildBridgeWorkComponent(payload.value);
      let changed = await window.atoumweb.referentials.library.createVersion(selected.id, {
        contentType: 'json',
        language: 'json',
        contentText: JSON.stringify(work, null, 2),
        notes: 'Version de travail — HTML isolé, CSS utile consolidé et JavaScript séparé. L’original reste intact.',
      });

      const category = inferBridgeLibraryCategory(payload.value);
      const name = suggestedBridgeLibraryName(payload.value, category);
      changed = await window.atoumweb.referentials.library.update(changed.id, {
        category,
        name,
        reuseStatus: 'adapt',
        tags: mergeLibraryTags(removeLibraryTags(changed.tags, [BRIDGE_HUMAN_VALIDATION_TAG]), ['bridge-stage-original', 'bridge-stage-work']),
      });

      setBridgeStageView('work');
      await load(changed.id);
      await setOpenedItem(changed);
      setBridgeStageView('work');
      onMessage(`Version de travail créée pour « ${changed.name} ».`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de créer la version de travail.');
    } finally {
      setBridgeWorkflowBusy(false);
    }
  }

  async function saveBridgeWorkVersion(work: BridgeWorkComponent): Promise<void> {
    if (!selected) return;
    setBridgeWorkflowBusy(true);
    try {
      setError(null);
      const normalized = refreshBridgeWorkChecks(work);
      let changed = await window.atoumweb.referentials.library.createVersion(selected.id, {
        contentType: 'json',
        language: 'json',
        contentText: JSON.stringify(normalized, null, 2),
        notes: 'Nouvelle révision de travail enregistrée depuis l’éditeur du Manager.',
      });
      changed = await window.atoumweb.referentials.library.update(changed.id, {
        reuseStatus: 'adapt',
        tags: mergeLibraryTags(removeLibraryTags(changed.tags, [BRIDGE_HUMAN_VALIDATION_TAG]), ['bridge-stage-original', 'bridge-stage-work']),
      });
      setBridgeStageView('work');
      await load(changed.id);
      await setOpenedItem(changed);
      setBridgeStageView('work');
      onMessage(`Nouvelle révision de travail enregistrée pour « ${changed.name} ».`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer la version de travail.');
    } finally {
      setBridgeWorkflowBusy(false);
    }
  }

  async function createBridgeReusableVersion(): Promise<void> {
    if (!selected || !reusableNeedsRefresh) return;
    const payload = bridgeWorkflow.work?.payload;
    if (!payload || payload.stage !== 'work') {
      setError('Crée d’abord une version de travail.');
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

      const tags = mergeLibraryTags(removeLibraryTags(changed.tags, [BRIDGE_HUMAN_VALIDATION_TAG]), ['bridge-stage-original', 'bridge-stage-work', 'bridge-stage-reusable']);
      changed = await window.atoumweb.referentials.library.update(changed.id, { reuseStatus: 'adapt', tags });

      setBridgeStageView('reusable');
      await load(changed.id);
      await setOpenedItem(changed);
      setBridgeStageView('reusable');
      onMessage(!reusable.reusable.generalized
        ? `Version réutilisable préparée pour « ${changed.name} », mais la généralisation automatique doit être reprise avant validation.`
        : reusable.checks.remoteAssetUrls.length
          ? `Version réutilisable préparée pour « ${changed.name} ». Les ressources distantes restantes doivent encore devenir locales avant validation.`
          : `Version réutilisable préparée pour « ${changed.name} ». Une validation humaine est requise avant le statut « Prêt à réutiliser ».`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de préparer la version réutilisable.');
    } finally {
      setBridgeWorkflowBusy(false);
    }
  }

  async function validateBridgeReusableVersion(): Promise<void> {
    if (!selected || !bridgeWorkflow.reusable || reusableNeedsRefresh || bridgeWorkflow.reusable.payload.stage !== 'reusable') {
      setError('Prépare d’abord une version réutilisable à jour.');
      return;
    }
    const assessment = bridgeReusableValidation(bridgeWorkflow.reusable.payload.value);
    if (!assessment.automaticChecksPassed) {
      setError('Validation impossible : ' + assessment.blockers.join(' '));
      return;
    }

    setBridgeWorkflowBusy(true);
    try {
      setError(null);
      let changed = bridgeWorkflow.reusable.version.stable
        ? await window.atoumweb.referentials.library.get(selected.id)
        : await window.atoumweb.referentials.library.markStable(bridgeWorkflow.reusable.version.id);
      changed = await window.atoumweb.referentials.library.update(changed.id, {
        reuseStatus: 'ready',
        tags: mergeLibraryTags(changed.tags, [BRIDGE_HUMAN_VALIDATION_TAG]),
      });
      await load(changed.id);
      await setOpenedItem(changed);
      setBridgeStageView('reusable');
      onMessage(`« ${changed.name} » a été validé humainement : version stable et prête à réutiliser.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de valider cette version réutilisable.');
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

  async function exportPackage(versionId?: string | null, bridgeWorkbench = false): Promise<void> {
    if (!selected) return;
    setPackageBusy(true);
    try {
      setError(null);
      const exported = await window.atoumweb.referentials.packages.exportItem(selected.id, (versionId ?? assetVersionId) || null);
      const shown = await window.atoumweb.referentials.packages.showExport(exported.path);
      if (!shown.ok) setError(shown.error ?? 'Le paquet a été créé mais son emplacement ne peut pas être affiché.');
      const transportMessage = exported.assetTransport.complete
        ? 'Transport des assets déclarés complet.'
        : 'Transport incomplet : ' + exported.assetTransport.issues.join(' ');
      onMessage((bridgeWorkbench
        ? `Package Bridge/Workbench préparé : ${exported.fileName} · v${exported.versionNumber}.`
        : `Paquet ZIP exporté : ${exported.fileName} · v${exported.versionNumber} · ${exported.assetCount} fichier(s).`) + ' ' + transportMessage);
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

  function resetOccurrenceDecisionEditor(): void {
    setOccurrenceDecisionMode(null);
    setOccurrenceDecisionName('');
    setOccurrenceDecisionTargetVariantId('');
  }

  async function loadOccurrenceReturnContext(id: string): Promise<AtoumWebOccurrenceReturnDetail> {
    const [detail, targets] = await Promise.all([
      window.atoumweb.referentials.occurrenceReturns.get(id),
      window.atoumweb.referentials.occurrenceReturns.listVariantTargets(id),
    ]);
    setSelectedOccurrenceReturn(detail);
    setOccurrenceVariantTargets(targets);
    resetOccurrenceDecisionEditor();
    return detail;
  }

  async function loadOccurrenceReturns(preferredId?: string | null): Promise<void> {
    try {
      const next = await window.atoumweb.referentials.occurrenceReturns.list();
      setOccurrenceReturns(next);
      const id = preferredId ?? selectedOccurrenceReturn?.id;
      if (id && next.some((item) => item.id === id)) {
        await loadOccurrenceReturnContext(id);
      } else if (selectedOccurrenceReturn && !next.some((item) => item.id === selectedOccurrenceReturn.id)) {
        setSelectedOccurrenceReturn(null);
        setOccurrenceVariantTargets([]);
        resetOccurrenceDecisionEditor();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger les retours Bridge.');
    }
  }

  async function inspectOccurrenceReturn(): Promise<void> {
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      const inspection = await window.atoumweb.referentials.occurrenceReturns.inspectImport();
      if (!inspection) return;
      setOccurrenceReturnInspection(inspection);
      setShowOccurrenceReturns(true);
      if (inspection.existingReturnId) {
        await loadOccurrenceReturnContext(inspection.existingReturnId);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Inspection du retour Bridge impossible.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function importInspectedOccurrenceReturn(): Promise<void> {
    if (!occurrenceReturnInspection) return;
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      const imported = await window.atoumweb.referentials.occurrenceReturns.importReturn(occurrenceReturnInspection.packagePath);
      setOccurrenceReturnInspection(null);
      setShowOccurrenceReturns(true);
      await loadOccurrenceReturns(imported.id);
      onMessage(`Retour Bridge importé : ${imported.siteOccurrenceId} · source ${imported.libraryItemName} v${imported.libraryVersionNumber}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import du retour Bridge impossible.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function openOccurrenceReturn(id: string): Promise<void> {
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      await loadOccurrenceReturnContext(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir ce retour Bridge.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function keepOccurrenceReturn(): Promise<void> {
    if (!selectedOccurrenceReturn) return;
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      const decided = await window.atoumweb.referentials.occurrenceReturns.keepOccurrence(selectedOccurrenceReturn.id);
      setSelectedOccurrenceReturn(decided);
      await loadOccurrenceReturns(decided.id);
      onMessage('Décision enregistrée : conserver uniquement cette occurrence.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer la décision.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function createOccurrenceVariant(): Promise<void> {
    if (!selectedOccurrenceReturn) return;
    if (!occurrenceDecisionName.trim()) {
      setError('Donne un nom à la nouvelle variante.');
      return;
    }
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      const decided = await window.atoumweb.referentials.occurrenceReturns.createVariant(selectedOccurrenceReturn.id, {
        name: occurrenceDecisionName.trim(),
      });
      await loadOccurrenceReturns(decided.id);
      if (decided.resultTechnicalItemId) await openPromotedLibraryItem(decided.resultTechnicalItemId);
      onMessage('Occurrence promue en nouvelle variante réutilisable.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création de la variante impossible.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function updateOccurrenceVariant(): Promise<void> {
    if (!selectedOccurrenceReturn) return;
    if (!occurrenceDecisionTargetVariantId) {
      setError('Choisis la variante à mettre à jour.');
      return;
    }
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      const decided = await window.atoumweb.referentials.occurrenceReturns.updateVariant(selectedOccurrenceReturn.id, {
        targetVariantId: occurrenceDecisionTargetVariantId,
      });
      await loadOccurrenceReturns(decided.id);
      if (decided.resultTechnicalItemId) await openPromotedLibraryItem(decided.resultTechnicalItemId);
      onMessage('Occurrence appliquée à la variante choisie.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mise à jour de la variante impossible.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function createOccurrenceFamily(): Promise<void> {
    if (!selectedOccurrenceReturn) return;
    if (!occurrenceDecisionName.trim()) {
      setError('Donne un nom à la nouvelle famille.');
      return;
    }
    setOccurrenceReturnBusy(true);
    try {
      setError(null);
      const decided = await window.atoumweb.referentials.occurrenceReturns.createFamily(selectedOccurrenceReturn.id, {
        name: occurrenceDecisionName.trim(),
      });
      await loadOccurrenceReturns(decided.id);
      if (decided.resultTechnicalItemId) await openPromotedLibraryItem(decided.resultTechnicalItemId);
      onMessage('Occurrence détachée dans une nouvelle famille de composants.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création de la nouvelle famille impossible.');
    } finally {
      setOccurrenceReturnBusy(false);
    }
  }

  async function openPromotedLibraryItem(itemId: string): Promise<void> {
    setSearch('');
    setCategory('');
    setReuseStatus('');
    setVertical('');
    setIncludeArchived(false);
    await setOpenedItem(await window.atoumweb.referentials.library.get(itemId));
  }

  return (
    <div className={`aw-library ${headerCollapsed ? 'head-collapsed' : ''}`}>
      <div className="aw-library-fixed-head">
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
        <input list="aw-library-vertical-options" value={vertical} onChange={(event) => setVertical(event.target.value)} placeholder="Métier : tous" aria-label="Filtrer par métier" />
        <datalist id="aw-library-vertical-options">
          {[...new Set([...VERTICAL_SUGGESTIONS, ...items.map((item) => item.vertical).filter((value): value is string => Boolean(value))])].map((value) => <option key={value} value={value} />)}
        </datalist>
        <label className="aw-library-checkbox"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} /> Archivés</label>
        <button className="secondary-button" type="button" disabled={packageBusy} onClick={() => void inspectPackage()}><OperationIcon name="upload" size={16} /> Importer ZIP</button>
        <button className="secondary-button" type="button" disabled={occurrenceReturnBusy} onClick={() => void inspectOccurrenceReturn()}><OperationIcon name="upload" size={16} /> Retour Bridge</button>
        {occurrenceReturns.length > 0 && <button className="secondary-button" type="button" onClick={() => setShowOccurrenceReturns((value) => !value)}>Retours {pendingOccurrenceReturnCount ? `· ${pendingOccurrenceReturnCount} à décider` : `· ${occurrenceReturns.length}`}</button>}
        <button className="primary-button" type="button" onClick={() => setCreating((value) => !value)}>{creating ? 'Fermer' : 'Nouveau composant'}</button>
        </article>
      </div>

      {onToggleHeader && <button
        className="aw-library-head-toggle"
        type="button"
        onClick={onToggleHeader}
        title={headerCollapsed ? 'Afficher le bandeau de la Bibliothèque' : 'Masquer le bandeau de la Bibliothèque'}
        aria-label={headerCollapsed ? 'Afficher le bandeau de la Bibliothèque' : 'Masquer le bandeau de la Bibliothèque'}
        aria-expanded={!headerCollapsed}
      >
        <span aria-hidden="true">{headerCollapsed ? '↓' : '↑'}</span>
        <small>{headerCollapsed ? 'Afficher' : 'Masquer'}</small>
      </button>}

      {occurrenceReturnInspection && <article className="panel aw-library-package-review">
        <div className="panel-title">
          <div><span className="eyebrow">Occurrence Return V1</span><h2>{occurrenceReturnInspection.libraryItemName}</h2></div>
          <button className="secondary-button" type="button" onClick={() => setOccurrenceReturnInspection(null)}>Fermer</button>
        </div>
        <div className="aw-library-package-grid">
          <div><span>Occurrence</span><strong>{occurrenceReturnInspection.siteOccurrenceId}</strong></div>
          <div><span>Source Manager</span><strong>v{occurrenceReturnInspection.libraryVersionNumber}</strong></div>
          <div><span>État Bridge</span><strong>{occurrenceReturnInspection.occurrenceState}</strong></div>
          <div><span>Retour</span><strong>{formatLibraryDate(occurrenceReturnInspection.returnedAt)}</strong></div>
        </div>
        <OccurrenceChangesSummary changes={occurrenceReturnInspection.changes} />
        <p className="technical-safety-note">Le retour est vérifié contre le contrat V1, ses SHA-256 et la version Bibliothèque qui a créé l’occurrence. Aucune décision de Bibliothèque n’est appliquée automatiquement.</p>
        {occurrenceReturnInspection.alreadyImported
          ? <p role="status">Ce package a déjà été importé. L’import est idempotent : aucune copie supplémentaire ne sera créée.</p>
          : <button className="primary-button" type="button" disabled={occurrenceReturnBusy} onClick={() => void importInspectedOccurrenceReturn()}>Importer le retour vérifié</button>}
      </article>}

      {showOccurrenceReturns && occurrenceReturns.length > 0 && <article className="panel aw-library-package-review">
        <div className="panel-title">
          <div><span className="eyebrow">Bridge → Manager</span><h2>Retours d’occurrences</h2></div>
          <button className="secondary-button" type="button" onClick={() => setShowOccurrenceReturns(false)}>Masquer</button>
        </div>
        <div className="aw-library-package-duplicates">
          {occurrenceReturns.map((item) => <button type="button" key={item.id} onClick={() => void openOccurrenceReturn(item.id)}>
            <span>{occurrenceReturnDecisionLabel(item)}</span>
            <strong>{item.libraryItemName} · v{item.libraryVersionNumber}</strong>
            <small>{item.siteOccurrenceId} · {formatLibraryDate(item.returnedAt)}</small>
          </button>)}
        </div>
      </article>}

      {selectedOccurrenceReturn && <article className="panel aw-library-package-review">
        <div className="panel-title">
          <div><span className="eyebrow">Revue du retour</span><h2>{selectedOccurrenceReturn.libraryItemName} · v{selectedOccurrenceReturn.libraryVersionNumber}</h2></div>
          <button className="secondary-button" type="button" onClick={() => { setSelectedOccurrenceReturn(null); setOccurrenceVariantTargets([]); resetOccurrenceDecisionEditor(); }}>Fermer</button>
        </div>
        <div className="aw-library-package-grid">
          <div><span>Occurrence</span><strong>{selectedOccurrenceReturn.siteOccurrenceId}</strong></div>
          <div><span>Site cible</span><strong>{selectedOccurrenceReturn.occurrence.target.siteUrl ?? selectedOccurrenceReturn.occurrence.target.siteKey ?? 'Non renseigné'}</strong></div>
          <div><span>Workbench</span><strong>{selectedOccurrenceReturn.occurrence.target.workbenchId}</strong></div>
          <div><span>État</span><strong>{selectedOccurrenceReturn.occurrenceState}</strong></div>
        </div>
        <OccurrenceChangesSummary changes={selectedOccurrenceReturn.changes} />
        <details className="aw-library-secondary-panel">
          <summary><div><span className="eyebrow">Contenu revenu</span><strong>HTML / CSS / JavaScript</strong></div></summary>
          <div className="aw-library-secondary-body">
            <TechnicalContentViewer contentType="code" language="html" content={selectedOccurrenceReturn.html} title="HTML retourné" onMessage={onMessage} />
            {selectedOccurrenceReturn.css && <TechnicalContentViewer contentType="code" language="css" content={selectedOccurrenceReturn.css} title="CSS retourné" onMessage={onMessage} />}
            {selectedOccurrenceReturn.javascript && <TechnicalContentViewer contentType="code" language="javascript" content={selectedOccurrenceReturn.javascript} title="JavaScript retourné" onMessage={onMessage} />}
          </div>
        </details>
        <details className="aw-library-secondary-panel">
          <summary><div><span className="eyebrow">Traçabilité</span><strong>Provenance du retour</strong></div></summary>
          <div className="aw-library-secondary-body">
            <TechnicalContentViewer contentType="json" language="json" content={JSON.stringify(selectedOccurrenceReturn.provenance, null, 2)} title="Provenance" onMessage={onMessage} />
          </div>
        </details>
        <div className="aw-library-section-title">
          <div><span className="eyebrow">Décision humaine</span><h3>Que faire de cette occurrence ?</h3></div>
        </div>
        {selectedOccurrenceReturn.decision && selectedOccurrenceReturn.decision !== 'keep_occurrence'
          ? <div className="aw-bridge-candidate-state reusable">
              <OperationIcon name="check-circle" size={18} />
              <div>
                <strong>{selectedOccurrenceReturn.decision === 'create_variant'
                  ? 'Nouvelle variante créée'
                  : selectedOccurrenceReturn.decision === 'update_variant'
                    ? 'Variante mise à jour'
                    : 'Nouvelle famille créée'}</strong>
                <span>Le résultat est maintenant un composant de la Bibliothèque, avec la provenance de cette occurrence conservée.</span>
              </div>
              {selectedOccurrenceReturn.resultTechnicalItemId && <button className="secondary-button" type="button" onClick={() => void openPromotedLibraryItem(selectedOccurrenceReturn.resultTechnicalItemId!)}>Ouvrir dans la Bibliothèque</button>}
            </div>
          : <>
              {selectedOccurrenceReturn.decision === 'keep_occurrence' && <div className="aw-bridge-candidate-state reusable">
                <OperationIcon name="check-circle" size={18} />
                <div><strong>Occurrence conservée</strong><span>Elle reste historisée sans modifier la Bibliothèque source. Tu peux encore la promouvoir ci-dessous.</span></div>
              </div>}
              <div className="button-row">
                {!selectedOccurrenceReturn.decision && <button className="primary-button" type="button" disabled={occurrenceReturnBusy} onClick={() => void keepOccurrenceReturn()}>Conserver uniquement cette occurrence</button>}
                <button className="secondary-button" type="button" disabled={occurrenceReturnBusy} onClick={() => { setOccurrenceDecisionMode('create_variant'); setOccurrenceDecisionName(''); setOccurrenceDecisionTargetVariantId(''); }}>Créer une nouvelle variante</button>
                <button className="secondary-button" type="button" disabled={occurrenceReturnBusy || occurrenceVariantTargets.length === 0} title={occurrenceVariantTargets.length ? undefined : 'Aucune variante existante dans cette famille'} onClick={() => { setOccurrenceDecisionMode('update_variant'); setOccurrenceDecisionName(''); setOccurrenceDecisionTargetVariantId(occurrenceVariantTargets[0]?.variantId ?? ''); }}>Mettre à jour une variante</button>
                <button className="secondary-button" type="button" disabled={occurrenceReturnBusy} onClick={() => { setOccurrenceDecisionMode('new_family'); setOccurrenceDecisionName(''); setOccurrenceDecisionTargetVariantId(''); }}>Détacher / nouvelle famille</button>
              </div>

              {occurrenceDecisionMode === 'create_variant' && <div className="aw-library-form-grid">
                <label>Nom de la variante<input value={occurrenceDecisionName} onChange={(event) => setOccurrenceDecisionName(event.target.value)} placeholder="Ex. Menthe & ivoire" /></label>
                <div className="button-row">
                  <button className="primary-button" type="button" disabled={occurrenceReturnBusy || !occurrenceDecisionName.trim()} onClick={() => void createOccurrenceVariant()}>Créer la variante</button>
                  <button className="secondary-button" type="button" onClick={resetOccurrenceDecisionEditor}>Annuler</button>
                </div>
              </div>}

              {occurrenceDecisionMode === 'update_variant' && <div className="aw-library-form-grid">
                <label>Variante cible<select value={occurrenceDecisionTargetVariantId} onChange={(event) => setOccurrenceDecisionTargetVariantId(event.target.value)}>
                  <option value="">Choisir…</option>
                  {occurrenceVariantTargets.map((variant) => <option value={variant.variantId} key={variant.variantId}>{variant.itemName} · {variant.variantKey}{variant.isSourceVariant ? ' · occurrence source' : ''}</option>)}
                </select></label>
                <div className="button-row">
                  <button className="primary-button" type="button" disabled={occurrenceReturnBusy || !occurrenceDecisionTargetVariantId} onClick={() => void updateOccurrenceVariant()}>Créer une nouvelle version de cette variante</button>
                  <button className="secondary-button" type="button" onClick={resetOccurrenceDecisionEditor}>Annuler</button>
                </div>
              </div>}

              {occurrenceDecisionMode === 'new_family' && <div className="aw-library-form-grid">
                <label>Nom de la nouvelle famille<input value={occurrenceDecisionName} onChange={(event) => setOccurrenceDecisionName(event.target.value)} placeholder="Ex. Section message éditorial" /></label>
                <div className="button-row">
                  <button className="primary-button" type="button" disabled={occurrenceReturnBusy || !occurrenceDecisionName.trim()} onClick={() => void createOccurrenceFamily()}>Créer la famille</button>
                  <button className="secondary-button" type="button" onClick={resetOccurrenceDecisionEditor}>Annuler</button>
                </div>
              </div>}
            </>}
        {selectedOccurrenceReturn.changes.structuralChange && !selectedOccurrenceReturn.decision && <p className="technical-safety-note">Bridge signale un changement structurel. « Détacher / nouvelle famille » permet de conserver cette adaptation sans faire évoluer silencieusement la famille source.</p>}
      </article>}

      {packageInspection && <article className="panel aw-library-package-review">
        <div className="panel-title"><div><span className="eyebrow">Import contrôlé</span><h2>{packageInspection.item.name}</h2></div><button className="secondary-button" type="button" onClick={() => setPackageInspection(null)}>Fermer</button></div>
        <div className="aw-library-package-grid">
          <div><span>Catégorie</span><strong>{categoryLabel(packageInspection.item.category)}</strong></div>
          <div><span>Métier</span><strong>{packageInspection.item.vertical ? verticalLabel(packageInspection.item.vertical) : 'Tous métiers / non classé'}</strong></div>
          <div><span>Version exportée</span><strong>v{packageInspection.version.exportedVersionNumber}{packageInspection.version.stable ? ' · stable' : ''}</strong></div>
          <div><span>Assets</span><strong>{packageInspection.assetCount}{packageInspection.missingAssetCount ? ` · ${packageInspection.missingAssetCount} manquant(s)` : ''}</strong></div>
          <div><span>Doublons probables</span><strong>{packageInspection.probableDuplicates.length}</strong></div>
        </div>
        <p role="status">{packageInspection.assetTransport.complete ? 'Transport des assets déclarés complet.' : 'Transport incomplet — import bloqué.'}</p>
        {!packageInspection.assetTransport.complete && <ul>{packageInspection.assetTransport.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
        {packageInspection.assetTransport.references.length > 0 && <details><summary>Correspondance des assets</summary><ul>{packageInspection.assetTransport.references.map((asset, index) => <li key={index}>{asset.assetId} : {asset.archivePath ?? asset.reason} · SHA-256 : {asset.checksumSha256 ?? 'non disponible'}</li>)}</ul></details>}
        {packageInspection.probableDuplicates.length > 0 && <div className="aw-library-package-duplicates"><strong>Correspondances détectées</strong>{packageInspection.probableDuplicates.map((duplicate) => <button type="button" key={duplicate.itemId} onClick={() => { setPackageMode('new_version'); setPackageTargetItemId(duplicate.itemId); }}><span>{duplicate.reason === 'same_content' ? 'Même contenu' : 'Même nom / catégorie'}</span><strong>{duplicate.name}</strong></button>)}</div>}
        <div className="aw-library-form-grid">
          <label>Mode<select value={packageMode} onChange={(event) => setPackageMode(event.target.value as 'new_item' | 'new_version')}><option value="new_item">Créer un nouveau composant</option><option value="new_version">Ajouter une nouvelle version</option></select></label>
          {packageMode === 'new_version' && <label>Composant cible<select value={packageTargetItemId} onChange={(event) => setPackageTargetItemId(event.target.value)}><option value="">Choisir…</option>{items.filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        </div>
        <label className="aw-library-checkbox"><input type="checkbox" checked={packageMarkStable} onChange={(event) => setPackageMarkStable(event.target.checked)} /> Marquer la version importée comme stable</label>
        <p className="technical-safety-note">Le paquet est inspecté avant création. Le code/JSON reste une donnée de référence et n’est jamais exécuté automatiquement.</p>
        <button className="primary-button" type="button" disabled={packageBusy || !packageInspection.assetTransport.complete} onClick={() => void importInspectedPackage()}>Confirmer l’import</button>
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
              <div className="aw-library-item-main">
                <strong>{item.name}</strong>
                <span>{categoryLabel(item.category)} · {reuseStatusLabel(effectiveReuseStatus(item))}{item.vertical ? ` · ${verticalLabel(item.vertical)}` : ''}</span>
                <BridgeSummaryStages item={item} />
              </div>
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
              <div><span className="eyebrow">{categoryLabel(selected.category)} · {reuseStatusLabel(effectiveReuseStatus(selected))}{selected.vertical ? ` · ${verticalLabel(selected.vertical)}` : ''}</span><h2>{selected.name}</h2></div>
              <div className="button-row">
                {!selected.archivedAt && <button className="secondary-button" type="button" onClick={() => setEditingMetadata((value) => !value)}>{editingMetadata ? 'Annuler édition' : 'Modifier'}</button>}
                <button className="secondary-button" type="button" disabled={packageBusy} onClick={() => void exportPackage()}><OperationIcon name="package" size={16} /> Exporter archive</button>
                <button className="secondary-button" type="button" onClick={() => void toggleArchive()}><OperationIcon name="archive" size={16} /> {selected.archivedAt ? 'Réactiver' : 'Archiver'}</button>
                <button className="operation-detail-expand" type="button" title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}><OperationIcon name={detailExpanded ? 'collapse' : 'expand'} size={18} /></button>
                <button className="close-detail" type="button" aria-label="Fermer la fiche composant" title="Fermer" onClick={closeDetail}><OperationIcon name="close" size={18} /></button>
              </div>
            </div>

            <>
            {editingMetadata && metadataForm ? <MetadataEditor form={metadataForm} setForm={setMetadataForm} onSave={saveMetadata} /> : <>
              {selected.description && <p>{selected.description}</p>}
              {selected.vertical && <p className="muted">Métier : <strong>{verticalLabel(selected.vertical)}</strong></p>}
              <div className="aw-library-tags">{selected.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {selected.originTechnicalItemId && <p className="muted">Origine conservée : composant de Bibliothèque projet {selected.originTechnicalItemId}</p>}
            </>}

            {bridgeWorkflow.original && <section className="aw-library-bridge-workflow">
              <div className="aw-library-section-title">
                <div><span className="eyebrow">Parcours du composant</span><h3>Originale → Version de travail → Réutilisable</h3></div>
              </div>

              {bridgeClassificationMismatch && <div className="aw-library-classification-warning">
                <OperationIcon name="alert" size={17} />
                <div><strong>Classement à corriger</strong><span>Ce composant ressemble à « {recommendedBridgeName} » et doit être rangé dans {recommendedBridgeCategory ? categoryLabel(recommendedBridgeCategory) : 'la bonne catégorie'}, pas dans {categoryLabel(selected.category)}.</span></div>
                <button className="secondary-button" type="button" disabled={bridgeWorkflowBusy} onClick={() => void correctBridgeClassification()}>Corriger</button>
              </div>}

              <div className="aw-library-stage-grid">
                <div className={`done ${bridgeStageView === 'original' ? 'active' : ''}`}>
                  <button className="aw-library-stage-open" type="button" onClick={() => setBridgeStageView('original')}>
                    <span>1</span>
                    <div><strong>Originale</strong><small>V{bridgeWorkflow.original.version.versionNumber} · snapshot intact</small></div>
                    <OperationIcon name="check-circle" size={18} />
                  </button>
                </div>

                <div className={`${bridgeWorkflow.work ? 'done' : 'next'} ${bridgeStageView === 'work' ? 'active' : ''}`}>
                  {bridgeWorkflow.work
                    ? <button className="aw-library-stage-open" type="button" onClick={() => setBridgeStageView('work')}>
                        <span>2</span>
                        <div><strong>Version de travail</strong><small>V{bridgeWorkflow.work.version.versionNumber} · modifiable dans le Manager</small></div>
                        <OperationIcon name="check-circle" size={18} />
                      </button>
                    : <div className="aw-library-stage-create">
                        <span>2</span>
                        <div><strong>Version de travail</strong><small>Créer une copie propre et modifiable</small></div>
                        <button className="primary-button" type="button" disabled={bridgeWorkflowBusy} onClick={() => void createBridgeWorkVersion()}>Créer</button>
                      </div>}
                </div>

                <div className={`${bridgeWorkflow.reusable ? (reusableValidated ? 'done' : 'warning') : bridgeWorkflow.work ? 'next' : 'locked'} ${bridgeStageView === 'reusable' ? 'active' : ''}`}>
                  {bridgeWorkflow.reusable && !reusableNeedsRefresh
                    ? <button className="aw-library-stage-open" type="button" onClick={() => setBridgeStageView('reusable')}>
                        <span>3</span>
                        <div><strong>Réutilisable</strong><small>V{bridgeWorkflow.reusable.version.versionNumber} · {reusableValidated
                          ? 'validée humainement · stable'
                          : legacyReusableStable
                            ? 'ancien état stable · validation humaine requise'
                            : reusableValidation?.automaticChecksPassed
                              ? 'préparée · validation humaine requise'
                              : `${reusableValidation?.blockers.length ?? 0} contrôle(s) à reprendre`}</small></div>
                        <OperationIcon name={reusableValidated ? 'check-circle' : 'alert'} size={18} />
                      </button>
                    : <div className="aw-library-stage-create">
                        <span>3</span>
                        <div><strong>Réutilisable</strong><small>{bridgeWorkflow.reusable
                          ? bridgeWorkflow.reusable.payload.stage === 'reusable' && bridgeWorkflow.reusable.payload.value.generatorRevision < BRIDGE_REUSABLE_GENERATOR_REVISION
                            ? 'Le générateur a évolué : régénérer le paquet'
                            : 'La version de travail a changé : régénérer le paquet'
                          : 'Figer la version de travail + mode d’emploi'}</small></div>
                        <button className="primary-button" type="button" disabled={bridgeWorkflowBusy || !bridgeWorkflow.work} onClick={() => void createBridgeReusableVersion()}>{bridgeWorkflow.reusable ? 'Mettre à jour' : 'Préparer'}</button>
                      </div>}
                </div>
              </div>
            </section>}

            {bridgeWorkflow.original && displayedBridgeEntry && <section className="aw-library-current-version">
              <div className="aw-library-section-title">
                <div><span className="eyebrow">Aperçu principal</span><h3>{bridgeStageLabel(displayedBridgeEntry.payload.stage)} · v{displayedBridgeEntry.version.versionNumber}</h3></div>
                <div className="aw-library-version-flags">
                  {displayedBridgeEntry.version.stable && <span>{displayedBridgeEntry.payload.stage === 'reusable' && !reusableValidated ? 'stable technique · non validée humainement' : 'stable'}</span>}
                  <span>{displayedBridgeEntry.version.contentType}{displayedBridgeEntry.version.language ? ` · ${displayedBridgeEntry.version.language}` : ''}</span>
                </div>
              </div>
              {displayedBridgeEntry.payload.stage === 'reusable'
                ? <p className="muted aw-library-current-notes">{reusableValidated
                    ? 'Modèle réutilisable validé humainement et stable. Il peut être envoyé vers un Workbench Divi.'
                    : legacyReusableStable
                      ? 'Ancien état stable détecté, sans trace de validation humaine. Une nouvelle validation explicite est requise pour le considérer « Prêt à réutiliser ».'
                      : 'Modèle préparé automatiquement. Contrôle et validation humaine requis avant le statut « Prêt à réutiliser ».'}</p>
                : displayedBridgeEntry.version.notes && <p className="muted aw-library-current-notes">{displayedBridgeEntry.version.notes}</p>}
              {displayedBridgeEntry.payload.stage === 'original'
                ? <BridgeCandidateViewer candidate={displayedBridgeEntry.payload.value} rawContent={displayedBridgeEntry.version.contentText ?? ''} onMessage={onMessage} />
                : displayedBridgeEntry.payload.stage === 'work'
                  ? <BridgeWorkViewer
                      key={displayedBridgeEntry.version.id}
                      component={displayedBridgeEntry.payload.value}
                      original={originalBridgeCandidate}
                      rawContent={displayedBridgeEntry.version.contentText ?? ''}
                      busy={bridgeWorkflowBusy}
                      onSave={saveBridgeWorkVersion}
                      onMessage={onMessage}
                    />
                  : <BridgeReusableViewer
                      component={displayedBridgeEntry.payload.value}
                      work={bridgeWorkflow.work?.payload.stage === 'work' ? bridgeWorkflow.work.payload.value : null}
                      original={originalBridgeCandidate}
                      rawContent={displayedBridgeEntry.version.contentText ?? ''}
                      packageBusy={packageBusy}
                      validationBusy={bridgeWorkflowBusy}
                      validated={reusableValidated}
                      onValidate={validateBridgeReusableVersion}
                      onExportBridgePackage={() => exportPackage(displayedBridgeEntry.version.id, true)}
                      onMessage={onMessage}
                    />}
            </section>}

            {!bridgeWorkflow.original && currentVersion && <section className="aw-library-current-version">
              <div className="aw-library-section-title">
                <div><span className="eyebrow">Aperçu principal</span><h3>Version courante · v{currentVersion.versionNumber}</h3></div>
                <div className="aw-library-version-flags">{currentVersion.stable && <span>stable</span>}<span>{currentVersion.contentType}{currentVersion.language ? ` · ${currentVersion.language}` : ''}</span></div>
              </div>
              {currentVersion.notes && <p className="muted aw-library-current-notes">{currentVersion.notes}</p>}
              <TechnicalContentViewer
                contentType={currentVersion.contentType}
                language={currentVersion.language}
                content={currentVersion.contentText}
                title="Version courante"
                onMessage={onMessage}
                expanded={expandedVersionId === currentVersion.id}
                onToggleExpanded={() => setExpandedVersionId((current) => current === currentVersion.id ? null : currentVersion.id)}
              />
            </section>}

            <details className="aw-library-secondary-panel aw-library-assets">
              <summary>
                <div><span className="eyebrow">Fichiers indépendants</span><strong>Captures & assets</strong></div>
                <span className="aw-library-secondary-count">{assets.length} fichier(s)</span>
              </summary>
              <div className="aw-library-secondary-body">
                <div className="aw-library-section-title">
                  <div><span className="muted">Fichiers liés à la version sélectionnée</span></div>
                  <button className="secondary-button" type="button" disabled={!assetVersionId} onClick={() => void openAssetFolder()}><OperationIcon name="folder" size={16} /> Ouvrir le dossier</button>
                </div>
                <div className="aw-library-asset-toolbar">
                  <label>Version<select value={assetVersionId} onChange={(event) => void changeAssetVersion(event.target.value)}>{selected.versions.map((version) => <option key={version.id} value={version.id}>{technicalVersionLabel(version)}{version.current ? ' · courante' : ''}{version.stable ? ' · stable' : ''}</option>)}</select></label>
                  <label>Type<select value={assetRole} onChange={(event) => setAssetRole(event.target.value as AtoumWebTechnicalAssetRole)}>{ASSET_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
                  <button className="primary-button" type="button" disabled={!assetVersionId || Boolean(selected.archivedAt)} onClick={() => void importAssets()}><OperationIcon name="upload" size={16} /> Ajouter des fichiers</button>
                </div>
                {assets.length === 0 ? <p className="muted">Aucun fichier lié à cette version.</p> : <div className="aw-library-asset-list">{assets.map((asset) => <button key={asset.id} type="button" className={`aw-library-asset ${asset.missing ? 'missing' : ''}`} onClick={() => void openAsset(asset.id)}>{assetPreviews[asset.id] && <img src={assetPreviews[asset.id]} alt={`Aperçu ${asset.fileName}`} loading="lazy" />}<span>{assetRoleLabel(asset.role)}</span><strong>{asset.fileName}</strong><small>{formatBytes(asset.sizeBytes)}{asset.missing ? ' · fichier manquant' : ''}</small></button>)}</div>}
              </div>
            </details>

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

            <details className="aw-library-secondary-panel aw-library-versions">
              <summary>
                <div><span className="eyebrow">Historique</span><strong>Versions précédentes</strong></div>
                <span className="aw-library-secondary-count">{Math.max(0, selected.versions.length - 1)} version(s)</span>
              </summary>
              <div className="aw-library-secondary-body aw-library-version-history">
                {selected.versions.filter((version) => version.id !== currentVersion?.id).map((version) => {
                  const stage = parseBridgeLibraryPayload(version.contentType, version.contentText)?.stage ?? null;
                  return <div className="aw-library-version" key={version.id}>
                    <div><strong>{technicalVersionLabel(version)}</strong><span>{version.contentType}{version.language ? ` · ${version.language}` : ''}</span></div>
                    <div className="aw-library-version-flags">
                      {version.current && <span>courante</span>}
                      {version.stable && <span>{stage === 'reusable' && !selected.tags?.includes(BRIDGE_HUMAN_VALIDATION_TAG) ? 'stable technique · ancien état' : 'stable'}</span>}
                      {!stage && !version.stable && !selected.archivedAt && <button type="button" className="secondary-button" onClick={() => void markStable(version.id)}>Marquer stable</button>}
                      {stage === 'reusable' && !version.stable && !selected.archivedAt && <span>ancienne réutilisable</span>}
                    </div>
                    {version.notes && <p>{version.notes}</p>}
                    {version.contentText && <button className="secondary-button aw-library-version-toggle" type="button" onClick={() => setExpandedVersionId((current) => current === version.id ? null : version.id)}>
                      {expandedVersionId === version.id ? 'Masquer cette version' : 'Voir cette version'}
                    </button>}
                    {version.contentText && expandedVersionId === version.id && <TechnicalContentViewer
                      contentType={version.contentType}
                      language={version.language}
                      content={version.contentText}
                      title={technicalVersionLabel(version)}
                      onMessage={onMessage}
                    />}
                  </div>;
                })}
                {selected.versions.filter((version) => version.id !== currentVersion?.id).length === 0 && <p className="muted">Aucune ancienne version : seule la version courante existe pour le moment.</p>}
              </div>
            </details>
            </>
        </article>}
      </div>
    </div>
  );
}

function technicalVersionLabel(version: AtoumWebTechnicalVersion): string {
  const stage = parseBridgeLibraryPayload(version.contentType, version.contentText)?.stage;
  if (stage === 'original') return `Originale · v${version.versionNumber}`;
  if (stage === 'work') return `Travail · v${version.versionNumber}`;
  if (stage === 'reusable') return `Réutilisable · v${version.versionNumber}`;
  return `Version ${version.versionNumber}`;
}

function BridgeSummaryStages({ item }: { item: AtoumWebTechnicalItemSummary }) {
  const current = parseBridgeLibraryPayload(item.currentVersion?.contentType, item.currentVersion?.contentText);
  const tags = new Set(item.tags ?? []);
  const isBridge = tags.has('bridge') || Boolean(current);
  if (!isBridge) return null;

  const hasWork = tags.has('bridge-stage-work') || current?.stage === 'work' || current?.stage === 'reusable';
  const hasReusable = tags.has('bridge-stage-reusable') || current?.stage === 'reusable';
  const reusableReady = hasReusable
    && tags.has(BRIDGE_HUMAN_VALIDATION_TAG)
    && item.reuseStatus === 'ready'
    && current?.stage === 'reusable'
    && current.value.reusable.generalized
    && current.value.checks.remoteAssetUrls.length === 0
    && item.stableVersion?.id === item.currentVersion?.id;

  return <span className="aw-library-stage-badges" aria-label="Étapes du composant">
    <span className="done">Originale ✓</span>
    <span className={hasWork ? 'done' : 'pending'}>Travail {hasWork ? '✓' : '—'}</span>
    <span className={reusableReady ? 'done' : hasReusable ? 'warning' : 'pending'}>Réutil. {reusableReady ? '✓' : hasReusable ? '⚠' : '—'}</span>
  </span>;
}

function bridgeStageLabel(stage: BridgeLibraryPayload['stage']): string {
  if (stage === 'original') return 'Version originale';
  if (stage === 'work') return 'Version de travail';
  return 'Version réutilisable';
}

type PreviewDevice = 'auto' | 'desktop' | 'tablet' | 'mobile';
const PREVIEW_DEVICES: Array<{ id: PreviewDevice; label: string; width: number | null }> = [
  { id: 'auto', label: 'Auto', width: null },
  { id: 'desktop', label: 'Desktop', width: 1440 },
  { id: 'tablet', label: 'Tablette', width: 768 },
  { id: 'mobile', label: 'Mobile', width: 390 },
];

function BridgePreviewWorkbench({
  title,
  document,
  originalDocument,
  originalLabel = 'Originale',
}: {
  title: string;
  document: string;
  originalDocument?: string | null;
  originalLabel?: string;
}) {
  const [device, setDevice] = useState<PreviewDevice>('auto');
  const [compare, setCompare] = useState(false);
  const selectedDevice = PREVIEW_DEVICES.find((item) => item.id === device) ?? { id: 'auto' as const, label: 'Auto', width: null };

  return <div className="aw-preview-workbench">
    <div className="aw-preview-toolbar">
      <div className="aw-preview-devices" role="group" aria-label="Largeur de prévisualisation">
        {PREVIEW_DEVICES.map((item) => <button
          key={item.id}
          type="button"
          className={device === item.id ? 'active' : ''}
          onClick={() => setDevice(item.id)}
        >{item.label}{item.width ? <small>{item.width}px</small> : null}</button>)}
      </div>
      {originalDocument && <button className={`secondary-button ${compare ? 'active' : ''}`} type="button" onClick={() => setCompare((value) => !value)}>
        {compare ? 'Vue simple' : 'Comparer à l’original'}
      </button>}
    </div>

    <div className={`aw-preview-grid ${compare && originalDocument ? 'compare' : ''}`}>
      {compare && originalDocument && <PreviewViewport label={originalLabel} document={originalDocument} device={selectedDevice} />}
      <PreviewViewport label={title} document={document} device={selectedDevice} />
    </div>
  </div>;
}

function PreviewViewport({ label, document, device }: { label: string; document: string; device: { width: number | null } }) {
  return <div className="aw-preview-pane">
    <div className="aw-preview-pane-title"><strong>{label}</strong><span>{device.width ? `${device.width} px` : 'largeur disponible'}</span></div>
    <div className="aw-preview-scroll">
      <div className="aw-preview-device" style={{ width: device.width ? `${device.width}px` : '100%' }}>
        <iframe className="aw-bridge-candidate-frame" title={`Aperçu ${label}`} sandbox="" srcDoc={document} />
      </div>
    </div>
  </div>;
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
      <div><strong>Archive originale</strong><span>Source fidèle du snapshot. Elle reste immuable et sert de référence aux transformations suivantes.</span></div>
    </div>

    <section className="aw-bridge-candidate-preview">
      <div className="aw-library-section-title">
        <div><span className="eyebrow">Rendu responsive</span><h3>Aperçu de l’original</h3></div>
        {candidate.origin.pageUrl && <span className="muted">{candidate.origin.pageUrl}</span>}
      </div>
      {candidate.original.html
        ? <BridgePreviewWorkbench title="Originale" document={previewDocument} />
        : <div className="technical-content-empty">Le HTML n’a pas pu être isolé pour ce candidat.</div>}
    </section>

    <section className="aw-bridge-candidate-reuse">
      <div className="aw-library-section-title"><div><span className="eyebrow">Inventaire</span><h3>Ce que l’original utilise</h3></div></div>
      <div className="aw-bridge-candidate-grid">
        <div><span>HTML</span><strong>{candidate.original.html ? 'Disponible' : 'À analyser'}</strong></div>
        <div><span>CSS du module</span><strong>{moduleCssLines ? `${moduleCssLines} ligne(s)` : 'Aucun'}</strong></div>
        <div><span>CSS page utile</span><strong>{usefulPageLines ? `${usefulPageLines} ligne(s)` : 'Aucun détecté'}</strong></div>
        <div><span>CSS global utile</span><strong>{usefulGlobalLines ? `${usefulGlobalLines} ligne(s)` : 'Aucun détecté'}</strong></div>
        <div><span>JavaScript</span><strong>{candidate.original.javascript ? 'Présent · à vérifier' : 'Aucun'}</strong></div>
        <div><span>Classes principales</span><strong>{candidate.prepared.rootClasses.length ? candidate.prepared.rootClasses.join(' · ') : 'Non détectées'}</strong></div>
      </div>

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

function BridgeWorkViewer({
  component,
  original,
  rawContent,
  busy,
  onSave,
  onMessage,
}: {
  component: BridgeWorkComponent;
  original: BridgeLibraryCandidate | null;
  rawContent: string;
  busy: boolean;
  onSave: (work: BridgeWorkComponent) => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [draft, setDraft] = useState(component.work);
  const [editorTab, setEditorTab] = useState<'html' | 'css' | 'js'>('html');
  const draftDocument = buildReusablePreviewDocument(component.origin.pageUrl, draft.html, draft.css);
  const originalDocument = original ? buildBridgeCandidatePreview(original) : null;
  const remoteAssets = extractRemoteAssetUrls(`${draft.html}\n${draft.css}`);

  const changed = draft.html !== component.work.html
    || draft.css !== component.work.css
    || draft.javascript !== component.work.javascript;

  async function save(): Promise<void> {
    await onSave({
      ...component,
      work: { ...draft },
      checks: { remoteAssetUrls: remoteAssets },
    });
  }

  return <div className="aw-bridge-candidate-viewer">
    <div className="aw-bridge-candidate-state work">
      <OperationIcon name="wrench" size={18} />
      <div><strong>Version de travail</strong><span>Copie modifiable dans le Manager. Chaque enregistrement crée une nouvelle révision : l’original et les révisions précédentes ne sont jamais écrasés.</span></div>
    </div>

    <section className="aw-bridge-candidate-preview">
      <div className="aw-library-section-title"><div><span className="eyebrow">Contrôle visuel</span><h3>Travail responsive + comparaison</h3></div></div>
      <BridgePreviewWorkbench title="Version de travail" document={draftDocument} originalDocument={originalDocument} />
    </section>

    <section className="aw-work-editor">
      <div className="aw-library-section-title">
        <div><span className="eyebrow">Éditeur</span><h3>HTML / CSS / JavaScript</h3></div>
        <div className="button-row">
          <span className={`aw-work-change-state ${changed ? 'changed' : ''}`}>{changed ? 'Modifications non enregistrées' : 'À jour'}</span>
          <button className="primary-button" type="button" disabled={busy || !changed} onClick={() => void save()}>Enregistrer une nouvelle révision</button>
        </div>
      </div>

      <div className="aw-work-editor-tabs">
        <button type="button" className={editorTab === 'html' ? 'active' : ''} onClick={() => setEditorTab('html')}>HTML <small>{lineCount(draft.html)} lignes</small></button>
        <button type="button" className={editorTab === 'css' ? 'active' : ''} onClick={() => setEditorTab('css')}>CSS <small>{lineCount(draft.css)} lignes</small></button>
        <button type="button" className={editorTab === 'js' ? 'active' : ''} onClick={() => setEditorTab('js')}>JavaScript <small>{lineCount(draft.javascript)} lignes</small></button>
      </div>

      {editorTab === 'html' && <textarea className="aw-work-code-editor" spellCheck={false} value={draft.html} onChange={(event) => setDraft((value) => ({ ...value, html: event.target.value }))} />}
      {editorTab === 'css' && <textarea className="aw-work-code-editor" spellCheck={false} value={draft.css} onChange={(event) => setDraft((value) => ({ ...value, css: event.target.value }))} />}
      {editorTab === 'js' && <textarea className="aw-work-code-editor" spellCheck={false} value={draft.javascript} onChange={(event) => setDraft((value) => ({ ...value, javascript: event.target.value }))} />}

      <div className="aw-bridge-candidate-grid">
        <div><span>Classes principales</span><strong>{draft.rootClasses.length ? draft.rootClasses.join(' · ') : 'Non détectées'}</strong></div>
        <div><span>Médias distants</span><strong>{remoteAssets.length}</strong></div>
        <div><span>JS exécuté en aperçu</span><strong>Non · sécurité</strong></div>
      </div>
    </section>

    <details className="aw-bridge-candidate-source">
      <summary>Voir le paquet de travail complet</summary>
      <TechnicalContentViewer contentType="json" language="json" content={rawContent} title="Paquet de travail" onMessage={onMessage} />
    </details>
  </div>;
}

function BridgeReusableViewer({
  component,
  work,
  original,
  rawContent,
  packageBusy,
  validationBusy,
  validated,
  onValidate,
  onExportBridgePackage,
  onMessage,
}: {
  component: BridgeReusableComponent;
  work: BridgeWorkComponent | null;
  original: BridgeLibraryCandidate | null;
  rawContent: string;
  packageBusy: boolean;
  validationBusy: boolean;
  validated: boolean;
  onValidate: () => Promise<void>;
  onExportBridgePackage: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const previewDocument = buildBridgeReusablePreview(component);
  const workDocument = work ? buildReusablePreviewDocument(work.origin.pageUrl, work.work.html, work.work.css) : null;
  const originalDocument = original ? buildBridgeCandidatePreview(original) : null;
  const comparisonDocument = workDocument ?? originalDocument;
  const comparisonLabel = workDocument ? 'Version de travail' : 'Originale';
  const validation = bridgeReusableValidation(component);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  useEffect(() => {
    setReviewConfirmed(false);
  }, [rawContent]);

  const requiresManualChecks = validation.warnings.length > 0;
  const canValidate = validation.automaticChecksPassed && (!requiresManualChecks || reviewConfirmed);

  return <div className="aw-bridge-candidate-viewer">
    {validated
      ? <div className="aw-bridge-candidate-state reusable">
          <OperationIcon name="check-circle" size={18} />
          <div><strong>Validé humainement</strong><span>Cette version est stable et porte le statut « Prêt à réutiliser ».</span></div>
        </div>
      : <div className="aw-bridge-candidate-state reusable">
          <OperationIcon name={validation.automaticChecksPassed ? 'wrench' : 'alert'} size={18} />
          <div><strong>{validation.automaticChecksPassed ? 'Préparé automatiquement — validation humaine requise' : 'Préparé — validation bloquée'}</strong><span>{validation.automaticChecksPassed
            ? 'Les contrôles automatiques connus sont passés. Le Manager ne transforme plus ce résultat en validation métier.'
            : validation.blockers.join(' ')}</span></div>
        </div>}

    <section className="aw-bridge-candidate-preview">
      <div className="aw-library-section-title"><div><span className="eyebrow">Contrôle final</span><h3>Réutilisable responsive + comparaison</h3></div></div>
      <BridgePreviewWorkbench title="Réutilisable" document={previewDocument} originalDocument={comparisonDocument} originalLabel={comparisonLabel} />
    </section>

    <section className="aw-bridge-candidate-reuse">
      <div className="aw-library-section-title">
        <div><span className="eyebrow">Validation humaine</span><h3>{validated ? 'Version approuvée' : 'Décision avant statut « Prêt à réutiliser »'}</h3></div>
        {!validated && <button className="primary-button" type="button" disabled={validationBusy || !canValidate} onClick={() => void onValidate()}>
          <OperationIcon name="check-circle" size={16} />{validationBusy ? 'Validation…' : 'Valider comme prêt à réutiliser'}
        </button>}
      </div>
      <div className="aw-bridge-candidate-grid">
        <div><span>Généralisation</span><strong>{component.reusable.generalized ? 'OK automatique' : 'À reprendre'}</strong></div>
        <div><span>Ressources distantes</span><strong>{component.checks.remoteAssetUrls.length ? `${component.checks.remoteAssetUrls.length} à localiser` : 'Aucune détectée'}</strong></div>
        <div><span>JavaScript</span><strong>{component.reusable.javascript.trim() ? 'Présent · contrôle manuel' : 'Aucun'}</strong></div>
        <div><span>Dépendances</span><strong>{component.dependencies.length ? `${component.dependencies.length} · contrôle manuel` : 'Aucune déclarée'}</strong></div>
      </div>
      {validation.blockers.length > 0 && <div className="aw-bridge-candidate-notes">{validation.blockers.map((blocker) => <p key={blocker}><OperationIcon name="alert" size={15} />{blocker}</p>)}</div>}
      {validation.warnings.length > 0 && <div className="aw-bridge-candidate-notes">{validation.warnings.map((warning) => <p key={warning}><OperationIcon name="wrench" size={15} />{warning}</p>)}</div>}
      {!validated && requiresManualChecks && validation.automaticChecksPassed && <label className="aw-library-checkbox">
        <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} />
        J’ai vérifié les points manuels ci-dessus.
      </label>}
      {!validated && !validation.automaticChecksPassed && <p className="technical-safety-note">La validation reste indisponible tant que les contrôles bloquants ne sont pas corrigés.</p>}
      {validated && <p className="technical-safety-note">Une nouvelle révision de travail remettra le composant au statut « À adapter » et nécessitera une nouvelle validation.</p>}
    </section>

    {component.reusable.fields.length > 0 && <ReusableFieldsPanel fields={component.reusable.fields} />}

    <section className="aw-bridge-candidate-reuse">
      <div className="aw-library-section-title">
        <div><span className="eyebrow">Utilisation</span><h3>Envoyer vers un Workbench Divi</h3></div>
        <button className="primary-button" type="button" disabled={packageBusy || !component.reusable.generalized} onClick={() => void onExportBridgePackage()}>
          <OperationIcon name="package" size={16} />{packageBusy ? 'Préparation…' : 'Exporter package Bridge'}
        </button>
      </div>
      <div className="aw-bridge-workbench-note">
        <OperationIcon name="wrench" size={16} />
        <span>Parcours principal : <strong>Bibliothèque → Bridge → Workbench Divi</strong>. Aucune écriture directe en production.</span>
      </div>
      <div className="aw-bridge-package-summary">
        <span>Dépendances <strong>{component.dependencies.length}</strong></span>
        <span>Assets source <strong>{component.assets.length}</strong></span>
        <span>Ressources distantes <strong>{component.checks.remoteAssetUrls.length}</strong></span>
      </div>

      <details className="aw-library-secondary-panel aw-library-manual-use">
        <summary>
          <div><span className="eyebrow">Alternative</span><strong>Utilisation manuelle / dépannage</strong></div>
          <span className="aw-library-secondary-count">HTML / CSS{component.reusable.javascript ? ' / JS' : ''}</span>
        </summary>
        <div className="aw-library-secondary-body">
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
        </div>
      </details>
    </section>

    <details className="aw-bridge-candidate-source">
      <summary>Voir le paquet technique complet</summary>
      <TechnicalContentViewer contentType="json" language="json" content={rawContent} title="Paquet réutilisable" onMessage={onMessage} />
    </details>
  </div>;
}

function ReusableFieldsPanel({ fields }: { fields: BridgeReusableField[] }) {
  const { actions, standalone } = groupReusableFields(fields);
  const summary = summarizeReusableFields(standalone, actions.length);

  return <details className="aw-reusable-fields">
    <summary className="aw-reusable-fields-summary">
      <div className="aw-reusable-fields-summary-copy">
        <span className="eyebrow">Modèle générique</span>
        <h3>{fields.length} champ(s) personnalisable(s)</h3>
        <p>{[
          summary.titles ? `${summary.titles} titre${summary.titles > 1 ? 's' : ''}` : '',
          summary.texts ? `${summary.texts} texte${summary.texts > 1 ? 's' : ''}` : '',
          summary.actions ? `${summary.actions} action${summary.actions > 1 ? 's' : ''}` : '',
          summary.links ? `${summary.links} lien${summary.links > 1 ? 's' : ''} isolé${summary.links > 1 ? 's' : ''}` : '',
          summary.images ? `${summary.images} image${summary.images > 1 ? 's' : ''}` : '',
        ].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="aw-reusable-fields-summary-action">
        <span className="aw-reusable-field-count">{fields.length} champ(s)</span>
        <span className="aw-reusable-fields-toggle">
          <span className="when-closed">Voir les champs</span>
          <span className="when-open">Masquer</span>
          <b aria-hidden="true">⌄</b>
        </span>
      </div>
    </summary>

    <div className="aw-reusable-fields-body">
      <p className="muted">Cette liste décrit ce que le Manager remplacera quand le composant sera utilisé sur un autre site. Les boutons sont regroupés avec leur destination pour éviter les doublons visuels.</p>

      <div className="aw-reusable-field-grid">
        {standalone.map((field) => <div className={`aw-reusable-field ${field.type}`} key={field.id}>
          <span>{reusableFieldTypeLabel(field)}</span>
          <strong>{field.label}</strong>
          <small>{field.defaultValue}</small>
        </div>)}

        {actions.map((action) => <div className="aw-reusable-field action" key={action.key}>
          <span>Action</span>
          <strong>{action.label}</strong>
          {action.text && <small><b>Libellé</b>{action.text.defaultValue}</small>}
          {action.link && <small><b>Destination</b>{action.link.defaultValue}</small>}
        </div>)}
      </div>
    </div>
  </details>;
}

function summarizeReusableFields(fields: BridgeReusableField[], actionCount: number): { titles: number; texts: number; actions: number; links: number; images: number } {
  return fields.reduce((result, field) => {
    if (field.type === 'image') result.images += 1;
    else if (field.type === 'link' || field.type === 'url') result.links += 1;
    else if (/^titre\b/i.test(field.label)) result.titles += 1;
    else result.texts += 1;
    return result;
  }, { titles: 0, texts: 0, actions: actionCount, links: 0, images: 0 });
}

function groupReusableFields(fields: BridgeReusableField[]): {
  actions: Array<{ key: string; label: string; text: BridgeReusableField | null; link: BridgeReusableField | null }>;
  standalone: BridgeReusableField[];
} {
  const groups = new Map<string, { key: string; label: string; text: BridgeReusableField | null; link: BridgeReusableField | null }>();
  const standalone: BridgeReusableField[] = [];

  for (const field of fields) {
    const buttonMatch = field.type === 'text' ? field.label.match(/^bouton\s*\/\s*lien\s*(\d+)/i) : null;
    const linkMatch = field.type === 'link' || field.type === 'url' ? field.label.match(/^lien\s*(\d+)/i) : null;
    const index = buttonMatch?.[1] ?? linkMatch?.[1];

    if (!index) {
      standalone.push(field);
      continue;
    }

    const key = `action-${index}`;
    const current = groups.get(key) ?? { key, label: `Action ${index}`, text: null, link: null };
    if (field.type === 'link' || field.type === 'url') current.link = field;
    else current.text = field;
    groups.set(key, current);
  }

  return {
    actions: [...groups.values()].sort((a, b) => Number(a.key.replace('action-', '')) - Number(b.key.replace('action-', ''))),
    standalone,
  };
}

function reusableFieldTypeLabel(field: BridgeReusableField): string {
  if (field.type === 'image') return 'Image';
  if (field.type === 'link' || field.type === 'url') return 'Lien';
  if (field.type === 'color') return 'Couleur';
  if (field.type === 'number') return 'Nombre';
  if (field.type === 'select') return 'Choix';
  if (field.type === 'toggle') return 'Option';
  if (field.type === 'icon') return 'Icône';
  if (field.type === 'rich_text') return 'Texte riche';
  if (field.type === 'textarea') return 'Texte long';
  if (/^titre\b/i.test(field.label)) return 'Titre';
  return 'Texte';
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
    if (value.kind === 'atoumweb-library-work-component') {
      const work = parseBridgeWorkComponent(value);
      return work ? { stage: 'work', value: work } : null;
    }
    // Compatibilité avec les versions créées avant le renommage "Nettoyée" -> "Version de travail".
    if (value.kind === 'atoumweb-library-cleaned-component') {
      const work = parseLegacyBridgeCleanedAsWork(value);
      return work ? { stage: 'work', value: work } : null;
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

function parseBridgeWorkComponent(value: Record<string, unknown>): BridgeWorkComponent | null {
  const origin = parseBridgeOrigin(value.origin);
  const work = value.work && typeof value.work === 'object' ? value.work as Record<string, unknown> : null;
  const checks = value.checks && typeof value.checks === 'object' ? value.checks as Record<string, unknown> : {};
  if (!origin || !work) return null;
  return {
    schemaVersion: Number(value.schemaVersion ?? 1),
    kind: 'atoumweb-library-work-component',
    origin,
    work: {
      html: typeof work.html === 'string' ? work.html : '',
      css: typeof work.css === 'string' ? work.css : '',
      javascript: typeof work.javascript === 'string' ? work.javascript : '',
      rootClasses: stringArray(work.rootClasses),
    },
    dependencies: parseBridgeDependencies(value.dependencies),
    assets: parseBridgeAssets(value.assets),
    checks: { remoteAssetUrls: stringArray(checks.remoteAssetUrls) },
    instructions: stringArray(value.instructions),
    notes: stringArray(value.notes),
  };
}

function parseLegacyBridgeCleanedAsWork(value: Record<string, unknown>): BridgeWorkComponent | null {
  const origin = parseBridgeOrigin(value.origin);
  const cleaned = value.cleaned && typeof value.cleaned === 'object' ? value.cleaned as Record<string, unknown> : null;
  const checks = value.checks && typeof value.checks === 'object' ? value.checks as Record<string, unknown> : {};
  if (!origin || !cleaned) return null;
  return {
    schemaVersion: Number(value.schemaVersion ?? 1),
    kind: 'atoumweb-library-work-component',
    origin,
    work: {
      html: typeof cleaned.html === 'string' ? cleaned.html : '',
      css: typeof cleaned.css === 'string' ? cleaned.css : '',
      javascript: typeof cleaned.javascript === 'string' ? cleaned.javascript : '',
      rootClasses: stringArray(cleaned.rootClasses),
    },
    dependencies: parseBridgeDependencies(value.dependencies),
    assets: parseBridgeAssets(value.assets),
    checks: { remoteAssetUrls: stringArray(checks.remoteAssetUrls) },
    instructions: stringArray(value.instructions),
    notes: [...stringArray(value.notes), 'Ancienne version « nettoyée » interprétée comme version de travail.'],
  };
}

function parseBridgeReusableComponent(value: Record<string, unknown>): BridgeReusableComponent | null {
  const origin = parseBridgeOrigin(value.origin);
  const reusable = value.reusable && typeof value.reusable === 'object' ? value.reusable as Record<string, unknown> : null;
  const checks = value.checks && typeof value.checks === 'object' ? value.checks as Record<string, unknown> : {};
  if (!origin || !reusable) return null;
  return {
    schemaVersion: Number(value.schemaVersion ?? 1),
    generatorRevision: Number(value.generatorRevision ?? 0),
    kind: 'atoumweb-library-reusable-component',
    origin,
    reusable: {
      html: typeof reusable.html === 'string' ? reusable.html : '',
      css: typeof reusable.css === 'string' ? reusable.css : '',
      javascript: typeof reusable.javascript === 'string' ? reusable.javascript : '',
      rootClasses: stringArray(reusable.rootClasses),
      method: 'divi-code',
      instructions: stringArray(reusable.instructions),
      generalized: reusable.generalized === true,
      fields: parseBridgeReusableFields(reusable.fields),
    },
    dependencies: parseBridgeDependencies(value.dependencies),
    assets: parseBridgeAssets(value.assets),
    checks: { remoteAssetUrls: stringArray(checks.remoteAssetUrls) },
    notes: stringArray(value.notes),
  };
}

function parseBridgeDependencies(value: unknown): NonNullable<BridgeLibraryCandidate['prepared']['dependencies']> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const dependency = item as Record<string, unknown>;
    if (typeof dependency.name !== 'string' || !dependency.name.trim()) return [];
    return [{
      dependencyId: typeof dependency.dependencyId === 'string' ? dependency.dependencyId : '',
      type: typeof dependency.type === 'string' ? dependency.type : 'unknown',
      slug: typeof dependency.slug === 'string' ? dependency.slug : null,
      name: dependency.name,
      version: typeof dependency.version === 'string' ? dependency.version : null,
      active: typeof dependency.active === 'boolean' ? dependency.active : null,
    }];
  });
}

function parseBridgeAssets(value: unknown): NonNullable<BridgeLibraryCandidate['prepared']['assets']> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const asset = item as Record<string, unknown>;
    if (typeof asset.assetId !== 'string' || !asset.assetId.trim()) return [];
    return [{
      assetId: asset.assetId,
      type: typeof asset.type === 'string' ? asset.type : 'unknown',
      url: typeof asset.url === 'string' ? asset.url : null,
      localPath: typeof asset.localPath === 'string' ? asset.localPath : null,
      mimeType: typeof asset.mimeType === 'string' ? asset.mimeType : null,
      hash: typeof asset.hash === 'string' ? asset.hash : null,
      archiveMode: typeof asset.archiveMode === 'string' ? asset.archiveMode : null,
    }];
  });
}

function parseBridgeReusableFields(value: unknown): BridgeReusableField[] {
  const rawFields = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).fields)
      ? (value as Record<string, unknown>).fields as unknown[]
      : [];

  const supportedTypes = new Set(['text', 'textarea', 'rich_text', 'link', 'url', 'image', 'color', 'number', 'select', 'toggle', 'icon']);

  return rawFields.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const field = item as Record<string, unknown>;
    const type = typeof field.type === 'string' ? field.type : 'text';
    if (!supportedTypes.has(type)) return [];

    const binding = field.binding && typeof field.binding === 'object' ? field.binding as Record<string, unknown> : null;
    const selector = typeof field.selector === 'string'
      ? field.selector
      : binding && typeof binding.selector === 'string'
        ? binding.selector
        : '';
    const defaultRaw = field.defaultValue ?? field.default;
    const source = field.source && typeof field.source === 'object' ? field.source as Record<string, unknown> : null;

    return [{
      id: typeof field.id === 'string' ? field.id : '',
      label: typeof field.label === 'string' ? field.label : 'Champ',
      type: type as BridgeReusableField['type'],
      selector,
      originalValue: typeof field.originalValue === 'string' ? field.originalValue : '',
      defaultValue: typeof defaultRaw === 'string' || typeof defaultRaw === 'number' || typeof defaultRaw === 'boolean'
        ? String(defaultRaw)
        : '',
      group: typeof field.group === 'string' ? field.group : null,
      required: field.required === true,
      binding,
      sourceMode: source?.mode === 'auto_detected' ? 'auto_detected' : source?.mode === 'declared' ? 'declared' : undefined,
    }];
  });
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

function buildBridgeWorkComponent(candidate: BridgeLibraryCandidate): BridgeWorkComponent {
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
    kind: 'atoumweb-library-work-component',
    origin: candidate.origin,
    work: { html, css, javascript, rootClasses: candidate.prepared.rootClasses },
    dependencies: candidate.prepared.dependencies ?? [],
    assets: candidate.prepared.assets ?? [],
    checks: { remoteAssetUrls },
    instructions: [
      'Vérifier le rendu face à l’original sur Desktop, Tablette et Mobile.',
      'Modifier ici le HTML, le CSS ou le JavaScript si nécessaire.',
      'Chaque enregistrement crée une nouvelle révision de travail.',
    ],
    notes: [
      'Le CSS page/global non détecté comme utile n’est pas incorporé automatiquement.',
      ...(remoteAssetUrls.length ? [`${remoteAssetUrls.length} média(s) utilisent encore une URL distante.`] : []),
    ],
  };
}

function refreshBridgeWorkChecks(work: BridgeWorkComponent): BridgeWorkComponent {
  return {
    ...work,
    work: { ...work.work },
    checks: { remoteAssetUrls: extractRemoteAssetUrls(`${work.work.html}\n${work.work.css}`) },
  };
}

function buildBridgeReusableComponent(work: BridgeWorkComponent): BridgeReusableComponent {
  const checked = refreshBridgeWorkChecks(work);
  const htmlTemplate = generalizeBridgeReusableHtml(checked.work.html);
  const cssTemplate = generalizeBridgeReusableCss(checked.work.css, checked.work.rootClasses, htmlTemplate.fields.length);
  const fields = [...htmlTemplate.fields, ...cssTemplate.fields];
  const remoteAssetUrls = extractRemoteAssetUrls(`${htmlTemplate.html}\n${cssTemplate.css}`);

  return {
    schemaVersion: 2,
    generatorRevision: BRIDGE_REUSABLE_GENERATOR_REVISION,
    kind: 'atoumweb-library-reusable-component',
    origin: checked.origin,
    reusable: {
      html: htmlTemplate.html,
      css: cssTemplate.css,
      javascript: checked.work.javascript,
      rootClasses: checked.work.rootClasses,
      method: 'divi-code',
      generalized: htmlTemplate.generalized && cssTemplate.generalized,
      fields,
      instructions: [
        `Personnaliser les ${fields.length} champ(s) du modèle avant utilisation sur un nouveau site.`,
        'Dans Divi, ajouter un module Code.',
        'Copier le HTML du composant dans le module Code.',
        ...(cssTemplate.css ? ['Ajouter le CSS fourni dans le CSS de la page ou dans la zone prévue pour les composants AtoumWeb.'] : []),
        ...(checked.work.javascript ? ['Ajouter le JavaScript fourni dans une zone d’intégration contrôlée et le tester avant mise en ligne.'] : []),
        ...(remoteAssetUrls.length ? ['Remplacer les ressources encore distantes par les copies locales du nouveau site dès que les assets auront été embarqués.'] : []),
      ],
    },
    dependencies: checked.dependencies,
    assets: checked.assets,
    checks: { remoteAssetUrls },
    notes: [
      ...checked.notes,
      htmlTemplate.generalized && cssTemplate.generalized
        ? `Modèle généralisé : ${fields.length} champ(s) personnalisable(s) utilisent des valeurs de démonstration.`
        : 'La généralisation automatique n’a pas pu être appliquée complètement : vérifier ce composant avant réutilisation.',
    ],
  };
}

function generalizeBridgeReusableHtml(html: string): { html: string; fields: BridgeReusableField[]; generalized: boolean } {
  if (!html.trim()) return { html, fields: [], generalized: true };

  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(`<div id="aw-reusable-root">${html}</div>`, 'text/html');
    const root = document.getElementById('aw-reusable-root');
    if (!root) return { html, fields: [], generalized: false };

    const fields: BridgeReusableField[] = [];
    let textIndex = 0;
    let linkIndex = 0;
    let imageIndex = 0;

    const addTextField = (element: HTMLElement, label: string, defaultValue: string, pieces: string[]) => {
      const originalValue = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (!originalValue) return;
      textIndex += 1;
      const id = `text-${textIndex}`;
      element.dataset.awFieldText = id;
      replaceMeaningfulTextNodes(element, pieces);
      fields.push({
        id,
        label,
        type: 'text',
        selector: `[data-aw-field-text="${id}"]`,
        originalValue,
        defaultValue,
      });
    };

    root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6').forEach((heading, index) => {
      addTextField(
        heading,
        index === 0 ? 'Titre principal' : `Titre ${index + 1}`,
        index === 0 ? 'Votre titre personnalisable' : 'Votre sous-titre',
        index === 0 ? ['Votre titre ', 'personnalisable'] : ['Votre sous-titre'],
      );
    });

    root.querySelectorAll<HTMLElement>('p').forEach((paragraph, index) => {
      if (!paragraph.textContent?.trim()) return;
      const hasStrongLead = Boolean(paragraph.querySelector('strong,b'));
      const defaultValue = index === 0
        ? 'Votre service : présentez ici votre offre, votre service ou votre message principal.'
        : 'Ajoutez ici les informations utiles pour votre visiteur.';
      addTextField(
        paragraph,
        `Texte ${index + 1}`,
        defaultValue,
        hasStrongLead
          ? ['Votre service :', ' présentez ici votre offre, votre service ou votre message principal.']
          : [defaultValue],
      );
    });

    root.querySelectorAll<HTMLElement>('button,a').forEach((element, index) => {
      const anchor = element instanceof HTMLAnchorElement ? element : null;
      if (anchor) {
        const originalHref = anchor.getAttribute('href') ?? '';
        if (originalHref && originalHref !== '#') {
          linkIndex += 1;
          const id = `link-${linkIndex}`;
          anchor.dataset.awFieldLink = id;
          anchor.setAttribute('href', '#');
          anchor.removeAttribute('target');
          fields.push({
            id,
            label: `Lien ${linkIndex}`,
            type: 'link',
            selector: `[data-aw-field-link="${id}"]`,
            originalValue: originalHref,
            defaultValue: '#',
          });
        }
      }

      if (element.closest('h1,h2,h3,h4,h5,h6,p')) return;
      const originalText = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (!originalText || originalText.length > 90) return;
      addTextField(element, `Bouton / lien ${index + 1}`, 'En savoir plus', ['En savoir plus']);
    });

    root.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
      const originalSrc = image.getAttribute('src') ?? '';
      if (!originalSrc) return;
      imageIndex += 1;
      const id = `image-${imageIndex}`;
      image.dataset.awFieldImage = id;
      image.setAttribute('src', reusablePlaceholderImageDataUrl());
      image.setAttribute('alt', 'Image de démonstration à remplacer');
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      fields.push({
        id,
        label: `Image ${imageIndex}`,
        type: 'image',
        selector: `[data-aw-field-image="${id}"]`,
        binding: { type: 'html_attribute', selector: `[data-aw-field-image="${id}"]`, attribute: 'src' },
        originalValue: originalSrc,
        defaultValue: 'Image de démonstration locale',
      });
    });

    root.querySelectorAll<HTMLSourceElement>('source[srcset]').forEach((source) => {
      const originalSrcSet = source.getAttribute('srcset') ?? '';
      if (!/^https?:\/\//i.test(originalSrcSet.trim())) return;
      imageIndex += 1;
      const id = `image-${imageIndex}`;
      source.dataset.awFieldImage = id;
      source.setAttribute('srcset', reusablePlaceholderImageDataUrl());
      fields.push({
        id,
        label: `Image responsive ${imageIndex}`,
        type: 'image',
        selector: `[data-aw-field-image="${id}"]`,
        binding: { type: 'html_attribute', selector: `[data-aw-field-image="${id}"]`, attribute: 'srcset' },
        originalValue: originalSrcSet,
        defaultValue: 'Image de démonstration locale',
      });
    });

    root.querySelectorAll<HTMLElement>('[style*="url("]').forEach((element) => {
      const originalStyle = element.getAttribute('style') ?? '';
      const urls = extractRemoteAssetUrls(originalStyle).filter((url) => /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(url));
      if (!urls.length) return;

      let nextStyle = originalStyle;
      urls.forEach((url) => {
        imageIndex += 1;
        const id = `image-${imageIndex}`;
        element.dataset.awFieldImage = element.dataset.awFieldImage
          ? `${element.dataset.awFieldImage} ${id}`
          : id;
        nextStyle = nextStyle.split(url).join(reusablePlaceholderImageDataUrl());
        fields.push({
          id,
          label: `Image de fond ${imageIndex}`,
          type: 'image',
          selector: `[data-aw-field-image~="${id}"]`,
          binding: { type: 'unresolved', reason: 'Image dans style inline : V1 ne cible pas une URL individuelle sans écraser le style.' },
          originalValue: url,
          defaultValue: 'Image de démonstration locale',
        });
      });
      element.setAttribute('style', nextStyle);
    });

    return {
      html: root.innerHTML.trim(),
      fields,
      generalized: true,
    };
  } catch {
    return { html, fields: [], generalized: false };
  }
}

function generalizeBridgeReusableCss(css: string, rootClasses: string[], fieldOffset = 0): { css: string; fields: BridgeReusableField[]; generalized: boolean } {
  if (!css.trim()) return { css, fields: [], generalized: true };

  try {
    const fields: BridgeReusableField[] = [];
    let imageIndex = fieldOffset;
    const imageUrlPattern = /url\(\s*(['"]?)(https?:\/\/[^'")\s]+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#][^'")\s]*)?)\1\s*\)/gi;
    const imageGeneralizedCss = css.replace(imageUrlPattern, (_match, _quote, originalUrl: string) => {
      imageIndex += 1;
      const id = `image-${imageIndex}`;
      fields.push({
        id,
        label: `Image de fond ${fields.length + 1}`,
        type: 'image',
        selector: `css:url:${id}`,
        originalValue: originalUrl,
        defaultValue: 'Image de démonstration locale',
      });
      return `url("${reusablePlaceholderImageDataUrl()}")`;
    });

    const colorGeneralization = generalizeReusableCssColors(imageGeneralizedCss, rootClasses);
    fields.push(...colorGeneralization.fields);

    return { css: colorGeneralization.css, fields, generalized: colorGeneralization.generalized };
  } catch {
    return { css, fields: [], generalized: false };
  }
}

function replaceMeaningfulTextNodes(element: HTMLElement, pieces: string[]): void {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    const parent = text.parentElement;
    if (parent && !parent.closest('script,style') && text.nodeValue?.trim()) nodes.push(text);
    node = walker.nextNode();
  }

  if (!nodes.length) {
    element.textContent = pieces.join('');
    return;
  }

  nodes.forEach((textNode, index) => {
    textNode.nodeValue = pieces[index] ?? '';
  });
}

function reusablePlaceholderImageDataUrl(): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#f1eee7"/><rect x="50" y="50" width="1100" height="575" rx="28" fill="none" stroke="#b99a5f" stroke-width="4" stroke-dasharray="18 14"/><text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#6e604b">Image de démonstration</text><text x="600" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#81745f">À remplacer pour le nouveau projet</text></svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function mergeLibraryTags(existing: string[] | null | undefined, additions: string[]): string[] {
  return [...new Set([...(existing ?? []), ...additions])];
}

function removeLibraryTags(existing: string[] | null | undefined, removals: string[]): string[] {
  const removed = new Set(removals);
  return (existing ?? []).filter((tag) => !removed.has(tag));
}

function bridgeReusableValidation(component: BridgeReusableComponent) {
  return assessBridgeReusableValidation({
    generalized: component.reusable.generalized,
    remoteAssetUrls: component.checks.remoteAssetUrls,
    javascript: component.reusable.javascript,
    dependencies: component.dependencies,
  });
}

function normalizeReusableText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

function extractRemoteAssetUrls(value: string): string[] {
  const matches = value.match(/https?:\/\/[^"'\s)]+/gi) ?? [];
  return [...new Set(matches.filter((url) => /\.(?:avif|gif|jpe?g|png|svg|webp|woff2?|ttf|otf)(?:[?#].*)?$/i.test(url)))];
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
      <label>Métier<input list="aw-library-vertical-options" value={form.vertical} onChange={(event) => setForm({ ...form, vertical: event.target.value })} placeholder="Optionnel · fleuriste, automobile…" /></label>
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
    <div className="aw-library-form-grid aw-library-metadata-main-grid">
      <label>Nom<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Catégorie<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as AtoumWebLibraryCategory })}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Statut<select value={form.reuseStatus} onChange={(event) => setForm({ ...form, reuseStatus: event.target.value as AtoumWebReuseStatus })}>{REUSE_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Métier<input list="aw-library-vertical-options" value={form.vertical} onChange={(event) => setForm({ ...form, vertical: event.target.value })} placeholder="Optionnel · fleuriste, automobile…" /></label>
      <label>Tags<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Séparés par des virgules" /></label>
    </div>
    <label>Description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
    <details className="aw-library-metadata-advanced">
      <summary>Informations avancées</summary>
      <label>ID origine Bibliothèque projet<input value={form.originTechnicalItemId} onChange={(event) => setForm({ ...form, originTechnicalItemId: event.target.value })} placeholder="Optionnel · uniquement un composant projet" /></label>
    </details>
    <button className="primary-button" type="button" onClick={() => void onSave()}>Enregistrer</button>
  </div>;
}

function Summary({ icon, label, value }: { icon: OperationIconName; label: string; value: number }) {
  return <article className="kpi-card aw-library-kpi"><span className="aw-library-kpi-icon"><OperationIcon name={icon} size={20} /></span><div><span>{label}</span><strong>{value}</strong><small>Bibliothèque AtoumWeb</small></div></article>;
}

function OccurrenceChangesSummary({ changes }: { changes: AtoumWebOccurrenceReturnSummary['changes'] }) {
  const flags = [
    changes.htmlChanged ? 'HTML' : null,
    changes.cssChanged ? 'CSS' : null,
    changes.javascriptChanged ? 'JavaScript' : null,
    changes.structuralChange ? 'Structure' : null,
  ].filter((value): value is string => Boolean(value));
  return <div className="aw-library-package-grid">
    <div><span>Champs modifiés</span><strong>{changes.changedFieldIds.length ? changes.changedFieldIds.join(', ') : 'Aucun'}</strong></div>
    <div><span>Variables CSS</span><strong>{changes.changedCssVariables.length ? changes.changedCssVariables.join(', ') : 'Aucune'}</strong></div>
    <div><span>Assets modifiés</span><strong>{changes.changedAssetIds.length ? changes.changedAssetIds.join(', ') : 'Aucun'}</strong></div>
    <div><span>Différences techniques</span><strong>{flags.length ? flags.join(' · ') : 'Aucune'}</strong></div>
  </div>;
}

function formatLibraryDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function categoryLabel(category: AtoumWebLibraryCategory): string {
  return CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function effectiveReuseStatus(item: AtoumWebTechnicalItemSummary | AtoumWebTechnicalItemDetail): AtoumWebReuseStatus {
  if (item.reuseStatus !== 'ready') return item.reuseStatus;
  const current = parseBridgeLibraryPayload(item.currentVersion?.contentType, item.currentVersion?.contentText);
  const tags = new Set(item.tags ?? []);
  const isBridge = tags.has('bridge') || Boolean(current);
  return isBridge && !tags.has(BRIDGE_HUMAN_VALIDATION_TAG) ? 'adapt' : item.reuseStatus;
}

function reuseStatusLabel(status: AtoumWebReuseStatus): string {
  return REUSE_STATUSES.find((item) => item.id === status)?.label ?? status;
}

function verticalLabel(vertical: string): string {
  const spaced = vertical.replace(/[-_]+/g, ' ').trim();
  return spaced ? spaced.charAt(0).toLocaleUpperCase('fr-FR') + spaced.slice(1) : vertical;
}

function assetRoleLabel(role: AtoumWebTechnicalAssetRole): string {
  return ASSET_ROLES.find((item) => item.id === role)?.label ?? role;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

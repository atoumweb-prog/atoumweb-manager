import {useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import { CatalogContractPanel } from './CatalogContractPanel';
import { CatalogPublicationReview } from './CatalogPublicationReview';
import { CatalogProductionPanel } from './CatalogProductionPanel';
import {CATALOG_EDITOR_TABS,catalogTabHasVersionFields,type CatalogEditorTab} from './catalogEditorTabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PRICE_MODES,
  CATALOG_COMMERCIAL_KINDS,
  type CatalogCommercialKind,
  type CatalogPriceBasis,
  type CatalogCommercialParameters,
  type CatalogItemDetail,
  type CatalogItemStatus,
  type CatalogItemSummary,
  type CatalogItemType,
  type CatalogVersionInput,
  type CatalogVersion,
  type OfferComponent,
  type PriceMode,
} from '../../shared/commercial';
import { FieldHelp } from '../ui/FieldHelp';
import { CatalogOverview } from './CatalogOverview';
import { CatalogCategoryInventory } from './CatalogCategoryInventory';
import type { CatalogCategoryRecord } from '../../shared/catalogCategoryAdministration';
import { catalogAdminCategories, catalogAdminFiltered } from './catalogAdminFilters';
import { catalogueCategoryName } from './catalogDisplay';

const PRICE_LABELS: Record<PriceMode, string> = {
  fixed: 'Prix fixe',
  starting_from: 'À partir de',
  hourly: 'Horaire',
  monthly: 'Mensuel',
  yearly: 'Annuel',
  quote_only: 'Sur devis',
  free: 'Gratuit',
};

const STATUS_LABELS: Record<CatalogItemStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};

const KIND_LABELS: Record<CatalogCommercialKind, string> = { offer: 'Offre', service: 'Service', option: 'Option', pack: 'Pack', subscription: 'Abonnement' };

const VERSION_STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publiée',
  retired: 'Retirée',
} as const;

interface CatalogDraft {
  canonicalCode: string;
  commercialKind: CatalogCommercialKind | '';
  familyCode: string;
  abbyLabel: string;
  unit: string;
  periodicity: string;
  priceBasis: CatalogPriceBasis;
  sourceReference: string;
  sourceSha256: string;
  sourceRecordKey: string;
  type: CatalogItemType;
  name: string;
  category: string;
  nature: string;
  description: string;
  inclusionsText: string;
  exclusionsText: string;
  prerequisitesText: string;
  priceMode: PriceMode;
  priceEuros: string;
  recommendedEuros: string;
  depositPercent: string;
  estimatedMinutes: string;
  recommendedDelayDays: string;
  specialTerms: string;
  contractType: string;
  internalAdvice: string;
  commercialParameters: CatalogCommercialParameters;
  visiblePublic: boolean;
}

const EMPTY_DRAFT: CatalogDraft = {
  canonicalCode: '', commercialKind: '', familyCode: '', abbyLabel: '', unit: '', periodicity: '', priceBasis: 'listed', sourceReference: '', sourceSha256: '', sourceRecordKey: '',
  type: 'service',
  name: '',
  category: '',
  nature: '',
  description: '',
  inclusionsText: '',
  exclusionsText: '',
  prerequisitesText: '',
  priceMode: 'fixed',
  priceEuros: '',
  recommendedEuros: '',
  depositPercent: '30',
  estimatedMinutes: '',
  recommendedDelayDays: '',
  specialTerms: '',
  contractType: '',
  internalAdvice: '',
  commercialParameters: {},
  visiblePublic: false,
};

function eurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
}

function optionalInteger(value: string, label: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${label} invalide.`);
  return parsed;
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function formatPrice(item: CatalogItemSummary): string {
  const version = item.currentVersion;
  if (!version) return 'Non tarifé';
  if (version.priceBasis === 'actual_cost') return 'Coût tiers réel';
  if (version.priceMode === 'free') return 'Gratuit';
  if (version.priceMode === 'quote_only') return 'Sur devis';
  if (version.priceCents == null) return PRICE_LABELS[version.priceMode];
  const amount = `${(version.priceCents / 100).toLocaleString('fr-FR')} €`;
  if (version.priceMode === 'starting_from') return `Dès ${amount}`;
  if (version.priceMode === 'hourly') return `${amount}/h`;
  if (version.priceMode === 'monthly') return `${amount}/mois`;
  if (version.priceMode === 'yearly') return `${amount}/an`;
  return version.unit ? `${amount} / ${version.unit}` : amount;
}

function formatCatalogDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

export function CatalogPage({ onEntityReady, onMessage, initialId, initialRequest }: { onMessage: (message: string) => void; initialId?:string|null;initialRequest?:number;onEntityReady?:EntityReady }) {
  const [items, setItems] = useState<CatalogItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CatalogItemType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CatalogItemStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [catalogView, setCatalogView] = useState<'organized' | 'table'>('organized');
  const [showCategoryInventory, setShowCategoryInventory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogItemDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<CatalogDraft>(EMPTY_DRAFT);
  const [createCategoryId, setCreateCategoryId] = useState('');
  const [createCategoryChoices, setCreateCategoryChoices] = useState<CatalogCategoryRecord[]>([]);
  const [createCategoryLoadError, setCreateCategoryLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [versionMode, setVersionMode] = useState(false);
  const [versionDraft, setVersionDraft] = useState<CatalogDraft>(EMPTY_DRAFT);
  // Survives a lost IPC response so an explicit retry addresses the SAME row.
  const pendingVersionCreations = useRef(new Map<string, { requestId: string; fingerprint: string }>());
  const [editingDraftVersion, setEditingDraftVersion] = useState<CatalogVersion | null>(null);
  const [versionFormError, setVersionFormError] = useState<string | null>(null);
  const [publicationCandidate, setPublicationCandidate] = useState<CatalogVersion | null>(null);
  const [activeTab,setActiveTab] = useState<CatalogEditorTab>('identity');
  const [detailSplitPercent, setDetailSplitPercent] = useState(40);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [offerComponents, setOfferComponents] = useState<OfferComponent[]>([]);
  const [offerVersionId, setOfferVersionId] = useState<string | null>(null);
  const [componentServiceVersionId, setComponentServiceVersionId] = useState('');
  const [componentQuantity, setComponentQuantity] = useState('1');
  const [componentOptional, setComponentOptional] = useState(false);
  const [canonicalCodeDraft, setCanonicalCodeDraft] = useState('');
  const detailEpoch=useRef(0),listEpoch=useRef(0),mounted=useRef(true),selectedRef=useRef(selectedId),detailRef=useRef(detail);
  selectedRef.current=selectedId;detailRef.current=detail;
  const [detailLoading,setDetailLoading]=useState(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;detailEpoch.current++;listEpoch.current++;};},[]);
  useSearchTargetConfirmation('catalog',showForm?null:detail?.id,loading||detailLoading,onEntityReady);
  const createGuard=useUnsavedDraft('Nouvelle prestation',draft,{group:'catalog:create',ready:showForm,pending:saving,discard:baseline=>{setDraft(baseline);setCreateCategoryId('');setShowForm(false);}});
  const versionGuard=useUnsavedDraft('Version Catalogue',versionDraft,{group:'catalog:'+detail?.id,ready:versionMode,pending:saving,resetKey:detail?.id+':'+versionMode,discard:baseline=>{setVersionDraft(baseline);setVersionMode(false);}});
  const identityGuard=useUnsavedDraft('Code Catalogue',canonicalCodeDraft,{group:'catalog:'+detail?.id,ready:!!detail,pending:saving,resetKey:detail?.id,discard:setCanonicalCodeDraft});


  const publishedServices = useMemo(
    () => items.filter((item) => item.type === 'service' && item.status === 'active' && item.currentVersion?.status === 'published'),
    [items],
  );

  async function loadDetail(id:string):Promise<CatalogItemDetail|null>{
    const epoch=++detailEpoch.current;setDetailLoading(true);
    try {
      const next=await window.atoumweb.catalog.getItem(id);
      if(next.id!==id)throw Error('La fiche reçue ne correspond pas à la demande.');
      const version=next.type==='offer'?(next.versions.find(item=>item.status==='draft')??next.currentVersion??null):null;
      const components=version?await window.atoumweb.catalog.listOfferComponents(version.id):[];
      if(!mounted.current||epoch!==detailEpoch.current)return next;
      if(detailRef.current?.id!==id||!identityGuard.dirty)setCanonicalCodeDraft(next.canonicalCode??'');
      setDetail(next);setOfferVersionId(version?.id??null);setOfferComponents(components);return next;
    }catch(error){if(!mounted.current||epoch!==detailEpoch.current)return null;setSelectedId(detailRef.current?.id??null);onEntityReady?.('catalog',id,error instanceof Error?error.message:'Prestation introuvable.');throw error;}
    finally{if(mounted.current&&epoch===detailEpoch.current)setDetailLoading(false);}
  }

  async function refresh(): Promise<void> {
    const epoch=++listEpoch.current,selectedAtStart=selectedId;
    setLoading(true);
    try {
      const next = await window.atoumweb.catalog.list();
      if(!mounted.current||epoch!==listEpoch.current)return;
      setItems(next);
      if (selectedAtStart && selectedRef.current===selectedAtStart) {
        const selected = next.find((item) => item.id === selectedAtStart);
        if (selected) await loadDetail(selected.id);
        else if(!identityGuard.dirty&&!versionGuard.dirty&&!saving){setSelectedId(null);setDetail(null);}
        else onMessage('La prestation n’est plus disponible ; la saisie locale est conservée.');
      }
    }catch(error){if(mounted.current&&epoch===listEpoch.current)onMessage(error instanceof Error?error.message:'Catalogue indisponible.');
    } finally {
      if(mounted.current&&epoch===listEpoch.current)setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!showForm) return;
    let alive = true;
    window.atoumweb.catalogCategories.list().then(list => {
      if (alive) { setCreateCategoryChoices(list); setCreateCategoryLoadError(''); }
    }).catch(error => {
      if (alive) { setCreateCategoryChoices([]); setCreateCategoryLoadError(error instanceof Error ? error.message : 'Catégories administrées indisponibles.'); }
    });
    return () => { alive = false; };
  }, [showForm]);
  useEffect(()=>{
    if(!initialId)return;
    setSelectedId(initialId);
    if(detailRef.current?.id===initialId){detailEpoch.current++;setDetailLoading(false);onEntityReady?.('catalog',initialId);return;}
    setVersionMode(false);void loadDetail(initialId).catch(e=>onMessage(String(e)));
  },[initialId,initialRequest]);

  const categories = useMemo(() => catalogAdminCategories(items), [items]);
  const effectiveCategory = categoryFilter === 'all' || categories.includes(categoryFilter) ? categoryFilter : 'all';
  const filtered = useMemo(() => catalogAdminFiltered(items, {
    query,
    type: typeFilter,
    status: statusFilter,
    category: effectiveCategory,
  }), [items, query, typeFilter, statusFilter, effectiveCategory]);
  const hasFilters = Boolean(query.trim()) || typeFilter !== 'all' || statusFilter !== 'all' || effectiveCategory !== 'all';
  const resetFilters = () => { setQuery(''); setTypeFilter('all'); setStatusFilter('all'); setCategoryFilter('all'); };

  async function openItem(id: string): Promise<void> {
    if(detailRef.current?.id===id){detailEpoch.current++;setSelectedId(id);setDetailLoading(false);return;}
    if(!requestUnsavedExit(()=>{}))return;
    setSelectedId(id);
    setVersionMode(false);
    setActiveTab('identity');
    setPublicationCandidate(null);
    setDetailExpanded(false);
    await loadDetail(id);
  }

  function closeDetail(): void {
    requestUnsavedExit(closeDetailDirect);
  }
  function closeDetailDirect(): void {
    detailEpoch.current++;
    setSelectedId(null);
    setDetail(null);
    setVersionMode(false);
    setActiveTab('identity');
    setPublicationCandidate(null);
    setDetailExpanded(false);
  }

  function beginCatalogResize(): void {
    const workspace = document.querySelector<HTMLElement>('.catalog-layout.with-detail');
    if (!workspace) return;
    document.body.classList.add('catalog-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setDetailSplitPercent(Math.max(18, Math.min(68, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('catalog-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  function buildVersion(input: CatalogDraft): CatalogVersionInput {
    const deposit = input.depositPercent.trim() ? Number(input.depositPercent) : null;
    if (deposit != null && (!Number.isInteger(deposit) || deposit < 0 || deposit > 100)) throw new Error('Acompte invalide.');
    if (!input.sourceReference.trim() && (input.sourceSha256.trim() || input.sourceRecordKey.trim())) throw new Error('Renseigne la référence de source avec son empreinte ou sa ligne.');
    return {
      commercialKind: input.commercialKind || null,
      familyCode: input.familyCode.trim() || null,
      abbyLabel: input.abbyLabel.trim() || null,
      unit: input.unit.trim() || null,
      periodicity: input.periodicity.trim() || null,
      priceBasis: input.priceBasis,
      provenance: input.sourceReference.trim() ? { reference: input.sourceReference.trim(), sha256: input.sourceSha256.trim() || null, recordKey: input.sourceRecordKey.trim() || null } : null,
      nature: input.nature.trim() || null,
      description: input.description.trim() || null,
      priceMode: input.priceMode,
      priceCents: input.priceMode === 'free' ? 0 : input.priceMode === 'quote_only' ? null : eurosToCents(input.priceEuros),
      recommendedPriceCents: eurosToCents(input.recommendedEuros),
      defaultDepositPercent: deposit,
      estimatedMinutes: optionalInteger(input.estimatedMinutes, 'Durée estimée'),
      recommendedDelayDays: optionalInteger(input.recommendedDelayDays, 'Délai recommandé'),
      specialTerms: input.specialTerms.trim() || null,
      contractType: input.contractType.trim() || null,
      internalAdvice: input.internalAdvice.trim() || null,
      commercialParameters: Object.fromEntries(Object.entries(input.commercialParameters)
        .map(([key, value]) => [key, typeof value === 'string' ? (value.trim() || null) : value])),
      inclusions: splitLines(input.inclusionsText),
      exclusions: splitLines(input.exclusionsText),
      prerequisites: splitLines(input.prerequisitesText),
    };
  }

  async function createItem(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!draft.name.trim()) { setFormError('Le nom est requis.'); return; }
    setSaving(true);
    try {
      const created = await window.atoumweb.catalog.create(
        {
          type: draft.type,
          canonicalCode: draft.canonicalCode.trim() || null,
          name: draft.name.trim(),
          category: draft.category.trim() || null,
          categoryId: createCategoryId || null,
          visiblePublic: draft.visiblePublic,
        },
        buildVersion(draft),
      );
      setDraft(EMPTY_DRAFT);
      setCreateCategoryId('');
      createGuard.saved(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
      setSelectedId(created.id);setVersionMode(false);setActiveTab('identity');await loadDetail(created.id);
      onMessage(`${created.type === 'offer' ? 'Offre' : 'Service'} créé en brouillon.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Création impossible.');
    } finally {
      setSaving(false);
    }
  }

  function prepareNewVersion(): void {
    if (!detail?.currentVersion || versionMode) return;
    // 04C/E99: reopen the existing draft instead of generating vN+1 on
    // every edit. A published version is only copied when no draft exists.
    const existingDraft = detail.versions.find(version => version.status === 'draft') ?? null;
    const current = existingDraft ?? detail.currentVersion;
    setEditingDraftVersion(existingDraft);
    setPublicationCandidate(null);
    setVersionFormError(null);
    setVersionDraft({
      canonicalCode: detail.canonicalCode ?? '',
      commercialKind: current.commercialKind ?? '',
      familyCode: current.familyCode ?? '',
      abbyLabel: current.abbyLabel ?? '',
      unit: current.unit ?? '',
      periodicity: current.periodicity ?? '',
      priceBasis: current.priceBasis ?? 'listed',
      sourceReference: current.provenance?.reference ?? '',
      sourceSha256: current.provenance?.sha256 ?? '',
      sourceRecordKey: current.provenance?.recordKey ?? '',
      type: detail.type,
      name: detail.name,
      category: detail.category ?? '',
      nature: current.nature ?? '',
      description: current.description ?? '',
      inclusionsText: (current.inclusions ?? []).join('\n'),
      exclusionsText: (current.exclusions ?? []).join('\n'),
      prerequisitesText: (current.prerequisites ?? []).join('\n'),
      priceMode: current.priceMode,
      priceEuros: current.priceCents == null ? '' : String(current.priceCents / 100),
      recommendedEuros: current.recommendedPriceCents == null ? '' : String(current.recommendedPriceCents / 100),
      depositPercent: current.defaultDepositPercent == null ? '' : String(current.defaultDepositPercent),
      estimatedMinutes: current.estimatedMinutes == null ? '' : String(current.estimatedMinutes),
      recommendedDelayDays: current.recommendedDelayDays == null ? '' : String(current.recommendedDelayDays),
      specialTerms: current.specialTerms ?? '',
      contractType: current.contractType ?? '',
      internalAdvice: current.internalAdvice ?? '',
      commercialParameters: { ...current.commercialParameters },
      visiblePublic: detail.visiblePublic,
    });
    setVersionMode(true);
  }

  async function createVersion(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!detail || saving) return;
    const payload = buildVersion(versionDraft);
    const payloadFingerprint = JSON.stringify(payload);
    const previousRequest = pendingVersionCreations.current.get(detail.id);
    if (!editingDraftVersion && previousRequest &&
      previousRequest.fingerprint !== payloadFingerprint) {
      const message = 'Une création précédente a une réponse incertaine. Reprends la version envoyée sans modifier les champs, puis enregistre les changements dans le brouillon créé.';
      setVersionFormError(message);
      onMessage(message);
      return;
    }
    if (!editingDraftVersion && !previousRequest) {
      pendingVersionCreations.current.set(detail.id, {
        requestId: crypto.randomUUID(), fingerprint: payloadFingerprint,
      });
    }
    setSaving(true);
    setVersionFormError(null);
    try {
      const version = editingDraftVersion
        ? await window.atoumweb.catalog.saveDraftVersion(editingDraftVersion.id, editingDraftVersion, payload)
        : await window.atoumweb.catalog.createVersion(detail.id, payload, pendingVersionCreations.current.get(detail.id)!.requestId);
      versionGuard.saved(versionDraft);
      pendingVersionCreations.current.delete(detail.id);
      setVersionMode(false);
      setEditingDraftVersion(null);
      setVersionFormError(null);
      await refresh();
      await openItem(detail.id);
      onMessage(editingDraftVersion
        ? `Brouillon v${version.versionNumber} enregistré dans la même version, sans publication.`
        : `Version v${version.versionNumber} créée en brouillon.${detail.type === 'offer' ? ' Sa composition a été recopiée.' : ''}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’enregistrer cette version.';
      setVersionFormError(message);
      onMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function publish(versionId: string): Promise<void> {
    if (!detail || saving || !publicationCandidate || publicationCandidate.id !== versionId) return;
    // A visible unsaved editor must NEVER publish the older persisted fields.
    if (versionMode) {
      const message = 'Enregistre ou annule les modifications du brouillon avant de publier sa version enregistrée.';
      setVersionFormError(message);
      onMessage(message);
      return;
    }
    setSaving(true);
    try {
      const version = await window.atoumweb.catalog.publishVersion(versionId, publicationCandidate);
      setPublicationCandidate(null);
      await refresh();
      await openItem(detail.id);
      onMessage(`Version v${version.versionNumber} publiée. L’ancienne version reste dans l’historique.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Publication impossible ; aucune validation juridique implicite.');
    } finally {
      setSaving(false);
    }
  }

  async function assignCode(): Promise<void> {
    if (!detail) return;
    setSaving(true);
    try {
      await window.atoumweb.catalog.assignCanonicalCode(detail.id, canonicalCodeDraft);
      await refresh();
      onMessage('Code canonique attribué explicitement. Les versions et devis historiques sont conservés.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Attribution du code impossible.');
    } finally { setSaving(false); }
  }

  async function updateStatus(status: CatalogItemStatus): Promise<void> {
    if (!detail) return;
    await window.atoumweb.catalog.setStatus(detail.id, status);
    await refresh();
    await openItem(detail.id);
    onMessage(`Statut : ${STATUS_LABELS[status]}.`);
  }

  async function toggleVisibility(): Promise<void> {
    if (!detail) return;
    await window.atoumweb.catalog.setVisiblePublic(detail.id, !detail.visiblePublic);
    await refresh();
    await openItem(detail.id);
  }

  async function addOfferComponent(): Promise<void> {
    if (!offerVersionId || !componentServiceVersionId) return;
    const quantity = Number(componentQuantity.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      onMessage('Quantité invalide.');
      return;
    }
    try {
      const next = await window.atoumweb.catalog.setOfferComponents(offerVersionId, [
        ...offerComponents.map((component) => ({
          serviceVersionId: component.serviceVersionId,
          isOptional: component.isOptional,
          quantityMilli: component.quantityMilli,
          sortOrder: component.sortOrder,
        })),
        {
          serviceVersionId: componentServiceVersionId,
          isOptional: componentOptional,
          quantityMilli: Math.round(quantity * 1000),
          sortOrder: offerComponents.length * 10,
        },
      ]);
      setOfferComponents(next);
      setComponentServiceVersionId('');
      setComponentQuantity('1');
      setComponentOptional(false);
      onMessage('Service ajouté à la composition de l’Offre.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier la composition.');
    }
  }

  async function removeOfferComponent(componentId: string): Promise<void> {
    if (!offerVersionId) return;
    try {
      const next = await window.atoumweb.catalog.setOfferComponents(
        offerVersionId,
        offerComponents.filter((component) => component.id !== componentId).map((component, index) => ({
          serviceVersionId: component.serviceVersionId,
          isOptional: component.isOptional,
          quantityMilli: component.quantityMilli,
          sortOrder: index * 10,
        })),
      );
      setOfferComponents(next);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier la composition.');
    }
  }

  const offerCompositionVersion = detail?.type === 'offer'
    ? detail.versions.find((version) => version.id === offerVersionId) ?? null
    : null;
  const offerCompositionEditable = offerCompositionVersion?.status === 'draft';

  return (
    <div className="catalog-stack">
      <div className="module-toolbar catalog-toolbar">
        <div><strong>{filtered.length}</strong><span> élément{filtered.length > 1 ? 's' : ''}</span></div>
        <div className="toolbar-controls catalog-toolbar-controls">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
          <input className="inline-search" placeholder="Rechercher dans le catalogue…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | CatalogItemType)}>
            <option value="all">Services + Offres</option><option value="service">Services</option><option value="offer">Offres</option>
          </select>
          <select aria-label="Filtrer par catégorie" value={effectiveCategory} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Toutes les catégories</option>
            {categories.map((category) => <option value={category} key={category}>{catalogueCategoryName(category) === category ? category : `${catalogueCategoryName(category)} · ${category}`}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | CatalogItemStatus)}>
            <option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="archived">Archivés</option>
          </select>
          {hasFilters && <button className="secondary-button" type="button" onClick={resetFilters}>Réinitialiser les filtres</button>}
          <button className="secondary-button" type="button" aria-expanded={showCategoryInventory} onClick={() => showCategoryInventory
              ? requestUnsavedExit(() => setShowCategoryInventory(false))
              : setShowCategoryInventory(true)}>Catégories existantes</button>
          <div className="catalog-view-switch" role="group" aria-label="Présentation du catalogue">
            <button type="button" className="secondary-button" aria-pressed={catalogView === 'organized'} onClick={() => setCatalogView('organized')}>Vue organisée</button>
            <button type="button" className="secondary-button" aria-pressed={catalogView === 'table'} onClick={() => setCatalogView('table')}>Tableau d'administration</button>
          </div>
          <button className="primary-button" type="button" onClick={() => showForm?createGuard.request(()=>setShowForm(false)):setShowForm(true)}>{showForm ? 'Fermer' : '+ Service / Offre'}</button>
        </div>
      </div>

      {showCategoryInventory && (
        <CatalogCategoryInventory items={items}
          onChanged={refresh}
          onClose={() => requestUnsavedExit(() => setShowCategoryInventory(false))}
          onFilter={category => requestUnsavedExit(() => {
            setQuery(''); setTypeFilter('all'); setStatusFilter('all'); setCategoryFilter(category);
            setShowCategoryInventory(false);
          })} />
      )}

      {showForm && (
        <form className="panel catalog-form" onSubmit={(event) => void createItem(event)}>
          <div className="panel-title"><div><span className="eyebrow">Catalogue</span><h2>Créer un Service ou une Offre</h2><p className="muted">La première version est créée en brouillon. Tu la publies après vérification.</p></div></div>
          <fieldset disabled={saving}>
            <label className="catalog-category-create-choice">Catégorie métier administrée
              <select aria-label="Catégorie métier administrée" value={createCategoryId} onChange={event => {
                const id = event.target.value;
                const selected = createCategoryChoices.find(category => category.id === id);
                setCreateCategoryId(id);
                if (selected) setDraft(current => ({ ...current, category: selected.name }));
                else if (createCategoryId) setDraft(current => ({ ...current, category: '' }));
              }}>
                <option value="">Choisir une catégorie existante (facultatif)</option>
                {createCategoryChoices.filter(category => category.status === 'active').map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            {createCategoryLoadError && <p className="muted" role="status">Registre indisponible : {createCategoryLoadError}. La catégorie libre reste utilisable.</p>}
            <CatalogFields draft={draft} onChange={next => {
              if (createCategoryId && next.category !== draft.category) setCreateCategoryId('');
              setDraft(next);
            }} showIdentity />
            {createCategoryId && <p className="muted">Catégorie stable sélectionnée : le service et son brouillon seront créés dans une seule transaction.</p>}
          </fieldset>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le brouillon'}</button></div>
        </form>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement du catalogue…</p></div> : (
        <div
          className={detail ? `catalog-layout with-detail ${detailExpanded ? 'detail-expanded' : ''}` : 'catalog-layout'}
          style={detail && !detailExpanded ? { gridTemplateColumns: `${detailSplitPercent}% 8px minmax(0, 1fr)` } : undefined}
        >
          <div className="panel table-panel catalog-table-panel">
            {detail ? (
              <div className="catalog-compact-list" role="list" aria-label="Offres et services">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    className={`catalog-compact-item ${selectedId === item.id ? 'selected' : ''}`}
                    type="button"
                    role="listitem"
                    onClick={() => void openItem(item.id)}
                  >
                    <span className="catalog-compact-heading">
                      <strong>{item.name}</strong>
                      <span className="status-pill">{item.currentVersion?.commercialKind ? KIND_LABELS[item.currentVersion.commercialKind] : item.type === 'offer' ? 'Offre' : 'Service'}</span>
                    </span>
                    {item.canonicalCode && <small className="catalog-canonical-code">{item.canonicalCode}</small>}
                    <span className="catalog-compact-meta">
                      <span>{item.category || 'Sans catégorie'}</span>
                      <span>{formatPrice(item)}</span>
                    </span>
                    <span className="catalog-compact-meta">
                      <span className={`catalog-status catalog-${item.status}`}>{STATUS_LABELS[item.status]}</span>
                      <span>{item.currentVersion ? `v${item.currentVersion.versionNumber} · ${VERSION_STATUS_LABELS[item.currentVersion.status]}` : 'Sans version'}</span>
                    </span>
                  </button>
                ))}
                {filtered.length === 0 && <div className="empty-table">Aucune offre ou service pour ces filtres.</div>}
              </div>
            ) : catalogView === 'organized' ? (
              <CatalogOverview items={filtered} formatPrice={formatPrice} onOpen={(id) => void openItem(id)} />
            ) : (
              <div className="catalog-table-wrap">
                <table className="catalog-table">
                  <thead><tr><th>Catégorie</th><th>Nom</th><th>Type</th><th>Prix AtoumWeb</th><th>Prix conseillé</th><th>Mode</th><th>Statut</th><th>Site</th><th>Version</th></tr></thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className={selectedId === item.id ? 'selected-row' : ''} onClick={() => void openItem(item.id)}>
                        <td>{item.category || '—'}</td><td><strong>{item.name}</strong>{item.canonicalCode && <small className="catalog-canonical-code">{item.canonicalCode}</small>}</td><td><span className="status-pill">{item.currentVersion?.commercialKind ? KIND_LABELS[item.currentVersion.commercialKind] : item.type === 'offer' ? 'Offre' : 'Service'}</span></td><td>{formatPrice(item)}</td><td>{item.currentVersion?.recommendedPriceCents != null ? `${(item.currentVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'}</td><td>{item.currentVersion ? PRICE_LABELS[item.currentVersion.priceMode] : '—'}</td><td><span className={`catalog-status catalog-${item.status}`}>{STATUS_LABELS[item.status]}</span></td><td>{item.visiblePublic ? 'Oui' : 'Non'}</td><td>{item.currentVersion ? `v${item.currentVersion.versionNumber} · ${VERSION_STATUS_LABELS[item.currentVersion.status]}` : '—'}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={9}><div className="empty-table">Aucune offre ou service pour ces filtres.</div></td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {detail && !detailExpanded && <div
            className="catalog-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionner la liste et la fiche"
            tabIndex={0}
            onPointerDown={() => beginCatalogResize()}
            onDoubleClick={() => setDetailSplitPercent(40)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') setDetailSplitPercent((value) => Math.max(18, value - 3));
              if (event.key === 'ArrowRight') setDetailSplitPercent((value) => Math.min(68, value + 3));
            }}
          ><span /></div>}

          {detail && (
            <aside tabIndex={-1} data-search-entity-type="catalog" data-search-entity-id={detail.id} className={`panel catalog-detail-panel ${detailExpanded ? 'expanded' : ''}`}>
              <div className="detail-panel-heading">
                <div><span className="eyebrow">{detail.type === 'offer' ? 'Offre' : 'Service'}</span><h2>{detail.name}</h2><p className="muted">{detail.category || 'Sans catégorie'}</p></div>
                <div className="catalog-detail-heading-actions">
                  <button className="catalog-detail-expand" type="button" aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}>{detailExpanded ? '↙' : '⛶'}</button>
                  <button className="close-detail" type="button" onClick={closeDetail}>×</button>
                </div>
              </div>
              <div className="detail-badges"><span className={`catalog-status catalog-${detail.status}`}>{STATUS_LABELS[detail.status]}</span><span className="status-pill">{detail.visiblePublic ? 'Visible site' : 'Interne'}</span>{detail.currentVersion && <span className="status-pill">v{detail.currentVersion.versionNumber} · {VERSION_STATUS_LABELS[detail.currentVersion.status]}</span>}</div>
              <div className="catalog-editor-tabs" role="tablist" aria-label="Éditeur des offres et services">
                {CATALOG_EDITOR_TABS.map(tab=><button type="button" key={tab.id} role="tab"
                  id={`catalog-tab-${tab.id}`} aria-selected={activeTab===tab.id}
                  aria-controls={`catalog-panel-${tab.id}`} title={tab.hint}
                  onClick={()=>{
                    if(tab.id===activeTab)return;
                    if(activeTab==='contracts')
                      requestUnsavedExit(()=>setActiveTab(tab.id),'catalog:contract:'+detail.id);
                    else setActiveTab(tab.id);
                  }}>{tab.label}</button>)}
              </div>
              <div role="tabpanel" id={`catalog-panel-${activeTab}`} aria-labelledby={`catalog-tab-${activeTab}`} className="catalog-editor-tab-panel">
              {activeTab==='identity' && <section className="catalog-detail-section catalog-identity-section">
                <strong>Identité catalogue V1</strong>
                <Summary label="Code canonique" value={detail.canonicalCode || 'Non attribué'} />
                {detail.identityProvenance && <Summary label="Source de l’attribution" value={detail.identityProvenance.reference} />}
                {!detail.canonicalCode && <div className="catalog-code-assignment"><label>Code AW à attribuer<input value={canonicalCodeDraft} placeholder="AW-WEB-VITRINE" onChange={(e) => setCanonicalCodeDraft(e.target.value)} /></label><button className="secondary-button" type="button" disabled={saving || !canonicalCodeDraft.trim()} onClick={() => void assignCode()}>Attribuer ce code</button></div>}
                <p className="muted">Le code attribué est durable. Les anciens éléments peuvent rester sans code jusqu’à leur rapprochement explicite.</p>
              </section>}

              {activeTab==='scope' && detail.currentVersion && (!detail.currentVersion.nature || !detail.currentVersion.description || (detail.currentVersion.inclusions?.length ?? 0) === 0) && (
                <div className="catalog-completeness">
                  <div><strong>Fiche à compléter</strong><span>Nature, description et contenu inclus permettent de comprendre immédiatement ce qui est réellement vendu.</span></div>
                  <button className="secondary-button" type="button" disabled={versionMode || saving} onClick={prepareNewVersion}>Compléter la fiche</button>
                </div>
              )}

              {detail.currentVersion && ['identity','pricing','scope','sales','contracts'].includes(activeTab) ? (
                <div className="catalog-current-version">
                  {(activeTab==='scope') && <section className="catalog-detail-section catalog-detail-overview">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Prestation</span><strong>Ce qui est réellement vendu</strong></div>
                    <h3>{detail.currentVersion.nature || 'Nature de la prestation à renseigner'}</h3>
                    <p>{detail.currentVersion.description || 'Description à compléter pour expliquer clairement le résultat attendu au client.'}</p>
                  </section>}

                  {(activeTab==='pricing'||activeTab==='identity') && <section className="catalog-detail-section">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Repères</span><strong>Tarification, délai et cadre</strong></div>
                    <div className="catalog-summary-grid">
                      <Summary label="Tarif actuel" value={formatPrice(detail)} />
                      <Summary label="Nature commerciale" value={detail.currentVersion.commercialKind ? KIND_LABELS[detail.currentVersion.commercialKind] : 'Non renseignée'} />
                      <Summary label="Famille canonique" value={detail.currentVersion.familyCode || 'Non renseignée'} />
                      <Summary label="Libellé Abby" value={detail.currentVersion.abbyLabel || 'Non renseigné'} />
                      <Summary label="Unité" value={detail.currentVersion.unit || 'Non renseignée'} />
                      <Summary label="Périodicité" value={detail.currentVersion.periodicity || 'Non renseignée'} />
                      {detail.currentVersion.provenance && <Summary label="Source" value={[detail.currentVersion.provenance.reference, detail.currentVersion.provenance.recordKey, detail.currentVersion.provenance.sha256].filter(Boolean).join(' · ')} />}
                      <Summary label="Prix conseillé" value={detail.currentVersion.recommendedPriceCents != null ? `${(detail.currentVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'} />
                      <Summary label="Acompte par défaut" value={detail.currentVersion.defaultDepositPercent != null ? `${detail.currentVersion.defaultDepositPercent} %` : '—'} />
                      <Summary label="Durée estimée" value={detail.currentVersion.estimatedMinutes != null ? `${detail.currentVersion.estimatedMinutes} min` : '—'} />
                      <Summary label="Délai recommandé" value={detail.currentVersion.recommendedDelayDays != null ? `${detail.currentVersion.recommendedDelayDays} jours` : '—'} />
                      <Summary label="Ancien libellé contractuel (legacy)" value={detail.currentVersion.contractType || '—'} />
                      <Summary label={detail.currentVersion.publishedAt ? 'Publiée le' : 'Créée le'} value={formatCatalogDate(detail.currentVersion.publishedAt ?? detail.currentVersion.createdAt)} />
                    </div>
                  </section>}

                  {(activeTab==='scope') && <section className="catalog-detail-section">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Périmètre</span><strong>Inclus, exclusions et prérequis</strong></div>
                    <ListSummary label="Inclus" values={detail.currentVersion.inclusions ?? []} />
                    <ListSummary label="Exclusions" values={detail.currentVersion.exclusions ?? []} />
                    <ListSummary label="Prérequis" values={detail.currentVersion.prerequisites ?? []} />
                  </section>}

                  {(activeTab==='contracts') && <section className="catalog-detail-section">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Conditions</span><strong>Cadre commercial</strong></div>
                    <Summary label="Conditions commerciales" value={detail.currentVersion.specialTerms || 'Non renseignées'} />
                  </section>}

                  {activeTab==='sales' && <CommercialParametersSummary parameters={detail.currentVersion.commercialParameters} />}
                  {activeTab==='sales' && !Object.values(detail.currentVersion.commercialParameters ?? {}).some(Boolean) && !detail.currentVersion.internalAdvice &&
                    <p className="muted">Aucune aide à la vente configurée pour cette version. Les bénéfices, besoins et conseils restent à renseigner dans un brouillon.</p>}

                  {activeTab==='sales' && detail.currentVersion.internalAdvice && <div className="catalog-internal-note"><strong>Conseil interne AtoumWeb</strong><p>{detail.currentVersion.internalAdvice}</p></div>}
                </div>
              ) : !detail.currentVersion ? <p className="muted">Aucune version.</p> : null}

              {activeTab==='identity' && <div className="catalog-detail-actions"><button className="secondary-button" type="button" disabled={versionMode || saving} onClick={() => void toggleVisibility()}>{detail.visiblePublic ? 'Masquer du site' : 'Rendre visible site'}</button><select value={detail.status} disabled={versionMode || saving} onChange={(e) => void updateStatus(e.target.value as CatalogItemStatus)}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select><button className="primary-button" type="button" disabled={!detail.currentVersion || versionMode || saving} onClick={prepareNewVersion}>{detail.versions.some(v => v.status === 'draft') ? 'Reprendre le brouillon' : 'Modifier via une nouvelle version'}</button></div>}

              {activeTab==='contracts' && <CatalogContractPanel key={detail.id+detail.versions.length} item={detail}/> }
              {activeTab==='history' && publicationCandidate && publicationCandidate.itemId === detail.id &&
                <CatalogPublicationReview
                  item={detail} draft={publicationCandidate}
                  components={detail.type === 'offer' && offerVersionId === publicationCandidate.id ? offerComponents : null}
                  busy={saving} onCancel={() => setPublicationCandidate(null)}
                  onConfirm={() => void publish(publicationCandidate.id)} />}
              {versionMode && !catalogTabHasVersionFields(activeTab) && <p role="status" className="muted">Brouillon d'édition conservé. Reviens dans Identité, Tarifs, Contenu, Aide à la vente ou Contrat pour enregistrer ou annuler les modifications.</p>}
              {versionMode && catalogTabHasVersionFields(activeTab) && <form className="catalog-version-editor" onSubmit={(event) => void createVersion(event)}>
                <strong>{editingDraftVersion ? `Modifier le brouillon v${editingDraftVersion.versionNumber}` : 'Nouvelle version brouillon'}</strong>
                <p className="muted">{editingDraftVersion
                  ? 'Enregistrer modifie seulement ce brouillon. Les versions publiées et les anciens Devis restent inchangés.'
                  : 'Créer une nouvelle version ne publie rien. Les associations existantes sont copiées et restent à vérifier.'}</p>
                <fieldset disabled={saving}><CatalogFields draft={versionDraft} onChange={setVersionDraft} activeTab={activeTab} /></fieldset>
                {versionFormError && <p className="form-error" role="alert">{versionFormError} — la saisie locale est conservée.</p>}
                <div className="inline-editor-actions">
                  <button className="secondary-button" type="button" onClick={() => versionGuard.request(()=>{setVersionMode(false);setEditingDraftVersion(null);setVersionFormError(null);})}>Annuler</button>
                  <button className="primary-button" disabled={saving} type="submit">{saving?'Enregistrement…':editingDraftVersion?'Enregistrer le brouillon':`Créer v${(detail.versions[0]?.versionNumber ?? 0) + 1}`}</button>
                </div>
              </form>}

              {activeTab==='associations' && detail.type === 'offer' && offerCompositionVersion && (
                <section className="offer-composition">
                  <div className="offer-composition-heading"><div><span className="eyebrow">Composition</span><strong>Services de l’Offre · v{offerCompositionVersion.versionNumber}</strong></div><span className="status-pill">{VERSION_STATUS_LABELS[offerCompositionVersion.status]}</span></div>
                  {offerComponents.map((component) => <div className="offer-component-row" key={component.id}><div><strong>{component.serviceName}</strong><span>v{component.serviceVersionNumber} · {(component.quantityMilli / 1000).toLocaleString('fr-FR')} × · {component.isOptional ? 'Optionnel' : 'Inclus'}</span></div>{offerCompositionEditable && <button className="close-detail" type="button" onClick={() => void removeOfferComponent(component.id)}>×</button>}</div>)}
                  {offerComponents.length === 0 && <p className="muted">Aucun Service dans cette Offre.</p>}
                  {offerCompositionEditable ? (
                    <div className="offer-component-editor">
                      <select value={componentServiceVersionId} onChange={(e) => setComponentServiceVersionId(e.target.value)}><option value="">Ajouter un Service publié…</option>{publishedServices.filter((service) => !offerComponents.some((component) => component.serviceItemId === service.id)).map((service) => <option key={service.id} value={service.currentVersion!.id}>{service.name} · v{service.currentVersion!.versionNumber}</option>)}</select>
                      <input inputMode="decimal" value={componentQuantity} onChange={(e) => setComponentQuantity(e.target.value)} aria-label="Quantité" />
                      <label><input type="checkbox" checked={componentOptional} onChange={(e) => setComponentOptional(e.target.checked)} /> Optionnel</label>
                      <button className="secondary-button" type="button" onClick={() => void addOfferComponent()}>Ajouter</button>
                    </div>
                  ) : <p className="muted">Composition figée. Crée une nouvelle version pour la modifier.</p>}
                </section>
              )}

              {activeTab==='production' && <CatalogProductionPanel key={detail.id} item={detail} />}
              {activeTab==='associations' && detail.type==='service' && <p className="muted">Les associations de services concernent les Offres. Les recommandations complémentaires seront administrées dans le lot 04D.</p>}
              {activeTab==='history' && <div className="catalog-versions"><strong>Historique des versions</strong>{detail.versions.map((version) => <div className="catalog-version-row" key={version.id}><div><strong>v{version.versionNumber}</strong><span>{VERSION_STATUS_LABELS[version.status]}</span><small>{PRICE_LABELS[version.priceMode]} · {version.priceCents != null ? `${(version.priceCents / 100).toLocaleString('fr-FR')} €` : '—'} · {version.publishedAt ? `publiée le ${formatCatalogDate(version.publishedAt)}` : `créée le ${formatCatalogDate(version.createdAt)}`}</small>{version.status === 'draft' && version.provenance && <details className="catalog-import-draft"><summary>Consulter le brouillon importé</summary><p>Cette version n’est pas publiée. Sa consultation ne change pas la version commerciale en cours.</p><p>{version.nature}</p><p>{version.description}</p><Summary label="Code canonique" value={detail.canonicalCode || 'Non attribué'} /><Summary label="Unité / périodicité" value={[version.unit, version.periodicity].filter(Boolean).join(' / ')} /><ListSummary label="Inclus" values={version.inclusions ?? []} /><ListSummary label="Exclusions" values={version.exclusions ?? []} /><ListSummary label="Prérequis" values={version.prerequisites ?? []} /><CommercialParametersSummary parameters={version.commercialParameters} /><Summary label="Source" value={[version.provenance.reference, version.provenance.recordKey, version.provenance.sha256].filter(Boolean).join(' · ')} /></details>}</div>{version.status === 'draft' && <button className="primary-button compact-button" type="button" disabled={versionMode || saving} title={versionMode ? 'Enregistrer ou annuler le brouillon avant publication.' : 'Préparer une confirmation distincte, sans publier le site WordPress.'} onClick={() => setPublicationCandidate(structuredClone(version))}>Préparer la publication</button>}</div>)}</div>}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function CommercialParametersSummary({ parameters }: { parameters?: CatalogCommercialParameters | null }) {
  if (!parameters) return null;
  const labels: Record<keyof CatalogCommercialParameters, string> = {
    clientNeed: 'Besoin client', benefits: 'Bénéfices client', keywords: 'Mots-clés métier', work: 'Travail prévu', options: 'Options / compléments',
    quoteRequiredWhen: 'Cas nécessitant un devis', deliverables: 'Livrables', deliveryTerms: 'Modalités / délai',
    reviewTerms: 'Corrections / recette', correctiveWarranty: 'Garantie corrective prévue',
    thirdPartyCosts: 'Coûts tiers', sourcePriceLabel: 'Règle tarifaire de source',
  };
  return <section className="catalog-detail-section catalog-commercial-parameters"><strong>Paramètres commerciaux du catalogue</strong>{Object.entries(labels).map(([key, label]) => parameters[key as keyof CatalogCommercialParameters] ? <Summary key={key} label={label} value={parameters[key as keyof CatalogCommercialParameters]!} /> : null)}</section>;
}

function CatalogFields({ draft, onChange, showIdentity = false, activeTab }: { draft: CatalogDraft; onChange: (draft: CatalogDraft) => void; showIdentity?: boolean; activeTab?: CatalogEditorTab }) {
  const visible = (...tabs:CatalogEditorTab[]) => !activeTab || tabs.includes(activeTab);
  const priceDisabled = draft.priceMode === 'quote_only' || draft.priceMode === 'free';

  return (
    <div className="catalog-fields">
      {showIdentity && <section className="catalog-field-group">
        <div className="catalog-field-group-heading"><strong>Identité</strong><span>Ce qui permet de retrouver et classer la prestation.</span></div>
        <div className="catalog-fields-grid">
          <label>
            <span className="field-label-with-help">Type <FieldHelp text="Service = prestation atomique. Offre = assemblage commercial de plusieurs Services." /></span>
            <select value={draft.type} onChange={(e) => onChange({ ...draft, type: e.target.value as CatalogItemType })}><option value="service">Service</option><option value="offer">Offre</option></select>
          </label>
          <label>
            <span className="field-label-with-help">Nom <FieldHelp text="Nom commercial interne de la prestation ou de l’offre." /></span>
            <input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder="Ex. Article essentiel" />
          </label>
          <label>
            <span className="field-label-with-help">Catégorie <FieldHelp text="Famille utilisée pour organiser le catalogue : Contenu, Web, SEO, Maintenance…" /></span>
            <input value={draft.category} onChange={(e) => onChange({ ...draft, category: e.target.value })} placeholder="Ex. Contenu" />
          </label>
        </div>
      </section>}

      {visible('identity','pricing','scope') && <section className="catalog-field-group">
        <div className="catalog-field-group-heading"><strong>Fiche versionnée</strong><span>Champs modifiables de cette version uniquement.</span></div>
        {visible('identity','pricing') && <div className="catalog-fields-grid">
          {showIdentity && <label>Code canonique AW (facultatif)<input value={draft.canonicalCode} onChange={(e) => onChange({ ...draft, canonicalCode: e.target.value })} placeholder="AW-WEB-VITRINE" /></label>}
          <label>Nature commerciale<select value={draft.commercialKind} onChange={(e) => onChange({ ...draft, commercialKind: e.target.value as CatalogDraft['commercialKind'] })}><option value="">Non renseignée</option>{CATALOG_COMMERCIAL_KINDS.map((kind) => <option key={kind} value={kind}>{KIND_LABELS[kind]}</option>)}</select></label>
          <label>Famille canonique<input value={draft.familyCode} onChange={(e) => onChange({ ...draft, familyCode: e.target.value })} placeholder="WEB" /></label>
          <label>Libellé Abby<input value={draft.abbyLabel} onChange={(e) => onChange({ ...draft, abbyLabel: e.target.value })} /></label>
          <label>Unité<input value={draft.unit} onChange={(e) => onChange({ ...draft, unit: e.target.value })} placeholder="Page, heure, produit…" /></label>
          <label>Périodicité<input value={draft.periodicity} onChange={(e) => onChange({ ...draft, periodicity: e.target.value })} placeholder="Ponctuelle, mensuelle, annuelle…" /></label>
          <label>Base de prix<select value={draft.priceBasis} onChange={(e) => onChange({ ...draft, priceBasis: e.target.value as CatalogPriceBasis, ...(e.target.value === 'actual_cost' ? { priceMode: 'quote_only' as const, priceEuros: '' } : {}) })}><option value="listed">Tarif catalogue</option><option value="actual_cost">Coût tiers réel</option></select></label>
        </div>}
        {visible('scope') && <div className="catalog-fields-grid">
          <label className="catalog-wide">
            <span className="field-label-with-help">Nature de la prestation <FieldHelp text="Décris en une courte phrase le rôle de cette prestation. Exemple : rédaction d’un article de blog optimisé ou création d’une page supplémentaire." /></span>
            <input value={draft.nature} onChange={(e) => onChange({ ...draft, nature: e.target.value })} placeholder="Ex. Rédaction d’un article de blog prêt à publier" />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Description <FieldHelp text="Explique le résultat attendu, le périmètre et la valeur apportée au client." /></span>
            <textarea value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} placeholder="Décris clairement la prestation, son objectif et son résultat attendu…" />
          </label>
          <label>
            <span className="field-label-with-help">Inclus <FieldHelp text="Un élément par ligne. Ce sont les livrables ou actions compris dans le prix." /></span>
            <textarea value={draft.inclusionsText} onChange={(e) => onChange({ ...draft, inclusionsText: e.target.value })} placeholder={"Recherche du sujet\nRédaction\nMise en forme"} />
          </label>
          <label>
            <span className="field-label-with-help">Exclusions <FieldHelp text="Un élément par ligne. Précise ce qui n’est pas compris pour éviter les ambiguïtés." /></span>
            <textarea value={draft.exclusionsText} onChange={(e) => onChange({ ...draft, exclusionsText: e.target.value })} placeholder={"Achat de photos\nTraduction"} />
          </label>
          <label>
            <span className="field-label-with-help">Prérequis <FieldHelp text="Un élément par ligne. Informations, accès ou validations nécessaires avant de commencer." /></span>
            <textarea value={draft.prerequisitesText} onChange={(e) => onChange({ ...draft, prerequisitesText: e.target.value })} placeholder={"Sujet validé\nAccès WordPress"} />
          </label>
        </div>}
      </section>}

      {visible('pricing') && <section className="catalog-field-group">
        <div className="catalog-field-group-heading"><strong>Tarification & délai</strong><span>Références commerciales et estimation interne.</span></div>
        <div className="catalog-fields-grid">
          <label>
            <span className="field-label-with-help">Mode tarifaire <FieldHelp text="Détermine la façon dont le prix est présenté et calculé dans le catalogue." /></span>
            <select disabled={draft.priceBasis === 'actual_cost'} value={draft.priceMode} onChange={(e) => onChange({ ...draft, priceMode: e.target.value as PriceMode })}>{PRICE_MODES.map((mode) => <option key={mode} value={mode}>{PRICE_LABELS[mode]}</option>)}</select>
          </label>
          <label>
            <span className="field-label-with-help">Prix AtoumWeb (€) <FieldHelp text="Prix de vente courant utilisé comme référence pour les devis." /></span>
            <input disabled={priceDisabled} inputMode="decimal" value={priceDisabled ? '' : draft.priceEuros} onChange={(e) => onChange({ ...draft, priceEuros: e.target.value })} placeholder="99" />
          </label>
          <label>
            <span className="field-label-with-help">Prix conseillé (€) <FieldHelp text="Référence interne éventuelle permettant de mesurer une remise ou un positionnement commercial." /></span>
            <input inputMode="decimal" value={draft.recommendedEuros} onChange={(e) => onChange({ ...draft, recommendedEuros: e.target.value })} />
          </label>
          <label>
            <span className="field-label-with-help">Acompte par défaut (%) <FieldHelp text="Pourcentage proposé automatiquement lors de la création d’un devis." /></span>
            <input inputMode="numeric" value={draft.depositPercent} onChange={(e) => onChange({ ...draft, depositPercent: e.target.value })} />
          </label>
          <label>
            <span className="field-label-with-help">Durée estimée (min) <FieldHelp text="Temps de production interne de référence. Il servira ensuite aux comparaisons de temps et de rentabilité." /></span>
            <input inputMode="numeric" value={draft.estimatedMinutes} onChange={(e) => onChange({ ...draft, estimatedMinutes: e.target.value })} />
          </label>
          <label>
            <span className="field-label-with-help">Délai recommandé (jours) <FieldHelp text="Délai indicatif à reprendre dans le devis ou le planning du projet." /></span>
            <input inputMode="numeric" value={draft.recommendedDelayDays} onChange={(e) => onChange({ ...draft, recommendedDelayDays: e.target.value })} />
          </label>
        </div>
      </section>}

      {visible('identity','sales','contracts') && <section className="catalog-field-group">
        <div className="catalog-field-group-heading"><strong>Cadre et aide commerciale</strong><span>Informations versionnées, distinctes des CGV publiées.</span></div>
        {visible('identity') && <div className="catalog-fields-grid">
          <label>Référence de source<input value={draft.sourceReference} onChange={(e) => onChange({ ...draft, sourceReference: e.target.value })} placeholder="Document ou référence de décision" /></label>
          <label>Empreinte source SHA-256<input value={draft.sourceSha256} onChange={(e) => onChange({ ...draft, sourceSha256: e.target.value })} /></label>
          <label>Ligne ou clé de source<input value={draft.sourceRecordKey} onChange={(e) => onChange({ ...draft, sourceRecordKey: e.target.value })} /></label>
        </div>}
        {visible('contracts') && <div className="catalog-fields-grid">
          <details className="contract-legacy"><summary>Ancien libellé contractuel (legacy)</summary><p>Conservé pour compatibilité uniquement. Les types structurés se choisissent dans les références contractuelles de la version Catalogue.</p><input readOnly value={draft.contractType} aria-label="Ancien libellé contractuel legacy" /></details>
          <label className="catalog-wide">
            <span className="field-label-with-help">Conditions commerciales <FieldHelp text="Conditions particulières à reprendre dans le devis lorsque cette prestation est utilisée." /></span>
            <textarea value={draft.specialTerms} onChange={(e) => onChange({ ...draft, specialTerms: e.target.value })} />
          </label>
        </div>}
        {visible('sales') && <div className="catalog-fields-grid">
          <label className="catalog-wide">
            <span className="field-label-with-help">Besoin client <FieldHelp text="Formule le problème que la prestation aide à résoudre. Utilisé pour rechercher cette prestation depuis Prospects et Devis après publication." /></span>
            <textarea value={draft.commercialParameters.clientNeed ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, clientNeed: e.target.value },
            })} placeholder="Ex. améliorer la visibilité de l'entreprise sur Google" />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Bénéfices client <FieldHelp text="Bénéfices décrits pour cette version, sans promesse automatique de résultat ni création de clause CGV." /></span>
            <textarea value={draft.commercialParameters.benefits ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, benefits: e.target.value },
            })} placeholder="Ex. pages plus faciles à retrouver, présentation claire de l'activité" />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Mots-clés et synonymes métier <FieldHelp text="Termes réellement édités et stockés dans cette version. Sépare-les par une virgule ou une ligne. La recherche ne devine pas de synonymes absents." /></span>
            <textarea value={draft.commercialParameters.keywords ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, keywords: e.target.value },
            })} placeholder={"visibilité Google\nSEO local\nréférencement naturel"} />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Conseil interne AtoumWeb <FieldHelp text="Bonne pratique, point de vigilance ou conseil réservé à AtoumWeb. Jamais affiché automatiquement au client." /></span>
            <textarea value={draft.internalAdvice} onChange={(e) => onChange({ ...draft, internalAdvice: e.target.value })} placeholder="Ex. demander le sujet, le mot-clé principal et les visuels avant démarrage." />
          </label>
        </div>}
        {showIdentity && <label className="catalog-public-check"><input type="checkbox" checked={draft.visiblePublic} onChange={(e) => onChange({ ...draft, visiblePublic: e.target.checked })} /> Visible sur le site public</label>}
      </section>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><strong>{label}</strong><span>{value}</span></div>;
}

function ListSummary({ label, values }: { label: string; values: string[] }) {
  return <div className="catalog-list-summary"><strong>{label}</strong>{values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <span>Non renseigné</span>}</div>;
}

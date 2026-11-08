import {catalogUiError} from '../../shared/catalogUiError';
import {UnsavedSaveDialog} from '../unsaved/UnsavedSaveDialog';
import {CatalogConflictResolver} from './CatalogConflictResolver';
import {CatalogDuplicateDialog} from './CatalogDuplicateDialog';
import {similarCatalogDrafts} from '../../shared/catalogDraftSuggestions';
import {CatalogDrafts} from './CatalogDrafts';
import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import {CATALOG_ADMIN_VIEW} from '../../shared/realTableSchemas';
import {OperationIcon,type OperationIconName} from '../operations/OperationIcon';
import './commercial-visual-foundation.css';
import {useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import { CatalogContractPanel } from './CatalogContractPanel';
import { CatalogPublicationReview } from './CatalogPublicationReview';
import { compareCatalogVersions } from '../../shared/catalogVersionReview';
import { compareCatalogSalesAdvice } from '../../shared/catalogAdviceComparison';
import { CatalogProductionPanel } from './CatalogProductionPanel';
import { CatalogRecommendationsPanel } from './CatalogRecommendationsPanel';
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
  type CatalogDraftEntry,
  type CatalogVersion,
  type OfferComponent,
  type PriceMode,
} from '../../shared/commercial';
import { FieldHelp } from '../ui/FieldHelp';
import {CatalogFamiliesOverview} from './CatalogFamiliesOverview';
import {catalogCounts,catalogFamilies,filterCatalogWorkspace,versionStatesOf} from './catalogWorkspaceModel';
import {defaultCatalogContext,type CatalogTableContext} from '../../shared/catalogTableContext';
import {readTableView,tableViewKey} from '../../shared/tableViewPreference';
import {REAL_TABLE_SCHEMAS} from '../../shared/realTableSchemas';
import './catalog-workspace-v2.css';
import './catalog-editor-v2.css';
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
  priceMode: PriceMode|null;
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
  priceMode: null,
  priceEuros: '',
  recommendedEuros: '',
  depositPercent: '',
  estimatedMinutes: '',
  recommendedDelayDays: '',
  specialTerms: '',
  contractType: '',
  internalAdvice: '',
  commercialParameters: {},
  visiblePublic: false,
};


function draftFromVersion(current:CatalogVersion,detail:CatalogItemDetail):CatalogDraft {return {
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
    };}

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
  if(version.priceMode===null)return 'Tarif à compléter';
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
  const [filters,setFilters]=useState<CatalogTableContext>(()=>{try{return readTableView(window.atoumweb.visualPreferences,tableViewKey(CATALOG_ADMIN_VIEW),[],[],REAL_TABLE_SCHEMAS[CATALOG_ADMIN_VIEW]).catalogContext??defaultCatalogContext();}catch{return defaultCatalogContext();}});
  const [tablePage,setTablePage]=useState(1);
  const [space,setSpace]=useState<'catalog'|'steering'|'administration'>('catalog');
  const [listError,setListError]=useState('');
  const [advancedFilters,setAdvancedFilters]=useState(false);
  const query=filters.query,typeFilter=filters.type,statusFilter=filters.itemStatus,categoryFilter=filters.category;
  function changeFilter<K extends keyof CatalogTableContext>(key:K,value:CatalogTableContext[K]){setFilters(current=>({...current,[key]:value}));setTablePage(1);}
  const setQuery=(value:string)=>changeFilter('query',value);
  const setTypeFilter=(value:CatalogTableContext['type'])=>changeFilter('type',value);
  const setStatusFilter=(value:CatalogTableContext['itemStatus'])=>changeFilter('itemStatus',value);
  const setCategoryFilter=(value:string)=>changeFilter('category',value);
  const [catalogView, setCatalogView] = useState<'organized' | 'table'>('organized');
  const [showCategoryInventory, setShowCategoryInventory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogItemDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creationStep,setCreationStep]=useState<CatalogEditorTab>('identity');
  const [creationPriceChosen,setCreationPriceChosen]=useState(false);
  const [persistent,setPersistent]=useState(false);
  const [showDrafts,setShowDrafts]=useState(false);
  const [draftRows,setDraftRows]=useState<CatalogDraftEntry[]>([]);
  const [draftListError,setDraftListError]=useState('');
  const [resumeVersionId,setResumeVersionId]=useState<string|null>(null);
  const [duplication,setDuplication]=useState<import('../../shared/commercial').CatalogDuplicationPreview|null>(null);
  const [conflictVersion,setConflictVersion]=useState<CatalogVersion|null>(null);
  const pendingCreation=useRef<{requestId:string;fingerprint:string;input:import('../../shared/commercial').CatalogItemInput;payload:CatalogVersionInput}|null>(null);
  useEffect(()=>{window.atoumweb.catalog.persistenceAvailable().then(setPersistent).catch(()=>setPersistent(false));},[]);
  async function refreshDrafts(){try{setDraftRows(await window.atoumweb.catalog.listDrafts());setDraftListError('');}catch(e){setDraftListError(e instanceof Error?e.message:'Brouillons indisponibles.');}}
  useEffect(()=>{if(persistent&&(showDrafts||showForm))void refreshDrafts();},[persistent,showDrafts,showForm]);
  useEffect(()=>{if(resumeVersionId&&detail){const v=detail.versions.find(v=>v.id===resumeVersionId);if(v){prepareNewVersion(v,true);setResumeVersionId(null);}}},[resumeVersionId,detail]);
  async function resumeDraft(row:CatalogDraftEntry){await openItem(row.item.id,row.version.id);}
  async function changeDraftState(row:CatalogDraftEntry,abandoned:boolean){if(!window.confirm(abandoned?'Abandonner ce brouillon ? Il restera restaurable dans l’historique.':'Restaurer ce brouillon ? Un seul brouillon peut être opérationnel.'))return;setSaving(true);try{await window.atoumweb.catalog.setDraftAbandoned(row.version.id,row.version,abandoned);await refresh();await refreshDrafts();}catch(e){setDraftListError(e instanceof Error?e.message:'Changement impossible.');}finally{setSaving(false);}}

  const [consultedVersionId,setConsultedVersionId]=useState<string|null>(null);
  const displayedVersion=detail?.versions.find(v=>v.id===consultedVersionId)??detail?.currentVersion??null;
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
  const [comparisonVersionId,setComparisonVersionId]=useState<string|null>(null);
  const [activeTab,setActiveTab] = useState<CatalogEditorTab>('identity');
  const [pendingItemStatus,setPendingItemStatus]=useState<CatalogItemStatus|null>(null);
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
  const createGuard=useUnsavedDraft('Nouvelle prestation',draft,{group:'catalog:create',ready:showForm,pending:saving,savePriority:100,save:()=>createItem(),discard:baseline=>{setDraft(baseline);setCreateCategoryId('');setShowForm(false);}});
  const versionGuard=useUnsavedDraft('Version Catalogue',versionDraft,{group:'catalog:'+detail?.id,ready:versionMode,pending:saving,resetKey:detail?.id+':'+versionMode,savePriority:100,save:()=>createVersion(),discard:baseline=>{setVersionDraft(baseline);setVersionMode(false);}});
  const identityGuard=useUnsavedDraft('Code Catalogue',canonicalCodeDraft,{group:'catalog:'+detail?.id,ready:!!detail,pending:saving,resetKey:detail?.id,savePriority:100,save:()=>assignCode(),discard:setCanonicalCodeDraft});


  const publishedServices = useMemo(
    () => items.filter((item) => item.type === 'service' && item.status === 'active' && item.currentVersion?.status === 'published'),
    [items],
  );

  async function loadDetail(id:string):Promise<CatalogItemDetail|null>{
    const epoch=++detailEpoch.current;setDetailLoading(true);
    try {
      const next=await window.atoumweb.catalog.getItem(id);
      if(next.id!==id)throw Error('La fiche reçue ne correspond pas à la demande.');
      const version=next.type==='offer'?(next.versions.find(item=>item.status==='draft'&&!item.abandonedAt)??next.currentVersion??null):null;
      const components=version?await window.atoumweb.catalog.listOfferComponents(version.id):[];
      if(!mounted.current||epoch!==detailEpoch.current)return next;
      if(detailRef.current?.id!==id||!identityGuard.dirty)setCanonicalCodeDraft(next.canonicalCode??'');
      setConsultedVersionId(current=>detailRef.current?.id===id&&next.versions.some(v=>v.id===current)?current:next.currentVersion?.id??null);
      setDetail(next);setOfferVersionId(version?.id??null);setOfferComponents(components);return next;
    }catch(error){if(!mounted.current||epoch!==detailEpoch.current)return null;setSelectedId(detailRef.current?.id??null);onEntityReady?.('catalog',id,error instanceof Error?catalogUiError(error):'Prestation introuvable.');throw error;}
    finally{if(mounted.current&&epoch===detailEpoch.current)setDetailLoading(false);}
  }

  async function refresh(): Promise<void> {
    const epoch=++listEpoch.current,selectedAtStart=selectedId;
    setLoading(true);setListError('');
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
      if(persistent&&showDrafts)await refreshDrafts();
    }catch(error){if(mounted.current&&epoch===listEpoch.current){const message=error instanceof Error?catalogUiError(error):'Catalogue indisponible.';setListError(message);onMessage(message);}
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
      if (alive) { setCreateCategoryChoices([]); setCreateCategoryLoadError(error instanceof Error ? catalogUiError(error) : 'Catégories administrées indisponibles.'); }
    });
    return () => { alive = false; };
  }, [showForm]);
  useEffect(()=>{
    if(!initialId)return;
    setSpace('catalog');setSelectedId(initialId);
    if(detailRef.current?.id===initialId){detailEpoch.current++;setDetailLoading(false);onEntityReady?.('catalog',initialId);return;}
    setVersionMode(false);void loadDetail(initialId).catch(e=>onMessage(String(e)));
  },[initialId,initialRequest]);

  const categories = useMemo(() => catalogAdminCategories(items), [items]);
  const effectiveCategory=categoryFilter;
  const families=useMemo(()=>catalogFamilies(items),[items]);
  const filtered=useMemo(()=>filterCatalogWorkspace(items,filters),[items,filters]);
  const counts=useMemo(()=>catalogCounts(items),[items]),filteredCounts=useMemo(()=>catalogCounts(filtered),[filtered]);
  const hasFilters=Boolean(query.trim())||typeFilter!=='all'||statusFilter!=='all'||categoryFilter!=='all'||filters.family!=='all'||filters.versionState!=='all'||filters.visibility!=='all';
  const showAdvancedFilters=advancedFilters||filters.versionState!=='all'||filters.visibility!=='all'||filters.family!=='all';
  const resetFilters=()=>{setFilters(current=>({...defaultCatalogContext(),pageSize:current.pageSize}));setTablePage(1);};
  function changeSpace(next:typeof space){if(next===space)return;requestUnsavedExit(()=>setSpace(next));}
  function openFamily(id:string){requestUnsavedExit(()=>{setFilters(current=>({...current,family:id}));setTablePage(1);setShowDrafts(false);setCatalogView('table');closeDetailDirect();});}

  async function openItem(id:string,resumeId?:string):Promise<void>{
    if(detailRef.current?.id===id&&!resumeId){detailEpoch.current++;setSelectedId(id);setDetailLoading(false);return;}
    requestUnsavedExit(()=>{void (async()=>{setShowDrafts(false);setSelectedId(id);setPendingItemStatus(null);setVersionMode(false);setActiveTab('identity');setPublicationCandidate(null);setDetailExpanded(true);await loadDetail(id);if(resumeId){setConsultedVersionId(resumeId);setResumeVersionId(resumeId);}})().catch(e=>onMessage(String(e)));});
  }

  function closeDetail(): void {
    requestUnsavedExit(closeDetailDirect);
  }
  function closeDetailDirect(): void {
    detailEpoch.current++;
    setSelectedId(null);
    setDetail(null);
    setPendingItemStatus(null);
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

  async function createItem(event?: React.FormEvent): Promise<boolean> {
    event?.preventDefault();
    setFormError(null);
    if(!persistent&&!creationPriceChosen){setCreationStep('pricing');setFormError('Choisis explicitement le mode tarifaire avant de créer ce brouillon. La sauvegarde nom et type seuls attend la migration.');return false;}
    if (!draft.name.trim()) { setFormError('Le nom est requis.'); return false; }
    setSaving(true);
    try {
      const input={type:draft.type,canonicalCode:draft.canonicalCode.trim()||null,name:draft.name.trim(),category:draft.category.trim()||null,categoryId:createCategoryId||null,visiblePublic:draft.visiblePublic};
      const payload=buildVersion(draft),fingerprint=JSON.stringify({input,payload});
      if(persistent&&pendingCreation.current&&pendingCreation.current.fingerprint!==fingerprint)throw Error("Une réponse précédente est incertaine : retrouve l'enregistrement envoyé avant de créer avec une autre saisie.");
      if(persistent&&!pendingCreation.current)pendingCreation.current={requestId:crypto.randomUUID(),fingerprint,input,payload};
      const created=persistent?await window.atoumweb.catalog.createPersistent(input,payload,pendingCreation.current!.requestId):await window.atoumweb.catalog.create(input,payload);
      pendingCreation.current=null;
      setDraft(EMPTY_DRAFT);setCreationStep('identity');setCreationPriceChosen(false);
      setCreateCategoryId('');
      createGuard.saved(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
      setSelectedId(created.id);setDetailExpanded(true);setPendingItemStatus(null);setVersionMode(false);setActiveTab('identity');await loadDetail(created.id);
      if(persistent)setResumeVersionId(created.versions[0].id);
      onMessage(`${created.type === 'offer' ? 'Offre' : 'Service'} créé en brouillon.`);return true;
    } catch (error) {
      setFormError(error instanceof Error ? catalogUiError(error) : 'Création impossible.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function recoverCreation(){const command=pendingCreation.current;if(!command)return;setSaving(true);try{const found=await window.atoumweb.catalog.createPersistent(command.input,command.payload,command.requestId);if(!window.confirm('Enregistrement retrouvé. Ouvrir ce brouillon et abandonner la saisie locale actuelle ?')){setFormError('Brouillon retrouvé ; la saisie actuelle est conservée.');return;}pendingCreation.current=null;createGuard.saved(EMPTY_DRAFT);setDraft(EMPTY_DRAFT);setShowForm(false);setVersionMode(false);setSelectedId(found.id);setDetailExpanded(true);await refresh();await loadDetail(found.id);setResumeVersionId(found.versions[0].id);}catch(e){setFormError(e instanceof Error?e.message:'Rejeu impossible ; saisie conservée.');}finally{setSaving(false);}}

  function prepareNewVersion(restoreFrom?: CatalogVersion,resume=false): boolean {
    if (!detail || (!detail.currentVersion&&!restoreFrom) || versionMode) return false;
    if(restoreFrom && !resume && (!detail.versions.some(version=>version.id===restoreFrom.id) ||
      !window.confirm(`Préparer le contenu de la version v${restoreFrom.versionNumber} dans un brouillon ? Aucune version historique ne sera modifiée. L’enregistrement restera une action distincte.`)))return false;
    // 04C/E99: reopen the existing draft instead of generating vN+1 on
    // every edit. A published version is only copied when no draft exists.
    const existingDraft = detail.versions.find(version => version.status === 'draft'&&!version.abandonedAt) ?? null;
    if(resume&&(!restoreFrom||restoreFrom.abandonedAt||restoreFrom.status!=='draft'))return false;
    const current = restoreFrom ?? existingDraft ?? detail.currentVersion!;
    setConflictVersion(null);
    setEditingDraftVersion(resume?restoreFrom!:existingDraft);
    setPublicationCandidate(null);
    setVersionFormError(null);
    setVersionDraft(draftFromVersion(current,detail));
    setVersionMode(true);
    return true;
  }

  async function createVersion(event?: React.FormEvent): Promise<boolean> {
    event?.preventDefault();
    if (!detail || saving) return false;
    let payload: CatalogVersionInput;
    try {
      payload = buildVersion(versionDraft);
    } catch(error) {
      const message=error instanceof Error?catalogUiError(error):'Données du brouillon invalides.';
      setVersionFormError(message);
      onMessage(message);
      return false;
    }
    const payloadFingerprint = JSON.stringify(payload);
    const previousRequest = pendingVersionCreations.current.get(detail.id);
    if (!editingDraftVersion && previousRequest &&
      previousRequest.fingerprint !== payloadFingerprint) {
      const message = 'Une création précédente a une réponse incertaine. Reprends la version envoyée sans modifier les champs, puis enregistre les changements dans le brouillon créé.';
      setVersionFormError(message);
      onMessage(message);
      return false;
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
        : `Version v${version.versionNumber} créée en brouillon.${detail.type === 'offer' ? ' Sa composition a été recopiée.' : ''}`);return true;
    } catch (error) {
      const message = error instanceof Error ? catalogUiError(error) : 'Impossible d’enregistrer cette version.';
      setVersionFormError(message);
      if(editingDraftVersion&&message.includes('Conflit')){try{const remote=await window.atoumweb.catalog.getItem(detail.id);setConflictVersion(remote.versions.find(v=>v.id===editingDraftVersion.id)??null);}catch{}}
      onMessage(message);
      return false;
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
      onMessage(error instanceof Error ? catalogUiError(error) : 'Publication impossible ; aucune validation juridique implicite.');
    } finally {
      setSaving(false);
    }
  }

  async function assignCode(): Promise<boolean> {
    if (!detail) return false;
    setSaving(true);
    try {
      await window.atoumweb.catalog.assignCanonicalCode(detail.id, canonicalCodeDraft);
      identityGuard.saved(canonicalCodeDraft);await refresh();
      onMessage('Code canonique attribué explicitement. Les versions et devis historiques sont conservés.');return true;
    } catch (error) {
      onMessage(error instanceof Error ? catalogUiError(error) : 'Attribution du code impossible.');
      return false;
    } finally { setSaving(false); }
  }

  async function updateStatus(status: CatalogItemStatus): Promise<void> {
    if (!detail || saving || versionMode) return;
    setSaving(true);
    try {
      await window.atoumweb.catalog.setStatus(detail.id, status);
      setPendingItemStatus(null);
      await refresh();
      await openItem(detail.id);
      onMessage(`Statut : ${STATUS_LABELS[status]}.`);
    } catch(error) {
      onMessage(error instanceof Error?catalogUiError(error):'Changement de statut impossible.');
      return;
    } finally {setSaving(false);}
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
      onMessage(error instanceof Error ? catalogUiError(error) : 'Impossible de modifier la composition.');
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
      onMessage(error instanceof Error ? catalogUiError(error) : 'Impossible de modifier la composition.');
    }
  }

  function selectEditorTab(next: CatalogEditorTab, focus = false): void {
    if (next === activeTab) return;
    const change = () => {
      setActiveTab(next);
      if (focus) document.getElementById(`catalog-tab-${next}`)?.focus();
    };
    // Version fields stay mounted in common React state; only separately edited
    // contract links require their own unsaved-exit confirmation.
    if (activeTab === 'contracts' && detail)
      requestUnsavedExit(change, 'catalog:contract:' + detail.id);
    else if (activeTab === 'associations' && detail)
      requestUnsavedExit(change, 'catalog:' + detail.id);
    else change();
  }

  const offerCompositionVersion = detail?.type === 'offer'
    ? detail.versions.find((version) => version.id === offerVersionId) ?? null
    : null;
  const offerCompositionEditable = offerCompositionVersion?.status === 'draft' && !versionMode && !saving;

  return (
    <div className={`catalog-stack ${showDrafts?'ot-drafts-active':''} ${detail||showForm?'ot-editor-active':''} ${space==='catalog'&&catalogView==='table'&&!detail&&!showForm?'ot-table-fit':''}`}>
      <UnsavedSaveDialog/>
      {duplication&&<CatalogDuplicateDialog preview={duplication} onClose={()=>setDuplication(null)} onCreated={created=>{setDuplication(null);void refresh();requestAnimationFrame(()=>requestAnimationFrame(()=>void openItem(created.id,created.versions[0].id)));}}/>}
      <header className="ot-workspace-heading"><div className="ot-title"><span className="ot-title-icon"><OperationIcon name="package"/></span><div><span className="eyebrow">Commercial</span><h1>Offres & Tarifs</h1><p>Catalogue des offres et services AtoumWeb</p></div></div><div className="ot-heading-actions"><button type="button" className="secondary-button" onClick={()=>void refresh()}><OperationIcon name="refresh"/>Actualiser</button><button className="primary-button" type="button" onClick={()=>requestUnsavedExit(()=>{setSpace('catalog');if(showForm)createGuard.request(()=>setShowForm(false));else {setCreationStep('identity');setCreationPriceChosen(false);setShowDrafts(false);setShowForm(true);}})}>{showForm?'Fermer la création':'+ Service / Offre'}</button></div></header>
      <nav className="ot-spaces" aria-label="Espaces Offres et Tarifs">{([['catalog','Catalogue'],['steering','Pilotage'],['administration','Administration']] as const).map(([id,label])=><button type="button" key={id} aria-current={space===id?'page':undefined} onClick={()=>changeSpace(id)}>{label}{id==='steering'&&<small>À venir</small>}</button>)}</nav>
      {space==='steering'&&<section className="ot-planned panel"><OperationIcon name="chart"/><h2>Pilotage</h2><p>Les statistiques commerciales, le suivi des offres et le centre À suivre seront développés dans les prochains lots.</p><p className="muted">Aucune statistique ni alerte commerciale n’est calculée dans cet espace pour le moment.</p></section>}
      {space==='administration'&&<section className="ot-administration"><header><h2>Administration du Catalogue</h2><p>Catégories existantes et organisation des prochains lots.</p></header><div className="ot-admin-cards"><button className="panel" type="button" onClick={()=>setShowCategoryInventory(value=>!value)}><OperationIcon name="layers"/><strong>Catégories existantes</strong><span>Consulter, administrer et réconcilier les catégories.</span></button>{['Modèles commerciaux et documentaires','Import / export CSV et JSON','Santé du Catalogue','Paramètres'].map(label=><article className="panel" key={label}><strong>{label}</strong><span>Prévu dans un prochain lot · non disponible</span></article>)}</div></section>}
      {listError&&<div className="form-error" role="alert">Catalogue non actualisé : {listError}. {items.length>0?'Les derniers résultats chargés restent affichés.':'Les compteurs ne sont pas disponibles.'}</div>}
      {space==='catalog'&&<>
      {!loading&&!listError&&<section className="ot-counters" aria-label="Compteurs du catalogue">{([['total','Total'],['active','Actifs'],['inactive','Inactifs'],['archived','Archivés'],['published','Avec version publiée'],['draft','Avec brouillon']] as const).map(([key,label])=><div key={key} data-catalog-count={key}><span className="ot-counter-icon"><OperationIcon name={key==='total'?'layers':key==='active'?'check-circle':key==='inactive'?'clock':key==='archived'?'archive':key==='published'?'file-check':'edit'}/></span><strong>{counts[key]}</strong><span>{label}</span>{hasFilters&&<small>{filteredCounts[key]} dans les résultats filtrés</small>}</div>)}</section>}
      <div className={`catalog-toolbar ot-filter-bar ${showAdvancedFilters?'with-advanced':'basic-filters'}`} role="search" aria-label="Recherche et filtres du Catalogue">
        <label className="ot-search">Rechercher<input className="inline-search" type="search" maxLength={200} aria-label="Rechercher dans le catalogue" placeholder="Nom, code, besoin, contenu…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        <label>Type<select aria-label="Type d’article" value={typeFilter} onChange={e=>setTypeFilter(e.target.value as CatalogTableContext['type'])}><option value="all">Services + Offres</option><option value="service">Services</option><option value="offer">Offres</option></select></label>
        <label>Catégorie<select aria-label="Filtrer par catégorie" value={effectiveCategory} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Toutes les catégories</option>{effectiveCategory!=='all'&&!categories.includes(effectiveCategory)&&<option value={effectiveCategory}>{effectiveCategory} (indisponible)</option>}{categories.map(category=><option key={category} value={category}>{catalogueCategoryName(category)===category?category:`${catalogueCategoryName(category)} · ${category}`}</option>)}</select></label>
        <label>Article<select aria-label="Statut d’article" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as CatalogTableContext['itemStatus'])}><option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="archived">Archivés</option></select></label>
        {showAdvancedFilters&&<><label>Version enregistrée<select aria-label="État de version" value={filters.versionState} onChange={e=>changeFilter('versionState',e.target.value as CatalogTableContext['versionState'])}><option value="all">Tous les états</option><option value="published">Avec version publiée</option><option value="draft">Avec brouillon</option><option value="retired">Avec version retirée</option><option value="none">Sans version</option></select></label>
        <label>Visibilité site<select aria-label="Visibilité site" value={filters.visibility} onChange={e=>changeFilter('visibility',e.target.value as CatalogTableContext['visibility'])}><option value="all">Toutes les visibilités</option><option value="public">Visible site</option><option value="internal">Interne</option></select></label>
        <label>Famille<select aria-label="Famille commerciale" value={filters.family} onChange={e=>changeFilter('family',e.target.value)}><option value="all">Toutes les familles</option>{filters.family!=='all'&&!families.some(f=>f.id===filters.family)&&<option value={filters.family}>{filters.family} (indisponible)</option>}{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        </>}
        <div className="ot-filter-actions"><button type="button" className="secondary-button" aria-expanded={showAdvancedFilters} onClick={()=>setAdvancedFilters(value=>!value)}>Filtres avancés</button><button className="secondary-button" type="button" disabled={!hasFilters} onClick={resetFilters}>Réinitialiser les filtres</button></div>
      </div>
      <div className="ot-view-row"><div className="catalog-view-switch" role="group" aria-label="Présentation du catalogue"><button type="button" className="secondary-button" aria-pressed={catalogView==='organized'&&!showDrafts} onClick={()=>requestUnsavedExit(()=>{closeDetailDirect();setShowDrafts(false);setCatalogView('organized');})}><OperationIcon name="layers"/>Vue organisée</button><button type="button" className="secondary-button" aria-pressed={catalogView==='table'&&!showDrafts} onClick={()=>requestUnsavedExit(()=>{closeDetailDirect();setShowDrafts(false);setCatalogView('table');})}><OperationIcon name="columns"/>Tableau d’administration</button>{persistent&&<button type="button" className="secondary-button" aria-pressed={showDrafts} onClick={()=>requestUnsavedExit(()=>{closeDetailDirect();setShowDrafts(true);})}><OperationIcon name="edit"/>Mes brouillons</button>}</div><p role="status">{loading?'Chargement…':`${filtered.length} résultats / ${items.length} articles`}{filters.family!=='all'&&` · ${filters.family}`}</p></div>
      {!loading&&<p className="ot-count-help">Publié et brouillon peuvent concerner le même article. Les compteurs portent sur tous les articles, indépendamment de la page affichée.</p>}
      </>}

      {space==='administration' && showCategoryInventory && (
        <CatalogCategoryInventory items={items}
          onChanged={refresh}
          onClose={() => requestUnsavedExit(() => setShowCategoryInventory(false))}
          onFilter={category => requestUnsavedExit(() => {
            setQuery(''); setTypeFilter('all'); setStatusFilter('all'); setCategoryFilter(category);
            setShowCategoryInventory(false);setSpace('catalog');setShowDrafts(false);setCatalogView('table');closeDetailDirect();
          })} />
      )}

      {space==='catalog'&&showDrafts&&!showForm&&<CatalogDrafts rows={draftRows} error={draftListError} busy={saving} onResume={row=>void resumeDraft(row)} onChangeState={(row,state)=>void changeDraftState(row,state)}/>}
      {space==='catalog' && showForm && (
        <form className="panel catalog-form ot-guided-create" onSubmit={(event) => void createItem(event)}>
          <div className="panel-title"><div><span className="eyebrow">Catalogue</span><h2>Créer un Service ou une Offre</h2><p className="muted">La première version est créée en brouillon. Tu la publies après vérification.</p></div></div>
          <nav className="ot-create-steps" aria-label="Etapes de creation">{CATALOG_EDITOR_TABS.filter(t=>catalogTabHasVersionFields(t.id)).map((tab,index)=><button type="button" key={tab.id} aria-current={creationStep===tab.id?'step':undefined} onClick={()=>setCreationStep(tab.id)}><span>{index+1}</span>{tab.label}</button>)}</nav>
          <p className="ot-editor-notice">{persistent?'Nom et type suffisent pour enregistrer. Les autres informations peuvent être complétées plus tard, sans publication automatique.':'Persistance minimale non activée sur cette base. Aucun changement de schéma automatique.'}</p>
          <fieldset disabled={saving}>
            {creationStep==='identity'&&<label className="catalog-category-create-choice">Catégorie du référentiel (facultatif)
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
            </label>}
            {creationStep==='identity'&&<p className="muted">Le référentiel établit un rattachement stable. Le libellé libre ci-dessous reste possible sans rattachement ; les deux sont facultatifs.</p>}
            {createCategoryLoadError && <p className="muted" role="status">Registre indisponible : {createCategoryLoadError}. La catégorie libre reste utilisable.</p>}
            <CatalogFields draft={draft} activeTab={creationStep} identityOnly={creationStep==='identity'} onChange={next => {
              if (createCategoryId && next.category !== draft.category) setCreateCategoryId('');
              setDraft(next);
            }} showIdentity={creationStep==='identity'} />
            {!persistent&&creationStep==='pricing'&&<label className="ot-price-confirm"><input type="checkbox" checked={creationPriceChosen} onChange={e=>setCreationPriceChosen(e.target.checked)}/>Je confirme avoir choisi le mode tarifaire affiché ; il sera enregistré dans le brouillon.</label>}
            {createCategoryId && <p className="muted">Catégorie stable sélectionnée : le service et son brouillon seront créés dans une seule transaction.</p>}
          </fieldset>
          {persistent&&similarCatalogDrafts(draftRows,draft.name,draft.type).length>0&&<section className="ot-editor-notice" aria-label="Brouillons similaires"><strong>Brouillons similaires — vérifier avant de créer une autre prestation</strong><p>Suggestions consultatives par proximité de nom, sans fusion ni interdiction de créer.</p>{similarCatalogDrafts(draftRows,draft.name,draft.type).map(row=><button type="button" className="secondary-button" key={row.version.id} onClick={()=>void resumeDraft(row)}>Reprendre {row.item.name} · v{row.version.versionNumber}</button>)}</section>}
          {formError && <p role="alert" className="form-error">{formError}</p>}{formError&&pendingCreation.current&&<button className="secondary-button" type="button" disabled={saving} onClick={()=>void recoverCreation()}>Retrouver l’enregistrement envoyé</button>}
          <div className="form-actions ot-editor-actionbar"><span>{persistent?'Sauvegarde manuelle · sans publication':creationPriceChosen?'Enregistrement manuel, sans publication':'Mode tarifaire à choisir avant enregistrement'}</span><button type="button" className="secondary-button" onClick={()=>createGuard.request(()=>setShowForm(false))}>Annuler</button><button className="secondary-button" type="submit" disabled={saving||!draft.name.trim()||(!persistent&&!creationPriceChosen)}>{saving?'Enregistrement…':'Enregistrer le brouillon'}</button><button type="button" className="primary-button" onClick={()=>{const tabs=CATALOG_EDITOR_TABS.filter(t=>catalogTabHasVersionFields(t.id));setCreationStep(tabs[Math.min(tabs.findIndex(t=>t.id===creationStep)+1,tabs.length-1)].id);}}>Continuer →</button></div>
        </form>
      )}

      {space==='catalog' && !showForm && !showDrafts && (loading ? <div className="panel"><p className="muted">Chargement du catalogue…</p></div> : (
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
              <CatalogFamiliesOverview items={filtered} formatPrice={formatPrice} onFamily={openFamily} onOpen={(id) => void openItem(id)} />
            ) : (
              <ConfiguredDataTable<CatalogItemSummary> scope={CATALOG_ADMIN_VIEW} catalogContext={{value:filters,onApply:context=>{setFilters(context);setTablePage(1);}}} pagination={{page:tablePage,pageSize:filters.pageSize,onPage:setTablePage,onSize:size=>changeFilter('pageSize',size)}} store={window.atoumweb.visualPreferences} rows={filtered} selectedId={selectedId} getId={item=>item.id} onSelect={item=>void openItem(item.id)} className="catalog-table" caption="Administration du catalogue · source complète · tri sur tous les résultats filtrés" columns={[
                {id:'category',label:'Catégorie',sortValue:item=>item.category||null,render:item=>item.category||'—'},
                {id:'identity',label:'Nom',required:true,sortValue:item=>item.name,render:item=><><strong>{item.name}</strong>{item.canonicalCode&&<small className="catalog-canonical-code">{item.canonicalCode}</small>}</>},
                {id:'type',label:'Type',sortValue:item=>item.type,render:item=><span className="status-pill">{item.currentVersion?.commercialKind?KIND_LABELS[item.currentVersion.commercialKind]:item.type==='offer'?'Offre':'Service'}</span>},
                {id:'price',label:'Prix AtoumWeb',sortValue:item=>item.currentVersion?.priceCents??null,render:item=>formatPrice(item)},
                {id:'recommendedPrice',label:'Prix conseillé',sortValue:item=>item.currentVersion?.recommendedPriceCents??null,render:item=>item.currentVersion?.recommendedPriceCents!=null?`${(item.currentVersion.recommendedPriceCents/100).toLocaleString('fr-FR')} €`:'—'},
                {id:'priceMode',label:'Mode',sortValue:item=>item.currentVersion?.priceMode?PRICE_LABELS[item.currentVersion.priceMode]:null,render:item=>item.currentVersion?.priceMode?PRICE_LABELS[item.currentVersion.priceMode]:'À compléter'},
                {id:'status',label:'Statut',sortValue:item=>STATUS_LABELS[item.status],render:item=><span className={`catalog-status catalog-${item.status}`}>{STATUS_LABELS[item.status]}</span>},
                {id:'public',label:'Site',sortValue:item=>item.visiblePublic?1:0,render:item=>item.visiblePublic?'Oui':'Non'},
                {id:'version',label:'Version de référence',sortValue:item=>item.currentVersion?.versionNumber??null,render:item=><>{item.currentVersion?`v${item.currentVersion.versionNumber} · ${VERSION_STATUS_LABELS[item.currentVersion.status]}`:'—'}{versionStatesOf(item).includes('draft')&&item.currentVersion?.status!=='draft'&&<small>Brouillon disponible</small>}</>},
                {id:'open',label:'Ouvrir',required:true,render:item=><button type="button" className="link-button" aria-label={'Ouvrir '+item.name} onClick={event=>{event.stopPropagation();void openItem(item.id);}}><OperationIcon name="record-open"/></button>},
              ]}/>

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
                <div className="catalog-detail-heading-actions">{persistent&&displayedVersion&&<button type="button" className="secondary-button" disabled={saving} onClick={()=>requestUnsavedExit(()=>{void window.atoumweb.catalog.duplicationPreview(detail.id,displayedVersion.id).then(setDuplication).catch(e=>onMessage(String(e)));})}><OperationIcon name="layers"/>Dupliquer cette version</button>}
                  <button className="catalog-detail-expand" type="button" aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}><OperationIcon name={detailExpanded?'record-reduce':'record-expand'}/></button>
                  <button className="close-detail" type="button" aria-label="Fermer la fiche catalogue" onClick={closeDetail}><OperationIcon name="close"/></button>
                </div>
              </div>
              <div className="ot-version-context"><div className="detail-badges"><span className={`catalog-status catalog-${detail.status}`}>{STATUS_LABELS[detail.status]}</span><span className="status-pill">{detail.visiblePublic?'Visible site':'Interne'}</span><span className="status-pill">{detail.type==='offer'?'Offre':'Service'}</span></div><label>Version consultée<select aria-label="Version principale de la fiche" value={displayedVersion?.id??''} disabled={saving} onChange={e=>{const id=e.target.value;requestUnsavedExit(()=>{setConsultedVersionId(id);setVersionMode(false);setEditingDraftVersion(null);setPublicationCandidate(null);});}}>{detail.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber} · {v.abandonedAt?'Abandonné':VERSION_STATUS_LABELS[v.status]}{v.id===detail.currentVersion?.id?' · Référence':''}</option>)}</select></label></div>
              <p className="ot-version-help">Consultation des champs de la version sélectionnée. Les Associations, Contrat & CGV et Production gardent leurs contextes et sauvegardes propres. La modification reprend le brouillon existant, s'il y en a un.</p>
              <div className="catalog-editor-tabs" role="tablist" aria-label="Éditeur des offres et services">
                {CATALOG_EDITOR_TABS.map(tab=><button type="button" key={tab.id} role="tab"
                  id={`catalog-tab-${tab.id}`} aria-selected={activeTab===tab.id}
                  aria-controls={`catalog-panel-${tab.id}`} title={tab.hint}
                  tabIndex={activeTab===tab.id?0:-1}
                  onClick={()=>selectEditorTab(tab.id)}
                  onKeyDown={event=>{
                    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
                    event.preventDefault();
                    const index=CATALOG_EDITOR_TABS.findIndex(value=>value.id===activeTab);
                    const next=event.key==='Home'?0:event.key==='End'?CATALOG_EDITOR_TABS.length-1:
                      (index+(event.key==='ArrowRight'?1:-1)+CATALOG_EDITOR_TABS.length)%CATALOG_EDITOR_TABS.length;
                    selectEditorTab(CATALOG_EDITOR_TABS[next].id,true);
                  }}><OperationIcon name={({identity:'package',pricing:'euro',scope:'file-text',associations:'layers',sales:'users',contracts:'file-check',production:'wrench',history:'clock'} satisfies Record<CatalogEditorTab,OperationIconName>)[tab.id]}/>{tab.label}</button>)}
              </div>
              <div role="tabpanel" id={`catalog-panel-${activeTab}`} aria-labelledby={`catalog-tab-${activeTab}`} className={`catalog-editor-tab-panel ${activeTab==='identity'?'ot-identity-layout':''}`}>
              {activeTab==='identity' && <section className="catalog-detail-section catalog-identity-section">
                <strong>Identité de la prestation</strong>
                <div className="ot-identity-overview"><span className="ot-title-icon"><OperationIcon name="package"/></span><div><h3>{detail.name}</h3><p>{detail.category||'Sans catégorie'} · {detail.type==='offer'?'Offre':'Service'}</p></div></div>
                <Summary label="Code canonique" value={detail.canonicalCode || 'Non attribué'} />
                {detail.identityProvenance && <Summary label="Source de l’attribution" value={detail.identityProvenance.reference} />}
                {!detail.canonicalCode && <div className="catalog-code-assignment"><label>Code AW à attribuer<input value={canonicalCodeDraft} placeholder="AW-WEB-VITRINE" onChange={(e) => setCanonicalCodeDraft(e.target.value)} /></label><button className="secondary-button" type="button" disabled={saving || !canonicalCodeDraft.trim()} onClick={() => void assignCode()}>Attribuer ce code</button></div>}
                <p className="muted">Le code attribué est durable. Les anciens éléments peuvent rester sans code jusqu’à leur rapprochement explicite.</p>
              </section>}

              {activeTab==='scope' && displayedVersion && (!displayedVersion.nature || !displayedVersion.description || (displayedVersion.inclusions?.length ?? 0) === 0) && (
                <div className="catalog-completeness">
                  <div><strong>Fiche à compléter</strong><span>Nature, description et contenu inclus permettent de comprendre immédiatement ce qui est réellement vendu.</span></div>
                  <button className="secondary-button" type="button" disabled={versionMode || saving} onClick={()=>prepareNewVersion()}>Compléter la fiche</button>
                </div>
              )}

              {displayedVersion && ['identity','pricing','scope','sales','contracts'].includes(activeTab) ? (
                <div className="catalog-current-version">
                  {(activeTab==='identity'||activeTab==='scope') && <section className="catalog-detail-section catalog-detail-overview">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Prestation</span><strong>Ce qui est réellement vendu</strong></div>
                    <h3>{displayedVersion.nature || 'Nature de la prestation à renseigner'}</h3>
                    <p>{displayedVersion.description || 'Description à compléter pour expliquer clairement le résultat attendu au client.'}</p>
                  </section>}

                  {(activeTab==='pricing'||activeTab==='identity') && <section className="catalog-detail-section">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Repères</span><strong>Tarification, délai et cadre</strong></div>
                    <div className="catalog-summary-grid">
                      <Summary label="Tarif de cette version" value={formatPrice({...detail,currentVersion:displayedVersion})} />
                      <Summary label="Nature commerciale" value={displayedVersion.commercialKind ? KIND_LABELS[displayedVersion.commercialKind] : 'Non renseignée'} />
                      <Summary label="Famille canonique" value={displayedVersion.familyCode || 'Non renseignée'} />
                      <Summary label="Libellé Abby" value={displayedVersion.abbyLabel || 'Non renseigné'} />
                      <Summary label="Unité" value={displayedVersion.unit || 'Non renseignée'} />
                      <Summary label="Périodicité" value={displayedVersion.periodicity || 'Non renseignée'} />
                      {displayedVersion.provenance && <Summary label="Source" value={[displayedVersion.provenance.reference, displayedVersion.provenance.recordKey, displayedVersion.provenance.sha256].filter(Boolean).join(' · ')} />}
                      <Summary label="Prix conseillé" value={displayedVersion.recommendedPriceCents != null ? `${(displayedVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'} />
                      <Summary label="Acompte par défaut" value={displayedVersion.defaultDepositPercent != null ? `${displayedVersion.defaultDepositPercent} %` : '—'} />
                      <Summary label="Durée estimée" value={displayedVersion.estimatedMinutes != null ? `${displayedVersion.estimatedMinutes} min` : '—'} />
                      <Summary label="Délai recommandé" value={displayedVersion.recommendedDelayDays != null ? `${displayedVersion.recommendedDelayDays} jours` : '—'} />
                      <Summary label="Ancien libellé contractuel (legacy)" value={displayedVersion.contractType || '—'} />
                      <Summary label={displayedVersion.publishedAt ? 'Publiée le' : 'Créée le'} value={formatCatalogDate(displayedVersion.publishedAt ?? displayedVersion.createdAt)} />
                    </div>
                  </section>}

                  {(activeTab==='identity'||activeTab==='scope') && <section className="catalog-detail-section">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Périmètre</span><strong>Inclus, exclusions et prérequis</strong></div>
                    <ListSummary label="Inclus" values={displayedVersion.inclusions ?? []} />
                    <ListSummary label="Exclusions" values={displayedVersion.exclusions ?? []} />
                    <ListSummary label="Prérequis" values={displayedVersion.prerequisites ?? []} />
                  </section>}

                  {(activeTab==='contracts') && <section className="catalog-detail-section">
                    <div className="catalog-detail-section-heading"><span className="eyebrow">Conditions</span><strong>Cadre commercial</strong></div>
                    <Summary label="Conditions commerciales" value={displayedVersion.specialTerms || 'Non renseignées'} />
                  </section>}

                  {activeTab==='sales' && <CommercialParametersSummary parameters={displayedVersion.commercialParameters} />}
                  {activeTab==='sales' && !Object.values(displayedVersion.commercialParameters ?? {}).some(Boolean) && !displayedVersion.internalAdvice &&
                    <p className="muted">Aucune aide à la vente configurée pour cette version. Les bénéfices, besoins et conseils restent à renseigner dans un brouillon.</p>}

                  {activeTab==='sales' && displayedVersion.internalAdvice && <div className="catalog-internal-note"><strong>Conseil interne AtoumWeb</strong><p>{displayedVersion.internalAdvice}</p></div>}
                </div>
              ) : !displayedVersion ? <p className="muted">Aucune version.</p> : null}

              {activeTab==='identity' && <div className="catalog-detail-actions"><button className="secondary-button" type="button" disabled={versionMode || saving} onClick={() => void toggleVisibility()}>{detail.visiblePublic ? 'Masquer du site' : 'Rendre visible site'}</button><select aria-label="Statut de la prestation" value={pendingItemStatus ?? detail.status} disabled={versionMode || saving} onChange={(e) => setPendingItemStatus(e.target.value as CatalogItemStatus)}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select><button className="primary-button" type="button" disabled={!detail.currentVersion || versionMode || saving} onClick={()=>prepareNewVersion()}>{detail.versions.some(v => v.status === 'draft'&&!v.abandonedAt) ? 'Reprendre le brouillon' : 'Modifier via une nouvelle version'}</button></div>}

              {activeTab==='identity' && pendingItemStatus && pendingItemStatus!==detail.status && <div className="catalog-status-confirmation" role="group" aria-label="Confirmer le statut">
                <p>Passer la prestation à « {STATUS_LABELS[pendingItemStatus]} » ? Cette modification ne supprime ni les versions ni les Devis historiques.</p>
                <button type="button" className="secondary-button" onClick={()=>setPendingItemStatus(null)}>Annuler le changement</button>
                <button type="button" className="primary-button" disabled={saving||versionMode} onClick={()=>void updateStatus(pendingItemStatus)}>
                  Confirmer le statut
                </button>
              </div>}
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
                {conflictVersion&&(()=>{try{return <CatalogConflictResolver key={conflictVersion.id+':'+conflictVersion.saveRevision} remote={conflictVersion} local={buildVersion(versionDraft)} onResolve={payload=>{const next=draftFromVersion({...conflictVersion,...payload},detail);versionGuard.initial(draftFromVersion(conflictVersion,detail));setVersionDraft(next);setEditingDraftVersion(conflictVersion);setConflictVersion(null);setVersionFormError(null);}}/>;}catch{return <p role="alert">Saisie conservée. Corrigez les valeurs invalides avant de comparer le conflit.</p>;}})()}
                {versionFormError && <p className="form-error" role="alert">{versionFormError} — la saisie locale est conservée.</p>}
                <div className="inline-editor-actions ot-editor-actionbar">
                  <span>Sauvegarde manuelle du brouillon uniquement</span><button className="secondary-button" type="button" onClick={() => versionGuard.request(()=>{setVersionMode(false);setEditingDraftVersion(null);setVersionFormError(null);})}>Annuler</button>
                  <button className="primary-button" disabled={saving} type="submit">{saving?'Enregistrement…':editingDraftVersion?'Enregistrer le brouillon':`Créer v${(detail.versions[0]?.versionNumber ?? 0) + 1}`}</button>
                </div>
              </form>}

              {activeTab==='associations' && detail.type === 'offer' && offerCompositionVersion && (
                <section className="offer-composition">
                  <div className="offer-composition-heading"><div><span className="eyebrow">Composition</span><strong>Services de l’Offre · v{offerCompositionVersion.versionNumber}</strong></div><span className="status-pill">{VERSION_STATUS_LABELS[offerCompositionVersion.status]}</span></div>
                  {offerComponents.map((component) => <div className="offer-component-row" key={component.id}><div><strong>{component.serviceName}</strong><span>v{component.serviceVersionNumber} · {(component.quantityMilli / 1000).toLocaleString('fr-FR')} × · {component.isOptional ? 'Optionnel' : 'Inclus'}</span></div>{offerCompositionEditable && <button className="close-detail" type="button" onClick={() => void removeOfferComponent(component.id)} aria-label="Retirer" title="Retirer"><OperationIcon name="close"/></button>}</div>)}
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
              {activeTab==='associations' && <CatalogRecommendationsPanel key={detail.id} item={detail} items={items} locked={versionMode || saving} />}
              {activeTab==='history' && comparisonVersionId && detail.versions.some(version=>version.id===comparisonVersionId) && (() => {
                const chosen=detail.versions.find(version=>version.id===comparisonVersionId)!;
                const reference=detail.currentVersion?.id===chosen.id
                  ? detail.versions.find(version=>version.id!==chosen.id && version.status==='published') ?? null
                  : detail.currentVersion;
                const differences=compareCatalogVersions(reference,chosen);
                const advice=compareCatalogSalesAdvice(reference ?? null,chosen);
                return <section className="catalog-detail-section" aria-label="Comparer les versions du Catalogue">
                  <strong>Comparaison enregistrée — v{chosen.versionNumber} / {reference?'v'+reference.versionNumber:'aucune référence'}</strong>
                  <p className="muted">Lecture seule des versions stockées. Ne modifie ni Devis, ni CGV, ni publication.</p>
                  <button type="button" className="secondary-button" onClick={()=>setComparisonVersionId(null)}>Fermer la comparaison</button>
                  <table className="catalog-version-diff-table"><thead><tr><th>Champ</th><th>Référence</th><th>Version sélectionnée</th></tr></thead>
                    <tbody>{differences.map(row=><tr key={row.field}><th scope="row">{row.label}</th><td>{row.previous}</td><td>{row.proposed}</td></tr>)}</tbody></table>
                  {differences.length===0&&<p>Aucune différence commerciale constatée.</p>}
                  <h4>Aides à la vente</h4>
                  {advice.length===0?<p>Aucune différence des aides.</p>:
                    <table className="catalog-version-diff-table"><thead><tr><th>Champ</th><th>Référence</th><th>Version sélectionnée</th></tr></thead>
                      <tbody>{advice.map(row=><tr key={row.field}><th scope="row">{row.label}</th><td>{row.previous}</td><td>{row.proposed}</td></tr>)}</tbody></table>}
                </section>;
              })()}
              {activeTab==='history' && <div className="catalog-versions"><strong>Historique des versions</strong>{detail.versions.map((version) => <div className="catalog-version-row" key={version.id}><div><strong>v{version.versionNumber}{version.abandonedAt?' · Abandonné':''}</strong><span>{VERSION_STATUS_LABELS[version.status]}</span><small>{version.priceMode?PRICE_LABELS[version.priceMode]:'À compléter'} · {version.priceCents != null ? `${(version.priceCents / 100).toLocaleString('fr-FR')} €` : '—'} · {version.publishedAt ? `publiée le ${formatCatalogDate(version.publishedAt)}` : `créée le ${formatCatalogDate(version.createdAt)}`}</small>{version.status === 'draft' && version.provenance && <details className="catalog-import-draft"><summary>Consulter le brouillon importé</summary><p>Cette version n’est pas publiée. Sa consultation ne change pas la version commerciale en cours.</p><p>{version.nature}</p><p>{version.description}</p><Summary label="Code canonique" value={detail.canonicalCode || 'Non attribué'} /><Summary label="Unité / périodicité" value={[version.unit, version.periodicity].filter(Boolean).join(' / ')} /><ListSummary label="Inclus" values={version.inclusions ?? []} /><ListSummary label="Exclusions" values={version.exclusions ?? []} /><ListSummary label="Prérequis" values={version.prerequisites ?? []} /><CommercialParametersSummary parameters={version.commercialParameters} /><Summary label="Source" value={[version.provenance.reference, version.provenance.recordKey, version.provenance.sha256].filter(Boolean).join(' · ')} /></details>}</div><div className="inline-editor-actions">
                <button type="button" className="secondary-button compact-button" disabled={saving}
                  onClick={()=>setComparisonVersionId(version.id)}>Comparer</button>
                <button type="button" className="secondary-button compact-button" disabled={saving||versionMode}
                  onClick={()=>{if(prepareNewVersion(version))setActiveTab('sales');}}>Reprendre dans un brouillon</button>
                </div>{version.status === 'draft' && !version.abandonedAt && <button className="primary-button compact-button" type="button" disabled={versionMode || saving} title={versionMode ? 'Enregistrer ou annuler le brouillon avant publication.' : 'Préparer une confirmation distincte, sans publier le site WordPress.'} onClick={() => setPublicationCandidate(structuredClone(version))}>Préparer la publication</button>}</div>)}</div>}
              </div>
            </aside>
          )}
        </div>
      ))}
    </div>
  );
}

function CommercialParametersSummary({ parameters }: { parameters?: CatalogCommercialParameters | null }) {
  if (!parameters) return null;
  const labels: Record<keyof CatalogCommercialParameters, string> = {
    clientNeed: 'Besoin client', benefits: 'Bénéfices client', salesPitch: 'Argumentaire commercial', qualificationQuestions: 'Questions de qualification', objections: 'Objections et réponses', relevantSituations: 'Situations pertinentes', commercialCautions: 'Vigilances commerciales', keywords: 'Mots-clés métier', work: 'Travail prévu', options: 'Options / compléments',
    quoteRequiredWhen: 'Cas nécessitant un devis', deliverables: 'Livrables', deliveryTerms: 'Modalités / délai',
    reviewTerms: 'Corrections / recette', correctiveWarranty: 'Garantie corrective prévue',
    thirdPartyCosts: 'Coûts tiers', sourcePriceLabel: 'Règle tarifaire de source',
  };
  return <section className="catalog-detail-section catalog-commercial-parameters"><strong>Paramètres commerciaux du catalogue</strong>{Object.entries(labels).map(([key, label]) => parameters[key as keyof CatalogCommercialParameters] ? <Summary key={key} label={label} value={parameters[key as keyof CatalogCommercialParameters]!} /> : null)}</section>;
}

function CatalogFields({ draft, onChange, showIdentity = false, activeTab, identityOnly=false }: { draft: CatalogDraft; onChange: (draft: CatalogDraft) => void; showIdentity?: boolean; activeTab?: CatalogEditorTab; identityOnly?:boolean }) {
  const visible = (...tabs:CatalogEditorTab[]) => !identityOnly&&(!activeTab || tabs.includes(activeTab));
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
            <span className="field-label-with-help">Libellé de catégorie <FieldHelp text="Libellé historique libre. Choisir une catégorie du référentiel ci-dessus le remplit et établit un lien stable. Modifier ce libellé retire ce lien sans renommer une catégorie du référentiel." /></span>
            <input value={draft.category} onChange={(e) => onChange({ ...draft, category: e.target.value })} placeholder="Ex. Contenu" />
          </label>
        </div>
        <details className="ot-optional-identity"><summary>Repères facultatifs : code et visibilité</summary><label>Code canonique AW (facultatif)<input value={draft.canonicalCode} onChange={e=>onChange({...draft,canonicalCode:e.target.value})} placeholder="AW-WEB-VITRINE"/></label><label className="catalog-public-check"><input type="checkbox" checked={draft.visiblePublic} onChange={e=>onChange({...draft,visiblePublic:e.target.checked})}/>Visible sur le site public</label></details>
      </section>}

      {visible('identity','pricing','scope') && <section className="catalog-field-group">
        <div className="catalog-field-group-heading"><strong>Fiche versionnée</strong><span>Champs modifiables de cette version uniquement.</span></div>
        {visible('identity','pricing') && <div className="catalog-fields-grid">

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
            <select disabled={draft.priceBasis === 'actual_cost'} value={draft.priceMode??''} onChange={(e) => onChange({ ...draft, priceMode: e.target.value?(e.target.value as PriceMode):null })}><option value="">À compléter — aucun mode choisi</option>{PRICE_MODES.map((mode) => <option key={mode} value={mode}>{PRICE_LABELS[mode]}</option>)}</select>
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
            <span className="field-label-with-help">Argumentaire commercial <FieldHelp text="Présentation commerciale proposée, préparée en interne. Jamais insérée automatiquement dans un devis ni dans les CGV." /></span>
            <textarea value={draft.commercialParameters.salesPitch ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, salesPitch: e.target.value },
            })} placeholder="Ex. partir du besoin et expliquer le bénéfice concret de la prestation." />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Questions de qualification <FieldHelp text="Questions à poser au prospect avant de recommander la prestation." /></span>
            <textarea value={draft.commercialParameters.qualificationQuestions ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, qualificationQuestions: e.target.value },
            })} placeholder={"Quel est votre objectif ?\nQuel contenu possédez-vous déjà ?"} />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Situations pertinentes <FieldHelp text="Quand proposer cette prestation, et dans quelles conditions elle n'est pas adaptée. Notes humaines internes." /></span>
            <textarea value={draft.commercialParameters.relevantSituations ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, relevantSituations: e.target.value },
            })} placeholder="Ex. l'entreprise souhaite présenter ses activités avec des contenus déjà disponibles." />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Vigilances commerciales <FieldHelp text="Limites, dépendances ou promesses à éviter ; ces notes ne deviennent jamais des clauses CGV automatiquement." /></span>
            <textarea value={draft.commercialParameters.commercialCautions ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, commercialCautions: e.target.value },
            })} placeholder="Ex. ne pas promettre une première position sur Google." />
          </label>
          <label className="catalog-wide">
            <span className="field-label-with-help">Objections et réponses <FieldHelp text="Réponses préparées aux objections fréquentes, à valider humainement. Sans modifier automatiquement les clauses CGV." /></span>
            <textarea value={draft.commercialParameters.objections ?? ''} onChange={e => onChange({
              ...draft, commercialParameters: { ...draft.commercialParameters, objections: e.target.value },
            })} placeholder="Ex. Budget : expliquer le périmètre, puis proposer un devis adapté." />
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

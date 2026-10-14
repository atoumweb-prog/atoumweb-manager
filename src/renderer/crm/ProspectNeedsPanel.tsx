import {useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItemSummary, CatalogVersion, PriceMode } from '../../shared/commercial';
import { prospectProjectBriefSnapshot, type ProspectProjectBrief, type ProspectSummary } from '../../shared/crm';
import type { Need, NeedInput } from '../../shared/workflow';
import {
  parseProspectInformation,
  patchProspectInformation,
  serializeProspectInformation,
  type ProspectInformationItem,
  type ProspectInformationStatus,
} from '../../shared/prospectInformation';
import {CommercialScope} from '../commercial/CommercialScope';
import {catalogueFamilyLabel,catalogueIsOffer} from '../commercial/catalogDisplay';
import { catalogMatchesQuery, catalogIsSelectable } from '../../shared/catalogDiscovery';
import { resolveProspectCatalogRecommendations } from '../../shared/catalogProspectRecommendations';


const BUDGET_PRESETS = [
  ['not_disclosed', 'Non communiqué'],
  ['under_500', 'Moins de 500 €'],
  ['500_1000', '500–1 000 €'],
  ['1000_2000', '1 000–2 000 €'],
  ['2000_5000', '2 000–5 000 €'],
  ['5000_10000', '5 000–10 000 €'],
  ['10000_plus', '10 000 € et +'],
  ['custom', 'Fourchette personnalisée'],
  ['exact', 'Montant précis'],
] as const;

const SUGGESTIONS: Record<string, string[]> = {
  'atoumweb-vitrine': ['atoumweb-wordpress', 'atoumweb-seo', 'atoumweb-contenu', 'atoumweb-identite', 'atoumweb-photos'],
  'atoumweb-landing': ['atoumweb-seo', 'atoumweb-contenu', 'atoumweb-identite'],
  'atoumweb-ecommerce': ['atoumweb-woocommerce', 'atoumweb-seo', 'atoumweb-images', 'atoumweb-livraison', 'atoumweb-paiement'],
  'atoumweb-applications': ['atoumweb-dev', 'atoumweb-support'],
};

type BudgetPreset = (typeof BUDGET_PRESETS)[number][0];

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['\"][^'\"]+['\"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

function sortedCategories(items:CatalogItemSummary[]){return [...new Set(items.map(catalogueFamilyLabel))].sort((a,b)=>a.localeCompare(b,'fr'));}
function KindTabs({kind,onChange}:{kind:'offers'|'services';onChange:(kind:'offers'|'services')=>void}){return <div className="prospect-desk-tabs" role="tablist" aria-label="Type de prestation"><button type="button" role="tab" aria-selected={kind==='offers'} className={kind==='offers'?'active':''} onClick={()=>onChange('offers')}>Offres</button><button type="button" role="tab" aria-selected={kind==='services'} className={kind==='services'?'active':''} onClick={()=>onChange('services')}>Services et compléments</button></div>;}

export function NeedDraftSelector({ value, onChange }: { value: NeedInput[]; onChange: (next: NeedInput[]) => void }) {
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [catalogLoadError,setCatalogLoadError]=useState('');
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [catalogReloadKey,setCatalogReloadKey]=useState(0);
  const [category, setCategory] = useState('Web');
  const [selectedId, setSelectedId] = useState('');
  const [otherText, setOtherText] = useState('');
  const [kind,setKind]=useState<'offers'|'services'>('offers');
  const [catalogQuery,setCatalogQuery]=useState('');
  const [managedRecommendations,setManagedRecommendations]=useState<{sourceKey:string;versionIds:string[];status:'loading'|'ready'|'error'}>({sourceKey:'',versionIds:[],status:'ready'});
  const choiceGuard=useUnsavedDraft('Prestation à ajouter',{selectedId,otherText},{discard:s=>{setSelectedId(s.selectedId);setOtherText(s.otherText);}});

  const availableByKind=catalog.filter(item=>catalogueIsOffer(item)===(kind==='offers'));
  const categories=sortedCategories(availableByKind);
  const selectedCategory=categories.includes(category)?category:categories[0]??'';
  const choices=availableByKind.filter(item=>(catalogQuery.trim() ? catalogMatchesQuery(item,catalogQuery) : catalogueFamilyLabel(item)===selectedCategory)).sort((a,b)=>a.name.localeCompare(b.name,'fr'));

  useEffect(()=>{
    let active=true;
    setCatalogLoading(true);setCatalogLoadError('');setCatalog([]);
    void window.atoumweb.catalog.list({status:'active'}).then(items=>{
      if(!active)return;
      setCatalog(items.filter(catalogIsSelectable));
      setCatalogLoading(false);
    }).catch(err=>{
      if(!active)return;
      setCatalogLoadError(err instanceof Error?err.message:'Catalogue indisponible.');
      setCatalogLoading(false);
    });
    return()=>{active=false;};
  },[catalogReloadKey]);

  function add() {
    if (selectedId === 'other') {
      if (!otherText.trim()) return;
      onChange([...value, { catalogItemId: null, otherText: otherText.trim() }]);
      setOtherText('');
      return;
    }
    if (!selectedId || value.some((item) => item.catalogItemId === selectedId)) return;
    onChange([...value, { catalogItemId: selectedId, otherText: '' }]);
    setSelectedId('');
  }

  const selectedItems = value.map((need) => need.catalogItemId ? catalog.find((item) => item.id === need.catalogItemId) : null);
  const recommendationSourceIds = [...new Set(selectedItems.filter((item):item is CatalogItemSummary => Boolean(
    item?.currentVersion?.status === 'published',
  )).map(item=>item.currentVersion!.id))].sort().join('|');
  // E106: prefer published, managed recommendations. Legacy suggestions remain a
  // temporary fallback for historic fixtures that have no administered links.
  useEffect(()=>{
    let live=true;
    setManagedRecommendations({sourceKey:recommendationSourceIds,versionIds:[],status:recommendationSourceIds?'loading':'ready'});
    if(!recommendationSourceIds)return;
    void Promise.all(recommendationSourceIds.split('|').map(id=>
      window.atoumweb.catalog.listRecommendations(id),
    )).then(groups=>{
      if(live)setManagedRecommendations({sourceKey:recommendationSourceIds,versionIds:[...new Set(groups.flatMap(links=>links.map(link=>link.targetVersionId)))],status:'ready'});
    }).catch(()=>{if(live)setManagedRecommendations({sourceKey:recommendationSourceIds,versionIds:[],status:'error'});});
    return()=>{live=false;};
  },[recommendationSourceIds]);
  const legacySuggestionIds = Array.from(new Set(selectedItems.flatMap((item) => item ? (SUGGESTIONS[item.id] ?? []) : [])));
  const recommendationsReady=managedRecommendations.sourceKey===recommendationSourceIds&&managedRecommendations.status==='ready';
  const recommendationsFailed=managedRecommendations.sourceKey===recommendationSourceIds&&managedRecommendations.status==='error';
  const administeredIds=recommendationsReady?managedRecommendations.versionIds:[];
  const suggestions=recommendationsReady?resolveProspectCatalogRecommendations(
    catalog,
    value.flatMap(need=>need.catalogItemId?[need.catalogItemId]:[]),
    administeredIds,
    legacySuggestionIds,
  ):[];
  const legacyFallback=administeredIds.length===0 && suggestions.length>0;

  return <div className="need-selector-v2 form-span-3">
    <div className="need-selector-title"><strong>Besoins / Offres / Services</strong><small>Catégorie ou recherche par besoin, bénéfice ou mot-clé publié.</small></div>
    {catalogLoading&&<p role="status">Chargement des prestations publiées…</p>}
    {catalogLoadError&&<div role="alert"><span>Catalogue indisponible : {catalogLoadError}. Aucun service n'est proposé tant que la lecture n'a pas réussi.</span><button type="button" onClick={()=>setCatalogReloadKey(key=>key+1)}>Réessayer</button></div>}
    <label>Rechercher une prestation par besoin<input aria-label="Rechercher une prestation par besoin" value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)} placeholder="visibilité Google, SEO local…" /></label>
    {value.length > 0 && <div className="need-chip-list">{value.map((need, index) => {
      const item = need.catalogItemId ? catalog.find((candidate) => candidate.id === need.catalogItemId) : null;
      return <span className="need-chip" key={`${need.catalogItemId ?? 'other'}-${index}`}>{item ? `${item.type === 'offer' ? 'Offre' : 'Service'} · ${item.name}` : `Autre · ${need.otherText}`}<button type="button" aria-label="Retirer" onClick={() => onChange(value.filter((_, i) => i !== index))}>×</button></span>;
    })}</div>}
    <KindTabs kind={kind} onChange={k=>choiceGuard.request(()=>{setKind(k);setCategory('');setSelectedId('');})}/><div className="need-add-row">
      <label>Catégorie<select value={selectedCategory} onChange={(e) => { choiceGuard.request(()=>{setCategory(e.target.value);setSelectedId('');}); }}>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>Prestation<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Choisir…</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.type === 'offer' ? 'Offre' : 'Service'} · {item.name}</option>)}<option value="other">Autre besoin</option></select></label>
      {selectedId === 'other' && <label>Préciser<input value={otherText} onChange={(e) => setOtherText(e.target.value)} /></label>}
      <button type="button" className="secondary-button" onClick={add} disabled={!selectedId || (selectedId === 'other' && !otherText.trim())}>Ajouter</button>
    </div>
    {recommendationsFailed&&<p role="alert">Impossible de charger les recommandations administrées. Aucune suggestion n'est proposée tant que leur disponibilité n'est pas confirmée.</p>}
    {recommendationSourceIds&&!recommendationsReady&&!recommendationsFailed&&<p role="status">Chargement des recommandations…</p>}
    {suggestions.length > 0 && <div className="need-suggestions"><span>{legacyFallback?'Suggestions historiques à vérifier :':'Services complémentaires suggérés :'}</span>{suggestions.map((item) => <button type="button" key={item.id} onClick={() => onChange([...value, { catalogItemId: item.id, otherText: '' }])}>+ {item.name}</button>)}</div>}
  </div>;
}

function priceLabel(version?: CatalogVersion | null): string {
  if (!version) return 'Tarif à préciser';
  if (version.priceMode === 'quote_only') return 'Sur devis';
  if (version.priceMode === 'free') return 'Gratuit';
  if (version.priceCents == null) return 'Tarif à préciser';
  const amount = `${(version.priceCents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
  const prefixes: Partial<Record<PriceMode, string>> = {
    starting_from: 'À partir de ', hourly: '', monthly: '', yearly: '', fixed: '',
  };
  const suffixes: Partial<Record<PriceMode, string>> = { hourly: ' / h', monthly: ' / mois', yearly: ' / an' };
  return `${prefixes[version.priceMode] ?? ''}${amount}${suffixes[version.priceMode] ?? ''}`;
}

function centsFromEuros(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function deriveBudgetPreset(prospect: ProspectSummary | null): BudgetPreset {
  if (!prospect || prospect.budgetStatus === 'not_disclosed' || (!prospect.budgetStatus && prospect.budgetMinCents == null && prospect.budgetMaxCents == null)) return 'not_disclosed';
  if (prospect.budgetStatus === 'known' && prospect.budgetMinCents != null && prospect.budgetMinCents === prospect.budgetMaxCents) return 'exact';
  const min = prospect.budgetMinCents;
  const max = prospect.budgetMaxCents;
  if (min === 0 && max === 49999) return 'under_500';
  if (min === 50000 && max === 100000) return '500_1000';
  if (min === 100000 && max === 200000) return '1000_2000';
  if (min === 200000 && max === 500000) return '2000_5000';
  if (min === 500000 && max === 1000000) return '5000_10000';
  if (min === 1000000 && max == null) return '10000_plus';
  return 'custom';
}

function budgetValues(preset: BudgetPreset, customMin: string, customMax: string, exact: string): { status: ProspectSummary['budgetStatus']; min: number | null; max: number | null } {
  switch (preset) {
    case 'not_disclosed': return { status: 'not_disclosed', min: null, max: null };
    case 'under_500': return { status: 'range', min: 0, max: 49999 };
    case '500_1000': return { status: 'range', min: 50000, max: 100000 };
    case '1000_2000': return { status: 'range', min: 100000, max: 200000 };
    case '2000_5000': return { status: 'range', min: 200000, max: 500000 };
    case '5000_10000': return { status: 'range', min: 500000, max: 1000000 };
    case '10000_plus': return { status: 'range', min: 1000000, max: null };
    case 'exact': {
      const amount = centsFromEuros(exact);
      return { status: 'known', min: amount, max: amount };
    }
    case 'custom':
    default: return { status: 'range', min: centsFromEuros(customMin), max: centsFromEuros(customMax) };
  }
}

function newInformationId(): string {
  return `info-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProspectNeedsPanel({ prospectId, onChanged }: { prospectId: string; onChanged?: () => void }) {
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [prospect, setProspect] = useState<ProspectSummary | null>(null);
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [otherText, setOtherText] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [projectSummary, setProjectSummary] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [budgetPreset, setBudgetPreset] = useState<BudgetPreset>('not_disclosed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetExact, setBudgetExact] = useState('');
  const [timelineStatus, setTimelineStatus] = useState<NonNullable<ProspectSummary['timelineStatus']>>('not_disclosed');
  const [targetDate, setTargetDate] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [existingStatus, setExistingStatus] = useState<NonNullable<ProspectSummary['existingStatus']>>('unknown');
  const [existingUrl, setExistingUrl] = useState('');
  const [existingNotes, setExistingNotes] = useState('');
  const [informationItems, setInformationItems] = useState<ProspectInformationItem[]>([]);
  const informationItemsRef = useRef<ProspectInformationItem[]>([]);
  const [newInformation, setNewInformation] = useState('');
  const [newInformationBlocking, setNewInformationBlocking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savingInformation, setSavingInformation] = useState(0);
  const [informationConflict, setInformationConflict] = useState(false);
  const [projectBriefConflict, setProjectBriefConflict] = useState(false);
  const projectBriefConflictRef = useRef(false);
  const savedProjectBriefRef = useRef<{ prospectId: string; value: ProspectProjectBrief } | null>(null);
  const savingProjectBriefRef = useRef(false);
  const informationConflictRef = useRef(false);
  // Revision portant exclusivement sur missing_information : une modification
  // du budget ou du calendrier dans une autre fenêtre n'est pas un conflit de checklist.
  const savedInformationRef = useRef<{ prospectId: string; value: string | null }>({
    prospectId, value: null,
  });
  const pendingInformation = useRef<Promise<void>>(Promise.resolve());
  const activeInformationWrites = useRef(0);
  const setInformationDraft = (next: ProspectInformationItem[]) => {
    informationItemsRef.current = next;
    setInformationItems(next);
  };
  const reloadSequence = useRef(0);
  const currentProspectId = useRef(prospectId);
  currentProspectId.current = prospectId;

  const [kind,setKind]=useState<'offers'|'services'>('offers');
  const [catalogQuery,setCatalogQuery]=useState('');
  const choiceGuard=useUnsavedDraft('Prestation envisagée',{selectedId,otherText},{pending:busy,discard:s=>{setSelectedId(s.selectedId);setOtherText(s.otherText);}});
  const infoValue={projectSummary,projectContext,budgetPreset,budgetMin,budgetMax,budgetExact,timelineStatus,targetDate,timelineNote,existingStatus,existingUrl,existingNotes,informationItems,newInformation,newInformationBlocking};
  const savedFormBaselineRef = useRef<typeof infoValue | null>(null);
  const infoGuard=useUnsavedDraft('Identification du besoin',infoValue,{pending:busy || savingInformation > 0,discard:s=>{setProjectSummary(s.projectSummary);setProjectContext(s.projectContext);setBudgetPreset(s.budgetPreset);setBudgetMin(s.budgetMin);setBudgetMax(s.budgetMax);setBudgetExact(s.budgetExact);setTimelineStatus(s.timelineStatus);setTargetDate(s.targetDate);setTimelineNote(s.timelineNote);setExistingStatus(s.existingStatus);setExistingUrl(s.existingUrl);setExistingNotes(s.existingNotes);setInformationDraft(s.informationItems);setNewInformation(s.newInformation);setNewInformationBlocking(s.newInformationBlocking);}});

  const availableByKind=catalog.filter(item=>catalogueIsOffer(item)===(kind==='offers'));
  const categories=sortedCategories(availableByKind);
  const selectedCategory=categories.includes(category)?category:categories[0]??'';
  const choices=availableByKind.filter(item=>(catalogQuery.trim() ? catalogMatchesQuery(item,catalogQuery) : catalogueFamilyLabel(item)===selectedCategory)).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const selectedItem = catalog.find((item) => item.id === selectedId) ?? null;

  async function load() {
    const sequence = ++reloadSequence.current;
    try {
      const [nextNeeds, nextCatalog, prospects] = await Promise.all([
        window.atoumweb.workflow.needs('prospect', prospectId),
        window.atoumweb.catalog.list({ status: 'active' }),
        window.atoumweb.crm.prospects.list({ includeArchived: true }),
      ]);
      if (sequence !== reloadSequence.current) return;
      const current = prospects.find((item) => item.id === prospectId) ?? null;
      const available = nextCatalog.filter(catalogIsSelectable);
      setNeeds(nextNeeds);
      setCatalog(available);
      setProspect(current);
      if (!category || !available.some((item) => (item.category || 'Autre') === category)) setCategory(sortedCategories(available)[0] ?? 'Autre');
      if (current && !infoGuard.dirty && activeInformationWrites.current === 0 && !informationConflictRef.current && !projectBriefConflictRef.current) {
        savedProjectBriefRef.current = { prospectId, value: prospectProjectBriefSnapshot(current) };
        savedInformationRef.current = { prospectId, value: current.missingInformation ?? null };
        setProjectSummary(current.projectSummary ?? '');
        setProjectContext(current.projectContext ?? '');
        setBudgetPreset(deriveBudgetPreset(current));
        setBudgetMin(current.budgetMinCents != null ? String(current.budgetMinCents / 100) : '');
        setBudgetMax(current.budgetMaxCents != null ? String(current.budgetMaxCents / 100) : '');
        setBudgetExact(current.budgetStatus === 'known' && current.budgetMinCents != null ? String(current.budgetMinCents / 100) : '');
        setTimelineStatus(current.timelineStatus ?? 'not_disclosed');
        setTargetDate(current.targetDate?.slice(0, 10) ?? '');
        setTimelineNote(current.timelineNote ?? '');
        setExistingStatus(current.existingStatus ?? 'unknown');
        setExistingUrl(current.existingUrl ?? '');
        setExistingNotes(current.existingNotes ?? '');
        setInformationDraft(parseProspectInformation(current.missingInformation));
        const baselineValue = {...infoValue,projectSummary:(current.projectSummary ?? ''),projectContext:(current.projectContext ?? ''),budgetPreset:(deriveBudgetPreset(current)),budgetMin:(current.budgetMinCents != null ? String(current.budgetMinCents / 100) : ''),budgetMax:(current.budgetMaxCents != null ? String(current.budgetMaxCents / 100) : ''),budgetExact:(current.budgetStatus === 'known' && current.budgetMinCents != null ? String(current.budgetMinCents / 100) : ''),timelineStatus:(current.timelineStatus ?? 'not_disclosed'),targetDate:(current.targetDate?.slice(0, 10) ?? ''),timelineNote:(current.timelineNote ?? ''),existingStatus:(current.existingStatus ?? 'unknown'),existingUrl:(current.existingUrl ?? ''),existingNotes:(current.existingNotes ?? ''),informationItems:(parseProspectInformation(current.missingInformation))}; savedFormBaselineRef.current = baselineValue; infoGuard.initial(baselineValue);
      }
    } catch (e) { if (sequence === reloadSequence.current) setError(cleanError(e)); }
  }

  useEffect(() => {
    setEditingId(undefined); setSelectedId(''); setOtherText('');
    savedInformationRef.current = { prospectId, value: null };
    savedFormBaselineRef.current = null;
    savedProjectBriefRef.current = null;
    projectBriefConflictRef.current = false;
    setProjectBriefConflict(false);
    informationConflictRef.current = false;
    setInformationConflict(false);
    pendingInformation.current = Promise.resolve();
    void load();
    return () => { reloadSequence.current++; };
  }, [prospectId]);

  async function saveNeed() {
    if (!selectedId && !otherText.trim()) return;
    setBusy(true); setError('');
    try {
      await window.atoumweb.workflow.saveNeed('prospect', prospectId, selectedId === 'other'
        ? { catalogItemId: null, otherText: otherText.trim() }
        : { catalogItemId: selectedId, otherText: null }, editingId);
      setSelectedId(''); setOtherText(''); setEditingId(undefined); await load(); onChanged?.();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true); setError('');
    try { await window.atoumweb.workflow.removeNeed('prospect', prospectId, id); await load(); onChanged?.(); window.dispatchEvent(new Event('atoumweb:changed')); }
    catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function persistInformation(next: ProspectInformationItem[]) {
    // Plusieurs saisies rapides sont enregistrées dans le même ordre, avec
    // une révision SQLite conditionnelle entre chaque modification.
    setInformationDraft(next);
    activeInformationWrites.current++;
    setSavingInformation((count) => count + 1);
    const ownerId = prospectId;
    const previous = pendingInformation.current;
    const writing = previous.then(async () => {
      if (informationConflictRef.current && ownerId === currentProspectId.current) {
        throw new Error('Conflit : vérifie la checklist modifiée dans une autre fenêtre avant de reprendre.');
      }
      const snapshot = savedInformationRef.current;
      if (snapshot.prospectId !== ownerId) {
        throw new Error('La fiche Prospect a changé : aucune sauvegarde de cette ancienne fiche.');
      }
      const updated = await window.atoumweb.crm.prospects.updateMissingInformationIfUnchanged(
        ownerId, snapshot.value, serializeProspectInformation(next),
      );
      if (ownerId !== currentProspectId.current) return;
      savedInformationRef.current = { prospectId: ownerId, value: updated.missingInformation ?? null };
      setProspect(updated);
      onChanged?.();
      window.dispatchEvent(new Event('atoumweb:changed'));
    });
    // Important : NE PAS absorber ici un conflit, sinon les écritures
    // suivantes écraseraient potentiellement la version d'une autre fenêtre.
    pendingInformation.current = writing;
    try { await writing; }
    catch (e) {
      if (ownerId === currentProspectId.current) {
        const message = cleanError(e);
        if (/conflit/i.test(message)) {
          informationConflictRef.current = true;
          setInformationConflict(true);
        }
        setError(message);
      }
    }
    finally {
      activeInformationWrites.current = Math.max(0, activeInformationWrites.current - 1);
      setSavingInformation((count) => Math.max(0, count - 1));
    }
  }

  async function reloadChecklistAfterConflict() {
    if (busy || activeInformationWrites.current !== 0 || !informationConflictRef.current) return;
    if (!window.confirm('Recharger les points enregistrés dans le dossier ? Les modifications locales NON enregistrées de cette checklist seront remplacées. Les autres champs saisis resteront inchangés.')) return;
    const ownerId = prospectId;
    setBusy(true);
    try {
      const current = (await window.atoumweb.crm.prospects.list({ includeArchived: true }))
        .find((item) => item.id === ownerId);
      if (ownerId !== currentProspectId.current) return;
      if (!current) throw new Error('Le Prospect n’est plus disponible.');
      // Invalide tout chargement de la fiche ayant commencé avant cette
      // décision explicite, sans modifier les brouillons Budget/Contexte.
      reloadSequence.current++;
      const restored = parseProspectInformation(current.missingInformation);
      setInformationDraft(restored);
      savedInformationRef.current = { prospectId: ownerId, value: current.missingInformation ?? null };
      // Modifier seulement la référence sauvegardée de la checklist :
      // les autres champs encore saisis doivent RESTER dirty pour UX-01.
      if (savedFormBaselineRef.current) {
        savedFormBaselineRef.current = { ...savedFormBaselineRef.current, informationItems: restored };
        infoGuard.initial(savedFormBaselineRef.current);
      }
      pendingInformation.current = Promise.resolve();
      informationConflictRef.current = false;
      setInformationConflict(false);
      setProspect(current);
      setError('');
    } catch (e) { if (ownerId === currentProspectId.current) setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  function updateInformation(id: string, patch: Partial<ProspectInformationItem>, save = true) {
    const next = patchProspectInformation(informationItemsRef.current, id, patch, new Date().toISOString());
    setInformationDraft(next);
    if (save) void persistInformation(next);
  }

  function addInformation() {
    const label = newInformation.trim();
    if (!label) return;
    const next = [...informationItemsRef.current, { id: newInformationId(), label, status: 'open' as const, isBlocking: newInformationBlocking, answer: null, resolvedAt: null }];
    setNewInformation('');
    setNewInformationBlocking(true);
    void persistInformation(next);
  }

  async function reloadProjectBriefAfterConflict() {
    if (busy || savingProjectBriefRef.current || !projectBriefConflictRef.current) return;
    if (!window.confirm('Recharger le projet, le budget et le calendrier enregistrés ? Les modifications locales de CES champs seront remplacées. La checklist reste inchangée.')) return;
    const ownerId = prospectId;
    setBusy(true);
    try {
      const current = (await window.atoumweb.crm.prospects.list({ includeArchived: true }))
        .find((item) => item.id === ownerId);
      if (ownerId !== currentProspectId.current) return;
      if (!current) throw new Error('Le Prospect n’est plus disponible.');
      reloadSequence.current++;
      const restoredForm = {
        projectSummary: current.projectSummary ?? '',
        projectContext: current.projectContext ?? '',
        budgetPreset: deriveBudgetPreset(current),
        budgetMin: current.budgetMinCents != null ? String(current.budgetMinCents / 100) : '',
        budgetMax: current.budgetMaxCents != null ? String(current.budgetMaxCents / 100) : '',
        budgetExact: current.budgetStatus === 'known' && current.budgetMinCents != null ? String(current.budgetMinCents / 100) : '',
        timelineStatus: current.timelineStatus ?? 'not_disclosed',
        targetDate: current.targetDate?.slice(0, 10) ?? '',
        timelineNote: current.timelineNote ?? '',
        existingStatus: current.existingStatus ?? 'unknown',
        existingUrl: current.existingUrl ?? '',
        existingNotes: current.existingNotes ?? '',
      };
      setProjectSummary(restoredForm.projectSummary);
      setProjectContext(restoredForm.projectContext);
      setBudgetPreset(restoredForm.budgetPreset);
      setBudgetMin(restoredForm.budgetMin);
      setBudgetMax(restoredForm.budgetMax);
      setBudgetExact(restoredForm.budgetExact);
      setTimelineStatus(restoredForm.timelineStatus);
      setTargetDate(restoredForm.targetDate);
      setTimelineNote(restoredForm.timelineNote);
      setExistingStatus(restoredForm.existingStatus);
      setExistingUrl(restoredForm.existingUrl);
      setExistingNotes(restoredForm.existingNotes);
      savedProjectBriefRef.current = { prospectId: ownerId, value: prospectProjectBriefSnapshot(current) };
      // Réconcilier uniquement les champs restaurés : un brouillon local
      // non enregistré de checklist conserve sa protection UX-01.
      if (savedFormBaselineRef.current) {
        savedFormBaselineRef.current = { ...savedFormBaselineRef.current, ...restoredForm };
        infoGuard.initial(savedFormBaselineRef.current);
      }
      projectBriefConflictRef.current = false;
      setProjectBriefConflict(false);
      setProspect(current);
      setError('');
    } catch (e) { if (ownerId === currentProspectId.current) setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function saveIdentification() {
    if (!prospect || savingProjectBriefRef.current) return;
    const budget = budgetValues(budgetPreset, budgetMin, budgetMax, budgetExact);
    if (budgetPreset === 'exact' && budget.min == null) { setError('Renseigne le montant précis du budget.'); return; }
    if (budgetPreset === 'custom' && budget.min == null && budget.max == null) { setError('Renseigne au moins une borne de la fourchette budgétaire.'); return; }
    if (budget.min != null && budget.max != null && budget.min > budget.max) { setError('Le budget minimum ne peut pas dépasser le budget maximum.'); return; }
    if (informationConflictRef.current) { setError('Conflit : recharge la checklist avant d’enregistrer ce dossier.'); return; }
    if (projectBriefConflictRef.current) { setError('Conflit : recharge le projet, budget et calendrier avant d’enregistrer ce dossier.'); return; }
    const snapshot = savedProjectBriefRef.current;
    if (!snapshot || snapshot.prospectId !== prospect.id) { setError('Le dossier doit être chargé avant enregistrement.'); return; }
    savingProjectBriefRef.current = true;
    setBusy(true); setError('');
    try {
      await pendingInformation.current; // Ne pas inverser une sauvegarde de checklist en cours.
      const next: ProspectProjectBrief = {
        projectSummary: projectSummary.trim() || null,
        projectContext: projectContext.trim() || null,
        budgetStatus: budget.status,
        budgetMinCents: budget.min,
        budgetMaxCents: budget.max,
        timelineStatus,
        targetDate: timelineStatus === 'date' ? targetDate || null : null,
        timelineNote: timelineStatus === 'note' ? timelineNote.trim() || null : null,
        existingStatus,
        existingUrl: existingStatus === 'yes' ? existingUrl.trim() || null : null,
        existingNotes: existingStatus !== 'no' ? existingNotes.trim() || null : null,
      };
      const updated = await window.atoumweb.crm.prospects.updateProjectBriefIfUnchanged(
        prospect.id, snapshot.value, next,
      );
      if (prospect.id !== currentProspectId.current) return;
      savedProjectBriefRef.current = { prospectId: prospect.id, value: prospectProjectBriefSnapshot(updated) };
      setProspect(updated);
      savedFormBaselineRef.current = { ...infoValue, informationItems: informationItemsRef.current };
      infoGuard.saved(savedFormBaselineRef.current);
      await load(); onChanged?.(); window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) {
      if (prospect.id === currentProspectId.current) {
        const message = cleanError(e);
        if (/conflit/i.test(message)) {
          projectBriefConflictRef.current = true;
          setProjectBriefConflict(true);
        }
        setError(message);
      }
    } finally { savingProjectBriefRef.current = false; setBusy(false); }
  }

  function editNeed(need: Need) {
    setEditingId(need.id);
    setSelectedId(need.catalogItemId ?? 'other');
    setOtherText(need.otherText ?? '');
    if (need.catalogItemId) {
      const item = catalog.find((candidate) => candidate.id === need.catalogItemId);
      if(item){setCategory(catalogueFamilyLabel(item));setKind(catalogueIsOffer(item)?'offers':'services');}
    }
  }

  const openBlockingInformation = informationItems.filter((item) => item.status === 'open' && item.isBlocking);
  const openLaterInformation = informationItems.filter((item) => item.status !== 'resolved' && !item.isBlocking);
  const identificationReady = needs.length > 0 && Boolean(projectSummary.trim()) && Boolean(prospect?.budgetStatus) && Boolean(prospect?.timelineStatus);

  return <section className="prospect-work-section needs-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Besoin à identifier</span><strong>Projet & solution AtoumWeb</strong></div><span className={`status-pill ${identificationReady ? 'ready' : ''}`}>{identificationReady ? 'Base renseignée' : 'À compléter'}</span></div>
    <p className="muted">Définis ce qu’AtoumWeb doit réellement proposer. Le catalogue reste la source des noms, tarifs et éléments inclus ; le devis ne sera créé qu’après le contrôle final.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {projectBriefConflict && <div className="prospect-checklist-conflict" role="status">
      <strong>Conflit entre fenêtres : le projet, le budget ou le calendrier a été modifié.</strong>
      <p>Vos modifications locales sont conservées. La version d'une autre fenêtre n'a pas été écrasée.</p>
      <button type="button" className="secondary-button" disabled={busy} onClick={() => void reloadProjectBriefAfterConflict()}>
        Recharger uniquement le projet et le budget enregistrés
      </button>
    </div>}
    {informationConflict && <div className="prospect-checklist-conflict" role="status">
      <strong>Conflit entre fenêtres : vos modifications locales n'ont pas été enregistrées.</strong>
      <p>Une autre fenêtre a modifié les points à confirmer. Rien ne sera écrasé automatiquement.</p>
      <button type="button" className="secondary-button" disabled={busy || savingInformation > 0} onClick={() => void reloadChecklistAfterConflict()}>
        Recharger uniquement la checklist enregistrée
      </button>
    </div>}

    <div className="need-current-list">{needs.map((need) => {
      const item = need.catalogItemId ? catalog.find((candidate) => candidate.id === need.catalogItemId) : null;
      const version = item?.currentVersion;
      return <div className="need-current-row need-solution-card" key={need.id}><div><strong className="need-name">{need.label}</strong>{version&&<small className="need-price">{priceLabel(version)}</small>}<details className="need-description"><summary>Voir le contenu et les compléments</summary><CommercialScope version={version}/></details></div><div className="need-row-actions"><button className="secondary-button compact-button" type="button" onClick={()=>editNeed(need)}>Modifier</button><button className="secondary-button compact-button" type="button" disabled={busy} onClick={()=>void remove(need.id)}>Retirer</button></div></div>;
    })}</div>

    <div className="need-add-block">
      <div className="need-selector-title"><strong>{editingId ? 'Modifier la solution' : 'Ajouter une offre / prestation au besoin'}</strong><small>Une sélection, un seul bouton de validation.</small></div>
      <KindTabs kind={kind} onChange={k=>{setKind(k);setCategory('');setSelectedId('');}}/>
      <label className="prospect-catalog-query">Rechercher par besoin ou mots-clés
        <input aria-label="Rechercher par besoin ou mots-clés" value={catalogQuery}
          onChange={event=>setCatalogQuery(event.target.value)}
          placeholder="Ex. visibilité Google, boutique en ligne…" disabled={busy}/>
      </label>
      <div className="need-add-row">
        <label>Famille de solution<select value={selectedCategory} onChange={(e) => { setCategory(e.target.value); setSelectedId(''); setOtherText(''); }} disabled={busy}>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>Offre / prestation envisagée<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={busy}><option value="">Choisir…</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.name} · {priceLabel(item.currentVersion)}</option>)}<option value="other">Autre / sur mesure</option></select></label>
        {selectedId === 'other' && <label>Préciser<input value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="Décrire le besoin spécifique" disabled={busy} /></label>}
      </div>
      {selectedItem?.currentVersion&&<div className="selected-offer-preview"><strong>{selectedItem.name}</strong><small>{priceLabel(selectedItem.currentVersion)}</small><CommercialScope version={selectedItem.currentVersion}/></div>}
      <div className="inline-editor-actions">{editingId && <button type="button" className="secondary-button" onClick={() => { setEditingId(undefined); setSelectedId(''); setOtherText(''); }}>Annuler</button>}<button type="button" className="primary-button" disabled={busy || (!selectedId && !otherText.trim()) || (selectedId === 'other' && !otherText.trim())} onClick={() => void saveNeed()}>{editingId ? 'Enregistrer la modification' : 'Ajouter au besoin'}</button></div>
    </div>

    <div className="need-identification-fields">
      <div className="work-section-heading"><div><span className="eyebrow">Affiner le besoin</span><strong>Périmètre nécessaire au chiffrage</strong></div></div>
      <div className="workflow-fields">
        <label className="form-span-2">Projet / problématique<textarea value={projectSummary} onChange={(e) => setProjectSummary(e.target.value)} placeholder="Ce que le prospect veut obtenir ou résoudre" disabled={busy} /></label>
        <label className="form-span-2">Contexte, contraintes et éléments hors socle<textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} placeholder="Fonctionnalité particulière, volume, intégration, contenu important, contrainte technique…" disabled={busy} /></label>

        <label>Budget<select value={budgetPreset} onChange={(e) => setBudgetPreset(e.target.value as BudgetPreset)} disabled={busy}>{BUDGET_PRESETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {budgetPreset === 'custom' && <div className="qualification-two-fields form-span-2"><label>Minimum (€)<input inputMode="decimal" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} disabled={busy} /></label><label>Maximum (€)<input inputMode="decimal" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} disabled={busy} /></label></div>}
        {budgetPreset === 'exact' && <label>Montant précis (€)<input inputMode="decimal" value={budgetExact} onChange={(e) => setBudgetExact(e.target.value)} disabled={busy} /></label>}

        <label>Calendrier<select value={timelineStatus} onChange={(e) => setTimelineStatus(e.target.value as NonNullable<ProspectSummary['timelineStatus']>)} disabled={busy}><option value="not_disclosed">Non communiqué</option><option value="date">Date cible</option><option value="note">Période / contrainte à préciser</option></select></label>
        {timelineStatus === 'date' && <label>Date cible<input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={busy} /></label>}
        {timelineStatus === 'note' && <label className="form-span-2">Précision calendrier<input value={timelineNote} onChange={(e) => setTimelineNote(e.target.value)} placeholder="Ex. avant l’ouverture du restaurant, idéalement en novembre…" disabled={busy} /></label>}

        <label>Site / outil existant<select value={existingStatus} onChange={(e) => setExistingStatus(e.target.value as NonNullable<ProspectSummary['existingStatus']>)} disabled={busy}><option value="unknown">À vérifier</option><option value="yes">Oui</option><option value="no">Non</option></select></label>
        {existingStatus === 'yes' && <label>URL / référence existante<input value={existingUrl} onChange={(e) => setExistingUrl(e.target.value)} placeholder="https://…" disabled={busy} /></label>}
        {existingStatus !== 'no' && <label className="form-span-2">Précisions sur l’existant<input value={existingNotes} onChange={(e) => setExistingNotes(e.target.value)} disabled={busy} /></label>}

        <div className="missing-info-checklist">
          <div className="need-selector-title"><strong>Informations / points à confirmer</strong><small>Garde les questions dans le dossier. Seuls les points « À obtenir » marqués bloquants empêchent le devis.</small></div>
          {informationItems.length > 0 && <div className="missing-info-list">{informationItems.map((item) => <div className={`missing-info-row ${item.status === 'resolved' ? 'resolved' : ''}`} key={item.id}>
            <strong>{item.label}</strong>
            <select aria-label={`État de ${item.label}`} value={item.status} onChange={(e) => updateInformation(item.id, { status: e.target.value as ProspectInformationStatus })} disabled={busy}>
              <option value="open">À obtenir</option>
              <option value="resolved">Obtenu / résolu</option>
              <option value="later">À obtenir plus tard</option>
            </select>
            <label className="check-option"><input type="checkbox" checked={item.isBlocking && item.status !== 'later'} disabled={item.status === 'later' || item.status === 'resolved'} onChange={(e) => updateInformation(item.id, { isBlocking: e.target.checked })} />Bloque le devis</label>
            <input value={item.answer ?? ''} onChange={(e) => updateInformation(item.id, { answer: e.target.value }, false)} onBlur={() => void persistInformation(informationItemsRef.current)} placeholder={item.status === 'resolved' ? 'Réponse obtenue / précision' : 'Note ou réponse éventuelle'} disabled={busy} />
          </div>)}</div>}
          <div className="missing-info-add">
            <label>Ajouter un point<input value={newInformation} onChange={(e) => setNewInformation(e.target.value)} placeholder="Ex. combien peuvent-ils investir ?" disabled={busy} /></label>
            <label className="check-option"><input type="checkbox" checked={newInformationBlocking} onChange={(e) => setNewInformationBlocking(e.target.checked)} disabled={busy} />Bloquant avant devis</label>
            <button type="button" className="secondary-button" disabled={!newInformation.trim()} onClick={addInformation}>Ajouter</button>
          </div>
        </div>

        <div className="need-scope-assessment form-span-2"><span className="eyebrow">Lecture du périmètre</span><strong>{openBlockingInformation.length > 0 ? `${openBlockingInformation.length} point${openBlockingInformation.length > 1 ? 's' : ''} bloquant${openBlockingInformation.length > 1 ? 's' : ''} avant devis` : openLaterInformation.length > 0 ? 'Périmètre prêt pour contrôle — certains points seront obtenus plus tard' : projectContext.trim() ? 'Périmètre décrit — contrôle final à effectuer' : 'Socle sélectionné — vérifier les éventuels compléments hors offre'}</strong><small>Les points résolus restent dans le dossier : aucune information n’a besoin d’être effacée pour avancer.</small></div>
        <button type="button" className="primary-button" disabled={busy} onClick={() => void saveIdentification()}>{busy ? 'Enregistrement…' : 'Enregistrer l’identification du besoin'}</button>
      </div>
    </div>

    {needs.length === 0 && <p className="muted">Commence par sélectionner au moins une solution ou prestation envisagée. Rien n’est encore envoyé au devis à ce stade.</p>}
  </section>;
}

import {ProspectDialog} from './ProspectDialog';
import {ProspectValue} from './ProspectValue';
import {ProspectRelatedRecords} from './ProspectRelatedRecords';
import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import {PROSPECT_DIRECTORY_VIEW} from '../../shared/prospectTablePresentation';
import {OperationIcon, type OperationIconName} from '../operations/OperationIcon';
import {AppButton} from '../ui/AppButton';
import './prospect-visual-pilot.css';
import './prospection-directory-pilot.css';
import './prospect-density-options.css';
import './prospect-workspace-pilot.css';
import './prospection-ux.css';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import {UnsavedGroup,useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import { normalizeEmail, normalizePhone } from '../../shared/contactValidation';
import { normalizeWebUrl } from '../../shared/webUrl';
import { historyOutcome, projectPipeline, withCurrentQuoteSignal, PROSPECT_PIPELINE_COLUMNS } from '../../shared/prospectPipelineProjection';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import type { QuoteSummary } from '../../shared/commercial';
import {
  PROSPECT_SOURCES,
  PROSPECT_TEMPERATURES,
  type ActivityEvent,
  type CrmAction,
  type ProspectSource,
  type ProspectStage,
  type ProspectSummary,
  type ProspectTemperature,
} from '../../shared/crm';
import { ProspectActionsPanel } from './ProspectActionsPanel';
import { ProspectIdentityPanel } from './ProspectIdentityPanel';
import { ProspectNeedsPanel } from './ProspectNeedsPanel';
import {ProspectPreQuoteReviewPanel} from './ProspectPreQuoteReview';
import { FieldHelp, ProspectQualificationPanelV2 } from './ProspectQualificationPanelV2';
import { ProspectQuotePanel } from './ProspectQuotePanel';
import { ProspectResearchPanel } from './ProspectResearchPanel';
import { ProspectReferenceSummary } from './ProspectReferenceSummary';
import { CrmIdentityAssetEditor, CrmIdentityAvatar } from './CrmIdentityVisual';

const ACTIVE_STAGES: ProspectStage[] = ['new', 'qualifying', 'need_identified', 'quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'];
const STAGE_LABELS: Record<ProspectStage, string> = {
  new: 'Nouveau contact',
  qualifying: 'À qualifier',
  need_identified: 'Besoin à identifier',
  quote_to_prepare: 'Devis à préparer',
  quote_to_send: 'Devis à envoyer',
  quote_sent: 'En attente de retour',
  follow_up: 'Attente du retour',
  negotiation: 'Négociation',
  waiting: 'En attente',
  won: 'Gagné',
  lost: 'Perdu',
};
const TEMPERATURE_LABELS: Record<ProspectTemperature, string> = { cold: 'Faible', neutral: 'À évaluer', warm: 'Marqué', hot: 'Fort' };
const SOURCE_LABELS: Record<ProspectSource, string> = {
  website: 'Demande entrante · Site web',
  referral: 'Recommandation',
  google: 'Demande entrante · Google',
  social: 'Demande entrante · Réseaux sociaux',
  event: 'Événement / rencontre',
  outbound: 'Prospection AtoumWeb',
  former_client: 'Ancien client / relation existante',
  other: 'Autre',
};
const LOSS_REASONS = [
  ['too_expensive', 'Trop cher'],
  ['competitor', 'Concurrent choisi'],
  ['abandoned', 'Projet abandonné'],
  ['no_response', 'Pas de réponse'],
  ['timing', 'Délai incompatible'],
  ['out_of_scope', 'Besoin hors périmètre AtoumWeb'],
  ['other', 'Autre'],
] as const;
const QUOTE_FOLLOW_UP_STAGES: ProspectStage[] = ['quote_sent', 'follow_up', 'negotiation', 'waiting'];
const QUOTE_VISIBLE_STAGES: ProspectStage[] = ['quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'];
const MANUAL_STAGE_OPTIONS: Record<ProspectStage, ProspectStage[]> = {
  new: ['new', 'qualifying'],
  qualifying: ['qualifying', 'new', 'need_identified'],
  need_identified: ['need_identified', 'qualifying'],
  quote_to_prepare: ['quote_to_prepare'],
  quote_to_send: ['quote_to_send'],
  quote_sent: ['quote_sent', 'follow_up', 'negotiation', 'waiting'],
  follow_up: ['follow_up', 'quote_sent', 'negotiation', 'waiting'],
  negotiation: ['negotiation', 'follow_up', 'waiting'],
  waiting: ['waiting', 'quote_sent', 'follow_up', 'negotiation'],
  won: ['won'],
  lost: ['lost'],
};

interface ProspectDraft {
  company: string; industry: string; activityDescription: string; website: string; websitePresence?:'present'|'absent'|'review';
  addressLine1: string; addressLine2: string; postalCode: string; city: string; country: string;
  firstName: string; lastName: string; jobTitle: string; email: string; phone: string;
  source: ProspectSource; sourceDetail: string; temperature: ProspectTemperature; estimatedValueEuros: string;
  firstActionDate: string; firstActionText: string;
  services: string; customerSegments: string; differentiators: string; talkingPoints: string; approach: string;
}
const EMPTY_DRAFT: ProspectDraft = {
  company: '', industry: '', activityDescription: '', website: '', websitePresence:'review', addressLine1: '', addressLine2: '', postalCode: '', city: '', country: 'France',
  firstName: '', lastName: '', jobTitle: '', email: '', phone: '', source: 'website', sourceDetail: '', temperature: 'neutral', estimatedValueEuros: '', firstActionDate: '', firstActionText: '',
  services: '', customerSegments: '', differentiators: '', talkingPoints: '', approach: '',
};

type View = 'directory' | 'pipeline' | 'history' | 'conversions';
export type ProspectPipelineFilter = 'all' | 'relaunch' | 'overdue';
type DirectoryStatusFilter = 'follow' | 'all' | 'prepare' | 'ready' | 'relaunch' | 'overdue' | ProspectStage;

const PIPELINE_ICONS: Record<typeof PROSPECT_PIPELINE_COLUMNS[number]['id'], OperationIconName> = {
  qualify:'user', needs:'search', quote:'file-text', reply:'clock', negotiation:'users', finalization:'file-check',
};
const PIPELINE_GROUPS: Array<{ id: string; step: number; label: string; stages: ProspectStage[]; icon: OperationIconName }> =
  PROSPECT_PIPELINE_COLUMNS.map((column, index) => ({
    id: column.id, step: index + 1, label: column.label,
    stages: [...column.stages], icon: PIPELINE_ICONS[column.id],
  }));

function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('fr-FR') : 'Sans date'; }
function formatMoney(cents: number) { return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`; }
function daysRemaining(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.ceil((timestamp - Date.now()) / 86_400_000);
}
function isClosed(prospect: ProspectSummary) { return Boolean(prospect.archivedAt || prospect.clientAccountId || prospect.stage === 'won' || prospect.stage === 'lost'); }
function splitList(value: string): string[] { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function prospectReadiness(prospect: ProspectSummary): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!prospect.organizationIndustry?.trim()) missing.push('activité');
  if (!prospect.hasContactMethod && !prospect.secondaryLabel) missing.push('contact');
  if (!prospect.researchSnapshotCount && !prospect.initialObservation && !prospect.detectedOpportunity && !prospect.organizationNotes) missing.push('point à évoquer');
  return { ready: missing.length === 0, missing };
}
function directoryStatus(prospect: ProspectSummary): { key: DirectoryStatusFilter; label: string; tone: string } {
  const stage = prospect.stage ?? 'new';
  if (stage === 'new') {
    const readiness = prospectReadiness(prospect);
    return readiness.ready
      ? { key: 'ready', label: 'Prêt pour démarchage', tone: 'ready' }
      : { key: 'prepare', label: 'À préparer', tone: 'prepare' };
  }
  if (stage === 'won') return { key: 'won', label: 'Gagné', tone: 'won' };
  if (stage === 'lost') return { key: 'lost', label: 'Perdu', tone: 'lost' };
  return { key: stage, label: STAGE_LABELS[stage], tone: stage };
}
function matchesDirectoryStatus(prospect: ProspectSummary, filter: DirectoryStatusFilter): boolean {
  if (filter === 'all') return true;
  const status = directoryStatus(prospect);
  if (filter === 'follow') return status.key !== 'won' && status.key !== 'lost';
  return status.key === filter;
}
function isQuoteFollowUpStage(stage?: ProspectStage | null) { return QUOTE_FOLLOW_UP_STAGES.includes(stage ?? 'new'); }
function manualStages(prospect: ProspectSummary): ProspectStage[] { return MANUAL_STAGE_OPTIONS[prospect.stage ?? 'new'].filter((stage) => ACTIVE_STAGES.includes(stage)); }
function cleanBusinessError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim() || fallback;
}
function humanActivity(summary: string) {
  return summary.replace(/\bnew\b/g, 'Nouveau contact').replace(/\bqualifying\b/g, 'À qualifier').replace(/\bneed_identified\b/g, 'Besoin à identifier').replace(/\bquote_to_prepare\b/g, 'Devis à préparer').replace(/\bquote_to_send\b/g, 'Devis à envoyer').replace(/\bquote_sent\b/g, 'En attente de retour').replace(/\bfollow_up\b/g, 'Attente du retour').replace(/\bnegotiation\b/g, 'Négociation').replace(/\bwaiting\b/g, 'En attente').replace(/\bwon\b/g, 'Gagné').replace(/\blost\b/g, 'Perdu');
}
function nextOpenAction(actions: CrmAction[]): CrmAction | null {
  return [...actions]
    .filter((item) => item.status === 'open')
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return a.createdAt.localeCompare(b.createdAt);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.localeCompare(b.dueAt);
    })[0] ?? null;
}
function quoteCardState(prospect: ProspectSummary, quote: QuoteSummary): string {
  if (quote.principleAgreementAt) return 'Accord de principe confirmé · signature attendue';
  if (quote.status === 'refused') return 'Devis refusé';
  if (quote.status === 'expired') return 'Devis caduc';
  if (prospect.stage === 'negotiation') return 'À modifier · Négociation';
  if (prospect.stage === 'quote_to_send') return 'Prêt à envoyer';
  if (prospect.stage === 'quote_to_prepare') return 'Brouillon à préparer';
  if (prospect.stage === 'waiting') return 'En attente';
  if (prospect.stage === 'follow_up') return 'En attente de retour';
  return 'En attente de retour';
}

export function ProspectsPage({ onEntityReady, onMessage, initialId, initialView = 'directory', initialPipelineFilter = 'all', initialRequest }: { onMessage: (message: string) => void; initialId?: string | null; initialView?: View; initialPipelineFilter?: ProspectPipelineFilter;initialRequest?:number;onEntityReady?:EntityReady }) {
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [actions, setActions] = useState<CrmAction[]>([]);
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [view, applyView] = useState<View>(initialView);
  const [pipelineFilter, setPipelineFilter] = useState<ProspectPipelineFilter>(initialPipelineFilter);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryIndustry, setDirectoryIndustry] = useState('');
  const [directoryCity, setDirectoryCity] = useState('');
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState<DirectoryStatusFilter>('follow');
  const sidePanelRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const closeCreation=()=>requestUnsavedExit(()=>setShowForm(false),'prospect:create');
  const [draft, setDraft] = useState<ProspectDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, applySelectedId] = useState<string | null>(initialId ?? null);
  const [prospectSplitPercent, setProspectSplitPercent] = useState(66);
  const [deskStartTab,setDeskStartTab]=useState<'commercial'|'reference'>('commercial');
  const [deskModeId, applyDeskModeId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  useUnsavedDraft('Nouvelle entreprise',draft,{group:'prospect:create',pending:saving,discard:saved=>setDraft(saved)});
  function setSelectedId(id:string|null){if(id===selectedId)return true;return requestUnsavedExit(()=>applySelectedId(id),selectedId?'prospect:'+selectedId+'/panel':'prospect:none');}
  function setDeskModeId(id:string|null){if(id===deskModeId)return;requestUnsavedExit(()=>applyDeskModeId(id),deskModeId?'prospect:'+deskModeId+'/desk':selectedId?'prospect:'+selectedId+'/panel':'prospect:none');}
  function setView(next:View){if(next===view)return;requestUnsavedExit(()=>applyView(next),selectedId?'prospect:'+selectedId+'/panel':'prospect:none');}
  const loadedOnce=useRef(false);
  const refreshGeneration=useRef(0);
  const selectionRef=useRef({selectedId,deskModeId});selectionRef.current={selectedId,deskModeId};
  const [dropStage, setDropStage] = useState<ProspectStage | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  async function refresh() {
    const generation=++refreshGeneration.current;
    if(!loadedOnce.current)setLoading(true);
    try {
      const [nextProspects, nextActions, nextQuotes] = await Promise.all([
        window.atoumweb.crm.prospects.list({ includeArchived: true }),
        window.atoumweb.crm.actions.list({ ownerType: 'prospect' }),
        window.atoumweb.quotes.list(),
      ]);
      if(generation!==refreshGeneration.current)return;
      if(initialId&&!nextProspects.some(item=>item.id===initialId))onEntityReady?.('prospect',initialId,'Prospect introuvable.');
      setProspects(nextProspects); setActions(nextActions); setQuotes(nextQuotes);
      const current=selectionRef.current;
      if (current.selectedId && !nextProspects.some((item) => item.id === current.selectedId)) requestUnsavedExit(()=>applySelectedId(null),'prospect:'+current.selectedId+'/panel');
      if (current.deskModeId && !nextProspects.some((item) => item.id === current.deskModeId)) requestUnsavedExit(()=>applyDeskModeId(null),'prospect:'+current.deskModeId+'/desk');
    } catch(error) { if(generation===refreshGeneration.current)throw error; }
    finally { if(generation===refreshGeneration.current){loadedOnce.current=true;setLoading(false);} }
  }
  useEffect(()=>()=>{refreshGeneration.current++;},[]);
  useEffect(() => { void refresh().catch((error:unknown)=>{if(initialId)onEntityReady?.('prospect',initialId,error instanceof Error?error.message:'Prospect introuvable.');onMessage(error instanceof Error?error.message:'Prospection indisponible.');}); }, []);
  useEffect(()=>{if(initialId)setSelectedId(initialId);},[initialId,initialRequest]);
  useEffect(() => { let current=true;if (!selectedId) { setActivity([]); return; } void window.atoumweb.crm.activity.list('prospect', selectedId).then(value=>{if(current)setActivity(value);}).catch(error=>{if(current)onMessage(error instanceof Error?error.message:'Journal indisponible.');});return()=>{current=false;}; }, [selectedId, prospects, actions]);
  useEffect(() => { const reload = () => void refresh().catch(error=>onMessage(error instanceof Error?error.message:'Prospection indisponible.')); window.addEventListener('atoumweb:changed', reload); return () => window.removeEventListener('atoumweb:changed', reload); }, []);
  useEffect(() => {
    if (!selectedId || deskModeId) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || sidePanelRef.current?.contains(target)) return;
      if(target instanceof Element&&target.closest('button,a,input,select,textarea,tr,.aw-data-table-scroll,.prospect-splitter,.aw-table-preferences'))return;
      requestUnsavedExit(()=>applySelectedId(null),'prospect:'+selectedId+'/panel');
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [selectedId, deskModeId]);

  const active = useMemo(() => prospects.filter((item) => !isClosed(item)), [prospects]);
  const directory = useMemo(() => prospects.filter((item) => !item.archivedAt), [prospects]);
  const pipelineActive = useMemo(() => active.filter((item) => (item.stage ?? 'new') !== 'new'), [active]);
  const followUpBuckets = useMemo(() => {
    const nowTimestamp = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(24, 0, 0, 0);
    const relaunch = new Set<string>();
    const overdue = new Set<string>();
    for (const action of actions) {
      if (action.ownerType !== 'prospect' || action.type !== 'follow_up' || action.status !== 'open' || !action.dueAt) continue;
      const timestamp = new Date(action.dueAt).getTime();
      if (!Number.isFinite(timestamp) || timestamp >= endOfToday.getTime()) continue;
      relaunch.add(action.ownerId);
      if (timestamp < nowTimestamp) overdue.add(action.ownerId);
    }
    return { relaunch, overdue };
  }, [actions]);
  const relaunchCount = useMemo(() => pipelineActive.filter((item) => followUpBuckets.relaunch.has(item.id)).length, [pipelineActive, followUpBuckets]);
  const overdueCount = useMemo(() => pipelineActive.filter((item) => followUpBuckets.overdue.has(item.id)).length, [pipelineActive, followUpBuckets]);
  const pipelineFiltered = useMemo(() => {
    if (pipelineFilter === 'relaunch') return pipelineActive.filter((item) => followUpBuckets.relaunch.has(item.id));
    if (pipelineFilter === 'overdue') return pipelineActive.filter((item) => followUpBuckets.overdue.has(item.id));
    return pipelineActive;
  }, [pipelineActive, pipelineFilter, followUpBuckets]);
  const directoryIndustries = useMemo(() => [...new Set(directory.map((item) => item.organizationIndustry).filter((value): value is string => Boolean(value)))].sort((a,b) => a.localeCompare(b, 'fr')), [directory]);
  const directoryCities = useMemo(() => [...new Set(directory.map((item) => item.organizationCity).filter((value): value is string => Boolean(value)))].sort((a,b) => a.localeCompare(b, 'fr')), [directory]);
  const directoryFiltered = useMemo(() => directory.filter((item) => {
    const needle = directorySearch.trim().toLocaleLowerCase('fr-FR');
    const haystack = [item.displayName, item.secondaryLabel, item.organizationIndustry, item.organizationCity, item.organizationWebsite, item.organizationNotes, item.initialObservation, item.detectedOpportunity].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR');
    const statusMatches = directoryStatusFilter === 'relaunch'
      ? followUpBuckets.relaunch.has(item.id)
      : directoryStatusFilter === 'overdue'
        ? followUpBuckets.overdue.has(item.id)
        : matchesDirectoryStatus(item, directoryStatusFilter);
    return (!needle || haystack.includes(needle))
      && (!directoryIndustry || item.organizationIndustry === directoryIndustry)
      && (!directoryCity || item.organizationCity === directoryCity)
      && statusMatches;
  }), [directory, directorySearch, directoryIndustry, directoryCity, directoryStatusFilter, followUpBuckets]);
  const closed = useMemo(() => prospects.filter(isClosed), [prospects]);
  const selected = prospects.find((item) => item.id === selectedId) ?? null;
  const deskProspect = prospects.find((item) => item.id === deskModeId) ?? null;
  useSearchTargetConfirmation('prospect',(deskProspect??selected)?.id,loading,onEntityReady);

  const selectedActions = actions.filter((item) => item.ownerId === selectedId);
  const latestQuotesByProspect = useMemo(() => {
    const mapped = new Map<string, QuoteSummary>();
    for (const quote of [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))) {
      if (quote.prospectId && !mapped.has(quote.prospectId)) mapped.set(quote.prospectId, quote);
    }
    return mapped;
  }, [quotes]);
  const pipelineProjection = useMemo(() => projectPipeline(withCurrentQuoteSignal(pipelineFiltered,quotes)), [pipelineFiltered, quotes]);
  const historicalConversions = useMemo(() => projectPipeline(prospects).conversions, [prospects]);
  const historyVisible = useMemo(() => (view === 'conversions' ? historicalConversions : closed).filter((item) =>
    [item.displayName, item.primaryNeed, item.lostReason].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR').includes(historySearch.toLocaleLowerCase('fr-FR')),
  ), [view, historicalConversions, closed, historySearch]);
  const prospectSplitStyle = selected && !deskProspect
    ? ({ '--prospect-list-percent': `${prospectSplitPercent}%` } as CSSProperties)
    : undefined;

  async function submitProspect(event: FormEvent) {
    event.preventDefault(); setFormError('');
    if (!draft.company.trim() && (!draft.firstName.trim() || !draft.lastName.trim())) { setFormError('Renseigne une société ou le prénom et le nom du contact.'); return; }
    setSaving(true);
    try {
      // Validate shared contact rules before creating any identity record.
      const website=draft.websitePresence==='absent'?null:normalizeWebUrl(draft.website);
      normalizeEmail(draft.email);normalizePhone(draft.phone);
      const normalized = draft.estimatedValueEuros.trim().replace(',', '.');
      const estimatedValueCents = normalized ? Math.round(Number(normalized) * 100) : null;
      if (estimatedValueCents != null && (!Number.isFinite(estimatedValueCents) || estimatedValueCents < 0)) throw new Error('Valeur estimée invalide.');
      let organizationId: string | null = null; let contactId: string | null = null;
      if (draft.company.trim()) {
        const organization = await window.atoumweb.crm.organizations.create({ name: draft.company.trim(), industry: draft.industry.trim() || null, notes: draft.activityDescription.trim() || null, website, addressLine1: draft.addressLine1.trim() || null, addressLine2: draft.addressLine2.trim() || null, postalCode: draft.postalCode.trim() || null, city: draft.city.trim() || null, country: draft.country.trim() || null });
        organizationId = organization.id;
      }
      if (draft.firstName.trim() && draft.lastName.trim()) {
        const contact = await window.atoumweb.crm.contacts.create({ organizationId, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), jobTitle: draft.jobTitle.trim() || null, email: draft.email.trim() || null, phone: draft.phone.trim() || null });
        contactId = contact.id;
        if (draft.email.trim()) await window.atoumweb.crm.contactMethods.save({ contactId, type: 'email', value: draft.email.trim(), label: 'Principal', isPrimary: true });
        if (draft.phone.trim()) await window.atoumweb.crm.contactMethods.save({ contactId, type: 'phone', value: draft.phone.trim(), label: 'Principal', isPrimary: true });
      } else if (organizationId) {
        if (draft.email.trim()) await window.atoumweb.crm.contactMethods.save({ organizationId, type: 'email', value: draft.email.trim(), label: 'Accueil / principal', isPrimary: true });
        if (draft.phone.trim()) await window.atoumweb.crm.contactMethods.save({ organizationId, type: 'phone', value: draft.phone.trim(), label: 'Accueil / principal', isPrimary: true });
      }
      const prospect = await window.atoumweb.crm.prospects.create({ organizationId, contactId, stage: 'new', temperature: draft.temperature, source: draft.source, sourceDetail: draft.source === 'other' ? draft.sourceDetail.trim() || null : null, estimatedValueCents });
      const structuredKnowledge = [draft.services, draft.customerSegments, draft.differentiators, draft.talkingPoints, draft.approach].some((value) => value.trim()) || !!website || draft.websitePresence==='absent' || draft.websitePresence==='present';
      if (structuredKnowledge) {
        await window.atoumweb.crm.prospects.research.save(prospect.id, {
          checkedAt: new Date().toISOString().slice(0, 10),
          source: 'Saisie annuaire',
          sourceUrl: website,
          services: splitList(draft.services),
          customerSegments: splitList(draft.customerSegments),
          differentiators: splitList(draft.differentiators),
          website: {presence:draft.websitePresence==='absent'?'absent':website||draft.websitePresence==='present'?'present':'review',url:website},
          conversation: {
            talkingPoints: draft.talkingPoints.trim() || null,
            approach: draft.approach.trim() || null,
          },
        });
      }
      if (draft.firstActionText.trim() || draft.firstActionDate) await window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: draft.firstActionText.trim() || 'Première prise de contact', dueAt: draft.firstActionDate ? new Date(`${draft.firstActionDate}T09:00:00`).toISOString() : null });
      setDraft(EMPTY_DRAFT); setShowForm(false); await refresh(); setSelectedId(prospect.id); onMessage('Prospect créé. Il reste en « Nouveau contact » jusqu’au démarrage de la prospection.');
    } catch (e) { setFormError(cleanBusinessError(e, 'Création impossible.')); }
    finally { setSaving(false); }
  }

  async function updateTemperature(prospect: ProspectSummary, temperature: ProspectTemperature) {
    try {
      await window.atoumweb.crm.prospects.update(prospect.id, { ...prospect, temperature });
      await refresh(); onMessage(`Niveau d’intérêt : ${TEMPERATURE_LABELS[temperature]}.`);
    } catch (e) { onMessage(cleanBusinessError(e, 'Modification de la température commerciale impossible.')); }
  }

  async function changeStage(prospect: ProspectSummary, stage: ProspectStage): Promise<boolean> {
    if (stage === prospect.stage || !ACTIVE_STAGES.includes(stage)) return false;
    try {
      await window.atoumweb.crm.prospects.changeStage(prospect.id, stage);
      await refresh();
      onMessage(`Prospect déplacé vers « ${STAGE_LABELS[stage]} ».`);
      return true;
    } catch (e) {
      const message = cleanBusinessError(e, 'vérifie les informations nécessaires à cette étape.');
      if (prospect.stage === 'qualifying' && stage === 'need_identified' && /qualification incomplète/i.test(message)) {
        const confirmed = window.confirm(`${message}\n\nPasser quand même à « ${STAGE_LABELS[stage]} » ?\nLes informations manquantes resteront visibles et pourront être complétées plus tard.`);
        if (!confirmed) {
          onMessage('Le prospect reste à l’étape « À qualifier ».');
          return false;
        }
        try {
          await window.atoumweb.crm.prospects.changeStage(prospect.id, stage, null, true);
          await refresh();
          onMessage(`Prospect déplacé vers « ${STAGE_LABELS[stage]} » malgré une qualification incomplète.`);
          return true;
        } catch (confirmedError) {
          onMessage(`Impossible d’avancer ce prospect : ${cleanBusinessError(confirmedError, 'vérifie les informations nécessaires à cette étape.')}`);
          return false;
        }
      }
      onMessage(`Impossible d’avancer ce prospect : ${message}`);
      return false;
    }
  }

  async function startProspecting(prospect: ProspectSummary) {
    if (prospect.stage === 'new' && !(await changeStage(prospect, 'qualifying'))) return;
    setSelectedId(prospect.id);
    setDeskModeId(prospect.id);
  }

  async function archive(prospect: ProspectSummary) { if(!requestUnsavedExit(()=>{},'prospect:'+prospect.id))return;await window.atoumweb.workflow.archiveProspect(prospect.id, true); setSelectedId(null); setDeskModeId(null); await refresh(); onMessage('Prospect archivé.'); }

  async function markLost(prospect: ProspectSummary, reasonCode: string, reasonText: string) {
    if (!reasonText.trim()) return;
    if(!requestUnsavedExit(()=>{},'prospect:'+prospect.id))return;
    try {
      await window.atoumweb.crm.prospects.updateQualification(prospect.id, { lostReasonCode: reasonCode });
      await window.atoumweb.crm.prospects.changeStage(prospect.id, 'lost', reasonText.trim());
      setSelectedId(null); setDeskModeId(null); await refresh(); onMessage('Prospect classé perdu.');
    } catch (e) { onMessage(cleanBusinessError(e, 'Classement en perdu impossible.')); }
  }

  async function handleGroupDrop(stages: ProspectStage[]) {
    const prospect = prospects.find((item) => item.id === draggingId);
    setDraggingId(null); setDropStage(null);
    if (!prospect) return;
    const allowed = manualStages(prospect);
    const target = stages.find((stage) => allowed.includes(stage));
    if (!target) {
      onMessage('Ce changement d’étape nécessite l’action métier prévue dans la fiche du prospect.');
      return;
    }
    await changeStage(prospect, target);
  }

  function beginProspectResize(splitter: HTMLElement): void {
    const workspace = splitter.parentElement;
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const requested = ((event.clientX - rect.left) / rect.width) * 100;
      const maxForDetail = ((rect.width - 328) / rect.width) * 100;
      const maxPercent = Math.max(52, Math.min(74, maxForDetail));
      setProspectSplitPercent(Math.max(40, Math.min(maxPercent, requested)));
    };
    const onUp = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  const prospectSplitter = selected && !deskProspect ? <div
    className="operation-splitter prospect-splitter"
    role="separator"
    aria-orientation="vertical"
    aria-label="Redimensionner l’annuaire et la fiche prospect"
    tabIndex={0}
    onPointerDown={(event) => { event.stopPropagation(); beginProspectResize(event.currentTarget); }}
    onDoubleClick={(event) => { event.stopPropagation(); setProspectSplitPercent(66); }}
    onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') setProspectSplitPercent((value) => Math.max(40, value - 3));
      if (event.key === 'ArrowRight') setProspectSplitPercent((value) => Math.min(74, value + 3));
    }}
  ><span /></div> : null;

  const detail = selected ? <div ref={sidePanelRef} className="prospect-side-panel-boundary"><ProspectDetailV2
    prospect={selected}
    actions={selectedActions}
    activity={activity}
    mode="panel"
    onRefresh={(message) => { void refresh(); if (message) onMessage(message); }}
    onClose={() => {if(setSelectedId(null))requestAnimationFrame(()=>document.querySelector<HTMLElement>(`tr[data-record-id="${selected?.id}"]`)?.focus({preventScroll:true}));}}
    onOpenDesk={(tab='commercial') => {setDeskStartTab(tab);setDeskModeId(selected.id);}}
    onTemperature={(temperature) => void updateTemperature(selected, temperature)}
    onStart={() => void startProspecting(selected)}
    onLost={(code, reason) => void markLost(selected, code, reason)}
    onArchive={() => void archive(selected)}
  /></div> : null;

  const renderProspectCard = (prospect: ProspectSummary, draggable = true) => {
    const nextAction = nextOpenAction(actions.filter(action => action.ownerId === prospect.id && action.status === 'open'));
    const group = PIPELINE_GROUPS.find(item => item.stages.includes(prospect.stage ?? 'new'));
    const openCard = () => {if(!setSelectedId(prospect.id))return;setDeskStartTab('commercial');setDeskModeId(prospect.id);};
    return <article data-prospect-id={prospect.id} className={`prospect-card stacked-card prospect-temperature-${prospect.temperature ?? 'neutral'} collapsed-card ${selectedId === prospect.id ? 'selected-prospect' : ''}`} key={prospect.id}>
      <div className="prospect-card-head card-drag-handle" role="button" tabIndex={0} aria-label={'Ouvrir '+prospect.displayName} draggable={draggable} onDragStart={(e) => { if (!draggable) return; setDraggingId(prospect.id); e.dataTransfer.setData('text/plain', prospect.id); }} onDragEnd={() => { setDraggingId(null); setDropStage(null); }} onClick={openCard} onKeyDown={event=>{if(event.target===event.currentTarget&&['Enter',' '].includes(event.key)){event.preventDefault();openCard();}}}>
        <div className="prospect-card-identity"><CrmIdentityAvatar organizationId={prospect.organizationId} contactId={prospect.contactId} name={prospect.displayName} /><strong>{prospect.displayName}</strong></div>
        {group && <span className="pipeline-state-icon" title={group.label}><OperationIcon name={group.icon}/></span>}
      </div>
      <button type="button" className="pipeline-card-summary" aria-haspopup="dialog" onClick={openCard}>Ouvrir la fiche</button>
      <div className="prospection-card-preview"><span>{nextAction?.title||'Aucune action programmée'}</span>{nextAction?.dueAt&&<time className={new Date(nextAction.dueAt).getTime()<Date.now()?'is-overdue':''}>{formatDate(nextAction.dueAt)}{new Date(nextAction.dueAt).getTime()<Date.now()?' · En retard':''}</time>}</div>
    </article>;
  };

  return <div className="crm-stack prospects-v2" data-prospect-view={view}>
    <header className="page-heading prospection-pilot-heading"><div><h1>Prospection</h1><FieldHelp text="Annuaire, parcours commercial et historique. Une ligne ouvre la fiche rapide ; Agrandir ouvre le même dossier."/></div>{view==='directory'&&<button type="button" className="primary-button" onClick={()=>showForm?closeCreation():setShowForm(true)}><OperationIcon name={showForm?'close':'plus'}/>{showForm?'Fermer la création':'Entreprise'}</button>}</header>
    <div className="prospect-view-switch" role="tablist">
      <button className={view === 'directory' ? 'active' : ''} onClick={() => setView('directory')}><OperationIcon name="contact"/>Annuaire prospects <span>{directory.length}</span></button>
      <button className={view === 'pipeline' ? 'active' : ''} onClick={() => { setView('pipeline'); setPipelineFilter('all'); }}><OperationIcon name="layers"/>Parcours commercial <span>{pipelineActive.length}</span></button>
      <button className={view === 'history' || view === 'conversions' ? 'active' : ''} onClick={() => setView('history')}><OperationIcon name="clock"/>Historique <span>{closed.length}</span></button>
    </div>

    {view === 'directory' && <>
      <details className="prospection-overview" open><summary>Indicateurs</summary><div className="prospection-pilot-counts" aria-label="Filtres rapides des prospects">{([
        ['all','Tous les prospects',directory.length,'users'],
        ['qualifying','À qualifier',directory.filter(p=>p.stage==='qualifying').length,'search'],
        ['relaunch','À relancer',directory.filter(p=>followUpBuckets.relaunch.has(p.id)).length,'clock'],
        ['quote_to_prepare','Devis à préparer',directory.filter(p=>p.stage==='quote_to_prepare').length,'file-text']
      ] as const).map(([filter,label,count,icon])=><button type="button" key={filter} data-prospect-filter={filter} title={filter==='relaunch'?'Rappels ouverts dus au plus tard aujourd’hui, retards inclus. Compteurs non additifs.':filter==='all'?'Tous les dossiers non archivés. Compteurs non additifs.':'Dossiers non archivés correspondant à cette situation. Compteurs non additifs.'} aria-pressed={directoryStatusFilter===filter} onClick={()=>setDirectoryStatusFilter(value=>value===filter?'follow':filter)}><strong>{count}</strong><OperationIcon name={icon}/><span>{label}</span></button>)}</div></details>
      <div className="prospect-directory-filters">
        <input aria-label="Rechercher les prospects" value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} placeholder="Rechercher une entreprise, un contact…" />
        <select aria-label="Filtrer par activité" value={directoryIndustry} onChange={(e) => setDirectoryIndustry(e.target.value)}><option value="">Tous les métiers</option>{directoryIndustries.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Filtrer par ville" value={directoryCity} onChange={(e) => setDirectoryCity(e.target.value)}><option value="">Toutes les villes</option>{directoryCities.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select value={directoryStatusFilter} onChange={(e) => setDirectoryStatusFilter(e.target.value as DirectoryStatusFilter)} aria-label="Filtrer par statut de prospection">
          <option value="follow">À suivre</option>
          <option value="all">Tous les statuts</option>
          <option value="prepare">À préparer</option>
          <option value="ready">Prêt pour démarchage</option>
          <option value="qualifying">À qualifier</option>
          <option value="need_identified">Besoin à identifier</option>
          <option value="quote_to_prepare">Devis à préparer</option>
          <option value="quote_to_send">Devis à envoyer</option>
          <option value="quote_sent">En attente de retour</option>
          <option value="relaunch">À relancer</option>
          <option value="overdue">Relance en retard</option>
          <option value="negotiation">Négociation</option>
          <option value="waiting">En attente</option>
          <option value="won">Gagné</option>
          <option value="lost">Perdu</option>
        </select>
        <button type="button" className="secondary-button" aria-label="Effacer les filtres" onClick={()=>{setDirectorySearch('');setDirectoryIndustry('');setDirectoryCity('');setDirectoryStatusFilter('all');}}>Effacer les filtres</button><AppButton variant="quiet" aria-label="Actualiser les prospects" title="Actualiser les prospects" icon={<OperationIcon name="refresh"/>} onAction={refresh}/>
      </div>
      <p className="prospection-pilot-results" role="status"><span>{[directorySearch.trim(),directoryIndustry,directoryCity,directoryStatusFilter!=='all'?directoryStatusFilter:''].filter(Boolean).length} filtre(s) actif(s) · </span>{directoryFiltered.length} résultat{directoryFiltered.length>1?'s':''}{directoryStatusFilter!=='all'?' · filtre : '+({follow:'À suivre',prepare:'À préparer',ready:'Prêt pour démarchage',relaunch:'À relancer',overdue:'Relance en retard',...STAGE_LABELS}[directoryStatusFilter]):''}</p>
      {showForm && <ProspectDialog label="Nouveau prospect" onClose={closeCreation} className="prospect-create-dialog"><form className="panel crm-form prospect-create-v2" onSubmit={(e) => void submitProspect(e)}><div className="panel-title"><div><span className="eyebrow">Annuaire de prospection</span><h2>Nouvelle entreprise à préparer</h2><p className="muted">Enregistre ce que tu sais déjà. Le dossier n’entre dans le parcours commercial qu’au clic sur « Démarrer le parcours commercial ».</p></div></div><div className="form-grid">
        <label>Société <FieldHelp text="Nom commercial ou nom de la structure." /><input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
        <label>Corps de métier / activité <FieldHelp text="Utilise un libellé stable pour pouvoir filtrer l’annuaire : restaurant, artisan, garage, profession libérale…" /><input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} placeholder="Ex. restaurant" /></label>
        <label>Site web — facultatif <FieldHelp text="Une adresse n’est pas nécessaire pour ajouter ce prospect. Choisis Pas de site internet si l’absence est connue ; sinon laisse Non renseigné. Une URL saisie doit être valide." /><select aria-label="Situation du site internet" value={draft.websitePresence??(draft.website.trim()?'present':'review')} onChange={e=>{const presence=e.target.value as 'present'|'absent'|'review';setDraft({...draft,websitePresence:presence,website:presence==='absent'?'':draft.website});setFormError('');}}><option value="review">Non renseigné / à vérifier</option><option value="absent">Pas de site internet</option><option value="present">Site internet existant</option></select><input aria-label="Adresse du site web facultative" inputMode="url" disabled={draft.websitePresence==='absent'} value={draft.website} onChange={e=>{setDraft({...draft,website:e.target.value,websitePresence:e.target.value.trim()?'present':'review'});setFormError('');}} placeholder={draft.websitePresence==='absent'?'Pas de site internet':'exemple.fr — facultatif'} /></label>
        <details className="prospect-create-extra form-span-3"><summary>Informations et adresse (facultatif)</summary><div className="form-grid">        <label className="form-span-3">Présentation / notes source <FieldHelp text="Conserve ici le texte brut récupéré. Les informations importantes sont ensuite rangées dans les champs structurés ci-dessous." /><textarea value={draft.activityDescription} onChange={(e) => setDraft({ ...draft, activityDescription: e.target.value })} placeholder="Texte brut, présentation du site, informations trouvées…" /></label>
        <label className="form-span-2">Services proposés <FieldHelp text="Sépare les services par des virgules. Ils seront enregistrés dans la fiche de connaissance entreprise." /><input value={draft.services} onChange={(e) => setDraft({ ...draft, services: e.target.value })} placeholder="Ex. gardiennage, rondes, intervention sur alarme" /></label>
        <label>Clientèles visées<input value={draft.customerSegments} onChange={(e) => setDraft({ ...draft, customerSegments: e.target.value })} placeholder="Ex. entreprises, collectivités" /></label>
        <label>Points différenciants<input value={draft.differentiators} onChange={(e) => setDraft({ ...draft, differentiators: e.target.value })} placeholder="Ex. 24/7, 3 agences" /></label>
        <label className="form-span-2">Points à évoquer pendant la prospection<input value={draft.talkingPoints} onChange={(e) => setDraft({ ...draft, talkingPoints: e.target.value })} placeholder="Ce que tu veux aborder pendant l’appel" /></label>
        <label className="form-span-3">Angle d’approche<input value={draft.approach} onChange={(e) => setDraft({ ...draft, approach: e.target.value })} placeholder="Ex. amélioration de la visibilité locale, refonte du site…" /></label>
        <label>Adresse<input value={draft.addressLine1} onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })} /></label><label>Complément<input value={draft.addressLine2} onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })} /></label><label>Code postal<input value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /></label><label>Ville<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label><label>Pays<input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label>
</div></details>
        <label>Prénom interlocuteur<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label><label>Nom interlocuteur<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label><label>Fonction<input value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} placeholder="Gérant, responsable…" /></label><label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label><label>Téléphone<input inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        <label>Origine <FieldHelp text="Une demande entrante reste Prospect jusqu’à l’acceptation du devis. Choisis la vraie origine pour adapter la qualification." /><select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as ProspectSource })}>{PROSPECT_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>{draft.source === 'other' && <label>Préciser l’origine<input value={draft.sourceDetail} onChange={(e) => setDraft({ ...draft, sourceDetail: e.target.value })} /></label>}
        <label>Niveau d’intérêt<select value={draft.temperature} onChange={(e) => setDraft({ ...draft, temperature: e.target.value as ProspectTemperature })}>{PROSPECT_TEMPERATURES.map((temperature) => <option key={temperature} value={temperature}>{TEMPERATURE_LABELS[temperature]}</option>)}</select></label><label>Valeur estimée (€)<input inputMode="decimal" value={draft.estimatedValueEuros} onChange={(e) => setDraft({ ...draft, estimatedValueEuros: e.target.value })} /></label>
        <label>Première action — date<input type="date" value={draft.firstActionDate} onChange={(e) => setDraft({ ...draft, firstActionDate: e.target.value })} /></label><label className="form-span-2">Première action<input value={draft.firstActionText} onChange={(e) => setDraft({ ...draft, firstActionText: e.target.value })} placeholder="Ex. rechercher le gérant, appeler l’accueil…" /></label>
      </div>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="form-actions"><button className="secondary-button" type="button" onClick={closeCreation}>Annuler</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Ajouter à l’annuaire'}</button></div></form></ProspectDialog>}
      {loading ? <div className="panel"><p className="muted">Chargement…</p></div> : <div className={selected && !deskProspect ? 'prospects-layout with-detail' : 'prospects-layout'} style={prospectSplitStyle}>
        <div className="panel table-panel prospect-directory-table-panel">
          <ConfiguredDataTable<ProspectSummary> fitAvailable defaultVisibleColumnIds={['identity','next_action','due','status','open']} scope={PROSPECT_DIRECTORY_VIEW} store={window.atoumweb.visualPreferences} rows={directoryFiltered} selectedId={selectedId} getId={p=>p.id} onSelect={p=>setSelectedId(p.id)} className="prospect-directory-table" caption="Annuaire prospects · source complète · tri sur tous les résultats filtrés" columns={[
            {id:'identity',label:'Entreprise',required:true,sortValue:p=>p.displayName,render:p=><div className="client-name-cell"><CrmIdentityAvatar organizationId={p.organizationId} contactId={p.contactId} name={p.displayName}/><div><strong>{p.displayName}</strong><small><span className={'prospect-temperature-dot '+(p.temperature??'neutral')} title={TEMPERATURE_LABELS[p.temperature??'neutral']} aria-label={'Niveau d’intérêt : '+TEMPERATURE_LABELS[p.temperature??'neutral']}/> {SOURCE_LABELS[p.source??'other']}</small></div></div>},
            {id:'next_action',label:'Prochaine action',sortValue:p=>nextOpenAction(actions.filter(a=>a.ownerId===p.id))?.title??null,render:p=>nextOpenAction(actions.filter(a=>a.ownerId===p.id))?.title||<span className="muted">Aucune action programmée</span>},
            {id:'due',label:'Échéance',sortValue:p=>nextOpenAction(actions.filter(a=>a.ownerId===p.id))?.dueAt??null,render:p=>{const a=nextOpenAction(actions.filter(a=>a.ownerId===p.id)),date=a?.dueAt;return <span className={date&&new Date(date).getTime()<Date.now()?'prospection-due-overdue':''}>{date?formatDate(date):'—'}</span>;}},
            {id:'industry',label:'Activité',sortValue:p=>p.organizationIndustry??null,render:p=>p.organizationIndustry||<span className="muted">À compléter</span>},
            {id:'city',label:'Ville',sortValue:p=>p.organizationCity??null,render:p=>p.organizationCity||'—'},
            {id:'contact',label:'Contact',sortValue:p=>p.secondaryLabel??null,render:p=>p.secondaryLabel||'À identifier'},
            {id:'status',label:'Statut',sortValue:p=>directoryStatus(p).label,render:p=><span className={'prospect-directory-status prospect-directory-status-'+directoryStatus(p).tone} title={p.stage==='new'&&!prospectReadiness(p).ready?'À compléter : '+prospectReadiness(p).missing.join(', '):directoryStatus(p).label}>{directoryStatus(p).label}</span>},
            {id:'open',label:'Ouvrir',fixedWidth:76,required:true,render:p=><button type="button" className="link-button pilot-icon-button" title={'Ouvrir '+p.displayName} aria-label={'Ouvrir '+p.displayName} onClick={e=>{e.stopPropagation();setSelectedId(p.id);}}><OperationIcon name="record-open"/></button>},
          ]}/>

        </div>
        {prospectSplitter}
        {selected && !deskProspect && detail}
      </div>}
    </>}

    {view === 'pipeline' && <>
      <div className="module-toolbar prospect-toolbar">
        <div><strong>{pipelineFiltered.length}</strong><span> opportunité{pipelineFiltered.length > 1 ? 's' : ''} commerciale{pipelineFiltered.length > 1 ? 's' : ''}{pipelineFilter === 'relaunch' ? ' à relancer' : pipelineFilter === 'overdue' ? ' en retard' : ''}</span></div>
        <div className="toolbar-controls">
          <button className={pipelineFilter === 'all' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setPipelineFilter('all')}>Tous · {pipelineActive.length}</button>
          <button className={pipelineFilter === 'relaunch' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setPipelineFilter('relaunch')}>À relancer · {relaunchCount}</button>
          <button className={pipelineFilter === 'overdue' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setPipelineFilter('overdue')}>En retard · {overdueCount}</button>
          <AppButton variant="quiet" aria-label="Actualiser les prospects" title="Actualiser les prospects" icon={<OperationIcon name="refresh"/>} onAction={refresh}/>
          <button className="secondary-button" onClick={() => setView('directory')}>Annuaire prospects</button>
        </div>
      </div>
      {loading ? <div className="panel"><p className="muted">Chargement…</p></div> : <div className="prospects-layout pipeline-layout"><div className="pipeline-flow"><div className="kanban-board" tabIndex={0} aria-label="Parcours commercial : six étapes">{PIPELINE_GROUPS.map((group) => {
        const groupProspects = pipelineProjection.columns.find((column) => column.id === group.id)?.prospects ?? [];
        const targetStage = group.stages[0];
        return <section className={`kanban-column pipeline-step-column ${targetStage && dropStage === targetStage ? 'drag-over' : ''}`} key={group.id} onDragOver={(e) => { if (targetStage && draggingId) e.preventDefault(); }} onDragEnter={() => { if (targetStage && draggingId) setDropStage(targetStage); }} onDrop={(e) => { if (!targetStage || !draggingId) return; e.preventDefault(); void handleGroupDrop(group.stages); }}><header><OperationIcon name={group.icon}/><div><small>Étape {group.step}</small><strong>{group.label}</strong></div><span>{groupProspects.length}</span></header><div className="kanban-cards stacked-cards">{groupProspects.map((prospect) => renderProspectCard(prospect))}{groupProspects.length === 0 && <div className="kanban-empty">Aucun dossier</div>}</div></section>;
      })}</div><div className="pipeline-conversion-history"><button className="secondary-button" type="button" onClick={()=>setView('conversions')}><OperationIcon name="check-circle"/>Clients acquis · {historicalConversions.length}</button></div></div></div>}
    </>}

    {(view === 'history' || view === 'conversions') && <>{view === 'conversions' && <div className="module-toolbar prospect-toolbar"><strong>Clients acquis · {historicalConversions.length}</strong><button className="secondary-button" type="button" onClick={() => setView('pipeline')}>Retour au parcours commercial</button></div>}<HistoryView prospects={historyVisible} search={historySearch} onSearch={setHistorySearch} onSelect={(item) => setSelectedId(item.id)} selected={selected && historyVisible.some((item) => item.id === selected.id) ? selected : null} activity={activity} onClose={() => {if(setSelectedId(null))requestAnimationFrame(()=>document.querySelector<HTMLElement>(`tr[data-record-id="${selected?.id}"]`)?.focus({preventScroll:true}));}} /></>}
    {deskProspect && <div className="prospect-desk-overlay" role="dialog" aria-modal="true" aria-label={`Fiche de travail ${deskProspect.displayName}`}><div className="prospect-desk-shell"><ProspectDetailV2 prospect={deskProspect} actions={actions.filter((item) => item.ownerId === deskProspect.id)} activity={selectedId === deskProspect.id ? activity : []} mode="desk" initialTab={deskStartTab} onRefresh={(message) => { void refresh(); if (message) onMessage(message); }} onClose={() => setDeskModeId(null)} onTemperature={(temperature) => void updateTemperature(deskProspect, temperature)} onStart={() => void startProspecting(deskProspect)} onLost={(code, reason) => void markLost(deskProspect, code, reason)} onArchive={() => void archive(deskProspect)} /></div></div>}
  </div>;
}

function ProspectWorkAccordion({ title, summary, defaultOpen = false, children, sectionId }: {
  title: string;
  sectionId?: string;
  summary?: string | null;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(defaultOpen);
  return <section id={sectionId} className={`prospect-work-accordion ${open ? 'open' : ''}`}>
    <button type="button" className="prospect-work-accordion-trigger" aria-expanded={open} onClick={(event) => {setMounted(true);setOpen((value) => !value);const button=event.currentTarget;requestAnimationFrame(()=>button.scrollIntoView({block:'nearest'}));}}>
      <span className="prospect-work-accordion-arrow" aria-hidden="true">{open ? '▾' : '▸'}</span>
      <span className="prospect-work-accordion-title">{title}</span>
      {summary && <span className="prospect-work-accordion-summary">{summary}</span>}
    </button>
    {mounted && <div className="prospect-work-accordion-body" hidden={!open} style={open?undefined:{display:'none'}}>{children}</div>}
  </section>;
}

function ProspectDetailV2(props:Parameters<typeof ProspectDetailV2Inner>[0]){return <UnsavedGroup name={'prospect:'+props.prospect.id+'/'+props.mode}><ProspectDetailV2Inner {...props}/></UnsavedGroup>;}
function ProspectDetailV2Inner({ prospect, actions, activity, mode, onRefresh, onClose, onOpenDesk, initialTab='commercial', onTemperature, onStart, onLost, onArchive }: {
  prospect: ProspectSummary;
  actions: CrmAction[];
  activity: ActivityEvent[];
  mode: 'panel' | 'desk';
  onRefresh: (message?: string) => void;
  onClose: () => void;
  onOpenDesk?: (tab?:'commercial'|'reference') => void;
  initialTab?:'commercial'|'reference';
  onTemperature: (value: ProspectTemperature) => void;
  onStart: () => void;
  onLost: (code: string, reason: string) => void;
  onArchive: () => void;
}) {
  const [lossOpen, setLossOpen] = useState(false);
  const [archiveOpen,setArchiveOpen]=useState(false);
  const [deskTab, applyDeskTab] = useState<'commercial' | 'reference'>(initialTab);
  function setDeskTab(tab:'commercial'|'reference'){if(tab!==deskTab)requestUnsavedExit(()=>applyDeskTab(tab),'prospect:'+prospect.id+'/'+mode);}
  const [identityFocus, setIdentityFocus] = useState<{ target: 'decision' | 'contact'; sequence: number } | null>(null);
  const [lossCode, setLossCode] = useState('no_response');
  const [lossOther, setLossOther] = useState('');
  const selectedLoss = LOSS_REASONS.find(([key]) => key === lossCode)?.[1] ?? 'Pas de réponse';
  const lossReason = lossCode === 'other' ? lossOther.trim() : selectedLoss;
  const quoteVisible = QUOTE_VISIBLE_STAGES.includes(prospect.stage ?? 'new');
  const openActions = actions.filter((item) => item.status === 'open');
  const nextAction = nextOpenAction(openActions);
  const readiness = prospectReadiness(prospect);
  function showSection(id:string){
    const section=document.getElementById(id);
    const group=section?.closest<HTMLDetailsElement>('details.prospect-section-group');if(group)group.open=true;
    const trigger=section?.querySelector<HTMLButtonElement>('.prospect-work-accordion-trigger');
    if(trigger?.getAttribute('aria-expanded')==='false')trigger.click();
    requestAnimationFrame(()=>{section?.scrollIntoView({block:'nearest'});trigger?.focus({preventScroll:true});});
  }


  if (mode === 'panel') {
    return <aside data-prospect-id={prospect.id} className={`panel prospect-detail-panel prospect-detail-v2 prospect-detail-panel prospect-temperature-${prospect.temperature ?? 'neutral'}`}>
      <div className="detail-panel-heading">
        <div className="prospect-detail-identity-head"><CrmIdentityAvatar organizationId={prospect.organizationId} contactId={prospect.contactId} name={prospect.displayName} size="large" /><div><span className="eyebrow">{prospect.stage === 'new' ? 'Fiche annuaire' : 'Fiche de travail'}</span><h2>{prospect.displayName}</h2><div className="prospect-header-meta"><span className="status-pill">{STAGE_LABELS[prospect.stage ?? 'new']}</span>{prospect.organizationIndustry && <span className="status-pill">{prospect.organizationIndustry}</span>}{prospect.organizationCity && <span className="status-pill">{prospect.organizationCity}</span>}</div></div></div>
        <div className="detail-heading-actions">{onOpenDesk && <button className="secondary-button open-desk-button" type="button" aria-label="Agrandir la fiche" title="Agrandir la fiche" onClick={()=>onOpenDesk?.()}><OperationIcon name="record-expand"/></button>}<button className="close-detail" type="button" aria-label="Fermer la fiche prospect" title="Fermer la fiche prospect" onClick={onClose}><OperationIcon name="close"/></button></div>
      </div>
      <div className="prospect-compact-scroll" tabIndex={0} role="region" aria-label="Contenu défilable de la fiche rapide">
        <section className="prospection-quick-next"><span><OperationIcon name="calendar"/>Prochaine action{nextAction?.dueAt&&<time>{formatDate(nextAction.dueAt)}{new Date(nextAction.dueAt).getTime()<Date.now()?' · En retard':''}</time>}</span><h3>{nextAction?.title||'Aucune action programmée'}</h3>{onOpenDesk&&<button type="button" className="primary-button" onClick={()=>onOpenDesk?.()}>{nextAction?'Consulter l’action':'Programmer une action'}<span aria-hidden="true">›</span></button>}</section>
        <section className="prospection-quick-contact"><h3>Contact principal</h3><strong>{prospect.secondaryLabel||'Contact à identifier'}</strong><p>{prospect.organizationIndustry||'Activité à préciser'}{prospect.organizationCity?' · '+prospect.organizationCity:''}</p></section>
        <section className="prospection-quick-activity"><h3>Dernière activité</h3>{activity.length?<><p>{humanActivity([...activity].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0].summary)}</p><small>{formatDate([...activity].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0].createdAt)}</small></>:<p>Aucune activité enregistrée</p>}</section>
        <details className="prospection-quick-more"><summary>Informations et préparation</summary>
        {prospect.stage === 'new' && <div className={`prospect-readiness-card ${readiness.ready ? 'ready' : 'incomplete'}`}><div><span>Préparation</span><strong>{readiness.ready ? 'Prêt pour démarchage' : 'À compléter avant ou pendant le premier contact'}</strong>{!readiness.ready && <small>Manque : {readiness.missing.join(', ')}</small>}</div><button className="primary-button" type="button" onClick={onStart}>Démarrer la prospection</button></div>}
        {prospect.stage !== 'new' && <section className="prospect-commercial-priority">
          <h3>Priorité commerciale</h3>
          <div className="reference-summary-grid">
            <div><span>Interlocuteur</span><strong>{prospect.secondaryLabel || 'À préciser'}</strong></div>
            <div><span>Décideur</span><strong>{prospect.decisionMakerName || prospect.decisionMakerDetails || 'À qualifier'}</strong></div>
            <div><span>Besoin</span><strong>{prospect.primaryNeed || prospect.projectSummary || 'À préciser'}</strong></div>
            <div><span>Prochaine action</span><strong>{nextAction?.title || 'À programmer'}</strong>{nextAction?.dueAt && <small>{formatDate(nextAction.dueAt)}</small>}</div>
          </div>
        </section>}
        <ProspectReferenceSummary prospect={prospect} />
        </details><details className="prospection-quick-more"><summary>Associations</summary><ProspectRelatedRecords prospect={prospect}/></details>
        <div className="prospect-compact-actions">
          {prospect.stage !== 'new' && <button type="button" className="secondary-button" title="Ouvrir la référence prospect" aria-label="Ouvrir la référence prospect" onClick={()=>onOpenDesk?.('reference')}><OperationIcon name="external-link"/><span>Référence</span></button>}
          {onOpenDesk && <button type="button" className="primary-button" onClick={()=>onOpenDesk?.()}>Ouvrir la fiche de travail</button>}
        </div>
      </div>
    </aside>;
  }

  return <aside data-prospect-composition="balanced" className={`panel prospect-detail-panel prospect-detail-v2 prospect-detail-desk prospect-temperature-${prospect.temperature ?? 'neutral'}`}>
<div className="prospect-workspace">
    <header className="prospect-workspace-header">
      <div className="prospect-detail-identity-head"><CrmIdentityAvatar organizationId={prospect.organizationId} contactId={prospect.contactId} name={prospect.displayName} size="large"/><div><h2>{prospect.displayName}</h2><p>{[prospect.organizationIndustry,prospect.organizationCity].filter(Boolean).join(' · ') || 'Informations entreprise à compléter'}</p></div></div>
      <div className="prospect-workspace-tools">
        <details className="prospect-workspace-identity"><summary>Identité et logo</summary><div><p>{prospect.organizationWebsite||prospect.existingUrl?<ProspectValue value={(prospect.organizationWebsite||prospect.existingUrl)!} kind="web"/>:'Site à renseigner'}</p>{prospect.source&&<p>{SOURCE_LABELS[prospect.source]}{prospect.source==='other'&&prospect.sourceDetail?' · '+prospect.sourceDetail:''}</p>}<CrmIdentityAssetEditor organizationId={prospect.organizationId} contactId={prospect.contactId} onMessage={onRefresh}/><button type="button" className="secondary-button" onClick={()=>void window.atoumweb.app.openProspectReferenceWindow(prospect.id)}><OperationIcon name="external-link"/>Référence dans une fenêtre</button></div></details>
        <details className="prospect-workspace-associations"><summary><OperationIcon name="folder"/>Associations</summary><div><ProspectRelatedRecords prospect={prospect}/></div></details>
        <button className="close-detail" type="button" aria-label="Fermer la fiche prospect" title="Fermer la fiche prospect" onClick={onClose}><OperationIcon name="close"/></button>
      </div>
    </header>
    <div className="prospect-desk-tabs" role="tablist" aria-label="Fiche prospect">
      <button type="button" className={deskTab === 'commercial' ? 'active' : ''} onClick={() => setDeskTab('commercial')}><OperationIcon name="file-text"/>Fiche de travail</button>
      <button type="button" className={deskTab === 'reference' ? 'active' : ''} onClick={() => setDeskTab('reference')}><OperationIcon name="contact"/>Référence prospect</button>
    </div>

    <div className="prospect-desk-content" tabIndex={0} role="region" aria-label="Contenu de la fiche prospect">
      {deskTab === 'reference' ? <>
        <ProspectResearchPanel prospect={prospect} defaultOpen browseFirst onChanged={onRefresh}/>
        <ProspectWorkAccordion title="Identité et coordonnées" summary="Modifier les informations entreprise et contacts">
          <ProspectIdentityPanel directoryLinks={false} prospect={prospect} focusRequest={identityFocus} onSaved={()=>onRefresh('Informations du prospect mises à jour.')}/>
        </ProspectWorkAccordion>
      </> : <>
        <section className="prospect-focus-summary" aria-label="Synthèse commerciale">
          <div className="prospect-temperature-control"><label>Niveau d’intérêt<select value={prospect.temperature ?? 'neutral'} onChange={(event) => onTemperature(event.target.value as ProspectTemperature)}>{PROSPECT_TEMPERATURES.map((value) => <option key={value} value={value}>{TEMPERATURE_LABELS[value]}</option>)}</select></label></div>
          <div className="prospect-focus-stage"><span>Situation commerciale</span><strong>{STAGE_LABELS[prospect.stage ?? 'new']}</strong></div>
          <div className="prospect-focus-next"><span className="prospect-next-label"><OperationIcon name="clock" />Prochaine action{nextAction?.dueAt ? ` · ${formatDate(nextAction.dueAt)}${new Date(nextAction.dueAt).getTime()<Date.now()?' · En retard':''}` : ''}</span><strong>{nextAction?.title || 'À programmer'}</strong><button className="secondary-button" type="button" onClick={()=>showSection(`prospect-followup-section-${prospect.id}`)}>{nextAction?'Consulter la relance':'Programmer une relance'}</button></div>
        </section>
        {prospect.stage === 'need_identified' && !prospect.primaryNeed && <div className="prospect-missing-actions" aria-label="Informations à compléter"><div className="missing-action"><span>Le besoin reste à préciser.</span><button type="button" className="secondary-button" onClick={()=>showSection(`prospect-need-section-${prospect.id}`)}>Renseigner le besoin</button></div></div>}
        {prospect.stage === 'new' && <button className="primary-button start-qualification-button" onClick={onStart}>Démarrer la prospection</button>}
        <section className="prospect-immediate-summary" aria-label="Résumé immédiat"><div><span>Besoin / projet</span><p>{prospect.primaryNeed||prospect.projectSummary||'Besoin à préciser'}</p></div><div><span>Contact principal</span><strong>{prospect.secondaryLabel||'Contact à identifier'}</strong></div><div><span>Dernière activité</span><p>{activity.length?humanActivity([...activity].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0].summary):'Aucune activité enregistrée'}</p></div></section>
        <details className="prospect-section-group" onToggle={e=>{if(e.currentTarget.open){const summary=e.currentTarget.querySelector('summary');requestAnimationFrame(()=>summary?.scrollIntoView({block:'start'}));}}} data-group="identity"><summary>Entreprise et contacts<OperationIcon name="chevron-down"/></summary><div className="prospect-section-group-body">
          <div id={`prospect-identity-${prospect.id}`} className="prospect-target-section"><ProspectIdentityPanel directoryLinks={false} prospect={prospect} focusRequest={identityFocus} onSaved={()=>onRefresh('Informations du prospect mises à jour.')}/></div>
        </div></details>

        <details className="prospect-section-group" onToggle={e=>{if(e.currentTarget.open){const summary=e.currentTarget.querySelector('summary');requestAnimationFrame(()=>summary?.scrollIntoView({block:'start'}));}}} data-group="needs"><summary>Besoins et qualification<OperationIcon name="chevron-down"/></summary><div className="prospect-section-group-body"><div className="reference-summary-grid"><div><span>Besoin</span><strong>{prospect.primaryNeed||prospect.projectSummary||'À préciser'}</strong></div><div><span>Décideur</span><strong>{prospect.decisionMakerName||prospect.decisionMakerDetails||'À qualifier'}</strong></div></div>
        {prospect.stage === 'qualifying' && <ProspectWorkAccordion title="Qualification" summary={prospect.decisionMakerName || prospect.decisionMakerDetails || 'Décideur à préciser'} defaultOpen>
          <ProspectQualificationPanelV2 prospect={prospect} onSaved={onRefresh} onGoTo={(target) => { if (target === 'decision' || target === 'contact') {showSection(`prospect-identity-${prospect.id}`);setIdentityFocus({ target, sequence: Date.now() });} else document.getElementById(`prospect-${target}-${prospect.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
        </ProspectWorkAccordion>}

        {prospect.stage === 'need_identified' && <ProspectWorkAccordion sectionId={`prospect-need-section-${prospect.id}`} title="Besoin / projet" summary={prospect.primaryNeed || prospect.projectSummary || 'Besoin à préciser'} defaultOpen>
          <div id={`prospect-need-${prospect.id}`} className="prospect-target-section"><ProspectNeedsPanel prospectId={prospect.id} onChanged={() => onRefresh()} /></div>
        </ProspectWorkAccordion>}

        {prospect.stage==='need_identified'&&<ProspectPreQuoteReviewPanel prospect={prospect} onChanged={onRefresh}/>}

        </div></details>
        <details className="prospect-section-group" onToggle={e=>{if(e.currentTarget.open){const summary=e.currentTarget.querySelector('summary');requestAnimationFrame(()=>summary?.scrollIntoView({block:'start'}));}}} data-group="activities"><summary>Devis et activités<OperationIcon name="chevron-down"/></summary><div className="prospect-section-group-body">
        {quoteVisible && <ProspectWorkAccordion title="Devis" summary="Documents liés au dossier" defaultOpen={['quote_to_prepare','quote_to_send','quote_sent','follow_up','negotiation'].includes(prospect.stage ?? '')}>
          <ProspectQuotePanel prospect={prospect} onChanged={onRefresh} />
        </ProspectWorkAccordion>}

        <section id={`prospect-followup-section-${prospect.id}`} className="prospect-followup-direct"><div id={`prospect-followup-${prospect.id}`}><ProspectActionsPanel prospect={prospect} actions={actions} onChanged={onRefresh} showJournal={false}/></div></section>

        <ProspectWorkAccordion title="Clôture du dossier" summary={prospect.stage === 'won' ? 'Gagné' : prospect.stage === 'lost' ? 'Perdu' : 'Dossier en cours'}>
          <div className="detail-actions"><button className="secondary-button danger-outline" onClick={() => setLossOpen((value) => !value)}>Classer comme perdu</button><button className="secondary-button" onClick={()=>setArchiveOpen(true)}>Archiver le prospect</button></div>
          {archiveOpen&&<div className="inline-editor prospect-archive-confirmation"><p>Archiver ce prospect ? Il restera consultable dans l’historique.</p><button className="secondary-button" type="button" onClick={()=>setArchiveOpen(false)}>Annuler</button><button className="primary-button" type="button" onClick={onArchive}>Confirmer l’archivage</button></div>}{lossOpen && <div className="inline-editor prospect-loss-editor"><strong>Classer le prospect comme perdu</strong><label>Raison<select value={lossCode} onChange={(event) => setLossCode(event.target.value)}>{LOSS_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{lossCode === 'other' && <label>Préciser<input value={lossOther} onChange={(event) => setLossOther(event.target.value)} /></label>}<div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setLossOpen(false)}>Annuler</button><button className="secondary-button danger-outline" type="button" disabled={!lossReason} onClick={() => onLost(lossCode, lossReason)}>Confirmer Perdu</button></div></div>}
        </ProspectWorkAccordion>

        <ProspectWorkAccordion title="Historique du dossier" summary={`${activity.length} événement${activity.length > 1 ? 's' : ''}`}>
          <div className="activity-preview"><strong>Journal du dossier</strong>{activity.slice(0, 20).map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}{activity.length === 0 && <p className="muted">Aucune activité.</p>}</div>
        </ProspectWorkAccordion>
        </div></details>
      </>}
    </div>
</div>
  </aside>;
}

function HistoryView({ prospects, search, onSearch, onSelect, selected, activity, onClose }: { prospects: ProspectSummary[]; search: string; onSearch: (value: string) => void; onSelect: (item: ProspectSummary) => void; selected: ProspectSummary | null; activity: ActivityEvent[]; onClose: () => void }) {
  return <div className="history-view-stack prospect-history-view"><div className="prospect-history-toolbar"><strong>{prospects.length} dossier{prospects.length>1?'s':''}</strong><input aria-label="Rechercher l’historique" value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher une entreprise…"/></div><div className={'prospect-history-layout'+(selected?' has-selection':'')}><div className="prospect-history-table-scroll" tabIndex={0} role="region" aria-label="Dossiers historiques"><table className="prospect-history-table"><thead><tr><th>Entreprise</th><th>Résultat</th><th>Besoin</th><th>Date</th><th>Fiche</th></tr></thead><tbody>{prospects.map(item=><tr key={item.id} aria-selected={selected?.id===item.id}><td><strong>{item.displayName}</strong>{item.secondaryLabel&&<small>{item.secondaryLabel}</small>}</td><td>{historyOutcome(item).label}</td><td>{item.primaryNeed||'—'}</td><td>{formatDate(item.lostAt||item.wonAt||item.archivedAt)}</td><td><button type="button" className="secondary-button" onClick={()=>onSelect(item)}>Consulter</button></td></tr>)}</tbody></table>{!prospects.length&&<p>Aucun dossier pour ces critères.</p>}</div>{selected&&<aside className="prospect-history-detail"><header><h2>{selected.displayName}</h2><button type="button" className="secondary-button" aria-label="Fermer le détail historique" onClick={onClose}><OperationIcon name="close"/></button></header><div className="prospect-history-detail-body" tabIndex={0}><dl><dt>Résultat</dt><dd>{historyOutcome(selected).label}</dd><dt>Besoin</dt><dd>{selected.primaryNeed||'Non renseigné'}</dd>{selected.estimatedValueCents!=null&&<><dt>Valeur estimée</dt><dd>{(selected.estimatedValueCents/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</dd></>}{selected.lostReason&&<><dt>Motif</dt><dd>{selected.lostReason}</dd></>}</dl>{selected.clientAccountId&&<button type="button" className="primary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'client',entityId:selected.clientAccountId,title:selected.displayName}}))}>Ouvrir la fiche Client</button>}<h3>Journal</h3>{activity.map(event=><div className="prospect-history-event" key={event.id}><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div>)}{!activity.length&&<p>Aucune activité enregistrée.</p>}</div></aside>}</div></div>;

}

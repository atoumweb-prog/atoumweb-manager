import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import {QUOTE_LIST_VIEW} from '../../shared/realTableSchemas';
import {OperationIcon} from '../operations/OperationIcon';
import './commercial-visual-foundation.css';
import {quoteWizardPriceCents} from './quoteWizardPrice';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import {UnsavedGroup,useUnsavedDraft,requestUnsavedExit,unsavedRegistry} from '../unsaved/unsaved';
import { QuoteFinalizationPanel } from './QuoteFinalizationPanel';
import { QuoteOperationalSalesPanel } from './QuoteOperationalSalesPanel';
import { QuoteAbbyPanel } from './QuoteAbbyPanel';
import { QuoteLineParametersPanel } from './QuoteLineParametersPanel';
import {QuoteDraftLines,type DraftLine} from '../workflow/QuoteDraftLines';
import { QuoteProjectPanel, QuoteConditions } from '../workflow/QuoteWorkflow';
import { canAccessQuoteProject } from '../../shared/quoteProjectEligibility';
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchStatisticsDrilldown, type StatisticsDrilldownRoute } from '../../shared/statisticsDrilldown';
import type { CatalogItemSummary, QuoteDetail, QuoteLineInput, QuoteStatus, QuoteSummary } from '../../shared/commercial';
import type { ClientSummary, ProspectSummary } from '../../shared/crm';
import { QuoteClientPreview } from './QuoteClientPreview';
import { QuoteContractDocumentPanel } from './QuoteContractDocumentPanel';
import { QuoteOfferOptionsPanel } from './QuoteOfferOptionsPanel';
import { QuoteLineEditor } from './QuoteLineEditor';
import { catalogMatchesQuery, catalogIsSelectable } from '../../shared/catalogDiscovery';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon', sent: 'Envoyé', viewed: 'Vu', accepted: 'Accepté', refused: 'Refusé', expired: 'Expiré', cancelled: 'Annulé',
};

interface WizardDraft {
  ownerKind: 'prospect' | 'client'; ownerId: string; subject: string; needSummary: string; catalogVersionId: string; customLabel: string; customPriceEuros: string; validityDays: string; depositPercent: string; estimatedDelay: string; contractAudience: 'professional' | 'consumer';
}

const EMPTY_WIZARD: WizardDraft = {
  ownerKind: 'prospect', ownerId: '', subject: '', needSummary: '', catalogVersionId: '', customLabel: '', customPriceEuros: '', validityDays: '30', depositPercent: '30', estimatedDelay: '', contractAudience: 'professional',
};

function eurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
}

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function QuotesPage({ onEntityReady, onMessage, initialId, initialRequest, statisticsDrilldown, onClearStatisticsDrilldown, returnProjectId, embedded=false, onCloseEmbedded }: {
  embedded?:boolean; onCloseEmbedded?:()=>void;
  onMessage: (message: string) => void; initialId?: string | null; initialRequest?: number; onEntityReady?: EntityReady;
  returnProjectId?: string | null; statisticsDrilldown?: StatisticsDrilldownRoute | null; onClearStatisticsDrilldown?: () => void;
}) {
  const [draftLines,setDraftLines]=useState<DraftLine[]>([]);
  const [wizardTerms,setWizardTerms]=useState('');
  const [catalogPrice,setCatalogPrice]=useState('');
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnce=useRef(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [detail, applyDetail] = useState<QuoteDetail | null>(null);
  const detailRequest=useRef(0);const refreshRequest=useRef(0);const selectedRef=useRef(selectedId);selectedRef.current=selectedId;
  function setDetail(value:QuoteDetail|null){detailRequest.current++;applyDetail(value);}
  useEffect(()=>()=>{detailRequest.current++;refreshRequest.current++;},[]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizard, setWizard] = useState<WizardDraft>(EMPTY_WIZARD);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const quoteCreateInFlight = useRef(false); // verrou immédiat, avant le prochain rendu React.
  const versionActionInFlight = useRef(false); // Duplication et révision exclusives dans le même panneau.
  const [versionBusy, setVersionBusy] = useState(false);
  // La liste et la fiche doivent partager le même verrou d'acceptation par devis.
  const acceptanceInFlight = useRef(new Set<string>());
  const [acceptanceBusyIds, setAcceptanceBusyIds] = useState<string[]>([]);
  function beginAcceptance(id: string): boolean {
    if (acceptanceInFlight.current.has(id)) return false;
    acceptanceInFlight.current.add(id);
    setAcceptanceBusyIds(ids => [...ids, id]);
    return true;
  }
  function endAcceptance(id: string): void {
    acceptanceInFlight.current.delete(id);
    setAcceptanceBusyIds(ids => ids.filter(value => value !== id));
  }
  const [pendingQuoteMutations, setPendingQuoteMutations] = useState(0);
  async function trackQuoteMutation<T>(action: () => Promise<T>): Promise<T> {
    setPendingQuoteMutations(count => count + 1);
    try { return await action(); }
    finally { setPendingQuoteMutations(count => count - 1); }
  }
  const [demoMode, setDemoMode] = useState(false);
  const [developmentMode,setDevelopmentMode]=useState(false);
  useEffect(()=>{void window.atoumweb.app.getBootstrap().then(state=>setDevelopmentMode(/([\\/])Validation-MSI$/i.test(state.workspacePath)));},[]);
  const [catalogToAdd, setCatalogToAdd] = useState('');
  const [catalogSearch,setCatalogSearch]=useState('');
  const visibleCatalog=catalog.filter(item=>catalogMatchesQuery(item,catalogSearch,'selection'));
  const catalogueLabel=(item:CatalogItemSummary)=>`${item.canonicalCode||'Sans code'} · ${item.name} · ${item.currentVersion?.familyCode||item.category||'Autre'} · v${item.currentVersion?.versionNumber} · ${item.currentVersion?.priceCents==null?'Sur devis':money(item.currentVersion.priceCents)}`;
  const [customLabel, setCustomLabel] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [editingLineId, applyEditingLineId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const quoteGroup='quote:'+detail?.id;
  useUnsavedDraft('Nouveau devis',{wizard,draftLines,wizardTerms,catalogPrice},{group:'quote:create',ready:showWizard||wizard.ownerId!==''||wizard.subject!==''||draftLines.length>0||wizardTerms!=='',pending:saving,discard:()=>{setWizard(EMPTY_WIZARD);setDraftLines([]);setWizardTerms('');setCatalogPrice('');setShowWizard(false);setWizardStep(1);}});
  useUnsavedDraft('Ligne libre à ajouter',{customLabel,customPrice},{group:quoteGroup,ready:!!detail,pending:saving,discard:()=>{setCustomLabel('');setCustomPrice('');}});
  useUnsavedDraft('Enregistrement du devis', null, {group:quoteGroup,dirty:false,pending:pendingQuoteMutations>0});
  useUnsavedDraft('Prestation à ajouter',{catalogToAdd,catalogPrice},{group:quoteGroup,ready:!!detail&&!showWizard,pending:saving,discard:()=>{setCatalogToAdd('');setCatalogPrice('');}});
  function setEditingLineId(id:string|null){if(editingLineId===id)return;if(editingLineId)requestUnsavedExit(()=>applyEditingLineId(id),quoteGroup+'/line:'+editingLineId+'/editor');else applyEditingLineId(id);}
  const detailPanelRef = useRef<HTMLElement | null>(null);
  useSearchTargetConfirmation('quote',detail?.id,loading,onEntityReady);


  async function refresh(): Promise<void> {
    const request=++refreshRequest.current;
    const sequence=detailRequest.current;const selectedAtStart=selectedRef.current;
    if(!loadedOnce.current)setLoading(true);
    try {
      const [nextQuotes, nextProspects, nextClients, nextCatalog] = await Promise.all([
        window.atoumweb.quotes.list(), window.atoumweb.crm.prospects.list(), window.atoumweb.crm.clients.list(), window.atoumweb.catalog.list({ status: 'active' }),
      ]);
      // Deux actualisations peuvent se terminer dans l'ordre inverse : seule la plus
      // récente peut remplacer les listes, même si l'ancien appel s'est bien terminé.
      if(request!==refreshRequest.current)return;
      setQuotes(nextQuotes);
      setProspects(nextProspects.filter((prospect) => !prospect.clientAccountId && prospect.stage !== 'won' && prospect.stage !== 'lost'));
      setClients(nextClients);
      setCatalog(nextCatalog.filter(catalogIsSelectable));
      if(selectedAtStart&&nextQuotes.some(q=>q.id===selectedAtStart)){
        const next=await window.atoumweb.quotes.get(selectedAtStart);
        if(request===refreshRequest.current&&sequence===detailRequest.current&&selectedRef.current===selectedAtStart)applyDetail(next);
      }
    } catch (error) {
      // Un échec obsolète ne doit pas effacer un rafraîchissement plus récent.
      if(request===refreshRequest.current&&sequence===detailRequest.current&&selectedRef.current===selectedAtStart)
        onMessage(error instanceof Error ? error.message : 'Actualisation des devis impossible.');
    } finally {
      if(request===refreshRequest.current){loadedOnce.current=true;setLoading(false);}
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(()=>{let current=true;if(initialId)void openQuote(initialId).catch((error:unknown)=>{if(!current)return;onEntityReady?.('quote',initialId,error instanceof Error?error.message:'Devis introuvable.');onMessage(error instanceof Error?error.message:'Devis introuvable.');});return()=>{current=false;};},[initialId,initialRequest]);

  useEffect(() => {
    if (embedded || !detail || previewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeQuoteDetail();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [detail?.id, previewOpen]);

  useEffect(() => {
    if (embedded || !detail || previewOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || detailPanelRef.current?.contains(target)) return;
      if(target instanceof Element&&target.closest('.quote-detail-backdrop'))return;
      if(target instanceof Element&&target.closest('button,a,input,select,textarea,tr'))return;
      closeQuoteDetail();
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [detail?.id, previewOpen]);

  const drilldown = statisticsDrilldown?.kind === 'signed' || statisticsDrilldown?.kind === 'decisions' ? statisticsDrilldown : null;
  const drilldownMatch = drilldown ? matchStatisticsDrilldown(quotes, drilldown, quote => drilldown.kind === 'decisions' ? ['accepted', 'refused', 'expired'].includes(quote.status) : quote.status === 'accepted') : null;
  const filtered = useMemo(() => {
    if (drilldown) return matchStatisticsDrilldown(quotes, drilldown, quote => drilldown.kind === 'decisions' ? ['accepted', 'refused', 'expired'].includes(quote.status) : quote.status === 'accepted').rows;
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return quotes.filter((quote) => {
      if (statusFilter !== 'all' && quote.status !== statusFilter) return false;
      if (!needle) return true;
      return [quote.number, quote.subject, quote.ownerLabel].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [quotes, query, statusFilter, drilldown]);

  const ownerOptions = wizard.ownerKind === 'prospect'
    ? prospects.map((prospect) => ({ id: prospect.id, label: prospect.displayName }))
    : clients.map((client) => ({ id: client.id, label: client.displayName }));

  function closeQuoteDetail(): void {requestUnsavedExit(closeQuoteDetailDirect,quoteGroup);}
  function closeQuoteDetailDirect(): void {
    if(embedded){onCloseEmbedded?.();return;}
    detailRequest.current++;
    setDetail(null);
    selectedRef.current=null;
    setSelectedId(null);
    applyEditingLineId(null);
    setPreviewOpen(false);
    setDetailExpanded(false);
  }

  async function openQuote(id: string): Promise<void> {
    if(selectedRef.current===id)return;
    if(!requestUnsavedExit(()=>{},quoteGroup))return;
    const sequence=++detailRequest.current;
    selectedRef.current=id;
    applyDetail(null); // Ne pas afficher l'ancien devis pendant le chargement du suivant.
    setSelectedId(id); applyEditingLineId(null); setPreviewOpen(false); setDetailExpanded(false);
    try {
      const next=await window.atoumweb.quotes.get(id);
      if(sequence===detailRequest.current&&selectedRef.current===id)applyDetail(next);
    } catch (error) {
      if(sequence!==detailRequest.current||selectedRef.current!==id)return; // Une erreur obsolète ne doit pas invalider le devis courant.
      selectedRef.current=null;setSelectedId(null);applyDetail(null);
      throw error;
    }
  }

  function validateStep(step: number): boolean {
    setWizardError(null);
    if (step === 1 && !wizard.ownerId) { setWizardError('Choisis un Prospect ou un Client.'); return false; }
    if (step === 2 && !wizard.subject.trim()) { setWizardError('Renseigne l’objet du devis.'); return false; }
    if (step === 5) {
      const validity = Number(wizard.validityDays); const deposit = Number(wizard.depositPercent);
      if (!Number.isInteger(validity) || validity <= 0) { setWizardError('Validité invalide.'); return false; }
      if (!Number.isInteger(deposit) || deposit < 0 || deposit > 100) { setWizardError('Acompte invalide.'); return false; }
    }
    return true;
  }

  async function fillTestDossier():Promise<void> {
    try{
      const organization=await window.atoumweb.crm.organizations.create({name:'TEST — recette commerciale'});
      const owner=await window.atoumweb.crm.prospects.create({organizationId:organization.id,primaryNeed:'TEST — faux dossier de recette'});
      const offer=catalog.find(i=>i.canonicalCode==='AW-WEB-VITRINE'),article=catalog.find(i=>i.canonicalCode==='AW-CONT-ART-SEO');
      await refresh();setDemoMode(false);setCatalogPrice('');
      setWizard({...EMPTY_WIZARD,ownerKind:'prospect',ownerId:owner.id,subject:'TEST — Site vitrine',needSummary:'TEST — Site vitrine et Article SEO',catalogVersionId:offer?.currentVersion?.id||''});
      setDraftLines(article?.currentVersion?[{versionId:article.currentVersion.id,label:article.name,quantity:'1',price:String((article.currentVersion.priceCents||0)/100)}]:[]);
    }catch(e){setWizardError(e instanceof Error?e.message:String(e));}
  }

  function nextWizard(): void { if (validateStep(wizardStep)) setWizardStep((step) => Math.min(6, step + 1)); }

  async function createQuote(): Promise<void> {
    if (quoteCreateInFlight.current) return;
    if (!validateStep(5) || !wizard.ownerId || !wizard.subject.trim()) return;
    quoteCreateInFlight.current = true;
    setSaving(true); setWizardError(null);
    let demoBatch: string | null = null;
    try {
      if (demoMode) demoBatch = await window.atoumweb.workflow.beginDemoCapture('devis saisi manuellement');
      const lines: Array<{catalogVersionId?:string;input:QuoteLineInput}> = draftLines.map(l=>{
        const cents=eurosToCents(l.price);const quantity=Math.round(Number(l.quantity)*1000);
        if(cents==null || !l.label.trim() || !Number.isFinite(quantity) || quantity<=0)throw new Error('Complète le libellé, le prix et la quantité de chaque ligne.');
        return {catalogVersionId:l.versionId||undefined,input:{label:l.label,quantityMilli:quantity,proposedUnitPriceCents:cents}};
      });
      if(wizard.catalogVersionId){const item=catalog.find(i=>i.currentVersion?.id===wizard.catalogVersionId)!;const proposed=quoteWizardPriceCents(catalogPrice,item.currentVersion?.priceCents);if(proposed==null&&item.currentVersion?.priceMode!=='free')throw new Error('Renseigne le prix proposé pour cette prestation sur devis.');lines.unshift({catalogVersionId:wizard.catalogVersionId,input:{label:item.name,proposedUnitPriceCents:proposed??0}});}
      const created = await window.atoumweb.quotes.createWithLines({
        prospectId: wizard.ownerKind === 'prospect' ? wizard.ownerId : null,
        clientAccountId: wizard.ownerKind === 'client' ? wizard.ownerId : null,
        subject: wizard.subject.trim(), needSummary: wizard.needSummary.trim() || null,
        validityDays: Number(wizard.validityDays), depositPercent: Number(wizard.depositPercent), estimatedDelay: wizard.estimatedDelay.trim() || null, contractAudience: wizard.contractAudience, specialTerms:wizardTerms||null,
      },lines);
      setDraftLines([]);setWizardTerms('');setDemoMode(false);
      setWizard(EMPTY_WIZARD); setWizardStep(1); setShowWizard(false); await refresh(); await openQuote(created.id); onMessage(`Devis ${created.number} créé.`);
    } catch (error) { setWizardError(error instanceof Error ? error.message : 'Impossible de créer le devis.'); }
    finally { try { if (demoBatch) await window.atoumweb.workflow.endDemoCapture(demoBatch); }
      finally { quoteCreateInFlight.current = false; setSaving(false); } }
  }

  async function addCatalogLine(): Promise<void> {
    if (!detail || !catalogToAdd) return;
    try { const next = await trackQuoteMutation(()=>window.atoumweb.quotes.addCatalogLine(detail.id, catalogToAdd, {proposedUnitPriceCents:eurosToCents(catalogPrice)??undefined})); setCatalogToAdd(''); setCatalogPrice(''); setDetail(next); await refresh(); onMessage('Prestation catalogue ajoutée au devis avec snapshot figé.'); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter la prestation.'); }
  }

  async function addCustomLine(): Promise<void> {
    if (!detail || !customLabel.trim()) return;
    try {
      const cents = eurosToCents(customPrice); if (cents == null) throw new Error('Renseigne un prix.');
      const next = await trackQuoteMutation(()=>window.atoumweb.quotes.addCustomLine(detail.id, { label: customLabel.trim(), proposedUnitPriceCents: cents, catalogUnitPriceCents: cents }));
      setCustomLabel(''); setCustomPrice(''); setDetail(next); await refresh();
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter la ligne.'); }
  }

  async function saveLine(lineId: string, input: QuoteLineInput): Promise<void> {
    try { const next = await trackQuoteMutation(()=>window.atoumweb.quotes.updateLine(lineId, input)); setDetail(next); applyEditingLineId(null); await refresh(); onMessage('Ligne du devis mise à jour. Les totaux ont été recalculés.'); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier la ligne.'); throw error; }
  }

  async function removeLine(id: string): Promise<void> {
    if (!detail) return;
    if (!requestUnsavedExit(()=>{},quoteGroup+'/line:'+id)) return;
    try { setDetail(await trackQuoteMutation(()=>window.atoumweb.quotes.removeLine(id))); if(editingLineId===id)applyEditingLineId(null); await refresh(); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de supprimer la ligne.'); }
  }

  async function validateQuoteFromList(quote: QuoteSummary): Promise<void> {
    if (!['sent', 'viewed'].includes(quote.status) || acceptanceInFlight.current.has(quote.id)) return;
    // Une acceptation depuis la liste ne doit pas ignorer un brouillon de la même fiche.
    if (!requestUnsavedExit(() => {}, 'quote:' + quote.id)) return;
    if (!beginAcceptance(quote.id)) return;
    try {
      if (!window.confirm(`Confirmer que le devis ${quote.number} a été accepté / signé dans Abby ?\n\nVérifie le bon devis, sa révision et l’acceptation réelle dans Abby avant de confirmer. Cette opération entraîne le rattachement ou la conversion Client, le gel contractuel, la confirmation du Projet et peut déclencher des prestations opérationnelles.`)) return;
      await trackQuoteMutation(() => window.atoumweb.quotes.accept(quote.id));
      await refresh();
      onMessage(quote.prospectId
        ? 'Acceptation Abby confirmée : le devis est accepté et le dossier Client a été mis à jour.'
        : 'Acceptation Abby confirmée.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Confirmation de l’acceptation Abby impossible.');
    } finally {
      endAcceptance(quote.id);
    }
  }

  async function negotiateQuote(quote: QuoteSummary): Promise<void> {
    if (!quote.prospectId || !['sent', 'viewed'].includes(quote.status)) return;
    try {
      await window.atoumweb.crm.prospects.changeStage(quote.prospectId, 'negotiation');
      await refresh();
      onMessage('Le prospect passe en « Négociation ». Le devis envoyé reste conservé.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Passage en négociation impossible.');
    }
  }

  async function transition(action: 'resumed' | 'finalized' | 'sent' | 'viewed' | 'accepted' | 'refused' | 'expired' | 'duplicate',canonicalReview=false): Promise<void> {
    if (!detail) return;
    const createsVersion=action==='duplicate';
    if(createsVersion&&versionActionInFlight.current)return;
    if(action==='accepted'&&acceptanceInFlight.current.has(detail.id))return;
    if(['finalized','sent','resumed'].includes(action)&&unsavedRegistry.active(quoteGroup).length){onMessage('Enregistre ou annule les modifications de ce devis avant cette opération.');return;}
    if(!requestUnsavedExit(()=>{},quoteGroup))return;
    if (action === 'accepted') {
      if(!beginAcceptance(detail.id))return;
      if (!window.confirm(`Confirmer que le devis ${detail.number} a été accepté / signé dans Abby ?\n\nVérifie le bon devis, sa révision et l’acceptation réelle dans Abby. Cette action accepte la version contractuelle envoyée, rattache ou convertit le Client, confirme le Projet et peut déclencher des prestations opérationnelles.`)) {endAcceptance(detail.id);return;}
    }
    if(createsVersion){versionActionInFlight.current=true;setVersionBusy(true);}
    try {
      if (action === 'finalized') {
        const review = await window.atoumweb.contractTerms.quotes.get(detail.id);
        if (review.warnings.length > 0) {
          const warningText = review.warnings.map((warning) => `• ${warning}`).join('\n');
          if (!window.confirm(`Avertissements CGV avant finalisation :\n\n${warningText}\n\nFinaliser quand même le devis ?`)) return;
        }
      }
      let next: QuoteDetail;
      if (action === 'finalized') next = await trackQuoteMutation(()=>window.atoumweb.quotes.finalize(detail.id,canonicalReview));
      else if (action === 'resumed') {
        if(!detail.contractPreparationId||!window.confirm('Reprendre ce brouillon avant envoi ? La préparation précédente sera conservée et un nouveau contrôle sera nécessaire.'))return;
        next=await trackQuoteMutation(()=>window.atoumweb.quotes.resumeDraft(detail.id,detail.contractPreparationId!));
      }
      else if (action === 'sent') {
        const state=await window.atoumweb.quotes.transmissionState(detail.id);
        if(selectedRef.current!==detail.id)return;
        if(!state.contentHash)throw Error('Version contractuelle absente : envoi refusé.');
        const provenance=window.prompt('Attestation d’envoi réel au client : indique le canal et la référence du message ou du document transmis. La copie vers Abby seule ne vaut pas envoi.');
        if(!provenance?.trim()||!window.confirm(`Attester l’envoi effectif du devis ${detail.number} au client ? Vérifie la version préparée et le document réellement transmis. Le contrat sera figé.`))return;
        if(unsavedRegistry.active(quoteGroup).length)throw Error('Une saisie est en cours : envoi refusé.');
        next=await trackQuoteMutation(()=>window.atoumweb.quotes.markSent(detail.id,{operationId:crypto.randomUUID(),preparationId:state.preparationId,contentHash:state.contentHash!,confirmed:true,channel:'other',provenance:provenance.trim(),occurredAt:'now'}));
      }
      else if (action === 'viewed') next = await trackQuoteMutation(()=>window.atoumweb.quotes.markViewed(detail.id));
      else if (action === 'accepted') next = await trackQuoteMutation(()=>window.atoumweb.quotes.accept(detail.id));
      else if (action === 'refused') next = await trackQuoteMutation(()=>window.atoumweb.quotes.refuse(detail.id));
      else if (action === 'expired') next = await trackQuoteMutation(()=>window.atoumweb.quotes.expire(detail.id));
      else next = await trackQuoteMutation(()=>window.atoumweb.quotes.duplicate(detail.id));
      await refresh(); await openQuote(next.id); onMessage(action === 'accepted' ? 'Acceptation Abby confirmée : le devis est accepté et le dossier Client a été mis à jour.' : `Devis ${next.number} mis à jour.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Action impossible.'); }
    finally { if(createsVersion){versionActionInFlight.current=false;setVersionBusy(false);} if(action==='accepted')endAcceptance(detail.id); }
  }

  async function createCommercialRevision(): Promise<void> {
    if(!detail||versionActionInFlight.current)return;
    if(!requestUnsavedExit(()=>{},quoteGroup))return;
    versionActionInFlight.current=true;setVersionBusy(true);
    try {
      const next=await trackQuoteMutation(()=>window.atoumweb.quotes.createCommercialRevision(detail.id));
      setDetail(next);await refresh();
    } catch(error){onMessage(error instanceof Error?error.message:'Impossible de créer la révision.');}
    finally { versionActionInFlight.current=false;setVersionBusy(false); }
  }

  async function extendValidity():Promise<void>{if(!detail)return;const value=window.prompt('Nouvelle date de validité (AAAA-MM-JJ)',detail.validUntil?.slice(0,10)??'');if(!value)return;try{const next=await trackQuoteMutation(()=>window.atoumweb.quotes.extendValidity(detail.id,value));setDetail(next);await refresh();onMessage('Validité du devis prolongée.');}catch(error){onMessage(error instanceof Error?error.message:'Date invalide.');}}

  return (
    <div className={embedded?'quotes-stack quotes-embedded':'quotes-stack'}>
      <div className="module-toolbar quote-toolbar"><div><strong>{filtered.length}</strong><span> devis</span></div><div className="toolbar-controls quote-toolbar-controls"><button className="secondary-button" type="button" onClick={() => void refresh()}><OperationIcon name="refresh"/>Actualiser</button><input className="inline-search" placeholder={drilldown ? "Cohorte exacte active" : "Rechercher un devis…"} disabled={!!drilldown} value={query} onChange={(e) => setQuery(e.target.value)} /><select value={statusFilter} disabled={!!drilldown} onChange={(e) => setStatusFilter(e.target.value as 'all' | QuoteStatus)}><option value="all">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="primary-button" type="button" onClick={() => { if (showWizard) { requestUnsavedExit(() => { setShowWizard(false); setWizardStep(1); setWizardError(null); }, 'quote:create'); } else { setShowWizard(true); setWizardError(null); } }}>{showWizard ? 'Fermer' : '+ Nouveau devis'}</button></div></div>

      {showWizard && <section className="panel quote-wizard"><div className="quote-stepper">{['Client / Prospect', 'Projet / besoin', 'Offre', 'Services / lignes', 'Conditions', 'Prévisualisation'].map((label, index) => <button key={label} type="button" className={wizardStep === index + 1 ? 'active' : wizardStep > index + 1 ? 'done' : ''} onClick={() => index + 1 < wizardStep && setWizardStep(index + 1)}><span>{index + 1}</span>{label}</button>)}</div><div className="quote-wizard-body">
        {wizardStep === 1 && <div className="quote-step-content"><h2>À qui s’adresse le devis ?</h2>{developmentMode&&<button type="button" className="secondary-button" onClick={()=>void fillTestDossier()}>Créer un faux dossier TEST</button>}<div className="quote-owner-toggle"><button type="button" className={wizard.ownerKind === 'prospect' ? 'active' : ''} onClick={() => setWizard({ ...wizard, ownerKind: 'prospect', ownerId: '' })}>Prospect</button><button type="button" className={wizard.ownerKind === 'client' ? 'active' : ''} onClick={() => setWizard({ ...wizard, ownerKind: 'client', ownerId: '' })}>Client</button></div><label>Dossier<select value={wizard.ownerId} onChange={(e) => { const ownerId=e.target.value; const source=wizard.ownerKind==='prospect'?prospects.find(item=>item.id===ownerId):clients.find(item=>item.id===ownerId); setWizard({ ...wizard, ownerId, contractAudience:source?.organizationId?'professional':'consumer' }); }}><option value="">Choisir…</option>{ownerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}</select></label></div>}
        {wizardStep === 2 && <div className="quote-step-content"><h2>Projet / besoin</h2><label>Projet / Besoin<select onChange={e=>{const item=catalog.find(i=>i.id===e.target.value);setWizard({...wizard,subject:item?.name??'',needSummary:item?.currentVersion?.description??''});}}><option value="">Autre — texte libre</option>{catalog.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>Objet du devis<input value={wizard.subject} onChange={(e) => setWizard({ ...wizard, subject: e.target.value })} placeholder="Ex. Création du site vitrine" /></label><label>Besoin<textarea value={wizard.needSummary} onChange={(e) => setWizard({ ...wizard, needSummary: e.target.value })} /></label></div>}
        {wizardStep === 3 && <div className="quote-step-content"><h2>Offre de départ</h2><p className="muted">Optionnel : choisis une Offre ou un Service du catalogue. Le contenu et le tarif seront copiés dans le devis.</p><label>Rechercher le catalogue<input value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)} placeholder="Nom, code AW, besoin, bénéfice, mots-clés"/></label><label>Catalogue<select value={wizard.catalogVersionId} onChange={(e) => {const v=catalog.find(i=>i.currentVersion?.id===e.target.value)?.currentVersion;setWizardTerms('');setCatalogPrice('');setWizard({ ...wizard, catalogVersionId: e.target.value, depositPercent: String(v?.defaultDepositPercent??30), estimatedDelay:v?.recommendedDelayDays?String(v.recommendedDelayDays)+' jours':'' });}}><option value="">Aucune — partir d’un devis libre</option>{visibleCatalog.map((item) => <option key={item.id} value={item.currentVersion!.id}>{catalogueLabel(item)}</option>)}</select></label><label>Prix proposé (€) — requis pour une prestation sur devis<input inputMode="decimal" value={catalogPrice} onChange={e=>setCatalogPrice(e.target.value)} placeholder="Tarif catalogue par défaut"/></label></div>}
        {wizardStep === 4 && <div className="quote-step-content"><h2>Services / lignes complémentaires</h2><QuoteDraftLines catalog={catalog} lines={draftLines} onChange={setDraftLines}/></div>}
        {wizardStep === 5 && <div className="quote-step-content"><h2>Conditions</h2><label>Type de client contractuel<select value={wizard.contractAudience} onChange={(e)=>setWizard({...wizard,contractAudience:e.target.value as 'professional'|'consumer'})}><option value="professional">Professionnel</option><option value="consumer">Particulier / consommateur</option></select></label><label>Condition particulière initiale (facultatif)<textarea value={wizardTerms} onChange={e=>setWizardTerms(e.target.value)}/></label><div className="quote-three-fields"><label>Validité (jours)<input inputMode="numeric" value={wizard.validityDays} onChange={(e) => setWizard({ ...wizard, validityDays: e.target.value })} /></label><label>Acompte (%)<input inputMode="numeric" value={wizard.depositPercent} onChange={(e) => setWizard({ ...wizard, depositPercent: e.target.value })} /></label><label>Délai estimé<input value={wizard.estimatedDelay} onChange={(e) => setWizard({ ...wizard, estimatedDelay: e.target.value })} placeholder="Ex. 3 à 4 semaines" /></label></div></div>}
        {wizardStep === 6 && <div className="quote-preview"><span className="eyebrow">Prévisualisation</span><h2>{wizard.subject || 'Devis sans objet'}</h2><p>{ownerOptions.find((owner) => owner.id === wizard.ownerId)?.label || 'Destinataire'}</p>{wizard.needSummary && <p className="muted">{wizard.needSummary}</p>}
          <div className="quote-preview-lines">
            <div className="quote-preview-lines-heading"><strong>Lignes qui seront enregistrées</strong><span>{(wizard.catalogVersionId ? 1 : 0) + draftLines.length} ligne(s)</span></div>
            {wizard.catalogVersionId && (() => {
              const item = catalog.find((entry) => entry.currentVersion?.id === wizard.catalogVersionId);
              return item ? <div className="quote-preview-line">
                <div><strong>{item.name}</strong><small>Offre catalogue · 1 ×</small></div>
                <span>{(() => { try { const price=quoteWizardPriceCents(catalogPrice,item.currentVersion?.priceCents); return price==null ? 'Prix à renseigner' : money(price); } catch { return 'Montant invalide'; } })()}</span>
              </div> : null;
            })()}
            {draftLines.map((line, index) => {
              const quantity = Number(line.quantity.replace(',', '.'));
              const unitCents = (() => { try { return eurosToCents(line.price); } catch { return null; } })();
              const totalCents = unitCents != null && Number.isFinite(quantity) && quantity > 0 ? Math.round(unitCents * quantity) : null;
              return <div className="quote-preview-line" key={`${line.versionId}-${index}`}>
                <div><strong>{line.label.trim() || 'Ligne à compléter'}</strong><small>{line.versionId ? 'Service catalogue' : 'Ligne libre'} · {line.quantity || '—'} × {line.price ? `${line.price} €` : 'prix à compléter'}</small></div>
                <span>{totalCents != null ? money(totalCents) : 'À compléter'}</span>
              </div>;
            })}
            {!wizard.catalogVersionId && draftLines.length === 0 && <p className="muted">Aucune ligne complémentaire n’a été ajoutée.</p>}
          </div>
          <div className="quote-preview-summary"><span>Client contractuel</span><strong>{wizard.contractAudience==='consumer'?'Particulier':'Professionnel'}</strong><span>Acompte</span><strong>{wizard.depositPercent || '0'} %</strong><span>Validité</span><strong>{wizard.validityDays || '—'} jours</strong><span>Délai estimé</span><strong>{wizard.estimatedDelay || 'Non renseigné'}</strong></div>
        </div>}
      </div>{wizardError && <p className="form-error">{wizardError}</p>}<div className="quote-wizard-actions"><button className="secondary-button" type="button" disabled={wizardStep === 1} onClick={() => setWizardStep((step) => Math.max(1, step - 1))}>← Précédent</button>{wizardStep < 6 ? <button className="primary-button" type="button" onClick={nextWizard}>Suivant →</button> : <button className="primary-button" disabled={saving} type="button" onClick={() => void createQuote()}>{saving ? 'Création…' : 'Créer le devis'}</button>}</div></section>}

      {drilldown && <section className="panel statistics-route-banner" aria-label="Filtre exact Statistiques">
        <strong>{drilldown.kind === 'decisions' ? 'Décisions des devis' : 'Devis acceptés'} · {drilldown.periodLabel}</strong>
        <p>Liste restreinte aux {drilldown.ids.length} devis de la population calculée dans Statistiques. Les statuts et identifiants retenus sont vérifiés à l’ouverture, pas remplacés par des devis extérieurs à la cohorte.</p>
        {drilldownMatch && drilldownMatch.unavailable > 0 && <p role="alert">{drilldownMatch.unavailable} devis de la cohorte sont devenus indisponibles ou n’ont plus le statut attendu. Aucun autre devis n’est ajouté.</p>}
        <button className="secondary-button" type="button" onClick={onClearStatisticsDrilldown}>Quitter ce filtre et voir tous les devis</button>
      </section>}
      {loading ? <div className="panel"><p className="muted">Chargement des devis…</p></div> : <div className={detail ? 'quotes-layout with-detail' : 'quotes-layout'}><div className="panel quote-list-panel"><ConfiguredDataTable<QuoteSummary> scope={QUOTE_LIST_VIEW} store={window.atoumweb.visualPreferences} rows={filtered} selectedId={selectedId} getId={quote=>quote.id} onSelect={quote=>void openQuote(quote.id)} className="quote-table" caption="Devis · source complète · tri sur tous les résultats filtrés" columns={[
        {id:'identity',label:'Numéro',required:true,sortValue:quote=>quote.number,render:quote=><strong>{quote.number}</strong>},
        {id:'owner',label:'Destinataire',sortValue:quote=>quote.ownerLabel,render:quote=>quote.ownerLabel},
        {id:'subject',label:'Objet',sortValue:quote=>quote.subject,render:quote=>quote.subject},
        {id:'status',label:'Statut',sortValue:quote=>STATUS_LABELS[quote.status],render:quote=><span className={`quote-status quote-${quote.status}`}>{STATUS_LABELS[quote.status]}</span>},
        {id:'amount',label:'Valeur',sortValue:quote=>quote.contractValueCents,render:quote=>money(quote.contractValueCents)},
        {id:'decision',label:'Décision',required:true,render:quote=>{
          const prospect=quote.prospectId?prospects.find(item=>item.id===quote.prospectId)??null:null;
          const actionable=quote.status==='sent'||quote.status==='viewed';const negotiating=prospect?.stage==='negotiation';
          return <div className="quote-decision-actions">
              {actionable && <button className="primary-button compact-button" type="button" disabled={acceptanceBusyIds.includes(quote.id)} onClick={(event) => { event.stopPropagation(); void validateQuoteFromList(quote); }}>Confirmer accepté dans Abby</button>}
              {actionable && quote.prospectId && !negotiating && <button className="secondary-button compact-button" type="button" onClick={(event) => { event.stopPropagation(); void negotiateQuote(quote); }}>À négocier</button>}
              {actionable && negotiating && <span className="status-pill">En négociation</span>}
              {quote.status === 'accepted' && <span className="status-pill">Validé</span>}
              {!actionable && quote.status !== 'accepted' && <span className="muted">—</span>}
            </div>;
        }},
        {id:'created',label:'Créé le',sortValue:quote=>quote.createdAt,render:quote=>new Date(quote.createdAt).toLocaleDateString('fr-FR')},
        {id:'open',label:'Ouvrir',required:true,render:quote=><button type="button" className="link-button" aria-label={'Ouvrir '+quote.number} onClick={event=>{event.stopPropagation();void openQuote(quote.id);}}><OperationIcon name="record-open"/></button>},
      ]}/></div>

        {detail && <UnsavedGroup name={quoteGroup}><div className="quote-detail-backdrop" role="presentation" onClick={closeQuoteDetail}/><aside ref={detailPanelRef} className={`panel quote-detail-panel ${detailExpanded?'expanded':''}`}><div className="detail-panel-heading"><div><span className="eyebrow">{detail.number}</span><h2>{detail.subject}</h2><p className="muted">{detail.ownerLabel}</p></div><div className="quote-detail-heading-actions">{returnProjectId && <button className="secondary-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'project', entityId: returnProjectId, title: 'Retour au Projet' } }))}>← Retour au Projet</button>}<button className="quote-detail-expand" type="button" title={detailExpanded?'Réduire la fiche devis':'Agrandir la fiche devis'} aria-label={detailExpanded?'Réduire la fiche devis':'Agrandir la fiche devis'} onClick={()=>setDetailExpanded(value=>!value)}><OperationIcon name={detailExpanded?'record-reduce':'record-expand'}/></button><button className="close-detail" type="button" title="Fermer" aria-label="Fermer le devis" onClick={closeQuoteDetail}><OperationIcon name="close"/></button></div></div><div className="detail-badges"><span className={`quote-status quote-${detail.status}`}>{STATUS_LABELS[detail.status]}</span>{detail.projectReadyAt && <span className="status-pill">Prêt pour Projet</span>}</div><button className="secondary-button quote-preview-button" type="button" onClick={() => setPreviewOpen(true)}>Prévisualiser côté client</button>
{!embedded&&<>          {detail.status==='accepted'&&<QuoteOperationalSalesPanel quote={detail}/>}
          {detail.status === 'accepted' && <QuoteContractDocumentPanel quote={detail} onSave={q=>{setDetail(q);void refresh();}} onMessage={onMessage}/>}
          {canAccessQuoteProject(detail) && <QuoteProjectPanel key={'project:'+detail.id} quote={detail}/>}<QuoteOfferOptionsPanel key={'options:'+detail.id} quote={detail} onSave={q=>{setDetail(q);void refresh();}}/><QuoteAbbyPanel quote={detail} onMessage={onMessage}/><QuoteConditions quote={detail} onSave={q=>{setDetail(q);void refresh();}}/></>}<div className="quote-lines"><strong>Lignes du devis</strong>{detail.lines.map((line) => <div className="quote-line-block" key={line.id}><div className="quote-line"><div><strong>{line.label}</strong><small>{line.source === 'catalog' ? `${line.snapshot?.canonicalCode||'Catalogue'} · ${line.snapshot?.familyCode||''} · v${line.snapshot?.versionNumber||''} · ${line.snapshot?.unit||'unité'}` : 'Ligne libre'} · {(line.quantityMilli ?? 1000) / 1000} ×{line.adjustmentMode && line.adjustmentMode !== 'none' ? ` · ${line.adjustmentMode}` : ''}</small></div><span>{money(line.contractLineValueCents)}</span>{detail.status === 'draft' && !detail.finalizedAt && <div className="quote-line-actions"><button type="button" title="Modifier" onClick={() => setEditingLineId(editingLineId === line.id ? null : line.id)}><OperationIcon name="edit"/></button><button type="button" title="Supprimer" onClick={() => void removeLine(line.id)}><OperationIcon name="close"/></button></div>}</div>{detail.status === 'draft' && !detail.finalizedAt && editingLineId === line.id && <UnsavedGroup name={quoteGroup+'/line:'+line.id+'/editor'}><QuoteLineEditor line={line} onCancel={() => applyEditingLineId(null)} onSave={(input) => saveLine(line.id, input)} /></UnsavedGroup>}<QuoteLineParametersPanel quote={detail} line={line} onSave={q=>setDetail(q)}/></div>)}{detail.lines.length === 0 && <p className="muted">Aucune ligne pour le moment.</p>}</div>
          {detail.status === 'draft' && !detail.finalizedAt && <><div className="quote-add-line"><strong>Ajouter depuis le catalogue</strong><input aria-label="Rechercher dans le catalogue" placeholder="Nom, code AW, besoin, bénéfice, mots-clés" value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)}/><select value={catalogToAdd} onChange={(e) => setCatalogToAdd(e.target.value)}><option value="">Choisir…</option>{visibleCatalog.map((item) => <option key={item.id} value={item.currentVersion!.id}>{catalogueLabel(item)}</option>)}</select><input aria-label="Prix proposé pour la prestation" placeholder="Prix proposé € (facultatif sauf Sur devis)" value={catalogPrice} onChange={e=>setCatalogPrice(e.target.value)}/><button className="secondary-button" type="button" onClick={() => void addCatalogLine()}>Ajouter une ligne</button></div><div className="quote-add-line"><strong>Ligne libre</strong><input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Libellé" /><input inputMode="decimal" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Prix €" /><button className="secondary-button" type="button" onClick={() => void addCustomLine()}>Ajouter</button></div></>}
          <div className="quote-totals"><div><span>Valeur catalogue</span><strong>{money(detail.catalogValueCents)}</strong></div><div><span>Remises</span><strong>- {money(detail.discountValueCents)}</strong></div><div className="quote-total-main"><span>Total contractuel</span><strong>{money(detail.contractValueCents)}</strong></div><div><span>{detail.initialPaymentQualification==='arrhes'?'Arrhes':'Acompte'} {detail.depositPercent ?? 0} %</span><strong>{money(detail.depositCents)}</strong></div><div><span>Solde</span><strong>{money(detail.balanceCents)}</strong></div></div>
{embedded&&<>          {detail.status==='accepted'&&<QuoteOperationalSalesPanel quote={detail}/>}
          {detail.status === 'accepted' && <QuoteContractDocumentPanel quote={detail} onSave={q=>{setDetail(q);void refresh();}} onMessage={onMessage}/>}
          {canAccessQuoteProject(detail) && <QuoteProjectPanel key={'project:'+detail.id} quote={detail}/>}<QuoteOfferOptionsPanel key={'options:'+detail.id} quote={detail} onSave={q=>{setDetail(q);void refresh();}}/><QuoteAbbyPanel quote={detail} onMessage={onMessage}/><QuoteConditions quote={detail} onSave={q=>{setDetail(q);void refresh();}}/></>}
          <div className="quote-status-actions">{['draft','sent','viewed'].includes(detail.status) && <button className="secondary-button" type="button" disabled={versionBusy} onClick={()=>void createCommercialRevision()}>Créer une révision du même dossier</button>}{detail.status === 'draft' && !detail.finalizedAt && <QuoteFinalizationPanel quote={detail} onFinalize={canonical=>void transition('finalized',canonical===true)}/>}{detail.status==='draft'&&detail.finalizedAt&&detail.contractPreparationId&&<button type="button" className="secondary-button" onClick={()=>void transition('resumed')}>Reprendre le brouillon</button>}{detail.status === 'draft' && detail.finalizedAt && <button className="primary-button" type="button" onClick={() => void transition('sent')}>Marquer envoyé</button>}{detail.status === 'sent' && <><button className="secondary-button" type="button" onClick={() => void transition('viewed')}>Marquer vu</button><button className="primary-button" type="button" disabled={acceptanceBusyIds.includes(detail.id)} onClick={() => void transition('accepted')}>Confirmer accepté dans Abby</button>{detail.prospectId && <button className="secondary-button" type="button" onClick={() => void negotiateQuote(detail)}>À négocier</button>}<button className="secondary-button danger-outline" type="button" onClick={() => void transition('refused')}>Refuser</button><button className="secondary-button" type="button" onClick={() => void transition('expired')}>Expirer</button></>}{detail.status === 'viewed' && <><button className="primary-button" type="button" disabled={acceptanceBusyIds.includes(detail.id)} onClick={() => void transition('accepted')}>Confirmer accepté dans Abby</button>{detail.prospectId && <button className="secondary-button" type="button" onClick={() => void negotiateQuote(detail)}>À négocier</button>}<button className="secondary-button danger-outline" type="button" onClick={() => void transition('refused')}>Refuser</button><button className="secondary-button" type="button" onClick={() => void transition('expired')}>Expirer</button></>}{['draft','sent','viewed','refused', 'expired', 'cancelled'].includes(detail.status) && <button className="primary-button" type="button" disabled={versionBusy} onClick={() => void transition('duplicate')}>Dupliquer en nouveau devis</button>}</div>
        </aside></UnsavedGroup>}
      </div>}
      {detail && previewOpen && <QuoteClientPreview quote={detail} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

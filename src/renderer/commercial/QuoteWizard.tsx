import {useEffect, useMemo, useRef, useState} from 'react';
import type {CatalogItemSummary, QuoteDetail, QuoteLineInput} from '../../shared/commercial';
import type {ClientSummary, ProspectSummary} from '../../shared/crm';
import {approvedPaymentPlanForCode} from '../../shared/approvedPaymentPlans';
import {catalogMatchesQuery} from '../../shared/catalogDiscovery';
import {OperationIcon} from '../operations/OperationIcon';
import {QuoteDraftLines, type DraftLine} from '../workflow/QuoteDraftLines';
import {useUnsavedDraft} from '../unsaved/unsaved';
import {quoteWizardPriceCents} from './quoteWizardPrice';
import {catalogSourceCode, quoteStartFromProspect, wizardFamilies, wizardMoney, wizardPriceLabel} from './quoteWizardModel';
import './quote-wizard.css';

/**
 * Lot 3 — assistant unique de création de devis.
 * Utilisé par le module Devis (on choisit d'abord pour qui) et par la fiche prospect
 * (le prospect et son besoin sont déjà connus : l'étape « Pour qui » disparaît).
 */

type StepId = 'owner' | 'offer' | 'options' | 'terms' | 'preview';
const STEP_LABELS: Record<StepId, string> = {owner: 'Pour qui', offer: 'Offre', options: 'Options', terms: 'Conditions', preview: 'Aperçu'};

interface Suggestion { versionId: string; name: string; priceCents: number | null; reason: string; }

interface Draft {
  ownerKind: 'prospect' | 'client'; ownerId: string;
  subject: string; subjectEdited: boolean; needSummary: string;
  offerVersionId: string; offerPrice: string;
  lines: DraftLine[];
  payment: 'plan' | 'percent'; depositPercent: string;
  validityDays: string; estimatedDelay: string;
  contractAudience: 'professional' | 'consumer'; specialTerms: string;
}

function eurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
}

function emptyDraft(prospect: ProspectSummary | undefined): Draft {
  const start = prospect ? quoteStartFromProspect(prospect) : {subject: '', needSummary: '', estimatedDelay: ''};
  return {
    ownerKind: 'prospect', ownerId: prospect?.id ?? '',
    subject: start.subject, subjectEdited: false, needSummary: start.needSummary,
    offerVersionId: '', offerPrice: '', lines: [],
    payment: 'percent', depositPercent: '30', validityDays: '30', estimatedDelay: start.estimatedDelay,
    contractAudience: prospect && !prospect.organizationId ? 'consumer' : 'professional', specialTerms: '',
  };
}

export function QuoteWizard({catalog, prospects, clients, presetProspect, developmentMode = false, onCreated, onRefreshLists}: {
  catalog: CatalogItemSummary[]; prospects: ProspectSummary[]; clients: ClientSummary[];
  /** Fiche prospect : destinataire et besoin déjà connus. */
  presetProspect?: ProspectSummary;
  developmentMode?: boolean;
  onCreated: (quote: QuoteDetail) => void | Promise<void>;
  onRefreshLists?: () => Promise<void>;
}) {
  const steps: StepId[] = presetProspect ? ['offer', 'options', 'terms', 'preview'] : ['owner', 'offer', 'options', 'terms', 'preview'];
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(presetProspect));
  const [defaultsReady, setDefaultsReady] = useState(false);
  const defaultDeposit = useRef('30');
  const [search, setSearch] = useState('');
  const [familyKey, setFamilyKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const createInFlight = useRef(false); // verrou immédiat, avant le prochain rendu React.
  const patch = (changes: Partial<Draft>) => setDraft(current => ({...current, ...changes}));

  // Validité et acompte habituels : ceux des Réglages, avant toute saisie.
  useEffect(() => {
    let active = true;
    void window.atoumweb.quoteDocumentSettings.get().then(defaults => {
      if (!active) return;
      defaultDeposit.current = String(defaults.depositPercent);
      setDraft(current => ({...current, validityDays: String(defaults.validityDays), depositPercent: String(defaults.depositPercent)}));
    }).catch(() => undefined).finally(() => { if (active) setDefaultsReady(true); });
    return () => { active = false; };
  }, []);

  const guard = useUnsavedDraft('Nouveau devis', draft, {group: 'quote:create', ready: defaultsReady, pending: saving, discard: baseline => { setDraft(baseline); setStepIndex(0); setError(null); }});

  const families = useMemo(() => wizardFamilies(catalog), [catalog]);
  const offer = catalog.find(item => item.currentVersion?.id === draft.offerVersionId) ?? null;
  const plan = approvedPaymentPlanForCode(catalogSourceCode(offer));
  const found = search.trim() ? catalog.filter(item => catalogMatchesQuery(item, search, 'selection')) : null;
  const openFamily = families.find(family => family.key === familyKey) ?? null;
  const ownerOptions = draft.ownerKind === 'prospect'
    ? prospects.map(item => ({id: item.id, label: item.displayName}))
    : clients.map(item => ({id: item.id, label: item.displayName}));
  const ownerLabel = presetProspect?.displayName ?? ownerOptions.find(item => item.id === draft.ownerId)?.label ?? '';

  // Options liées à l'offre dans le Catalogue : compléments recommandés et composants facultatifs.
  useEffect(() => {
    let active = true;
    setSuggestions([]);
    if (!draft.offerVersionId) { setSuggestionsLoading(false); return; }
    setSuggestionsLoading(true);
    void Promise.all([
      window.atoumweb.catalog.listRecommendations(draft.offerVersionId),
      window.atoumweb.catalog.listOfferComponents(draft.offerVersionId),
    ]).then(([links, components]) => {
      if (!active) return;
      const byVersion = new Map<string, Suggestion>();
      const currentPrice = (versionId: string) => catalog.find(item => item.currentVersion?.id === versionId)?.currentVersion?.priceCents ?? null;
      for (const link of links)
        if (link.status !== 'paused' && link.targetVersionStatus === 'published' && link.targetItemStatus === 'active')
          byVersion.set(link.targetVersionId, {versionId: link.targetVersionId, name: link.targetName, priceCents: currentPrice(link.targetVersionId), reason: link.reason?.trim() ?? ''});
      for (const component of components)
        if (component.isOptional && !byVersion.has(component.serviceVersionId))
          byVersion.set(component.serviceVersionId, {versionId: component.serviceVersionId, name: component.serviceName, priceCents: component.priceCents ?? null, reason: ''});
      setSuggestions([...byVersion.values()]);
    }).catch(() => undefined).finally(() => { if (active) setSuggestionsLoading(false); });
    return () => { active = false; };
  }, [draft.offerVersionId, catalog]);

  function chooseOwner(ownerKind: Draft['ownerKind'], ownerId: string): void {
    const prospect = ownerKind === 'prospect' ? prospects.find(item => item.id === ownerId) : undefined;
    const client = ownerKind === 'client' ? clients.find(item => item.id === ownerId) : undefined;
    const start = prospect ? quoteStartFromProspect(prospect) : null;
    setDraft(current => ({
      ...current, ownerKind, ownerId,
      contractAudience: (prospect ?? client)?.organizationId ? 'professional' : 'consumer',
      // Le besoin connu du prospect est repris tant que rien n'a été saisi à la main.
      subject: current.subjectEdited || !start ? current.subject : start.subject || current.subject,
      needSummary: current.needSummary.trim() || !start ? current.needSummary : start.needSummary,
      estimatedDelay: current.estimatedDelay.trim() || !start ? current.estimatedDelay : start.estimatedDelay,
    }));
  }

  function chooseOffer(item: CatalogItemSummary | null): void {
    const version = item?.currentVersion ?? null;
    const nextPlan = approvedPaymentPlanForCode(catalogSourceCode(item));
    setError(null);
    setDraft(current => ({
      ...current,
      offerVersionId: version?.id ?? '', offerPrice: '',
      // L'objet suit le nom de l'offre tant qu'il n'a pas été écrit à la main.
      subject: current.subjectEdited || current.subject.trim() && !catalog.some(other => other.name === current.subject) ? current.subject : item?.name ?? '',
      payment: nextPlan ? 'plan' : 'percent',
      depositPercent: nextPlan ? current.depositPercent : String(version?.defaultDepositPercent ?? defaultDeposit.current),
      estimatedDelay: current.estimatedDelay.trim() || !version?.recommendedDelayDays ? current.estimatedDelay : `${version.recommendedDelayDays} jours`,
    }));
  }

  function toggleSuggestion(suggestion: Suggestion): void {
    const selected = draft.lines.some(line => line.versionId === suggestion.versionId);
    patch({lines: selected
      ? draft.lines.filter(line => line.versionId !== suggestion.versionId)
      : [...draft.lines, {versionId: suggestion.versionId, label: suggestion.name, quantity: '1', price: suggestion.priceCents == null ? '' : String(suggestion.priceCents / 100)}]});
  }

  function offerPriceCents(): number | null {
    return offer ? quoteWizardPriceCents(draft.offerPrice, offer.currentVersion?.priceCents) : null;
  }

  function validate(target: StepId): string | null {
    if (target === 'owner' && !draft.ownerId) return 'Choisis un prospect ou un client.';
    if (target === 'offer' && offer) {
      try { if (offerPriceCents() == null && offer.currentVersion?.priceMode !== 'free') return 'Cette offre est « sur devis » : indique le prix que tu proposes.'; }
      catch { return 'Le prix proposé n’est pas un montant valide.'; }
    }
    if (target === 'options') {
      for (const line of draft.lines) {
        const quantity = Number(line.quantity.replace(',', '.'));
        let cents: number | null = null;
        try { cents = eurosToCents(line.price); } catch { cents = null; }
        if (!line.label.trim() || cents == null || !Number.isFinite(quantity) || quantity <= 0) return `Complète le libellé, la quantité et le prix de « ${line.label.trim() || 'la ligne ajoutée'} ».`;
      }
    }
    if (target === 'terms') {
      if (!draft.subject.trim()) return 'Donne un titre au devis (son objet).';
      const validity = Number(draft.validityDays), deposit = Number(draft.depositPercent);
      if (!Number.isInteger(validity) || validity <= 0) return 'La durée de validité doit être un nombre de jours.';
      if (!(draft.payment === 'plan' && plan) && (!Number.isInteger(deposit) || deposit < 0 || deposit > 100)) return 'L’acompte doit être un pourcentage entre 0 et 100.';
    }
    return null;
  }

  function next(): void {
    const problem = validate(step);
    setError(problem);
    if (!problem) setStepIndex(index => Math.min(steps.length - 1, index + 1));
  }

  async function fillTestDossier(): Promise<void> {
    try {
      const organization = await window.atoumweb.crm.organizations.create({name: 'TEST — recette commerciale'});
      const owner = await window.atoumweb.crm.prospects.create({organizationId: organization.id, primaryNeed: 'TEST — faux dossier de recette'});
      await onRefreshLists?.();
      const vitrine = catalog.find(item => item.canonicalCode === 'AW-WEB-VITRINE'), article = catalog.find(item => item.canonicalCode === 'AW-CONT-ART-SEO');
      setDraft(current => ({
        ...current, ownerKind: 'prospect', ownerId: owner.id, subject: 'TEST — Site vitrine', subjectEdited: true, needSummary: 'TEST — Site vitrine et Article SEO',
        offerVersionId: vitrine?.currentVersion?.id ?? '', offerPrice: '', payment: approvedPaymentPlanForCode(catalogSourceCode(vitrine)) ? 'plan' : 'percent',
        lines: article?.currentVersion ? [{versionId: article.currentVersion.id, label: article.name, quantity: '1', price: String((article.currentVersion.priceCents ?? 0) / 100)}] : [],
      }));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function create(): Promise<void> {
    if (createInFlight.current) return;
    const problem = steps.map(validate).find(Boolean) ?? null;
    if (problem) { setError(problem); return; }
    createInFlight.current = true;
    setSaving(true); setError(null);
    try {
      const lines: Array<{catalogVersionId?: string; input: QuoteLineInput}> = draft.lines.map(line => ({
        catalogVersionId: line.versionId || undefined,
        input: {label: line.label.trim(), quantityMilli: Math.round(Number(line.quantity.replace(',', '.')) * 1000), proposedUnitPriceCents: eurosToCents(line.price) ?? 0},
      }));
      if (offer) lines.unshift({catalogVersionId: draft.offerVersionId, input: {label: offer.name, proposedUnitPriceCents: offerPriceCents() ?? 0}});
      const usePlan = draft.payment === 'plan' && plan;
      const created = await window.atoumweb.quotes.createWithLines({
        prospectId: draft.ownerKind === 'prospect' ? draft.ownerId : null,
        clientAccountId: draft.ownerKind === 'client' ? draft.ownerId : null,
        subject: draft.subject.trim(), needSummary: draft.needSummary.trim() || null,
        validityDays: Number(draft.validityDays), estimatedDelay: draft.estimatedDelay.trim() || null,
        contractAudience: draft.contractAudience, specialTerms: draft.specialTerms.trim() || null,
        ...(usePlan ? {paymentPlan: plan.id} : {depositPercent: Number(draft.depositPercent)}),
      }, lines, {applyContractTerms: true, advanceNewProspect: true});
      guard.saved(draft);
      await onCreated(created);
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de créer le devis.'); }
    finally { createInFlight.current = false; setSaving(false); }
  }

  const paymentSummary = draft.payment === 'plan' && plan ? plan.summary : `${draft.depositPercent || '0'} % à la commande, le solde ensuite`;
  const previewTotal = (() => {
    try {
      const lines = draft.lines.reduce((sum, line) => sum + Math.round((eurosToCents(line.price) ?? 0) * Number(line.quantity.replace(',', '.'))), 0);
      return (offerPriceCents() ?? 0) + lines;
    } catch { return null; }
  })();

  const card = (item: CatalogItemSummary) => {
    const selected = item.currentVersion?.id === draft.offerVersionId;
    return <button key={item.id} type="button" className={selected ? 'quote-offer-card selected' : 'quote-offer-card'} aria-pressed={selected} onClick={() => chooseOffer(selected ? null : item)}>
      <strong>{item.name}</strong>
      <span className="quote-offer-price">{wizardPriceLabel(item.currentVersion)}</span>
      {item.currentVersion?.description && item.currentVersion.description.trim() !== item.name && <small>{item.currentVersion.description}</small>}
      {selected && <span className="quote-offer-check"><OperationIcon name="file-check"/>Choisie</span>}
    </button>;
  };

  return <section className="panel quote-wizard" aria-label="Nouveau devis">
    {presetProspect && <h3 className="quote-wizard-title">Nouveau devis pour {presetProspect.displayName}</h3>}
    <div className="quote-stepper" style={{gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`}}>{steps.map((id, index) => <button key={id} type="button" className={stepIndex === index ? 'active' : stepIndex > index ? 'done' : ''} onClick={() => { if (index < stepIndex) { setError(null); setStepIndex(index); } }}><span>{index + 1}</span>{STEP_LABELS[id]}</button>)}</div>
    <div className="quote-wizard-body">
      {step === 'owner' && <div className="quote-step-content">
        <h2>Pour qui est ce devis ?</h2>
        {developmentMode && <button type="button" className="secondary-button" onClick={() => void fillTestDossier()}>Créer un faux dossier TEST</button>}
        <div className="quote-owner-toggle">
          <button type="button" className={draft.ownerKind === 'prospect' ? 'active' : ''} onClick={() => patch({ownerKind: 'prospect', ownerId: ''})}>Prospect</button>
          <button type="button" className={draft.ownerKind === 'client' ? 'active' : ''} onClick={() => patch({ownerKind: 'client', ownerId: ''})}>Client</button>
        </div>
        <label>{draft.ownerKind === 'prospect' ? 'Prospect' : 'Client'}<select value={draft.ownerId} onChange={e => chooseOwner(draft.ownerKind, e.target.value)}><option value="">Choisir…</option>{ownerOptions.map(owner => <option key={owner.id} value={owner.id}>{owner.label}</option>)}</select></label>
        {draft.ownerKind === 'prospect' && draft.ownerId && draft.needSummary && <p className="muted">Le besoin noté sur la fiche du prospect est repris ; tu pourras le corriger à l’étape « Conditions ».</p>}
      </div>}

      {step === 'offer' && <div className="quote-step-content quote-step-wide">
        <h2>Quelle offre proposes-tu ?</h2>
        <p className="muted">Choisis une famille, puis une offre. Son contenu et son prix seront repris dans le devis.</p>
        <label>Rechercher<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ex. vitrine, boutique, maintenance…"/></label>
        {offer && <div className="quote-offer-chosen" role="status">
          <div><span className="muted">Offre choisie</span><strong>{offer.name}</strong><span>{wizardPriceLabel(offer.currentVersion)}</span></div>
          <label>{offer.currentVersion?.priceCents == null && offer.currentVersion?.priceMode !== 'free' ? 'Prix que tu proposes (€)' : 'Prix proposé (€) — laisse vide pour garder le tarif'}<input inputMode="decimal" value={draft.offerPrice} onChange={e => patch({offerPrice: e.target.value})} placeholder={offer.currentVersion?.priceCents == null ? 'Ex. 1200' : String(offer.currentVersion.priceCents / 100)}/></label>
          <button type="button" className="secondary-button" onClick={() => chooseOffer(null)}>Changer d’offre</button>
        </div>}
        {found ? <>
          <p className="muted">{found.length} résultat{found.length > 1 ? 's' : ''}</p>
          <div className="quote-offer-grid">{found.map(card)}</div>
        </> : openFamily ? <>
          <div className="quote-family-heading"><button type="button" className="secondary-button" onClick={() => setFamilyKey(null)}>← Toutes les familles</button><span className="quote-family-icon"><OperationIcon name={openFamily.icon}/></span><h3>{openFamily.name}</h3></div>
          {openFamily.offers.length > 0 && <><h4>Offres</h4><div className="quote-offer-grid">{openFamily.offers.map(card)}</div></>}
          {openFamily.services.length > 0 && <><h4>Prestations à l’unité</h4><div className="quote-offer-grid">{openFamily.services.map(card)}</div></>}
        </> : <div className="quote-family-grid">{families.map(family => <button key={family.key} type="button" className={offer && [...family.offers, ...family.services].includes(offer) ? 'quote-family-tile selected' : 'quote-family-tile'} onClick={() => setFamilyKey(family.key)}>
          <span className="quote-family-icon"><OperationIcon name={family.icon}/></span>
          <strong>{family.name}</strong>
          <small>{family.offers.length > 0 ? `${family.offers.length} offre${family.offers.length > 1 ? 's' : ''}` : `${family.services.length} prestation${family.services.length > 1 ? 's' : ''}`}</small>
        </button>)}</div>}
        {families.length === 0 && <p className="muted">Aucune offre publiée pour le moment. Tu peux quand même faire un devis libre, ligne par ligne.</p>}
        {!offer && <p className="muted">Pas d’offre toute faite ? Continue sans en choisir : tu ajouteras tes lignes à l’étape suivante.</p>}
      </div>}

      {step === 'options' && <div className="quote-step-content quote-step-wide">
        <h2>Des options à ajouter ?</h2>
        {offer && suggestionsLoading && <p className="muted">Recherche des options de « {offer.name} »…</p>}
        {offer && !suggestionsLoading && suggestions.length > 0 && <>
          <p className="muted">Options prévues avec « {offer.name} ». Coche celles que tu proposes.</p>
          <div className="quote-option-list">{suggestions.map(suggestion => {
            const selected = draft.lines.some(line => line.versionId === suggestion.versionId);
            return <label key={suggestion.versionId} className={selected ? 'quote-option selected' : 'quote-option'}>
              <input type="checkbox" checked={selected} onChange={() => toggleSuggestion(suggestion)}/>
              <span><strong>{suggestion.name}</strong>{suggestion.reason && <small>{suggestion.reason}</small>}</span>
              <span className="quote-offer-price">{suggestion.priceCents == null ? 'Sur devis' : wizardMoney(suggestion.priceCents)}</span>
            </label>;
          })}</div>
        </>}
        {offer && !suggestionsLoading && suggestions.length === 0 && <p className="muted">Aucune option n’est encore liée à « {offer.name} » dans le Catalogue. Tu peux ajouter une ligne ci-dessous.</p>}
        <h3>{draft.lines.length > 0 ? 'Lignes ajoutées au devis' : 'Autre chose à ajouter ?'}</h3>
        <QuoteDraftLines catalog={catalog} lines={draft.lines} onChange={lines => patch({lines})}/>
      </div>}

      {step === 'terms' && <div className="quote-step-content">
        <h2>Conditions du devis</h2>
        <label>Titre du devis (objet)<input value={draft.subject} onChange={e => patch({subject: e.target.value, subjectEdited: true})} placeholder="Ex. Création du site vitrine"/></label>
        <label>Besoin du client<textarea value={draft.needSummary} onChange={e => patch({needSummary: e.target.value})} placeholder="En quelques phrases : ce que le client attend."/></label>
        <fieldset className="quote-payment-choice">
          <legend>Paiement</legend>
          {plan && <label className="quote-radio"><input type="radio" name="quote-payment" checked={draft.payment === 'plan'} onChange={() => patch({payment: 'plan'})}/><span><strong>{plan.summary}</strong><small>Échéancier prévu pour cette offre.</small></span></label>}
          <label className="quote-radio"><input type="radio" name="quote-payment" checked={draft.payment === 'percent' || !plan} onChange={() => patch({payment: 'percent'})}/><span><strong>{plan ? 'Un autre acompte' : 'Acompte à la commande'}</strong><span className="quote-deposit-field"><input aria-label="Acompte en pourcentage" inputMode="numeric" value={draft.depositPercent} disabled={draft.payment === 'plan' && !!plan} onChange={e => patch({depositPercent: e.target.value})}/> % à la commande, le solde ensuite</span></span></label>
        </fieldset>
        <div className="quote-three-fields">
          <label>Ton client est<select value={draft.contractAudience} onChange={e => patch({contractAudience: e.target.value as Draft['contractAudience']})}><option value="professional">Un professionnel</option><option value="consumer">Un particulier</option></select></label>
          <label>Devis valable (jours)<input inputMode="numeric" value={draft.validityDays} onChange={e => patch({validityDays: e.target.value})}/></label>
          <label>Délai estimé<input value={draft.estimatedDelay} onChange={e => patch({estimatedDelay: e.target.value})} placeholder="Ex. 3 à 4 semaines"/></label>
        </div>
        <details className="quote-extra-options"><summary>Ajouter une condition particulière (facultatif)</summary><label>Condition particulière<textarea value={draft.specialTerms} onChange={e => patch({specialTerms: e.target.value})}/></label></details>
      </div>}

      {step === 'preview' && <div className="quote-preview">
        <span className="eyebrow">Aperçu avant création</span>
        <h2>{draft.subject || 'Devis sans titre'}</h2>
        <p>{ownerLabel || 'Destinataire à choisir'}</p>
        {draft.needSummary && <p className="muted quote-preview-need">{draft.needSummary}</p>}
        <div className="quote-preview-lines">
          <div className="quote-preview-lines-heading"><strong>Lignes du devis</strong><span>{(offer ? 1 : 0) + draft.lines.length} ligne(s)</span></div>
          {offer && <div className="quote-preview-line"><div><strong>{offer.name}</strong><small>Offre · 1 ×</small></div><span>{(() => { try { const price = offerPriceCents(); return price == null ? 'Prix à renseigner' : wizardMoney(price); } catch { return 'Montant invalide'; } })()}</span></div>}
          {draft.lines.map((line, index) => {
            const quantity = Number(line.quantity.replace(',', '.'));
            const unit = (() => { try { return eurosToCents(line.price); } catch { return null; } })();
            return <div className="quote-preview-line" key={`${line.versionId}-${index}`}><div><strong>{line.label.trim() || 'Ligne à compléter'}</strong><small>{line.versionId ? 'Option' : 'Ligne libre'} · {line.quantity || '—'} × {line.price ? `${line.price} €` : 'prix à compléter'}</small></div><span>{unit != null && Number.isFinite(quantity) && quantity > 0 ? wizardMoney(Math.round(unit * quantity)) : 'À compléter'}</span></div>;
          })}
          {!offer && draft.lines.length === 0 && <p className="muted">Aucune ligne pour l’instant : tu pourras en ajouter dans le devis.</p>}
        </div>
        <div className="quote-preview-summary">
          <span>Total</span><strong>{previewTotal == null ? 'À vérifier' : wizardMoney(previewTotal)}</strong>
          <span>Paiement</span><strong>{paymentSummary}</strong>
          <span>Client</span><strong>{draft.contractAudience === 'consumer' ? 'Particulier' : 'Professionnel'}</strong>
          <span>Validité</span><strong>{draft.validityDays || '—'} jours</strong>
          <span>Délai estimé</span><strong>{draft.estimatedDelay || 'Non renseigné'}</strong>
        </div>
        <p className="muted">À la création, les conditions générales (CGV) prévues pour ces prestations sont ajoutées au devis. Tu pourras tout relire et corriger avant de l’envoyer.</p>
      </div>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="quote-wizard-actions">
      <button className="secondary-button" type="button" disabled={stepIndex === 0} onClick={() => { setError(null); setStepIndex(index => Math.max(0, index - 1)); }}>← Précédent</button>
      {step !== 'preview'
        ? <button className="primary-button" type="button" onClick={next}>Suivant →</button>
        : <button className="primary-button" disabled={saving} type="button" onClick={() => void create()}>{saving ? 'Création…' : 'Créer le devis'}</button>}
    </div>
  </section>;
}

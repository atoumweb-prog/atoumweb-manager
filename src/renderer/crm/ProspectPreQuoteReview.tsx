import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItemSummary } from '../../shared/commercial';
import { planProspectQuoteLines, sameProspectQuotePlan } from '../../shared/prospectPreQuotePlan';
import type { ProspectSummary } from '../../shared/crm';
import type { Need, WorkflowIdentity } from '../../shared/workflow';
import { parseProspectInformation } from '../../shared/prospectInformation';
import {CommercialScope} from '../commercial/CommercialScope';

/** Independent from the collapsible need form: reducing it never hides the final review. */
export function ProspectPreQuoteReviewPanel({prospect,onChanged}:{prospect:ProspectSummary;onChanged:()=>void}) {
  const [data,setData]=useState<{needs:Need[];catalog:CatalogItemSummary[]}|null>(null),[error,setError]=useState('');
  useEffect(() => {
    let active = true, sequence = 0;
    setData(null);
    const load = () => {
      const request = ++sequence;
      void Promise.all([window.atoumweb.workflow.needs('prospect', prospect.id), window.atoumweb.catalog.list({ status: 'active' })])
        .then(([needs, catalog]) => {
          if (active && request === sequence) { setData({ needs, catalog }); setError(''); }
        }).catch(e => { if (active && request === sequence) setError(cleanError(e)); });
    };
    load();
    window.addEventListener('atoumweb:changed', load);
    return () => { active = false; window.removeEventListener('atoumweb:changed', load); };
  }, [prospect.id, prospect.updatedAt]);
  return error?<p role="alert">{error}</p>:data?<ProspectPreQuoteReview prospect={prospect} {...data} onChanged={onChanged}/>:null;
}

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['\"][^'\"]+['\"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

function money(cents?: number | null): string {
  return cents == null ? '—' : `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

function budgetLabel(prospect: ProspectSummary): string {
  if (prospect.budgetStatus === 'not_disclosed') return 'Non communiqué';
  if (prospect.budgetStatus === 'known' && prospect.budgetMinCents != null) return money(prospect.budgetMinCents);
  if (prospect.budgetMinCents != null && prospect.budgetMaxCents != null) return `${money(prospect.budgetMinCents)} – ${money(prospect.budgetMaxCents)}`;
  if (prospect.budgetMinCents != null) return `À partir de ${money(prospect.budgetMinCents)}`;
  if (prospect.budgetMaxCents != null) return `Jusqu’à ${money(prospect.budgetMaxCents)}`;
  return 'À préciser';
}

function timelineLabel(prospect: ProspectSummary): string {
  if (prospect.timelineStatus === 'not_disclosed') return 'Non communiqué';
  if (prospect.timelineStatus === 'date') return prospect.targetDate ? new Date(`${prospect.targetDate.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : 'Date cible à préciser';
  return prospect.timelineNote || 'Période à préciser';
}

function decisionLabel(prospect: ProspectSummary, identity: WorkflowIdentity | null): string {
  if (prospect.decisionStatus === 'yes') return identity?.contact ? `${identity.contact.firstName} ${identity.contact.lastName} · interlocuteur principal` : 'Interlocuteur principal à préciser';
  if (identity?.decisionMaker) return `${identity.decisionMaker.firstName} ${identity.decisionMaker.lastName}${identity.decisionMaker.jobTitle ? ` · ${identity.decisionMaker.jobTitle}` : ''}`;
  if (prospect.decisionStatus === 'no') return prospect.decisionMakerDetails || 'Décisionnaire à préciser';
  if (prospect.decisionStatus === 'unknown') return 'Décisionnaire encore inconnu';
  return 'À qualifier';
}

export function ProspectPreQuoteReview({ prospect, needs, catalog, onChanged }: {
  prospect: ProspectSummary;
  needs: Need[];
  catalog: CatalogItemSummary[];
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [identity, setIdentity] = useState<WorkflowIdentity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    let live = true;
    setIdentity(null);
    void window.atoumweb.workflow.identity('prospect', prospect.id)
      .then(next => { if (live) { setIdentity(next); setError(''); } })
      .catch((e) => { if (live) setError(cleanError(e)); });
    return () => { live = false; };
  }, [prospect.id, prospect.updatedAt]);

  const solutionRows = useMemo(() => needs.map((need) => ({
    need,
    item: need.catalogItemId ? catalog.find((candidate) => candidate.id === need.catalogItemId) ?? null : null,
  })), [needs, catalog]);
  const quotePlan = useMemo(() => planProspectQuoteLines(needs, catalog), [needs, catalog]);
  const informationItems = useMemo(() => parseProspectInformation(prospect.missingInformation), [prospect.missingInformation]);
  const blockingInformation = informationItems.filter((item) => item.status === 'open' && item.isBlocking);
  const laterInformation = informationItems.filter((item) => item.status !== 'resolved' && !item.isBlocking);

  const blockers = useMemo(() => {
    const result: string[] = [];
    if (needs.length === 0) result.push('Sélectionner au moins une solution ou prestation.');
    for (const missing of quotePlan.missing) result.push(`Prestation indisponible dans le catalogue publié : ${missing}. Sélectionne une version active avant de créer le devis.`);
    if (needs.length > 0 && quotePlan.lines.length === 0 && quotePlan.missing.length === 0) result.push('Aucune ligne de devis valide ne peut être préparée.');
    if (!prospect.projectSummary?.trim()) result.push('Résumer le projet / la problématique à chiffrer.');
    if (!prospect.budgetStatus) result.push('Renseigner le budget ou indiquer « Non communiqué ».');
    if (!prospect.timelineStatus) result.push('Renseigner le calendrier ou indiquer « Non communiqué ».');
    if (!prospect.decisionStatus) result.push('Préciser la situation du décisionnaire.');
    if (prospect.decisionStatus === 'no' && !prospect.decisionMakerDetails?.trim() && !identity?.decisionMaker) result.push('Identifier le décisionnaire ou le chemin de validation.');
    blockingInformation.forEach((item) => result.push(`Obtenir : ${item.label}`));
    return result;
  }, [needs.length, prospect, identity, quotePlan, blockingInformation.map((item) => `${item.id}:${item.status}:${item.isBlocking}`).join('|')]);

  const unpriced = quotePlan.unpriced;
  const ready = blockers.length === 0;

  async function createDraftAndOpen() {
    if (!ready || busy || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      const existing = await window.atoumweb.quotes.list({ prospectId: prospect.id });
      const draft = existing.find((quote) => quote.status === 'draft');
      if (draft) {
        window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'quote', entityId: draft.id, title: draft.subject } }));
        return;
      }

      // Relire les besoins et le catalogue juste avant l'unique écriture.
      // Une modification dans une autre fenêtre ne doit pas générer un devis
      // différent du périmètre explicitement contrôlé par l'utilisateur.
      const [liveNeeds, liveCatalog] = await Promise.all([
        window.atoumweb.workflow.needs('prospect', prospect.id),
        window.atoumweb.catalog.list({ status: 'active' }),
      ]);
      const livePlan = planProspectQuoteLines(liveNeeds, liveCatalog);
      if (livePlan.missing.length || !livePlan.lines.length) {
        throw new Error('Une prestation du dossier n’est plus disponible : actualise les besoins avant de préparer le devis.');
      }
      if (!sameProspectQuotePlan(quotePlan, livePlan)) {
        window.dispatchEvent(new Event('atoumweb:changed'));
        throw new Error('Les besoins ou versions du catalogue ont changé. Le contrôle se réactualise : vérifie les lignes avant de confirmer un nouveau devis.');
      }

      const first = solutionRows[0];
      const subject = first?.need.label || prospect.projectSummary?.trim() || `Projet ${prospect.displayName}`;
      const summaryParts = [prospect.projectSummary?.trim(), prospect.projectContext?.trim()].filter(Boolean);
      const created = await window.atoumweb.quotes.createWithLines({
        prospectId: prospect.id,
        subject,
        needSummary: summaryParts.join('\n\n') || null,
        estimatedDelay: prospect.timelineStatus === 'date' && prospect.targetDate
          ? `Date cible : ${new Date(`${prospect.targetDate.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR')}`
          : prospect.timelineNote || null,
      }, livePlan.lines);
      onChanged?.();
      window.dispatchEvent(new Event('atoumweb:changed'));
      window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'quote', entityId: created.id, title: created.subject } }));
    } catch (e) { setError(cleanError(e)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <div className="prequote-review">
    <div className="prequote-entry">
      <div><span className="eyebrow">Étape suivante</span><strong>Contrôle avant devis</strong><p>Vérifie les informations nécessaires au chiffrage avant de quitter « Besoin à identifier ».</p></div>
      <button type="button" className="primary-button" onClick={() => setOpen((value) => !value)}>{open ? 'Fermer le contrôle' : 'Contrôler avant devis'}</button>
    </div>
    {open && <div className="prequote-review-body">
      <div className="prequote-result"><span className={`prequote-state ${ready ? 'ready' : 'blocked'}`}>{ready ? '✓ Prêt pour devis' : '○ Devis non prêt'}</span><strong>{ready ? 'Les informations nécessaires au chiffrage sont validées.' : `${blockers.length} point${blockers.length > 1 ? 's' : ''} à régler avant le devis.`}</strong></div>

      <div className="prequote-summary-grid">
        <div><span>Entreprise</span><strong>{identity?.organization?.name || prospect.displayName}</strong></div>
        <div><span>Interlocuteur</span><strong>{identity?.contact ? `${identity.contact.firstName} ${identity.contact.lastName}` : 'À préciser'}</strong></div>
        <div><span>Décisionnaire</span><strong>{decisionLabel(prospect, identity)}</strong></div>
        <div><span>Budget</span><strong>{budgetLabel(prospect)}</strong></div>
        <div><span>Calendrier</span><strong>{timelineLabel(prospect)}</strong></div>
        <div><span>Existant</span><strong>{prospect.existingStatus === 'yes' ? prospect.existingUrl || 'Oui' : prospect.existingStatus === 'no' ? 'Aucun' : 'À vérifier'}</strong></div>
        <div className="prequote-wide"><span>Projet / problématique</span><strong>{prospect.projectSummary || 'À préciser'}</strong></div>
        {prospect.projectContext && <div className="prequote-wide"><span>Contexte / hors socle / contraintes</span><strong>{prospect.projectContext}</strong></div>}
      </div>

      <div className="prequote-solutions"><span className="eyebrow">Solution retenue</span>{solutionRows.map(({ need, item }) => <div key={need.id} className="prequote-solution-row"><div><strong>{need.label}</strong><small>{item?.currentVersion?.priceCents != null ? money(item.currentVersion.priceCents) : item?.currentVersion?.priceMode === 'free' ? 'Gratuit' : 'Prix à saisir dans le devis'}</small></div><details><summary>Contenu et compléments possibles</summary><CommercialScope version={item?.currentVersion}/></details></div>)}</div>

      {blockers.length > 0 && <div className="prequote-blockers"><strong>À compléter avant de passer au devis</strong>{blockers.map((entry) => <span key={entry}>• {entry}</span>)}</div>}
      {laterInformation.length > 0 && <div className="prequote-warning"><strong>À obtenir plus tard — non bloquant</strong>{laterInformation.map((item) => <span key={item.id}>• {item.label}{item.answer ? ` — ${item.answer}` : ''}</span>)}</div>}
      {unpriced.length > 0 && <div className="prequote-warning"><strong>Chiffrage à compléter dans l’éditeur</strong><span>{unpriced.join(', ')} : ces lignes seront bien reprises dans le brouillon avec leur référence catalogue, puis leur montant devra être saisi dans le devis.</span></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="prequote-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Retour au besoin</button><button type="button" className="primary-button" disabled={!ready || busy} onClick={() => void createDraftAndOpen()}>{busy ? 'Création du brouillon…' : 'Passer à l’édition du devis'}</button></div>
      <small className="muted">Le devis créé reste un brouillon modifiable. La gestion définitive du numéro officiel et de l’édition sera reprise avec l’éditeur de devis lors de la passe dédiée.</small>
    </div>}
  </div>;
}

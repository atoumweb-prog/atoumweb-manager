import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary, QuoteLineInput } from '../../shared/commercial';
import type { ProspectSummary } from '../../shared/crm';
import type { Need, WorkflowIdentity } from '../../shared/workflow';
import { parseProspectInformation } from '../../shared/prospectInformation';

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

  useEffect(() => {
    void window.atoumweb.workflow.identity('prospect', prospect.id).then(setIdentity).catch((e) => setError(cleanError(e)));
  }, [prospect.id, prospect.updatedAt]);

  const solutionRows = useMemo(() => needs.map((need) => ({
    need,
    item: need.catalogItemId ? catalog.find((candidate) => candidate.id === need.catalogItemId) ?? null : null,
  })), [needs, catalog]);
  const informationItems = useMemo(() => parseProspectInformation(prospect.missingInformation), [prospect.missingInformation]);
  const blockingInformation = informationItems.filter((item) => item.status === 'open' && item.isBlocking);
  const laterInformation = informationItems.filter((item) => item.status !== 'resolved' && !item.isBlocking);

  const blockers = useMemo(() => {
    const result: string[] = [];
    if (needs.length === 0) result.push('Sélectionner au moins une solution ou prestation.');
    if (!prospect.projectSummary?.trim()) result.push('Résumer le projet / la problématique à chiffrer.');
    if (!prospect.budgetStatus) result.push('Renseigner le budget ou indiquer « Non communiqué ».');
    if (!prospect.timelineStatus) result.push('Renseigner le calendrier ou indiquer « Non communiqué ».');
    if (!prospect.decisionStatus) result.push('Préciser la situation du décisionnaire.');
    if (prospect.decisionStatus === 'no' && !prospect.decisionMakerDetails?.trim() && !identity?.decisionMaker) result.push('Identifier le décisionnaire ou le chemin de validation.');
    blockingInformation.forEach((item) => result.push(`Obtenir : ${item.label}`));
    return result;
  }, [needs.length, prospect, identity, blockingInformation.map((item) => `${item.id}:${item.status}:${item.isBlocking}`).join('|')]);

  const unpriced = solutionRows.filter(({ item }) => item?.currentVersion && item.currentVersion.priceCents == null && item.currentVersion.priceMode !== 'free');
  const ready = blockers.length === 0;

  async function createDraftAndOpen() {
    if (!ready || busy) return;
    setBusy(true); setError('');
    try {
      const existing = await window.atoumweb.quotes.list({ prospectId: prospect.id });
      const draft = existing.find((quote) => quote.status === 'draft');
      if (draft) {
        window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'quote', entityId: draft.id, title: draft.subject } }));
        return;
      }

      const lines: Array<{ catalogVersionId?: string; input: QuoteLineInput }> = [];
      for (const { item } of solutionRows) {
        const version = item?.currentVersion;
        if (!item || !version) continue;
        const needsManualPrice = version.priceCents == null && version.priceMode !== 'free';
        lines.push({
          catalogVersionId: version.id,
          input: {
            label: item.name,
            ...(needsManualPrice ? { proposedUnitPriceCents: 0 } : {}),
          },
        });
      }
      const customNeeds = solutionRows.filter(({ item, need }) => !item && need.otherText?.trim());
      for (const { need } of customNeeds) {
        lines.push({ input: { label: need.otherText!.trim(), catalogUnitPriceCents: 0, proposedUnitPriceCents: 0 } });
      }

      const first = solutionRows[0];
      const subject = first?.need.label || prospect.projectSummary?.trim() || `Projet ${prospect.displayName}`;
      const summaryParts = [prospect.projectSummary?.trim(), prospect.projectContext?.trim()].filter(Boolean);
      const created = await window.atoumweb.quotes.createWithLines({
        prospectId: prospect.id,
        subject,
        needSummary: summaryParts.join('\n\n') || null,
        validityDays: 30,
        depositPercent: 30,
        estimatedDelay: prospect.timelineStatus === 'date' && prospect.targetDate
          ? `Date cible : ${new Date(`${prospect.targetDate.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR')}`
          : prospect.timelineNote || null,
      }, lines);
      onChanged?.();
      window.dispatchEvent(new Event('atoumweb:changed'));
      window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'quote', entityId: created.id, title: created.subject } }));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
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

      <div className="prequote-solutions"><span className="eyebrow">Solution retenue</span>{solutionRows.map(({ need, item }) => <div key={need.id} className="prequote-solution-row"><div><strong>{need.label}</strong><small>{item?.currentVersion?.priceCents != null ? money(item.currentVersion.priceCents) : item?.currentVersion?.priceMode === 'free' ? 'Gratuit' : 'Prix à saisir dans le devis'}</small></div>{item?.currentVersion?.inclusions && item.currentVersion.inclusions.length > 0 && <div className="prequote-inclusions">{item.currentVersion.inclusions.map((entry) => <small key={entry}>✓ {entry}</small>)}</div>}</div>)}</div>

      {blockers.length > 0 && <div className="prequote-blockers"><strong>À compléter avant de passer au devis</strong>{blockers.map((entry) => <span key={entry}>• {entry}</span>)}</div>}
      {laterInformation.length > 0 && <div className="prequote-warning"><strong>À obtenir plus tard — non bloquant</strong>{laterInformation.map((item) => <span key={item.id}>• {item.label}{item.answer ? ` — ${item.answer}` : ''}</span>)}</div>}
      {unpriced.length > 0 && <div className="prequote-warning"><strong>Chiffrage à compléter dans l’éditeur</strong><span>{unpriced.map(({ need }) => need.label).join(', ')} : ces lignes seront bien reprises dans le brouillon avec leur référence catalogue, puis leur montant devra être saisi dans le devis.</span></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="prequote-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Retour au besoin</button><button type="button" className="primary-button" disabled={!ready || busy} onClick={() => void createDraftAndOpen()}>{busy ? 'Création du brouillon…' : 'Passer à l’édition du devis'}</button></div>
      <small className="muted">Le devis créé reste un brouillon modifiable. La gestion définitive du numéro officiel et de l’édition sera reprise avec l’éditeur de devis lors de la passe dédiée.</small>
    </div>}
  </div>;
}

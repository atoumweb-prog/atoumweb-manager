import {useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import { useEffect, useMemo, useState } from 'react';
import type { QuoteDetail, QuoteSummary } from '../../shared/commercial';
import type { CrmAction, ProspectSummary } from '../../shared/crm';
import { canAccessQuoteProject } from '../../shared/quoteProjectEligibility';
import { QuoteProjectPanel } from '../workflow/QuoteWorkflow';

const QUOTE_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', viewed: 'Vu', accepted: 'Accepté / signé', refused: 'Refusé', expired: 'Caduc', cancelled: 'Annulé',
};
const CHANNELS = [
  ['email', 'Email'], ['courrier', 'Courrier'], ['main_propre', 'Remis en main propre'], ['other', 'Autre'],
] as const;
const WAITING_REASONS = [
  ['response', 'En attente de réponse'],
  ['information', 'En attente d’informations'],
  ['documents', 'En attente de documents'],
  ['decision', 'En attente de validation par le décideur'],
  ['new_quote', 'Nouveau devis / révision à préparer'],
  ['meeting', 'Rendez-vous programmé'],
  ['other', 'Autre'],
] as const;
const PAUSE_REASONS = [
  ['information', 'Informations complémentaires à récupérer'],
  ['content', 'Contenus / éléments client manquants'],
  ['pricing', 'Tarif ou chiffrage à compléter'],
  ['technical', 'Information technique à vérifier'],
  ['client', 'Attente d’un retour client'],
  ['other', 'Autre'],
] as const;
const REFUSAL_REASONS = [
  ['budget', 'Budget / prix'],
  ['competitor', 'Concurrent choisi'],
  ['abandoned', 'Projet abandonné ou reporté'],
  ['timing', 'Calendrier incompatible'],
  ['scope', 'Périmètre / proposition non retenue'],
  ['other', 'Autre'],
] as const;

function money(cents: number) {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}
function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}
function daysRemaining(value?: string | null): number | null {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}
function openQuote(quote: QuoteSummary) {
  window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'quote', entityId: quote.id, title: quote.subject } }));
}
function actionTime(action: CrmAction): number {
  return Date.parse(action.completedAt || action.updatedAt || action.createdAt) || 0;
}
function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

export function ProspectQuotePanel({ prospect, onChanged }: { prospect: ProspectSummary; onChanged: (message?: string) => void }) {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [crmActions, setCrmActions] = useState<CrmAction[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [channel, setChannel] = useState('email');
  const [recipient, setRecipient] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('information');
  const [pauseOther, setPauseOther] = useState('');
  const [pauseNote, setPauseNote] = useState('');
  const [followDate, setFollowDate] = useState('');
  const [waitReason, setWaitReason] = useState('response');
  const [waitOther, setWaitOther] = useState('');
  const [resumeDate, setResumeDate] = useState('');
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState('budget');
  const [refusalOther, setRefusalOther] = useState('');
  const guard=useUnsavedDraft('Envoi ou suivi du devis',{channel,recipient,sendNote,pauseReason,pauseOther,pauseNote,followDate,waitReason,waitOther,resumeDate,refusalReason,refusalOther},{pending:busy,discard:s=>{setChannel(s.channel);setRecipient(s.recipient);setSendNote(s.sendNote);setPauseReason(s.pauseReason);setPauseOther(s.pauseOther);setPauseNote(s.pauseNote);setFollowDate(s.followDate);setWaitReason(s.waitReason);setWaitOther(s.waitOther);setResumeDate(s.resumeDate);setRefusalReason(s.refusalReason);setRefusalOther(s.refusalOther);}});


  async function load() {
    try {
      const [next, actions] = await Promise.all([
        window.atoumweb.quotes.list({ prospectId: prospect.id }),
        window.atoumweb.crm.actions.list({ ownerType: 'prospect', ownerId: prospect.id }),
      ]);
      setQuotes(next);
      setCrmActions(actions);
      setDetail(next[0] ? await window.atoumweb.quotes.get(next[0].id) : null);
    } catch (e) { setError(cleanError(e)); }
  }
  useEffect(() => { setSendOpen(false); setPauseOpen(false); setRefuseOpen(false); void load(); }, [prospect.id, prospect.stage]);

  const quote = detail;
  const isFinalized = Boolean(quote?.finalizedAt);
  const sent = quote?.status === 'sent' || quote?.status === 'viewed';
  const canEdit = quote?.status === 'draft';
  const remaining = daysRemaining(quote?.validUntil);
  const relatedActions = useMemo(
    () => quote ? crmActions.filter((action) => action.relatedType === 'quote' && action.relatedId === quote.id) : [],
    [crmActions, quote?.id],
  );
  const latestDispatch = useMemo(
    () => relatedActions
      .filter((action) => action.status === 'done' && action.title.includes('envoyé'))
      .sort((a, b) => actionTime(b) - actionTime(a))[0] ?? null,
    [relatedActions],
  );
  const latestCompletedFollowUp = useMemo(
    () => relatedActions
      .filter((action) => action.type === 'follow_up' && action.status === 'done')
      .sort((a, b) => actionTime(b) - actionTime(a))[0] ?? null,
    [relatedActions],
  );
  const latestOpenFollowUp = useMemo(
    () => relatedActions
      .filter((action) => action.type === 'follow_up' && action.status === 'open')
      .sort((a, b) => Date.parse(a.dueAt || '9999-12-31') - Date.parse(b.dueAt || '9999-12-31'))[0] ?? null,
    [relatedActions],
  );
  const dispatchChannel = latestDispatch?.completionChannel
    ? CHANNELS.find(([key]) => key === latestDispatch.completionChannel)?.[1] ?? latestDispatch.completionChannel
    : '—';
  const dispatchRecipient = latestDispatch?.completionOutcome?.replace(/^Envoyé à\s*/i, '') || '—';

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError('');
    try { await action();guard.saved();await load();onChanged(message); window.dispatchEvent(new Event('atoumweb:changed')); }
    catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function finalize() {
    if (!quote) return;
    await run(() => window.atoumweb.quotes.finalize(quote.id), 'Devis validé pour envoi : il passe en « Devis à envoyer ».');
  }

  async function pauseQuote() {
    if (!quote) return;
    const label = PAUSE_REASONS.find(([key]) => key === pauseReason)?.[1] ?? 'Informations manquantes';
    const reason = pauseReason === 'other' ? pauseOther.trim() : label;
    if (!reason) { setError('Précise le motif de pause.'); return; }
    await run(async () => {
      await window.atoumweb.crm.actions.create({
        ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: 'Compléter le devis avant envoi',
        notes: pauseNote.trim() ? `${reason} — ${pauseNote.trim()}` : reason,
        relatedType: 'quote', relatedId: quote.id,
      });
    }, 'Le brouillon reste modifiable et une action de complément a été créée.');
    setPauseOpen(false); setPauseOther(''); setPauseNote('');
  }

  async function sendQuote() {
    if (!quote || !recipient.trim()) { setError('Renseigne le destinataire de l’envoi.'); return; }
    await run(async () => {
      const state=await window.atoumweb.quotes.transmissionState(quote.id);
      if(!state.contentHash)throw Error('Version à envoyer absente.');
      if(!window.confirm(`Confirmer l’envoi effectif de ${quote.number} à ${recipient.trim()} ? Un transfert vers Abby seul ne vaut pas envoi au client.`))throw Error('Envoi non attesté ; devis inchangé.');
      await window.atoumweb.quotes.markSent(quote.id,{operationId:crypto.randomUUID(),preparationId:state.preparationId,contentHash:state.contentHash,channel:'other',provenance:`${channel} — ${recipient.trim()} — ${sendNote.trim()}`,occurredAt:'now',confirmed:true});
      const action = await window.atoumweb.crm.actions.create({
        ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: `Devis ${quote.number} envoyé`, relatedType: 'quote', relatedId: quote.id,
      });
      await window.atoumweb.crm.actions.complete(action.id, {
        channel,
        outcome: `Envoyé à ${recipient.trim()}`,
        notes: sendNote.trim() || null,
      });
    }, `Devis ${quote.number} envoyé : le dossier passe en attente de retour.`);
    setSendOpen(false); setSendNote('');
  }

  async function scheduleFollowUp() {
    if (!quote || !followDate) { setError('Choisis une date de relance.'); return; }
    const dueAt = new Date(`${followDate}T09:00:00`).toISOString();
    await run(() => window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'follow_up', title: `Relancer pour le devis ${quote.number}`, dueAt, relatedType: 'quote', relatedId: quote.id }), 'Relance du devis programmée.');
    setFollowDate('');
  }

  async function negotiation() {
    await run(() => window.atoumweb.crm.prospects.changeStage(prospect.id, 'negotiation'), 'Demande de modification enregistrée : le dossier passe en négociation.');
  }

  async function waiting() {
    const label = WAITING_REASONS.find(([key]) => key === waitReason)?.[1] ?? 'En attente';
    const detailText = waitReason === 'other' ? waitOther.trim() : label;
    if (!detailText) { setError('Précise le motif de mise en attente.'); return; }
    await run(async () => {
      await window.atoumweb.crm.prospects.updateQualification(prospect.id, { waitingReasonCode: waitReason, waitingReasonText: detailText, waitingResumeAt: resumeDate || null });
      await window.atoumweb.crm.prospects.changeStage(prospect.id, 'waiting');
      if (resumeDate) await window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: `Reprendre le suivi : ${detailText}`, dueAt: new Date(`${resumeDate}T09:00:00`).toISOString(), relatedType: 'quote', relatedId: quote?.id ?? null });
    }, 'Prospect mis en attente avec motif enregistré.');
  }

  async function revise() {
    if (!quote) return;
    await run(async () => {
      if (prospect.stage !== 'negotiation') await window.atoumweb.crm.prospects.changeStage(prospect.id, 'negotiation');
      await window.atoumweb.quotes.duplicate(quote.id);
    }, 'Révision créée à partir du devis précédent. L’ancien devis reste conservé et le nouveau repasse en préparation.');
  }

  async function accept() {
    if (!quote || !window.confirm(`Confirmer que le devis ${quote.number} a réellement été accepté / signé dans Abby ?\n\nCette action déclenche la conversion du Prospect en Client. Un simple accord de principe ne suffit pas.`)) return;
    await run(() => window.atoumweb.quotes.accept(quote.id), 'Devis accepté / signé : le prospect est converti ou rattaché au client.');
  }

  async function refuse() {
    if (!quote) return;
    const label = REFUSAL_REASONS.find(([key]) => key === refusalReason)?.[1] ?? 'Devis refusé';
    const reason = refusalReason === 'other' ? refusalOther.trim() : label;
    if (!reason) { setError('Précise la raison du refus.'); return; }
    await run(async () => {
      await window.atoumweb.quotes.refuse(quote.id);
      const action = await window.atoumweb.crm.actions.create({
        ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: `Refus du devis ${quote.number}`, relatedType: 'quote', relatedId: quote.id,
      });
      await window.atoumweb.crm.actions.complete(action.id, { outcome: `Devis refusé — ${reason}` });
      await window.atoumweb.crm.prospects.updateQualification(prospect.id, { waitingReasonCode: 'other', waitingReasonText: `Devis refusé — ${reason}`, waitingResumeAt: null });
      await window.atoumweb.crm.prospects.changeStage(prospect.id, 'waiting');
    }, 'Devis marqué refusé. Le prospect reste actif : tu peux le reprendre plus tard ou le classer « Perdu » séparément.');
    setRefuseOpen(false); setRefusalOther('');
  }

  if (!quote) return <section className="prospect-work-section prospect-quote-panel"><div className="work-section-heading"><div><span className="eyebrow">Devis</span><strong>Aucun devis lié</strong></div></div><p className="muted">Aucun devis n’a encore été créé pour ce prospect.</p></section>;

  const panelTitle = canEdit && !isFinalized
    ? 'Devis à préparer'
    : canEdit && isFinalized
      ? 'Devis à envoyer'
      : sent
        ? 'En attente de retour'
        : quote.status === 'refused'
          ? 'Devis refusé'
          : quote.status === 'expired'
            ? 'Devis caduc'
            : 'Devis';
  const subtitle = canEdit && !isFinalized ? 'Brouillon modifiable · en attente d’édition' : `${QUOTE_LABELS[quote.status] ?? quote.status}${isFinalized && canEdit ? ' · validé pour envoi' : ''}`;

  return <section className="prospect-work-section prospect-quote-panel">
    <div className="quote-command-header"><div><span className="eyebrow">{panelTitle}</span><strong>{quote.number} · {quote.subject}</strong><small>{subtitle}</small></div><button type="button" className="secondary-button compact-button" onClick={() => openQuote(quote)}>Ouvrir le devis complet</button></div>

    {canEdit && !isFinalized ? <details className="quote-draft-waiting"><summary>À propos de ce brouillon</summary><span>Le brouillon peut encore être modifié ou abandonné. Les lignes, montants, remises et conditions se travaillent dans l’éditeur de devis.</span></details> : <div className="quote-command-summary"><div><span>Montant</span><strong>{money(quote.contractValueCents)}</strong></div><div><span>Envoyé le</span><strong>{date(quote.sentAt)}</strong></div><div><span>Valable jusqu’au</span><strong>{date(quote.validUntil)}</strong></div>{sent && <div><span>Temps restant</span><strong className={remaining != null && remaining <= 7 ? 'quote-expiry-warning' : ''}>{remaining == null ? '—' : remaining < 0 ? 'Expiré' : `${remaining} jour${remaining > 1 ? 's' : ''}`}</strong></div>}</div>}

    {sent && <div className="quote-command-summary quote-follow-summary"><div><span>Canal</span><strong>{dispatchChannel}</strong></div><div><span>Destinataire</span><strong>{dispatchRecipient}</strong></div><div><span>Dernière relance</span><strong>{date(latestCompletedFollowUp?.completedAt)}</strong></div><div><span>Prochaine relance</span><strong>{date(latestOpenFollowUp?.dueAt)}</strong></div></div>}
    {sent && latestDispatch?.completionNotes && <p className="muted">Note d’envoi : {latestDispatch.completionNotes}</p>}
    {sent && remaining != null && remaining >= 0 && remaining <= 7 && <div className="quote-validity-alert"><strong>Le devis arrive à expiration dans {remaining} jour{remaining > 1 ? 's' : ''}.</strong><span>Une relance est recommandée avant la fin de sa validité.</span></div>}
    {error && <p className="form-error">{error}</p>}
    {sent && <div className="prospect-principle-agreement" aria-label="Accord de principe avant signature">
      {quote.principleAgreementAt ? <>
        <p role="status"><strong>Finalisation — accord de principe confirmé</strong> · {new Date(quote.principleAgreementAt).toLocaleString('fr-FR')}. La signature Abby reste à confirmer séparément.</p>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => {
          if (!window.confirm('Annuler l’accord de principe enregistré pour ce devis ? La trace restera dans l’historique.')) return;
          void run(() => window.atoumweb.quotes.revokePrincipleAgreement(quote.id), 'Accord de principe annulé : retour au suivi commercial.');
        }}>Annuler l’accord de principe</button>
      </> : <>
        <p>Accord de principe obtenu ? Il permet de suivre les dernières formalités sans signer le devis ni convertir le Prospect.</p>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => {
          if (!window.confirm(`Confirmer l’accord de principe pour le devis ${quote.number} ?\n\nCela ne vaut pas signature, acceptation Abby ni conversion en Client.`)) return;
          void run(() => window.atoumweb.quotes.confirmPrincipleAgreement(quote.id), 'Accord de principe confirmé : signature encore attendue.');
        }}>Accord de principe confirmé</button>
      </>}
    </div>}

    {canEdit && !isFinalized && <><div className="quote-command-actions"><button className="primary-button" type="button" disabled={busy} onClick={() => openQuote(quote)}>Modifier le brouillon</button><button className="secondary-button" type="button" disabled={busy} onClick={() => setPauseOpen((value) => !value)}>Info manquante / mettre en pause</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void finalize()}>Valider le devis pour envoi</button></div>{pauseOpen && <div className="inline-editor"><strong>Complément nécessaire avant validation</strong><label>Motif<select value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} disabled={busy}>{PAUSE_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{pauseReason === 'other' && <label>Préciser<input value={pauseOther} onChange={(e) => setPauseOther(e.target.value)} disabled={busy} /></label>}<label>Note<textarea value={pauseNote} onChange={(e) => setPauseNote(e.target.value)} placeholder="Ce qu’il faut récupérer ou vérifier" disabled={busy} /></label><div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setPauseOpen(false)}>Annuler</button><button className="primary-button" type="button" disabled={busy} onClick={() => void pauseQuote()}>Enregistrer l’action</button></div></div>}</>}

    {canEdit && isFinalized && <div className="quote-send-block"><button className="primary-button" type="button" onClick={() => setSendOpen((value) => !value)}>Envoyer / enregistrer l’envoi</button>{sendOpen && <div className="inline-editor"><strong>Confirmation de l’envoi</strong><label>Canal<select value={channel} onChange={(e) => setChannel(e.target.value)} disabled={busy}>{CHANNELS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Destinataire<input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Nom, email ou adresse utilisée" disabled={busy} /></label><label>Note<textarea value={sendNote} onChange={(e) => setSendNote(e.target.value)} placeholder="Facultatif" disabled={busy} /></label><div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setSendOpen(false)}>Annuler</button><button className="primary-button" type="button" disabled={busy} onClick={() => void sendQuote()}>Confirmer l’envoi</button></div></div>}</div>}

    {sent && <div className="quote-after-send"><div className="quote-after-send-heading"><span className="eyebrow">Suivi commercial</span><strong>Que répond le prospect ?</strong></div><div className="quote-command-actions"><button className="primary-button" type="button" disabled={busy} onClick={() => void accept()}>Devis accepté / signé</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void negotiation()}>À modifier / Négociation</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void revise()}>Réviser le devis</button><button className="secondary-button danger-outline" type="button" disabled={busy} onClick={() => setRefuseOpen((value) => !value)}>Devis refusé</button></div>
      {refuseOpen && <div className="inline-editor"><strong>Enregistrer le refus du devis</strong><p className="muted">Le refus concerne ce devis. Il ne classe pas automatiquement le prospect comme perdu.</p><label>Raison<select value={refusalReason} onChange={(e) => setRefusalReason(e.target.value)} disabled={busy}>{REFUSAL_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{refusalReason === 'other' && <label>Préciser<input value={refusalOther} onChange={(e) => setRefusalOther(e.target.value)} disabled={busy} /></label>}<div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setRefuseOpen(false)}>Annuler</button><button className="secondary-button danger-outline" type="button" disabled={busy} onClick={() => void refuse()}>Confirmer le refus du devis</button></div></div>}
      <div className="followup-inline"><label>Prochaine relance<input type="date" value={followDate} onChange={(e) => setFollowDate(e.target.value)} disabled={busy} /></label><button className="secondary-button" type="button" disabled={busy || !followDate} onClick={() => void scheduleFollowUp()}>Programmer la relance</button></div>
      <details className="waiting-inline"><summary>Mettre en attente</summary><div className="waiting-form"><label>Motif<select value={waitReason} onChange={(e) => setWaitReason(e.target.value)} disabled={busy}>{WAITING_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{waitReason === 'other' && <label>Préciser<input value={waitOther} onChange={(e) => setWaitOther(e.target.value)} disabled={busy} /></label>}<label>Date de reprise <small>(facultative)</small><input type="date" value={resumeDate} onChange={(e) => setResumeDate(e.target.value)} disabled={busy} /></label><button className="secondary-button" type="button" disabled={busy} onClick={() => void waiting()}>Confirmer l’attente</button></div></details>
    </div>}

    {quote.status === 'refused' && <div className="quote-refused-state"><strong>Ce devis a été refusé.</strong><span>Le dossier commercial reste distinct : utilise la relance / attente si l’opportunité continue, ou le bouton « Perdu » de la fiche si tu décides de clôturer le prospect.</span></div>}
    {quotes.length > 1 && <details className="previous-quotes"><summary>Voir les {quotes.length - 1} ancien(s) devis</summary>{quotes.slice(1).map((item) => <button type="button" className="workflow-link" key={item.id} onClick={() => openQuote(item)}>{item.number} · {item.subject} · {QUOTE_LABELS[item.status] ?? item.status}</button>)}</details>}
    {canAccessQuoteProject(quote) && <div className="prospect-quote-project-workflow"><QuoteProjectPanel key={'prospect-project:'+quote.id} quote={quote} requirePreviewBeforePrepare /></div>}
  </section>;
}

import { useEffect, useMemo, useState } from 'react';
import type { QuoteDetail, QuoteSummary } from '../../shared/commercial';
import type { ProspectSummary } from '../../shared/crm';

const QUOTE_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', viewed: 'Vu', accepted: 'Accepté', refused: 'Refusé', expired: 'Expiré', cancelled: 'Annulé',
};
const CHANNELS = [
  ['email', 'Email'], ['courrier', 'Courrier'], ['main_propre', 'Remis en main propre'], ['other', 'Autre'],
] as const;
const WAITING_REASONS = [
  ['response', 'En attente de réponse'],
  ['information', 'En attente d’informations'],
  ['documents', 'En attente de documents'],
  ['decision', 'En attente de validation par le décideur'],
  ['new_quote', 'Nouveau devis envoyé'],
  ['meeting', 'Rendez-vous programmé'],
  ['other', 'Autre'],
] as const;

function money(cents: number) {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}
function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}
function openQuote(quote: QuoteSummary) {
  window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'quote', entityId: quote.id, title: quote.subject } }));
}

export function ProspectQuotePanel({ prospect, onChanged }: { prospect: ProspectSummary; onChanged: (message?: string) => void }) {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [channel, setChannel] = useState('email');
  const [recipient, setRecipient] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [followDate, setFollowDate] = useState('');
  const [waitReason, setWaitReason] = useState('response');
  const [waitOther, setWaitOther] = useState('');
  const [resumeDate, setResumeDate] = useState('');

  async function load() {
    try {
      const next = await window.atoumweb.quotes.list({ prospectId: prospect.id });
      setQuotes(next);
      setDetail(next[0] ? await window.atoumweb.quotes.get(next[0].id) : null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  useEffect(() => { setSendOpen(false); void load(); }, [prospect.id, prospect.stage]);

  const quote = detail;
  const isFinalized = Boolean(quote?.finalizedAt);
  const sent = quote?.status === 'sent' || quote?.status === 'viewed';
  const canEdit = quote?.status === 'draft';
  const latestOpenFollowUp = useMemo(() => null, [quotes]);
  void latestOpenFollowUp;

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError('');
    try { await action(); await load(); onChanged(message); window.dispatchEvent(new Event('atoumweb:changed')); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function finalize() {
    if (!quote) return;
    await run(() => window.atoumweb.quotes.finalize(quote.id), 'Devis finalisé : il est maintenant prêt à envoyer.');
  }

  async function pauseQuote() {
    if (!quote) return;
    const reason = window.prompt('Information manquante ou motif de pause', 'Attente d’informations complémentaires');
    if (!reason?.trim()) return;
    await run(async () => {
      await window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: 'Compléter le devis avant envoi', notes: reason.trim(), relatedType: 'quote', relatedId: quote.id });
    }, 'Devis conservé en préparation avec une action à réaliser.');
  }

  async function sendQuote() {
    if (!quote || !recipient.trim()) { setError('Renseigne le destinataire de l’envoi.'); return; }
    await run(async () => {
      await window.atoumweb.quotes.markSent(quote.id);
      const action = await window.atoumweb.crm.actions.create({
        ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: `Devis ${quote.number} envoyé`, relatedType: 'quote', relatedId: quote.id,
      });
      await window.atoumweb.crm.actions.complete(action.id, {
        channel,
        outcome: `Envoyé à ${recipient.trim()}`,
        notes: sendNote.trim() || null,
      });
    }, `Devis ${quote.number} marqué envoyé.`);
    setSendOpen(false); setSendNote('');
  }

  async function scheduleFollowUp() {
    if (!quote || !followDate) { setError('Choisis une date de relance.'); return; }
    const dueAt = new Date(`${followDate}T09:00:00`).toISOString();
    await run(() => window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'follow_up', title: `Relancer pour le devis ${quote.number}`, dueAt, relatedType: 'quote', relatedId: quote.id }), 'Relance du devis programmée.');
    setFollowDate('');
  }

  async function negotiation() {
    await run(() => window.atoumweb.crm.prospects.changeStage(prospect.id, 'negotiation'), 'Prospect passé en négociation.');
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

  async function duplicate() {
    if (!quote) return;
    await run(() => window.atoumweb.quotes.duplicate(quote.id), 'Nouveau devis créé à partir du devis précédent. Le prospect repasse en préparation.');
  }

  async function accept() {
    if (!quote) return;
    await run(() => window.atoumweb.quotes.accept(quote.id), 'Devis accepté : le prospect est converti/rattaché au client et le projet peut être créé.');
  }

  async function refuse() {
    if (!quote) return;
    const reason = window.prompt('Raison du refus / de la perte', 'Projet refusé par le prospect');
    if (!reason?.trim()) return;
    await run(async () => {
      if (quote.status === 'sent' || quote.status === 'viewed') await window.atoumweb.quotes.refuse(quote.id);
      await window.atoumweb.crm.prospects.changeStage(prospect.id, 'lost', reason.trim());
    }, 'Devis refusé et prospect classé perdu.');
  }

  if (!quote) return <section className="prospect-work-section prospect-quote-panel"><div className="work-section-heading"><div><span className="eyebrow">Devis actif</span><strong>Aucun devis lié</strong></div></div><p className="muted">Le devis sera créé depuis les besoins du prospect et restera d’abord en préparation.</p></section>;

  return <section className="prospect-work-section prospect-quote-panel">
    <div className="quote-command-header"><div><span className="eyebrow">Devis actif</span><strong>{quote.number} · {quote.subject}</strong><small>{QUOTE_LABELS[quote.status] ?? quote.status}{isFinalized && quote.status === 'draft' ? ' · prêt à envoyer' : ''}</small></div><button type="button" className="secondary-button compact-button" onClick={() => openQuote(quote)}>Ouvrir le devis complet</button></div>
    <div className="quote-command-summary"><div><span>Montant</span><strong>{money(quote.contractValueCents)}</strong></div><div><span>Envoyé</span><strong>{date(quote.sentAt)}</strong></div><div><span>Valable jusqu’au</span><strong>{date(quote.validUntil)}</strong></div></div>
    {error && <p className="form-error">{error}</p>}

    {canEdit && !isFinalized && <div className="quote-command-actions"><button className="secondary-button" type="button" disabled={busy} onClick={() => openQuote(quote)}>Modifier le devis</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void pauseQuote()}>Mettre en pause / info manquante</button><button className="primary-button" type="button" disabled={busy} onClick={() => void finalize()}>Devis prêt à envoyer</button></div>}

    {canEdit && isFinalized && <div className="quote-send-block"><button className="primary-button" type="button" onClick={() => setSendOpen((value) => !value)}>Envoyer / enregistrer l’envoi</button>{sendOpen && <div className="inline-editor"><strong>Envoi du devis</strong><label>Canal<select value={channel} onChange={(e) => setChannel(e.target.value)}>{CHANNELS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Destinataire<input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Nom, email ou adresse utilisée" /></label><label>Note<textarea value={sendNote} onChange={(e) => setSendNote(e.target.value)} placeholder="Facultatif" /></label><div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setSendOpen(false)}>Annuler</button><button className="primary-button" type="button" disabled={busy} onClick={() => void sendQuote()}>Confirmer l’envoi</button></div></div>}</div>}

    {sent && <div className="quote-after-send"><div className="quote-command-actions"><button className="secondary-button" type="button" onClick={() => openQuote(quote)}>Prévisualiser / consulter</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void negotiation()}>Négociation</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void duplicate()}>Refaire / dupliquer le devis</button><button className="primary-button" type="button" disabled={busy} onClick={() => void accept()}>Devis accepté</button><button className="secondary-button danger-outline" type="button" disabled={busy} onClick={() => void refuse()}>Refusé / Perdu</button></div>
      <div className="followup-inline"><label>Prochaine relance<input type="date" value={followDate} onChange={(e) => setFollowDate(e.target.value)} /></label><button className="secondary-button" type="button" disabled={busy || !followDate} onClick={() => void scheduleFollowUp()}>Programmer la relance</button></div>
      <details className="waiting-inline"><summary>Mettre en attente</summary><div className="waiting-form"><label>Motif<select value={waitReason} onChange={(e) => setWaitReason(e.target.value)}>{WAITING_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{waitReason === 'other' && <label>Préciser<input value={waitOther} onChange={(e) => setWaitOther(e.target.value)} /></label>}<label>Date de reprise <small>(facultative)</small><input type="date" value={resumeDate} onChange={(e) => setResumeDate(e.target.value)} /></label><button className="secondary-button" type="button" disabled={busy} onClick={() => void waiting()}>Confirmer l’attente</button></div></details>
    </div>}
    {quotes.length > 1 && <details className="previous-quotes"><summary>Voir les {quotes.length - 1} ancien(s) devis</summary>{quotes.slice(1).map((item) => <button type="button" className="workflow-link" key={item.id} onClick={() => openQuote(item)}>{item.number} · {item.subject} · {QUOTE_LABELS[item.status] ?? item.status}</button>)}</details>}
  </section>;
}

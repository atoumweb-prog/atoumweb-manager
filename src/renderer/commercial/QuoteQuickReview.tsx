import {useEffect, useRef, useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {QuoteContractParameters} from '../../shared/quoteContractPreparation';
import {
  applyQuickAnswers, proposeQuickAnswers, quickAnswersProblems, QUICK_CHANNEL_LABELS, QUICK_KIND_LABELS, QUICK_RENEWAL_LABELS, QUICK_REVIEW_CODES,
  type QuickAnswers, type QuickChannel, type QuickKind, type QuickRenewal, type QuickReviewInput, type QuickWarrantyDays,
} from '../../shared/quoteQuickReview';
import {useUnsavedDraft} from '../unsaved/unsaved';
import './quote-send.css';

/**
 * Lot 4 — les six points à confirmer avant l'envoi, en questions simples et pré-remplies.
 * Les réponses proposées ne sont enregistrées qu'au clic sur « Valider mes réponses ».
 */
export function QuoteQuickReview({quote, onSaved}: {quote: QuoteDetail; onSaved: () => void}) {
  const [parameters, setParameters] = useState<QuoteContractParameters | null>(null);
  const [answers, setAnswers] = useState<QuickAnswers | null>(null);
  const [pendingCodes, setPendingCodes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const saving = useRef(false);
  const input: QuickReviewInput = {
    subject: quote.subject, needSummary: quote.needSummary ?? null, estimatedDelay: quote.estimatedDelay ?? null,
    lines: quote.lines.map(line => ({id: line.id, label: line.label, periodicity: typeof line.snapshot?.periodicity === 'string' ? line.snapshot.periodicity : null})),
  };
  const lineKey = quote.lines.map(line => line.id).join(',');

  const guard = useUnsavedDraft('Vérification avant envoi', answers, {group: 'quote:' + quote.id, ready: !!answers, pending: busy, discard: baseline => setAnswers(baseline)});

  useEffect(() => {
    let active = true;
    setAnswers(null); setParameters(null); setMessage('');
    void window.atoumweb.quotePreparation.get(quote.id).then(preparation => {
      if (!active || !preparation.parameters) return;
      const pending = preparation.issues.filter(issue => issue.severity === 'blocking' && QUICK_REVIEW_CODES.includes(issue.code)).map(issue => issue.code);
      setParameters(preparation.parameters); setPendingCodes(pending); setOpen(pending.length > 0);
      setAnswers(proposeQuickAnswers(input, preparation.parameters));
    }).catch(error => { if (active) setMessage(String(error)); });
    return () => { active = false; };
    // Rechargé quand le devis ou ses lignes changent ; une saisie en cours est protégée par le garde commun.
  }, [quote.id, quote.updatedAt, lineKey]);

  if (!answers || !parameters) return message ? <p role="alert">{message}</p> : null;
  const patch = (changes: Partial<QuickAnswers>) => setAnswers(current => current ? {...current, ...changes} : current);
  const problems = quickAnswersProblems(answers);

  async function save(): Promise<void> {
    if (saving.current || !answers || !parameters || problems.length) return;
    saving.current = true; setBusy(true); setMessage('');
    try {
      await window.atoumweb.quotePreparation.save(quote.id, applyQuickAnswers(parameters, answers, input), {parameters});
      guard.saved(answers);
      setMessage('Réponses enregistrées.');
      window.dispatchEvent(new Event('atoumweb:changed'));
      onSaved();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { saving.current = false; setBusy(false); }
  }

  return <details className="quote-quick-review" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{pendingCodes.length > 0 ? 'Avant d’envoyer : 6 réponses à valider' : 'Vérification avant envoi : réponses validées (modifier)'}</summary>
    <p className="muted">Les réponses sont déjà proposées d’après ton offre. Relis, corrige si besoin, puis valide. Elles figurent dans les conditions du devis.</p>

    <fieldset><legend>1. Comment le devis a-t-il été conclu ?</legend>
      <label>Avec le client<select value={answers.channel} onChange={event => patch({channel: event.target.value as QuickChannel})}>{(Object.keys(QUICK_CHANNEL_LABELS) as QuickChannel[]).map(channel => <option key={channel} value={channel}>{QUICK_CHANNEL_LABELS[channel]}</option>)}</select></label>
      <label>En quelques mots<input value={answers.context} onChange={event => patch({context: event.target.value})}/></label>
      <label>Ce que le client achète<input value={answers.purpose} onChange={event => patch({purpose: event.target.value})}/></label>
      {answers.channel === 'off_premises' && <p className="quote-send-note">Vente conclue hors de tes locaux : des vérifications supplémentaires seront demandées dans le détail (informations remises, droit de rétractation).</p>}
    </fieldset>

    <fieldset><legend>2. Que fournis-tu, et comment le remets-tu ?</legend>
      {(Object.keys(QUICK_KIND_LABELS) as QuickKind[]).map(kind => <label key={kind} className="quote-check"><input type="checkbox" checked={answers.kinds.includes(kind)} onChange={event => patch({kinds: event.target.checked ? [...answers.kinds, kind] : answers.kinds.filter(value => value !== kind)})}/><span>{QUICK_KIND_LABELS[kind]}</span></label>)}
      <label>Remise au client<input value={answers.delivery} onChange={event => patch({delivery: event.target.value})}/></label>
    </fieldset>

    <fieldset><legend>3. Quand livres-tu ?</legend>
      <div className="quote-quick-row">
        <label>Étape<input value={answers.milestoneLabel} onChange={event => patch({milestoneLabel: event.target.value})}/></label>
        <label>Date (si tu la connais)<input type="date" value={answers.milestoneDate} onChange={event => patch({milestoneDate: event.target.value})}/></label>
      </div>
      <label>Ou un repère<input value={answers.milestoneEvent} onChange={event => patch({milestoneEvent: event.target.value})} placeholder="Ex. 4 semaines après réception de l’acompte et des contenus"/></label>
    </fieldset>

    <fieldset><legend>4. Quelle garantie de correction après la livraison ?</legend>
      {quote.lines.map(line => {
        const days = answers.warranties.find(warranty => warranty.lineId === line.id)?.days ?? null;
        return <label key={line.id}>{line.label}<select value={days ?? 'none'} onChange={event => { const value = event.target.value === 'none' ? null : Number(event.target.value) as QuickWarrantyDays; patch({warranties: answers.warranties.map(warranty => warranty.lineId === line.id ? {...warranty, days: value} : warranty)}); }}>
          <option value="30">30 jours après la livraison</option><option value="60">60 jours après la livraison</option><option value="90">90 jours après la livraison</option><option value="none">Pas de garantie de correction (service continu, conseil…)</option>
        </select></label>;
      })}
      <p className="muted">Les garanties prévues par la loi restent toujours applicables.</p>
    </fieldset>

    <fieldset><legend>5. Cèdes-tu des droits particuliers au client ?</legend>
      <label className="quote-check"><input type="radio" name={'rights-' + quote.id} checked={!answers.specificRights} onChange={() => patch({specificRights: false})}/><span>Non, rien de particulier : le client utilise son site ou son contenu normalement</span></label>
      <label className="quote-check"><input type="radio" name={'rights-' + quote.id} checked={answers.specificRights} onChange={() => patch({specificRights: true})}/><span>Oui (cession de droits, exclusivité, remise des fichiers sources…) : à préciser dans le détail</span></label>
    </fieldset>

    <fieldset><legend>6. Le service se renouvelle-t-il ?</legend>
      {(Object.keys(QUICK_RENEWAL_LABELS) as QuickRenewal[]).map(renewal => <label key={renewal} className="quote-check"><input type="radio" name={'renewal-' + quote.id} checked={answers.renewal === renewal} onChange={() => patch({renewal})}/><span>{QUICK_RENEWAL_LABELS[renewal]}</span></label>)}
    </fieldset>

    {problems.length > 0 && <ul className="quote-send-problems">{problems.map(problem => <li key={problem}>{problem}</li>)}</ul>}
    {message && <p role="status">{message}</p>}
    <button type="button" className="primary-button" disabled={busy || problems.length > 0} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Valider mes réponses'}</button>
  </details>;
}

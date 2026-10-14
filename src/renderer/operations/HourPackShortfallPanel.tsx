import { useEffect, useRef, useState } from 'react';
import { useUnsavedDraft } from '../unsaved/unsaved';
import {
  HOUR_PACK_SHORTFALL_DECISIONS,
  type HourPackShortfallCandidate,
  type HourPackShortfallDecisionType,
  type HourPackShortfallReview,
} from '../../shared/hourPackShortfall';
import type { HourPack } from '../../shared/operations';
import './hour-pack-shortfall.css';

const DECISION_LABELS: Record<HourPackShortfallDecisionType, string> = {
  bill_complement: 'Facturer le complément',
  allow_negative: 'Autoriser exceptionnellement le négatif',
  use_other_pack: 'Utiliser un autre pack',
  commercial_gesture: 'Geste commercial',
  other: 'Autre décision',
};

function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

export function HourPackShortfallPanel({ pack, packs, onChanged, onMessage }: {
  pack: HourPack;
  packs: HourPack[];
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [review, setReview] = useState<HourPackShortfallReview | null>(null);
  const loadGeneration = useRef(0);
  const previousPackId = useRef(pack.id);

  useEffect(() => {
    const generation = ++loadGeneration.current;
    // Ne pas démonter l'éditeur pendant un simple rafraîchissement du même pack :
    // un brouillon local non enregistré doit survivre à une nouvelle lecture.
    if (previousPackId.current !== pack.id) {
      previousPackId.current = pack.id;
      setReview(null);
    }
    void window.atoumweb.hourPackShortfalls.review(pack.id)
      .then(next => { if (generation === loadGeneration.current) setReview(next); })
      .catch(error => {
        if (generation === loadGeneration.current) {
          onMessage(error instanceof Error ? error.message : 'Impossible de vérifier les dépassements du pack.');
        }
      });
    return () => { loadGeneration.current += 1; };
  }, [pack.id, pack.balanceSeconds, pack.movements.length]);

  if (!review || review.candidateCount === 0) return null;

  const alternatives = packs.filter((candidate) =>
    candidate.id !== pack.id
    && candidate.clientAccountId === pack.clientAccountId
    && candidate.status === 'active',
  );

  return <section className={`hour-pack-shortfall-panel ${review.unresolvedCount > 0 ? 'needs-decision' : 'resolved'}`}>
    <div className="hour-pack-shortfall-heading">
      <div><span className="eyebrow">Pack insuffisant</span><strong>{review.unresolvedCount > 0 ? `${review.unresolvedCount} décision(s) requise(s)` : 'Dépassement traité'}</strong></div>
      <span>{review.candidateCount} dépassement(s)</span>
    </div>
    <p className="muted">Le temps réel reste débité tel qu’il a été travaillé. La décision commerciale est enregistrée séparément et les éventuels ajustements sont ajoutés comme nouveaux mouvements.</p>
    <div className="hour-pack-shortfall-list">
      {review.candidates.map((candidate) => candidate.decision
        ? <div className="hour-pack-shortfall-resolved" key={candidate.debitMovementId}>
            <div><strong>{candidate.interventionNumber} · {candidate.interventionSubject}</strong><small>Dépassement : {duration(candidate.shortfallSeconds)}</small></div>
            <div><span className="status-pill">{DECISION_LABELS[candidate.decision.decision]}</span><small>{candidate.decision.reason}</small>{candidate.decision.expectedAmountCents > 0 && <small>{money(candidate.decision.expectedAmountCents)}</small>}{candidate.decision.alternativePackName && <small>Pack : {candidate.decision.alternativePackName}</small>}</div>
          </div>
        : <ShortfallDecisionEditor
            key={candidate.debitMovementId}
            packId={pack.id}
            candidate={candidate}
            alternatives={alternatives}
            onResolved={async (next) => { setReview(next); await onChanged(); }}
            onMessage={onMessage}
          />)}
    </div>
  </section>;
}

function ShortfallDecisionEditor({ packId, candidate, alternatives, onResolved, onMessage }: {
  packId: string;
  candidate: HourPackShortfallCandidate;
  alternatives: HourPack[];
  onResolved: (review: HourPackShortfallReview) => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [decision, setDecision] = useState<HourPackShortfallDecisionType>('bill_complement');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [alternativePackId, setAlternativePackId] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useUnsavedDraft('Décision de dépassement de pack', { decision, reason, amount, alternativePackId }, {
    group: `hour-pack-shortfall:${packId}:${candidate.debitMovementId}`,
    dirty: decision !== 'bill_complement' || !!reason.trim() || !!amount.trim() || !!alternativePackId,
    pending: saving,
    discard: () => { setDecision('bill_complement'); setReason(''); setAmount(''); setAlternativePackId(''); },
  });

  async function submit(): Promise<void> {
    if (savingRef.current) return;
    if (!reason.trim()) { onMessage('Indique le motif de la décision sur le dépassement du pack.'); return; }
    const parsedAmount = Number(amount.replace(',', '.'));
    const amountCents = decision === 'bill_complement' ? Math.round(parsedAmount * 100) : null;
    if (decision === 'bill_complement' && (amountCents == null || !Number.isFinite(amountCents) || amountCents <= 0)) {
      onMessage('Indique le montant du complément à facturer.');
      return;
    }
    if (decision === 'use_other_pack' && !alternativePackId) {
      onMessage('Choisis le pack alternatif.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const next = await window.atoumweb.hourPackShortfalls.decide(packId, {
        debitMovementId: candidate.debitMovementId,
        decision,
        reason: reason.trim(),
        expectedAmountCents: amountCents,
        alternativePackId: decision === 'use_other_pack' ? alternativePackId : null,
      });
      try {
        await onResolved(next);
        onMessage('Décision de dépassement du pack enregistrée.');
      } catch (error) {
        onMessage(error instanceof Error
          ? `Décision enregistrée, mais actualisation impossible : ${error.message}`
          : 'Décision enregistrée, mais actualisation impossible.');
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de confirmer l’enregistrement de la décision.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <div className="hour-pack-shortfall-editor">
    <div className="hour-pack-shortfall-summary">
      <div><strong>{candidate.interventionNumber}</strong><span>{candidate.interventionSubject}</span></div>
      <div><span>Débit réel</span><strong>{duration(candidate.debitedSeconds)}</strong></div>
      <div><span>Non couvert</span><strong>{duration(candidate.shortfallSeconds)}</strong></div>
    </div>
    <label>Décision<select value={decision} onChange={(event) => setDecision(event.target.value as HourPackShortfallDecisionType)}>{HOUR_PACK_SHORTFALL_DECISIONS.map((value) => <option key={value} value={value}>{DECISION_LABELS[value]}</option>)}</select></label>
    {decision === 'bill_complement' && <label>Montant du complément (€)<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ex. 35" /></label>}
    {decision === 'use_other_pack' && <label>Pack alternatif<select value={alternativePackId} onChange={(event) => setAlternativePackId(event.target.value)}><option value="">Choisir…</option>{alternatives.map((alternative) => <option key={alternative.id} value={alternative.id}>{alternative.name} · {duration(alternative.balanceSeconds)} restant</option>)}</select></label>}
    <label>Motif<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Pourquoi ce choix ?" /></label>
    <button className="primary-button" type="button" disabled={saving} onClick={() => void submit()}>{saving ? 'Enregistrement…' : 'Enregistrer la décision'}</button>
  </div>;
}

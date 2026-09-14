import { useEffect, useMemo, useState } from 'react';
import {
  MAINTENANCE_OVERAGE_DECISIONS,
  type MaintenanceOverageCandidate,
  type MaintenanceOverageDecisionType,
  type MaintenanceOverageReview,
} from '../../shared/maintenanceOverage';
import type { MaintenancePeriod } from '../../shared/operations';

const DECISION_LABELS: Record<MaintenanceOverageDecisionType, string> = {
  bill_out_of_scope: 'Facturer hors forfait',
  commercial_gesture: 'Geste commercial',
  include_exceptionally: 'Inclure exceptionnellement',
  carry_forward: 'Reporter à la période suivante',
  other: 'Autre décision',
};

interface Draft {
  decision: MaintenanceOverageDecisionType;
  reason: string;
  amount: string;
}

function defaultDraft(candidate: MaintenanceOverageCandidate): Draft {
  return {
    decision: candidate.decision?.decision ?? 'bill_out_of_scope',
    reason: candidate.decision?.reason ?? '',
    amount: candidate.decision?.expectedAmountCents ? String(candidate.decision.expectedAmountCents / 100) : '',
  };
}

function duration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${String(rest).padStart(2, '0')}` : `${rest} min`;
}

export function MaintenanceOveragePanel({ period, onMessage }: { period: MaintenancePeriod; onMessage: (message: string) => void }) {
  const [review, setReview] = useState<MaintenanceOverageReview | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      const next = await window.atoumweb.maintenanceOverages.review(period.id);
      setReview(next);
      setDrafts((current) => {
        const merged = { ...current };
        for (const candidate of next.candidates) {
          if (!merged[candidate.interventionId] || candidate.decision) merged[candidate.interventionId] = defaultDraft(candidate);
        }
        return merged;
      });
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les dépassements de maintenance.');
    }
  }

  useEffect(() => { void load(); }, [period.id, period.usage.interventionCount]);

  const unresolved = review?.unresolvedCount ?? 0;
  const candidates = useMemo(() => review?.candidates ?? [], [review]);

  function updateDraft(interventionId: string, patch: Partial<Draft>): void {
    setDrafts((current) => ({
      ...current,
      [interventionId]: { ...(current[interventionId] ?? { decision: 'bill_out_of_scope', reason: '', amount: '' }), ...patch },
    }));
  }

  async function save(candidate: MaintenanceOverageCandidate): Promise<void> {
    const draft = drafts[candidate.interventionId] ?? defaultDraft(candidate);
    setSavingId(candidate.interventionId);
    try {
      const amount = draft.decision === 'bill_out_of_scope'
        ? Math.max(0, Math.round(Number(draft.amount.replace(',', '.')) * 100))
        : 0;
      const next = await window.atoumweb.maintenanceOverages.decide(period.id, {
        interventionId: candidate.interventionId,
        decision: draft.decision,
        reason: draft.reason,
        expectedAmountCents: Number.isFinite(amount) ? amount : 0,
      });
      setReview(next);
      setDrafts((current) => {
        const merged = { ...current };
        for (const item of next.candidates) merged[item.interventionId] = defaultDraft(item);
        return merged;
      });
      onMessage(`Décision enregistrée pour ${candidate.interventionNumber}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la décision de dépassement.');
    } finally {
      setSavingId(null);
    }
  }

  if (!review || review.overageCount === 0) return null;

  return <section className="maintenance-overage-box">
    <div className="maintenance-overage-heading">
      <div><span className="eyebrow">Dépassement du forfait</span><strong>{review.overageCount} intervention(s) hors quota</strong></div>
      <span className={unresolved > 0 ? 'operation-priority priority-urgent' : 'operation-priority priority-low'}>{unresolved > 0 ? `${unresolved} à décider` : 'Décisions complètes'}</span>
    </div>
    <p className="muted">Le travail n’est jamais bloqué. Une décision est simplement requise pour chaque intervention hors quota avant la clôture de la période.</p>
    <div className="maintenance-overage-list">
      {candidates.map((candidate) => {
        const draft = drafts[candidate.interventionId] ?? defaultDraft(candidate);
        return <div key={candidate.interventionId} className="maintenance-overage-item">
          <div className="maintenance-overage-item-head">
            <div><strong>{candidate.interventionNumber} · {candidate.interventionSubject}</strong><small>{duration(candidate.totalTimeSeconds)} · {candidate.decision ? `Décision actuelle : ${DECISION_LABELS[candidate.decision.decision]}` : 'Aucune décision enregistrée'}</small></div>
          </div>
          <label>Décision<select value={draft.decision} disabled={period.status === 'closed'} onChange={(event) => updateDraft(candidate.interventionId, { decision: event.target.value as MaintenanceOverageDecisionType })}>{MAINTENANCE_OVERAGE_DECISIONS.map((decision) => <option key={decision} value={decision} disabled={decision === 'carry_forward' && !review.carryoverAllowed}>{DECISION_LABELS[decision]}{decision === 'carry_forward' && !review.carryoverAllowed ? ' — non prévu au contrat' : ''}</option>)}</select></label>
          {draft.decision === 'bill_out_of_scope' && <label>Montant à facturer (€)<input type="number" min="0" step="0.01" value={draft.amount} disabled={period.status === 'closed'} onChange={(event) => updateDraft(candidate.interventionId, { amount: event.target.value })} /></label>}
          <label>Motif / décision<input value={draft.reason} disabled={period.status === 'closed'} onChange={(event) => updateDraft(candidate.interventionId, { reason: event.target.value })} placeholder="Ex. 3e intervention du mois, facturation validée avec le client" /></label>
          <button className="secondary-button" type="button" disabled={period.status === 'closed' || savingId === candidate.interventionId || !draft.reason.trim() || (draft.decision === 'bill_out_of_scope' && !(Number(draft.amount.replace(',', '.')) > 0))} onClick={() => void save(candidate)}>{savingId === candidate.interventionId ? 'Enregistrement…' : candidate.decision ? 'Mettre à jour la décision' : 'Enregistrer la décision'}</button>
        </div>;
      })}
    </div>
  </section>;
}

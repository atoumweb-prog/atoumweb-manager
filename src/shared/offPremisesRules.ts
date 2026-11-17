import type { PaymentMilestone, QuoteContractParameters } from './quoteContractPreparation';

/**
 * Ventes hors établissement (décision de Carlos du 17/11/2026). Code de la consommation, art. L. 221-10 : le professionnel
 * ne peut recevoir aucun paiement ni contrepartie avant l'expiration d'un délai de sept jours à compter de la conclusion
 * du contrat hors établissement. Le premier paiement possible est donc le 8e jour après la signature.
 */
export const OFF_PREMISES_FIRST_PAYMENT_EVENT = 'Le 8e jour après la signature (hors établissement, art. L. 221-10 du Code de la consommation)';
type Channel = QuoteContractParameters['conclusion']['channel'];

const atSigning = (milestone: PaymentMilestone) => /commande|signature|acceptation/i.test(milestone.event) && !/8e jour/.test(milestone.event);

/** Hors établissement : un paiement prévu à la commande passe au 8e jour après la signature ; ailleurs, rien ne change. */
export function withOffPremisesPaymentDelay(milestones: PaymentMilestone[], channel: Channel): PaymentMilestone[] {
  if (channel !== 'off_premises') return milestones;
  return milestones.map(milestone => milestone.dueDate === null && atSigning(milestone) ? {...milestone, event: OFF_PREMISES_FIRST_PAYMENT_EVENT} : milestone);
}

/** Message bloquant si un paiement est encore demandé avant le 8e jour, quand le régime de protection s'applique. */
export function offPremisesPaymentIssue(milestones: PaymentMilestone[], channel: Channel, protectedBuyer: boolean, signedOn?: string | null): string | null {
  if (channel !== 'off_premises' || !protectedBuyer) return null;
  const earliest = signedOn ? new Date(new Date(signedOn + 'T12:00:00Z').getTime() + 7 * 86400000).toISOString().slice(0, 10) : null;
  const early = milestones.some(m => m.percent > 0 && (m.dueDate ? earliest !== null && m.dueDate <= earliest : atSigning(m)));
  return early ? 'Hors établissement : aucun paiement avant le 8e jour après la signature (art. L. 221-10). Mets la première échéance au 8e jour après la signature.' : null;
}

import { describe, expect, it } from 'vitest';
import { OFF_PREMISES_FIRST_PAYMENT_EVENT, offPremisesPaymentIssue, withOffPremisesPaymentDelay } from './offPremisesRules';

/** Ventes hors établissement (décision de Carlos du 17/11/2026 ; art. L. 221-10 : aucun paiement avant 7 jours). */
const milestones = [
  {label: 'Commande', percent: 40, dueDate: null, event: 'À la commande'},
  {label: 'Livraison', percent: 60, dueDate: null, event: 'À la livraison'},
];

describe('withOffPremisesPaymentDelay', () => {
  it('hors établissement : le paiement à la commande passe au 8e jour après la signature', () => {
    const next = withOffPremisesPaymentDelay(milestones, 'off_premises');
    expect(next[0]).toEqual({label: 'Commande', percent: 40, dueDate: null, event: OFF_PREMISES_FIRST_PAYMENT_EVENT});
    expect(next[1]).toEqual(milestones[1]);
    expect(OFF_PREMISES_FIRST_PAYMENT_EVENT).toContain('8e jour après la signature');
  });

  it('à distance ou en établissement : rien ne change', () => {
    expect(withOffPremisesPaymentDelay(milestones, 'distance')).toEqual(milestones);
    expect(withOffPremisesPaymentDelay(milestones, null)).toEqual(milestones);
  });
});

describe('offPremisesPaymentIssue', () => {
  it('bloque un échéancier hors établissement qui demande encore un paiement à la commande', () => {
    expect(offPremisesPaymentIssue(milestones, 'off_premises', true)).toMatch(/8e jour après la signature/);
  });

  it('accepte l’échéancier décalé, et ne dit rien hors du régime de protection', () => {
    expect(offPremisesPaymentIssue(withOffPremisesPaymentDelay(milestones, 'off_premises'), 'off_premises', true)).toBeNull();
    expect(offPremisesPaymentIssue(milestones, 'distance', true)).toBeNull();
    expect(offPremisesPaymentIssue(milestones, 'off_premises', false)).toBeNull();
  });

  it('bloque aussi une date d’échéance fixée moins de 8 jours après la signature', () => {
    const dated = [{label: 'Acompte', percent: 30, dueDate: '2026-11-20', event: ''}];
    expect(offPremisesPaymentIssue(dated, 'off_premises', true, '2026-11-17')).toMatch(/8e jour/);
    expect(offPremisesPaymentIssue([{...dated[0], dueDate: '2026-11-25'}], 'off_premises', true, '2026-11-17')).toBeNull();
  });
});

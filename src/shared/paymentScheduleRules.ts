import type { PaymentMilestone, PaymentPreset } from './quoteContractPreparation';
import { approvedPaymentPlan } from './approvedPaymentPlans';
import { billingKind, recurringMilestones, type BillingLine } from './quoteBillingRules';

/**
 * F71b : échéancier par défaut d'un devis brouillon, calculé depuis ses lignes. Jamais de 30 % par défaut.
 * Décisions de Carlos :
 *  - 13/11/2026 : prestations ponctuelles à 100 % à la commande ; abonnements hors acompte ; facilité de paiement
 *    manuelle uniquement ; sinon « Échéancier à définir » et envoi bloqué ;
 *  - 16/11/2026 : tous les sites (vitrine, boutique, landing, mariage) selon le montant de la partie création,
 *    40 / 60 sous 1 000 €, 30 / 40 / 30 à partir de 1 000 € ; familles de création et de développement WEB, ECOM,
 *    LANDING, MARIAGE, APP, DEVWP ; SEO Premium à 100 %.
 * Lecture de Claude, validée avec la fiche F71b : un développement de moins de 1 000 € se paie comme une ponctuelle.
 */
export interface ScheduleLine extends BillingLine { contractLineValueCents: number }
export type ScheduleDecision =
  | { status: 'rule'; preset: PaymentPreset; milestones: PaymentMilestone[]; reason: string }
  | { status: 'to_define'; reason: string };

export const SITE_FAMILIES: readonly string[] = ['WEB', 'ECOM', 'LANDING', 'MARIAGE'];
export const DEVELOPMENT_FAMILIES: readonly string[] = [...SITE_FAMILIES, 'APP', 'DEVWP'];
export const SITE_THRESHOLD_CENTS = 100000;

const family = (line: ScheduleLine) => String(line.snapshot?.familyCode ?? '').toUpperCase();
const euros = (cents: number) => `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
const devMilestones = (): PaymentMilestone[] => [
  { label: 'Commande', percent: 30, dueDate: null, event: 'À la commande' },
  { label: 'Étape intermédiaire', percent: 40, dueDate: null, event: 'À la validation de l’étape intermédiaire convenue' },
  { label: 'Livraison', percent: 30, dueDate: null, event: 'À la livraison' },
];
const orderMilestones = (): PaymentMilestone[] => [{ label: 'Commande', percent: 100, dueDate: null, event: 'À la commande' }];

export function defaultPaymentSchedule(lines: readonly ScheduleLine[]): ScheduleDecision {
  const oneOff = lines.filter((line) => billingKind(line.snapshot) === 'one_off');
  const recurring = lines.filter((line) => billingKind(line.snapshot) !== 'one_off');
  if (!oneOff.length) {
    if (!recurring.length) return { status: 'to_define', reason: 'Aucune prestation au devis.' };
    return { status: 'rule', preset: 'custom', milestones: recurringMilestones(recurring[0], false), reason: 'Abonnement : échéance propre, hors acompte.' };
  }
  const total = oneOff.reduce((sum, line) => sum + line.contractLineValueCents, 0);
  const large = total >= SITE_THRESHOLD_CENTS;
  if (oneOff.some((line) => line.snapshot?.itemType === 'offer' && SITE_FAMILIES.includes(family(line)))) {
    const plan = approvedPaymentPlan(large ? 'sites_ecommerce' : 'sites_vitrines')!;
    return { status: 'rule', preset: plan.preset, milestones: plan.milestones, reason: `Site de ${euros(total)} : ${plan.summary}.` };
  }
  if (oneOff.some((line) => DEVELOPMENT_FAMILIES.includes(family(line)))) {
    return large
      ? { status: 'rule', preset: '30_40_30', milestones: devMilestones(), reason: `Développement de ${euros(total)} : 30 / 40 / 30.` }
      : { status: 'rule', preset: 'order_100', milestones: orderMilestones(), reason: `Développement de ${euros(total)}, moins de 1 000 € : 100 % à la commande.` };
  }
  if (oneOff.some((line) => line.snapshot)) return { status: 'rule', preset: 'order_100', milestones: orderMilestones(), reason: 'Prestation ponctuelle : 100 % à la commande.' };
  return { status: 'to_define', reason: 'Aucune règle ne s’applique à ces lignes : choisis l’échéancier.' };
}

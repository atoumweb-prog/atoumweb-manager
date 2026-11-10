import type { PaymentMilestone, PaymentPreset } from './quoteContractPreparation';

/**
 * Échéanciers du pack approuvé V3.9.4 / V1.5 — règle OFF-007 « Échéanciers sites » :
 * « Vitrines : 40 % à la commande, 60 % avant mise en ligne. E-commerce : 30 % à la
 * commande, 40 % à validation du design, 30 % avant mise en ligne. »
 *
 * Source unique de ces pourcentages dans l'application. La règle est résolue par le code
 * source de l'offre (jamais par son libellé) et ne s'applique qu'à un devis neuf : aucun
 * devis existant n'est modifié.
 */
export type ApprovedPaymentPlanId = 'sites_vitrines' | 'sites_ecommerce';

export interface ApprovedPaymentPlan {
  id: ApprovedPaymentPlanId;
  reference: 'OFF-007';
  preset: PaymentPreset;
  /** Phrase affichée à l'utilisateur. */
  summary: string;
  milestones: PaymentMilestone[];
}

const milestone = (label: string, percent: number, event: string): PaymentMilestone => ({ label, percent, dueDate: null, event });

const PLANS: Record<ApprovedPaymentPlanId, ApprovedPaymentPlan> = {
  sites_vitrines: {
    id: 'sites_vitrines', reference: 'OFF-007', preset: 'custom',
    summary: '40 % à la commande, 60 % avant la mise en ligne',
    milestones: [milestone('Commande', 40, 'À la commande'), milestone('Solde', 60, 'Avant mise en ligne')],
  },
  sites_ecommerce: {
    id: 'sites_ecommerce', reference: 'OFF-007', preset: '30_40_30',
    summary: '30 % à la commande, 40 % à la validation du design, 30 % avant la mise en ligne',
    milestones: [
      milestone('Commande', 30, 'À la commande'),
      milestone('Validation du design', 40, 'À validation du design'),
      milestone('Mise en ligne', 30, 'Avant mise en ligne'),
    ],
  },
};

const VITRINE_CODES = new Set(['AW-WEB-VITRINE', 'V39-WEB-BUSINESS', 'V39-WEB-VISIBILITE']);
const ECOMMERCE_CODES = new Set(['AW-ECOM-BASE', 'V39-ECOM-BUSINESS', 'V39-ECOM-VISIBILITE']);

/** Copie indépendante : l'appelant peut dater ou ajuster les jalons sans toucher à la règle. */
export function approvedPaymentPlan(id: string | null | undefined): ApprovedPaymentPlan | null {
  const plan = id ? PLANS[id as ApprovedPaymentPlanId] : undefined;
  return plan ? { ...plan, milestones: plan.milestones.map(m => ({ ...m })) } : null;
}

/** Échéancier prévu pour une offre du pack, ou `null` : dans ce cas le réglage habituel s'applique. */
export function approvedPaymentPlanForCode(code: string | null | undefined): ApprovedPaymentPlan | null {
  const key = code?.trim().toUpperCase();
  if (!key) return null;
  return approvedPaymentPlan(VITRINE_CODES.has(key) ? 'sites_vitrines' : ECOMMERCE_CODES.has(key) ? 'sites_ecommerce' : null);
}

import { describe, expect, it } from 'vitest';
import { approvedPaymentPlan, approvedPaymentPlanForCode } from './approvedPaymentPlans';

describe('Échéanciers OFF-007 du pack approuvé', () => {
  it.each(['AW-WEB-VITRINE', 'V39-WEB-BUSINESS', 'V39-WEB-VISIBILITE'])('%s : 40 % à la commande, 60 % avant mise en ligne', code => {
    const plan = approvedPaymentPlanForCode(code)!;
    expect(plan.id).toBe('sites_vitrines');
    expect(plan.milestones.map(m => m.percent)).toEqual([40, 60]);
    expect(plan.milestones.map(m => m.event)).toEqual(['À la commande', 'Avant mise en ligne']);
  });

  it.each(['AW-ECOM-BASE', 'V39-ECOM-BUSINESS', 'V39-ECOM-VISIBILITE'])('%s : 30 / 40 / 30', code => {
    const plan = approvedPaymentPlanForCode(code)!;
    expect(plan.preset).toBe('30_40_30');
    expect(plan.milestones.map(m => m.percent)).toEqual([30, 40, 30]);
  });

  it('ne déduit rien d’un libellé, d’une maintenance ou d’une offre hors règle', () => {
    for (const code of [null, undefined, '', 'Site vitrine 5 pages', 'AW-MAINT-WP-M', 'AW-LP-BASE', 'AW-MARIAGE-HISTOIRE'])
      expect(approvedPaymentPlanForCode(code)).toBeNull();
    expect(approvedPaymentPlan('inconnu')).toBeNull();
  });

  it('rend une copie : dater un jalon ne modifie pas la règle', () => {
    approvedPaymentPlan('sites_vitrines')!.milestones[0].dueDate = '2026-12-01';
    expect(approvedPaymentPlan('sites_vitrines')!.milestones[0].dueDate).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { defaultPaymentSchedule, type ScheduleLine } from './paymentScheduleRules';

/** F71b : échéancier par défaut (décisions de Carlos du 13/11 et du 16/11/2026), jamais 30 % par défaut. */
let n = 0;
const line = (familyCode: string | null, euros: number, props: Record<string, unknown> = {}): ScheduleLine => ({
  id: `l${++n}`, contractLineValueCents: Math.round(euros * 100),
  snapshot: familyCode === null ? null : { familyCode, itemType: 'service', periodicity: 'ponctuelle', ...props },
});
const offer = (familyCode: string, euros: number) => line(familyCode, euros, { itemType: 'offer' });
const percents = (lines: ScheduleLine[]) => { const d = defaultPaymentSchedule(lines); return d.status === 'rule' ? d.milestones.map((m) => m.percent) : d.status; };

describe('F71b : sites selon le montant (vitrines comprises)', () => {
  it.each([
    ['Mariage Essentiel', 'MARIAGE', 399, [40, 60]],
    ['Landing Page', 'LANDING', 499, [40, 60]],
    ['Mariage Grand Jour', 'MARIAGE', 649, [40, 60]],
    ['Site vitrine 5 pages', 'WEB', 699, [40, 60]],
    ['Mariage Histoire', 'MARIAGE', 899, [40, 60]],
    ['Vitrine Business', 'WEB', 1149, [30, 40, 30]],
    ['Vitrine Visibilité', 'WEB', 1449, [30, 40, 30]],
    ['Boutique WooCommerce', 'ECOM', 1490, [30, 40, 30]],
    ['WooCommerce Business', 'ECOM', 1990, [30, 40, 30]],
    ['WooCommerce Visibilité', 'ECOM', 2390, [30, 40, 30]],
  ])('%s (%s, %s €) : %j', (_name, family, euros, expected) => {
    expect(percents([offer(family as string, euros as number)])).toEqual(expected);
  });

  it('seuil exact : 999,99 € en 40 / 60, 1 000 € en 30 / 40 / 30', () => {
    expect(percents([offer('WEB', 999.99)])).toEqual([40, 60]);
    expect(percents([offer('WEB', 1000)])).toEqual([30, 40, 30]);
  });

  it('les options ponctuelles comptent dans la partie création : vitrine 699 € + 400 € d’options = 30 / 40 / 30', () => {
    expect(percents([offer('WEB', 699), line('CONTENU', 400)])).toEqual([30, 40, 30]);
  });

  it('les jalons d’un site disent commande, validation du design, avant mise en ligne', () => {
    const d = defaultPaymentSchedule([offer('ECOM', 1490)]);
    expect(d.status === 'rule' && d.milestones.map((m) => m.event)).toEqual(['À la commande', 'À validation du design', 'Avant mise en ligne']);
    const small = defaultPaymentSchedule([offer('LANDING', 499)]);
    expect(small.status === 'rule' && small.milestones.map((m) => m.event)).toEqual(['À la commande', 'Avant mise en ligne']);
  });

  it('un abonnement ne compte pas dans le montant : vitrine 699 € + maintenance annuelle 539 € = 40 / 60', () => {
    expect(percents([offer('WEB', 699), line('MAINT', 539, { periodicity: 'annuelle' })])).toEqual([40, 60]);
  });
});

describe('F71b : développement, ponctuelles, abonnements', () => {
  it('développement sur devis : 800 € à 100 %, 1 500 € en 30 / 40 / 30', () => {
    expect(percents([line('APP', 800)])).toEqual([100]);
    expect(percents([line('DEVWP', 1500)])).toEqual([30, 40, 30]);
  });

  it('prestations ponctuelles à 100 % quel que soit le montant, SEO Premium compris', () => {
    expect(percents([line('PHOTO', 279)])).toEqual([100]);
    expect(percents([line('SEO', 899)])).toEqual([100]);
    expect(percents([line('CONTENU', 549), line('TECH', 549)])).toEqual([100]);
  });

  it('abonnement seul : son échéance propre, hors acompte (jamais 30 / 70)', () => {
    const yearly = defaultPaymentSchedule([line('MAINT', 539, { periodicity: 'annuelle' })]);
    expect(yearly).toMatchObject({ status: 'rule', milestones: [{ percent: 100, event: 'Au début de la période annuelle' }] });
    const monthly = defaultPaymentSchedule([line('MAINT', 49, { periodicity: 'mensuelle' })]);
    expect(monthly).toMatchObject({ status: 'rule', milestones: [{ percent: 100, event: 'Chaque mois, à partir du début du service' }] });
  });
});

describe('F71b : « Échéancier à définir »', () => {
  it('une ligne libre hors catalogue, seule, reste à définir', () => {
    expect(percents([line(null, 500)])).toBe('to_define');
  });
  it('un devis sans ligne reste à définir', () => {
    expect(percents([])).toBe('to_define');
  });
  it('une ligne libre avec une ponctuelle du catalogue suit la ponctuelle', () => {
    expect(percents([line('PHOTO', 119), line(null, 50)])).toEqual([100]);
  });
  it('aucune règle ne donne 30 / 70', () => {
    const all = [offer('WEB', 699), offer('ECOM', 1490), line('APP', 800), line('PHOTO', 9), line('MAINT', 49, { periodicity: 'mensuelle' })];
    for (const l of all) expect(percents([l])).not.toEqual([30, 70]);
  });
});

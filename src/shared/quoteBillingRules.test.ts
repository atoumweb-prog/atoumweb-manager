import {describe, expect, it} from 'vitest';
import {billingKind, includedQuantityFor, includedQuantityNote, isMixedBilling, lineCode, maintenanceQuotaOverlap, pluralUnit, reconcileLineSchedules} from './quoteBillingRules';

const line = (id: string, code: string, periodicity: string, extra: Record<string, unknown> = {}) => ({id, label: code, quantityMilli: 1000, snapshot: {provenance: {recordKey: code}, periodicity, ...extra}});
const base = [{label: 'Commande', percent: 40, dueDate: null, event: 'À la commande'}, {label: 'Solde', percent: 60, dueDate: null, event: 'Avant mise en ligne'}];

describe('règles de facturation d’un devis mixte (11/11/2026)', () => {
  it('lit le code source et la périodicité', () => {
    expect(lineCode({provenance: {recordKey: 'v39-web-business'}})).toBe('V39-WEB-BUSINESS');
    expect(lineCode({canonicalCode: 'aw-cont-page'})).toBe('AW-CONT-PAGE');
    expect(billingKind({periodicity: 'annuelle'})).toBe('yearly');
    expect(billingKind({priceMode: 'monthly'})).toBe('monthly');
    expect(billingKind({periodicity: 'ponctuelle'})).toBe('one_off');
  });

  it('création seule ou abonnement seul : rien à changer', () => {
    expect(reconcileLineSchedules([line('a', 'AW-WEB-VITRINE', 'ponctuelle')], base, undefined)).toBeUndefined();
    expect(reconcileLineSchedules([line('m', 'AW-MAINT-WP-A', 'annuelle')], base, undefined)).toBeUndefined();
  });

  it('création + maintenance annuelle : 40/60 sur la création, maintenance payable d’avance après les 30 jours de test', () => {
    const lines = [line('site', 'V39-WEB-BUSINESS', 'ponctuelle'), line('page', 'AW-CONT-PAGE', 'ponctuelle'), line('maint', 'AW-MAINT-WP-A', 'annuelle', {familyCode: 'MAINT'})];
    expect(isMixedBilling(lines)).toBe(true);
    const out = reconcileLineSchedules(lines, base, undefined)!;
    expect(out.map(s => s.lineId)).toEqual(['site', 'page', 'maint']);
    expect(out[0].milestones.map(m => m.percent)).toEqual([40, 60]);
    expect(out[1].milestones).toEqual(base);
    expect(out[2].milestones).toHaveLength(1);
    expect(out[2].milestones[0].percent).toBe(100);
    expect(out[2].milestones[0].label).toMatch(/payable d’avance/);
    expect(out[2].milestones[0].event).toMatch(/30 jours de test.*livraison officielle/);
  });

  it('abonnement mensuel : échéance mensuelle propre', () => {
    const out = reconcileLineSchedules([line('s', 'AW-WEB-VITRINE', 'ponctuelle'), line('m', 'AW-MAINT-WP-M', 'mensuelle', {familyCode: 'MAINT'})], base, undefined)!;
    expect(out[1].milestones[0].label).toBe('Chaque mois');
    expect(out[1].milestones[0].event).toMatch(/début de la maintenance/);
  });

  it('abonnement sans site créé dans le devis : pas de mention des 30 jours', () => {
    const out = reconcileLineSchedules([line('c', 'AW-CONT-PAGE', 'ponctuelle'), line('g', 'V39-GBP-ESS-A', 'annuelle')], base, undefined)!;
    expect(out[1].milestones[0].event).toBe('Au début de la période annuelle');
  });

  it('conserve les choix existants, complète les lignes ajoutées, revient au devis simple quand l’abonnement est retiré', () => {
    const custom = [{lineId: 'site', milestones: [{label: 'Tout', percent: 100, dueDate: null, event: 'À la commande'}]}];
    const added = reconcileLineSchedules([line('site', 'AW-WEB-VITRINE', 'ponctuelle'), line('p', 'AW-WEB-PAGE-SUP', 'ponctuelle')], base, custom)!;
    expect(added[0]).toBe(custom[0]);
    expect(added[1].milestones).toEqual(base);
    const simple = [{lineId: 'site', milestones: base}, {lineId: 'page', milestones: base}];
    expect(reconcileLineSchedules([line('site', 'AW-WEB-VITRINE', 'ponctuelle'), line('page', 'AW-CONT-PAGE', 'ponctuelle')], base, simple)).toBeNull();
    expect(reconcileLineSchedules([line('site', 'AW-WEB-VITRINE', 'ponctuelle'), line('page', 'AW-CONT-PAGE', 'ponctuelle')], base, undefined)).toBeUndefined();
  });

  it('3 pages incluses dans Business + 5 supplémentaires = 8 pages', () => {
    const business = line('b', 'V39-WEB-BUSINESS', 'ponctuelle');
    const pages = {...line('p', 'AW-CONT-PAGE', 'ponctuelle', {unit: 'page'}), quantityMilli: 5000};
    const q = includedQuantityFor(pages, [{...business, label: 'Vitrine Business'}, pages])!;
    expect(q).toMatchObject({includedQuantity: 3, soldQuantity: 5, total: 8, offerLabel: 'Vitrine Business'});
    expect(includedQuantityNote(q, 'page')).toBe('Total : 8 pages (3 dans « Vitrine Business » + 5 en supplément).');
    expect(includedQuantityFor(pages, [pages])).toBeNull();                                  // pas d’offre composée dans le devis
    expect(includedQuantityFor(business, [business, pages])).toBeNull();                      // l’offre elle-même n’est pas concernée
  });

  it('pluriel des unités', () => {
    expect(pluralUnit('page', 5)).toBe('pages');
    expect(pluralUnit('page', 1)).toBe('page');
    expect(pluralUnit('mois', 3)).toBe('mois');
    expect(pluralUnit('forfait', 2)).toBe('forfaits');
    expect(pluralUnit('', 2)).toBe('');
  });
});

describe('quota de la maintenance : intégration WordPress et 3 images', () => {
  const l = (id: string, code: string) => ({id, label: code, quantityMilli: 1000, snapshot: {provenance: {recordKey: code}}});
  it('signale les deux prestations quand le devis vend aussi une maintenance', () => {
    expect(maintenanceQuotaOverlap([l('1', 'AW-MAINT-WP-M'), l('2', 'AW-CONT-INTEG-WP'), l('3', 'AW-CONT-IMG3'), l('4', 'AW-CONT-PAGE')])).toEqual(['AW-CONT-INTEG-WP', 'AW-CONT-IMG3']);
    expect(maintenanceQuotaOverlap([l('1', 'AW-MAINT-WC-A'), l('2', 'AW-CONT-IMG3')])).toEqual(['AW-CONT-IMG3']);
  });
  it('ne dit rien sans maintenance dans le devis, ni pour les autres prestations', () => {
    expect(maintenanceQuotaOverlap([l('2', 'AW-CONT-INTEG-WP'), l('3', 'AW-CONT-IMG3')])).toEqual([]);
    expect(maintenanceQuotaOverlap([l('1', 'AW-MAINT-WP-M'), l('4', 'AW-CONT-PAGE'), l('5', 'AW-PHOTO-PACK10')])).toEqual([]);
    expect(maintenanceQuotaOverlap([])).toEqual([]);
  });
});

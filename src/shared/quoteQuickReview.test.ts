import { describe, expect, it } from 'vitest';
import { emptyContractParameters } from './quoteContractPreparation';
import { applyQuickAnswers, proposeQuickAnswers, quickAnswersProblems, type QuickReviewInput } from './quoteQuickReview';

const site: QuickReviewInput = { subject: 'Site vitrine', needSummary: 'Présenter le salon', estimatedDelay: '4 semaines', lines: [{ id: 'l1', label: 'Site vitrine 5 pages', periodicity: 'ponctuelle' }, { id: 'l2', label: 'Ligne libre' }] };
const maintenance: QuickReviewInput = { subject: 'Maintenance', needSummary: null, estimatedDelay: null, lines: [{ id: 'm1', label: 'Maintenance WordPress mensuelle', periodicity: 'mensuelle' }] };

describe('Lot 4 — vérification rapide avant envoi', () => {
  it('site : propose canal à distance, service, livraison estimée, garantie 30 jours, ni droits ni renouvellement', () => {
    const answers = proposeQuickAnswers(site, emptyContractParameters('professional', 40));
    expect(answers).toMatchObject({ channel: 'distance', purpose: 'Présenter le salon', kinds: ['classical_service'], milestoneLabel: 'Livraison', specificRights: false, renewal: 'none' });
    expect(answers.milestoneEvent).toContain('4 semaines');
    expect(answers.warranties).toEqual([{ lineId: 'l1', days: 30 }, { lineId: 'l2', days: 30 }]);
    expect(quickAnswersProblems(answers)).toEqual([]);
  });

  it('sans délai estimé, le repère de livraison reste à écrire : rien n’est inventé', () => {
    const answers = proposeQuickAnswers({ ...site, estimatedDelay: null }, emptyContractParameters('professional'));
    expect(answers.milestoneEvent).toBe('');
    expect(quickAnswersProblems(answers)).toEqual(['Indique une date ou un repère de livraison.']);
  });

  it('enregistre les six sujets sans toucher au paiement ni aux règles consommateur', () => {
    const before = emptyContractParameters('consumer', 40);
    const after = applyQuickAnswers(before, proposeQuickAnswers(site, before), site);
    expect(after.payment).toEqual(before.payment);
    expect(after.consumer).toEqual(before.consumer);
    expect(after.annexes).toEqual(before.annexes);
    expect(after.conclusion).toMatchObject({ channel: 'distance', purchasePurpose: 'Présenter le salon', offPremisesControlsVerified: false });
    expect(after.digital).toMatchObject({ kinds: ['classical_service'], mixed: false, supply: 'one_off' });
    expect(after.digital.qualificationReason).toContain('confirmée par le prestataire');
    expect(after.milestones).toHaveLength(1);
    expect(after.warranties).toEqual([
      { lineId: 'l1', kind: 'small_adjustment', days: 30, startEvent: 'Livraison officielle documentée', statutoryRightsUnaffected: true },
      { lineId: 'l2', kind: 'small_adjustment', days: 30, startEvent: 'Livraison officielle documentée', statutoryRightsUnaffected: true },
    ]);
    expect(after.rights).toMatchObject({ reviewed: true, applicable: false });
    expect(after.renewal).toMatchObject({ reviewed: true, applicable: false });
    expect(before.rights.reviewed).toBe(false); // l'original n'est pas modifié
  });

  it('maintenance mensuelle : pas de garantie corrective, arrêt possible en fin de mois payé', () => {
    const before = emptyContractParameters('professional', 100);
    const answers = proposeQuickAnswers(maintenance, before);
    expect(answers).toMatchObject({ renewal: 'monthly', milestoneLabel: 'Début du service', warranties: [{ lineId: 'm1', days: null }] });
    const after = applyQuickAnswers(before, answers, maintenance);
    expect(after.digital.supply).toBe('continuous');
    expect(after.warranties).toEqual([{ lineId: 'm1', kind: 'not_applicable', days: null, startEvent: '', statutoryRightsUnaffected: true }]);
    expect(after.renewal).toMatchObject({ applicable: true, mode: 'monthly_no_commitment', period: 'Mensuelle' });
    expect(after.renewal.termination).toContain('fin de la période payée');
  });

  it('maintenance annuelle : aucune reconduction automatique ; mensuel + annuel : cas à régler dans le détail', () => {
    const yearly: QuickReviewInput = { ...maintenance, lines: [{ id: 'a1', label: 'Maintenance annuelle', periodicity: 'yearly' }] };
    const p = emptyContractParameters('professional');
    const after = applyQuickAnswers(p, proposeQuickAnswers(yearly, p), yearly);
    expect(after.renewal).toMatchObject({ mode: 'express', period: 'Annuelle' });
    expect(after.renewal.termination).toContain('accord exprès');
    expect(proposeQuickAnswers({ ...maintenance, lines: [...maintenance.lines, ...yearly.lines] }, p).renewal).toBe('custom');
  });

  it('une valeur déjà enregistrée l’emporte sur la proposition et survit à un nouvel enregistrement', () => {
    const p = emptyContractParameters('professional');
    p.conclusion.channel = 'on_premises'; p.conclusion.context = 'Rendez-vous au bureau';
    p.warranties = [{ lineId: 'l1', kind: 'wordpress_custom', days: 60, startEvent: 'Mise en production', statutoryRightsUnaffected: true }];
    p.milestones = [{ label: 'Maquette', date: '2026-12-01' }, { label: 'Mise en ligne', date: '2027-01-15' }];
    p.rights = { ...p.rights, reviewed: true, applicable: true, uses: 'Site', duration: '10 ans', territory: 'Monde', sourceDelivery: 'Oui' };
    const answers = proposeQuickAnswers(site, p);
    expect(answers).toMatchObject({ channel: 'on_premises', context: 'Rendez-vous au bureau', milestoneLabel: 'Maquette', milestoneDate: '2026-12-01', milestoneEvent: '', specificRights: true });
    expect(answers.warranties[0]).toEqual({ lineId: 'l1', days: 60 });
    const after = applyQuickAnswers(p, answers, site);
    expect(after.warranties[0]).toMatchObject({ kind: 'wordpress_custom', days: 60, startEvent: 'Mise en production' });
    expect(after.milestones).toEqual([{ label: 'Maquette', date: '2026-12-01', event: '' }, { label: 'Mise en ligne', date: '2027-01-15' }]);
    expect(after.rights).toMatchObject({ applicable: true, uses: 'Site', duration: '10 ans' });
  });
});

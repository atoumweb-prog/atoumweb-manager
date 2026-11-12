import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {ContractTermsService} from './ContractTermsService';
import {QuoteContractPreparationService} from './QuoteContractPreparationService';
import {applyStarterPublication, planStarterPublication} from './StarterOffersPublication';
import {ADMIN_CONTRACT_KEYS, type ContractAdministration} from '../../shared/quoteContractPreparation';
import {applyQuickAnswers, proposeQuickAnswers, QUICK_REVIEW_CODES, type QuickReviewInput} from '../../shared/quoteQuickReview';
import {abbySheet} from '../../shared/abbySheet';
import {quoteEmailDraft} from '../../shared/quoteEmailDraft';
import {buildQuoteHtml} from './quotePdf';

let db: NodeSqliteAdapter, crm: CrmService, terms: ContractTermsService, preparation: QuoteContractPreparationService, quotes: QuoteService;

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256);
  applyStarterPublication(db, planStarterPublication(db).planSha256);
  crm = new CrmService(db); terms = new ContractTermsService(db); preparation = new QuoteContractPreparationService(db);
  quotes = new QuoteService(db, crm, terms, preparation);
  // « Mon entreprise » renseignée (lot 1) : valeurs fictives de test.
  preparation.saveAdministration(Object.fromEntries(ADMIN_CONTRACT_KEYS.map(key => [key, {state: 'filled', value: 'Valeur fictive ' + key, reason: ''}])) as ContractAdministration);
});
afterEach(() => db.close());

const versionOf = (code: string) => db.get<{id: string}>("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND status='published'", [code])!.id;
const blocking = (id: string) => preparation.get(id).issues.filter(issue => issue.severity === 'blocking').map(issue => issue.code);
function newQuote(code: string, label: string, plan?: 'sites_vitrines' | 'sites_ecommerce') {
  const organization = crm.createOrganization({name: 'TEST lot 4'});
  const prospect = crm.createProspect({organizationId: organization.id, primaryNeed: 'TEST'});
  return quotes.createWithLines({prospectId: prospect.id, subject: 'TEST ' + label, needSummary: 'Présenter l’activité', estimatedDelay: '4 semaines', ...(plan ? {paymentPlan: plan} : {})},
    [{catalogVersionId: versionOf(code), input: {label}}], {applyContractTerms: true, advanceNewProspect: true});
}
const inputOf = (id: string): QuickReviewInput => {
  const quote = quotes.get(id);
  return {subject: quote.subject, needSummary: quote.needSummary ?? null, estimatedDelay: quote.estimatedDelay ?? null,
    lines: quote.lines.map(line => ({id: line.id, label: line.label, periodicity: typeof line.snapshot?.periodicity === 'string' ? line.snapshot.periodicity : null}))};
};

describe('Lot 4 — envoyer et faire accepter', {timeout: 60000}, () => {
  it('devis vitrine neuf : seuls les six sujets de la vérification rapide bloquent, et les réponses proposées les lèvent tous', () => {
    const quote = newQuote('AW-WEB-VITRINE', 'Site vitrine 5 pages', 'sites_vitrines');
    const before = blocking(quote.id);
    expect(before.length).toBeGreaterThan(0);
    expect(before.every(code => QUICK_REVIEW_CODES.includes(code))).toBe(true);
    expect(() => quotes.finalize(quote.id)).toThrow();

    const parameters = preparation.parameters(quote.id)!, input = inputOf(quote.id);
    preparation.save(quote.id, applyQuickAnswers(parameters, proposeQuickAnswers(input, parameters), input), {parameters});
    expect(blocking(quote.id)).toEqual([]);
    // L'échéancier 40 / 60 du lot 3 n'est pas touché par la vérification rapide.
    expect(preparation.parameters(quote.id)!.payment.milestones.map(m => m.percent)).toEqual([40, 60]);
  });

  it('un devis sans donnée personnelle n’a ni annexe RGPD ni case à cocher', () => {
    const prospect = crm.createProspect({organizationId: crm.createOrganization({name: 'TEST sans données'}).id, primaryNeed: 'TEST'});
    const quote = quotes.create({prospectId: prospect.id, subject: 'TEST prestation sans donnée'});
    quotes.addCustomLine(quote.id, {label: 'Retouche photo', proposedUnitPriceCents: 4500});
    expect(quotes.get(quote.id).dataAgreementModel).toMatchObject({required: false, handedAt: null});
    expect(quotes.setDataAgreementModelHanded(quote.id, true).dataAgreementModel?.handedAt).toBeNull();
    const html = buildQuoteHtml(quotes.get(quote.id), terms.presentation(quote.id));
    expect(html).not.toContain('MODÈLE POUR INFORMATION');
  });

  it('préparation puis envoi confirmé : le texte transmis est figé, la fiche Abby reprend le devis', () => {
    const quote = newQuote('AW-WEB-VITRINE', 'Site vitrine 5 pages', 'sites_vitrines');
    const parameters = preparation.parameters(quote.id)!, input = inputOf(quote.id);
    preparation.save(quote.id, applyQuickAnswers(parameters, proposeQuickAnswers(input, parameters), input), {parameters});

    const prepared = quotes.finalize(quote.id);
    expect(prepared.status).toBe('draft');
    expect(prepared.finalizedAt).toBeTruthy();
    const state = quotes.transmissionState(quote.id);
    // Un site touche des données personnelles : le modèle d'accord RGPD est joint au PDF et sa remise doit être attestée avant l'envoi.
    const attestation = {operationId: 'op-lot4', preparationId: state.preparationId, contentHash: state.contentHash!, confirmed: true as const, channel: 'other' as const, provenance: 'E-mail à client@example.test', occurredAt: 'now'};
    expect(quotes.get(quote.id).dataAgreementModel).toMatchObject({required: true, handedAt: null});
    expect(() => quotes.markSent(quote.id, attestation)).toThrow(/Modèle d’accord RGPD remis au client/);
    expect(quotes.setDataAgreementModelHanded(quote.id, true).dataAgreementModel?.handedAt).toBeTruthy();
    expect(quotes.setDataAgreementModelHanded(quote.id, false).dataAgreementModel?.handedAt).toBeNull();
    expect(quotes.setDataAgreementModelHanded(quote.id, true).dataAgreementModel?.handedAt).toBeTruthy();
    const html = buildQuoteHtml(quotes.get(quote.id), terms.presentation(quote.id));
    expect(html).toContain('MODÈLE POUR INFORMATION');
    expect(html).toContain('FICHE A');
    expect(html).toContain('Annexe au devis ' + quotes.get(quote.id).number);
    const sent = quotes.markSent(quote.id, attestation);
    expect(sent.status).toBe('sent');
    expect(sent.dataAgreementModel).toBeNull();
    expect(sent.contractTextSnapshot).toContain('30 jours');
    expect(JSON.parse(sent.contractSnapshotJson!).parameters.payment.milestones.map((m: {event: string}) => m.event)).toEqual(['À la commande', 'Avant mise en ligne']);
    // Rejeu de la même confirmation : aucun second envoi ; une autre confirmation est refusée.
    expect(quotes.markSent(quote.id, {operationId: 'op-lot4', preparationId: state.preparationId, contentHash: state.contentHash!, confirmed: true, channel: 'other', provenance: 'E-mail à client@example.test', occurredAt: 'now'}).status).toBe('sent');
    expect(db.get<{n: number}>('SELECT count(*) n FROM quote_contract_transmissions WHERE quote_id=?', [quote.id])!.n).toBe(1);
    expect(() => preparation.save(quote.id, parameters)).toThrow();

    const sheet = abbySheet(sent, preparation.parameters(quote.id));
    expect(sheet.client[0]).toBe('TEST lot 4');
    expect(sheet.lines).toEqual([{label: expect.any(String), quantity: '1 forfait', unitPrice: '699,00 €', total: '699,00 €'}]);
    expect(sheet.total).toBe('699,00 €');
    expect(sheet.payments.map(p => [p.amount, p.when])).toEqual([['279,60 €', 'À la commande'], ['419,40 €', 'Avant mise en ligne']]);
    expect(sheet.text.payments).not.toMatch(/payé|reçu|encaissé/i);
  });

  it('maintenance mensuelle : pas de garantie corrective, renouvellement au mois, plus rien ne bloque', () => {
    const quote = newQuote('AW-MAINT-WP-M', 'Maintenance WordPress mensuelle');
    const parameters = preparation.parameters(quote.id)!, input = inputOf(quote.id);
    const answers = proposeQuickAnswers(input, parameters);
    expect(answers.renewal).toBe('monthly');
    expect(answers.warranties.map(w => w.days)).toEqual([null]);
    preparation.save(quote.id, applyQuickAnswers(parameters, answers, input), {parameters});
    expect(blocking(quote.id).filter(code => QUICK_REVIEW_CODES.includes(code))).toEqual([]);
  });

  it('brouillon d’e-mail : adresse du contact, objet clair, jamais de pièce jointe ni d’adresse invalide', () => {
    const base = {number: 'DEV-2026-010', subject: 'Site vitrine & blog', validUntil: '2026-12-10T10:00:00.000Z'};
    const draft = quoteEmailDraft({...base, recipient: {email: 'contact@exemple.test', contactEmail: 'marie@exemple.test'} as never});
    expect(draft.to).toBe('marie@exemple.test');
    expect(draft.subject).toBe('Devis DEV-2026-010 — Site vitrine & blog');
    expect(draft.body).toContain('conditions générales de vente');
    expect(draft.mailto.startsWith('mailto:marie%40exemple.test?subject=Devis%20DEV-2026-010')).toBe(true);
    expect(draft.mailto).toContain('%26%20blog');
    expect(draft.mailto).not.toMatch(/attach/i);
    expect(quoteEmailDraft({...base, recipient: {email: 'pas une adresse, x@y.z?cc=autre@exemple.test'} as never}).to).toBeNull();
    expect(quoteEmailDraft({...base, recipient: null}).mailto.startsWith('mailto:?subject=')).toBe(true);
  });
});

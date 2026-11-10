import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {ContractTermsService} from './ContractTermsService';
import {QuoteContractPreparationService} from './QuoteContractPreparationService';
import {applyStarterPublication, planStarterPublication} from './StarterOffersPublication';

let db: NodeSqliteAdapter, crm: CrmService, terms: ContractTermsService, quotes: QuoteService, preparation: QuoteContractPreparationService;

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256);
  applyStarterPublication(db, planStarterPublication(db).planSha256);
  crm = new CrmService(db); terms = new ContractTermsService(db); preparation = new QuoteContractPreparationService(db);
  quotes = new QuoteService(db, crm, terms, preparation);
});
afterEach(() => db.close());

const versionOf = (code: string) => db.get<{id: string}>("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND status='published'", [code])!.id;
const newProspect = () => crm.createProspect({organizationId: crm.createOrganization({name: 'TEST lot 3'}).id, primaryNeed: 'TEST'});
const stage = (id: string) => crm.listProspects({includeArchived: true}).find(p => p.id === id)!.stage;
const quick = {applyContractTerms: true, advanceNewProspect: true};

describe('Lot 3 — devis rapide', {timeout: 30000}, () => {
  it('vitrine : 40 / 60 selon OFF-007, CGV posées dès la création, prospect neuf passé à « Devis à préparer »', () => {
    const p = newProspect();
    expect(stage(p.id)).toBe('new');
    const q = quotes.createWithLines({prospectId: p.id, subject: 'TEST vitrine', paymentPlan: 'sites_vitrines', depositPercent: 30}, [{catalogVersionId: versionOf('AW-WEB-VITRINE'), input: {label: 'Site vitrine 5 pages'}}], quick);
    expect(q.depositPercent).toBe(40);
    expect(q.depositCents).toBe(Math.round(q.contractValueCents * 0.4));
    const payment = preparation.parameters(q.id)!.payment;
    expect(payment.preset).toBe('custom');
    expect(payment.milestones.map(m => [m.percent, m.event])).toEqual([[40, 'À la commande'], [60, 'Avant mise en ligne']]);
    expect(terms.getQuoteBuild(q.id).clauses.length).toBeGreaterThan(10);
    expect(terms.proposeQuoteUpdate(q.id).changes).toEqual([]);
    expect(stage(p.id)).toBe('quote_to_prepare');
    expect(db.get<{n: number}>("SELECT count(*) n FROM activity_log WHERE entity_id=? AND action='quote_contract_synced' AND summary LIKE '%automatiquement%'", [q.id])!.n).toBe(1);
  });

  it('WooCommerce : 30 / 40 / 30', () => {
    const q = quotes.createWithLines({prospectId: newProspect().id, subject: 'TEST boutique', paymentPlan: 'sites_ecommerce'}, [{catalogVersionId: versionOf('AW-ECOM-BASE'), input: {label: 'Boutique WooCommerce'}}], quick);
    expect(q.depositPercent).toBe(30);
    const payment = preparation.parameters(q.id)!.payment;
    expect(payment.preset).toBe('30_40_30');
    expect(payment.milestones.map(m => m.percent)).toEqual([30, 40, 30]);
    expect(payment.milestones[1].event).toBe('À validation du design');
  });

  it('sans option de devis rapide : ni CGV posées, ni changement d’étape (comportement historique)', () => {
    const p = newProspect();
    const q = quotes.createWithLines({prospectId: p.id, subject: 'TEST historique'}, [{catalogVersionId: versionOf('AW-WEB-VITRINE'), input: {label: 'Site vitrine 5 pages'}}]);
    expect(terms.getQuoteBuild(q.id).clauses).toHaveLength(0);
    expect(stage(p.id)).toBe('new');
    expect(preparation.parameters(q.id)!.payment.preset).toBe('30_70');
  });

  it('refuse un échéancier inconnu sans créer de devis ni réserver de numéro', () => {
    const p = newProspect();
    expect(() => quotes.createWithLines({prospectId: p.id, subject: 'TEST', paymentPlan: 'inconnu' as never}, [], quick)).toThrow(/Échéancier inconnu/);
    expect(quotes.list({prospectId: p.id})).toHaveLength(0);
    expect(stage(p.id)).toBe('new');
  });

  it('devis libre sans offre : créé sans clause et sans erreur', () => {
    const q = quotes.createWithLines({prospectId: newProspect().id, subject: 'TEST libre', depositPercent: 30}, [{input: {label: 'Conseil', proposedUnitPriceCents: 10000, catalogUnitPriceCents: 10000}}], quick);
    expect(q.lines).toHaveLength(1);
    expect(q.depositPercent).toBe(30);
  });
});

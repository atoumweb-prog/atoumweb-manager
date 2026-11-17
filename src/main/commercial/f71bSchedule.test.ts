import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ApprovedPackService } from './ApprovedPackService';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { ContractTermsService } from './ContractTermsService';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import { applyStarterPublication, planStarterPublication } from './StarterOffersPublication';

/** F71b : l'échéancier vient de la règle (jamais 30 % par défaut), suit les lignes d'un brouillon, respecte le choix manuel. */
let db: NodeSqliteAdapter, crm: CrmService, quotes: QuoteService, preparation: QuoteContractPreparationService;
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256);
  applyStarterPublication(db, planStarterPublication(db).planSha256);
  crm = new CrmService(db); preparation = new QuoteContractPreparationService(db);
  quotes = new QuoteService(db, crm, new ContractTermsService(db), preparation);
});
afterEach(() => db.close());

const versionOf = (code: string) => db.get<{ id: string }>("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND status='published'", [code])!.id;
const owner = () => ({ prospectId: crm.createProspect({ organizationId: crm.createOrganization({ name: 'TEST F71b' }).id, primaryNeed: 'TEST' }).id });
const quick = { applyContractTerms: true };
const payment = (id: string) => preparation.parameters(id)!.payment;
const percents = (id: string) => payment(id).milestones.map((m) => m.percent);
const vitrine = () => quotes.createWithLines({ ...owner(), subject: 'TEST vitrine' }, [{ catalogVersionId: versionOf('AW-WEB-VITRINE'), input: { label: 'Site vitrine' } }], quick);

describe('F71b : échéancier posé par la règle', { timeout: 30000 }, () => {
  it('une vitrine sous 1 000 € reçoit 40 / 60 sans qu’on le demande, et l’acompte suit', () => {
    const q = vitrine();
    expect(q.contractValueCents).toBeLessThan(100000);
    expect(percents(q.id)).toEqual([40, 60]);
    expect(payment(q.id).origin).toBe('rule');
    expect(q.depositPercent).toBe(40);
    expect(q.depositCents).toBe(Math.round(q.contractValueCents * 0.4));
  });

  it('une vitrine Business (1 149 €) reçoit 30 / 40 / 30', () => {
    const q = quotes.createWithLines({ ...owner(), subject: 'TEST business' }, [{ catalogVersionId: versionOf('V39-WEB-BUSINESS'), input: { label: 'Vitrine Business' } }], quick);
    expect(percents(q.id)).toEqual([30, 40, 30]);
  });

  it('une ligne qui fait passer la création au-dessus de 1 000 € change l’échéancier, la retirer le remet', () => {
    const q = vitrine();
    const added = quotes.addCustomLine(q.id, { label: 'TEST pages en plus', proposedUnitPriceCents: 50000, catalogUnitPriceCents: 50000 });
    expect(percents(q.id)).toEqual([30, 40, 30]);
    const extra = added.lines.find((line) => line.label === 'TEST pages en plus')!;
    quotes.removeLine(extra.id);
    expect(percents(q.id)).toEqual([40, 60]);
  });

  it('un devis sans ligne, ou avec une ligne libre seule, est « à définir » et bloque l’envoi', () => {
    const q = quotes.createWithLines({ ...owner(), subject: 'TEST libre' }, [{ input: { label: 'Conseil', proposedUnitPriceCents: 10000, catalogUnitPriceCents: 10000 } }], quick);
    expect(payment(q.id).origin).toBe('to_define');
    expect(payment(q.id).milestones).toEqual([]);
    expect(quotes.get(q.id).depositPercent).toBeNull();
    expect(preparation.get(q.id).issues).toContainEqual(expect.objectContaining({ code: 'PAYMENT_TO_DEFINE', severity: 'blocking' }));
  });
});

describe('F71b : choix manuel et devis existants', { timeout: 30000 }, () => {
  it('un échéancier choisi à la main n’est jamais écrasé par la règle', () => {
    const q = vitrine();
    const p = preparation.parameters(q.id)!;
    p.payment.milestones = [{ label: 'Commande', percent: 50, dueDate: null, event: 'À la commande' }, { label: 'Solde', percent: 50, dueDate: null, event: 'À la livraison' }];
    p.payment.preset = 'custom';
    preparation.save(q.id, p);
    expect(payment(q.id).origin).toBe('manual');
    quotes.addCustomLine(q.id, { label: 'TEST pages en plus', proposedUnitPriceCents: 50000, catalogUnitPriceCents: 50000 });
    expect(percents(q.id)).toEqual([50, 50]);
  });

  it('une facilité de paiement donnée à la création (acompte explicite) est un choix manuel', () => {
    const q = quotes.createWithLines({ ...owner(), subject: 'TEST facilité', depositPercent: 20 }, [{ catalogVersionId: versionOf('AW-WEB-VITRINE'), input: { label: 'Site vitrine' } }], quick);
    expect(payment(q.id).origin).toBe('manual');
    expect(percents(q.id)[0]).toBe(20);
  });

  it('un devis existant (échéancier sans origine) n’est pas recalculé', () => {
    const q = vitrine();
    const p = preparation.parameters(q.id)!;
    const legacy = { ...p, payment: { ...p.payment, preset: '30_70' as const, milestones: [{ label: 'Commande', percent: 30, dueDate: null, event: 'Commande' }, { label: 'Livraison', percent: 70, dueDate: null, event: 'Livraison' }] } };
    delete (legacy.payment as { origin?: string }).origin;
    db.run('UPDATE quotes SET contract_parameters_json=?, deposit_percent=30 WHERE id=?', [JSON.stringify(legacy), q.id]);
    quotes.addCustomLine(q.id, { label: 'TEST pages en plus', proposedUnitPriceCents: 50000, catalogUnitPriceCents: 50000 });
    expect(percents(q.id)).toEqual([30, 70]);
  });
});

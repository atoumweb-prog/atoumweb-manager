import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {ContractTermsService} from './ContractTermsService';
import {QuoteContractPreparationService} from './QuoteContractPreparationService';
import {applyStarterPublication, planStarterPublication} from './StarterOffersPublication';
import {CatalogService} from './CatalogService';
import {buildQuoteHtml} from '../../shared/quoteDocumentHtml';
import {quotePaymentSchedule} from '../../shared/quotePaymentSchedule';

let db: NodeSqliteAdapter, crm: CrmService, terms: ContractTermsService, quotes: QuoteService, preparation: QuoteContractPreparationService;
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256);
  applyStarterPublication(db, planStarterPublication(db).planSha256);
  // La rédaction de page n'est pas dans les offres de départ : on la publie comme dans la préproduction validée.
  const cat = new CatalogService(db), draft = db.get<{item_id: string; id: string}>("SELECT item_id,id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')='AW-CONT-PAGE' AND status='draft'");
  if (draft) cat.publishVersion(draft.id, cat.getItem(draft.item_id).versions.find(v => v.id === draft.id));
  crm = new CrmService(db); terms = new ContractTermsService(db); preparation = new QuoteContractPreparationService(db);
  quotes = new QuoteService(db, crm, terms, preparation);
});
afterEach(() => db.close());

const versionOf = (code: string) => db.get<{id: string}>("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND status='published'", [code])!.id;
const prospect = () => crm.createProspect({organizationId: crm.createOrganization({name: 'TEST devis mixte'}).id, primaryNeed: 'TEST'});
const quick = {applyContractTerms: true, advanceNewProspect: true};
const cents = (n: number) => Math.round(n * 100);

/** Le devis DEV-2026-003 de Carlos, refait : Vitrine Business + 5 pages rédigées + maintenance annuelle = 2 183 €. */
function dev003() {
  return quotes.createWithLines({prospectId: prospect().id, subject: 'TEST DEV-2026-003', paymentPlan: 'sites_vitrines'}, [
    {catalogVersionId: versionOf('V39-WEB-BUSINESS'), input: {label: 'Vitrine Business'}},
    {catalogVersionId: versionOf('AW-CONT-PAGE'), input: {label: 'Rédaction page web', quantityMilli: 5000}},
    {catalogVersionId: versionOf('AW-MAINT-WP-A'), input: {label: 'Maintenance WordPress annuelle'}},
  ], quick);
}

describe('Devis mixte création + maintenance (décisions du 11/11/2026)', {timeout: 60000}, () => {
  it('40/60 sur la création et la rédaction seulement ; la maintenance se paie d’avance, à part', () => {
    const q = dev003();
    expect(q.contractValueCents).toBe(cents(2183));
    const p = preparation.parameters(q.id)!;
    expect(p.payment.lineSchedules).toHaveLength(3);
    const rows = quotePaymentSchedule(p, q.lines.map(l => ({id: l.id, label: l.label, contractLineValueCents: l.contractLineValueCents, snapshot: l.snapshot as Record<string, unknown>})), q.contractValueCents);
    const sum = (pred: (r: typeof rows[number]) => boolean) => rows.filter(pred).reduce((n, r) => n + r.amountCents, 0);
    const creation = (r: typeof rows[number]) => !['annuelle', 'yearly'].includes(r.periodicity ?? '');
    expect(sum(r => creation(r) && r.percent === 40)).toBe(cents(657.6));
    expect(sum(r => creation(r) && r.percent === 60)).toBe(cents(986.4));
    expect(sum(r => !creation(r))).toBe(cents(539));
    expect(q.depositCents).toBe(cents(657.6));                       // acompte = 40 % de 1 644 €, pas de 2 183 €
    expect(q.balanceCents).toBe(cents(2183 - 657.6));
  });

  it('un devis de création seule garde l’échéancier simple', () => {
    const q = quotes.createWithLines({prospectId: prospect().id, subject: 'TEST simple', paymentPlan: 'sites_vitrines'}, [{catalogVersionId: versionOf('AW-WEB-VITRINE'), input: {label: 'Vitrine'}}], quick);
    expect(preparation.parameters(q.id)!.payment.lineSchedules).toBeUndefined();
    expect(q.depositCents).toBe(Math.round(q.contractValueCents * 0.4));
  });

  it('retirer la maintenance remet le devis en échéancier simple', () => {
    const q = dev003();
    const maint = q.lines.find(l => l.label.startsWith('Maintenance'))!;
    const after = quotes.removeLine(maint.id);
    expect(preparation.parameters(after.id)!.payment.lineSchedules).toBeUndefined();
    expect(after.depositCents).toBe(Math.round(after.contractValueCents * 0.4));
  });

  it('PDF : 3 pages incluses + 5 en supplément = 8 pages, pluriel correct, répartition des paiements', () => {
    const q = dev003();
    const html = buildQuoteHtml(quotes.get(q.id), terms.presentation(q.id));
    expect(html).toContain('Total : 8 pages (3 dans « Vitrine Business » + 5 en supplément).');
    expect(html).toMatch(/5&nbsp;<span class="unit">pages<\/span>/);
    expect(html).toContain('657,60');
    expect(html).toContain('986,40');
    expect(html).toContain('539,00');
    expect(html).not.toMatch(/873,20|1[    ]?309,80/);
  });

  it('PDF : acceptation juste après le périmètre avec la case « conditions générales lues », annexe allégée, aucun tiret « — »', () => {
    const q = dev003();
    const html = buildQuoteHtml(quotes.get(q.id), terms.presentation(q.id));
    expect(html.indexOf('Acceptation du devis')).toBeGreaterThan(0);
    expect(html.indexOf('Acceptation du devis')).toBeLessThan(html.indexOf('<main class="annex">'));
    expect(html).toContain('J’ai lu les conditions générales jointes à ce devis');
    expect(html).toContain('Bon pour accord');
    expect(html).not.toContain('Informations du devis');
    expect(html).not.toContain('CGV communes');
    expect(html).not.toContain('Modules des prestations vendues');
    expect(html).not.toContain('Informations de l’entreprise');
    expect(html).not.toContain('rattachée au devis');
    expect(html).not.toMatch(/s(?:—|–|--)s/);
    expect(html).toContain('Conditions générales');
  });

  it('calendrier : début de maintenance après les 30 jours de test, livraison officielle du site', () => {
    const q = dev003();
    const commitments = terms.presentation(q.id).sections.find(s => s.id === 'commitments')!.text;
    expect(commitments).toContain('Début du service : À l’issue des 30 jours de test qui suivent la livraison officielle du site');
    expect(commitments).toContain('Livraison : à la livraison officielle du site, datée et constatée par écrit');
    expect(commitments).not.toContain('Début du service : date ou événement à préciser');
  });
});

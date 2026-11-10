import {describe, it, expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {ContractTermsService} from './ContractTermsService';
import {applyStarterPublication, planStarterPublication, starterClauseCodes, STARTER_OFFERS} from './StarterOffersPublication';

function imported() {
  const db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const s = new ApprovedPackService(db); s.apply(s.simulate().planSha256); return db;
}
function quoteFor(db: NodeSqliteAdapter, code: string, audience: 'professional' | 'consumer') {
  const crm = new CrmService(db), terms = new ContractTermsService(db), quotes = new QuoteService(db, crm, terms);
  const org = crm.createOrganization({name: 'TEST lot 2 ' + audience}), p = crm.createProspect({organizationId: org.id, primaryNeed: 'TEST'});
  const q = quotes.create({prospectId: p.id, subject: 'TEST ' + code, contractAudience: audience});
  const version = db.get<{id: string}>("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND status='published'", [code])!;
  quotes.addCatalogLine(q.id, version.id);
  return terms.syncQuote(q.id);
}

describe('Lot 2 — CGV disponibles pour les offres de départ', {timeout: 30000}, () => {
  it('derives V39 clauses from their base offer plus explicitly included services', () => {
    expect(starterClauseCodes('V39-WEB-BUSINESS')).toEqual(expect.arrayContaining(['WEB-OFFRE-5P-PERIMETRE', 'CONTENT-BRIEF', 'DATA-MESURE']));
    expect(starterClauseCodes('V39-WEB-BUSINESS')).not.toContain('WEB-NEWSLETTER-PERIMETRE');
    expect(starterClauseCodes('V39-ECOM-BUSINESS')).toEqual(expect.arrayContaining(['ECOM-PAIEMENT', 'WEB-NEWSLETTER-PERIMETRE', 'DATA-MESURE']));
    expect(starterClauseCodes('V39-WEB-VISIBILITE')).toEqual(expect.arrayContaining(['BLOG-PERIMETRE', 'CONTENT-SEO']));
    expect(starterClauseCodes('AW-WEB-VITRINE')).not.toContain('WEB-NEWSLETTER-PERIMETRE');
    expect(starterClauseCodes('AW-MAINT-WP-M')).toContain('MAINT-RENOUVELLEMENT');
  });

  it('publishes 8 offers, the base CGV except 119 and 033, the linked clauses — and a quote then gets its CGV', () => {
    const db = imported();
    try {
      const plan = planStarterPublication(db);
      expect(plan.blockers).toEqual([]);
      expect(plan.offers.map(o => o.code)).toEqual([...STARTER_OFFERS]);
      expect(plan.clauses.map(c => c.code)).not.toContain('BASE-REFERENCES-AGENCE');
      expect(plan.clauses.map(c => c.code)).not.toContain('CONS-MEDIATION');
      const before = db.all('SELECT * FROM quote_lines');
      const done = applyStarterPublication(db, plan.planSha256);
      expect(done.offersPublished).toBe(8);
      expect(db.all('SELECT * FROM quote_lines')).toEqual(before);
      // Rien d'autre que les 8 offres n'est publié parmi les 130.
      expect(db.get<{n: number}>("SELECT count(*) n FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey') IS NOT NULL AND status='published' AND json_extract(commercial_parameters_json,'$.sourceVersion') IS NOT NULL")!.n).toBe(8);

      const pro = quoteFor(db, 'AW-WEB-VITRINE', 'professional');
      const proCodes = pro.clauses.map(c => c.title);
      expect(pro.clauses.filter(c => c.sourceKind === 'base').length).toBeGreaterThan(10);
      expect(pro.clauses.filter(c => c.sourceKind !== 'base').length).toBe(8);
      expect(pro.compiledText).not.toMatch(/PAY-005|À COMPLÉTER/);
      expect(proCodes.join(' ')).not.toMatch(/références commerciales/i);
      const consumer = quoteFor(db, 'AW-WEB-VITRINE', 'consumer');
      expect(consumer.clauses.length).toBeGreaterThan(pro.clauses.length - 3);
      expect(consumer.compiledText).not.toMatch(/À COMPLÉTER/);

      const replay = planStarterPublication(db);
      expect(replay.offers.every(o => o.action === 'déjà publiée') && replay.clauses.every(c => c.action === 'déjà publiée')).toBe(true);
      expect(applyStarterPublication(db, replay.planSha256)).toMatchObject({offersPublished: 0, clausesPublished: 0, linksSet: 0});
      expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    } finally { db.close(); }
  });

  it('refuses a stale plan', () => {
    const db = imported();
    try { expect(() => applyStarterPublication(db, 'f'.repeat(64))).toThrow('périmé'); } finally { db.close(); }
  });
});

import {describe, expect, it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {CatalogService} from './CatalogService';
import {CatalogRecommendationsService} from './CatalogRecommendationsService';
import {ContractTermsService} from './ContractTermsService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {applyStarterPublication, planStarterPublication} from './StarterOffersPublication';
import {applySuggestedOptions, LEGACY_PAGE_NAME, planSuggestedOptions, SUGGESTED_OPTIONS} from './SuggestedOptionsPublication';

function ready() {
  const db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256);
  applyStarterPublication(db, planStarterPublication(db).planSha256);
  return db;
}
const published = (db: NodeSqliteAdapter, code: string) => db.get<{id: string; item_id: string; version_number: number}>(`SELECT v.id,v.item_id,v.version_number FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id
  WHERE v.status='published' AND (i.canonical_code=? OR json_extract(v.provenance_json,'$.recordKey')=?)`, [code, code])!;

describe('Lot 3 — options suggérées par offre', {timeout: 60000}, () => {
  it('prévoit sans écrire, puis publie, versionne les 8 offres et se rejoue sans effet', () => {
    const db = ready();
    try {
      const before = db.all('SELECT id,status FROM catalog_versions ORDER BY id');
      const plan = planSuggestedOptions(db);
      expect(plan.blockers).toEqual([]);
      expect(db.all('SELECT id,status FROM catalog_versions ORDER BY id')).toEqual(before);
      expect(plan.offers.map(o => o.action)).toEqual(Array(8).fill('nouvelle version'));
      expect(() => applySuggestedOptions(db, 'autre')).toThrow(/périmé/);

      const quoteLines = db.all('SELECT * FROM quote_lines');
      const vitrineBefore = published(db, 'AW-WEB-VITRINE');
      const done = applySuggestedOptions(db, plan.planSha256);
      expect(done.offerVersions).toBe(8);
      expect(done.servicesPublished).toBe(2);
      expect(db.all('SELECT * FROM quote_lines')).toEqual(quoteLines);

      const recommendations = new CatalogRecommendationsService(db), catalog = new CatalogService(db);
      // Par code : les noms des fiches historiques ne sont remplacés qu'à l'activation du pack.
      const names = (code: string) => recommendations.list(published(db, code).id).map(link => db.get<{code: string}>('SELECT canonical_code AS code FROM catalog_items WHERE id=?', [link.targetItemId])!.code);
      expect(names('AW-WEB-VITRINE')).toEqual(['AW-WEB-PAGE-SUP', 'AW-CONT-PAGE', 'AW-CONT-ART-SEO', 'AW-MAINT-WP-M', 'AW-MAINT-WP-A']);
      expect(names('V39-WEB-BUSINESS')).not.toContain('AW-CONT-PAGE');
      expect(names('V39-WEB-VISIBILITE')).toEqual(['AW-WEB-PAGE-SUP', 'AW-MAINT-WP-M', 'AW-MAINT-WP-A']);
      expect(names('AW-ECOM-BASE')).toHaveLength(SUGGESTED_OPTIONS['AW-ECOM-BASE'].length);
      expect(names('AW-MAINT-WP-A')).toEqual(['AW-TECH-AUDIT-REPRISE']);
      for (const code of Object.keys(SUGGESTED_OPTIONS))
        expect(recommendations.list(published(db, code).id).every(link => link.targetVersionStatus === 'published' && link.targetItemStatus === 'active')).toBe(true);

      // La nouvelle version garde les règles du pack, la provenance et le prix de la précédente.
      const vitrineAfter = published(db, 'AW-WEB-VITRINE');
      expect(vitrineAfter.version_number).toBe(vitrineBefore.version_number + 1);
      const versions = catalog.getItem(vitrineAfter.item_id).versions;
      const oldVersion = versions.find(v => v.id === vitrineBefore.id)!, newVersion = versions.find(v => v.id === vitrineAfter.id)!;
      expect(oldVersion.status).toBe('retired');
      expect([newVersion.priceCents, newVersion.provenance, newVersion.inclusions]).toEqual([oldVersion.priceCents, oldVersion.provenance, oldVersion.inclusions]);
      const rules = (id: string) => db.get<{rules_json: string}>('SELECT rules_json FROM catalog_commercial_rules WHERE catalog_version_id=?', [id])?.rules_json;
      expect(rules(vitrineAfter.id)).toBe(rules(vitrineBefore.id));
      expect(rules(vitrineAfter.id)).toContain('AW-WEB-VITRINE');

      // Page supplémentaire : 79 €, avec ses clauses ; l'ancienne fiche à 99 € n'est plus proposable.
      const page = published(db, 'AW-WEB-PAGE-SUP');
      expect(catalog.getItem(page.item_id).versions.find(v => v.id === page.id)!.priceCents).toBe(7900);
      expect(db.get<{status: string}>('SELECT status FROM catalog_items WHERE name=? AND canonical_code IS NULL', [LEGACY_PAGE_NAME])?.status ?? 'inactive').toBe('inactive');
      const crm = new CrmService(db), terms = new ContractTermsService(db), service = new QuoteService(db, crm, terms);
      const prospect = crm.createProspect({organizationId: crm.createOrganization({name: 'TEST options'}).id, primaryNeed: 'TEST'});
      const without = service.createWithLines({prospectId: prospect.id, subject: 'TEST sans option', paymentPlan: 'sites_vitrines'}, [{catalogVersionId: vitrineAfter.id, input: {label: 'Site vitrine 5 pages'}}], {applyContractTerms: true});
      const withPage = service.createWithLines({prospectId: prospect.id, subject: 'TEST avec option', paymentPlan: 'sites_vitrines'}, [{catalogVersionId: vitrineAfter.id, input: {label: 'Site vitrine 5 pages'}}, {catalogVersionId: page.id, input: {label: 'Page supplémentaire'}}], {applyContractTerms: true});
      expect(withPage.contractValueCents).toBe(69900 + 7900);
      expect(terms.getQuoteBuild(withPage.id).clauses.length).toBeGreaterThan(terms.getQuoteBuild(without.id).clauses.length);

      const replay = planSuggestedOptions(db);
      expect(replay.blockers).toEqual([]);
      expect(replay.offers.every(o => o.action === 'à jour')).toBe(true);
      expect(applySuggestedOptions(db, replay.planSha256)).toMatchObject({servicesPublished: 0, clausesPublished: 0, linksSet: 0, offerVersions: 0});
    } finally { db.close(); }
  });
});

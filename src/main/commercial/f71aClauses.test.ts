import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ApprovedPackService } from './ApprovedPackService';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { ContractTermsService } from './ContractTermsService';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import { applyStarterPublication, planStarterPublication } from './StarterOffersPublication';
import { CatalogService } from './CatalogService';
import { CatalogRecommendationsService } from './CatalogRecommendationsService';
import { quoteRecommendationState, resolveRecommendationTargets } from '../../shared/quoteRecommendationStatus';

/** F71a (décision de Carlos du 16/11/2026) : une ligne ajoutée à un brouillon apporte aussitôt ses clauses. */
let db: NodeSqliteAdapter, crm: CrmService, terms: ContractTermsService, quotes: QuoteService;

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256);
  applyStarterPublication(db, planStarterPublication(db).planSha256);
  crm = new CrmService(db); terms = new ContractTermsService(db);
  quotes = new QuoteService(db, crm, terms, new QuoteContractPreparationService(db));
});
afterEach(() => db.close());

const versionOf = (code: string) => db.get<{ id: string }>("SELECT id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND status='published'", [code])!.id;
const prospect = () => crm.createProspect({ organizationId: crm.createOrganization({ name: 'TEST F71a' }).id, primaryNeed: 'TEST' }).id;
const vitrine = (applyContractTerms: boolean) => quotes.createWithLines({ prospectId: prospect(), subject: 'TEST vitrine', paymentPlan: 'sites_vitrines' },
  [{ catalogVersionId: versionOf('AW-WEB-VITRINE'), input: { label: 'Site vitrine' } }], { applyContractTerms });
const enabled = (quoteId: string) => terms.getQuoteBuild(quoteId).clauses.filter((c) => c.enabled).length;

describe('F71a : clauses d’une ligne ajoutée à un brouillon', { timeout: 30000 }, () => {
  it('une prestation ajoutée après la création apporte ses clauses, rien ne reste à appliquer à la main', () => {
    const q = vitrine(true);
    const before = enabled(q.id);
    quotes.addCatalogLine(q.id, versionOf('AW-MAINT-WP-M'), { label: 'Maintenance WordPress mensuelle' });
    expect(terms.proposeQuoteUpdate(q.id).changes).toEqual([]);
    expect(enabled(q.id)).toBeGreaterThan(before);
  });

  it('les clauses déjà posées gardent leur texte personnalisé', () => {
    const q = vitrine(true);
    const first = terms.getQuoteBuild(q.id).clauses.find((c) => c.enabled && c.sourceKind !== 'base')!;
    terms.updateQuoteClause(first.id, { title: first.title, body: `${first.body}\nTEST ajout manuel` });
    quotes.addCatalogLine(q.id, versionOf('AW-MAINT-WP-M'), { label: 'Maintenance WordPress mensuelle' });
    expect(terms.getQuoteBuild(q.id).clauses.find((c) => c.id === first.id)!.body).toContain('TEST ajout manuel');
  });

  it('une clause partagée par l’offre et l’option retient les deux provenances (rien à appliquer à la main)', () => {
    const q = vitrine(true);
    const shared = terms.getQuoteBuild(q.id).clauses.find((c) => c.enabled && c.sourceKind === 'catalog' && c.sourceClauseId)!;
    const catalog = new CatalogService(db);
    const option = catalog.create({ type: 'service', name: 'TEST option partagée F71a' }, { priceMode: 'fixed', priceCents: 9900 });
    catalog.publishVersion(option.versions[0].id);
    const linked = terms.getTemplate(shared.sourceClauseId!).catalogItemIds ?? [];
    terms.setCatalogLinks(shared.sourceClauseId!, [...linked, option.id]);
    quotes.addCatalogLine(q.id, option.versions[0].id, { label: 'Option partagée' });
    expect(terms.proposeQuoteUpdate(q.id).changes).toEqual([]);
  });

  it('un devis créé sans CGV ne reçoit pas de clauses d’office', () => {
    const q = vitrine(false);
    quotes.addCatalogLine(q.id, versionOf('AW-MAINT-WP-M'), { label: 'Maintenance WordPress mensuelle' });
    expect(terms.getQuoteBuild(q.id).clauses).toHaveLength(0);
  });
});

describe('F71a : suggestion posée sur une version devenue retirée', { timeout: 30000 }, () => {
  it('la suggestion prend la version publiée de l’option et s’ajoute au devis avec ses clauses', () => {
    const catalog = new CatalogService(db);
    const option = catalog.create({ type: 'service', name: 'TEST option F71a' }, { priceMode: 'fixed', priceCents: 9900 });
    const v1 = option.versions[0].id;
    catalog.publishVersion(v1);
    const recommendations = new CatalogRecommendationsService(db);
    // Lien historique tel qu'il existe en préproduction (posé quand v1 était publiée).
    db.run('INSERT INTO catalog_version_recommendations(id,source_version_id,target_version_id,sort_order,created_at) VALUES (?,?,?,0,?)', ['reco-f71a', versionOf('AW-WEB-VITRINE'), v1, '2026-11-16T00:00:00.000Z']);
    const v2 = catalog.createVersion(option.id, { priceMode: 'fixed', priceCents: 12900 });
    catalog.publishVersion(v2.id);
    const raw = recommendations.list(versionOf('AW-WEB-VITRINE'));
    expect(raw[0]).toMatchObject({ targetVersionId: v1, targetVersionStatus: 'retired', targetPublishedVersionId: v2.id });
    const [link] = resolveRecommendationTargets(raw);
    const q = vitrine(true);
    const offerLine = q.lines.find((line) => line.catalogVersionId === versionOf('AW-WEB-VITRINE'))!;
    expect(quoteRecommendationState(offerLine, link, q.lines)).toBe('recommended');
    const updated = quotes.addCatalogLine(q.id, link.targetVersionId, {});
    expect(updated.lines.some((line) => line.catalogVersionId === v2.id)).toBe(true);
    expect(terms.proposeQuoteUpdate(q.id).changes).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { ContractTermsService } from './ContractTermsService';
import { QuoteService } from './QuoteService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let catalog: CatalogService;
let contractTerms: ContractTermsService;
let quotes: QuoteService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  catalog = new CatalogService(database);
  contractTerms = new ContractTermsService(database);
  quotes = new QuoteService(database, crm, contractTerms);
});

afterEach(() => database.close());

function prospectId(): string {
  const organization = crm.createOrganization({ name: 'Client CGV' });
  return crm.createProspect({ organizationId: organization.id, primaryNeed: 'Site web' }).id;
}

function publishedService(name: string) {
  const item = catalog.create(
    { type: 'service', name, category: 'Tests CGV' },
    { priceMode: 'fixed', priceCents: 10000, description: name },
  );
  catalog.publishVersion(item.versions[0].id);
  return catalog.getItem(item.id);
}

function publishedClause(code: string, title: string, scope: 'base' | 'catalog', body: string, audience: 'all' | 'professional' | 'consumer' = 'all') {
  const clause = contractTerms.createTemplate({ code, title, scope, audience }, { body });
  return contractTerms.publishVersion(clause.versions[0].id);
}

function createConsumerProspect() {
  const contact = crm.createContact({ firstName: 'Camille', lastName: 'Particulier' });
  return crm.createProspect({ contactId: contact.id, primaryNeed: 'Site mariage' });
}

describe('ContractTermsService', () => {
  it('sélectionne automatiquement les clauses selon le type de client', () => {
    const common = publishedClause('BASE-COMMON', 'Socle commun', 'base', 'Tous clients.');
    const pro = publishedClause('BASE-PRO', 'Conditions professionnels', 'base', 'Uniquement B2B.', 'professional');
    const consumer = publishedClause('BASE-CONSUMER', 'Conditions consommateurs', 'base', 'Uniquement particuliers.', 'consumer');

    const professionalQuote = quotes.create({ prospectId: prospectId(), subject: 'Client pro' });
    const professionalBuild = contractTerms.syncQuote(professionalQuote.id);
    expect(professionalQuote.contractAudience).toBe('professional');
    expect(professionalBuild.audience).toBe('professional');
    expect(professionalBuild.clauses.some((clause) => clause.sourceClauseId === common.id)).toBe(true);
    expect(professionalBuild.clauses.some((clause) => clause.sourceClauseId === pro.id)).toBe(true);
    expect(professionalBuild.clauses.some((clause) => clause.sourceClauseId === consumer.id)).toBe(false);

    const consumerProspect = createConsumerProspect();
    const consumerQuote = quotes.create({ prospectId: consumerProspect.id, subject: 'Client particulier' });
    const consumerBuild = contractTerms.syncQuote(consumerQuote.id);
    expect(consumerQuote.contractAudience).toBe('consumer');
    expect(consumerBuild.audience).toBe('consumer');
    expect(consumerBuild.clauses.some((clause) => clause.sourceClauseId === common.id)).toBe(true);
    expect(consumerBuild.clauses.some((clause) => clause.sourceClauseId === consumer.id)).toBe(true);
    expect(consumerBuild.clauses.some((clause) => clause.sourceClauseId === pro.id)).toBe(false);
  });

  it('assemble le socle et les clauses des prestations sans doublonner une clause partagée', () => {
    const base = publishedClause('BASE-OBJET', 'Objet et acceptation', 'base', 'Socle commun.');
    const specific = publishedClause('WEB-CONTENU', 'Contenus fournis par le client', 'catalog', 'Le client fournit les contenus.');
    const site = publishedService('Site vitrine');
    const page = publishedService('Rédaction page');
    contractTerms.setCatalogLinks(specific.id, [site.id, page.id]);

    const quote = quotes.create({ prospectId: prospectId(), subject: 'Site + contenu' });
    quotes.addCatalogLine(quote.id, site.currentVersion!.id);
    quotes.addCatalogLine(quote.id, page.currentVersion!.id);

    const build = contractTerms.syncQuote(quote.id);
    expect(build.clauses.filter((clause) => clause.enabled)).toHaveLength(2);
    expect(build.clauses.find((clause) => clause.sourceClauseId === base.id)?.sourceKind).toBe('base');
    expect(build.clauses.find((clause) => clause.sourceClauseId === specific.id)?.sourceCatalogItemIds.sort())
      .toEqual([page.id, site.id].sort());
    expect(build.compiledText).toContain('1. Objet et acceptation');
    expect(build.compiledText).toContain('Contenus fournis par le client');
  });

  it('conserve une adaptation de clause prestation quand le modèle publié évolue', () => {
    const specific = publishedClause('WEB-DELAI', 'Délais de réalisation', 'catalog', 'Texte version 1.');
    const service = publishedService('Site vitrine');
    contractTerms.setCatalogLinks(specific.id, [service.id]);
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Adaptation' });
    quotes.addCatalogLine(quote.id, service.currentVersion!.id);
    const first = contractTerms.syncQuote(quote.id);
    const instance = first.clauses.find((clause) => clause.sourceClauseId === specific.id)!;

    contractTerms.updateQuoteClause(instance.id, { body: 'Texte adapté uniquement pour ce devis.' });
    const draft = contractTerms.createVersion(specific.id, { body: 'Texte version 2.' });
    contractTerms.publishVersion(draft.id);

    const after = contractTerms.syncQuote(quote.id);
    const adapted = after.clauses.find((clause) => clause.sourceClauseId === specific.id)!;
    expect(adapted.body).toBe('Texte adapté uniquement pour ce devis.');
    expect(adapted.isCustomized).toBe(true);

    const reset = contractTerms.resetQuoteClause(adapted.id);
    expect(reset.clauses.find((clause) => clause.sourceClauseId === specific.id)?.body).toBe('Texte version 2.');
  });

  it('interdit de modifier ou exclure le socle fixe dans un devis', () => {
    const base = publishedClause('BASE-PAIEMENT', 'Paiement', 'base', 'Texte du socle.');
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Socle fixe' });
    const build = contractTerms.syncQuote(quote.id);
    const instance = build.clauses.find((clause) => clause.sourceClauseId === base.id)!;

    expect(() => contractTerms.updateQuoteClause(instance.id, { enabled: false })).toThrow(/socle/i);
    expect(() => contractTerms.updateQuoteClause(instance.id, { body: 'Modification locale' })).toThrow(/Bibliothèque|socle/i);
  });

  it('signale et désactive automatiquement une clause devenue orpheline après retrait de la prestation', () => {
    const specific = publishedClause('SEO-SPEC', 'Clause SEO', 'catalog', 'Aucune garantie de positionnement.');
    const service = publishedService('SEO');
    contractTerms.setCatalogLinks(specific.id, [service.id]);

    const quote = quotes.create({ prospectId: prospectId(), subject: 'SEO' });
    const withLine = quotes.addCatalogLine(quote.id, service.currentVersion!.id);
    const synced = contractTerms.syncQuote(quote.id);
    expect(synced.clauses.find((clause) => clause.sourceClauseId === specific.id)?.enabled).toBe(true);

    quotes.removeLine(withLine.lines[0].id);
    const after = contractTerms.syncQuote(quote.id);
    const orphan = after.clauses.find((clause) => clause.sourceClauseId === specific.id)!;
    expect(orphan.isOrphaned).toBe(true);
    expect(orphan.enabled).toBe(false);
  });

  it('fige le texte contractuel à la finalisation du devis', () => {
    publishedClause('BASE-VALIDITE', 'Acceptation du devis', 'base', 'La signature vaut acceptation.');
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Contrat intégré' });
    quotes.addCustomLine(quote.id, { label: 'Site', proposedUnitPriceCents: 69900 });

    contractTerms.syncQuote(quote.id);
    contractTerms.addCustomQuoteClause(quote.id, {
      title: 'Condition particulière',
      body: 'Livraison prévue en deux phases.',
    });

    const finalized = quotes.finalize(quote.id);
    expect(finalized.contractCompiledAt).toBeTruthy();
    expect(finalized.contractTextSnapshot).toContain('Acceptation du devis');
    expect(finalized.contractTextSnapshot).toContain('Condition particulière');
    expect(contractTerms.getQuoteBuild(quote.id).locked).toBe(true);
    expect(() => contractTerms.addCustomQuoteClause(quote.id, { title: 'Après', body: 'Interdit' })).toThrow(/figées/i);
    expect(() => quotes.addCustomLine(quote.id, { label: 'Après finalisation', proposedUnitPriceCents: 1000 })).toThrow(/finalisé/i);
  });

  it('reprend les choix et clauses particulières lors de la duplication', () => {
    const base = publishedClause('BASE-RESP', 'Responsabilité', 'base', 'Texte standard.');
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Version client' });
    quotes.addCustomLine(quote.id, { label: 'Prestation', proposedUnitPriceCents: 50000 });
    const build = contractTerms.syncQuote(quote.id);
    const baseInstance = build.clauses.find((clause) => clause.sourceClauseId === base.id)!;
    contractTerms.updateQuoteClause(baseInstance.id, { body: 'Texte négocié.' });
    contractTerms.addCustomQuoteClause(quote.id, { title: 'Cas particulier', body: 'Conserver cette clause.' });
    quotes.finalize(quote.id);
    quotes.markSent(quote.id);
    quotes.refuse(quote.id);

    const copy = quotes.duplicate(quote.id);
    const copiedBuild = contractTerms.getQuoteBuild(copy.id);
    expect(copiedBuild.clauses.find((clause) => clause.sourceClauseId === base.id)?.body).toBe('Texte négocié.');
    expect(copiedBuild.clauses.some((clause) => clause.title === 'Cas particulier' && clause.body === 'Conserver cette clause.')).toBe(true);
  });
});

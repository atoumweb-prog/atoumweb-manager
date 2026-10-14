import { finalizeForTest, acceptForTest } from '../testSupport/quotePreparationFixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { ContractTermsService } from './ContractTermsService';
import {ContractSectionReviewService} from './ContractSectionReviewService';
import { QuoteService } from './QuoteService';
import { quoteContractText } from '../../shared/contractTerms';
import { buildQuoteHtml } from './quotePdf';

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
  it('05C: finalise un devis classé et conserve ses conditions particulières personnalisées', () => {
    const base=publishedClause('REVIEW-BASE','Clauses communes','base','CGV approuvées.');
    const quote=quotes.create({prospectId:prospectId(),subject:'Contrat canonique'});
    quotes.addCustomLine(quote.id,{label:'Site',proposedUnitPriceCents:69900});
    contractTerms.syncQuote(quote.id);
    contractTerms.addCustomQuoteClause(quote.id,{title:'Clause négociée',body:'Condition personnalisée conservée.'});
    const review=new ContractSectionReviewService(database);
    review.propose(base.currentVersionId!,'object',0,'Classement juridique à faire approuver');
    review.approve(base.currentVersionId!,'Relecteur humain');
    const frozen=finalizeForTest(database,quotes,quote.id);
    expect(frozen.contractTextSnapshot).toContain('1.1 — Clauses communes');
    expect(frozen.contractTextSnapshot).toContain('CGV approuvées.');
    expect(frozen.contractTextSnapshot).toContain('CONDITIONS PARTICULIÈRES');
    expect(frozen.contractTextSnapshot).toContain('Condition personnalisée conservée.');
    expect(contractTerms.freezeQuote(quote.id).snapshotText).toBe(frozen.contractTextSnapshot);
    expect(contractTerms.presentation(quote.id).text).toContain(frozen.contractTextSnapshot!);
    expect(contractTerms.presentation(quote.id).sections.some(section=>section.id==='clauses'&&section.text===frozen.contractTextSnapshot)).toBe(true);
  });

  it('enregistre une clause en brouillon sans alimenter les devis ni publier', () => {
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Brouillon uniquement' });
    const template = contractTerms.createTemplate({ code: 'TEST-DRAFT', title: 'Test', scope: 'base' }, { body: 'Texte non publié.' });
    expect(template.currentVersionId).toBeNull();
    expect(template.currentVersion).toBeNull();
    expect(template.versions[0].status).toBe('draft');
    expect(template.versions[0].publishedAt).toBeNull();
    expect(contractTerms.syncQuote(quote.id).clauses).toEqual([]);
    expect(database.all("SELECT id FROM activity_log WHERE action='contract_clause_version_published'")).toEqual([]);
  });

  it('enregistre une nouvelle version en brouillon puis la publie uniquement par action séparée', () => {
    const template = publishedClause('TEST-VERSION', 'Test', 'base', 'Texte publié v1.');
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Deux versions' });
    const draft = contractTerms.createVersion(template.id, { body: 'Texte brouillon v2.' });
    expect(draft.status).toBe('draft');
    expect(draft.publishedAt).toBeNull();
    expect(contractTerms.getTemplate(template.id).currentVersionId).toBe(template.currentVersionId);
    expect(contractTerms.syncQuote(quote.id).compiledText).toContain('Texte publié v1.');
    const published = contractTerms.publishVersion(draft.id);
    expect(published.currentVersionId).toBe(draft.id);
    expect(published.currentVersion?.status).toBe('published');
    expect(published.versions.find((v) => v.id === template.currentVersionId)?.status).toBe('retired');
    expect(contractTerms.syncQuote(quote.id).compiledText).toContain('Texte brouillon v2.');
  });

  it('fige explicitement un snapshot vide et ne le reconstruit jamais à l’acceptation', () => {
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Sans bibliothèque' });
    // Historical draft before Lot 5: retain the Lot 1 empty snapshot regression without inventing parameters.
    database.run('UPDATE quotes SET contract_parameters_json=NULL WHERE id=?',[quote.id]);
    quotes.addCustomLine(quote.id, { label: 'Prestation', proposedUnitPriceCents: 10000 });
    const finalized = finalizeForTest(database,quotes,quote.id);
    expect(finalized.contractTextSnapshot).toBe('');
    expect(finalized.contractCompiledAt).toBeTruthy();
    expect(JSON.parse(finalized.contractSnapshotJson!)).toEqual({ audience: 'professional', clauses: [] });
    publishedClause('TEST-AFTER', 'Après finalisation', 'base', 'Jamais rétroactif.');
    quotes.markSent(quote.id);
    acceptForTest(database,quotes,quote.id);
    const frozen = contractTerms.freezeQuote(quote.id);
    expect(frozen.snapshotState).toBe('frozen');
    expect(frozen.clauses).toEqual([]);
    expect(frozen.snapshotText).toBe('');
    expect(frozen.compiledAt).toBe(finalized.contractCompiledAt);
    expect(quotes.get(quote.id).contractSnapshotJson).toBe(finalized.contractSnapshotJson);
    expect(quoteContractText({ ...frozen, compiledText: 'Compilation ultérieure interdite' })).toBe('');
    expect(buildQuoteHtml({ ...finalized, specialTerms: 'Texte exclu à ne pas réintroduire' })).not.toContain('Texte exclu à ne pas réintroduire');
    expect(database.all("SELECT id FROM activity_log WHERE entity_id=? AND action='quote_contract_frozen'", [quote.id])).toHaveLength(1);
    expect(() => contractTerms.syncQuote(quote.id)).toThrow(/figées/);
  });

  it('conserve le texte, la version et le JSON exacts après évolution de la bibliothèque', () => {
    const template = publishedClause('TEST-EXACT', 'Test exact', 'base', 'Texte initial\navec ses lignes.');
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Preuve exacte' });
    quotes.addCustomLine(quote.id, { label: 'Prestation', proposedUnitPriceCents: 10000 });
    const frozen = finalizeForTest(database,quotes,quote.id);
    const draft = contractTerms.createVersion(template.id, { body: 'Texte remplacé.' });
    contractTerms.publishVersion(draft.id);
    contractTerms.setTemplateStatus(template.id, 'inactive');
    quotes.markSent(quote.id);
    acceptForTest(database,quotes,quote.id);
    const after = quotes.get(quote.id);
    expect(after.contractTextSnapshot).toBe(frozen.contractTextSnapshot);
    expect(after.contractSnapshotJson).toBe(frozen.contractSnapshotJson);
    expect(after.contractCompiledAt).toBe(frozen.contractCompiledAt);
    const build = contractTerms.freezeQuote(quote.id);
    expect(build.clauses[0].sourceClauseVersionId).toBe(template.currentVersionId);
    expect(build.clauses[0].body).toBe('Texte initial\navec ses lignes.');
    expect(quoteContractText(build)).toBe(frozen.contractTextSnapshot);
    expect(buildQuoteHtml(after)).toContain('Texte initial<br />avec ses lignes.');
    expect(buildQuoteHtml(after)).not.toContain('Texte remplacé.');
  });

  it('préserve les trois profils historiques, puis accepte le devis envoyé sans injection rétroactive', () => {
    const ids = [1, 2, 3].map((index) => {
      const quote = quotes.create({ prospectId: prospectId(), subject: `Historique ${index}` });
      quotes.addCustomLine(quote.id, { label: 'Prestation historique', proposedUnitPriceCents: 10000 });
      database.run('UPDATE quotes SET quote_number=?,status=?,finalized_at=?,sent_at=? WHERE id=?', [
        `DEV-2026-00${index}`, index === 2 ? 'sent' : 'accepted', index === 1 ? null : '2026-09-20T00:00:00Z', '2026-09-20T00:00:00Z', quote.id,
      ]);
      return quote.id;
    });
    const before = database.all('SELECT * FROM quotes ORDER BY quote_number');
    const clausesBefore = database.all('SELECT * FROM quote_contract_clauses');
    publishedClause('TEST-FUTURE', 'Future bibliothèque', 'base', 'Ne concerne pas les anciens devis.');
    ids.forEach((id) => {
      const build = contractTerms.freezeQuote(id);
      expect(build.snapshotState).toBe('historical_missing');
      expect(build.snapshotText).toBeNull();
      expect(build.compiledAt).toBeNull();
      expect(build.clauses).toEqual([]);
      expect(build.warnings.join(' ')).toMatch(/historique/);
      expect(quoteContractText({ ...build, compiledText: 'Ne pas recopier' })).toBe('');
      expect(() => contractTerms.syncQuote(id)).toThrow(/figées/);
    });
    expect(database.all('SELECT * FROM quotes ORDER BY quote_number')).toEqual(before);
    expect(database.all('SELECT * FROM quote_contract_clauses')).toEqual(clausesBefore);
    const accepted = acceptForTest(database,quotes,ids[1]);
    acceptForTest(database,quotes,ids[1]);
    expect(accepted.status).toBe('accepted');
    expect(accepted.contractTextSnapshot).toBeNull();
    expect(accepted.contractSnapshotJson).toBeNull();
    expect(accepted.contractCompiledAt).toBeNull();
    expect(buildQuoteHtml({ ...accepted, specialTerms: 'Conditions particulières historiques' })).toContain('Conditions particulières historiques');
    expect(database.all('SELECT * FROM quote_contract_clauses')).toEqual([]);
    expect(database.all("SELECT id FROM activity_log WHERE entity_id=? AND action='quote_accepted_without_contract_snapshot'", [ids[1]])).toHaveLength(1);
  });

  it('ne transforme pas des instances historiques sans snapshot en un contrat reconstitué', () => {
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Instances historiques' });
    quotes.addCustomLine(quote.id, { label: 'Prestation', proposedUnitPriceCents: 10000 });
    contractTerms.addCustomQuoteClause(quote.id, { title: 'Ancien texte', body: 'Instance à préserver.' });
    const before = database.all('SELECT * FROM quote_contract_clauses WHERE quote_id=?', [quote.id]);
    database.run("UPDATE quotes SET status='sent',finalized_at='2026-09-20' WHERE id=?", [quote.id]);
    publishedClause('TEST-FUTURE-2', 'Nouveau socle', 'base', 'Texte ultérieur.');
    acceptForTest(database,quotes,quote.id);
    expect(database.all('SELECT * FROM quote_contract_clauses WHERE quote_id=?', [quote.id])).toEqual(before);
    expect(contractTerms.getQuoteBuild(quote.id).snapshotState).toBe('historical_missing');
    expect(quotes.get(quote.id).contractSnapshotJson).toBeNull();
  });

  it('refuse de publier une clause contenant un placeholder juridique', () => {
    const clause = contractTerms.createTemplate(
      { code: 'CONS-MEDIATION-DRAFT', title: 'Médiation', scope: 'base', audience: 'consumer' },
      { body: 'Médiateur : [À RENSEIGNER : NOM DU MÉDIATEUR]' },
    );
    expect(() => contractTerms.publishVersion(clause.versions[0].id)).toThrow(/À RENSEIGNER|placeholder/i);
  });

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

  it('rebascule les clauses fixes lorsque le public contractuel change avant finalisation', () => {
    const professional = publishedClause('BASE-SWITCH-PRO', 'Socle professionnel', 'base', 'B2B.', 'professional');
    const consumer = publishedClause('BASE-SWITCH-CONSUMER', 'Socle consommateur', 'base', 'B2C.', 'consumer');
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Changement de public' });

    const first = contractTerms.syncQuote(quote.id);
    expect(first.clauses.find((clause) => clause.sourceClauseId === professional.id)?.enabled).toBe(true);
    expect(first.clauses.some((clause) => clause.sourceClauseId === consumer.id)).toBe(false);

    const changedQuote = quotes.updateConditions(quote.id, { contractAudience: 'consumer' });
    expect(changedQuote.contractAudience).toBe('consumer');
    const after = contractTerms.syncQuote(quote.id);
    expect(after.audience).toBe('consumer');
    expect(after.clauses.find((clause) => clause.sourceClauseId === professional.id)?.enabled).toBe(false);
    expect(after.clauses.find((clause) => clause.sourceClauseId === professional.id)?.isOrphaned).toBe(true);
    expect(after.clauses.find((clause) => clause.sourceClauseId === consumer.id)?.enabled).toBe(true);
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

    const finalized = finalizeForTest(database,quotes,quote.id);
    expect(finalized.contractCompiledAt).toBeTruthy();
    expect(finalized.contractTextSnapshot).toContain('Acceptation du devis');
    expect(finalized.contractTextSnapshot).toContain('Condition particulière');
    const frozen = JSON.parse(finalized.contractSnapshotJson ?? '{}') as { audience?: string; clauses?: unknown[] };
    expect(frozen.audience).toBe('professional');
    expect(frozen.clauses?.length).toBe(2);
    expect(contractTerms.getQuoteBuild(quote.id).locked).toBe(true);
    expect(() => contractTerms.addCustomQuoteClause(quote.id, { title: 'Après', body: 'Interdit' })).toThrow(/figées/i);
    expect(() => quotes.addCustomLine(quote.id, { label: 'Après finalisation', proposedUnitPriceCents: 1000 })).toThrow(/finalisé/i);
  });

  it('reprend les adaptations de prestation et clauses particulières lors de la duplication', () => {
    const specific = publishedClause('WEB-RESP', 'Responsabilité prestation', 'catalog', 'Texte standard.');
    const service = publishedService('Site sur mesure');
    contractTerms.setCatalogLinks(specific.id, [service.id]);
    const quote = quotes.create({ prospectId: prospectId(), subject: 'Version client' });
    quotes.addCatalogLine(quote.id, service.currentVersion!.id);
    const build = contractTerms.syncQuote(quote.id);
    const instance = build.clauses.find((clause) => clause.sourceClauseId === specific.id)!;
    contractTerms.updateQuoteClause(instance.id, { body: 'Texte négocié.' });
    contractTerms.addCustomQuoteClause(quote.id, { title: 'Cas particulier', body: 'Conserver cette clause.' });
    finalizeForTest(database,quotes,quote.id);
    quotes.markSent(quote.id);
    quotes.refuse(quote.id);

    const copy = quotes.duplicate(quote.id);
    const copiedBuild = contractTerms.getQuoteBuild(copy.id);
    expect(copiedBuild.clauses.find((clause) => clause.sourceClauseId === specific.id)?.body).toBe('Texte négocié.');
    expect(copiedBuild.clauses.some((clause) => clause.title === 'Cas particulier' && clause.body === 'Conserver cette clause.')).toBe(true);
  });
});

import { ProjectBlueprintCompositionService } from '../projects/ProjectBlueprintCompositionService';
import { ProjectSiteService } from '../projects/ProjectSiteService';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations, MIGRATIONS } from '../database/migrations';
import { quoteOptionsFixture } from '../testSupport/quoteOptionsFixture';
import { finalizeForTest } from '../testSupport/quotePreparationFixture';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import { buildQuoteHtml } from './quotePdf';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { tmpdir } from 'node:os';

let db: NodeSqliteAdapter;
let f: ReturnType<typeof quoteOptionsFixture>;
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON;'); applyPendingMigrations(db);
  f = quoteOptionsFixture(db);
});
afterEach(() => db.close());
const purchased = (id: string) => f.quotes.get(id).lines.filter((line) => line.optionPurchase);
const active = (id: string) => f.terms.getQuoteBuild(id).clauses.filter((clause) => clause.enabled && !clause.isOrphaned);

describe('Lot 6 — achats optionnels explicites', () => {
  it('sans achat : aucun prix, clause, prérequis ou objet provenant des options', () => {
    const q = f.createQuote();
    expect(q.lines).toHaveLength(1); expect(q.contractValueCents).toBe(10000);
    expect(purchased(q.id)).toEqual([]);
    expect(active(q.id).map((c) => c.title)).toEqual(['Fixture BASE']);
    expect(q.prerequisitesText ?? '').not.toContain('PAGE');
    for (const table of ['projects', 'project_sites', 'project_site_pages', 'quote_option_purchases']) {
      expect(db.get<{n:number}>(`SELECT COUNT(*) n FROM ${table}`)?.n).toBe(0);
    }
    expect(buildQuoteHtml(q)).not.toContain('Fixture Lot 6 PAGE');
  });

  it('achat persistant : provenance complète, prix, remise et quantité, sans multiplication des objets', () => {
    const q = f.createQuote(), component = f.components[1];
    const next = f.quotes.selectOfferOption(q.lines[0].id, component.id, {
      quantityMilli: 3000, proposedUnitPriceCents: 1800, adjustmentMode: 'percent', adjustmentValue: 1000,
    });
    const line = purchased(q.id)[0];
    expect(line.optionPurchase).toMatchObject({ state: 'purchased', sourceOfferLineId: q.lines[0].id,
      sourceOfferItemId: f.offer.id, sourceOfferVersionId: f.offer.currentVersion!.id, sourceComponentId: component.id });
    expect(line.catalogItemId).toBe(f.services[1].id); expect(line.catalogVersionId).toBe(component.serviceVersionId);
    expect(line.snapshot?.canonicalCode).toBe('AW-TEST-L6-PAGE');
    expect(line.quantityMilli).toBe(3000); expect(line.catalogUnitPriceCents).toBe(2000);
    expect(line.proposedUnitPriceCents).toBe(1800); expect(line.contractLineValueCents).toBe(4860);
    expect(next.contractValueCents).toBe(14860); expect(active(q.id)).toHaveLength(3);
    expect(buildQuoteHtml(next)).toContain('Fixture Lot 6 PAGE');
    expect(db.all('SELECT * FROM project_site_pages')).toEqual([]);
  });

  it('rejeu achat et retrait sans doublon et sans aucune mutation au rejeu', () => {
    const q = f.createQuote(), offerId = q.lines[0].id, componentId = f.components[1].id;
    const selected = f.quotes.selectOfferOption(offerId, componentId);
    const activity = db.all('SELECT * FROM activity_log');
    expect(f.quotes.selectOfferOption(offerId, componentId, { quantityMilli: 9000 })).toEqual(selected);
    expect(db.all('SELECT * FROM activity_log')).toEqual(activity);
    expect(f.quotes.deselectOfferOption(offerId, componentId).lines).toHaveLength(1);
    const after = f.quotes.get(q.id);
    expect(f.quotes.deselectOfferOption(offerId, componentId)).toEqual(after);
    expect(active(q.id).map((c) => c.title)).toEqual(['Fixture BASE']);
    expect(db.all('SELECT * FROM quote_option_purchases')).toEqual([]);
  });

  it('déduplique les clauses entre plusieurs options effectivement achetées', () => {
    const q = f.createQuote();
    f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id);
    f.quotes.selectOfferOption(q.lines[0].id, f.components[2].id);
    expect(active(q.id).filter((c) => c.title === 'Fixture SHARED')).toHaveLength(1);
    f.quotes.deselectOfferOption(q.lines[0].id, f.components[1].id);
    expect(active(q.id).map((c) => c.title)).toEqual(['Fixture BASE', 'Fixture SHARED']);
  });

  it('retrait : clauses générées désactivées, adaptation humaine conservée et signalée orpheline', () => {
    const q = f.createQuote(); f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id);
    const clause = active(q.id).find(c => c.title === 'Fixture PAGE')!;
    f.terms.updateQuoteClause(clause.id, { body: 'Adaptation humaine volontaire' });
    f.quotes.deselectOfferOption(q.lines[0].id, f.components[1].id);
    const build = f.terms.getQuoteBuild(q.id);
    expect(build.clauses.find(c => c.id === clause.id)).toMatchObject({ isOrphaned: true, isCustomized: true, body: 'Adaptation humaine volontaire' });
    expect(build.clauses.find(c => c.title === 'Fixture SHARED')).toMatchObject({ isOrphaned: true, enabled: false });
    expect(build.warnings.some(w => /retirée/.test(w))).toBe(true);
  });

  it('service identique ajouté manuellement : ligne distincte, sans fusion ni requalification', () => {
    const q = f.createQuote();
    f.quotes.addCatalogLine(q.id, f.components[1].serviceVersionId);
    f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id);
    expect(f.quotes.get(q.id).lines).toHaveLength(3); expect(purchased(q.id)).toHaveLength(1);
    expect(active(q.id).filter((c) => c.title === 'Fixture PAGE')).toHaveLength(1);
    f.quotes.deselectOfferOption(q.lines[0].id, f.components[1].id);
    expect(f.quotes.get(q.id).lines).toHaveLength(2); expect(purchased(q.id)).toEqual([]);
    expect(active(q.id).some((c) => c.title === 'Fixture PAGE')).toBe(true);
  });

  it('duplique un brouillon acheté, remappe la ligne offre, puis retire seulement dans la copie', () => {
    const q = f.createQuote(); f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id, { quantityMilli: 4000 });
    const original = f.quotes.get(q.id), raw = db.all('SELECT * FROM quote_lines WHERE quote_id=?', [q.id]);
    const copy = f.quotes.duplicate(q.id), option = purchased(copy.id)[0];
    expect(copy.status).toBe('draft'); expect(copy.lines).toHaveLength(2);
    expect(option.quantityMilli).toBe(4000); expect(option.optionPurchase?.sourceOfferLineId).toBe(copy.lines[0].id);
    expect(option.optionPurchase?.sourceComponentId).toBe(f.components[1].id);
    f.quotes.deselectOfferOption(copy.lines[0].id, f.components[1].id);
    expect(f.quotes.get(copy.id).lines).toHaveLength(1);
    expect(f.quotes.get(q.id)).toEqual(original); expect(db.all('SELECT * FROM quote_lines WHERE quote_id=?', [q.id])).toEqual(raw);
  });

  it('duplique sans option sans inventer un achat', () => {
    const q = f.createQuote(), copy = f.quotes.duplicate(q.id);
    expect(copy.lines).toHaveLength(1); expect(purchased(copy.id)).toEqual([]);
    expect(active(copy.id).map((c) => c.title)).toEqual(['Fixture BASE']);
  });

  it('devis finalisé : ajout/retrait/modification et suppression directe de provenance refusés', () => {
    const q = f.createQuote(); f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id);
    const frozen = finalizeForTest(db, f.quotes, q.id), option = purchased(q.id)[0];
    const snap = JSON.parse(frozen.contractSnapshotJson!);
    expect(snap.lines.find((line: {id:string}) => line.id === option.id).option_purchase.source_component_id).toBe(f.components[1].id);
    expect(() => f.quotes.deselectOfferOption(q.lines[0].id, f.components[1].id)).toThrow();
    expect(() => f.quotes.selectOfferOption(q.lines[0].id, f.components[2].id)).toThrow();
    expect(() => f.quotes.updateLine(option.id, { label: 'Changement', quantityMilli: 1000 })).toThrow();
    expect(() => f.quotes.removeLine(q.lines[0].id)).toThrow();
    expect(() => db.run('DELETE FROM quote_option_purchases WHERE line_id=?', [option.id])).toThrow(/Frozen/);
    expect(() => db.run('DELETE FROM quote_lines WHERE id=?', [option.id])).toThrow();
    const nextVersion = f.catalog.createVersion(f.services[1].id, { priceMode: 'fixed', priceCents: 99900 });
    f.catalog.publishVersion(nextVersion.id);
    expect(f.quotes.get(q.id)).toEqual(frozen);
  });

  it('retrait offre : ses options et garanties de lignes disparaissent, les autres lignes restent', () => {
    const q = f.createQuote(); f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id);
    f.quotes.addCatalogLine(q.id, f.components[1].serviceVersionId);
    const option = purchased(q.id)[0], prep = new QuoteContractPreparationService(db), p = prep.get(q.id).parameters!;
    p.warranties = [{ lineId: option.id, kind: 'not_applicable', days: null, startEvent: '', statutoryRightsUnaffected: true }];
    prep.save(q.id, p);
    const next = f.quotes.removeLine(q.lines[0].id);
    expect(next.lines).toHaveLength(1); expect(next.lines[0].optionPurchase).toBeNull();
    expect(prep.get(q.id).parameters?.warranties).toEqual([]); expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('aucun rapprochement avec les snapshots historiques sans identité de composant', () => {
    const q = f.createQuote(), snap = { ...q.lines[0].snapshot };
    snap.offerComponents = (snap.offerComponents as Record<string, unknown>[]).map(({ componentId, ...rest }) => rest);
    db.run('UPDATE quote_lines SET snapshot_json=? WHERE id=?', [JSON.stringify(snap), q.lines[0].id]);
    db.run("UPDATE quotes SET status='sent',contract_parameters_json=NULL WHERE id=?", [q.id]);
    const before = f.quotes.get(q.id);
    expect(before.lines[0].optionPurchase).toBeNull();
    const copy = f.quotes.duplicate(q.id);
    expect(() => f.quotes.selectOfferOption(copy.lines[0].id, f.components[1].id)).toThrow(/déduction historique/);
    expect(purchased(copy.id)).toEqual([]); expect(f.quotes.get(q.id)).toEqual(before);
  });

  it('acceptation d’un ancien envoyé : ni achat optionnel ni clause rétroactive', () => {
    const q = f.createQuote(); f.quotes.addCatalogLine(q.id, f.components[1].serviceVersionId);
    db.run('DELETE FROM quote_contract_clauses WHERE quote_id=?', [q.id]);
    db.run("UPDATE quotes SET status='sent',contract_parameters_json=NULL WHERE id=?", [q.id]);
    const before = f.quotes.get(q.id).lines;
    f.quotes.accept(q.id);
    expect(f.quotes.get(q.id).lines).toEqual(before);
    expect(db.all('SELECT * FROM quote_option_purchases')).toEqual([]);
    expect(db.all('SELECT * FROM quote_contract_clauses WHERE quote_id=?', [q.id])).toEqual([]);
  });

  it('refuse mauvais composant / offre / brouillon catalogue sans laisser de ligne partielle', () => {
    const q = f.createQuote();
    expect(() => f.quotes.selectOfferOption(q.lines[0].id, f.components[0].id)).toThrow();
    expect(() => f.quotes.selectOfferOption(q.lines[0].id, 'inconnu')).toThrow();
    f.catalog.setStatus(f.services[1].id, 'inactive');
    expect(() => f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id)).toThrow(/publiée/);
    expect(f.quotes.get(q.id)).toEqual(q); expect(purchased(q.id)).toEqual([]);
  });

  it('quantité modifiable, catalogue/provenance immuables', () => {
    const q = f.createQuote(); f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id);
    const option = purchased(q.id)[0];
    f.quotes.updateLine(option.id, { label: option.label, quantityMilli: 6000, proposedUnitPriceCents: 1900 });
    expect(purchased(q.id)[0]).toMatchObject({ quantityMilli: 6000, catalogUnitPriceCents: 2000, proposedUnitPriceCents: 1900, optionPurchase: option.optionPurchase });
    expect(() => f.quotes.updateLine(option.id, { label: option.label, catalogUnitPriceCents: 999 })).toThrow(/figé/);
    expect(() => db.run("UPDATE quote_option_purchases SET state='purchased' WHERE line_id=?", [option.id])).toThrow(/immutable/);
  });

  it('rejeu migration idempotent, anciennes lignes non requalifiées', () => {
    expect(applyPendingMigrations(db)).toEqual([]); expect(MIGRATIONS.at(-1)?.id).toBe(59);
    const q = f.createQuote();
    expect(q.lines.every((line) => line.optionPurchase === null)).toBe(true);
    expect(db.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
  });

  it('le résolveur Projet existant inclut seulement les lignes vendues ; quantité sans duplication', () => {
    const projects = new ProjectService(db, createWorkspacePaths(tmpdir()));
    const templates = ['Base Lot6', 'Option Lot6'].map((name) => {
      const t = projects.createTemplate({ name, projectType: 'website' });
      projects.addTemplateNode(t.versions[0].id, { type: 'task', name });
      return projects.publishTemplateVersion(t.versions[0].id);
    });
    [f.offer.currentVersion!.id, f.components[1].serviceVersionId].forEach((id, i) => db.run(
      'INSERT INTO catalog_project_blueprints (id,catalog_version_id,template_version_id,role,sort_order,created_at) VALUES (?,?,?,?,?,?)',
      ['test-l6-blueprint-'+i, id, templates[i].id, i === 0 ? 'base' : 'addon', 0, new Date().toISOString()],
    ));
    // The composed resolver still excludes availability; a once policy does not expand this fixture.
    const engine = new ProjectBlueprintCompositionService(db, new ProjectSiteService(db));
    const addons = (id: string) => engine.resolveQuote(id).contributions.filter(c => c.role === 'addon');
    const q = f.createQuote(); expect(addons(q.id)).toEqual([]);
    f.quotes.selectOfferOption(q.lines[0].id, f.components[1].id, { quantityMilli: 5000 });
    expect(addons(q.id)).toEqual([expect.objectContaining({ quoteLineId: purchased(q.id)[0].id, unitCount: 1, quantityMilli: 5000 })]);
    f.quotes.deselectOfferOption(q.lines[0].id, f.components[1].id);
    expect(addons(q.id)).toEqual([]); expect(db.all('SELECT * FROM projects')).toEqual([]);

  });
});

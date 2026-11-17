import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { CommercialRulesService } from './CommercialRulesService';
import { reviseApprovedPackRule } from './CommercialRuleRevision';

/** Maintenance applicative : renouvellement sur accord exprès (décision de Carlos du 16/11/2026), par une nouvelle version de l'offre. */
let db: NodeSqliteAdapter, catalog: CatalogService, rules: CommercialRulesService, itemId: string, firstVersion: string;

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  catalog = new CatalogService(db); rules = new CommercialRulesService(db);
  const item = catalog.create({type: 'service', name: 'Maintenance applicative TEST', canonicalCode: 'AW-APP-MAINT', identityProvenance: {reference: 'Test uniquement'}},
    {priceMode: 'quote_only', description: 'Périmètre adapté', inclusions: ['Périmètre adapté à la criticité'], exclusions: ['Refonte'], prerequisites: ['Accès'], nature: 'Maintenance'});
  itemId = item.id; firstVersion = item.versions[0].id;
  rules.configure(firstVersion, {schemaVersion: 1, approvedPack: {version: 'V3.9.4/V1.5', sourceCode: 'AW-APP-MAINT', sourceStatus: 'RETENU_SUR_DELEGATION_07_11_2026', renewal: 'none'}}, {source: 'pack'});
  catalog.publishVersion(firstVersion);
});
afterEach(() => db.close());

describe('reviseApprovedPackRule', () => {
  it('publie une nouvelle version identique dont seule la règle de renouvellement change ; l’ancienne est retirée', () => {
    const result = reviseApprovedPackRule(catalog, rules, 'AW-APP-MAINT', {renewal: 'express'}, 'Décision de Carlos du 16/11/2026');
    expect(result).not.toBeNull();
    const versions = catalog.getItem(itemId).versions, before = versions.find(v => v.id === firstVersion)!, after = versions.find(v => v.id === result!.newVersionId)!;
    expect(after.status).toBe('published');
    expect(before.status).toBe('retired');
    for (const key of ['priceMode', 'priceCents', 'description', 'inclusions', 'exclusions', 'prerequisites', 'nature'] as const) expect(after[key]).toEqual(before[key]);
    expect(rules.rules(result!.newVersionId)?.approvedPack?.renewal).toBe('express');
    expect(rules.rules(firstVersion)?.approvedPack?.renewal).toBe('none');
  });

  it('ne fait rien si la règle est déjà celle demandée', () => {
    reviseApprovedPackRule(catalog, rules, 'AW-APP-MAINT', {renewal: 'express'}, 'Décision');
    const versions = catalog.getItem(itemId).versions.length;
    expect(reviseApprovedPackRule(catalog, rules, 'AW-APP-MAINT', {renewal: 'express'}, 'Décision')).toBeNull();
    expect(catalog.getItem(itemId).versions).toHaveLength(versions);
  });
});

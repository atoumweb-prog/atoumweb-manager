import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from '../commercial/CatalogService';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { applyFollowUp, planFollowUp, type FollowUpInput } from './FollowUpImport';
import type { OperationalModel } from '../../shared/operational';
import type { OperationalSalePolicy } from '../../shared/commercialRules';

/** Suivi après vente (fiche validée par Carlos le 16/11/2026) : codes V39, modèles et règles 8B, interventions sans modèle de projet. */
let db: NodeSqliteAdapter, catalog: CatalogService, projects: ProjectService;
const state = () => db.all<{name: string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .map(t => ({table: t.name, rows: db.all('SELECT * FROM "' + t.name + '"').map(r => JSON.stringify(r)).sort()}));
const publish = (name: string, code?: string, sourceCode?: string) => {
  const item = catalog.create({type: 'service', name, canonicalCode: code, identityProvenance: {reference: 'Test uniquement'}}, {priceMode: 'fixed', priceCents: 4900});
  const version = item.versions[0].id;
  if (sourceCode) db.run('INSERT INTO catalog_commercial_rules(catalog_version_id,rules_json,provenance_json,updated_at) VALUES (?,?,?,?)',
    [version, JSON.stringify({schemaVersion: 1, approvedPack: {version: 'V3.9.4/V1.5', sourceCode, sourceStatus: 'VALIDE_RECENT'}}), '{}', '2026-11-16T00:00:00Z']);
  catalog.publishVersion(version);
  return {itemId: item.id, version};
};
const model = (code: string, minutes: number[]): OperationalModel => ({code, name: code, lot: '8B', model: 'Récurrent', unit: 'abonnement', estimateRequired: false,
  quantityRule: 'Routine par mois', recurrence: 'Mensuel', trigger: 'Activation après acceptation', creditMinutes: 0, referenceMinutes: minutes.reduce((a, b) => a + b, 0), sourceRow: 1, notes: 'TEST',
  actions: minutes.map((m, i) => ({key: `${code}-A0${i + 1}`, phase: 'Suivi', name: 'Action ' + (i + 1), checklist: '', minutes: m, category: 'Inclus au forfait', required: true, sourceRow: 1}))} as OperationalModel);
const recurring = {schemaVersion: 1 as const, kind: 'recurring' as const, cadence: 'monthly' as const, billingPeriod: 'monthly' as const, targetRequirement: 'site', requires: [], periodAlignment: 'anniversary', quantityMeaning: 'billing_periods'};
const intervention = {schemaVersion: 1 as const, kind: 'intervention' as const, cadence: 'once' as const, billingPeriod: 'once' as const, minimumBillableMinutes: 60, targetRequirement: 'site', requires: [], quantityMode: 'hours', quantityMeaning: 'hours'};
let input: FollowUpInput, depannage: {itemId: string; version: string};

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
  catalog = new CatalogService(db); projects = new ProjectService(db, createWorkspacePaths('C:/tmp/atoumweb-follow-up-test'));
  publish('Maintenance TEST', 'AW-MAINT-WP-M');
  publish('GBP Essentiel TEST', undefined, 'V39-GBP-ESS-M');
  depannage = publish('Dépannage TEST', 'AW-TECH-DEPANNAGE');
  const template = projects.createTemplate({name: 'Référentiel · Dépannage TEST', projectType: 'referentiel'}).versions[0];
  projects.addTemplateNode(template.id, {type: 'lot', name: 'Réalisation'});
  const published = projects.publishTemplateVersion(template.id);
  db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,sort_order,created_at,quantity_mode,site_mode) VALUES (?,?,?,?,0,?,?,?)',
    ['lien-depannage', depannage.version, published.id, 'base', '2026-11-16T00:00:00Z', 'once', 'create']);
  input = {
    codeAssignments: [{sourceCode: 'V39-GBP-ESS-M', code: 'AW-SEO-GBP-ESS-M'}],
    source: {schemaVersion: 1, source: {file: 'TEST.xlsx', sha256: 'a'.repeat(64)}, decisions: [],
      models: [model('AW-MAINT-WP-M', [15, 20]), model('AW-SEO-GBP-ESS-M', [20, 40]), {...model('AW-TECH-DEPANNAGE', [0]), lot: '8B', model: 'Intervention horaire'}]},
    policies: {'AW-MAINT-WP-M': {...recurring, kind: 'maintenance', minorInterventions: 2, maximumMinorMinutes: 30}, 'AW-SEO-GBP-ESS-M': {...recurring, targetRequirement: 'context'}, 'AW-TECH-DEPANNAGE': intervention} as unknown as Record<string, OperationalSalePolicy>,
    detachProjectTemplates: ['AW-TECH-DEPANNAGE'],
  };
});
afterEach(() => db.close());

describe('planFollowUp : lecture seule', () => {
  it('prévoit les codes, les modèles, les liens et le détachement, sans rien écrire', () => {
    const before = state();
    const plan = planFollowUp(db, input);
    expect(state()).toEqual(before);
    expect(plan.codes).toEqual([{sourceCode: 'V39-GBP-ESS-M', code: 'AW-SEO-GBP-ESS-M', action: 'assign'}]);
    expect(plan.links.map(l => [l.code, l.action])).toEqual([['AW-MAINT-WP-M', 'create'], ['AW-SEO-GBP-ESS-M', 'create'], ['AW-TECH-DEPANNAGE', 'create']]);
    expect(plan.detach).toEqual([{code: 'AW-TECH-DEPANNAGE', links: 1}]);
    expect(plan.planSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('signale une offre absente du catalogue', () => {
    const plan = planFollowUp(db, {...input, source: {...input.source, models: [...input.source.models, model('AW-ABSENT', [5])]}, policies: {...input.policies, 'AW-ABSENT': recurring as unknown as OperationalSalePolicy}});
    expect(plan.absent).toEqual(['AW-ABSENT']);
  });
});

describe('applyFollowUp : écriture vérifiée', () => {
  it('refuse une empreinte différente sans rien écrire', () => {
    const before = state();
    expect(() => applyFollowUp(db, catalog, input, '0'.repeat(64))).toThrow(/empreinte/i);
    expect(state()).toEqual(before);
  });

  it('attribue le code, importe et active le suivi, détache seulement le lien de projet ; une seconde application n’écrit rien', () => {
    const done = applyFollowUp(db, catalog, input, planFollowUp(db, input).planSha256);
    expect(done).toEqual({codesAssigned: 1, modelsReady: 3, linksReady: 3, projectLinksRemoved: 1});
    expect(db.get<{n: number}>("SELECT count(*) n FROM catalog_items WHERE canonical_code='AW-SEO-GBP-ESS-M'")!.n).toBe(1);
    expect(db.get<{n: number}>("SELECT count(*) n FROM catalog_operational_links WHERE status='ready'")!.n).toBe(3);
    expect(db.get<{n: number}>("SELECT count(*) n FROM operational_model_versions WHERE status='ready'")!.n).toBe(3);
    expect(db.get('SELECT 1 FROM catalog_project_blueprints WHERE catalog_version_id=?', [depannage.version])).toBeUndefined();
    expect(projects.listTemplates().some(t => t.name === 'Référentiel · Dépannage TEST')).toBe(true);
    const again = planFollowUp(db, input);
    expect(again.codes[0].action).toBe('unchanged');
    expect(again.links.every(l => l.action === 'unchanged')).toBe(true);
    const before = state();
    expect(applyFollowUp(db, catalog, input, again.planSha256)).toEqual({codesAssigned: 0, modelsReady: 0, linksReady: 0, projectLinksRemoved: 0});
    expect(state()).toEqual(before);
  });
});

import { createHash } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { CatalogService } from '../commercial/CatalogService';
import { OperationalReferenceService, operationalHash } from '../projects/OperationalReferenceService';
import type { OperationalReference } from '../../shared/operational';
import type { OperationalSalePolicy } from '../../shared/commercialRules';

/**
 * Suivi après vente (fiche validée par Carlos le 16/11/2026, docs/refonte/plans/2026-11-16-suivi-apres-vente-design.md).
 * En une opération vérifiée par empreinte : codes AW des offres V39 (retrouvées par le code source du pack approuvé),
 * import des modèles et règles 8B par le chemin normal du Manager (OperationalReferenceService), et retrait du lien
 * vers un modèle de projet pour les offres devenues interventions (les modèles de projet eux-mêmes sont conservés).
 */
export interface FollowUpInput {
  codeAssignments: Array<{sourceCode: string; code: string}>;
  source: OperationalReference;
  policies: Record<string, OperationalSalePolicy>;
  detachProjectTemplates: string[];
}
export interface FollowUpPlan {
  codes: Array<{sourceCode: string; code: string; action: 'assign' | 'unchanged'}>;
  links: Array<{code: string; catalogVersionId: string; action: 'create' | 'unchanged'}>;
  detach: Array<{code: string; links: number}>;
  absent: string[];
  planSha256: string;
}
type Row = Record<string, unknown>;

function itemBySource(db: DatabaseAdapter, sourceCode: string): Row | undefined {
  return db.get<Row>(`SELECT i.id, i.canonical_code FROM catalog_commercial_rules r JOIN catalog_versions v ON v.id=r.catalog_version_id JOIN catalog_items i ON i.id=v.item_id
    WHERE json_extract(r.rules_json,'$.approvedPack.sourceCode')=? AND v.status='published' AND i.status='active' ORDER BY v.version_number DESC LIMIT 1`, [sourceCode]);
}
const publishedVersion = (db: DatabaseAdapter, itemId: string) =>
  db.get<{id: string}>("SELECT id FROM catalog_versions WHERE item_id=? AND status='published' ORDER BY version_number DESC LIMIT 1", [itemId])?.id;

function resolve(db: DatabaseAdapter, input: FollowUpInput) {
  const codes: FollowUpPlan['codes'] = [], pending = new Map<string, string>();
  for (const assignment of input.codeAssignments) {
    const item = itemBySource(db, assignment.sourceCode);
    if (!item) continue;
    if (item.canonical_code && item.canonical_code !== assignment.code) throw Error(`Code déjà attribué autrement : ${String(item.canonical_code)} (${assignment.sourceCode}).`);
    codes.push({...assignment, action: item.canonical_code === assignment.code ? 'unchanged' : 'assign'});
    pending.set(assignment.code, String(item.id));
  }
  const itemOf = (code: string) => (db.get<{id: string}>("SELECT id FROM catalog_items WHERE canonical_code=? AND status='active'", [code])?.id) ?? pending.get(code);
  return {codes, itemOf};
}

export function planFollowUp(db: DatabaseAdapter, input: FollowUpInput): FollowUpPlan {
  const {codes, itemOf} = resolve(db, input);
  const links: FollowUpPlan['links'] = [], absent: string[] = [];
  for (const model of input.source.models) {
    const itemId = itemOf(model.code), versionId = itemId && publishedVersion(db, itemId);
    if (!itemId || !versionId || !input.policies[model.code]) { absent.push(model.code); continue; }
    const current = db.get<Row>(`SELECT l.status, l.provenance_json, m.content_sha256, m.status model_status FROM catalog_operational_links l JOIN operational_model_versions m ON m.id=l.model_version_id
      WHERE l.catalog_version_id=? ORDER BY l.revision DESC LIMIT 1`, [versionId]);
    const same = current && current.status === 'ready' && current.model_status === 'ready' && current.content_sha256 === operationalHash(model)
      && operationalHash(JSON.parse(String(current.provenance_json))) === operationalHash({operations: input.policies[model.code]});
    links.push({code: model.code, catalogVersionId: versionId, action: same ? 'unchanged' : 'create'});
  }
  const detach = input.detachProjectTemplates.map(code => {
    const itemId = itemOf(code), versionId = itemId && publishedVersion(db, itemId);
    return {code, links: versionId ? db.get<{n: number}>('SELECT count(*) n FROM catalog_project_blueprints WHERE catalog_version_id=?', [versionId])!.n : 0};
  }).filter(entry => entry.links > 0);
  const planSha256 = createHash('sha256').update(JSON.stringify({input, codes, links, detach, absent})).digest('hex');
  return {codes, links, detach, absent, planSha256};
}

export function applyFollowUp(db: DatabaseAdapter, catalog: CatalogService, input: FollowUpInput, planSha256: string) {
  const plan = planFollowUp(db, input);
  if (plan.planSha256 !== planSha256) throw Error('Empreinte du plan différente de celle relue : relancer l’aperçu avant d’appliquer.');
  const result = {codesAssigned: 0, modelsReady: 0, linksReady: 0, projectLinksRemoved: 0};
  db.exec('SAVEPOINT follow_up_import');
  try {
    const assignments = plan.codes.filter(c => c.action === 'assign').map(c => ({itemId: String(itemBySource(db, c.sourceCode)!.id), canonicalCode: c.code,
      provenance: {reference: `Pack approuvé V3.9.4/V1.5, code source ${c.sourceCode} (décision de Carlos du 16/11/2026)`}}));
    if (assignments.length) { catalog.applyIdentityManifest({schemaVersion: 1, assignments}); result.codesAssigned = assignments.length; }
    const usable = new Set(plan.links.map(l => l.code));
    const source: OperationalReference = {...input.source, models: input.source.models.filter(m => usable.has(m.code))};
    const service = new OperationalReferenceService(db);
    const simulation = service.simulate(source);
    service.importDraft(source, simulation.planHash);
    for (const link of plan.links) {
      const model = source.models.find(m => m.code === link.code)!;
      const version = db.get<{id: string; status: string}>("SELECT v.id, v.status FROM operational_model_versions v JOIN catalog_items i ON i.id=v.catalog_item_id WHERE i.canonical_code=? AND v.content_sha256=? ORDER BY v.version_number DESC LIMIT 1", [link.code, operationalHash(model)])!;
      if (version.status !== 'ready') { service.markReady(version.id); result.modelsReady++; }
      const linkId = service.link(link.catalogVersionId, version.id, null, {operations: input.policies[link.code]});
      if (db.get<{status: string}>('SELECT status FROM catalog_operational_links WHERE id=?', [linkId])!.status !== 'ready') { service.activateLink(linkId); result.linksReady++; }
    }
    for (const entry of plan.detach) {
      const versionId = publishedVersion(db, String(db.get<{id: string}>("SELECT id FROM catalog_items WHERE canonical_code=?", [entry.code])!.id))!;
      result.projectLinksRemoved += Number(db.run('DELETE FROM catalog_project_blueprints WHERE catalog_version_id=?', [versionId]).changes);
    }
    db.exec('RELEASE follow_up_import');
  } catch (error) { db.exec('ROLLBACK TO follow_up_import; RELEASE follow_up_import'); throw error; }
  return result;
}

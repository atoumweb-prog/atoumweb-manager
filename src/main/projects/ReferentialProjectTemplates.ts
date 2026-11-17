import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ProjectService } from './ProjectService';
import { natureOf, tasksFromSteps, templateKey, TEMPLATE_LOTS, type PlannedTask } from './referentialTemplatePlan';

/**
 * Modèles de projet du référentiel (fiche validée par Carlos le 16/11/2026,
 * docs/refonte/plans/2026-11-16-modeles-de-projet-design.md).
 * Le plan ne lit que la base ; l'application refuse toute empreinte différente de celle relue.
 * Les liens ne visent que la version publiée actuelle de chaque offre : ils concernent les nouvelles ventes,
 * les devis acceptés et les projets existants ne changent pas (même règle que la clause 119, add-reference-consent-v2).
 */
export interface ReferentialOffer { code: string; name: string; steps: string[]; provenance: string; family: string }
export interface PlannedTemplate { key: string; name: string; nature: 'base' | 'addon'; family: string; offers: string[]; tasks: PlannedTask[]; existingVersionId: string | null }
export interface PlannedLink { code: string; catalogVersionId: string; templateKey: string; role: 'base' | 'addon'; siteMode: 'create' | 'extend_base' }
export interface ReferentialTemplatePlan {
  templates: PlannedTemplate[]; links: PlannedLink[]; recurring: string[]; unmatched: string[]; matchedByName: string[];
  skipped: Array<{code: string; reason: string}>; planSha256: string;
}

const LOT_KEYS: Record<string, string> = {Démarrage: 'referentiel.demarrage', Réalisation: 'referentiel.realisation', 'Corrections et validation': 'referentiel.corrections', Livraison: 'referentiel.livraison'};

export function planReferentialTemplates(db: DatabaseAdapter, offers: ReferentialOffer[]): ReferentialTemplatePlan {
  const recurring: string[] = [], unmatched: string[] = [], matchedByName: string[] = [], skipped: Array<{code: string; reason: string}> = [];
  const groups = new Map<string, {nature: 'base' | 'addon'; family: string; steps: string[]; provenance: string; members: Array<{offer: ReferentialOffer; versionId: string}>}>();
  for (const offer of offers) {
    const nature = natureOf(offer.code);
    if (nature === 'recurring') { recurring.push(offer.code); continue; }
    let item = db.get<{id: string}>("SELECT id FROM catalog_items WHERE canonical_code=? AND status='active'", [offer.code]);
    if (!item) {
      item = db.get<{id: string}>("SELECT id FROM catalog_items WHERE name=? AND canonical_code IS NULL AND status='active'", [offer.name]);
      if (item) matchedByName.push(offer.code);
    }
    if (!item) { unmatched.push(offer.code); continue; }
    const version = db.get<{id: string}>("SELECT id FROM catalog_versions WHERE item_id=? AND status='published' ORDER BY version_number DESC LIMIT 1", [item.id]);
    if (!version) { skipped.push({code: offer.code, reason: 'aucune version publiée'}); continue; }
    if (db.get('SELECT 1 FROM catalog_project_blueprints WHERE catalog_version_id=?', [version.id])) { skipped.push({code: offer.code, reason: 'déjà reliée à un modèle de projet'}); continue; }
    const key = nature + ':' + templateKey(offer.steps);
    const group = groups.get(key) ?? {nature, family: offer.family, steps: offer.steps, provenance: offer.provenance, members: []};
    group.members.push({offer, versionId: version.id});
    groups.set(key, group);
  }
  const templates: PlannedTemplate[] = [], links: PlannedLink[] = [], usedNames = new Set<string>();
  for (const [key, group] of groups) {
    const families = [...new Set(group.members.map(m => m.offer.family))].join(' et ');
    let name = 'Référentiel · ' + (group.members.length === 1 ? group.members[0].offer.name : families);
    for (let n = 2; usedNames.has(name); n++) name = `Référentiel · ${families} (${n})`;
    usedNames.add(name);
    const existing = db.get<{id: string}>("SELECT v.id FROM project_templates t JOIN project_template_versions v ON v.template_id=t.id WHERE t.name=? AND v.status='published'", [name]);
    templates.push({key, name, nature: group.nature, family: families, offers: group.members.map(m => m.offer.code), tasks: tasksFromSteps(group.steps, group.provenance), existingVersionId: existing?.id ?? null});
    for (const member of group.members) links.push({code: member.offer.code, catalogVersionId: member.versionId, templateKey: key, role: group.nature, siteMode: group.nature === 'base' ? 'create' : 'extend_base'});
  }
  const planSha256 = createHash('sha256').update(JSON.stringify({
    templates: templates.map(t => [t.name, t.nature, t.existingVersionId, t.tasks]), links: links.map(l => [l.catalogVersionId, l.templateKey, l.role, l.siteMode]),
  })).digest('hex');
  return {templates, links, recurring, unmatched, matchedByName, skipped, planSha256};
}

export function applyReferentialTemplates(db: DatabaseAdapter, projects: ProjectService, offers: ReferentialOffer[], planSha256: string): {templatesCreated: number; linksCreated: number} {
  const plan = planReferentialTemplates(db, offers);
  if (plan.planSha256 !== planSha256) throw Error('Empreinte du plan différente de celle relue : relancer l’aperçu avant d’appliquer.');
  const versionByKey = new Map<string, string>();
  let templatesCreated = 0;
  for (const template of plan.templates) {
    if (template.existingVersionId) { versionByKey.set(template.key, template.existingVersionId); continue; }
    const draft = projects.createTemplate({name: template.name, projectType: template.nature === 'base' ? 'referentiel' : 'referentiel-option',
      description: `Étapes du référentiel AtoumWeb (${template.family}) : ${template.offers.join(', ')}. Durées à compléter.`}).versions[0];
    const lotIds = new Map<string, string>();
    for (const lot of TEMPLATE_LOTS) {
      if (!template.tasks.some(task => task.lot === lot)) continue;
      const version = projects.addTemplateNode(draft.id, {type: 'lot', name: lot, semanticKey: LOT_KEYS[lot]});
      lotIds.set(lot, version.nodes.find(node => node.semanticKey === LOT_KEYS[lot])!.id);
    }
    for (const task of template.tasks) projects.addTemplateNode(draft.id, {parentId: lotIds.get(task.lot)!, type: 'task', name: task.name, description: task.description, estimatedMinutes: null});
    versionByKey.set(template.key, projects.publishTemplateVersion(draft.id).id);
    templatesCreated++;
  }
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE;');
  try {
    for (const link of plan.links) db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,sort_order,created_at,quantity_mode,site_mode) VALUES (?,?,?,?,0,?,?,?)',
      [randomUUID(), link.catalogVersionId, versionByKey.get(link.templateKey)!, link.role, now, 'once', link.siteMode]);
    db.exec('COMMIT;');
  } catch (error) { db.exec('ROLLBACK;'); throw error; }
  return {templatesCreated, linksCreated: plan.links.length};
}

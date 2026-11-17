import { createHash } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ProjectService } from './ProjectService';

/**
 * Durées estimées des modèles du référentiel (décision de Carlos du 17/11/2026, fiche
 * docs/refonte/plans/2026-11-17-durees-offres-particuliers-design.md). Pour chaque modèle à changer : nouvelle version
 * (copie), durées posées sur la copie, publication (l'ancienne version est retirée), liens Catalogue déplacés vers la
 * nouvelle version. Les projets déjà créés gardent leur version (même règle que la clause 119).
 */
export interface TemplateDurations { modeles: Array<{modele: string; taches: Array<{lot: string; name: string; minutes: number}>}> }
export interface TemplateDurationsPlan {
  templates: Array<{modele: string; action: 'update' | 'unchanged'; tasks: number}>;
  missing: string[];
  planSha256: string;
}
type Task = {id: string; lot: string; name: string; minutes: number | null};

const tasksOf = (db: DatabaseAdapter, versionId: string) => db.all<Task>(`SELECT n.id, p.name lot, n.name, n.estimated_minutes minutes FROM project_template_nodes n
  JOIN project_template_nodes p ON p.id=n.parent_id WHERE n.template_version_id=? AND n.node_type='task' ORDER BY p.sort_order, n.sort_order`, [versionId]);
const publishedOf = (db: DatabaseAdapter, name: string) => db.get<{templateId: string; versionId: string}>(`SELECT t.id templateId, v.id versionId FROM project_templates t
  JOIN project_template_versions v ON v.template_id=t.id WHERE t.name=? AND v.status='published'`, [name]);
const keyOf = (lot: string, name: string) => lot + '\u0000' + name;

export function planTemplateDurations(db: DatabaseAdapter, input: TemplateDurations): TemplateDurationsPlan {
  const templates: TemplateDurationsPlan['templates'] = [], missing: string[] = [];
  for (const entry of input.modeles) {
    const published = publishedOf(db, entry.modele);
    if (!published) { missing.push(entry.modele); continue; }
    const current = new Map(tasksOf(db, published.versionId).map(t => [keyOf(t.lot, t.name), t]));
    const absent = entry.taches.filter(t => !current.has(keyOf(t.lot, t.name)));
    if (absent.length) { missing.push(...absent.map(t => `${entry.modele} : ${t.lot} / ${t.name}`)); continue; }
    const same = entry.taches.every(t => current.get(keyOf(t.lot, t.name))!.minutes === t.minutes);
    templates.push({modele: entry.modele, action: same ? 'unchanged' : 'update', tasks: entry.taches.length});
  }
  const planSha256 = createHash('sha256').update(JSON.stringify({input, templates, missing,
    versions: input.modeles.map(m => publishedOf(db, m.modele)?.versionId ?? null)})).digest('hex');
  return {templates, missing, planSha256};
}

export function applyTemplateDurations(db: DatabaseAdapter, projects: ProjectService, input: TemplateDurations, planSha256: string): {templatesUpdated: number; linksMoved: number} {
  const plan = planTemplateDurations(db, input);
  if (plan.planSha256 !== planSha256) throw Error('Empreinte du plan différente de celle relue : relancer l’aperçu avant d’appliquer.');
  const result = {templatesUpdated: 0, linksMoved: 0};
  for (const entry of plan.templates.filter(t => t.action === 'update')) {
    const wanted = input.modeles.find(m => m.modele === entry.modele)!;
    const published = publishedOf(db, entry.modele)!;
    const draft = projects.createTemplateVersion(published.templateId, 'Durées estimées (proposition du 17/11/2026, d’après les temps de référence d’octobre)');
    const draftTasks = new Map(tasksOf(db, draft.id).map(t => [keyOf(t.lot, t.name), t]));
    for (const task of wanted.taches) projects.setTemplateNodeMinutes(draftTasks.get(keyOf(task.lot, task.name))!.id, task.minutes);
    projects.publishTemplateVersion(draft.id);
    result.linksMoved += Number(db.run('UPDATE catalog_project_blueprints SET template_version_id=? WHERE template_version_id=?', [draft.id, published.versionId]).changes);
    result.templatesUpdated++;
  }
  return result;
}

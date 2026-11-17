import { createHash } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ProjectService } from './ProjectService';

/**
 * Fiche « Site » des modèles de sites, boutiques, mariage et landing (décision de Carlos du 17/11/2026) : ces modèles
 * déclarent un « Site principal » (sans page imposée), pour que la vente crée la fiche Site attendue par les maintenances,
 * le module Sites et le Bridge. Nouvelle version, liens Catalogue déplacés ; les projets existants gardent la leur.
 */
export const SITE_KEY = 'main';
const publishedOf = (db: DatabaseAdapter, name: string) => db.get<{templateId: string; versionId: string}>(`SELECT t.id templateId, v.id versionId FROM project_templates t
  JOIN project_template_versions v ON v.template_id=t.id WHERE t.name=? AND v.status='published'`, [name]);
const hasSite = (db: DatabaseAdapter, versionId: string) => Boolean(db.get('SELECT 1 FROM project_template_sites WHERE template_version_id=?', [versionId]));

export function planTemplateSites(db: DatabaseAdapter, names: string[]) {
  const templates: Array<{modele: string; action: 'add_site' | 'unchanged'}> = [], missing: string[] = [];
  for (const name of names) {
    const published = publishedOf(db, name);
    if (!published) { missing.push(name); continue; }
    templates.push({modele: name, action: hasSite(db, published.versionId) ? 'unchanged' : 'add_site'});
  }
  const planSha256 = createHash('sha256').update(JSON.stringify({names, templates, missing, versions: names.map(n => publishedOf(db, n)?.versionId ?? null)})).digest('hex');
  return {templates, missing, planSha256};
}

export function applyTemplateSites(db: DatabaseAdapter, projects: ProjectService, names: string[], planSha256: string): {templatesUpdated: number; linksMoved: number} {
  const plan = planTemplateSites(db, names);
  if (plan.planSha256 !== planSha256) throw Error('Empreinte du plan différente de celle relue : relancer l’aperçu avant d’appliquer.');
  const result = {templatesUpdated: 0, linksMoved: 0};
  for (const entry of plan.templates.filter(t => t.action === 'add_site')) {
    const published = publishedOf(db, entry.modele)!;
    const draft = projects.createTemplateVersion(published.templateId, 'Site principal déclaré (décision du 17/11/2026) : la vente crée la fiche Site.');
    projects.configureTemplateSites(draft.id, [{key: SITE_KEY, name: 'Site principal', pages: []}]);
    projects.publishTemplateVersion(draft.id);
    result.linksMoved += Number(db.run('UPDATE catalog_project_blueprints SET template_version_id=? WHERE template_version_id=?', [draft.id, published.versionId]).changes);
    result.templatesUpdated++;
  }
  return result;
}

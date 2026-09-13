import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type {
  ProjectCompletionItem,
  ProjectCompletionReview,
} from '../../shared/projects';

interface ProjectRow extends Record<string, unknown> {
  id: string;
  project_type: string;
  client_account_id: string | null;
}

export class ProjectCompletionService {
  constructor(private readonly database: DatabaseAdapter) {}

  review(projectId: string): ProjectCompletionReview {
    const project = this.database.get<ProjectRow>(
      'SELECT id, project_type, client_account_id FROM projects WHERE id=?',
      [projectId],
    );
    if (!project) throw new Error('Projet introuvable.');

    const taskStats = this.database.get<{ total_required: number; open_required: number }>(
      `SELECT
        SUM(CASE WHEN is_required=1 AND node_type IN ('task','checklist') THEN 1 ELSE 0 END) AS total_required,
        SUM(CASE WHEN is_required=1 AND node_type IN ('task','checklist') AND status<>'done' THEN 1 ELSE 0 END) AS open_required
       FROM project_nodes WHERE project_id=?`,
      [projectId],
    );
    const requiredTasks = Number(taskStats?.total_required ?? 0);
    const openTasks = Number(taskStats?.open_required ?? 0);

    const prerequisiteStats = this.database.get<{ total_required: number; open_required: number }>(
      `SELECT
        SUM(CASE WHEN is_required=1 THEN 1 ELSE 0 END) AS total_required,
        SUM(CASE WHEN is_required=1 AND status NOT IN ('validated','not_applicable') THEN 1 ELSE 0 END) AS open_required
       FROM project_prerequisites WHERE project_id=?`,
      [projectId],
    );
    const requiredPrerequisites = Number(prerequisiteStats?.total_required ?? 0);
    const openPrerequisites = Number(prerequisiteStats?.open_required ?? 0);

    const deliverables = this.database.get<{ total: number; usable: number }>(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN resource_status<>'obsolete' AND missing_at IS NULL THEN 1 ELSE 0 END) AS usable
       FROM file_assets WHERE project_id=? AND resource_folder='deliverables'`,
      [projectId],
    );
    const deliverableCount = Number(deliverables?.total ?? 0);
    const usableDeliverableCount = Number(deliverables?.usable ?? 0);

    const technical = this.database.get<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM technical_items
       WHERE project_id=? AND scope='project' AND archived_at IS NULL`,
      [projectId],
    );
    const technicalCount = Number(technical?.total ?? 0);
    const internal = project.project_type === 'internal' || project.client_account_id == null;

    const items: ProjectCompletionItem[] = [
      {
        key: 'required_tasks',
        label: 'Tâches obligatoires',
        state: openTasks === 0 ? 'ok' : 'warning',
        detail: requiredTasks === 0
          ? 'Aucune tâche obligatoire définie.'
          : openTasks === 0
            ? `${requiredTasks} tâche${requiredTasks > 1 ? 's' : ''} obligatoire${requiredTasks > 1 ? 's' : ''} terminée${requiredTasks > 1 ? 's' : ''}.`
            : `${openTasks} tâche${openTasks > 1 ? 's' : ''} obligatoire${openTasks > 1 ? 's' : ''} reste${openTasks > 1 ? 'nt' : ''} à terminer sur ${requiredTasks}.`,
        automatic: true,
      },
      {
        key: 'prerequisites',
        label: 'Prérequis',
        state: openPrerequisites === 0 ? 'ok' : 'warning',
        detail: requiredPrerequisites === 0
          ? 'Aucun prérequis obligatoire défini.'
          : openPrerequisites === 0
            ? 'Tous les prérequis obligatoires sont validés ou non applicables.'
            : `${openPrerequisites} prérequis obligatoire${openPrerequisites > 1 ? 's' : ''} reste${openPrerequisites > 1 ? 'nt' : ''} à traiter.`,
        automatic: true,
      },
      {
        key: 'final_backup',
        label: 'Sauvegarde finale',
        state: 'check',
        detail: 'À vérifier manuellement pour l’instant. Le futur module Sauvegardes remplacera ce contrôle par une donnée réelle.',
        automatic: false,
      },
      {
        key: 'deliverables',
        label: 'Livrables',
        state: usableDeliverableCount > 0 ? 'ok' : internal ? 'check' : 'warning',
        detail: usableDeliverableCount > 0
          ? `${usableDeliverableCount} livrable${usableDeliverableCount > 1 ? 's' : ''} présent${usableDeliverableCount > 1 ? 's' : ''} et référencé${usableDeliverableCount > 1 ? 's' : ''}.`
          : deliverableCount > 0
            ? 'Des livrables sont référencés mais aucun n’est actuellement utilisable.'
            : internal
              ? 'Aucun livrable référencé. Vérifie si ce projet interne doit en produire un.'
              : 'Aucun livrable n’est encore référencé dans « 06 Livrables ».',
        automatic: true,
      },
      {
        key: 'balance',
        label: 'Solde à facturer',
        state: internal ? 'ok' : 'check',
        detail: internal
          ? 'Projet interne AtoumWeb : aucun solde client à contrôler.'
          : 'À vérifier manuellement jusqu’au raccordement du module Facturation / Abby.',
        automatic: internal,
      },
      {
        key: 'training',
        label: 'Formation / remise client',
        state: internal ? 'ok' : 'check',
        detail: internal
          ? 'Projet interne : contrôle client non applicable.'
          : 'À confirmer si une formation ou une remise au client était prévue.',
        automatic: internal,
      },
      {
        key: 'maintenance',
        label: 'Maintenance',
        state: internal ? 'ok' : 'check',
        detail: internal
          ? 'Projet interne : proposition de maintenance client non applicable.'
          : 'À confirmer : maintenance proposée, activée ou non applicable.',
        automatic: internal,
      },
      {
        key: 'technical_reuse',
        label: 'Réutilisation technique',
        state: technicalCount > 0 ? 'check' : 'ok',
        detail: technicalCount > 0
          ? `${technicalCount} élément${technicalCount > 1 ? 's' : ''} de Bibliothèque projet à examiner pour une éventuelle réutilisation AtoumWeb.`
          : 'Aucun élément technique projet à examiner pour réutilisation.',
        automatic: true,
      },
    ];

    return {
      projectId,
      canComplete: true,
      warningCount: items.filter((item) => item.state === 'warning').length,
      checkCount: items.filter((item) => item.state === 'check').length,
      items,
      generatedAt: new Date().toISOString(),
    };
  }
}

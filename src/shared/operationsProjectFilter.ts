/**
 * P3b (F20) : filtre par projet de la page Interventions & Maintenance, ouvert depuis l'onglet
 * Interventions d'un projet (« Voir toutes (N) »). Aucune donnée n'est écrite : le filtre est un état de page.
 */
export const OPEN_OPERATIONS_PROJECT_EVENT = 'atoumweb:open-operations-project';

export interface OperationsProjectFilter {
  projectId: string;
  projectLabel: string;
  /** Vue à ouvrir : les demandes ou les interventions du projet. */
  view?: 'requests' | 'interventions';
}

/** Sans projet (nul, absent, vide) : tous les éléments, inchangés. Sinon : seulement ceux du projet. */
export function filterByProject<T extends { projectId?: string | null }>(items: readonly T[], projectId: string | null | undefined): T[] {
  if (!projectId) return [...items];
  return items.filter(item => item.projectId === projectId);
}

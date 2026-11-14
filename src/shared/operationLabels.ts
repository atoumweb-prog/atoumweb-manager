import type {
  HourPackStatus,
  InterventionCoverageMode,
  InterventionStatus,
  InterventionType,
  MaintenanceSubscriptionStatus,
  ServiceRequestPriority,
  ServiceRequestSource,
  ServiceRequestStatus,
} from './operations';

/**
 * Libellés français des valeurs d'opérations, partagés entre l'écran Opérations et l'onglet Interventions d'un projet.
 * Seuls les libellés d'affichage : les valeurs stockées ne changent jamais.
 */
export const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'Nouveau', to_qualify: 'À qualifier', waiting_client: 'En attente client', planned: 'Planifié', converted: 'Transformé', closed: 'Clos sans intervention', archived: 'Archivé',
};
export const SOURCE_LABELS: Record<ServiceRequestSource, string> = {
  email: 'Email', phone: 'Téléphone', website_form: 'Formulaire site', message: 'Message', meeting: 'Réunion', atoumweb_detection: 'Détection AtoumWeb', other: 'Autre',
};
export const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = { low: 'Basse', normal: 'Normale', high: 'Haute', urgent: 'Urgente' };
export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  correction: 'Correction', modification: 'Modification', addition: 'Ajout', maintenance: 'Maintenance', incident: 'Incident', support: 'Support', training: 'Formation', other: 'Autre',
};
export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  to_plan: 'À planifier', planned: 'Planifiée', in_progress: 'En cours', waiting_client: 'En attente client', blocked: 'Bloquée', to_validate: 'À valider', completed: 'Terminée', cancelled: 'Annulée', archived: 'Archivée',
};
export const COVERAGE_LABELS: Record<InterventionCoverageMode, string> = {
  maintenance: 'Inclus maintenance', hour_pack: 'Déduit pack d’heures', out_of_scope: 'Hors forfait facturable', commercial_gesture: 'Geste commercial', included_project: 'Inclus projet', internal: 'Interne AtoumWeb',
};
export const MAINTENANCE_SUBSCRIPTION_STATUS_LABELS: Record<MaintenanceSubscriptionStatus, string> = {
  active: 'Active', suspended: 'Suspendue', ended: 'Terminée', archived: 'Archivée',
};
export const HOUR_PACK_STATUS_LABELS: Record<HourPackStatus, string> = {
  active: 'Actif', exhausted: 'Épuisé', expired: 'Expiré', suspended: 'Suspendu', archived: 'Archivé',
};

/** Libellé connu, sinon la clé rendue lisible (« in_progress_x » devient « In progress x ») : jamais de valeur brute avec trait de soulignement. */
export function readableLabel(labels: Record<string, string>, key: string): string {
  if (labels[key]) return labels[key];
  const text = key.replace(/_/g, ' ').trim();
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1);
}

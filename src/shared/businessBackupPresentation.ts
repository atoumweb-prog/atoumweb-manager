import type { Intervention } from './operations';
import type { BusinessBackupAlert } from './businessBackupAlerts';
import type { BusinessBackupLocation } from './businessBackups';

/** Une vérification du registre n'est ni une empreinte validée, ni un test de restauration. */
export function businessBackupLocationStatus(location: Pick<BusinessBackupLocation, 'locationType' | 'exists' | 'verifiedAt'>): string {
  if (location.locationType === 'local') {
    if (location.exists === true) return 'Chemin local présent (intégrité non testée)';
    if (location.exists === false) return 'Chemin local introuvable';
    return 'Chemin local non contrôlé';
  }
  return location.verifiedAt ? 'Emplacement confirmé manuellement (restauration non testée)' : 'Emplacement non confirmé';
}

export function businessBackupLocationActionLabel(locationType: BusinessBackupLocation['locationType']): string {
  return locationType === 'local' ? 'Vérifier la présence' : 'Confirmer manuellement';
}

/** Les alertes concernent les Projets actifs et suivent le filtre métier affiché, pas le filtre de recherche texte. */
export function filterBusinessBackupAlerts(
  alerts: readonly BusinessBackupAlert[],
  context: { clientAccountId?: string | null; projectId?: string | null },
): BusinessBackupAlert[] {
  return alerts.filter((alert) =>
    (!context.clientAccountId || alert.clientAccountId === context.clientAccountId) &&
    (!context.projectId || alert.projectId === context.projectId),
  );
}

/**
 * Association volontaire d'une fiche existante, sans créer de sauvegarde physique.
 * La couche métier revalide impérativement ces liens lors de l'appel IPC.
 */
export function businessBackupInterventionLinkIssue(
  record: Pick<BusinessBackupRecord, 'id' | 'clientAccountId' | 'projectId' | 'backupAt'>,
  intervention: Pick<Intervention, 'clientAccountId' | 'projectId' | 'startedAt' | 'completedAt'>,
  role: 'pre_intervention' | 'post_intervention',
): string | null {
  if (intervention.projectId) {
    if (record.projectId !== intervention.projectId) return 'Cette fiche ne concerne pas le même projet.';
  } else if (record.clientAccountId !== intervention.clientAccountId) {
    return 'Cette fiche ne concerne pas le même client.';
  }
  const backupTime = new Date(record.backupAt).getTime();
  if (!Number.isFinite(backupTime)) return 'Date de sauvegarde non valide.';
  if (role === 'pre_intervention' && intervention.startedAt) {
    const startedTime = new Date(intervention.startedAt).getTime();
    if (Number.isFinite(startedTime) && backupTime > startedTime) {
      return 'Cette sauvegarde est datée après le début de l’intervention.';
    }
  }
  if (role === 'post_intervention' && intervention.completedAt) {
    const completedTime = new Date(intervention.completedAt).getTime();
    if (Number.isFinite(completedTime) && backupTime < completedTime) {
      return 'Cette sauvegarde est datée avant la clôture de l’intervention.';
    }
  }
  return null;
}

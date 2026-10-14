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

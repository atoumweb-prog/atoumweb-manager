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

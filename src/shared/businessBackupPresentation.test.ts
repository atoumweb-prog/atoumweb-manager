import { describe, expect, it } from 'vitest';
import { businessBackupLocationActionLabel, businessBackupLocationStatus } from './businessBackupPresentation';

describe('business backups evidence labels', () => {
  it('sépare un chemin existant d une preuve d intégrité', () => {
    expect(businessBackupLocationStatus({ locationType: 'local', exists: true, verifiedAt: '2026-10-14T12:00:00Z' }))
      .toContain('intégrité non testée');
    expect(businessBackupLocationStatus({ locationType: 'local', exists: false, verifiedAt: null }))
      .toContain('introuvable');
    expect(businessBackupLocationStatus({ locationType: 'local', exists: null, verifiedAt: null }))
      .toContain('non contrôlé');
  });
  it('ne présente jamais une confirmation distante comme restauration testée', () => {
    expect(businessBackupLocationStatus({ locationType: 'server', exists: null, verifiedAt: null }))
      .toBe('Emplacement non confirmé');
    expect(businessBackupLocationStatus({ locationType: 'external', exists: null, verifiedAt: '2026-10-14T12:00:00Z' }))
      .toContain('restauration non testée');
    expect(businessBackupLocationActionLabel('local')).toBe('Vérifier la présence');
    expect(businessBackupLocationActionLabel('server')).toBe('Confirmer manuellement');
  });
});

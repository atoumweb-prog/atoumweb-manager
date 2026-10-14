import { describe, expect, it } from 'vitest';
import { businessBackupLocationActionLabel, businessBackupLocationStatus, businessBackupInterventionLinkIssue, filterBusinessBackupAlerts } from './businessBackupPresentation';
import type { BusinessBackupAlert } from './businessBackupAlerts';

describe('business backups evidence labels', () => {
  it('sépare un chemin existant d une preuve d intégrité', () => {
    expect(businessBackupLocationStatus({ locationType: 'local', exists: true, verifiedAt: '2026-10-14T12:00:00Z' }))
      .toContain('intégrité non testée');
    expect(businessBackupLocationStatus({ locationType: 'local', exists: false, verifiedAt: null }))
      .toContain('introuvable');
    expect(businessBackupLocationStatus({ locationType: 'local', exists: null, verifiedAt: null }))
      .toContain('non contrôlé');
  });
  it('isole les alertes par Client et Projet sans attribuer une anomalie à un autre dossier', () => {
    const rows: BusinessBackupAlert[] = [
      { id: 'pA', code: 'no_backup', severity: 'warning', title: 'A', detail: '', clientAccountId: 'cA', projectId: 'pA' },
      { id: 'pB', code: 'no_recent_local', severity: 'warning', title: 'B', detail: '', clientAccountId: 'cA', projectId: 'pB' },
      { id: 'pC', code: 'known_too_old', severity: 'warning', title: 'C', detail: '', clientAccountId: 'cB', projectId: 'pC' },
    ];
    expect(filterBusinessBackupAlerts(rows, {})).toHaveLength(3);
    expect(filterBusinessBackupAlerts(rows, { clientAccountId: 'cA' }).map((alert) => alert.id)).toEqual(['pA','pB']);
    expect(filterBusinessBackupAlerts(rows, { projectId: 'pC' }).map((alert) => alert.id)).toEqual(['pC']);
    expect(filterBusinessBackupAlerts(rows, { clientAccountId: 'cA', projectId: 'pC' })).toEqual([]);
    expect(rows).toHaveLength(3);
  });
  it('empêche un lien hors projet et refuse les fiches pré/post hors chronologie', () => {
    const intervention = {
      clientAccountId: 'C1', projectId: 'P1',
      startedAt: '2026-10-14T10:00:00.000Z', completedAt: '2026-10-14T12:00:00.000Z',
    };
    const before = { id: 'B1', clientAccountId: 'C1', projectId: 'P1', backupAt: '2026-10-14T09:00:00.000Z' };
    const after = { ...before, id: 'B2', backupAt: '2026-10-14T13:00:00.000Z' };
    expect(businessBackupInterventionLinkIssue(before, intervention, 'pre_intervention')).toBeNull();
    expect(businessBackupInterventionLinkIssue(after, intervention, 'post_intervention')).toBeNull();
    expect(businessBackupInterventionLinkIssue(after, intervention, 'pre_intervention')).toMatch(/après le début/);
    expect(businessBackupInterventionLinkIssue(before, intervention, 'post_intervention')).toMatch(/avant la clôture/);
    expect(businessBackupInterventionLinkIssue({ ...before, projectId: null }, intervention, 'pre_intervention')).toMatch(/même projet/);
    expect(businessBackupInterventionLinkIssue({ ...before, projectId: 'P2' }, intervention, 'pre_intervention')).toMatch(/même projet/);
    expect(businessBackupInterventionLinkIssue({ ...before, backupAt: 'invalid' }, intervention, 'pre_intervention')).toMatch(/non valide/);
    expect(businessBackupInterventionLinkIssue(before, { ...intervention, projectId: null }, 'pre_intervention')).toBeNull();
    expect(businessBackupInterventionLinkIssue({ ...before, clientAccountId: 'C2' }, { ...intervention, projectId: null }, 'pre_intervention')).toMatch(/même client/);
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

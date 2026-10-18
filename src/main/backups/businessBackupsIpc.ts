import { dialog, ipcMain, shell } from 'electron';
import type {
  BusinessBackupFilters,
  BusinessBackupLocationInput,
  BusinessBackupRecordInput,
} from '../../shared/businessBackups';
import type {
  BusinessBackupPolicyInput,
  InterventionBackupRecordInput,
} from '../../shared/businessBackupAlerts';
import type { DatabaseService } from '../database/DatabaseService';
import { runWorkspaceMutationIfAvailable } from './WorkspaceMutationIpcBoundary';
import type { WorkspaceMutationGate } from './WorkspaceMutationGate';

export function registerBusinessBackupsIpcHandlers(database: DatabaseService, gate?: WorkspaceMutationGate): void {
  const mutate = <T>(fn: () => T): T | Promise<T> => runWorkspaceMutationIfAvailable(gate, fn);
  // list/get -> mapLocation may UPDATE missing_at in SQLite.
  ipcMain.handle('business-backups:list', (_event, filters?: BusinessBackupFilters) =>
    mutate(() => database.businessBackups.list(filters)));
  ipcMain.handle('business-backups:get', (_event, id: string) =>
    mutate(() => database.businessBackups.get(id)));
  ipcMain.handle('business-backups:create', (_event, input: BusinessBackupRecordInput) =>
    mutate(() => database.businessBackups.create(input)));
  ipcMain.handle('business-backups:add-location', (_event, recordId: string, input: BusinessBackupLocationInput) =>
    mutate(() => database.businessBackups.addLocation(recordId, input)));
  ipcMain.handle('business-backups:verify-location', (_event, locationId: string) =>
    mutate(() => database.businessBackups.verifyLocation(locationId)));
  ipcMain.handle('business-backups:mark-stable', (_event, recordId: string) =>
    mutate(() => database.businessBackups.markStable(recordId)));
  ipcMain.handle('business-backups:overview', (_event, filters?: Pick<BusinessBackupFilters, 'clientAccountId' | 'projectId'>) =>
    mutate(() => database.businessBackups.overview(filters)));

  ipcMain.handle('business-backups:relocalize', async (_event, locationId: string) => {
    const current = database.businessBackups.absoluteLocalPath(locationId);
    const selection = await dialog.showOpenDialog({
      title: 'Relocaliser la copie locale',
      defaultPath: current,
      properties: ['openFile', 'openDirectory'],
    });
    if (selection.canceled || selection.filePaths.length === 0) {
      const record = await mutate(() => database.businessBackups.list().find((candidate) => candidate.locations.some((location) => location.id === locationId)));
      if (!record) throw new Error('Sauvegarde liée à cet emplacement introuvable.');
      return record;
    }
    return mutate(() => {
      if (database.businessBackups.absoluteLocalPath(locationId) !== current) {
        throw new Error('Emplacement modifié dans une autre fenêtre. Actualise avant de relocaliser.');
      }
      return database.businessBackups.relocalizePath(locationId, selection.filePaths[0]);
    });
  });

  ipcMain.handle('business-backups:open-location', async (_event, locationId: string) => {
    try {
      const path = database.businessBackups.absoluteLocalPath(locationId);
      const error = await shell.openPath(path);
      return { ok: !error, error: error || null };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Impossible d’ouvrir cet emplacement.' };
    }
  });

  ipcMain.handle('business-backup-alerts:get-policy', (_event, input: { clientAccountId?: string | null; projectId?: string | null }) =>
    database.businessBackupAlerts.getPolicy(input));
  ipcMain.handle('business-backup-alerts:update-policy', (_event, input: BusinessBackupPolicyInput) =>
    mutate(() => database.businessBackupAlerts.updatePolicy(input)));
  // listAlerts -> projectAlerts -> backups.overview -> mapLocation may write.
  ipcMain.handle('business-backup-alerts:list', () =>
    mutate(() => database.businessBackupAlerts.listAlerts()));
  ipcMain.handle('business-backup-alerts:review-intervention', (_event, interventionId: string) =>
    mutate(() => database.businessBackupAlerts.reviewIntervention(interventionId)));
  ipcMain.handle('business-backup-alerts:record-intervention', (_event, input: InterventionBackupRecordInput) =>
    mutate(() => database.businessBackupAlerts.recordForIntervention(input)));
  ipcMain.handle('business-backup-alerts:link-existing', (
    _event,
    interventionId: string,
    backupRecordId: string,
    role: 'pre_intervention' | 'post_intervention' | 'reference',
  ) =>
    mutate(() => database.businessBackupAlerts.linkExisting(interventionId, backupRecordId, role)));
}

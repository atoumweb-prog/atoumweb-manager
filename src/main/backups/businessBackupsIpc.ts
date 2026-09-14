import { dialog, ipcMain, shell } from 'electron';
import type {
  BusinessBackupFilters,
  BusinessBackupLocationInput,
  BusinessBackupRecordInput,
} from '../../shared/businessBackups';
import type { DatabaseService } from '../database/DatabaseService';

export function registerBusinessBackupsIpcHandlers(database: DatabaseService): void {
  ipcMain.handle('business-backups:list', (_event, filters?: BusinessBackupFilters) =>
    database.businessBackups.list(filters));
  ipcMain.handle('business-backups:get', (_event, id: string) =>
    database.businessBackups.get(id));
  ipcMain.handle('business-backups:create', (_event, input: BusinessBackupRecordInput) =>
    database.businessBackups.create(input));
  ipcMain.handle('business-backups:add-location', (_event, recordId: string, input: BusinessBackupLocationInput) =>
    database.businessBackups.addLocation(recordId, input));
  ipcMain.handle('business-backups:verify-location', (_event, locationId: string) =>
    database.businessBackups.verifyLocation(locationId));
  ipcMain.handle('business-backups:mark-stable', (_event, recordId: string) =>
    database.businessBackups.markStable(recordId));
  ipcMain.handle('business-backups:overview', (_event, filters?: Pick<BusinessBackupFilters, 'clientAccountId' | 'projectId'>) =>
    database.businessBackups.overview(filters));

  ipcMain.handle('business-backups:relocalize', async (_event, locationId: string) => {
    const current = database.businessBackups.absoluteLocalPath(locationId);
    const selection = await dialog.showOpenDialog({
      title: 'Relocaliser la copie locale',
      defaultPath: current,
      properties: ['openFile', 'openDirectory'],
    });
    if (selection.canceled || selection.filePaths.length === 0) {
      const record = database.businessBackups.list().find((candidate) => candidate.locations.some((location) => location.id === locationId));
      if (!record) throw new Error('Sauvegarde liée à cet emplacement introuvable.');
      return record;
    }
    return database.businessBackups.relocalizePath(locationId, selection.filePaths[0]);
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
}

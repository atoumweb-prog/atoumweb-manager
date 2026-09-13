import { app, dialog, ipcMain } from 'electron';
import type {
  BackupResult,
  BootstrapState,
  RestoreScheduleResult,
  ThemeName,
  WorkspaceChangeResult,
} from '../shared/contracts';
import { isThemeName } from '../shared/contracts';
import type { DatabaseService } from './database/DatabaseService';
import { scheduleDatabaseRestore } from './restore';
import { saveWorkspaceRoot, type WorkspacePaths } from './workspace';

export function registerIpcHandlers(database: DatabaseService, workspace: WorkspacePaths): void {
  ipcMain.handle('app:get-bootstrap', (): BootstrapState => {
    const storedTheme = database.getSetting<unknown>('theme', 'atoumweb');
    const theme: ThemeName = isThemeName(storedTheme) ? storedTheme : 'atoumweb';

    return {
      appVersion: app.getVersion(),
      workspacePath: workspace.root,
      databasePath: workspace.databaseFile,
      theme,
      database: database.health(),
    };
  });

  ipcMain.handle('settings:set-theme', (_event, value: unknown): ThemeName => {
    if (!isThemeName(value)) {
      throw new Error('Thème invalide.');
    }
    database.setSetting('theme', value);
    return value;
  });

  ipcMain.handle('workspace:choose', async (): Promise<WorkspaceChangeResult> => {
    const result = await dialog.showOpenDialog({
      title: 'Choisir le dossier AtoumWeb Manager',
      defaultPath: workspace.root,
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { cancelled: true };
    }

    const nextWorkspace = saveWorkspaceRoot(result.filePaths[0]);
    return {
      cancelled: false,
      workspacePath: nextWorkspace.root,
      restartRequired: nextWorkspace.root !== workspace.root,
    };
  });

  ipcMain.handle('backups:create-manual', async (): Promise<BackupResult> => {
    const path = await database.createBackup('manual');
    return { path, createdAt: new Date().toISOString() };
  });

  ipcMain.handle('backups:restore', async (): Promise<RestoreScheduleResult> => {
    const selection = await dialog.showOpenDialog({
      title: 'Restaurer une sauvegarde AtoumWeb Manager',
      defaultPath: workspace.backupsDirectory,
      properties: ['openFile'],
      filters: [{ name: 'Sauvegarde SQLite', extensions: ['sqlite', 'db'] }],
    });

    if (selection.canceled || selection.filePaths.length === 0) {
      return { cancelled: true };
    }

    const sourcePath = selection.filePaths[0];
    const confirmation = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Restaurer et redémarrer', 'Annuler'],
      defaultId: 1,
      cancelId: 1,
      title: 'Confirmer la restauration',
      message: 'Restaurer cette sauvegarde ?',
      detail:
        'La base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore, puis l’application redémarrera.',
    });

    if (confirmation.response !== 0) {
      return { cancelled: true };
    }

    scheduleDatabaseRestore(sourcePath);
    app.relaunch();
    app.quit();

    return { cancelled: false, sourcePath, restartScheduled: true };
  });

  ipcMain.handle('database:health', () => database.health());
}

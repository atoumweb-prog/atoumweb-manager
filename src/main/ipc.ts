import { app, dialog, ipcMain } from 'electron';
import type { BackupResult, BootstrapState, ThemeName, WorkspaceChangeResult } from '../shared/contracts';
import { isThemeName } from '../shared/contracts';
import type { DatabaseService } from './database/DatabaseService';
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

  ipcMain.handle('database:health', () => database.health());
}

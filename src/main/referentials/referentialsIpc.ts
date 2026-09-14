import { dialog, ipcMain, shell } from 'electron';
import type {
  AtoumWebPackageImportInput,
  AtoumWebTechnicalAssetRole,
  AtoumWebTechnicalItemInput,
  AtoumWebTechnicalLibraryFilters,
  AtoumWebTechnicalVersionInput,
  ReuseCreateGlobalInput,
  ReusePreparationInput,
} from '../../shared/referentials';
import type { DatabaseService } from '../database/DatabaseService';

export function registerReferentialsIpcHandlers(database: DatabaseService): void {
  ipcMain.handle('referentials:library:list', (_event, filters?: AtoumWebTechnicalLibraryFilters) =>
    database.atoumWebTechnicalLibrary.list(filters));
  ipcMain.handle('referentials:library:get', (_event, id: string) =>
    database.atoumWebTechnicalLibrary.get(id));
  ipcMain.handle('referentials:library:create', (_event, item: AtoumWebTechnicalItemInput, version: AtoumWebTechnicalVersionInput) =>
    database.atoumWebTechnicalLibrary.create(item, version));
  ipcMain.handle('referentials:library:update', (_event, id: string, input: Partial<AtoumWebTechnicalItemInput>) =>
    database.atoumWebTechnicalLibrary.updateMetadata(id, input));
  ipcMain.handle('referentials:library:create-version', (_event, itemId: string, version: AtoumWebTechnicalVersionInput) =>
    database.atoumWebTechnicalLibrary.createVersion(itemId, version));
  ipcMain.handle('referentials:library:mark-stable', (_event, versionId: string) =>
    database.atoumWebTechnicalLibrary.markStable(versionId));
  ipcMain.handle('referentials:library:archive', (_event, itemId: string) =>
    database.atoumWebTechnicalLibrary.archive(itemId));
  ipcMain.handle('referentials:library:reactivate', (_event, itemId: string) =>
    database.atoumWebTechnicalLibrary.reactivate(itemId));

  ipcMain.handle('referentials:library:assets:list', (_event, versionId: string) =>
    database.atoumWebTechnicalAssets.list(versionId));
  ipcMain.handle('referentials:library:assets:import', async (_event, versionId: string, role: AtoumWebTechnicalAssetRole) => {
    const selection = await dialog.showOpenDialog({
      title: 'Ajouter des fichiers à la Bibliothèque AtoumWeb',
      defaultPath: database.atoumWebTechnicalAssets.versionDirectory(versionId),
      properties: ['openFile', 'multiSelections'],
    });
    if (selection.canceled || selection.filePaths.length === 0) return database.atoumWebTechnicalAssets.list(versionId);
    return database.atoumWebTechnicalAssets.importFilePaths(versionId, selection.filePaths, role);
  });
  ipcMain.handle('referentials:library:assets:preview', (_event, assetId: string) =>
    database.atoumWebTechnicalAssets.preview(assetId));
  ipcMain.handle('referentials:library:assets:open-file', async (_event, assetId: string) => {
    const error = await shell.openPath(database.atoumWebTechnicalAssets.absolutePath(assetId));
    return { ok: !error, error: error || null };
  });
  ipcMain.handle('referentials:library:assets:open-folder', async (_event, versionId: string) => {
    const error = await shell.openPath(database.atoumWebTechnicalAssets.versionDirectory(versionId));
    return { ok: !error, error: error || null };
  });

  ipcMain.handle('referentials:reuse:prepare-project-item', (_event, input: ReusePreparationInput) =>
    database.reusePreparation.prepareProjectItem(input));
  ipcMain.handle('referentials:reuse:create-global', (_event, input: ReuseCreateGlobalInput) =>
    database.reusePreparation.createGlobal(input));
  ipcMain.handle('referentials:reuse:open-package', async (_event, path: string) => {
    const validated = database.reusePreparation.assertPackagePath(path);
    const error = await shell.openPath(validated);
    return { ok: !error, error: error || null };
  });

  ipcMain.handle('referentials:packages:export', (_event, itemId: string, versionId?: string | null) =>
    database.atoumWebPackages.exportItem(itemId, versionId));
  ipcMain.handle('referentials:packages:inspect-import', async () => {
    const selection = await dialog.showOpenDialog({
      title: 'Importer un paquet Bibliothèque AtoumWeb',
      properties: ['openFile'],
      filters: [{ name: 'Paquet AtoumWeb ZIP', extensions: ['zip'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return database.atoumWebPackages.inspectPackage(selection.filePaths[0]);
  });
  ipcMain.handle('referentials:packages:import', (_event, input: AtoumWebPackageImportInput) =>
    database.atoumWebPackages.importPackage(input));
  ipcMain.handle('referentials:packages:show-export', (_event, path: string) => {
    const validated = database.atoumWebPackages.assertExportPath(path);
    shell.showItemInFolder(validated);
    return { ok: true, error: null };
  });
}

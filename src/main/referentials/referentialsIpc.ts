import { dialog, ipcMain, shell } from 'electron';
import type {
  AtoumWebCompositionAddItemInput,
  AtoumWebCompositionInput,
  AtoumWebCompositionItemLocalCodeInput,
  AtoumWebCompositionMoveItemInput,
  AtoumWebCompositionPromoteVariantInput,
  AtoumWebDirectReusableCodeInput,
  AtoumWebDirectVariantCodeInput,
  AtoumWebOccurrenceCreateFamilyInput,
  AtoumWebOccurrenceCreateVariantInput,
  AtoumWebOccurrenceUpdateVariantInput,
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
  ipcMain.handle('referentials:library:create-reusable-code', (_event, input: AtoumWebDirectReusableCodeInput) =>
    database.atoumWebTechnicalLibrary.createReusableCode(input));
  ipcMain.handle('referentials:library:create-variant-code', (_event, input: AtoumWebDirectVariantCodeInput) =>
    database.atoumWebTechnicalLibrary.createVariantCode(input));
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

  ipcMain.handle('referentials:compositions:get-for-project-page', (_event, projectNodeId: string) =>
    database.atoumWebCompositions.getForProjectPage(projectNodeId));
  ipcMain.handle('referentials:compositions:ensure-for-project-page', (_event, projectNodeId: string) =>
    database.atoumWebCompositions.ensureForProjectPage(projectNodeId));
  ipcMain.handle('referentials:compositions:attach-to-project-page', (_event, projectNodeId: string, compositionId: string) =>
    database.atoumWebCompositions.attachToProjectPage(projectNodeId, compositionId));
  ipcMain.handle('referentials:compositions:detach-from-project-page', (_event, projectNodeId: string) =>
    database.atoumWebCompositions.detachFromProjectPage(projectNodeId));
  ipcMain.handle('referentials:compositions:list', (_event, includeArchived?: boolean) =>
    database.atoumWebCompositions.list(Boolean(includeArchived)));
  ipcMain.handle('referentials:compositions:get', (_event, id: string) =>
    database.atoumWebCompositions.get(id));
  ipcMain.handle('referentials:compositions:create', (_event, input: AtoumWebCompositionInput) =>
    database.atoumWebCompositions.create(input));
  ipcMain.handle('referentials:compositions:update', (_event, id: string, input: Partial<AtoumWebCompositionInput>) =>
    database.atoumWebCompositions.update(id, input));
  ipcMain.handle('referentials:compositions:add-item', (_event, id: string, input: AtoumWebCompositionAddItemInput) =>
    database.atoumWebCompositions.addItem(id, input));
  ipcMain.handle('referentials:compositions:update-item-local-code', (_event, id: string, itemId: string, input: AtoumWebCompositionItemLocalCodeInput) =>
    database.atoumWebCompositions.updateItemLocalCode(id, itemId, input));
  ipcMain.handle('referentials:compositions:reset-item-local-code', (_event, id: string, itemId: string) =>
    database.atoumWebCompositions.resetItemLocalCode(id, itemId));
  ipcMain.handle('referentials:compositions:promote-item-variant', (_event, id: string, itemId: string, input: AtoumWebCompositionPromoteVariantInput) =>
    database.atoumWebCompositions.promoteItemVariant(id, itemId, input));
  ipcMain.handle('referentials:compositions:remove-item', (_event, id: string, itemId: string) =>
    database.atoumWebCompositions.removeItem(id, itemId));
  ipcMain.handle('referentials:compositions:move-item', (_event, id: string, itemId: string, input: AtoumWebCompositionMoveItemInput) =>
    database.atoumWebCompositions.moveItem(id, itemId, input));
  ipcMain.handle('referentials:compositions:archive', (_event, id: string) =>
    database.atoumWebCompositions.archive(id));
  ipcMain.handle('referentials:compositions:reactivate', (_event, id: string) =>
    database.atoumWebCompositions.reactivate(id));

  ipcMain.handle('referentials:compositions:export-package', (_event, id: string) =>
    database.atoumWebCompositionPackages.exportPackage(id));
  ipcMain.handle('referentials:compositions:export-page-package', (_event, projectNodeId: string) =>
    database.atoumWebCompositionPackages.exportPagePackage(projectNodeId));
  ipcMain.handle('referentials:compositions:show-package', (_event, path: string) => {
    const validated = database.atoumWebCompositionPackages.assertExportPath(path);
    shell.showItemInFolder(validated);
    return { ok: true, error: null };
  });

  ipcMain.handle('referentials:occurrence-returns:list', () =>
    database.atoumWebOccurrenceReturns.list());
  ipcMain.handle('referentials:occurrence-returns:get', (_event, id: string) =>
    database.atoumWebOccurrenceReturns.get(id));
  ipcMain.handle('referentials:occurrence-returns:inspect-import', async () => {
    const selection = await dialog.showOpenDialog({
      title: 'Importer un retour AtoumWeb Bridge',
      properties: ['openFile'],
      filters: [{ name: 'Occurrence Return V1 ZIP', extensions: ['zip'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return database.atoumWebOccurrenceReturns.inspectPackage(selection.filePaths[0]);
  });
  ipcMain.handle('referentials:occurrence-returns:import', (_event, packagePath: string) =>
    database.atoumWebOccurrenceReturns.importReturn(packagePath));
  ipcMain.handle('referentials:occurrence-returns:keep', (_event, id: string) =>
    database.atoumWebOccurrenceReturns.keepOccurrence(id));
  ipcMain.handle('referentials:occurrence-returns:list-variant-targets', (_event, id: string) =>
    database.atoumWebOccurrenceReturns.listVariantTargets(id));
  ipcMain.handle('referentials:occurrence-returns:create-variant', (_event, id: string, input: AtoumWebOccurrenceCreateVariantInput) =>
    database.atoumWebOccurrenceReturns.createVariant(id, input));
  ipcMain.handle('referentials:occurrence-returns:update-variant', (_event, id: string, input: AtoumWebOccurrenceUpdateVariantInput) =>
    database.atoumWebOccurrenceReturns.updateVariant(id, input));
  ipcMain.handle('referentials:occurrence-returns:create-family', (_event, id: string, input: AtoumWebOccurrenceCreateFamilyInput) =>
    database.atoumWebOccurrenceReturns.createFamily(id, input));
}

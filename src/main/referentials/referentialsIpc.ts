import { ipcMain } from 'electron';
import type {
  AtoumWebTechnicalItemInput,
  AtoumWebTechnicalLibraryFilters,
  AtoumWebTechnicalVersionInput,
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
}

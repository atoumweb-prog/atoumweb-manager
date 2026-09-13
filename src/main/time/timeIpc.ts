import { ipcMain } from 'electron';
import type { DatabaseService } from '../database/DatabaseService';
import type { ManualTimeSessionInput, StartTimeSessionInput, TimeSessionFilters } from '../../shared/time';

export function registerTimeIpcHandlers(database: DatabaseService): void {
  ipcMain.handle('time:active', () => database.time.active());
  ipcMain.handle('time:start', (_event, input: StartTimeSessionInput) => database.time.start(input));
  ipcMain.handle('time:pause', (_event, id: string) => database.time.pause(id));
  ipcMain.handle('time:resume', (_event, id: string) => database.time.resume(id));
  ipcMain.handle('time:stop', (_event, id: string) => database.time.stop(id));
  ipcMain.handle('time:add-manual', (_event, input: ManualTimeSessionInput) => database.time.addManual(input));
  ipcMain.handle('time:list', (_event, filters?: TimeSessionFilters) => database.time.list(filters));
  ipcMain.handle('time:summary', (_event, filters?: TimeSessionFilters) => database.time.summary(filters));
}

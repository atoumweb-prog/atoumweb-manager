import { ipcMain } from 'electron';
import type { DatabaseService } from '../database/DatabaseService';
import type { StartTimeSessionInput, UpdateTimeSessionInput } from '../../shared/time';

export function registerTimeCorrectionIpcHandler(database: DatabaseService): void {
  ipcMain.handle('time:update', (_event, id: string, input: UpdateTimeSessionInput) => database.timeCorrections.update(id, input));
  ipcMain.handle('time:switch', (_event, input: StartTimeSessionInput) => database.timeSwitches.switchTo(input));
}

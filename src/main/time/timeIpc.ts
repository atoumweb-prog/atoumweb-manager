import { ipcMain } from 'electron';
import type { DatabaseService } from '../database/DatabaseService';
import { runWorkspaceMutationIfAvailable } from '../backups/WorkspaceMutationIpcBoundary';
import type { WorkspaceMutationGate } from '../backups/WorkspaceMutationGate';
import type { StartTimeSessionInput, UpdateTimeSessionInput } from '../../shared/time';

export function registerTimeCorrectionIpcHandler(database: DatabaseService, gate?: WorkspaceMutationGate): void {
  const mutate = <T>(fn: () => T): T | Promise<T> => runWorkspaceMutationIfAvailable(gate, fn);
  ipcMain.handle('time:update', (_event, id: string, input: UpdateTimeSessionInput) => mutate(() => database.timeCorrections.update(id, input)));
  ipcMain.handle('time:switch', (_event, input: StartTimeSessionInput) => mutate(() => database.timeSwitches.switchTo(input)));
}

import { ipcMain } from 'electron';
import type { DatabaseService } from '../database/DatabaseService';
import type {
  InterventionFilters,
  InterventionInput,
  InterventionStatus,
  ServiceRequestFilters,
  ServiceRequestInput,
  ServiceRequestStatus,
  TransformRequestToInterventionInput,
} from '../../shared/operations';

export function registerOperationsIpcHandlers(database: DatabaseService): void {
  ipcMain.handle('operations:requests:list', (_event, filters?: ServiceRequestFilters) => database.operations.listRequests(filters));
  ipcMain.handle('operations:requests:get', (_event, id: string) => database.operations.getRequest(id));
  ipcMain.handle('operations:requests:create', (_event, input: ServiceRequestInput) => database.operations.createRequest(input));
  ipcMain.handle('operations:requests:update', (_event, id: string, input: Partial<ServiceRequestInput>) => database.operations.updateRequest(id, input));
  ipcMain.handle('operations:requests:change-status', (_event, id: string, status: ServiceRequestStatus) => database.operations.changeRequestStatus(id, status));
  ipcMain.handle('operations:requests:close', (_event, id: string, reason?: string | null) => database.operations.closeRequestWithoutIntervention(id, reason));
  ipcMain.handle('operations:requests:transform', (_event, input: TransformRequestToInterventionInput) => database.operations.transformRequest(input));

  ipcMain.handle('operations:interventions:list', (_event, filters?: InterventionFilters) => database.operations.listInterventions(filters));
  ipcMain.handle('operations:interventions:get', (_event, id: string) => database.operations.getIntervention(id));
  ipcMain.handle('operations:interventions:create', (_event, input: InterventionInput) => database.operations.createIntervention(input));
  ipcMain.handle('operations:interventions:update', (_event, id: string, input: Partial<InterventionInput>) => database.operations.updateIntervention(id, input));
  ipcMain.handle('operations:interventions:change-status', (_event, id: string, status: InterventionStatus) => database.operations.changeInterventionStatus(id, status));
}

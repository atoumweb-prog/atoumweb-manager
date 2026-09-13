import { ipcMain } from 'electron';
import type { DatabaseService } from '../database/DatabaseService';
import type {
  HourPackFilters,
  HourPackInput,
  HourPackMovementInput,
  HourPackStatus,
  InterventionFilters,
  InterventionInput,
  InterventionStatus,
  MaintenanceCheckStatus,
  MaintenancePeriodStatus,
  MaintenancePlanInput,
  MaintenanceSubscriptionFilters,
  MaintenanceSubscriptionInput,
  MaintenanceSubscriptionStatus,
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

  ipcMain.handle('operations:maintenance:plans:list', (_event, includeArchived?: boolean) => database.maintenance.listPlans(includeArchived));
  ipcMain.handle('operations:maintenance:plans:create', (_event, input: MaintenancePlanInput) => database.maintenance.createPlan(input));
  ipcMain.handle('operations:maintenance:plans:update', (_event, id: string, input: Partial<MaintenancePlanInput>) => database.maintenance.updatePlan(id, input));
  ipcMain.handle('operations:maintenance:plans:archive', (_event, id: string) => database.maintenance.archivePlan(id));

  ipcMain.handle('operations:maintenance:subscriptions:list', (_event, filters?: MaintenanceSubscriptionFilters) => database.maintenance.listSubscriptions(filters));
  ipcMain.handle('operations:maintenance:subscriptions:create', (_event, input: MaintenanceSubscriptionInput) => database.maintenance.createSubscription(input));
  ipcMain.handle('operations:maintenance:subscriptions:change-status', (_event, id: string, status: MaintenanceSubscriptionStatus) => database.maintenance.changeSubscriptionStatus(id, status));

  ipcMain.handle('operations:maintenance:periods:list', (_event, subscriptionId: string) => database.maintenance.listPeriods(subscriptionId));
  ipcMain.handle('operations:maintenance:periods:ensure', (_event, subscriptionId: string, referenceDate?: string | null) => database.maintenance.ensurePeriod(subscriptionId, referenceDate));
  ipcMain.handle('operations:maintenance:periods:change-status', (_event, id: string, status: MaintenancePeriodStatus) => database.maintenance.changePeriodStatus(id, status));
  ipcMain.handle('operations:maintenance:checks:update', (_event, id: string, status: MaintenanceCheckStatus, notes?: string | null) => database.maintenance.updateCheck(id, status, notes));

  ipcMain.handle('operations:hour-packs:list', (_event, filters?: HourPackFilters) => database.hourPacks.list(filters));
  ipcMain.handle('operations:hour-packs:get', (_event, id: string) => database.hourPacks.get(id));
  ipcMain.handle('operations:hour-packs:create', (_event, input: HourPackInput) => database.hourPacks.create(input));
  ipcMain.handle('operations:hour-packs:change-status', (_event, id: string, status: HourPackStatus) => database.hourPacks.changeStatus(id, status));
  ipcMain.handle('operations:hour-packs:add-movement', (_event, id: string, input: HourPackMovementInput) => database.hourPacks.addMovement(id, input));
  ipcMain.handle('operations:hour-packs:debit-intervention', (_event, packId: string, interventionId: string) => database.hourPacks.debitIntervention(packId, interventionId));
  ipcMain.handle('operations:hour-packs:reverse-movement', (_event, movementId: string, reason: string) => database.hourPacks.reverseMovement(movementId, reason));
}

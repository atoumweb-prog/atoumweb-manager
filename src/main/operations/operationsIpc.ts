import { ipcMain } from 'electron';
import type { HourPackShortfallDecisionInput } from '../../shared/hourPackShortfall';
import type { MaintenanceOverageDecisionInput } from '../../shared/maintenanceOverage';
import type { MaintenanceReportDraftInput } from '../../shared/maintenanceReport';
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
import type { DatabaseService } from '../database/DatabaseService';
import { runWorkspaceMutationIfAvailable } from '../backups/WorkspaceMutationIpcBoundary';
import type { WorkspaceMutationGate } from '../backups/WorkspaceMutationGate';

export function registerOperationsIpcHandlers(database: DatabaseService, gate?: WorkspaceMutationGate): void {
  const mutate = <T>(fn: () => T): T | Promise<T> => runWorkspaceMutationIfAvailable(gate, fn);
  ipcMain.handle('operations:requests:list', (_event, filters?: ServiceRequestFilters) => database.operations.listRequests(filters));
  ipcMain.handle('operations:requests:get', (_event, id: string) => database.operations.getRequest(id));
  ipcMain.handle('operations:requests:create', (_event, input: ServiceRequestInput) => mutate(() => database.operations.createRequest(input)));
  ipcMain.handle('operations:requests:update', (_event, id: string, input: Partial<ServiceRequestInput>) => mutate(() => database.operations.updateRequest(id, input)));
  ipcMain.handle('operations:requests:change-status', (_event, id: string, status: ServiceRequestStatus) => mutate(() => database.operations.changeRequestStatus(id, status)));
  ipcMain.handle('operations:requests:close', (_event, id: string, reason?: string | null) => mutate(() => database.operations.closeRequestWithoutIntervention(id, reason)));
  ipcMain.handle('operations:requests:transform', (_event, input: TransformRequestToInterventionInput) => mutate(() => database.operations.transformRequest(input)));

  ipcMain.handle('operations:interventions:list', (_event, filters?: InterventionFilters) => database.operations.listInterventions(filters));
  ipcMain.handle('operations:interventions:get', (_event, id: string) => database.operations.getIntervention(id));
  ipcMain.handle('operations:interventions:create', (_event, input: InterventionInput) => mutate(() => database.operations.createIntervention(input)));
  ipcMain.handle('operations:interventions:update', (_event, id: string, input: Partial<InterventionInput>) => mutate(() => database.operations.updateIntervention(id, input)));
  ipcMain.handle('operations:interventions:change-status', (_event, id: string, status: InterventionStatus) => mutate(() => database.operations.changeInterventionStatus(id, status)));
  ipcMain.handle('operations:interventions:complete', (_event, id: string) => mutate(() => database.interventionCompletion.complete(id)));

  ipcMain.handle('operations:maintenance:prepare-routine',(_event,id:string)=> mutate(() => database.maintenance.prepareRoutine(id)));
  ipcMain.handle('operations:maintenance:plans:list', (_event, includeArchived?: boolean) => database.maintenance.listPlans(includeArchived));
  ipcMain.handle('operations:maintenance:plans:create', (_event, input: MaintenancePlanInput) => mutate(() => database.maintenance.createPlan(input)));
  ipcMain.handle('operations:maintenance:plans:update', (_event, id: string, input: Partial<MaintenancePlanInput>) => mutate(() => database.maintenance.updatePlan(id, input)));
  ipcMain.handle('operations:maintenance:plans:archive', (_event, id: string) => mutate(() => database.maintenance.archivePlan(id)));

  ipcMain.handle('operations:maintenance:subscriptions:list', (_event, filters?: MaintenanceSubscriptionFilters) => database.maintenance.listSubscriptions(filters));
  ipcMain.handle('operations:maintenance:subscriptions:create', (_event, input: MaintenanceSubscriptionInput) => mutate(() => database.maintenance.createSubscription(input)));
  ipcMain.handle('operations:maintenance:subscriptions:change-status', (_event, id: string, status: MaintenanceSubscriptionStatus) => mutate(() => database.maintenance.changeSubscriptionStatus(id, status)));

  ipcMain.handle('operations:maintenance:periods:list', (_event, subscriptionId: string) => database.maintenance.listPeriods(subscriptionId));
  ipcMain.handle('operations:maintenance:periods:ensure', (_event, subscriptionId: string, referenceDate?: string | null) => mutate(() => database.maintenance.ensurePeriod(subscriptionId, referenceDate)));
  ipcMain.handle('operations:maintenance:periods:change-status', (_event, id: string, status: MaintenancePeriodStatus) => mutate(() => {
    if (status === 'closed') {
      const review = database.maintenanceOverages.review(id);
      if (review.unresolvedCount > 0) {
        throw new Error(`Décide du traitement des ${review.unresolvedCount} dépassement(s) avant de clôturer cette période.`);
      }
    }
    return database.maintenance.changePeriodStatus(id, status);
  }));
  ipcMain.handle('operations:maintenance:checks:update', (_event, id: string, status: MaintenanceCheckStatus, notes?: string | null) => mutate(() => database.maintenance.updateCheck(id, status, notes)));

  ipcMain.handle('operations:hour-packs:list', (_event, filters?: HourPackFilters) => database.hourPacks.list(filters));
  ipcMain.handle('operations:hour-packs:get', (_event, id: string) => database.hourPacks.get(id));
  ipcMain.handle('operations:hour-packs:create', (_event, input: HourPackInput) => mutate(() => {
    const pack = database.hourPacks.create(input);
    database.billingHandoff.ensureForHourPack(pack.id);
    return pack;
  }));
  ipcMain.handle('operations:hour-packs:change-status', (_event, id: string, status: HourPackStatus) => mutate(() => database.hourPacks.changeStatus(id, status)));
  ipcMain.handle('operations:hour-packs:add-movement', (_event, id: string, input: HourPackMovementInput) => mutate(() => database.hourPacks.addMovement(id, input)));
  ipcMain.handle('operations:hour-packs:preview-debit', (_event, packId: string, interventionId: string) => database.hourPacks.previewInterventionDebit(packId, interventionId));
  ipcMain.handle('operations:hour-packs:debit-intervention', (_event, packId: string, interventionId: string) => mutate(() => database.hourPacks.debitIntervention(packId, interventionId)));
  ipcMain.handle('operations:hour-packs:reverse-movement', (_event, movementId: string, reason: string) => mutate(() => database.hourPacks.reverseMovement(movementId, reason)));

  ipcMain.handle('hour-pack-shortfalls:review', (_event, packId: string) => database.hourPackShortfalls.review(packId));
  ipcMain.handle('hour-pack-shortfalls:decide', (_event, packId: string, input: HourPackShortfallDecisionInput) => mutate(() => database.hourPackShortfalls.decide(packId, input)));

  ipcMain.handle('maintenance-overages:review', (_event, periodId: string) => database.maintenanceOverages.review(periodId));
  ipcMain.handle('maintenance-overages:decide', (_event, periodId: string, input: MaintenanceOverageDecisionInput) => mutate(() => database.maintenanceOverages.decide(periodId, input)));
  ipcMain.handle('maintenance-reports:get', (_event, periodId: string) => database.maintenanceReports.get(periodId));
  ipcMain.handle('maintenance-reports:update-draft', (_event, periodId: string, input: MaintenanceReportDraftInput) => mutate(() => database.maintenanceReports.updateDraft(periodId, input)));
  ipcMain.handle('operations-alerts:get', () => database.operationsAlerts.get());
}

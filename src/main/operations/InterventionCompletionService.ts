import type { Intervention } from '../../shared/operations';
import type { BillingHandoffService } from '../billing/BillingHandoffService';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { HourPackService } from './HourPackService';
import type { MaintenanceOverageService } from './MaintenanceOverageService';
import type { OperationsService } from './OperationsService';

export class InterventionCompletionService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly operations: OperationsService,
    private readonly hourPacks: HourPackService,
    private readonly billing: BillingHandoffService,
    private readonly maintenanceOverages: MaintenanceOverageService,
  ) {}

  complete(id: string): Intervention {
    let intervention = this.operations.getIntervention(id);
    if (['cancelled', 'archived'].includes(intervention.status)) throw new Error('Cette intervention ne peut pas être terminée dans son état actuel.');

    if (intervention.coverageMode === 'maintenance') {
      if (!intervention.maintenancePeriodId) throw new Error('Choisis la période de maintenance avant de terminer cette intervention.');
      const period = this.database.get<{ status: string }>('SELECT status FROM maintenance_periods WHERE id=?', [intervention.maintenancePeriodId]);
      if (!period) throw new Error('Période de maintenance introuvable.');
      if (period.status === 'closed') throw new Error('La période de maintenance est déjà clôturée.');
    }

    if (intervention.coverageMode === 'hour_pack') {
      if (!intervention.hourPackId) throw new Error('Choisis le pack d’heures avant de terminer cette intervention.');
      const pack = this.hourPacks.get(intervention.hourPackId);
      if (pack.clientAccountId !== intervention.clientAccountId) throw new Error('Le pack d’heures appartient à un autre client.');
      if (pack.projectId && pack.projectId !== intervention.projectId) throw new Error('Le pack d’heures appartient à un autre projet.');
      if (['archived', 'suspended', 'expired'].includes(pack.status)) throw new Error('Ce pack d’heures ne peut pas être utilisé dans son état actuel.');
      if (!['to_validate', 'completed'].includes(intervention.status)) {
        intervention = this.operations.changeInterventionStatus(id, 'to_validate');
      }
      this.hourPacks.debitIntervention(intervention.hourPackId, id);
      if (intervention.status !== 'completed') intervention = this.operations.changeInterventionStatus(id, 'completed');
      return intervention;
    }

    if (intervention.status !== 'completed') intervention = this.operations.changeInterventionStatus(id, 'completed');
    if (intervention.coverageMode === 'maintenance') this.maintenanceOverages.syncBillingForIntervention(id);
    this.billing.ensureForIntervention(id);
    return intervention;
  }
}

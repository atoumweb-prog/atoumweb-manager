import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BillingHandoffService } from '../billing/BillingHandoffService';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { HourPackService } from './HourPackService';
import { MaintenanceOverageService } from './MaintenanceOverageService';
import { MaintenanceService } from './MaintenanceService';
import { OperationsAlertService } from './OperationsAlertService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let maintenance: MaintenanceService;
let packs: HourPackService;
let operations: OperationsService;
let alerts: OperationsAlertService;
let overages: MaintenanceOverageService;
let clientId: string;

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  maintenance = new MaintenanceService(database);
  packs = new HourPackService(database);
  operations = new OperationsService(database);
  alerts = new OperationsAlertService(database);
  overages = new MaintenanceOverageService(database, new BillingHandoffService(database));
  const contact = crm.createContact({ firstName: 'Client', lastName: 'Alertes' });
  clientId = crm.createClient({ primaryContactId: contact.id }).id;
});

afterEach(() => database.close());

describe('OperationsAlertService', () => {
  it('signale une période de maintenance active qui reste à générer', () => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const plan = maintenance.listPlans()[0];
    maintenance.createSubscription({ clientAccountId: clientId, planId: plan.id, startDate: dateOnly(start) });

    const snapshot = alerts.get();
    expect(snapshot.alerts.some((alert) => alert.kind === 'maintenance_due' && alert.clientAccountId === clientId)).toBe(true);
  });

  it('signale un pack presque épuisé et proche de son expiration', () => {
    const expires = new Date(Date.now() + 2 * 86_400_000);
    const pack = packs.create({
      clientAccountId: clientId,
      name: 'Pack 10 h test',
      purchasedSeconds: 10 * 3600,
      contractPriceCents: 50000,
      expiresAt: expires.toISOString(),
    });
    packs.addMovement(pack.id, { secondsDelta: -(9 * 3600 + 30 * 60), reason: 'Consommation historique test' });

    const kinds = alerts.get().alerts.filter((alert) => alert.hourPackId === pack.id).map((alert) => alert.kind);
    expect(kinds).toContain('hour_pack_low');
    expect(kinds).toContain('hour_pack_expiring');
  });

  it('remplace l’alerte de dépassement non décidé par une alerte quota après décision', () => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const plan = maintenance.listPlans()[0];
    const subscription = maintenance.createSubscription({ clientAccountId: clientId, planId: plan.id, startDate: dateOnly(start) });
    const period = maintenance.ensurePeriod(subscription.id, dateOnly(now));

    for (let index = 0; index < 3; index += 1) {
      const intervention = operations.createIntervention({
        clientAccountId: clientId,
        maintenancePeriodId: period.id,
        type: 'maintenance',
        coverageMode: 'maintenance',
        subject: `Maintenance ${index + 1}`,
      });
      database.run('UPDATE interventions SET created_at=? WHERE id=?', [new Date(Date.now() + index * 1000).toISOString(), intervention.id]);
    }

    let snapshot = alerts.get();
    expect(snapshot.alerts.some((alert) => alert.kind === 'maintenance_overage_unresolved' && alert.maintenancePeriodId === period.id)).toBe(true);

    const candidate = overages.review(period.id).candidates[0];
    overages.decide(period.id, {
      interventionId: candidate.interventionId,
      decision: 'include_exceptionally',
      reason: 'Inclus exceptionnellement pour ce mois',
    });

    snapshot = alerts.get();
    expect(snapshot.alerts.some((alert) => alert.kind === 'maintenance_overage_unresolved' && alert.maintenancePeriodId === period.id)).toBe(false);
    expect(snapshot.alerts.some((alert) => alert.kind === 'maintenance_quota_reached' && alert.maintenancePeriodId === period.id)).toBe(true);
  });
});

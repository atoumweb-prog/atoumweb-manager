import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { MaintenanceService } from './MaintenanceService';
import { OperationsService } from './OperationsService';
import { TimeService } from '../time/TimeService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let maintenance: MaintenanceService;
let clientId: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  maintenance = new MaintenanceService(database);
  const contact = crm.createContact({ firstName: 'Client', lastName: 'Maintenance' });
  clientId = crm.createClient({ primaryContactId: contact.id }).id;
});

afterEach(() => database.close());

describe('MaintenanceService', () => {
  it('précharge les deux références AtoumWeb modifiables', () => {
    const plans = maintenance.listPlans();
    expect(plans).toHaveLength(2);
    expect(plans[0].periodicPriceCents).toBe(4900);
    expect(plans[0].includedInterventions).toBe(2);
    expect(plans[1].periodicPriceCents).toBe(9900);
    expect(plans[1].includedInterventions).toBe(4);
  });

  it('fige les conditions de la souscription quand le plan évolue', () => {
    const plan = maintenance.listPlans()[0];
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: plan.id,
      startDate: '2026-09-01',
    });

    maintenance.updatePlan(plan.id, {
      periodicPriceCents: 5900,
      includedInterventions: 3,
    });

    const stored = maintenance.listSubscriptions()[0];
    expect(stored.id).toBe(subscription.id);
    expect(stored.catalogPriceCents).toBe(4900);
    expect(stored.contractPriceCents).toBe(4900);
    expect(stored.includedInterventions).toBe(2);
  });

  it('génère une seule période et copie la checklist', () => {
    const plan = maintenance.listPlans()[0];
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: plan.id,
      startDate: '2026-09-01',
    });

    const first = maintenance.ensurePeriod(subscription.id, '2026-09-14');
    const second = maintenance.ensurePeriod(subscription.id, '2026-09-20');

    expect(second.id).toBe(first.id);
    expect(first.periodStart).toBe('2026-09-01');
    expect(first.periodEnd).toBe('2026-09-30');
    expect(first.includedInterventions).toBe(2);
    expect(first.checks).toHaveLength(7);
    expect(maintenance.listPeriods(subscription.id)).toHaveLength(1);
  });

  it('aligne les nouvelles souscriptions manuelles sur le jour de début, sans doublons', () => {
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: maintenance.listPlans()[0].id,
      startDate: '2026-10-15',
    });
    expect(subscription.periodAlignment).toBe('anniversary');
    const first = maintenance.ensurePeriod(subscription.id, '2026-10-20');
    const same = maintenance.ensurePeriod(subscription.id, '2026-11-14');
    const next = maintenance.ensurePeriod(subscription.id, '2026-11-15');
    expect(first.periodStart).toBe('2026-10-15');
    expect(first.periodEnd).toBe('2026-11-14');
    expect(same.id).toBe(first.id);
    expect(next.periodStart).toBe('2026-11-15');
    expect(next.periodEnd).toBe('2026-12-14');
    expect(maintenance.listPeriods(subscription.id)).toHaveLength(2);
  });

  it('préserve les bornes anniversaire lors du passage de janvier à février', () => {
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: maintenance.listPlans()[0].id,
      startDate: '2027-01-31',
    });
    const january = maintenance.ensurePeriod(subscription.id, '2027-01-31');
    const february = maintenance.ensurePeriod(subscription.id, '2027-02-28');
    const march = maintenance.ensurePeriod(subscription.id, '2027-03-31');
    expect([january.periodStart, january.periodEnd]).toEqual(['2027-01-31', '2027-02-27']);
    expect([february.periodStart, february.periodEnd]).toEqual(['2027-02-28', '2027-03-30']);
    expect([march.periodStart, march.periodEnd]).toEqual(['2027-03-31', '2027-04-29']);
  });

  it('préserve le découpage calendaire des souscriptions historiques', () => {
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: maintenance.listPlans()[0].id,
      startDate: '2026-10-15',
    });
    database.run("UPDATE maintenance_subscriptions SET period_alignment='calendar' WHERE id=?", [subscription.id]);
    const existing = maintenance.getSubscription(subscription.id);
    expect(existing.periodAlignment).toBe('calendar');
    const period = maintenance.ensurePeriod(subscription.id, '2026-10-20');
    expect(period.periodStart).toBe('2026-10-15');
    expect(period.periodEnd).toBe('2026-10-31');
  });

  it('distingue temps de routine affiché et consommation du quota mineur', () => {
    const plan = maintenance.createPlan({
      name: 'Maintenance quota TEST',
      periodicPriceCents: 4900,
      includedInterventions: 2,
      includedMinutes: 120,
    });
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId, planId: plan.id, startDate: '2026-10-15',
    });
    const period = maintenance.ensurePeriod(subscription.id, '2026-10-20');
    const operations = new OperationsService(database);
    const time = new TimeService(database);
    const routine = operations.createIntervention({
      clientAccountId: clientId, maintenancePeriodId: period.id,
      coverageMode: 'maintenance', type: 'maintenance', subject: 'Routine TEST',
    });
    const minor = operations.createIntervention({
      clientAccountId: clientId, maintenancePeriodId: period.id,
      coverageMode: 'maintenance', type: 'support', subject: 'Intervention mineure TEST',
    });
    database.run("UPDATE interventions SET maintenance_usage_kind='routine' WHERE id=?", [routine.id]);
    time.addManual({ interventionId: routine.id, category: 'support', startedAt: '2026-10-20T08:00:00Z', endedAt: '2026-10-20T08:30:00Z' });
    time.addManual({ interventionId: minor.id, category: 'support', startedAt: '2026-10-20T09:00:00Z', endedAt: '2026-10-20T10:00:00Z' });
    const usage = maintenance.getPeriod(period.id).usage;
    expect(usage.interventionCount).toBe(1);
    expect(usage.routineSeconds).toBe(1800);
    expect(usage.usedSeconds).toBe(5400);
    expect(usage.remainingSeconds).toBe(3600);
    expect(usage.secondsOverQuota).toBe(0);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('conserve la checklist de la période même si le modèle change ensuite', () => {
    const plan = maintenance.listPlans()[0];
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: plan.id,
      startDate: '2026-09-01',
    });
    const period = maintenance.ensurePeriod(subscription.id, '2026-09-14');

    database.run(
      "UPDATE maintenance_checklist_template_items SET label='Libellé futur' WHERE id='seed-maintenance-wp-01'",
    );

    const reloaded = maintenance.listPeriods(subscription.id)[0];
    expect(reloaded.id).toBe(period.id);
    expect(reloaded.checks.some((check) => check.label === 'Mises à jour WordPress')).toBe(true);
    expect(reloaded.checks.some((check) => check.label === 'Libellé futur')).toBe(false);
  });

  it('met à jour une ligne de checklist sans réécrire les autres', () => {
    const plan = maintenance.listPlans()[0];
    const subscription = maintenance.createSubscription({
      clientAccountId: clientId,
      planId: plan.id,
      startDate: '2026-09-01',
    });
    const period = maintenance.ensurePeriod(subscription.id, '2026-09-14');
    const target = period.checks[0];

    const updated = maintenance.updateCheck(target.id, 'done', 'Contrôle effectué');
    const check = updated.checks.find((item) => item.id === target.id)!;
    expect(check.status).toBe('done');
    expect(check.notes).toBe('Contrôle effectué');
    expect(updated.checks.filter((item) => item.status === 'todo')).toHaveLength(6);
  });
});

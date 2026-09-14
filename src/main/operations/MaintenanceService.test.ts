import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { MaintenanceService } from './MaintenanceService';

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

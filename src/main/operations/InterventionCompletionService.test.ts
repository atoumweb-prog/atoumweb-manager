import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingHandoffService } from '../billing/BillingHandoffService';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { TimeService } from '../time/TimeService';
import { HourPackService } from './HourPackService';
import { InterventionCompletionService } from './InterventionCompletionService';
import { MaintenanceOverageService } from './MaintenanceOverageService';
import { MaintenanceService } from './MaintenanceService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let operations: OperationsService;
let packs: HourPackService;
let billing: BillingHandoffService;
let completion: InterventionCompletionService;
let time: TimeService;
let clientId: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  const crm = new CrmService(database);
  const organization = crm.createOrganization({ name: 'Client Clôture Test' });
  clientId = crm.createClient({ organizationId: organization.id }).id;
  operations = new OperationsService(database);
  packs = new HourPackService(database);
  billing = new BillingHandoffService(database);
  const maintenanceOverages = new MaintenanceOverageService(database, billing);
  completion = new InterventionCompletionService(database, operations, packs, billing, maintenanceOverages);
  time = new TimeService(database);
});

afterEach(() => { vi.restoreAllMocks(); database.close(); });

function snapshot() {
  return Object.fromEntries(['interventions', 'hour_packs', 'hour_pack_movements', 'activity_log', 'billing_items', 'time_sessions', 'time_session_pauses']
    .map(table => [table, database.all(`SELECT * FROM ${table} ORDER BY rowid`)]));
}

function packIntervention(withTime = true) {
  const pack = packs.create({ clientAccountId: clientId, name: 'Pack atomicité', purchasedSeconds: 3600, contractPriceCents: 10000 });
  const intervention = operations.createIntervention({ clientAccountId: clientId, hourPackId: pack.id, type: 'support', coverageMode: 'hour_pack', subject: 'Clôture atomique', status: 'in_progress' });
  if (withTime) time.addManual({ interventionId: intervention.id, category: 'support', startedAt: '2026-09-14T08:00:00Z', endedAt: '2026-09-14T08:30:00Z' });
  return { pack, intervention };
}

describe('InterventionCompletionService', () => {
  it('conserve toutes les cellules et activités si aucun temps terminé ne peut être débité', () => {
    const { intervention } = packIntervention(false);
    const before = snapshot();
    expect(() => completion.complete(intervention.id)).toThrow(/Aucun temps terminé/);
    expect(snapshot()).toEqual(before);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it.each([
    ['avant débit', "BEFORE INSERT ON activity_log WHEN NEW.action='intervention_status_changed' AND NEW.summary LIKE '%to_validate'"],
    ['pendant débit', "BEFORE INSERT ON hour_pack_movements WHEN NEW.movement_type='intervention_debit'"],
    ['après débit, calcul du solde', 'BEFORE UPDATE ON hour_packs'],
    ['journal du débit', "BEFORE INSERT ON activity_log WHEN NEW.action='hour_pack_intervention_debited'"],
    ['transition finale', "BEFORE UPDATE ON interventions WHEN NEW.status='completed'"],
    ['journal final', "BEFORE INSERT ON activity_log WHEN NEW.action='intervention_status_changed' AND NEW.summary LIKE '%completed'"],
  ])('annule intégralement une erreur %s et permet un nouvel appel', (_label, trigger) => {
    const { intervention, pack } = packIntervention();
    const before = snapshot();
    database.exec(`CREATE TEMP TRIGGER completion_failure ${trigger} BEGIN SELECT RAISE(ABORT,'Erreur injectée de clôture'); END;`);
    expect(() => completion.complete(intervention.id)).toThrow(/Erreur injectée/);
    expect(snapshot()).toEqual(before);
    database.exec('DROP TRIGGER completion_failure;');
    expect(completion.complete(intervention.id).status).toBe('completed');
    const after = snapshot();
    completion.complete(intervention.id);
    expect(snapshot()).toEqual(after);
    expect(packs.get(pack.id).balanceSeconds).toBe(1800);
    expect(database.get('PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('ne valide pas la transaction englobante après succès', () => {
    const { intervention } = packIntervention();
    const before = snapshot();
    database.exec('BEGIN IMMEDIATE;');
    try {
      expect(completion.complete(intervention.id).status).toBe('completed');
    } finally { database.exec('ROLLBACK;'); }
    expect(snapshot()).toEqual(before);
  });

  it('préserve les écritures du parent après échec du savepoint', () => {
    const { intervention } = packIntervention(false);
    const before = snapshot();
    database.exec('BEGIN IMMEDIATE;');
    try {
      database.run("INSERT INTO settings VALUES ('parent-test','true','2026-09-14')");
      expect(() => completion.complete(intervention.id)).toThrow(/Aucun temps terminé/);
      expect(snapshot()).toEqual(before);
      expect(database.get("SELECT value_json FROM settings WHERE key='parent-test'")).toEqual({ value_json: 'true' });
    } finally { database.exec('ROLLBACK;'); }
  });

  it('annule statut et facturation hors forfait si son journal échoue', () => {
    const intervention = operations.createIntervention({ clientAccountId: clientId, type: 'correction', coverageMode: 'out_of_scope', subject: 'Hors forfait atomique', billableAmountCents: 7900 });
    const before = snapshot();
    database.exec("CREATE TEMP TRIGGER billing_failure BEFORE INSERT ON activity_log WHEN NEW.action='billing_item_created' BEGIN SELECT RAISE(ABORT,'Erreur journal facturation'); END;");
    expect(() => completion.complete(intervention.id)).toThrow(/Erreur journal facturation/);
    expect(snapshot()).toEqual(before);
  });

  it.each(['included_project', 'internal', 'commercial_gesture'] as const)('conserve la prise en charge %s et son idempotence', coverageMode => {
    const intervention = operations.createIntervention({ clientAccountId: clientId, type: 'support', coverageMode, subject: 'Prise en charge conservée', theoreticalValueCents: 9900 });
    completion.complete(intervention.id);
    const after = snapshot();
    completion.complete(intervention.id);
    expect(snapshot()).toEqual(after);
    const items = billing.list();
    expect(items).toHaveLength(coverageMode === 'commercial_gesture' ? 1 : 0);
    if (items.length) { expect(items[0].expectedAmountCents).toBe(0); expect(items[0].status).toBe('offered'); }
  });

  it('annule une terminaison maintenance si le raccord de facturation échoue', () => {
    const maintenance = new MaintenanceService(database);
    const plan = maintenance.createPlan({ name: 'Plan fixture', periodicPriceCents: 7900, includedInterventions: 2 });
    const subscription = maintenance.createSubscription({ clientAccountId: clientId, planId: plan.id, startDate: '2026-09-01' });
    const period = maintenance.ensurePeriod(subscription.id, '2026-09-14');
    const intervention = operations.createIntervention({ clientAccountId: clientId, maintenancePeriodId: period.id, type: 'maintenance', coverageMode: 'maintenance', subject: 'Maintenance atomique' });
    const overages = new MaintenanceOverageService(database, billing);
    vi.spyOn(overages, 'syncBillingForIntervention').mockImplementation(() => { throw new Error('Erreur raccord maintenance'); });
    const localCompletion = new InterventionCompletionService(database, operations, packs, billing, overages);
    const before = snapshot();
    expect(() => localCompletion.complete(intervention.id)).toThrow(/Erreur raccord maintenance/);
    expect(snapshot()).toEqual(before);
    expect(overages.syncBillingForIntervention).toHaveBeenCalledWith(intervention.id);
    vi.restoreAllMocks();
    expect(localCompletion.complete(intervention.id).status).toBe('completed');
    const after = snapshot();
    localCompletion.complete(intervention.id);
    expect(snapshot()).toEqual(after);
  });
  it('prépare une seule fois la facturation d’une intervention hors forfait', () => {
    const intervention = operations.createIntervention({
      clientAccountId: clientId,
      type: 'correction',
      coverageMode: 'out_of_scope',
      subject: 'Correction hors forfait',
      theoreticalValueCents: 9900,
      billableAmountCents: 7900,
    });

    completion.complete(intervention.id);
    completion.complete(intervention.id);

    const items = billing.list({ sourceType: 'intervention' });
    expect(items).toHaveLength(1);
    expect(items[0].sourceId).toBe(intervention.id);
    expect(items[0].expectedAmountCents).toBe(7900);
    expect(items[0].theoreticalValueCents).toBe(9900);
    expect(items[0].status).toBe('ready');
  });

  it('débite une seule fois le temps réel du pack à la clôture', () => {
    const pack = packs.create({
      clientAccountId: clientId,
      name: 'Pack 10 h',
      purchasedSeconds: 10 * 3600,
      contractPriceCents: 90000,
    });
    const intervention = operations.createIntervention({
      clientAccountId: clientId,
      hourPackId: pack.id,
      type: 'support',
      coverageMode: 'hour_pack',
      subject: 'Support pack',
      status: 'in_progress',
    });
    time.addManual({
      interventionId: intervention.id,
      category: 'support',
      startedAt: '2026-09-14T08:00:00.000Z',
      endedAt: '2026-09-14T09:00:00.000Z',
    });

    completion.complete(intervention.id);
    completion.complete(intervention.id);

    const updatedPack = packs.get(pack.id);
    expect(updatedPack.balanceSeconds).toBe(9 * 3600);
    expect(updatedPack.movements.filter((movement) => movement.type === 'intervention_debit')).toHaveLength(1);
    expect(operations.getIntervention(intervention.id).status).toBe('completed');
  });

  it('refuse de terminer une maintenance non rattachée à une période', () => {
    const intervention = operations.createIntervention({
      clientAccountId: clientId,
      type: 'maintenance',
      coverageMode: 'maintenance',
      subject: 'Maintenance sans période',
    });

    expect(() => completion.complete(intervention.id)).toThrow(/période de maintenance/i);
    expect(operations.getIntervention(intervention.id).status).toBe('to_plan');
  });
});

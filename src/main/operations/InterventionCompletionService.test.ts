import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BillingHandoffService } from '../billing/BillingHandoffService';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { TimeService } from '../time/TimeService';
import { HourPackService } from './HourPackService';
import { InterventionCompletionService } from './InterventionCompletionService';
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
  completion = new InterventionCompletionService(database, operations, packs, billing);
  time = new TimeService(database);
});

afterEach(() => database.close());

describe('InterventionCompletionService', () => {
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

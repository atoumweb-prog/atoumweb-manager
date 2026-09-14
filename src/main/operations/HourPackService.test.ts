import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { TimeService } from '../time/TimeService';
import { HourPackService } from './HourPackService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let operations: OperationsService;
let packs: HourPackService;
let time: TimeService;
let clientId: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  operations = new OperationsService(database);
  packs = new HourPackService(database);
  time = new TimeService(database);
  const organization = crm.createOrganization({ name: 'Client Pack Test' });
  clientId = crm.createClient({ organizationId: organization.id }).id;
});

afterEach(() => database.close());

function createPack(hours = 10) {
  return packs.create({
    clientAccountId: clientId,
    name: `Pack ${hours} h`,
    purchasedSeconds: hours * 3600,
    contractPriceCents: hours * 10000,
  });
}

function createCompletedIntervention(packId: string, minutes: number) {
  const intervention = operations.createIntervention({
    clientAccountId: clientId,
    hourPackId: packId,
    coverageMode: 'hour_pack',
    type: 'support',
    subject: 'Intervention pack',
  });
  time.addManual({
    interventionId: intervention.id,
    category: 'support',
    activityLabel: intervention.subject,
    startedAt: '2026-09-14T08:00:00.000Z',
    endedAt: new Date(Date.parse('2026-09-14T08:00:00.000Z') + minutes * 60_000).toISOString(),
  });
  return operations.changeInterventionStatus(intervention.id, 'completed');
}

describe('HourPackService', () => {
  it('crée le crédit initial et calcule le solde depuis les mouvements', () => {
    const pack = createPack(10);
    expect(pack.purchasedSeconds).toBe(36_000);
    expect(pack.balanceSeconds).toBe(36_000);
    expect(pack.movements).toHaveLength(1);
    expect(pack.movements[0].type).toBe('initial_credit');
  });

  it('débite une intervention terminée une seule fois', () => {
    const pack = createPack(10);
    const intervention = createCompletedIntervention(pack.id, 60);

    const first = packs.debitIntervention(pack.id, intervention.id);
    const second = packs.debitIntervention(pack.id, intervention.id);

    expect(first.balanceSeconds).toBe(9 * 3600);
    expect(second.balanceSeconds).toBe(9 * 3600);
    expect(second.movements.filter((movement) => movement.type === 'intervention_debit')).toHaveLength(1);
  });

  it('autorise un solde négatif mais classe le pack comme épuisé', () => {
    const pack = createPack(1);
    const intervention = createCompletedIntervention(pack.id, 90);
    const updated = packs.debitIntervention(pack.id, intervention.id);

    expect(updated.balanceSeconds).toBe(-1800);
    expect(updated.status).toBe('exhausted');
  });

  it('conserve les corrections et leurs annulations dans le journal', () => {
    const pack = createPack(10);
    const corrected = packs.addMovement(pack.id, {
      type: 'manual_correction',
      secondsDelta: -1800,
      reason: 'Correction de 30 minutes',
    });
    const correction = corrected.movements.find((movement) => movement.type === 'manual_correction')!;
    expect(corrected.balanceSeconds).toBe(34_200);

    const restored = packs.reverseMovement(correction.id, 'Annulation de la correction');
    expect(restored.balanceSeconds).toBe(36_000);
    expect(restored.movements.some((movement) => movement.type === 'reversal' && movement.reversalOfMovementId === correction.id)).toBe(true);
  });
});

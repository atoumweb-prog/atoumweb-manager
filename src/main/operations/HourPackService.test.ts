import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
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

afterEach(() => {database.close();vi.useRealTimers();});

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
  it('annule également un débit direct si son journal échoue', () => {
    const pack = createPack(1);
    const intervention = createCompletedIntervention(pack.id, 30);
    const before = Object.fromEntries(['hour_packs', 'hour_pack_movements', 'interventions', 'activity_log'].map(table => [table, database.all(`SELECT * FROM ${table} ORDER BY rowid`)]));
    database.exec("CREATE TEMP TRIGGER debit_failure BEFORE INSERT ON activity_log WHEN NEW.action='hour_pack_intervention_debited' BEGIN SELECT RAISE(ABORT,'Journal indisponible'); END;");
    expect(() => packs.debitIntervention(pack.id, intervention.id)).toThrow(/Journal indisponible/);
    expect(Object.fromEntries(['hour_packs', 'hour_pack_movements', 'interventions', 'activity_log'].map(table => [table, database.all(`SELECT * FROM ${table} ORDER BY rowid`)]))).toEqual(before);
  });
  it.each(['hour_pack_movement_added', 'hour_pack_movement_reversed'] as const)('annule intégralement une erreur de journal %s', action => {
    const pack = createPack(1);
    const correction = action === 'hour_pack_movement_reversed'
      ? packs.addMovement(pack.id, { secondsDelta: -600, reason: 'Correction préalable' }).movements.find(m => m.type === 'manual_correction')!
      : null;
    const tables = ['hour_packs', 'hour_pack_movements', 'activity_log'];
    const snapshot = () => Object.fromEntries(tables.map(table => [table, database.all(`SELECT * FROM ${table} ORDER BY rowid`)]));
    const before = snapshot();
    database.exec(`CREATE TEMP TRIGGER movement_failure BEFORE INSERT ON activity_log WHEN NEW.action='${action}' BEGIN SELECT RAISE(ABORT,'Journal pack indisponible'); END;`);
    expect(() => {
      if (correction) packs.reverseMovement(correction.id, 'Annulation contrôlée');
      else packs.addMovement(pack.id, { secondsDelta: -1800, reason: 'Correction contrôlée' });
    }).toThrow(/Journal pack indisponible/);
    expect(snapshot()).toEqual(before);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
    database.exec('DROP TRIGGER movement_failure;');
    if (correction) {
      const first = packs.reverseMovement(correction.id, 'Annulation contrôlée');
      const after = snapshot();
      expect(packs.reverseMovement(correction.id, 'Seconde tentative').balanceSeconds).toBe(first.balanceSeconds);
      expect(snapshot()).toEqual(after);
      expect(first.movements.filter(m => m.reversalOfMovementId === correction.id)).toHaveLength(1);
    } else {
      expect(packs.addMovement(pack.id, { secondsDelta: -1800, reason: 'Correction contrôlée' }).balanceSeconds).toBe(1800);
    }
    expect(database.get('PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
  });

  it('calcule l’expiration à la lecture et refuse de consommer un crédit expiré sans mutation silencieuse',()=>{
    const pack=packs.create({clientAccountId:clientId,name:'TEST expiré',purchasedSeconds:18000,contractPriceCents:29900,purchasedAt:'2020-01-01T12:00:00Z',expiresAt:'2021-01-01T12:00:00Z'});
    database.run("UPDATE hour_packs SET status='active' WHERE id=?",[pack.id]);
    const before=database.all('SELECT * FROM hour_packs');expect(packs.get(pack.id).status).toBe('expired');expect(database.all('SELECT * FROM hour_packs')).toEqual(before);
    const intervention=createCompletedIntervention(pack.id,45);expect(()=>packs.debitIntervention(pack.id,intervention.id)).toThrow(/état/);
    expect(packs.get(pack.id).balanceSeconds).toBe(18000);
  });
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

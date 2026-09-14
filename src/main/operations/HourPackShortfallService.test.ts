import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BillingHandoffService } from '../billing/BillingHandoffService';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { TimeService } from '../time/TimeService';
import { HourPackService } from './HourPackService';
import { HourPackShortfallService } from './HourPackShortfallService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let operations: OperationsService;
let packs: HourPackService;
let billing: BillingHandoffService;
let shortfalls: HourPackShortfallService;
let time: TimeService;
let clientId: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  operations = new OperationsService(database);
  packs = new HourPackService(database);
  billing = new BillingHandoffService(database);
  shortfalls = new HourPackShortfallService(database, packs, billing);
  time = new TimeService(database);
  const organization = crm.createOrganization({ name: 'Client Dépassement Pack' });
  clientId = crm.createClient({ organizationId: organization.id }).id;
});

afterEach(() => database.close());

function createPack(name: string, hours: number) {
  return packs.create({
    clientAccountId: clientId,
    name,
    purchasedSeconds: hours * 3600,
    contractPriceCents: hours * 10000,
  });
}

function createDebit(packId: string, minutes: number) {
  const intervention = operations.createIntervention({
    clientAccountId: clientId,
    hourPackId: packId,
    coverageMode: 'hour_pack',
    type: 'support',
    subject: `Support ${minutes} min`,
  });
  const startedAt = '2026-09-14T08:00:00.000Z';
  time.addManual({
    interventionId: intervention.id,
    category: 'support',
    activityLabel: intervention.subject,
    startedAt,
    endedAt: new Date(Date.parse(startedAt) + minutes * 60_000).toISOString(),
  });
  operations.changeInterventionStatus(intervention.id, 'completed');
  packs.debitIntervention(packId, intervention.id);
  return intervention;
}

describe('HourPackShortfallService', () => {
  it('détecte uniquement la partie du débit qui dépasse le solde disponible', () => {
    const pack = createPack('Pack 1 h', 1);
    const intervention = createDebit(pack.id, 90);

    const review = shortfalls.review(pack.id);
    expect(review.balanceSeconds).toBe(-1800);
    expect(review.unresolvedCount).toBe(1);
    expect(review.candidates[0].interventionId).toBe(intervention.id);
    expect(review.candidates[0].debitedSeconds).toBe(5400);
    expect(review.candidates[0].shortfallSeconds).toBe(1800);
  });

  it('autorise explicitement un solde négatif sans modifier le mouvement original', () => {
    const pack = createPack('Pack 1 h', 1);
    createDebit(pack.id, 90);
    const candidate = shortfalls.review(pack.id).candidates[0];

    const review = shortfalls.decide(pack.id, {
      debitMovementId: candidate.debitMovementId,
      decision: 'allow_negative',
      reason: 'Dépassement accepté exceptionnellement',
    });

    expect(review.unresolvedCount).toBe(0);
    expect(packs.get(pack.id).balanceSeconds).toBe(-1800);
    expect(packs.get(pack.id).movements.filter((movement) => movement.type === 'intervention_debit')).toHaveLength(1);
  });

  it('facture le complément une seule fois et remet le pack à zéro par mouvement correctif', () => {
    const pack = createPack('Pack 1 h', 1);
    createDebit(pack.id, 90);
    const candidate = shortfalls.review(pack.id).candidates[0];

    let review = shortfalls.decide(pack.id, {
      debitMovementId: candidate.debitMovementId,
      decision: 'bill_complement',
      reason: '30 minutes hors pack à facturer',
      expectedAmountCents: 6000,
    });
    review = shortfalls.decide(pack.id, {
      debitMovementId: candidate.debitMovementId,
      decision: 'bill_complement',
      reason: '30 minutes hors pack à facturer',
      expectedAmountCents: 6000,
    });

    expect(review.unresolvedCount).toBe(0);
    expect(packs.get(pack.id).balanceSeconds).toBe(0);
    const items = billing.list({ sourceType: 'hour_pack' }).filter((item) => item.sourceKey.startsWith('hour_pack_shortfall:'));
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('ready');
    expect(items[0].expectedAmountCents).toBe(6000);
  });

  it('peut couvrir le dépassement par geste commercial sans effacer l’historique', () => {
    const pack = createPack('Pack 1 h', 1);
    createDebit(pack.id, 90);
    const candidate = shortfalls.review(pack.id).candidates[0];

    shortfalls.decide(pack.id, {
      debitMovementId: candidate.debitMovementId,
      decision: 'commercial_gesture',
      reason: '30 minutes offertes au client',
    });

    const updated = packs.get(pack.id);
    expect(updated.balanceSeconds).toBe(0);
    expect(updated.movements.some((movement) => movement.type === 'commercial_credit' && movement.secondsDelta === 1800)).toBe(true);
    expect(updated.movements.some((movement) => movement.type === 'intervention_debit' && movement.secondsDelta === -5400)).toBe(true);
  });

  it('peut transférer le complément vers un autre pack actif du même client', () => {
    const source = createPack('Pack source 1 h', 1);
    const alternative = createPack('Pack secours 2 h', 2);
    createDebit(source.id, 90);
    const candidate = shortfalls.review(source.id).candidates[0];

    const review = shortfalls.decide(source.id, {
      debitMovementId: candidate.debitMovementId,
      decision: 'use_other_pack',
      reason: 'Complément pris sur le second pack',
      alternativePackId: alternative.id,
    });

    expect(review.unresolvedCount).toBe(0);
    expect(packs.get(source.id).balanceSeconds).toBe(0);
    expect(packs.get(alternative.id).balanceSeconds).toBe(5400);
  });
});

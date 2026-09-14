import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { TimeService } from '../time/TimeService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let operations: OperationsService;
let time: TimeService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  operations = new OperationsService(database);
  time = new TimeService(database);
});

afterEach(() => {
  vi.useRealTimers();
  database.close();
});

describe('Intervention + TimeSession', () => {
  it('conserve les fractions de seconde des pauses avant de calculer la durée totale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T08:00:00.100Z'));
    const contact = crm.createContact({ firstName: 'Client', lastName: 'Pauses' });
    const client = crm.createClient({ primaryContactId: contact.id });
    const intervention = operations.createIntervention({ clientAccountId: client.id, subject: 'Support' });
    const session = time.start({ interventionId: intervention.id, category: 'support' });
    vi.setSystemTime(new Date('2026-09-14T08:00:01.900Z'));
    time.pause(session.id);
    vi.setSystemTime(new Date('2026-09-14T08:00:02.100Z'));
    expect(operations.getIntervention(intervention.id).totalTimeSeconds).toBe(1);
    time.resume(session.id);
    vi.setSystemTime(new Date('2026-09-14T08:00:03.200Z'));
    expect(time.stop(session.id).durationSeconds).toBe(2);
    expect(operations.getIntervention(intervention.id).totalTimeSeconds).toBe(2);
  });

  it('arrête le total au dernier point connu quand une session attend une récupération', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T08:00:00.000Z'));
    const contact = crm.createContact({ firstName: 'Client', lastName: 'Reprise' });
    const client = crm.createClient({ primaryContactId: contact.id });
    const intervention = operations.createIntervention({ clientAccountId: client.id, subject: 'Support' });
    const session = time.start({ interventionId: intervention.id, category: 'support' });
    vi.setSystemTime(new Date('2026-09-14T08:01:00.000Z'));
    time.heartbeat(session.id);
    vi.setSystemTime(new Date('2026-09-14T09:00:00.000Z'));
    expect(time.get(session.id).durationSeconds).toBe(60);
    expect(operations.getIntervention(intervention.id).totalTimeSeconds).toBe(60);
  });

  it('calcule le temps de l’intervention uniquement depuis time_sessions', () => {
    const organization = crm.createOrganization({ name: 'Client Temps Intervention' });
    const client = crm.createClient({ organizationId: organization.id });
    const intervention = operations.createIntervention({
      clientAccountId: client.id,
      subject: 'Correction WordPress',
      type: 'correction',
      status: 'in_progress',
      coverageMode: 'out_of_scope',
    });

    const session = time.addManual({
      interventionId: intervention.id,
      category: 'support',
      activityLabel: 'Diagnostic + correction',
      startedAt: '2026-09-14T08:00:00.000Z',
      endedAt: '2026-09-14T09:15:00.000Z',
      billable: true,
    });

    expect(session.interventionId).toBe(intervention.id);
    expect(session.interventionNumber).toBe(intervention.number);
    expect(session.interventionLabel).toBe('Correction WordPress');
    expect(session.clientAccountId).toBe(client.id);
    expect(operations.getIntervention(intervention.id).totalTimeSeconds).toBe(4500);
  });

  it('refuse de démarrer du temps sur une intervention déjà terminée', () => {
    const organization = crm.createOrganization({ name: 'Client Intervention Terminée' });
    const client = crm.createClient({ organizationId: organization.id });
    const intervention = operations.createIntervention({ clientAccountId: client.id, subject: 'Ancienne intervention' });
    operations.changeInterventionStatus(intervention.id, 'completed');

    expect(() => time.start({ interventionId: intervention.id, category: 'support' })).toThrow(/clôturée/i);
  });
});

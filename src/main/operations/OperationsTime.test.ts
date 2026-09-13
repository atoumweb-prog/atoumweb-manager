import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

afterEach(() => database.close());

describe('Intervention + TimeSession', () => {
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

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from './CrmService';

let database: NodeSqliteAdapter;
let crm: CrmService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
});

afterEach(() => {
  database.close();
});

describe('CrmService', () => {
  it('crée un prospect entreprise avec contact et le retrouve dans la recherche', () => {
    const organization = crm.createOrganization({ name: 'Cazor Auto Passion', email: 'contact@cazor.test' });
    const contact = crm.createContact({
      organizationId: organization.id,
      firstName: 'Carlos',
      lastName: 'Test',
      email: 'carlos@cazor.test',
    });

    const prospect = crm.createProspect({
      organizationId: organization.id,
      contactId: contact.id,
      primaryNeed: 'Refonte du site',
      estimatedValueCents: 250000,
      probabilityPercent: 60,
      nextActionText: 'Rappeler le client',
    });

    expect(prospect.displayName).toBe('Cazor Auto Passion');
    expect(prospect.stage).toBe('new');
    expect(crm.globalSearch('cazor').some((result) => result.entityId === prospect.id)).toBe(true);
  });

  it('refuse de classer un prospect perdu sans raison', () => {
    const contact = crm.createContact({ firstName: 'Jean', lastName: 'Dupont' });
    const prospect = crm.createProspect({ contactId: contact.id });

    expect(() => crm.changeProspectStage(prospect.id, 'lost')).toThrow(/raison/i);
    const lost = crm.changeProspectStage(prospect.id, 'lost', 'Budget insuffisant');
    expect(lost.stage).toBe('lost');
    expect(lost.lostReason).toBe('Budget insuffisant');
  });

  it('convertit un prospect en client de manière idempotente', () => {
    const organization = crm.createOrganization({ name: 'Atelier Test' });
    const prospect = crm.createProspect({ organizationId: organization.id, primaryNeed: 'Site vitrine' });

    const first = crm.convertProspectToClient(prospect.id);
    const second = crm.convertProspectToClient(prospect.id);

    expect(first.createdClient).toBe(true);
    expect(second.createdClient).toBe(false);
    expect(second.clientId).toBe(first.clientId);
    expect(crm.listClients()).toHaveLength(1);
    expect(crm.listProspects({ stage: 'won' })).toHaveLength(1);
  });

  it('archive puis réactive un client sans perdre son historique', () => {
    const contact = crm.createContact({ firstName: 'Anne', lastName: 'Martin', email: 'anne@example.test' });
    const client = crm.createClient({ primaryContactId: contact.id });

    const archived = crm.archiveClient(client.id);
    expect(archived.status).toBe('archived');
    expect(crm.listClients()).toHaveLength(0);
    expect(crm.listClients({ includeArchived: true })).toHaveLength(1);

    const active = crm.reactivateClient(client.id, 'active');
    expect(active.status).toBe('active');
    expect(active.archivedAt).toBeNull();
    expect(crm.listActivity('client', client.id).length).toBeGreaterThanOrEqual(3);
  });

  it('valide les montants et probabilités prospect', () => {
    const contact = crm.createContact({ firstName: 'Paul', lastName: 'Durand' });
    expect(() => crm.createProspect({ contactId: contact.id, probabilityPercent: 101 })).toThrow();
    expect(() => crm.createProspect({ contactId: contact.id, budgetMinCents: 2000, budgetMaxCents: 1000 })).toThrow();
  });
});

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

  it('protège le parcours Prospect et exige une qualification réellement complète', () => {
    const organization = crm.createOrganization({ name: 'Qualification Test' });
    const prospect = crm.createProspect({ organizationId: organization.id });

    expect(() => crm.changeProspectStage(prospect.id, 'quote_sent')).toThrow(/transition non autorisée/i);
    expect(() => crm.updateProspect(prospect.id, { ...prospect, stage: 'quote_to_prepare' })).toThrow(/changement d’étape/i);

    const qualifying = crm.changeProspectStage(prospect.id, 'qualifying');
    database.run(
      `INSERT INTO crm_needs (id,prospect_id,client_account_id,catalog_item_id,other_text,created_at)
       VALUES ('need-qualification',?,NULL,NULL,'Site vitrine',?)`,
      [prospect.id, new Date().toISOString()],
    );
    crm.updateProspect(prospect.id, {
      ...qualifying,
      budgetMinCents: 150000,
      budgetMaxCents: 150000,
      targetDate: '2026-12-15',
    });
    crm.updateProspectQualification(prospect.id, {
      projectSummary: 'Créer un site vitrine pour présenter l’activité',
      decisionStatus: 'no',
      budgetStatus: 'known',
      timelineStatus: 'date',
    });

    expect(() => crm.changeProspectStage(prospect.id, 'need_identified')).toThrow(/décision/i);
    crm.updateProspectQualification(prospect.id, { decisionMakerDetails: 'Mme Martin, gérante' });
    expect(crm.changeProspectStage(prospect.id, 'need_identified').stage).toBe('need_identified');
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

  it('rattache deux prospects de la même organisation au même client', () => {
    const organization = crm.createOrganization({ name: 'Société Unique' });
    const firstProspect = crm.createProspect({ organizationId: organization.id, primaryNeed: 'Site vitrine' });
    const secondProspect = crm.createProspect({ organizationId: organization.id, primaryNeed: 'Maintenance' });

    const first = crm.convertProspectToClient(firstProspect.id);
    const second = crm.convertProspectToClient(secondProspect.id);

    expect(first.clientId).toBe(second.clientId);
    expect(second.createdClient).toBe(false);
    expect(crm.listClients()).toHaveLength(1);
  });

  it('empêche la création directe de deux clients pour la même organisation', () => {
    const organization = crm.createOrganization({ name: 'Client sans doublon' });
    crm.createClient({ organizationId: organization.id });

    expect(() => crm.createClient({ organizationId: organization.id })).toThrow();
    expect(crm.listClients()).toHaveLength(1);
  });

  it('utilise les coordonnées multiples comme source principale du résumé et de la recherche client', () => {
    const organization = crm.createOrganization({ name: 'Coordonnées Test', email: 'ancien@example.test' });
    const client = crm.createClient({ organizationId: organization.id });

    crm.saveContactMethod({
      organizationId: organization.id,
      type: 'email',
      value: 'direction@coordonnees.test',
      label: 'Direction',
      isPrimary: true,
    });
    crm.saveContactMethod({
      organizationId: organization.id,
      type: 'phone',
      value: '0380000000',
      label: 'Accueil',
      isPrimary: true,
    });

    const refreshed = crm.listClients().find((item) => item.id === client.id);
    expect(refreshed?.email).toBe('direction@coordonnees.test');
    expect(refreshed?.phone).toBe('0380000000');
    expect(crm.globalSearch('direction@coordonnees.test').some((result) => result.entityId === client.id)).toBe(true);
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

  it('programme puis retire une prochaine action et journalise les changements', () => {
    const contact = crm.createContact({ firstName: 'Lucie', lastName: 'Bernard' });
    const prospect = crm.createProspect({ contactId: contact.id });
    const nextDate = '2026-09-20T09:00:00.000Z';

    const scheduled = crm.setProspectNextAction(prospect.id, nextDate, 'Rappeler pour le devis');
    expect(scheduled.nextActionAt).toBe(nextDate);
    expect(scheduled.nextActionText).toBe('Rappeler pour le devis');

    const cleared = crm.setProspectNextAction(prospect.id, null, null);
    expect(cleared.nextActionAt).toBeNull();
    expect(cleared.nextActionText).toBeNull();

    const events = crm.listActivity('prospect', prospect.id);
    expect(events.filter((event) => event.action === 'next_action_changed')).toHaveLength(2);
  });

  it('reconstruit la recherche depuis les données maîtres après modification', () => {
    const organization = crm.createOrganization({ name: 'Ancien Nom', city: 'Dijon' });
    expect(crm.globalSearch('ancien')).toHaveLength(1);

    crm.updateOrganization(organization.id, { name: 'Nouveau Nom', city: 'Beaune' });
    expect(crm.globalSearch('ancien')).toHaveLength(0);
    expect(crm.globalSearch('nouveau').some((result) => result.entityId === organization.id)).toBe(true);
    expect(crm.globalSearch('beaune').some((result) => result.entityId === organization.id)).toBe(true);

    const rebuilt = crm.rebuildSearchIndex();
    expect(rebuilt.indexed).toBeGreaterThanOrEqual(1);
    expect(crm.globalSearch('nouveau').some((result) => result.entityId === organization.id)).toBe(true);
  });

  it('valide les montants et probabilités prospect', () => {
    const contact = crm.createContact({ firstName: 'Paul', lastName: 'Durand' });
    expect(() => crm.createProspect({ contactId: contact.id, probabilityPercent: 101 })).toThrow();
    expect(() => crm.createProspect({ contactId: contact.id, budgetMinCents: 2000, budgetMaxCents: 1000 })).toThrow();
  });
});

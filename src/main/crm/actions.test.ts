import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ActionService } from './ActionService';
import { CrmService } from './CrmService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let actions: ActionService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  actions = new ActionService(database);
});

afterEach(() => {
  database.close();
});

describe('ActionService', () => {
  it('conserve plusieurs actions ouvertes pour un même prospect', () => {
    const contact = crm.createContact({ firstName: 'Test', lastName: 'Prospect' });
    const prospect = crm.createProspect({ contactId: contact.id });

    actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: 'Préparer le devis' });
    actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: 'Vérifier le nom de domaine' });

    const open = actions.list({ ownerType: 'prospect', ownerId: prospect.id, status: 'open' });
    expect(open).toHaveLength(2);
    expect(open.map((action) => action.title)).toContain('Préparer le devis');
    expect(open.map((action) => action.title)).toContain('Vérifier le nom de domaine');
  });

  it('sépare les relances des actions et déplace le prospect dans À relancer après envoi du devis', () => {
    const contact = crm.createContact({ firstName: 'Relance', lastName: 'Test' });
    const prospect = crm.createProspect({ contactId: contact.id, stage: 'quote_sent' });

    actions.create({
      ownerType: 'prospect',
      ownerId: prospect.id,
      type: 'follow_up',
      title: 'Relancer après envoi du devis',
      dueAt: '2026-09-20T09:00:00.000Z',
    });

    expect(crm.listProspects({ stage: 'follow_up' }).some((item) => item.id === prospect.id)).toBe(true);
    expect(actions.list({ ownerType: 'prospect', ownerId: prospect.id, type: 'follow_up' })).toHaveLength(1);
    expect(actions.list({ ownerType: 'prospect', ownerId: prospect.id, type: 'action' })).toHaveLength(0);
  });

  it('ne court-circuite pas la qualification lorsqu’une relance est planifiée trop tôt', () => {
    const contact = crm.createContact({ firstName: 'Premier', lastName: 'Contact' });
    const prospect = crm.createProspect({ contactId: contact.id, stage: 'new' });

    actions.create({
      ownerType: 'prospect',
      ownerId: prospect.id,
      type: 'follow_up',
      title: 'Rappeler après le premier contact',
      dueAt: '2026-09-20T09:00:00.000Z',
    });

    const refreshed = crm.listProspects().find((item) => item.id === prospect.id);
    expect(refreshed?.stage).toBe('new');
    expect(refreshed?.nextActionText).toBe('Rappeler après le premier contact');
    expect(actions.list({ ownerType: 'prospect', ownerId: prospect.id, type: 'follow_up' })).toHaveLength(1);
  });

  it('utilise la première échéance ouverte comme prochaine action du prospect', () => {
    const contact = crm.createContact({ firstName: 'Ordre', lastName: 'Actions' });
    const prospect = crm.createProspect({ contactId: contact.id });

    actions.create({
      ownerType: 'prospect',
      ownerId: prospect.id,
      type: 'action',
      title: 'Action plus tard',
      dueAt: '2026-09-25T09:00:00.000Z',
    });
    const first = actions.create({
      ownerType: 'prospect',
      ownerId: prospect.id,
      type: 'follow_up',
      title: 'Relance prioritaire',
      dueAt: '2026-09-18T09:00:00.000Z',
    });

    let refreshed = crm.listProspects().find((item) => item.id === prospect.id);
    expect(refreshed?.nextActionText).toBe('Relance prioritaire');
    expect(refreshed?.nextActionAt).toBe('2026-09-18T09:00:00.000Z');

    actions.complete(first.id);
    refreshed = crm.listProspects().find((item) => item.id === prospect.id);
    expect(refreshed?.nextActionText).toBe('Action plus tard');
    expect(refreshed?.nextActionAt).toBe('2026-09-25T09:00:00.000Z');
  });

  it('garde une action terminée dans l’historique et permet de la rouvrir', () => {
    const contact = crm.createContact({ firstName: 'Historique', lastName: 'Action' });
    const prospect = crm.createProspect({ contactId: contact.id });
    const action = actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: 'Envoyer les éléments' });

    const completed = actions.complete(action.id);
    expect(completed.status).toBe('done');
    expect(actions.list({ ownerType: 'prospect', ownerId: prospect.id, status: 'done' })).toHaveLength(1);

    const reopened = actions.reopen(action.id);
    expect(reopened.status).toBe('open');
    expect(actions.list({ ownerType: 'prospect', ownerId: prospect.id, status: 'open' })).toHaveLength(1);
  });
});

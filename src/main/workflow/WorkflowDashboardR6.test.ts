import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { ActionService } from '../crm/ActionService';
import { QuoteService } from '../commercial/QuoteService';
import { ProjectService } from '../projects/ProjectService';
import { OperationsService } from '../operations/OperationsService';
import { createWorkspacePaths } from '../workspace';
import { WorkflowService } from './WorkflowService';

let db: NodeSqliteAdapter, root: string, crm: CrmService, actions: ActionService, quotes: QuoteService, operations: OperationsService, workflow: WorkflowService;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atoumweb-dashboard-r6-'));
  db = new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys=ON;');
  applyPendingMigrations(db);
  crm = new CrmService(db);
  actions = new ActionService(db);
  quotes = new QuoteService(db, crm);
  operations = new OperationsService(db);
  workflow = new WorkflowService(db, crm, quotes, new ProjectService(db, createWorkspacePaths(root)), operations);
});

afterEach(() => {
  db.close();
  const target = resolve(root);
  if (!target.startsWith(resolve(tmpdir()))) throw new Error('Chemin temporaire inattendu');
  rmSync(target, { recursive: true, force: true });
});

const yesterday = () => new Date(Date.now() - 86_400_000).toISOString();
const prospectNamed = (name: string, stage?: 'quote_to_prepare') => {
  const org = crm.createOrganization({ name });
  return crm.createProspect({ organizationId: org.id, ...(stage ? { stage } : {}) });
};

describe('R6 : le tableau de bord donne le nom du dossier', () => {
  it('une action en retard sur un prospect porte le nom du prospect et son jour', () => {
    const prospect = prospectNamed('TEST Atelier des Saveurs');
    actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: 'Préparer le prochain échange', dueAt: yesterday() });
    const entry = workflow.dashboard().find((item) => item.group === 'Aujourd’hui');
    expect(entry).toBeDefined();
    expect(entry!.target.title).toBe('Préparer le prochain échange');
    expect(entry!.target.subtitle).toBe('TEST Atelier des Saveurs');
    expect(entry!.target.status).toBe(yesterday().slice(0, 10));
  });

  it('une action sur un client porte le nom du client', () => {
    const org = crm.createOrganization({ name: 'TEST Studio Horizon' });
    const prospect = crm.createProspect({ organizationId: org.id });
    const { clientId } = crm.convertProspectToClient(prospect.id);
    actions.create({ ownerType: 'client', ownerId: clientId, type: 'action', title: 'Appeler pour le bilan', dueAt: yesterday() });
    const entry = workflow.dashboard().find((item) => item.group === 'Aujourd’hui' && item.target.title === 'Appeler pour le bilan');
    expect(entry?.target.subtitle).toBe('TEST Studio Horizon');
  });

  it('un devis brouillon porte le nom de son propriétaire', () => {
    const prospect = prospectNamed('TEST Café du Port');
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Site vitrine' });
    const entry = workflow.dashboard().find((item) => item.group === 'Devis à préparer' && item.target.entityType === 'quote');
    expect(entry?.target.entityId).toBe(quote.id);
    expect(entry?.target.subtitle).toBe(quotes.get(quote.id).ownerLabel);
    expect(entry?.target.subtitle).toBeTruthy();
  });

  it('une demande nouvelle porte le nom du client, jamais une chaîne vide', () => {
    const org = crm.createOrganization({ name: 'TEST Boulangerie Lefèvre' });
    const prospect = crm.createProspect({ organizationId: org.id });
    const { clientId } = crm.convertProspectToClient(prospect.id);
    operations.createRequest({ clientAccountId: clientId, subject: 'Question', source: 'email' });
    const entry = workflow.dashboard().find((item) => item.group === 'Demandes nouvelles');
    expect(entry?.target.subtitle).toBe('TEST Boulangerie Lefèvre');
    for (const item of workflow.dashboard()) expect(item.target.subtitle === '').toBe(false);
  });
});

describe('R6 : un prospect avec un devis brouillon n’apparaît qu’une fois', () => {
  it('sans devis : l’entrée du prospect', () => {
    const prospect = prospectNamed('TEST Sans devis', 'quote_to_prepare');
    const entries = workflow.dashboard().filter((item) => item.group === 'Devis à préparer');
    expect(entries.map((item) => item.target.entityType)).toEqual(['prospect']);
    expect(entries[0].target.entityId).toBe(prospect.id);
  });

  it('avec un devis brouillon : seule l’entrée du devis', () => {
    const prospect = prospectNamed('TEST Avec devis', 'quote_to_prepare');
    const quote = quotes.create({ prospectId: prospect.id, subject: 'Site vitrine' });
    const entries = workflow.dashboard().filter((item) => item.group === 'Devis à préparer');
    expect(entries.map((item) => item.target.entityType)).toEqual(['quote']);
    expect(entries[0].target.entityId).toBe(quote.id);
  });
});

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ProjectService } from '../projects/ProjectService';
import { createWorkspacePaths } from '../workspace';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let projects: ProjectService;
let operations: OperationsService;
let workspaceRoot: string;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-operations-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  projects = new ProjectService(database, createWorkspacePaths(workspaceRoot));
  operations = new OperationsService(database);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

function createClient(label = 'Client Opérations') {
  const organization = crm.createOrganization({ name: label });
  return crm.createClient({ organizationId: organization.id });
}

describe('OperationsService', () => {
  it('transforme une demande en une seule intervention de manière idempotente', () => {
    const client = createClient();
    const request = operations.createRequest({
      clientAccountId: client.id,
      source: 'email',
      subject: 'Corriger le formulaire',
      description: 'Le formulaire ne transmet plus les messages.',
      priority: 'high',
    });

    const first = operations.transformRequest({
      requestId: request.id,
      type: 'correction',
      coverageMode: 'out_of_scope',
      theoreticalValueCents: 7900,
      billableAmountCents: 7900,
    });
    const second = operations.transformRequest({ requestId: request.id });

    expect(first.id).toBe(second.id);
    expect(first.number).toMatch(/^INT-\d{4}-001$/);
    expect(operations.listInterventions()).toHaveLength(1);
    expect(operations.getRequest(request.id).status).toBe('converted');
    expect(operations.getRequest(request.id).interventionId).toBe(first.id);
  });

  it('permet de clore une demande sans intervention puis interdit sa transformation', () => {
    const client = createClient();
    const request = operations.createRequest({ clientAccountId: client.id, subject: 'Question sans intervention' });

    const closed = operations.closeRequestWithoutIntervention(request.id, 'Simple information transmise au client');
    expect(closed.status).toBe('closed');
    expect(closed.closeReason).toMatch(/information/i);
    expect(() => operations.transformRequest({ requestId: request.id })).toThrow(/close ou archivée/i);
    expect(operations.listInterventions()).toHaveLength(0);
  });

  it('vérifie que le projet et la tâche appartiennent bien au client sélectionné', () => {
    const clientA = createClient('Client A');
    const clientB = createClient('Client B');
    const internal = projects.createInternal({ name: 'Projet interne' });

    expect(() => operations.createRequest({
      clientAccountId: clientA.id,
      projectId: internal.id,
      subject: 'Projet incohérent',
    })).toThrow(/autre client/i);

    const projectAId = 'project-client-a';
    const now = new Date().toISOString();
    database.run(
      `INSERT INTO projects (id,project_number,client_account_id,name,project_type,status,commercial_mode,commercial_value_cents,contract_value_cents,created_at,updated_at)
       VALUES (?,?,?,?,?,'in_progress','normal',0,0,?,?)`,
      [projectAId, 'PRO-2026-998', clientA.id, 'Projet A', 'website', now, now],
    );
    const projectBId = 'project-client-b';
    database.run(
      `INSERT INTO projects (id,project_number,client_account_id,name,project_type,status,commercial_mode,commercial_value_cents,contract_value_cents,created_at,updated_at)
       VALUES (?,?,?,?,?,'in_progress','normal',0,0,?,?)`,
      [projectBId, 'PRO-2026-999', clientB.id, 'Projet B', 'website', now, now],
    );
    const node = projects.addProjectNode(projectBId, { type: 'task', name: 'Tâche B' }).nodes[0];

    expect(() => operations.createIntervention({
      clientAccountId: clientA.id,
      projectId: projectAId,
      projectNodeId: node.id,
      subject: 'Mauvaise tâche',
    })).toThrow(/n’appartient pas/i);
  });

  it('numérote les interventions et gère leurs statuts sans stocker de durée propre', () => {
    const client = createClient();
    const first = operations.createIntervention({
      clientAccountId: client.id,
      subject: 'Support client',
      type: 'support',
      coverageMode: 'commercial_gesture',
      billableAmountCents: 0,
      theoreticalValueCents: 4900,
    });
    const second = operations.createIntervention({ clientAccountId: client.id, subject: 'Ajout de contenu', type: 'addition' });

    expect(first.number).toMatch(/-001$/);
    expect(second.number).toMatch(/-002$/);
    expect(first.totalTimeSeconds).toBe(0);

    const started = operations.changeInterventionStatus(first.id, 'in_progress');
    expect(started.startedAt).toBeTruthy();
    const completed = operations.changeInterventionStatus(first.id, 'completed');
    expect(completed.completedAt).toBeTruthy();
  });

  it('conserve les champs incident uniquement pour une intervention de type incident', () => {
    const client = createClient();
    const incident = operations.createIntervention({
      clientAccountId: client.id,
      subject: 'Site indisponible',
      type: 'incident',
      incidentCriticality: 'critical',
      downtimeMinutes: 35,
      incidentDiagnosis: 'Erreur serveur',
    });
    expect(incident.incidentCriticality).toBe('critical');
    expect(incident.downtimeMinutes).toBe(35);

    const converted = operations.updateIntervention(incident.id, { type: 'support' });
    expect(converted.incidentCriticality).toBeNull();
    expect(converted.downtimeMinutes).toBeNull();
  });
});

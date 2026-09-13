import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  INCIDENT_CRITICALITIES,
  INTERVENTION_COVERAGE_MODES,
  INTERVENTION_STATUSES,
  INTERVENTION_TYPES,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_SOURCES,
  SERVICE_REQUEST_STATUSES,
  type Intervention,
  type InterventionFilters,
  type InterventionInput,
  type InterventionStatus,
  type ServiceRequest,
  type ServiceRequestFilters,
  type ServiceRequestInput,
  type ServiceRequestStatus,
  type TransformRequestToInterventionInput,
} from '../../shared/operations';

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};
const nowIso = (): string => new Date().toISOString();

interface RequestRow extends Record<string, unknown> {
  id: string;
  client_account_id: string;
  project_id: string | null;
  source: ServiceRequest['source'];
  subject: string;
  description: string | null;
  priority: ServiceRequest['priority'];
  received_at: string;
  next_action_at: string | null;
  next_action_text: string | null;
  status: ServiceRequestStatus;
  close_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  client_label: string;
  project_label: string | null;
  intervention_id: string | null;
}

interface InterventionRow extends Record<string, unknown> {
  id: string;
  intervention_number: string;
  client_account_id: string;
  project_id: string | null;
  project_node_id: string | null;
  source_request_id: string | null;
  intervention_type: Intervention['type'];
  status: InterventionStatus;
  coverage_mode: Intervention['coverageMode'];
  subject: string;
  description: string | null;
  priority: Intervention['priority'];
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  theoretical_value_cents: number;
  billable_amount_cents: number;
  notes: string | null;
  incident_criticality: Intervention['incidentCriticality'];
  incident_started_at: string | null;
  incident_resolved_at: string | null;
  downtime_minutes: number | null;
  incident_cause: string | null;
  incident_diagnosis: string | null;
  incident_solution: string | null;
  incident_follow_up: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  client_label: string;
  project_label: string | null;
  project_node_label: string | null;
  total_time_seconds: number;
}

export class OperationsService {
  constructor(private readonly database: DatabaseAdapter) {}

  listRequests(filters: ServiceRequestFilters = {}): ServiceRequest[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filters.includeArchived) where.push("sr.status <> 'archived'");
    if (filters.status) { this.assertRequestStatus(filters.status); where.push('sr.status=?'); params.push(filters.status); }
    if (filters.priority) { this.assertPriority(filters.priority); where.push('sr.priority=?'); params.push(filters.priority); }
    if (clean(filters.clientAccountId)) { where.push('sr.client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectId)) { where.push('sr.project_id=?'); params.push(clean(filters.projectId) as string); }
    const needle = clean(filters.search);
    if (needle) {
      where.push(`(lower(sr.subject) LIKE ? OR lower(COALESCE(sr.description,'')) LIKE ? OR lower(COALESCE(o.name, trim(c.first_name || ' ' || c.last_name),'')) LIKE ? OR lower(COALESCE(p.name,'')) LIKE ?)`);
      const search = `%${needle.toLocaleLowerCase('fr-FR')}%`;
      params.push(search, search, search, search);
    }
    return this.database.all<RequestRow>(`${this.requestSelect()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY sr.received_at DESC, sr.created_at DESC`, params).map((row) => this.mapRequest(row));
  }

  getRequest(id: string): ServiceRequest {
    const row = this.database.get<RequestRow>(`${this.requestSelect()} WHERE sr.id=?`, [id]);
    if (!row) throw new Error('Demande introuvable.');
    return this.mapRequest(row);
  }

  createRequest(input: ServiceRequestInput): ServiceRequest {
    const clientId = clean(input.clientAccountId);
    const subject = clean(input.subject);
    if (!clientId) throw new Error('Client requis.');
    if (!subject) throw new Error('Sujet de la demande requis.');
    this.assertClientProject(clientId, clean(input.projectId));
    const source = input.source ?? 'other';
    const priority = input.priority ?? 'normal';
    if (!SERVICE_REQUEST_SOURCES.includes(source)) throw new Error('Origine de demande invalide.');
    this.assertPriority(priority);
    const receivedAt = input.receivedAt ? this.dateIso(input.receivedAt, 'Date de réception invalide.') : nowIso();
    const now = nowIso();
    const id = randomUUID();
    this.database.run(
      `INSERT INTO service_requests
       (id,client_account_id,project_id,source,subject,description,priority,received_at,next_action_at,next_action_text,status,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'new',?,?,?)`,
      [id, clientId, clean(input.projectId), source, subject, clean(input.description), priority, receivedAt, this.optionalDate(input.nextActionAt), clean(input.nextActionText), clean(input.notes), now, now],
    );
    this.writeActivity('service_request', id, 'service_request_created', `Demande créée : ${subject}`);
    return this.getRequest(id);
  }

  updateRequest(id: string, input: Partial<ServiceRequestInput>): ServiceRequest {
    const current = this.getRequest(id);
    if (current.status === 'archived') throw new Error('Réactive la demande avant de la modifier.');
    const clientId = clean(input.clientAccountId ?? current.clientAccountId) as string;
    const projectId = input.projectId === undefined ? current.projectId ?? null : clean(input.projectId);
    const subject = clean(input.subject ?? current.subject);
    if (!subject) throw new Error('Sujet de la demande requis.');
    this.assertClientProject(clientId, projectId);
    const source = input.source ?? current.source;
    const priority = input.priority ?? current.priority;
    if (!SERVICE_REQUEST_SOURCES.includes(source)) throw new Error('Origine de demande invalide.');
    this.assertPriority(priority);
    this.database.run(
      `UPDATE service_requests SET client_account_id=?,project_id=?,source=?,subject=?,description=?,priority=?,received_at=?,
       next_action_at=?,next_action_text=?,notes=?,updated_at=? WHERE id=?`,
      [clientId, projectId, source, subject, input.description === undefined ? current.description ?? null : clean(input.description), priority,
        input.receivedAt === undefined ? current.receivedAt : this.dateIso(input.receivedAt as string, 'Date de réception invalide.'),
        input.nextActionAt === undefined ? current.nextActionAt ?? null : this.optionalDate(input.nextActionAt),
        input.nextActionText === undefined ? current.nextActionText ?? null : clean(input.nextActionText),
        input.notes === undefined ? current.notes ?? null : clean(input.notes), nowIso(), id],
    );
    return this.getRequest(id);
  }

  changeRequestStatus(id: string, status: ServiceRequestStatus): ServiceRequest {
    this.assertRequestStatus(status);
    const current = this.getRequest(id);
    if (current.status === 'converted' && status !== 'converted') throw new Error('Une demande transformée reste liée à son intervention.');
    const now = nowIso();
    this.database.run(
      'UPDATE service_requests SET status=?, archived_at=?, updated_at=? WHERE id=?',
      [status, status === 'archived' ? now : null, now, id],
    );
    this.writeActivity('service_request', id, 'service_request_status_changed', `Statut demande : ${status}`);
    return this.getRequest(id);
  }

  closeRequestWithoutIntervention(id: string, reason?: string | null): ServiceRequest {
    const current = this.getRequest(id);
    if (current.interventionId || current.status === 'converted') throw new Error('Cette demande est déjà transformée en intervention.');
    const now = nowIso();
    this.database.run('UPDATE service_requests SET status=\'closed\', close_reason=?, updated_at=? WHERE id=?', [clean(reason), now, id]);
    this.writeActivity('service_request', id, 'service_request_closed', `Demande close sans intervention : ${current.subject}`);
    return this.getRequest(id);
  }

  transformRequest(input: TransformRequestToInterventionInput): Intervention {
    const existing = this.database.get<{ id: string }>('SELECT id FROM interventions WHERE source_request_id=?', [input.requestId]);
    if (existing) return this.getIntervention(existing.id);
    const request = this.getRequest(input.requestId);
    if (['closed', 'archived'].includes(request.status)) throw new Error('Cette demande est close ou archivée.');
    const type = input.type ?? 'other';
    const coverageMode = input.coverageMode ?? 'out_of_scope';
    this.assertInterventionType(type);
    this.assertCoverageMode(coverageMode);
    const projectNodeId = clean(input.projectNodeId);
    this.assertNode(request.projectId ?? null, projectNodeId);
    this.assertMoney(input.theoreticalValueCents ?? 0, 'Valeur théorique invalide.');
    this.assertMoney(input.billableAmountCents ?? 0, 'Montant facturable invalide.');

    const id = randomUUID();
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const number = this.nextInterventionNumber(new Date().getFullYear(), now);
      this.database.run(
        `INSERT INTO interventions
         (id,intervention_number,client_account_id,project_id,project_node_id,source_request_id,intervention_type,status,coverage_mode,subject,description,priority,scheduled_at,theoretical_value_cents,billable_amount_cents,notes,created_at,updated_at)
         VALUES (?,?,?,?,?,? ,?,'to_plan',?,?,?,?,?,?,?,?,?,?)`,
        [id, number, request.clientAccountId, request.projectId ?? null, projectNodeId, request.id, type, coverageMode, request.subject,
          request.description ?? null, request.priority, this.optionalDate(input.scheduledAt), input.theoreticalValueCents ?? 0, input.billableAmountCents ?? 0,
          request.notes ?? null, now, now],
      );
      this.database.run('UPDATE service_requests SET status=\'converted\', updated_at=? WHERE id=?', [now, request.id]);
      this.writeActivity('service_request', request.id, 'service_request_converted', `Demande transformée en intervention ${number}`);
      this.writeActivity('intervention', id, 'intervention_created_from_request', `Intervention ${number} créée depuis la demande`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getIntervention(id);
  }

  listInterventions(filters: InterventionFilters = {}): Intervention[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filters.includeArchived) where.push("i.status <> 'archived'");
    if (filters.status) { this.assertInterventionStatus(filters.status); where.push('i.status=?'); params.push(filters.status); }
    if (filters.type) { this.assertInterventionType(filters.type); where.push('i.intervention_type=?'); params.push(filters.type); }
    if (filters.coverageMode) { this.assertCoverageMode(filters.coverageMode); where.push('i.coverage_mode=?'); params.push(filters.coverageMode); }
    if (clean(filters.clientAccountId)) { where.push('i.client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectId)) { where.push('i.project_id=?'); params.push(clean(filters.projectId) as string); }
    const needle = clean(filters.search);
    if (needle) {
      where.push(`(lower(i.intervention_number) LIKE ? OR lower(i.subject) LIKE ? OR lower(COALESCE(i.description,'')) LIKE ? OR lower(COALESCE(o.name, trim(c.first_name || ' ' || c.last_name),'')) LIKE ? OR lower(COALESCE(p.name,'')) LIKE ?)`);
      const search = `%${needle.toLocaleLowerCase('fr-FR')}%`;
      params.push(search, search, search, search, search);
    }
    return this.database.all<InterventionRow>(`${this.interventionSelect()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY i.created_at DESC`, params).map((row) => this.mapIntervention(row));
  }

  getIntervention(id: string): Intervention {
    const row = this.database.get<InterventionRow>(`${this.interventionSelect()} WHERE i.id=?`, [id]);
    if (!row) throw new Error('Intervention introuvable.');
    return this.mapIntervention(row);
  }

  createIntervention(input: InterventionInput): Intervention {
    const clientId = clean(input.clientAccountId);
    const projectId = clean(input.projectId);
    const nodeId = clean(input.projectNodeId);
    const subject = clean(input.subject);
    if (!clientId) throw new Error('Client requis.');
    if (!subject) throw new Error('Sujet de l’intervention requis.');
    this.assertClientProject(clientId, projectId);
    this.assertNode(projectId, nodeId);
    if (input.sourceRequestId) {
      const request = this.getRequest(input.sourceRequestId);
      if (request.clientAccountId !== clientId) throw new Error('La demande source appartient à un autre client.');
      const existing = this.database.get<{ id: string }>('SELECT id FROM interventions WHERE source_request_id=?', [input.sourceRequestId]);
      if (existing) return this.getIntervention(existing.id);
    }
    const type = input.type ?? 'other';
    const status = input.status ?? 'to_plan';
    const coverage = input.coverageMode ?? 'out_of_scope';
    const priority = input.priority ?? 'normal';
    this.assertInterventionType(type);
    this.assertInterventionStatus(status);
    this.assertCoverageMode(coverage);
    this.assertPriority(priority);
    this.validateIncident(type, input);
    this.assertMoney(input.theoreticalValueCents ?? 0, 'Valeur théorique invalide.');
    this.assertMoney(input.billableAmountCents ?? 0, 'Montant facturable invalide.');
    const id = randomUUID(); const now = nowIso(); const number = this.nextInterventionNumber(new Date().getFullYear(), now);
    this.database.run(
      `INSERT INTO interventions
       (id,intervention_number,client_account_id,project_id,project_node_id,source_request_id,intervention_type,status,coverage_mode,subject,description,priority,scheduled_at,started_at,completed_at,theoretical_value_cents,billable_amount_cents,notes,incident_criticality,incident_started_at,incident_resolved_at,downtime_minutes,incident_cause,incident_diagnosis,incident_solution,incident_follow_up,created_at,updated_at,archived_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, number, clientId, projectId, nodeId, clean(input.sourceRequestId), type, status, coverage, subject, clean(input.description), priority,
        this.optionalDate(input.scheduledAt), status === 'in_progress' ? now : null, status === 'completed' ? now : null,
        input.theoreticalValueCents ?? 0, input.billableAmountCents ?? 0, clean(input.notes),
        type === 'incident' ? input.incidentCriticality ?? 'normal' : null, type === 'incident' ? this.optionalDate(input.incidentStartedAt) : null,
        type === 'incident' ? this.optionalDate(input.incidentResolvedAt) : null, type === 'incident' ? input.downtimeMinutes ?? null : null,
        type === 'incident' ? clean(input.incidentCause) : null, type === 'incident' ? clean(input.incidentDiagnosis) : null,
        type === 'incident' ? clean(input.incidentSolution) : null, type === 'incident' ? clean(input.incidentFollowUp) : null,
        now, now, status === 'archived' ? now : null],
    );
    if (input.sourceRequestId) this.database.run('UPDATE service_requests SET status=\'converted\', updated_at=? WHERE id=?', [now, input.sourceRequestId]);
    this.writeActivity('intervention', id, 'intervention_created', `Intervention ${number} créée : ${subject}`);
    return this.getIntervention(id);
  }

  updateIntervention(id: string, input: Partial<InterventionInput>): Intervention {
    const current = this.getIntervention(id);
    if (current.status === 'archived') throw new Error('Réactive l’intervention avant de la modifier.');
    const clientId = clean(input.clientAccountId ?? current.clientAccountId) as string;
    const projectId = input.projectId === undefined ? current.projectId ?? null : clean(input.projectId);
    const nodeId = input.projectNodeId === undefined ? current.projectNodeId ?? null : clean(input.projectNodeId);
    const type = input.type ?? current.type;
    const coverage = input.coverageMode ?? current.coverageMode;
    const priority = input.priority ?? current.priority;
    const subject = clean(input.subject ?? current.subject);
    if (!subject) throw new Error('Sujet de l’intervention requis.');
    this.assertClientProject(clientId, projectId);
    this.assertNode(projectId, nodeId);
    this.assertInterventionType(type);
    this.assertCoverageMode(coverage);
    this.assertPriority(priority);
    const merged: InterventionInput = { ...current, ...input, clientAccountId: clientId, projectId, projectNodeId: nodeId, subject, type, coverageMode: coverage, priority };
    this.validateIncident(type, merged);
    const theoretical = input.theoreticalValueCents ?? current.theoreticalValueCents ?? 0;
    const billableAmount = input.billableAmountCents ?? current.billableAmountCents ?? 0;
    this.assertMoney(theoretical, 'Valeur théorique invalide.');
    this.assertMoney(billableAmount, 'Montant facturable invalide.');
    const incident = type === 'incident';
    this.database.run(
      `UPDATE interventions SET client_account_id=?,project_id=?,project_node_id=?,intervention_type=?,coverage_mode=?,subject=?,description=?,priority=?,scheduled_at=?,
       theoretical_value_cents=?,billable_amount_cents=?,notes=?,incident_criticality=?,incident_started_at=?,incident_resolved_at=?,downtime_minutes=?,incident_cause=?,incident_diagnosis=?,incident_solution=?,incident_follow_up=?,updated_at=? WHERE id=?`,
      [clientId, projectId, nodeId, type, coverage, subject,
        input.description === undefined ? current.description ?? null : clean(input.description), priority,
        input.scheduledAt === undefined ? current.scheduledAt ?? null : this.optionalDate(input.scheduledAt), theoretical, billableAmount,
        input.notes === undefined ? current.notes ?? null : clean(input.notes),
        incident ? input.incidentCriticality ?? current.incidentCriticality ?? 'normal' : null,
        incident ? (input.incidentStartedAt === undefined ? current.incidentStartedAt ?? null : this.optionalDate(input.incidentStartedAt)) : null,
        incident ? (input.incidentResolvedAt === undefined ? current.incidentResolvedAt ?? null : this.optionalDate(input.incidentResolvedAt)) : null,
        incident ? input.downtimeMinutes ?? current.downtimeMinutes ?? null : null,
        incident ? (input.incidentCause === undefined ? current.incidentCause ?? null : clean(input.incidentCause)) : null,
        incident ? (input.incidentDiagnosis === undefined ? current.incidentDiagnosis ?? null : clean(input.incidentDiagnosis)) : null,
        incident ? (input.incidentSolution === undefined ? current.incidentSolution ?? null : clean(input.incidentSolution)) : null,
        incident ? (input.incidentFollowUp === undefined ? current.incidentFollowUp ?? null : clean(input.incidentFollowUp)) : null,
        nowIso(), id],
    );
    return this.getIntervention(id);
  }

  changeInterventionStatus(id: string, status: InterventionStatus): Intervention {
    this.assertInterventionStatus(status);
    const current = this.getIntervention(id);
    const now = nowIso();
    const startedAt = status === 'in_progress' && !current.startedAt ? now : current.startedAt ?? null;
    const completedAt = status === 'completed' ? current.completedAt ?? now : null;
    this.database.run(
      'UPDATE interventions SET status=?, started_at=?, completed_at=?, archived_at=?, updated_at=? WHERE id=?',
      [status, startedAt, completedAt, status === 'archived' ? now : null, now, id],
    );
    this.writeActivity('intervention', id, 'intervention_status_changed', `Statut intervention ${current.number} : ${status}`);
    return this.getIntervention(id);
  }

  private requestSelect(): string {
    return `SELECT sr.*,
      COALESCE(o.name, trim(c.first_name || ' ' || c.last_name), 'Client') AS client_label,
      p.name AS project_label,
      i.id AS intervention_id
    FROM service_requests sr
    JOIN client_accounts ca ON ca.id=sr.client_account_id
    LEFT JOIN organizations o ON o.id=ca.organization_id
    LEFT JOIN contacts c ON c.id=ca.primary_contact_id
    LEFT JOIN projects p ON p.id=sr.project_id
    LEFT JOIN interventions i ON i.source_request_id=sr.id`;
  }

  private interventionSelect(): string {
    return `SELECT i.*,
      COALESCE(o.name, trim(c.first_name || ' ' || c.last_name), 'Client') AS client_label,
      p.name AS project_label,
      pn.name AS project_node_label,
      COALESCE((
        SELECT SUM(MAX(0, CAST((julianday(COALESCE(ts.ended_at, CURRENT_TIMESTAMP)) - julianday(ts.started_at)) * 86400 AS INTEGER)) - COALESCE((
          SELECT SUM(MAX(0, CAST((julianday(COALESCE(tsp.ended_at, COALESCE(ts.ended_at, CURRENT_TIMESTAMP))) - julianday(tsp.started_at)) * 86400 AS INTEGER)))
          FROM time_session_pauses tsp WHERE tsp.time_session_id=ts.id
        ),0))
        FROM time_sessions ts WHERE ts.intervention_id=i.id
      ),0) AS total_time_seconds
    FROM interventions i
    JOIN client_accounts ca ON ca.id=i.client_account_id
    LEFT JOIN organizations o ON o.id=ca.organization_id
    LEFT JOIN contacts c ON c.id=ca.primary_contact_id
    LEFT JOIN projects p ON p.id=i.project_id
    LEFT JOIN project_nodes pn ON pn.id=i.project_node_id`;
  }

  private mapRequest(row: RequestRow): ServiceRequest {
    return {
      id: row.id, clientAccountId: row.client_account_id, projectId: row.project_id, source: row.source, subject: row.subject,
      description: row.description, priority: row.priority, receivedAt: row.received_at, nextActionAt: row.next_action_at,
      nextActionText: row.next_action_text, notes: row.notes, status: row.status, clientLabel: row.client_label,
      projectLabel: row.project_label, interventionId: row.intervention_id, closeReason: row.close_reason,
      createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at,
    };
  }

  private mapIntervention(row: InterventionRow): Intervention {
    return {
      id: row.id, number: row.intervention_number, clientAccountId: row.client_account_id, projectId: row.project_id,
      projectNodeId: row.project_node_id, sourceRequestId: row.source_request_id, type: row.intervention_type, status: row.status,
      coverageMode: row.coverage_mode, subject: row.subject, description: row.description, priority: row.priority,
      scheduledAt: row.scheduled_at, startedAt: row.started_at, completedAt: row.completed_at,
      theoreticalValueCents: Number(row.theoretical_value_cents), billableAmountCents: Number(row.billable_amount_cents), notes: row.notes,
      incidentCriticality: row.incident_criticality, incidentStartedAt: row.incident_started_at, incidentResolvedAt: row.incident_resolved_at,
      downtimeMinutes: row.downtime_minutes, incidentCause: row.incident_cause, incidentDiagnosis: row.incident_diagnosis,
      incidentSolution: row.incident_solution, incidentFollowUp: row.incident_follow_up,
      clientLabel: row.client_label, projectLabel: row.project_label, projectNodeLabel: row.project_node_label,
      totalTimeSeconds: Math.max(0, Number(row.total_time_seconds ?? 0)), createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at,
    };
  }

  private assertClientProject(clientId: string, projectId?: string | null): void {
    const client = this.database.get<{ id: string }>('SELECT id FROM client_accounts WHERE id=?', [clientId]);
    if (!client) throw new Error('Client introuvable.');
    if (!projectId) return;
    const project = this.database.get<{ client_account_id: string | null }>('SELECT client_account_id FROM projects WHERE id=?', [projectId]);
    if (!project) throw new Error('Projet introuvable.');
    if (project.client_account_id !== clientId) throw new Error('Le projet appartient à un autre client.');
  }

  private assertNode(projectId?: string | null, nodeId?: string | null): void {
    if (!nodeId) return;
    if (!projectId) throw new Error('Choisis un projet avant une tâche/module.');
    const node = this.database.get<{ project_id: string }>('SELECT project_id FROM project_nodes WHERE id=?', [nodeId]);
    if (!node || node.project_id !== projectId) throw new Error('La tâche/module n’appartient pas au projet sélectionné.');
  }

  private validateIncident(type: Intervention['type'], input: Partial<InterventionInput>): void {
    if (type !== 'incident') return;
    if (input.incidentCriticality && !INCIDENT_CRITICALITIES.includes(input.incidentCriticality)) throw new Error('Criticité incident invalide.');
    if (input.downtimeMinutes != null && (!Number.isInteger(input.downtimeMinutes) || input.downtimeMinutes < 0)) throw new Error('Durée d’indisponibilité invalide.');
  }

  private assertRequestStatus(value: ServiceRequestStatus): void {
    if (!SERVICE_REQUEST_STATUSES.includes(value)) throw new Error('Statut de demande invalide.');
  }
  private assertInterventionStatus(value: InterventionStatus): void {
    if (!INTERVENTION_STATUSES.includes(value)) throw new Error('Statut d’intervention invalide.');
  }
  private assertInterventionType(value: Intervention['type']): void {
    if (!INTERVENTION_TYPES.includes(value)) throw new Error('Type d’intervention invalide.');
  }
  private assertCoverageMode(value: Intervention['coverageMode']): void {
    if (!INTERVENTION_COVERAGE_MODES.includes(value)) throw new Error('Mode de prise en charge invalide.');
  }
  private assertPriority(value: ServiceRequest['priority']): void {
    if (!SERVICE_REQUEST_PRIORITIES.includes(value)) throw new Error('Priorité invalide.');
  }
  private assertMoney(value: number, message: string): void {
    if (!Number.isInteger(value) || value < 0) throw new Error(message);
  }

  private optionalDate(value?: string | null): string | null {
    return value ? this.dateIso(value, 'Date invalide.') : null;
  }
  private dateIso(value: string, message: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date.toISOString();
  }

  private nextInterventionNumber(year: number, now: string): string {
    const row = this.database.get<{ current_value: number }>('SELECT current_value FROM number_sequences WHERE sequence_key=? AND sequence_year=?', ['intervention', year]);
    const next = Number(row?.current_value ?? 0) + 1;
    this.database.run(
      `INSERT INTO number_sequences (sequence_key,sequence_year,current_value,updated_at) VALUES ('intervention',?,?,?)
       ON CONFLICT(sequence_key,sequence_year) DO UPDATE SET current_value=excluded.current_value, updated_at=excluded.updated_at`,
      [year, next, now],
    );
    return `INT-${year}-${String(next).padStart(3, '0')}`;
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}

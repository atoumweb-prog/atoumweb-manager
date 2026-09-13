import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  TIME_CATEGORIES,
  TIME_RECOVERY_STALE_AFTER_SECONDS,
  type ManualTimeSessionInput,
  type StartTimeSessionInput,
  type TimeCategory,
  type TimeSession,
  type TimeSessionFilters,
  type TimeSessionPause,
  type TimeSummary,
} from '../../shared/time';

interface TimeRow extends Record<string, unknown> {
  id: string;
  client_account_id: string | null;
  project_id: string | null;
  project_node_id: string | null;
  category: TimeCategory;
  activity_label: string | null;
  started_at: string;
  ended_at: string | null;
  billable: number;
  source: TimeSession['source'];
  note: string | null;
  created_at: string;
  updated_at: string;
  client_label: string | null;
  project_label: string | null;
  project_number: string | null;
  project_node_label: string | null;
}

interface PauseRow extends Record<string, unknown> {
  id: string;
  time_session_id: string;
  started_at: string;
  ended_at: string | null;
}

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export class TimeService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  active(): TimeSession | null {
    const row = this.database.get<TimeRow>(this.baseSelect('WHERE ts.ended_at IS NULL'));
    return row ? this.map(row) : null;
  }

  start(input: StartTimeSessionInput): TimeSession {
    this.validateInput(input);
    if (this.active()) throw new Error('Une session de temps est déjà active. Arrête-la avant d’en démarrer une autre.');

    const context = this.resolveContext(input.projectId ?? null, input.projectNodeId ?? null);
    const now = this.nowIso();
    const id = randomUUID();
    this.database.run(
      `INSERT INTO time_sessions
       (id,client_account_id,project_id,project_node_id,category,activity_label,started_at,ended_at,billable,source,note,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,NULL,?,'timer',?,?,?)`,
      [
        id,
        context.clientAccountId,
        context.projectId,
        context.projectNodeId,
        input.category,
        clean(input.activityLabel),
        now,
        input.billable === false ? 0 : 1,
        clean(input.note),
        now,
        now,
      ],
    );
    return this.get(id);
  }

  heartbeat(id: string): TimeSession {
    const session = this.get(id);
    if (session.endedAt) return session;
    const now = this.nowIso();
    this.database.run('UPDATE time_sessions SET updated_at=? WHERE id=? AND ended_at IS NULL', [now, id]);
    return this.get(id);
  }

  pause(id: string): TimeSession {
    const session = this.get(id);
    if (session.endedAt) throw new Error('Cette session est déjà terminée.');
    if (session.paused) return session;
    const now = this.nowIso();
    this.database.run(
      'INSERT INTO time_session_pauses (id,time_session_id,started_at,ended_at,created_at) VALUES (?,?,?,NULL,?)',
      [randomUUID(), id, now, now],
    );
    this.database.run('UPDATE time_sessions SET updated_at=? WHERE id=?', [now, id]);
    return this.get(id);
  }

  resume(id: string): TimeSession {
    const session = this.get(id);
    if (session.endedAt) throw new Error('Cette session est déjà terminée.');
    const openPause = this.database.get<{ id: string }>(
      'SELECT id FROM time_session_pauses WHERE time_session_id=? AND ended_at IS NULL',
      [id],
    );
    if (!openPause) return session;
    const now = this.nowIso();
    this.database.run('UPDATE time_session_pauses SET ended_at=? WHERE id=?', [now, openPause.id]);
    this.database.run('UPDATE time_sessions SET updated_at=? WHERE id=?', [now, id]);
    return this.get(id);
  }

  recoverResume(id: string): TimeSession {
    const row = this.database.get<{ started_at: string; ended_at: string | null; updated_at: string }>(
      'SELECT started_at,ended_at,updated_at FROM time_sessions WHERE id=?',
      [id],
    );
    if (!row) throw new Error('Session de temps introuvable.');
    if (row.ended_at) return this.get(id);

    const now = this.clock();
    const startedMs = Date.parse(row.started_at);
    const lastKnownMs = Math.max(startedMs, Date.parse(row.updated_at));
    const nowMs = now.getTime();
    const openPause = this.database.get<{ id: string; started_at: string }>(
      'SELECT id,started_at FROM time_session_pauses WHERE time_session_id=? AND ended_at IS NULL',
      [id],
    );

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      if (openPause) {
        this.database.run('UPDATE time_session_pauses SET ended_at=? WHERE id=?', [now.toISOString(), openPause.id]);
      } else if (nowMs > lastKnownMs) {
        this.database.run(
          'INSERT INTO time_session_pauses (id,time_session_id,started_at,ended_at,created_at) VALUES (?,?,?,?,?)',
          [randomUUID(), id, new Date(lastKnownMs).toISOString(), now.toISOString(), now.toISOString()],
        );
      }
      this.database.run('UPDATE time_sessions SET updated_at=? WHERE id=?', [now.toISOString(), id]);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(id);
  }

  stop(id: string): TimeSession {
    const session = this.get(id);
    if (session.endedAt) return session;
    const now = this.nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        'UPDATE time_session_pauses SET ended_at=? WHERE time_session_id=? AND ended_at IS NULL',
        [now, id],
      );
      this.database.run('UPDATE time_sessions SET ended_at=?, updated_at=? WHERE id=?', [now, now, id]);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(id);
  }

  stopAtLastKnown(id: string): TimeSession {
    const row = this.database.get<{ started_at: string; ended_at: string | null; updated_at: string }>(
      'SELECT started_at,ended_at,updated_at FROM time_sessions WHERE id=?',
      [id],
    );
    if (!row) throw new Error('Session de temps introuvable.');
    if (row.ended_at) return this.get(id);

    const startedMs = Date.parse(row.started_at);
    const lastKnownMs = Math.max(startedMs, Date.parse(row.updated_at));
    const endedAt = new Date(lastKnownMs).toISOString();
    const now = this.nowIso();

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        'UPDATE time_session_pauses SET ended_at=? WHERE time_session_id=? AND ended_at IS NULL',
        [endedAt, id],
      );
      this.database.run('UPDATE time_sessions SET ended_at=?, updated_at=? WHERE id=?', [endedAt, now, id]);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(id);
  }

  addManual(input: ManualTimeSessionInput): TimeSession {
    this.validateInput(input);
    const started = this.parseDate(input.startedAt, 'Date de début invalide.');
    const ended = this.parseDate(input.endedAt, 'Date de fin invalide.');
    if (ended.getTime() <= started.getTime()) throw new Error('La fin doit être postérieure au début.');

    const context = this.resolveContext(input.projectId ?? null, input.projectNodeId ?? null);
    const id = randomUUID();
    const now = this.nowIso();
    this.database.run(
      `INSERT INTO time_sessions
       (id,client_account_id,project_id,project_node_id,category,activity_label,started_at,ended_at,billable,source,note,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'manual',?,?,?)`,
      [
        id,
        context.clientAccountId,
        context.projectId,
        context.projectNodeId,
        input.category,
        clean(input.activityLabel),
        started.toISOString(),
        ended.toISOString(),
        input.billable === false ? 0 : 1,
        clean(input.note),
        now,
        now,
      ],
    );
    return this.get(id);
  }

  list(filters: TimeSessionFilters = {}): TimeSession[] {
    const where: string[] = [];
    const parameters: SqlValue[] = [];

    if (filters.from) {
      const from = this.parseDate(filters.from, 'Date de début de filtre invalide.').toISOString();
      where.push('ts.started_at >= ?');
      parameters.push(from);
    }
    if (filters.to) {
      const to = this.parseDate(filters.to, 'Date de fin de filtre invalide.').toISOString();
      where.push('ts.started_at <= ?');
      parameters.push(to);
    }
    if (clean(filters.clientAccountId)) {
      where.push('ts.client_account_id = ?');
      parameters.push(clean(filters.clientAccountId) as string);
    }
    if (clean(filters.projectId)) {
      where.push('ts.project_id = ?');
      parameters.push(clean(filters.projectId) as string);
    }
    if (filters.category) {
      if (!TIME_CATEGORIES.includes(filters.category)) throw new Error('Catégorie de temps invalide.');
      where.push('ts.category = ?');
      parameters.push(filters.category);
    }
    if (typeof filters.billable === 'boolean') {
      where.push('ts.billable = ?');
      parameters.push(filters.billable ? 1 : 0);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return this.database.all<TimeRow>(`${this.baseSelect(clause)} ORDER BY ts.started_at DESC`, parameters).map((row) => this.map(row));
  }

  summary(filters: TimeSessionFilters = {}): TimeSummary {
    const sessions = this.list(filters);
    return sessions.reduce<TimeSummary>((total, session) => {
      total.sessionCount += 1;
      total.totalSeconds += session.durationSeconds;
      if (session.billable) total.billableSeconds += session.durationSeconds;
      else total.nonBillableSeconds += session.durationSeconds;
      return total;
    }, { totalSeconds: 0, billableSeconds: 0, nonBillableSeconds: 0, sessionCount: 0 });
  }

  get(id: string): TimeSession {
    const row = this.database.get<TimeRow>(this.baseSelect('WHERE ts.id=?'), [id]);
    if (!row) throw new Error('Session de temps introuvable.');
    return this.map(row);
  }

  private baseSelect(clause: string): string {
    return `SELECT
      ts.*,
      COALESCE(o.name, trim(c.first_name || ' ' || c.last_name)) AS client_label,
      p.name AS project_label,
      p.project_number,
      pn.name AS project_node_label
    FROM time_sessions ts
    LEFT JOIN client_accounts ca ON ca.id=ts.client_account_id
    LEFT JOIN organizations o ON o.id=ca.organization_id
    LEFT JOIN contacts c ON c.id=ca.primary_contact_id
    LEFT JOIN projects p ON p.id=ts.project_id
    LEFT JOIN project_nodes pn ON pn.id=ts.project_node_id
    ${clause}`;
  }

  private map(row: TimeRow): TimeSession {
    const pauses = this.database.all<PauseRow>(
      'SELECT * FROM time_session_pauses WHERE time_session_id=? ORDER BY started_at',
      [row.id],
    ).map<TimeSessionPause>((pause) => ({
      id: pause.id,
      sessionId: pause.time_session_id,
      startedAt: pause.started_at,
      endedAt: pause.ended_at,
    }));

    const nowMs = this.clock().getTime();
    const startedMs = Date.parse(row.started_at);
    const lastKnownMs = Math.max(startedMs, Date.parse(row.updated_at));
    const staleActive = !row.ended_at && nowMs - lastKnownMs > TIME_RECOVERY_STALE_AFTER_SECONDS * 1000;
    const endMs = row.ended_at ? Date.parse(row.ended_at) : staleActive ? lastKnownMs : nowMs;
    const pausedMs = pauses.reduce((total, pause) => {
      const pauseStart = Date.parse(pause.startedAt);
      const pauseEnd = pause.endedAt ? Date.parse(pause.endedAt) : endMs;
      return total + Math.max(0, pauseEnd - pauseStart);
    }, 0);

    return {
      id: row.id,
      clientAccountId: row.client_account_id,
      clientLabel: row.client_label,
      projectId: row.project_id,
      projectLabel: row.project_label,
      projectNumber: row.project_number,
      projectNodeId: row.project_node_id,
      projectNodeLabel: row.project_node_label,
      category: row.category,
      activityLabel: row.activity_label,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      billable: Boolean(row.billable),
      source: row.source,
      note: row.note,
      pauses,
      paused: pauses.some((pause) => !pause.endedAt),
      durationSeconds: Math.max(0, Math.floor((endMs - startedMs - pausedMs) / 1000)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private resolveContext(projectId?: string | null, nodeId?: string | null): {
    clientAccountId: string | null;
    projectId: string | null;
    projectNodeId: string | null;
  } {
    let resolvedProjectId = clean(projectId);
    const resolvedNodeId = clean(nodeId);

    if (resolvedNodeId) {
      const node = this.database.get<{ project_id: string }>('SELECT project_id FROM project_nodes WHERE id=?', [resolvedNodeId]);
      if (!node) throw new Error('Tâche de projet introuvable.');
      if (resolvedProjectId && node.project_id !== resolvedProjectId) throw new Error('La tâche n’appartient pas au projet sélectionné.');
      resolvedProjectId = node.project_id;
    }

    if (!resolvedProjectId) return { clientAccountId: null, projectId: null, projectNodeId: null };

    const project = this.database.get<{ client_account_id: string | null }>(
      'SELECT client_account_id FROM projects WHERE id=?',
      [resolvedProjectId],
    );
    if (!project) throw new Error('Projet introuvable.');
    return {
      clientAccountId: project.client_account_id,
      projectId: resolvedProjectId,
      projectNodeId: resolvedNodeId,
    };
  }

  private validateInput(input: StartTimeSessionInput): void {
    if (!TIME_CATEGORIES.includes(input.category)) throw new Error('Catégorie de temps invalide.');
  }

  private parseDate(value: string, message: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date;
  }

  private nowIso(): string {
    return this.clock().toISOString();
  }
}

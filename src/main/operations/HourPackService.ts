import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  HOUR_PACK_STATUSES,
  type HourPack,
  type HourPackFilters,
  type HourPackInput,
  type HourPackMovement,
  type HourPackMovementInput,
  type HourPackMovementType,
  type HourPackStatus,
} from '../../shared/operations';

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};
const nowIso = (): string => new Date().toISOString();

interface PackRow extends Record<string, unknown> {
  id: string;
  client_account_id: string;
  project_id: string | null;
  name: string;
  purchased_seconds: number;
  contract_price_cents: number;
  purchased_at: string;
  expires_at: string | null;
  status: HourPackStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  client_label: string;
  project_label: string | null;
}

interface MovementRow extends Record<string, unknown> {
  id: string;
  pack_id: string;
  intervention_id: string | null;
  time_session_id: string | null;
  reversal_of_movement_id: string | null;
  movement_type: HourPackMovementType;
  seconds_delta: number;
  reason: string;
  source_key: string | null;
  created_at: string;
}

export class HourPackService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(filters: HourPackFilters = {}): HourPack[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filters.includeArchived) where.push("hp.status <> 'archived'");
    if (filters.status) {
      if (!HOUR_PACK_STATUSES.includes(filters.status)) throw new Error('Statut de pack invalide.');
      where.push('hp.status=?'); params.push(filters.status);
    }
    if (clean(filters.clientAccountId)) { where.push('hp.client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectId)) { where.push('hp.project_id=?'); params.push(clean(filters.projectId) as string); }
    return this.database.all<PackRow>(`${this.packSelect()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY hp.purchased_at DESC,hp.created_at DESC`, params)
      .map((row) => this.mapPack(row));
  }

  get(id: string): HourPack {
    const row = this.database.get<PackRow>(`${this.packSelect()} WHERE hp.id=?`, [id]);
    if (!row) throw new Error('Pack d’heures introuvable.');
    return this.mapPack(row);
  }

  create(input: HourPackInput): HourPack {
    const clientId = clean(input.clientAccountId);
    const projectId = clean(input.projectId);
    const name = clean(input.name);
    if (!clientId) throw new Error('Client requis.');
    if (!name) throw new Error('Nom du pack requis.');
    this.assertClientProject(clientId, projectId);
    if (!Number.isInteger(input.purchasedSeconds) || input.purchasedSeconds <= 0) throw new Error('Durée achetée invalide.');
    if (!Number.isInteger(input.contractPriceCents) || input.contractPriceCents < 0) throw new Error('Prix du pack invalide.');
    const purchasedAt = input.purchasedAt ? this.dateIso(input.purchasedAt, 'Date d’achat invalide.') : nowIso();
    const expiresAt = input.expiresAt ? this.dateIso(input.expiresAt, 'Date d’expiration invalide.') : null;
    if (expiresAt && expiresAt < purchasedAt) throw new Error('L’expiration doit être postérieure à l’achat.');
    const id = randomUUID();
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO hour_packs
         (id,client_account_id,project_id,name,purchased_seconds,contract_price_cents,purchased_at,expires_at,status,notes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,'active',?,?,?)`,
        [id, clientId, projectId, name, input.purchasedSeconds, input.contractPriceCents, purchasedAt, expiresAt, clean(input.notes), now, now],
      );
      this.database.run(
        `INSERT INTO hour_pack_movements
         (id,pack_id,movement_type,seconds_delta,reason,source_key,created_at)
         VALUES (?,?, 'initial_credit',?,?,?,?)`,
        [randomUUID(), id, input.purchasedSeconds, `Crédit initial · ${name}`, `initial:${id}`, now],
      );
      this.writeActivity('hour_pack', id, 'hour_pack_created', `Pack créé : ${name}`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(id);
  }

  changeStatus(id: string, status: HourPackStatus): HourPack {
    if (!HOUR_PACK_STATUSES.includes(status)) throw new Error('Statut de pack invalide.');
    const current = this.get(id);
    const now = nowIso();
    this.database.run(
      'UPDATE hour_packs SET status=?,archived_at=?,updated_at=? WHERE id=?',
      [status, status === 'archived' ? now : null, now, id],
    );
    this.writeActivity('hour_pack', id, 'hour_pack_status_changed', `Pack ${current.name} : ${status}`);
    return this.get(id);
  }

  addMovement(packId: string, input: HourPackMovementInput): HourPack {
    const pack = this.get(packId);
    if (pack.status === 'archived') throw new Error('Réactive le pack avant d’ajouter un mouvement.');
    if (!Number.isInteger(input.secondsDelta) || input.secondsDelta === 0) throw new Error('Correction de temps invalide.');
    const reason = clean(input.reason);
    if (!reason) throw new Error('Motif du mouvement requis.');
    const type = input.type ?? 'manual_correction';
    if (!['manual_correction', 'commercial_credit'].includes(type)) throw new Error('Type de mouvement manuel invalide.');
    if (type === 'commercial_credit' && input.secondsDelta < 0) throw new Error('Un geste commercial doit créditer du temps.');
    this.assertRelatedContext(pack, clean(input.interventionId), clean(input.timeSessionId));
    this.database.run(
      `INSERT INTO hour_pack_movements
       (id,pack_id,intervention_id,time_session_id,movement_type,seconds_delta,reason,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [randomUUID(), packId, clean(input.interventionId), clean(input.timeSessionId), type, input.secondsDelta, reason, nowIso()],
    );
    this.refreshDerivedStatus(packId);
    this.writeActivity('hour_pack', packId, 'hour_pack_movement_added', `${reason} · ${input.secondsDelta > 0 ? '+' : ''}${input.secondsDelta}s`);
    return this.get(packId);
  }

  debitIntervention(packId: string, interventionId: string): HourPack {
    const pack = this.get(packId);
    if (['archived', 'suspended', 'expired'].includes(pack.status)) throw new Error('Ce pack ne peut pas être débité dans son état actuel.');
    const intervention = this.database.get<{ client_account_id: string; project_id: string | null; coverage_mode: string; hour_pack_id: string | null; status: string; intervention_number: string }>(
      'SELECT client_account_id,project_id,coverage_mode,hour_pack_id,status,intervention_number FROM interventions WHERE id=?',
      [interventionId],
    );
    if (!intervention) throw new Error('Intervention introuvable.');
    if (intervention.client_account_id !== pack.clientAccountId) throw new Error('L’intervention appartient à un autre client.');
    if (pack.projectId && intervention.project_id !== pack.projectId) throw new Error('L’intervention n’appartient pas au projet de ce pack.');
    if (!['to_validate', 'completed'].includes(intervention.status)) throw new Error('Valide ou termine l’intervention avant de débiter le pack.');
    if (intervention.hour_pack_id && intervention.hour_pack_id !== packId) throw new Error('Cette intervention est déjà rattachée à un autre pack.');

    const sourceKey = `intervention:${packId}:${interventionId}`;
    const existing = this.database.get<{ id: string }>('SELECT id FROM hour_pack_movements WHERE source_key=?', [sourceKey]);
    if (existing) return this.get(packId);

    const totalSeconds = this.interventionSeconds(interventionId);
    if (totalSeconds <= 0) throw new Error('Aucun temps terminé à débiter pour cette intervention.');
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('UPDATE interventions SET hour_pack_id=?,coverage_mode=\'hour_pack\',updated_at=? WHERE id=?', [packId, now, interventionId]);
      this.database.run(
        `INSERT INTO hour_pack_movements
         (id,pack_id,intervention_id,movement_type,seconds_delta,reason,source_key,created_at)
         VALUES (?,?,?,'intervention_debit',?,?,?,?)`,
        [randomUUID(), packId, interventionId, -totalSeconds, `Débit ${intervention.intervention_number}`, sourceKey, now],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    this.refreshDerivedStatus(packId);
    this.writeActivity('hour_pack', packId, 'hour_pack_intervention_debited', `${intervention.intervention_number} · ${totalSeconds}s débités`);
    return this.get(packId);
  }

  reverseMovement(movementId: string, reason: string): HourPack {
    const movement = this.database.get<MovementRow>('SELECT * FROM hour_pack_movements WHERE id=?', [movementId]);
    if (!movement) throw new Error('Mouvement de pack introuvable.');
    const existing = this.database.get<{ id: string }>('SELECT id FROM hour_pack_movements WHERE reversal_of_movement_id=?', [movementId]);
    if (existing) return this.get(movement.pack_id);
    const cleanReason = clean(reason);
    if (!cleanReason) throw new Error('Motif d’annulation requis.');
    const now = nowIso();
    this.database.run(
      `INSERT INTO hour_pack_movements
       (id,pack_id,intervention_id,time_session_id,reversal_of_movement_id,movement_type,seconds_delta,reason,source_key,created_at)
       VALUES (?,?,?,?,?,'reversal',?,?,?,?)`,
      [randomUUID(), movement.pack_id, movement.intervention_id, movement.time_session_id, movement.id, -Number(movement.seconds_delta), cleanReason, `reversal:${movement.id}`, now],
    );
    this.refreshDerivedStatus(movement.pack_id);
    this.writeActivity('hour_pack', movement.pack_id, 'hour_pack_movement_reversed', `Mouvement annulé : ${cleanReason}`);
    return this.get(movement.pack_id);
  }

  private mapPack(row: PackRow): HourPack {
    const movements = this.database.all<MovementRow>('SELECT * FROM hour_pack_movements WHERE pack_id=? ORDER BY created_at DESC,id DESC', [row.id]).map<HourPackMovement>((movement) => ({
      id: movement.id,
      packId: movement.pack_id,
      interventionId: movement.intervention_id,
      timeSessionId: movement.time_session_id,
      reversalOfMovementId: movement.reversal_of_movement_id,
      type: movement.movement_type,
      secondsDelta: Number(movement.seconds_delta),
      reason: movement.reason,
      sourceKey: movement.source_key,
      createdAt: movement.created_at,
    }));
    const balanceSeconds = movements.reduce((sum, movement) => sum + movement.secondsDelta, 0);
    const consumedSeconds = Math.max(0, Number(row.purchased_seconds) - balanceSeconds);
    return {
      id: row.id,
      clientAccountId: row.client_account_id,
      projectId: row.project_id,
      name: row.name,
      purchasedSeconds: Number(row.purchased_seconds),
      contractPriceCents: Number(row.contract_price_cents),
      purchasedAt: row.purchased_at,
      expiresAt: row.expires_at,
      notes: row.notes,
      clientLabel: row.client_label,
      projectLabel: row.project_label,
      status: row.status,
      balanceSeconds,
      consumedSeconds,
      movements,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  private refreshDerivedStatus(packId: string): void {
    const row = this.database.get<{ status: HourPackStatus; expires_at: string | null }>('SELECT status,expires_at FROM hour_packs WHERE id=?', [packId]);
    if (!row || ['archived', 'suspended'].includes(row.status)) return;
    const balance = Number(this.database.get<{ balance: number | null }>('SELECT SUM(seconds_delta) AS balance FROM hour_pack_movements WHERE pack_id=?', [packId])?.balance ?? 0);
    const now = nowIso();
    const status: HourPackStatus = row.expires_at && row.expires_at < now ? 'expired' : balance <= 0 ? 'exhausted' : 'active';
    this.database.run('UPDATE hour_packs SET status=?,updated_at=? WHERE id=?', [status, now, packId]);
  }

  private interventionSeconds(interventionId: string): number {
    const sessions = this.database.all<{ started_at: string; ended_at: string | null; id: string }>(
      'SELECT id,started_at,ended_at FROM time_sessions WHERE intervention_id=? AND ended_at IS NOT NULL',
      [interventionId],
    );
    return sessions.reduce((total, session) => {
      const started = Date.parse(session.started_at);
      const ended = Date.parse(session.ended_at as string);
      const paused = Number(this.database.get<{ seconds: number | null }>(
        `SELECT SUM(MAX(0,CAST((julianday(ended_at)-julianday(started_at))*86400 AS INTEGER))) AS seconds
         FROM time_session_pauses WHERE time_session_id=? AND ended_at IS NOT NULL`,
        [session.id],
      )?.seconds ?? 0);
      return total + Math.max(0, Math.floor((ended - started) / 1000) - paused);
    }, 0);
  }

  private assertRelatedContext(pack: HourPack, interventionId?: string | null, timeSessionId?: string | null): void {
    if (interventionId) {
      const intervention = this.database.get<{ client_account_id: string; project_id: string | null }>('SELECT client_account_id,project_id FROM interventions WHERE id=?', [interventionId]);
      if (!intervention) throw new Error('Intervention introuvable.');
      if (intervention.client_account_id !== pack.clientAccountId) throw new Error('Intervention d’un autre client.');
      if (pack.projectId && intervention.project_id !== pack.projectId) throw new Error('Intervention d’un autre projet.');
    }
    if (timeSessionId) {
      const session = this.database.get<{ client_account_id: string | null; project_id: string | null }>('SELECT client_account_id,project_id FROM time_sessions WHERE id=?', [timeSessionId]);
      if (!session) throw new Error('Session de temps introuvable.');
      if (session.client_account_id !== pack.clientAccountId) throw new Error('Session de temps d’un autre client.');
      if (pack.projectId && session.project_id !== pack.projectId) throw new Error('Session de temps d’un autre projet.');
    }
  }

  private assertClientProject(clientId: string, projectId?: string | null): void {
    const client = this.database.get<{ id: string }>('SELECT id FROM client_accounts WHERE id=?', [clientId]);
    if (!client) throw new Error('Client introuvable.');
    if (!projectId) return;
    const project = this.database.get<{ client_account_id: string | null }>('SELECT client_account_id FROM projects WHERE id=?', [projectId]);
    if (!project) throw new Error('Projet introuvable.');
    if (project.client_account_id !== clientId) throw new Error('Le projet appartient à un autre client.');
  }

  private dateIso(value: string, message: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date.toISOString();
  }

  private packSelect(): string {
    return `SELECT hp.*,
      COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
      p.name AS project_label
      FROM hour_packs hp
      JOIN client_accounts ca ON ca.id=hp.client_account_id
      LEFT JOIN organizations o ON o.id=ca.organization_id
      LEFT JOIN contacts c ON c.id=ca.primary_contact_id
      LEFT JOIN projects p ON p.id=hp.project_id`;
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}

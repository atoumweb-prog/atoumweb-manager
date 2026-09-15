import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  CRM_ACTION_OWNER_TYPES,
  CRM_ACTION_STATUSES,
  CRM_ACTION_TYPES,
  type CrmAction,
  type CrmActionFilters,
  type CrmActionInput,
  type CrmActionOwnerType,
  type CompleteActionInput,
} from '../../shared/crm';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface ActionRow extends Record<string, unknown> {
  id: string;
  owner_type: CrmActionOwnerType;
  prospect_id: string | null;
  client_account_id: string | null;
  action_type: CrmAction['type'];
  title: string;
  due_at: string | null;
  notes: string | null;
  status: CrmAction['status'];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  completion_channel: string | null;
  completion_outcome: string | null;
  completion_notes: string | null;
  related_type: string | null;
  related_id: string | null;
  target_contact_id: string | null;
  reason_code: string | null;
  reason_text: string | null;
  recurrence: CrmAction['recurrence'];
}

export class ActionService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(filters: CrmActionFilters = {}): CrmAction[] {
    const where: string[] = [];
    const params: SqlValue[] = [];

    if (filters.ownerType) {
      where.push('owner_type=?');
      params.push(filters.ownerType);
    }
    if (clean(filters.ownerId)) {
      const ownerId = clean(filters.ownerId) as string;
      if (filters.ownerType === 'prospect') {
        where.push('prospect_id=?');
      } else if (filters.ownerType === 'client') {
        where.push('client_account_id=?');
      } else {
        where.push('(prospect_id=? OR client_account_id=?)');
        params.push(ownerId);
      }
      params.push(ownerId);
    }
    if (filters.type) {
      where.push('action_type=?');
      params.push(filters.type);
    }
    if (filters.status) {
      where.push('status=?');
      params.push(filters.status);
    }

    return this.database.all<ActionRow>(
      `SELECT * FROM crm_actions ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY CASE WHEN status='open' THEN 0 ELSE 1 END,
                CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,
                due_at ASC,
                created_at DESC`,
      params,
    ).map((row) => this.map(row));
  }

  create(input: CrmActionInput): CrmAction {
    if (!CRM_ACTION_OWNER_TYPES.includes(input.ownerType)) throw new Error('Type de propriétaire invalide.');
    if (!CRM_ACTION_TYPES.includes(input.type)) throw new Error('Type d’action invalide.');
    const ownerId = clean(input.ownerId);
    const title = clean(input.title);
    if (!ownerId) throw new Error('Le dossier lié à l’action est requis.');
    if (!title) throw new Error('Le libellé de l’action est requis.');
    if (input.type === 'follow_up' && !clean(input.dueAt)) throw new Error('Une date est requise pour une relance.');

    this.assertOwnerExists(input.ownerType, ownerId);
    const targetContactId = clean(input.targetContactId);
    if (targetContactId && !this.database.get('SELECT id FROM contacts WHERE id=? AND archived_at IS NULL', [targetContactId])) {
      throw new Error('Le contact ciblé par l’action est introuvable.');
    }

    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO crm_actions (
        id, owner_type, prospect_id, client_account_id, action_type, title,
        due_at, notes, related_type, related_id, target_contact_id, reason_code, reason_text,
        recurrence, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
      [
        id,
        input.ownerType,
        input.ownerType === 'prospect' ? ownerId : null,
        input.ownerType === 'client' ? ownerId : null,
        input.type,
        title,
        clean(input.dueAt),
        clean(input.notes),
        clean(input.relatedType),
        clean(input.relatedId),
        targetContactId,
        clean(input.reasonCode),
        clean(input.reasonText),
        input.recurrence ?? 'none',
        now,
        now,
      ],
    );

    if (input.ownerType === 'prospect' && input.type === 'follow_up') {
      this.database.run(
        `UPDATE prospects
         SET stage=CASE
           WHEN stage IN ('quote_sent','follow_up','negotiation','waiting') THEN 'follow_up'
           ELSE stage
         END, updated_at=?
         WHERE id=?`,
        [now, ownerId],
      );
    }

    this.writeActivity(input.ownerType, ownerId, 'action_created', `${input.type === 'follow_up' ? 'Relance' : 'Action'} ajoutée : ${title}`);
    this.syncLegacyNextAction(input.ownerType, ownerId);
    return this.get(id);
  }

  complete(id: string, input: CompleteActionInput = {}): CrmAction {
    const action = this.get(id);
    if (action.status === 'done') return action;
    const now = nowIso();
    this.database.run(
      `UPDATE crm_actions SET status='done', completed_at=?, completion_channel=?, completion_outcome=?, completion_notes=?, updated_at=? WHERE id=?`,
      [now, clean(input.channel), clean(input.outcome), clean(input.notes), now, id],
    );
    const nextInput = input.nextAction ?? this.recurringNext(action);
    if (nextInput) this.create(nextInput);
    this.writeActivity(action.ownerType, action.ownerId, 'action_completed', `Action terminée : ${action.title}`);
    this.syncLegacyNextAction(action.ownerType, action.ownerId);
    return this.get(id);
  }

  cancel(id: string): CrmAction {
    const action = this.get(id);
    const now = nowIso();
    this.database.run(
      `UPDATE crm_actions SET status='cancelled', completed_at=NULL, updated_at=? WHERE id=?`,
      [now, id],
    );
    this.writeActivity(action.ownerType, action.ownerId, 'action_cancelled', `Action annulée : ${action.title}`);
    this.syncLegacyNextAction(action.ownerType, action.ownerId);
    return this.get(id);
  }

  reopen(id: string): CrmAction {
    const action = this.get(id);
    const now = nowIso();
    this.database.run(
      `UPDATE crm_actions SET status='open', completed_at=NULL, updated_at=? WHERE id=?`,
      [now, id],
    );
    this.writeActivity(action.ownerType, action.ownerId, 'action_reopened', `Action rouverte : ${action.title}`);
    this.syncLegacyNextAction(action.ownerType, action.ownerId);
    return this.get(id);
  }

  private get(id: string): CrmAction {
    const row = this.database.get<ActionRow>('SELECT * FROM crm_actions WHERE id=?', [id]);
    if (!row) throw new Error('Action introuvable.');
    return this.map(row);
  }

  private map(row: ActionRow): CrmAction {
    return {
      id: row.id,
      ownerType: row.owner_type,
      ownerId: row.owner_type === 'prospect' ? String(row.prospect_id) : String(row.client_account_id),
      type: row.action_type,
      title: row.title,
      dueAt: row.due_at,
      notes: row.notes,
      status: row.status,
      completedAt: row.completed_at,
      completionChannel: row.completion_channel,
      completionOutcome: row.completion_outcome,
      completionNotes: row.completion_notes,
      relatedType: row.related_type,
      relatedId: row.related_id,
      targetContactId: row.target_contact_id,
      reasonCode: row.reason_code,
      reasonText: row.reason_text,
      recurrence: row.recurrence ?? 'none',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private assertOwnerExists(ownerType: CrmActionOwnerType, ownerId: string): void {
    const table = ownerType === 'prospect' ? 'prospects' : 'client_accounts';
    const row = this.database.get<{ id: string }>(`SELECT id FROM ${table} WHERE id=?`, [ownerId]);
    if (!row) throw new Error(ownerType === 'prospect' ? 'Prospect introuvable.' : 'Client introuvable.');
  }

  private recurringNext(action: CrmAction): CrmActionInput | null {
    if (!action.recurrence || action.recurrence === 'none' || !action.dueAt) return null;
    const date = new Date(action.dueAt);
    if (Number.isNaN(date.getTime())) return null;
    if (action.recurrence === 'weekly') date.setUTCDate(date.getUTCDate() + 7);
    else if (action.recurrence === 'monthly') date.setUTCMonth(date.getUTCMonth() + 1);
    else if (action.recurrence === 'quarterly') date.setUTCMonth(date.getUTCMonth() + 3);
    else date.setUTCFullYear(date.getUTCFullYear() + 1);
    return {
      ownerType: action.ownerType,
      ownerId: action.ownerId,
      type: action.type,
      title: action.title,
      dueAt: date.toISOString(),
      notes: action.notes,
      relatedType: action.relatedType,
      relatedId: action.relatedId,
      targetContactId: action.targetContactId,
      reasonCode: action.reasonCode,
      reasonText: action.reasonText,
      recurrence: action.recurrence,
    };
  }

  private writeActivity(ownerType: CrmActionOwnerType, ownerId: string, action: string, summary: string): void {
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO activity_events (
        id, entity_type, entity_id, action, summary, metadata_json,
        prospect_id, client_account_id, organization_id, contact_id, created_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL, ?)`,
      [
        id,
        ownerType,
        ownerId,
        action,
        summary,
        ownerType === 'prospect' ? ownerId : null,
        ownerType === 'client' ? ownerId : null,
        now,
      ],
    );
  }

  private syncLegacyNextAction(ownerType: CrmActionOwnerType, ownerId: string): void {
    const ownerColumn = ownerType === 'prospect' ? 'prospect_id' : 'client_account_id';
    const next = this.database.get<{ title: string; due_at: string | null }>(
      `SELECT title, due_at FROM crm_actions
       WHERE ${ownerColumn}=? AND status='open'
       ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END, due_at ASC, created_at ASC
       LIMIT 1`,
      [ownerId],
    );

    if (ownerType === 'prospect') {
      this.database.run(
        'UPDATE prospects SET next_action_at=?, next_action_text=?, updated_at=? WHERE id=?',
        [next?.due_at ?? null, next?.title ?? null, nowIso(), ownerId],
      );
    } else {
      this.database.run(
        'UPDATE client_accounts SET next_action_at=?, next_action_text=?, updated_at=? WHERE id=?',
        [next?.due_at ?? null, next?.title ?? null, nowIso(), ownerId],
      );
    }
  }
}

import { randomUUID } from 'node:crypto';
import type { BillingItem, BillingItemFilters, BillingItemSourceType, BillingItemStatus } from '../../shared/billing';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface BillingItemRow extends Record<string, unknown> {
  id: string;
  client_account_id: string;
  project_id: string | null;
  source_type: BillingItemSourceType;
  source_id: string;
  source_key: string;
  description: string;
  expected_amount_cents: number;
  theoretical_value_cents: number;
  due_at: string | null;
  status: BillingItemStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client_label: string;
  project_label: string | null;
}

export class BillingHandoffService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(filters: BillingItemFilters = {}): BillingItem[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (clean(filters.clientAccountId)) { where.push('bi.client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectId)) { where.push('bi.project_id=?'); params.push(clean(filters.projectId) as string); }
    if (filters.sourceType) { where.push('bi.source_type=?'); params.push(filters.sourceType); }
    if (filters.status) { where.push('bi.status=?'); params.push(filters.status); }
    return this.database.all<BillingItemRow>(`${this.select()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY bi.created_at DESC`, params)
      .map((row) => this.map(row));
  }

  ensureForIntervention(interventionId: string): BillingItem | null {
    const intervention = this.database.get<{
      id: string;
      intervention_number: string;
      client_account_id: string;
      project_id: string | null;
      subject: string;
      coverage_mode: string;
      status: string;
      billable_amount_cents: number;
      theoretical_value_cents: number;
    }>(
      `SELECT id,intervention_number,client_account_id,project_id,subject,coverage_mode,status,billable_amount_cents,theoretical_value_cents
       FROM interventions WHERE id=?`,
      [interventionId],
    );
    if (!intervention) throw new Error('Intervention introuvable.');
    if (intervention.status !== 'completed') throw new Error('L’intervention doit être terminée avant préparation de la facturation.');
    if (!['out_of_scope', 'commercial_gesture'].includes(intervention.coverage_mode)) return null;

    const sourceKey = `intervention:${intervention.id}`;
    const existing = this.database.get<{ id: string }>('SELECT id FROM billing_items WHERE source_key=?', [sourceKey]);
    if (existing) return this.get(existing.id);

    const expected = intervention.coverage_mode === 'commercial_gesture' ? 0 : Number(intervention.billable_amount_cents);
    const status: BillingItemStatus = expected > 0 ? 'ready' : 'offered';
    const description = `${intervention.intervention_number} · ${intervention.subject}`;
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO billing_items
       (id,client_account_id,project_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,'intervention',?,?,?,?,?,?,?,?)`,
      [id, intervention.client_account_id, intervention.project_id, intervention.id, sourceKey, description, expected, Number(intervention.theoretical_value_cents), status, now, now],
    );
    this.writeActivity('billing_item', id, 'billing_item_created', `${description} · ${status}`);
    return this.get(id);
  }

  ensureForHourPack(packId: string): BillingItem {
    const pack = this.database.get<{
      id: string;
      client_account_id: string;
      project_id: string | null;
      name: string;
      contract_price_cents: number;
    }>('SELECT id,client_account_id,project_id,name,contract_price_cents FROM hour_packs WHERE id=?', [packId]);
    if (!pack) throw new Error('Pack d’heures introuvable.');
    const sourceKey = `hour_pack:${pack.id}:purchase`;
    const existing = this.database.get<{ id: string }>('SELECT id FROM billing_items WHERE source_key=?', [sourceKey]);
    if (existing) return this.get(existing.id);
    const id = randomUUID(); const now = nowIso();
    const status: BillingItemStatus = Number(pack.contract_price_cents) > 0 ? 'ready' : 'offered';
    this.database.run(
      `INSERT INTO billing_items
       (id,client_account_id,project_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,'hour_pack',?,?,?,?,?,?,?,?)`,
      [id, pack.client_account_id, pack.project_id, pack.id, sourceKey, `Achat · ${pack.name}`, Number(pack.contract_price_cents), Number(pack.contract_price_cents), status, now, now],
    );
    return this.get(id);
  }

  get(id: string): BillingItem {
    const row = this.database.get<BillingItemRow>(`${this.select()} WHERE bi.id=?`, [id]);
    if (!row) throw new Error('Élément à facturer introuvable.');
    return this.map(row);
  }

  private select(): string {
    return `SELECT bi.*,
      COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
      p.name AS project_label
      FROM billing_items bi
      JOIN client_accounts ca ON ca.id=bi.client_account_id
      LEFT JOIN organizations o ON o.id=ca.organization_id
      LEFT JOIN contacts c ON c.id=ca.primary_contact_id
      LEFT JOIN projects p ON p.id=bi.project_id`;
  }

  private map(row: BillingItemRow): BillingItem {
    return {
      id: row.id,
      clientAccountId: row.client_account_id,
      clientLabel: row.client_label,
      projectId: row.project_id,
      projectLabel: row.project_label,
      sourceType: row.source_type,
      sourceId: row.source_id,
      sourceKey: row.source_key,
      description: row.description,
      expectedAmountCents: Number(row.expected_amount_cents),
      theoreticalValueCents: Number(row.theoretical_value_cents),
      dueAt: row.due_at,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}

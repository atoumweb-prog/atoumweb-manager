import { randomUUID } from 'node:crypto';
import { BILLING_ITEM_STATUSES, type BillingInvoiceInput, type BillingItem, type BillingItemFilters, type BillingItemSourceType, type BillingItemStatus } from '../../shared/billing';
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
  invoice_document_id: string | null;
  invoice_reference: string | null;
  invoiced_at: string | null;
  invoice_file_name: string | null;
  created_at: string;
  updated_at: string;
  client_label: string;
  project_label: string | null;
}

export class BillingHandoffService {
  constructor(private readonly database: DatabaseAdapter, private readonly verifyInvoiceDocument?: (documentId: string) => string) {}

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

  ensureForHourPackShortfall(decisionId: string): BillingItem | null {
    const decision = this.database.get<{
      id: string;
      decision: string;
      reason: string;
      expected_amount_cents: number;
      intervention_number: string;
      subject: string;
      client_account_id: string;
      project_id: string | null;
    }>(
      `SELECT hpsd.id,hpsd.decision,hpsd.reason,hpsd.expected_amount_cents,
        i.intervention_number,i.subject,i.client_account_id,i.project_id
       FROM hour_pack_shortfall_decisions hpsd
       JOIN interventions i ON i.id=hpsd.intervention_id
       WHERE hpsd.id=?`,
      [decisionId],
    );
    if (!decision) throw new Error('Décision de dépassement du pack introuvable.');
    if (decision.decision !== 'bill_complement') return null;

    const expected = Number(decision.expected_amount_cents);
    if (expected <= 0) throw new Error('Indique le montant à facturer pour le complément du pack.');
    const sourceKey = `hour_pack_shortfall:${decision.id}`;
    const existing = this.database.get<{ id: string }>('SELECT id FROM billing_items WHERE source_key=?', [sourceKey]);
    if (existing) return this.get(existing.id);

    const description = `Complément pack d’heures · ${decision.intervention_number} · ${decision.subject}`;
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO billing_items
       (id,client_account_id,project_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,notes,created_at,updated_at)
       VALUES (?,?,?,'hour_pack',?,?,?,?,?,'ready',?,?,?)`,
      [id, decision.client_account_id, decision.project_id, decision.id, sourceKey, description, expected, expected, decision.reason, now, now],
    );
    this.writeActivity('billing_item', id, 'billing_item_created', `${description} · ready`);
    return this.get(id);
  }

  syncMaintenanceOverage(decisionId: string): BillingItem | null {
    const decision = this.database.get<{
      id: string;
      decision: string;
      reason: string;
      expected_amount_cents: number;
      intervention_id: string;
      intervention_number: string;
      subject: string;
      client_account_id: string;
      project_id: string | null;
      theoretical_value_cents: number;
      intervention_status: string;
    }>(
      `SELECT mod.id,mod.decision,mod.reason,mod.expected_amount_cents,mod.intervention_id,
        i.intervention_number,i.subject,i.client_account_id,i.project_id,i.theoretical_value_cents,i.status AS intervention_status
       FROM maintenance_overage_decisions mod
       JOIN interventions i ON i.id=mod.intervention_id
       WHERE mod.id=?`,
      [decisionId],
    );
    if (!decision) throw new Error('Décision de dépassement introuvable.');

    const sourceKey = `maintenance_overage:${decision.id}`;
    const existing = this.database.get<{ id: string }>('SELECT id FROM billing_items WHERE source_key=?', [sourceKey]);
    const now = nowIso();

    // Once Abby's invoice PDF is attached, a source sync must never demote or rewrite the billed item.
    if (existing && this.get(existing.id).invoiceDocumentId) {
      throw new Error('Facture PDF déjà rattachée : la décision de dépassement ne peut plus modifier cet élément facturé.');
    }

    if (decision.decision !== 'bill_out_of_scope') {
      if (existing) {
        this.database.run("UPDATE billing_items SET status='cancelled',notes=?,updated_at=? WHERE id=?", [decision.reason, now, existing.id]);
        return this.get(existing.id);
      }
      return null;
    }

    if (decision.intervention_status !== 'completed') return existing ? this.get(existing.id) : null;
    const expected = Number(decision.expected_amount_cents);
    if (expected <= 0) throw new Error('Indique un montant à facturer pour ce dépassement.');
    const description = `Dépassement maintenance · ${decision.intervention_number} · ${decision.subject}`;
    const theoretical = Math.max(expected, Number(decision.theoretical_value_cents));

    if (existing) {
      this.database.run(
        "UPDATE billing_items SET description=?,expected_amount_cents=?,theoretical_value_cents=?,status='ready',notes=?,updated_at=? WHERE id=?",
        [description, expected, theoretical, decision.reason, now, existing.id],
      );
      return this.get(existing.id);
    }

    const id = randomUUID();
    this.database.run(
      `INSERT INTO billing_items
       (id,client_account_id,project_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,notes,created_at,updated_at)
       VALUES (?,?,?,'maintenance_overage',?,?,?,?,?,'ready',?,?,?)`,
      [id, decision.client_account_id, decision.project_id, decision.id, sourceKey, description, expected, theoretical, decision.reason, now, now],
    );
    this.writeActivity('billing_item', id, 'billing_item_created', `${description} · ready`);
    return this.get(id);
  }

  get(id: string): BillingItem {
    const row = this.database.get<BillingItemRow>(`${this.select()} WHERE bi.id=?`, [id]);
    if (!row) throw new Error('Élément à facturer introuvable.');
    return this.map(row);
  }

  changeStatus(id: string, status: BillingItemStatus): BillingItem {
    if (!BILLING_ITEM_STATUSES.includes(status)) throw new Error('Statut de facturation invalide.');
    if (status === 'invoiced') throw new Error('Importe la facture PDF pour passer cet élément à « Facturé ».');
    const current = this.get(id);
    if (current.invoiceDocumentId) throw new Error('Une facture PDF est déjà rattachée. Le statut Facturé est conservé.');
    const now = nowIso();
    this.database.run('UPDATE billing_items SET status=?,updated_at=? WHERE id=?', [status, now, id]);
    this.writeActivity('billing_item', id, 'billing_item_status_changed', `${current.description} · ${status}`);
    return this.get(id);
  }

  attachInvoice(id: string, documentId: string, input: BillingInvoiceInput = {}): BillingItem {
    const current = this.get(id);
    const document = this.database.get<{ id: string; client_account_id: string; category: string; mime_type: string | null; sha256: string | null; archived_at: string | null }>(
      'SELECT id,client_account_id,category,mime_type,sha256,archived_at FROM client_documents WHERE id=?',
      [documentId],
    );
    if (!document) throw new Error('Facture PDF introuvable.');
    if (document.client_account_id !== current.clientAccountId) throw new Error('Cette facture appartient à un autre client.');
    if (document.category !== 'invoice') throw new Error('Le document doit être classé dans la catégorie Factures.');
    if (document.mime_type !== 'application/pdf') throw new Error('Seuls les fichiers PDF peuvent être rattachés comme factures Abby.');
    if (document.archived_at) throw new Error('Restaure la facture avant de la rattacher.');
    const alreadyLinked = this.database.get<{ id: string }>(
      'SELECT id FROM billing_items WHERE invoice_document_id=? AND id<>? LIMIT 1',
      [documentId, id],
    );
    if (alreadyLinked) throw new Error('Cette facture Abby est déjà associée à un autre élément. Le rapprochement multi-sources doit être traité explicitement.');
    if (document.sha256) {
      const sameBytes = this.database.get<{ id: string }>(
        `SELECT bi.id FROM billing_items bi
         JOIN client_documents cd ON cd.id=bi.invoice_document_id
         WHERE bi.id<>? AND bi.client_account_id=? AND cd.sha256=? LIMIT 1`,
        [id, current.clientAccountId, document.sha256],
      );
      if (sameBytes) throw new Error('Un PDF Abby identique est déjà associé à un autre élément. Le rapprochement multi-sources doit être traité explicitement.');
    }
    // Production supplies a workspace-aware verifier; do not attest tampered or missing PDF bytes.
    this.verifyInvoiceDocument?.(documentId);

    // Reattaching the same document is not a new Abby invoice replacement.
    if (current.invoiceDocumentId === documentId) {
      const reference = input.reference === undefined ? (current.invoiceReference ?? null) : clean(input.reference);
      const invoicedAt = input.invoicedAt ? this.dateIso(input.invoicedAt, 'Date de facture invalide.') : current.invoicedAt;
      if (reference === current.invoiceReference && invoicedAt === current.invoicedAt) return current;
      return this.updateInvoiceMetadata(id, { reference, invoicedAt });
    }
    const reference = clean(input.reference);
    const invoicedAt = input.invoicedAt ? this.dateIso(input.invoicedAt, 'Date de facture invalide.') : nowIso();
    const now = nowIso();
    this.database.exec('SAVEPOINT billing_invoice_attach');
    try {
      this.database.run(
        "UPDATE billing_items SET invoice_document_id=?,invoice_reference=?,invoiced_at=?,status='invoiced',updated_at=? WHERE id=?",
        [documentId, reference, invoicedAt, now, id],
      );
      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['billing_item', id, current.invoiceDocumentId ? 'billing_invoice_replaced' : 'billing_invoice_attached',
          `Facture PDF ${current.invoiceDocumentId ? 'remplacée' : 'rattachée'} : ${current.description}`,
          JSON.stringify({ previousDocumentId: current.invoiceDocumentId, currentDocumentId: documentId,
            previousReference: current.invoiceReference, currentReference: reference,
            previousInvoicedAt: current.invoicedAt, currentInvoicedAt: invoicedAt }), now],
      );
      this.database.exec('RELEASE SAVEPOINT billing_invoice_attach');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT billing_invoice_attach');
      this.database.exec('RELEASE SAVEPOINT billing_invoice_attach');
      throw error;
    }
    return this.get(id);
  }

  updateInvoiceMetadata(id: string, input: BillingInvoiceInput): BillingItem {
    const current = this.get(id);
    if (!current.invoiceDocumentId) throw new Error('Aucune facture PDF n’est rattachée à cet élément.');
    const reference = input.reference === undefined ? (current.invoiceReference ?? null) : clean(input.reference);
    const invoicedAt = input.invoicedAt ? this.dateIso(input.invoicedAt, 'Date de facture invalide.') : current.invoicedAt ?? nowIso();
    if (reference === current.invoiceReference && invoicedAt === current.invoicedAt) return current;
    const now = nowIso();
    this.database.exec('SAVEPOINT billing_invoice_metadata');
    try {
      this.database.run(
        'UPDATE billing_items SET invoice_reference=?,invoiced_at=?,updated_at=? WHERE id=?',
        [reference, invoicedAt, now, id],
      );
      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['billing_item', id, 'billing_invoice_metadata_updated',
          `Informations facture mises à jour : ${current.description}`,
          JSON.stringify({ documentId: current.invoiceDocumentId, previousReference: current.invoiceReference,
            currentReference: reference, previousInvoicedAt: current.invoicedAt, currentInvoicedAt: invoicedAt }), now],
      );
      this.database.exec('RELEASE SAVEPOINT billing_invoice_metadata');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT billing_invoice_metadata');
      this.database.exec('RELEASE SAVEPOINT billing_invoice_metadata');
      throw error;
    }
    return this.get(id);
  }
  private select(): string {
    return `SELECT bi.*,
      COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
      p.name AS project_label,
      invoice_doc.original_name AS invoice_file_name
      FROM billing_items bi
      JOIN client_accounts ca ON ca.id=bi.client_account_id
      LEFT JOIN organizations o ON o.id=ca.organization_id
      LEFT JOIN contacts c ON c.id=ca.primary_contact_id
      LEFT JOIN projects p ON p.id=bi.project_id
      LEFT JOIN client_documents invoice_doc ON invoice_doc.id=bi.invoice_document_id`;
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
      invoiceDocumentId: row.invoice_document_id,
      invoiceReference: row.invoice_reference,
      invoiceFileName: row.invoice_file_name,
      invoicedAt: row.invoiced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private dateIso(value: string, message: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date.toISOString();
  }
  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}


import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_FREQUENCIES,
  EXPENSE_STATUSES,
  type Expense,
  type ExpenseFilters,
  type ExpenseInput,
  type ExpenseStatus,
} from '../../shared/expenses';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => value?.trim() || null;

interface ExpenseRow extends Record<string, unknown> {
  id: string;
  client_account_id: string | null;
  project_id: string | null;
  category: Expense['category'];
  supplier: string | null;
  label: string;
  amount_cents: number;
  vat_cents: number | null;
  status: Expense['status'];
  expense_date: string;
  due_at: string | null;
  paid_at: string | null;
  frequency: Expense['frequency'];
  next_due_at: string | null;
  notes: string | null;
  receipt_relative_path: string | null;
  receipt_original_name: string | null;
  receipt_mime_type: string | null;
  receipt_size_bytes: number | null;
  created_at: string;
  updated_at: string;
  client_label: string | null;
  project_label: string | null;
  project_number: string | null;
}

export class ExpenseService {
  constructor(private readonly database: DatabaseAdapter, private readonly workspace: WorkspacePaths) {}

  list(filters: ExpenseFilters = {}): Expense[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (clean(filters.clientAccountId)) { where.push('e.client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectId)) { where.push('e.project_id=?'); params.push(clean(filters.projectId) as string); }
    if (filters.category) { where.push('e.category=?'); params.push(filters.category); }
    if (filters.status) { where.push('e.status=?'); params.push(filters.status); }
    if (clean(filters.search)) {
      const like = '%' + clean(filters.search) + '%';
      where.push("(e.label LIKE ? COLLATE NOCASE OR e.supplier LIKE ? COLLATE NOCASE OR e.notes LIKE ? COLLATE NOCASE OR COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'') LIKE ? COLLATE NOCASE OR p.name LIKE ? COLLATE NOCASE OR p.project_number LIKE ? COLLATE NOCASE)");
      params.push(like, like, like, like, like, like);
    }
    const sql = this.select() + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY e.expense_date DESC,e.created_at DESC';
    return this.database.all<ExpenseRow>(sql, params).map((row) => this.map(row));
  }

  get(id: string): Expense {
    const row = this.database.get<ExpenseRow>(this.select() + ' WHERE e.id=?', [id]);
    if (!row) throw new Error('Dépense introuvable.');
    return this.map(row);
  }

  create(input: ExpenseInput): Expense {
    const normalized = this.normalize(input);
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      'INSERT INTO expenses (id,client_account_id,project_id,category,supplier,label,amount_cents,vat_cents,status,expense_date,due_at,paid_at,frequency,next_due_at,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        id, normalized.clientAccountId, normalized.projectId, normalized.category, normalized.supplier,
        normalized.label, normalized.amountCents, normalized.vatCents, normalized.status,
        normalized.expenseDate, normalized.dueAt, normalized.paidAt, normalized.frequency,
        normalized.nextDueAt, normalized.notes, now, now,
      ],
    );
    this.log(id, 'expense_created', normalized.label + ' · ' + (normalized.amountCents / 100) + ' €');
    return this.get(id);
  }

  update(id: string, input: ExpenseInput): Expense {
    this.get(id);
    const normalized = this.normalize(input);
    this.database.run(
      'UPDATE expenses SET client_account_id=?,project_id=?,category=?,supplier=?,label=?,amount_cents=?,vat_cents=?,status=?,expense_date=?,due_at=?,paid_at=?,frequency=?,next_due_at=?,notes=?,updated_at=? WHERE id=?',
      [
        normalized.clientAccountId, normalized.projectId, normalized.category, normalized.supplier,
        normalized.label, normalized.amountCents, normalized.vatCents, normalized.status,
        normalized.expenseDate, normalized.dueAt, normalized.paidAt, normalized.frequency,
        normalized.nextDueAt, normalized.notes, nowIso(), id,
      ],
    );
    this.log(id, 'expense_updated', normalized.label);
    return this.get(id);
  }

  changeStatus(id: string, status: ExpenseStatus): Expense {
    if (!EXPENSE_STATUSES.includes(status)) throw new Error('Statut de dépense invalide.');
    const current = this.get(id);
    const paidAt = status === 'paid' ? current.paidAt ?? nowIso() : null;
    this.database.run('UPDATE expenses SET status=?,paid_at=?,updated_at=? WHERE id=?', [status, paidAt, nowIso(), id]);
    this.log(id, 'expense_status_changed', current.label + ' · ' + status);
    return this.get(id);
  }

  importReceipt(id: string, sourcePath: string): Expense {
    const expense = this.get(id);
    const source = resolve(sourcePath);
    if (!existsSync(source) || !statSync(source).isFile()) throw new Error('Justificatif introuvable.');
    const directory = this.receiptDirectory(expense);
    mkdirSync(directory, { recursive: true });
    const destination = this.uniqueDestination(directory, basename(source));
    if (resolve(source) !== resolve(destination)) copyFileSync(source, destination);
    const stats = statSync(destination);
    this.database.run(
      'UPDATE expenses SET receipt_relative_path=?,receipt_original_name=?,receipt_mime_type=?,receipt_size_bytes=?,updated_at=? WHERE id=?',
      [relative(this.workspace.root, destination), basename(source), this.mime(destination), Number(stats.size), nowIso(), id],
    );
    this.log(id, 'expense_receipt_imported', 'Justificatif : ' + basename(source));
    return this.get(id);
  }

  absoluteReceiptPath(id: string): string {
    const expense = this.get(id);
    if (!expense.receiptRelativePath) throw new Error('Aucun justificatif rattaché à cette dépense.');
    const absolute = resolve(this.workspace.root, expense.receiptRelativePath);
    if (!absolute.startsWith(resolve(this.workspace.root))) throw new Error('Chemin de justificatif invalide.');
    if (!existsSync(absolute)) throw new Error('Le fichier justificatif est introuvable.');
    return absolute;
  }

  private normalize(input: ExpenseInput): ExpenseInput {
    if (!EXPENSE_CATEGORIES.includes(input.category)) throw new Error('Catégorie de dépense invalide.');
    if (!EXPENSE_FREQUENCIES.includes(input.frequency ?? 'none')) throw new Error('Fréquence de dépense invalide.');
    if (!EXPENSE_STATUSES.includes(input.status ?? 'committed')) throw new Error('Statut de dépense invalide.');
    const label = clean(input.label);
    if (!label) throw new Error('Le libellé de la dépense est requis.');
    if (!Number.isInteger(input.amountCents) || input.amountCents < 0) throw new Error('Montant de dépense invalide.');
    if (input.vatCents != null && (!Number.isInteger(input.vatCents) || input.vatCents < 0 || input.vatCents > input.amountCents)) throw new Error('Montant de TVA invalide.');

    const project = input.projectId
      ? this.database.get<{ id: string; client_account_id: string | null }>('SELECT id,client_account_id FROM projects WHERE id=?', [input.projectId])
      : null;
    if (input.projectId && !project) throw new Error('Projet introuvable.');
    let clientAccountId = clean(input.clientAccountId);
    if (project?.client_account_id) {
      if (clientAccountId && clientAccountId !== project.client_account_id) throw new Error('Le projet ne correspond pas au client sélectionné.');
      clientAccountId = project.client_account_id;
    }
    if (clientAccountId && !this.database.get('SELECT id FROM client_accounts WHERE id=?', [clientAccountId])) throw new Error('Client introuvable.');

    const expenseDate = this.dateIso(input.expenseDate, 'Date de dépense invalide.');
    const status = input.status ?? 'committed';
    const paidAt = status === 'paid'
      ? (input.paidAt ? this.dateIso(input.paidAt, 'Date de paiement invalide.') : nowIso())
      : null;

    return {
      clientAccountId,
      projectId: clean(input.projectId),
      category: input.category,
      supplier: clean(input.supplier),
      label,
      amountCents: input.amountCents,
      vatCents: input.vatCents ?? null,
      status,
      expenseDate,
      dueAt: input.dueAt ? this.dateIso(input.dueAt, 'Échéance invalide.') : null,
      paidAt,
      frequency: input.frequency ?? 'none',
      nextDueAt: input.nextDueAt ? this.dateIso(input.nextDueAt, 'Prochaine échéance invalide.') : null,
      notes: clean(input.notes),
    };
  }

  private select(): string {
    return "SELECT e.*,COALESCE(o.name,trim(c.first_name || ' ' || c.last_name)) AS client_label,p.name AS project_label,p.project_number FROM expenses e LEFT JOIN client_accounts ca ON ca.id=e.client_account_id LEFT JOIN organizations o ON o.id=ca.organization_id LEFT JOIN contacts c ON c.id=ca.primary_contact_id LEFT JOIN projects p ON p.id=e.project_id";
  }

  private map(row: ExpenseRow): Expense {
    const receiptAbsolute = row.receipt_relative_path ? resolve(this.workspace.root, row.receipt_relative_path) : null;
    return {
      id: row.id,
      clientAccountId: row.client_account_id,
      clientLabel: row.client_label,
      projectId: row.project_id,
      projectLabel: row.project_label,
      projectNumber: row.project_number,
      category: row.category,
      supplier: row.supplier,
      label: row.label,
      amountCents: Number(row.amount_cents),
      vatCents: row.vat_cents == null ? null : Number(row.vat_cents),
      status: row.status,
      expenseDate: row.expense_date,
      dueAt: row.due_at,
      paidAt: row.paid_at,
      frequency: row.frequency,
      nextDueAt: row.next_due_at,
      notes: row.notes,
      receiptRelativePath: row.receipt_relative_path,
      receiptFileName: row.receipt_original_name,
      receiptMimeType: row.receipt_mime_type,
      receiptSizeBytes: row.receipt_size_bytes == null ? null : Number(row.receipt_size_bytes),
      receiptMissing: Boolean(receiptAbsolute && !existsSync(receiptAbsolute)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private receiptDirectory(expense: Expense): string {
    if (expense.clientAccountId) {
      const root = join(this.workspace.clientsDirectory, expense.clientAccountId, 'Documents', '09 Depenses');
      return expense.projectNumber ? join(root, expense.projectNumber) : root;
    }
    return this.workspace.expensesDirectory;
  }

  private uniqueDestination(directory: string, name: string): string {
    const ext = extname(name);
    const stem = ext ? name.slice(0, -ext.length) : name;
    let destination = join(directory, name);
    let index = 2;
    while (existsSync(destination)) destination = join(directory, stem + ' (' + index++ + ')' + ext);
    return destination;
  }

  private mime(path: string): string | null {
    const types: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };
    return types[extname(path).toLowerCase()] ?? null;
  }

  private dateIso(value: string, message: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date.toISOString();
  }

  private log(id: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      ['expense', id, action, summary, nowIso()],
    );
  }
}

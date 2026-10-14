
import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, chmodSync, rmSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
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
import { cleanupExpiredReceiptPreviews } from './receiptPreviewCleanup';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => value?.trim() || null;

type NormalizedExpenseInput = {
  clientAccountId: string | null;
  projectId: string | null;
  category: ExpenseInput['category'];
  supplier: string | null;
  label: string;
  amountCents: number;
  vatCents: number | null;
  status: NonNullable<ExpenseInput['status']>;
  expenseDate: string;
  dueAt: string | null;
  paidAt: string | null;
  frequency: NonNullable<ExpenseInput['frequency']>;
  nextDueAt: string | null;
  notes: string | null;
};

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
    this.database.exec('SAVEPOINT expense_create');
    try {
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
      this.database.exec('RELEASE SAVEPOINT expense_create');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT expense_create');
      this.database.exec('RELEASE SAVEPOINT expense_create');
      throw error;
    }
    return this.get(id);
  }

  update(id: string, input: ExpenseInput): Expense {
    const before = this.get(id);
    const normalized = this.normalize(input);
    const now = nowIso();
    this.database.exec('SAVEPOINT expense_update');
    try {
      this.database.run(
        'UPDATE expenses SET client_account_id=?,project_id=?,category=?,supplier=?,label=?,amount_cents=?,vat_cents=?,status=?,expense_date=?,due_at=?,paid_at=?,frequency=?,next_due_at=?,notes=?,updated_at=? WHERE id=?',
        [
          normalized.clientAccountId, normalized.projectId, normalized.category, normalized.supplier,
          normalized.label, normalized.amountCents, normalized.vatCents, normalized.status,
          normalized.expenseDate, normalized.dueAt, normalized.paidAt, normalized.frequency,
          normalized.nextDueAt, normalized.notes, now, id,
        ],
      );
      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['expense', id, 'expense_updated', normalized.label,
          JSON.stringify({
            previousStatus: before.status, currentStatus: normalized.status,
            previousAmountCents: before.amountCents, currentAmountCents: normalized.amountCents,
            previousPaidAt: before.paidAt, currentPaidAt: normalized.paidAt,
            previousClientAccountId: before.clientAccountId, currentClientAccountId: normalized.clientAccountId,
            previousProjectId: before.projectId, currentProjectId: normalized.projectId,
            paymentVerifiedByBank: false,
          }), now],
      );
      this.database.exec('RELEASE SAVEPOINT expense_update');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT expense_update');
      this.database.exec('RELEASE SAVEPOINT expense_update');
      throw error;
    }
    return this.get(id);
  }

  changeStatus(id: string, status: ExpenseStatus): Expense {
    if (!EXPENSE_STATUSES.includes(status)) throw new Error('Statut de dépense invalide.');
    const current = this.get(id);
    if (current.status === status) return current;
    const now = nowIso();
    const paidAt = status === 'paid' ? current.paidAt ?? now : null;
    this.database.exec('SAVEPOINT expense_status_update');
    try {
      this.database.run('UPDATE expenses SET status=?,paid_at=?,updated_at=? WHERE id=?', [status, paidAt, now, id]);
      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['expense', id, 'expense_status_changed', current.label + ' · ' + status,
          JSON.stringify({ previousStatus: current.status, currentStatus: status,
            previousPaidAt: current.paidAt, currentPaidAt: paidAt, paymentVerifiedByBank: false }), now],
      );
      this.database.exec('RELEASE SAVEPOINT expense_status_update');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT expense_status_update');
      this.database.exec('RELEASE SAVEPOINT expense_status_update');
      throw error;
    }
    return this.get(id);
  }

  importReceipt(id: string, sourcePath: string): Expense {
    const expense = this.get(id);
    const source = resolve(sourcePath);
    if (!existsSync(source) || !statSync(source).isFile()) throw new Error('Justificatif introuvable.');
    const directory = this.receiptDirectory(expense);
    mkdirSync(directory, { recursive: true });
    const destination = this.uniqueDestination(directory, basename(source));
    const copied = source !== resolve(destination);
    let committed = false;
    try {
      if (copied) copyFileSync(source, destination);
      const stats = statSync(destination);
      const now = nowIso();
      const storedPath = relative(this.workspace.root, destination);
      const sha256 = createHash('sha256').update(readFileSync(destination)).digest('hex');
      this.database.exec('SAVEPOINT expense_receipt_import');
      try {
        this.database.run(
          'UPDATE expenses SET receipt_relative_path=?,receipt_original_name=?,receipt_mime_type=?,receipt_size_bytes=?,updated_at=? WHERE id=?',
          [storedPath, basename(source), this.mime(destination), Number(stats.size), now, id],
        );
        this.database.run(
          'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
          ['expense', id, 'expense_receipt_version', 'Historique justificatif : ' + basename(source),
            JSON.stringify({ previousRelativePath: expense.receiptRelativePath ?? null, previousFileName: expense.receiptFileName ?? null,
              currentRelativePath: storedPath, currentFileName: basename(source), currentSha256: sha256 }), now],
        );
        this.log(id, 'expense_receipt_imported', 'Justificatif : ' + basename(source));
        this.database.exec('RELEASE SAVEPOINT expense_receipt_import');
        committed = true;
      } catch (error) {
        this.database.exec('ROLLBACK TO SAVEPOINT expense_receipt_import');
        this.database.exec('RELEASE SAVEPOINT expense_receipt_import');
        throw error;
      }
      return this.get(id);
    } catch (error) {
      // A rejected update must not leave a new, unattached receipt copy behind.
      // Never delete the source or a pre-existing receipt version.
      if (copied && !committed) rmSync(destination, { force: true });
      throw error;
    }
  }

  absoluteReceiptPath(id: string): string {
    const expense = this.get(id);
    if (!expense.receiptRelativePath) throw new Error('Aucun justificatif rattaché à cette dépense.');
    const absolute = resolve(this.workspace.root, expense.receiptRelativePath);
    if (!absolute.startsWith(resolve(this.workspace.root) + sep)) throw new Error('Chemin de justificatif invalide.');
    if (!existsSync(absolute)) throw new Error('Le fichier justificatif est introuvable.');
    return absolute;
  }

  listReceiptVersions(id: string): Array<{ relativePath: string; fileName: string; sha256: string | null; integrity: 'verified' | 'unknown' | 'missing' | 'modified' }> {
    this.get(id);
    const rows = this.database.all<{ metadata_json: string | null }>(
      "SELECT metadata_json FROM activity_log WHERE entity_type='expense' AND entity_id=? AND action='expense_receipt_version' ORDER BY id DESC",
      [id],
    );
    return rows.flatMap<{ relativePath: string; fileName: string; sha256: string | null; integrity: 'verified' | 'unknown' | 'missing' | 'modified' }>((row) => {
      if (!row.metadata_json) return [];
      let value: { currentRelativePath?: string; currentFileName?: string; currentSha256?: string };
      try { value = JSON.parse(row.metadata_json); } catch { return []; }
      if (!value.currentRelativePath || !value.currentFileName) return [];
      const absolute = resolve(this.workspace.root, value.currentRelativePath);
      if (!absolute.startsWith(resolve(this.workspace.root) + sep)) return [];
      if (!existsSync(absolute)) return [{ relativePath: value.currentRelativePath, fileName: value.currentFileName, sha256: value.currentSha256 ?? null, integrity: 'missing' as const }];
      const sha256 = value.currentSha256 ?? null;
      const integrity = !sha256 ? 'unknown' as const : createHash('sha256').update(readFileSync(absolute)).digest('hex') === sha256 ? 'verified' as const : 'modified' as const;
      return [{ relativePath: value.currentRelativePath, fileName: value.currentFileName, sha256, integrity }];
    });
  }

  verifiedReceiptVersionPath(id: string, relativePath: string): string {
    const version = this.listReceiptVersions(id).find((item) => item.relativePath === relativePath);
    if (!version) throw new Error('Version de justificatif introuvable dans l’historique.');
    if (version.integrity !== 'verified') throw new Error('Ouverture refusée : intégrité de cette version non vérifiée.');
    const absolute = resolve(this.workspace.root, relativePath);
    if (!absolute.startsWith(resolve(this.workspace.root) + sep)) throw new Error('Chemin de justificatif invalide.');
    return absolute;
  }

  prepareReceiptVersionPreview(id: string, relativePath: string): string {
    const original = this.verifiedReceiptVersionPath(id, relativePath);
    const version = this.listReceiptVersions(id).find((item) => item.relativePath === relativePath);
    if (!version?.sha256) throw new Error('Version sans empreinte vérifiée.');
    cleanupExpiredReceiptPreviews();
    const directory = mkdtempSync(join(tmpdir(), 'atoumweb-receipt-preview-'));
    try {
      writeFileSync(join(directory, '.atoumweb-receipt-preview'), 'atoumweb-receipt-preview-v1');
      const copy = join(directory, randomUUID() + extname(original));
      copyFileSync(original, copy);
      if (createHash('sha256').update(readFileSync(copy)).digest('hex') !== version.sha256) {
        throw new Error('Copie du justificatif altérée pendant la préparation.');
      }
      chmodSync(copy, 0o444);
      return copy;
    } catch (error) {
      rmSync(directory, { recursive: true, force: true });
      throw error;
    }
  }

  private normalize(input: ExpenseInput): NormalizedExpenseInput {
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

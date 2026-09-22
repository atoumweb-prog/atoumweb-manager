export const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'software',
  'license',
  'subcontracting',
  'advertising',
  'travel',
  'equipment',
  'banking',
  'tax',
  'office',
  'other',
] as const;

export const EXPENSE_STATUSES = ['planned', 'committed', 'paid', 'cancelled'] as const;
export const EXPENSE_FREQUENCIES = ['none', 'monthly', 'quarterly', 'yearly'] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type ExpenseFrequency = (typeof EXPENSE_FREQUENCIES)[number];

export interface ExpenseInput {
  clientAccountId?: string | null;
  projectId?: string | null;
  category: ExpenseCategory;
  supplier?: string | null;
  label: string;
  amountCents: number;
  vatCents?: number | null;
  status?: ExpenseStatus;
  expenseDate: string;
  dueAt?: string | null;
  paidAt?: string | null;
  frequency?: ExpenseFrequency;
  nextDueAt?: string | null;
  notes?: string | null;
}

export interface Expense extends ExpenseInput {
  id: string;
  clientLabel?: string | null;
  projectLabel?: string | null;
  projectNumber?: string | null;
  receiptRelativePath?: string | null;
  receiptFileName?: string | null;
  receiptMimeType?: string | null;
  receiptSizeBytes?: number | null;
  receiptMissing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  search?: string | null;
  clientAccountId?: string | null;
  projectId?: string | null;
  category?: ExpenseCategory | null;
  status?: ExpenseStatus | null;
}

export interface ExpensesApi {
  list(filters?: ExpenseFilters): Promise<Expense[]>;
  get(id: string): Promise<Expense>;
  create(input: ExpenseInput): Promise<Expense>;
  update(id: string, input: ExpenseInput): Promise<Expense>;
  changeStatus(id: string, status: ExpenseStatus): Promise<Expense>;
  importReceipt(id: string): Promise<Expense | null>;
  openReceipt(id: string): Promise<void>;
}

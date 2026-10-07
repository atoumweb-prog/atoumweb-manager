import type { Migration } from './migrations';

export const EXPENSES_MIGRATION: Migration = {
  id: 33,
  name: 'expenses_tracking',
  sql: `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      client_account_id TEXT REFERENCES client_accounts(id) ON DELETE SET NULL,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      category TEXT NOT NULL CHECK (category IN (
        'hosting','domain','software','license','subcontracting','advertising',
        'travel','equipment','banking','tax','office','other'
      )),
      supplier TEXT,
      label TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
      vat_cents INTEGER CHECK (vat_cents IS NULL OR vat_cents >= 0),
      status TEXT NOT NULL DEFAULT 'committed' CHECK (status IN ('planned','committed','paid','cancelled')),
      expense_date TEXT NOT NULL,
      due_at TEXT,
      paid_at TEXT,
      frequency TEXT NOT NULL DEFAULT 'none' CHECK (frequency IN ('none','monthly','quarterly','yearly')),
      next_due_at TEXT,
      notes TEXT,
      receipt_relative_path TEXT,
      receipt_original_name TEXT,
      receipt_mime_type TEXT,
      receipt_size_bytes INTEGER CHECK (receipt_size_bytes IS NULL OR receipt_size_bytes >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_expenses_status_date
      ON expenses(status, expense_date DESC);

    CREATE INDEX IF NOT EXISTS idx_expenses_client
      ON expenses(client_account_id, status, expense_date DESC);

    CREATE INDEX IF NOT EXISTS idx_expenses_project
      ON expenses(project_id, status, expense_date DESC);

    CREATE INDEX IF NOT EXISTS idx_expenses_category
      ON expenses(category, expense_date DESC);

    CREATE INDEX IF NOT EXISTS idx_expenses_due
      ON expenses(status, due_at);

    CREATE INDEX IF NOT EXISTS idx_expenses_next_due
      ON expenses(frequency, next_due_at);
  `,
};

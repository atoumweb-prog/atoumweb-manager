import type { Migration } from './migrations';

export const BILLING_INVOICE_MIGRATION: Migration = {
  id: 32,
  name: 'billing_invoice_pdf_link',
  sql: `
    ALTER TABLE billing_items
      ADD COLUMN invoice_document_id TEXT REFERENCES client_documents(id) ON DELETE SET NULL;

    ALTER TABLE billing_items
      ADD COLUMN invoice_reference TEXT;

    ALTER TABLE billing_items
      ADD COLUMN invoiced_at TEXT;

    CREATE INDEX IF NOT EXISTS idx_billing_items_invoice_document
      ON billing_items(invoice_document_id);

    CREATE INDEX IF NOT EXISTS idx_billing_items_invoiced_at
      ON billing_items(invoiced_at DESC);
  `,
};

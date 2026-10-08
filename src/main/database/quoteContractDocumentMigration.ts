import type { Migration } from './migrations';

export const QUOTE_CONTRACT_DOCUMENT_MIGRATION: Migration = {
  id: 45,
  name: 'quote_contract_document',
  sql: `
    ALTER TABLE quotes ADD COLUMN contract_document_id TEXT REFERENCES client_documents(id) ON DELETE SET NULL;
    ALTER TABLE quotes ADD COLUMN abby_reference TEXT;
    ALTER TABLE quotes ADD COLUMN contract_document_attached_at TEXT;

    CREATE INDEX idx_quotes_contract_document
      ON quotes(contract_document_id);
  `,
};

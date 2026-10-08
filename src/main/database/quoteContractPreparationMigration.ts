import type { Migration } from './migrations';
export const QUOTE_CONTRACT_PREPARATION_MIGRATION: Migration = {
  id: 56, name: 'quote_contract_parameters_and_evidence_v1',
  sql: `
    ALTER TABLE quotes ADD COLUMN contract_parameters_json TEXT CHECK(contract_parameters_json IS NULL OR json_valid(contract_parameters_json));
    ALTER TABLE client_documents ADD COLUMN sha256 TEXT;
    ALTER TABLE client_documents ADD COLUMN imported_from TEXT;
    CREATE TABLE quote_document_links (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL REFERENCES quotes(id),
      document_id TEXT REFERENCES client_documents(id),
      role TEXT NOT NULL CHECK(role IN ('accepted_pdf','withdrawal_form','early_request','early_acknowledgement','acceptance','data_processing','rights','licenses','image_permission','other')),
      sha256 TEXT CHECK(sha256 IS NULL OR length(sha256)=64),
      statement TEXT, occurred_at TEXT, relative_path TEXT, file_name TEXT,
      attached_at TEXT NOT NULL,
      provenance TEXT NOT NULL,
      supersedes_id TEXT REFERENCES quote_document_links(id),
      replacement_reason TEXT,
      CHECK((document_id IS NOT NULL AND sha256 IS NOT NULL) OR (relative_path IS NOT NULL AND sha256 IS NOT NULL) OR (role='acceptance' AND statement IS NOT NULL AND occurred_at IS NOT NULL)),
      UNIQUE(quote_id,document_id,role)
    ) STRICT;
    CREATE INDEX idx_quote_document_links_quote ON quote_document_links(quote_id,role,attached_at);
    CREATE INDEX idx_quote_document_links_document ON quote_document_links(document_id);
  `,
};

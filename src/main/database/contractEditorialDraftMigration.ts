import type { Migration } from './migrations';

/** Additive only: existing published versions keep their historical title. */
export const CONTRACT_EDITORIAL_DRAFT_MIGRATION: Migration = {
  id: 76,
  name: 'contract_editorial_drafts_and_versioned_titles',
  sql: `
    ALTER TABLE contract_clause_versions ADD COLUMN title TEXT;
    UPDATE contract_clause_versions
       SET title=(SELECT title FROM contract_clause_templates WHERE id=contract_clause_versions.clause_id)
     WHERE title IS NULL;

    CREATE TABLE contract_editorial_import_runs (
      id TEXT PRIMARY KEY,
      payload_sha256 TEXT NOT NULL UNIQUE,
      source_reference TEXT NOT NULL,
      summary_json TEXT NOT NULL CHECK (json_valid(summary_json)),
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE contract_editorial_import_entries (
      run_id TEXT NOT NULL REFERENCES contract_editorial_import_runs(id),
      clause_code TEXT NOT NULL,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id),
      source_version_id TEXT NOT NULL REFERENCES contract_clause_versions(id),
      draft_version_id TEXT NOT NULL REFERENCES contract_clause_versions(id),
      source_body_sha256 TEXT NOT NULL,
      proposal_sha256 TEXT NOT NULL,
      PRIMARY KEY (run_id, clause_code),
      UNIQUE (draft_version_id)
    ) STRICT;
  `,
};

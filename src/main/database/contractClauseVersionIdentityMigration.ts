import type { Migration } from './migrations';

/**
 * Keeps the code and audience reviewed with each clause version.
 *
 * Existing quotes already contain immutable clause snapshots. These columns
 * add the same traceability to the library itself and allow a code/audience
 * change to remain a draft until the corresponding version is published.
 */
export const CONTRACT_CLAUSE_VERSION_IDENTITY_MIGRATION: Migration = {
  id: 79,
  name: 'contract_clause_version_identity_and_code_aliases',
  sql: `
    ALTER TABLE contract_clause_versions ADD COLUMN code TEXT;
    ALTER TABLE contract_clause_versions ADD COLUMN audience TEXT
      CHECK (audience IS NULL OR audience IN ('all', 'professional', 'consumer'));

    UPDATE contract_clause_versions
       SET code=(SELECT code FROM contract_clause_templates WHERE id=contract_clause_versions.clause_id),
           audience=(SELECT audience FROM contract_clause_templates WHERE id=contract_clause_versions.clause_id)
     WHERE code IS NULL OR audience IS NULL;

    CREATE TABLE contract_clause_code_aliases (
      alias_code TEXT PRIMARY KEY COLLATE NOCASE,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id) ON DELETE CASCADE,
      source_reference TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX idx_contract_clause_code_aliases_clause
      ON contract_clause_code_aliases(clause_id, alias_code COLLATE NOCASE);
  `,
};

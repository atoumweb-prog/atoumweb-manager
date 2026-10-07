import type { Migration } from './migrations';

/** Additive only; no seeds, publication, historical rewrites or automatic import. */
export const CONTRACT_LIBRARY_IMPORT_V1_MIGRATION: Migration = {
  id: 55,
  name: 'contract_library_import_v1_review_provenance',
  sql: `
    ALTER TABLE contract_clause_versions ADD COLUMN review_metadata_json TEXT
      CHECK (review_metadata_json IS NULL OR json_valid(review_metadata_json));
    CREATE TABLE contract_library_import_runs (
      id TEXT PRIMARY KEY,
      payload_sha256 TEXT NOT NULL UNIQUE,
      source_reference TEXT NOT NULL,
      source_sha256 TEXT NOT NULL,
      manifest_sha256 TEXT NOT NULL,
      document_sources_json TEXT NOT NULL CHECK (json_valid(document_sources_json)),
      summary_json TEXT NOT NULL CHECK (json_valid(summary_json)),
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE contract_library_import_entries (
      run_id TEXT NOT NULL REFERENCES contract_library_import_runs(id),
      clause_code TEXT NOT NULL,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id),
      version_id TEXT NOT NULL REFERENCES contract_clause_versions(id),
      source_record_sha256 TEXT NOT NULL,
      catalog_links_json TEXT NOT NULL CHECK (json_valid(catalog_links_json)),
      PRIMARY KEY (run_id,clause_code),
      UNIQUE (clause_id,version_id)
    ) STRICT;
  `,
};

import type { Migration } from './migrations';

export const CATALOG_IMPORT_V1_MIGRATION: Migration = {
  id: 54,
  name: 'catalog_import_v1_provenance',
  sql: `
    ALTER TABLE catalog_versions ADD COLUMN commercial_parameters_json TEXT
      CHECK (commercial_parameters_json IS NULL OR json_valid(commercial_parameters_json));
    CREATE TABLE catalog_import_runs (
      id TEXT PRIMARY KEY,
      payload_sha256 TEXT NOT NULL UNIQUE,
      source_sha256 TEXT NOT NULL,
      manifest_sha256 TEXT NOT NULL,
      summary_json TEXT NOT NULL CHECK (json_valid(summary_json)),
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE catalog_import_entries (
      run_id TEXT NOT NULL REFERENCES catalog_import_runs(id),
      entry_key TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('create','update','archive')),
      item_id TEXT NOT NULL REFERENCES catalog_items(id),
      from_version_id TEXT REFERENCES catalog_versions(id),
      to_version_id TEXT REFERENCES catalog_versions(id),
      source_record_sha256 TEXT,
      before_item_json TEXT CHECK (before_item_json IS NULL OR json_valid(before_item_json)),
      after_item_json TEXT NOT NULL CHECK (json_valid(after_item_json)),
      PRIMARY KEY (run_id,entry_key)
    ) STRICT;
    CREATE INDEX idx_catalog_import_record ON catalog_import_entries(item_id,source_record_sha256);
  `,
};

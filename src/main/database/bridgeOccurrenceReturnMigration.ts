import type { Migration } from './migrations';

export const BRIDGE_OCCURRENCE_RETURN_MIGRATION: Migration = {
  id: 39,
  name: 'bridge_occurrence_returns_v1',
  sql: `
    CREATE TABLE IF NOT EXISTS bridge_occurrence_returns (
      id TEXT PRIMARY KEY,
      package_fingerprint TEXT NOT NULL UNIQUE,
      site_occurrence_id TEXT NOT NULL,
      technical_item_id TEXT NOT NULL REFERENCES technical_items(id),
      technical_item_version_id TEXT NOT NULL REFERENCES technical_item_versions(id),
      source_version_number INTEGER NOT NULL CHECK (source_version_number >= 1),
      returned_at TEXT NOT NULL,
      occurrence_state TEXT NOT NULL,
      decision TEXT CHECK (decision IS NULL OR decision IN (
        'keep_occurrence', 'create_variant', 'update_variant', 'new_family'
      )),
      decided_at TEXT,
      changes_json TEXT NOT NULL,
      occurrence_json TEXT NOT NULL,
      assets_json TEXT NOT NULL,
      provenance_json TEXT NOT NULL,
      html_text TEXT NOT NULL,
      css_text TEXT,
      javascript_text TEXT,
      package_relative_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_bridge_occurrence_returns_occurrence
      ON bridge_occurrence_returns(site_occurrence_id, returned_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bridge_occurrence_returns_library
      ON bridge_occurrence_returns(technical_item_id, returned_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bridge_occurrence_returns_pending
      ON bridge_occurrence_returns(decision, returned_at DESC);
  `,
};

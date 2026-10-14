import type { Migration } from './migrations';

/** 04D — recommendations are version-scoped; existing quotes stay untouched. */
export const CATALOG_RECOMMENDATIONS_MIGRATION: Migration = {
  id: 68,
  name: 'catalog_version_recommendations_v1',
  sql: `
    CREATE TABLE catalog_version_recommendations (
      id TEXT PRIMARY KEY,
      source_version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE RESTRICT,
      target_version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE RESTRICT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(source_version_id, target_version_id),
      CHECK(source_version_id <> target_version_id)
    ) STRICT;
    CREATE INDEX idx_catalog_recommendations_source ON catalog_version_recommendations(source_version_id,sort_order);
    CREATE INDEX idx_catalog_recommendations_target ON catalog_version_recommendations(target_version_id);
  `,
};

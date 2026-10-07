import type { Migration } from './migrations';

export const ATOUMWEB_COMPOSITION_MIGRATION: Migration = {
  id: 43,
  name: 'atoumweb_multi_component_compositions_v1',
  sql: `
    CREATE TABLE atoumweb_compositions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_vertical TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','packaged','archived')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    ) STRICT;

    CREATE INDEX idx_atoumweb_compositions_status
      ON atoumweb_compositions(status, updated_at DESC);

    CREATE TABLE atoumweb_composition_items (
      id TEXT PRIMARY KEY,
      composition_id TEXT NOT NULL REFERENCES atoumweb_compositions(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL CHECK(sort_order >= 0),
      source_item_id TEXT NOT NULL REFERENCES technical_items(id),
      source_version_id TEXT NOT NULL REFERENCES technical_item_versions(id),
      source_version_number INTEGER NOT NULL CHECK(source_version_number >= 1),
      display_name TEXT NOT NULL,
      category TEXT NOT NULL,
      vertical TEXT,
      component_family_id TEXT,
      component_key TEXT,
      library_variant_id TEXT,
      variant_key TEXT,
      variant_mode TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(composition_id, sort_order)
    ) STRICT;

    CREATE INDEX idx_atoumweb_composition_items_composition
      ON atoumweb_composition_items(composition_id, sort_order);
    CREATE INDEX idx_atoumweb_composition_items_source
      ON atoumweb_composition_items(source_item_id, source_version_id);
  `,
};

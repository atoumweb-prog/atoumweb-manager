import type { Migration } from './migrations';

export const ATOUMWEB_COMPONENT_FAMILY_MIGRATION: Migration = {
  id: 40,
  name: 'atoumweb_component_families_variants_v1',
  sql: `
    CREATE TABLE IF NOT EXISTS atoumweb_component_families (
      id TEXT PRIMARY KEY,
      component_key TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL,
      vertical TEXT,
      reusability_scope TEXT NOT NULL CHECK (reusability_scope IN ('generic','vertical','site_specific')),
      base_item_id TEXT NOT NULL UNIQUE REFERENCES technical_items(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS atoumweb_component_variants (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES atoumweb_component_families(id) ON DELETE CASCADE,
      technical_item_id TEXT NOT NULL UNIQUE REFERENCES technical_items(id),
      variant_key TEXT NOT NULL,
      display_name TEXT NOT NULL,
      variant_mode TEXT NOT NULL CHECK (variant_mode IN ('base','inherit','forked')),
      variant_of_id TEXT REFERENCES atoumweb_component_variants(id),
      source_occurrence_return_id TEXT UNIQUE REFERENCES bridge_occurrence_returns(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (family_id, variant_key)
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_atoumweb_component_variants_family
      ON atoumweb_component_variants(family_id, variant_key);
    CREATE INDEX IF NOT EXISTS idx_atoumweb_component_variants_item
      ON atoumweb_component_variants(technical_item_id);
    CREATE INDEX IF NOT EXISTS idx_atoumweb_component_variants_occurrence
      ON atoumweb_component_variants(source_occurrence_return_id);

    ALTER TABLE bridge_occurrence_returns
      ADD COLUMN result_technical_item_id TEXT REFERENCES technical_items(id);
    ALTER TABLE bridge_occurrence_returns
      ADD COLUMN result_variant_id TEXT REFERENCES atoumweb_component_variants(id);
  `,
};

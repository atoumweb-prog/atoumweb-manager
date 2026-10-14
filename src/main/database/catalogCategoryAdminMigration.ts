import type { Migration } from './migrations';

/**
 * Lot 04B / E95 — registry, additive and empty by design.
 * A legacy item is NOT classified at migration time; a human reconciliation is required.
 * Quoted snapshots, commercial versions, codes, contract links and original categories
 * stay byte-for-byte untouched by this migration.
 */
export const CATALOG_CATEGORY_ADMIN_MIGRATION: Migration = {
  id: 70,
  name: 'catalog_category_registry_v1',
  sql: `
    CREATE TABLE catalog_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
      normalized_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
      revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    ) STRICT;

    ALTER TABLE catalog_items ADD COLUMN category_id TEXT REFERENCES catalog_categories(id) ON DELETE RESTRICT;
    CREATE INDEX idx_catalog_items_category_id ON catalog_items(category_id);

    CREATE TABLE catalog_category_audit (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL CHECK (action IN ('create','rename','archive','restore','assign','clear','reconcile')),
      category_id TEXT REFERENCES catalog_categories(id) ON DELETE RESTRICT,
      item_id TEXT REFERENCES catalog_items(id) ON DELETE RESTRICT,
      previous_name TEXT,
      new_name TEXT,
      previous_category TEXT,
      new_category TEXT,
      previous_category_id TEXT,
      new_category_id TEXT,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX idx_catalog_category_audit_category ON catalog_category_audit(category_id,created_at);
    CREATE INDEX idx_catalog_category_audit_item ON catalog_category_audit(item_id,created_at);
  `,
};

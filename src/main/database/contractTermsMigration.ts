import type { Migration } from './migrations';

export const CONTRACT_TERMS_MIGRATION: Migration = {
  id: 39,
  name: 'quote_contract_terms_builder_v1',
  sql: `
    CREATE TABLE contract_clause_templates (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      title TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('base', 'catalog')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      current_version_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    ) STRICT;

    CREATE INDEX idx_contract_clause_templates_scope
      ON contract_clause_templates(scope, status, sort_order, title COLLATE NOCASE);

    CREATE TABLE contract_clause_versions (
      id TEXT PRIMARY KEY,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL CHECK (version_number > 0),
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
      published_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (clause_id, version_number)
    ) STRICT;

    CREATE INDEX idx_contract_clause_versions_clause
      ON contract_clause_versions(clause_id, version_number DESC);

    CREATE TABLE catalog_contract_clause_links (
      catalog_item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      PRIMARY KEY (catalog_item_id, clause_id)
    ) STRICT;

    CREATE INDEX idx_catalog_contract_clause_links_clause
      ON catalog_contract_clause_links(clause_id, sort_order, catalog_item_id);

    CREATE TABLE quote_contract_clauses (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      source_key TEXT NOT NULL,
      source_kind TEXT NOT NULL CHECK (source_kind IN ('base', 'catalog', 'custom')),
      source_clause_id TEXT REFERENCES contract_clause_templates(id) ON DELETE SET NULL,
      source_clause_version_id TEXT REFERENCES contract_clause_versions(id) ON DELETE SET NULL,
      source_catalog_item_ids_json TEXT NOT NULL DEFAULT '[]',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
      is_customized INTEGER NOT NULL DEFAULT 0 CHECK (is_customized IN (0, 1)),
      is_orphaned INTEGER NOT NULL DEFAULT 0 CHECK (is_orphaned IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (quote_id, source_key)
    ) STRICT;

    CREATE INDEX idx_quote_contract_clauses_quote
      ON quote_contract_clauses(quote_id, sort_order, created_at);
    CREATE INDEX idx_quote_contract_clauses_template
      ON quote_contract_clauses(source_clause_id, quote_id);

    ALTER TABLE quotes ADD COLUMN contract_text_snapshot TEXT;
    ALTER TABLE quotes ADD COLUMN contract_snapshot_json TEXT;
    ALTER TABLE quotes ADD COLUMN contract_compiled_at TEXT;
  `,
};

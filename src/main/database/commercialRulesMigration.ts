import type { Migration } from './migrations';

export const COMMERCIAL_RULES_MIGRATION: Migration = {
  id: 63, name: 'versioned_commercial_rules_and_line_parameters',
  sql: `
    CREATE TABLE catalog_commercial_rules (
      catalog_version_id TEXT PRIMARY KEY REFERENCES catalog_versions(id) ON DELETE RESTRICT,
      rules_json TEXT NOT NULL CHECK(json_valid(rules_json)),
      provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)),
      updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TRIGGER commercial_rules_draft_insert BEFORE INSERT ON catalog_commercial_rules
      WHEN NOT EXISTS(SELECT 1 FROM catalog_versions WHERE id=NEW.catalog_version_id AND status='draft')
      BEGIN SELECT RAISE(ABORT,'Commercial rules require a draft catalogue version'); END;
    CREATE TRIGGER commercial_rules_draft_update BEFORE UPDATE ON catalog_commercial_rules
      WHEN OLD.catalog_version_id<>NEW.catalog_version_id OR NOT EXISTS(
        SELECT 1 FROM catalog_versions WHERE id=OLD.catalog_version_id AND status='draft')
      BEGIN SELECT RAISE(ABORT,'Published commercial rules are immutable'); END;
    CREATE TRIGGER commercial_rules_draft_delete BEFORE DELETE ON catalog_commercial_rules
      WHEN NOT EXISTS(SELECT 1 FROM catalog_versions WHERE id=OLD.catalog_version_id AND status='draft')
      BEGIN SELECT RAISE(ABORT,'Published commercial rules are immutable'); END;
    CREATE TABLE quote_line_parameters (
      line_id TEXT PRIMARY KEY REFERENCES quote_lines(id) ON DELETE CASCADE,
      parent_line_id TEXT REFERENCES quote_lines(id) ON DELETE SET NULL,
      parameters_json TEXT NOT NULL CHECK(json_valid(parameters_json)),
      updated_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX quote_line_parameters_parent ON quote_line_parameters(parent_line_id);
    CREATE TRIGGER quote_line_parameters_frozen_insert BEFORE INSERT ON quote_line_parameters
      WHEN EXISTS(SELECT 1 FROM quotes q JOIN quote_lines l ON l.quote_id=q.id WHERE l.id=NEW.line_id
        AND (q.status<>'draft' OR q.finalized_at IS NOT NULL))
      BEGIN SELECT RAISE(ABORT,'Quote line parameters are frozen'); END;
    CREATE TRIGGER quote_line_parameters_frozen_update BEFORE UPDATE ON quote_line_parameters
      WHEN EXISTS(SELECT 1 FROM quotes q JOIN quote_lines l ON l.quote_id=q.id WHERE l.id=OLD.line_id
        AND (q.status<>'draft' OR q.finalized_at IS NOT NULL))
      BEGIN SELECT RAISE(ABORT,'Quote line parameters are frozen'); END;
    CREATE TRIGGER quote_line_parameters_frozen_delete BEFORE DELETE ON quote_line_parameters
      WHEN EXISTS(SELECT 1 FROM quotes q JOIN quote_lines l ON l.quote_id=q.id WHERE l.id=OLD.line_id
        AND (q.status<>'draft' OR q.finalized_at IS NOT NULL))
      BEGIN SELECT RAISE(ABORT,'Quote line parameters are frozen'); END;
  `,
};

import type { Migration } from './migrations';

/** Composition references only. Clause texts and historical free-text labels are untouched. */
export const CONTRACT_TYPES_MIGRATION: Migration = {
  id: 66, name: 'versioned_contract_types', sql: `
    CREATE TABLE contract_types (
      id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
      current_version_id TEXT REFERENCES contract_type_versions(id),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
    ) STRICT;
    CREATE TABLE contract_type_versions (
      id TEXT PRIMARY KEY, contract_type_id TEXT NOT NULL REFERENCES contract_types(id),
      version_number INTEGER NOT NULL CHECK(version_number>0),
      name TEXT NOT NULL CHECK(length(trim(name))>0), description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','retired')),
      created_at TEXT NOT NULL, published_at TEXT,
      UNIQUE(contract_type_id,version_number)
    ) STRICT;
    CREATE TABLE contract_type_version_modules (
      contract_type_version_id TEXT NOT NULL REFERENCES contract_type_versions(id),
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id),
      sort_order INTEGER NOT NULL CHECK(sort_order>=0),
      PRIMARY KEY(contract_type_version_id,clause_id)
    ) STRICT;
    CREATE TABLE catalog_contract_type_links (
      catalog_version_id TEXT NOT NULL REFERENCES catalog_versions(id),
      contract_type_id TEXT NOT NULL REFERENCES contract_types(id),
      created_at TEXT NOT NULL,
      PRIMARY KEY(catalog_version_id,contract_type_id)
    ) STRICT;
    CREATE INDEX idx_contract_type_versions ON contract_type_versions(contract_type_id,version_number DESC);
    CREATE INDEX idx_contract_type_modules ON contract_type_version_modules(clause_id,contract_type_version_id);
    CREATE INDEX idx_catalog_contract_types ON catalog_contract_type_links(contract_type_id,catalog_version_id);
    CREATE TRIGGER contract_type_current_guard BEFORE UPDATE OF current_version_id ON contract_types
      WHEN NEW.current_version_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM contract_type_versions
        WHERE id=NEW.current_version_id AND contract_type_id=NEW.id AND status='published')
      BEGIN SELECT RAISE(ABORT,'Contract type requires its own published version'); END;
    CREATE TRIGGER contract_type_version_no_demotion BEFORE UPDATE OF status ON contract_type_versions
      WHEN OLD.status<>'draft' AND NEW.status='draft'
      BEGIN SELECT RAISE(ABORT,'Published type versions cannot return to draft'); END;
    CREATE TRIGGER contract_type_version_immutable BEFORE UPDATE OF contract_type_id,version_number,name,description,created_at ON contract_type_versions
      WHEN OLD.status<>'draft' BEGIN SELECT RAISE(ABORT,'Published type composition must be versioned'); END;
    CREATE TRIGGER contract_type_version_no_delete BEFORE DELETE ON contract_type_versions
      BEGIN SELECT RAISE(ABORT,'Archive contract types instead of deleting history'); END;
    CREATE TRIGGER contract_type_no_delete BEFORE DELETE ON contract_types
      BEGIN SELECT RAISE(ABORT,'Archive contract types instead of deleting history'); END;
    CREATE TRIGGER contract_type_module_insert BEFORE INSERT ON contract_type_version_modules
      WHEN NOT EXISTS(SELECT 1 FROM contract_type_versions WHERE id=NEW.contract_type_version_id AND status='draft')
        OR NOT EXISTS(SELECT 1 FROM contract_clause_templates WHERE id=NEW.clause_id AND scope='catalog')
      BEGIN SELECT RAISE(ABORT,'Type modules require a draft composition and a catalogue clause'); END;
    CREATE TRIGGER contract_type_module_update BEFORE UPDATE ON contract_type_version_modules
      BEGIN SELECT RAISE(ABORT,'Replace modules only within a draft composition'); END;
    CREATE TRIGGER contract_type_module_delete BEFORE DELETE ON contract_type_version_modules
      WHEN NOT EXISTS(SELECT 1 FROM contract_type_versions WHERE id=OLD.contract_type_version_id AND status='draft')
      BEGIN SELECT RAISE(ABORT,'Published type composition must be versioned'); END;
    CREATE TRIGGER catalog_contract_type_insert BEFORE INSERT ON catalog_contract_type_links
      WHEN EXISTS(SELECT 1 FROM quote_lines WHERE catalog_version_id=NEW.catalog_version_id)
        OR EXISTS(SELECT 1 FROM quote_lines q,json_each(q.snapshot_json,'$.offerComponents') c
          WHERE json_extract(c.value,'$.serviceVersionId')=NEW.catalog_version_id AND COALESCE(json_extract(c.value,'$.isOptional'),0)=0)
        OR EXISTS(SELECT 1 FROM project_services WHERE catalog_version_id=NEW.catalog_version_id)
        OR EXISTS(SELECT 1 FROM project_node_sources WHERE catalog_version_id=NEW.catalog_version_id)
      BEGIN SELECT RAISE(ABORT,'Sold catalogue version: create a new commercial version'); END;
    CREATE TRIGGER catalog_contract_type_update BEFORE UPDATE ON catalog_contract_type_links
      BEGIN SELECT RAISE(ABORT,'Replace catalogue type references on an unused draft version'); END;
    CREATE TRIGGER catalog_contract_type_delete BEFORE DELETE ON catalog_contract_type_links
      WHEN EXISTS(SELECT 1 FROM catalog_versions WHERE id=OLD.catalog_version_id AND status<>'draft')
        OR EXISTS(SELECT 1 FROM quote_lines WHERE catalog_version_id=OLD.catalog_version_id)
        OR EXISTS(SELECT 1 FROM quote_lines q,json_each(q.snapshot_json,'$.offerComponents') c
          WHERE json_extract(c.value,'$.serviceVersionId')=OLD.catalog_version_id AND COALESCE(json_extract(c.value,'$.isOptional'),0)=0)
        OR EXISTS(SELECT 1 FROM project_services WHERE catalog_version_id=OLD.catalog_version_id)
        OR EXISTS(SELECT 1 FROM project_node_sources WHERE catalog_version_id=OLD.catalog_version_id)
      BEGIN SELECT RAISE(ABORT,'Catalogue type references are immutable once published or sold'); END;
  `,
};

import type { Migration } from './migrations';

/** Schema only. No reference import, publication, historical requalification or operational activation. */
export const PROJECT_OPERATIONAL_MIGRATION: Migration = {
  id: 60, name: 'versioned_operational_actions_and_time_snapshots',
  sql: `
    CREATE TABLE operational_import_runs (
      id TEXT PRIMARY KEY, source_sha256 TEXT NOT NULL, payload_sha256 TEXT NOT NULL UNIQUE,
      manifest_json TEXT NOT NULL CHECK(json_valid(manifest_json)), created_at TEXT NOT NULL
    ) STRICT;
    CREATE TRIGGER operational_import_immutable BEFORE UPDATE ON operational_import_runs
      BEGIN SELECT RAISE(ABORT,'Operational import provenance is immutable'); END;
    CREATE TRIGGER operational_import_no_delete BEFORE DELETE ON operational_import_runs
      BEGIN SELECT RAISE(ABORT,'Operational import history must be retained'); END;
    CREATE TABLE operational_model_versions (
      id TEXT PRIMARY KEY, catalog_item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
      canonical_code TEXT NOT NULL, version_number INTEGER NOT NULL CHECK(version_number>=1),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready')),
      import_run_id TEXT NOT NULL REFERENCES operational_import_runs(id) ON DELETE RESTRICT,
      content_sha256 TEXT NOT NULL, model_json TEXT NOT NULL CHECK(json_valid(model_json)), created_at TEXT NOT NULL,
      UNIQUE(catalog_item_id,version_number), UNIQUE(catalog_item_id,content_sha256)
    ) STRICT;
    CREATE TRIGGER operational_model_content_immutable BEFORE UPDATE OF catalog_item_id,canonical_code,version_number,import_run_id,content_sha256,model_json ON operational_model_versions
      BEGIN SELECT RAISE(ABORT,'Operational model content is immutable'); END;
    CREATE TRIGGER operational_model_no_delete BEFORE DELETE ON operational_model_versions
      BEGIN SELECT RAISE(ABORT,'Operational model history must be retained'); END;
    CREATE TABLE blueprint_operational_profiles (
      template_version_id TEXT PRIMARY KEY REFERENCES project_template_versions(id) ON DELETE RESTRICT,
      mode TEXT NOT NULL CHECK(mode IN ('historical_complete','structural')),
      requires_operational INTEGER NOT NULL CHECK(requires_operational IN (0,1)),
      provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)),
      operational_ready INTEGER NOT NULL DEFAULT 0 CHECK(operational_ready IN (0,1))
    ) STRICT;
    CREATE TRIGGER operational_profile_immutable BEFORE UPDATE OF template_version_id,mode,requires_operational,provenance_json ON blueprint_operational_profiles
      BEGIN SELECT RAISE(ABORT,'Blueprint operational profile is immutable'); END;
    CREATE TRIGGER operational_profile_no_delete BEFORE DELETE ON blueprint_operational_profiles
      BEGIN SELECT RAISE(ABORT,'Blueprint operational profile must be retained'); END;
    CREATE TRIGGER operational_profile_ready_monotonic BEFORE UPDATE OF operational_ready ON blueprint_operational_profiles
      WHEN OLD.operational_ready=1 AND NEW.operational_ready<>1
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint must be versioned'); END;
    CREATE TRIGGER operational_structure_node_insert BEFORE INSERT ON project_template_nodes
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles WHERE template_version_id=NEW.template_version_id AND operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_node_update BEFORE UPDATE ON project_template_nodes
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles WHERE template_version_id IN (OLD.template_version_id,NEW.template_version_id) AND operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_node_delete BEFORE DELETE ON project_template_nodes
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles WHERE template_version_id=OLD.template_version_id AND operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_site_insert BEFORE INSERT ON project_template_sites
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles WHERE template_version_id=NEW.template_version_id AND operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_site_update BEFORE UPDATE ON project_template_sites
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles WHERE template_version_id IN (OLD.template_version_id,NEW.template_version_id) AND operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_site_delete BEFORE DELETE ON project_template_sites
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles WHERE template_version_id=OLD.template_version_id AND operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_page_insert BEFORE INSERT ON project_template_site_pages
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles o JOIN project_template_sites s ON s.template_version_id=o.template_version_id WHERE s.id=NEW.template_site_id AND o.operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_page_update BEFORE UPDATE ON project_template_site_pages
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles o JOIN project_template_sites s ON s.template_version_id=o.template_version_id WHERE s.id IN (OLD.template_site_id,NEW.template_site_id) AND o.operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TRIGGER operational_structure_page_delete BEFORE DELETE ON project_template_site_pages
      WHEN EXISTS(SELECT 1 FROM blueprint_operational_profiles o JOIN project_template_sites s ON s.template_version_id=o.template_version_id WHERE s.id=OLD.template_site_id AND o.operational_ready=1)
      BEGIN SELECT RAISE(ABORT,'Ready structural blueprint is immutable'); END;
    CREATE TABLE catalog_operational_links (
      id TEXT PRIMARY KEY, catalog_version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE RESTRICT,
      model_version_id TEXT NOT NULL REFERENCES operational_model_versions(id) ON DELETE RESTRICT,
      blueprint_version_id TEXT REFERENCES blueprint_operational_profiles(template_version_id) ON DELETE RESTRICT,
      revision INTEGER NOT NULL CHECK(revision>=1), provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)),
      created_at TEXT NOT NULL, UNIQUE(catalog_version_id,revision)
    ) STRICT;
    CREATE TRIGGER operational_link_immutable BEFORE UPDATE ON catalog_operational_links
      BEGIN SELECT RAISE(ABORT,'Operational compatibility revision is immutable'); END;
    CREATE TRIGGER operational_link_no_delete BEFORE DELETE ON catalog_operational_links
      BEGIN SELECT RAISE(ABORT,'Operational compatibility history must be retained'); END;
    ALTER TABLE project_nodes ADD COLUMN business_category TEXT
      CHECK(business_category IS NULL OR business_category IN ('Inclus au forfait','Supplément facturable','Avant-vente','Interne','Garantie corrective'));
    ALTER TABLE time_sessions ADD COLUMN business_category TEXT
      CHECK(business_category IS NULL OR business_category IN ('Inclus au forfait','Supplément facturable','Avant-vente','Interne','Garantie corrective'));
    CREATE TABLE project_action_instances (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      source_key TEXT NOT NULL, project_node_id TEXT NOT NULL UNIQUE REFERENCES project_nodes(id) ON DELETE RESTRICT,
      initial_snapshot_json TEXT NOT NULL CHECK(json_valid(initial_snapshot_json)),
      PRIMARY KEY(project_id,source_key)
    ) STRICT;
    CREATE TRIGGER operational_initial_snapshot_immutable BEFORE UPDATE ON project_action_instances
      BEGIN SELECT RAISE(ABORT,'Initial operational reference is immutable'); END;
    CREATE TRIGGER operational_worked_instance_no_delete BEFORE DELETE ON project_action_instances
      WHEN EXISTS(SELECT 1 FROM time_sessions WHERE project_node_id=OLD.project_node_id)
      BEGIN SELECT RAISE(ABORT,'Worked operational provenance must be retained'); END;
    CREATE TRIGGER operational_worked_node_no_delete BEFORE DELETE ON project_nodes
      WHEN EXISTS(SELECT 1 FROM project_action_instances a JOIN time_sessions t ON t.project_node_id=a.project_node_id WHERE a.project_node_id=OLD.id)
      BEGIN SELECT RAISE(ABORT,'Worked operational action must be retained'); END;
  `,
};

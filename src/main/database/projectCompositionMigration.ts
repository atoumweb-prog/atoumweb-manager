import type { Migration } from './migrations';

// Additive only: no project, sold line, catalogue publication or backfill.
export const PROJECT_COMPOSITION_MIGRATION: Migration = {
  id: 58, name: 'sold_blueprint_compositions_v1',
  sql: `
    ALTER TABLE catalog_project_blueprints ADD COLUMN quantity_mode TEXT NOT NULL DEFAULT 'once'
      CHECK(quantity_mode IN ('once','per_unit'));
    ALTER TABLE catalog_project_blueprints ADD COLUMN site_mode TEXT NOT NULL DEFAULT 'create'
      CHECK(site_mode IN ('create','extend_base'));
    CREATE TABLE project_blueprint_plans (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      source_quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
      plan_json TEXT NOT NULL CHECK(json_valid(plan_json)),
      plan_sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TRIGGER project_blueprint_plan_immutable BEFORE UPDATE ON project_blueprint_plans
      BEGIN SELECT RAISE(ABORT,'Frozen project blueprint plan'); END;
    CREATE TABLE project_composed_node_bindings (
      project_id TEXT NOT NULL REFERENCES project_blueprint_plans(project_id) ON DELETE CASCADE,
      contribution_key TEXT NOT NULL,
      unit_index INTEGER NOT NULL CHECK(unit_index>=1),
      template_node_id TEXT NOT NULL REFERENCES project_template_nodes(id) ON DELETE RESTRICT,
      project_node_id TEXT NOT NULL REFERENCES project_nodes(id) ON DELETE RESTRICT,
      PRIMARY KEY(project_id,contribution_key,unit_index,template_node_id)
    ) STRICT;
    CREATE INDEX idx_composed_node_provenance ON project_composed_node_bindings(project_node_id);
    CREATE TABLE project_composed_site_bindings (
      project_id TEXT NOT NULL REFERENCES project_blueprint_plans(project_id) ON DELETE CASCADE,
      contribution_key TEXT NOT NULL,
      unit_index INTEGER NOT NULL CHECK(unit_index>=1),
      site_key TEXT NOT NULL,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      PRIMARY KEY(project_id,contribution_key,unit_index,site_key)
    ) STRICT;
    CREATE TABLE project_composed_prerequisite_sources (
      project_prerequisite_id TEXT NOT NULL REFERENCES project_prerequisites(id) ON DELETE CASCADE,
      source_key TEXT NOT NULL,
      provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)),
      PRIMARY KEY(project_prerequisite_id,source_key)
    ) STRICT;
  `,
};

import type { Migration } from './migrations';

/** No historical lifecycle inference. Rebuild only relaxes ownership for explicit provisional projects. */
export const PROJECT_PROVISIONAL_MIGRATION: Migration = {
  id: 59, name: 'provisional_projects_commercial_revisions', disableForeignKeys: true,
  sql: `
    CREATE TABLE commercial_project_dossiers (
      id TEXT PRIMARY KEY, project_id TEXT UNIQUE REFERENCES projects(id),
      current_quote_id TEXT NOT NULL REFERENCES quotes(id),
      accepted_quote_id TEXT REFERENCES quotes(id), explicit_template_version_id TEXT REFERENCES project_template_versions(id), created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE commercial_quote_revisions (
      quote_id TEXT PRIMARY KEY REFERENCES quotes(id) ON DELETE RESTRICT,
      dossier_id TEXT NOT NULL REFERENCES commercial_project_dossiers(id),
      revision_number INTEGER NOT NULL CHECK(revision_number>=1),
      parent_quote_id TEXT REFERENCES quotes(id), created_at TEXT NOT NULL,
      UNIQUE(dossier_id,revision_number)
    ) STRICT;
    CREATE TABLE commercial_quote_line_origins (
      line_id TEXT PRIMARY KEY REFERENCES quote_lines(id) ON DELETE CASCADE,
      origin_id TEXT NOT NULL, dossier_id TEXT NOT NULL REFERENCES commercial_project_dossiers(id),
      UNIQUE(line_id,dossier_id)
    ) STRICT;
    CREATE TABLE projects_provisional (
      id TEXT PRIMARY KEY, project_number TEXT NOT NULL UNIQUE,
      client_account_id TEXT REFERENCES client_accounts(id), source_quote_id TEXT UNIQUE REFERENCES quotes(id),
      template_version_id TEXT REFERENCES project_template_versions(id), name TEXT NOT NULL, project_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'to_prepare' CHECK(status IN ('to_prepare','in_progress','waiting_client','blocked','to_validate','completed','archived')),
      commercial_mode TEXT NOT NULL DEFAULT 'normal' CHECK(commercial_mode IN ('normal','discounted','free','partnership','internal')),
      start_date TEXT, target_date TEXT,
      commercial_value_cents INTEGER NOT NULL DEFAULT 0 CHECK(commercial_value_cents>=0),
      contract_value_cents INTEGER NOT NULL DEFAULT 0 CHECK(contract_value_cents>=0),
      resource_root_path TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT, archived_at TEXT,
      prospect_id TEXT REFERENCES prospects(id),
      commercial_state TEXT NOT NULL DEFAULT 'legacy' CHECK(commercial_state IN ('legacy','provisional','frozen')),
      commercial_dossier_id TEXT UNIQUE REFERENCES commercial_project_dossiers(id),
      accepted_quote_id TEXT REFERENCES quotes(id), scope_frozen_at TEXT,
      CHECK(project_type='internal' OR client_account_id IS NOT NULL OR (commercial_state='provisional' AND prospect_id IS NOT NULL)),
      CHECK(commercial_state!='frozen' OR (client_account_id IS NOT NULL AND accepted_quote_id IS NOT NULL AND scope_frozen_at IS NOT NULL))
    ) STRICT;
    INSERT INTO projects_provisional(id,project_number,client_account_id,source_quote_id,template_version_id,name,project_type,status,commercial_mode,
      start_date,target_date,commercial_value_cents,contract_value_cents,resource_root_path,notes,created_at,updated_at,completed_at,archived_at)
    SELECT id,project_number,client_account_id,source_quote_id,template_version_id,name,project_type,status,commercial_mode,
      start_date,target_date,commercial_value_cents,contract_value_cents,resource_root_path,notes,created_at,updated_at,completed_at,archived_at FROM projects;
    DROP TABLE projects;
    ALTER TABLE projects_provisional RENAME TO projects;
    CREATE INDEX idx_projects_client_status ON projects(client_account_id,status,archived_at);
    CREATE INDEX idx_projects_type_status ON projects(project_type,status);
    CREATE TABLE project_commercial_scope_revisions (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
      quote_id TEXT NOT NULL REFERENCES quotes(id), commercial_revision INTEGER NOT NULL,
      sequence INTEGER NOT NULL, plan_json TEXT NOT NULL CHECK(json_valid(plan_json)),
      lines_json TEXT NOT NULL CHECK(json_valid(lines_json)), scope_sha256 TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(project_id,sequence)
    ) STRICT;
    CREATE TRIGGER commercial_scope_revision_immutable BEFORE UPDATE ON project_commercial_scope_revisions
      BEGIN SELECT RAISE(ABORT,'Commercial scope revision is immutable'); END;
    CREATE TRIGGER commercial_scope_revision_no_delete BEFORE DELETE ON project_commercial_scope_revisions
      BEGIN SELECT RAISE(ABORT,'Commercial scope history must be retained'); END;
    CREATE TABLE project_prepared_node_bindings (
      project_id TEXT NOT NULL REFERENCES projects(id), contribution_key TEXT NOT NULL,
      unit_index INTEGER NOT NULL, template_node_id TEXT NOT NULL REFERENCES project_template_nodes(id),
      project_node_id TEXT NOT NULL REFERENCES project_nodes(id) ON DELETE RESTRICT,
      PRIMARY KEY(project_id,contribution_key,unit_index,template_node_id)
    ) STRICT;
    CREATE TABLE project_prepared_site_bindings (
      project_id TEXT NOT NULL REFERENCES projects(id), contribution_key TEXT NOT NULL,
      unit_index INTEGER NOT NULL, site_key TEXT NOT NULL,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      PRIMARY KEY(project_id,contribution_key,unit_index,site_key)
    ) STRICT;
    CREATE TABLE project_scope_entities (
      project_id TEXT NOT NULL REFERENCES projects(id), entity_kind TEXT NOT NULL CHECK(entity_kind IN ('node','site','prerequisite')),
      entity_id TEXT NOT NULL, baseline_json TEXT NOT NULL CHECK(json_valid(baseline_json)),
      state TEXT NOT NULL CHECK(state IN ('active','out_of_scope','kept','detached','archived','removed')),
      PRIMARY KEY(project_id,entity_kind,entity_id)
    ) STRICT;
    CREATE TABLE project_scope_conflicts (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
      entity_kind TEXT NOT NULL, entity_id TEXT NOT NULL, reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
      decision TEXT CHECK(decision IN ('keep','archive','detach','delete')), created_at TEXT NOT NULL, resolved_at TEXT
    ) STRICT;
    CREATE UNIQUE INDEX idx_scope_conflict_open ON project_scope_conflicts(project_id,entity_kind,entity_id) WHERE status='open';
    ALTER TABLE project_nodes ADD COLUMN archived_at TEXT;
    ALTER TABLE project_prerequisites ADD COLUMN archived_at TEXT;
    ${['maintenance_subscriptions','hour_packs','service_requests','interventions','billing_items'].map(table=>`
      CREATE TRIGGER ${table}_no_provisional_insert BEFORE INSERT ON ${table}
        WHEN EXISTS(SELECT 1 FROM projects WHERE id=NEW.project_id AND commercial_state='provisional')
        BEGIN SELECT RAISE(ABORT,'Projet prévisionnel : opération interdite avant acceptation'); END;
      CREATE TRIGGER ${table}_no_provisional_update BEFORE UPDATE OF project_id ON ${table}
        WHEN EXISTS(SELECT 1 FROM projects WHERE id=NEW.project_id AND commercial_state='provisional')
        BEGIN SELECT RAISE(ABORT,'Projet prévisionnel : opération interdite avant acceptation'); END;
    `).join('\n')}
    CREATE TEMP TABLE provisional_migration_integrity(ok INTEGER CHECK(ok=0));
    INSERT INTO provisional_migration_integrity SELECT count(*) FROM pragma_foreign_key_check;
    DROP TABLE provisional_migration_integrity;
  `,
};

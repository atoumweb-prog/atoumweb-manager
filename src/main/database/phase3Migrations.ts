export const PHASE_3_MIGRATIONS = [
  {
    id: 7,
    name: 'phase_3_projects_core',
    sql: `
      CREATE TABLE IF NOT EXISTS project_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        project_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_project_templates_type_name
        ON project_templates(project_type, name COLLATE NOCASE)
        WHERE archived_at IS NULL;

      CREATE TABLE IF NOT EXISTS project_template_versions (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL CHECK (version_number > 0),
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
        description TEXT,
        published_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE (template_id, version_number)
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_project_template_one_published
        ON project_template_versions(template_id)
        WHERE status='published';

      CREATE TABLE IF NOT EXISTS project_template_nodes (
        id TEXT PRIMARY KEY,
        template_version_id TEXT NOT NULL REFERENCES project_template_versions(id) ON DELETE CASCADE,
        parent_id TEXT REFERENCES project_template_nodes(id) ON DELETE CASCADE,
        node_type TEXT NOT NULL CHECK (node_type IN ('lot', 'module', 'task', 'checklist')),
        display_subtype TEXT,
        name TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
        is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
        initial_status TEXT NOT NULL DEFAULT 'todo' CHECK (initial_status IN ('todo', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'done')),
        time_category TEXT,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_project_template_nodes_tree
        ON project_template_nodes(template_version_id, parent_id, sort_order);

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        project_number TEXT NOT NULL UNIQUE,
        client_account_id TEXT REFERENCES client_accounts(id),
        source_quote_id TEXT UNIQUE REFERENCES quotes(id),
        template_version_id TEXT REFERENCES project_template_versions(id),
        name TEXT NOT NULL,
        project_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'to_prepare' CHECK (status IN ('to_prepare', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'completed', 'archived')),
        commercial_mode TEXT NOT NULL DEFAULT 'normal' CHECK (commercial_mode IN ('normal', 'discounted', 'free', 'partnership', 'internal')),
        start_date TEXT,
        target_date TEXT,
        commercial_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (commercial_value_cents >= 0),
        contract_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (contract_value_cents >= 0),
        resource_root_path TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        archived_at TEXT,
        CHECK (project_type='internal' OR client_account_id IS NOT NULL)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_projects_client_status
        ON projects(client_account_id, status, archived_at);
      CREATE INDEX IF NOT EXISTS idx_projects_type_status
        ON projects(project_type, status);

      CREATE TABLE IF NOT EXISTS project_nodes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        parent_id TEXT REFERENCES project_nodes(id) ON DELETE CASCADE,
        source_template_node_id TEXT REFERENCES project_template_nodes(id),
        node_type TEXT NOT NULL CHECK (node_type IN ('lot', 'module', 'task', 'checklist')),
        display_subtype TEXT,
        name TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
        is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'done')),
        time_category TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_project_nodes_tree
        ON project_nodes(project_id, parent_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_project_nodes_status
        ON project_nodes(project_id, status, is_required);

      CREATE TABLE IF NOT EXISTS project_services (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        source_quote_line_id TEXT REFERENCES quote_lines(id),
        catalog_item_id TEXT REFERENCES catalog_items(id),
        catalog_version_id TEXT REFERENCES catalog_versions(id),
        label TEXT NOT NULL,
        snapshot_json TEXT,
        catalog_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (catalog_value_cents >= 0),
        contract_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (contract_value_cents >= 0),
        created_at TEXT NOT NULL,
        UNIQUE (project_id, source_quote_line_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_project_services_project
        ON project_services(project_id);

      CREATE TABLE IF NOT EXISTS project_prerequisites (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'to_request' CHECK (status IN ('to_request', 'requested', 'received', 'incomplete', 'validated', 'not_applicable')),
        is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
        sort_order INTEGER NOT NULL DEFAULT 0,
        requested_at TEXT,
        received_at TEXT,
        validated_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_project_prerequisites_project
        ON project_prerequisites(project_id, status, sort_order);

      ALTER TABLE quotes ADD COLUMN project_id TEXT REFERENCES projects(id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_project
        ON quotes(project_id)
        WHERE project_id IS NOT NULL;
    `,
  },
];

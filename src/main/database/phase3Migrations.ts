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
  {
    id: 8,
    name: 'phase_3_project_resources',
    sql: `
      CREATE TABLE IF NOT EXISTS file_assets (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        client_account_id TEXT REFERENCES client_accounts(id),
        relative_path TEXT NOT NULL,
        original_name TEXT NOT NULL,
        resource_folder TEXT NOT NULL CHECK (resource_folder IN ('identity', 'texts', 'media', 'documents', 'technical', 'deliverables', 'archives')),
        resource_status TEXT NOT NULL DEFAULT 'received' CHECK (resource_status IN ('received', 'to_process', 'in_progress', 'validated', 'obsolete')),
        content_role TEXT NOT NULL DEFAULT 'other' CHECK (content_role IN ('client_provided', 'atoumweb_rewrite', 'final_validated', 'other')),
        mime_type TEXT,
        size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
        checksum_sha256 TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        missing_at TEXT,
        UNIQUE (project_id, relative_path)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_file_assets_project
        ON file_assets(project_id, resource_folder, resource_status);
      CREATE INDEX IF NOT EXISTS idx_file_assets_client
        ON file_assets(client_account_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_file_assets_checksum
        ON file_assets(checksum_sha256);

      CREATE TABLE IF NOT EXISTS file_asset_links (
        id TEXT PRIMARY KEY,
        file_asset_id TEXT NOT NULL REFERENCES file_assets(id) ON DELETE CASCADE,
        project_node_id TEXT NOT NULL REFERENCES project_nodes(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        UNIQUE (file_asset_id, project_node_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_file_asset_links_node
        ON file_asset_links(project_node_id, created_at DESC);
    `,
  },
  {
    id: 9,
    name: 'phase_3_project_technical_library',
    sql: `
      CREATE TABLE IF NOT EXISTS technical_items (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        scope TEXT NOT NULL DEFAULT 'project' CHECK (scope IN ('project', 'atoumweb')),
        category TEXT NOT NULL CHECK (category IN (
          'header', 'footer', 'hero', 'page', 'section', 'css', 'javascript',
          'php', 'acf', 'divi', 'woocommerce', 'plugin', 'config', 'note', 'other'
        )),
        name TEXT NOT NULL,
        description TEXT,
        tags_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        CHECK (
          (scope='project' AND project_id IS NOT NULL)
          OR (scope='atoumweb' AND project_id IS NULL)
        )
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_technical_items_project
        ON technical_items(project_id, category, archived_at);
      CREATE INDEX IF NOT EXISTS idx_technical_items_scope
        ON technical_items(scope, category, archived_at);
      CREATE INDEX IF NOT EXISTS idx_technical_items_name
        ON technical_items(name COLLATE NOCASE);

      CREATE TABLE IF NOT EXISTS technical_item_versions (
        id TEXT PRIMARY KEY,
        technical_item_id TEXT NOT NULL REFERENCES technical_items(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL CHECK (version_number > 0),
        content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('code', 'json', 'text', 'reference')),
        language TEXT,
        content_text TEXT,
        notes TEXT,
        is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
        is_stable INTEGER NOT NULL DEFAULT 0 CHECK (is_stable IN (0, 1)),
        created_at TEXT NOT NULL,
        UNIQUE (technical_item_id, version_number)
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_technical_item_one_current
        ON technical_item_versions(technical_item_id)
        WHERE is_current = 1;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_technical_item_one_stable
        ON technical_item_versions(technical_item_id)
        WHERE is_stable = 1;

      CREATE TABLE IF NOT EXISTS technical_item_assets (
        id TEXT PRIMARY KEY,
        technical_item_version_id TEXT NOT NULL REFERENCES technical_item_versions(id) ON DELETE CASCADE,
        file_asset_id TEXT NOT NULL REFERENCES file_assets(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        UNIQUE (technical_item_version_id, file_asset_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_technical_item_assets_version
        ON technical_item_assets(technical_item_version_id);
    `,
  },
  {
    id: 10,
    name: 'phase_3_time_sessions',
    sql: `
      CREATE TABLE IF NOT EXISTS time_sessions (
        id TEXT PRIMARY KEY,
        client_account_id TEXT REFERENCES client_accounts(id),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        project_node_id TEXT REFERENCES project_nodes(id) ON DELETE SET NULL,
        intervention_id TEXT,
        category TEXT NOT NULL CHECK (category IN (
          'production', 'development', 'design', 'meeting', 'support',
          'client_correction', 'internal_correction', 'research_training', 'administrative', 'other'
        )),
        activity_label TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        billable INTEGER NOT NULL DEFAULT 1 CHECK (billable IN (0, 1)),
        source TEXT NOT NULL DEFAULT 'timer' CHECK (source IN ('timer', 'manual', 'import')),
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (ended_at IS NULL OR ended_at >= started_at)
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_time_sessions_one_active
        ON time_sessions((1))
        WHERE ended_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_time_sessions_project
        ON time_sessions(project_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_time_sessions_client
        ON time_sessions(client_account_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_time_sessions_category
        ON time_sessions(category, started_at DESC);

      CREATE TABLE IF NOT EXISTS time_session_pauses (
        id TEXT PRIMARY KEY,
        time_session_id TEXT NOT NULL REFERENCES time_sessions(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        created_at TEXT NOT NULL,
        CHECK (ended_at IS NULL OR ended_at >= started_at)
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_time_session_one_open_pause
        ON time_session_pauses(time_session_id)
        WHERE ended_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_time_session_pauses_session
        ON time_session_pauses(time_session_id, started_at);
    `,
  },
];
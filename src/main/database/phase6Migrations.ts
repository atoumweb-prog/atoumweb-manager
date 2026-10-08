export const PHASE_6_MIGRATIONS = [
  {
    id: 22,
    name: 'phase_6_global_technical_library',
    sql: `
      ALTER TABLE technical_items
        ADD COLUMN reuse_status TEXT
        CHECK (reuse_status IS NULL OR reuse_status IN ('ready', 'adapt', 'reference'));

      ALTER TABLE technical_items
        ADD COLUMN origin_technical_item_id TEXT
        REFERENCES technical_items(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_technical_items_reuse_status
        ON technical_items(scope, reuse_status, archived_at);

      CREATE INDEX IF NOT EXISTS idx_technical_items_origin
        ON technical_items(origin_technical_item_id);
    `,
  },
  {
    id: 23,
    name: 'phase_6_global_library_categories',
    sql: `
      ALTER TABLE technical_items
        ADD COLUMN library_category TEXT
        CHECK (library_category IS NULL OR library_category IN (
          'header', 'footer', 'hero', 'page', 'section', 'form', 'gallery',
          'carousel', 'navigation', 'css', 'javascript', 'php', 'woocommerce',
          'acf', 'divi', 'app', 'note'
        ));

      CREATE INDEX IF NOT EXISTS idx_technical_items_library_category
        ON technical_items(scope, library_category, archived_at);
    `,
  },
  {
    id: 24,
    name: 'phase_6_global_library_assets',
    sql: `
      CREATE TABLE IF NOT EXISTS atoumweb_technical_assets (
        id TEXT PRIMARY KEY,
        technical_item_version_id TEXT NOT NULL REFERENCES technical_item_versions(id) ON DELETE CASCADE,
        asset_role TEXT NOT NULL CHECK (asset_role IN ('screenshot', 'preview', 'source', 'attachment')),
        relative_path TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
        checksum_sha256 TEXT NOT NULL,
        created_at TEXT NOT NULL,
        missing_at TEXT,
        UNIQUE (technical_item_version_id, checksum_sha256)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_atoumweb_technical_assets_version
        ON atoumweb_technical_assets(technical_item_version_id, asset_role, created_at DESC);
    `,
  },
  {
    id: 25,
    name: 'phase_6_business_backup_records',
    sql: `
      CREATE TABLE IF NOT EXISTS backup_records (
        id TEXT PRIMARY KEY,
        client_account_id TEXT REFERENCES client_accounts(id) ON DELETE SET NULL,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        backup_type TEXT NOT NULL CHECK (backup_type IN (
          'complete', 'database', 'files_code', 'config_export',
          'pre_intervention', 'post_validation', 'other'
        )),
        label TEXT NOT NULL,
        backup_at TEXT NOT NULL,
        size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
        checksum_sha256 TEXT,
        is_stable INTEGER NOT NULL DEFAULT 0 CHECK (is_stable IN (0,1)),
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (client_account_id IS NOT NULL OR project_id IS NOT NULL)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_backup_records_project
        ON backup_records(project_id, backup_at DESC);
      CREATE INDEX IF NOT EXISTS idx_backup_records_client
        ON backup_records(client_account_id, backup_at DESC);
      CREATE INDEX IF NOT EXISTS idx_backup_records_stable
        ON backup_records(project_id, client_account_id, is_stable, backup_at DESC);

      CREATE TABLE IF NOT EXISTS backup_locations (
        id TEXT PRIMARY KEY,
        backup_record_id TEXT NOT NULL REFERENCES backup_records(id) ON DELETE CASCADE,
        location_type TEXT NOT NULL CHECK (location_type IN ('server', 'local', 'external', 'other')),
        label TEXT NOT NULL,
        path_or_reference TEXT NOT NULL,
        verified_at TEXT,
        last_checked_at TEXT,
        missing_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (backup_record_id, location_type, path_or_reference)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_backup_locations_record
        ON backup_locations(backup_record_id, location_type, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_backup_locations_type
        ON backup_locations(location_type, verified_at, missing_at);
    `,
  },
  {
    id: 26,
    name: 'phase_6_backup_policies_intervention_links',
    sql: `
      CREATE TABLE IF NOT EXISTS backup_policies (
        id TEXT PRIMARY KEY,
        client_account_id TEXT REFERENCES client_accounts(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        max_known_age_days INTEGER NOT NULL CHECK (max_known_age_days >= 1),
        max_local_age_days INTEGER NOT NULL CHECK (max_local_age_days >= 1),
        warn_server_only INTEGER NOT NULL DEFAULT 1 CHECK (warn_server_only IN (0,1)),
        remind_before_intervention INTEGER NOT NULL DEFAULT 1 CHECK (remind_before_intervention IN (0,1)),
        remind_after_major_change INTEGER NOT NULL DEFAULT 1 CHECK (remind_after_major_change IN (0,1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (client_account_id IS NOT NULL OR project_id IS NOT NULL)
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_backup_policies_project_unique
        ON backup_policies(project_id) WHERE project_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_backup_policies_client_only_unique
        ON backup_policies(client_account_id) WHERE project_id IS NULL AND client_account_id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS backup_intervention_links (
        id TEXT PRIMARY KEY,
        backup_record_id TEXT NOT NULL REFERENCES backup_records(id) ON DELETE CASCADE,
        intervention_id TEXT NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
        link_role TEXT NOT NULL CHECK (link_role IN ('pre_intervention', 'post_intervention', 'reference')),
        created_at TEXT NOT NULL,
        UNIQUE (backup_record_id, intervention_id, link_role)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_backup_intervention_links_intervention
        ON backup_intervention_links(intervention_id, link_role, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_backup_intervention_links_backup
        ON backup_intervention_links(backup_record_id, link_role, created_at DESC);
    `,
  },
];

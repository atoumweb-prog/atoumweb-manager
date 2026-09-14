export const PHASE_6_MIGRATIONS = [
  {
    id: 18,
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
    id: 19,
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
    id: 20,
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
];

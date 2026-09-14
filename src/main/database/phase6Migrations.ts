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
];

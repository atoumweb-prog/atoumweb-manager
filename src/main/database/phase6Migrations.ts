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
];

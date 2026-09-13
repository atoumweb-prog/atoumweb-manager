export const PHASE_2_MIGRATIONS = [
  {
    id: 5,
    name: 'phase_2_catalog',
    sql: `
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL CHECK (item_type IN ('service', 'offer')),
        name TEXT NOT NULL,
        category TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        visible_public INTEGER NOT NULL DEFAULT 0 CHECK (visible_public IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_catalog_items_type_status
        ON catalog_items(item_type, status);
      CREATE INDEX IF NOT EXISTS idx_catalog_items_category
        ON catalog_items(category COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_catalog_items_name
        ON catalog_items(name COLLATE NOCASE);

      CREATE TABLE IF NOT EXISTS catalog_versions (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL CHECK (version_number > 0),
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
        description TEXT,
        inclusions_json TEXT NOT NULL DEFAULT '[]',
        exclusions_json TEXT NOT NULL DEFAULT '[]',
        prerequisites_json TEXT NOT NULL DEFAULT '[]',
        price_mode TEXT NOT NULL CHECK (price_mode IN ('fixed', 'starting_from', 'hourly', 'monthly', 'yearly', 'quote_only', 'free')),
        price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
        recommended_price_cents INTEGER CHECK (recommended_price_cents IS NULL OR recommended_price_cents >= 0),
        estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
        recommended_delay_days INTEGER CHECK (recommended_delay_days IS NULL OR recommended_delay_days >= 0),
        default_deposit_percent INTEGER CHECK (default_deposit_percent IS NULL OR default_deposit_percent BETWEEN 0 AND 100),
        contract_type TEXT,
        internal_advice TEXT,
        published_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE (item_id, version_number)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_catalog_versions_item
        ON catalog_versions(item_id, version_number DESC);
      CREATE INDEX IF NOT EXISTS idx_catalog_versions_status
        ON catalog_versions(status, published_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_versions_one_published
        ON catalog_versions(item_id)
        WHERE status = 'published';

      CREATE TABLE IF NOT EXISTS offer_components (
        id TEXT PRIMARY KEY,
        offer_version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE CASCADE,
        service_version_id TEXT NOT NULL REFERENCES catalog_versions(id),
        is_optional INTEGER NOT NULL DEFAULT 0 CHECK (is_optional IN (0, 1)),
        quantity_milli INTEGER NOT NULL DEFAULT 1000 CHECK (quantity_milli > 0),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        UNIQUE (offer_version_id, service_version_id, is_optional)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_offer_components_offer
        ON offer_components(offer_version_id, sort_order);
    `,
  },
];

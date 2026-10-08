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
  {
    id: 6,
    name: 'phase_2_quotes',
    sql: `
      CREATE TABLE IF NOT EXISTS number_sequences (
        sequence_key TEXT NOT NULL,
        sequence_year INTEGER NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
        updated_at TEXT NOT NULL,
        PRIMARY KEY (sequence_key, sequence_year)
      ) STRICT;

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        quote_number TEXT NOT NULL UNIQUE,
        prospect_id TEXT REFERENCES prospects(id),
        client_account_id TEXT REFERENCES client_accounts(id),
        accepted_client_account_id TEXT REFERENCES client_accounts(id),
        subject TEXT NOT NULL,
        need_summary TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'refused', 'expired', 'cancelled')),
        validity_days INTEGER CHECK (validity_days IS NULL OR validity_days > 0),
        valid_until TEXT,
        estimated_delay TEXT,
        prerequisites_text TEXT,
        special_terms TEXT,
        contract_type TEXT,
        deposit_percent INTEGER CHECK (deposit_percent IS NULL OR deposit_percent BETWEEN 0 AND 100),
        catalog_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (catalog_value_cents >= 0),
        discount_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_value_cents >= 0),
        contract_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (contract_value_cents >= 0),
        deposit_cents INTEGER NOT NULL DEFAULT 0 CHECK (deposit_cents >= 0),
        balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
        sent_at TEXT,
        viewed_at TEXT,
        accepted_at TEXT,
        refused_at TEXT,
        expired_at TEXT,
        snapshot_locked_at TEXT,
        project_ready_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (prospect_id IS NOT NULL OR client_account_id IS NOT NULL)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quotes_prospect ON quotes(prospect_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_account_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);

      CREATE TABLE IF NOT EXISTS quote_lines (
        id TEXT PRIMARY KEY,
        quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL CHECK (source IN ('catalog', 'custom')),
        catalog_item_id TEXT REFERENCES catalog_items(id),
        catalog_version_id TEXT REFERENCES catalog_versions(id),
        label TEXT NOT NULL,
        description TEXT,
        quantity_milli INTEGER NOT NULL DEFAULT 1000 CHECK (quantity_milli > 0),
        catalog_unit_price_cents INTEGER CHECK (catalog_unit_price_cents IS NULL OR catalog_unit_price_cents >= 0),
        proposed_unit_price_cents INTEGER CHECK (proposed_unit_price_cents IS NULL OR proposed_unit_price_cents >= 0),
        adjustment_mode TEXT NOT NULL DEFAULT 'none' CHECK (adjustment_mode IN ('none', 'percent', 'fixed_amount', 'override_price', 'free')),
        adjustment_value INTEGER,
        discount_reason_code TEXT CHECK (discount_reason_code IN ('negotiated', 'commercial_gesture', 'pilot_client', 'partnership', 'loyalty', 'pack', 'other')),
        discount_reason_text TEXT,
        catalog_line_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (catalog_line_value_cents >= 0),
        contract_line_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (contract_line_value_cents >= 0),
        snapshot_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_quote_lines_quote ON quote_lines(quote_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_quote_lines_catalog_version ON quote_lines(catalog_version_id);
    `,
  },
];

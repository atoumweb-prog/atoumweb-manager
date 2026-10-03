import type { Migration } from './migrations';

// Additive only: no price, version, quote, composition or legacy identity is rewritten.
export const CATALOG_IDENTITY_V1_MIGRATION: Migration = {
  id: 53,
  name: 'catalog_identity_v1',
  sql: `
    ALTER TABLE catalog_items ADD COLUMN canonical_code TEXT COLLATE NOCASE
      CHECK (canonical_code IS NULL OR (
        canonical_code GLOB 'AW-[A-Z0-9]*' AND canonical_code NOT GLOB '*[^A-Z0-9-]*'
        AND canonical_code NOT LIKE '%--%' AND substr(canonical_code,-1)<>'-'
      ));
    ALTER TABLE catalog_items ADD COLUMN identity_provenance_json TEXT
      CHECK (identity_provenance_json IS NULL OR json_valid(identity_provenance_json));
    CREATE UNIQUE INDEX idx_catalog_items_canonical_code ON catalog_items(canonical_code)
      WHERE canonical_code IS NOT NULL;
    CREATE TRIGGER catalog_canonical_code_immutable BEFORE UPDATE OF canonical_code ON catalog_items
      WHEN OLD.canonical_code IS NOT NULL AND NEW.canonical_code IS NOT OLD.canonical_code
      BEGIN SELECT RAISE(ABORT, 'Le code canonique attribué est immuable.'); END;

    ALTER TABLE catalog_versions ADD COLUMN commercial_kind TEXT
      CHECK (commercial_kind IS NULL OR commercial_kind IN ('offer','service','option','pack','subscription'));
    ALTER TABLE catalog_versions ADD COLUMN family_code TEXT;
    ALTER TABLE catalog_versions ADD COLUMN abby_label TEXT;
    ALTER TABLE catalog_versions ADD COLUMN unit TEXT;
    ALTER TABLE catalog_versions ADD COLUMN periodicity TEXT;
    ALTER TABLE catalog_versions ADD COLUMN price_basis TEXT NOT NULL DEFAULT 'listed'
      CHECK (price_basis IN ('listed','actual_cost'));
    ALTER TABLE catalog_versions ADD COLUMN provenance_json TEXT
      CHECK (provenance_json IS NULL OR json_valid(provenance_json));
    CREATE TRIGGER catalog_actual_cost_insert BEFORE INSERT ON catalog_versions
      WHEN NEW.price_basis='actual_cost' AND (NEW.price_mode<>'quote_only' OR NEW.price_cents IS NOT NULL)
      BEGIN SELECT RAISE(ABORT, 'Un coût tiers réel ne possède pas de tarif catalogue fixe.'); END;
    CREATE TRIGGER catalog_actual_cost_update BEFORE UPDATE OF price_basis,price_mode,price_cents ON catalog_versions
      WHEN NEW.price_basis='actual_cost' AND (NEW.price_mode<>'quote_only' OR NEW.price_cents IS NOT NULL)
      BEGIN SELECT RAISE(ABORT, 'Un coût tiers réel ne possède pas de tarif catalogue fixe.'); END;
  `,
};

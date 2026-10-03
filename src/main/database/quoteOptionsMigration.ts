import type { Migration } from './migrations';

// No backfill: historical absence of optional provenance remains explicit.
export const QUOTE_OPTIONS_MIGRATION: Migration = {
  id: 57, name: 'explicit_quote_option_purchases',
  sql: `
    CREATE TABLE quote_option_purchases (
      line_id TEXT PRIMARY KEY REFERENCES quote_lines(id),
      source_offer_line_id TEXT NOT NULL REFERENCES quote_lines(id),
      source_offer_item_id TEXT NOT NULL REFERENCES catalog_items(id),
      source_offer_version_id TEXT NOT NULL REFERENCES catalog_versions(id),
      source_component_id TEXT NOT NULL REFERENCES offer_components(id),
      state TEXT NOT NULL CHECK(state='purchased'),
      purchased_at TEXT NOT NULL,
      UNIQUE(source_offer_line_id,source_component_id)
    ) STRICT;
    CREATE TRIGGER quote_option_purchase_validate BEFORE INSERT ON quote_option_purchases
    BEGIN
      SELECT CASE WHEN NOT EXISTS (
        SELECT 1 FROM quote_lines bought JOIN quote_lines offer ON offer.id=NEW.source_offer_line_id
        JOIN quotes q ON q.id=bought.quote_id
        JOIN offer_components oc ON oc.id=NEW.source_component_id
        WHERE bought.id=NEW.line_id AND bought.id<>offer.id AND bought.quote_id=offer.quote_id
          AND offer.catalog_item_id=NEW.source_offer_item_id AND offer.catalog_version_id=NEW.source_offer_version_id
          AND oc.offer_version_id=offer.catalog_version_id AND oc.is_optional=1
          AND bought.catalog_version_id=oc.service_version_id AND bought.source='catalog'
          AND q.status='draft' AND q.finalized_at IS NULL AND q.contract_compiled_at IS NULL
          AND q.contract_snapshot_json IS NULL AND q.snapshot_locked_at IS NULL
      ) THEN RAISE(ABORT,'Invalid or frozen option purchase') END;
    END;
    CREATE TRIGGER quote_option_purchase_no_update BEFORE UPDATE ON quote_option_purchases
    BEGIN SELECT RAISE(ABORT,'Option origin is immutable'); END;
    CREATE TRIGGER quote_option_purchase_no_frozen_delete BEFORE DELETE ON quote_option_purchases
    WHEN EXISTS (
      SELECT 1 FROM quote_lines l JOIN quotes q ON q.id=l.quote_id WHERE l.id=OLD.line_id
      AND (q.status<>'draft' OR q.finalized_at IS NOT NULL OR q.contract_compiled_at IS NOT NULL
           OR q.contract_snapshot_json IS NOT NULL OR q.snapshot_locked_at IS NOT NULL)
    )
    BEGIN SELECT RAISE(ABORT,'Frozen option purchase'); END;
  `,
};

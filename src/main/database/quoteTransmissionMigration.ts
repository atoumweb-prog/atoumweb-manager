import type { Migration } from './migrations';

/** EC03: additive ledger. Never infer a transmission from a legacy snapshot. */
export const QUOTE_TRANSMISSION_MIGRATION: Migration = {
  id: 71,
  name: 'quote_contract_transmission_v1',
  sql: `
    ALTER TABLE demo_context ADD COLUMN contract_purge INTEGER NOT NULL DEFAULT 0 CHECK(contract_purge IN (0,1));
    CREATE TABLE quote_contract_preparations (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL REFERENCES quotes(id),
      protocol_version INTEGER NOT NULL CHECK(protocol_version=1),
      text_snapshot TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      source_hash TEXT NOT NULL,
      prepared_at TEXT NOT NULL
    ) STRICT;
    ALTER TABLE quotes ADD COLUMN contract_preparation_id TEXT REFERENCES quote_contract_preparations(id);
    ALTER TABLE quotes ADD COLUMN contract_type_references_json TEXT CHECK(contract_type_references_json IS NULL OR json_valid(contract_type_references_json));
    CREATE TABLE quote_contract_transmissions (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL UNIQUE REFERENCES quotes(id),
      preparation_id TEXT REFERENCES quote_contract_preparations(id),
      content_hash TEXT NOT NULL,
      operation_id TEXT NOT NULL UNIQUE,
      occurred_at TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('abby','other')),
      provenance TEXT NOT NULL,
      legacy INTEGER NOT NULL CHECK(legacy IN (0,1))
    ) STRICT;
    ALTER TABLE quote_document_links ADD COLUMN transmission_id TEXT REFERENCES quote_contract_transmissions(id);
    CREATE TRIGGER quote_preparations_no_update BEFORE UPDATE ON quote_contract_preparations BEGIN SELECT RAISE(ABORT,'Préparation immuable'); END;
    CREATE TRIGGER quote_preparations_no_delete BEFORE DELETE ON quote_contract_preparations WHEN NOT EXISTS(SELECT 1 FROM demo_records WHERE table_name='quote_contract_preparations' AND record_id=OLD.id AND (SELECT contract_purge FROM demo_context WHERE id=1)=1) BEGIN SELECT RAISE(ABORT,'Préparation immuable'); END;
    CREATE TRIGGER quote_transmissions_no_update BEFORE UPDATE ON quote_contract_transmissions BEGIN SELECT RAISE(ABORT,'Transmission immuable'); END;
    CREATE TRIGGER quote_transmissions_no_delete BEFORE DELETE ON quote_contract_transmissions WHEN NOT EXISTS(SELECT 1 FROM demo_records WHERE table_name='quote_contract_transmissions' AND record_id=OLD.id AND (SELECT contract_purge FROM demo_context WHERE id=1)=1) BEGIN SELECT RAISE(ABORT,'Transmission immuable'); END;
  `,
};

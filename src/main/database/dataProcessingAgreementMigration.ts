import type { Migration } from './migrations';

export const DATA_PROCESSING_AGREEMENT_MIGRATION: Migration = {
  id: 80,
  name: 'data_processing_agreements_v3',
  sql: `
    CREATE TABLE data_processing_agreements (
      id TEXT PRIMARY KEY,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      client_account_id TEXT NOT NULL REFERENCES client_accounts(id) ON DELETE RESTRICT,
      version_number INTEGER NOT NULL CHECK(version_number > 0),
      previous_version_id TEXT REFERENCES data_processing_agreements(id) ON DELETE RESTRICT,
      status TEXT NOT NULL CHECK(status IN ('preparation','sent','signed','revision')),
      source_reference TEXT NOT NULL,
      source_sha256 TEXT NOT NULL,
      payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
      sent_at TEXT,
      signed_at TEXT,
      signed_document_id TEXT REFERENCES client_documents(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(status != 'sent' OR sent_at IS NOT NULL),
      CHECK(status != 'signed' OR (sent_at IS NOT NULL AND signed_at IS NOT NULL AND signed_document_id IS NOT NULL)),
      UNIQUE(project_site_id, version_number)
    ) STRICT;

    CREATE INDEX idx_data_processing_agreements_site
      ON data_processing_agreements(project_site_id, version_number DESC);
    CREATE INDEX idx_data_processing_agreements_client
      ON data_processing_agreements(client_account_id, status, updated_at DESC);

    CREATE TABLE data_processing_incidents (
      id TEXT PRIMARY KEY,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      agreement_id TEXT REFERENCES data_processing_agreements(id) ON DELETE RESTRICT,
      summary TEXT NOT NULL,
      details TEXT,
      occurred_at TEXT NOT NULL,
      reported_at TEXT,
      resolved_at TEXT,
      resolution TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX idx_data_processing_incidents_site
      ON data_processing_incidents(project_site_id, occurred_at DESC);
  `,
};

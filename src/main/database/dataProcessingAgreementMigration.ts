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
      transmission_mode TEXT CHECK(transmission_mode IS NULL OR transmission_mode IN ('external_attestation','manager_dispatch')),
      transmission_channel TEXT,
      transmission_recipient TEXT,
      transmission_reference TEXT,
      sent_document_id TEXT REFERENCES client_documents(id) ON DELETE RESTRICT,
      sent_payload_sha256 TEXT,
      signed_at TEXT,
      signed_document_id TEXT REFERENCES client_documents(id) ON DELETE RESTRICT,
      signed_payload_sha256 TEXT,
      signature_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(status NOT IN ('sent','signed') OR (sent_at IS NOT NULL AND transmission_mode IS NOT NULL AND transmission_channel IS NOT NULL AND transmission_recipient IS NOT NULL AND transmission_reference IS NOT NULL AND sent_payload_sha256 IS NOT NULL)),
      CHECK(status != 'signed' OR (signed_at IS NOT NULL AND signed_document_id IS NOT NULL AND signed_payload_sha256=sent_payload_sha256 AND signature_reference IS NOT NULL)),
      UNIQUE(project_site_id, version_number)
    ) STRICT;

    CREATE INDEX idx_data_processing_agreements_site
      ON data_processing_agreements(project_site_id, version_number DESC);
    CREATE INDEX idx_data_processing_agreements_client
      ON data_processing_agreements(client_account_id, status, updated_at DESC);

    CREATE TABLE data_processing_site_assessments (
      project_site_id TEXT PRIMARY KEY REFERENCES project_sites(id) ON DELETE RESTRICT,
      state TEXT NOT NULL CHECK(state IN ('to_assess','not_required','required')),
      operations_json TEXT NOT NULL CHECK(json_valid(operations_json)),
      rationale TEXT,
      services_verified_at TEXT,
      verified_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(state='to_assess' OR (services_verified_at IS NOT NULL AND verified_by IS NOT NULL AND rationale IS NOT NULL)),
      CHECK(state!='required' OR json_array_length(operations_json)>0)
    ) STRICT;

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

import type { Migration } from './migrations';

export const ATOUM_PACKAGE_BOOTSTRAP_MIGRATION: Migration = {
  id: 22,
  name: 'atoum_package_registry_and_need_pinning',
  sql: `
    CREATE TABLE atoum_packages (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      package_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      install_state TEXT NOT NULL DEFAULT 'staged' CHECK (install_state IN ('staged','installed','disabled','error')),
      source_kind TEXT NOT NULL DEFAULT 'builtin' CHECK (source_kind IN ('builtin','file')),
      source_sha256 TEXT NOT NULL,
      source_relative_path TEXT,
      manifest_json TEXT NOT NULL,
      package_snapshot_json TEXT NOT NULL,
      capability_gaps_json TEXT NOT NULL DEFAULT '[]',
      installed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (package_id, package_version)
    ) STRICT;

    CREATE INDEX idx_atoum_packages_state ON atoum_packages(install_state, package_id);

    CREATE TABLE atoum_portable_refs (
      id TEXT PRIMARY KEY,
      package_record_id TEXT NOT NULL REFERENCES atoum_packages(id) ON DELETE CASCADE,
      portable_ref TEXT NOT NULL,
      ref_kind TEXT NOT NULL,
      resolution TEXT NOT NULL,
      local_id TEXT,
      local_version_id TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (package_record_id, portable_ref)
    ) STRICT;

    CREATE INDEX idx_atoum_portable_refs_ref ON atoum_portable_refs(portable_ref);
    CREATE INDEX idx_atoum_portable_refs_local ON atoum_portable_refs(local_id, local_version_id);

    CREATE TABLE atoum_package_documents (
      id TEXT PRIMARY KEY,
      package_record_id TEXT NOT NULL REFERENCES atoum_packages(id) ON DELETE CASCADE,
      document_ref TEXT NOT NULL,
      document_version TEXT NOT NULL,
      document_kind TEXT NOT NULL,
      format TEXT NOT NULL,
      engine TEXT,
      source_file TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (package_record_id, document_ref, document_version),
      UNIQUE (relative_path)
    ) STRICT;

    CREATE INDEX idx_atoum_package_documents_ref ON atoum_package_documents(document_ref, document_version);

    ALTER TABLE catalog_items ADD COLUMN subcategory TEXT;

    ALTER TABLE crm_needs ADD COLUMN catalog_version_id TEXT REFERENCES catalog_versions(id);
    ALTER TABLE crm_needs ADD COLUMN package_id TEXT;
    ALTER TABLE crm_needs ADD COLUMN package_version TEXT;
    ALTER TABLE crm_needs ADD COLUMN offer_config_json TEXT;

    CREATE INDEX idx_crm_needs_catalog_version ON crm_needs(catalog_version_id);
    CREATE INDEX idx_crm_needs_package ON crm_needs(package_id, package_version);
  `,
};

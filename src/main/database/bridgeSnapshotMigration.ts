import type { Migration } from './migrations';

export const BRIDGE_SNAPSHOT_MIGRATION: Migration = {
  id: 36,
  name: 'bridge_snapshot_v1',
  sql: `
    CREATE TABLE IF NOT EXISTS bridge_sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      canonical_url TEXT,
      wordpress_site_url TEXT,
      environment TEXT,
      source_instance_id TEXT NOT NULL UNIQUE,
      source_site_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_snapshot_at TEXT
    ) STRICT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bridge_sites_source_key
      ON bridge_sites(source_site_key);
    CREATE INDEX IF NOT EXISTS idx_bridge_sites_last_snapshot
      ON bridge_sites(last_snapshot_at DESC);

    CREATE TABLE IF NOT EXISTS bridge_snapshots (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES bridge_sites(id) ON DELETE CASCADE,
      external_snapshot_id TEXT NOT NULL UNIQUE,
      package_fingerprint TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      snapshot_type TEXT NOT NULL,
      scan_status TEXT NOT NULL,
      bridge_version TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      fingerprint_profile TEXT NOT NULL,
      page_count INTEGER NOT NULL DEFAULT 0,
      node_count INTEGER NOT NULL DEFAULT 0,
      source_count INTEGER NOT NULL DEFAULT 0,
      asset_count INTEGER NOT NULL DEFAULT 0,
      dependency_count INTEGER NOT NULL DEFAULT 0,
      relation_count INTEGER NOT NULL DEFAULT 0,
      object_count INTEGER NOT NULL DEFAULT 0,
      issues_json TEXT NOT NULL,
      coverage_json TEXT NOT NULL,
      scanner_capabilities_json TEXT NOT NULL,
      observed_content_json TEXT NOT NULL,
      security_json TEXT NOT NULL,
      environment_json TEXT NOT NULL,
      package_relative_path TEXT
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_bridge_snapshots_site
      ON bridge_snapshots(site_id, generated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bridge_snapshots_fingerprint
      ON bridge_snapshots(package_fingerprint);

    CREATE TABLE IF NOT EXISTS bridge_pages (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES bridge_sites(id) ON DELETE CASCADE,
      source_page_key TEXT NOT NULL,
      source_post_id INTEGER,
      post_type TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT,
      canonical_url TEXT,
      wordpress_guid TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(site_id, source_page_key)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_bridge_pages_site_title
      ON bridge_pages(site_id, title COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS bridge_page_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id) ON DELETE CASCADE,
      page_id TEXT NOT NULL REFERENCES bridge_pages(id) ON DELETE CASCADE,
      external_page_snapshot_id TEXT NOT NULL,
      source_page_key TEXT NOT NULL,
      status TEXT,
      title TEXT NOT NULL,
      slug TEXT,
      canonical_url TEXT,
      storage_format TEXT,
      builder TEXT,
      builder_generation TEXT,
      is_divi_content INTEGER NOT NULL DEFAULT 0 CHECK (is_divi_content IN (0,1)),
      scope TEXT,
      audit_status TEXT,
      raw_object_ref TEXT,
      source_ids_json TEXT NOT NULL,
      asset_ids_json TEXT NOT NULL,
      dependency_ids_json TEXT NOT NULL,
      relation_ids_json TEXT NOT NULL,
      fingerprints_json TEXT NOT NULL,
      frontend_json TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      UNIQUE(snapshot_id, source_page_key),
      UNIQUE(snapshot_id, external_page_snapshot_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_bridge_page_snapshots_snapshot
      ON bridge_page_snapshots(snapshot_id, title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_bridge_page_snapshots_page
      ON bridge_page_snapshots(page_id, snapshot_id);

    CREATE TABLE IF NOT EXISTS bridge_nodes (
      id TEXT PRIMARY KEY,
      page_snapshot_id TEXT NOT NULL REFERENCES bridge_page_snapshots(id) ON DELETE CASCADE,
      occurrence_id TEXT NOT NULL,
      logical_node_id TEXT,
      parent_occurrence_id TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      ordinal INTEGER NOT NULL DEFAULT 0,
      depth INTEGER NOT NULL DEFAULT 0,
      node_type TEXT NOT NULL,
      module_type TEXT,
      label TEXT,
      builder TEXT,
      builder_generation TEXT,
      attributes_json TEXT NOT NULL,
      responsive_json TEXT NOT NULL,
      design_json TEXT NOT NULL,
      classes_json TEXT NOT NULL,
      ids_json TEXT NOT NULL,
      source_ids_json TEXT NOT NULL,
      asset_ids_json TEXT NOT NULL,
      dependency_ids_json TEXT NOT NULL,
      relation_ids_json TEXT NOT NULL,
      raw_object_ref TEXT,
      content_object_ref TEXT,
      fingerprints_json TEXT NOT NULL,
      matching_hints_json TEXT NOT NULL,
      UNIQUE(page_snapshot_id, occurrence_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_bridge_nodes_page
      ON bridge_nodes(page_snapshot_id, ordinal);
    CREATE INDEX IF NOT EXISTS idx_bridge_nodes_module
      ON bridge_nodes(module_type, node_type);

    CREATE TABLE IF NOT EXISTS bridge_sources (
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL,
      page_snapshot_id TEXT REFERENCES bridge_page_snapshots(id) ON DELETE CASCADE,
      node_occurrence_id TEXT,
      kind TEXT NOT NULL,
      scope TEXT NOT NULL,
      origin TEXT NOT NULL,
      owner TEXT NOT NULL,
      owner_slug TEXT,
      managed_externally INTEGER NOT NULL DEFAULT 0 CHECK (managed_externally IN (0,1)),
      payload_object_ref TEXT,
      fingerprint TEXT,
      lines INTEGER,
      bytes INTEGER,
      evidence_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      PRIMARY KEY(snapshot_id, source_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_bridge_sources_page
      ON bridge_sources(page_snapshot_id, kind, scope);

    CREATE TABLE IF NOT EXISTS bridge_assets (
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL,
      type TEXT NOT NULL,
      wordpress_attachment_id INTEGER,
      url TEXT,
      local_path TEXT,
      mime_type TEXT,
      width INTEGER,
      height INTEGER,
      size_bytes INTEGER,
      hash TEXT,
      archive_mode TEXT,
      object_ref TEXT,
      raw_json TEXT NOT NULL,
      PRIMARY KEY(snapshot_id, asset_id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS bridge_dependencies (
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id) ON DELETE CASCADE,
      dependency_id TEXT NOT NULL,
      type TEXT NOT NULL,
      slug TEXT,
      name TEXT NOT NULL,
      version TEXT,
      active INTEGER CHECK (active IS NULL OR active IN (0,1)),
      raw_json TEXT NOT NULL,
      PRIMARY KEY(snapshot_id, dependency_id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS bridge_relations (
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id) ON DELETE CASCADE,
      relation_id TEXT NOT NULL,
      type TEXT NOT NULL,
      from_entity TEXT NOT NULL,
      from_id TEXT NOT NULL,
      to_entity TEXT NOT NULL,
      to_id TEXT NOT NULL,
      properties_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      PRIMARY KEY(snapshot_id, relation_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_bridge_relations_from
      ON bridge_relations(snapshot_id, from_entity, from_id);
    CREATE INDEX IF NOT EXISTS idx_bridge_relations_to
      ON bridge_relations(snapshot_id, to_entity, to_id);

    CREATE TABLE IF NOT EXISTS bridge_objects (
      object_ref TEXT PRIMARY KEY,
      relative_path TEXT NOT NULL,
      content_type TEXT,
      encoding TEXT,
      byte_length INTEGER NOT NULL,
      serialization TEXT,
      compression TEXT,
      first_seen_at TEXT NOT NULL
    ) STRICT;
  `,
};

import type { Migration } from './migrations';

export const PROJECT_SITE_MIGRATION: Migration = {
  id: 47,
  name: 'project_sites_pages_v1',
  sql: `
    CREATE TABLE IF NOT EXISTS project_sites (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      desired_domain TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_project_sites_project
      ON project_sites(project_id, archived_at, created_at);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_sites_active_name
      ON project_sites(project_id, name COLLATE NOCASE)
      WHERE archived_at IS NULL;

    CREATE TABLE IF NOT EXISTS project_site_pages (
      project_node_id TEXT PRIMARY KEY REFERENCES project_nodes(id) ON DELETE CASCADE,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      role TEXT NOT NULL DEFAULT 'standard'
        CHECK (role IN ('home','standard','legal','landing','blog','other')),
      desired_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_project_site_pages_site
      ON project_site_pages(project_site_id, created_at);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_site_pages_path
      ON project_site_pages(project_site_id, desired_path)
      WHERE desired_path IS NOT NULL;
  `,
};

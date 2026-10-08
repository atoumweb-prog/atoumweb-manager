import type { Migration } from './migrations';

export const PROJECT_PAGE_EXPORT_MIGRATION: Migration = {
  id: 52,
  name: 'project_page_exports_v1',
  sql: `
    CREATE TABLE project_page_exports (
      id TEXT PRIMARY KEY,
      composition_id TEXT NOT NULL REFERENCES atoumweb_compositions(id) ON DELETE RESTRICT,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      project_node_id TEXT NOT NULL REFERENCES project_nodes(id) ON DELETE RESTRICT,
      package_fingerprint TEXT NOT NULL,
      package_path TEXT NOT NULL,
      component_count INTEGER NOT NULL CHECK (component_count > 0),
      created_at TEXT NOT NULL,
      UNIQUE (package_fingerprint)
    ) STRICT;

    CREATE INDEX idx_project_page_exports_page
      ON project_page_exports(project_node_id, created_at DESC);
    CREATE INDEX idx_project_page_exports_composition
      ON project_page_exports(composition_id, created_at DESC);
  `,
};

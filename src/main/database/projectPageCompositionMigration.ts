import type { Migration } from './migrations';

export const PROJECT_PAGE_COMPOSITION_MIGRATION: Migration = {
  id: 48,
  name: 'project_page_compositions_v1',
  sql: `
    CREATE TABLE IF NOT EXISTS project_page_compositions (
      project_node_id TEXT PRIMARY KEY REFERENCES project_nodes(id) ON DELETE CASCADE,
      composition_id TEXT NOT NULL UNIQUE REFERENCES atoumweb_compositions(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_project_page_compositions_composition
      ON project_page_compositions(composition_id);
  `,
};

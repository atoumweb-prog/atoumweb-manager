import type { Migration } from './migrations';

export const ATOUMWEB_LIBRARY_VERTICAL_MIGRATION: Migration = {
  id: 38,
  name: 'atoumweb_library_vertical_and_code_snippets',
  disableForeignKeys: true,
  sql: `
    CREATE TABLE technical_items_v38 (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      scope TEXT NOT NULL DEFAULT 'project' CHECK (scope IN ('project', 'atoumweb')),
      category TEXT NOT NULL CHECK (category IN (
        'header', 'footer', 'hero', 'page', 'section', 'css', 'javascript',
        'php', 'acf', 'divi', 'woocommerce', 'plugin', 'config', 'note', 'other'
      )),
      name TEXT NOT NULL,
      description TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      reuse_status TEXT
        CHECK (reuse_status IS NULL OR reuse_status IN ('ready', 'adapt', 'reference')),
      origin_technical_item_id TEXT
        REFERENCES technical_items_v38(id) ON DELETE SET NULL,
      library_category TEXT
        CHECK (library_category IS NULL OR library_category IN (
          'header', 'footer', 'hero', 'page', 'section', 'form', 'gallery',
          'carousel', 'navigation', 'code_snippet', 'css', 'javascript', 'php',
          'woocommerce', 'acf', 'divi', 'app', 'note'
        )),
      vertical TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT,
      CHECK (
        (scope='project' AND project_id IS NOT NULL)
        OR (scope='atoumweb' AND project_id IS NULL)
      )
    ) STRICT;

    INSERT INTO technical_items_v38 (
      id, project_id, scope, category, name, description, tags_json,
      reuse_status, origin_technical_item_id, library_category, vertical,
      created_at, updated_at, archived_at
    )
    SELECT
      id, project_id, scope, category, name, description, tags_json,
      reuse_status, origin_technical_item_id, library_category, NULL,
      created_at, updated_at, archived_at
    FROM technical_items;

    DROP TABLE technical_items;
    ALTER TABLE technical_items_v38 RENAME TO technical_items;

    CREATE INDEX IF NOT EXISTS idx_technical_items_project
      ON technical_items(project_id, category, archived_at);
    CREATE INDEX IF NOT EXISTS idx_technical_items_scope
      ON technical_items(scope, category, archived_at);
    CREATE INDEX IF NOT EXISTS idx_technical_items_name
      ON technical_items(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_technical_items_reuse_status
      ON technical_items(scope, reuse_status, archived_at);
    CREATE INDEX IF NOT EXISTS idx_technical_items_origin
      ON technical_items(origin_technical_item_id);
    CREATE INDEX IF NOT EXISTS idx_technical_items_library_category
      ON technical_items(scope, library_category, archived_at);
    CREATE INDEX IF NOT EXISTS idx_technical_items_vertical
      ON technical_items(scope, vertical, archived_at);
  `,
};

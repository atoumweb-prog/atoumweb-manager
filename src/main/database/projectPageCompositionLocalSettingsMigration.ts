import type { Migration } from './migrations';

export const PROJECT_PAGE_COMPOSITION_LOCAL_SETTINGS_MIGRATION: Migration = {
  id: 49,
  name: 'project_page_composition_local_settings_v1',
  sql: `
    ALTER TABLE atoumweb_composition_items ADD COLUMN local_html_text TEXT;
    ALTER TABLE atoumweb_composition_items ADD COLUMN local_css_text TEXT;
    ALTER TABLE atoumweb_composition_items ADD COLUMN local_javascript_text TEXT;
    ALTER TABLE atoumweb_composition_items ADD COLUMN local_settings_json TEXT NOT NULL DEFAULT '{}';
    ALTER TABLE atoumweb_composition_items ADD COLUMN local_updated_at TEXT;
  `,
};

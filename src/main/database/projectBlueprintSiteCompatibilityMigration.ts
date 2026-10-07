import type { Migration } from './migrations';

export const PROJECT_BLUEPRINT_SITE_COMPATIBILITY_MIGRATION: Migration = {
  id: 51,
  name: 'project_blueprint_sites_pages_legacy_compatibility',
  sql: `
    CREATE TABLE project_type_site_blueprints (
      project_type TEXT PRIMARY KEY,
      template_version_id TEXT NOT NULL REFERENCES project_template_versions(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL
    ) STRICT;

    INSERT INTO project_type_site_blueprints (project_type,template_version_id,created_at)
    SELECT 'web','atoumweb-project-template-vitrine-v1','2026-09-29T00:00:00.000Z'
    WHERE EXISTS (SELECT 1 FROM project_template_versions WHERE id='atoumweb-project-template-vitrine-v1');
    INSERT INTO project_type_site_blueprints (project_type,template_version_id,created_at)
    SELECT 'website','atoumweb-project-template-vitrine-v1','2026-09-29T00:00:00.000Z'
    WHERE EXISTS (SELECT 1 FROM project_template_versions WHERE id='atoumweb-project-template-vitrine-v1');
  `,
};

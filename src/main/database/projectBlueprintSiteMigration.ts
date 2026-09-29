import type { Migration } from './migrations';

export const PROJECT_BLUEPRINT_SITE_MIGRATION: Migration = {
  id: 50,
  name: 'project_blueprint_sites_pages_v1',
  sql: `
    CREATE TABLE project_template_sites (
      id TEXT PRIMARY KEY,
      template_version_id TEXT NOT NULL REFERENCES project_template_versions(id) ON DELETE CASCADE,
      blueprint_key TEXT NOT NULL,
      name TEXT NOT NULL,
      desired_domain TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE (template_version_id, blueprint_key)
    ) STRICT;

    CREATE TABLE project_template_site_pages (
      id TEXT PRIMARY KEY,
      template_site_id TEXT NOT NULL REFERENCES project_template_sites(id) ON DELETE CASCADE,
      blueprint_key TEXT NOT NULL,
      template_node_id TEXT NOT NULL REFERENCES project_template_nodes(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'standard'
        CHECK (role IN ('home','standard','legal','landing','blog','other')),
      desired_path TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE (template_site_id, blueprint_key),
      UNIQUE (template_site_id, template_node_id)
    ) STRICT;

    CREATE TABLE project_blueprint_site_bindings (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      template_version_id TEXT NOT NULL REFERENCES project_template_versions(id) ON DELETE RESTRICT,
      blueprint_key TEXT NOT NULL,
      project_site_id TEXT NOT NULL REFERENCES project_sites(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (project_id, template_version_id, blueprint_key),
      UNIQUE (project_site_id)
    ) STRICT;

    CREATE TABLE project_blueprint_page_bindings (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      template_version_id TEXT NOT NULL REFERENCES project_template_versions(id) ON DELETE RESTRICT,
      site_blueprint_key TEXT NOT NULL,
      page_blueprint_key TEXT NOT NULL,
      project_node_id TEXT NOT NULL REFERENCES project_nodes(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (project_id, template_version_id, site_blueprint_key, page_blueprint_key),
      UNIQUE (project_node_id)
    ) STRICT;

    CREATE INDEX idx_project_template_sites_version
      ON project_template_sites(template_version_id, sort_order);
    CREATE INDEX idx_project_template_site_pages_site
      ON project_template_site_pages(template_site_id, sort_order);
    CREATE UNIQUE INDEX idx_project_template_site_pages_home
      ON project_template_site_pages(template_site_id) WHERE role='home';
    CREATE UNIQUE INDEX idx_project_template_site_pages_path
      ON project_template_site_pages(template_site_id, desired_path) WHERE desired_path IS NOT NULL;

    INSERT INTO project_template_sites
      (id,template_version_id,blueprint_key,name,desired_domain,sort_order,created_at)
    SELECT 'aw-vitrine-site-main','atoumweb-project-template-vitrine-v1','main','Site principal',NULL,10,'2026-09-29T00:00:00.000Z'
    WHERE EXISTS (SELECT 1 FROM project_template_versions WHERE id='atoumweb-project-template-vitrine-v1');

    INSERT INTO project_template_site_pages
      (id,template_site_id,blueprint_key,template_node_id,role,desired_path,sort_order,created_at)
    SELECT 'aw-vitrine-site-main-home','aw-vitrine-site-main','home',id,'home','/',10,'2026-09-29T00:00:00.000Z'
    FROM project_template_nodes WHERE template_version_id='atoumweb-project-template-vitrine-v1' AND semantic_key='pages.home';

    INSERT INTO project_template_site_pages
      (id,template_site_id,blueprint_key,template_node_id,role,desired_path,sort_order,created_at)
    SELECT 'aw-vitrine-site-main-extra1','aw-vitrine-site-main','extra1',id,'standard',NULL,20,'2026-09-29T00:00:00.000Z'
    FROM project_template_nodes WHERE template_version_id='atoumweb-project-template-vitrine-v1' AND semantic_key='pages.extra1';
    INSERT INTO project_template_site_pages
      (id,template_site_id,blueprint_key,template_node_id,role,desired_path,sort_order,created_at)
    SELECT 'aw-vitrine-site-main-extra2','aw-vitrine-site-main','extra2',id,'standard',NULL,30,'2026-09-29T00:00:00.000Z'
    FROM project_template_nodes WHERE template_version_id='atoumweb-project-template-vitrine-v1' AND semantic_key='pages.extra2';
    INSERT INTO project_template_site_pages
      (id,template_site_id,blueprint_key,template_node_id,role,desired_path,sort_order,created_at)
    SELECT 'aw-vitrine-site-main-extra3','aw-vitrine-site-main','extra3',id,'standard',NULL,40,'2026-09-29T00:00:00.000Z'
    FROM project_template_nodes WHERE template_version_id='atoumweb-project-template-vitrine-v1' AND semantic_key='pages.extra3';
    INSERT INTO project_template_site_pages
      (id,template_site_id,blueprint_key,template_node_id,role,desired_path,sort_order,created_at)
    SELECT 'aw-vitrine-site-main-extra4','aw-vitrine-site-main','extra4',id,'standard',NULL,50,'2026-09-29T00:00:00.000Z'
    FROM project_template_nodes WHERE template_version_id='atoumweb-project-template-vitrine-v1' AND semantic_key='pages.extra4';

  `,
};

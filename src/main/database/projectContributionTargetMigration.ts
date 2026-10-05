import type {Migration} from './migrations';

/** Additive schema only. No import, backfill, capability or target qualification. */
export const PROJECT_CONTRIBUTION_TARGET_MIGRATION: Migration = {
  id: 61, name: 'explicit_project_contribution_targets',
  sql: `
    CREATE TABLE project_contribution_targets (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      line_origin_id TEXT NOT NULL,
      target_slot_key TEXT NOT NULL,
      unit_index INTEGER NOT NULL CHECK(unit_index>=1),
      target_kind TEXT NOT NULL CHECK(target_kind IN ('site','page','context')),
      site_owner_origin_id TEXT,
      site_owner_slot_key TEXT,
      target_site_id TEXT REFERENCES project_sites(id) ON DELETE RESTRICT,
      target_page_node_id TEXT REFERENCES project_nodes(id) ON DELETE RESTRICT,
      target_context_node_id TEXT REFERENCES project_nodes(id) ON DELETE RESTRICT,
      selection_mode TEXT NOT NULL CHECK(selection_mode IN ('pending','auto_unique','explicit')),
      state TEXT NOT NULL CHECK(state IN ('pending','active','out_of_scope')),
      last_scope_revision_id TEXT NOT NULL REFERENCES project_commercial_scope_revisions(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(project_id,line_origin_id,target_slot_key,unit_index),
      CHECK((site_owner_origin_id IS NULL)=(site_owner_slot_key IS NULL)),
      CHECK(state='out_of_scope' OR
        (state='pending' AND selection_mode='pending' AND target_site_id IS NULL AND target_page_node_id IS NULL AND target_context_node_id IS NULL) OR
        (state='active' AND selection_mode<>'pending' AND (
          (target_kind='site' AND target_site_id IS NOT NULL AND target_page_node_id IS NULL AND target_context_node_id IS NULL) OR
          (target_kind='page' AND target_site_id IS NOT NULL AND target_page_node_id IS NOT NULL AND target_context_node_id IS NULL) OR
          (target_kind='context' AND target_site_id IS NULL AND target_page_node_id IS NULL AND target_context_node_id IS NOT NULL))))
    ) STRICT;
    CREATE INDEX contribution_targets_state ON project_contribution_targets(project_id,state);
    CREATE INDEX contribution_targets_site ON project_contribution_targets(target_site_id);
    CREATE INDEX contribution_targets_page ON project_contribution_targets(target_page_node_id);
    CREATE INDEX contribution_targets_context ON project_contribution_targets(target_context_node_id);
    CREATE TRIGGER contribution_target_identity_immutable BEFORE UPDATE OF project_id,line_origin_id,target_slot_key,unit_index,target_kind,created_at ON project_contribution_targets
      BEGIN SELECT RAISE(ABORT,'Contribution target identity is immutable'); END;
    CREATE TRIGGER contribution_target_insert_guard BEFORE INSERT ON project_contribution_targets
      WHEN (SELECT commercial_state FROM projects WHERE id=NEW.project_id)<>'provisional'
      BEGIN SELECT RAISE(ABORT,'No target backfill on historical or frozen projects'); END;
    CREATE TRIGGER contribution_target_frozen_update BEFORE UPDATE ON project_contribution_targets
      WHEN (SELECT commercial_state FROM projects WHERE id=OLD.project_id)<>'provisional'
        AND NOT ((SELECT commercial_state FROM projects WHERE id=OLD.project_id)='frozen'
          AND OLD.state='pending' AND NEW.state='active' AND NEW.selection_mode='explicit'
          AND NEW.last_scope_revision_id=OLD.last_scope_revision_id
          AND EXISTS(SELECT 1 FROM project_commercial_scope_revisions r,
            json_each(r.plan_json,'$.operations.links') l
            WHERE r.id=OLD.last_scope_revision_id
              AND json_extract(l.value,'$.lineOrigin')=OLD.line_origin_id
              AND json_extract(l.value,'$.configuration.structureClass')='D'))
      BEGIN SELECT RAISE(ABORT,'Frozen target requires a new commercial path'); END;
    CREATE TRIGGER contribution_target_frozen_delete BEFORE DELETE ON project_contribution_targets
      WHEN (SELECT commercial_state FROM projects WHERE id=OLD.project_id)<>'provisional'
      BEGIN SELECT RAISE(ABORT,'Frozen target history must be retained'); END;
    CREATE TRIGGER contribution_target_relations_insert BEFORE INSERT ON project_contribution_targets
      WHEN NOT EXISTS(SELECT 1 FROM project_commercial_scope_revisions WHERE id=NEW.last_scope_revision_id AND project_id=NEW.project_id)
        OR (NEW.target_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM project_sites WHERE id=NEW.target_site_id AND project_id=NEW.project_id AND archived_at IS NULL))
        OR (NEW.target_page_node_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM project_nodes n JOIN project_site_pages p ON p.project_node_id=n.id WHERE n.id=NEW.target_page_node_id AND n.project_id=NEW.project_id AND n.display_subtype='page' AND n.node_type='module' AND n.archived_at IS NULL AND p.project_site_id=NEW.target_site_id))
        OR (NEW.target_context_node_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM project_nodes WHERE id=NEW.target_context_node_id AND project_id=NEW.project_id AND archived_at IS NULL))
      BEGIN SELECT RAISE(ABORT,'Invalid contribution target relations'); END;
    CREATE TRIGGER contribution_target_relations_update BEFORE UPDATE ON project_contribution_targets
      WHEN NOT EXISTS(SELECT 1 FROM project_commercial_scope_revisions WHERE id=NEW.last_scope_revision_id AND project_id=NEW.project_id)
        OR (NEW.target_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM project_sites WHERE id=NEW.target_site_id AND project_id=NEW.project_id AND archived_at IS NULL))
        OR (NEW.target_page_node_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM project_nodes n JOIN project_site_pages p ON p.project_node_id=n.id WHERE n.id=NEW.target_page_node_id AND n.project_id=NEW.project_id AND n.display_subtype='page' AND n.node_type='module' AND n.archived_at IS NULL AND p.project_site_id=NEW.target_site_id))
        OR (NEW.target_context_node_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM project_nodes WHERE id=NEW.target_context_node_id AND project_id=NEW.project_id AND archived_at IS NULL))
      BEGIN SELECT RAISE(ABORT,'Invalid contribution target relations'); END;
  `,
};

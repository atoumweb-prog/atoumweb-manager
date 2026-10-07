import type {Migration} from './migrations';

/** Legacy links were explicitly operational. New revisions are always staged first. */
export const OPERATIONAL_LINK_LIFECYCLE_MIGRATION: Migration = {
  id:62, name:'explicit_operational_association_lifecycle',
  sql:`
    ALTER TABLE catalog_operational_links ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'
      CHECK(status IN ('draft','ready'));
    DROP TRIGGER operational_link_immutable;
    UPDATE catalog_operational_links SET status='ready';
    CREATE TRIGGER operational_link_immutable
      BEFORE UPDATE OF id,catalog_version_id,model_version_id,blueprint_version_id,revision,provenance_json,created_at
      ON catalog_operational_links
      BEGIN SELECT RAISE(ABORT,'Operational compatibility revision is immutable'); END;
    CREATE TRIGGER operational_link_ready_monotonic BEFORE UPDATE OF status ON catalog_operational_links
      WHEN OLD.status='ready' AND NEW.status<>'ready'
      BEGIN SELECT RAISE(ABORT,'Ready operational association cannot be demoted; create a new revision'); END;
    CREATE TRIGGER operational_link_ready_dependencies_update BEFORE UPDATE OF status ON catalog_operational_links
      WHEN NEW.status='ready' AND OLD.status<>'ready' AND (
        NOT EXISTS(SELECT 1 FROM operational_model_versions m JOIN catalog_versions v ON v.item_id=m.catalog_item_id
          WHERE m.id=NEW.model_version_id AND v.id=NEW.catalog_version_id AND m.status='ready') OR
        (NEW.blueprint_version_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM blueprint_operational_profiles
          WHERE template_version_id=NEW.blueprint_version_id AND mode='structural' AND operational_ready=1)))
      BEGIN SELECT RAISE(ABORT,'Operational association dependencies are not ready'); END;
    CREATE TRIGGER operational_link_stage_first BEFORE INSERT ON catalog_operational_links
      WHEN NEW.status<>'draft'
      BEGIN SELECT RAISE(ABORT,'New operational association must be staged as draft'); END;
    CREATE TRIGGER operational_link_ready_capabilities BEFORE UPDATE OF status ON catalog_operational_links
      WHEN NEW.status='ready' AND OLD.status<>'ready' AND EXISTS(
        SELECT 1 FROM json_each(NEW.provenance_json,'$.configuration.requires') requirement
        WHERE NOT EXISTS(
          SELECT 1 FROM catalog_operational_links provider
          JOIN operational_model_versions model ON model.id=provider.model_version_id
          JOIN blueprint_operational_profiles profile ON profile.template_version_id=provider.blueprint_version_id,
          json_each(profile.provenance_json,'$.structureContract.sites') site,
          json_each(site.value,'$.provides') capability
          WHERE provider.status='ready' AND model.status='ready' AND profile.operational_ready=1
            AND json_extract(provider.provenance_json,'$.configuration.structuralRole')='base'
            AND capability.value=requirement.value))
      BEGIN SELECT RAISE(ABORT,'Operational association capability dependencies are not ready'); END;
    CREATE INDEX idx_operational_links_ready ON catalog_operational_links(catalog_version_id,status,revision);
  `,
};

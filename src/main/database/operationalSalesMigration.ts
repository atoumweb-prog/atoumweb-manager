import type { Migration } from './migrations';

export const OPERATIONAL_SALES_MIGRATION: Migration = {
  id:64,name:'accepted_operational_sales_provenance',
  sql:`
    CREATE TABLE operational_sales (
      id TEXT PRIMARY KEY,
      quote_line_id TEXT NOT NULL UNIQUE REFERENCES quote_lines(id) ON DELETE RESTRICT,
      catalog_version_id TEXT NOT NULL REFERENCES catalog_versions(id),
      operational_link_id TEXT NOT NULL REFERENCES catalog_operational_links(id),
      model_version_id TEXT NOT NULL REFERENCES operational_model_versions(id),
      client_account_id TEXT NOT NULL REFERENCES client_accounts(id),
      project_id TEXT REFERENCES projects(id),
      site_id TEXT REFERENCES project_sites(id),
      context_node_id TEXT REFERENCES project_nodes(id),
      kind TEXT NOT NULL CHECK(kind IN ('hour_pack','maintenance','recurring','intervention','hosting')),
      hour_pack_id TEXT UNIQUE REFERENCES hour_packs(id),
      subscription_id TEXT UNIQUE REFERENCES maintenance_subscriptions(id),
      intervention_id TEXT UNIQUE REFERENCES interventions(id),
      setup_intervention_id TEXT UNIQUE REFERENCES interventions(id),
      policy_snapshot_json TEXT NOT NULL CHECK(json_valid(policy_snapshot_json)),
      parameters_snapshot_json TEXT NOT NULL CHECK(json_valid(parameters_snapshot_json)),
      created_at TEXT NOT NULL,
      CHECK((kind='hour_pack' AND hour_pack_id IS NOT NULL AND subscription_id IS NULL AND intervention_id IS NULL)
        OR (kind='intervention' AND intervention_id IS NOT NULL AND hour_pack_id IS NULL AND subscription_id IS NULL)
        OR (kind IN ('maintenance','recurring','hosting') AND subscription_id IS NOT NULL AND hour_pack_id IS NULL AND intervention_id IS NULL))
    ) STRICT;
    CREATE TRIGGER operational_sale_accepted BEFORE INSERT ON operational_sales
      WHEN NOT EXISTS(SELECT 1 FROM quote_lines l JOIN quotes q ON q.id=l.quote_id
        JOIN catalog_operational_links a ON a.id=NEW.operational_link_id
        JOIN operational_model_versions m ON m.id=a.model_version_id
        WHERE l.id=NEW.quote_line_id AND q.status='accepted' AND q.accepted_client_account_id=NEW.client_account_id
          AND l.catalog_version_id=NEW.catalog_version_id AND a.catalog_version_id=l.catalog_version_id
          AND m.id=NEW.model_version_id AND a.status='ready' AND m.status='ready')
      BEGIN SELECT RAISE(ABORT,'Operational sale requires an accepted line and ready configuration'); END;
    CREATE TRIGGER operational_sale_immutable BEFORE UPDATE ON operational_sales
      BEGIN SELECT RAISE(ABORT,'Accepted operational sale provenance is immutable'); END;
    CREATE TABLE operational_sale_targets (
      sale_id TEXT PRIMARY KEY REFERENCES operational_sales(id),
      project_id TEXT REFERENCES projects(id),
      site_id TEXT REFERENCES project_sites(id),
      context_node_id TEXT REFERENCES project_nodes(id),
      state TEXT NOT NULL CHECK(state IN ('pending','active')),
      author TEXT,
      selected_at TEXT
    ) STRICT;
    ALTER TABLE maintenance_checklist_template_items ADD COLUMN reference_minutes INTEGER CHECK(reference_minutes IS NULL OR reference_minutes>=0);
    ALTER TABLE maintenance_checklist_template_items ADD COLUMN business_category TEXT;
    ALTER TABLE maintenance_checks ADD COLUMN routine_intervention_id TEXT REFERENCES interventions(id);
    ALTER TABLE maintenance_checks ADD COLUMN reference_minutes INTEGER CHECK(reference_minutes IS NULL OR reference_minutes>=0);
    ALTER TABLE maintenance_checks ADD COLUMN business_category TEXT CHECK(business_category IS NULL OR business_category IN
      ('Inclus au forfait','Supplément facturable','Avant-vente','Interne','Garantie corrective'));
    ALTER TABLE maintenance_subscriptions ADD COLUMN period_alignment TEXT NOT NULL DEFAULT 'calendar' CHECK(period_alignment IN ('calendar','anniversary'));
    ALTER TABLE maintenance_subscriptions ADD COLUMN maximum_minor_minutes INTEGER CHECK(maximum_minor_minutes IS NULL OR maximum_minor_minutes>0);
    ALTER TABLE interventions ADD COLUMN maintenance_usage_kind TEXT CHECK(maintenance_usage_kind IS NULL OR maintenance_usage_kind IN ('minor','routine'));
    ALTER TABLE interventions ADD COLUMN estimated_minutes INTEGER CHECK(estimated_minutes IS NULL OR estimated_minutes>=0);
    ALTER TABLE interventions ADD COLUMN operational_checklist_json TEXT CHECK(operational_checklist_json IS NULL OR json_valid(operational_checklist_json));
    CREATE INDEX operational_sales_client ON operational_sales(client_account_id,project_id);
  `,
};

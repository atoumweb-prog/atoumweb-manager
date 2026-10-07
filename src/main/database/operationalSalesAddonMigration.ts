import type { Migration } from './migrations';

/** Additional establishment belongs to the sold subscription, never an independent contract. */
export const OPERATIONAL_SALES_ADDON_MIGRATION:Migration={
  id:65,name:'subscription_addons_and_variable_routine_estimates',disableForeignKeys:true,
  sql:`
    DROP TRIGGER operational_sale_accepted;
    DROP TRIGGER operational_sale_immutable;
    CREATE TABLE operational_sales_additive (
      id TEXT PRIMARY KEY,quote_line_id TEXT NOT NULL UNIQUE REFERENCES quote_lines(id) ON DELETE RESTRICT,
      catalog_version_id TEXT NOT NULL REFERENCES catalog_versions(id),operational_link_id TEXT NOT NULL REFERENCES catalog_operational_links(id),
      model_version_id TEXT NOT NULL REFERENCES operational_model_versions(id),client_account_id TEXT NOT NULL REFERENCES client_accounts(id),
      project_id TEXT REFERENCES projects(id),site_id TEXT REFERENCES project_sites(id),context_node_id TEXT REFERENCES project_nodes(id),
      kind TEXT NOT NULL CHECK(kind IN ('hour_pack','maintenance','recurring','recurring_addon','intervention','hosting')),
      hour_pack_id TEXT UNIQUE REFERENCES hour_packs(id),subscription_id TEXT REFERENCES maintenance_subscriptions(id),
      intervention_id TEXT UNIQUE REFERENCES interventions(id),setup_intervention_id TEXT UNIQUE REFERENCES interventions(id),
      policy_snapshot_json TEXT NOT NULL CHECK(json_valid(policy_snapshot_json)),parameters_snapshot_json TEXT NOT NULL CHECK(json_valid(parameters_snapshot_json)),
      created_at TEXT NOT NULL,parent_sale_id TEXT REFERENCES operational_sales(id),routine_template_id TEXT REFERENCES maintenance_checklist_templates(id),
      CHECK((kind='hour_pack' AND hour_pack_id IS NOT NULL AND subscription_id IS NULL AND intervention_id IS NULL)
        OR (kind='intervention' AND intervention_id IS NOT NULL AND hour_pack_id IS NULL AND subscription_id IS NULL)
        OR (kind IN ('maintenance','recurring','recurring_addon','hosting') AND subscription_id IS NOT NULL AND hour_pack_id IS NULL AND intervention_id IS NULL)),
      CHECK((kind='recurring_addon' AND parent_sale_id IS NOT NULL AND routine_template_id IS NOT NULL) OR (kind<>'recurring_addon' AND parent_sale_id IS NULL))
    ) STRICT;
    INSERT INTO operational_sales_additive(id,quote_line_id,catalog_version_id,operational_link_id,model_version_id,client_account_id,project_id,site_id,context_node_id,kind,hour_pack_id,subscription_id,intervention_id,setup_intervention_id,policy_snapshot_json,parameters_snapshot_json,created_at)
      SELECT id,quote_line_id,catalog_version_id,operational_link_id,model_version_id,client_account_id,project_id,site_id,context_node_id,kind,hour_pack_id,subscription_id,intervention_id,setup_intervention_id,policy_snapshot_json,parameters_snapshot_json,created_at FROM operational_sales;
    DROP TABLE operational_sales;
    ALTER TABLE operational_sales_additive RENAME TO operational_sales;
    CREATE UNIQUE INDEX operational_sale_subscription_main ON operational_sales(subscription_id) WHERE kind<>'recurring_addon' AND subscription_id IS NOT NULL;
    CREATE INDEX operational_sales_client ON operational_sales(client_account_id,project_id);
    CREATE TRIGGER operational_sale_accepted BEFORE INSERT ON operational_sales
      WHEN NOT EXISTS(SELECT 1 FROM quote_lines l JOIN quotes q ON q.id=l.quote_id JOIN catalog_operational_links a ON a.id=NEW.operational_link_id JOIN operational_model_versions m ON m.id=a.model_version_id
        WHERE l.id=NEW.quote_line_id AND q.status='accepted' AND q.accepted_client_account_id=NEW.client_account_id AND l.catalog_version_id=NEW.catalog_version_id
          AND a.catalog_version_id=l.catalog_version_id AND m.id=NEW.model_version_id AND a.status='ready' AND m.status='ready')
      BEGIN SELECT RAISE(ABORT,'Operational sale requires an accepted line and ready configuration'); END;
    CREATE TRIGGER operational_sale_addon_parent BEFORE INSERT ON operational_sales WHEN NEW.kind='recurring_addon' AND NOT EXISTS(
      SELECT 1 FROM operational_sales p WHERE p.id=NEW.parent_sale_id AND p.client_account_id=NEW.client_account_id AND p.subscription_id=NEW.subscription_id AND p.kind<>'recurring_addon')
      BEGIN SELECT RAISE(ABORT,'Recurring addon requires the same client and parent subscription'); END;
    CREATE TRIGGER operational_sale_immutable BEFORE UPDATE ON operational_sales BEGIN SELECT RAISE(ABORT,'Accepted operational sale provenance is immutable'); END;
    ALTER TABLE maintenance_checklist_template_items ADD COLUMN estimate_required INTEGER NOT NULL DEFAULT 0 CHECK(estimate_required IN (0,1));
    ALTER TABLE maintenance_checks ADD COLUMN estimate_required INTEGER NOT NULL DEFAULT 0 CHECK(estimate_required IN (0,1));
    ALTER TABLE maintenance_checks ADD COLUMN operational_sale_id TEXT REFERENCES operational_sales(id);
  `,
};

export const PHASE_4_MIGRATIONS = [
  {
    id: 11,
    name: 'phase_4_requests_interventions',
    sql: `
      CREATE TABLE IF NOT EXISTS service_requests (
        id TEXT PRIMARY KEY,
        client_account_id TEXT NOT NULL REFERENCES client_accounts(id),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        source TEXT NOT NULL DEFAULT 'other' CHECK (source IN (
          'email', 'phone', 'website_form', 'message', 'meeting', 'atoumweb_detection', 'other'
        )),
        subject TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        received_at TEXT NOT NULL,
        next_action_at TEXT,
        next_action_text TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
          'new', 'to_qualify', 'waiting_client', 'planned', 'converted', 'closed', 'archived'
        )),
        close_reason TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_service_requests_client
        ON service_requests(client_account_id, status, received_at DESC);
      CREATE INDEX IF NOT EXISTS idx_service_requests_project
        ON service_requests(project_id, status, received_at DESC);
      CREATE INDEX IF NOT EXISTS idx_service_requests_status_priority
        ON service_requests(status, priority, received_at DESC);
      CREATE INDEX IF NOT EXISTS idx_service_requests_next_action
        ON service_requests(status, next_action_at);

      CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY,
        intervention_number TEXT NOT NULL UNIQUE,
        client_account_id TEXT NOT NULL REFERENCES client_accounts(id),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        project_node_id TEXT REFERENCES project_nodes(id) ON DELETE SET NULL,
        source_request_id TEXT UNIQUE REFERENCES service_requests(id) ON DELETE SET NULL,
        maintenance_period_id TEXT,
        hour_pack_id TEXT,
        intervention_type TEXT NOT NULL DEFAULT 'other' CHECK (intervention_type IN (
          'correction', 'modification', 'addition', 'maintenance', 'incident', 'support', 'training', 'other'
        )),
        status TEXT NOT NULL DEFAULT 'to_plan' CHECK (status IN (
          'to_plan', 'planned', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'completed', 'cancelled', 'archived'
        )),
        coverage_mode TEXT NOT NULL DEFAULT 'out_of_scope' CHECK (coverage_mode IN (
          'maintenance', 'hour_pack', 'out_of_scope', 'commercial_gesture', 'included_project', 'internal'
        )),
        subject TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        scheduled_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        theoretical_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (theoretical_value_cents >= 0),
        billable_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (billable_amount_cents >= 0),
        notes TEXT,
        incident_criticality TEXT CHECK (incident_criticality IS NULL OR incident_criticality IN ('normal', 'urgent', 'critical')),
        incident_started_at TEXT,
        incident_resolved_at TEXT,
        downtime_minutes INTEGER CHECK (downtime_minutes IS NULL OR downtime_minutes >= 0),
        incident_cause TEXT,
        incident_diagnosis TEXT,
        incident_solution TEXT,
        incident_follow_up TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        CHECK (project_node_id IS NULL OR project_id IS NOT NULL),
        CHECK (intervention_type='incident' OR (
          incident_criticality IS NULL AND incident_started_at IS NULL AND incident_resolved_at IS NULL
          AND downtime_minutes IS NULL AND incident_cause IS NULL AND incident_diagnosis IS NULL
          AND incident_solution IS NULL AND incident_follow_up IS NULL
        ))
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_interventions_client
        ON interventions(client_account_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_project
        ON interventions(project_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_node
        ON interventions(project_node_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_status
        ON interventions(status, scheduled_at, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_type
        ON interventions(intervention_type, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_coverage
        ON interventions(coverage_mode, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_maintenance_period
        ON interventions(maintenance_period_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_hour_pack
        ON interventions(hour_pack_id, created_at DESC);

      ALTER TABLE time_sessions ADD COLUMN intervention_id TEXT REFERENCES interventions(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_time_sessions_intervention
        ON time_sessions(intervention_id, started_at DESC);
    `,
  },
  {
    id: 12,
    name: 'phase_4_maintenance',
    sql: `
      CREATE TABLE IF NOT EXISTS maintenance_checklist_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_checklist_templates_name
        ON maintenance_checklist_templates(name COLLATE NOCASE)
        WHERE archived_at IS NULL;

      CREATE TABLE IF NOT EXISTS maintenance_checklist_template_items (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL REFERENCES maintenance_checklist_templates(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_maintenance_template_items
        ON maintenance_checklist_template_items(template_id, sort_order);

      CREATE TABLE IF NOT EXISTS maintenance_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        periodic_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (periodic_price_cents >= 0),
        frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
        included_interventions INTEGER NOT NULL DEFAULT 0 CHECK (included_interventions >= 0),
        included_minutes INTEGER CHECK (included_minutes IS NULL OR included_minutes >= 0),
        carryover_mode TEXT NOT NULL DEFAULT 'none' CHECK (carryover_mode IN ('none', 'next_period', 'custom')),
        checklist_template_id TEXT REFERENCES maintenance_checklist_templates(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_plans_name
        ON maintenance_plans(name COLLATE NOCASE)
        WHERE archived_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_maintenance_plans_status
        ON maintenance_plans(status, frequency);

      CREATE TABLE IF NOT EXISTS maintenance_subscriptions (
        id TEXT PRIMARY KEY,
        client_account_id TEXT NOT NULL REFERENCES client_accounts(id),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        plan_id TEXT REFERENCES maintenance_plans(id) ON DELETE SET NULL,
        plan_name_snapshot TEXT NOT NULL,
        frequency_snapshot TEXT NOT NULL CHECK (frequency_snapshot IN ('monthly', 'quarterly', 'yearly')),
        included_interventions_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (included_interventions_snapshot >= 0),
        included_minutes_snapshot INTEGER CHECK (included_minutes_snapshot IS NULL OR included_minutes_snapshot >= 0),
        catalog_price_cents_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (catalog_price_cents_snapshot >= 0),
        contract_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (contract_price_cents >= 0),
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'ended', 'archived')),
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        CHECK (end_date IS NULL OR end_date >= start_date)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_client
        ON maintenance_subscriptions(client_account_id, status, start_date DESC);
      CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_project
        ON maintenance_subscriptions(project_id, status, start_date DESC);
      CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_plan
        ON maintenance_subscriptions(plan_id, status);

      CREATE TABLE IF NOT EXISTS maintenance_periods (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL REFERENCES maintenance_subscriptions(id) ON DELETE CASCADE,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        included_interventions INTEGER NOT NULL DEFAULT 0 CHECK (included_interventions >= 0),
        included_minutes INTEGER CHECK (included_minutes IS NULL OR included_minutes >= 0),
        status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'to_do', 'in_progress', 'completed', 'closed')),
        closed_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (period_end >= period_start),
        UNIQUE (subscription_id, period_start, period_end)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_maintenance_periods_subscription
        ON maintenance_periods(subscription_id, period_start DESC);
      CREATE INDEX IF NOT EXISTS idx_maintenance_periods_status
        ON maintenance_periods(status, period_start, period_end);

      CREATE TABLE IF NOT EXISTS maintenance_checks (
        id TEXT PRIMARY KEY,
        period_id TEXT NOT NULL REFERENCES maintenance_periods(id) ON DELETE CASCADE,
        template_item_id TEXT REFERENCES maintenance_checklist_template_items(id) ON DELETE SET NULL,
        label TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'not_applicable')),
        completed_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (period_id, sort_order, label)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_maintenance_checks_period
        ON maintenance_checks(period_id, status, sort_order);

      INSERT OR IGNORE INTO maintenance_checklist_templates
        (id,name,description,status,created_at,updated_at)
      VALUES
        ('seed-maintenance-wordpress','Maintenance WordPress standard','Checklist initiale AtoumWeb, modifiable dans le Manager.','active',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

      INSERT OR IGNORE INTO maintenance_checklist_template_items
        (id,template_id,label,description,sort_order,is_required,created_at)
      VALUES
        ('seed-maintenance-wp-01','seed-maintenance-wordpress','Mises à jour WordPress','Vérifier et appliquer les mises à jour WordPress pertinentes.',10,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-wp-02','seed-maintenance-wordpress','Mises à jour thème et extensions','Vérifier et appliquer les mises à jour du thème et des extensions.',20,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-wp-03','seed-maintenance-wordpress','Vérification des sauvegardes','Contrôler qu’une sauvegarde exploitable existe.',30,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-wp-04','seed-maintenance-wordpress','Contrôle sécurité','Effectuer le contrôle sécurité prévu au contrat.',40,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-wp-05','seed-maintenance-wordpress','Contrôle des formulaires','Tester les formulaires essentiels du site.',50,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-wp-06','seed-maintenance-wordpress','Contrôle disponibilité','Vérifier la disponibilité générale du site.',60,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-wp-07','seed-maintenance-wordpress','Contrôle rapide des performances','Repérer une éventuelle dégradation manifeste des performances.',70,0,strftime('%Y-%m-%dT%H:%M:%fZ','now'));

      INSERT OR IGNORE INTO maintenance_plans
        (id,name,periodic_price_cents,frequency,included_interventions,included_minutes,carryover_mode,checklist_template_id,status,notes,created_at,updated_at)
      VALUES
        ('seed-maintenance-49','Maintenance 49 €/mois',4900,'monthly',2,NULL,'none','seed-maintenance-wordpress','active','Référence initiale AtoumWeb, modifiable.',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        ('seed-maintenance-99','Maintenance 99 €/mois',9900,'monthly',4,NULL,'none','seed-maintenance-wordpress','active','Référence initiale AtoumWeb, modifiable.',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
    `,
  },
  {
    id: 13,
    name: 'phase_4_hour_packs',
    sql: `
      CREATE TABLE IF NOT EXISTS hour_packs (
        id TEXT PRIMARY KEY,
        client_account_id TEXT NOT NULL REFERENCES client_accounts(id),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        purchased_seconds INTEGER NOT NULL CHECK (purchased_seconds > 0),
        contract_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (contract_price_cents >= 0),
        purchased_at TEXT NOT NULL,
        expires_at TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','exhausted','expired','suspended','archived')),
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        CHECK (expires_at IS NULL OR expires_at >= purchased_at)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_hour_packs_client
        ON hour_packs(client_account_id, status, purchased_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hour_packs_project
        ON hour_packs(project_id, status, purchased_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hour_packs_expiration
        ON hour_packs(status, expires_at);

      CREATE TABLE IF NOT EXISTS hour_pack_movements (
        id TEXT PRIMARY KEY,
        pack_id TEXT NOT NULL REFERENCES hour_packs(id) ON DELETE CASCADE,
        intervention_id TEXT REFERENCES interventions(id) ON DELETE SET NULL,
        time_session_id TEXT REFERENCES time_sessions(id) ON DELETE SET NULL,
        reversal_of_movement_id TEXT REFERENCES hour_pack_movements(id) ON DELETE SET NULL,
        movement_type TEXT NOT NULL CHECK (movement_type IN (
          'initial_credit','intervention_debit','manual_correction','commercial_credit','reversal'
        )),
        seconds_delta INTEGER NOT NULL CHECK (seconds_delta <> 0),
        reason TEXT NOT NULL,
        source_key TEXT UNIQUE,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_hour_pack_movements_pack
        ON hour_pack_movements(pack_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hour_pack_movements_intervention
        ON hour_pack_movements(intervention_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hour_pack_movements_session
        ON hour_pack_movements(time_session_id, created_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_hour_pack_one_reversal
        ON hour_pack_movements(reversal_of_movement_id)
        WHERE reversal_of_movement_id IS NOT NULL;
    `,
  },
];

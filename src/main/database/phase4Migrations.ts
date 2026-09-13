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

      CREATE INDEX IF NOT EXISTS idx_time_sessions_intervention
        ON time_sessions(intervention_id, started_at DESC);
    `,
  },
];

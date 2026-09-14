export const PHASE_4_OVERAGE_MIGRATIONS = [
  {
    id: 15,
    name: 'phase_4_maintenance_overage_decisions',
    sql: `
      ALTER TABLE maintenance_subscriptions
        ADD COLUMN carryover_mode_snapshot TEXT NOT NULL DEFAULT 'none'
        CHECK (carryover_mode_snapshot IN ('none','next_period','custom'));

      UPDATE maintenance_subscriptions
      SET carryover_mode_snapshot = COALESCE((
        SELECT mp.carryover_mode
        FROM maintenance_plans mp
        WHERE mp.id = maintenance_subscriptions.plan_id
      ), 'none');

      CREATE TRIGGER IF NOT EXISTS trg_maintenance_subscription_carryover_snapshot
      AFTER INSERT ON maintenance_subscriptions
      WHEN NEW.plan_id IS NOT NULL
      BEGIN
        UPDATE maintenance_subscriptions
        SET carryover_mode_snapshot = COALESCE((
          SELECT mp.carryover_mode FROM maintenance_plans mp WHERE mp.id = NEW.plan_id
        ), 'none')
        WHERE id = NEW.id;
      END;

      CREATE TABLE IF NOT EXISTS maintenance_overage_decisions (
        id TEXT PRIMARY KEY,
        period_id TEXT NOT NULL REFERENCES maintenance_periods(id) ON DELETE CASCADE,
        intervention_id TEXT NOT NULL UNIQUE REFERENCES interventions(id) ON DELETE CASCADE,
        decision TEXT NOT NULL CHECK (decision IN (
          'bill_out_of_scope','commercial_gesture','include_exceptionally','carry_forward','other'
        )),
        reason TEXT NOT NULL,
        expected_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (expected_amount_cents >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_maintenance_overage_period
        ON maintenance_overage_decisions(period_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_maintenance_overage_decision
        ON maintenance_overage_decisions(decision, created_at DESC);
    `,
  },
];

export const PHASE_4_PACK_SHORTFALL_MIGRATIONS = [
  {
    id: 17,
    name: 'phase_4_hour_pack_shortfall_decisions',
    sql: `
      CREATE TABLE IF NOT EXISTS hour_pack_shortfall_decisions (
        id TEXT PRIMARY KEY,
        pack_id TEXT NOT NULL REFERENCES hour_packs(id) ON DELETE CASCADE,
        debit_movement_id TEXT NOT NULL UNIQUE REFERENCES hour_pack_movements(id) ON DELETE CASCADE,
        intervention_id TEXT NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
        decision TEXT NOT NULL CHECK (decision IN (
          'bill_complement','allow_negative','use_other_pack','commercial_gesture','other'
        )),
        reason TEXT NOT NULL,
        shortfall_seconds INTEGER NOT NULL CHECK (shortfall_seconds > 0),
        expected_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (expected_amount_cents >= 0),
        alternative_pack_id TEXT REFERENCES hour_packs(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (pack_id, intervention_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_hour_pack_shortfall_pack
        ON hour_pack_shortfall_decisions(pack_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hour_pack_shortfall_intervention
        ON hour_pack_shortfall_decisions(intervention_id);
      CREATE INDEX IF NOT EXISTS idx_hour_pack_shortfall_decision
        ON hour_pack_shortfall_decisions(decision, created_at DESC);
    `,
  },
];

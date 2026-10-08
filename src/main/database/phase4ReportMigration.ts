import { PHASE_4_PACK_SHORTFALL_MIGRATIONS } from './phase4PackShortfallMigration';

export const PHASE_4_REPORT_MIGRATIONS = [
  {
    id: 16,
    name: 'phase_4_maintenance_report_drafts',
    sql: `
      CREATE TABLE IF NOT EXISTS maintenance_report_drafts (
        period_id TEXT PRIMARY KEY REFERENCES maintenance_periods(id) ON DELETE CASCADE,
        client_summary TEXT,
        anomalies_actions TEXT,
        recommendations TEXT,
        updated_at TEXT NOT NULL
      ) STRICT;
    `,
  },
  ...PHASE_4_PACK_SHORTFALL_MIGRATIONS,
];

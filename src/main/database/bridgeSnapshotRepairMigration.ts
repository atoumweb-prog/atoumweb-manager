import type { Migration } from './migrations';

export const BRIDGE_SNAPSHOT_REPAIR_MIGRATION: Migration = {
  id: 37,
  name: 'bridge_snapshot_sections_repair',
  sql: `
    CREATE TABLE IF NOT EXISTS bridge_snapshot_sections (
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id) ON DELETE CASCADE,
      section_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(snapshot_id, section_key)
    ) STRICT;
  `,
};

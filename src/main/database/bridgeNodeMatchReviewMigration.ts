import type { Migration } from './migrations';

export const BRIDGE_NODE_MATCH_REVIEW_MIGRATION: Migration = {
  id: 42,
  name: 'bridge_node_match_reconsideration_history',
  sql: `CREATE TABLE bridge_node_match_history (
    id TEXT PRIMARY KEY,
    before_page_snapshot_id TEXT NOT NULL REFERENCES bridge_page_snapshots(id),
    after_page_snapshot_id TEXT NOT NULL REFERENCES bridge_page_snapshots(id),
    decision_json TEXT NOT NULL,
    reopened_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX idx_bridge_node_match_history_pages ON bridge_node_match_history(before_page_snapshot_id,after_page_snapshot_id);`,
};

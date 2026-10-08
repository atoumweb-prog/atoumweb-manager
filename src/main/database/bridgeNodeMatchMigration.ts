import type { Migration } from './migrations';

export const BRIDGE_NODE_MATCH_MIGRATION: Migration = {
  id: 41,
  name: 'bridge_node_match_human_decisions',
  sql: `
    CREATE TABLE bridge_logical_nodes (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES bridge_sites(id),
      source_page_key TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE bridge_node_match_decisions (
      id TEXT PRIMARY KEY,
      before_node_id TEXT NOT NULL REFERENCES bridge_nodes(id),
      after_node_id TEXT NOT NULL REFERENCES bridge_nodes(id),
      decision TEXT NOT NULL CHECK(decision IN ('accepted','rejected')),
      logical_node_id TEXT REFERENCES bridge_logical_nodes(id),
      proposal_json TEXT NOT NULL,
      decided_at TEXT NOT NULL,
      decision_source TEXT NOT NULL CHECK(decision_source='manager_human'),
      CHECK(before_node_id <> after_node_id),
      CHECK((decision='accepted' AND logical_node_id IS NOT NULL) OR (decision='rejected' AND logical_node_id IS NULL)),
      UNIQUE(before_node_id,after_node_id)
    ) STRICT;
    CREATE TABLE bridge_node_logical_assignments (
      node_id TEXT PRIMARY KEY REFERENCES bridge_nodes(id),
      logical_node_id TEXT NOT NULL REFERENCES bridge_logical_nodes(id),
      snapshot_id TEXT NOT NULL REFERENCES bridge_snapshots(id),
      decision_id TEXT NOT NULL REFERENCES bridge_node_match_decisions(id),
      UNIQUE(logical_node_id,snapshot_id)
    ) STRICT;
  `,
};

import type { Migration } from './migrations';

/**
 * Append-only history for editorial review decisions.
 * Migration 77 retains the latest decision per draft; this table preserves every successive review.
 */
export const CONTRACT_CONVERGENCE_DECISION_HISTORY_MIGRATION: Migration = {
  id: 78,
  name: 'contract_convergence_decision_history',
  sql: `
    CREATE TABLE contract_convergence_decision_events (
      id TEXT PRIMARY KEY,
      clause_code TEXT NOT NULL,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id),
      draft_version_id TEXT NOT NULL REFERENCES contract_clause_versions(id),
      proposal_sha256 TEXT NOT NULL,
      decision TEXT NOT NULL CHECK (decision IN ('approved_for_publication','needs_revision')),
      reviewer TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX idx_contract_convergence_decision_events_draft
      ON contract_convergence_decision_events(draft_version_id, created_at DESC);

    INSERT INTO contract_convergence_decision_events
      (id,clause_code,clause_id,draft_version_id,proposal_sha256,decision,reviewer,note,created_at)
    SELECT id,clause_code,clause_id,draft_version_id,proposal_sha256,decision,reviewer,
      COALESCE(NULLIF(TRIM(note), ''), '[Note absente dans la décision antérieure à la migration 78]'),
      created_at
    FROM contract_convergence_decisions;
  `,
};

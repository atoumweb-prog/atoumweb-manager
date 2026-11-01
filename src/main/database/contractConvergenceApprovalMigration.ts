import type { Migration } from './migrations';

/** Human editorial decisions are independent from publication and never mutate historical versions. */
export const CONTRACT_CONVERGENCE_APPROVAL_MIGRATION: Migration = {
  id: 77,
  name: 'contract_convergence_human_approval',
  sql: `
    CREATE TABLE contract_convergence_decisions (
      id TEXT PRIMARY KEY,
      clause_code TEXT NOT NULL,
      clause_id TEXT NOT NULL REFERENCES contract_clause_templates(id),
      draft_version_id TEXT NOT NULL REFERENCES contract_clause_versions(id),
      proposal_sha256 TEXT NOT NULL,
      decision TEXT NOT NULL CHECK (decision IN ('approved_for_publication','needs_revision')),
      reviewer TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (draft_version_id)
    ) STRICT;
    CREATE INDEX idx_contract_convergence_decisions_code
      ON contract_convergence_decisions(clause_code, created_at DESC);
  `,
};

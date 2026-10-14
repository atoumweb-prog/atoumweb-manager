import type { Migration } from './migrations';

/** Additive 05C store: no backfill or changes to any historical quote. */
export const CONTRACT_SECTION_REVIEW_MIGRATION: Migration = {
  id: 69,
  name: 'contract_clause_section_review_v1',
  sql: `
    CREATE TABLE contract_clause_section_reviews (
      clause_version_id TEXT PRIMARY KEY REFERENCES contract_clause_versions(id) ON DELETE CASCADE,
      section_key TEXT CHECK (section_key IN ('object','scope','execution','delivery','finance','rights','recurring','end')),
      rank_in_section INTEGER CHECK (rank_in_section IS NULL OR rank_in_section >= 0),
      status TEXT NOT NULL DEFAULT 'unclassified' CHECK (status IN ('unclassified','proposed','approved')),
      reason TEXT,
      reviewer TEXT,
      reviewed_at TEXT,
      updated_at TEXT NOT NULL,
      CHECK (
        (status='unclassified' AND section_key IS NULL AND rank_in_section IS NULL)
        OR (status='proposed' AND section_key IS NOT NULL AND rank_in_section IS NOT NULL AND length(trim(coalesce(reason,'')))>0)
        OR (status='approved' AND section_key IS NOT NULL AND rank_in_section IS NOT NULL AND length(trim(coalesce(reviewer,'')))>0 AND reviewed_at IS NOT NULL)
      )
    ) STRICT;
    CREATE INDEX idx_contract_section_review_sort ON contract_clause_section_reviews(status,section_key,rank_in_section,clause_version_id);
  `,
};

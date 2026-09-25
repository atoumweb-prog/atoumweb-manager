import type { Migration } from './migrations';

export const CONTRACT_AUDIENCE_MIGRATION: Migration = {
  id: 41,
  name: 'contract_clause_audience',
  sql: `
    ALTER TABLE contract_clause_templates
      ADD COLUMN audience TEXT NOT NULL DEFAULT 'all'
      CHECK (audience IN ('all', 'professional', 'consumer'));

    ALTER TABLE quotes
      ADD COLUMN contract_audience TEXT
      CHECK (contract_audience IS NULL OR contract_audience IN ('professional', 'consumer'));

    CREATE INDEX idx_contract_clause_templates_audience
      ON contract_clause_templates(scope, audience, status, sort_order);
  `,
};

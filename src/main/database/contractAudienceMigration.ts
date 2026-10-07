import type { Migration } from './migrations';

export const CONTRACT_AUDIENCE_MIGRATION: Migration = {
  id: 46,
  name: 'contract_clause_audience',
  sql: `
    ALTER TABLE contract_clause_templates
      ADD COLUMN audience TEXT NOT NULL DEFAULT 'all'
      CHECK (audience IN ('all', 'professional', 'consumer'));

    ALTER TABLE quotes
      ADD COLUMN contract_audience TEXT
      CHECK (contract_audience IS NULL OR contract_audience IN ('professional', 'consumer'));

    UPDATE quotes
    SET contract_audience = CASE
      WHEN EXISTS (
        SELECT 1 FROM client_accounts ca
        WHERE ca.id = COALESCE(quotes.client_account_id, quotes.accepted_client_account_id)
          AND ca.organization_id IS NOT NULL
      ) OR EXISTS (
        SELECT 1 FROM prospects p
        WHERE p.id = quotes.prospect_id
          AND p.organization_id IS NOT NULL
      )
      THEN 'professional'
      ELSE 'consumer'
    END
    WHERE contract_audience IS NULL;

    CREATE INDEX idx_contract_clause_templates_audience
      ON contract_clause_templates(scope, audience, status, sort_order);
  `,
};

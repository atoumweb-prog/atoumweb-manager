import type { Migration } from './migrations';

export const PROSPECT_RECIPE_UX_MIGRATION: Migration = {
  id: 21,
  name: 'prospect_recipe_actions_information_items',
  sql: `
    ALTER TABLE crm_actions ADD COLUMN target_contact_id TEXT REFERENCES contacts(id);
    ALTER TABLE crm_actions ADD COLUMN reason_code TEXT;
    ALTER TABLE crm_actions ADD COLUMN reason_text TEXT;
    CREATE INDEX IF NOT EXISTS idx_crm_actions_target_contact ON crm_actions(target_contact_id, status, due_at);

    CREATE TABLE prospect_information_items (
      id TEXT PRIMARY KEY,
      prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','later')),
      is_blocking INTEGER NOT NULL DEFAULT 1 CHECK (is_blocking IN (0,1)),
      answer TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX idx_prospect_information_items_prospect
      ON prospect_information_items(prospect_id, status, is_blocking, created_at);

    INSERT INTO prospect_information_items (
      id, prospect_id, label, status, is_blocking, answer, resolved_at, created_at, updated_at
    )
    SELECT 'legacy-missing-' || id, id, trim(missing_information), 'open', 1, NULL, NULL, updated_at, updated_at
    FROM prospects
    WHERE NULLIF(trim(missing_information), '') IS NOT NULL;
  `,
};

import type { Migration } from './migrations';

export const PROSPECT_RECIPE_UX_MIGRATION: Migration = {
  id: 21,
  name: 'prospect_recipe_action_context',
  sql: `
    ALTER TABLE crm_actions ADD COLUMN target_contact_id TEXT REFERENCES contacts(id);
    ALTER TABLE crm_actions ADD COLUMN reason_code TEXT;
    ALTER TABLE crm_actions ADD COLUMN reason_text TEXT;
    CREATE INDEX IF NOT EXISTS idx_crm_actions_target_contact ON crm_actions(target_contact_id, status, due_at);
  `,
};

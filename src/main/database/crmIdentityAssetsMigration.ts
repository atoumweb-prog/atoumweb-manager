import type { Migration } from './migrations';

export const CRM_IDENTITY_ASSETS_MIGRATION: Migration = {
  id: 34,
  name: 'crm_identity_assets',
  sql: `
    CREATE TABLE IF NOT EXISTS crm_identity_assets (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('logo','favicon','avatar')),
      relative_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (
        (organization_id IS NOT NULL AND contact_id IS NULL)
        OR (organization_id IS NULL AND contact_id IS NOT NULL)
      )
    ) STRICT;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_identity_assets_org_role
      ON crm_identity_assets(organization_id, role)
      WHERE organization_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_identity_assets_contact_role
      ON crm_identity_assets(contact_id, role)
      WHERE contact_id IS NOT NULL;
  `,
};

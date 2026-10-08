import type { Migration } from './migrations';

export const STABILISATION_PHASE_19_MIGRATION: Migration = {
  id: 19,
  name: 'stabilisation_commercial_relationship_documents',
  disableForeignKeys: true,
  sql: `
    PRAGMA defer_foreign_keys = ON;

    CREATE TABLE prospects_v19 (
      id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id), contact_id TEXT REFERENCES contacts(id),
      client_account_id TEXT REFERENCES client_accounts(id),
      stage TEXT NOT NULL CHECK (stage IN ('new','qualifying','need_identified','quote_to_prepare','quote_to_send','quote_sent','follow_up','negotiation','waiting','won','lost')),
      temperature TEXT NOT NULL DEFAULT 'neutral' CHECK (temperature IN ('cold','neutral','warm','hot')),
      source TEXT CHECK (source IN ('website','referral','google','social','event','outbound','former_client','other')),
      source_detail TEXT, primary_need TEXT, secondary_need TEXT,
      budget_min_cents INTEGER CHECK (budget_min_cents IS NULL OR budget_min_cents >= 0),
      budget_max_cents INTEGER CHECK (budget_max_cents IS NULL OR budget_max_cents >= 0),
      estimated_value_cents INTEGER CHECK (estimated_value_cents IS NULL OR estimated_value_cents >= 0),
      probability_percent INTEGER CHECK (probability_percent IS NULL OR probability_percent BETWEEN 0 AND 100),
      next_action_at TEXT, next_action_text TEXT, target_date TEXT, lost_reason TEXT, notes TEXT, won_at TEXT, lost_at TEXT,
      decision_status TEXT CHECK (decision_status IS NULL OR decision_status IN ('yes','no','unknown')),
      decision_maker_details TEXT, project_summary TEXT, project_context TEXT,
      budget_status TEXT CHECK (budget_status IS NULL OR budget_status IN ('known','range','not_disclosed')),
      timeline_status TEXT CHECK (timeline_status IS NULL OR timeline_status IN ('date','note','not_disclosed')),
      timeline_note TEXT, existing_status TEXT CHECK (existing_status IS NULL OR existing_status IN ('yes','no','unknown')),
      existing_url TEXT, existing_notes TEXT, missing_information TEXT,
      waiting_reason_code TEXT, waiting_reason_text TEXT, waiting_resume_at TEXT, lost_reason_code TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT,
      CHECK (organization_id IS NOT NULL OR contact_id IS NOT NULL),
      CHECK (budget_min_cents IS NULL OR budget_max_cents IS NULL OR budget_min_cents <= budget_max_cents),
      CHECK (stage <> 'lost' OR lost_reason IS NOT NULL)
    ) STRICT;
    INSERT INTO prospects_v19 (
      id,organization_id,contact_id,client_account_id,stage,temperature,source,source_detail,primary_need,secondary_need,
      budget_min_cents,budget_max_cents,estimated_value_cents,probability_percent,next_action_at,next_action_text,target_date,
      lost_reason,notes,won_at,lost_at,created_at,updated_at,archived_at
    ) SELECT id,organization_id,contact_id,client_account_id,stage,
      CASE WHEN temperature IN ('cold','warm','hot') THEN temperature ELSE 'neutral' END,
      source,source_detail,primary_need,secondary_need,budget_min_cents,budget_max_cents,estimated_value_cents,probability_percent,
      next_action_at,next_action_text,target_date,lost_reason,notes,won_at,lost_at,created_at,updated_at,archived_at FROM prospects;
    DROP TABLE prospects;
    ALTER TABLE prospects_v19 RENAME TO prospects;
    CREATE INDEX idx_prospects_stage ON prospects(stage, archived_at);
    CREATE INDEX idx_prospects_next_action ON prospects(next_action_at);
    CREATE INDEX idx_prospects_client ON prospects(client_account_id);
    CREATE INDEX idx_prospects_organization ON prospects(organization_id);
    CREATE INDEX idx_prospects_contact ON prospects(contact_id);
    CREATE TRIGGER link_prospect_needs AFTER UPDATE OF client_account_id ON prospects
    WHEN NEW.client_account_id IS NOT NULL
    BEGIN
      UPDATE crm_needs SET client_account_id=NEW.client_account_id WHERE prospect_id=NEW.id;
    END;

    ALTER TABLE client_accounts ADD COLUMN relationship_status TEXT NOT NULL DEFAULT 'neutral'
      CHECK (relationship_status IN ('excellent','good','neutral','watch','difficult'));
    ALTER TABLE client_accounts ADD COLUMN relationship_note TEXT;

    CREATE TABLE contact_methods (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
      method_type TEXT NOT NULL CHECK (method_type IN ('email','phone')),
      value TEXT NOT NULL, label TEXT, is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
      notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT,
      CHECK ((organization_id IS NOT NULL AND contact_id IS NULL) OR (organization_id IS NULL AND contact_id IS NOT NULL))
    ) STRICT;
    CREATE INDEX idx_contact_methods_organization ON contact_methods(organization_id,method_type,archived_at);
    CREATE INDEX idx_contact_methods_contact ON contact_methods(contact_id,method_type,archived_at);
    CREATE UNIQUE INDEX idx_contact_methods_org_value ON contact_methods(organization_id,method_type,value) WHERE organization_id IS NOT NULL AND archived_at IS NULL;
    CREATE UNIQUE INDEX idx_contact_methods_contact_value ON contact_methods(contact_id,method_type,value) WHERE contact_id IS NOT NULL AND archived_at IS NULL;
    INSERT OR IGNORE INTO contact_methods (id,organization_id,method_type,value,label,is_primary,created_at,updated_at)
      SELECT 'legacy-org-email-'||id,id,'email',trim(email),'Principal',1,created_at,updated_at FROM organizations WHERE NULLIF(trim(email),'') IS NOT NULL;
    INSERT OR IGNORE INTO contact_methods (id,organization_id,method_type,value,label,is_primary,created_at,updated_at)
      SELECT 'legacy-org-phone-'||id,id,'phone',trim(phone),'Principal',1,created_at,updated_at FROM organizations WHERE NULLIF(trim(phone),'') IS NOT NULL;
    INSERT OR IGNORE INTO contact_methods (id,contact_id,method_type,value,label,is_primary,created_at,updated_at)
      SELECT 'legacy-contact-email-'||id,id,'email',trim(email),'Principal',1,created_at,updated_at FROM contacts WHERE NULLIF(trim(email),'') IS NOT NULL;
    INSERT OR IGNORE INTO contact_methods (id,contact_id,method_type,value,label,is_primary,created_at,updated_at)
      SELECT 'legacy-contact-phone-'||id,id,'phone',trim(phone),'Principal',1,created_at,updated_at FROM contacts WHERE NULLIF(trim(phone),'') IS NOT NULL;

    ALTER TABLE crm_actions ADD COLUMN completion_channel TEXT;
    ALTER TABLE crm_actions ADD COLUMN completion_outcome TEXT;
    ALTER TABLE crm_actions ADD COLUMN completion_notes TEXT;
    ALTER TABLE crm_actions ADD COLUMN related_type TEXT;
    ALTER TABLE crm_actions ADD COLUMN related_id TEXT;
    ALTER TABLE crm_actions ADD COLUMN recurrence TEXT CHECK (recurrence IS NULL OR recurrence IN ('none','weekly','monthly','quarterly','yearly'));

    ALTER TABLE quotes ADD COLUMN finalized_at TEXT;
    ALTER TABLE quotes ADD COLUMN last_extended_at TEXT;

    CREATE TABLE client_documents (
      id TEXT PRIMARY KEY, client_account_id TEXT NOT NULL REFERENCES client_accounts(id) ON DELETE RESTRICT,
      category TEXT NOT NULL CHECK (category IN ('contract','quote','invoice','brief','content','technical','legal','other')),
      title TEXT NOT NULL, original_name TEXT NOT NULL, relative_path TEXT NOT NULL UNIQUE, mime_type TEXT, size_bytes INTEGER NOT NULL DEFAULT 0,
      retention_code TEXT, retention_reason TEXT, retention_until TEXT, notes TEXT,
      archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX idx_client_documents_client ON client_documents(client_account_id,archived_at,category);
    CREATE INDEX idx_client_documents_retention ON client_documents(retention_until,archived_at);
  `,
};

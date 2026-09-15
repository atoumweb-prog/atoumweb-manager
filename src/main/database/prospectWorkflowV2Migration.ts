import type { Migration } from './migrations';

export const PROSPECT_WORKFLOW_V2_MIGRATION: Migration = {
  id: 20,
  name: 'prospect_workflow_v2_qualification',
  sql: `
    ALTER TABLE prospects ADD COLUMN origin_type TEXT NOT NULL DEFAULT 'other'
      CHECK (origin_type IN ('outbound','inbound','referral','existing','partner','other'));
    ALTER TABLE prospects ADD COLUMN prospecting_started_at TEXT;
    ALTER TABLE prospects ADD COLUMN qualification_validated_at TEXT;
    ALTER TABLE prospects ADD COLUMN targeting_reason_code TEXT;
    ALTER TABLE prospects ADD COLUMN targeting_reason_text TEXT;
    ALTER TABLE prospects ADD COLUMN initial_observation TEXT;
    ALTER TABLE prospects ADD COLUMN detected_opportunity TEXT;
    ALTER TABLE prospects ADD COLUMN first_contact_result_code TEXT;
    ALTER TABLE prospects ADD COLUMN first_contact_result_text TEXT;
    ALTER TABLE prospects ADD COLUMN interest_level TEXT
      CHECK (interest_level IS NULL OR interest_level IN ('none','low','confirm','interested','very_interested'));

    -- Le contact maître est la source de vérité du décisionnaire.
    ALTER TABLE prospects ADD COLUMN decision_maker_contact_id TEXT REFERENCES contacts(id);
    CREATE INDEX IF NOT EXISTS idx_prospects_decision_maker_contact ON prospects(decision_maker_contact_id);

    -- Colonnes transitoires conservées pendant la migration du formulaire historique.
    -- Elles ne doivent pas devenir une deuxième source de vérité pour les coordonnées.
    ALTER TABLE prospects ADD COLUMN decision_maker_name TEXT;
    ALTER TABLE prospects ADD COLUMN decision_maker_role TEXT;
    ALTER TABLE prospects ADD COLUMN decision_maker_email TEXT;
    ALTER TABLE prospects ADD COLUMN decision_maker_phone TEXT;

    UPDATE prospects
    SET origin_type = CASE
      WHEN source = 'outbound' THEN 'outbound'
      WHEN source IN ('website','google','social') THEN 'inbound'
      WHEN source = 'referral' THEN 'referral'
      WHEN source = 'former_client' THEN 'existing'
      ELSE 'other'
    END;
  `,
};

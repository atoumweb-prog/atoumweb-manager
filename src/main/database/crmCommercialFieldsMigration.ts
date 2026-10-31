import type { Migration } from './migrations';
export const CRM_COMMERCIAL_FIELDS_MIGRATION:Migration={id:73,name:'crm_initial_request_and_legacy_brief',sql:`
  ALTER TABLE prospects ADD COLUMN initial_request TEXT;
  ALTER TABLE prospects ADD COLUMN legacy_brief_json TEXT;
  ALTER TABLE prospects ADD COLUMN confirmed_brief_at TEXT;
  UPDATE prospects SET legacy_brief_json=json_object('provenance','pre-73-ambiguous','projectSummary',project_summary,'projectContext',project_context,'primaryNeed',primary_need,'secondaryNeed',secondary_need)
  WHERE project_summary IS NOT NULL OR project_context IS NOT NULL OR primary_need IS NOT NULL OR secondary_need IS NOT NULL;
`};

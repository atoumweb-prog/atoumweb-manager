import type { Migration } from './migrations';

/** 04D follow-up: additive metadata, preserves all historical associations and quote snapshots.
 * ID 70 IS PROVISIONAL until the coordinator validates persistent databases.
 */
export const CATALOG_RECOMMENDATION_DETAILS_MIGRATION: Migration = {
  id: 70,
  name: 'catalog_recommendation_details_v1',
  sql: `
    ALTER TABLE catalog_version_recommendations ADD COLUMN reason TEXT NOT NULL DEFAULT '';
    ALTER TABLE catalog_version_recommendations ADD COLUMN rule_status TEXT NOT NULL DEFAULT 'active'
      CHECK (rule_status IN ('active','paused'));
    ALTER TABLE catalog_version_recommendations ADD COLUMN conditions TEXT NOT NULL DEFAULT '';
    ALTER TABLE catalog_version_recommendations ADD COLUMN provenance TEXT NOT NULL DEFAULT 'manual';
  `,
};

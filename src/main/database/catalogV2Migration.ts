export const CATALOG_V2_MIGRATION = {
  id: 31,
  name: 'catalog_v2_service_nature',
  sql: `
    ALTER TABLE catalog_versions ADD COLUMN nature TEXT;
  `,
};

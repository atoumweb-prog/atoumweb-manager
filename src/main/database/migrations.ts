import { CONTRACT_TYPES_MIGRATION } from './contractTypesMigration';
import { CATALOG_CATEGORY_ADMIN_MIGRATION } from './catalogCategoryAdminMigration';
import { OPERATIONAL_SALES_ADDON_MIGRATION } from './operationalSalesAddonMigration';
import { OPERATIONAL_SALES_MIGRATION } from './operationalSalesMigration';
import { COMMERCIAL_RULES_MIGRATION } from './commercialRulesMigration';
import { OPERATIONAL_LINK_LIFECYCLE_MIGRATION } from './operationalLinkLifecycleMigration';
import { PROJECT_CONTRIBUTION_TARGET_MIGRATION } from './projectContributionTargetMigration';
import { PROJECT_OPERATIONAL_MIGRATION } from './projectOperationalMigration';
import { PROJECT_COMPOSITION_MIGRATION } from './projectCompositionMigration';
import { PROJECT_PROVISIONAL_MIGRATION } from './projectProvisionalMigration';
import { QUOTE_OPTIONS_MIGRATION } from './quoteOptionsMigration';
import { STABILISATION_MIGRATION } from './stabilisationMigration';
import { STABILISATION_PHASE_19_MIGRATION } from './stabilisationPhase19Migration';
import { PROSPECT_WORKFLOW_V2_MIGRATION } from './prospectWorkflowV2Migration';
import { PROSPECT_RECIPE_UX_MIGRATION } from './prospectRecipeUxMigration';
import type { DatabaseAdapter } from './DatabaseAdapter';
import { PHASE_2_MIGRATIONS } from './phase2Migrations';
import { PHASE_3_MIGRATIONS } from './phase3Migrations';
import { PHASE_4_MIGRATIONS } from './phase4Migrations';
import { PHASE_4_OVERAGE_MIGRATIONS } from './phase4OverageMigration';
import { PHASE_4_REPORT_MIGRATIONS } from './phase4ReportMigration';
import { PHASE_6_MIGRATIONS } from './phase6Migrations';
import { PROJECT_BLUEPRINT_MIGRATIONS } from './projectBlueprintMigrations';
import { CATALOG_V2_MIGRATION } from './catalogV2Migration';
import { BILLING_INVOICE_MIGRATION } from './billingInvoiceMigration';
import { EXPENSES_MIGRATION } from './expensesMigration';
import { CRM_IDENTITY_ASSETS_MIGRATION } from './crmIdentityAssetsMigration';
import { TIME_PAUSE_REASON_MIGRATION } from './timePauseReasonMigration';
import { BRIDGE_SNAPSHOT_MIGRATION } from './bridgeSnapshotMigration';
import { BRIDGE_SNAPSHOT_REPAIR_MIGRATION } from './bridgeSnapshotRepairMigration';
import { ATOUMWEB_LIBRARY_VERTICAL_MIGRATION } from './atoumWebLibraryVerticalMigration';
import { BRIDGE_OCCURRENCE_RETURN_MIGRATION } from './bridgeOccurrenceReturnMigration';
import { ATOUMWEB_COMPONENT_FAMILY_MIGRATION } from './atoumWebComponentFamilyMigration';
import { BRIDGE_NODE_MATCH_MIGRATION } from './bridgeNodeMatchMigration';
import { BRIDGE_NODE_MATCH_REVIEW_MIGRATION } from './bridgeNodeMatchReviewMigration';
import { ATOUMWEB_COMPOSITION_MIGRATION } from './atoumWebCompositionMigration';
import { CONTRACT_TERMS_MIGRATION } from './contractTermsMigration';
import { QUOTE_CONTRACT_DOCUMENT_MIGRATION } from './quoteContractDocumentMigration';
import { CONTRACT_AUDIENCE_MIGRATION } from './contractAudienceMigration';
import { PROJECT_SITE_MIGRATION } from './projectSiteMigration';
import { PROJECT_PAGE_COMPOSITION_MIGRATION } from './projectPageCompositionMigration';
import { PROJECT_PAGE_COMPOSITION_LOCAL_SETTINGS_MIGRATION } from './projectPageCompositionLocalSettingsMigration';
import { PROJECT_BLUEPRINT_SITE_MIGRATION } from './projectBlueprintSiteMigration';
import { PROJECT_BLUEPRINT_SITE_COMPATIBILITY_MIGRATION } from './projectBlueprintSiteCompatibilityMigration';
import { PROJECT_PAGE_EXPORT_MIGRATION } from './projectPageExportMigration';
import { CATALOG_IDENTITY_V1_MIGRATION } from './catalogIdentityV1Migration';
import { CATALOG_IMPORT_V1_MIGRATION } from './catalogImportV1Migration';
import { QUOTE_CONTRACT_PREPARATION_MIGRATION } from './quoteContractPreparationMigration';
import { CONTRACT_LIBRARY_IMPORT_V1_MIGRATION } from './contractLibraryImportV1Migration';

export interface Migration { id: number; name: string; sql: string; disableForeignKeys?: boolean; }

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'foundation_system_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        action TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id, created_at DESC);
    `,
  },
  {
    id: 2,
    name: 'phase_1_crm_core',
    sql: `
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_name TEXT, siret TEXT, email TEXT, phone TEXT, website TEXT,
        address_line1 TEXT, address_line2 TEXT, postal_code TEXT, city TEXT, country TEXT, industry TEXT, notes TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_organizations_archived ON organizations(archived_at);

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id), first_name TEXT NOT NULL, last_name TEXT NOT NULL,
        job_title TEXT, email TEXT, phone TEXT, preferred_channel TEXT, notes TEXT, avatar_asset_id TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(last_name COLLATE NOCASE, first_name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_contacts_archived ON contacts(archived_at);

      CREATE TABLE IF NOT EXISTS client_accounts (
        id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id), primary_contact_id TEXT REFERENCES contacts(id),
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived')), became_client_at TEXT NOT NULL,
        next_action_at TEXT, next_action_text TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT,
        CHECK (organization_id IS NOT NULL OR primary_contact_id IS NOT NULL)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_client_accounts_status ON client_accounts(status, archived_at);
      CREATE INDEX IF NOT EXISTS idx_client_accounts_organization ON client_accounts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_client_accounts_primary_contact ON client_accounts(primary_contact_id);
      CREATE INDEX IF NOT EXISTS idx_client_accounts_next_action ON client_accounts(next_action_at);

      CREATE TABLE IF NOT EXISTS client_contact_roles (
        id TEXT PRIMARY KEY, client_account_id TEXT NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
        contact_id TEXT NOT NULL REFERENCES contacts(id),
        role TEXT NOT NULL CHECK (role IN ('primary', 'administrative', 'billing', 'technical', 'other')),
        is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)), created_at TEXT NOT NULL,
        UNIQUE (client_account_id, contact_id, role)
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_contact_roles_one_primary ON client_contact_roles(client_account_id) WHERE is_primary = 1;
      CREATE INDEX IF NOT EXISTS idx_client_contact_roles_contact ON client_contact_roles(contact_id);

      CREATE TABLE IF NOT EXISTS prospects (
        id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id), contact_id TEXT REFERENCES contacts(id),
        client_account_id TEXT REFERENCES client_accounts(id),
        stage TEXT NOT NULL CHECK (stage IN ('new','qualifying','need_identified','quote_to_prepare','quote_sent','follow_up','negotiation','waiting','won','lost')),
        temperature TEXT NOT NULL DEFAULT 'warm' CHECK (temperature IN ('cold','warm','hot')),
        source TEXT CHECK (source IN ('website','referral','google','social','event','outbound','former_client','other')),
        source_detail TEXT, primary_need TEXT, secondary_need TEXT,
        budget_min_cents INTEGER CHECK (budget_min_cents IS NULL OR budget_min_cents >= 0),
        budget_max_cents INTEGER CHECK (budget_max_cents IS NULL OR budget_max_cents >= 0),
        estimated_value_cents INTEGER CHECK (estimated_value_cents IS NULL OR estimated_value_cents >= 0),
        probability_percent INTEGER CHECK (probability_percent IS NULL OR probability_percent BETWEEN 0 AND 100),
        next_action_at TEXT, next_action_text TEXT, target_date TEXT, lost_reason TEXT, notes TEXT, won_at TEXT, lost_at TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT,
        CHECK (organization_id IS NOT NULL OR contact_id IS NOT NULL),
        CHECK (budget_min_cents IS NULL OR budget_max_cents IS NULL OR budget_min_cents <= budget_max_cents),
        CHECK (stage <> 'lost' OR lost_reason IS NOT NULL)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_prospects_stage ON prospects(stage, archived_at);
      CREATE INDEX IF NOT EXISTS idx_prospects_next_action ON prospects(next_action_at);
      CREATE INDEX IF NOT EXISTS idx_prospects_client ON prospects(client_account_id);
      CREATE INDEX IF NOT EXISTS idx_prospects_organization ON prospects(organization_id);
      CREATE INDEX IF NOT EXISTS idx_prospects_contact ON prospects(contact_id);

      CREATE TABLE IF NOT EXISTS activity_events (
        id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL, summary TEXT NOT NULL,
        metadata_json TEXT, prospect_id TEXT REFERENCES prospects(id), client_account_id TEXT REFERENCES client_accounts(id),
        organization_id TEXT REFERENCES organizations(id), contact_id TEXT REFERENCES contacts(id), created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON activity_events(entity_type, entity_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_events_prospect ON activity_events(prospect_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_events_client ON activity_events(client_account_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS search_documents (
        id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, title TEXT NOT NULL, subtitle TEXT, status TEXT,
        search_text TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (entity_type, entity_id)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_search_documents_type ON search_documents(entity_type);
      CREATE INDEX IF NOT EXISTS idx_search_documents_text ON search_documents(search_text COLLATE NOCASE);
    `,
  },
  {
    id: 3,
    name: 'phase_1_unique_client_identity',
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_accounts_unique_organization
        ON client_accounts(organization_id) WHERE organization_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_accounts_unique_individual
        ON client_accounts(primary_contact_id) WHERE organization_id IS NULL AND primary_contact_id IS NOT NULL;
    `,
  },
  {
    id: 4,
    name: 'phase_1_crm_actions_followups',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_actions (
        id TEXT PRIMARY KEY,
        owner_type TEXT NOT NULL CHECK (owner_type IN ('prospect', 'client')),
        prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
        client_account_id TEXT REFERENCES client_accounts(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL CHECK (action_type IN ('action', 'follow_up')),
        title TEXT NOT NULL, due_at TEXT, notes TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
        completed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        CHECK ((owner_type='prospect' AND prospect_id IS NOT NULL AND client_account_id IS NULL)
          OR (owner_type='client' AND client_account_id IS NOT NULL AND prospect_id IS NULL))
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_crm_actions_prospect ON crm_actions(prospect_id, status, due_at);
      CREATE INDEX IF NOT EXISTS idx_crm_actions_client ON crm_actions(client_account_id, status, due_at);
      CREATE INDEX IF NOT EXISTS idx_crm_actions_due ON crm_actions(status, due_at);
      CREATE INDEX IF NOT EXISTS idx_crm_actions_type ON crm_actions(action_type, status);

      INSERT OR IGNORE INTO crm_actions (
        id, owner_type, prospect_id, client_account_id, action_type, title, due_at, notes, status, completed_at, created_at, updated_at
      )
      SELECT 'legacy-prospect-' || id, 'prospect', id, NULL,
        CASE WHEN stage='follow_up' THEN 'follow_up' ELSE 'action' END,
        COALESCE(NULLIF(trim(next_action_text), ''), 'Action à effectuer'), next_action_at, NULL, 'open', NULL, created_at, updated_at
      FROM prospects WHERE next_action_at IS NOT NULL OR NULLIF(trim(next_action_text), '') IS NOT NULL;

      INSERT OR IGNORE INTO crm_actions (
        id, owner_type, prospect_id, client_account_id, action_type, title, due_at, notes, status, completed_at, created_at, updated_at
      )
      SELECT 'legacy-client-' || id, 'client', NULL, id, 'action',
        COALESCE(NULLIF(trim(next_action_text), ''), 'Action à effectuer'), next_action_at, NULL, 'open', NULL, created_at, updated_at
      FROM client_accounts WHERE next_action_at IS NOT NULL OR NULLIF(trim(next_action_text), '') IS NOT NULL;
    `,
  },
  ...PHASE_2_MIGRATIONS,
  ...PHASE_3_MIGRATIONS,
  ...PHASE_4_MIGRATIONS,
  ...PHASE_4_OVERAGE_MIGRATIONS,
  ...PHASE_4_REPORT_MIGRATIONS,
  STABILISATION_MIGRATION,
  STABILISATION_PHASE_19_MIGRATION,
  PROSPECT_WORKFLOW_V2_MIGRATION,
  PROSPECT_RECIPE_UX_MIGRATION,
  ...PHASE_6_MIGRATIONS,
  ...PROJECT_BLUEPRINT_MIGRATIONS,
  CATALOG_V2_MIGRATION,
  BILLING_INVOICE_MIGRATION,
  EXPENSES_MIGRATION,
  CRM_IDENTITY_ASSETS_MIGRATION,
  TIME_PAUSE_REASON_MIGRATION,
  BRIDGE_SNAPSHOT_MIGRATION,
  BRIDGE_SNAPSHOT_REPAIR_MIGRATION,
  ATOUMWEB_LIBRARY_VERTICAL_MIGRATION,
  BRIDGE_OCCURRENCE_RETURN_MIGRATION,
  ATOUMWEB_COMPONENT_FAMILY_MIGRATION,
  BRIDGE_NODE_MATCH_MIGRATION,
  BRIDGE_NODE_MATCH_REVIEW_MIGRATION,
  ATOUMWEB_COMPOSITION_MIGRATION,
  CONTRACT_TERMS_MIGRATION,
  QUOTE_CONTRACT_DOCUMENT_MIGRATION,
  CONTRACT_AUDIENCE_MIGRATION,
  PROJECT_SITE_MIGRATION,
  PROJECT_PAGE_COMPOSITION_MIGRATION,
  PROJECT_PAGE_COMPOSITION_LOCAL_SETTINGS_MIGRATION,
  PROJECT_BLUEPRINT_SITE_MIGRATION,
  PROJECT_BLUEPRINT_SITE_COMPATIBILITY_MIGRATION,
  PROJECT_PAGE_EXPORT_MIGRATION,
  CATALOG_IDENTITY_V1_MIGRATION,
  CATALOG_IMPORT_V1_MIGRATION,
  CONTRACT_LIBRARY_IMPORT_V1_MIGRATION,
  QUOTE_CONTRACT_PREPARATION_MIGRATION,
  QUOTE_OPTIONS_MIGRATION,
  PROJECT_COMPOSITION_MIGRATION,
  PROJECT_PROVISIONAL_MIGRATION,
  PROJECT_OPERATIONAL_MIGRATION,
  PROJECT_CONTRIBUTION_TARGET_MIGRATION,
  OPERATIONAL_LINK_LIFECYCLE_MIGRATION,
  COMMERCIAL_RULES_MIGRATION,
  OPERATIONAL_SALES_MIGRATION,
  OPERATIONAL_SALES_ADDON_MIGRATION,
  CONTRACT_TYPES_MIGRATION,
  CATALOG_CATEGORY_ADMIN_MIGRATION,
];

export function ensureMigrationTable(database: DatabaseAdapter): void {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;`);
}

export function getPendingMigrations(database: DatabaseAdapter): Migration[] {
  ensureMigrationTable(database);
  const rows = database.all<{ id: number }>('SELECT id FROM schema_migrations ORDER BY id');
  const applied = new Set(rows.map((row) => Number(row.id)));
  return MIGRATIONS.filter((migration) => !applied.has(migration.id));
}

export function applyPendingMigrations(database: DatabaseAdapter): Migration[] {
  const pending = getPendingMigrations(database);
  for (const migration of pending) {
    if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys = OFF;');
    database.exec('BEGIN IMMEDIATE;');
    try {
      database.exec(migration.sql);
      database.run('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)', [migration.id, migration.name, new Date().toISOString()]);
      database.exec('COMMIT;');
      if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys = ON;');
    } catch (error) {
      database.exec('ROLLBACK;');
      if (migration.disableForeignKeys) database.exec('PRAGMA foreign_keys = ON;');
      throw error;
    }
  }
  return pending;
}

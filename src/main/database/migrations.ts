import type { DatabaseAdapter } from './DatabaseAdapter';

export interface Migration {
  id: number;
  name: string;
  sql: string;
}

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

      CREATE INDEX IF NOT EXISTS idx_activity_log_entity
        ON activity_log(entity_type, entity_id, created_at DESC);
    `,
  },
  {
    id: 2,
    name: 'phase_1_crm_core',
    sql: `
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        legal_name TEXT,
        siret TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        address_line1 TEXT,
        address_line2 TEXT,
        postal_code TEXT,
        city TEXT,
        country TEXT,
        industry TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_organizations_name
        ON organizations(name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_organizations_archived
        ON organizations(archived_at);

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        job_title TEXT,
        email TEXT,
        phone TEXT,
        preferred_channel TEXT,
        notes TEXT,
        avatar_asset_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_contacts_organization
        ON contacts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_name
        ON contacts(last_name COLLATE NOCASE, first_name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_contacts_archived
        ON contacts(archived_at);

      CREATE TABLE IF NOT EXISTS client_accounts (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        primary_contact_id TEXT REFERENCES contacts(id),
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived')),
        became_client_at TEXT NOT NULL,
        next_action_at TEXT,
        next_action_text TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        CHECK (organization_id IS NOT NULL OR primary_contact_id IS NOT NULL)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_client_accounts_status
        ON client_accounts(status, archived_at);
      CREATE INDEX IF NOT EXISTS idx_client_accounts_organization
        ON client_accounts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_client_accounts_primary_contact
        ON client_accounts(primary_contact_id);
      CREATE INDEX IF NOT EXISTS idx_client_accounts_next_action
        ON client_accounts(next_action_at);

      CREATE TABLE IF NOT EXISTS client_contact_roles (
        id TEXT PRIMARY KEY,
        client_account_id TEXT NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
        contact_id TEXT NOT NULL REFERENCES contacts(id),
        role TEXT NOT NULL CHECK (role IN ('primary', 'administrative', 'billing', 'technical', 'other')),
        is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
        created_at TEXT NOT NULL,
        UNIQUE (client_account_id, contact_id, role)
      ) STRICT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_contact_roles_one_primary
        ON client_contact_roles(client_account_id)
        WHERE is_primary = 1;
      CREATE INDEX IF NOT EXISTS idx_client_contact_roles_contact
        ON client_contact_roles(contact_id);

      CREATE TABLE IF NOT EXISTS prospects (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        contact_id TEXT REFERENCES contacts(id),
        client_account_id TEXT REFERENCES client_accounts(id),
        stage TEXT NOT NULL CHECK (stage IN (
          'new', 'qualifying', 'need_identified', 'quote_to_prepare', 'quote_sent',
          'follow_up', 'negotiation', 'waiting', 'won', 'lost'
        )),
        temperature TEXT NOT NULL DEFAULT 'warm' CHECK (temperature IN ('cold', 'warm', 'hot')),
        source TEXT CHECK (source IN (
          'website', 'referral', 'google', 'social', 'event', 'outbound', 'former_client', 'other'
        )),
        source_detail TEXT,
        primary_need TEXT,
        secondary_need TEXT,
        budget_min_cents INTEGER CHECK (budget_min_cents IS NULL OR budget_min_cents >= 0),
        budget_max_cents INTEGER CHECK (budget_max_cents IS NULL OR budget_max_cents >= 0),
        estimated_value_cents INTEGER CHECK (estimated_value_cents IS NULL OR estimated_value_cents >= 0),
        probability_percent INTEGER CHECK (probability_percent IS NULL OR probability_percent BETWEEN 0 AND 100),
        next_action_at TEXT,
        next_action_text TEXT,
        target_date TEXT,
        lost_reason TEXT,
        notes TEXT,
        won_at TEXT,
        lost_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        CHECK (organization_id IS NOT NULL OR contact_id IS NOT NULL),
        CHECK (budget_min_cents IS NULL OR budget_max_cents IS NULL OR budget_min_cents <= budget_max_cents),
        CHECK (stage <> 'lost' OR lost_reason IS NOT NULL)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_prospects_stage
        ON prospects(stage, archived_at);
      CREATE INDEX IF NOT EXISTS idx_prospects_next_action
        ON prospects(next_action_at);
      CREATE INDEX IF NOT EXISTS idx_prospects_client
        ON prospects(client_account_id);
      CREATE INDEX IF NOT EXISTS idx_prospects_organization
        ON prospects(organization_id);
      CREATE INDEX IF NOT EXISTS idx_prospects_contact
        ON prospects(contact_id);

      CREATE TABLE IF NOT EXISTS activity_events (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata_json TEXT,
        prospect_id TEXT REFERENCES prospects(id),
        client_account_id TEXT REFERENCES client_accounts(id),
        organization_id TEXT REFERENCES organizations(id),
        contact_id TEXT REFERENCES contacts(id),
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_activity_events_entity
        ON activity_events(entity_type, entity_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_events_prospect
        ON activity_events(prospect_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_events_client
        ON activity_events(client_account_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS search_documents (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        status TEXT,
        search_text TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (entity_type, entity_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_search_documents_type
        ON search_documents(entity_type);
      CREATE INDEX IF NOT EXISTS idx_search_documents_text
        ON search_documents(search_text COLLATE NOCASE);
    `,
  },
  {
    id: 3,
    name: 'phase_1_unique_client_identity',
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_accounts_unique_organization
        ON client_accounts(organization_id)
        WHERE organization_id IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_accounts_unique_individual
        ON client_accounts(primary_contact_id)
        WHERE organization_id IS NULL AND primary_contact_id IS NOT NULL;
    `,
  },
];

export function ensureMigrationTable(database: DatabaseAdapter): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);
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
    database.exec('BEGIN IMMEDIATE;');
    try {
      database.exec(migration.sql);
      database.run(
        'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
        [migration.id, migration.name, new Date().toISOString()],
      );
      database.exec('COMMIT;');
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  }

  return pending;
}

import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

describe('migrations SQLite', () => {
  it('applique chaque migration une seule fois', () => {
    const database = new NodeSqliteAdapter(':memory:');

    expect(getPendingMigrations(database)).toHaveLength(17);
    expect(applyPendingMigrations(database)).toHaveLength(17);
    expect(getPendingMigrations(database)).toHaveLength(0);
    expect(applyPendingMigrations(database)).toHaveLength(0);

    for (const table of [
      'settings', 'organizations', 'contacts', 'client_accounts', 'prospects', 'activity_events', 'search_documents', 'crm_actions',
      'catalog_items', 'catalog_versions', 'offer_components', 'number_sequences', 'quotes', 'quote_lines',
      'project_templates', 'project_template_versions', 'project_template_nodes', 'projects', 'project_nodes', 'project_services', 'project_prerequisites',
      'file_assets', 'file_asset_links', 'technical_items', 'technical_item_versions', 'technical_item_assets', 'time_sessions', 'time_session_pauses',
      'service_requests', 'interventions', 'maintenance_checklist_templates', 'maintenance_checklist_template_items', 'maintenance_plans',
      'maintenance_subscriptions', 'maintenance_periods', 'maintenance_checks', 'hour_packs', 'hour_pack_movements', 'billing_items',
      'maintenance_overage_decisions', 'maintenance_report_drafts', 'hour_pack_shortfall_decisions',
    ]) {
      const row = database.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [table]);
      expect(row?.name).toBe(table);
    }

    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('quotes') WHERE name='project_id'")?.name).toBe('project_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('time_sessions') WHERE name='intervention_id'")?.name).toBe('intervention_id');
    expect(database.get<{ name: string }>("SELECT name FROM pragma_table_info('maintenance_subscriptions') WHERE name='carryover_mode_snapshot'")?.name).toBe('carryover_mode_snapshot');

    const seededPlans = database.all<{ name: string }>('SELECT name FROM maintenance_plans ORDER BY periodic_price_cents');
    expect(seededPlans.map((plan) => plan.name)).toEqual(['Maintenance 49 €/mois', 'Maintenance 99 €/mois']);

    database.close();
  });
});

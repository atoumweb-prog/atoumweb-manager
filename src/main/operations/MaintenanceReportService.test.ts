import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { MaintenanceReportService } from './MaintenanceReportService';
import { MaintenanceService } from './MaintenanceService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let maintenance: MaintenanceService;
let operations: OperationsService;
let reports: MaintenanceReportService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  maintenance = new MaintenanceService(database);
  operations = new OperationsService(database);
  reports = new MaintenanceReportService(database);
});

afterEach(() => database.close());

describe('MaintenanceReportService', () => {
  it('prépare le rapport avec les données client sans exposer les notes internes', () => {
    const contact = crm.createContact({ firstName: 'Rapport', lastName: 'Client' });
    const client = crm.createClient({ primaryContactId: contact.id });
    const plan = maintenance.listPlans()[0];
    const subscription = maintenance.createSubscription({
      clientAccountId: client.id,
      planId: plan.id,
      startDate: '2026-09-01',
      notes: 'SECRET_SUBSCRIPTION',
    });
    const period = maintenance.ensurePeriod(subscription.id, '2026-09-14');

    database.run('UPDATE maintenance_periods SET notes=? WHERE id=?', ['SECRET_PERIOD', period.id]);
    database.run('UPDATE maintenance_checks SET notes=? WHERE period_id=?', ['SECRET_CHECK', period.id]);

    const interventions = ['Mise à jour', 'Contrôle sauvegarde', 'Correction formulaire'].map((subject, index) => operations.createIntervention({
      clientAccountId: client.id,
      maintenancePeriodId: period.id,
      type: 'maintenance',
      coverageMode: 'maintenance',
      subject,
      notes: `SECRET_INTERVENTION_${index + 1}`,
    }));

    const now = new Date().toISOString();
    database.run(
      `INSERT INTO maintenance_overage_decisions
       (id,period_id,intervention_id,decision,reason,expected_amount_cents,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      ['report-overage', period.id, interventions[2].id, 'commercial_gesture', 'SECRET_OVERAGE_REASON', 0, now, now],
    );

    const report = reports.updateDraft(period.id, {
      clientSummary: 'Maintenance mensuelle réalisée.',
      anomaliesActions: 'Formulaire corrigé et sauvegardes contrôlées.',
      recommendations: 'Prévoir une revue des extensions au prochain passage.',
    });

    expect(report.clientSummary).toBe('Maintenance mensuelle réalisée.');
    expect(report.interventionCount).toBe(3);
    expect(report.overageCount).toBe(1);
    expect(report.overages).toHaveLength(1);
    expect(report.overages[0].decision).toBe('commercial_gesture');

    const clientPayload = JSON.stringify(report);
    expect(clientPayload).not.toContain('SECRET_SUBSCRIPTION');
    expect(clientPayload).not.toContain('SECRET_PERIOD');
    expect(clientPayload).not.toContain('SECRET_CHECK');
    expect(clientPayload).not.toContain('SECRET_INTERVENTION');
    expect(clientPayload).not.toContain('SECRET_OVERAGE_REASON');
  });
});

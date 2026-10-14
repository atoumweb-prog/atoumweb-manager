import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BillingHandoffService } from '../billing/BillingHandoffService';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { MaintenanceOverageService } from './MaintenanceOverageService';
import { MaintenanceService } from './MaintenanceService';
import { OperationsService } from './OperationsService';

let database: NodeSqliteAdapter;
let crm: CrmService;
let maintenance: MaintenanceService;
let operations: OperationsService;
let billing: BillingHandoffService;
let overages: MaintenanceOverageService;
let clientId: string;
let periodId: string;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  crm = new CrmService(database);
  maintenance = new MaintenanceService(database);
  operations = new OperationsService(database);
  billing = new BillingHandoffService(database);
  overages = new MaintenanceOverageService(database, billing);

  const contact = crm.createContact({ firstName: 'Client', lastName: 'Dépassement' });
  clientId = crm.createClient({ primaryContactId: contact.id }).id;
  const plan = maintenance.listPlans()[0];
  const subscription = maintenance.createSubscription({ clientAccountId: clientId, planId: plan.id, startDate: '2026-09-01' });
  periodId = maintenance.ensurePeriod(subscription.id, '2026-09-14').id;

  const ids = ['01', '02', '03'].map((suffix) => operations.createIntervention({
    clientAccountId: clientId,
    maintenancePeriodId: periodId,
    type: 'maintenance',
    coverageMode: 'maintenance',
    subject: `Maintenance ${suffix}`,
    theoreticalValueCents: 7900,
  }).id);

  ids.forEach((id, index) => {
    database.run('UPDATE interventions SET created_at=? WHERE id=?', [`2026-09-${10 + index}T10:00:00.000Z`, id]);
  });
});

afterEach(() => database.close());

describe('MaintenanceOverageService', () => {
  it('identifie uniquement les interventions réellement au-delà du quota', () => {
    const review = overages.review(periodId);
    expect(review.includedInterventions).toBe(2);
    expect(review.interventionCount).toBe(3);
    expect(review.overageCount).toBe(1);
    expect(review.unresolvedCount).toBe(1);
    expect(review.candidates).toHaveLength(1);
    expect(review.candidates[0].interventionSubject).toBe('Maintenance 03');
  });

  it('refuse un report quand le contrat ne le prévoit pas', () => {
    const candidate = overages.review(periodId).candidates[0];
    expect(() => overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'carry_forward',
      reason: 'À reporter au mois suivant',
    })).toThrow(/ne permet pas le report/i);
  });

  it('prépare une seule facturation quand le dépassement est facturé', () => {
    const candidate = overages.review(periodId).candidates[0];
    operations.changeInterventionStatus(candidate.interventionId, 'completed');

    let review = overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'bill_out_of_scope',
      reason: 'Troisième intervention du mois',
      expectedAmountCents: 7900,
    });
    expect(review.unresolvedCount).toBe(0);

    review = overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'bill_out_of_scope',
      reason: 'Troisième intervention du mois confirmée',
      expectedAmountCents: 7900,
    });
    expect(review.unresolvedCount).toBe(0);

    const items = billing.list({ sourceType: 'maintenance_overage' });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('ready');
    expect(items[0].expectedAmountCents).toBe(7900);
  });

  it('annule sans supprimer la préparation à facturer si la décision devient un geste commercial', () => {
    const candidate = overages.review(periodId).candidates[0];
    operations.changeInterventionStatus(candidate.interventionId, 'completed');

    overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'bill_out_of_scope',
      reason: 'Dépassement à facturer',
      expectedAmountCents: 7900,
    });
    overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'commercial_gesture',
      reason: 'Geste commercial exceptionnel',
    });

    const items = billing.list({ sourceType: 'maintenance_overage' });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('cancelled');
    expect(overages.review(periodId).unresolvedCount).toBe(0);
  });

  it('ne déclasse pas un dépassement déjà facturé après rattachement du PDF Abby', () => {
    const candidate = overages.review(periodId).candidates[0];
    operations.changeInterventionStatus(candidate.interventionId, 'completed');
    overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'bill_out_of_scope',
      reason: 'À facturer',
      expectedAmountCents: 7900,
    });
    const item = billing.list({ sourceType: 'maintenance_overage' })[0];
    const now = '2026-10-14T09:00:00.000Z';
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['abby-maintenance-invoice', clientId, 'invoice', 'Facture Abby', 'abby.pdf',
        'Clients/test/Documents/03 Factures/abby.pdf', 'application/pdf', 1200, now, now],
    );
    billing.attachInvoice(item.id, 'abby-maintenance-invoice', { reference: 'ABBY-09B', invoicedAt: now });
    expect(() => overages.decide(periodId, {
      interventionId: candidate.interventionId,
      decision: 'commercial_gesture',
      reason: 'Changement tardif',
    })).toThrow(/Facture PDF déjà rattachée/);
    expect(database.get<{ decision: string }>('SELECT decision FROM maintenance_overage_decisions WHERE intervention_id=?', [candidate.interventionId])?.decision).toBe('bill_out_of_scope');
    expect(billing.get(item.id)).toMatchObject({
      status: 'invoiced',
      invoiceDocumentId: 'abby-maintenance-invoice',
      invoiceReference: 'ABBY-09B',
      expectedAmountCents: 7900,
    });
  });

});

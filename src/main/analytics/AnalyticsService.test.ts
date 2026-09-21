import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { AnalyticsService } from './AnalyticsService';

let database: NodeSqliteAdapter;
let analytics: AnalyticsService;

beforeEach(() => {
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  analytics = new AnalyticsService(database);

  database.run(
    `INSERT INTO organizations (id,name,created_at,updated_at) VALUES ('org','Client test','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z')`,
  );
  database.run(
    `INSERT INTO prospects (id,organization_id,stage,temperature,created_at,updated_at)
     VALUES ('prospect','org','won','neutral','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z')`,
  );
  database.run(
    `INSERT INTO client_accounts (id,organization_id,status,became_client_at,created_at,updated_at)
     VALUES ('client','org','active','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z')`,
  );

  database.run(
    `INSERT INTO quotes (
       id,quote_number,prospect_id,subject,status,catalog_value_cents,discount_value_cents,contract_value_cents,
       deposit_cents,balance_cents,accepted_at,created_at,updated_at
     ) VALUES ('q-current','DEV-2026-001','prospect','Site vitrine','accepted',100000,20000,80000,0,80000,
       '2026-09-15T10:00:00.000Z','2026-09-01T10:00:00.000Z','2026-09-15T10:00:00.000Z')`,
  );
  database.run(
    `INSERT INTO quotes (
       id,quote_number,prospect_id,subject,status,catalog_value_cents,discount_value_cents,contract_value_cents,
       deposit_cents,balance_cents,accepted_at,created_at,updated_at
     ) VALUES ('q-previous','DEV-2026-000','prospect','Landing','accepted',50000,5000,45000,0,45000,
       '2026-08-12T10:00:00.000Z','2026-08-01T10:00:00.000Z','2026-08-12T10:00:00.000Z')`,
  );

  database.run(
    `INSERT INTO projects (
       id,project_number,name,project_type,status,commercial_mode,commercial_value_cents,contract_value_cents,
       created_at,updated_at,completed_at
     ) VALUES ('project-current','PRJ-2026-001','Projet livré','internal','completed','internal',120000,0,
       '2026-09-01T00:00:00.000Z','2026-09-18T00:00:00.000Z','2026-09-18T00:00:00.000Z')`,
  );

  database.run(
    `INSERT INTO interventions (
       id,intervention_number,client_account_id,intervention_type,status,coverage_mode,subject,priority,
       theoretical_value_cents,billable_amount_cents,created_at,updated_at,completed_at
     ) VALUES ('i-included','INT-2026-001','client','modification','completed','included_project','Incluse au projet','normal',
       50000,0,'2026-09-10T00:00:00.000Z','2026-09-19T00:00:00.000Z','2026-09-19T00:00:00.000Z')`,
  );
  database.run(
    `INSERT INTO interventions (
       id,intervention_number,client_account_id,intervention_type,status,coverage_mode,subject,priority,
       theoretical_value_cents,billable_amount_cents,created_at,updated_at,completed_at
     ) VALUES ('i-extra','INT-2026-002','client','addition','completed','out_of_scope','Ajout hors projet','normal',
       30000,30000,'2026-09-10T00:00:00.000Z','2026-09-20T00:00:00.000Z','2026-09-20T00:00:00.000Z')`,
  );
});

afterEach(() => database.close());

describe('AnalyticsService', () => {
  it('calcule les valeurs signées et leur comparaison sur la date d acceptation', () => {
    const snapshot = analytics.financialSnapshot({ preset: 'month' }, new Date('2026-09-21T12:00:00.000Z'));
    const commercial = snapshot.metrics.find((item) => item.key === 'commercial_signed');
    const contract = snapshot.metrics.find((item) => item.key === 'contract_signed');
    const gifted = snapshot.metrics.find((item) => item.key === 'gifted_value');

    expect(commercial).toMatchObject({ currentCents: 100000, previousCents: 50000, deltaCents: 50000, deltaPercent: 100 });
    expect(contract).toMatchObject({ currentCents: 80000, previousCents: 45000, deltaCents: 35000 });
    expect(gifted).toMatchObject({ currentCents: 20000, previousCents: 5000, deltaCents: 15000 });
  });

  it('évite le double compte des interventions déjà incluses dans un projet livré', () => {
    const snapshot = analytics.financialSnapshot({ preset: 'month' }, new Date('2026-09-21T12:00:00.000Z'));
    const delivered = snapshot.metrics.find((item) => item.key === 'commercial_delivered');

    expect(delivered).toMatchObject({ currentCents: 150000 });
  });

  it('calcule les volumes commerciaux avec les pourcentages et leurs volumes bruts', () => {
    database.run(
      `INSERT INTO prospects (id,organization_id,stage,temperature,source,won_at,created_at,updated_at)
       VALUES ('p-won-current','org','won','neutral','google','2026-09-08T10:00:00.000Z','2026-09-02T10:00:00.000Z','2026-09-08T10:00:00.000Z')`,
    );
    database.run(
      `INSERT INTO prospects (id,organization_id,stage,temperature,source,lost_reason,lost_at,created_at,updated_at)
       VALUES ('p-lost-current','org','lost','neutral','outbound','Budget','2026-09-10T10:00:00.000Z','2026-09-03T10:00:00.000Z','2026-09-10T10:00:00.000Z')`,
    );
    database.run(
      `INSERT INTO prospects (id,organization_id,stage,temperature,source,won_at,created_at,updated_at)
       VALUES ('p-won-previous','org','won','neutral','referral','2026-08-11T10:00:00.000Z','2026-08-05T10:00:00.000Z','2026-08-11T10:00:00.000Z')`,
    );

    database.run(
      `INSERT INTO quotes (
         id,quote_number,prospect_id,subject,status,catalog_value_cents,discount_value_cents,contract_value_cents,
         deposit_cents,balance_cents,refused_at,created_at,updated_at
       ) VALUES ('q-refused','DEV-2026-002','prospect','Refus','refused',30000,0,30000,0,30000,
         '2026-09-17T10:00:00.000Z','2026-09-06T10:00:00.000Z','2026-09-17T10:00:00.000Z')`,
    );
    database.run(
      `INSERT INTO quotes (
         id,quote_number,prospect_id,subject,status,catalog_value_cents,discount_value_cents,contract_value_cents,
         deposit_cents,balance_cents,expired_at,created_at,updated_at
       ) VALUES ('q-expired','DEV-2026-003','prospect','Expiré','expired',25000,0,25000,0,25000,
         '2026-09-20T10:00:00.000Z','2026-09-07T10:00:00.000Z','2026-09-20T10:00:00.000Z')`,
    );

    const snapshot = analytics.commercialSnapshot({ preset: 'month' }, new Date('2026-09-21T12:00:00.000Z'));

    expect(snapshot.current).toMatchObject({
      newProspects: 2,
      wonProspects: 1,
      lostProspects: 1,
      decidedProspects: 2,
      conversionPercent: 50,
      quotesCreated: 3,
      quotesAccepted: 1,
      quotesRefused: 1,
      quotesExpired: 1,
      quoteDecisions: 3,
    });
    expect(snapshot.current.quoteAcceptancePercent).toBeCloseTo(33.3333, 3);
    expect(snapshot.previous).toMatchObject({
      newProspects: 1,
      wonProspects: 1,
      lostProspects: 0,
      decidedProspects: 1,
      conversionPercent: 100,
      quotesCreated: 1,
      quotesAccepted: 1,
      quotesRefused: 0,
      quotesExpired: 0,
      quoteDecisions: 1,
      quoteAcceptancePercent: 100,
    });

    expect(snapshot.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'google', prospectCount: 1, wonCount: 1, conversionPercent: 100 }),
      expect.objectContaining({ source: 'outbound', prospectCount: 1, lostCount: 1, conversionPercent: 0 }),
    ]));
    expect(snapshot.lostReasons).toEqual([{ reason: 'Budget', count: 1 }]);
    expect(snapshot.delays.quoteToAcceptanceSample).toBe(1);
    expect(snapshot.delays.quoteToAcceptanceHours).toBeCloseTo(336, 4);
    expect(snapshot.previousDelays.prospectToQuoteSample).toBe(1);
  });

  it('n invente aucun chiffre pour les sources Phase 5 absentes', () => {
    const snapshot = analytics.financialSnapshot({ preset: 'month' }, new Date('2026-09-21T12:00:00.000Z'));

    for (const key of ['invoiced_revenue', 'cash_collected', 'outstanding_revenue', 'expenses'] as const) {
      const metric = snapshot.metrics.find((item) => item.key === key);
      expect(metric?.available).toBe(false);
      expect(metric?.currentCents).toBeNull();
      expect(metric?.previousCents).toBeNull();
    }
  });
});

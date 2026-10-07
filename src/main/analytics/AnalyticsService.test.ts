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

  it('calcule projets temps pauses estimation et rendement sur un échantillon cohérent', () => {
    database.run(
      `UPDATE projects
       SET start_date='2026-09-10', contract_value_cents=90000, commercial_value_cents=120000
       WHERE id='project-current'`,
    );
    database.run(
      `INSERT INTO project_nodes
       (id,project_id,node_type,name,sort_order,estimated_minutes,is_required,status,created_at,updated_at)
       VALUES ('node-estimate','project-current','task','Production',10,120,1,'done',
         '2026-09-01T00:00:00.000Z','2026-09-18T00:00:00.000Z')`,
    );
    database.run(
      `INSERT INTO time_sessions
       (id,project_id,category,activity_label,started_at,ended_at,billable,source,created_at,updated_at)
       VALUES ('time-billable','project-current','development','Développement',
         '2026-09-18T09:00:00.000Z','2026-09-18T12:00:00.000Z',1,'manual',
         '2026-09-18T12:00:00.000Z','2026-09-18T12:00:00.000Z')`,
    );
    database.run(
      `INSERT INTO time_session_pauses (id,time_session_id,started_at,ended_at,created_at)
       VALUES ('pause-1','time-billable','2026-09-18T10:00:00.000Z','2026-09-18T10:30:00.000Z','2026-09-18T10:00:00.000Z')`,
    );
    database.run(
      `INSERT INTO time_sessions
       (id,project_id,category,activity_label,started_at,ended_at,billable,source,created_at,updated_at)
       VALUES ('time-nonbillable','project-current','design','Ajustements',
         '2026-09-18T13:00:00.000Z','2026-09-18T14:00:00.000Z',0,'manual',
         '2026-09-18T14:00:00.000Z','2026-09-18T14:00:00.000Z')`,
    );

    const snapshot = analytics.projectTimeSnapshot({ preset: 'month' }, new Date('2026-09-21T12:00:00.000Z'));

    expect(snapshot.current).toMatchObject({
      projectsCreated: 1,
      projectsCompleted: 1,
      totalSeconds: 12600,
      billableSeconds: 9000,
      nonBillableSeconds: 3600,
      sessionCount: 2,
    });
    expect(snapshot.categories).toEqual(expect.arrayContaining([
      { category: 'development', seconds: 9000, sessionCount: 1 },
      { category: 'design', seconds: 3600, sessionCount: 1 },
    ]));
    expect(snapshot.economics).toMatchObject({
      completedProjectSample: 1,
      completedProjectsWithTrackedTime: 1,
      trackedSeconds: 12600,
      estimatedSeconds: 7200,
      estimateTrackedSeconds: 12600,
      estimateSample: 1,
      contractValueCents: 90000,
      commercialValueCents: 120000,
    });
    expect(snapshot.economics.contractHourlyCents).toBeCloseTo(25714.2857, 3);
    expect(snapshot.economics.commercialHourlyCents).toBeCloseTo(34285.7143, 3);
    expect(snapshot.economics.averageCalendarDays).toBeCloseTo(8, 4);
    expect(snapshot.projectTypes).toEqual([
      expect.objectContaining({ projectType: 'internal', completedCount: 1, trackedProjectCount: 1, trackedSeconds: 12600 }),
    ]);
  });

  it('n invente aucun encaissement ni reste à encaisser sans source de paiements', () => {
    const snapshot = analytics.financialSnapshot({ preset: 'month' }, new Date('2026-09-21T12:00:00.000Z'));

    for (const key of ['cash_collected', 'outstanding_revenue'] as const) {
      const metric = snapshot.metrics.find((item) => item.key === key);
      expect(metric?.available).toBe(false);
      expect(metric?.currentCents).toBeNull();
      expect(metric?.previousCents).toBeNull();
    }
  });

  it('raccorde le suivi Abby et les dépenses existants sans transformer une facture en paiement', () => {
    for (const [id,status,amount,date] of [
      ['invoice','invoiced',42000,'2026-09-15'],['planned','ready',90000,'2026-09-15'],
      ['cancelled','cancelled',80000,'2026-09-15'],['previous','invoiced',10000,'2026-08-15'],
    ] as const) database.run(`INSERT INTO billing_items
      (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,status,invoiced_at,created_at,updated_at)
      VALUES(?,'client','other',?,?,?, ?,?,?,?,?)`,[id,id,id,id,amount,status,date,date,date]);
    for(const [id,status,amount,date] of [['expense','committed',12000,'2026-09-14'],['cancel','cancelled',99000,'2026-09-14'],['past','paid',3000,'2026-08-14']] as const)
      database.run(`INSERT INTO expenses(id,category,label,amount_cents,status,expense_date,created_at,updated_at)
        VALUES(?,'software',?,?,?,?,?,?)`,[id,id,amount,status,date,date,date]);
    const metrics=analytics.financialSnapshot({preset:'month'},new Date('2026-09-21T12:00:00Z')).metrics;
    expect(metrics.find(m=>m.key==='invoiced_revenue')).toMatchObject({available:true,currentCents:42000,previousCents:10000});
    expect(metrics.find(m=>m.key==='expenses')).toMatchObject({available:true,currentCents:12000,previousCents:3000});
    expect(metrics.find(m=>m.key==='cash_collected')).toMatchObject({available:false,currentCents:null});
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('utilise les estimations courantes des tâches opérationnelles actives, sans conteneur ni action archivée', () => {
    database.run(`INSERT INTO project_nodes(id,project_id,node_type,name,sort_order,estimated_minutes,is_required,status,created_at,updated_at)
      VALUES('op-task','project-current','task','Action active',10,120,1,'done','2026-09-01','2026-09-18')`);
    database.run(`INSERT INTO project_nodes(id,project_id,node_type,name,sort_order,estimated_minutes,is_required,status,created_at,updated_at)
      VALUES('structure','project-current','module','Structure sans production',20,900,0,'todo','2026-09-01','2026-09-18')`);
    database.run(`INSERT INTO project_nodes(id,project_id,node_type,name,sort_order,estimated_minutes,is_required,status,created_at,updated_at,archived_at)
      VALUES('retired','project-current','task','Ancienne action',30,400,0,'todo','2026-09-01','2026-09-18','2026-09-18')`);
    database.run(`INSERT INTO project_action_instances(project_id,source_key,project_node_id,initial_snapshot_json)
      VALUES('project-current','sold-action','op-task','{"action":{},"estimateRequired":false,"referenceMinutes":60}')`);
    database.run(`INSERT INTO time_sessions(id,project_id,category,activity_label,started_at,ended_at,billable,source,created_at,updated_at)
      VALUES('op-time','project-current','development','Action','2026-09-18T09:00:00Z','2026-09-18T10:00:00Z',1,'manual','2026-09-18','2026-09-18')`);
    const result=analytics.projectTimeSnapshot({preset:'month'},new Date('2026-09-21T12:00:00Z')).economics;
    expect(result).toMatchObject({estimatedSeconds:7200,estimateTrackedSeconds:3600,estimateSample:1});
  });

  it('ne présente pas un cadrage indicatif comme estimation complète du Projet', () => {
    database.run(`INSERT INTO project_nodes(id,project_id,node_type,name,sort_order,estimated_minutes,is_required,status,created_at,updated_at)
      VALUES('variable','project-current','task','Action à estimer',10,NULL,1,'done','2026-09-01','2026-09-18')`);
    database.run(`INSERT INTO project_action_instances(project_id,source_key,project_node_id,initial_snapshot_json)
      VALUES('project-current','variable-sale','variable','{"action":{},"estimateRequired":true,"referenceMinutes":180}')`);
    database.run(`INSERT INTO time_sessions(id,project_id,category,activity_label,started_at,ended_at,billable,source,created_at,updated_at)
      VALUES('variable-time','project-current','development','Cadrage','2026-09-18T09:00:00Z','2026-09-18T10:00:00Z',1,'manual','2026-09-18','2026-09-18')`);
    const result=analytics.projectTimeSnapshot({preset:'month'},new Date('2026-09-21T12:00:00Z')).economics;
    expect(result).toMatchObject({trackedSeconds:3600,estimatedSeconds:0,estimateTrackedSeconds:0,estimateSample:0});
    expect(result.contractHourlyCents).not.toBeNull();
  });
});

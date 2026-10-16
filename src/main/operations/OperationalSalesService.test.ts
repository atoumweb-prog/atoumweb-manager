import { sendForTest } from '../testSupport/quotePreparationFixture';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { CatalogService } from '../commercial/CatalogService';
import { QuoteService } from '../commercial/QuoteService';
import { OperationalReferenceService } from '../projects/OperationalReferenceService';
import { CommercialRulesService } from '../commercial/CommercialRulesService';
import { OperationalSalesService, addMonths } from './OperationalSalesService';
import { MaintenanceService } from './MaintenanceService';
import { OperationsService } from './OperationsService';
import { HourPackService } from './HourPackService';
import { TimeService } from '../time/TimeService';
import { OperationalSalesTargetService } from './OperationalSalesTargetService';
import { finalizeForTest, acceptForTest } from '../testSupport/quotePreparationFixture';
import type { OperationalSalePolicy } from '../../shared/commercialRules';
import type { OperationalModel, OperationalReference } from '../../shared/operational';

let db:NodeSqliteAdapter,quotes:QuoteService,catalog:CatalogService,clientId:string,refs:OperationalReferenceService;
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);const crm=new CrmService(db);clientId=crm.createClient({organizationId:crm.createOrganization({name:'TEST 8B'}).id}).id;quotes=new QuoteService(db,crm);catalog=new CatalogService(db);refs=new OperationalReferenceService(db);});
afterEach(()=>{db.close();vi.useRealTimers();});
function sold(policy:OperationalSalePolicy, draft=false, code='AW-TEST-OPERATIONS',estimateRequired=false) {
  const item=catalog.create({type:'service',name:'TEST opérations',canonicalCode:code},{priceMode:'fixed',priceCents:19900});
  catalog.publishVersion(item.versions[0].id);
  const model:OperationalModel={code,name:'Test 8B',lot:'8B',model:policy.kind==='hour_pack'?'Crédit temps':'Récurrent',unit:'cycle',estimateRequired,quantityRule:'Un cycle',recurrence:'Mensuel',trigger:'Acceptation',creditMinutes:policy.creditMinutes||0,referenceMinutes:policy.kind==='hour_pack'?0:45,sourceRow:1,notes:'Fixture',actions:policy.kind==='hour_pack'?[]:[{key:code+'-A01',phase:'Suivi',name:'Routine',checklist:'Contrôle',minutes:45,category:'Inclus au forfait',required:true,sourceRow:2}]};
  const source:OperationalReference={schemaVersion:1,source:{file:'fixture',sha256:'a'.repeat(64)},models:[model],decisions:[]};refs.importDraft(source,refs.simulate(source).planHash);
  const modelId=db.get<{id:string}>('SELECT id FROM operational_model_versions WHERE canonical_code=?',[code])!.id;
  const linkId=refs.link(item.versions[0].id,modelId,null,{operations:policy});if(!draft){refs.markReady(modelId);refs.activateLink(linkId);}
  const q=quotes.addCatalogLine(quotes.create({clientAccountId:clientId,subject:'TEST vente 8B'}).id,item.versions[0].id);
  new CommercialRulesService(db).setParameters(q.lines[0].id,{serviceStartDate:'2026-10-15',periodAlignment:'anniversary',setupEstimateMinutes:60});return quotes.get(q.id);
}
function accept(id:string) {finalizeForTest(db,quotes,id);sendForTest(quotes,id);return acceptForTest(db,quotes,id);}
it('pack accepté : crédit 300 min, intervention 45 min, solde 255 et rejeu sans doublon',()=>{
  const q=accept(sold({schemaVersion:1,kind:'hour_pack',cadence:'once',billingPeriod:'once',creditMinutes:300,validityMonths:12}).id);
  const sale=new OperationalSalesService(db).list(q.id)[0],packId=String(sale.hour_pack_id),ops=new OperationsService(db),packs=new HourPackService(db);
  expect(packs.get(packId).balanceSeconds).toBe(300*60);expect(packs.get(packId).expiresAt?.slice(0,10)).toBe('2027-10-15');
  const intervention=ops.createIntervention({clientAccountId:clientId,subject:'TEST urgent réel',coverageMode:'hour_pack',hourPackId:packId,priority:'urgent'});
  new TimeService(db).addManual({interventionId:intervention.id,category:'support',activityLabel:'Travail',startedAt:'2026-10-16T08:00:00Z',endedAt:'2026-10-16T08:45:00Z'});
  ops.changeInterventionStatus(intervention.id,'completed');expect(packs.debitIntervention(packId,intervention.id).balanceSeconds).toBe(255*60);
  new OperationalSalesService(db).provision(q);expect(db.all('SELECT * FROM hour_packs')).toHaveLength(1);expect(db.all('SELECT * FROM project_action_instances')).toHaveLength(0);
  expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
});
it('annuel : 12 cycles mensuels complets à date anniversaire, quotas sans report ni minutes de routine consommables',()=>{
  const q=accept(sold({schemaVersion:1,kind:'maintenance',cadence:'monthly',billingPeriod:'yearly',minorInterventions:2,maximumMinorMinutes:30}).id);
  const id=String(new OperationalSalesService(db).list(q.id)[0].subscription_id),maintenance=new MaintenanceService(db),periods=maintenance.listPeriods(id);
  expect(periods).toHaveLength(12);expect(periods.at(-1)?.periodStart).toBe('2026-10-15');expect(periods[0].periodEnd).toBe('2027-10-14');
  expect(periods.every(p=>p.includedInterventions===2&&p.includedMinutes===null&&p.checks.length===1)).toBe(true);
  const routine=new OperationsService(db).createIntervention({clientAccountId:clientId,subject:'TEST mises à jour',coverageMode:'maintenance',maintenancePeriodId:periods[0].id});
  db.run("UPDATE interventions SET maintenance_usage_kind='routine' WHERE id=?",[routine.id]);
  expect(maintenance.listPeriods(id)[0].usage.interventionCount).toBe(0);
  new OperationalSalesService(db).provision(q);expect(maintenance.listPeriods(id)).toHaveLength(12);
});
it('aucun objet avant acceptation et configuration draft refusée sans contournement',()=>{
  const q=sold({schemaVersion:1,kind:'recurring',cadence:'monthly',billingPeriod:'yearly'},true);
  expect(()=>new OperationalSalesService(db).provision(q)).toThrow(/accepté/);expect(()=>finalizeForTest(db,quotes,q.id)).toThrow(/non activée/);
  expect(db.all('SELECT * FROM maintenance_subscriptions')).toHaveLength(0);
});
it('hébergement : mise en service distincte incluse estimée, routine et aucun quota de maintenance',()=>{
  const q=accept(sold({schemaVersion:1,kind:'hosting',cadence:'monthly',billingPeriod:'yearly',setupEstimateRequired:true}).id);
  const sale=new OperationalSalesService(db).list(q.id)[0];expect(sale.setup_intervention_id).toBeTruthy();
  expect(db.get<{estimated_minutes:number}>('SELECT estimated_minutes FROM interventions WHERE id=?',[String(sale.setup_intervention_id)])?.estimated_minutes).toBe(60);
  const periods=new MaintenanceService(db).listPeriods(String(sale.subscription_id));expect(periods).toHaveLength(12);expect(periods.every(p=>p.includedMinutes===null&&p.includedInterventions===0)).toBe(true);
});
it('date anniversaire bornée en fin de mois et année bissextile',()=>{
  expect(addMonths('2026-01-31',1)).toBe('2026-02-28');expect(addMonths('2024-02-29',12)).toBe('2025-02-28');
});
it('quota mensuel remis à disposition au nouveau cycle, indépendant de la facturation annuelle',()=>{
  const q=accept(sold({schemaVersion:1,kind:'maintenance',cadence:'monthly',billingPeriod:'yearly',minorInterventions:2,maximumMinorMinutes:30,periodAlignment:'anniversary'}).id);
  const subscriptionId=String(new OperationalSalesService(db).list(q.id)[0].subscription_id),maintenance=new MaintenanceService(db);
  const first=maintenance.ensurePeriod(subscriptionId,'2026-11-14');
  new OperationsService(db).createIntervention({clientAccountId:clientId,subject:'TEST petit correctif',coverageMode:'maintenance',maintenancePeriodId:first.id});
  expect(maintenance.getPeriod(first.id).usage.remainingInterventions).toBe(1);
  const second=maintenance.ensurePeriod(subscriptionId,'2026-11-15');
  expect([first.periodStart,first.periodEnd]).toEqual(['2026-10-15','2026-11-14']);
  expect([second.periodStart,second.periodEnd]).toEqual(['2026-11-15','2026-12-14']);
  expect(second.usage.remainingInterventions).toBe(2);
  expect(maintenance.listPeriods(subscriptionId)).toHaveLength(12);
  expect(()=>maintenance.ensurePeriod(subscriptionId,'2027-10-15')).toThrow(/postérieure/);
});
it('abonnement mensuel poursuivi sans échéance annuelle, puis nouvelles périodes refusées après résiliation',()=>{
  const q=accept(sold({schemaVersion:1,kind:'recurring',cadence:'monthly',billingPeriod:'monthly',periodAlignment:'anniversary'}).id);
  const subscriptionId=String(new OperationalSalesService(db).list(q.id)[0].subscription_id),maintenance=new MaintenanceService(db);
  expect(maintenance.getSubscription(subscriptionId).endDate).toBeNull();
  const future=maintenance.ensurePeriod(subscriptionId,'2027-11-15');
  expect([future.periodStart,future.periodEnd]).toEqual(['2027-11-15','2027-12-14']);
  expect(future.checks[0].referenceMinutes).toBe(45);
  maintenance.changeSubscriptionStatus(subscriptionId,'ended');
  expect(()=>maintenance.ensurePeriod(subscriptionId,'2027-12-15')).toThrow(/active/);
});
it('établissement supplémentaire : même abonnement, mêmes périodes, routines propres et rejeu sans duplication',()=>{
  const parent=accept(sold({schemaVersion:1,kind:'recurring',cadence:'monthly',billingPeriod:'yearly'},false,'AW-TEST-GBP-MAIN').id);
  const sale=new OperationalSalesService(db).list(parent.id)[0];
  const child=sold({schemaVersion:1,kind:'recurring_addon',cadence:'monthly',billingPeriod:'monthly',parentCodes:['AW-TEST-GBP-MAIN']},false,'AW-TEST-GBP-ADD');
  expect(()=>finalizeForTest(db,quotes,child.id)).toThrow(/principal/);
  quotes.setLineParameters(child.lines[0].id,{serviceStartDate:'2026-10-15',parentOperationalSaleId:String(sale.id)});
  const accepted=accept(child.id),extra=new OperationalSalesService(db).list(accepted.id)[0];
  expect(extra.subscription_id).toBe(sale.subscription_id);expect(extra.parent_sale_id).toBe(sale.id);
  expect(db.all('SELECT * FROM maintenance_subscriptions')).toHaveLength(1);
  const periods=new MaintenanceService(db).listPeriods(String(sale.subscription_id));expect(periods).toHaveLength(12);expect(periods.every(p=>p.checks.length===2)).toBe(true);
  new OperationalSalesService(db).provision(accepted);expect(new MaintenanceService(db).listPeriods(String(sale.subscription_id)).every(p=>p.checks.length===2)).toBe(true);
  expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
});
it('routine variable : le cadrage reste référence indicative, jamais estimation finale automatique',()=>{
  const q=sold({schemaVersion:1,kind:'recurring',cadence:'monthly',billingPeriod:'monthly'},false,'AW-TEST-VARIABLE',true);
  quotes.setLineParameters(q.lines[0].id,{serviceStartDate:'2026-10-15',periodAlignment:'anniversary',scope:'TEST périmètre',currentEstimateMinutes:120,productionPlan:'TEST production adaptée'});
  const accepted=accept(q.id),sale=new OperationalSalesService(db).list(accepted.id)[0],maintenance=new MaintenanceService(db);
  const check=maintenance.listPeriods(String(sale.subscription_id))[0].checks[0];expect(check.estimateRequired).toBe(true);
  const routine=maintenance.prepareRoutine(check.id);expect(routine.referenceMinutes).toBe(45);expect(routine.estimatedMinutes).toBeNull();
});
it('quantité de périodes facturées : deux années =24 cycles, pas le double de travail dans chaque cycle',()=>{
  let q=sold({schemaVersion:1,kind:'maintenance',cadence:'monthly',billingPeriod:'yearly',minorInterventions:2,quantityMeaning:'billing_periods'});
  q=quotes.updateLine(q.lines[0].id,{label:q.lines[0].label,quantityMilli:2000,proposedUnitPriceCents:19900});
  const accepted=accept(q.id),sale=new OperationalSalesService(db).list(accepted.id)[0],periods=new MaintenanceService(db).listPeriods(String(sale.subscription_id));
  expect(periods).toHaveLength(24);expect(periods.every(p=>p.includedInterventions===2&&p.checks[0].referenceMinutes===45)).toBe(true);
});
it('nouvelle version commerciale : aucune modification des routines futures déjà vendues',()=>{
  const q=accept(sold({schemaVersion:1,kind:'recurring',cadence:'monthly',billingPeriod:'monthly'}).id);
  const sale=new OperationalSalesService(db).list(q.id)[0],maintenance=new MaintenanceService(db),subscription=maintenance.listSubscriptions()[0];
  const next=catalog.createVersion(q.lines[0].catalogItemId!,{priceMode:'fixed',priceCents:29900});catalog.publishVersion(next.id);
  const otherPlan=maintenance.createPlan({name:'TEST nouveau plan',periodicPriceCents:29900,includedInterventions:7});
  maintenance.updatePlan(subscription.planId,{checklistTemplateId:null,includedInterventions:7});
  const future=maintenance.ensurePeriod(String(sale.subscription_id),'2026-11-15');
  expect(future.checks).toHaveLength(1);expect(future.checks[0].referenceMinutes).toBe(45);expect(future.includedInterventions).toBe(0);
  expect(otherPlan.id).not.toBe(subscription.planId);
});
it('cible pending bloque les routines et le chrono ; choix explicite historisé puis verrouillé après travail',()=>{
  const q=accept(sold({schemaVersion:1,kind:'maintenance',cadence:'monthly',billingPeriod:'monthly',minorInterventions:2,maximumMinorMinutes:30,targetRequirement:'site'}).id);
  const sale=new OperationalSalesService(db).list(q.id)[0],maintenance=new MaintenanceService(db),period=maintenance.listPeriods(String(sale.subscription_id))[0];
  expect(()=>maintenance.prepareRoutine(period.checks[0].id)).toThrow(/choisir/);
  db.run(`INSERT INTO projects(id,project_number,client_account_id,name,project_type,created_at,updated_at) VALUES('target-project','PRO-TEST',?,'TEST Site','website','fixture','fixture')`,[clientId]);
  db.run(`INSERT INTO project_sites(id,project_id,name,created_at,updated_at) VALUES('target-site','target-project','Site TEST','fixture','fixture')`);
  db.run(`INSERT INTO project_sites(id,project_id,name,created_at,updated_at) VALUES('other-site','target-project','Autre Site TEST','fixture','fixture')`);
  const targets=new OperationalSalesTargetService(db);targets.assign(String(sale.id),{projectId:'target-project',siteId:'target-site',author:'TEST opérateur'});
  const routine=maintenance.prepareRoutine(period.checks[0].id);expect(maintenance.prepareRoutine(period.checks[0].id).id).toBe(routine.id);
  new TimeService(db).addManual({interventionId:routine.id,category:'support',activityLabel:'Routine TEST',startedAt:'2026-10-16T08:00:00Z',endedAt:'2026-10-16T08:05:00Z'});
  expect(()=>targets.assign(String(sale.id),{projectId:'target-project',siteId:'other-site',author:'TEST opérateur'})).toThrow(/utilisée/);
  expect(maintenance.listPeriods(String(sale.subscription_id))[0].usage.interventionCount).toBe(0);
  expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
});

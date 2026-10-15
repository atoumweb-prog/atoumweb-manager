import { OperationsService } from './OperationsService';
import { OperationalSalesTargetService } from './OperationalSalesTargetService';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  MAINTENANCE_CARRYOVER_MODES,
  MAINTENANCE_CHECK_STATUSES,
  MAINTENANCE_FREQUENCIES,
  MAINTENANCE_PERIOD_STATUSES,
  MAINTENANCE_SUBSCRIPTION_STATUSES,
  type MaintenanceCheck,
  type MaintenanceCheckStatus,
  type MaintenancePeriod,
  type MaintenancePeriodStatus,
  type MaintenancePlan,
  type MaintenancePlanInput,
  type MaintenanceSubscription,
  type MaintenanceSubscriptionFilters,
  type MaintenanceSubscriptionInput,
  type MaintenanceSubscriptionStatus,
} from '../../shared/operations';

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};
const nowIso = (): string => new Date().toISOString();

interface PlanRow extends Record<string, unknown> {
  id: string; name: string; periodic_price_cents: number; frequency: MaintenancePlan['frequency']; included_interventions: number;
  included_minutes: number | null; carryover_mode: MaintenancePlan['carryoverMode']; checklist_template_id: string | null;
  checklist_template_name: string | null; status: MaintenancePlan['status']; notes: string | null; created_at: string; updated_at: string; archived_at: string | null;
}
interface SubscriptionRow extends Record<string, unknown> {
  period_alignment: 'calendar' | 'anniversary';
  id: string; client_account_id: string; project_id: string | null; plan_id: string | null; plan_name_snapshot: string;
  frequency_snapshot: MaintenanceSubscription['frequency']; included_interventions_snapshot: number; included_minutes_snapshot: number | null;
  catalog_price_cents_snapshot: number; contract_price_cents: number; start_date: string; end_date: string | null;
  status: MaintenanceSubscriptionStatus; notes: string | null; created_at: string; updated_at: string; archived_at: string | null;
  client_label: string; project_label: string | null;
}
interface PeriodRow extends Record<string, unknown> {
  id: string; subscription_id: string; period_start: string; period_end: string; included_interventions: number; included_minutes: number | null;
  status: MaintenancePeriodStatus; closed_at: string | null; notes: string | null; created_at: string; updated_at: string;
}
interface CheckRow extends Record<string, unknown> {
  estimate_required:number;operational_sale_id:string|null;reference_minutes:number|null;business_category:import('../../shared/operational').BusinessTimeCategory|null;routine_intervention_id:string|null;
  id: string; period_id: string; template_item_id: string | null; label: string; description: string | null; sort_order: number;
  is_required: number; status: MaintenanceCheckStatus; completed_at: string | null; notes: string | null;
}

export class MaintenanceService {
  constructor(private readonly database: DatabaseAdapter) {}

  listPlans(includeArchived = false): MaintenancePlan[] {
    return this.database.all<PlanRow>(`${this.planSelect()} ${includeArchived ? '' : "WHERE mp.status <> 'archived'"} ORDER BY mp.periodic_price_cents, mp.name COLLATE NOCASE`).map((row) => this.mapPlan(row));
  }

  createPlan(input: MaintenancePlanInput): MaintenancePlan {
    const name = clean(input.name);
    if (!name) throw new Error('Nom du plan de maintenance requis.');
    const frequency = input.frequency ?? 'monthly';
    const carryoverMode = input.carryoverMode ?? 'none';
    this.validatePlanValues(input.periodicPriceCents, input.includedInterventions ?? 0, input.includedMinutes ?? null, frequency, carryoverMode);
    this.assertChecklistTemplate(input.checklistTemplateId ?? null);
    const id = randomUUID(); const now = nowIso();
    this.database.run(
      `INSERT INTO maintenance_plans
       (id,name,periodic_price_cents,frequency,included_interventions,included_minutes,carryover_mode,checklist_template_id,status,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,'active',?,?,?)`,
      [id, name, input.periodicPriceCents, frequency, input.includedInterventions ?? 0, input.includedMinutes ?? null, carryoverMode,
        clean(input.checklistTemplateId), clean(input.notes), now, now],
    );
    this.writeActivity('maintenance_plan', id, 'maintenance_plan_created', `Plan maintenance créé : ${name}`);
    return this.getPlan(id);
  }

  updatePlan(id: string, input: Partial<MaintenancePlanInput>): MaintenancePlan {
    const current = this.getPlan(id);
    if (current.status === 'archived') throw new Error('Réactive ou duplique ce plan avant modification.');
    const name = clean(input.name ?? current.name);
    if (!name) throw new Error('Nom du plan de maintenance requis.');
    const price = input.periodicPriceCents ?? current.periodicPriceCents;
    const frequency = input.frequency ?? current.frequency;
    const includedInterventions = input.includedInterventions ?? current.includedInterventions;
    const includedMinutes = input.includedMinutes === undefined ? current.includedMinutes ?? null : input.includedMinutes;
    const carryoverMode = input.carryoverMode ?? current.carryoverMode;
    const checklistTemplateId = input.checklistTemplateId === undefined ? current.checklistTemplateId ?? null : clean(input.checklistTemplateId);
    this.validatePlanValues(price, includedInterventions, includedMinutes, frequency, carryoverMode);
    this.assertChecklistTemplate(checklistTemplateId);
    const now = nowIso();
    this.database.run(
      `UPDATE maintenance_plans SET name=?,periodic_price_cents=?,frequency=?,included_interventions=?,included_minutes=?,carryover_mode=?,
       checklist_template_id=?,notes=?,updated_at=? WHERE id=?`,
      [name, price, frequency, includedInterventions, includedMinutes, carryoverMode, checklistTemplateId,
        input.notes === undefined ? current.notes ?? null : clean(input.notes), now, id],
    );
    this.writeActivity('maintenance_plan', id, 'maintenance_plan_updated', `Plan maintenance modifié : ${name}`);
    return this.getPlan(id);
  }

  archivePlan(id: string): MaintenancePlan {
    const current = this.getPlan(id);
    if (current.status === 'archived') return current;
    const now = nowIso();
    this.database.run("UPDATE maintenance_plans SET status='archived', archived_at=?, updated_at=? WHERE id=?", [now, now, id]);
    this.writeActivity('maintenance_plan', id, 'maintenance_plan_archived', `Plan maintenance archivé : ${current.name}`);
    return this.getPlan(id);
  }

  listSubscriptions(filters: MaintenanceSubscriptionFilters = {}): MaintenanceSubscription[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filters.includeArchived) where.push("ms.status <> 'archived'");
    if (filters.status) {
      if (!MAINTENANCE_SUBSCRIPTION_STATUSES.includes(filters.status)) throw new Error('Statut de souscription invalide.');
      where.push('ms.status=?'); params.push(filters.status);
    }
    if (clean(filters.clientAccountId)) { where.push('ms.client_account_id=?'); params.push(clean(filters.clientAccountId) as string); }
    if (clean(filters.projectId)) { where.push('ms.project_id=?'); params.push(clean(filters.projectId) as string); }
    return this.database.all<SubscriptionRow>(`${this.subscriptionSelect()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ms.start_date DESC, ms.created_at DESC`, params).map((row) => this.mapSubscription(row));
  }

  createSubscription(input: MaintenanceSubscriptionInput): MaintenanceSubscription {
    const clientId = clean(input.clientAccountId);
    const projectId = clean(input.projectId);
    const planId = clean(input.planId);
    if (!clientId) throw new Error('Client requis.');
    if (!planId) throw new Error('Plan de maintenance requis.');
    this.assertClientProject(clientId, projectId);
    const plan = this.getPlan(planId);
    if (plan.status !== 'active') throw new Error('Ce plan de maintenance est archivé.');
    const startDate = this.dateOnly(input.startDate, 'Date de début invalide.');
    const endDate = input.endDate ? this.dateOnly(input.endDate, 'Date de fin invalide.') : null;
    if (endDate && endDate < startDate) throw new Error('La date de fin doit être postérieure au début.');
    const contractPrice = input.contractPriceCents == null ? plan.periodicPriceCents : input.contractPriceCents;
    if (!Number.isInteger(contractPrice) || contractPrice < 0) throw new Error('Prix contractuel invalide.');
    const id = randomUUID(); const now = nowIso();
    this.database.run(
      `INSERT INTO maintenance_subscriptions
       (id,client_account_id,project_id,plan_id,plan_name_snapshot,frequency_snapshot,included_interventions_snapshot,included_minutes_snapshot,
        catalog_price_cents_snapshot,contract_price_cents,start_date,end_date,period_alignment,status,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'anniversary','active',?,?,?)`,
      [id, clientId, projectId, plan.id, plan.name, plan.frequency, plan.includedInterventions, plan.includedMinutes ?? null,
        plan.periodicPriceCents, contractPrice, startDate, endDate, clean(input.notes), now, now],
    );
    this.writeActivity('maintenance_subscription', id, 'maintenance_subscription_created', `Souscription maintenance créée : ${plan.name}`);
    return this.getSubscription(id);
  }

  changeSubscriptionStatus(id: string, status: MaintenanceSubscriptionStatus): MaintenanceSubscription {
    if (!MAINTENANCE_SUBSCRIPTION_STATUSES.includes(status)) throw new Error('Statut de souscription invalide.');
    const current = this.getSubscription(id);
    const now = nowIso();
    this.database.run('UPDATE maintenance_subscriptions SET status=?, archived_at=?, updated_at=? WHERE id=?', [status, status === 'archived' ? now : null, now, id]);
    this.writeActivity('maintenance_subscription', id, 'maintenance_subscription_status_changed', `Souscription ${current.planName} : ${status}`);
    return this.getSubscription(id);
  }

  listPeriods(subscriptionId: string): MaintenancePeriod[] {
    this.getSubscription(subscriptionId);
    return this.database.all<PeriodRow>('SELECT * FROM maintenance_periods WHERE subscription_id=? ORDER BY period_start DESC', [subscriptionId]).map((row) => this.mapPeriod(row));
  }

  ensurePeriod(subscriptionId: string, referenceDate?: string | null): MaintenancePeriod {
    const subscription = this.getSubscription(subscriptionId);
    if (subscription.status !== 'active') throw new Error('Seule une souscription active peut générer une nouvelle période.');
    const reference = referenceDate ? this.dateOnly(referenceDate, 'Date de période invalide.') : new Date().toISOString().slice(0, 10);
    const bounds = this.periodBounds(subscription, reference);
    const existing = this.database.get<{ id: string }>(
      'SELECT id FROM maintenance_periods WHERE subscription_id=? AND period_start=? AND period_end=?',
      [subscriptionId, bounds.start, bounds.end],
    );
    if (existing) return this.getPeriod(existing.id);

    const id = randomUUID(); const now = nowIso();
    const today = new Date().toISOString().slice(0, 10);
    const status: MaintenancePeriodStatus = bounds.start > today ? 'upcoming' : bounds.end < today ? 'completed' : 'to_do';
    this.database.exec('SAVEPOINT maintenance_period_create;');
    try {
      this.database.run(
        `INSERT INTO maintenance_periods
         (id,subscription_id,period_start,period_end,included_interventions,included_minutes,status,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id, subscriptionId, bounds.start, bounds.end, subscription.includedInterventions, subscription.includedMinutes ?? null, status, now, now],
      );
      const plan = subscription.planId ? this.database.get<{ checklist_template_id: string | null }>('SELECT checklist_template_id FROM maintenance_plans WHERE id=?', [subscription.planId]) : null;
      const main=this.database.get<{id:string;routine_template_id:string|null}>("SELECT id,routine_template_id FROM operational_sales WHERE subscription_id=? AND kind<>'recurring_addon'",[subscriptionId]);
      const templateId=main?.routine_template_id??plan?.checklist_template_id;
      if(templateId)this.copyRoutineTemplate(id,templateId,main?.id??null);
      for(const addon of this.database.all<{id:string;routine_template_id:string;parameters_snapshot_json:string}>("SELECT id,routine_template_id,parameters_snapshot_json FROM operational_sales WHERE subscription_id=? AND kind='recurring_addon'",[subscriptionId])) {
        if((JSON.parse(addon.parameters_snapshot_json).serviceStartDate||'')<=bounds.end)this.copyRoutineTemplate(id,addon.routine_template_id,addon.id);
      }
      this.writeActivity('maintenance_period', id, 'maintenance_period_created', `Période maintenance créée : ${bounds.start} → ${bounds.end}`);
      this.database.exec('RELEASE maintenance_period_create;');
    } catch (error) {
      this.database.exec('ROLLBACK TO maintenance_period_create; RELEASE maintenance_period_create;');
      throw error;
    }
    return this.getPeriod(id);
  }

  changePeriodStatus(id: string, status: MaintenancePeriodStatus): MaintenancePeriod {
    if (!MAINTENANCE_PERIOD_STATUSES.includes(status)) throw new Error('Statut de période invalide.');
    const current = this.getPeriod(id);
    const now = nowIso();
    this.database.run('UPDATE maintenance_periods SET status=?, closed_at=?, updated_at=? WHERE id=?', [status, status === 'closed' ? now : null, now, id]);
    this.writeActivity('maintenance_period', id, 'maintenance_period_status_changed', `Période ${current.periodStart} → ${current.periodEnd} : ${status}`);
    return this.getPeriod(id);
  }

  attachRoutineTemplate(subscriptionId:string,templateId:string,saleId:string,startDate:string):void {
    for(const period of this.database.all<{id:string;period_end:string;status:string}>('SELECT id,period_end,status FROM maintenance_periods WHERE subscription_id=?',[subscriptionId]))
      if(period.period_end>=startDate&&period.status!=='closed')this.copyRoutineTemplate(period.id,templateId,saleId);
  }
  private copyRoutineTemplate(periodId:string,templateId:string,saleId:string|null):void {
    const offset=Number(this.database.get<{last:number}>('SELECT COALESCE(MAX(sort_order),-10)+10 last FROM maintenance_checks WHERE period_id=?',[periodId])?.last??0);
    for(const item of this.database.all<Record<string,unknown>>('SELECT * FROM maintenance_checklist_template_items WHERE template_id=? ORDER BY sort_order',[templateId])) {
      if(this.database.get('SELECT id FROM maintenance_checks WHERE period_id=? AND template_item_id=?',[periodId,String(item.id)]))continue;
      const now=nowIso();
      this.database.run(`INSERT INTO maintenance_checks(id,period_id,template_item_id,label,description,sort_order,is_required,status,reference_minutes,business_category,estimate_required,operational_sale_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,'todo',?,?,?,?,?,?)`,[randomUUID(),periodId,String(item.id),String(item.label),item.description as string|null,offset+Number(item.sort_order),Number(item.is_required),item.reference_minutes as number|null,item.business_category as string|null,Number(item.estimate_required),saleId,now,now]);
    }
  }

  prepareRoutine(checkId:string):import('../../shared/operations').Intervention {
    const row=this.database.get<Record<string,unknown>>(`SELECT c.*,p.subscription_id,p.status period_status,s.client_account_id,s.project_id
      FROM maintenance_checks c JOIN maintenance_periods p ON p.id=c.period_id JOIN maintenance_subscriptions s ON s.id=p.subscription_id WHERE c.id=?`,[checkId]);
    if(!row||row.period_status==='closed')throw Error('Routine absente ou période clôturée.');
    const sale=row.operational_sale_id?{id:String(row.operational_sale_id)}:this.database.get<{id:string}>("SELECT id FROM operational_sales WHERE subscription_id=? AND kind<>'recurring_addon'",[String(row.subscription_id)]);
    if(sale)new OperationalSalesTargetService(this.database).assertSale(sale.id);
    const operations=new OperationsService(this.database);
    if(row.routine_intervention_id)return operations.getIntervention(String(row.routine_intervention_id));
    this.database.exec('SAVEPOINT maintenance_routine');
    try {
      const intervention=operations.createIntervention({clientAccountId:String(row.client_account_id),projectId:row.project_id as string|null,
        maintenancePeriodId:String(row.period_id),subject:String(row.label),description:row.description as string|null,type:'maintenance',coverageMode:'maintenance'});
      this.database.run("UPDATE interventions SET maintenance_usage_kind='routine',estimated_minutes=? WHERE id=?",[row.estimate_required?null:row.reference_minutes as number|null,intervention.id]);
      this.database.run('UPDATE maintenance_checks SET routine_intervention_id=? WHERE id=?',[intervention.id,checkId]);
      this.database.exec('RELEASE maintenance_routine');return operations.getIntervention(intervention.id);
    }catch(e){this.database.exec('ROLLBACK TO maintenance_routine; RELEASE maintenance_routine');throw e;}
  }

  updateCheck(id: string, status: MaintenanceCheckStatus, notes?: string | null): MaintenancePeriod {
    if (!MAINTENANCE_CHECK_STATUSES.includes(status)) throw new Error('Statut de checklist invalide.');
    const row = this.database.get<{ period_id: string }>('SELECT period_id FROM maintenance_checks WHERE id=?', [id]);
    const sale=this.database.get<{id:string}>(`SELECT s.id FROM maintenance_checks c JOIN maintenance_periods p ON p.id=c.period_id JOIN operational_sales s ON s.id=c.operational_sale_id OR(c.operational_sale_id IS NULL AND s.subscription_id=p.subscription_id AND s.kind<>'recurring_addon') WHERE c.id=?`,[id]);
    if(status==='done'&&sale)new OperationalSalesTargetService(this.database).assertSale(sale.id);
    if (!row) throw new Error('Élément de checklist introuvable.');
    const now = nowIso();
    this.database.run(
      'UPDATE maintenance_checks SET status=?, completed_at=?, notes=?, updated_at=? WHERE id=?',
      [status, status === 'done' ? now : null, clean(notes), now, id],
    );
    return this.getPeriod(row.period_id);
  }

  getPlan(id: string): MaintenancePlan {
    const row = this.database.get<PlanRow>(`${this.planSelect()} WHERE mp.id=?`, [id]);
    if (!row) throw new Error('Plan de maintenance introuvable.');
    return this.mapPlan(row);
  }

  getSubscription(id: string): MaintenanceSubscription {
    const row = this.database.get<SubscriptionRow>(`${this.subscriptionSelect()} WHERE ms.id=?`, [id]);
    if (!row) throw new Error('Souscription de maintenance introuvable.');
    return this.mapSubscription(row);
  }

  getPeriod(id: string): MaintenancePeriod {
    const row = this.database.get<PeriodRow>('SELECT * FROM maintenance_periods WHERE id=?', [id]);
    if (!row) throw new Error('Période de maintenance introuvable.');
    return this.mapPeriod(row);
  }

  private mapPeriod(row: PeriodRow): MaintenancePeriod {
    const checks = this.database.all<CheckRow>('SELECT * FROM maintenance_checks WHERE period_id=? ORDER BY sort_order,label COLLATE NOCASE', [row.id]).map<MaintenanceCheck>((check) => ({
      id: check.id, periodId: check.period_id, templateItemId: check.template_item_id, label: check.label, description: check.description,
      operationalSaleId:check.operational_sale_id,estimateRequired:!!check.estimate_required,referenceMinutes:check.reference_minutes,businessCategory:check.business_category,routineInterventionId:check.routine_intervention_id,sortOrder: Number(check.sort_order), required: Boolean(check.is_required), status: check.status, completedAt: check.completed_at, notes: check.notes,
    }));
    const interventionCount = Number(this.database.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM interventions WHERE maintenance_period_id=? AND status NOT IN ('cancelled','archived') AND COALESCE(maintenance_usage_kind,'minor')='minor'",
      [row.id],
    )?.count ?? 0);
    const usedSeconds = Number(this.database.get<{ total: number | null }>(
      `SELECT SUM(MAX(0, ROUND((julianday(COALESCE(ts.ended_at,CURRENT_TIMESTAMP))-julianday(ts.started_at))*86400)) - COALESCE((
        SELECT SUM(MAX(0, ROUND((julianday(COALESCE(tsp.ended_at,COALESCE(ts.ended_at,CURRENT_TIMESTAMP)))-julianday(tsp.started_at))*86400)))
        FROM time_session_pauses tsp WHERE tsp.time_session_id=ts.id
      ),0)) AS total
       FROM time_sessions ts
       JOIN interventions i ON i.id=ts.intervention_id
       WHERE i.maintenance_period_id=? AND i.status NOT IN ('cancelled','archived') AND COALESCE(i.maintenance_usage_kind,'minor')='minor'`,
      [row.id],
    )?.total ?? 0);
    const routineSeconds=Number(this.database.get<{total:number|null}>(`SELECT SUM(MAX(0, ROUND((julianday(COALESCE(ts.ended_at,CURRENT_TIMESTAMP))-julianday(ts.started_at))*86400)) - COALESCE((
      SELECT SUM(MAX(0,ROUND((julianday(COALESCE(tsp.ended_at,COALESCE(ts.ended_at,CURRENT_TIMESTAMP)))-julianday(tsp.started_at))*86400))) FROM time_session_pauses tsp WHERE tsp.time_session_id=ts.id
    ),0)) total FROM time_sessions ts JOIN interventions i ON i.id=ts.intervention_id WHERE i.maintenance_period_id=? AND i.status NOT IN ('cancelled','archived') AND i.maintenance_usage_kind='routine'`,[row.id])?.total??0);
    const interventionQuota = Number(row.included_interventions);
    const secondsQuota = row.included_minutes == null ? null : Number(row.included_minutes) * 60;
    return {
      id: row.id, subscriptionId: row.subscription_id, periodStart: row.period_start, periodEnd: row.period_end,
      includedInterventions: interventionQuota, includedMinutes: row.included_minutes == null ? null : Number(row.included_minutes), status: row.status,
      closedAt: row.closed_at, notes: row.notes, checks,
      usage: {
        interventionCount,
        usedSeconds: Math.max(0, usedSeconds+routineSeconds),
        routineSeconds:Math.max(0,routineSeconds),
        remainingInterventions: interventionQuota > 0 ? Math.max(0, interventionQuota - interventionCount) : null,
        remainingSeconds: secondsQuota == null ? null : Math.max(0, secondsQuota - usedSeconds),
        interventionsOverQuota: interventionQuota > 0 ? Math.max(0, interventionCount - interventionQuota) : 0,
        secondsOverQuota: secondsQuota == null ? 0 : Math.max(0, usedSeconds - secondsQuota),
      },
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  private mapPlan(row: PlanRow): MaintenancePlan {
    return {
      id: row.id, name: row.name, periodicPriceCents: Number(row.periodic_price_cents), frequency: row.frequency,
      includedInterventions: Number(row.included_interventions), includedMinutes: row.included_minutes == null ? null : Number(row.included_minutes),
      carryoverMode: row.carryover_mode, checklistTemplateId: row.checklist_template_id, checklistTemplateName: row.checklist_template_name,
      status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at,
    };
  }

  private mapSubscription(row: SubscriptionRow): MaintenanceSubscription {
    const sale=this.database.get<{canonical_code:string;label:string;policy_snapshot_json:string}>(`SELECT i.canonical_code,l.label,s.policy_snapshot_json FROM operational_sales s JOIN quote_lines l ON l.id=s.quote_line_id JOIN catalog_versions v ON v.id=s.catalog_version_id JOIN catalog_items i ON i.id=v.item_id WHERE s.subscription_id=? AND s.kind<>'recurring_addon'`,[row.id]);
    return {canonicalCode:sale?.canonical_code??null,billingPeriod:sale?JSON.parse(sale.policy_snapshot_json).billingPeriod:null,
      id: row.id, clientAccountId: row.client_account_id, projectId: row.project_id, planId: row.plan_id ?? '', clientLabel: row.client_label,
      projectLabel: row.project_label, planName: sale?.label??row.plan_name_snapshot, frequency: row.frequency_snapshot,
      includedInterventions: Number(row.included_interventions_snapshot), includedMinutes: row.included_minutes_snapshot == null ? null : Number(row.included_minutes_snapshot),
      catalogPriceCents: Number(row.catalog_price_cents_snapshot), contractPriceCents: Number(row.contract_price_cents),
      startDate: row.start_date, endDate: row.end_date, status: row.status, notes: row.notes, periodAlignment:row.period_alignment,
      createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at,
    };
  }

  private planSelect(): string {
    return `SELECT mp.*,mct.name AS checklist_template_name
      FROM maintenance_plans mp
      LEFT JOIN maintenance_checklist_templates mct ON mct.id=mp.checklist_template_id`;
  }

  private subscriptionSelect(): string {
    return `SELECT ms.*,
      COALESCE(o.name,trim(c.first_name || ' ' || c.last_name),'Client') AS client_label,
      p.name AS project_label
      FROM maintenance_subscriptions ms
      JOIN client_accounts ca ON ca.id=ms.client_account_id
      LEFT JOIN organizations o ON o.id=ca.organization_id
      LEFT JOIN contacts c ON c.id=ca.primary_contact_id
      LEFT JOIN projects p ON p.id=ms.project_id`;
  }

  private periodBounds(subscription: MaintenanceSubscription, reference: string): { start: string; end: string } {
    if (reference < subscription.startDate) throw new Error('La période demandée est antérieure à la souscription.');
    if (subscription.endDate && reference > subscription.endDate) throw new Error('La période demandée est postérieure à la souscription.');
    if (subscription.periodAlignment === 'anniversary') {
      const origin = new Date(`${subscription.startDate}T12:00:00Z`), date = new Date(`${reference}T12:00:00Z`);
      const step = subscription.frequency === 'yearly' ? 12 : subscription.frequency === 'quarterly' ? 3 : 1;
      let index = Math.floor(((date.getUTCFullYear()-origin.getUTCFullYear())*12+date.getUTCMonth()-origin.getUTCMonth())/step);
      const boundary = (i:number) => {
        const d=new Date(Date.UTC(origin.getUTCFullYear(),origin.getUTCMonth()+i*step,1,12));
        d.setUTCDate(Math.min(origin.getUTCDate(),new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));
        return d.toISOString().slice(0,10);
      };
      if(boundary(index)>reference)index--;
      const start=boundary(index), end=new Date(Date.parse(`${boundary(index+1)}T12:00:00Z`)-86400000).toISOString().slice(0,10);
      return {start,end:subscription.endDate && subscription.endDate<end?subscription.endDate:end};
    }
    const date = new Date(`${reference}T12:00:00Z`);
    let start: Date;
    let end: Date;
    if (subscription.frequency === 'monthly') {
      start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
      end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    } else if (subscription.frequency === 'quarterly') {
      const month = Math.floor(date.getUTCMonth() / 3) * 3;
      start = new Date(Date.UTC(date.getUTCFullYear(), month, 1));
      end = new Date(Date.UTC(date.getUTCFullYear(), month + 3, 0));
    } else {
      start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      end = new Date(Date.UTC(date.getUTCFullYear(), 12, 0));
    }
    let startText = start.toISOString().slice(0, 10);
    let endText = end.toISOString().slice(0, 10);
    if (startText < subscription.startDate) startText = subscription.startDate;
    if (subscription.endDate && endText > subscription.endDate) endText = subscription.endDate;
    return { start: startText, end: endText };
  }

  private assertClientProject(clientId: string, projectId?: string | null): void {
    const client = this.database.get<{ id: string }>('SELECT id FROM client_accounts WHERE id=?', [clientId]);
    if (!client) throw new Error('Client introuvable.');
    if (!projectId) return;
    const project = this.database.get<{ client_account_id: string | null }>('SELECT client_account_id FROM projects WHERE id=?', [projectId]);
    if (!project) throw new Error('Projet introuvable.');
    if (project.client_account_id !== clientId) throw new Error('Le projet appartient à un autre client.');
  }

  private assertChecklistTemplate(id?: string | null): void {
    if (!id) return;
    const row = this.database.get<{ id: string }>('SELECT id FROM maintenance_checklist_templates WHERE id=? AND status=\'active\'', [id]);
    if (!row) throw new Error('Modèle de checklist introuvable ou archivé.');
  }

  private validatePlanValues(price: number, includedInterventions: number, includedMinutes: number | null, frequency: MaintenancePlan['frequency'], carryoverMode: MaintenancePlan['carryoverMode']): void {
    if (!Number.isInteger(price) || price < 0) throw new Error('Prix de maintenance invalide.');
    if (!Number.isInteger(includedInterventions) || includedInterventions < 0) throw new Error('Quota d’interventions invalide.');
    if (includedMinutes != null && (!Number.isInteger(includedMinutes) || includedMinutes < 0)) throw new Error('Quota de temps invalide.');
    if (!MAINTENANCE_FREQUENCIES.includes(frequency)) throw new Error('Fréquence de maintenance invalide.');
    if (!MAINTENANCE_CARRYOVER_MODES.includes(carryoverMode)) throw new Error('Règle de report invalide.');
  }

  private dateOnly(value: string, message: string): string {
    const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
    if (Number.isNaN(date.getTime())) throw new Error(message);
    return date.toISOString().slice(0, 10);
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,created_at) VALUES (?,?,?,?,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}

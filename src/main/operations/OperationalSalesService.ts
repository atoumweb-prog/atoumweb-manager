import { OperationalSalesTargetService } from './OperationalSalesTargetService';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { OperationalModel } from '../../shared/operational';
import { validateOperationalSalePolicy, type OperationalSalePolicy, type QuoteLineParameters } from '../../shared/commercialRules';
import type { QuoteDetail } from '../../shared/commercial';
import { CommercialRulesService } from '../commercial/CommercialRulesService';
import { HourPackService } from './HourPackService';
import { MaintenanceService } from './MaintenanceService';
import { OperationsService } from './OperationsService';

type Row=Record<string,unknown>;
export function addMonths(date:string, months:number):string {
  const start=new Date(`${date.slice(0,10)}T12:00:00Z`);
  if(Number.isNaN(start.getTime()))throw Error('Date de début invalide.');
  const day=start.getUTCDate();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()+months);
  const last=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();
  start.setUTCDate(Math.min(day,last));return start.toISOString().slice(0,10);
}

/** Adapter from accepted sales to existing operations engines. No 8A task generation. */
export class OperationalSalesService {
  private readonly packs:HourPackService;
  private readonly maintenance:MaintenanceService;
  private readonly operations:OperationsService;
  constructor(private readonly db:DatabaseAdapter) {
    this.packs=new HourPackService(db);this.maintenance=new MaintenanceService(db);this.operations=new OperationsService(db);
  }

  private configuration(versionId:string, linkId:string|undefined) {
    if(!linkId)return null;
    const row=this.db.get<Row>(`SELECT l.*,m.status model_status,m.model_json FROM catalog_operational_links l
      JOIN operational_model_versions m ON m.id=l.model_version_id WHERE l.catalog_version_id=? AND l.id=?`,[versionId,linkId]);
    if(!row)return null;
    const model=JSON.parse(String(row.model_json)) as OperationalModel;
    if(model.lot!=='8B')return null;
    const policy=JSON.parse(String(row.provenance_json)).operations as OperationalSalePolicy|undefined;
    if(policy)validateOperationalSalePolicy(policy);
    return {row,model,policy};
  }

  issues(quote:QuoteDetail):string[] {
    const issues:string[]=[];
    for(const line of quote.lines){
      if(!line.catalogVersionId)continue;
      const config=this.configuration(line.catalogVersionId,(line.snapshot?.operational as {linkId?:string}|undefined)?.linkId);
      if(!config){
        if(line.snapshot?.canonicalCode && this.db.get(`SELECT id FROM operational_model_versions
          WHERE catalog_item_id=? AND json_extract(model_json,'$.lot')='8B' LIMIT 1`,[line.catalogItemId??null])) issues.push(`${line.label} : configuration opérationnelle non activée au moment de la sélection ; ajouter à nouveau la ligne après mise en usage explicite.`);
        continue;
      }
      const params=new CommercialRulesService(this.db).parameters(line.id);
      if(!config.policy||config.row.status!=='ready'||config.row.model_status!=='ready')issues.push(`${line.label} : configuration opérationnelle non activée.`);
      if(config.policy?.cadence==='monthly'&&config.policy.kind!=='recurring_addon'&&!config.policy.periodAlignment&&!params?.periodAlignment)issues.push(`${line.label} : choix des périodes mensuelles à renseigner explicitement.`);
      if(config.policy?.periodAlignment==='anniversary'&&params?.periodAlignment==='calendar')issues.push(`${line.label} : les nouveaux abonnements utilisent des cycles de date à date.`);
      if(!params?.serviceStartDate)issues.push(`${line.label} : date de début à renseigner.`);
      if(config.policy?.kind==='recurring_addon')try{this.parentSale(params||{},config.policy,quote.clientAccountId||quote.acceptedClientAccountId||'');}catch(e){issues.push(`${line.label} : ${e instanceof Error?e.message:String(e)}`);}
      if(config.policy?.setupEstimateRequired && params?.setupEstimateMinutes==null)issues.push(`${line.label} : estimation spécifique de mise en service à renseigner.`);
      if(config.policy?.quantityMode!=='hours'&&!Number.isInteger((line.quantityMilli??1000)/1000))issues.push(`${line.label} : quantité entière requise pour les crédits et cycles.`);
    }
    return issues;
  }

  provision(quote:QuoteDetail):Row[] {
    if(quote.status!=='accepted'||!quote.acceptedClientAccountId)throw Error('L’activation opérationnelle exige un devis accepté.');
    const issues=this.issues(quote);if(issues.length)throw Error(issues.join('\n'));
    this.db.exec('SAVEPOINT operational_sales_provision');
    try {
      for(const line of quote.lines){
        if(!line.catalogVersionId)continue;
        const config=this.configuration(line.catalogVersionId,(line.snapshot?.operational as {linkId?:string}|undefined)?.linkId);if(!config)continue;
        if(this.db.get('SELECT id FROM operational_sales WHERE quote_line_id=?',[line.id]))continue;
        const {row,model}=config,policy=config.policy!;
        const params=new CommercialRulesService(this.db).parameters(line.id)!;
        const start=params.serviceStartDate!.slice(0,10),quantity=(line.quantityMilli??1000)/1000;
        const projectId=quote.projectId??params.operationalProjectId??null;
        this.assertTargets(params,projectId);
        let packId:string|null=null,subscriptionId:string|null=null,interventionId:string|null=null,setupId:string|null=null,parentSaleId:string|null=null,routineTemplateId:string|null=null;
        if(policy.kind==='hour_pack'){
          if(!policy.creditMinutes||!policy.validityMonths)throw Error('Crédit/validité non configurés.');
          packId=this.packs.create({clientAccountId:quote.acceptedClientAccountId,projectId,name:line.label,
            purchasedSeconds:policy.creditMinutes*quantity*60,contractPriceCents:line.contractLineValueCents,
            purchasedAt:`${start}T12:00:00Z`,expiresAt:`${addMonths(start,policy.validityMonths)}T12:00:00Z`}).id;
        }else if(policy.kind==='intervention'){
          interventionId=this.operations.createIntervention({clientAccountId:quote.acceptedClientAccountId,projectId,
            subject:line.label,description:params.scope||line.description,coverageMode:'out_of_scope',
            theoreticalValueCents:line.contractLineValueCents,billableAmountCents:line.contractLineValueCents}).id;
          this.db.run('UPDATE interventions SET estimated_minutes=?,operational_checklist_json=? WHERE id=?',
            [model.estimateRequired?params.currentEstimateMinutes??null:Math.round(model.referenceMinutes*quantity),JSON.stringify(model.actions),interventionId]);
        }else if(policy.kind==='recurring_addon'){
          const parent=this.parentSale(params,policy,quote.acceptedClientAccountId);parentSaleId=String(parent.id);subscriptionId=String(parent.subscription_id);
          routineTemplateId=this.createRoutineTemplate(line.id,model,quantity);
        }else{
          routineTemplateId=this.createRoutineTemplate(line.id,model,policy.quantityMeaning==='billing_periods'?1:quantity);
          const plan=this.maintenance.createPlan({name:`${line.label} — ${quote.number} — ligne ${line.sortOrder+1}`,periodicPriceCents:line.contractLineValueCents,
            checklistTemplateId:routineTemplateId,frequency:policy.cadence==='yearly'?'yearly':'monthly',includedInterventions:policy.minorInterventions??0,
            includedMinutes:null,carryoverMode:'none'});
          // Billing period and operational cadence are deliberately independent.
          const billedPeriods=policy.quantityMeaning==='billing_periods'?quantity:1;
          const billingEnd=addMonths(start,billedPeriods*(policy.billingPeriod==='yearly'?12:1));
          const end=params.serviceEndDate?.slice(0,10)??(policy.billingPeriod==='yearly'?new Date(Date.parse(`${billingEnd}T12:00:00Z`)-86400000).toISOString().slice(0,10):null);
          const subscription=this.maintenance.createSubscription({clientAccountId:quote.acceptedClientAccountId,projectId,
            planId:plan.id,startDate:start,endDate:end,contractPriceCents:line.contractLineValueCents});subscriptionId=subscription.id;
          this.db.run("UPDATE maintenance_subscriptions SET maximum_minor_minutes=?,period_alignment=? WHERE id=?",[policy.maximumMinorMinutes??null,policy.periodAlignment??params.periodAlignment??'calendar',subscriptionId]);
          this.ensureCycles(subscriptionId,model,policy,start,end??new Date(Date.parse(`${billingEnd}T12:00:00Z`)-86400000).toISOString().slice(0,10),quantity);
          if(policy.setupEstimateRequired){
            const setup=this.operations.createIntervention({clientAccountId:quote.acceptedClientAccountId,projectId,
              subject:`Mise en service — ${line.label}`,description:'Espace d’hébergement, SSL et configuration prévus au devis.',coverageMode:'included_project'});
            setupId=setup.id;
            this.db.run('UPDATE interventions SET estimated_minutes=? WHERE id=?',[params.setupEstimateMinutes!,setup.id]);
            this.db.run('UPDATE maintenance_subscriptions SET notes=? WHERE id=?',[`Mise en service incluse : ${setup.id}`,subscriptionId]);
          }
        }
        const saleId=randomUUID();
        this.db.run(`INSERT INTO operational_sales
          (id,quote_line_id,catalog_version_id,operational_link_id,model_version_id,client_account_id,project_id,site_id,context_node_id,
          kind,hour_pack_id,subscription_id,intervention_id,setup_intervention_id,policy_snapshot_json,parameters_snapshot_json,created_at,parent_sale_id,routine_template_id)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[saleId,line.id,line.catalogVersionId,String(row.id),String(row.model_version_id),
          quote.acceptedClientAccountId,projectId,params.siteId??null,params.contextNodeId??null,policy.kind,packId,subscriptionId,interventionId,setupId,
          JSON.stringify(policy),JSON.stringify({...params,quantityMilli:line.quantityMilli,optionPurchase:line.optionPurchase??null}),new Date().toISOString(),parentSaleId,routineTemplateId]);
        if(subscriptionId&&policy.kind!=='recurring_addon')this.db.run(`UPDATE maintenance_checks SET operational_sale_id=? WHERE operational_sale_id IS NULL AND period_id IN(SELECT id FROM maintenance_periods WHERE subscription_id=?)`,[saleId,subscriptionId]);
        if(subscriptionId&&routineTemplateId)this.maintenance.attachRoutineTemplate(subscriptionId,routineTemplateId,saleId,start);
        this.db.run('INSERT INTO operational_sale_targets(sale_id,project_id,state) VALUES(?,?,?)',[saleId,projectId,policy.targetRequirement&&policy.targetRequirement!=='none'?'pending':'active']);
        if(projectId && (params.siteId||params.contextNodeId))new OperationalSalesTargetService(this.db).assign(saleId,{projectId,siteId:params.siteId,contextNodeId:params.contextNodeId,author:'Choix explicite renseigné au devis'});
      }
      for(const line of quote.lines) {
        const rule=line.snapshot?.commercialRules as {attachment?:{kind:string}}|undefined;
        if(rule?.attachment?.kind!=='priority')continue;
        const params=new CommercialRulesService(this.db).parameters(line.id);
        const parentSale=params?.parentLineId?this.db.get<{intervention_id:string|null}>('SELECT intervention_id FROM operational_sales WHERE quote_line_id=?',[params.parentLineId]):null;
        const interventionId=params?.parentInterventionId??parentSale?.intervention_id;
        if(interventionId) {
          const sourceKey=`urgent:${line.id}:${interventionId}`;
          if(this.db.get("SELECT id FROM activity_log WHERE action='accepted_priority_attached' AND json_extract(metadata_json,'$.sourceKey')=?",[sourceKey]))continue;
          this.operations.updateIntervention(interventionId,{priority:'urgent',scheduledAt:params?.acceptedDeadline});
          this.db.run(`INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES(?,?,?,?,?,?)`,
            ['intervention',interventionId,'accepted_priority_attached','Priorité et délai explicitement acceptés depuis le devis ; financement inchangé',JSON.stringify({sourceKey,quoteId:quote.id,lineId:line.id,parameters:params}),new Date().toISOString()]);
        }
      }
      this.db.exec('RELEASE operational_sales_provision');return this.list(quote.id);
    }catch(error){this.db.exec('ROLLBACK TO operational_sales_provision; RELEASE operational_sales_provision');throw error;}
  }

  list(quoteId:string):Row[]{return this.db.all(`SELECT s.*,i.canonical_code,l.label,t.state target_state,t.project_id target_project_id,t.site_id target_site_id,t.context_node_id target_context_node_id FROM operational_sales s
    LEFT JOIN operational_sale_targets t ON t.sale_id=s.id
    JOIN quote_lines l ON l.id=s.quote_line_id JOIN catalog_versions v ON v.id=s.catalog_version_id
    JOIN catalog_items i ON i.id=v.item_id WHERE l.quote_id=? ORDER BY l.sort_order`,[quoteId]);}

  private parentSale(params:QuoteLineParameters,policy:OperationalSalePolicy,clientId:string):Row {
    const parent=params.parentOperationalSaleId?this.db.get<Row>(`SELECT s.*,i.canonical_code,ms.status subscription_status FROM operational_sales s
      JOIN catalog_versions v ON v.id=s.catalog_version_id JOIN catalog_items i ON i.id=v.item_id JOIN maintenance_subscriptions ms ON ms.id=s.subscription_id
      WHERE s.id=? AND s.client_account_id=?`,[params.parentOperationalSaleId,clientId]):null;
    if(!parent||parent.subscription_status!=='active'||!policy.parentCodes?.includes(String(parent.canonical_code)))throw Error('Sélectionner le suivi principal compatible ; l’établissement supplémentaire ne constitue pas un abonnement indépendant.');
    return parent;
  }

  private assertTargets(params:QuoteLineParameters,projectId:string|null):void{
    if(params.siteId&&!this.db.get('SELECT id FROM project_sites WHERE id=? AND project_id=?',[params.siteId,projectId]))throw Error('Site cible extérieur au Projet.');
    if(params.contextNodeId&&!this.db.get('SELECT id FROM project_nodes WHERE id=? AND project_id=?',[params.contextNodeId,projectId]))throw Error('Contexte extérieur au Projet.');
  }

  private createRoutineTemplate(lineId:string,model:OperationalModel,quantity:number):string {
    const id=randomUUID(),now=new Date().toISOString();
    this.db.run(`INSERT INTO maintenance_checklist_templates(id,name,description,status,created_at,updated_at) VALUES(?,?,?,'active',?,?)`,
      [id,`${model.code} — ligne ${lineId}`,`Modèle vendu ${model.name} ; aucune mise à jour automatique`,now,now]);
    for(const [sort,action] of model.actions.entries())this.db.run(`INSERT INTO maintenance_checklist_template_items
      (id,template_id,label,description,sort_order,is_required,reference_minutes,business_category,created_at,estimate_required) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [randomUUID(),id,`${action.phase} — ${action.name}`,action.checklist,sort,action.required?1:0,action.minutes*quantity,action.category,now,model.estimateRequired?1:0]);
    return id;
  }

  private ensureCycles(subscriptionId:string,model:OperationalModel,policy:OperationalSalePolicy,start:string,end:string,quantity:number):void{
    for(let index=0;index<1200;index++){
      const date=addMonths(start,index*(policy.cadence==='yearly'?12:1));if(date>end)return;
      const period=this.maintenance.ensurePeriod(subscriptionId,date);
      if(policy.cadence==='once')return;
    }
    throw Error('Période trop longue ; préciser le périmètre de suivi.');
  }
}

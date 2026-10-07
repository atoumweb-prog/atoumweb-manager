import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { OperationalSalePolicy } from '../../shared/commercialRules';
import { ProjectContributionTargetService } from '../projects/ProjectContributionTargetService';

type Row=Record<string,unknown>;
export class OperationalSalesTargetService {
  constructor(private readonly db:DatabaseAdapter){}
  assign(saleId:string,input:{projectId:string;siteId?:string|null;contextNodeId?:string|null;author:string}):void {
    const sale=this.db.get<Row>('SELECT * FROM operational_sales WHERE id=?',[saleId]);if(!sale)throw Error('Vente opérationnelle absente.');
    if(!input.author.trim())throw Error('Auteur du choix requis.');
    if(sale.parent_sale_id){
      const parent=this.db.get<Row>("SELECT * FROM operational_sale_targets WHERE sale_id=? AND state='active'",[String(sale.parent_sale_id)]);
      if(!parent||parent.project_id!==input.projectId)throw Error('Affecter le complément dans le Projet du suivi principal.');
      if(input.contextNodeId&&input.contextNodeId===parent.context_node_id)throw Error('Choisir l’établissement supplémentaire, distinct de l’établissement principal.');
    }

    if(sale.project_id&&sale.project_id!==input.projectId)throw Error('Le Projet vendu ne peut pas être remplacé silencieusement.');
    if(!this.db.get('SELECT id FROM projects WHERE id=? AND client_account_id=?',[input.projectId,String(sale.client_account_id)]))throw Error('Projet du même Client requis.');
    const old=this.db.get<Row>('SELECT * FROM operational_sale_targets WHERE sale_id=?',[saleId]);
    if(old?.state==='active'&&old.project_id===input.projectId&&old.site_id===(input.siteId||null)&&old.context_node_id===(input.contextNodeId||null))return;
    if(this.worked(sale))throw Error('Cible déjà utilisée : aucun changement silencieux après travail ou chrono.');
    const policy=JSON.parse(String(sale.policy_snapshot_json)) as OperationalSalePolicy;
    this.validate(policy,input.projectId,input.siteId||null,input.contextNodeId||null);
    this.db.exec('SAVEPOINT operational_sale_target');
    try{
      const now=new Date().toISOString();
      this.db.run(`INSERT INTO operational_sale_targets VALUES(?,?,?,?,'active',?,?) ON CONFLICT(sale_id)
        DO UPDATE SET project_id=excluded.project_id,site_id=excluded.site_id,context_node_id=excluded.context_node_id,state='active',author=excluded.author,selected_at=excluded.selected_at`,[saleId,input.projectId,input.siteId||null,input.contextNodeId||null,input.author.trim(),now]);
      if(sale.subscription_id&&!sale.parent_sale_id)this.db.run('UPDATE maintenance_subscriptions SET project_id=? WHERE id=?',[input.projectId,String(sale.subscription_id)]);
      for(const id of [sale.intervention_id,sale.setup_intervention_id])if(id)this.db.run('UPDATE interventions SET project_id=? WHERE id=?',[input.projectId,String(id)]);
      this.db.run(`INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES(?,?,?,?,?,?)`,['project',input.projectId,'operational_sale_target_assigned','Cible opérationnelle choisie après acceptation, périmètre commercial conservé',JSON.stringify({saleId,old,input,policy,commercialLine:sale.quote_line_id}),now]);
      this.db.exec('RELEASE operational_sale_target');
    }catch(e){this.db.exec('ROLLBACK TO operational_sale_target; RELEASE operational_sale_target');throw e;}
  }

  assertSale(saleId:string):void {
    const sale=this.db.get<Row>('SELECT * FROM operational_sales WHERE id=?',[saleId]);if(!sale)return;
    const policy=JSON.parse(String(sale.policy_snapshot_json)) as OperationalSalePolicy;
    if(!policy.targetRequirement||policy.targetRequirement==='none')return;
    const target=this.db.get<Row>("SELECT * FROM operational_sale_targets WHERE sale_id=? AND state='active'",[saleId]);
    if(!target)throw Error('Destination opérationnelle à choisir avant intégration ou chrono.');
    this.validate(policy,String(target.project_id),target.site_id as string|null,target.context_node_id as string|null);
  }
  assertInterventionPeriod(id:string,occurredAt:string,historical=false):void {
    const row=this.db.get<Row>(`SELECT ms.status,ms.start_date,ms.end_date,p.period_start,p.period_end FROM interventions i
      JOIN maintenance_periods p ON p.id=i.maintenance_period_id JOIN maintenance_subscriptions ms ON ms.id=p.subscription_id
      WHERE i.id=? AND EXISTS(SELECT 1 FROM operational_sales WHERE subscription_id=ms.id)`,[id]);
    if(!row)return;
    const day=occurredAt.slice(0,10);
    if(!historical&&row.status!=='active')throw Error('Service suspendu ou terminé : aucune nouvelle exécution.');
    if(day<String(row.start_date)||(row.end_date&&day>String(row.end_date))||day<String(row.period_start)||day>String(row.period_end))throw Error('Le temps doit correspondre à une période opérationnelle vendue.');
  }
  assertIntervention(id:string):void {
    const routine=this.db.get<Row>('SELECT operational_sale_id FROM maintenance_checks WHERE routine_intervention_id=?',[id]);
    if(routine?.operational_sale_id){this.assertSale(String(routine.operational_sale_id));return;}
    const sale=this.db.get<Row>(`SELECT s.id FROM operational_sales s WHERE s.intervention_id=? OR s.setup_intervention_id=? OR
      s.subscription_id IN (SELECT p.subscription_id FROM maintenance_periods p JOIN interventions i ON i.maintenance_period_id=p.id WHERE i.id=?)`,[id,id,id]);
    if(sale)this.assertSale(String(sale.id));
  }
  private validate(policy:OperationalSalePolicy,projectId:string,siteId:string|null,contextId:string|null):void {
    const choices=new ProjectContributionTargetService(this.db).choices(projectId);
    if(policy.targetRequirement==='site'){
      const site=choices.sites.find(s=>s.id===siteId);if(!site)throw Error('Site cible actif à choisir explicitement.');
      if(policy.requires?.some(capability=>!site.provides.includes(capability)))throw Error('Capacité requise non attestée par la base configurée.');
    }
    if(policy.targetRequirement==='context'&&!choices.contexts.some(c=>c.id===contextId))throw Error('Élément opérationnel cible actif à choisir explicitement.');
  }
  private worked(sale:Row):boolean {
    if(sale.parent_sale_id)return !!this.db.get(`SELECT c.id FROM maintenance_checks c LEFT JOIN interventions i ON i.id=c.routine_intervention_id
      WHERE c.operational_sale_id=? AND (c.status='done' OR i.started_at IS NOT NULL OR i.status IN ('in_progress','to_validate','completed') OR EXISTS(SELECT 1 FROM time_sessions t WHERE t.intervention_id=i.id)) LIMIT 1`,[String(sale.id)]);
    return !!this.db.get(`SELECT i.id FROM interventions i WHERE (i.id IN (?,?) OR i.maintenance_period_id IN
      (SELECT id FROM maintenance_periods WHERE subscription_id=?)) AND
      (i.started_at IS NOT NULL OR i.status IN ('in_progress','to_validate','completed') OR EXISTS(SELECT 1 FROM time_sessions WHERE intervention_id=i.id)) LIMIT 1`,
      [sale.intervention_id as string|null,sale.setup_intervention_id as string|null,sale.subscription_id as string|null]) ||
      !!this.db.get(`SELECT c.id FROM maintenance_checks c JOIN maintenance_periods p ON p.id=c.period_id WHERE p.subscription_id=? AND c.status='done' LIMIT 1`,[sale.subscription_id as string|null]);
  }
}

import {ProjectContributionTargetService} from './ProjectContributionTargetService';
import {readPolicy,validatePolicy,checkQuantity} from './ContributionPolicy';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { OperationalModel, OperationalPlan, OperationalActionSnapshot, OperationalNodeInfo } from '../../shared/operational';
import { operationalHash } from './OperationalReferenceService';
import type { SoldBlueprintPlan } from './ProjectBlueprintCompositionService';
type Row=Record<string,unknown>;
export class ProjectOperationalService {
  constructor(private readonly db: DatabaseAdapter) {}

  resolve(quoteId: string, origins: Map<string,string>, projectId?: string | null): OperationalPlan {
    return this.resolvePlan(quoteId,origins,projectId,false);
  }

  stageQuote(quoteId:string,origins:Map<string,string>): OperationalPlan {
    return this.resolvePlan(quoteId,origins,null,true);
  }

  private resolvePlan(quoteId:string,origins:Map<string,string>,projectId:string|null|undefined,staging:boolean):OperationalPlan {
    const plan: OperationalPlan={schemaVersion:1,...(staging?{mode:'staging' as const}:{}),actions:[],excluded:[],links:[]};
    const previous=projectId?this.db.get<Row>('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[projectId]):null;
    const pins=previous?JSON.parse(String(previous.plan_json)).operations as OperationalPlan | undefined:undefined;
    for (const line of this.db.all<Row>('SELECT l.*,i.canonical_code FROM quote_lines l LEFT JOIN catalog_items i ON i.id=l.catalog_item_id WHERE l.quote_id=? ORDER BY l.sort_order,l.id',[quoteId])) {
      if (!line.catalog_version_id) continue;
      const origin=origins.get(String(line.id)) ?? String(line.id);
      const pin=pins?.actions.find(a=>a.lineOrigin===origin && a.catalogVersionId===line.catalog_version_id);
      const pinnedLink=pins?.links.find(l=>l.lineOrigin===origin && l.catalogVersionId===line.catalog_version_id);
      const recordedLink=JSON.parse(String(line.snapshot_json||'{}')).operational?.linkId as string|undefined;
      const ready=staging?'':" AND status='ready'";
      const link=pinnedLink?.linkId ? this.db.get<Row>('SELECT * FROM catalog_operational_links WHERE id=?'+ready,[pinnedLink.linkId]) : pin
        ? this.db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? AND model_version_id=?'+ready+' ORDER BY revision DESC LIMIT 1',[String(line.catalog_version_id),pin.modelVersionId])
        : recordedLink ? this.db.get<Row>('SELECT * FROM catalog_operational_links WHERE id=? AND catalog_version_id=?'+ready,[recordedLink,String(line.catalog_version_id)])
        : this.db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=?'+ready+' ORDER BY revision DESC LIMIT 1',[String(line.catalog_version_id)]);
      if (!link) {
        if (this.db.get('SELECT id FROM operational_model_versions WHERE catalog_item_id=?',[String(line.catalog_item_id)]) && this.db.get<Row>('SELECT id FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC LIMIT 1',[String(line.catalog_item_id)])?.id===line.catalog_version_id)
          throw Error('Modèle opérationnel disponible mais compatibilité non configurée : '+String(line.canonical_code));
        continue;
      }
      const v=this.db.get<Row>('SELECT * FROM operational_model_versions WHERE id=?',[String(link.model_version_id)])!;
      if (!staging && v.status!=='ready') throw Error('Modèle opérationnel non mis en usage.');
      if(!staging && link.blueprint_version_id && !this.db.get("SELECT template_version_id FROM blueprint_operational_profiles WHERE template_version_id=? AND mode='structural' AND operational_ready=1",[String(link.blueprint_version_id)]))throw Error('Profil structurel non mis en usage.');
      const m=JSON.parse(String(v.model_json)) as OperationalModel;
      const configuration=readPolicy(String(link.provenance_json));
      if(configuration) {validatePolicy(configuration,m,link.blueprint_version_id as string|null,this.db);checkQuantity(configuration,Number(line.quantity_milli));}
      plan.links.push({configuration,linkId:String(link.id),lineOrigin:origin,quoteLineId:String(line.id),catalogVersionId:String(line.catalog_version_id),modelVersionId:String(v.id),blueprintVersionId:link.blueprint_version_id as string|null});
      if (m.lot==='8B') {plan.excluded.push({code:m.code,lineId:String(line.id),reason:'Périodes, crédit ou intervention après acceptation ; aucune tâche 8A'});continue;}
      const commercialSnapshot=JSON.parse(String(line.snapshot_json||'{}'));
      if(commercialSnapshot.commercialRules?.attachment?.kind==='priority') {plan.excluded.push({code:m.code,lineId:String(line.id),reason:'Supplément de priorité : travail porté par la prestation principale, zéro action autonome'});continue;}
      const qty=Number(line.quantity_milli),units=qty/1000;
      if (!Number.isSafeInteger(qty) || !Number.isInteger(units) || units<1 || units>500) throw Error('Quantité opérationnelle entière requise ; aucun arrondi automatique.');
      const instanceKey=(base:string):string=>{
        let key=base;
        for(let i=0;i<500;i++) {
          const old=projectId?this.db.get<Row>("SELECT a.project_node_id,e.state FROM project_action_instances a LEFT JOIN project_scope_entities e ON e.entity_id=a.project_node_id AND e.entity_kind='node' AND e.project_id=a.project_id WHERE a.project_id=? AND a.source_key=?",[projectId,key]):null;
          if (!old || !['archived','detached'].includes(String(old.state))) return key;
          key=operationalHash([key,'replacement_after_explicit_decision',old.project_node_id]);
        }
        throw Error('Trop de réinstanciations opérationnelles.');
      };
      // One source plan per sold commercial unit. Packs already include their internal quantities.
      for (let unit=1;unit<=units;unit++) {
        const common={code:m.code,modelVersionId:String(v.id),modelVersion:Number(v.version_number),catalogVersionId:String(line.catalog_version_id),
          quoteLineId:String(line.id),lineOrigin:origin,optionPurchase:this.db.get<Row>('SELECT * FROM quote_option_purchases WHERE line_id=?',[String(line.id)]) ?? null,
          quantityMilli:qty,unitIndex:unit,estimateRequired:m.estimateRequired};
        for (const phase of [...new Set(m.actions.map(a=>a.phase))]) plan.actions.push({...common,key:instanceKey(operationalHash([origin,line.catalog_version_id,unit,'phase',phase])),unitMinutes:0,referenceMinutes:null,action:null,phase});
        for (const a of m.actions) plan.actions.push({...common,key:instanceKey(operationalHash([origin,line.catalog_version_id,unit,a.key])),unitMinutes:a.minutes,referenceMinutes:a.minutes,action:a,phase:a.phase,...(configuration?{targetPolicy:configuration,targetRequirement:configuration.actionRequirements[a.key]}:{})});
      }
    }
    if (plan.actions.length>10000) throw Error('Plan opérationnel trop volumineux.');
    return plan;
  }

  checkBlueprint(plan: OperationalPlan, blueprint: SoldBlueprintPlan | null): void {
    for(const l of plan.links) {
      const p=l.configuration;if(!p)continue;
      const matching=blueprint?.contributions.filter(c=>c.lineOrigin===l.lineOrigin&&c.catalogVersionId===l.catalogVersionId)??[];
      if(p.blueprintRequired && (matching.length!==1||matching[0].templateVersionId!==l.blueprintVersionId))throw Error('Obligation structurelle non satisfaite par origine commerciale.');
      if(['C','D'].includes(p.structureClass)&&matching.length)throw Error('C/D : aucune structure automatique autorisée.');
      if(matching.some(c=>c.unitCount!==(p.quantity.structureMode==='per_unit'?c.quantityMilli/1000:1)))throw Error('Quantités actions/structure incohérentes.');
    }
    if (!blueprint) {
      if (plan.links.some(l=>l.blueprintVersionId)) throw Error('Blueprint structurel requis : préparation incomplète.');
      return;
    }
    for (const c of blueprint.contributions) {
      const link=plan.links.find(l=>l.catalogVersionId===c.catalogVersionId&&(!c.lineOrigin||l.lineOrigin===c.lineOrigin));
      const profile=this.db.get<Row>('SELECT * FROM blueprint_operational_profiles WHERE template_version_id=?',[c.templateVersionId]);
      if (profile?.mode==='structural' && (!link || link.blueprintVersionId!==c.templateVersionId)) throw Error('Blueprint structurel sans modèle opérationnel compatible : préparation bloquée.');
      if (!link) continue;
      if (link.blueprintVersionId!==c.templateVersionId || profile?.mode!=='structural' || c.nodes.some(n=>['task','checklist'].includes(n.node_type)))
        throw Error('Ancien blueprint avec tâches + modèle opérationnel : préparation bloquée.');
    }
  }

  apply(projectId: string, plan: OperationalPlan, retire: (id:string)=>void): void {
    if(plan.mode==='staging')throw Error('Un plan staging ne peut pas créer des actions Projet.');
    for(const l of plan.links) {
      const active=l.linkId?this.db.get<Row>(`SELECT a.id FROM catalog_operational_links a
        JOIN operational_model_versions m ON m.id=a.model_version_id
        WHERE a.id=? AND a.status='ready' AND m.status='ready'
        AND (a.blueprint_version_id IS NULL OR EXISTS(SELECT 1 FROM blueprint_operational_profiles b
          WHERE b.template_version_id=a.blueprint_version_id AND b.operational_ready=1))`,[l.linkId]):null;
      if(!active)throw Error('Association opérationnelle non mise en usage.');
    }
    const existing=this.db.all<Row>('SELECT a.*,n.parent_id FROM project_action_instances a JOIN project_nodes n ON n.id=a.project_node_id WHERE a.project_id=?',[projectId]);
    const wanted=new Set(plan.actions.map(a=>a.key));
    const obsolete=existing.filter(e=>!wanted.has(String(e.source_key)));
    // Children first; managed metadata alone is not evidence of human work.
    for (const e of obsolete.filter(e=>JSON.parse(String(e.initial_snapshot_json)).action)) retire(String(e.project_node_id));
    for (const e of obsolete.filter(e=>!JSON.parse(String(e.initial_snapshot_json)).action)) retire(String(e.project_node_id));
    for (const s of plan.actions) {
      if (this.db.get('SELECT project_node_id FROM project_action_instances WHERE project_id=? AND source_key=?',[projectId,s.key])) continue;
      let parent: string | null=null;
      if (s.action) {
        const phase=plan.actions.find(p=>!p.action && p.lineOrigin===s.lineOrigin && p.catalogVersionId===s.catalogVersionId && p.unitIndex===s.unitIndex && p.phase===s.phase)!;
        parent=String(this.db.get<Row>('SELECT project_node_id FROM project_action_instances WHERE project_id=? AND source_key=?',[projectId,phase.key])!.project_node_id);
      }
      const id=randomUUID(),now=new Date().toISOString();
      this.db.run(`INSERT INTO project_nodes(id,project_id,parent_id,node_type,name,sort_order,estimated_minutes,is_required,status,time_category,business_category,semantic_key,work_card_json,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[id,projectId,parent,s.action?'task':'lot',s.action?.name ?? s.phase,plan.actions.indexOf(s)*10,
        s.action&&!s.estimateRequired?s.referenceMinutes:null,s.action?.required?1:0,'todo',null,s.action?.category ?? null,'operational.'+s.key,
        s.action?JSON.stringify({goal:s.action.checklist,fields:[{key:'operational_checklist',label:'Checklist / périmètre',type:'textarea',value:s.action.checklist}]}):null,now,now]);
      this.db.run('INSERT INTO project_action_instances(project_id,source_key,project_node_id,initial_snapshot_json) VALUES(?,?,?,?)',[projectId,s.key,id,JSON.stringify(s)]);
    }
  }

  info(nodeId: string): OperationalNodeInfo | undefined {
    const row=this.db.get<Row>('SELECT a.initial_snapshot_json,n.business_category FROM project_action_instances a JOIN project_nodes n ON n.id=a.project_node_id WHERE a.project_node_id=?',[nodeId]);
    if (!row) return;
    const snapshot=JSON.parse(String(row.initial_snapshot_json)) as OperationalActionSnapshot;
    let targetState:OperationalNodeInfo['targetState'],targetIssue:string|null=null;
    if(snapshot.targetRequirement&&snapshot.targetRequirement.target!=='none')try{new ProjectContributionTargetService(this.db).assertAction(nodeId);targetState='active';}catch(e){targetState='pending';targetIssue=e instanceof Error?e.message:String(e);}
    return {...snapshot,targetState,targetIssue,businessCategory:row.business_category as OperationalNodeInfo['businessCategory'],actualSeconds:0};
  }
}

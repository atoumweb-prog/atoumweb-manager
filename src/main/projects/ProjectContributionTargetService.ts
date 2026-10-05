import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {OperationalPlan, OperationalActionSnapshot} from '../../shared/operational';
import type {ContributionTargetInput, ContributionTargetView, PlannedContributionTarget, ContributionTargetChoices} from '../../shared/contributionTargets';
import type {SoldBlueprintPlan} from './ProjectBlueprintCompositionService';
import {readStructure} from './ContributionPolicy';

type Row=Record<string,unknown>;
const fail=(ok:unknown,message:string):void=>{if(!ok)throw Error(message);};
export class ProjectContributionTargetService {
  constructor(private readonly db: DatabaseAdapter) {}
  private current(projectId:string): {operations:OperationalPlan; blueprint:SoldBlueprintPlan} | null {
    const r=this.db.get<Row>('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[projectId]);
    if(!r) return null;
    const p=JSON.parse(String(r.plan_json));return {operations:p.operations,blueprint:p};
  }
  private bases(blueprint:SoldBlueprintPlan|null) {
    return (blueprint?.bases??[]).flatMap(c=>(c.structureContract?.sites??[]).map(s=>({origin:c.lineOrigin!,slot:s.slotKey,provides:s.provides,key:c.key})));
  }
  plan(projectId:string|null,operations:OperationalPlan,blueprint:SoldBlueprintPlan|null): PlannedContributionTarget[] {
    const result:PlannedContributionTarget[]=[],bases=this.bases(blueprint);
    for(const l of operations.links) {
      const p=l.configuration;if(!p)continue;
      const actions=operations.actions.filter(a=>a.lineOrigin===l.lineOrigin);
      const units=Math.max(...actions.map(a=>a.unitIndex),1);
      for(let unit=1;unit<=units;unit++) for(const slot of p.destinationSlots) {
        const old=projectId?this.db.get<Row>('SELECT * FROM project_contribution_targets WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=?',[projectId,l.lineOrigin!,slot.key,unit]):null;
        const t:PlannedContributionTarget={lineOrigin:l.lineOrigin!,slot:slot.key,unitIndex:unit,kind:slot.kind,state:'pending',selectionMode:'pending',siteOwnerOrigin:null,siteOwnerSlot:null,siteId:null,pageNodeId:null,contextNodeId:null};
        if(p.structureClass==='A'&&old?.state==='pending'&&old.site_owner_origin_id===l.lineOrigin) Object.assign(t,{state:'active',selectionMode:'explicit',siteOwnerOrigin:l.lineOrigin,siteOwnerSlot:old.site_owner_slot_key});
        else if(old?.selection_mode==='explicit'&&old.state==='active') Object.assign(t,this.fromRow(old));
        else if(slot.autoSite==='unique_compatible') {
          const candidates=bases.filter(b=>!result.some(t=>t.lineOrigin===b.origin&&t.kind==='site'&&t.state==='pending')&&p.requires.every(r=>b.provides.includes(r)) && (p.structureClass==='A'?b.origin===l.lineOrigin:b.origin!==l.lineOrigin));
          if(candidates.length===1) Object.assign(t,{state:'active',selectionMode:'auto_unique',siteOwnerOrigin:candidates[0].origin,siteOwnerSlot:candidates[0].slot});
          else if(old?.state==='active'&&projectId&&this.used(projectId,t.lineOrigin,t.unitIndex,t.slot)) throw Error('Destination devenue ambiguë : confirmer explicitement la cible utilisée, sans réaffectation silencieuse.');
        }
        if(t.state==='active') this.validate(projectId,t,p.requires,blueprint);
        result.push(t);
      }
    }
    this.checkLimits(operations,result,projectId,blueprint);
    return result;
  }
  private checkLimits(operations:OperationalPlan,targets:PlannedContributionTarget[],projectId:string|null=null,blueprint:SoldBlueprintPlan|null=null):void {
    const counts=new Set<string>();
    for(const l of operations.links) if(l.configuration?.targetLimit) {
      const t=targets.find(t=>t.lineOrigin===l.lineOrigin&&t.kind==='site'&&t.state==='active');if(!t)continue;
      const produced=targets.find(b=>b.lineOrigin===t.siteOwnerOrigin&&b.slot===t.siteOwnerSlot&&b.kind==='site');
      const physical=t.siteId??produced?.siteId??(projectId&&blueprint&&t.siteOwnerOrigin?this.boundSite(projectId,t.siteOwnerOrigin,t.siteOwnerSlot!,blueprint):null);
      const key=JSON.stringify([l.configuration.targetLimit.key,physical??[t.siteOwnerOrigin,t.siteOwnerSlot]]);
      fail(!counts.has(key),'Blog maximum 1 par Site cible en V1.');counts.add(key);
    }
  }
  private fromRow(r:Row):Pick<PlannedContributionTarget,'siteOwnerOrigin'|'siteOwnerSlot'|'siteId'|'pageNodeId'|'contextNodeId'|'state'|'selectionMode'> {
    return {siteOwnerOrigin:r.site_owner_origin_id as string|null,siteOwnerSlot:r.site_owner_slot_key as string|null,
      siteId:r.target_site_id as string|null,pageNodeId:r.target_page_node_id as string|null,contextNodeId:r.target_context_node_id as string|null,state:'active',selectionMode:r.selection_mode as 'explicit'|'auto_unique'};
  }
  private boundSite(projectId:string,origin:string,slot:string,blueprint:SoldBlueprintPlan):string|null {
    const base=blueprint.bases?.find(c=>c.lineOrigin===origin);if(!base)return null;
    return this.db.get<{project_site_id:string}>(`SELECT project_site_id FROM project_prepared_site_bindings WHERE project_id=? AND contribution_key=? AND unit_index=1 AND site_key=?
      UNION SELECT project_site_id FROM project_composed_site_bindings WHERE project_id=? AND contribution_key=? AND unit_index=1 AND site_key=?`,[projectId,base.key,slot,projectId,base.key,slot])?.project_site_id??null;
  }
  private validate(projectId:string|null,t:PlannedContributionTarget,requires:string[],blueprint:SoldBlueprintPlan|null):string[] {
    let capabilities:string[]=[];
    if(t.siteOwnerOrigin) {
      const b=this.bases(blueprint).find(b=>b.origin===t.siteOwnerOrigin&&b.slot===t.siteOwnerSlot);
      fail(b,'Occurrence de base absente du périmètre courant.');capabilities=b!.provides;
      if(projectId && t.siteId) fail(this.boundSite(projectId,t.siteOwnerOrigin,t.siteOwnerSlot!,blueprint!)===t.siteId,'Site différent de l’occurrence configurée.');
    }
    // A manual/historical Site provides no capability, regardless of its name or URL.
    fail(requires.every(r=>capabilities.includes(r)),'Capacités requises non fournies explicitement : '+requires.join(', '));
    if(projectId && t.siteId) fail(this.db.get('SELECT id FROM project_sites WHERE id=? AND project_id=? AND archived_at IS NULL',[t.siteId,projectId]),'Site cible absent, archivé ou d’un autre Projet.');
    if(t.kind==='page') fail(projectId&&t.pageNodeId&&t.siteId&&this.db.get(`SELECT n.id FROM project_nodes n JOIN project_site_pages p ON p.project_node_id=n.id WHERE n.id=? AND n.project_id=? AND n.node_type='module' AND n.display_subtype='page' AND n.archived_at IS NULL AND p.project_site_id=?`,[t.pageNodeId,projectId,t.siteId]),'Page parente explicite et rattachée au Site cible requise.');
    if(t.kind==='context') fail(projectId&&t.contextNodeId&&this.db.get('SELECT id FROM project_nodes WHERE id=? AND project_id=? AND archived_at IS NULL',[t.contextNodeId,projectId]),'Contexte Projet explicite requis.');
    return capabilities;
  }
  retireObsolete(projectId:string,targets:PlannedContributionTarget[]):void {
    const now=new Date().toISOString(),wanted=new Set(targets.map(t=>JSON.stringify([t.lineOrigin,t.slot,t.unitIndex])));
    for(const old of this.db.all<Row>('SELECT * FROM project_contribution_targets WHERE project_id=?',[projectId])) {
      if(wanted.has(JSON.stringify([old.line_origin_id,old.target_slot_key,old.unit_index])))continue;
      if(this.used(projectId,String(old.line_origin_id),Number(old.unit_index),String(old.target_slot_key))) {
        if(old.state!=='out_of_scope')this.db.run("UPDATE project_contribution_targets SET state='out_of_scope',updated_at=? WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=?",[now,projectId,String(old.line_origin_id),String(old.target_slot_key),Number(old.unit_index)]);
      } else this.db.run('DELETE FROM project_contribution_targets WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=?',[projectId,String(old.line_origin_id),String(old.target_slot_key),Number(old.unit_index)]);
    }
  }
  synchronize(projectId:string,revisionId:string,operations:OperationalPlan,blueprint:SoldBlueprintPlan|null,targets:PlannedContributionTarget[]):void {
    if(operations.mode==='staging'||blueprint?.mode==='staging')throw Error('Un plan staging ne peut pas créer de cibles Projet.');
    const now=new Date().toISOString();
    for(const t of targets) {
      const site=t.siteId??(t.siteOwnerOrigin&&blueprint?this.boundSite(projectId,t.siteOwnerOrigin,t.siteOwnerSlot!,blueprint):null);
      fail(t.state!=='active'||t.kind!=='site'||site,'Occurrence Site configurée non produite.');
      this.db.run(`INSERT INTO project_contribution_targets(project_id,line_origin_id,target_slot_key,unit_index,target_kind,site_owner_origin_id,site_owner_slot_key,target_site_id,target_page_node_id,target_context_node_id,selection_mode,state,last_scope_revision_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(project_id,line_origin_id,target_slot_key,unit_index) DO UPDATE SET
        site_owner_origin_id=excluded.site_owner_origin_id,site_owner_slot_key=excluded.site_owner_slot_key,target_site_id=excluded.target_site_id,target_page_node_id=excluded.target_page_node_id,target_context_node_id=excluded.target_context_node_id,selection_mode=excluded.selection_mode,state=excluded.state,last_scope_revision_id=excluded.last_scope_revision_id,updated_at=excluded.updated_at`,
        [projectId,t.lineOrigin,t.slot,t.unitIndex,t.kind,t.siteOwnerOrigin,t.siteOwnerSlot,site,t.pageNodeId,t.contextNodeId,t.selectionMode,t.state,revisionId,now,now]);
    }
  }
  used(projectId:string,origin:string,unit?:number,slot?:string):boolean {
    const actions=this.db.all<Row>('SELECT a.initial_snapshot_json,n.id,n.status FROM project_action_instances a JOIN project_nodes n ON n.id=a.project_node_id WHERE a.project_id=?',[projectId]);
    for(const a of actions) {
      const s=JSON.parse(String(a.initial_snapshot_json)) as OperationalActionSnapshot;
      if(s.lineOrigin===origin&&(unit===undefined||s.unitIndex===unit)&&s.targetRequirement&&s.targetRequirement.target!=='none'&&(!slot||s.targetRequirement.slot===slot)&&(a.status!=='todo'||this.db.get('SELECT id FROM time_sessions WHERE project_node_id=?',[String(a.id)]))) return true;
    }
    const p=this.current(projectId)?.blueprint;
    for(const c of p?.contributions??[]) if(c.lineOrigin===origin&&this.db.get('SELECT project_node_id FROM project_prepared_node_bindings WHERE project_id=? AND contribution_key=?'+(unit===undefined?'':' AND unit_index=?'),unit===undefined?[projectId,c.key]:[projectId,c.key,unit]))return true;
    return false;
  }
  assign(projectId:string,input:ContributionTargetInput):void {
    fail(typeof input.author==='string'&&input.author.trim(),'Auteur de la décision opérationnelle requis.');
    this.db.exec('SAVEPOINT contribution_target_choice');
    try {
      const current=this.current(projectId),state=this.db.get<Row>('SELECT commercial_state FROM projects WHERE id=?',[projectId])?.commercial_state;
      fail(current&&['provisional','frozen'].includes(String(state)),'Aucune affectation historique implicite.');
      const link=current!.operations.links.find(l=>l.lineOrigin===input.lineOrigin),p=link?.configuration;
      const slot=p?.destinationSlots.find(s=>s.key===input.slot);fail(slot,'Slot absent de la politique figée.');
      const old=this.db.get<Row>('SELECT * FROM project_contribution_targets WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=?',[projectId,input.lineOrigin,input.slot,input.unitIndex]);fail(old&&old.state!=='out_of_scope','Destination hors périmètre.');
      if(state==='frozen') fail(p!.structureClass==='D'&&old!.state==='pending','Après acceptation : seule première affectation D pending autorisée, sinon nouveau parcours commercial.');
      const t:PlannedContributionTarget={lineOrigin:input.lineOrigin,slot:input.slot,unitIndex:input.unitIndex,kind:slot!.kind,state:'active',selectionMode:'explicit',
        siteOwnerOrigin:input.siteOwnerOrigin??null,siteOwnerSlot:input.siteOwnerSlot??null,siteId:input.siteId??null,pageNodeId:input.pageNodeId??null,contextNodeId:input.contextNodeId??null};
      fail(input.createSite || (t.kind==='site'&&t.siteId&&!t.pageNodeId&&!t.contextNodeId)||(t.kind==='page'&&t.siteId&&t.pageNodeId&&!t.contextNodeId)||(t.kind==='context'&&t.contextNodeId&&!t.siteId&&!t.pageNodeId),'Choix cible invalide.');
      if(input.createSite) {
        fail(state==='provisional'&&p!.structureClass==='A'&&old!.state==='pending'&&slot!.kind==='site','Création Site limitée à une base en préparation.');
        const c=current!.blueprint.bases?.find(c=>c.lineOrigin===input.lineOrigin),site=c?.structureContract?.sites.find(s=>s.slotKey===input.slot);
        fail(site?.modes.includes('create'),'Création Site non autorisée par cette version.');
        const now=new Date().toISOString();
        this.db.run('UPDATE project_contribution_targets SET site_owner_origin_id=?,site_owner_slot_key=?,updated_at=? WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=?',[input.lineOrigin,input.slot,now,projectId,input.lineOrigin,input.slot,input.unitIndex]);
        this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES(?,?,?,?,?,?)',['project',projectId,'contribution_target_assigned','Création Site explicitement choisie',JSON.stringify({author:input.author.trim(),date:now,old,new:{siteOwnerOrigin:input.lineOrigin,siteOwnerSlot:input.slot},commercialOrigin:input.lineOrigin,linkId:link!.linkId,policy:p,decisionKind:'provisional_create_site'}),now]);
        this.db.exec('RELEASE contribution_target_choice');return;
      }
      const same=['siteOwnerOrigin','siteOwnerSlot','siteId','pageNodeId','contextNodeId'].every(k=>(this.fromRow(old!) as Row)[k]===(t as unknown as Row)[k]);
      fail(same||!this.used(projectId,input.lineOrigin,input.unitIndex,input.slot),'Cible déjà utilisée : aucune réaffectation silencieuse, nouveau parcours commercial requis si périmètre modifié.');
      const capabilities=this.validate(projectId,t,p!.requires,current!.blueprint);
      const targets=this.views(projectId).filter(v=>v.state!=='out_of_scope').map(v=>({lineOrigin:v.lineOrigin,slot:v.slot,unitIndex:v.unitIndex,kind:v.kind,state:v.state as 'pending'|'active',selectionMode:v.selectionMode,siteOwnerOrigin:v.siteOwnerOrigin,siteOwnerSlot:v.siteOwnerSlot,siteId:v.siteId,pageNodeId:v.pageNodeId,contextNodeId:v.contextNodeId})).filter(x=>!(x.lineOrigin===t.lineOrigin&&x.slot===t.slot&&x.unitIndex===t.unitIndex));targets.push(t);this.checkLimits(current!.operations,targets,projectId,current!.blueprint);
      const now=new Date().toISOString();
      this.db.run(`UPDATE project_contribution_targets SET site_owner_origin_id=?,site_owner_slot_key=?,target_site_id=?,target_page_node_id=?,target_context_node_id=?,selection_mode='explicit',state='active',updated_at=? WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=?`,[t.siteOwnerOrigin,t.siteOwnerSlot,t.siteId,t.pageNodeId,t.contextNodeId,now,projectId,t.lineOrigin,t.slot,t.unitIndex]);
      this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES(?,?,?,?,?,?)',['project',projectId,'contribution_target_assigned','Cible opérationnelle explicitement affectée',JSON.stringify({author:input.author.trim(),date:now,old,new:t,capabilities,commercialOrigin:t.lineOrigin,linkId:link!.linkId,policy:p,decisionKind:state==='frozen'?'first_operational_assignment':'provisional_assignment'}),now]);
      this.db.exec('RELEASE contribution_target_choice');
    }catch(e){this.db.exec('ROLLBACK TO contribution_target_choice; RELEASE contribution_target_choice');throw e;}
  }
  assertAction(nodeId:string):void {
    const row=this.db.get<Row>('SELECT project_id,initial_snapshot_json FROM project_action_instances WHERE project_node_id=?',[nodeId]);if(!row)return;
    const s=JSON.parse(String(row.initial_snapshot_json)) as OperationalActionSnapshot,r=s.targetRequirement;
    if(s.targetPolicy?.structureClass==='A')for(const slot of s.targetPolicy.destinationSlots) {
      const base=this.db.get<Row>("SELECT * FROM project_contribution_targets WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=? AND state='active'",[String(row.project_id),s.lineOrigin,slot.key,s.unitIndex]);
      fail(base,'Obligation structurelle A : cible Site requise avant utilisation opérationnelle.');
      this.validate(String(row.project_id),{lineOrigin:s.lineOrigin,slot:slot.key,unitIndex:s.unitIndex,kind:slot.kind,...this.fromRow(base!)},s.targetPolicy.requires,this.current(String(row.project_id))?.blueprint??null);
    }
    if(!r||r.target==='none')return;
    const target=this.db.get<Row>("SELECT * FROM project_contribution_targets WHERE project_id=? AND line_origin_id=? AND target_slot_key=? AND unit_index=? AND state='active'",[String(row.project_id),s.lineOrigin,r.slot!,s.unitIndex]);
    fail(target,'Action d’intégration bloquée : cible '+r.target+' requise.');
    const t:PlannedContributionTarget={lineOrigin:s.lineOrigin,slot:r.slot!,unitIndex:s.unitIndex,kind:r.target,...this.fromRow(target!)};
    this.validate(String(row.project_id),t,s.targetPolicy!.requires,this.current(String(row.project_id))?.blueprint??null);
  }
  assertAcceptance(projectId:string):void {
    const current=this.current(projectId);if(!current)return;
    for(const l of current.operations.links) for(const s of l.configuration?.destinationSlots??[]) if(l.configuration?.structureClass!=='D'&&s.requiredAt==='preparation') {
      const rows=this.db.all<Row>('SELECT * FROM project_contribution_targets WHERE project_id=? AND line_origin_id=? AND target_slot_key=?',[projectId,l.lineOrigin!,s.key]);
      fail(rows.length&&rows.every(r=>r.state==='active'),'Préparation incomplète : destination obligatoire avant acceptation.');
      for(const row of rows) this.validate(projectId,{lineOrigin:l.lineOrigin!,slot:s.key,unitIndex:Number(row.unit_index),kind:s.kind,...this.fromRow(row)},l.configuration!.requires,current.blueprint);
    }
  }
  choices(projectId:string):ContributionTargetChoices {
    const p=this.current(projectId)?.blueprint,sites:ContributionTargetChoices['sites']=[];
    for(const b of this.bases(p??null)) {
      const id=this.boundSite(projectId,b.origin,b.slot,p!);
      if(id) {const row=this.db.get<Row>('SELECT name FROM project_sites WHERE id=? AND archived_at IS NULL',[id]);if(row)sites.push({id,label:String(row.name),ownerOrigin:b.origin,ownerSlot:b.slot,provides:b.provides});}
    }
    for(const r of this.db.all<Row>('SELECT id,name FROM project_sites WHERE project_id=? AND archived_at IS NULL ORDER BY created_at,id',[projectId]))if(!sites.some(s=>s.id===r.id))sites.push({id:String(r.id),label:String(r.name),ownerOrigin:null,ownerSlot:null,provides:[]});
    return {sites,pages:this.db.all<Row>(`SELECT n.id,n.name,p.project_site_id FROM project_nodes n JOIN project_site_pages p ON p.project_node_id=n.id WHERE n.project_id=? AND n.archived_at IS NULL`,[projectId]).map(r=>({id:String(r.id),siteId:String(r.project_site_id),label:String(r.name)})),contexts:this.db.all<Row>('SELECT id,name FROM project_nodes WHERE project_id=? AND archived_at IS NULL',[projectId]).map(r=>({id:String(r.id),label:String(r.name)}))};
  }
  views(projectId:string):ContributionTargetView[] {
    const current=this.current(projectId);if(!current)return[];
    return this.db.all<Row>('SELECT * FROM project_contribution_targets WHERE project_id=? ORDER BY line_origin_id,target_slot_key,unit_index',[projectId]).map(r=>{
      const link=current.operations.links.find(l=>l.lineOrigin===r.line_origin_id),policy=link?.configuration;
      const a=current.operations.actions.find(a=>a.lineOrigin===r.line_origin_id);
      let issue=r.state==='pending'?'Cible à choisir explicitement':r.state==='out_of_scope'?'Hors périmètre — historique conservé':null;
      if(!issue&&policy)try{this.validate(projectId,{lineOrigin:String(r.line_origin_id),slot:String(r.target_slot_key),unitIndex:Number(r.unit_index),kind:r.target_kind as PlannedContributionTarget['kind'],...this.fromRow(r)},policy.requires,current.blueprint);}catch(e){issue=String(e);}
      return {allowsCreateSite:policy?.structureClass==='A'&&r.state==='pending',lineOrigin:String(r.line_origin_id),code:a?.code??'Contribution historique',slot:String(r.target_slot_key),unitIndex:Number(r.unit_index),kind:r.target_kind as ContributionTargetView['kind'],state:r.state as ContributionTargetView['state'],selectionMode:r.selection_mode as ContributionTargetView['selectionMode'],siteId:r.target_site_id as string|null,pageNodeId:r.target_page_node_id as string|null,contextNodeId:r.target_context_node_id as string|null,siteOwnerOrigin:r.site_owner_origin_id as string|null,siteOwnerSlot:r.site_owner_slot_key as string|null,requires:policy?.requires??[],issue,locked:this.used(projectId,String(r.line_origin_id),Number(r.unit_index),String(r.target_slot_key))};
    });
  }
}

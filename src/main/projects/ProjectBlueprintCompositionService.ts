import {readStructure} from './ContributionPolicy';
import type {ContributionPolicy, StructureContract, PlannedContributionTarget} from '../../shared/contributionTargets';
import type {OperationalPlan} from '../../shared/operational';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ProjectSiteService } from './ProjectSiteService';
import type { ProjectBlueprintGenerationResult, ProjectSitePageRole, ProjectBlueprintNodeSource } from '../../shared/projects';

type Row = Record<string, unknown>;
interface Node extends Row {
  id: string; parent_id: string | null; node_type: string; display_subtype: string | null;
  semantic_key: string | null; name: string; description: string | null; sort_order: number;
  estimated_minutes: number | null; is_required: number; initial_status: string; time_category: string | null;
  work_card_json: string | null; advice_json: string | null;
}
interface Site extends Row { id: string; blueprint_key: string; name: string; desired_domain: string | null }
interface Page extends Row { template_site_id: string; template_node_id: string; role: ProjectSitePageRole; desired_path: string | null }
interface Link extends Row {
  id: string; template_version_id: string; role: 'base' | 'addon';
  quantity_mode: 'once' | 'per_unit'; site_mode: 'create' | 'extend_base';
}
export interface SoldBlueprintContribution {
  key: string; label: string; linkId: string | null; templateVersionId: string; role: 'base' | 'addon';
  sourceRole: 'direct' | 'offer_component' | 'manual';
  quoteLineId: string | null; catalogVersionId: string | null; componentId: string | null;
  optionPurchase: Row | null; quantityMilli: number; unitCount: number;
  quantityMode: 'once' | 'per_unit'; siteMode: 'create' | 'extend_base';
  nodes: Node[]; sites: Site[]; pages: Page[];
  lineOrigin?: string; configuration?: ContributionPolicy; structureContract?: StructureContract;
}
interface Prerequisite { key: string; label: string; quoteLineId: string | null; catalogVersionId: string | null; componentId: string | null }
export interface SoldBlueprintPlan {
  schemaVersion: 1 | 2; bases?: SoldBlueprintContribution[]; destinations?: PlannedContributionTarget[]; quoteId: string; base: SoldBlueprintContribution;
  contributions: SoldBlueprintContribution[]; prerequisites: Prerequisite[];
  explicitlyReplacedBases: SoldBlueprintContribution[];
}
const hash = (v: unknown): string => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const object = (v: unknown): Row | null => v && typeof v === 'object' && !Array.isArray(v) ? v as Row : null;
const parse = (v: unknown): Row | null => { try { return object(JSON.parse(String(v))); } catch { return null; } };
const fail = (ok: unknown, message: string): void => { if (!ok) throw new Error(message); };

/** Uses existing base/addon links; freezes sold contributions, never derives them from project names. */
export class ProjectBlueprintCompositionService {
  private readonly provenancePlans = new Map<string,SoldBlueprintPlan>();
  constructor(private readonly db: DatabaseAdapter, private readonly sites: ProjectSiteService) {}

  resolveQuote(quoteId: string, explicitVersionId?: string | null, lineOrigins?: Map<string,string>, operations?: OperationalPlan): SoldBlueprintPlan {
    const lines = this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at,id', [quoteId]);
    const contributions: SoldBlueprintContribution[] = [], prerequisites = this.prerequisitesForQuote(quoteId,lineOrigins);
    const add = (line: Row, version: string, quantity: number, componentId: string | null, sourceRole: 'direct' | 'offer_component') => {
      const links = this.db.all<Link>('SELECT * FROM catalog_project_blueprints WHERE catalog_version_id=? ORDER BY sort_order,id', [version]);
      for (const link of links) {
        fail(Number.isSafeInteger(quantity) && quantity > 0, 'Quantité de contribution invalide.');
        const units = link.quantity_mode === 'per_unit' ? quantity / 1000 : 1;
        fail(Number.isInteger(units) && units >= 1 && units <= 500, 'Un blueprint par unité exige une quantité entière entre 1 et 500.');
        const identity = [lineOrigins?.get(String(line.id)) ?? String(line.id), componentId, version, link.id];
        const key = hash(lineOrigins ? [...identity,link.template_version_id,link.quantity_mode,link.site_mode] : identity);
        if (contributions.some(c => c.key === key)) continue;
        const purchase = componentId === null ? this.db.get<Row>('SELECT * FROM quote_option_purchases WHERE line_id=?', [String(line.id)]) ?? null : null;
        contributions.push(this.definition({key,label:String(line.label),linkId:link.id,templateVersionId:link.template_version_id,role:link.role,
          sourceRole,quoteLineId:String(line.id),catalogVersionId:version,componentId,optionPurchase:purchase,
          quantityMilli:quantity,unitCount:units,quantityMode:link.quantity_mode,siteMode:link.site_mode}));
      }
    };
    for (const line of lines) {
      const snapshot = parse(line.snapshot_json);
      const version = typeof line.catalog_version_id === 'string' ? line.catalog_version_id : null;
      if (version) add(line, version, Number(line.quantity_milli), null, 'direct');
      const components = snapshot?.offerComponents;
      if (!Array.isArray(components)) continue;
      for (const raw of components) {
        const component = object(raw);
        // Availability never produces a contribution or prerequisite; an option purchase has its own line.
        if (!component || component.isOptional !== false || typeof component.serviceVersionId !== 'string') continue;
        const componentId = typeof component.componentId === 'string' ? component.componentId : null;
        add(line, component.serviceVersionId,
          Number(line.quantity_milli) * Number(component.quantityMilli ?? 1000) / 1000, componentId, 'offer_component');
      }
    }
    const configured=Boolean(operations?.links.some(l=>l.configuration));
    if(configured) for(const c of contributions) {
      c.lineOrigin=lineOrigins?.get(c.quoteLineId!)??c.quoteLineId!;
      const l=operations?.links.find(l=>l.lineOrigin===c.lineOrigin&&l.catalogVersionId===c.catalogVersionId);
      fail(c.sourceRole==='direct' && l?.configuration,'Composition v2 : association explicite par origine commerciale requise, aucun composant historique implicite.');
      c.configuration=l!.configuration;c.structureContract=readStructure(this.db,c.templateVersionId);
      fail(c.configuration!.structuralRole===c.role,'Rôle structurel/catalogue incohérent.');
      fail(c.quantityMode===(c.configuration!.quantity.structureMode==='per_unit'?'per_unit':'once'),'Quantités actions/structure incohérentes.');
    }
    let bases = contributions.filter(c => c.role === 'base');
    const origins = new Set(bases.map(c => hash([c.quoteLineId,c.templateVersionId])));
    fail(configured || origins.size <= 1, 'Plusieurs blueprints de base concurrents : résoudre les lignes ou liens Catalogue avant conversion.');
    const explicitlyReplacedBases: SoldBlueprintContribution[] = [];
    fail(!configured || !explicitVersionId || bases.length===1&&bases[0].templateVersionId===explicitVersionId,'Plan v2 : substitution manuelle de la base non autorisée.');
    if (explicitVersionId && (!bases.length || bases[0].templateVersionId !== explicitVersionId)) {
      explicitlyReplacedBases.push(...bases);
      const sold = bases[0];
      const manual = this.definition({key:hash(['manual',explicitVersionId]),label:sold?.label ?? 'Modèle choisi explicitement',linkId:null,templateVersionId:explicitVersionId,role:'base',
        sourceRole:'manual',quoteLineId:sold?.quoteLineId ?? null,catalogVersionId:sold?.catalogVersionId ?? null,componentId:null,optionPurchase:null,
        quantityMilli:sold?.quantityMilli ?? 1000,unitCount:sold?.unitCount ?? 1,quantityMode:sold?.quantityMode ?? 'once',siteMode:'create'});
      contributions.unshift(manual); bases = [manual];
    }
    fail(bases.length || configured, 'Aucun blueprint de base n’est lié à ce devis. Choisis un modèle publié ou configure le lien Catalogue → Projet.');
    const base = bases[0] ?? contributions[0];
    fail(configured || bases.every(c => c.unitCount === base.unitCount && c.quantityMode === base.quantityMode), 'Dimensionnements de base contradictoires.');
    const ordered = [...bases,...contributions.filter(c => c.role === 'addon')];
    fail(ordered.reduce((n,c) => n+c.nodes.length*c.unitCount,0) <= 10000, 'Composition trop volumineuse ; réduire le périmètre.');
    for (const c of ordered) {
      fail(c.role !== 'base' || c.siteMode === 'create', 'La base doit déclarer ses propres Sites.');
      if (!configured && c.siteMode === 'extend_base') for (const site of c.sites) {
        fail(base.unitCount === 1 && base.sites.some(s => s.blueprint_key === site.blueprint_key),
          'Destination addon absente ou ambiguë : une clé Site de base explicite et unique est requise.');
      }
    }
    return {schemaVersion:configured?2:1,...(configured?{bases}:{}),quoteId,base,contributions:ordered,prerequisites,explicitlyReplacedBases};
  }

  hasSoldBlueprints(quoteId: string): boolean {
    return this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=?',[quoteId]).some(line=>{
      const versions=[line.catalog_version_id,...(parse(line.snapshot_json)?.offerComponents as Row[] ?? [])
        .filter(c=>c.isOptional===false).map(c=>c.serviceVersionId)];
      return versions.some(v=>typeof v==='string' && this.db.get('SELECT id FROM catalog_project_blueprints WHERE catalog_version_id=?',[v]));
    });
  }

  prerequisitesForQuote(quoteId: string, origins?: Map<string,string>): Prerequisite[] {
    const result: Prerequisite[]=[];
    const add=(value:unknown,line:string|null,version:string|null,component:string|null)=>{
      if (!Array.isArray(value)) return;
      for (const raw of value) if(typeof raw==='string' && raw.trim()) {
        const label=raw.trim(),key=hash([line?origins?.get(line)??line:null,version,component,label]);
        if(!result.some(p=>p.key===key)) result.push({key,label,quoteLineId:line,catalogVersionId:version,componentId:component});
      }
    };
    const q=this.db.get<Row>('SELECT prerequisites_text FROM quotes WHERE id=?',[quoteId]);
    add(String(q?.prerequisites_text??'').split(/\r?\n|;/),null,null,null);
    for(const l of this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at,id',[quoteId])) {
      const snap=parse(l.snapshot_json);add(snap?.prerequisites,String(l.id),l.catalog_version_id as string|null,null);
      if(Array.isArray(snap?.offerComponents)) for(const raw of snap.offerComponents) {
        const c=object(raw);if(c?.isOptional===false && typeof c.serviceVersionId==='string')
          add(c.prerequisites,String(l.id),c.serviceVersionId,typeof c.componentId==='string'?c.componentId:null);
      }
    }
    return result;
  }

  private definition(c: Omit<SoldBlueprintContribution,'nodes'|'sites'|'pages'>): SoldBlueprintContribution {
    const version = this.db.get<Row>('SELECT status FROM project_template_versions WHERE id=?', [c.templateVersionId]);
    fail(version?.status === 'published' || this.db.get("SELECT template_version_id FROM blueprint_operational_profiles WHERE template_version_id=? AND mode='structural' AND operational_ready=1",[c.templateVersionId]), 'Chaque blueprint de base/module lié au devis doit être publié.');
    return {...c,
      nodes:this.db.all<Node>('SELECT * FROM project_template_nodes WHERE template_version_id=? ORDER BY sort_order,created_at,id',[c.templateVersionId]),
      sites:this.db.all<Site>('SELECT * FROM project_template_sites WHERE template_version_id=? ORDER BY sort_order,created_at,id',[c.templateVersionId]),
      pages:this.db.all<Page>('SELECT p.* FROM project_template_site_pages p JOIN project_template_sites s ON s.id=p.template_site_id WHERE s.template_version_id=? ORDER BY p.sort_order,p.id',[c.templateVersionId])};
  }

  create(projectId: string, plan: SoldBlueprintPlan, now: string): void {
    // Called inside conversion's transaction; no legacy plan is synthesised.
    this.db.run('INSERT INTO project_blueprint_plans(project_id,source_quote_id,plan_json,plan_sha256,created_at) VALUES(?,?,?,?,?)',
      [projectId,plan.quoteId,JSON.stringify(plan),hash(plan),now]);
    this.apply(projectId, plan, now);
    const byLabel = new Map<string,string>();
    for (const p of plan.prerequisites) {
      let id = byLabel.get(p.label);
      if (!id) {
        id = randomUUID(); byLabel.set(p.label,id);
        this.db.run("INSERT INTO project_prerequisites(id,project_id,label,status,is_required,sort_order,created_at,updated_at) VALUES(?,?,?,'to_request',1,?,?,?)",
          [id,projectId,p.label,byLabel.size*10,now,now]);
      }
      this.db.run('INSERT INTO project_composed_prerequisite_sources(project_prerequisite_id,source_key,provenance_json) VALUES(?,?,?)',
        [id,p.key,JSON.stringify(p)]);
    }
  }

  replay(projectId: string, requestedVersion?: string | null, manageTransaction = true): ProjectBlueprintGenerationResult {
    const row = this.db.get<Row>('SELECT plan_json,plan_sha256 FROM project_blueprint_plans WHERE project_id=?',[projectId]);
    fail(row, 'Projet historique sans plan composé : aucune reconstruction automatique.');
    const plan = JSON.parse(String(row!.plan_json)) as SoldBlueprintPlan;
    fail(hash(plan) === row!.plan_sha256 && [1,2].includes(plan.schemaVersion), 'Plan composé corrompu.');
    fail(!requestedVersion || requestedVersion === plan.base.templateVersionId, 'Un projet composé rejoue uniquement son plan figé.');
    if (manageTransaction) this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = this.apply(projectId,plan,new Date().toISOString());
      if (manageTransaction) this.db.exec('COMMIT');
      return result;
    } catch (error) { if (manageTransaction) this.db.exec('ROLLBACK'); throw error; }
  }

  applyPrepared(projectId: string, plan: SoldBlueprintPlan, now: string): ProjectBlueprintGenerationResult {
    this.provenancePlans.delete(projectId);
    return this.apply(projectId, plan, now, true);
  }

  freezePrepared(projectId: string, plan: SoldBlueprintPlan, now: string): void {
    this.db.run('INSERT INTO project_blueprint_plans(project_id,source_quote_id,plan_json,plan_sha256,created_at) VALUES(?,?,?,?,?)',
      [projectId,plan.quoteId,JSON.stringify(plan),hash(plan),now]);
    // Transfer only the accepted plan's bindings. Out-of-scope/manual retained work stays outside its frozen provenance.
    for (const c of plan.contributions) {
      this.db.run(`INSERT INTO project_composed_node_bindings SELECT * FROM project_prepared_node_bindings
        WHERE project_id=? AND contribution_key=? AND unit_index<=?`,[projectId,c.key,c.unitCount]);
      this.db.run(`INSERT INTO project_composed_site_bindings SELECT * FROM project_prepared_site_bindings
        WHERE project_id=? AND contribution_key=? AND unit_index<=?`,[projectId,c.key,c.unitCount]);
    }
    this.provenancePlans.delete(projectId);
  }

  private apply(projectId: string, plan: SoldBlueprintPlan, now: string, prepared = false): ProjectBlueprintGenerationResult {
    const siteBindings = prepared ? 'project_prepared_site_bindings' : 'project_composed_site_bindings';
    const result: ProjectBlueprintGenerationResult = {projectId,...(plan.schemaVersion===2?{contributions:plan.contributions.map(c=>({lineOrigin:c.lineOrigin!,templateVersionId:c.templateVersionId,role:c.role,unitCount:c.unitCount}))}:{}),templateVersionId:plan.schemaVersion===2&&plan.bases?.length!==1?null:plan.base.templateVersionId,declaredSiteCount:0,
      createdSiteIds:[],linkedPageIds:[],preservedSiteIds:[],preservedPageIds:[]};
    const baseSites = new Map<string,string>();
    for (const c of plan.contributions) for (let unit = 1; unit <= c.unitCount; unit++) {
      const anchors = new Set((plan.schemaVersion===2?[]:plan.base.nodes).filter(n => n.node_type === 'lot' || (n.node_type === 'module' && n.display_subtype !== 'page')).map(n => n.semantic_key));
      const target=plan.destinations?.find(t=>t.lineOrigin===c.lineOrigin&&t.unitIndex===unit&&t.state==='active');
      if(plan.schemaVersion===2&&!target&&(c.role==='addon'||c.configuration?.destinationSlots.some(s=>s.requiredAt==='preparation'))) continue;
      const ids = this.nodes(projectId,c,unit,now,anchors,prepared,plan.schemaVersion===2,target?.pageNodeId??null);
      for(const m of c.structureContract?.modules??[]) {
        const parent=plan.destinations?.find(t=>t.lineOrigin===c.lineOrigin&&t.unitIndex===unit&&t.slot===m.parentTargetSlot)?.pageNodeId;
        fail(parent,'Module sans Page parente explicitement identifiée.');
        const id=ids.get(m.templateNodeId)!;
        const previous=this.db.get<Row>('SELECT parent_id FROM project_nodes WHERE id=?',[id]);
        if(!previous?.parent_id) this.db.run('UPDATE project_nodes SET parent_id=? WHERE id=?',[parent!,id]);
        else fail(previous.parent_id===parent,'Page parente modifiée : décision explicite requise.');
      }
      for (const s of c.sites) {
        const binding = this.db.get<{project_site_id:string}>(`SELECT project_site_id FROM ${siteBindings} WHERE project_id=? AND contribution_key=? AND unit_index=? AND site_key=?`,
          [projectId,c.key,unit,s.blueprint_key]);
        const baseKey = JSON.stringify(plan.schemaVersion===2?[c.lineOrigin,s.blueprint_key]:[unit,s.blueprint_key]);
        let siteId = binding?.project_site_id;
        if (siteId) result.preservedSiteIds.push(siteId);
        else {
          siteId = plan.schemaVersion===2 && c.role==='addon' ? target?.siteId??baseSites.get(JSON.stringify([target?.siteOwnerOrigin,target?.siteOwnerSlot]))
            : plan.schemaVersion===2&&c.role==='base'&&target?.siteId ? target.siteId
            : c.siteMode === 'extend_base' ? baseSites.get(JSON.stringify([1,s.blueprint_key]))
            : c.role === 'base' ? baseSites.get(baseKey) : undefined;
          if(plan.schemaVersion===2&&c.role==='base'&&target?.siteId)fail(c.configuration?.allowedBaseSiteModes?.includes('existing')&&c.structureContract?.sites.find(x=>x.slotKey===s.blueprint_key)?.modes.includes('existing'),'Cette base ne permet pas un Site existant.');
          if (!siteId) {
            fail(c.siteMode !== 'extend_base', 'Site de destination addon introuvable.');
            let name = c.unitCount > 1 ? `${s.name} (${unit})` : s.name, suffix = 2;
            const used = new Set(this.sites.list(projectId,true).map(site => site.name));
            const originalName = name;
            while (used.has(name)) name = `${originalName} (${suffix++})`;
            siteId = this.sites.create(projectId,{name,desiredDomain:s.desired_domain}).id;
            result.createdSiteIds.push(siteId);
          } else result.preservedSiteIds.push(siteId);
          this.db.run(`INSERT INTO ${siteBindings}(project_id,contribution_key,unit_index,site_key,project_site_id) VALUES(?,?,?,?,?)`,
            [projectId,c.key,unit,s.blueprint_key,siteId]);
        }
        if (c.role === 'base') baseSites.set(baseKey,siteId);
        for (const page of c.pages.filter(p => p.template_site_id === s.id)) {
          const nodeId = ids.get(page.template_node_id);
          fail(nodeId, 'Page déclarée sans nœud de la contribution.');
          const existing = this.db.get<Row>('SELECT * FROM project_site_pages WHERE project_node_id=?',[nodeId!]);
          if (existing) {
            fail(Boolean(binding) || existing.project_site_id === siteId, 'Une Page ne peut pas être produite dans deux Sites concurrents.');
            result.preservedPageIds.push(nodeId!);
          }
          else {
            // A previously bound node deliberately unlinked by a human stays unlinked on replay.
            if (binding) {
              result.preservedPageIds.push(nodeId!); continue;
            }
            this.sites.linkPage(siteId,nodeId!,{role:page.role,desiredPath:page.desired_path});
            result.linkedPageIds.push(nodeId!);
          }
        }
      }
    }
    for (const field of ['createdSiteIds','linkedPageIds','preservedSiteIds','preservedPageIds'] as const) result[field] = [...new Set(result[field])];
    result.declaredSiteCount = new Set([...result.createdSiteIds,...result.preservedSiteIds]).size;
    return result;
  }

  private nodes(projectId: string, c: SoldBlueprintContribution, unit: number, now: string, anchors: Set<string | null>, prepared = false, isolated = false, explicitParent: string | null = null): Map<string,string> {
    const bindings = prepared ? 'project_prepared_node_bindings' : 'project_composed_node_bindings';
    const ids = new Map<string,string>(), pending = [...c.nodes];
    while (pending.length) {
      let progressed = false;
      for (let i = pending.length-1; i >= 0; i--) {
        const n = pending[i]; if (n.parent_id && !ids.has(n.parent_id)) continue;
        let id = this.db.get<{project_node_id:string}>(`SELECT project_node_id FROM ${bindings} WHERE project_id=? AND contribution_key=? AND unit_index=? AND template_node_id=?`,
          [projectId,c.key,unit,n.id])?.project_node_id;
        const wasBound = Boolean(id), parentId = n.parent_id ? ids.get(n.parent_id)! : explicitParent;
        const repeated = c.quantityMode === 'per_unit';
        // Explicit semantic containers may be shared; repeated pages and their descendants are distinct.
        const isContainer = n.node_type === 'lot' || (n.node_type === 'module' && n.display_subtype !== 'page');
        let semantic = n.semantic_key;
        let ancestor = n.parent_id ? c.nodes.find(p => p.id === n.parent_id) : undefined;
        let belowPage = false;
        const visited = new Set<string>();
        while (ancestor && !visited.has(ancestor.id)) {
          visited.add(ancestor.id);
          if (ancestor.display_subtype === 'page' || ancestor.node_type === 'task') belowPage = true;
          ancestor = ancestor.parent_id ? c.nodes.find(p => p.id === ancestor!.parent_id) : undefined;
        }
        const sharedAnchor = c.role === 'addon' && c.siteMode === 'extend_base' && isContainer && !belowPage && semantic && anchors.has(semantic);
        if ((isolated || repeated || (prepared && c.role==='addon')) && !sharedAnchor) semantic = 'sold.'+hash([c.key,unit,n.id]);
        if (!isolated && !id && c.role === 'base') {
          id = this.db.get<{project_node_id:string}>(`SELECT b.project_node_id FROM ${bindings} b
            WHERE b.project_id=? AND b.unit_index=? AND b.template_node_id=?`,[projectId,unit,n.id])?.project_node_id;
        }
        if (!id && semantic) {
          const existing = this.db.get<Row>(`SELECT id,node_type,display_subtype,parent_id FROM project_nodes WHERE project_id=? AND semantic_key=?
            ${prepared ? 'AND archived_at IS NULL AND EXISTS(SELECT 1 FROM project_prepared_node_bindings b WHERE b.project_node_id=project_nodes.id)' : ''}`,[projectId,semantic]);
          if (existing) {
            fail(existing.node_type === n.node_type && existing.display_subtype === n.display_subtype && (!n.parent_id || existing.parent_id === parentId),
              'Collision de clé sémantique incompatible entre contributions.');
            id = String(existing.id);
          }
        }
        if (!id) {
          id = randomUUID();
          this.db.run(`INSERT INTO project_nodes(id,project_id,parent_id,source_template_node_id,node_type,display_subtype,name,description,sort_order,
            estimated_minutes,is_required,status,time_category,created_at,updated_at,semantic_key,work_card_json,advice_json)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id,projectId,parentId,n.id,n.node_type,n.display_subtype,c.unitCount>1&&!isContainer?`${n.name} (${unit})`:n.name,n.description,
              n.sort_order,n.estimated_minutes,n.is_required,n.initial_status,n.time_category,now,now,semantic,n.work_card_json,n.advice_json]);
        }
        if (!wasBound) {
          this.db.run(`INSERT INTO ${bindings}(project_id,contribution_key,unit_index,template_node_id,project_node_id) VALUES(?,?,?,?,?)`,[projectId,c.key,unit,n.id,id]);
          if (!this.db.get<Row>(`SELECT id FROM project_node_sources WHERE project_node_id=? AND quote_line_id IS ? AND catalog_version_id IS ? AND template_version_id IS ? AND source_role=?`,
            [id,c.quoteLineId,c.catalogVersionId,c.templateVersionId,c.sourceRole]))
            this.db.run('INSERT INTO project_node_sources(id,project_node_id,quote_line_id,catalog_version_id,template_version_id,source_role,created_at) VALUES(?,?,?,?,?,?,?)',
              [randomUUID(),id,c.quoteLineId,c.catalogVersionId,c.templateVersionId,c.sourceRole,now]);
        }
        ids.set(n.id,id); pending.splice(i,1); progressed = true;
      }
      fail(progressed, 'Arbre du blueprint invalide.');
    }
    return ids;
  }

  provenance(projectId: string, nodeId: string): ProjectBlueprintNodeSource[] {
    let plan = this.provenancePlans.get(projectId);
    if (!plan) {
      const row = this.db.get<Row>('SELECT plan_json FROM project_blueprint_plans WHERE project_id=?',[projectId])
        ?? this.db.get<Row>('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[projectId]);
      if (!row) return [];
      plan = JSON.parse(String(row.plan_json)) as SoldBlueprintPlan;
      this.provenancePlans.set(projectId,plan);
    }
    const prepared = !this.db.get('SELECT project_id FROM project_blueprint_plans WHERE project_id=?',[projectId]);
    if (prepared) {
      const latest = this.db.get<Row>('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[projectId]);
      if (latest) plan = JSON.parse(String(latest.plan_json)) as SoldBlueprintPlan;
    }
    return this.db.all<Row>(`SELECT contribution_key,unit_index,template_node_id FROM ${prepared ? 'project_prepared_node_bindings' : 'project_composed_node_bindings'} WHERE project_id=? AND project_node_id=? ORDER BY contribution_key,unit_index`,[projectId,nodeId])
      .flatMap(b => { let c = plan!.contributions.find(c => c.key === b.contribution_key);
        if (!c && prepared) for (const revision of this.db.all<Row>('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC',[projectId])) {
          c = (JSON.parse(String(revision.plan_json)) as SoldBlueprintPlan).contributions.find(c=>c.key===b.contribution_key); if (c) break;
        }
        if (!c) return [];
        return {contributionKey:String(b.contribution_key),unitIndex:Number(b.unit_index),sourceTemplateNodeId:String(b.template_node_id),label:c.label,quoteLineId:c.quoteLineId,catalogVersionId:c.catalogVersionId,componentId:c.componentId,optionPurchase:c.optionPurchase,
          role:c.role,quantityMilli:c.quantityMilli,quantityMode:c.quantityMode,templateVersionId:c.templateVersionId}; });
  }
}

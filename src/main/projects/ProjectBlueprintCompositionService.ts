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
}
interface Prerequisite { key: string; label: string; quoteLineId: string | null; catalogVersionId: string | null; componentId: string | null }
export interface SoldBlueprintPlan {
  schemaVersion: 1; quoteId: string; base: SoldBlueprintContribution;
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

  resolveQuote(quoteId: string, explicitVersionId?: string | null): SoldBlueprintPlan {
    const lines = this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at,id', [quoteId]);
    const contributions: SoldBlueprintContribution[] = [], prerequisites: Prerequisite[] = [];
    const addPrerequisites = (value: unknown, quoteLineId: string | null, catalogVersionId: string | null, componentId: string | null) => {
      if (!Array.isArray(value)) return;
      for (const raw of value) if (typeof raw === 'string' && raw.trim()) {
        const label = raw.trim(), key = hash([quoteLineId, catalogVersionId, componentId, label]);
        if (!prerequisites.some(p => p.key === key)) prerequisites.push({key, label, quoteLineId, catalogVersionId, componentId});
      }
    };
    const add = (line: Row, version: string, quantity: number, componentId: string | null, sourceRole: 'direct' | 'offer_component') => {
      const links = this.db.all<Link>('SELECT * FROM catalog_project_blueprints WHERE catalog_version_id=? ORDER BY sort_order,id', [version]);
      for (const link of links) {
        fail(Number.isSafeInteger(quantity) && quantity > 0, 'Quantité de contribution invalide.');
        const units = link.quantity_mode === 'per_unit' ? quantity / 1000 : 1;
        fail(Number.isInteger(units) && units >= 1 && units <= 500, 'Un blueprint par unité exige une quantité entière entre 1 et 500.');
        const key = hash([String(line.id), componentId, version, link.id]);
        if (contributions.some(c => c.key === key)) continue;
        const purchase = componentId === null ? this.db.get<Row>('SELECT * FROM quote_option_purchases WHERE line_id=?', [String(line.id)]) ?? null : null;
        contributions.push(this.definition({key,label:String(line.label),linkId:link.id,templateVersionId:link.template_version_id,role:link.role,
          sourceRole,quoteLineId:String(line.id),catalogVersionId:version,componentId,optionPurchase:purchase,
          quantityMilli:quantity,unitCount:units,quantityMode:link.quantity_mode,siteMode:link.site_mode}));
      }
    };
    const quote = this.db.get<Row>('SELECT prerequisites_text FROM quotes WHERE id=?', [quoteId]);
    addPrerequisites(String(quote?.prerequisites_text ?? '').split(/\r?\n|;/), null, null, null);
    for (const line of lines) {
      const snapshot = parse(line.snapshot_json);
      const version = typeof line.catalog_version_id === 'string' ? line.catalog_version_id : null;
      addPrerequisites(snapshot?.prerequisites, String(line.id), version, null);
      if (version) add(line, version, Number(line.quantity_milli), null, 'direct');
      const components = snapshot?.offerComponents;
      if (!Array.isArray(components)) continue;
      for (const raw of components) {
        const component = object(raw);
        // Availability never produces a contribution or prerequisite; an option purchase has its own line.
        if (!component || component.isOptional !== false || typeof component.serviceVersionId !== 'string') continue;
        const componentId = typeof component.componentId === 'string' ? component.componentId : null;
        addPrerequisites(component.prerequisites, String(line.id), component.serviceVersionId, componentId);
        add(line, component.serviceVersionId,
          Number(line.quantity_milli) * Number(component.quantityMilli ?? 1000) / 1000, componentId, 'offer_component');
      }
    }
    let bases = contributions.filter(c => c.role === 'base');
    const origins = new Set(bases.map(c => hash([c.quoteLineId,c.templateVersionId])));
    fail(origins.size <= 1, 'Plusieurs blueprints de base concurrents : résoudre les lignes ou liens Catalogue avant conversion.');
    const explicitlyReplacedBases: SoldBlueprintContribution[] = [];
    if (explicitVersionId && (!bases.length || bases[0].templateVersionId !== explicitVersionId)) {
      explicitlyReplacedBases.push(...bases);
      const sold = bases[0];
      const manual = this.definition({key:hash(['manual',explicitVersionId]),label:sold?.label ?? 'Modèle choisi explicitement',linkId:null,templateVersionId:explicitVersionId,role:'base',
        sourceRole:'manual',quoteLineId:sold?.quoteLineId ?? null,catalogVersionId:sold?.catalogVersionId ?? null,componentId:null,optionPurchase:null,
        quantityMilli:sold?.quantityMilli ?? 1000,unitCount:sold?.unitCount ?? 1,quantityMode:sold?.quantityMode ?? 'once',siteMode:'create'});
      contributions.unshift(manual); bases = [manual];
    }
    fail(bases.length, 'Aucun blueprint de base n’est lié à ce devis. Choisis un modèle publié ou configure le lien Catalogue → Projet.');
    const base = bases[0];
    fail(bases.every(c => c.unitCount === base.unitCount && c.quantityMode === base.quantityMode), 'Dimensionnements de base contradictoires.');
    const ordered = [...bases,...contributions.filter(c => c.role === 'addon')];
    fail(ordered.reduce((n,c) => n+c.nodes.length*c.unitCount,0) <= 10000, 'Composition trop volumineuse ; réduire le périmètre.');
    for (const c of ordered) {
      fail(c.role !== 'base' || c.siteMode === 'create', 'La base doit déclarer ses propres Sites.');
      if (c.siteMode === 'extend_base') for (const site of c.sites) {
        fail(base.unitCount === 1 && base.sites.some(s => s.blueprint_key === site.blueprint_key),
          'Destination addon absente ou ambiguë : une clé Site de base explicite et unique est requise.');
      }
    }
    return {schemaVersion:1,quoteId,base,contributions:ordered,prerequisites,explicitlyReplacedBases};
  }

  private definition(c: Omit<SoldBlueprintContribution,'nodes'|'sites'|'pages'>): SoldBlueprintContribution {
    const version = this.db.get<Row>('SELECT status FROM project_template_versions WHERE id=?', [c.templateVersionId]);
    fail(version?.status === 'published', 'Chaque blueprint de base/module lié au devis doit être publié.');
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
    fail(hash(plan) === row!.plan_sha256 && plan.schemaVersion === 1, 'Plan composé corrompu.');
    fail(!requestedVersion || requestedVersion === plan.base.templateVersionId, 'Un projet composé rejoue uniquement son plan figé.');
    if (manageTransaction) this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = this.apply(projectId,plan,new Date().toISOString());
      if (manageTransaction) this.db.exec('COMMIT');
      return result;
    } catch (error) { if (manageTransaction) this.db.exec('ROLLBACK'); throw error; }
  }

  private apply(projectId: string, plan: SoldBlueprintPlan, now: string): ProjectBlueprintGenerationResult {
    const result: ProjectBlueprintGenerationResult = {projectId,templateVersionId:plan.base.templateVersionId,declaredSiteCount:0,
      createdSiteIds:[],linkedPageIds:[],preservedSiteIds:[],preservedPageIds:[]};
    const baseSites = new Map<string,string>();
    for (const c of plan.contributions) for (let unit = 1; unit <= c.unitCount; unit++) {
      const anchors = new Set(plan.base.nodes.filter(n => n.node_type === 'lot' || (n.node_type === 'module' && n.display_subtype !== 'page')).map(n => n.semantic_key));
      const ids = this.nodes(projectId,c,unit,now,anchors);
      for (const s of c.sites) {
        const binding = this.db.get<{project_site_id:string}>('SELECT project_site_id FROM project_composed_site_bindings WHERE project_id=? AND contribution_key=? AND unit_index=? AND site_key=?',
          [projectId,c.key,unit,s.blueprint_key]);
        const baseKey = JSON.stringify([unit,s.blueprint_key]);
        let siteId = binding?.project_site_id;
        if (siteId) result.preservedSiteIds.push(siteId);
        else {
          siteId = c.siteMode === 'extend_base' ? baseSites.get(JSON.stringify([1,s.blueprint_key]))
            : c.role === 'base' ? baseSites.get(baseKey) : undefined;
          if (!siteId) {
            fail(c.siteMode !== 'extend_base', 'Site de destination addon introuvable.');
            let name = c.unitCount > 1 ? `${s.name} (${unit})` : s.name, suffix = 2;
            const used = new Set(this.sites.list(projectId,true).map(site => site.name));
            const originalName = name;
            while (used.has(name)) name = `${originalName} (${suffix++})`;
            siteId = this.sites.create(projectId,{name,desiredDomain:s.desired_domain}).id;
            result.createdSiteIds.push(siteId);
          } else result.preservedSiteIds.push(siteId);
          this.db.run('INSERT INTO project_composed_site_bindings(project_id,contribution_key,unit_index,site_key,project_site_id) VALUES(?,?,?,?,?)',
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

  private nodes(projectId: string, c: SoldBlueprintContribution, unit: number, now: string, anchors: Set<string | null>): Map<string,string> {
    const ids = new Map<string,string>(), pending = [...c.nodes];
    while (pending.length) {
      let progressed = false;
      for (let i = pending.length-1; i >= 0; i--) {
        const n = pending[i]; if (n.parent_id && !ids.has(n.parent_id)) continue;
        let id = this.db.get<{project_node_id:string}>('SELECT project_node_id FROM project_composed_node_bindings WHERE project_id=? AND contribution_key=? AND unit_index=? AND template_node_id=?',
          [projectId,c.key,unit,n.id])?.project_node_id;
        const wasBound = Boolean(id), parentId = n.parent_id ? ids.get(n.parent_id)! : null;
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
        if (repeated && !sharedAnchor) semantic = 'sold.'+hash([c.key,unit,n.id]);
        if (!id && c.role === 'base') {
          id = this.db.get<{project_node_id:string}>(`SELECT b.project_node_id FROM project_composed_node_bindings b
            WHERE b.project_id=? AND b.unit_index=? AND b.template_node_id=?`,[projectId,unit,n.id])?.project_node_id;
        }
        if (!id && semantic) {
          const existing = this.db.get<Row>('SELECT id,node_type,display_subtype,parent_id FROM project_nodes WHERE project_id=? AND semantic_key=?',[projectId,semantic]);
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
          this.db.run('INSERT INTO project_composed_node_bindings(project_id,contribution_key,unit_index,template_node_id,project_node_id) VALUES(?,?,?,?,?)',[projectId,c.key,unit,n.id,id]);
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
      const row = this.db.get<Row>('SELECT plan_json FROM project_blueprint_plans WHERE project_id=?',[projectId]);
      if (!row) return [];
      plan = JSON.parse(String(row.plan_json)) as SoldBlueprintPlan;
      this.provenancePlans.set(projectId,plan);
    }
    return this.db.all<Row>('SELECT contribution_key,unit_index,template_node_id FROM project_composed_node_bindings WHERE project_id=? AND project_node_id=? ORDER BY contribution_key,unit_index',[projectId,nodeId])
      .map(b => { const c = plan!.contributions.find(c => c.key === b.contribution_key)!;
        return {contributionKey:String(b.contribution_key),unitIndex:Number(b.unit_index),sourceTemplateNodeId:String(b.template_node_id),label:c.label,quoteLineId:c.quoteLineId,catalogVersionId:c.catalogVersionId,componentId:c.componentId,optionPurchase:c.optionPurchase,
          role:c.role,quantityMilli:c.quantityMilli,quantityMode:c.quantityMode,templateVersionId:c.templateVersionId}; });
  }
}

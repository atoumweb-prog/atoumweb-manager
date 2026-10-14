import {ProjectContributionTargetService} from './ProjectContributionTargetService';
import type {ContributionTargetInput} from '../../shared/contributionTargets';
import { ProjectOperationalService } from './ProjectOperationalService';
import type { OperationalPlan } from '../../shared/operational';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ProjectService } from './ProjectService';
import { ProjectBlueprintCompositionService, type SoldBlueprintPlan } from './ProjectBlueprintCompositionService';
import type { ProjectSiteService } from './ProjectSiteService';
import type { ProjectCommercialScope, ProjectCommercialPreview, ProjectConflictDecision, ProjectDetail, TransformQuoteToProjectInput } from '../../shared/projects';

type Row = Record<string, unknown>;
type Kind = 'node' | 'site' | 'prerequisite';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const required = (value: unknown, message: string): void => { if (!value) throw new Error(message); };
const tables: Record<Kind,string> = {node:'project_nodes',site:'project_sites',prerequisite:'project_prerequisites'};

/** Commercial lifecycle only. All actual blueprint generation remains in the Lot 7 engine. */
export class ProjectCommercialService {
  private readonly operations: ProjectOperationalService;
  private readonly engine: ProjectBlueprintCompositionService;
  constructor(private readonly db: DatabaseAdapter, private readonly projects: ProjectService, sites: ProjectSiteService) {
    this.operations = new ProjectOperationalService(db);
    this.engine = new ProjectBlueprintCompositionService(db,sites);
  }

  private transaction<T>(work: () => T): T {
    this.db.exec('SAVEPOINT project_commercial_work');
    try { const result = work(); this.db.exec('RELEASE project_commercial_work'); return result; }
    catch (error) { this.db.exec('ROLLBACK TO project_commercial_work; RELEASE project_commercial_work'); throw error; }
  }

  private dossier(quoteId: string): Row | undefined {
    if (!this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='commercial_project_dossiers'")) return undefined;
    return this.db.get<Row>(`SELECT d.* FROM commercial_project_dossiers d JOIN commercial_quote_revisions r ON r.dossier_id=d.id WHERE r.quote_id=?`,[quoteId]);
  }

  findProject(quoteId: string): string | null {
    return this.dossier(quoteId)?.project_id as string | null ?? null;
  }

  private ensureDossier(quoteId: string, accepted = false): Row {
    const existing = this.dossier(quoteId); if (existing) return existing;
    const q = this.db.get<Row>('SELECT * FROM quotes WHERE id=?',[quoteId]);
    required(q && [...(accepted?['accepted']:[]),'draft','sent','viewed'].includes(String(q.status)), 'Le devis ne peut pas préparer un dossier commercial.');
    required(!q!.project_id && !this.db.get('SELECT id FROM projects WHERE source_quote_id=?',[quoteId]), 'Projet historique : aucune requalification automatique.');
    const id = randomUUID(), now = new Date().toISOString();
    this.db.run('INSERT INTO commercial_project_dossiers(id,current_quote_id,created_at) VALUES(?,?,?)',[id,quoteId,now]);
    this.db.run('INSERT INTO commercial_quote_revisions(quote_id,dossier_id,revision_number,created_at) VALUES(?,?,1,?)',[quoteId,id,now]);
    return this.dossier(quoteId)!;
  }

  private origins(quoteId: string, dossierId: string): Map<string,string> {
    for (const line of this.db.all<Row>('SELECT id FROM quote_lines WHERE quote_id=?',[quoteId])) {
      this.db.run('INSERT OR IGNORE INTO commercial_quote_line_origins(line_id,origin_id,dossier_id) VALUES(?,?,?)',[String(line.id),String(line.id),dossierId]);
    }
    return new Map(this.db.all<Row>(`SELECT o.line_id,o.origin_id FROM commercial_quote_line_origins o JOIN quote_lines l ON l.id=o.line_id WHERE l.quote_id=?`,[quoteId])
      .map(r=>[String(r.line_id),String(r.origin_id)]));
  }

  prepare(input: TransformQuoteToProjectInput, accepted = false): ProjectDetail {
    const id = this.transaction(() => {
      if(input.previewSHA256)required(this.preview(input).sha256===input.previewSHA256,'Prévisualisation périmée : recontrôler le devis, les versions et les cibles avant préparation.');
      const dossier = this.ensureDossier(input.quoteId,accepted);
      required(!dossier.accepted_quote_id, 'Le périmètre accepté est figé.');
      required(dossier.current_quote_id === input.quoteId, 'Choisir la révision commerciale courante.');
      const q = this.db.get<Row>('SELECT * FROM quotes WHERE id=?',[input.quoteId])!;
      required([...(accepted?['accepted']:[]),'draft','sent','viewed'].includes(String(q.status)), 'Ce devis ne peut plus être synchronisé avant acceptation.');
      const selected = input.templateVersionId === undefined ? dossier.explicit_template_version_id as string | null : input.templateVersionId;
      if (input.templateVersionId !== undefined) this.db.run('UPDATE commercial_project_dossiers SET explicit_template_version_id=? WHERE id=?',[selected ?? null,String(dossier.id)]);
      const plan = this.resolve(input.quoteId,selected,this.origins(input.quoteId,String(dossier.id)),dossier.project_id as string | null);
      let projectId = dossier.project_id as string | null;
      if (!projectId) {
        projectId = this.projects.createProvisionalShell(input,String(dossier.id),plan?.schemaVersion===2&&plan.bases?.length!==1?null:plan?.base.templateVersionId ?? null);
        this.db.run('UPDATE commercial_project_dossiers SET project_id=? WHERE id=?',[projectId,String(dossier.id)]);
      }
      this.synchronize(projectId,input.quoteId,plan);
      return projectId;
    });
    if(!accepted)this.projects.ensureProvisionalFolders(id);
    return this.projects.getProject(id);
  }

  /** Read-only preview, including the exact state used by the apply guard. No dossier or origin is inserted here. */
  preview(input:TransformQuoteToProjectInput):ProjectCommercialPreview {
    const q=this.db.get<Row>('SELECT * FROM quotes WHERE id=?',[input.quoteId]);required(q&&['draft','sent','viewed'].includes(String(q.status)),'Devis non prévisualisable.');
    const dossier=this.dossier(input.quoteId),projectId=dossier?.project_id as string|null??null;
    required(!dossier?.accepted_quote_id,'Projet accepté : aucun nouveau plan commercial.');
    required(!dossier||dossier.current_quote_id===input.quoteId,'Révision commerciale non courante.');
    const lines=this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,id',[input.quoteId]);
    const origins=new Map(lines.map(l=>[String(l.id),String(this.db.get<Row>('SELECT origin_id FROM commercial_quote_line_origins WHERE line_id=?',[String(l.id)])?.origin_id??l.id)]));
    const selected=input.templateVersionId===undefined?dossier?.explicit_template_version_id as string|null:input.templateVersionId;
    const operations=this.operations.resolve(input.quoteId,origins,projectId),plan=this.resolve(input.quoteId,selected,origins,projectId);this.operations.checkBlueprint(operations,plan);
    const destinations=new ProjectContributionTargetService(this.db).plan(projectId,operations,plan);
    const state={input:{...input,previewSHA256:undefined},quote:q,lines,dossier,plan,operations,destinations,
      revisions:projectId?this.db.all('SELECT id,sequence,scope_sha256 FROM project_commercial_scope_revisions WHERE project_id=?',[projectId]):[],
      targets:projectId?this.db.all('SELECT * FROM project_contribution_targets WHERE project_id=?',[projectId]):[],
      nodes:projectId?this.db.all('SELECT * FROM project_nodes WHERE project_id=? ORDER BY id',[projectId]):[],
      sites:projectId?this.db.all('SELECT * FROM project_sites WHERE project_id=? ORDER BY id',[projectId]):[],
      pages:projectId?this.db.all('SELECT p.* FROM project_site_pages p JOIN project_nodes n ON n.id=p.project_node_id WHERE n.project_id=? ORDER BY p.project_node_id',[projectId]):[]};
    return {quoteId:input.quoteId,projectId,sha256:digest(state),schemaVersion:plan?.schemaVersion??(operations.links.some(l=>l.configuration)?2:1),baseCount:plan?.schemaVersion===2?plan.bases!.length:plan?1:0,
      contributions:(plan?.contributions??[]).map(c=>({lineOrigin:c.lineOrigin??c.quoteLineId,templateVersionId:c.templateVersionId,role:c.role,unitCount:c.unitCount})),operations,destinations};
  }

  sync(projectId: string): ProjectDetail {
    this.transaction(() => {
      const p = this.db.get<Row>('SELECT * FROM projects WHERE id=?',[projectId]);
      required(p?.commercial_state === 'provisional','Seul un Projet prévisionnel peut être synchronisé.');
      const dossier = this.db.get<Row>('SELECT * FROM commercial_project_dossiers WHERE id=?',[String(p!.commercial_dossier_id)])!;
      const q = this.db.get<Row>('SELECT * FROM quotes WHERE id=?',[String(dossier.current_quote_id)])!;
      required(['draft','sent','viewed'].includes(String(q.status)), 'Révision non synchronisable.');
      this.synchronize(projectId,String(q.id),this.resolve(String(q.id),dossier.explicit_template_version_id as string | null,this.origins(String(q.id),String(dossier.id)),projectId));
    });
    return this.projects.getProject(projectId);
  }

  /** Called only by an explicit quote revision, inside quote duplication's savepoint. */
  linkRevision(sourceId: string, targetId: string, lineIds: Map<string,string>): void {
    const dossier = this.ensureDossier(sourceId);
    required(!dossier.accepted_quote_id,'Dossier commercial figé : aucune nouvelle révision silencieuse.');
    required(dossier.current_quote_id === sourceId,'Une révision doit partir du devis commercial courant.');
    const source = this.db.get<Row>('SELECT * FROM quotes WHERE id=?',[sourceId])!;
    const target = this.db.get<Row>('SELECT * FROM quotes WHERE id=?',[targetId])!;
    required(source.prospect_id === target.prospect_id && source.client_account_id === target.client_account_id,'Propriétaire de révision incompatible.');
    const sequence = Number(this.db.get<Row>('SELECT MAX(revision_number) AS n FROM commercial_quote_revisions WHERE dossier_id=?',[String(dossier.id)])!.n)+1;
    this.db.run('INSERT INTO commercial_quote_revisions(quote_id,dossier_id,revision_number,parent_quote_id,created_at) VALUES(?,?,?,?,?)',
      [targetId,String(dossier.id),sequence,sourceId,new Date().toISOString()]);
    for (const [lineId,origin] of this.origins(sourceId,String(dossier.id))) {
      const newId = lineIds.get(lineId); if (!newId) continue;
      this.db.run('INSERT INTO commercial_quote_line_origins(line_id,origin_id,dossier_id) VALUES(?,?,?)',[newId,origin,String(dossier.id)]);
    }
    this.db.run('UPDATE commercial_project_dossiers SET current_quote_id=? WHERE id=?',[targetId,String(dossier.id)]);
    // quotes.project_id is a historical one-to-one pointer. Revision views resolve the common dossier instead.
    this.activity(dossier.project_id as string | null,'commercial_quote_revision',`Révision commerciale ${sequence}`,{sourceId,targetId,dossierId:dossier.id});
  }

  assertAcceptance(quoteId: string): void {
    const dossier = this.dossier(quoteId); if (!dossier) return;
    required(!dossier.accepted_quote_id || dossier.accepted_quote_id === quoteId,'Une autre révision du dossier est déjà acceptée.');
    required(dossier.current_quote_id === quoteId,'Une ancienne révision ne peut pas activer le Projet courant.');
  }

  /** Acceptance owns the outer transaction including Prospect -> Client, contract snapshot and this final freeze. */
  accept(quoteId: string, clientId: string): void {
    this.assertAcceptance(quoteId);
    const dossier = this.dossier(quoteId); if (!dossier) return;
    if (dossier.accepted_quote_id === quoteId) return;
    if (dossier.project_id) {
      const projectId = String(dossier.project_id);
      const plan = this.resolve(quoteId,dossier.explicit_template_version_id as string | null,this.origins(quoteId,String(dossier.id)),projectId);
      this.synchronize(projectId,quoteId,plan);
      required(!this.db.get("SELECT id FROM project_scope_conflicts WHERE project_id=? AND status='open'",[projectId]),
        'Hors périmètre commercial — décision requise avant acceptation.');
      new ProjectContributionTargetService(this.db).assertAcceptance(projectId);
      const now = new Date().toISOString();
      if (plan) this.engine.freezePrepared(projectId,plan,now);
      this.db.run(`UPDATE projects SET client_account_id=?,commercial_state='frozen',accepted_quote_id=?,scope_frozen_at=?,
        source_quote_id=?,updated_at=? WHERE id=? AND commercial_state='provisional'`,[clientId,quoteId,now,quoteId,now,projectId]);
      const lines = this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,id',[quoteId]);
      for (const line of lines) this.db.run(`INSERT INTO project_services(id,project_id,source_quote_line_id,catalog_item_id,catalog_version_id,label,snapshot_json,catalog_value_cents,contract_value_cents,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?)`,[randomUUID(),projectId,String(line.id),line.catalog_item_id as string | null,line.catalog_version_id as string | null,String(line.label),line.snapshot_json as string | null,
          Number(line.catalog_line_value_cents),Number(line.contract_line_value_cents),now]);
      this.activity(projectId,'commercial_project_frozen','Même Projet activé, périmètre accepté figé',{quoteId,clientId});
    }
    this.db.run('UPDATE commercial_project_dossiers SET accepted_quote_id=? WHERE id=?',[quoteId,String(dossier.id)]);
  }

  private resolve(quoteId: string, selected: string | null | undefined, origins: Map<string,string>, projectId: string | null): SoldBlueprintPlan | null {
    const operations=this.operations.resolve(quoteId,origins,projectId);
    const hasBlueprint=this.engine.hasSoldBlueprints(quoteId);
    if (!selected && !hasBlueprint && operations.links.length) {
      this.operations.checkBlueprint(operations,null);return null;
    }
    return this.engine.resolveQuote(quoteId,selected,origins,operations);
  }

  private synchronize(projectId: string, quoteId: string, plan: SoldBlueprintPlan | null): void {
    const p = this.db.get<Row>('SELECT * FROM projects WHERE id=?',[projectId]);
    required(p?.commercial_state === 'provisional','Projet historique ou accepté : aucun recalcul.');
    const lines = this.db.all<Row>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,id',[quoteId]);
    const operations=this.operations.resolve(quoteId,this.origins(quoteId,String(p!.commercial_dossier_id)),projectId);
    this.operations.checkBlueprint(operations,plan);
    const targets=new ProjectContributionTargetService(this.db);
    const destinations=targets.plan(projectId,operations,plan);
    if(plan?.schemaVersion===2)plan.destinations=destinations;
    const configured=operations.links.some(l=>l.configuration);
    const scopePlan={...(plan ?? {schemaVersion:configured?2:1,...(configured?{bases:[],destinations}:{} ),quoteId,base:null,contributions:[],prerequisites:this.engine.prerequisitesForQuote(quoteId,this.origins(quoteId,String(p!.commercial_dossier_id))),explicitlyReplacedBases:[]}),operations};
    const scopeHash = digest({plan:scopePlan,lines});
    const previous = this.db.get<Row>('SELECT * FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[projectId]);
    if (previous?.scope_sha256 === scopeHash) return;
    const now = new Date().toISOString();
    const revision = this.db.get<Row>('SELECT revision_number FROM commercial_quote_revisions WHERE quote_id=?',[quoteId])!;
    const sequence = Number(previous?.sequence ?? 0)+1,revisionId=randomUUID();
    this.db.run(`INSERT INTO project_commercial_scope_revisions(id,project_id,quote_id,commercial_revision,sequence,plan_json,lines_json,scope_sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?)`,[revisionId,projectId,quoteId,Number(revision.revision_number),sequence,JSON.stringify(scopePlan),JSON.stringify(lines),scopeHash,now]);
    targets.retireObsolete(projectId,destinations);
    if (plan) {
      this.engine.applyPrepared(projectId,plan,now);
      this.retireBindings(projectId,plan);
    }
    this.syncPrerequisites(projectId,scopePlan,now);
    this.operations.apply(projectId,operations,id=>this.retire(projectId,'node',id));
    targets.synchronize(projectId,revisionId,operations,plan,destinations);
    if(scopePlan.schemaVersion===2)this.db.run('UPDATE projects SET template_version_id=? WHERE id=?',
      [plan?.bases?.length===1?plan.bases[0].templateVersionId:null,projectId]);
    this.db.run('UPDATE projects SET commercial_value_cents=?,contract_value_cents=?,updated_at=? WHERE id=?',
      [Number(this.db.get<Row>('SELECT catalog_value_cents FROM quotes WHERE id=?',[quoteId])!.catalog_value_cents),
        Number(this.db.get<Row>('SELECT contract_value_cents FROM quotes WHERE id=?',[quoteId])!.contract_value_cents),now,projectId]);
    this.captureNewEntities(projectId);
    this.activity(projectId,'commercial_project_synchronized',`Périmètre prévisionnel synchronisé (${sequence})`,{quoteId,sequence,scopeHash});
  }

  private syncPrerequisites(projectId: string, plan: Pick<SoldBlueprintPlan,'prerequisites'>, now: string): void {
    const wanted = new Set(plan.prerequisites.map(p=>p.key));
    const existing = this.db.all<Row>(`SELECT s.*,p.label FROM project_composed_prerequisite_sources s JOIN project_prerequisites p ON p.id=s.project_prerequisite_id WHERE p.project_id=?`,[projectId]);
    for (const source of existing) if (!wanted.has(String(source.source_key))) {
      this.db.run('DELETE FROM project_composed_prerequisite_sources WHERE project_prerequisite_id=? AND source_key=?',[String(source.project_prerequisite_id),String(source.source_key)]);
      if (!this.db.get('SELECT source_key FROM project_composed_prerequisite_sources WHERE project_prerequisite_id=?',[String(source.project_prerequisite_id)]))
        this.retire(projectId,'prerequisite',String(source.project_prerequisite_id));
    }
    for (const pre of plan.prerequisites) {
      const source = this.db.get<Row>('SELECT s.* FROM project_composed_prerequisite_sources s JOIN project_prerequisites p ON p.id=s.project_prerequisite_id WHERE p.project_id=? AND s.source_key=?',[projectId,pre.key]);
      if (source) {
        if (source.provenance_json!==JSON.stringify(pre)) this.db.run('UPDATE project_composed_prerequisite_sources SET provenance_json=? WHERE project_prerequisite_id=? AND source_key=?',[JSON.stringify(pre),String(source.project_prerequisite_id),pre.key]);
        continue;
      }
      // Deduplicate only managed, still-active prerequisites. Never adopt a manual prerequisite by its label.
      let id = this.db.get<Row>(`SELECT p.id FROM project_prerequisites p JOIN project_scope_entities e ON e.entity_id=p.id AND e.entity_kind='prerequisite'
        WHERE p.project_id=? AND e.state='active' AND p.label=?`,[projectId,pre.label])?.id as string | undefined;
      if (!id) {
        id = randomUUID();
        this.db.run("INSERT INTO project_prerequisites(id,project_id,label,status,is_required,sort_order,created_at,updated_at) VALUES(?,?,?,'to_request',1,0,?,?)",[id,projectId,pre.label,now,now]);
      }
      this.db.run('INSERT INTO project_composed_prerequisite_sources(project_prerequisite_id,source_key,provenance_json) VALUES(?,?,?)',[id,pre.key,JSON.stringify(pre)]);
    }
  }

  private retireBindings(projectId: string, plan: SoldBlueprintPlan): void {
    const active = new Map(plan.contributions.map(c=>[c.key,c.unitCount]));
    for (const [table,kind,column] of [['project_prepared_node_bindings','node','project_node_id'],['project_prepared_site_bindings','site','project_site_id']] as const) {
      const bindings = this.db.all<Row>(`SELECT * FROM ${table} WHERE project_id=?`,[projectId]);
      const obsolete = bindings.filter(b=>Number(b.unit_index)>(active.get(String(b.contribution_key)) ?? 0));
      const retained = new Set(bindings.filter(b=>!obsolete.includes(b)).map(b=>String(b[column])));
      const ids = [...new Set(obsolete.map(b=>String(b[column])))].filter(id=>!retained.has(id));
      if (kind === 'node') ids.sort((a,b)=>this.depth(b)-this.depth(a));
      for (const id of ids) this.retire(projectId,kind,id);
      // Obsolete sources on containers still used by another contribution can be removed safely.
      for (const b of obsolete) if (retained.has(String(b[column]))) this.db.run(`DELETE FROM ${table} WHERE project_id=? AND contribution_key=? AND unit_index=? AND ${column}=?`,[projectId,String(b.contribution_key),Number(b.unit_index),String(b[column])]);
    }
  }

  private depth(id: string): number {
    let depth=0, next: string | null=id; const seen=new Set<string>();
    while (next && !seen.has(next)) { seen.add(next); next=this.db.get<Row>('SELECT parent_id FROM project_nodes WHERE id=?',[next])?.parent_id as string | null; depth++; }
    return depth;
  }

  private snapshot(kind: Kind, id: string): Row | null {
    const row = this.db.get<Row>(`SELECT * FROM ${tables[kind]} WHERE id=?`,[id]); if (!row) return null;
    const value: Row = {...row};
    if (kind==='node') value.page = this.db.get('SELECT project_site_id,role,desired_path FROM project_site_pages WHERE project_node_id=?',[id]) ?? null;
    return value;
  }

  private hasExternalReferences(kind: Kind,id: string): boolean {
    const target=tables[kind];
    const ignored=new Set(['project_action_instances','project_prepared_node_bindings','project_prepared_site_bindings','project_node_sources','project_site_pages','project_composed_prerequisite_sources']);
    for (const table of this.db.all<Row>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")) {
      const name=String(table.name); if (ignored.has(name)) continue;
      for (const fk of this.db.all<Row>(`PRAGMA foreign_key_list("${name}")`)) {
        if (fk.table!==target || (name===target && fk.from==='parent_id')) continue;
        if (this.db.get(`SELECT 1 FROM "${name}" WHERE "${String(fk.from)}"=? LIMIT 1`,[id])) return true;
      }
    }
    if (kind==='node' && this.db.get('SELECT id FROM project_nodes WHERE parent_id=?',[id])) return true;
    if (kind==='site' && this.db.get('SELECT project_node_id FROM project_site_pages WHERE project_site_id=?',[id])) return true;
    return false;
  }

  private isVirgin(projectId: string,kind: Kind,id: string): boolean {
    const baseline=this.db.get<Row>('SELECT baseline_json FROM project_scope_entities WHERE project_id=? AND entity_kind=? AND entity_id=?',[projectId,kind,id]);
    return Boolean(baseline && JSON.stringify(this.snapshot(kind,id))===baseline.baseline_json && !this.hasExternalReferences(kind,id));
  }

  private retire(projectId: string,kind: Kind,id: string): void {
    const managed=this.db.get<Row>('SELECT * FROM project_scope_entities WHERE project_id=? AND entity_kind=? AND entity_id=?',[projectId,kind,id]);
    if (!managed || ['kept','detached','archived','removed'].includes(String(managed.state))) return;
    if (this.isVirgin(projectId,kind,id)) { this.removeEntity(projectId,kind,id); return; }
    this.db.run("UPDATE project_scope_entities SET state='out_of_scope' WHERE project_id=? AND entity_kind=? AND entity_id=?",[projectId,kind,id]);
    if (!this.db.get("SELECT id FROM project_scope_conflicts WHERE project_id=? AND entity_kind=? AND entity_id=? AND status='open'",[projectId,kind,id])) {
      this.db.run('INSERT INTO project_scope_conflicts(id,project_id,entity_kind,entity_id,reason,created_at) VALUES(?,?,?,?,?,?)',
        [randomUUID(),projectId,kind,id,'Hors périmètre commercial — décision requise',new Date().toISOString()]);
    }
  }

  private removeBindings(projectId: string,kind: Kind,id: string): void {
    if (kind==='node') this.db.run('DELETE FROM project_prepared_node_bindings WHERE project_id=? AND project_node_id=?',[projectId,id]);
    if (kind==='site') this.db.run('DELETE FROM project_prepared_site_bindings WHERE project_id=? AND project_site_id=?',[projectId,id]);
    if (kind==='prerequisite') this.db.run('DELETE FROM project_composed_prerequisite_sources WHERE project_prerequisite_id=?',[id]);
  }

  private removeEntity(projectId: string,kind: Kind,id: string): void {
    this.removeBindings(projectId,kind,id);
    if (kind==='node') this.db.run('DELETE FROM project_action_instances WHERE project_id=? AND project_node_id=?',[projectId,id]);
    if (kind==='node') { this.db.run('DELETE FROM project_node_sources WHERE project_node_id=?',[id]); this.db.run('DELETE FROM project_site_pages WHERE project_node_id=?',[id]); }
    this.db.run(`DELETE FROM ${tables[kind]} WHERE id=?`,[id]);
    this.db.run("UPDATE project_scope_entities SET state='removed' WHERE project_id=? AND entity_kind=? AND entity_id=?",[projectId,kind,id]);
  }

  private captureNewEntities(projectId: string): void {
    for (const [kind,ids] of [
      ['node',this.db.all<Row>('SELECT DISTINCT project_node_id AS id FROM project_prepared_node_bindings WHERE project_id=? UNION SELECT project_node_id AS id FROM project_action_instances WHERE project_id=?',[projectId,projectId])],
      ['site',this.db.all<Row>('SELECT DISTINCT project_site_id AS id FROM project_prepared_site_bindings WHERE project_id=?',[projectId])],
      ['prerequisite',this.db.all<Row>('SELECT DISTINCT p.id FROM project_prerequisites p JOIN project_composed_prerequisite_sources s ON s.project_prerequisite_id=p.id WHERE p.project_id=?',[projectId])],
    ] as [Kind,Row[]][]) for (const row of ids) {
      const id=String(row.id);
      this.db.run("INSERT OR IGNORE INTO project_scope_entities(project_id,entity_kind,entity_id,baseline_json,state) VALUES(?,?,?,?,'active')",[projectId,kind,id,JSON.stringify(this.snapshot(kind,id))]);
      const state=this.db.get<Row>('SELECT state FROM project_scope_entities WHERE project_id=? AND entity_kind=? AND entity_id=?',[projectId,kind,id])!.state;
      if (state==='out_of_scope' && this.isDesired(projectId,kind,id)) {
        this.db.run("UPDATE project_scope_entities SET state='active' WHERE project_id=? AND entity_kind=? AND entity_id=?",[projectId,kind,id]);
        this.db.run("UPDATE project_scope_conflicts SET status='resolved',resolved_at=? WHERE project_id=? AND entity_kind=? AND entity_id=? AND status='open'",[new Date().toISOString(),projectId,kind,id]);
        this.activity(projectId,'commercial_scope_restored','Élément à nouveau dans le périmètre vendu',{kind,id});
      }
    }
  }

  private isDesired(projectId: string,kind: Kind,id: string): boolean {
    if (kind==='prerequisite') return Boolean(this.db.get('SELECT source_key FROM project_composed_prerequisite_sources WHERE project_prerequisite_id=?',[id]));
    const revision=this.db.get<Row>('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[projectId]);
    if (!revision) return false;
    const stored=JSON.parse(String(revision.plan_json)) as SoldBlueprintPlan & {operations?:OperationalPlan};
    const instance=this.db.get<Row>('SELECT source_key FROM project_action_instances WHERE project_id=? AND project_node_id=?',[projectId,id]);
    if (instance) return Boolean(stored.operations?.actions.some(a=>a.key===instance.source_key));
    const plan=stored;
    const table=kind==='node'?'project_prepared_node_bindings':'project_prepared_site_bindings',column=kind==='node'?'project_node_id':'project_site_id';
    return this.db.all<Row>(`SELECT contribution_key,unit_index FROM ${table} WHERE project_id=? AND ${column}=?`,[projectId,id])
      .some(b=>plan.contributions.some(c=>c.key===b.contribution_key&&c.unitCount>=Number(b.unit_index)));
  }

  resolveConflict(projectId: string, conflictId: string, decision: ProjectConflictDecision): ProjectCommercialScope {
    this.transaction(()=>{
      required(this.db.get<Row>('SELECT commercial_state FROM projects WHERE id=?',[projectId])?.commercial_state==='provisional','Projet figé : résolution refusée.');
      const conflict=this.db.get<Row>("SELECT * FROM project_scope_conflicts WHERE id=? AND project_id=? AND status='open'",[conflictId,projectId]);
      required(conflict,'Conflit ouvert introuvable.');
      required(['keep','archive','detach','delete'].includes(decision),'Décision invalide.');
      const kind=String(conflict!.entity_kind) as Kind,id=String(conflict!.entity_id);
      required(!this.isDesired(projectId,kind,id),'Cet élément contribue de nouveau au périmètre courant : synchroniser avant décision.');
      if (decision==='delete') { required(this.isVirgin(projectId,kind,id),'Suppression refusée : élément non vierge ou encore référencé.'); this.removeEntity(projectId,kind,id); }
      else {
        if (decision==='archive') {
          if (kind==='node') required(!this.db.get('SELECT id FROM project_nodes WHERE parent_id=? AND archived_at IS NULL',[id]),'Résoudre d’abord les descendants avant archivage de cette étape.');
          if (kind==='site') required(!this.db.get(
            `SELECT psp.project_node_id FROM project_site_pages psp
             JOIN project_nodes pn ON pn.id=psp.project_node_id
             WHERE psp.project_site_id=? AND pn.archived_at IS NULL LIMIT 1`, [id],
          ), 'Archiver ce Site est refusé : résoudre d’abord ses Pages actives.');
          this.db.run(`UPDATE ${tables[kind]} SET archived_at=?,updated_at=? WHERE id=?`,[new Date().toISOString(),new Date().toISOString(),id]);
        }
        if (decision==='detach' || decision==='archive') this.removeBindings(projectId,kind,id);
        this.db.run('UPDATE project_scope_entities SET state=? WHERE project_id=? AND entity_kind=? AND entity_id=?',
          [decision==='keep'?'kept':decision==='detach'?'detached':'archived',projectId,kind,id]);
      }
      this.db.run("UPDATE project_scope_conflicts SET status='resolved',decision=?,resolved_at=? WHERE id=?",[decision,new Date().toISOString(),conflictId]);
      this.activity(projectId,'commercial_scope_conflict_resolved',`Décision hors périmètre : ${decision}`,{conflictId,kind,id,decision});
    });
    return this.scope(projectId);
  }

  assignTarget(projectId:string,input:ContributionTargetInput):ProjectCommercialScope {
    this.transaction(()=>{
      new ProjectContributionTargetService(this.db).assign(projectId,input);
      if(this.db.get<Row>('SELECT commercial_state FROM projects WHERE id=?',[projectId])?.commercial_state==='provisional')this.sync(projectId);
    });
    return this.scope(projectId);
  }

  scope(projectId: string): ProjectCommercialScope {
    const p=this.db.get<Row>('SELECT * FROM projects WHERE id=?',[projectId]); required(p,'Projet introuvable.');
    const d=p!.commercial_dossier_id ? this.db.get<Row>('SELECT * FROM commercial_project_dossiers WHERE id=?',[String(p!.commercial_dossier_id)]) : null;
    return {targetChoices:new ProjectContributionTargetService(this.db).choices(projectId),targets:new ProjectContributionTargetService(this.db).views(projectId),projectId,state:p!.commercial_state as ProjectCommercialScope['state'],dossierId:d?.id as string | null ?? null,
      currentQuoteId:d?.current_quote_id as string | null ?? null,acceptedQuoteId:p!.accepted_quote_id as string | null,
      revisions:this.db.all<Row>('SELECT id,quote_id,commercial_revision,sequence,scope_sha256,created_at FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence',[projectId])
        .map(r=>({id:String(r.id),quoteId:String(r.quote_id),commercialRevision:Number(r.commercial_revision),sequence:Number(r.sequence),sha256:String(r.scope_sha256),createdAt:String(r.created_at)})),
      conflicts:this.db.all<Row>("SELECT * FROM project_scope_conflicts WHERE project_id=? AND status='open' ORDER BY created_at,id",[projectId])
        .map(c=>({id:String(c.id),entityKind:String(c.entity_kind),entityId:String(c.entity_id),
          label:String(this.snapshot(String(c.entity_kind) as Kind,String(c.entity_id))?.name ?? this.snapshot(String(c.entity_kind) as Kind,String(c.entity_id))?.label ?? 'Élément conservé'),reason:String(c.reason)}))};
  }

  private activity(projectId: string | null, action: string, summary: string, metadata: Row): void {
    this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES(?,?,?,?,?,?)',
      [projectId?'project':'quote',projectId ?? String(metadata.targetId),action,summary,JSON.stringify(metadata),new Date().toISOString()]);
  }
}

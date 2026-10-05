import {readPolicy, validatePolicy} from './ContributionPolicy';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ProjectService } from './ProjectService';
import { BUSINESS_TIME_CATEGORIES, type OperationalReference, type OperationalModel } from '../../shared/operational';

export const operationalHash = (value: unknown): string => {
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) : v && typeof v==='object'
    ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])) : v;
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
};
type Row = Record<string,unknown>;
export class OperationalReferenceService {
  constructor(private readonly db: DatabaseAdapter) {}

  prepareVitrineStructure(projects: ProjectService): string {
    const existing=this.db.get<Row>(`SELECT template_version_id FROM blueprint_operational_profiles WHERE mode='structural'
      AND json_extract(provenance_json,'$.sourceVersion')='atoumweb-project-template-vitrine-v1'`);
    if (existing) return String(existing.template_version_id);
    const source='atoumweb-project-template-vitrine-v1';
    const expected=['setup.domain_action','setup.hosting_action','technical.wordpress','technical.divi','technical.foundation','pages.home.content',
      'quality.seo','quality.rgpd','quality.tests','launch.backup_before','launch.go_live','launch.backup_after','launch.handover'];
    const nodes=this.db.all<Row>('SELECT * FROM project_template_nodes WHERE template_version_id=?',[source]);
    const tasks=nodes.filter(n=>n.node_type==='task');
    if (tasks.length!==13 || tasks.some(n=>!expected.includes(String(n.semantic_key))) || tasks.reduce((s,n)=>s+Number(n.estimated_minutes),0)!==525)
      throw Error('Blueprint source différent de l’audit validé : aucun retrait automatique.');
    const latest=this.db.get<Row>('SELECT id FROM project_template_versions WHERE template_id=? ORDER BY version_number DESC LIMIT 1',['atoumweb-project-template-vitrine']);
    if (latest?.id!==source) throw Error('Nouvelle version source non auditée : préparation structurelle refusée.');
    const v=projects.createTemplateVersion('atoumweb-project-template-vitrine','Structure seule, production fournie par modèle opérationnel compatible');
    for (const task of v.nodes.filter(n=>n.type==='task')) projects.removeTemplateNode(task.id);
    // Only the new structural version: containers have no independent production estimate.
    this.db.run('UPDATE project_template_nodes SET estimated_minutes=NULL WHERE template_version_id=?',[v.id]);
    this.db.run('INSERT INTO blueprint_operational_profiles(template_version_id,mode,requires_operational,provenance_json) VALUES(?,?,1,?)',
      [v.id,'structural',JSON.stringify({sourceVersion:source,removedTaskKeys:expected,decision:'AtoumWeb 04/10/2026 : A19 point de restauration ; A16 consentement technique'})]);
    return v.id;
  }

  useStructure(id: string): void {
    if (!this.db.get("SELECT template_version_id FROM blueprint_operational_profiles WHERE template_version_id=? AND mode='structural'",[id])) throw Error('Version structurelle absente.');
    if(this.db.get("SELECT id FROM project_template_nodes WHERE template_version_id=? AND node_type IN ('task','checklist')",[id])) throw Error('Une structure opérationnelle ne peut contenir des tâches de production.');
    // Operational availability is explicit and independent of commercial publication.
    // The single-published-version constraint remains intact; the historical V1 stays published.
    this.db.run('UPDATE blueprint_operational_profiles SET operational_ready=1 WHERE template_version_id=?',[id]);
  }

  simulate(source: OperationalReference) {
    if (source.schemaVersion!==1 || !/^[a-f0-9]{64}$/.test(source.source.sha256) || !source.models.length) throw Error('Référentiel opérationnel invalide.');
    const codes=new Set<string>(),keys=new Set<string>();
    const rows=source.models.map(model=>{
      if (codes.has(model.code)) throw Error('Code AW dupliqué.'); codes.add(model.code);
      this.validate(model,keys);
      const item=this.db.get<Row>('SELECT id FROM catalog_items WHERE canonical_code=?',[model.code]);
      if (!item) throw Error('Référence AW absente : '+model.code);
      const contentHash=operationalHash(model);
      const existing=this.db.get<Row>('SELECT id,status FROM operational_model_versions WHERE catalog_item_id=? AND content_sha256=?',[String(item.id),contentHash]);
      return {code:model.code,itemId:String(item.id),contentHash,existingVersionId:existing?.id as string | undefined,
        action:existing?'unchanged':'create',lot:model.lot,actions:model.actions.length,minutes:model.referenceMinutes};
    });
    const payloadHash=operationalHash(source);
    const state=this.db.all('SELECT * FROM operational_model_versions ORDER BY id');
    return {payloadHash,planHash:operationalHash({source,rows,state}),rows};
  }

  importDraft(source: OperationalReference, expectedPlanHash: string) {
    this.db.exec('SAVEPOINT operational_import');
    try {
      const plan=this.simulate(source); if (plan.planHash!==expectedPlanHash) throw Error('Dry-run modifié : import refusé.');
      if (plan.rows.every(r=>r.action==='unchanged')) {this.db.exec('RELEASE operational_import');return plan;}
      const run=randomUUID(),now=new Date().toISOString();
      this.db.run('INSERT INTO operational_import_runs(id,source_sha256,payload_sha256,manifest_json,created_at) VALUES(?,?,?,?,?)',
        [run,source.source.sha256,plan.payloadHash,JSON.stringify(source),now]);
      for (const row of plan.rows) {
        if (row.action==='unchanged') continue;
        const version=Number(this.db.get<Row>('SELECT COALESCE(MAX(version_number),0)+1 AS n FROM operational_model_versions WHERE catalog_item_id=?',[row.itemId])!.n);
        this.db.run('INSERT INTO operational_model_versions(id,catalog_item_id,canonical_code,version_number,import_run_id,content_sha256,model_json,created_at) VALUES(?,?,?,?,?,?,?,?)',
          [randomUUID(),row.itemId,row.code,version,run,row.contentHash,JSON.stringify(source.models.find(m=>m.code===row.code)),now]);
      }
      this.db.exec('RELEASE operational_import');return plan;
    } catch(e) {this.db.exec('ROLLBACK TO operational_import; RELEASE operational_import');throw e;}
  }

  markReady(id: string): void {
    const v=this.db.get<Row>('SELECT model_json FROM operational_model_versions WHERE id=?',[id]);
    if (!v) throw Error('Version opérationnelle absente.');
    this.validate(JSON.parse(String(v.model_json)),new Set());
    this.db.run("UPDATE operational_model_versions SET status='ready' WHERE id=? AND status='draft'",[id]);
  }

  link(catalogVersionId: string, modelVersionId: string, blueprintVersionId: string | null, provenance: Row): string {
    const v=this.db.get<Row>('SELECT * FROM operational_model_versions WHERE id=?',[modelVersionId]);
    const catalog=this.db.get<Row>('SELECT item_id FROM catalog_versions WHERE id=?',[catalogVersionId]);
    if (!v || !catalog || catalog.item_id!==v.catalog_item_id) throw Error('Compatibilité catalogue/modèle invalide.');
    if (blueprintVersionId) {
      const profile=this.db.get<Row>('SELECT * FROM blueprint_operational_profiles WHERE template_version_id=?',[blueprintVersionId]);
      if (profile?.mode!=='structural' || this.db.get("SELECT id FROM project_template_nodes WHERE template_version_id=? AND node_type IN ('task','checklist')",[blueprintVersionId]))
        throw Error('Blueprint historique complet avec tâches : association opérationnelle bloquée.');
    }
    const configuration=readPolicy(JSON.stringify(provenance));
    if(configuration) validatePolicy(configuration,JSON.parse(String(v.model_json)),blueprintVersionId,this.db);
    const previous=this.db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? ORDER BY revision DESC LIMIT 1',[catalogVersionId]);
    if(previous&&readPolicy(String(previous.provenance_json))&&!configuration)throw Error('Version gouvernée 8A.1 : retrait implicite de politique interdit.');
    if (previous?.model_version_id===modelVersionId && previous.blueprint_version_id===blueprintVersionId && operationalHash(JSON.parse(String(previous.provenance_json)))===operationalHash(provenance)) return String(previous.id);
    const id=randomUUID();
    this.db.run('INSERT INTO catalog_operational_links(id,catalog_version_id,model_version_id,blueprint_version_id,revision,provenance_json,created_at) VALUES(?,?,?,?,?,?,?)',
      [id,catalogVersionId,modelVersionId,blueprintVersionId,Number(previous?.revision ?? 0)+1,JSON.stringify(provenance),new Date().toISOString()]);
    return id;
  }

  /** Independent explicit activation; model readiness never activates a staged link. */
  activateLink(id:string): void {
    this.db.exec('SAVEPOINT operational_link_activation');
    try {
      const l=this.db.get<Row>('SELECT * FROM catalog_operational_links WHERE id=?',[id]);
      if(!l)throw Error('Association opérationnelle absente.');
      const v=this.db.get<Row>('SELECT * FROM operational_model_versions WHERE id=?',[String(l.model_version_id)]);
      if(v?.status!=='ready')throw Error('Modèle opérationnel non mis en usage.');
      if(!this.db.get('SELECT id FROM catalog_versions WHERE id=? AND item_id=?',[String(l.catalog_version_id),String(v.catalog_item_id)]))throw Error('Compatibilité catalogue/modèle invalide.');
      const p=readPolicy(String(l.provenance_json));
      if(p)validatePolicy(p,JSON.parse(String(v.model_json)),l.blueprint_version_id as string|null,this.db);
      if(l.blueprint_version_id && !this.db.get("SELECT template_version_id FROM blueprint_operational_profiles WHERE template_version_id=? AND mode='structural' AND operational_ready=1",[String(l.blueprint_version_id)]))throw Error('Profil structurel non mis en usage.');
      for(const capability of p?.requires??[]) {
        const providers=this.db.all<Row>(`SELECT b.provenance_json FROM catalog_operational_links a
          JOIN operational_model_versions m ON m.id=a.model_version_id
          JOIN blueprint_operational_profiles b ON b.template_version_id=a.blueprint_version_id
          WHERE a.status='ready' AND m.status='ready' AND b.operational_ready=1
          AND json_extract(a.provenance_json,'$.configuration.structuralRole')='base'`);
        if(!providers.some(r=>JSON.parse(String(r.provenance_json)).structureContract?.sites?.some((s:{provides:string[]})=>s.provides.includes(capability))))throw Error('Capacité requise sans base opérationnelle prête : '+capability);
      }
      if(l.status!=='ready')this.db.run("UPDATE catalog_operational_links SET status='ready' WHERE id=? AND status='draft'",[id]);
      this.db.exec('RELEASE operational_link_activation');
    }catch(e){this.db.exec('ROLLBACK TO operational_link_activation; RELEASE operational_link_activation');throw e;}
  }

  private validate(m: OperationalModel, keys: Set<string>): void {
    if (!m.code || !['8A','8B'].includes(m.lot) || !Number.isSafeInteger(m.referenceMinutes) || m.referenceMinutes<0 || !m.quantityRule) throw Error('Modèle invalide : '+m.code);
    for (const a of m.actions) {
      if (!a.key.startsWith(m.code+'-') || keys.has(a.key) || !Number.isSafeInteger(a.minutes) || a.minutes<0 || !a.phase || !a.name || !BUSINESS_TIME_CATEGORIES.includes(a.category)) throw Error('Action invalide : '+a.key);
      keys.add(a.key);
    }
    if (m.actions.reduce((s,a)=>s+a.minutes,0)!==m.referenceMinutes) throw Error('Somme des minutes incohérente : '+m.code);
    if (m.model==='Crédit temps' && (m.lot!=='8B' || m.actions.length || m.referenceMinutes)) throw Error('Un pack heures ne crée pas de tâches.');
  }
}

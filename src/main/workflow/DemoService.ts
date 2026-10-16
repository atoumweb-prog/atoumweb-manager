import { QuoteContractPreparationService } from '../commercial/QuoteContractPreparationService';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { DatabaseService } from '../database/DatabaseService';
import type { DemoSummary } from '../../shared/workflow';

// Only business records may be removed. Reference data and physical files are never deleted.
const TABLES = ['organizations','contacts','client_accounts','client_contact_roles','prospects','crm_actions','crm_needs','quotes','quote_lines','quote_contract_clauses','quote_contract_preparations','quote_contract_transmissions','quote_document_links','projects','project_blueprint_plans','project_nodes','project_node_sources','project_services','project_prerequisites','project_sites','project_site_pages','project_composed_node_bindings','project_composed_site_bindings','project_composed_prerequisite_sources','file_assets','file_asset_links','technical_items','technical_item_versions','technical_item_assets','service_requests','interventions','time_sessions','time_session_pauses','maintenance_subscriptions','maintenance_periods','maintenance_checks','hour_packs','hour_pack_movements','billing_items','maintenance_overage_decisions','maintenance_report_drafts','hour_pack_shortfall_decisions','activity_events','activity_log','search_documents'];
const ident=(name:string):string=>'"'+name.replace(/"/g,'""')+'"';
const recordKey=(table:string)=>table==='maintenance_report_drafts'?'period_id'
  : table==='project_blueprint_plans'?'project_id'
  : table==='project_site_pages'?'project_node_id'
  : table.startsWith('project_composed_')?'rowid':'id';
type ForeignKey = { table: string; from: string; to: string } & Record<string,unknown>;
export class DemoService {
  constructor(private db: DatabaseAdapter) {}
  beginCapture(label: string): string {
    this.installTracking();
    if (this.db.get<{ batch_id: string | null }>('SELECT batch_id FROM demo_context WHERE id=1')?.batch_id) throw new Error('Une création de démonstration est déjà en cours.');
    const batch = randomUUID();
    this.db.run('INSERT INTO demo_batches VALUES (?,?,?)', [batch, label.trim() || 'saisie manuelle', new Date().toISOString()]);
    this.db.run('UPDATE demo_context SET batch_id=? WHERE id=1', [batch]);
    return batch;
  }
  endCapture(batch: string): void {
    this.db.run('UPDATE demo_context SET batch_id=NULL WHERE id=1 AND batch_id=?', [batch]);
  }
  private tables(): string[] { return TABLES.filter(table=>Boolean(this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?",[table]))); }
  installTracking(): void {
    for(const table of this.tables()) {
      const columns=this.db.all<{name:string}>(`PRAGMA table_info(${ident(table)})`).map(c=>c.name);
      if(recordKey(table)!=='rowid'&&!columns.includes(recordKey(table))) throw new Error(`Marquage demo impossible : ${table}`);
      const parents=this.db.all<ForeignKey>(`PRAGMA foreign_key_list(${ident(table)})`).filter(f=>TABLES.includes(f.table) && f.to==='id')
        .map(f=>`SELECT batch_id FROM demo_records WHERE table_name='${f.table}' AND record_id=CAST(NEW.${ident(f.from)} AS TEXT)`);
      for(const field of ['entity_id','source_id','intervention_id']) if(columns.includes(field)) parents.push(`SELECT batch_id FROM demo_records WHERE record_id=CAST(NEW.${ident(field)} AS TEXT)`);
      const source=['SELECT batch_id FROM demo_context WHERE id=1 AND batch_id IS NOT NULL',...parents].join(' UNION ALL ');
      this.db.exec(`CREATE TRIGGER IF NOT EXISTS ${ident('demo_track_'+table)} AFTER INSERT ON ${ident(table)} BEGIN
        INSERT OR IGNORE INTO demo_records(table_name,record_id,batch_id) SELECT '${table}',CAST(NEW.${ident(recordKey(table))} AS TEXT),batch_id FROM (${source}) LIMIT 1;
      END;`);
    }
  }
  summary(): DemoSummary {
    const counts=this.tables().map(table=>({table,count:Number(this.db.get<{count:number}>(`SELECT COUNT(*) AS count FROM ${ident(table)} WHERE CAST(${ident(recordKey(table))} AS TEXT) IN (SELECT record_id FROM demo_records WHERE table_name=?)`,[table])?.count??0)})).filter(r=>r.count>0);
    return {counts,total:counts.reduce((n,r)=>n+r.count,0)};
  }
  async reset(backup:()=>Promise<string>): Promise<{backupPath:string;deleted:number}> {
    // Backup is mandatory; no write occurs if it fails. Recheck references inside the transaction.
    const backupPath=await backup();
    this.db.exec('BEGIN IMMEDIATE; PRAGMA defer_foreign_keys=ON;');
    try {
      const tables=this.tables();
      for(const {name:table} of this.db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")) {
        const columns=this.db.all<{name:string}>(`PRAGMA table_info(${ident(table)})`).map(c=>c.name);
        const real=tables.includes(table) ? `CAST(child.${ident(recordKey(table))} AS TEXT) NOT IN (SELECT record_id FROM demo_records WHERE table_name='${table}')` : '1=1';
        for(const fk of this.db.all<ForeignKey>(`PRAGMA foreign_key_list(${ident(table)})`)) {
          if(!tables.includes(fk.table) || fk.to!=='id') continue;
          if(this.db.get(`SELECT 1 FROM ${ident(table)} child WHERE ${real} AND CAST(child.${ident(fk.from)} AS TEXT) IN (SELECT record_id FROM demo_records WHERE table_name=?) LIMIT 1`,[fk.table])) throw new Error(`Reset refusé : des données non demo (${table}) référencent le parcours test. Détache ces liens avant de réessayer.`);
        }
        for(const field of ['entity_id','source_id','intervention_id']) if(columns.includes(field) && tables.includes(table)) {
          if(this.db.get(`SELECT 1 FROM ${ident(table)} child WHERE ${real} AND CAST(child.${ident(field)} AS TEXT) IN (SELECT record_id FROM demo_records) LIMIT 1`)) throw new Error(`Reset refusé : référence non demo dans ${table}.`);
        }
      }
      const deleted=this.summary().total;
      // Only the already tracked synthetic ledger may be purged, after backup and real-reference checks.
      this.db.run('UPDATE demo_context SET contract_purge=1 WHERE id=1');
      // Delete children before parents; deferred FKs cover the quote/project and request/intervention cycles.
      for(const table of [...tables].reverse()) this.db.run(`DELETE FROM ${ident(table)} WHERE CAST(${ident(recordKey(table))} AS TEXT) IN (SELECT record_id FROM demo_records WHERE table_name=?)`,[table]);
      if(this.db.all('PRAGMA foreign_key_check').length) throw new Error('Reset annulé : intégrité relationnelle non respectée.');
      this.db.exec('DELETE FROM demo_records; UPDATE demo_context SET batch_id=NULL,contract_purge=0; DELETE FROM demo_batches; COMMIT;');
      return {backupPath,deleted};
    } catch(error) { this.db.exec('ROLLBACK;'); throw error; }
  }
  create(scenario:'vitrine'|'ecommerce'|'maintenance', services: Pick<DatabaseService,'crm'|'catalog'|'quotes'|'projects'|'workflow'|'operations'|'maintenance'|'hourPacks'|'time'>) {
    if(!['vitrine','ecommerce','maintenance'].includes(scenario)) throw new Error('Scénario inconnu.');
    this.installTracking();
    // Reference template is created outside the demo batch and survives reset.
    let template=services.projects.listTemplates().find(t=>t.name==='Parcours AtoumWeb — '+scenario);
    if(!template) {
      const t=services.projects.createTemplate({name:'Parcours AtoumWeb — '+scenario,projectType:scenario});
      services.projects.addTemplateNode(t.currentVersion!.id,{type:'task',name:'Préparer et valider la livraison',required:true});
      services.projects.publishTemplateVersion(t.currentVersion!.id);
      template=services.projects.getTemplate(t.id);
    }
    const batch=this.beginCapture(scenario);
    try {
      const label=scenario==='vitrine'?'Boulangerie Martin':scenario==='ecommerce'?'Atelier des Saveurs':'Association Horizon';
      const org=services.crm.createOrganization({name:'DEMO — '+label,email:'contact@example.test'});
      const contact=services.crm.createContact({organizationId:org.id,firstName:'Camille',lastName:'Martin',email:'camille@example.test'});
      const prospect=services.crm.createProspect({organizationId:org.id,contactId:contact.id,stage:'need_identified',notes:'Données de démonstration — parcours test.'});
      const key=scenario==='maintenance'?'wordpress':scenario;
      services.workflow.saveNeed('prospect',prospect.id,{catalogItemId:'atoumweb-'+key});
      const quote=services.quotes.create({prospectId:prospect.id,subject:'DEMO — '+label+' — '+scenario});
      services.quotes.addCatalogLine(quote.id,services.catalog.getItem('atoumweb-'+key).currentVersion!.id);
      if(scenario==='vitrine') services.quotes.addCatalogLine(quote.id,services.catalog.getItem('atoumweb-article-seo').currentVersion!.id);
      // Explicit demonstration sample, not a real contract. No fictitious administrative configuration or evidence.
      this.db.run('UPDATE quotes SET contract_parameters_json=NULL WHERE id=?',[quote.id]);
      services.quotes.finalize(quote.id);
      const version=services.quotes.transmissionState(quote.id);
      services.quotes.markSent(quote.id,{operationId:randomUUID(),preparationId:version.preparationId,contentHash:version.contentHash!,occurredAt:new Date().toISOString(),channel:'other',provenance:'DEMO — envoi simulé, aucune transmission réelle',confirmed:true});
      new QuoteContractPreparationService(this.db).recordAcceptance(quote.id,'DEMO — acceptation simulée, aucun accord réel',new Date().toISOString(),'Scénario explicitement synthétique');
      const accepted=services.quotes.accept(quote.id);
      const project=services.projects.transformQuote({quoteId:quote.id,templateVersionId:template.currentVersion!.id,targetDate:new Date(Date.now()+21*86400000).toISOString().slice(0,10)});
      const clientId=accepted.clientAccountId!;
      const request=services.operations.createRequest({clientAccountId:clientId,projectId:project.id,subject:'DEMO — Préparer la page Accueil'});
      const intervention=services.operations.transformRequest({requestId:request.id,projectNodeId:project.nodes[0]?.id});
      services.time.addManual({interventionId:intervention.id,category:'production',startedAt:'2026-09-14T08:00:00.000Z',endedAt:'2026-09-14T08:30:00.000Z',billable:true});
      if(scenario==='maintenance') {
        services.maintenance.createSubscription({clientAccountId:clientId,projectId:project.id,planId:services.maintenance.listPlans()[0].id,startDate:new Date().toISOString().slice(0,10)});
        services.hourPacks.create({clientAccountId:clientId,projectId:project.id,name:'DEMO — Forfait 10 h',purchasedSeconds:36000,contractPriceCents:69000});
      }
      return {prospectId:prospect.id,quoteId:quote.id,clientId,projectId:project.id,interventionId:intervention.id};
    } finally { this.endCapture(batch); }
  }
}

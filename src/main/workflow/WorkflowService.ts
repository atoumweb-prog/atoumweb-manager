import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { CrmService } from '../crm/CrmService';
import type { QuoteService } from '../commercial/QuoteService';
import type { ProjectService } from '../projects/ProjectService';
import type { OperationsService } from '../operations/OperationsService';
import type { DashboardEntry, Need, NeedInput, WorkflowIdentity } from '../../shared/workflow';

export class WorkflowService {
  constructor(private db: DatabaseAdapter, private crm: CrmService, private quotes: QuoteService, private projects: ProjectService, private operations: OperationsService) {}
  private owner(owner: 'prospect' | 'client', id: string): string {
    if (!['prospect','client'].includes(owner)) throw new Error('Type de dossier invalide.');
    const table = owner === 'prospect' ? 'prospects' : 'client_accounts';
    if (!this.db.get(`SELECT id FROM ${table} WHERE id=?`, [id])) throw new Error('Dossier introuvable.');
    return owner === 'prospect' ? 'prospect_id' : 'client_account_id';
  }
  private contactsForOrganization(organizationId: string | null): WorkflowIdentity['contacts'] {
    if (!organizationId) return [];
    return this.db.all<{id:string}>(
      'SELECT id FROM contacts WHERE organization_id=? AND archived_at IS NULL ORDER BY last_name COLLATE NOCASE,first_name COLLATE NOCASE',
      [organizationId],
    ).map((row) => this.crm.getContact(row.id));
  }
  needs(owner: 'prospect' | 'client', id: string): Need[] {
    const column = this.owner(owner,id);
    return this.db.all<{ id: string; catalogItemId: string | null; label: string; type: string; otherText: string | null }>(
      `SELECT n.id,n.catalog_item_id AS catalogItemId,COALESCE(i.name,n.other_text) AS label,COALESCE(i.item_type,'other') AS type,n.other_text AS otherText
       FROM crm_needs n LEFT JOIN catalog_items i ON i.id=n.catalog_item_id WHERE n.${column}=? ORDER BY n.created_at,n.id`, [id]);
  }
  saveNeed(owner: 'prospect' | 'client', id: string, input: NeedInput, needId?: string): Need[] {
    const column = this.owner(owner,id);
    const item = input.catalogItemId?.trim() || null;
    const other = item ? null : input.otherText?.trim() || null;
    if (!item && !other) throw new Error('Choisis une prestation ou précise le besoin Autre.');
    if (item && !this.db.get("SELECT id FROM catalog_items WHERE id=? AND status='active'", [item])) throw new Error('Prestation inactive ou introuvable.');
    if (needId && !this.needs(owner,id).some(n => n.id === needId)) throw new Error('Besoin introuvable dans ce dossier.');
    if (needId) this.db.run('UPDATE crm_needs SET catalog_item_id=?,other_text=? WHERE id=?', [item,other,needId]);
    else {
      const client = owner === 'client' ? id : this.db.get<{client_account_id:string|null}>('SELECT client_account_id FROM prospects WHERE id=?',[id])?.client_account_id ?? null;
      this.db.run('INSERT INTO crm_needs (id,prospect_id,client_account_id,catalog_item_id,other_text,created_at) VALUES (?,?,?,?,?,?)', [randomUUID(),owner === 'prospect' ? id : null,client,item,other,new Date().toISOString()]);
    }
    this.log(owner,id,'Besoin / prestation mis à jour');
    return this.needs(owner,id);
  }
  removeNeed(owner: 'prospect' | 'client', id: string, needId: string): Need[] {
    const column=this.owner(owner,id);
    this.db.run(`DELETE FROM crm_needs WHERE id=? AND ${column}=?`,[needId,id]);
    this.log(owner,id,'Rattachement de besoin retiré');
    return this.needs(owner,id);
  }
  identity(owner: 'prospect' | 'client', id: string): WorkflowIdentity {
    this.owner(owner,id);
    if (owner === 'prospect') {
      const row = this.db.get<{organization_id:string|null;contact_id:string|null;decision_maker_contact_id:string|null}>(
        'SELECT organization_id,contact_id,decision_maker_contact_id FROM prospects WHERE id=?',[id],
      )!;
      return {
        organization: row.organization_id ? this.crm.getOrganization(row.organization_id) : null,
        contact: row.contact_id ? this.crm.getContact(row.contact_id) : null,
        decisionMaker: row.decision_maker_contact_id ? this.crm.getContact(row.decision_maker_contact_id) : null,
        contacts: this.contactsForOrganization(row.organization_id),
      };
    }
    const row = this.db.get<{organization_id:string|null;contact_id:string|null}>(
      'SELECT organization_id,primary_contact_id AS contact_id FROM client_accounts WHERE id=?',[id],
    )!;
    return {
      organization: row.organization_id ? this.crm.getOrganization(row.organization_id) : null,
      contact: row.contact_id ? this.crm.getContact(row.contact_id) : null,
      decisionMaker: null,
      contacts: this.contactsForOrganization(row.organization_id),
    };
  }
  setDecisionMaker(prospectId: string, contactId: string | null): WorkflowIdentity {
    this.owner('prospect',prospectId);
    if (contactId) this.crm.getContact(contactId);
    this.db.run('UPDATE prospects SET decision_maker_contact_id=?,updated_at=? WHERE id=?',[contactId,new Date().toISOString(),prospectId]);
    this.log('prospect',prospectId,contactId ? 'Décisionnaire rattaché au prospect' : 'Décisionnaire retiré du prospect');
    this.crm.rebuildSearchIndex();
    return this.identity('prospect',prospectId);
  }
  archiveProspect(id: string, archived: boolean): void {
    this.owner('prospect',id);
    this.db.run('UPDATE prospects SET archived_at=?,updated_at=? WHERE id=?',[archived ? new Date().toISOString() : null,new Date().toISOString(),id]);
    this.log('prospect',id,archived ? 'Prospect archivé' : 'Prospect réactivé');
    this.crm.rebuildSearchIndex();
  }
  private log(owner: string,id: string,summary: string) {
    this.db.run('INSERT INTO activity_events (id,entity_type,entity_id,action,summary,prospect_id,client_account_id,created_at) VALUES (?,?,?,?,?,?,?,?)', [randomUUID(),owner,id,'workflow_updated',summary,owner==='prospect'?id:null,owner==='client'?id:null,new Date().toISOString()]);
  }
  dashboard(): DashboardEntry[] {
    const entries: DashboardEntry[]=[];
    const prospects=this.crm.listProspects();
    for (const p of prospects) {
      if (['won','lost'].includes(p.stage ?? '')) continue;
      const target={entityType:'prospect' as const,entityId:p.id,title:p.displayName,status:p.stage};
      if (p.stage==='follow_up' || p.nextActionAt && p.nextActionAt.slice(0,10)<=new Date().toISOString().slice(0,10)) entries.push({group:'Prospects à relancer',target});
      if (p.stage==='need_identified') entries.push({group:'Besoins à identifier',target});
      if (p.stage==='quote_to_prepare') entries.push({group:'Devis à préparer',target});
      if (p.stage==='quote_to_send') entries.push({group:'Devis à envoyer',target});
      if (p.stage==='quote_sent') entries.push({group:'Devis en attente de retour',target});
    }
    for (const q of this.quotes.list()) {
      const group=q.status==='draft'?'Devis à préparer':['sent','viewed'].includes(q.status)?'Devis en attente de retour':q.status==='accepted' && !this.db.get('SELECT id FROM projects WHERE source_quote_id=?',[q.id])?'Devis acceptés à démarrer':null;
      if(group) entries.push({group,target:{entityType:'quote',entityId:q.id,title:`${q.number} · ${q.subject}`,status:q.status}});
    }
    const labels:Record<string,string>={to_prepare:'Projets à préparer',in_progress:'Projets en cours',waiting_client:'Projets en attente Client',blocked:'Projets bloqués',to_validate:'Projets à valider'};
    const today=new Date().toISOString().slice(0,10), soon=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    for(const p of this.projects.listProjects()) {
      if(!labels[p.status]) continue;
      const target={entityType:'project' as const,entityId:p.id,title:p.name,status:p.status};
      entries.push({group:labels[p.status],target});
      if(p.targetDate && p.targetDate.slice(0,10)<today) entries.push({group:'Projets en retard',target});
      else if(p.targetDate && p.targetDate.slice(0,10)<=soon) entries.push({group:'Échéances proches',target});
    }
    for(const r of this.operations.listRequests()) if(r.status==='new') entries.push({group:'Demandes nouvelles',target:{entityType:'service_request',entityId:r.id,title:r.subject,status:r.status}});
    for(const i of this.operations.listInterventions()) if(['in_progress','to_validate'].includes(i.status)) entries.push({group:i.status==='in_progress'?'Interventions en cours':'Interventions à valider',target:{entityType:'intervention',entityId:i.id,title:i.subject,status:i.status}});
    for(const action of this.db.all<{id:string;owner_type:'prospect'|'client';prospect_id:string|null;client_account_id:string|null;title:string;due_at:string|null}>("SELECT id,owner_type,prospect_id,client_account_id,title,due_at FROM crm_actions WHERE status='open' AND due_at IS NOT NULL ORDER BY due_at")) {
      const day=action.due_at?.slice(0,10)??'',group=day<=today?'Aujourd’hui':day<=soon?'À venir':null;if(!group)continue;
      entries.push({group,target:{entityType:action.owner_type,entityId:(action.prospect_id??action.client_account_id)!,title:action.title,status:day}});
    }
    for(const doc of this.db.all<{id:string;client_account_id:string;title:string;retention_until:string}>("SELECT id,client_account_id,title,retention_until FROM client_documents WHERE archived_at IS NULL AND retention_until IS NOT NULL AND retention_until<=date('now','+90 days') ORDER BY retention_until")) entries.push({group:'RGPD / conservation',target:{entityType:'client_document',entityId:doc.id,parentEntityId:doc.client_account_id,title:doc.title,status:doc.retention_until}});
    return entries;
  }
}

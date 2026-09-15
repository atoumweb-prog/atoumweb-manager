import {existsSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {ActionService} from '../crm/ActionService';
import {ClientDocumentService} from '../crm/ClientDocumentService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from '../commercial/QuoteService';
import {WorkflowService} from '../workflow/WorkflowService';
import {ProjectService} from '../projects/ProjectService';
import {OperationsService} from '../operations/OperationsService';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {applyPendingMigrations,getPendingMigrations} from './migrations';
import {createWorkspacePaths} from '../workspace';

describe('stabilisation commerciale migration 19',()=>{
 let db:NodeSqliteAdapter,crm:CrmService,actions:ActionService,quotes:QuoteService,workflow:WorkflowService,documents:ClientDocumentService,root:string;
 beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-v19-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);crm=new CrmService(db);actions=new ActionService(db);quotes=new QuoteService(db,crm);const workspace=createWorkspacePaths(root);workflow=new WorkflowService(db,crm,quotes,new ProjectService(db,workspace),new OperationsService(db));documents=new ClientDocumentService(db,workspace);});
 afterEach(()=>{db.close();const target=resolve(root);if(!target.startsWith(resolve(tmpdir())))throw Error('Chemin temporaire invalide');rmSync(target,{recursive:true,force:true});});

 it('migre une seule fois les coordonnées historiques et les rend recherchables',()=>{
   const legacy=new NodeSqliteAdapter(':memory:');legacy.exec('PRAGMA foreign_keys=ON');
   for(const migration of getPendingMigrations(legacy).filter(m=>m.id<=18)){legacy.exec(migration.sql);legacy.run('INSERT INTO schema_migrations VALUES (?,?,?)',[migration.id,migration.name,new Date().toISOString()]);}
   legacy.run("INSERT INTO organizations (id,name,email,phone,created_at,updated_at) VALUES ('o','Atoum Test','contact@atoum.test','0102030405','x','x')");
   legacy.run("INSERT INTO prospects (id,organization_id,stage,temperature,created_at,updated_at) VALUES ('p','o','new','warm','x','x')");
   legacy.run("INSERT INTO crm_needs (id,prospect_id,other_text,created_at) VALUES ('n','p','Besoin conservé','x')");
   legacy.run("INSERT INTO activity_events (id,entity_type,entity_id,action,summary,prospect_id,created_at) VALUES ('a','prospect','p','created','Historique conservé','p','x')");
   expect(applyPendingMigrations(legacy).map(m=>m.id)).toEqual([19]);expect(applyPendingMigrations(legacy)).toEqual([]);
   expect(legacy.all('SELECT method_type,value FROM contact_methods ORDER BY method_type')).toEqual([{method_type:'email',value:'contact@atoum.test'},{method_type:'phone',value:'0102030405'}]);
   expect(legacy.get("SELECT other_text FROM crm_needs WHERE id='n'")).toEqual({other_text:'Besoin conservé'});
   expect(legacy.get("SELECT summary FROM activity_events WHERE id='a'")).toEqual({summary:'Historique conservé'});
   expect(legacy.all('PRAGMA foreign_key_check')).toEqual([]);legacy.close();
 });

 it('gère plusieurs coordonnées et les inclut dans la recherche',()=>{const org=crm.createOrganization({name:'Société'});crm.saveContactMethod({organizationId:org.id,type:'email',value:'direction@example.test',isPrimary:true});crm.saveContactMethod({organizationId:org.id,type:'phone',value:'0600000000',label:'Portable'});expect(crm.listContactMethods('organization',org.id)).toHaveLength(2);expect(crm.globalSearch('060000').some(r=>r.entityId===org.id)).toBe(true);});

 it('autorise les besoins vides au départ puis les exige dans le parcours avancé',()=>{const org=crm.createOrganization({name:'Qualification'}),prospect=crm.createProspect({organizationId:org.id});expect(prospect.temperature).toBe('neutral');crm.changeProspectStage(prospect.id,'qualifying');expect(()=>crm.changeProspectStage(prospect.id,'need_identified')).toThrow(/besoin/);workflow.saveNeed('prospect',prospect.id,{otherText:'Refonte'});crm.updateProspectQualification(prospect.id,{projectSummary:'Refonte du site',decisionStatus:'yes',budgetStatus:'not_disclosed',timelineStatus:'note',timelineNote:'Cet automne',existingStatus:'yes'});expect(crm.changeProspectStage(prospect.id,'need_identified').stage).toBe('need_identified');});

 it('finalise puis envoie un devis sans déverrouiller son contenu envoyé',()=>{const org=crm.createOrganization({name:'Devis'}),p=crm.createProspect({organizationId:org.id});workflow.saveNeed('prospect',p.id,{otherText:'Mission'});const q=quotes.create({prospectId:p.id,subject:'Mission'});quotes.addCustomLine(q.id,{label:'Mission',proposedUnitPriceCents:10000});expect(quotes.finalize(q.id).status).toBe('draft');expect(crm.listProspects().find(x=>x.id===p.id)?.stage).toBe('quote_to_send');quotes.markSent(q.id);expect(crm.listProspects().find(x=>x.id===p.id)?.stage).toBe('quote_sent');expect(()=>quotes.addCustomLine(q.id,{label:'Interdit',proposedUnitPriceCents:1})).toThrow(/copie/);});

 it('journalise une relance structurée, crée la récurrence et conserve les documents à l’archivage client',()=>{const org=crm.createOrganization({name:'Client'}),client=crm.createClient({organizationId:org.id});const action=actions.create({ownerType:'client',ownerId:client.id,type:'follow_up',title:'Point mensuel',dueAt:'2030-01-15T09:00:00.000Z',recurrence:'monthly'});const done=actions.complete(action.id,{channel:'phone',outcome:'answered',notes:'Échange réalisé'});expect(done).toMatchObject({completionChannel:'phone',completionOutcome:'answered',completionNotes:'Échange réalisé'});expect(actions.list({ownerType:'client',ownerId:client.id,status:'open'})).toHaveLength(1);const source=join(root,'contrat.txt');writeFileSync(source,'contrat');const imported=documents.importPaths(client.id,[source],{category:'contract',title:'Contrat signé',retentionCode:'contract',retentionReason:'Preuve contractuelle',retentionUntil:'2035-01-01'});expect(imported).toHaveLength(1);crm.archiveClient(client.id);expect(documents.list(client.id)).toHaveLength(1);documents.archive(imported[0].id);documents.deletePermanently(imported[0].id);expect(existsSync(documents.absolutePath(imported[0]))).toBe(false);});
});

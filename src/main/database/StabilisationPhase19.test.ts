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

describe('stabilisation commerciale migrations 19 à 21',()=>{
 let db:NodeSqliteAdapter,crm:CrmService,actions:ActionService,quotes:QuoteService,workflow:WorkflowService,documents:ClientDocumentService,root:string;
 beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-v21-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);crm=new CrmService(db);actions=new ActionService(db);quotes=new QuoteService(db,crm);const workspace=createWorkspacePaths(root);workflow=new WorkflowService(db,crm,quotes,new ProjectService(db,workspace),new OperationsService(db));documents=new ClientDocumentService(db,workspace);});
 afterEach(()=>{db.close();const target=resolve(root);if(!target.startsWith(resolve(tmpdir())))throw Error('Chemin temporaire invalide');rmSync(target,{recursive:true,force:true});});

 it('met à niveau une base 18 jusqu’à l’état courant sans perdre les données commerciales',()=>{
   const legacy=new NodeSqliteAdapter(':memory:');legacy.exec('PRAGMA foreign_keys=ON');
   for(const migration of getPendingMigrations(legacy).filter(m=>m.id<=18)){legacy.exec(migration.sql);legacy.run('INSERT INTO schema_migrations VALUES (?,?,?)',[migration.id,migration.name,new Date().toISOString()]);}
   legacy.run("INSERT INTO organizations (id,name,email,phone,created_at,updated_at) VALUES ('o','Atoum Test','contact@atoum.test','0102030405','x','x')");
   legacy.run("INSERT INTO prospects (id,organization_id,stage,temperature,created_at,updated_at) VALUES ('p','o','new','warm','x','x')");
   legacy.run("INSERT INTO crm_needs (id,prospect_id,other_text,created_at) VALUES ('n','p','Besoin conservé','x')");
   legacy.run("INSERT INTO activity_events (id,entity_type,entity_id,action,summary,prospect_id,created_at) VALUES ('a','prospect','p','created','Historique conservé','p','x')");
   const applied=applyPendingMigrations(legacy).map(m=>m.id);
   expect(applied.slice(0,3)).toEqual([19,20,21]);
   expect(applied).toEqual([19,20,21,22,23,24,25,26,27,28,29,30]);
   expect(applyPendingMigrations(legacy)).toEqual([]);
   expect(legacy.all('SELECT method_type,value FROM contact_methods ORDER BY method_type')).toEqual([{method_type:'email',value:'contact@atoum.test'},{method_type:'phone',value:'0102030405'}]);
   expect(legacy.get("SELECT other_text FROM crm_needs WHERE id='n'")).toEqual({other_text:'Besoin conservé'});
   expect(legacy.get("SELECT summary FROM activity_events WHERE id='a'")).toEqual({summary:'Historique conservé'});
   expect(legacy.get("SELECT origin_type FROM prospects WHERE id='p'")).toEqual({origin_type:'other'});
   expect(legacy.get<{name:string}>("SELECT name FROM pragma_table_info('prospects') WHERE name='decision_maker_contact_id'")?.name).toBe('decision_maker_contact_id');
   expect(legacy.get<{name:string}>("SELECT name FROM pragma_table_info('crm_actions') WHERE name='target_contact_id'")?.name).toBe('target_contact_id');
   expect(legacy.all('PRAGMA foreign_key_check')).toEqual([]);legacy.close();
 });

 it('gère plusieurs coordonnées et les inclut dans la recherche',()=>{const org=crm.createOrganization({name:'Société'});crm.saveContactMethod({organizationId:org.id,type:'email',value:'direction@example.test',isPrimary:true});crm.saveContactMethod({organizationId:org.id,type:'phone',value:'0600000000',label:'Portable'});expect(crm.listContactMethods('organization',org.id)).toHaveLength(2);expect(crm.globalSearch('060000').some(r=>r.entityId===org.id)).toBe(true);});

 it('sépare la qualification de l identification détaillée du besoin',()=>{
   const org=crm.createOrganization({name:'Qualification'}),prospect=crm.createProspect({organizationId:org.id,source:'other'});
   crm.saveContactMethod({organizationId:org.id,type:'email',value:'contact@qualification.test',isPrimary:true});
   expect(prospect.temperature).toBe('neutral');
   crm.changeProspectStage(prospect.id,'qualifying');
   expect(()=>crm.changeProspectStage(prospect.id,'need_identified')).toThrow(/Qualification incomplète/);
   crm.updateProspectQualification(prospect.id,{projectSummary:'Premier échange à approfondir',decisionStatus:'yes'});
   const identified=crm.changeProspectStage(prospect.id,'need_identified');
   expect(identified.stage).toBe('need_identified');
   expect(identified.qualificationValidatedAt).toBeTruthy();
   expect(workflow.needs('prospect',prospect.id)).toHaveLength(0);
 });

 it('rattache le décisionnaire à un vrai Contact sans dupliquer ses coordonnées',()=>{
   const org=crm.createOrganization({name:'Décision'});
   const primary=crm.createContact({organizationId:org.id,firstName:'Lucie',lastName:'Martin'});
   const decision=crm.createContact({organizationId:org.id,firstName:'Marc',lastName:'Martin',jobTitle:'Gérant'});
   const accountant=crm.createContact({organizationId:org.id,firstName:'Anne',lastName:'Compta',jobTitle:'Comptable'});
   crm.saveContactMethod({contactId:decision.id,type:'email',value:'marc@example.test',isPrimary:true});
   const prospect=crm.createProspect({organizationId:org.id,contactId:primary.id,source:'referral'});
   workflow.setDecisionMaker(prospect.id,decision.id);
   crm.updateProspectQualification(prospect.id,{decisionStatus:'no',decisionMakerDetails:'Validation par le gérant'});
   const identity=workflow.identity('prospect',prospect.id);
   expect(identity.decisionMaker?.id).toBe(decision.id);
   expect(identity.decisionMaker?.jobTitle).toBe('Gérant');
   expect(identity.contacts.map(contact=>contact.id).sort()).toEqual([primary.id,decision.id,accountant.id].sort());
   expect(crm.listContactMethods('contact',decision.id).map(method=>method.value)).toEqual(['marc@example.test']);
 });

 it('inclut aussi un interlocuteur individuel sans organisation dans les contacts du workflow',()=>{
   const primary=crm.createContact({firstName:'Solo',lastName:'Prospect'});
   const prospect=crm.createProspect({contactId:primary.id,source:'outbound'});
   const identity=workflow.identity('prospect',prospect.id);
   expect(identity.organization).toBeNull();
   expect(identity.contact?.id).toBe(primary.id);
   expect(identity.contacts.map(contact=>contact.id)).toEqual([primary.id]);
 });

 it('finalise puis envoie un devis sans déverrouiller son contenu envoyé',()=>{const org=crm.createOrganization({name:'Devis'}),p=crm.createProspect({organizationId:org.id});workflow.saveNeed('prospect',p.id,{otherText:'Mission'});const q=quotes.create({prospectId:p.id,subject:'Mission'});quotes.addCustomLine(q.id,{label:'Mission',proposedUnitPriceCents:10000});expect(quotes.finalize(q.id).status).toBe('draft');expect(crm.listProspects().find(x=>x.id===p.id)?.stage).toBe('quote_to_send');quotes.markSent(q.id);expect(crm.listProspects().find(x=>x.id===p.id)?.stage).toBe('quote_sent');expect(()=>quotes.addCustomLine(q.id,{label:'Interdit',proposedUnitPriceCents:1})).toThrow(/copie/);});

 it('journalise une relance structurée, crée la récurrence et conserve les documents à l’archivage client',()=>{const org=crm.createOrganization({name:'Client'}),client=crm.createClient({organizationId:org.id});const action=actions.create({ownerType:'client',ownerId:client.id,type:'follow_up',title:'Point mensuel',dueAt:'2030-01-15T09:00:00.000Z',recurrence:'monthly'});const done=actions.complete(action.id,{channel:'phone',outcome:'answered',notes:'Échange réalisé'});expect(done).toMatchObject({completionChannel:'phone',completionOutcome:'answered',completionNotes:'Échange réalisé'});expect(actions.list({ownerType:'client',ownerId:client.id,status:'open'})).toHaveLength(1);const source=join(root,'contrat.txt');writeFileSync(source,'contrat');const imported=documents.importPaths(client.id,[source],{category:'contract',title:'Contrat signé',retentionCode:'contract',retentionReason:'Preuve contractuelle',retentionUntil:'2035-01-01'});expect(imported).toHaveLength(1);crm.archiveClient(client.id);expect(documents.list(client.id)).toHaveLength(1);documents.archive(imported[0].id);documents.deletePermanently(imported[0].id);expect(existsSync(documents.absolutePath(imported[0]))).toBe(false);});
});

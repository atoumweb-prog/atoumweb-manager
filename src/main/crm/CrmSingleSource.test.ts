import { randomUUID } from 'node:crypto';
import { afterEach,beforeEach,describe,expect,it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from './CrmService';
import { ActionService } from './ActionService';
import { ClientContactService } from './ClientContactService';
let db:NodeSqliteAdapter,crm:CrmService;
beforeEach(()=>{db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);crm=new CrmService(db);});
afterEach(()=>{expect(db.all('PRAGMA foreign_key_check')).toEqual([]);expect(db.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check).toBe('ok');db.close();});
describe('CRM source unique — lot 1',()=>{
 it('creates once, replays after restart and rejects changed payload',()=>{
  const input={operationId:randomUUID(),organization:{name:'TEST société'},contact:{firstName:'TEST',lastName:'Personne',email:'a@example.test'},prospect:{},firstAction:{title:'Appeler'}};
  const first=crm.createProspectAtomic(input);
  expect(new CrmService(db).createProspectAtomic(input).id).toBe(first.id);
  for(const table of ['organizations','contacts','prospects','crm_actions'])expect(db.get<{n:number}>(`SELECT count(*) n FROM ${table}`)?.n).toBe(1);
  expect(()=>crm.createProspectAtomic({...input,firstAction:{title:'Autre'}})).toThrow(/déjà/);
 });
 it('rolls back identities, methods, search and events after late failure',()=>{
  db.exec("CREATE TRIGGER fail_action BEFORE INSERT ON crm_actions BEGIN SELECT RAISE(ABORT,'late failure'); END;");
  expect(()=>crm.createProspectAtomic({operationId:randomUUID(),organization:{name:'TEST rollback',email:'a@example.test'},prospect:{},firstAction:{title:'Appeler'}})).toThrow(/late failure/);
  for(const table of ['organizations','contact_methods','prospects','activity_events','search_documents'])expect(db.get<{n:number}>(`SELECT count(*) n FROM ${table}`)?.n).toBe(0);
 });
 it('reuses selected identities and never revives archived coordinates from legacy columns',()=>{
  const org=crm.createOrganization({name:'TEST',email:'live@example.test'});
  db.run('UPDATE organizations SET email=? WHERE id=?',['old@example.test',org.id]);
  const method=crm.listContactMethods('organization',org.id)[0];crm.archiveContactMethod(method.id);
  const prospect=crm.createProspectAtomic({operationId:randomUUID(),organizationId:org.id,prospect:{}});
  const client=crm.convertProspectToClient(prospect.id);
  expect(crm.getOrganization(org.id).email).toBeNull();expect(crm.getDirectoryOrganization(org.id).email).toBeNull();
  expect(crm.listClients().find(c=>c.id===client.clientId)?.email).toBeNull();
  expect(db.get<{email:string}>('SELECT email FROM organizations WHERE id=?',[org.id])?.email).toBe('old@example.test');
 });
 it('changes only temperature and rejects stale baseline',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id,primaryNeed:'Besoin client',notes:'préserver'});
  crm.updateProspectTemperature(p.id,'neutral','warm');
  expect(()=>crm.updateProspectTemperature(p.id,'neutral','hot')).toThrow(/Conflit/);
  expect(crm.listProspects().find(x=>x.id===p.id)!.notes).toBe('préserver');expect(crm.listProspects().find(x=>x.id===p.id)!.primaryNeed).toBe('Besoin client');
 });
 it('schedules client actions through the action service and includes source history',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id});
  const converted=crm.convertProspectToClient(p.id),client=crm.listClients().find(x=>x.id===converted.clientId)!;
  const at='2027-01-01T09:00:00.000Z';
  crm.scheduleClientAction(client.id,{at:null,text:null},{at,text:'Appeler'});
  expect(new ActionService(db).list({ownerType:'client',ownerId:client.id,status:'open'})).toHaveLength(1);
  expect(()=>crm.scheduleClientAction(client.id,{at:null,text:null},{at,text:'Doublon'})).toThrow(/Conflit/);
  crm.scheduleClientAction(client.id,{at,text:'Appeler'},null);
  expect(new ActionService(db).list({ownerType:'client',ownerId:client.id,status:'open'})).toHaveLength(0);
  expect(crm.listActivity('client',client.id).some(e=>e.entityType==='prospect'&&e.entityId===p.id)).toBe(true);
 });
 it('keeps one person in two companies with independent functions and rejects stale association edits',()=>{
  const a=crm.createOrganization({name:'TEST A'}),b=crm.createOrganization({name:'TEST B'});
  const person=crm.createContact({organizationId:a.id,firstName:'TEST',lastName:'Commun',jobTitle:'Gérante',email:'same@example.test'});
  crm.saveOrganizationContact(b.id,person.id,null,{jobTitle:'Responsable',archivedAt:null});
  expect(crm.getContactForOrganization(person.id,a.id).jobTitle).toBe('Gérante');
  expect(crm.getContactForOrganization(person.id,b.id).jobTitle).toBe('Responsable');
  const old={jobTitle:'Responsable',archivedAt:null};
  crm.saveOrganizationContact(b.id,person.id,old,{jobTitle:'Direction',archivedAt:null});
  expect(()=>crm.saveOrganizationContact(b.id,person.id,old,{jobTitle:'Écraser',archivedAt:null})).toThrow(/Conflit/);
  expect(crm.listOrganizationContacts(person.id)).toHaveLength(2);expect(crm.listDirectoryContacts()).toHaveLength(1);
  expect(crm.listContactMethods('contact',person.id)).toHaveLength(1);
  const current={jobTitle:'Direction',archivedAt:null};crm.saveOrganizationContact(b.id,person.id,current,{jobTitle:'Direction',archivedAt:'2026-10-22'});
  expect(crm.getContactForOrganization(person.id,a.id).jobTitle).toBe('Gérante');
 });
 it('never lets a selected catalogue item replace the expressed need',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id,primaryNeed:'Ancien besoin exprimé'});
  db.run('INSERT INTO crm_needs(id,prospect_id,other_text,created_at) VALUES(?,?,?,?)',[randomUUID(),p.id,'Prestation envisagée','2026']);
  const read=crm.listProspects().find(x=>x.id===p.id)!;
  expect(read.primaryNeed).toBe('Ancien besoin exprimé');expect(read.proposedServices).toBe('Prestation envisagée');
 });
 it('shares company observations without leaking preparation, preserves verification date and detects concurrent research',()=>{
  const org=crm.createOrganization({name:'TEST'}),a=crm.createProspect({organizationId:org.id}),b=crm.createProspect({organizationId:org.id});
  const first=crm.saveProspectResearchSnapshot(a.id,{checkedAt:'2025-01-01',services:['Activité observée'],conversation:{approach:'PRIVÉ DOSSIER A'},opportunities:[{finding:'A',service:'A',priority:'low',keep:true}]});
  const context=crm.prospectResearchContext(b.id);
  expect(context.draft.services).toEqual(['Activité observée']);expect(context.draft.checkedAt).toBe('2025-01-01');
  expect(context.draft.conversation).toBeUndefined();expect(context.draft.opportunities).toEqual([]);
  expect(context.history[0].sharedFromProspectId).toBe(a.id);
  crm.saveProspectResearchIfUnchanged(b.id,context.version,{...context.draft,conversation:{approach:'B'}});
  expect(()=>crm.saveProspectResearchIfUnchanged(b.id,context.version,{services:['stale']})).toThrow(/Conflit/);
  expect(crm.listProspectResearchSnapshots(a.id)[0]).toMatchObject({id:first.id,conversation:{approach:'PRIVÉ DOSSIER A'}});
  const noDate=crm.saveProspectResearchSnapshot(b.id,{source:'Collecte sans vérification'});expect(noDate.checkedAt).toBe('');
 });
 it('keeps initial request, confirmed brief and estimate independent under concurrent saves',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id});
  crm.patchProspectIfUnchanged(p.id,{initialRequest:null},{initialRequest:'Demande reçue'});
  crm.updateProspectQualification(p.id,{projectSummary:'Besoin confirmé'});
  crm.patchProspectIfUnchanged(p.id,{estimatedValueCents:null},{estimatedValueCents:123400});
  expect(()=>crm.patchProspectIfUnchanged(p.id,{initialRequest:null},{initialRequest:'écraser'})).toThrow(/Conflit/);
  expect(crm.listProspects().find(x=>x.id===p.id)).toMatchObject({initialRequest:'Demande reçue',projectSummary:'Besoin confirmé',estimatedValueCents:123400});
 });
 it('rejects stale coordinate edits and rolls back primary selection on duplicate failure',()=>{
  const org=crm.createOrganization({name:'TEST',email:'first@example.test'});
  const first=crm.listContactMethods('organization',org.id)[0];
  const second=crm.saveContactMethod({organizationId:org.id,type:'email',value:'second@example.test'});
  const corrected=crm.saveContactMethod({...first,value:'corrected@example.test'},first.id,first);
  expect(()=>crm.saveContactMethod({...first,value:'stale@example.test'},first.id,first)).toThrow(/Conflit/);
  expect(()=>crm.saveContactMethod({...second,value:corrected.value,isPrimary:true},second.id,second)).toThrow();
  expect(crm.listContactMethods('organization',org.id).find(m=>m.id===first.id)?.isPrimary).toBe(true);
  expect(()=>crm.archiveContactMethod(first.id,true,first)).toThrow(/Conflit/);
 });
 it('creates an action once and rolls back completion if its successor cannot be created',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id}),actions=new ActionService(db);
  const input={operationId:randomUUID(),ownerType:'prospect' as const,ownerId:p.id,type:'action' as const,title:'Appeler'};
  const a=actions.create(input);expect(new ActionService(db).create(input).id).toBe(a.id);
  expect(()=>actions.complete(a.id,{channel:'phone',outcome:'prospect_reached',notes:'échange',nextAction:{ownerType:'prospect',ownerId:'absent',type:'action',title:'Impossible'}})).toThrow();
  expect(actions.list({ownerType:'prospect',ownerId:p.id})[0].status).toBe('open');
  expect(crm.listActivity('prospect',p.id).filter(e=>e.action==='action_completed')).toHaveLength(0);
 });
 it('keeps original action ownership after conversion and projects the same next action on Client',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id}),actions=new ActionService(db);
  const a=actions.create({ownerType:'prospect',ownerId:p.id,type:'follow_up',title:'Rappel antérieur',dueAt:'2027-02-01T09:00:00Z'});
  const client=crm.convertProspectToClient(p.id);
  expect(actions.list({ownerType:'client',ownerId:client.clientId})[0]).toMatchObject({id:a.id,ownerType:'prospect',ownerId:p.id});
  expect(crm.listClients().find(c=>c.id===client.clientId)?.nextActionText).toBe('Rappel antérieur');
  actions.complete(a.id,{channel:'phone',outcome:'prospect_reached',notes:'Réponse réelle',nextAction:null});
  expect(crm.listClients().find(c=>c.id===client.clientId)?.nextActionAt).toBeNull();
  expect(crm.listProspects({includeArchived:true}).find(c=>c.id===p.id)?.lastExchangeAt).toBeTruthy();
 });
 it('reuses an existing person as a Client contact without changing the other company function',()=>{
  const a=crm.createOrganization({name:'TEST A'}),b=crm.createOrganization({name:'TEST B'});
  const person=crm.createContact({organizationId:a.id,firstName:'Camille',lastName:'TEST',jobTitle:'Direction'}),client=crm.createClient({organizationId:b.id});
  const contacts=new ClientContactService(db,crm),input={firstName:'',lastName:''};
  const link=contacts.add(client.id,input,'billing',false,person.id);
  expect(contacts.add(client.id,input,'billing',false,person.id).id).toBe(link.id);
  expect(crm.listDirectoryContacts()).toHaveLength(1);expect(crm.listOrganizationContacts(person.id)).toHaveLength(2);
  expect(crm.getContactForOrganization(person.id,a.id).jobTitle).toBe('Direction');
  expect(contacts.list(client.id)[0].contact.jobTitle).toBeNull();
 });
 it('adopts a saved research opportunity explicitly, retaining its source and rejecting conflicts',()=>{
  const org=crm.createOrganization({name:'TEST'}),p=crm.createProspect({organizationId:org.id});
  const source=crm.saveProspectResearchSnapshot(p.id,{opportunities:[{finding:'Constat',service:'Piste',priority:'high',keep:true}]});
  crm.adoptResearchOpportunity(p.id,source.id,0,null);
  expect(()=>crm.adoptResearchOpportunity(p.id,source.id,0,null)).toThrow(/Conflit/);
  expect(crm.listActivity('prospect',p.id).find(e=>e.action==='research_opportunity_adopted')?.metadata).toMatchObject({snapshotId:source.id,index:0});
  expect(crm.listProspectResearchSnapshots(p.id)[0].id).toBe(source.id);
 });
});

describe('Primary contact selection',()=>{
 it('selects a linked person without copying and rejects stale or unrelated selection',()=>{
  const a=crm.createOrganization({name:'TEST Entreprise'}),b=crm.createOrganization({name:'TEST Autre'});
  const first=crm.createContact({organizationId:a.id,firstName:'Un',lastName:'TEST'}),second=crm.createContact({organizationId:a.id,firstName:'Deux',lastName:'TEST'}),outside=crm.createContact({organizationId:b.id,firstName:'Trois',lastName:'TEST'});
  const p=crm.createProspect({organizationId:a.id,contactId:first.id});
  expect(()=>crm.patchProspectIfUnchanged(p.id,{contactId:first.id},{contactId:outside.id})).toThrow(/Associe/);
  crm.patchProspectIfUnchanged(p.id,{contactId:first.id},{contactId:second.id});
  expect(crm.listProspects().find(x=>x.id===p.id)?.contactId).toBe(second.id);
  expect(()=>crm.patchProspectIfUnchanged(p.id,{contactId:first.id},{contactId:first.id})).toThrow(/Conflit/);
  expect(crm.listDirectoryContacts()).toHaveLength(3);
 });
});

describe('Website single source editor',()=>{
 it('updates canonical URL and shared presence atomically, preserves preparation and rejects stale writes',()=>{
  const org=crm.createOrganization({name:'TEST Site'}),a=crm.createProspect({organizationId:org.id}),b=crm.createProspect({organizationId:org.id});
  crm.saveProspectResearchSnapshot(a.id,{checkedAt:null,services:['TEST'],conversation:{approach:'Préparation privée'}});
  const before=crm.prospectResearchContext(a.id);crm.saveProspectWebsite(a.id,before.version,null,'present','exemple.test');
  expect(crm.getOrganization(org.id).website).toBe('https://exemple.test');
  expect(crm.prospectResearchContext(b.id).draft.website?.presence).toBe('present');
  expect(crm.prospectResearchContext(a.id).draft.conversation?.approach).toBe('Préparation privée');
  expect(()=>crm.saveProspectWebsite(a.id,before.version,null,'absent',null)).toThrow(/Conflit/);
  expect(crm.getOrganization(org.id).website).toBe('https://exemple.test');
  const fresh=crm.prospectResearchContext(a.id);crm.saveProspectWebsite(a.id,fresh.version,'https://exemple.test','absent',null);
  expect(crm.getOrganization(org.id).website).toBeNull();expect(crm.prospectResearchContext(b.id).draft.website?.presence).toBe('absent');
  expect(crm.prospectResearchContext(a.id).history.length).toBe(3);
 });
});

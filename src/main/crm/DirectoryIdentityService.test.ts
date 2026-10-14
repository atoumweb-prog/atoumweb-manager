import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from './CrmService';

let db: NodeSqliteAdapter, crm: CrmService;
beforeEach(() => { db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON;'); applyPendingMigrations(db); crm = new CrmService(db); });
afterEach(() => { expect(db.all('PRAGMA foreign_key_check')).toEqual([]); expect(db.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check).toBe('ok'); db.close(); });
const count = (table: string) => Number(db.get<{n:number}>('SELECT count(*) n FROM '+table)?.n);

describe('03E existing identity sources and atomic Directory writes', () => {
  it('creates organization and both methods atomically; a lost-response replay returns the exact same ID', () => {
    const input={name:'TEST Annuaire',email:'directory@example.test',phone:'0612345678'},context={operationId:randomUUID()};
    const first=crm.saveDirectoryOrganization(input,context),events=count('activity_events');
    const replay=new CrmService(db).saveDirectoryOrganization(input,context);
    expect(replay.id).toBe(first.id);expect(count('organizations')).toBe(1);
    expect(crm.listContactMethods('organization',first.id)).toHaveLength(2);
    expect(count('activity_events')).toBe(events);expect(count('client_accounts')).toBe(0);expect(count('quotes')).toBe(0);
    expect(()=>crm.saveDirectoryOrganization({...input,name:'Different draft'},context)).toThrow(/déjà enregistrée/);
    expect(crm.getOrganization(first.id).name).toBe(input.name);
  });
  it('creates contact with methods once and never converts a commercial account', () => {
    const input={firstName:'TEST',lastName:'CONTACT',email:'person@example.test',phone:'0612345678'},context={operationId:randomUUID()};
    const first=crm.saveDirectoryContact(input,context);
    expect(crm.saveDirectoryContact(input,context).id).toBe(first.id);
    expect(count('contacts')).toBe(1);expect(crm.listContactMethods('contact',first.id)).toHaveLength(2);
    expect(count('client_accounts')).toBe(0);expect(count('prospects')).toBe(0);
  });
  it.each(['organization','contact'] as const)('rolls back %s, methods, search and activity after failure in the second method', type => {
    const before={organizations:count('organizations'),contacts:count('contacts'),events:count('activity_events'),search:count('search_documents')};
    db.exec("CREATE TRIGGER fail_directory_phone BEFORE INSERT ON contact_methods WHEN NEW.method_type='phone' BEGIN SELECT RAISE(ABORT,'Injected phone failure'); END;");
    const context={operationId:randomUUID()};
    expect(()=>type==='organization'?crm.saveDirectoryOrganization({name:'Rollback',email:'a@example.test',phone:'0612345678'},context):crm.saveDirectoryContact({firstName:'Rollback',lastName:'TEMP',email:'a@example.test',phone:'0612345678'},context)).toThrow(/Injected phone/);
    expect({organizations:count('organizations'),contacts:count('contacts'),events:count('activity_events'),search:count('search_documents')}).toEqual(before);
    expect(count('contact_methods')).toBe(0);
  });
  it('refuses stale organization edits and leaves unrelated coordinates and links intact', () => {
    const org=crm.createOrganization({name:'Original',email:'raw@example.test'});
    const client=crm.createClient({organizationId:org.id});const prospect=crm.createProspect({organizationId:org.id});
    crm.saveDirectoryOrganization({...org,name:'Window A'},{id:org.id,expected:org});
    const events=count('activity_events');
    expect(()=>new CrmService(db).saveDirectoryOrganization({...org,name:'Window B'},{id:org.id,expected:org})).toThrow(/Conflit/);
    expect(crm.getOrganization(org.id).name).toBe('Window A');expect(crm.getOrganization(org.id).email).toBe('raw@example.test');
    expect(crm.listClients().find(c=>c.id===client.id)?.organizationId).toBe(org.id);
    expect(crm.listProspects().find(p=>p.id===prospect.id)?.stage).toBe('new');expect(count('activity_events')).toBe(events);
  });
  it('detects contact edits without relying on updatedAt timestamp resolution', () => {
    const person=crm.createContact({firstName:'Before',lastName:'Name'});
    crm.saveDirectoryContact({...person,jobTitle:'Window A'},{id:person.id,expected:person});
    // Even identical timestamps cannot conceal the differing editable field.
    db.run('UPDATE contacts SET updated_at=? WHERE id=?',[person.updatedAt,person.id]);
    expect(()=>crm.saveDirectoryContact({...person,firstName:'Window B'},{id:person.id,expected:person})).toThrow(/Conflit/);
    expect(crm.getContact(person.id).jobTitle).toBe('Window A');expect(crm.getContact(person.id).firstName).toBe('Before');
  });
  it('rolls back both identities if the second baseline conflicts, including journals',()=>{
    const org=crm.createOrganization({name:'Before organization'}),person=crm.createContact({organizationId:org.id,firstName:'Before',lastName:'Contact'});
    crm.updateContact(person.id,{...person,jobTitle:'External'});
    const events=count('activity_events');
    expect(()=>crm.saveExistingDirectoryIdentities({organization:{id:org.id,input:{...org,name:'Local organization'},expected:org},contact:{id:person.id,input:{...person,firstName:'Local'},expected:person}})).toThrow(/Conflit/);
    expect(crm.getOrganization(org.id).name).toBe('Before organization');expect(crm.getContact(person.id).jobTitle).toBe('External');expect(count('activity_events')).toBe(events);
  });
  it('requires an explicit expected baseline for updates and a request ID for creation', () => {
    const person=crm.createContact({firstName:'TEST',lastName:'Identity'});
    expect(()=>crm.saveDirectoryContact({...person,firstName:'Unsafe'},{id:person.id})).toThrow(/Conflit/);
    expect(()=>crm.saveDirectoryOrganization({name:'No token'},{})).toThrow(/Identifiant/);
    expect(crm.getContact(person.id).firstName).toBe('TEST');
  });
  it('records verification explicitly without turning updatedAt into a verification date', () => {
    const org=crm.createOrganization({name:'Verified'}),first=crm.directoryVerification('organization',org.id);
    expect(first.verifiedAt).toBeNull();
    const verified=crm.verifyDirectoryIdentity('organization',org.id,first.currentFingerprint);
    expect(verified.verifiedAt).toBeTruthy();expect(verified.source).toBe('manual-manager');expect(verified.verifiedFingerprint).toBe(verified.currentFingerprint);
    expect(crm.getOrganization(org.id).updatedAt).toBe(org.updatedAt);
    crm.saveContactMethod({organizationId:org.id,type:'email',value:'changed@example.test',isPrimary:true});
    const changed=crm.directoryVerification('organization',org.id);
    expect(changed.verifiedAt).toBe(verified.verifiedAt);expect(changed.currentFingerprint).not.toBe(changed.verifiedFingerprint);
    expect(()=>crm.verifyDirectoryIdentity('organization',org.id,verified.currentFingerprint)).toThrow(/ont changé/);
    expect(crm.listActivity('organization',org.id).filter(e=>e.action==='identity_verified')).toHaveLength(1);
  });
  it('keeps one organization/contact/client across repeated Prospect conversion', () => {
    const org=crm.saveDirectoryOrganization({name:'Shared identity'},{operationId:randomUUID()});
    const person=crm.saveDirectoryContact({organizationId:org.id,firstName:'Shared',lastName:'Person',email:'shared@example.test'},{operationId:randomUUID()});
    const prospect=crm.createProspect({organizationId:org.id,contactId:person.id});
    const first=crm.convertProspectToClient(prospect.id),second=crm.convertProspectToClient(prospect.id);
    expect(second.clientId).toBe(first.clientId);expect(count('client_accounts')).toBe(1);expect(count('organizations')).toBe(1);expect(count('contacts')).toBe(1);
    expect(crm.listContactMethods('contact',person.id)[0].value).toBe('shared@example.test');
  });
});

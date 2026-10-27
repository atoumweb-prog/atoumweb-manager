import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
let db:NodeSqliteAdapter,crm:CrmService,quotes:QuoteService,id:string,need:{id:string;catalogItemId:null;otherText:string};
beforeEach(()=>{db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);crm=new CrmService(db);quotes=new QuoteService(db,crm);const org=crm.createOrganization({name:'TEST Préparation'});const p=crm.createProspect({organizationId:org.id,stage:'need_identified',projectSummary:'Présenter les boutiques',budgetStatus:'not_disclosed',timelineStatus:'not_disclosed',decisionStatus:'unknown'});id=p.id;db.run("UPDATE prospects SET project_summary=?,budget_status='not_disclosed',timeline_status='not_disclosed',decision_status='unknown' WHERE id=?",['Présenter les boutiques',id]);need={id:'test-need',catalogItemId:null,otherText:'Site vitrine'};db.run('INSERT INTO crm_needs(id,prospect_id,catalog_item_id,other_text,created_at) VALUES(?,?,?,?,?)',[need.id,id,null,need.otherText,new Date().toISOString()]);});
afterEach(()=>db.close());
const current=()=>crm.listProspects({includeArchived:true}).find(p=>p.id===id)!;
describe('Prepare quote inside a prospect',()=>{
 it('creates an empty draft, reuses it on replay and never prices an intent',()=>{const p=current(),q=quotes.prepareProspectDraft(id,p.updatedAt,[need]);expect(q.lines).toHaveLength(0);expect(q.contractValueCents).toBe(0);expect(q.needSummary).toBe('Présenter les boutiques');expect(current().stage).toBe('quote_to_prepare');expect(quotes.prepareProspectDraft(id,p.updatedAt,[need]).id).toBe(q.id);expect(quotes.list({prospectId:id})).toHaveLength(1);});
 it('rejects changed needs without reserving a quote number or changing the stage',()=>{const p=current();db.run('UPDATE crm_needs SET other_text=? WHERE id=?',['Autre demande',need.id]);expect(()=>quotes.prepareProspectDraft(id,p.updatedAt,[need])).toThrow(/Conflit/);expect(quotes.list({prospectId:id})).toHaveLength(0);expect(current().stage).toBe('need_identified');});
 it('rejects stale dossier and blocking information',()=>{expect(()=>quotes.prepareProspectDraft(id,'stale',[need])).toThrow(/Conflit/);db.run('UPDATE prospects SET missing_information=? WHERE id=?',['Budget à confirmer',id]);const p=current();expect(()=>quotes.prepareProspectDraft(id,p.updatedAt,[need])).toThrow(/Budget à confirmer/);expect(quotes.list({prospectId:id})).toHaveLength(0);});
 it('does not let consultation of quote create it from a new dossier',()=>{db.run("UPDATE prospects SET stage='new' WHERE id=?",[id]);expect(()=>quotes.prepareProspectDraft(id,current().updatedAt,[need])).toThrow(/qualification/);expect(quotes.list({prospectId:id})).toHaveLength(0);});
});

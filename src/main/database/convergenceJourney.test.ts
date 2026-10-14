import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {applyPendingMigrations} from './migrations';
import {createWorkspacePaths} from '../workspace';
import {projectCompositionFixture} from '../testSupport/projectCompositionFixture';
import {OperationsService} from '../operations/OperationsService';
import {HourPackService} from '../operations/HourPackService';
import {MaintenanceOverageService} from '../operations/MaintenanceOverageService';
import {InterventionCompletionService} from '../operations/InterventionCompletionService';
import {BillingHandoffService} from '../billing/BillingHandoffService';
import {TimeService} from '../time/TimeService';

describe('Convergence 04–10 — same identities from sale to production and operations',()=>{
 it('preserves the signed contract, exact seconds, one debit and one billing handoff through backup/restore',()=>{
  const root=mkdtempSync(join(tmpdir(),'atoumweb-full-convergence-')),db=new NodeSqliteAdapter(':memory:');
  let restored:NodeSqliteAdapter|undefined;
  try{
   db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);
   const f=projectCompositionFixture(db,createWorkspacePaths(root));
   const q=f.createQuote('Synthetic convergence — no real signature');
   const prospect=db.get<{organization_id:string}>('SELECT organization_id FROM prospects WHERE id=?',[q.prospectId!])!;
   const org=prospect.organization_id,orgCount=db.get<{n:number}>('SELECT COUNT(*) n FROM organizations')!.n;
   const price=q.contractValueCents,project=f.projects.commercial.prepare({quoteId:q.id});
   expect(project.commercialState).toBe('provisional');expect(db.all('SELECT id FROM client_accounts')).toHaveLength(0);
   f.accept(q.id);const accepted=f.quotes.get(q.id),client=(accepted.acceptedClientAccountId??accepted.clientAccountId)!;
   expect(client).toBeTruthy();expect(f.projects.getProject(project.id).commercialState).toBe('frozen');
   expect(db.get<{organization_id:string}>('SELECT organization_id FROM client_accounts WHERE id=?',[client])!.organization_id).toBe(org);
   expect(db.get<{n:number}>('SELECT COUNT(*) n FROM organizations')!.n).toBe(orgCount);
   expect(f.crm.convertProspectToClient(q.prospectId!).clientId).toBe(client);
   const contract=accepted.contractTextSnapshot!;expect(contract.length).toBeGreaterThan(20);
   const newer=f.catalog.createVersion(f.offer.id,{priceMode:'fixed',priceCents:99999});f.catalog.publishVersion(newer.id);
   expect(f.quotes.get(q.id).contractValueCents).toBe(price);expect(f.quotes.get(q.id).contractTextSnapshot).toBe(contract);
   const operations=new OperationsService(db),packs=new HourPackService(db),billing=new BillingHandoffService(db);
   const completion=new InterventionCompletionService(db,operations,packs,billing,new MaintenanceOverageService(db,billing));
   const time=new TimeService(db),pack=packs.create({clientAccountId:client,projectId:project.id,name:'Synthetic exact seconds',purchasedSeconds:3600,contractPriceCents:12000});
   const intervention=operations.createIntervention({clientAccountId:client,projectId:project.id,hourPackId:pack.id,type:'support',coverageMode:'hour_pack',subject:'Pack',status:'in_progress'});
   const session=time.addManual({projectId:project.id,interventionId:intervention.id,category:'support',startedAt:'2026-10-14T08:00:00Z',endedAt:'2026-10-14T08:31:19Z'});
   expect(packs.previewInterventionDebit(pack.id,intervention.id).secondsToDebit).toBe(1879);
   completion.complete(intervention.id);completion.complete(intervention.id);
   expect(packs.get(pack.id).balanceSeconds).toBe(1721);
   expect(packs.get(pack.id).movements.filter(m=>m.type==='intervention_debit')).toHaveLength(1);
   const outside=operations.createIntervention({clientAccountId:client,projectId:project.id,type:'support',coverageMode:'out_of_scope',subject:'Explicit invoice preparation',status:'in_progress',billableAmountCents:9000});
   time.addManual({projectId:project.id,interventionId:outside.id,category:'support',startedAt:'2026-10-14T09:00:00Z',endedAt:'2026-10-14T09:20:13Z'});
   completion.complete(outside.id);completion.complete(outside.id);
   const handoffs=billing.list({sourceType:'intervention'});expect(handoffs).toHaveLength(1);expect(handoffs[0].status).toBe('ready');expect(handoffs[0].sourceId).toBe(outside.id);
   const tables=['organizations','client_accounts','quotes','quote_lines','quote_contract_clauses','projects','project_nodes','time_sessions','time_session_pauses','hour_pack_movements','billing_items'];
   const snapshot=(source:NodeSqliteAdapter)=>tables.map(table=>({table,rows:source.all('SELECT * FROM '+table).map(row=>JSON.stringify(row)).sort()}));
   const before=snapshot(db),backup=join(root,'verified.sqlite');db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");
   restored=new NodeSqliteAdapter(backup);restored.exec('PRAGMA foreign_keys=ON');expect(snapshot(restored)).toEqual(before);expect(applyPendingMigrations(restored)).toEqual([]);
   expect(restored.get('SELECT * FROM time_sessions WHERE id=?',[session.id])).toEqual(db.get('SELECT * FROM time_sessions WHERE id=?',[session.id]));
   expect(restored.all('PRAGMA foreign_key_check')).toEqual([]);expect(restored.get('PRAGMA integrity_check')?.integrity_check).toBe('ok');
   expect(f.quotes.get(q.id).contractTextSnapshot).toBe(contract);
  }finally{restored?.close();db.close();if(!root.startsWith(join(tmpdir(),'atoumweb-full-convergence-')))throw Error('Unsafe fixture');rmSync(root,{recursive:true,force:true});}
 });
});

import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ContractSectionReviewService} from './ContractSectionReviewService';

let db:NodeSqliteAdapter, service:ContractSectionReviewService;
beforeEach(()=>{
  db=new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  applyPendingMigrations(db);
  service=new ContractSectionReviewService(db);
});
afterEach(()=>db.close());
function clauseVersion():string {
  const id='c-'+Math.random().toString(36).slice(2),version='v-'+Math.random().toString(36).slice(2),time=new Date().toISOString();
  db.run(`INSERT INTO contract_clause_templates (id,code,title,scope,status,sort_order,created_at,updated_at)
    VALUES (?,?,?,'base','active',0,?,?)`,[id,id,id,time,time]);
  db.run(`INSERT INTO contract_clause_versions (id,clause_id,version_number,body,status,created_at)
    VALUES (?,?,1,'test','draft',?)`,[version,id,time]);
  return version;
}
describe('05C — versioned section review in SQLite',()=>{
 it('keeps every old version unclassified by default, without any automatic backfill',()=>{
   const id=clauseVersion();expect(service.get(id)).toEqual({status:'unclassified',sectionKey:null,rankInSection:null});
   expect(db.get<{n:number}>('SELECT count(*) AS n FROM contract_clause_section_reviews')?.n).toBe(0);
 });
 it('requires an explicit proposal and a named human approval',()=>{
   const id=clauseVersion();
   expect(()=>service.approve(id,'Alice')).toThrow(/proposition explicite/);
   expect(service.propose(id,'finance',3,'Paiement de maintenance')).toEqual({status:'proposed',sectionKey:'finance',rankInSection:3,reason:'Paiement de maintenance'});
   expect(service.get(id).status).toBe('proposed');
   expect(()=>service.approve(id,'')).toThrow(/valideur/);
   expect(service.approve(id,'Relecteur AtoumWeb','2026-10-14T18:00:00Z')).toEqual({status:'approved',sectionKey:'finance',rankInSection:3,reviewer:'Relecteur AtoumWeb',reviewedAt:'2026-10-14T18:00:00Z'});
   expect(()=>service.propose(id,'recurring',0,'Autre')).toThrow(/Classement approuvé/);
 });
 it('keeps distinct metadata for two versions and rejects missing source references',()=>{
   const a=clauseVersion(),b=clauseVersion();
   service.propose(a,'finance',0,'Prix');service.propose(b,'recurring',0,'Quotas');
   expect(service.get(a)).toMatchObject({sectionKey:'finance'});
   expect(service.get(b)).toMatchObject({sectionKey:'recurring'});
   expect(()=>service.propose('missing','finance',0,'texte')).toThrow(/introuvable/);
   expect(()=>service.get('missing')).toThrow(/Version de clause introuvable/);
   expect(()=>service.approve('missing','Relecteur')).toThrow(/Version de clause introuvable/);
   expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
 });
 it('rejects invalid rank and preserves existing clause body',()=>{
   const id=clauseVersion();const before=db.get<{body:string}>('SELECT body FROM contract_clause_versions WHERE id=?',[id])?.body;
   expect(()=>service.propose(id,'finance',-1,'texte')).toThrow(/invalide/);
   service.propose(id,'finance',0,'Texte contrôlé');
   expect(db.get<{body:string}>('SELECT body FROM contract_clause_versions WHERE id=?',[id])?.body).toBe(before);
   expect(db.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check).toBe('ok');
 });
});

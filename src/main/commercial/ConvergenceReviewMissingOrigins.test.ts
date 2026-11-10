import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {ApprovedPackService} from './ApprovedPackService';
import {ConvergenceReviewService} from './ConvergenceReviewService';

describe('Historical convergence with absent source identities',()=>{
 it.each([false,true])('reports conflicts without mutation or code-based substitution (approved pack=%s)',imported=>{
  const db=new NodeSqliteAdapter(':memory:');try{
   applyPendingMigrations(db);
   if(imported){const pack=new ApprovedPackService(db);pack.apply(pack.simulate().planSha256);}
   const before=db.all('SELECT * FROM contract_clause_versions ORDER BY id');
   const result=new ConvergenceReviewService(db).simulate();
   expect(result.contract.anomalies.length).toBeGreaterThan(0);
   expect(result.contract.rows.length).toBeGreaterThan(0);
   expect(result.contract.rows.every(r=>r.draftVersionId===null&&r.dependencies.length===0)).toBe(true);
   expect(db.all('SELECT * FROM contract_clause_versions ORDER BY id')).toEqual(before);
   expect(db.all('SELECT * FROM contract_convergence_decisions')).toEqual([]);
  }finally{db.close();}
 });
});

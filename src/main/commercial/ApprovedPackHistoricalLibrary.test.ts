import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import type {SqlValue} from '../database/DatabaseAdapter';
import {ApprovedPackService} from './ApprovedPackService';

it('prepares 119 candidates over the versioned 118-clause historical fixture without duplicating or replacing its identities',()=>{
 const db=new NodeSqliteAdapter(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);
  const published=JSON.parse(readFileSync('data/handoff/2026-10-27/contrats-publies.json','utf8')).tables as Record<string,Record<string,SqlValue>[]>;
  for(const t of published.contract_clause_templates){
   const v=published.contract_clause_versions.find(v=>v.id===t.current_version_id)!;
   db.run(`INSERT INTO contract_clause_templates(id,code,title,scope,status,sort_order,current_version_id,created_at,updated_at,archived_at,audience) VALUES(?,?,?,?,?,?,NULL,?,?,?,?)`,[t.id,t.code,t.title,t.scope,t.status,t.sort_order,t.created_at,t.updated_at,t.archived_at,t.audience]);
   db.run(`INSERT INTO contract_clause_versions(id,clause_id,version_number,title,body,status,published_at,created_at,review_metadata_json) VALUES(?,?,?,?,?,?,?,?,?)`,[v.id,v.clause_id,v.version_number,t.title,v.body,v.status,v.published_at,v.created_at,JSON.stringify(v.review_metadata)]);
   db.run('UPDATE contract_clause_templates SET current_version_id=? WHERE id=?',[v.id,t.id]);
  }
  const before=db.all('SELECT * FROM contract_clause_versions'),identities=db.all('SELECT id,code,title,scope,audience,sort_order,current_version_id FROM contract_clause_templates');
  const s=new ApprovedPackService(db),plan=s.simulate();expect(plan.blockers).toEqual([]);const result=s.apply(plan.planSha256);expect(result.contracts.counts.draftsKept).toBe(119);
  expect(db.get<{n:number}>('SELECT count(*) AS n FROM contract_clause_templates')?.n).toBe(119);
  for(const v of before)expect(db.get('SELECT * FROM contract_clause_versions WHERE id=?',[String(v.id)])).toEqual(v);
  for(const t of identities)expect(db.get('SELECT id,code,title,scope,audience,sort_order,current_version_id FROM contract_clause_templates WHERE id=?',[String(t.id)])).toEqual(t);
  s.apply(s.simulate().planSha256);expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
 }finally{db.close();}
},20000);

import {describe,expect,it} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {MIGRATIONS,applyPendingMigrations} from './migrations';
import {CONTRACT_SECTION_REVIEW_MIGRATION} from './contractSectionReviewMigration';

describe('lot 05 — migration 69 staged behind lots 04',()=>{
 it('reserves 69 without reusing 67/68; history of 1–66 remains unchanged',()=>{
   expect(CONTRACT_SECTION_REVIEW_MIGRATION.id).toBe(69);
   expect(CONTRACT_SECTION_REVIEW_MIGRATION.name).toBe('contract_clause_section_review_v1');
   expect(MIGRATIONS.filter(m=>m.id<=66)).toHaveLength(66);
   expect(new Set(MIGRATIONS.map(m=>m.id)).size).toBe(MIGRATIONS.length);
   expect(MIGRATIONS.some(m=>m.id===67||m.id===68)).toBe(false);
 });
 it('preserves a temporary 1–66 history when 04 IDs 67 and 68 are present',()=>{
   const db=new NodeSqliteAdapter(':memory:');
   try{
     db.exec('PRAGMA foreign_keys=ON;');
     applyPendingMigrations(db);
     const before=db.all('SELECT id,name,applied_at FROM schema_migrations WHERE id<=66 ORDER BY id');
     // Only simulated lot-04 ledger records, not their actual DDL.
     db.run('INSERT INTO schema_migrations(id,name,applied_at) VALUES(?,?,?)',[67,'lot_04_catalogue_fixture','2026-10-14T00:00:00Z']);
     db.run('INSERT INTO schema_migrations(id,name,applied_at) VALUES(?,?,?)',[68,'lot_04_recommendations_fixture','2026-10-14T00:00:00Z']);
     const contract=db.get<{name:string}>('SELECT name FROM schema_migrations WHERE id=?',[69]);
     expect(contract?.name).toBe('contract_clause_section_review_v1');
     expect(db.all('SELECT id,name,applied_at FROM schema_migrations WHERE id<=66 ORDER BY id')).toEqual(before);
     expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
     expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});
   }finally{db.close();}
 });
});

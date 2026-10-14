import {describe,expect,it} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {MIGRATIONS,applyPendingMigrations,getPendingMigrations} from './migrations';

describe('convergence 04 → 05 : véritables migrations 67, 68, 69',()=>{
 it('préserve les 66 migrations du socle, l’ordre réel et la non-réapplication',()=>{
   expect(MIGRATIONS.filter(m=>m.id>=67).map(m=>[m.id,m.name])).toEqual([
     [67,'catalog_category_registry_v1'],
     [68,'catalog_version_recommendations_v1'],
     [69,'contract_clause_section_review_v1'],
   ]);
   const db=new NodeSqliteAdapter(':memory:');
   db.exec('PRAGMA foreign_keys=ON;');
   try{
     const history=applyPendingMigrations(db);
     expect(history.map(m=>m.id)).toEqual(MIGRATIONS.map(m=>m.id));
     expect(db.all('SELECT id,name FROM schema_migrations WHERE id>=67 ORDER BY id')).toEqual([
       {id:67,name:'catalog_category_registry_v1'},
       {id:68,name:'catalog_version_recommendations_v1'},
       {id:69,name:'contract_clause_section_review_v1'},
     ]);
     expect(db.get<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='contract_clause_section_reviews'")?.name).toBe('contract_clause_section_reviews');
     expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
     expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});
     expect(getPendingMigrations(db)).toEqual([]);
     expect(applyPendingMigrations(db)).toEqual([]);
   }finally{db.close();}
 });
});

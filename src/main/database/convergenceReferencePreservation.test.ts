import {describe,expect,it} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {applyPendingMigrations,getPendingMigrations,MIGRATIONS} from './migrations';

function fixture66() {
  const db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');
  for(const m of getPendingMigrations(db).filter(m=>m.id<=66)) {
    db.exec(m.sql);db.run('INSERT INTO schema_migrations VALUES (?,?,?)',[m.id,m.name,'2026-10-01']);
  }
  db.run(`INSERT INTO contract_clause_templates(id,code,title,scope,status,sort_order,created_at,updated_at)
    VALUES ('clause','TEST-PRESERVE','Référence exacte','base','active',0,'2026-10-01','2026-10-01')`);
  db.run(`INSERT INTO contract_clause_versions(id,clause_id,version_number,body,status,created_at)
    VALUES ('published','clause',1,'CGV exactes — accents,\nparagraphes et espaces.','published','2026-10-01')`);
  db.run(`INSERT INTO contract_clause_versions(id,clause_id,version_number,body,status,created_at)
    VALUES ('draft','clause',2,'Brouillon à conserver intégralement.','draft','2026-10-02')`);
  db.run(`INSERT INTO time_sessions(id,category,started_at,ended_at,billable,created_at,updated_at)
    VALUES ('session','development','2026-10-01T09:00:00Z','2026-10-01T10:00:17Z',0,'2026-10-01','2026-10-01')`);
  db.run(`INSERT INTO time_session_pauses(id,time_session_id,started_at,ended_at,created_at)
    VALUES ('pause','session','2026-10-01T09:15:00Z','2026-10-01T09:30:00Z','2026-10-01')`);
  return db;
}
function protectedRows(db:NodeSqliteAdapter) {
  return ['contract_clause_templates','contract_clause_versions','time_sessions','time_session_pauses'].map(table=>{
    const columns=db.all<{name:string}>('PRAGMA table_info('+table+')').map(column=>column.name).filter(name=>name!=='title'||table!=='contract_clause_versions');
    return db.all('SELECT '+columns.map(name=>'"'+name+'"').join(',')+' FROM '+table+' ORDER BY id');
  });
}
describe('convergence 04+05 — références contractuelles et temps historiques',()=>{
  it('has the exact final registry 1–71 and preserves published/draft texts, IDs, timestamps and seconds from 66',()=>{
    const db=fixture66();try {
      const before=protectedRows(db);const ledger=db.all('SELECT * FROM schema_migrations ORDER BY id');
      expect(MIGRATIONS.map(m=>m.id)).toEqual(Array.from({length:77},(_,i)=>i+1));
      expect(applyPendingMigrations(db).map(m=>({id:m.id,name:m.name}))).toEqual([
        {id:67,name:'catalog_category_registry_v1'},{id:68,name:'catalog_version_recommendations_v1'},
        {id:69,name:'contract_clause_section_review_v1'},{id:70,name:'catalog_recommendation_details_v1'},{id:71,name:'quote_contract_transmission_v1'}, {id:72,name:'crm_single_source_reconciliation'}, {id:73,name:'crm_initial_request_and_legacy_brief'}, {id:74,name:'crm_organization_contact_links'}, {id:75,name:'contact_postal_address'}, {id:76,name:'contract_editorial_drafts_and_versioned_titles'}, {id:77,name:'contract_convergence_human_approval'},
      ]);
      expect(protectedRows(db)).toEqual(before);expect(db.all('SELECT * FROM schema_migrations WHERE id<=66 ORDER BY id')).toEqual(ledger);
      expect(applyPendingMigrations(db)).toEqual([]);expect(protectedRows(db)).toEqual(before);
      expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    }finally{db.close();}
  });
  it('rolls back a failed 70 and resumes without rewriting contracts, time or already applied migrations',()=>{
    const db=fixture66(),migration=MIGRATIONS.find(m=>m.id===70)!,sql=migration.sql;
    try {
      const before=protectedRows(db);migration.sql=sql+'; SELECT * FROM injected_missing_table;';
      expect(()=>applyPendingMigrations(db)).toThrow(/injected_missing_table/);
      expect(db.get('SELECT id FROM schema_migrations WHERE id=70')).toBeUndefined();expect(protectedRows(db)).toEqual(before);
      const ledger=db.all('SELECT * FROM schema_migrations ORDER BY id');migration.sql=sql;
      expect(applyPendingMigrations(db).map(m=>m.id)).toEqual([70,71,72,73,74,75,76,77]);
      expect(db.all('SELECT * FROM schema_migrations WHERE id<70 ORDER BY id')).toEqual(ledger);expect(protectedRows(db)).toEqual(before);
      expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    }finally{migration.sql=sql;db.close();}
  });
});

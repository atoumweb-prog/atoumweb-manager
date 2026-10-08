import {expect,it} from 'vitest';
import {NodeSqliteAdapter} from './NodeSqliteAdapter';
import {MIGRATIONS,ensureMigrationTable,applyPendingMigrations} from './migrations';
it('migrations63–65 : chaque cellule historique conservée, nouveaux raccords vides et rejeu neutre',()=>{
  const db=new NodeSqliteAdapter(':memory:');try{
    db.exec('PRAGMA foreign_keys=ON');ensureMigrationTable(db);
    for(const m of MIGRATIONS.filter(m=>m.id<=62)){db.exec(m.sql);db.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.id,m.name,'fixture']);}
    const tables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const before=tables.map(t=>({name:t.name,columns:db.all<{name:string}>(`PRAGMA table_info(${t.name})`).map(c=>c.name),rows:db.all('SELECT * FROM '+t.name)}));
    expect(applyPendingMigrations(db).map(m=>m.id)).toEqual(MIGRATIONS.filter(m=>m.id>=63).map(m=>m.id));
    for(const t of before)if(t.name!=='schema_migrations')expect(db.all(`SELECT ${t.columns.join(',')} FROM ${t.name}`)).toEqual(t.rows);
    for(const name of ['catalog_commercial_rules','quote_line_parameters','operational_sales','operational_sale_targets'])expect(db.all('SELECT * FROM '+name)).toEqual([]);
    expect(db.all('SELECT reference_minutes,business_category FROM maintenance_checklist_template_items').every(r=>r.reference_minutes===null&&r.business_category===null)).toBe(true);
    expect(applyPendingMigrations(db)).toEqual([]);expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  }finally{db.close();}
});

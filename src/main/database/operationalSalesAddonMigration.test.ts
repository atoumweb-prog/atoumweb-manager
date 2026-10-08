import { expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { MIGRATIONS, ensureMigrationTable, applyPendingMigrations } from './migrations';
import { CrmService } from '../crm/CrmService';
import { HourPackService } from '../operations/HourPackService';

it('migration65 : chaque vente et toutes ses relations existantes conservées, rejeu neutre',()=>{
 const db=new NodeSqliteAdapter(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');ensureMigrationTable(db);for(const m of MIGRATIONS.filter(m=>m.id<=64)){if(m.disableForeignKeys)db.exec('PRAGMA foreign_keys=OFF');db.exec(m.sql);db.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.id,m.name,'fixture']);if(m.disableForeignKeys)db.exec('PRAGMA foreign_keys=ON');}
  const crm=new CrmService(db),client=crm.createClient({organizationId:crm.createOrganization({name:'TEST migration65'}).id});
  const pack=new HourPackService(db).create({clientAccountId:client.id,name:'TEST crédit historique',purchasedSeconds:18000,contractPriceCents:29900});
  db.run("INSERT INTO quotes(id,quote_number,client_account_id,accepted_client_account_id,subject,status,created_at,updated_at) VALUES('q','DEV-TEST',?,?,'TEST','accepted','fixture','fixture')",[client.id,client.id]);
  db.run("INSERT INTO quote_lines(id,quote_id,source,catalog_item_id,catalog_version_id,label,created_at,updated_at) VALUES('line','q','catalog','atoumweb-web','atoumweb-web-v1','TEST','fixture','fixture')");
  db.run("INSERT INTO operational_import_runs VALUES('run','source','payload','{}','fixture')");db.run("INSERT INTO operational_model_versions VALUES('model','atoumweb-web','AW-TEST',1,'ready','run','hash','{}','fixture')");
  db.run("INSERT INTO catalog_operational_links(id,catalog_version_id,model_version_id,revision,provenance_json,created_at) VALUES('link','atoumweb-web-v1','model',1,'{}','fixture')");db.run("UPDATE catalog_operational_links SET status='ready' WHERE id='link'");
  db.run(`INSERT INTO operational_sales(id,quote_line_id,catalog_version_id,operational_link_id,model_version_id,client_account_id,kind,hour_pack_id,policy_snapshot_json,parameters_snapshot_json,created_at)
    VALUES('sale','line','atoumweb-web-v1','link','model',?,'hour_pack',?,'{}','{}','fixture')`,[client.id,pack.id]);
  db.run("INSERT INTO operational_sale_targets(sale_id,state) VALUES('sale','active')");
  const before=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t=>({name:t.name,columns:db.all<{name:string}>(`PRAGMA table_info(${t.name})`).map(c=>c.name),rows:db.all('SELECT * FROM '+t.name)}));
  expect(applyPendingMigrations(db).map(m=>m.id)).toEqual(MIGRATIONS.filter(m=>m.id>=65).map(m=>m.id));
  for(const table of before)if(table.name!=='schema_migrations')expect(db.all(`SELECT ${table.columns.join(',')} FROM ${table.name}`)).toEqual(table.rows);
  expect(db.all('PRAGMA foreign_key_check')).toEqual([]);expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});expect(applyPendingMigrations(db)).toEqual([]);
 }finally{db.close();}
});

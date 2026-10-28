import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe,expect,it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { MIGRATIONS,applyPendingMigrations } from './migrations';
describe('CRM legacy reconciliation on representative SQLite copies',()=>{
 it('preserves conflicts and archives, imports safe values once, and avoids duplicate reminders',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'crm-reconcile-')),original=new NodeSqliteAdapter(join(dir,'old.sqlite'));
  let copy:NodeSqliteAdapter|undefined;
  try{
   original.exec('PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(id INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL) STRICT;');
   for(const m of MIGRATIONS.filter(m=>m.id<=71)){if(m.disableForeignKeys)original.exec('PRAGMA foreign_keys=OFF');original.exec(m.sql);original.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.id,m.name,'2026-01-01']);if(m.disableForeignKeys)original.exec('PRAGMA foreign_keys=ON');}
   for(const [id,email] of [['safe',' SAFE@example.test '],['archived','old@example.test'],['conflict','other@example.test'],['invalid','not email']])original.run("INSERT INTO organizations(id,name,email,created_at,updated_at) VALUES(?,?,?,'2026','2026')",[id,id,email]);
   original.exec("INSERT INTO contact_methods(id,organization_id,method_type,value,is_primary,created_at,updated_at,archived_at) VALUES('arch','archived','email','old@example.test',0,'2026','2026','2026'); INSERT INTO contact_methods(id,organization_id,method_type,value,is_primary,created_at,updated_at) VALUES('live','conflict','email','live@example.test',1,'2026','2026');");
   original.exec("INSERT INTO client_accounts(id,organization_id,status,became_client_at,next_action_at,next_action_text,created_at,updated_at) VALUES('future','safe','active','2026','2099-01-01T09:00:00Z','Appeler','2026','2026'),('past','invalid','active','2026','2020-01-01','Ancien','2026','2026');");
   await original.backupTo(join(dir,'copy.sqlite'));copy=new NodeSqliteAdapter(join(dir,'copy.sqlite'));copy.exec('PRAGMA foreign_keys=ON');
   applyPendingMigrations(copy);
   const dispositions=copy.all<{owner_id:string;disposition:string}>("SELECT owner_id,disposition FROM crm_reconciliation WHERE field='email' ORDER BY owner_id");
   expect(dispositions).toEqual([{owner_id:'archived',disposition:'archived'},{owner_id:'conflict',disposition:'conflict'},{owner_id:'invalid',disposition:'invalid'},{owner_id:'safe',disposition:'imported'}]);
   expect(copy.get<{value:string}>("SELECT value FROM contact_methods WHERE organization_id='safe'")?.value).toBe('safe@example.test');
   expect(copy.all("SELECT * FROM crm_actions WHERE client_account_id='future'")).toHaveLength(1);
   expect(copy.all("SELECT * FROM crm_actions WHERE client_account_id='past'")).toHaveLength(0);
   expect(copy.get<{email:string}>("SELECT email FROM organizations WHERE id='safe'")?.email).toBe(' SAFE@example.test ');
   expect(applyPendingMigrations(copy)).toEqual([]);expect(copy.all('PRAGMA foreign_key_check')).toEqual([]);
   expect(original.get<{n:number}>('SELECT max(id) n FROM schema_migrations')?.n).toBe(71);
  }finally{copy?.close();original.close();rmSync(dir,{recursive:true,force:true});}
 });
});

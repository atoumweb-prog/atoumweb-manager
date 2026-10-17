import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,existsSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {expect,it} from 'vitest';
import {openReadOnlyWorkspaceSnapshot} from './WorkspaceSnapshotDatabase';
it('refuses a WAL header before SQLite opens it and leaves source bytes unchanged',()=>{
 const root=mkdtempSync(join(tmpdir(),'ec04-wal-read-')),file=join(root,'fixture.sqlite');
 try{const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL;CREATE TABLE test(id INTEGER)');db.close();
 const before=readFileSync(file);expect(existsSync(file+'-wal')).toBe(false);
 expect(()=>openReadOnlyWorkspaceSnapshot(file)).toThrow(/lecture WAL/);
 expect(existsSync(file+'-wal')).toBe(false);expect(existsSync(file+'-shm')).toBe(false);
 expect(readFileSync(file).equals(before)).toBe(true);
 }finally{rmSync(root,{recursive:true,force:true});}
});

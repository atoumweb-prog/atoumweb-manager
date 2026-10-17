import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

const root=process.cwd();
const business=readFileSync(join(root,'src/main/backups/businessBackupsIpc.ts'),'utf8');
const referentials=readFileSync(join(root,'src/main/referentials/referentialsIpc.ts'),'utf8');

function handler(text:string,name:string):string {
  const all=[...text.matchAll(/ipcMain\.handle\('([^']+)'/g)].map(x=>({name:x[1],index:x.index!}));
  const current=all.filter(x=>x.name===name);
  if(current.length!==1)throw Error('Route missing or duplicate '+name);
  return text.slice(current[0].index,all.find(x=>x.index>current[0].index)?.index??text.length);
}

describe('EC04 IPC sources: hidden writes in backup and library readers',()=>{
  it('covers every business backup read that internally refreshes missing_at',()=>{
    for(const name of [
      'business-backups:list','business-backups:get','business-backups:overview',
      'business-backup-alerts:list',
    ])expect(handler(business,name),name).toContain('mutate(() =>');
  });
  it('covers relocalization cancellation fallback through list()',()=>{
    const code=handler(business,'business-backups:relocalize');
    expect(code).toContain('await mutate(() => database.businessBackups.list().find(');
    expect(code).toContain('return mutate(() => {');
  });
  it('guards asset folders, path getters and cancellation without locking dialogs',()=>{
    const imp=handler(referentials,'referentials:library:assets:import');
    expect(imp.indexOf('const defaultPath = await mutate(')).toBeLessThan(imp.indexOf('dialog.showOpenDialog'));
    expect(imp).toContain('return mutate(() => database.atoumWebTechnicalAssets.list(versionId))');
    for(const name of ['referentials:library:assets:open-file','referentials:library:assets:open-folder']){
      const h=handler(referentials,name);
      expect(h.indexOf('await mutate(')).toBeLessThan(h.indexOf('shell.openPath('));
    }
  });
});

 it('serializes implicit legacy document hash backfill in quote views and document opening',()=>{
   const code=readFileSync(join(root,'src/main/ipc.ts'),'utf8');
   for(const name of ['quote-preparation:get','quote-preparation:open-document','quotes:open-contract-document']){
     expect(handler(code,name),name).toContain('guardedMutation(');
   }
 });

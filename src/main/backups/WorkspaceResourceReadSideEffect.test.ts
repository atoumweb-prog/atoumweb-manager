import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

const source=readFileSync(join(process.cwd(),'src/main/ipc.ts'),'utf8');
const starts=[...source.matchAll(/ipcMain\.handle\('([^']+)'/g)].map(x=>({name:x[1],at:x.index!}));
function handler(name:string):string {
  const found=starts.filter(x=>x.name===name);
  if(found.length!==1)throw Error('Missing/duplicate IPC route: '+name);
  return source.slice(found[0].at,starts.find(x=>x.at>found[0].at)?.at??source.length);
}
describe('EC04: side-effectful project resource readers',()=>{
  it('guards resource list and open-file because map() can update SQLite',()=>{
    for(const name of ['projects:resources:list','projects:resources:open-file']){
      expect(handler(name),name).toContain('guardedMutation(');
    }
  });
  it('rechecks relocalized resource inside the gate after the picker',()=>{
    const h=handler('projects:resources:relocalize');
    expect(h.indexOf('dialog.showOpenDialog')).toBeLessThan(h.indexOf('const current = database.projectResources.get(id)'));
    expect(h).toContain('current.relativePath !== resource.relativePath');
    expect(h).toContain('current.checksumSha256 !== resource.checksumSha256');
  });
  it('gates the listing on cancellation of the file import',()=>{
    const h=handler('projects:resources:import-files');
    expect(h).toContain('return guardedMutation(() => database.projectResources.list(projectId))');
  });
});

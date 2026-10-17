import {afterEach,describe,expect,it,vi} from 'vitest';
import {WorkspaceMutationGate} from '../backups/WorkspaceMutationGate';
import type {DatabaseService} from '../database/DatabaseService';
import {registerReferentialsIpcHandlers} from './referentialsIpc';

const handlers=vi.hoisted(()=>new Map<string,(...args:any[])=>unknown>());
vi.mock('electron',()=>({
  ipcMain:{handle:(name:string,handler:(...args:any[])=>unknown)=>handlers.set(name,handler)},
  dialog:{showOpenDialog:vi.fn()},shell:{openPath:vi.fn(),showItemInFolder:vi.fn()},
}));
afterEach(()=>handlers.clear());

describe('EC04 shared gate - AtoumWeb library and composition exports',()=>{
  it('protects creation and package export with one gate across windows',async()=>{
    const gate=new WorkspaceMutationGate(),operations:string[]=[];
    const database={
      atoumWebTechnicalLibrary:{create:(item:{name:string})=>{operations.push('create:'+item.name);return {id:'item-1'};}},
      atoumWebCompositionPackages:{exportPackage:(id:string)=>{operations.push('export:'+id);return '/tmp/package.zip';}},
    } as unknown as DatabaseService;
    registerReferentialsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const created=handlers.get('referentials:library:create')!(null,{name:'Bloc'},{}) as Promise<{id:string}>;
    const exported=handlers.get('referentials:compositions:export-package')!(null,'comp-1') as Promise<string>;
    expect(operations).toEqual([]);
    await lease.release();
    expect(await created).toEqual({id:'item-1'});
    expect(await exported).toBe('/tmp/package.zip');
    expect(operations).toEqual(['create:Bloc','export:comp-1']);
  });

  it('protects asset lists that may refresh the missing_at column',async()=>{
    const gate=new WorkspaceMutationGate(),events:string[]=[];
    const database={
      atoumWebTechnicalAssets:{list:(version:string)=>{events.push(version);return [];} },
    } as unknown as DatabaseService;
    registerReferentialsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const pending=handlers.get('referentials:library:assets:list')!(null,'version-1') as Promise<unknown>;
    expect(events).toEqual([]);
    await lease.release(); await pending;
    expect(events).toEqual(['version-1']);
  });
});

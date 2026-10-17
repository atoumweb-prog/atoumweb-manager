import {afterEach,describe,expect,it,vi} from 'vitest';
import {WorkspaceMutationGate} from '../backups/WorkspaceMutationGate';
import type {DatabaseService} from '../database/DatabaseService';
import {registerOperationsIpcHandlers} from './operationsIpc';

const handlers=vi.hoisted(()=>new Map<string,(...args:any[])=>unknown>());
vi.mock('electron',()=>({ipcMain:{handle:(name:string,handler:(...args:any[])=>unknown)=>handlers.set(name,handler)}}));
afterEach(()=>handlers.clear());

describe('EC04 guarded operational transactions',()=>{
  it('queues interventions and keeps hour-pack creation with billing in one permit',async()=>{
    const gate=new WorkspaceMutationGate(),writes:string[]=[];
    const database={
      operations:{createIntervention:(input:{label:string})=>{writes.push('intervention:'+input.label);return {id:'intervention-1'};}},
      hourPacks:{create:(input:{name:string})=>{writes.push('pack:'+input.name);return {id:'pack-1'};}},
      billingHandoff:{ensureForHourPack:(id:string)=>{writes.push('billing:'+id);}},
    } as unknown as DatabaseService;
    registerOperationsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const create=handlers.get('operations:interventions:create')!(null,{label:'maintenance'}) as Promise<{id:string}>;
    const pack=handlers.get('operations:hour-packs:create')!(null,{name:'Forfait'}) as Promise<{id:string}>;
    expect(writes).toEqual([]);
    await lease.release();
    expect(await create).toEqual({id:'intervention-1'});
    expect(await pack).toEqual({id:'pack-1'});
    expect(writes).toEqual(['intervention:maintenance','pack:Forfait','billing:pack-1']);
    expect(gate.activeMutations).toBe(0);
  });
  it('rechecks closure criteria inside the permit after waiting',async()=>{
    const gate=new WorkspaceMutationGate(),checks:string[]=[];
    const database={
      maintenanceOverages:{review:(id:string)=>{checks.push('review:'+id);return {unresolvedCount:1};}},
      maintenance:{changePeriodStatus:()=>{checks.push('closed');return {};}},
    } as unknown as DatabaseService;
    registerOperationsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const closure=handlers.get('operations:maintenance:periods:change-status')!(null,'period-1','closed') as Promise<unknown>;
    expect(checks).toEqual([]);
    await lease.release();
    await expect(closure).rejects.toThrow(/Décide du traitement/);
    expect(checks).toEqual(['review:period-1']);
  });
});

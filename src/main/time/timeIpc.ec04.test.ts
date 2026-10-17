import {afterEach,describe,expect,it,vi} from 'vitest';
import {WorkspaceMutationGate} from '../backups/WorkspaceMutationGate';
import type {DatabaseService} from '../database/DatabaseService';
import {registerTimeCorrectionIpcHandler} from './timeIpc';

const handlers = vi.hoisted(() => new Map<string,(...args:any[])=>unknown>());
vi.mock('electron',()=>({ipcMain:{handle:(name:string,handler:(...args:any[])=>unknown)=>handlers.set(name,handler)}}));
afterEach(()=>handlers.clear());

describe('EC04 shared gate - time corrections and time switch',()=>{
  it('holds both time mutators during a capture and preserves arguments/results',async()=>{
    const gate = new WorkspaceMutationGate();
    const writes: string[]=[];
    const database={
      timeCorrections:{update:(id:string,input:{note:string})=>{writes.push('update:'+id+':'+input.note);return {id};}},
      timeSwitches:{switchTo:(input:{activityLabel:string})=>{writes.push('switch:'+input.activityLabel);return {session:'new'};}},
    } as unknown as DatabaseService;
    registerTimeCorrectionIpcHandler(database,gate);
    const lease=await gate.acquire();
    const update=handlers.get('time:update')!(null,'id-1',{note:'retouche'}) as Promise<{id:string}>;
    const change=handlers.get('time:switch')!(null,{activityLabel:'Projet A'}) as Promise<{session:string}>;
    await Promise.resolve();
    expect(writes).toEqual([]);
    await lease.release();
    expect(await update).toEqual({id:'id-1'});
    expect(await change).toEqual({session:'new'});
    expect(writes).toEqual(['update:id-1:retouche','switch:Projet A']);
  });
  it('keeps the original synchronous signature when registered without EC04',()=>{
    const database={timeCorrections:{update:()=>42},timeSwitches:{switchTo:()=>19}} as unknown as DatabaseService;
    registerTimeCorrectionIpcHandler(database);
    expect(handlers.get('time:update')!(null,'x',{})).toBe(42);
    expect(handlers.get('time:switch')!(null,{})).toBe(19);
  });
});

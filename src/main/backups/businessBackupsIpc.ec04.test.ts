import {afterEach,describe,expect,it,vi} from 'vitest';
import {WorkspaceMutationGate} from './WorkspaceMutationGate';
import type {DatabaseService} from '../database/DatabaseService';
import {registerBusinessBackupsIpcHandlers} from './businessBackupsIpc';

const handlers=vi.hoisted(()=>new Map<string,(...args:any[])=>unknown>());
vi.mock('electron',()=>({
  ipcMain:{handle:(name:string,handler:(...args:any[])=>unknown)=>handlers.set(name,handler)},
  dialog:{showOpenDialog:vi.fn(async()=>({canceled:false,filePaths:['/new/site-backup.zip']}))},
  shell:{openPath:vi.fn()},
}));
afterEach(()=>handlers.clear());

describe('EC04 gated business backup registry',()=>{
  it('defers recording a backup while the workspace writer pause is active',async()=>{
    const gate=new WorkspaceMutationGate(),operations:string[]=[];
    const database={businessBackups:{create:(input:{label:string})=>{operations.push(input.label);return {id:'backup-1'};}}} as unknown as DatabaseService;
    registerBusinessBackupsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const pending=handlers.get('business-backups:create')!(null,{label:'Copie avant maintenance'}) as Promise<{id:string}>;
    expect(operations).toEqual([]);
    await lease.release();
    expect(await pending).toEqual({id:'backup-1'});
    expect(operations).toEqual(['Copie avant maintenance']);
  });
  it('rejects stale relocalization after a dialog, with a recheck inside the gate',async()=>{
    const gate=new WorkspaceMutationGate();
    let path='/old/site-backup.zip',relocated=false;
    const database={businessBackups:{
      absoluteLocalPath:()=>path,
      relocalizePath:()=>{relocated=true;return {};},
    }} as unknown as DatabaseService;
    registerBusinessBackupsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const pending=handlers.get('business-backups:relocalize')!(null,'location-1') as Promise<unknown>;
    await Promise.resolve();
    path='/changed-by-another-window/site-backup.zip';
    await lease.release();
    await expect(pending).rejects.toThrow(/Emplacement modifié/);
    expect(relocated).toBe(false);
  });
  it('queues list/get/overview and alert list because local missing flags may update SQLite',async()=>{
    const gate=new WorkspaceMutationGate(),observed:string[]=[];
    const backup={
      list:()=>{observed.push('list');return [];},
      get:(id:string)=>{observed.push('get:'+id);return {id};},
      overview:()=>{observed.push('overview');return {totalRecords:0};},
    };
    const database={
      businessBackups:backup,
      businessBackupAlerts:{listAlerts:()=>{observed.push('alerts');return [];}},
    } as unknown as DatabaseService;
    registerBusinessBackupsIpcHandlers(database,gate);
    const lease=await gate.acquire();
    const pending=[
      handlers.get('business-backups:list')!(null) as Promise<unknown>,
      handlers.get('business-backups:get')!(null,'b1') as Promise<unknown>,
      handlers.get('business-backups:overview')!(null) as Promise<unknown>,
      handlers.get('business-backup-alerts:list')!(null) as Promise<unknown>,
    ];
    expect(observed).toEqual([]);
    await lease.release();
    await Promise.all(pending);
    expect(observed).toEqual(['list','get:b1','overview','alerts']);
  });

});

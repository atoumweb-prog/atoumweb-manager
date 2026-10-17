import {describe,expect,it} from 'vitest';
import {WorkspaceMutationGate} from './WorkspaceMutationGate';
import {guardIpcMutation, runWorkspaceMutationIfAvailable} from './WorkspaceMutationIpcBoundary';

function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done;});return {resolve,promise};}

describe('EC04: opt-in guard for complete IPC mutation',()=>{
  it('keeps async file+SQLite operations from two windows behind pause',async()=>{
    const gate=new WorkspaceMutationGate(), hold=deferred(), done:string[]=[];
    const handler=guardIpcMutation(gate,async (event:{sender:string},id:string)=>{
      done.push('file-'+event.sender+'-'+id);
      if(id==='first')await hold.promise;
      done.push('sqlite-'+event.sender+'-'+id);
      return id;
    });
    const first=handler({sender:'window-A'},'first');
    const pause=gate.acquire(1000);
    const second=handler({sender:'window-B'},'second');
    hold.resolve(); await first;
    const lease=await pause;
    expect(done).toEqual(['file-window-A-first','sqlite-window-A-first']);
    await lease.release();
    expect(await second).toBe('second');
    expect(done).toEqual(['file-window-A-first','sqlite-window-A-first','file-window-B-second','sqlite-window-B-second']);
  });

  it('does not lose return values and propagates errors after releasing permits',async()=>{
    const gate=new WorkspaceMutationGate();
    const good=guardIpcMutation(gate,(event:{sender:number},n:number)=>event.sender+n);
    expect(await good({sender:5},4)).toBe(9);
    const bad=guardIpcMutation(gate,async()=>{throw Error('sqlite failure');});
    await expect(bad()).rejects.toThrow('sqlite failure');
    expect(gate.activeMutations).toBe(0);
    const lease=await gate.acquire(); await lease.release();
  });
});

describe('EC04: staged mutation handler registration', () => {
  it('preserves synchronous return and exceptions in legacy isolated fixtures', () => {
    expect(runWorkspaceMutationIfAvailable(undefined, () => 17)).toBe(17);
    expect(() => runWorkspaceMutationIfAvailable(undefined, () => { throw Error('legacy fixture'); })).toThrow('legacy fixture');
  });
  it('keeps actions queued across an active capture pause, even from another window', async () => {
    const gate = new WorkspaceMutationGate();
    const lease = await gate.acquire();
    const operations: string[] = [];
    const first = runWorkspaceMutationIfAvailable(gate, () => {operations.push('document import'); return 1;});
    const second = runWorkspaceMutationIfAvailable(gate, () => {operations.push('project import'); return 2;});
    await Promise.resolve();
    expect(operations).toEqual([]);
    await lease.release();
    expect(await first).toBe(1);
    expect(await second).toBe(2);
    expect(operations).toEqual(['document import','project import']);
  });
  it('propagates a protected write failure and frees the permit for later work', async () => {
    const gate = new WorkspaceMutationGate();
    await expect(runWorkspaceMutationIfAvailable(gate, () => {throw Error('copy failed');})).rejects.toThrow('copy failed');
    expect(gate.activeMutations).toBe(0);
    const lease = await gate.acquire();
    await lease.release();
  });
});

import {describe,expect,it} from 'vitest';
import {WorkspaceMutationGate} from './WorkspaceMutationGate';
import {runWorkspaceMutationIfAvailable} from './WorkspaceMutationIpcBoundary';

function deferred() { let resolve!: () => void;const promise=new Promise<void>(done=>{resolve=done;});return {promise,resolve}; }

describe('EC04 representative contract mutation scheduling (fake persistence only)',()=>{
  it('does not interleave quote transmission and document attach with an active capture',async()=>{
    const gate=new WorkspaceMutationGate(), barrier=deferred(),events:string[]=[];
    const unfinished=runWorkspaceMutationIfAvailable(gate,async()=>{
      events.push('copy:begin');
      await barrier.promise;
      events.push('document:linked');
    });
    const pausing=gate.acquire(5000);
    const later=runWorkspaceMutationIfAvailable(gate,()=>{
      events.push('send:attested');
    });
    barrier.resolve();
    await unfinished;
    const lease=await pausing;
    expect(events).toEqual(['copy:begin','document:linked']);
    expect(gate.activeMutations).toBe(0);
    await lease.release();
    await later;
    expect(events).toEqual(['copy:begin','document:linked','send:attested']);
  });

  it('makes a failed contract operation release the mutation permit',async()=>{
    const gate=new WorkspaceMutationGate();
    await expect(runWorkspaceMutationIfAvailable(gate,()=>{
      throw new Error('PDF absent');
    })).rejects.toThrow('PDF absent');
    const lease=await gate.acquire();
    await lease.release();
    expect(gate.activeMutations).toBe(0);
  });
});

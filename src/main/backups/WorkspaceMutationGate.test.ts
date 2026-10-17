import {describe, expect, it} from 'vitest';
import {WorkspaceMutationGate} from './WorkspaceMutationGate';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {resolve = done;});
  return {promise, resolve};
}

describe('EC04: cooperative write-drain gate (isolated, not connected to IPC)', () => {
  it('drains an in-flight async file+SQLite mutation before pausing', async () => {
    const gate = new WorkspaceMutationGate();
    const held = deferred();
    const order: string[] = [];
    const first = gate.runMutation(async () => {
      order.push('first-start');
      await held.promise;
      order.push('first-end');
    });
    const paused = gate.acquire();
    const queued = gate.runMutation(async () => {order.push('queued');});
    expect(gate.paused).toBe(true);
    expect(gate.activeMutations).toBe(1);
    held.resolve(); await first;
    const lease = await paused;
    expect(order).toEqual(['first-start', 'first-end']);
    expect(gate.activeMutations).toBe(0);
    await lease.release();
    await queued;
    expect(order).toEqual(['first-start', 'first-end', 'queued']);
    expect(gate.paused).toBe(false);
  });

  it('resumes queued work after timeout while an earlier task remains active', async () => {
    const gate = new WorkspaceMutationGate();
    const held = deferred();
    const ongoing = gate.runMutation(() => held.promise);
    const waiting = gate.acquire(40);
    const queued = gate.runMutation(() => 123);
    await expect(waiting).rejects.toThrow(/délai/);
    expect(await queued).toBe(123);
    expect(gate.paused).toBe(false);
    held.resolve(); await ongoing;
    expect(gate.activeMutations).toBe(0);
  });

  it('never leaves the gate occupied after work failure', async () => {
    const gate = new WorkspaceMutationGate();
    await expect(gate.runMutation(() => {throw Error('fixture failure');})).rejects.toThrow(/fixture failure/);
    expect(gate.activeMutations).toBe(0);
    const lease = await gate.acquire();
    await lease.release();
    expect(gate.paused).toBe(false);
  });

  it('refuses overlapping pause requests; release is idempotent', async () => {
    const gate = new WorkspaceMutationGate();
    const lease = await gate.acquire();
    await expect(gate.acquire()).rejects.toThrow(/déjà demandée/);
    await lease.release();
    await lease.release();
    expect(gate.paused).toBe(false);
    expect(await gate.runMutation(() => 'ready')).toBe('ready');
  });

  it('blocks new mutators until an immediate pause is released', async () => {
    const gate = new WorkspaceMutationGate();
    const lease = await gate.acquire();
    let started = false;
    const action = gate.runMutation(() => {started = true; return 7;});
    expect(started).toBe(false);
    await lease.release();
    expect(await action).toBe(7);
    expect(started).toBe(true);
  });

  it('rejects invalid timeout settings without entering pause state', async () => {
    const gate = new WorkspaceMutationGate();
    await expect(gate.acquire(0)).rejects.toThrow(/délai de suspension invalide/);
    await expect(gate.acquire(120001)).rejects.toThrow(/délai de suspension invalide/);
    expect(gate.paused).toBe(false);
    expect(await gate.runMutation(() => 1)).toBe(1);
  });
});


describe('EC04: nested mutations and deadlock prevention', () => {
  it('allows an awaited nested mutation without self-deadlock', async () => {
    const gate = new WorkspaceMutationGate();
    const events: string[] = [];
    await gate.runMutation(async () => {
      events.push('outer');
      const result = await gate.runMutation(async () => {events.push('inner'); return 7;});
      expect(result).toBe(7);
    });
    expect(events).toEqual(['outer','inner']);
    expect(gate.activeMutations).toBe(0);
  });

  it('counts a detached child started during drain until it has really finished', async () => {
    const gate = new WorkspaceMutationGate();
    const parentCanFinish = deferred();
    const childCanFinish = deferred();
    let detached!: Promise<void>;
    const parent = gate.runMutation(async () => {
      await parentCanFinish.promise;
      detached = gate.runMutation(() => childCanFinish.promise);
    });
    const waiting = gate.acquire(1000);
    parentCanFinish.resolve(); await parent;
    expect(gate.activeMutations).toBe(1);
    expect(gate.paused).toBe(true);
    childCanFinish.resolve(); await detached;
    const lease = await waiting;
    expect(gate.activeMutations).toBe(0);
    await lease.release();
  });

  it('fails immediately rather than waiting for itself when backup starts inside a mutation', async () => {
    const gate = new WorkspaceMutationGate();
    await gate.runMutation(async () => {
      await expect(gate.acquire(1000)).rejects.toThrow(/depuis une opération mutante active/);
    });
    expect(gate.paused).toBe(false);
  });

  it('does not let a stale asynchronous context bypass a pause', async () => {
    const gate = new WorkspaceMutationGate();
    let late!: () => Promise<number>;
    await gate.runMutation(() => {late = () => gate.runMutation(() => 9);});
    const lease = await gate.acquire();
    let executed = false;
    const pending = late().then(value => {executed = true; return value;});
    await Promise.resolve();
    expect(executed).toBe(false);
    await lease.release();
    expect(await pending).toBe(9);
    expect(executed).toBe(true);
  });
});

 it('counts sync writes, cleans failures and refuses writes during drain and pause',async()=>{
   const gate=new WorkspaceMutationGate();
   expect(gate.runSynchronousMutation(()=>{expect(gate.activeMutations).toBe(1);return 7;})).toBe(7);
   expect(()=>gate.runSynchronousMutation(()=>{throw Error('fixture');})).toThrow('fixture');
   expect(gate.activeMutations).toBe(0);
   const held=deferred(),work=gate.runMutation(()=>held.promise),pause=gate.acquire();
   expect(()=>gate.runSynchronousMutation(()=>99)).toThrow(/suspendue/);
   held.resolve();await work;const lease=await pause;
   expect(()=>gate.runSynchronousMutation(()=>99)).toThrow(/suspendue/);
   await lease.release();expect(gate.runSynchronousMutation(()=>99)).toBe(99);
 });

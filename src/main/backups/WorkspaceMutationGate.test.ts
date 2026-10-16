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

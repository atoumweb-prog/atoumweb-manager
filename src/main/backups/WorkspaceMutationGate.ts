/**
 * EC04: cooperative application-level writer pause for the future backup coordinator.
 *
 * Every mutating entrypoint MUST run through runMutation() for a pause to protect
 * an actual workspace. This class cannot intercept direct sqlite calls, filesystem
 * writes or unregistered background tasks, and is deliberately NOT wired to IPC.
 * The whole async operation (including nested writes) must be awaited.
 * Reentrant calls are counted as independent in-flight operations.
 * Stale detached callbacks have to acquire a fresh mutation permit.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Ec04WritePauseLease, Ec04WritePauseProvider } from './WorkspaceCaptureCoordinator';

type PauseState = 'open' | 'draining' | 'paused';

export class WorkspaceMutationGate implements Ec04WritePauseProvider {
  private state: PauseState = 'open';
  private mutations = 0;
  private readonly mutationContext = new AsyncLocalStorage<{active: boolean}>();
  private readonly openWaiters = new Set<() => void>();
  private readonly drainWaiters = new Set<() => void>();

  get activeMutations(): number { return this.mutations; }
  get paused(): boolean { return this.state !== 'open'; }

  /** Include ALL file and SQLite side effects of this unit of work. */
  async runMutation<T>(work: () => T | Promise<T>): Promise<T> {
    // An active parent mutation can start child operations while draining.
    // These children count separately so a fire-and-forget child cannot
    // let acquire() finish early. A stale ALS token has active=false.
    const parent = this.mutationContext.getStore();
    if (!parent?.active) {
      while (this.state !== 'open') {
        await new Promise<void>(resolve => this.openWaiters.add(resolve));
      }
    }
    // Count without yielding, before invoking possibly synchronous work.
    this.mutations += 1;
    const current = {active: true};
    try {
      return await this.mutationContext.run(current, work);
    } finally {
      current.active = false;
      this.mutations -= 1;
      if (this.mutations === 0) {
        const waiters = [...this.drainWaiters];
        this.drainWaiters.clear();
        for (const resolve of waiters) resolve();
      }
    }
  }

  /** Rejects overlapping pauses; times out rather than freezing app mutations. */
  async acquire(timeoutMs = 30_000): Promise<Ec04WritePauseLease> {
    if (this.mutationContext.getStore()?.active) {
      throw new Error('EC04 : capture interdite depuis une opération mutante active.');
    }
    if (this.state !== 'open') throw new Error('EC04 : suspension déjà demandée.');
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
      throw new Error('EC04 : délai de suspension invalide.');
    }
    this.state = 'draining';
    let onDrained: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (this.mutations > 0) {
        const drained = new Promise<void>(resolve => {
          onDrained = resolve;
          this.drainWaiters.add(resolve);
        });
        const expiry = new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('EC04 : opérations en cours non terminées avant le délai.')), timeoutMs);
        });
        await Promise.race([drained, expiry]);
      }
      this.state = 'paused';
      let released = false;
      return {
        release: async () => {
          if (released) return;
          released = true;
          this.resume();
        },
      };
    } catch (error) {
      this.resume();
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
      if (onDrained) this.drainWaiters.delete(onDrained);
    }
  }

  private resume(): void {
    this.state = 'open';
    const waiting = [...this.openWaiters];
    this.openWaiters.clear();
    for (const resume of waiting) resume();
  }
}

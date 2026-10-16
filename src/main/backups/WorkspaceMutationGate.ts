/**
 * EC04: cooperative application-level writer pause for the future backup coordinator.
 *
 * Every mutating entrypoint MUST run through runMutation() for a pause to protect
 * an actual workspace. This class cannot intercept direct sqlite calls, filesystem
 * writes or unregistered background tasks, and is deliberately NOT wired to IPC.
 * Wrap the outermost mutation, including its async FS+DB work, exactly once.
 */
import type { Ec04WritePauseLease, Ec04WritePauseProvider } from './WorkspaceCaptureCoordinator';

type PauseState = 'open' | 'draining' | 'paused';

export class WorkspaceMutationGate implements Ec04WritePauseProvider {
  private state: PauseState = 'open';
  private mutations = 0;
  private readonly openWaiters = new Set<() => void>();
  private readonly drainWaiters = new Set<() => void>();

  get activeMutations(): number { return this.mutations; }
  get paused(): boolean { return this.state !== 'open'; }

  /** Include ALL file and SQLite side effects of this unit of work. */
  async runMutation<T>(work: () => T | Promise<T>): Promise<T> {
    while (this.state !== 'open') {
      await new Promise<void>(resolve => this.openWaiters.add(resolve));
    }
    // Increment without yielding to the event loop, before work begins.
    this.mutations += 1;
    try {
      return await work();
    } finally {
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

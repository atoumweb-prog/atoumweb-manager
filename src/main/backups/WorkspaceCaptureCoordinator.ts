/**
 * EC04 capture entrypoint for future production integration.
 * No concrete writer gate is connected yet: the Electron main process MUST
 * provide an adapter that drains every SQLite + filesystem writer in all
 * windows, background tasks, timers and imports BEFORE resolving acquire().
 *
 * A gate around only database.backupTo is NOT sufficient. Do not expose this
 * coordinator to IPC or a scheduled backup until that adapter is audited.
 */
import {createOfflineWorkspaceArchive, type Ec04ArchiveManifest, type Ec04CreateInput} from './WorkspacePortableArchive';

export interface Ec04WritePauseLease {
  /** Release ONLY after all archive IO has completed or failed. */
  release(): Promise<void>;
}

export interface Ec04WritePauseProvider {
  /**
   * Waits for in-flight mutations to complete and blocks NEW writes everywhere:
   * all BrowserWindows, IPC routes, auto-save/timers, disk importers and Bridge.
   * It must never mutate persistent user data in order to obtain the pause.
   */
  acquire(): Promise<Ec04WritePauseLease>;
}

/** Reject overlapping captures; releases the pause after success AND failure. */
export class Ec04CaptureCoordinator {
  private inFlight = false;
  constructor(private readonly writerPause: Ec04WritePauseProvider,
              private readonly capture: (input: Ec04CreateInput) => Promise<Ec04ArchiveManifest> = createOfflineWorkspaceArchive) {}

  get busy(): boolean { return this.inFlight; }

  async create(input: Ec04CreateInput): Promise<Ec04ArchiveManifest> {
    if (this.inFlight) throw Error('EC04 : capture déjà en cours.');
    this.inFlight = true;
    let lease: Ec04WritePauseLease | undefined;
    try {
      lease = await this.writerPause.acquire();
      if (!lease || typeof lease.release !== 'function') {
        throw Error('EC04 : impossible de garantir la suspension des écritures.');
      }
      return await this.capture(input);
    } finally {
      try { await lease?.release(); }
      finally { this.inFlight = false; }
    }
  }
}

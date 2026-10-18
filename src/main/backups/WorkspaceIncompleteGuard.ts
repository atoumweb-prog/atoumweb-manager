/**
 * EC04 safety gate: a failed offline restoration/relocation must never be
 * opened as a normal Manager workspace. Pure filesystem check; no cleanup,
 * auto-recovery, SQLite opening, marker removal, or new directory creation.
 */
import {lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';

export const EC04_INCOMPLETE_WORKSPACE_MARKERS = [
  '.EC04-RESTORE-INCOMPLETE',
  '.EC04-RELOCATION-INCOMPLETE',
] as const;

export type Ec04IncompleteWorkspaceMarker = (typeof EC04_INCOMPLETE_WORKSPACE_MARKERS)[number];

export class WorkspaceIncompleteError extends Error {
  constructor(readonly workspaceRoot: string, readonly marker: Ec04IncompleteWorkspaceMarker) {
    super(
      'EC04 : workspace incomplet, ouverture refusée. ' +
      'Le marqueur ' + marker + ' est présent dans ' + workspaceRoot + '. ' +
      'Ne le supprime pas sans avoir vérifié ou repris la restauration sur une copie.',
    );
    this.name = 'WorkspaceIncompleteError';
  }
}

/** lstat (not existsSync) also catches broken symlink markers; access errors propagate. */
export function assertWorkspaceNotIncomplete(workspaceRoot: string): void {
  const root = resolve(workspaceRoot);
  for (const marker of EC04_INCOMPLETE_WORKSPACE_MARKERS) {
    try {
      lstatSync(join(root, marker));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error; // Do not suppress EACCES, EPERM or IO failures.
    }
    throw new WorkspaceIncompleteError(root, marker);
  }
}

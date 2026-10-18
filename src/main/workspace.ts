import { app } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { assertWorkspaceNotIncomplete, WorkspaceIncompleteError } from './backups/WorkspaceIncompleteGuard';

interface WorkspaceBootstrapConfig {
  workspaceRoot: string;
}

export interface WorkspacePaths {
  root: string;
  dataDirectory: string;
  databaseFile: string;
  backupsDirectory: string;
  clientsDirectory: string;
  internalDirectory: string;
  expensesDirectory: string;
  exportsDirectory: string;
  atoumWebLibraryDirectory: string;
  bridgeDirectory: string;
}

const BOOTSTRAP_FILENAME = 'workspace.json';

/** Reading the recorded workspace must not silently fall back after IO failure. */
export class WorkspaceAccessError extends Error {
  constructor(readonly location: string, cause: unknown) {
    super(
      'Impossible de charger le workspace AtoumWeb Manager : ' + location +
      '. Le Manager refuse de démarrer plutôt que d’ouvrir un autre dossier par erreur.',
      {cause},
    );
    this.name = 'WorkspaceAccessError';
  }
}

function bootstrapFilePath(): string {
  return join(app.getPath('userData'), BOOTSTRAP_FILENAME);
}

export function createWorkspacePaths(root: string): WorkspacePaths {
  const normalizedRoot = resolve(root);
  const dataDirectory = join(normalizedRoot, 'data');

  return {
    root: normalizedRoot,
    dataDirectory,
    databaseFile: join(dataDirectory, 'atoumweb-manager.sqlite'),
    backupsDirectory: join(normalizedRoot, 'backups'),
    clientsDirectory: join(normalizedRoot, 'clients'),
    internalDirectory: join(normalizedRoot, 'projets-internes'),
    expensesDirectory: join(normalizedRoot, 'depenses'),
    exportsDirectory: join(normalizedRoot, 'exports'),
    atoumWebLibraryDirectory: join(normalizedRoot, 'bibliotheque-atoumweb'),
    bridgeDirectory: join(normalizedRoot, 'bridge'),
  };
}

export function ensureWorkspace(root: string): WorkspacePaths {
  const paths = createWorkspacePaths(root);
  try {
    // Reject incomplete EC04 workspaces BEFORE creating any folder.
    assertWorkspaceNotIncomplete(paths.root);
    [
      paths.root,
      paths.dataDirectory,
      paths.backupsDirectory,
      paths.clientsDirectory,
      paths.internalDirectory,
      paths.expensesDirectory,
      paths.exportsDirectory,
      paths.atoumWebLibraryDirectory,
      paths.bridgeDirectory,
    ].forEach((directory) => mkdirSync(directory, { recursive: true }));
    // Recheck after initialization so a concurrent marker cannot be ignored.
    assertWorkspaceNotIncomplete(paths.root);
    return paths;
  } catch (error) {
    if (error instanceof WorkspaceIncompleteError) throw error;
    throw new WorkspaceAccessError(paths.root, error);
  }
}

export function resolveWorkspace(): WorkspacePaths {
  const configPath = bootstrapFilePath();
  const defaultRoot = join(app.getPath('documents'), 'AtoumWeb Manager');

  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ensureWorkspace(defaultRoot);
    // Unreadable configuration is NOT an invalid JSON document.
    throw new WorkspaceAccessError(configPath, error);
  }

  let config: WorkspaceBootstrapConfig | null;
  try {
    config = JSON.parse(raw) as WorkspaceBootstrapConfig | null;
  } catch (error) {
    throw new WorkspaceAccessError(configPath, error);
  }
  if (config && typeof config.workspaceRoot === 'string' && config.workspaceRoot.trim() && isAbsolute(config.workspaceRoot)) {
    // Initialization errors from an EXPLICIT selection must propagate.
    return ensureWorkspace(config.workspaceRoot);
  }
  throw new WorkspaceAccessError(configPath, new Error('Configuration workspace absente, relative ou invalide.'));
}

export function saveWorkspaceRoot(root: string): WorkspacePaths {
  const paths = ensureWorkspace(root);
  // Recheck immediately before persisting the selection in workspace.json.
  assertWorkspaceNotIncomplete(paths.root);
  mkdirSync(app.getPath('userData'), { recursive: true });
  const config: WorkspaceBootstrapConfig = { workspaceRoot: paths.root };
  writeFileSync(bootstrapFilePath(), JSON.stringify(config, null, 2), 'utf8');
  return paths;
}

import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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
}

export function resolveWorkspace(): WorkspacePaths {
  const configPath = bootstrapFilePath();
  const defaultRoot = join(app.getPath('documents'), 'AtoumWeb Manager');

  if (!existsSync(configPath)) {
    return ensureWorkspace(defaultRoot);
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as WorkspaceBootstrapConfig;
    if (typeof config.workspaceRoot === 'string' && config.workspaceRoot.trim().length > 0) {
      return ensureWorkspace(config.workspaceRoot);
    }
  } catch (error) {
    // An incomplete workspace is a hard safety stop, NEVER a reason to
    // silently fall back to a different workspace (possibly empty).
    if (error instanceof WorkspaceIncompleteError) throw error;
    // An invalid bootstrap JSON still uses the historical default fallback.
  }

  return ensureWorkspace(defaultRoot);
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

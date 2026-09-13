import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface WorkspaceBootstrapConfig {
  workspaceRoot: string;
}

export interface WorkspacePaths {
  root: string;
  dataDirectory: string;
  databaseFile: string;
  backupsDirectory: string;
  clientsDirectory: string;
  exportsDirectory: string;
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
    exportsDirectory: join(normalizedRoot, 'exports'),
  };
}

export function ensureWorkspace(root: string): WorkspacePaths {
  const paths = createWorkspacePaths(root);

  [
    paths.root,
    paths.dataDirectory,
    paths.backupsDirectory,
    paths.clientsDirectory,
    paths.exportsDirectory,
  ].forEach((directory) => mkdirSync(directory, { recursive: true }));

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
  } catch {
    // Un fichier de bootstrap invalide ne doit pas empêcher le démarrage.
  }

  return ensureWorkspace(defaultRoot);
}

export function saveWorkspaceRoot(root: string): WorkspacePaths {
  const paths = ensureWorkspace(root);
  mkdirSync(app.getPath('userData'), { recursive: true });
  const config: WorkspaceBootstrapConfig = { workspaceRoot: paths.root };
  writeFileSync(bootstrapFilePath(), JSON.stringify(config, null, 2), 'utf8');
  return paths;
}

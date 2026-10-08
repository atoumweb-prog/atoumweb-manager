import { app } from 'electron';
import { backup, DatabaseSync } from 'node:sqlite';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import type { WorkspacePaths } from './workspace';

interface PendingRestore {
  sourcePath: string;
  requestedAt: string;
}

const PENDING_RESTORE_FILENAME = 'pending-database-restore.json';

function pendingRestorePath(): string {
  return join(app.getPath('userData'), PENDING_RESTORE_FILENAME);
}

export function scheduleDatabaseRestore(sourcePath: string): void {
  const resolvedSource = resolve(sourcePath);
  if (!existsSync(resolvedSource)) {
    throw new Error('La sauvegarde sélectionnée est introuvable.');
  }

  const pending: PendingRestore = {
    sourcePath: resolvedSource,
    requestedAt: new Date().toISOString(),
  };

  mkdirSync(app.getPath('userData'), { recursive: true });
  writeFileSync(pendingRestorePath(), JSON.stringify(pending, null, 2), 'utf8');
}

export async function applyPendingDatabaseRestore(
  workspace: WorkspacePaths,
): Promise<{ restored: boolean; sourcePath?: string; safetyBackupPath?: string }> {
  const markerPath = pendingRestorePath();
  if (!existsSync(markerPath)) {
    return { restored: false };
  }

  let pending: PendingRestore;
  try {
    pending = JSON.parse(readFileSync(markerPath, 'utf8')) as PendingRestore;
  } catch {
    rmSync(markerPath, { force: true });
    return { restored: false };
  }

  const sourcePath = resolve(pending.sourcePath ?? '');
  if (!sourcePath || !existsSync(sourcePath)) {
    rmSync(markerPath, { force: true });
    return { restored: false };
  }

  const destinationPath = resolve(workspace.databaseFile);
  if (sourcePath === destinationPath) {
    rmSync(markerPath, { force: true });
    return { restored: false };
  }

  let safetyBackupPath: string | undefined;
  if (existsSync(destinationPath)) {
    const safetyDirectory = join(workspace.backupsDirectory, 'pre-restore');
    mkdirSync(safetyDirectory, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    safetyBackupPath = join(
      safetyDirectory,
      `atoumweb-manager-before-restore-${timestamp}.sqlite`,
    );

    const currentDatabase = new DatabaseSync(destinationPath);
    try {
      await backup(currentDatabase, safetyBackupPath);
    } finally {
      currentDatabase.close();
    }
  }

  rmSync(`${destinationPath}-wal`, { force: true });
  rmSync(`${destinationPath}-shm`, { force: true });
  copyFileSync(sourcePath, destinationPath);
  rmSync(markerPath, { force: true });

  return { restored: true, sourcePath, safetyBackupPath };
}

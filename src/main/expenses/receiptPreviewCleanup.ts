import { lstatSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PREFIX = 'atoumweb-receipt-preview-';
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Best-effort cleanup of disposable preview copies only.
 * Never follows symlinks or recursively scans arbitrary temp directories.
 * The retention delay avoids disrupting recently opened external viewers.
 */
export function cleanupExpiredReceiptPreviews(
  baseDirectory: string = tmpdir(),
  now: number = Date.now(),
): number {
  let removed = 0;
  let entries: string[];
  try {
    entries = readdirSync(baseDirectory);
  } catch {
    return 0;
  }
  for (const name of entries) {
    if (!/^atoumweb-receipt-preview-[A-Za-z0-9_-]+$/.test(name)) continue;
    if (!name.startsWith(PREFIX)) continue;
    const path = join(baseDirectory, name);
    try {
      const stat = lstatSync(path);
      if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
      if (now - stat.mtimeMs < RETENTION_MS) continue;
      rmSync(path, { recursive: true, force: true });
      removed++;
    } catch {
      // The directory may be locked by an external viewer: retain and retry later.
    }
  }
  return removed;
}

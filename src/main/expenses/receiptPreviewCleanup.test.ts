import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupExpiredReceiptPreviews } from './receiptPreviewCleanup';

const tempRoots: string[] = [];
function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'atoumweb-cleanup-test-'));
  tempRoots.push(root);
  return root;
}
afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('cleanupExpiredReceiptPreviews', () => {
  it('cleans only old owned directories and leaves recent previews and unrelated files', () => {
    const root = tempRoot();
    const old = join(root, 'atoumweb-receipt-preview-expired123');
    const recent = join(root, 'atoumweb-receipt-preview-current123');
    const unrelated = join(root, 'other-app-cache');
    const unmarked = join(root, 'atoumweb-receipt-preview-unmarked123');
    mkdirSync(old);
    mkdirSync(recent);
    mkdirSync(unrelated);
    mkdirSync(unmarked);
    writeFileSync(join(old, '.atoumweb-receipt-preview'), 'atoumweb-receipt-preview-v1');
    writeFileSync(join(old, 'preview.pdf'), 'old preview');
    chmodSync(join(old, 'preview.pdf'), 0o444);
    const now = Date.now();
    const outdated = new Date(now - 40 * 24 * 60 * 60 * 1000);
    utimesSync(old, outdated, outdated);
    utimesSync(unmarked, outdated, outdated);
    expect(cleanupExpiredReceiptPreviews(root, now)).toBe(1);
    expect(existsSync(old)).toBe(false);
    expect(existsSync(recent)).toBe(true);
    expect(existsSync(unrelated)).toBe(true);
    expect(existsSync(unmarked)).toBe(true);
  });

  it('does not follow a symlink to a similarly named directory', () => {
    const root = tempRoot();
    const target = join(root, 'important');
    mkdirSync(target);
    writeFileSync(join(target, 'keep.txt'), 'keep');
    const link = join(root, 'atoumweb-receipt-preview-link123');
    symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
    expect(cleanupExpiredReceiptPreviews(root, Date.now() + 45 * 24 * 60 * 60 * 1000)).toBe(0);
    expect(existsSync(join(target, 'keep.txt'))).toBe(true);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

const prefix = 'atoumweb-binary-equality-test-';
const fileSize = 2_408_448; // Size of the complete 1–66 SQLite fixture, not a sampled prefix.
let root: string | undefined;
function sameBytesReference(actual: Buffer, expected: Buffer): boolean {
  if (actual.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index++) {
    if (actual[index] !== expected[index]) return false;
  }
  return true;
}

afterEach(() => {
  if (!root) return;
  expect(dirname(resolve(root))).toBe(resolve(tmpdir()));
  expect(basename(root).startsWith(prefix)).toBe(true);
  rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe('restore file comparisons preserve complete byte equality', () => {
  it.each([
    { change: 'same content', equal: true, sameLength: true },
    { change: 'first byte', equal: false, sameLength: true },
    { change: 'middle byte', equal: false, sameLength: true },
    { change: 'last byte', equal: false, sameLength: true },
    { change: 'shorter', equal: false, sameLength: false },
    { change: 'longer', equal: false, sameLength: false },
  ])('$change', ({ change, equal, sameLength }) => {
    root = mkdtempSync(join(tmpdir(), prefix));
    const original = Buffer.alloc(fileSize, 0x5a);
    let changed = Buffer.from(original);
    if (change === 'first byte') changed[0] ^= 1;
    else if (change === 'middle byte') changed[Math.floor(fileSize / 2)] ^= 1;
    else if (change === 'last byte') changed[fileSize - 1] ^= 1;
    else if (change === 'shorter') changed = changed.subarray(0, fileSize - 1);
    else if (change === 'longer') changed = Buffer.concat([changed, Buffer.from([0])]);
    const referencePath = join(root, 'reference.bin'), actualPath = join(root, 'actual.bin');
    writeFileSync(referencePath, original); writeFileSync(actualPath, changed);
    const reference = readFileSync(referencePath), actual = readFileSync(actualPath);
    expect(Buffer.isBuffer(reference) && Buffer.isBuffer(actual)).toBe(true);
    // Keep identity checks scalar too: Vitest's object toBe diagnostic path
    // can perform deep equality even for a successful negated assertion.
    expect(actual === reference).toBe(false);
    expect(reference.length).toBe(fileSize);
    expect(actual.length === reference.length).toBe(sameLength);
    expect(actual.equals(reference)).toBe(equal);
    // Independent full-length byte oracle with no recursive object graph.
    expect(actual.equals(reference)).toBe(sameBytesReference(actual, reference));
  });
});

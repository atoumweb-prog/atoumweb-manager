import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

// Structural gate only: runtime fault injection is pending on Windows.
const source = readFileSync(join(process.cwd(), 'src/main/backups/WorkspacePortableArchive.ts'),'utf8');
const marker = source.slice(source.indexOf('export async function restoreOfflineArchiveToNewWorkspace('));

describe('EC04 B1 marker failure fail-closed source audit',()=>{
  it('creates a marker before moving staged bytes, and deletes empty destination if marker fails',()=>{
    const start=marker.indexOf("mkdirSync(destination, {mode: 0o700})");
    const attempt=marker.indexOf('writeFileSync(incomplete,');
    const cleanup=marker.indexOf('rmdirSync(destination)');
    const move=marker.indexOf('for (const name of readdirSync(staging))');
    expect(start).toBeGreaterThan(-1);
    expect(attempt).toBeGreaterThan(start);
    expect(cleanup).toBeGreaterThan(attempt);
    expect(move).toBeGreaterThan(cleanup);
    expect(marker).toContain("throw new AggregateError([error, cleanup]");
  });
});

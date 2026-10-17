import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

const root=process.cwd();
const main=readFileSync(join(root,'src/main/main.ts'),'utf8');
const ipc=readFileSync(join(root,'src/main/ipc.ts'),'utf8');
const portable=readFileSync(join(root,'src/main/backups/WorkspacePortableArchive.ts'),'utf8');
const workspace=readFileSync(join(root,'src/main/workspace.ts'),'utf8');

describe('EC04 pre-handoff release barriers (source assertions only)',()=>{
  it('does not expose the experimental full-workspace capture to production IPC',()=>{
    expect(ipc).not.toMatch(/ipcMain\.handle\(['"]ec04[:\-]/);
    expect(main).not.toContain('new Ec04CaptureCoordinator(');
    expect(main).not.toContain('createOfflineWorkspaceArchive(');
  });

  it('never describes the experimental B1 capture as consistency/references certified',()=>{
    expect(portable).toContain('referencesVerified: false, consistencyCertified: false');
    expect(portable).toContain('m.referencesVerified !== false || m.consistencyCertified !== false');
  });

  it('refuses incomplete EC04 workspaces before SQLite initialization',()=>{
    expect(workspace).toContain('assertWorkspaceNotIncomplete(paths.root)');
    expect(main.indexOf('const workspace = resolveWorkspace()'))
      .toBeLessThan(main.indexOf('database = new DatabaseService(workspace)'));
  });
});

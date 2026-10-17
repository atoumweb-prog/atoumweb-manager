import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

// Static review of startup wiring; end-to-end Electron tests are still needed.
describe('EC04 boot refusal integration',()=>{
  it('reports the incomplete workspace error rather than booting SQLite',()=>{
    const main=readFileSync(join(process.cwd(),'src/main/main.ts'),'utf8');
    expect(main).toContain('else if (error instanceof WorkspaceIncompleteError)');
    expect(main).toContain("dialog.showErrorBox('Workspace EC04 incomplet");
    expect(main.indexOf('const workspace = resolveWorkspace()'))
      .toBeLessThan(main.indexOf('database = new DatabaseService(workspace)'));
  });
});

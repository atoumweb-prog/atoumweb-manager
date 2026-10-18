import {existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {
  assertWorkspaceNotIncomplete, EC04_INCOMPLETE_WORKSPACE_MARKERS,
  WorkspaceIncompleteError,
} from './WorkspaceIncompleteGuard';

let base:string,workspace:string;
beforeEach(()=>{
  base=mkdtempSync(join(tmpdir(),'ec04-workspace-guard-'));
  workspace=join(base,'existing');
  mkdirSync(workspace);
});
afterEach(()=>rmSync(base,{recursive:true,force:true}));

describe('EC04 fail-closed workspace startup guard',()=>{
  it('accepts a clean or not-yet-created workspace without modifying it',()=>{
    const missing=join(base,'future');
    assertWorkspaceNotIncomplete(missing);
    expect(existsSync(missing)).toBe(false);
    assertWorkspaceNotIncomplete(workspace);
    expect(existsSync(join(workspace,'data'))).toBe(false);
  });

  for(const marker of EC04_INCOMPLETE_WORKSPACE_MARKERS) {
    it('refuses a workspace with '+marker+' without deleting or changing the marker',()=>{
      const path=join(workspace,marker);
      writeFileSync(path,'interrupted migration: keep evidence');
      const before=readFileSync(path);
      expect(()=>assertWorkspaceNotIncomplete(workspace)).toThrow(WorkspaceIncompleteError);
      try {assertWorkspaceNotIncomplete(workspace);}
      catch(e){
        expect((e as WorkspaceIncompleteError).marker).toBe(marker);
        expect((e as WorkspaceIncompleteError).message).toContain('Ne le supprime pas');
      }
      expect(readFileSync(path)).toEqual(before);
    });
  }

  it('rejects a marker even if it is a directory, not a regular file',()=>{
    const marker=join(workspace,'.EC04-RELOCATION-INCOMPLETE');
    mkdirSync(marker);
    expect(()=>assertWorkspaceNotIncomplete(workspace)).toThrow(WorkspaceIncompleteError);
    expect(lstatSync(marker).isDirectory()).toBe(true);
  });

  it('rejects dangling symlink markers instead of relying on existsSync',()=>{
    if(process.platform==='win32') return; // symlink privilege varies on Windows CI
    const marker=join(workspace,'.EC04-RESTORE-INCOMPLETE');
    symlinkSync(join(base,'missing-target'),marker);
    expect(existsSync(marker)).toBe(false);
    expect(()=>assertWorkspaceNotIncomplete(workspace)).toThrow(WorkspaceIncompleteError);
  });
});

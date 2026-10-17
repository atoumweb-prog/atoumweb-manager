import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

const electronPaths=vi.hoisted(()=>({userData:'',documents:''}));
vi.mock('electron',()=>({
  app:{getPath:(key:string)=>{
    if(key==='userData')return electronPaths.userData;
    if(key==='documents')return electronPaths.documents;
    throw Error('Unexpected electron.getPath '+key);
  }},
}));
import {ensureWorkspace,resolveWorkspace,saveWorkspaceRoot} from '../workspace';
import {WorkspaceIncompleteError} from './WorkspaceIncompleteGuard';

let base:string;
beforeEach(()=>{
  base=mkdtempSync(join(tmpdir(),'ec04-workspace-switch-'));
  electronPaths.userData=join(base,'userData');
  electronPaths.documents=join(base,'Documents');
  mkdirSync(electronPaths.userData);
  mkdirSync(electronPaths.documents);
});
afterEach(()=>rmSync(base,{recursive:true,force:true}));

describe('EC04 incomplete markers at actual Manager workspace entrypoints',()=>{
  it('does not create data or service folders for a marked restore',()=>{
    const broken=join(base,'broken-restore');
    mkdirSync(broken);
    const marker=join(broken,'.EC04-RESTORE-INCOMPLETE');
    writeFileSync(marker,'do not open');
    expect(()=>ensureWorkspace(broken)).toThrow(WorkspaceIncompleteError);
    expect(existsSync(join(broken,'data'))).toBe(false);
    expect(existsSync(join(broken,'clients'))).toBe(false);
    expect(readFileSync(marker,'utf8')).toBe('do not open');
  });

  it('never silently selects a fallback workspace when configured workspace is incomplete',()=>{
    const broken=join(base,'migration');
    mkdirSync(broken);
    writeFileSync(join(broken,'.EC04-RELOCATION-INCOMPLETE'),'not done');
    writeFileSync(join(electronPaths.userData,'workspace.json'),JSON.stringify({workspaceRoot:broken}));
    expect(()=>resolveWorkspace()).toThrow(WorkspaceIncompleteError);
    expect(existsSync(join(electronPaths.documents,'AtoumWeb Manager'))).toBe(false);
  });

  it('does not rewrite workspace.json when a user chooses an incomplete folder',()=>{
    const initial=join(base,'existing-workspace');
    saveWorkspaceRoot(initial);
    const config=join(electronPaths.userData,'workspace.json');
    const before=readFileSync(config);
    const bad=join(base,'half-restored');
    mkdirSync(bad);
    writeFileSync(join(bad,'.EC04-RESTORE-INCOMPLETE'),'incomplete');
    expect(()=>saveWorkspaceRoot(bad)).toThrow(WorkspaceIncompleteError);
    expect(readFileSync(config)).toEqual(before);
    expect(existsSync(join(bad,'data'))).toBe(false);
    expect(resolveWorkspace().root).toBe(initial);
  });

  it('retains the legacy fallback for malformed bootstrap JSON',()=>{
    writeFileSync(join(electronPaths.userData,'workspace.json'),'{ invalid json');
    const result=resolveWorkspace();
    expect(result.root).toBe(join(electronPaths.documents,'AtoumWeb Manager'));
    expect(existsSync(result.dataDirectory)).toBe(true);
  });

  it('also refuses an incomplete DEFAULT workspace',()=>{
    const def=join(electronPaths.documents,'AtoumWeb Manager');
    mkdirSync(def);
    writeFileSync(join(def,'.EC04-RELOCATION-INCOMPLETE'),'incomplete');
    expect(()=>resolveWorkspace()).toThrow(WorkspaceIncompleteError);
    expect(existsSync(join(def,'data'))).toBe(false);
  });
});

import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

// Deliberately static coverage checks, not a substitute for Electron/SQLite tests.
const source=readFileSync(join(process.cwd(),'src/main/ipc.ts'),'utf8');
const entries=[...source.matchAll(/ipcMain\.handle\('([^']+)'/g)]
  .map(match=>({name:match[1],start:match.index!}));
function route(name:string):string {
  const found=entries.filter(item=>item.name===name);
  if(found.length!==1)throw Error('EC04 route absente ou dupliquée : '+name);
  const next=entries.find(item=>item.start>found[0].start);
  return source.slice(found[0].start,next?.start??source.length);
}
const projectsAndWorkflow=[
  'workflow:save-need','workflow:remove-need','workflow:archive-prospect',
  'workflow:begin-demo-capture','workflow:end-demo-capture','workflow:create-demo',
  'workflow:reset-demo',
  'projects:templates:create','projects:templates:create-version',
  'projects:templates:publish-version','projects:templates:add-node',
  'projects:templates:remove-node','projects:templates:configure-sites',
  'projects:transform-quote','projects:prepare-quote','projects:sync-commercial',
  'projects:restart','projects:assign-target','projects:resolve-scope-conflict',
  'projects:create-internal','projects:change-status',
  'projects:sites:create','projects:sites:update','projects:sites:set-archived',
  'projects:sites:link-page','projects:sites:unlink-page',
  'projects:sites:apply-blueprint',
  'projects:add-node','projects:update-node','projects:move-node',
  'projects:set-node-pause','projects:complete-phase',
  'projects:secrets:save','projects:secrets:remove',
  'projects:add-prerequisite','projects:update-prerequisite-status',
  'projects:resources:open-folder',
  'projects:technical:create','projects:technical:create-version',
  'projects:technical:mark-stable','projects:technical:link-resource',
  'projects:technical:unlink-resource','projects:technical:prepare-reuse',
  'projects:technical:archive',
] as const;

describe('EC04: project and workflow main-process route coverage',()=>{
  it('protects all 44 explicitly enumerated writers',()=>{
    expect(projectsAndWorkflow).toHaveLength(44);
    for(const name of projectsAndWorkflow) {
      expect(route(name),name).toContain('guardedMutation(');
    }
  });
  it('does not mutate or reveal the Windows secret during an archive pause',()=>{
    const save=route('projects:secrets:save');
    const reveal=route('projects:secrets:reveal');
    const remove=route('projects:secrets:remove');
    expect(save).toContain("safeStorage.encryptString(secret)");
    expect(save).toContain("guardedMutation(() => database.projects.saveProjectSecret(");
    expect(remove).toContain("guardedMutation(() => database.projects.removeProjectSecret(");
    expect(reveal).toContain('safeStorage.decryptString(');
    expect(reveal).not.toContain('guardedMutation(');
  });
  it('revalidates demo reset after the confirmation and protects backup, reset, reindex',()=>{
    const reset=route('workflow:reset-demo');
    const guard=reset.indexOf('guardedMutation(async');
    expect(reset.indexOf('dialog.showMessageBox')).toBeLessThan(guard);
    for(const symbol of ['database.demo.summary()','database.demo.reset(','database.crm.rebuildSearchIndex()']) {
      expect(reset).toContain(symbol);
    }
    expect(reset.indexOf('database.demo.reset(')).toBeGreaterThan(guard);
    expect(reset.indexOf('database.crm.rebuildSearchIndex()')).toBeGreaterThan(guard);
    expect(reset).toContain('JSON.stringify(current)!==JSON.stringify(summary)');
  });
  it('keeps model, project scope, previews and secret reveal out of mutation boundary',()=>{
    for(const name of [
      'projects:templates:get','projects:commercial-scope','projects:preview-quote',
      'projects:completion-review','projects:sites:list','projects:secrets:reveal',
      'workflow:dashboard',
    ])expect(route(name),name).not.toContain('guardedMutation(');
  });
});

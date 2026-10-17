import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

// Static coverage audit only: it cannot establish complete Electron quiescence.
const source=readFileSync(join(process.cwd(),'src/main/ipc.ts'),'utf8');
const starts=[...source.matchAll(/ipcMain\.handle\('([^']+)'/g)].map(x=>({name:x[1],at:x.index!}));
function extract(name:string):string {
  const found=starts.filter(s=>s.name===name);
  if(found.length!==1)throw Error('EC04 route missing/duplicate: '+name);
  return source.slice(found[0].at, starts.find(s=>s.at>found[0].at)?.at ?? source.length);
}
const knownMutators=[
  'crm:directory:save-existing','crm:directory:save-organization','crm:directory:save-contact','crm:directory:verify',
  'crm:organizations:create','crm:organizations:update',
  'crm:contacts:create','crm:contacts:create-and-attach-primary-prospect','crm:contacts:create-and-attach-decision-prospect','crm:contacts:update',
  'crm:contact-methods:save','crm:contact-methods:archive',
  'crm:prospects:create','crm:prospects:update','crm:prospects:update-missing-information-if-unchanged',
  'crm:prospects:update-project-brief-if-unchanged','crm:prospects:update-qualification-brief-if-unchanged',
  'crm:prospects:change-stage','crm:prospects:set-next-action','crm:prospects:convert-to-client','crm:prospects:research:save',
  'crm:clients:create','crm:clients:update-relationship-if-unchanged','crm:clients:update','crm:clients:archive','crm:clients:reactivate',
  'crm:clients:add-contact','crm:clients:set-primary-contact',
  'crm:actions:create','crm:actions:complete','crm:actions:cancel','crm:actions:reopen','crm:search:rebuild',
  'crm:prospects:update-qualification',
  'catalog:assign-canonical-code','catalog:create','catalog:create-version','catalog:save-draft-version','catalog:publish-version',
  'catalog:set-status','catalog:set-visible-public','catalog:replace-recommendations','catalog:set-offer-components',
  'catalog-categories:create','catalog-categories:rename','catalog-categories:set-status',
  'catalog-categories:assign','catalog-categories:reconcile-legacy',
  'bridge:import','bridge:pages:decide-node-match',
  'settings:set-theme','settings:set-display-density','settings:set-show-hover-help',
];
describe('EC04 static IPC coverage: CRM, catalog, Bridge and persistent settings',()=>{
  it('requires every explicitly audited writer to use the cooperative gate',()=>{
    for(const name of knownMutators)expect(extract(name),name).toContain('guardedMutation(');
  });
  it('keeps prospect qualification and decision-maker writes in one permit',()=>{
    const h=extract('crm:prospects:update-qualification');
    expect(h.indexOf('guardedMutation(')).toBeLessThan(h.indexOf('database.workflow.setDecisionMaker('));
    expect(h.indexOf('database.workflow.setDecisionMaker(')).toBeLessThan(h.indexOf('database.crm.updateProspectQualification('));
  });
  it('does not add a write boundary to simple read APIs',()=>{
    for(const name of ['crm:organizations:get','crm:prospects:list','crm:clients:list',
      'catalog:list','catalog:get-item','catalog-categories:list','bridge:sites:list']) {
      expect(extract(name),name).not.toContain('guardedMutation(');
    }
  });
  it('keeps settings returns compatible with promise-backed IPC',()=>{
    expect(extract('settings:set-theme')).toContain('Promise<ThemeName>');
    expect(extract('settings:set-display-density')).toContain('Promise<DisplayDensity>');
    expect(extract('settings:set-show-hover-help')).toContain('Promise<boolean>');
  });
});

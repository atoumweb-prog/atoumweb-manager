import {describe,it,expect,vi} from 'vitest';
import {mkdtempSync,rmSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {OperationalRecipeService,recipeReader,fileSHA,validateRecipeRequest} from './OperationalRecipeService';
import {recipeScenarios} from './operationalRecipeScenarios';
const input=()=>({sessionId:'session',scenarioId:'case-1',requestId:1});
describe('Isolated draft operational recipe',()=>{
  it('contains exactly the 18 approved cases plus actual D; explicit codes only',()=>{
    expect(recipeScenarios).toHaveLength(19);expect(new Set(recipeScenarios.map(s=>s.id)).size).toBe(19);
    expect(recipeScenarios.at(-1)?.lines[0].code).toBe('AW-SEO-PERF');
    expect(recipeScenarios[6].option?.selected).toBe(true);expect(recipeScenarios[13].option?.selected).toBe(false);
  });
  it('default fixture is deterministic across independent sessions and exposes measured counts',()=>{
    const first=new OperationalRecipeService();let preview;
    try{const state=first.state();expect(state.sourceLabel).toContain('Fixture');expect(first.references().length).toBe(state.models);preview=first.preview({sessionId:first.sessionId,scenarioId:'case-6',requestId:1});expect(preview.metrics).toMatchObject({actions:10,referenceMinutes:1650,sites:1,pages:4});}finally{first.close();}
    const second=new OperationalRecipeService();try{expect(second.preview({sessionId:second.sessionId,scenarioId:'case-6',requestId:1})).toEqual(preview);}finally{second.close();}
  });
  it('grants engines get/all only, never writer, close or backup',()=>{
    const db={get:vi.fn(()=>({id:'x'})),all:vi.fn(()=>[]),run:vi.fn(),exec:vi.fn(),close:vi.fn(),backupTo:vi.fn()};
    const reader=recipeReader(db as unknown as import('../database/DatabaseAdapter').DatabaseAdapter);expect(reader.get('SELECT 1')).toEqual({id:'x'});expect(reader.all('SELECT 1')).toEqual([]);
    for(const method of ['run','exec','close','backupTo'] as const)expect(()=>reader[method]('x')).toThrow(/Mutation interdite/);
    expect(db.run).not.toHaveBeenCalled();expect(db.exec).not.toHaveBeenCalled();expect(db.close).not.toHaveBeenCalled();
  });
  it.each([
    {ready:true},{projectId:'p'},{status:'ready'},{sql:'UPDATE quotes SET status="accepted"'},{sourcePath:'other'},
    {quantities:{unknown:1}},{quantities:{'line-0':0}},{quantities:{'line-0':1.1}},
    {quantities:{'line-0':501}},{optionSelected:true},{choices:[{lineOrigin:'x',slot:'main',unitIndex:1,siteOwnerOrigin:'x',siteOwnerSlot:'main',siteId:'real'}]},
    {choices:[{lineOrigin:'x',slot:'main',unitIndex:1,siteOwnerOrigin:'x',siteOwnerSlot:'main',parentPage:{lineOrigin:'x',templateNodeId:'y',contextId:'bad'}}]},
    {requestId:-1},{sessionId:'other'},{scenarioId:'arbitrary'}
  ])('rejects non recipe payload %j',bad=>{
    expect(()=>validateRecipeRequest({...input(),...bad} as never,'session')).toThrow();
  });
  it('permits sold quantities and explicit logical choice only',()=>{
    expect(validateRecipeRequest({...input(),quantities:{'line-0':1}},'session').scenario.id).toBe('case-1');
    expect(validateRecipeRequest({...input(),scenarioId:'case-14',optionSelected:true},'session').scenario.option).toBeDefined();
  });
  it('cleans constructor failure after copying a valid SQLite with wrong schema; source untouched',()=>{
    const root=mkdtempSync(join(tmpdir(),'awb-recipe-test-')),source=join(root,'empty.sqlite');
    try{
      const db=new NodeSqliteAdapter(source);db.exec('CREATE TABLE synthetic(id TEXT)');db.close();
      const sha=fileSHA(source),before=readdirSync(root);
      expect(()=>new OperationalRecipeService(source,sha,root)).toThrow();
      expect(readdirSync(root)).toEqual(before);
      expect(fileSHA(source)).toBe(sha);expect(existsSync(source+'-wal')).toBe(false);
    }finally{rmSync(root,{recursive:true,force:true});}
  });
  it('refuses wrong fingerprints and active WAL before allocating a sandbox',()=>{
    const root=mkdtempSync(join(tmpdir(),'awb-recipe-test-')),source=join(root,'source');
    try{writeFileSync(source,'synthetic');expect(()=>new OperationalRecipeService(source,'wrong')).toThrow(/Empreinte/);
      writeFileSync(source+'-wal','active');expect(()=>new OperationalRecipeService(source,fileSHA(source))).toThrow(/active/);
    }finally{rmSync(root,{recursive:true,force:true});}
  });
});


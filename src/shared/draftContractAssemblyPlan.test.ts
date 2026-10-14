import {describe,expect,it} from 'vitest';
import {planDraftContractAssembly,type DraftContractCandidate} from './draftContractAssemblyPlan';

const approved=(sectionKey:'object'|'finance'|'recurring',rankInSection:number)=>({
  status:'approved' as const,sectionKey,rankInSection,reviewer:'AtoumWeb',reviewedAt:'2026-10-14T12:00:00Z',
});
const clause=(id:string,section:DraftContractCandidate['section'],applicability?:DraftContractCandidate['applicability']):DraftContractCandidate=>({
  id,versionId:id,section,applicability,
});
describe('05C — future draft assembly preview (read-only)',()=>{
  it('orders only approved and eligible versions without modifying originals',()=>{
    const clauses=[
      clause('rec',approved('recurring',0),{requiredOptionCodes:['MAINT']}),
      clause('obj',approved('object',0)),
      clause('fin',approved('finance',2)),
      clause('other',approved('finance',0),{requiredOptionCodes:['SEO']}),
    ];
    const before=JSON.stringify(clauses);
    const result=planDraftContractAssembly(clauses,{optionCodes:['MAINT']},[]);
    expect(result.included.map(c=>c.id)).toEqual(['obj','fin','rec']);
    expect(result.excluded.map(c=>c.id)).toEqual(['other']);
    expect(result.ready).toBe(true);
    expect(JSON.stringify(clauses)).toBe(before);
  });
  it('does not publish editorial proposals or silently resolve missing commercial information',()=>{
    const clauses=[
      clause('pending',{status:'proposed',sectionKey:'finance',rankInSection:0,reason:'À vérifier'}),
      clause('missing',approved('recurring',0),{requiredOptionCodes:['MAINT']}),
      clause('unclassified',{status:'unclassified',sectionKey:null,rankInSection:null}),
    ];
    const result=planDraftContractAssembly(clauses,{},[]);
    expect(result.included).toHaveLength(0);
    expect(result.unreviewed.map(c=>c.id)).toEqual(['pending','unclassified']);
    expect(result.unresolved.map(c=>c.id)).toEqual(['missing']);
    expect(result.ready).toBe(false);
  });
  it('only blocks a reviewed explicit conflict between included versions',()=>{
    const clauses=[clause('a',approved('object',0)),clause('b',approved('finance',0))];
    const conflict={id:'x',clauseVersionIds:['a','b'],severity:'blocking' as const,reason:'Contradiction vérifiée',reviewed:true};
    const result=planDraftContractAssembly(clauses,{},[conflict]);
    expect(result.blocking).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.ready).toBe(false);
    expect(planDraftContractAssembly(clauses,{},[{...conflict,reviewed:false}]).ready).toBe(true);
    expect(planDraftContractAssembly([clauses[0]],{},[conflict]).blocking).toHaveLength(0);
  });
});

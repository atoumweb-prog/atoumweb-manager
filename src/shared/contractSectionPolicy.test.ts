import {describe,expect,it} from 'vitest';
import {CONTRACT_SECTION_ORDER,orderReviewedClauses,validateSectionReview,evaluateContractApplicability,evaluateContractConflicts,type ContractSectionReview} from './contractSectionPolicy';
const approved=(sectionKey:typeof CONTRACT_SECTION_ORDER[number],rankInSection:number):ContractSectionReview=>({status:'approved',sectionKey,rankInSection,reviewer:'Relecteur fixture',reviewedAt:'2026-10-14T12:00:00Z'});
describe('05C — approved semantic sections',()=>{
  it('keeps eight canonical sections in their approved order',()=>expect(CONTRACT_SECTION_ORDER).toEqual(['object','scope','execution','delivery','finance','rights','recurring','end']));
  it('never promotes an editorial proposal or unknown classification',()=>{
    const proposal:ContractSectionReview={status:'proposed',sectionKey:'finance',rankInSection:1,reason:'Paiement de maintenance'};
    const pending:ContractSectionReview={status:'unclassified',sectionKey:null,rankInSection:null};
    const input=[{id:'proposal',section:proposal},{id:'unclassified',section:pending},{id:'approved',section:approved('recurring',2)}];
    const before=JSON.stringify(input);const result=orderReviewedClauses(input);
    expect(result.ordered.map(c=>c.id)).toEqual(['approved']);expect(result.unreviewed.map(c=>c.id)).toEqual(['proposal','unclassified']);expect(JSON.stringify(input)).toBe(before);
  });
  it('ranks maintenance payment under finance, quotas under recurring — independent of source product order',()=>{
    const items=[{id:'quota',section:approved('recurring',0)},{id:'payment',section:approved('finance',2)},{id:'object',section:approved('object',0)}];
    expect(orderReviewedClauses(items).ordered.map(c=>c.id)).toEqual(['object','payment','quota']);
    expect(items.map(c=>c.id)).toEqual(['quota','payment','object']);
  });
  it('uses stable identifiers to resolve equal ranks without changing inputs',()=>{
    const items=[{id:'z',section:approved('finance',0)},{id:'a',section:approved('finance',0)}];
    expect(orderReviewedClauses(items).ordered.map(c=>c.id)).toEqual(['a','z']);
  });
  it('rejects malformed editorial approvals',()=>{
    expect(validateSectionReview({status:'approved',sectionKey:'finance',rankInSection:-1,reviewer:'A',reviewedAt:'2026-10-14'})).toBe(false);
    expect(validateSectionReview({status:'approved',sectionKey:'finance',rankInSection:0,reviewer:'',reviewedAt:'2026-10-14'})).toBe(false);
    expect(validateSectionReview({status:'proposed',sectionKey:'finance',rankInSection:0,reason:' '})).toBe(false);
  });
});

describe('05C — explicit commercial applicability',()=>{
  it('does not infer customer audience or service/option selection',()=>{
    expect(evaluateContractApplicability({audience:'consumer'},{})).toBe('unresolved');
    expect(evaluateContractApplicability({requiredOptionCodes:['MAINT']},{productCodes:['WEB']})).toBe('unresolved');
    expect(evaluateContractApplicability({requiredOptionCodes:['MAINT']},{optionCodes:[]})).toBe('ineligible');
  });
  it('resolves audience, plan, quantity and recurring requirements explicitly',()=>{
    const rule={audience:'professional' as const,requiredProductCodes:['WEB'],requiredOptionCodes:['SEO'],minQuantity:2,planCode:'PLUS',recurring:true};
    const context={audience:'professional' as const,productCodes:['WEB'],optionCodes:['SEO'],quantity:2,planCode:'PLUS',recurring:true};
    expect(evaluateContractApplicability(rule,context)).toBe('eligible');
    expect(evaluateContractApplicability(rule,{...context,quantity:1})).toBe('ineligible');
    expect(evaluateContractApplicability(rule,{...context,recurring:false})).toBe('ineligible');
    expect(evaluateContractApplicability(rule,{...context,planCode:undefined})).toBe('unresolved');
  });
  it('leaves source selections unmodified',()=>{
    const products=['WEB'],options=['SEO'];const rule={requiredProductCodes:['WEB'],requiredOptionCodes:['SEO']};
    expect(evaluateContractApplicability(rule,{productCodes:products,optionCodes:options})).toBe('eligible');
    expect(products).toEqual(['WEB']);expect(options).toEqual(['SEO']);
  });
});

describe('05C — explicitly reviewed conflicts',()=>{
  it('warns but does not block when human review is missing',()=>{
    const conflict={id:'c',clauseVersionIds:['v1','v2'],severity:'blocking' as const,reason:'Conditions contradictoires',reviewed:false};
    expect(evaluateContractConflicts([conflict],['v1','v2']).warnings).toHaveLength(1);
    expect(evaluateContractConflicts([conflict],['v1','v2']).blocking).toHaveLength(0);
  });
  it('blocks only an explicitly reviewed blocking rule whose versions are both included',()=>{
    const rule={id:'contradiction',clauseVersionIds:['v1','v2'],severity:'blocking' as const,reason:'Arbitrage humain requis',reviewed:true};
    expect(evaluateContractConflicts([rule],['v1','v2']).blocking).toHaveLength(1);
    expect(evaluateContractConflicts([rule],['v1']).warnings).toHaveLength(0);
    expect(evaluateContractConflicts([{...rule,severity:'warning'}],['v1','v2']).blocking).toHaveLength(0);
  });
});

import {describe,expect,it} from 'vitest';
import {CONTRACT_SECTION_ORDER,orderReviewedClauses,validateSectionReview,type ContractSectionReview} from './contractSectionPolicy';
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

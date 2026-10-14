import {describe,it,expect} from 'vitest';
import type {QuoteContractClause} from '../../shared/contractTerms';
import {compareDraftContractClauses} from './contractDraftImpact';

const clause=(id:string,overrides:Partial<QuoteContractClause>={}):QuoteContractClause=>({
  id,quoteId:'draft',sourceKey:id,sourceKind:'custom',sourceCatalogItemIds:[],
  title:id,body:'Un texte',sortOrder:0,enabled:true,isCustomized:false,isOrphaned:false,
  createdAt:'2026-10-14',updatedAt:'2026-10-14',...overrides,
});
describe('05D draft contract impact preview',()=>{
  it('reports added and removed clauses without editing inputs',()=>{
    const saved=[clause('a')],next=[clause('b')];
    const baseline=JSON.stringify([saved,next]);
    expect(compareDraftContractClauses(saved,next)).toEqual([
      {id:'b',title:'b',kinds:['added']},{id:'a',title:'a',kinds:['removed']},
    ]);
    expect(JSON.stringify([saved,next])).toBe(baseline);
  });
  it('detects exclusion, reorder and changes independently',()=>{
    const before=[clause('a')];
    const after=[clause('a',{enabled:false,sortOrder:2,body:'Texte ajusté'})];
    expect(compareDraftContractClauses(before,after)).toEqual([
      {id:'a',title:'a',kinds:['excluded','moved','edited']},
    ]);
  });
  it('rejects duplicate clause identities rather than hiding a change',()=>{
    expect(()=>compareDraftContractClauses([clause('a'),clause('a')],[clause('a')])).toThrow(/dupliqués/);
    expect(()=>compareDraftContractClauses([clause('a')],[clause('a'),clause('a')])).toThrow(/dupliqués/);
  });
  it('does not confuse unchanged snapshots with edits',()=>{
    expect(compareDraftContractClauses([clause('a')],[clause('a')])).toEqual([]);
    expect(compareDraftContractClauses([],[])).toEqual([]);
    expect(compareDraftContractClauses([clause('a',{enabled:false})],[clause('a',{enabled:true})])[0].kinds).toEqual(['enabled']);
  });
});

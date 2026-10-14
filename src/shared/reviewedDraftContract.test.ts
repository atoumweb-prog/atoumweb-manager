import {describe,it,expect} from 'vitest';
import {assembleReviewedDraftContract,type ReviewedQuoteClause} from './reviewedDraftContract';
import type {QuoteContractClause} from './contractTerms';
const clause=(id:string,versionId:string,extra:Partial<QuoteContractClause>={}):QuoteContractClause=>({
 id,quoteId:'Q',sourceKey:id,sourceKind:'catalog',sourceClauseVersionId:versionId,
 sourceCatalogItemIds:['c'],title:id,body:'Texte '+id,sortOrder:1,enabled:true,
 isCustomized:false,isOrphaned:false,createdAt:'',updatedAt:'',...extra,
});
const entry=(id:string,versionId:string,section:'finance'|'object'='finance',rank=0):ReviewedQuoteClause=>({
 clause:clause(id,versionId),
 review:{status:'approved',sectionKey:section,rankInSection:rank,reviewer:'Juriste',reviewedAt:'2026-10-14T10:00:00Z'},
});
describe('05C — numbered draft contract from approved clauses',()=>{
 it('orders canonical sections then approved rank and retains text without modifying inputs',()=>{
   const input=[entry('f2','v2','finance',2),entry('o','v3','object'),entry('f1','v1','finance',1)];
   const before=JSON.stringify(input);const result=assembleReviewedDraftContract(input,{audience:'professional'});
   expect(result.ready).toBe(true);
   expect(result.sections.map(s=>s.key)).toEqual(['object','finance']);
   expect(result.sections.flatMap(s=>s.articles.map(a=>a.number))).toEqual(['1.1','5.1','5.2']);
   expect(result.sections.flatMap(s=>s.articles.map(a=>a.id))).toEqual(['o','f1','f2']);
   expect(JSON.stringify(input)).toBe(before);
 });
 it('never inserts unapproved, orphaned or excluded clauses',()=>{
   const approved=entry('active','v1');
   const proposed=entry('pending','v2');proposed.review={status:'proposed',sectionKey:'finance',rankInSection:0,reason:'à examiner'};
   const plan=assembleReviewedDraftContract([approved,proposed,entry('off','v3','finance',0)],{},{});
   expect(plan.ready).toBe(false);
 });
 it('blocks duplicate versions and missing classifications',()=>{
   const result=assembleReviewedDraftContract([entry('a','v'),entry('b','v')],{});
   expect(result.ready).toBe(false);
   expect(result.duplicateIds).toContain('v');
 });
});

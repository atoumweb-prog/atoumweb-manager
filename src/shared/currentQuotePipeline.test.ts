import {describe,it,expect} from 'vitest';
import {withCurrentQuoteSignal,projectPipeline} from './prospectPipelineProjection';
describe('Home and CRM share the current quote signal',()=>{
 const prospects=[{id:'p',stage:'negotiation' as const},{id:'new',stage:'new' as const},{id:'c',stage:'won' as const,clientAccountId:'client'}];
 const q=(id:string,date:string,agreement:string|null)=>({id,prospectId:'p',createdAt:date,principleAgreementAt:agreement});
 it('projects the actual current agreement in Finalisation',()=>expect(projectPipeline(withCurrentQuoteSignal(prospects,[q('current','2026-10-13','confirmed')])).columns[5].prospects.map(p=>p.id)).toEqual(['p']));
 it('does not reuse an older agreement after a new revision',()=>expect(projectPipeline(withCurrentQuoteSignal(prospects,[q('old','2026-10-12','confirmed'),q('new','2026-10-13',null)])).columns[4].prospects.map(p=>p.id)).toEqual(['p']));
 it('uses the same deterministic ID tie-breaker as CRM',()=>expect(withCurrentQuoteSignal(prospects,[q('a','same','yes'),q('z','same',null)])[0].finalizationQuoteId).toBeNull());
 it('keeps new excluded and Conversion historical',()=>{const result=projectPipeline(withCurrentQuoteSignal(prospects,[]));expect(result.columns.flatMap(c=>c.prospects.map(p=>p.id))).toEqual(['p']);expect(result.conversions.map(p=>p.id)).toEqual(['c']);});
 it('never mutates the input history or records',()=>{const original=JSON.stringify(prospects),quotes=[q('current','2026-10-13','yes')];withCurrentQuoteSignal(prospects,quotes);expect(JSON.stringify(prospects)).toBe(original);expect(quotes).toEqual([q('current','2026-10-13','yes')]);});
});

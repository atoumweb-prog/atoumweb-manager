import {describe,it,expect} from 'vitest';
import {reviewContractTextImport} from './contractImportReview';
describe('05E imported contract review boundaries',()=>{
  it('rejects writing to frozen and missing historical snapshots',()=>{
    for(const quoteState of ['frozen','historical_missing'] as const){
      expect(reviewContractTextImport({originalText:'CGV',importedText:'CGV modifiées',quoteState}).mayProposeDraft).toBe(false);
    }
  });
  it('rejects oversized imported contracts without changing the source',()=>{
    const result=reviewContractTextImport({originalText:'A',importedText:'B'.repeat(1_000_001),quoteState:'draft'});
    expect(result.mayProposeDraft).toBe(false);
    expect(result.reason).toMatch(/volumineux/);
    expect(result.addedExcerpt.length).toBeLessThanOrEqual(120);
  });
  it('requires nonempty changes in a draft and never applies them',()=>{
    const original={originalText:'Paiement 30 jours',importedText:'Paiement 45 jours',quoteState:'draft' as const};
    const before=JSON.stringify(original);
    expect(reviewContractTextImport(original)).toMatchObject({mayProposeDraft:true,changed:true,removedExcerpt:'30',addedExcerpt:'45'});
    expect(JSON.stringify(original)).toBe(before);
    expect(reviewContractTextImport({...original,importedText:'  '}).mayProposeDraft).toBe(false);
    expect(reviewContractTextImport({...original,importedText:original.originalText}).mayProposeDraft).toBe(false);
  });
});

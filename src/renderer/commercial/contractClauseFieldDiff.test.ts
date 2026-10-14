import {describe,it,expect} from 'vitest';
import {compareClauseField} from './contractClauseFieldDiff';
describe('05D — non-destructive local clause comparison',()=>{
  it('returns no change for identical legal text',()=>{
    expect(compareClauseField('Clause commune','Clause commune')).toMatchObject({changed:false,removedExcerpt:'',addedExcerpt:''});
  });
  it('reports bounded replacement excluding shared prefix and suffix',()=>{
    expect(compareClauseField('Article 1 : 30 jours.', 'Article 1 : 45 jours.')).toMatchObject({
      changed:true,removedExcerpt:'30',addedExcerpt:'45',truncated:false,
    });
  });
  it('handles insertions, deletions and empty text',()=>{
    expect(compareClauseField('abc','abXYZc').addedExcerpt).toBe('XYZ');
    expect(compareClauseField('abc','ac').removedExcerpt).toBe('b');
    expect(compareClauseField('','Texte').addedExcerpt).toBe('Texte');
  });
  it('bounds potentially long legal passages without mutating input',()=>{
    const before='a'.repeat(1000),after='b'.repeat(1000);
    const diff=compareClauseField(before,after,20);
    expect(diff.removedExcerpt).toHaveLength(20);
    expect(diff.addedExcerpt).toHaveLength(20);
    expect(diff.truncated).toBe(true);
    expect(before).toHaveLength(1000);
  });
});

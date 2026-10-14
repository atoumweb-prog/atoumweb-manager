import { describe, expect, it } from 'vitest';
import { prepareCatalogSalesGuidance } from './catalogSalesGuidance';

describe('04E — commercial guidance belongs to a version, not a contract', () => {
  it('labels absent guidance as not configured and invents no advice', () => {
    expect(prepareCatalogSalesGuidance({versionId:'v1'})).toEqual({
      versionId:'v1',clientNeed:null,benefits:null,objections:null,salesAdvice:null,configured:false,
    });
  });
  it('keeps authored advice scoped to the requested version', () => {
    const result=prepareCatalogSalesGuidance({versionId:'v2',clientNeed:' SEO local ',salesAdvice:' Argument humain '});
    expect(result).toMatchObject({versionId:'v2',clientNeed:'SEO local',salesAdvice:'Argument humain',configured:true});
    expect('contractTerms' in result).toBe(false);
  });
  it('rejects an unbound version', () => {
    expect(()=>prepareCatalogSalesGuidance({versionId:' '})).toThrow(/version requ is|version requis/i);
  });
});

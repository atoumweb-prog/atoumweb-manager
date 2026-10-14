import { describe, expect, it } from 'vitest';
import { prepareCatalogSalesGuidance, salesGuidanceFromCatalogVersion } from './catalogSalesGuidance';

describe('04E — commercial guidance belongs to a version, not a contract', () => {
  it('labels absent guidance as not configured and invents no advice', () => {
    expect(prepareCatalogSalesGuidance({versionId:'v1'})).toEqual({
      versionId:'v1',clientNeed:null,benefits:null,objections:null,relevantSituations:null,commercialCautions:null,salesPitch:null,qualificationQuestions:null,salesAdvice:null,configured:false,
    });
  });
  it('keeps authored advice scoped to the requested version', () => {
    const result=prepareCatalogSalesGuidance({versionId:'v2',clientNeed:' SEO local ',salesAdvice:' Argument humain '});
    expect(result).toMatchObject({versionId:'v2',clientNeed:'SEO local',salesAdvice:'Argument humain',configured:true});
    expect('contractTerms' in result).toBe(false);
  });
  it('reads actual persisted commercial fields without fabricating objections', () => {
    expect(salesGuidanceFromCatalogVersion({
      id:'v3',commercialParameters:{clientNeed:'Site vitrine',benefits:'Présence locale',objections:'Délai trop long : présenter le planning',relevantSituations:'Activité locale',commercialCautions:'Ne pas garantir des ventes',salesPitch:'Site clair, prêt à présenter votre activité',qualificationQuestions:'Quels sont vos objectifs ?',relevantSituations:'Activité locale',commercialCautions:'Ne pas garantir des ventes'},
      internalAdvice:'Proposer un audit',
    })).toEqual({
      versionId:'v3',clientNeed:'Site vitrine',benefits:'Présence locale',
      objections:'Délai trop long : présenter le planning',salesPitch:'Site clair, prêt à présenter votre activité',qualificationQuestions:'Quels sont vos objectifs ?',salesAdvice:'Proposer un audit',configured:true,
    });
  });
  it('rejects an unbound version', () => {
    expect(()=>prepareCatalogSalesGuidance({versionId:' '})).toThrow(/version requ is|version requis/i);
  });
});

/**
 * 04E — Version-scoped and human-authored sales guidance.
 * Commercial advice is never automatically added to CGV or quote terms.
 */
import type { CatalogVersion } from './commercial';

export interface CatalogSalesGuidance {
  versionId: string;
  clientNeed?: string | null;
  benefits?: string | null;
  objections?: string | null;
  relevantSituations?: string | null;
  commercialCautions?: string | null;
  salesPitch?: string | null;
  qualificationQuestions?: string | null;
  salesAdvice?: string | null;
}
export interface CatalogSalesGuidanceView {
  versionId: string;
  clientNeed: string | null;
  benefits: string | null;
  objections: string | null;
  relevantSituations: string | null;
  commercialCautions: string | null;
  salesPitch: string | null;
  qualificationQuestions: string | null;
  salesAdvice: string | null;
  configured: boolean;
}
export function prepareCatalogSalesGuidance(input: CatalogSalesGuidance): CatalogSalesGuidanceView {
  if (!input.versionId.trim()) throw new Error('Identifiant de version requis');
  const trim = (value?: string | null): string | null => value?.trim() || null;
  const clientNeed = trim(input.clientNeed);
  const benefits = trim(input.benefits);
  const objections = trim(input.objections);
  const relevantSituations = trim(input.relevantSituations);
  const commercialCautions = trim(input.commercialCautions);
  const salesPitch = trim(input.salesPitch);
  const qualificationQuestions = trim(input.qualificationQuestions);
  const salesAdvice = trim(input.salesAdvice);
  return {
    versionId: input.versionId,
    clientNeed, benefits, objections, relevantSituations, commercialCautions, salesPitch, qualificationQuestions, salesAdvice,
    configured: [clientNeed, benefits, objections, relevantSituations, commercialCautions, salesPitch, qualificationQuestions, salesAdvice].some(Boolean),
  };
}

/** Project persisted version fields into a read-only sales view. */
export function salesGuidanceFromCatalogVersion(
  version: Pick<CatalogVersion, 'id' | 'commercialParameters' | 'internalAdvice'>,
): CatalogSalesGuidanceView {
  return prepareCatalogSalesGuidance({
    versionId: version.id,
    clientNeed: version.commercialParameters?.clientNeed,
    benefits: version.commercialParameters?.benefits,
    objections: version.commercialParameters?.objections,
    relevantSituations: version.commercialParameters?.relevantSituations,
    commercialCautions: version.commercialParameters?.commercialCautions,
    salesPitch: version.commercialParameters?.salesPitch,
    qualificationQuestions: version.commercialParameters?.qualificationQuestions,
    salesAdvice: version.internalAdvice,
  });
}

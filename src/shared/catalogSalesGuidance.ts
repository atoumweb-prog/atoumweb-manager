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
  salesAdvice?: string | null;
}
export interface CatalogSalesGuidanceView {
  versionId: string;
  clientNeed: string | null;
  benefits: string | null;
  objections: string | null;
  salesAdvice: string | null;
  configured: boolean;
}
export function prepareCatalogSalesGuidance(input: CatalogSalesGuidance): CatalogSalesGuidanceView {
  if (!input.versionId.trim()) throw new Error('Identifiant de version requis');
  const trim = (value?: string | null): string | null => value?.trim() || null;
  const clientNeed = trim(input.clientNeed);
  const benefits = trim(input.benefits);
  const objections = trim(input.objections);
  const salesAdvice = trim(input.salesAdvice);
  return {
    versionId: input.versionId,
    clientNeed, benefits, objections, salesAdvice,
    configured: [clientNeed, benefits, objections, salesAdvice].some(Boolean),
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
    salesAdvice: version.internalAdvice,
  });
}

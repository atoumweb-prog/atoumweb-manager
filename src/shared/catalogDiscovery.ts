import type { CatalogItemSummary } from './commercial';

/**
 * Lot 04B / E96. Strictly text search over actual versioned data, not an
 * AI/semantic ranking engine. Only administration can inspect draft/internal data.
 */
export type CatalogDiscoveryContext = 'admin' | 'selection';

export function normalizeCatalogueQuery(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR').replace(/\s+/gu, ' ').trim();
}

export function catalogIsSelectable(item: CatalogItemSummary): boolean {
  return item.status === 'active' && item.currentVersion?.status === 'published';
}

export function catalogMatchesQuery(
  item: CatalogItemSummary,
  query: string,
  context: CatalogDiscoveryContext = 'selection',
): boolean {
  if (context === 'selection' && !catalogIsSelectable(item)) return false;
  const needle = normalizeCatalogueQuery(query);
  if (!needle) return true;
  const version = item.currentVersion;
  const params = version?.commercialParameters;
  const publicFields = [
    item.name, item.canonicalCode, item.category, version?.familyCode,
    version?.abbyLabel, version?.nature, version?.description,
    ...(version?.inclusions ?? []), ...(version?.exclusions ?? []),
    ...(version?.prerequisites ?? []),
    params?.clientNeed, params?.benefits, params?.keywords,
    params?.work, params?.deliverables,
  ];
  const adminFields = [
    version?.unit, version?.periodicity, version?.contractType,
    version?.specialTerms, version?.internalAdvice, params?.options,
    params?.quoteRequiredWhen, params?.deliveryTerms, params?.reviewTerms,
    params?.correctiveWarranty, params?.thirdPartyCosts, params?.sourcePriceLabel,
  ];
  const fields = context === 'admin' ? [...publicFields, ...adminFields] : publicFields;
  return fields.some(value => typeof value === 'string' &&
    normalizeCatalogueQuery(value).includes(needle));
}

export function filterCatalogDiscovery(
  items: readonly CatalogItemSummary[], query: string,
  context: CatalogDiscoveryContext = 'selection',
): CatalogItemSummary[] {
  return items.filter(item => catalogMatchesQuery(item, query, context));
}

import type {
  CatalogItemStatus,
  CatalogItemSummary,
  CatalogItemType,
} from '../../shared/commercial';
import { cataloguePrimaryCategoryLabel } from './catalogDisplay';

export interface CatalogAdminFilters {
  query: string;
  type: CatalogItemType | 'all';
  status: CatalogItemStatus | 'all';
  category: string | 'all';
}

/** Accent-insensitive string comparison only; not a semantic or keyword-index search. */
export function normalizeCatalogSearch(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').trim().replace(/\s+/g, ' ');
}

/** Existing persisted data only; version statuses and the public visibility flag are never changed. */
export function catalogAdminMatches(item: CatalogItemSummary, filters: CatalogAdminFilters): boolean {
  if (filters.type !== 'all' && item.type !== filters.type) return false;
  if (filters.status !== 'all' && item.status !== filters.status) return false;
  if (filters.category !== 'all' && (item.category?.trim() || '') !== filters.category) return false;
  const needle = normalizeCatalogSearch(filters.query);
  if (!needle) return true;
  const version = item.currentVersion;
  const parameters = version?.commercialParameters;
  const fields = [
    item.name, item.canonicalCode, item.category, cataloguePrimaryCategoryLabel(item),
    version?.familyCode, version?.abbyLabel, version?.nature, version?.description,
    version?.unit, version?.periodicity, version?.contractType, version?.specialTerms,
    version?.internalAdvice,
    ...(version?.inclusions ?? []), ...(version?.exclusions ?? []),
    ...(version?.prerequisites ?? []),
    parameters?.clientNeed, parameters?.work, parameters?.deliverables,
    parameters?.options, parameters?.quoteRequiredWhen,
  ];
  return fields.some((field) => typeof field === 'string' && normalizeCatalogSearch(field).includes(needle));
}

export function catalogAdminFiltered(items: readonly CatalogItemSummary[], filters: CatalogAdminFilters): CatalogItemSummary[] {
  return items.filter((item) => catalogAdminMatches(item, filters))
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '', 'fr-FR', { sensitivity: 'base' }) ||
      a.name.localeCompare(b.name, 'fr-FR', { sensitivity: 'base' }) ||
      a.id.localeCompare(b.id));
}

export function catalogAdminCategories(items: readonly CatalogItemSummary[]): string[] {
  return [...new Set(items.map((item) => item.category?.trim() || '').filter(Boolean))]
    .sort((a, b) => cataloguePrimaryCategoryLabel({ category: a } as CatalogItemSummary)
      .localeCompare(cataloguePrimaryCategoryLabel({ category: b } as CatalogItemSummary), 'fr-FR', { sensitivity: 'base' }) ||
      a.localeCompare(b, 'fr-FR', { sensitivity: 'base' }));
}

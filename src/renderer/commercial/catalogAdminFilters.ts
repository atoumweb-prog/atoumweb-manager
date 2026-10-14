import type {
  CatalogItemStatus,
  CatalogItemSummary,
  CatalogItemType,
} from '../../shared/commercial';
import { catalogueCategoryName, cataloguePrimaryCategoryLabel } from './catalogDisplay';
import { catalogMatchesQuery, normalizeCatalogueQuery } from '../../shared/catalogDiscovery';

export interface CatalogAdminFilters {
  query: string;
  type: CatalogItemType | 'all';
  status: CatalogItemStatus | 'all';
  category: string | 'all';
}

/** Backwards-compatible normalization helper, shared with Prospect and Devis. */
export const normalizeCatalogSearch = normalizeCatalogueQuery;

/** Administrative scope may inspect drafts, archives and internal description. */
export function catalogAdminMatches(item: CatalogItemSummary, filters: CatalogAdminFilters): boolean {
  if (filters.type !== 'all' && item.type !== filters.type) return false;
  if (filters.status !== 'all' && item.status !== filters.status) return false;
  if (filters.category !== 'all' && (item.category ?? '') !== filters.category) return false;
  return catalogMatchesQuery(item, filters.query, 'admin') ||
    Boolean(filters.query.trim()) &&
    normalizeCatalogueQuery(cataloguePrimaryCategoryLabel(item)).includes(normalizeCatalogueQuery(filters.query));
}

export function catalogAdminFiltered(items: readonly CatalogItemSummary[], filters: CatalogAdminFilters): CatalogItemSummary[] {
  return items.filter((item) => catalogAdminMatches(item, filters))
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '', 'fr-FR', { sensitivity: 'base' }) ||
      a.name.localeCompare(b.name, 'fr-FR', { sensitivity: 'base' }) ||
      a.id.localeCompare(b.id));
}

export function catalogAdminCategories(items: readonly CatalogItemSummary[]): string[] {
  return [...new Set(items.map((item) => item.category ?? '').filter((value) => Boolean(value.trim())))]
    .sort((a, b) => catalogueCategoryName(a)
      .localeCompare(catalogueCategoryName(b), 'fr-FR', { sensitivity: 'base' }) ||
      a.localeCompare(b, 'fr-FR', { sensitivity: 'base' }));
}

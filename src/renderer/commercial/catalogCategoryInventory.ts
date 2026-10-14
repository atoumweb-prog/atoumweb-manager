import type { CatalogItemSummary } from '../../shared/commercial';
import { catalogCategoryCollisions } from '../../shared/catalogCategoryRules';
import { catalogueCategoryName } from './catalogDisplay';

/** Read-only inventory of the REAL categories currently present in an admin workspace. */
export interface CatalogCategoryInventoryRow {
  rawValue: string;
  label: string;
  count: number;
  activeCount: number;
  archivedCount: number;
  normalizedCollision: boolean;
  displayAliasCollision: boolean;
}
export interface CatalogCategoryInventory {
  rows: CatalogCategoryInventoryRow[];
  unassignedCount: number;
  normalizedConflictGroups: string[][];
  displayAliasConflictGroups: string[][];
}

export function buildCatalogCategoryInventory(items: readonly CatalogItemSummary[]): CatalogCategoryInventory {
  const counts = new Map<string, { count: number; active: number; archived: number }>();
  let unassignedCount = 0;
  for (const item of items) {
    const rawValue = item.category ?? '';
    if (!rawValue.trim()) {
      unassignedCount++;
      continue;
    }
    const current = counts.get(rawValue) ?? { count: 0, active: 0, archived: 0 };
    current.count++;
    if (item.status === 'active') current.active++;
    if (item.status === 'archived') current.archived++;
    counts.set(rawValue, current);
  }
  // Historical values are intentionally never rewritten or combined automatically.
  // Unsafe legacy strings remain visible in the inventory for explicit human review.
  const rawNames = [...counts.keys()];
  const wellFormed = rawNames.filter(value => {
    try {
      const key = value.normalize('NFKC').replace(/[\s\u00a0\u202f]+/gu, ' ').trim();
      return Boolean(key) && key.length <= 80 && !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
    } catch { return false; }
  });
  const normalizedConflictGroups = catalogCategoryCollisions(wellFormed).map(g => g.legacyValues);
  const aliasGroups = new Map<string, string[]>();
  for (const rawValue of rawNames) {
    const label = catalogueCategoryName(rawValue);
    const group = aliasGroups.get(label) ?? [];
    group.push(rawValue);
    aliasGroups.set(label, group);
  }
  const displayAliasConflictGroups = [...aliasGroups.values()].filter(g => g.length > 1)
    .map(g => g.sort((a, b) => a.localeCompare(b, 'fr-FR', { sensitivity: 'variant' })));
  const collisionNames = new Set(normalizedConflictGroups.flat());
  const aliasNames = new Set(displayAliasConflictGroups.flat());
  const rows = rawNames.map(rawValue => {
    const count = counts.get(rawValue)!;
    return {
      rawValue,
      label: catalogueCategoryName(rawValue),
      count: count.count,
      activeCount: count.active,
      archivedCount: count.archived,
      normalizedCollision: collisionNames.has(rawValue),
      displayAliasCollision: aliasNames.has(rawValue),
    };
  }).sort((a, b) => a.label.localeCompare(b.label, 'fr-FR', { sensitivity: 'base' }) ||
    a.rawValue.localeCompare(b.rawValue, 'fr-FR', { sensitivity: 'variant' }));

  return { rows, unassignedCount, normalizedConflictGroups, displayAliasConflictGroups };
}

/**
 * Lot 04B / E95 — category input rules only.
 *
 * No database, IPC, catalogue item, quote, canonical identity or contract is modified here.
 * Display aliases (catalogDisplay) are deliberately NOT applied to stable category keys:
 * historical values that happen to display alike must be reconciled explicitly.
 */
export type CatalogCategoryCandidate = { label: string; normalizedKey: string };

const COLLAPSIBLE_SPACES = /[\s\u00a0\u202f]+/gu;
const UNSAFE_CONTROLS = /[\u0000-\u001f\u007f-\u009f]/u;

export function normalizeCatalogCategory(value: string): CatalogCategoryCandidate {
  if (UNSAFE_CONTROLS.test(value)) {
    throw new Error('Le libellé de catégorie contient des caractères de contrôle.');
  }
  const label = value.normalize('NFKC').replace(COLLAPSIBLE_SPACES, ' ').trim();
  if (!label || label.length > 80) throw new Error('Le nom de catégorie doit contenir entre 1 et 80 caractères.');
  const normalizedKey = label.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR');
  return { label, normalizedKey };
}

export interface CatalogCategoryCollision {
  normalizedKey: string;
  legacyValues: string[];
}

/**
 * Inventory only — never merges persisted names or rewrites catalogue links.
 * Unknown/null values remain unassigned until an explicit human classification.
 */
export function catalogCategoryCollisions(values: readonly (string | null | undefined)[]): CatalogCategoryCollision[] {
  const group = new Map<string, Set<string>>();
  for (const value of values) {
    if (value == null || !value.trim()) continue;
    const { normalizedKey } = normalizeCatalogCategory(value);
    const members = group.get(normalizedKey) ?? new Set<string>();
    members.add(value);
    group.set(normalizedKey, members);
  }
  return [...group.entries()]
    .filter(([, raw]) => raw.size > 1)
    .map(([normalizedKey, raw]) => ({
      normalizedKey,
      legacyValues: [...raw].sort((a, b) => a.localeCompare(b, 'fr-FR', { sensitivity: 'variant' })),
    }))
    .sort((a, b) => a.normalizedKey.localeCompare(b.normalizedKey, 'fr-FR'));
}

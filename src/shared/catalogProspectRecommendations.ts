import type { CatalogItemSummary } from './commercial';

/** Pure read-only choice model; only existing published/active catalogue items can be suggested. */
export function resolveProspectCatalogRecommendations(
  catalog: readonly CatalogItemSummary[],
  selectedItemIds: readonly string[],
  managedVersionIds: readonly string[],
  legacyItemIds: readonly string[],
  hasManagedLinks = managedVersionIds.length > 0,
): CatalogItemSummary[] {
  const alreadySelected=new Set(selectedItemIds);
  const allowed=(item:CatalogItemSummary)=>item.type==='service'&&item.status==='active'&&item.currentVersion?.status==='published'
    &&!alreadySelected.has(item.id);
  const managed=[...new Set(managedVersionIds)].map(id=>catalog.find(item=>item.currentVersion?.id===id))
    .filter((item):item is CatalogItemSummary=>Boolean(item&&allowed(item)));
  const legacy=[...new Set(legacyItemIds)].map(id=>catalog.find(item=>item.id===id))
    .filter((item):item is CatalogItemSummary=>Boolean(item&&allowed(item)));
  // Backwards compatibility while old seeded catalogues lack managed relations.
  // A configured relation that became inadmissible must not resurrect unrelated
  // historical hard-coded suggestions. The fallback applies only to no managed links.
  return hasManagedLinks ? managed : legacy;
}

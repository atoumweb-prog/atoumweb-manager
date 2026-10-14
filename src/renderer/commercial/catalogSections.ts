import type { CatalogItemSummary } from '../../shared/commercial';
import { cataloguePrimaryCategoryLabel } from './catalogDisplay';

/**
 * UX-only catalogue grouping. This never edits catalogue identities, versions, categories,
 * Abby codes or quote eligibility. All inputs, including drafts/archived items, stay visible
 * when supplied by the administration filters.
 */
export interface CatalogueSection {
  id: string;
  title: string;
  items: CatalogItemSummary[];
}

export interface CataloguePresentation {
  featured: CatalogueSection[];
  otherOffers: CatalogItemSummary[];
  serviceCategories: CatalogueSection[];
}

const FEATURED_TITLES = [
  { id: 'vitrine', title: 'Site vitrine' },
  { id: 'ecommerce', title: 'Site e-commerce' },
  { id: 'mariage', title: 'Site mariage' },
  { id: 'maintenance', title: 'Maintenance WordPress' },
] as const;

type FeaturedId = (typeof FEATURED_TITLES)[number]['id'];

const sortFrench = (a: CatalogItemSummary, b: CatalogItemSummary): number =>
  a.name.localeCompare(b.name, 'fr-FR', { sensitivity: 'base' }) || a.id.localeCompare(b.id);

const normalize = (value: string | null | undefined): string =>
  (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').trim();

/**
 * Known V1 references are used only to recognize the four priority presentations.
 * Fallback names cover historical/manual items without claiming new canonical identities.
 */
function featuredId(item: CatalogItemSummary): FeaturedId | null {
  const name = normalize(item.name);
  const code = (item.canonicalCode ?? '').toUpperCase();
  const kind = item.currentVersion?.commercialKind;

  if (item.type === 'offer') {
    if (code === 'AW-WEB-VITRINE' || /\bsite vitrine\b/.test(name)) return 'vitrine';
    if (code === 'AW-ECOM-BASE' || /\b(e-commerce|woocommerce|boutique en ligne)\b/.test(name)) return 'ecommerce';
    if (code.startsWith('AW-MARIAGE-') || /\bmariage\b/.test(name)) return 'mariage';
    if (/\bmaintenance wordpress\b/.test(name)) return 'maintenance';
  }

  if (item.type === 'service' &&
      (/^AW-MAINT-WP-(M|A)$/.test(code) ||
        (kind === 'subscription' && /\bmaintenance wordpress\b/.test(name)))) {
    return 'maintenance';
  }

  return null;
}

export function buildCataloguePresentation(items: readonly CatalogItemSummary[]): CataloguePresentation {
  const featured = FEATURED_TITLES.map(({ id, title }) => ({ id, title, items: [] as CatalogItemSummary[] }));
  const otherOffers: CatalogItemSummary[] = [];
  const serviceGroups = new Map<string, CatalogItemSummary[]>();

  for (const item of items) {
    const mainId = featuredId(item);
    if (mainId) {
      featured.find((section) => section.id === mainId)!.items.push(item);
    } else if (item.type === 'offer') {
      otherOffers.push(item);
    } else {
      const category = cataloguePrimaryCategoryLabel(item);
      const group = serviceGroups.get(category) ?? [];
      group.push(item);
      serviceGroups.set(category, group);
    }
  }

  const serviceCategories = [...serviceGroups.entries()]
    .sort(([left], [right]) => {
      if (left === 'Sans catégorie') return right === left ? 0 : 1;
      if (right === 'Sans catégorie') return -1;
      return left.localeCompare(right, 'fr-FR', { sensitivity: 'base' });
    })
    .map(([title, entries]) => ({ id: title, title, items: entries.sort(sortFrench) }));

  return {
    featured: featured.filter((section) => section.items.length > 0).map((section) => ({
      ...section,
      items: section.items.sort(sortFrench),
    })),
    otherOffers: otherOffers.sort(sortFrench),
    serviceCategories,
  };
}

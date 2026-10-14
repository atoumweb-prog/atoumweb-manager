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
    if (code === 'AW-ECOM-BASE' || /\b(site e-commerce|boutique woocommerce|boutique en ligne)\b/.test(name)) return 'ecommerce';
    if (code.startsWith('AW-MARIAGE-') || /\bsite (de )?mariage\b/.test(name) || /^mariage (essentiel|grand jour|histoire)\b/.test(name)) return 'mariage';
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
      // Do not merge two distinct persisted categories just because their aliases
      // happen to have the same display label (E94/E95: requires explicit reconciliation).
      const categoryKey = item.category?.trim() ? item.category : '';
      const group = serviceGroups.get(categoryKey) ?? [];
      group.push(item);
      serviceGroups.set(categoryKey, group);
    }
  }

  const serviceLabels = [...serviceGroups.keys()].map((key) => ({
    key,
    label: key ? cataloguePrimaryCategoryLabel(serviceGroups.get(key)![0]) : 'Sans catégorie',
  }));
  const labelCounts = new Map<string, number>();
  for (const { label } of serviceLabels) labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);

  const serviceCategories = serviceLabels
    .sort((left, right) => {
      if (!left.key) return right.key ? 1 : 0;
      if (!right.key) return -1;
      return left.label.localeCompare(right.label, 'fr-FR', { sensitivity: 'base' }) ||
        left.key.localeCompare(right.key, 'fr-FR', { sensitivity: 'base' });
    })
    .map(({ key, label }) => ({
      id: key || '__without_category__',
      title: key && (labelCounts.get(label) ?? 0) > 1 ? `${label} · ${key}` : label,
      items: serviceGroups.get(key)!.sort(sortFrench),
    }));

  return {
    featured: featured.filter((section) => section.items.length > 0).map((section) => ({
      ...section,
      items: section.items.sort(sortFrench),
    })),
    otherOffers: otherOffers.sort(sortFrench),
    serviceCategories,
  };
}
